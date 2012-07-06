
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
 * @param {boolean} [keyArgs.visible=null]
 *      Only considers datums that have the specified visible state.
 * @param {boolean} [keyArgs.selected=null]
 *      Only considers datums that have the specified selected state.
 * @param {function} [keyArgs.where] A datum predicate.
 * @param {string} [keyArgs.whereKey] A key for the specified datum predicate,
 * previously returned by this function.
 * <p>
 * If this argument is specified it can be used to cache results.
 * If it is not specified, and <tt>keyArgs</tt> is specified,
 * one is returned.
 * If it is not specified and <tt>keyArgs</tt> is not specified,
 * then the instance will have a null {@link #key} property value.
 * </p>
 * <p>
 * If it a key not returned by this operation is specified,
 * then it should be prefixed by a "_" character,
 * in order to not colide with keys generated internally.
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

    /* 'Where' predicate and its key */
    var hasKey = this._selected == null, // Selected state changes does not yet invalidate cache...
        whereKey = '';
    if(this._where){
        whereKey = def.get(keyArgs, 'whereKey');
        if(!whereKey){
            if(!keyArgs){
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
            where:    this._where
        });
        
                /* Group datums */
        var rootNode = this._group(datumsQuery);

        /* Render node into a data */
        return this._generateData(rootNode, this._linkParent);
    },

    _group: function(datumsQuery){

        // Create the root node
        var root = {
            isRoot:     true,
            treeHeight: def.query(this._groupSpecs)
                           .select(function(spec){
                               var levelCount = spec.levels.length;
                               if(!levelCount) { return 0; }
                               return !!spec.flatteningMode ? 1 : levelCount;
                           })
                           .reduce(def.add, 0),
            datums:   []
            // children
            // atoms       // not on root
            // childrenKeyDimName // not on leafs
            // isFlattenGroup // on parents of a flattened group spec
        };

        if(root.treeHeight > 0){
            this._groupSpecRecursive(root, datumsQuery, 0);
        }
        
        return root;
    },

    _groupSpecRecursive: function(specParent, specDatums, specIndex){
        var groupSpec  = this._groupSpecs[specIndex],
            levelSpecs = groupSpec.levels,
            D = levelSpecs.length,
            nextSpecIndex = specIndex + 1,
            isLastSpec  = !(nextSpecIndex < this._groupSpecs.length),
            doFlatten   = !!groupSpec.flatteningMode,
            isPostOrder = doFlatten && (groupSpec.flatteningMode === 'tree-post'),
            specGroupParent;

        // <Debug>
        /*jshint expr:true */
        D || def.fail.operationInvalid("Must have levels");
        // </Debug>
        
        if(doFlatten){
            specParent.children = [];
            specParent.childrenByKey = {}; // Don't create children with equal keys
            
            // Must create a root for the grouping operation
            // Cannot be specParent
            specGroupParent = {
                key:    '',
                atoms:  [],
                datums: [],
                label:  groupSpec.flattenRootLabel
            };

            if(!isPostOrder){
                specParent.children.push(specGroupParent);
                specParent.childrenByKey[''] = specGroupParent;
            }
        } else {
            specGroupParent = specParent;
        }

        /* Group datums */
        groupLevelRecursive.call(this, specGroupParent, specDatums, 0);

        if(doFlatten){

            if(isPostOrder){
                specParent.children.push(specGroupParent);
            }

            // Add datums of specGroupParent to specParent.
            specParent.datums = specGroupParent.datums;
        }
            
        function groupLevelRecursive(groupParent, datums, specDepth){
            var levelSpec = levelSpecs[specDepth],

                groupChildren = [],
                
                // The first datum of each group is inserted here in order,
                // according to level's comparer
                firstDatums = [],

                // The first group info is inserted here at the same index
                // as the first datum.
                // At the end, one child data is created per groupInfo,
                // in the same order.
                groupInfos  = [],

                // group key -> datums, in given datums argument order
                datumsByKey = {};

            if(!doFlatten){
                groupParent.children = [];

                // TODO: Really ugly....
                // This is to support single-dimension grouping specifications used
                // internally by the "where" operation. See #data_whereDatumFilter
                groupParent.childrenKeyDimName = levelSpec.dimensions[0].name;
            }
            
            // Group, and possibly filter, received datums on level's key
            def.query(datums).each(function(datum){
                var groupInfo = levelSpec.key(datum);
                if(groupInfo != null){ // null means skip the datum
                    /* Datum passes to children, but may still be filtered downstream */
                    var key = groupInfo.key,
                        keyDatums = datumsByKey[key];

                    if(keyDatums){
                        keyDatums.push(datum);
                    } else {
                        // First datum with key -> new group
                        keyDatums = datumsByKey[key] = [datum];

                        groupInfo.datums = keyDatums;

                        var datumIndex = def.array.insert(firstDatums, datum, levelSpec.comparer);
                        def.array.insertAt(groupInfos, ~datumIndex, groupInfo);
                    }
                }
            }, this);

            // Create 1 child node per created groupInfo, in same order as these.
            // Further group each child node, on next grouping level, recursively.
            var isLastSpecLevel = specDepth === D - 1;
                
            groupInfos.forEach(function(groupInfo){
                var child = Object.create(groupInfo);
                /*
                 * On all but the last level,
                 * datums are only added to *child* at the end of the
                 * following recursive call,
                 * to the "union" of the datums of its own children.
                 */
                child.datums = isLastSpec && isLastSpecLevel ? groupInfo.datums : [];

                var key;
                if(!doFlatten){
                    groupParent.children.push(child);
                } else {
                    // Atoms must contain those of the groupParent
                    child.atoms = groupParent.atoms.concat(child.atoms);

                    /* A key that does not include null atoms */
                    key = def.query(child.atoms)
                             .where (function(atom){ return atom.value != null; })
                             .select(function(atom){ return atom.globalKey();   })
                             .array()
                             .join(',')
                             ;

                    if(def.hasOwn(specParent.childrenByKey, key)){
                        // Duplicate key
                        // We need datums added to parent anyway
                        groupChildren.push({datums: groupInfo.datums});
                        return;
                    }

                    if(!isPostOrder){
                        specParent.children.push(child);
                        specParent.childrenByKey[key] = child;

                        groupParent.isFlattenGroup = true;
                    }
                }
                
                if(!isLastSpecLevel){
                    groupLevelRecursive.call(this, child, groupInfo.datums, specDepth + 1);
                } else if(!isLastSpec) {
                    this._groupSpecRecursive(child, groupInfo.datums, nextSpecIndex);
                }

                // Datums already added to 'child'.

                groupChildren.push(child);

                if(doFlatten && isPostOrder){
                    specParent.children.push(child);
                    specParent.childrenByKey[key] = child;

                    groupParent.isFlattenGroup = true;
                }
            }, this);

            var willRecurseParent = doFlatten && !isLastSpec;

            datums = willRecurseParent ? [] : groupParent.datums;

            // Add datums of chidren to groupParent.
            // This accounts for possibly excluded datums,
            // in any of the below levels (due to null atoms).
            // TODO: This method changes the order of preserved datums to
            //       follow the grouping "pattern". Is this OK?
            groupChildren.forEach(function(child){
                def.array.append(datums, child.datums);
            });
            
            if(willRecurseParent) {
                /* datums can no longer change */
                this._groupSpecRecursive(groupParent, datums, nextSpecIndex);
            }
            
            return groupChildren;
        }
    },

    _generateData: function(node, parentData){
        var data;
        if(node.isRoot){
            // Root node
            // Create a *linked* root data
            data = new pvc.data.Data({
                linkParent: parentData,
                datums:     node.datums
            });
            
            data.treeHeight = node.treeHeight;
        } else {
            data = new pvc.data.Data({
                parent: parentData,
                atoms:  node.atoms,
                datums: node.datums
            });
        }

        if(node.isFlattenGroup){
            data._isFlattenGroup = true;
            var label = node.label;
            if(label){
                data.label    += label;
                data.absLabel += label;
            }
        }

        var childNodes = node.children;
        if(childNodes && childNodes.length){
            // TODO: ...
            data._childrenKeyDimName = node.childrenKeyDimName;
            
            childNodes.forEach(function(childNode){
                this._generateData(childNode, data);
            }, this);

        } else if(!node.isRoot){
            // A leaf node
            var leafs = data.root._leafs;
            data.leafIndex = leafs.length;
            leafs.push(data);
        }
        
        return data;
    }
});
