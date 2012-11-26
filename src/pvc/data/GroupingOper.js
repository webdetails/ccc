
/**
 * Initializes a grouping operation.
 * 
 * @name pvc.data.GroupingOper
 * 
 * @class Performs one grouping operation according to a grouping specification.
 * @extends pvc.data.DataOper
 * 
 * @constructor
 *
 * @param {pvc.data.Data} linkParent The link parent data.
 * 
 * @param {string|string[]|pvc.data.GroupingSpec|pvc.data.GroupingSpec[]} groupingSpecs A grouping specification as a string, an object or array of either.
 * 
 * @param {object} [keyArgs] Keyword arguments.
 * See {@link pvc.data.DataOper} for any additional arguments.
 * 
 * @param {boolean} [keyArgs.isNull=null]
 *      Only considers datums with the specified isNull attribute.
 * @param {boolean} [keyArgs.visible=null]
 *      Only considers datums that have the specified visible state.
 * @param {boolean} [keyArgs.selected=null]
 *      Only considers datums that have the specified selected state.
 * @param {function} [keyArgs.where] A datum predicate.
 * @param {string} [keyArgs.whereKey] A key for the specified datum predicate,
 * previously returned by this function.
 * <p>
 * If this argument is specified, and it is not the value <c>null</c>,
 * it can be used to cache results.
 * If this argument is specified, and it is the value <c>null</c>,
 * the results are not cached.
 * If it is not specified, and <tt>keyArgs</tt> is specified,
 * one is returned.
 * If it is not specified and <tt>keyArgs</tt> is not specified,
 * then the instance will have a null {@link #key} property value.
 * </p>
 * <p>
 * If a key not previously returned by this operation is specified,
 * then it should be prefixed with a "_" character,
 * in order to not collide with keys generated internally.
 * </p>
 */
def.type('pvc.data.GroupingOper', pvc.data.DataOper)
.init(function(linkParent, groupingSpecs, keyArgs){
    /* Grouping spec may be specified as text or object */
    /*jshint expr:true */
    groupingSpecs || def.fail.argumentRequired('groupingSpecs');

    this.base(linkParent, keyArgs);

    this._where      = def.get(keyArgs, 'where');
    this._visible    = def.get(keyArgs, 'visible',  null);
    this._selected   = def.get(keyArgs, 'selected', null);
    this._isNull     = def.get(keyArgs, 'isNull',   null);
    
    /* 'Where' predicate and its key */
    var hasKey = this._selected == null, // TODO: Selected state changes do not yet invalidate cache...
        whereKey = '';
    if(this._where){
        whereKey = def.get(keyArgs, 'whereKey');
        if(!whereKey){
            if(!keyArgs || whereKey === null){
                // Force no key
                hasKey = false;
            } else {
                whereKey = '' + def.nextId('dataOperWhereKey');
                keyArgs.whereKey = whereKey;
            }
        }
    }

    // grouping spec ids is semantic keys, although the name is not 'key'
    var ids = [];
    this._groupSpecs = def.array.as(groupingSpecs).map(function(groupSpec){
        if(groupSpec instanceof pvc.data.GroupingSpec) {
            if(groupSpec.type !== linkParent.type) {
                throw def.error.argumentInvalid('groupingSpecText', "Invalid associated complex type.");
            }
        } else {
            // Must be a non-empty string, or throws
            groupSpec = pvc.data.GroupingSpec.parse(groupSpec, linkParent.type);
        }
        
        ids.push(groupSpec.id);

        return groupSpec;
    });
    
    /* Operation key */
    if(hasKey){
        this.key = ids.join('!!') +
                   "||visible:"  + this._visible +
                   "||isNull:"   + this._isNull  +
                   //"||selected:" + this._selected +
                   "||where:"    + whereKey;
    }
}).
add(/** @lends pvc.data.GroupingOper */{

    /**
     * Performs the grouping operation.
     *
     * @returns {pvc.data.Data} The resulting root data.
     */
    execute: function(){
        /* Setup a priori datum filters */
        
        /*global data_whereState: true */
        var datumsQuery = data_whereState(def.query(this._linkParent._datums), {
            visible:  this._visible,
            selected: this._selected,
            isNull:   this._isNull,
            where:    this._where
        });
        
        /* Group datums */
        var rootNode = this._group(datumsQuery);

        /* Render node into a data */
        return this._generateData(rootNode, null, this._linkParent);
    },
    
    executeAdd: function(rootData, datums){
        
        /*global data_whereState: true */
        var datumsQuery = data_whereState(def.query(datums), {
            visible:  this._visible,
            selected: this._selected,
            isNull:   this._isNull,
            where:    this._where
        });
        
        /* Group new datums */
        var rootNode = this._group(datumsQuery);

        /* Render node into specified root data */
        this._generateData(rootNode, null, this._linkParent, rootData);
        
        return rootNode.datums;
    },

    _group: function(datumsQuery){

        // Create the root node
        var rootNode = {
            isRoot: true,
            treeHeight: def
                .query(this._groupSpecs)
                .select(function(spec){
                    var levelCount = spec.levels.length;
                    if(!levelCount) { 
                        return 0; 
                    }
                    return !!spec.flatteningMode ? 1 : levelCount;
                })
                .reduce(def.add, 0),
                
            datums: []
            // children
            // atoms       // not on rootNode
            // isFlattenGroup // on parents of a flattened group spec
        };

        if(rootNode.treeHeight > 0){
            this._groupSpecRecursive(rootNode, datumsQuery, 0);
        }
        
        return rootNode;
    },
    
    _groupSpecRecursive: function(specParentNode, specDatumsQuery, specIndex){
        var groupSpec     = this._groupSpecs[specIndex];
        var levelSpecs    = groupSpec.levels;
        var L             = levelSpecs.length;
        var doFlatten     = !!groupSpec.flatteningMode;
        var nextSpecIndex = specIndex + 1;
        var isLastSpec    = (nextSpecIndex >= this._groupSpecs.length);
        var isPostOrder   = doFlatten && (groupSpec.flatteningMode === 'tree-post');
        var specGroupParent;
        
        if(doFlatten){
            specParentNode.children = [];
            specParentNode.childrenByKey = {}; // Don't create children with equal keys
            
            // Must create a rootNode for the grouping operation
            // Cannot be specParentNode (TODO: Why?)
            specGroupParent = {
                key:      '', // Key is local to groupSpec (when not flattened, it is local to level)
                absKey:   '', 
                atoms:    {},
                datums:   [],
                label:    groupSpec.flattenRootLabel,
                dimNames: []
            };

            if(!isPostOrder){
                specParentNode.children.push(specGroupParent);
                specParentNode.childrenByKey[''] = specGroupParent;
            }
        } else {
            specGroupParent = specParentNode;
        }

        /* Group datums */
        groupLevelRecursive.call(this, specGroupParent, specDatumsQuery, 0);

        if(doFlatten){

            if(isPostOrder){
                specParentNode.children.push(specGroupParent);
            }

            // Add datums of specGroupParent to specParentNode.
            specParentNode.datums = specGroupParent.datums;
        }
        
        function groupLevelRecursive(levelParentNode, levelDatums, levelIndex){
            
            var levelSpec = levelSpecs[levelIndex];
            
            if(!doFlatten){
                levelParentNode.children = [];
                levelParentNode.groupSpec = groupSpec;
                levelParentNode.groupLevelSpec = levelSpec;
            }
            
            var childNodes = this._groupDatums(levelSpec, levelParentNode, levelDatums, doFlatten);
            var isLastSpecLevel = levelIndex === L - 1;
            var willRecurseParent = doFlatten && !isLastSpec;
            
            // Add children's datums to levelParentNode, in post order.
            // This way, datums are reordered to follow the grouping "pattern". 
            // 
            // NOTE: levelParentNode.datums is initially empty
            var levelParentDatums = willRecurseParent ? 
                    [] : 
                    levelParentNode.datums;
            
            childNodes
            .forEach(function(child){
                /* On all but the last level,
                 * the datums of *child* are set to the 
                 * union of datums of its own children.
                 * The datums will have been added, 
                 * by the end of the following recursive call.
                 */
                var childDatums = child.datums; // backup original datums
                if(!(isLastSpec && isLastSpecLevel)){
                    child.datums = [];
                }
                
                var specParentChildIndex;
                if(!doFlatten){
                    levelParentNode.children.push(child);
                } else {
                    // Add children at a "hidden" property
                    // so that the test "if(!child._children.length)"
                    // below, can be done.
                    def.array.lazy(levelParentNode, '_children').push(child);
                    
                    if(def.hasOwn(specParentNode.childrenByKey, child.key)){
                        // Duplicate key.
                        // Don't add as child of specParentNode.
                        // 
                        // We need to add its datums to group parent, anyway.
                        def.array.append(levelParentDatums, childDatums);
                        return;
                    }
                    
                    specParentChildIndex = specParentNode.children.length;
                    if(!isPostOrder){
                        specParentNode.children.push(child);
                        specParentNode.childrenByKey[child.key] = child;

                        levelParentNode.isFlattenGroup = true;
                    }
                }
                
                if(!isLastSpecLevel){
                    groupLevelRecursive.call(this, child, childDatums, levelIndex + 1);
                } else if(!isLastSpec) {
                    this._groupSpecRecursive(child, childDatums, nextSpecIndex);
                }

                // Datums already added to 'child'.
                def.array.append(levelParentDatums, child.datums);

                if(doFlatten && isPostOrder){
                    if(def.hasOwn(specParentNode.childrenByKey, child.key)){
                        /*jshint expr:true*/
                        child.isFlattenGroup || def.assert("Must be a parent for duplicate keys to exist.");
                        
                        // A child of child
                        // was registered with the same key,
                        // because it is all-nulls (in descending level's keys).
                        // But it is better to show the parent instead of the child,
                        // so we remove the child and add the parent.
                        // Yet, we cannot show only the parent
                        // if *child* has more than one child,
                        // cause then, the datums of the null child.child
                        // would only be in *child*, but
                        // the datums of the non-null child.child
                        // would be both in *child* and in child.child.
                        // This would mess up the scales and waterfall control code,
                        // not knowing whether to ignore the flatten group or not.
                        if(child._children.length === 1){
                            specParentNode.children.splice(
                                    specParentChildIndex, 
                                    specParentNode.children.length - specParentChildIndex);
                            
                            // A total group that must be accounted for
                            // because it has own datums.
                            child.isDegenerateFlattenGroup = true;
                        }
                        // else, both are added to specParentNode,
                        // and their datas will be given separate keys
                        // they will both be shown.
                        // Below, we overwrite anyway, with no harmful effect
                    }
                    
                    specParentNode.children.push(child);
                    specParentNode.childrenByKey[child.key] = child;
                    
                    levelParentNode.isFlattenGroup = true;
                }
            }, this);

            if(willRecurseParent) {
                // datums can no longer change
                this._groupSpecRecursive(levelParentNode, levelParentDatums, nextSpecIndex);
            }
        }
    },
    
    _groupDatums: function(levelSpec, levelParentNode, levelDatums, doFlatten){
        // The first datum of each group is inserted here in order,
        // according to the level's comparer.
        var firstDatums = [];
        
        // The first child is inserted here 
        // at the same index as that of 
        // the first datum in firstDatums.
        var childNodes = new def.OrderedMap();
        
        // Group levelDatums By the levelSpec#key(.)
        def
        .query(levelDatums)
        .each(function(datum){
            /*  newChild = { key: '', atoms: {}, dimNames: [] } */
            var newChild = levelSpec.key(datum);
            var key      = newChild.key;
            var child    = childNodes.get(key);
            if(child){
                child.datums.push(datum);
            } else {
                // First datum with key -> new child
                child = newChild;
                child.datums   = [datum];
                
                if(doFlatten){
                    // child.atoms must contain (locally) those of the levelParentNode,
                    // so that when flattened, they have a unique key 
                    def.copy(child.atoms, levelParentNode.atoms);
                    
                    // The key is the absKey, trimmed of keySep at the end
                    if(levelParentNode.dimNames.length){
//                        child.key = levelParentNode.key + 
//                                    datum.owner.keySep + 
//                                    key;
                        
                        var keySep = datum.owner.keySep;
                        
                        child.absKey = 
                            levelParentNode.absKey + 
                            keySep + 
                            key;
                        
                        var K = keySep.length;
                        var trimKey = child.absKey;
                        while(trimKey.lastIndexOf(keySep) === trimKey.length - K){
                            trimKey = trimKey.substr(0, trimKey.length - K);
                        }
                        
                        child.key = trimKey;
                    } else {
                        child.absKey = key;
                    }
                    
                    // don't change local key variable
                    child.dimNames = levelSpec.accDimensionNames();
                }
                
                var datumIndex = def.array.insert(firstDatums, datum, levelSpec.comparer);
                childNodes.add(key, child, ~datumIndex);
            }
        });
        
        return childNodes;
    },
    
    _generateData: function(node, parentNode, parentData, rootData){
        var data, isNew;
        if(node.isRoot){
            // Root node
            if(rootData){
                data = rootData;
                /*global data_addDatumsLocal:true*/
                data_addDatumsLocal.call(data, node.datums);
            } else {
                isNew = true;
                
                // Create a *linked* rootNode data
                data = new pvc.data.Data({
                    linkParent: parentData,
                    datums:     node.datums
                });
                data.treeHeight = node.treeHeight;
                data._groupOper = this;
            }
        } else {
            if(rootData){
                data = def.get(parentData._childrenByKey, node.key);
                if(data){
                    // Add the datums to the data, and its atoms to its dimensions
                    // Should also update linkedChildren (not children).
                    /*global data_addDatumsSimple:true*/
                    data_addDatumsSimple.call(data, node.datums);
                }
            }
            
            if(!data){
                isNew = true;
                var index, siblings;
                if(rootData && (siblings = parentData._children)){
                    // Insert the new sibling in correct order
                    // node.datums[0] is representative of the new Data's position
                    index = ~def.array.binarySearch(siblings, node.datums[0], parentNode.groupLevelSpec.comparer);
                }
                
                data = new pvc.data.Data({
                    parent:   parentData,
                    atoms:    node.atoms,
                    dimNames: node.dimNames,
                    datums: node.datums,
                    index:  index
                });
            }
        }

        if(isNew && node.isFlattenGroup){
            data._isFlattenGroup = true;
            data._isDegenerateFlattenGroup = !!node.isDegenerateFlattenGroup;
            
            var label = node.label;
            if(label){
                data.label    += label;
                data.absLabel += label;
            }
        }

        var childNodes = node.children;
        if(childNodes && childNodes.length){
            if(isNew){
                data._groupSpec      = node.groupSpec;
                data._groupLevelSpec = node.groupLevelSpec;
            }
            
            childNodes.forEach(function(childNode){
                this._generateData(childNode, node, data, rootData);
            }, this);

        } else if(isNew && !node.isRoot){
            // A leaf node
            var leafs = data.root._leafs;
            data.leafIndex = leafs.length;
            leafs.push(data);
        }
        
        return data;
    }
});
