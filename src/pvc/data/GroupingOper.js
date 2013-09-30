/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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
    /*jshint expr:true */
    groupingSpecs || def.fail.argumentRequired('groupingSpecs');

    this.base(linkParent, keyArgs);

    this._where    = def.get(keyArgs, 'where');
    this._visible  = def.get(keyArgs, 'visible',  null);
    this._selected = def.get(keyArgs, 'selected', null);
    this._isNull   = def.get(keyArgs, 'isNull',   null);

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

    // grouping spec ids are semantic keys, although the name is not 'key'
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

    _group: function(datumsQuery) {

        // Create the root node
        var rootNode = {
            isRoot: true,
            treeHeight: def
                .query(this._groupSpecs)
                .select(function(spec) {
                    var levelCount = spec.levels.length;
                    if(!levelCount) { return 0; }
                    return spec.flatteningMode ? 1 : levelCount;
                })
                .reduce(def.add, 0),

            datums: []
            // children
            // atoms       // not on rootNode
            // isFlattenGroup // on parents of a flattened group spec
        };

        if(rootNode.treeHeight > 0) {
            this._groupSpecRecursive(rootNode, def.query(datumsQuery).array(), 0); 
        }

        return rootNode;
    },


    _groupSpecRecursive: function(groupParentNode, groupDatums, groupIndex) {
        var group = this._groupSpecs[groupIndex];
        if(group.flatteningMode) {
            this._groupSpecRecursiveFlattened(groupParentNode, groupDatums, group, groupIndex);
        } else {
            this._groupSpecRecursiveNormal(groupParentNode, groupDatums, group, groupIndex);
        }
    },

    _groupSpecRecursiveNormal: function(groupParentNode, groupDatums, group, groupIndex) {
        var levels      = group.levels;
        var L           = levels.length;
        var isLastGroup = (groupIndex === this._groupSpecs.length - 1);
        
        if(groupParentNode.isRoot) { groupParentNode.label = group.rootLabel; }

        groupLevelRecursive.call(this, groupParentNode, groupDatums, 0);

        function groupLevelRecursive(levelParentNode, levelDatums, levelIndex) {

            var level = levels[levelIndex];
            var isLastLevel = (levelIndex === L - 1);
            var isLastLevelOfLastGroupSpec = isLastGroup && isLastLevel;

            levelParentNode.groupSpec      = group;
            levelParentNode.groupLevelSpec = level;

            // ---------------

            var childNodes = 
                levelParentNode.children =
                // Child nodes will not yet have been added to levelParentNode.
                this._groupLevelDatums(level, levelParentNode, levelDatums, /*doFlatten*/false);

            for(var i = 0, C = childNodes.length ; i < C ; i++) {
                var childNode = childNodes[i];

                // `levelParentNode.datums` are set to the datums of its children, in post order.
                // This way, datums order of non-leaf levels will 
                //  reflect the grouping "pattern".
                // NOTE: levelParentNode.datums is initially empty

                // Any more levels or grouping specs?
                if(!isLastLevelOfLastGroupSpec) {

                    // Backup child datums, as just grouped.
                    var childDatums = childNode.datums;

                    // Reset datums.
                    childNode.datums = [];

                    // By the end of the following recursive call, 
                    // childNode.datums will have been filled again, in post-order.
                    if(!isLastLevel) {
                        // NEXT LEVEL
                        groupLevelRecursive.call(this, childNode, childDatums, levelIndex + 1);
                    } else if(!isLastGroup) {
                        // NEXT GROUPING SPEC
                        this._groupSpecRecursive(childNode, childDatums, groupIndex + 1);
                    }
                }

                // Datums were already added to _childNode_.
                def.array.append(levelParentNode.datums, childNode.datums);
            }
        }
    },

    _groupSpecRecursiveFlattened: function(groupParentNode, specDatumsQuery, group, groupIndex) {
        var isPostOrder = group.flatteningMode === pvc.data.FlatteningMode.DfsPost;

        var levels    = group.levels;
        var L             = levels.length;
        var nextSpecIndex = groupIndex + 1;
        var isLastGroup    = (nextSpecIndex >= this._groupSpecs.length);
        
        var specGroupParent;

        if(doFlatten) {
            groupParentNode.children = [];
            groupParentNode.childrenByKey = {}; // Don't create children with equal keys

            // Must create a rootNode for the grouping operation
            // Cannot be groupParentNode (TODO: Why?)
            specGroupParent = {
                key:      '', // Key is local to group (when not flattened, it is local to level)
                absKey:   '',
                atoms:    {},
                datums:   [],
                label:    group.rootLabel,
                dimNames: []
            };

            if(!isPostOrder) {
                groupParentNode.children.push(specGroupParent);
                groupParentNode.childrenByKey[''] = specGroupParent;
            }
        } else {
            if(groupParentNode.isRoot) {
                groupParentNode.label = group.rootLabel;
            }

            specGroupParent = groupParentNode;
        }

        /* Group datums */
        groupLevelRecursive.call(this, specGroupParent, specDatumsQuery, 0);

        if(doFlatten) {
            if(isPostOrder) { groupParentNode.children.push(specGroupParent); }

            // Add datums of specGroupParent to groupParentNode.
            groupParentNode.datums = specGroupParent.datums;
        }

        function groupLevelRecursive(levelParentNode, levelDatums, levelIndex) {

            var level = levels[levelIndex];

            if(!doFlatten) {
                levelParentNode.children = [];
                levelParentNode.groupSpec = group;
                levelParentNode.groupLevelSpec = level;
            }

            var childNodes = this._groupLevelDatums(level, levelParentNode, levelDatums, doFlatten);
            var isLastLevel = levelIndex === L - 1;
            var willRecurseParent = doFlatten && !isLastGroup;

            // Add children's datums to levelParentNode, in post order.
            // This way, datums are reordered to follow the grouping "pattern".
            //
            // NOTE: levelParentNode.datums is initially empty
            var levelParentNodeDatums = willRecurseParent ?
                    [] :
                    levelParentNode.datums;

            childNodes
            .forEach(function(child) {
                /* On all but the last level,
                 * the datums of *child* are set to the
                 * union of datums of its own children.
                 * The datums will have been added,
                 * by the end of the following recursive call.
                 */
                var childDatums = child.datums; // backup original datums
                if(!(isLastGroup && isLastLevel)) { child.datums = []; }

                var specParentChildIndex;
                if(!doFlatten) {
                    levelParentNode.children.push(child);
                } else {
                    // Add children at a "hidden" property
                    // so that the test "if(!child._children.length)"
                    // below, can be done.
                    def.array.lazy(levelParentNode, '_children').push(child);

                    if(def.hasOwn(groupParentNode.childrenByKey, child.key)) {
                        // Duplicate key.
                        // Don't add as child of groupParentNode.
                        //
                        // We need to add its datums to group parent, anyway.
                        def.array.append(levelParentNodeDatums, childDatums);
                        return;
                    }

                    specParentChildIndex = groupParentNode.children.length;
                    if(!isPostOrder) {
                        groupParentNode.children.push(child);
                        groupParentNode.childrenByKey[child.key] = child;

                        levelParentNode.isFlattenGroup = true;
                    }
                }

                if(!isLastLevel) {
                    groupLevelRecursive.call(this, child, childDatums, levelIndex + 1);
                } else if(!isLastGroup) {
                    this._groupSpecRecursive(child, childDatums, nextSpecIndex);
                }

                // Datums already added to 'child'.
                def.array.append(levelParentNodeDatums, child.datums);

                if(doFlatten && isPostOrder) {
                    if(def.hasOwn(groupParentNode.childrenByKey, child.key)) {
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
                        if(child._children.length === 1) {
                            groupParentNode.children.splice(
                                    specParentChildIndex,
                                    groupParentNode.children.length - specParentChildIndex);

                            // A total group that must be accounted for
                            // because it has own datums.
                            child.isDegenerateFlattenGroup = true;
                        }
                        // else, both are added to groupParentNode,
                        // and their datas will be given separate keys
                        // they will both be shown.
                        // Below, we overwrite anyway, with no harmful effect
                    }

                    groupParentNode.children.push(child);
                    groupParentNode.childrenByKey[child.key] = child;

                    levelParentNode.isFlattenGroup = true;
                }
            }, this);

            if(willRecurseParent) {
                // datums can no longer change
                this._groupSpecRecursive(levelParentNode, levelParentNodeDatums, nextSpecIndex);
            }
        }
    },

    _groupLevelDatums: function(level, levelParentNode, levelDatums, doFlatten) {
        // The first child is inserted here
        // at the same index as that of
        // the first datum in firstDatums.
        var childNodeList = [];
        var childNodeMap  = {};

        var keySep; // for flattened nodes
        var datumComparer = level.comparer;
        var nodeComparer = function(na, nb) { 
            return datumComparer(na.firstDatum, nb.firstDatum); 
        };

        // Group levelDatums By the level#key(.)
        for(var i = 0, D = levelDatums.length ; i < D ; i++) {
            var datum = levelDatums[i];
            var key = level.key(datum);
            var childNode = def.hasOwnProp.call(childNodeMap, key) && childNodeMap[key];
            if(childNode) {
                // Add datum to existing childNode of same key
                childNode.datums.push(datum);
            } else {
                // First datum with key -> new child
                /*  childNode = { atoms: {}, dimNames: [] } */
                childNode = level.atomsInfo(datum);
                childNode.key = key;
                childNode.firstDatum = datum;
                childNode.datums = [datum];
                if(doFlatten) {
                    if(!keySep) { keySep = datum.owner.keySep; }
                    this._onNewChildNodeFlattened(key, keySep, childNode, level, levelParentNode);
                }

                def.array.insert(childNodeList, childNode, nodeComparer);
                childNodeMap[key] = childNode;
            }
        }

        return childNodeList;
    },

    _onNewChildNodeFlattened: function(key, keySep, childNode, level, levelParentNode) {
        // `childNode.atoms` must contain (locally) those of the levelParentNode,
        // so that when flattened, they have a unique key.
        // TODO: this seems buggy. What about null atoms, do they get copied as well?
        // Also, does this need to be done when !levelParentNode.dimNames.atoms.
        def.copy(childNode.atoms, levelParentNode.atoms);

        childNode.dimNames = level.accDimensionNames();

        // The _key_ is the _absKey_, trimmed of keySep at the end.
        // Foo~Bar~~~~ <--- this happens because of null values.
        if(levelParentNode.dimNames.length) {
            var absKey = levelParentNode.absKey + keySep + key;

            childNode.absKey = absKey;
            childNode.key    = this._rightTrimKeyOfKeySep(absKey);
        } else {
            childNode.absKey = key;
        }
    },

    _rightTrimKeyOfKeySep: function(key, keySep) {
        var j;
        var K = keySep.length;
        while(key.lastIndexOf(keySep) === (j = key.length - K)) {
            key = key.substr(0, j);
        }
        return key;
    },

    _generateData: function(node, parentNode, parentData, rootData) {
        var data, isNew;
        if(node.isRoot) {
            // Root node
            if(rootData) {
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
            if(rootData) {
                data = parentData.child(node.key);
                if(data) {
                    // Add the datums to the data, and its atoms to its dimensions
                    // Should also update linkedChildren (not children).
                    /*global data_addDatumsSimple:true*/
                    data_addDatumsSimple.call(data, node.datums);
                }
            }

            if(!data) {
                isNew = true;
                var index, siblings;
                if(rootData && (siblings = parentData.childNodes)) {
                    // Insert the new sibling in correct order
                    // node.datums[0] is representative of the new Data's position
                    index = ~def.array.binarySearch(
                        siblings, 
                        node.datums[0], 
                        parentNode.groupLevelSpec.comparer);
                }

                data = new pvc.data.Data({
                    parent:   parentData,
                    atoms:    node.atoms,
                    dimNames: node.dimNames,
                    datums:   node.datums,
                    index:    index
                });
            }
        }

        if(isNew) {
            if(node.isFlattenGroup) {
                data._isFlattenGroup = true;
                data._isDegenerateFlattenGroup = !!node.isDegenerateFlattenGroup;
            }

            var label = node.label;
            if(label) {
                data.label    += label;
                data.absLabel += label;
            }
        }

        var childNodes = node.children;
        var L = childNodes && childNodes.length;
        if(L) {
            if(isNew) {
                data._groupSpec      = node.groupSpec;
                data._groupLevelSpec = node.groupLevelSpec;
            }

            for(var i = 0 ; i < L ; i++) {
                this._generateData(childNodes[i], node, data, rootData);
            }
        } else if(isNew && !node.isRoot) {
            // A leaf node
            var leafs = data.root._leafs;
            data.leafIndex = leafs.length;
            leafs.push(data);
        }

        return data;
    }
});
