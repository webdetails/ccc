/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a grouping operation.
 *
 * @name cdo.GroupingOper
 *
 * @class Performs one grouping operation according to a grouping specification.
 * @extends cdo.DataOper
 *
 * @constructor
 *
 * @param {!cdo.Data} linkParent The link parent data set.
 *
 * @param {string|string[]|cdo.GroupingSpec|cdo.GroupingSpec[]} groupingSpecs A grouping specification as a string, an object or array of either.
 *
 * @param {object} [keyArgs] Keyword arguments.
 * See {@link cdo.DataOper} for any additional arguments.
 *
 * @param {Object.<string, !cdo.Data>} [keyArgs.extensionDataSetsMap] -
 * A data sets map with a dataset for each of the grouping specifications' required extension complex types:
 * {@link cdo.GroupingSpec#extensionComplexTypeNames}.
 *
 * @param {boolean} [keyArgs.reverse=false] Reverts the sorting order of the dimensions of the given grouping specifications.
 * @param {boolean} [keyArgs.inverted=false] Inverts the given grouping specification array.
 * @param {boolean} [keyArgs.isNull=null] Only considers datums with the specified isNull attribute.
 * @param {boolean} [keyArgs.visible=null] Only considers datums that have the specified visible state.
 * @param {boolean} [keyArgs.selected=null] Only considers datums that have the specified selected state.
 * @param {function} [keyArgs.where] A datum predicate.
 * @param {string} [keyArgs.whereKey] A key for the specified datum predicate.
 * If <tt>keyArgs.where</tt> is specified and this argument is not, the results will not be cached,
 * in which case the new grouping operation will have a null {@link #key} property value.
 */
def.type('cdo.GroupingOper', cdo.DataOper)
.init(function(linkParent, groupingSpecs, keyArgs) {

    groupingSpecs || def.fail.argumentRequired('groupingSpecs');

    groupingSpecs = def.array.as(groupingSpecs);
    if(groupingSpecs.length === 0) {
        throw def.error.argumentRequired('groupingSpecText');
    }

    if(def.get(keyArgs, 'inverted', false)) {
        groupingSpecs = groupingSpecs.slice().reverse();
    }

    this.base(linkParent, keyArgs);

    // Pre-filters
    var where = def.get(keyArgs, 'where');
    var whereKey = (where && def.get(keyArgs, 'whereKey')) || '';
    var isVisible  = def.get(keyArgs, 'visible',  null);
    var isSelected = def.get(keyArgs, 'selected', null);

    this._preFilter = data_wherePredicate(null, {visible: isVisible, selected: isSelected, where: where});

    // Post-filters
    // Must be performed last so that the order of results is not changed.
    // See `_groupLevelDatums` for information on the reason why.
    var isNull = def.get(keyArgs, 'isNull', null);

    this._postFilter = data_wherePredicate(null, {isNull: isNull});

    // GroupingOper key
    // When a grouping operation has no key, its results are not cached.
    // TODO: Selected state changes do not yet invalidate cache...
    var hasKey = isSelected == null && !(where && !whereKey);

    var groupSpecKeys = hasKey ? [] : null;

    var extensionDataSetsKey = '';
    var extensionDataSetsMap = null;
    var extensionDataSetsMapProvided = def.get(keyArgs, 'extensionDataSetsMap', null);

    var reverse = def.get(keyArgs, 'reverse', false);

    this._groupSpecs = groupingSpecs.map(function(groupSpec) {

        if(groupSpec instanceof cdo.GroupingSpec) {
            if(groupSpec.complexType !== linkParent.type)
                throw def.error.argumentInvalid('groupingSpecText', "Invalid associated complex type.");
        } else {
            // Must be a non-empty string, or throws
            groupSpec = cdo.GroupingSpec.parse(groupSpec, linkParent.type);
        }

        if(groupSpec.isNull) {
            throw def.error.argumentInvalid('groupingSpecText', "Null grouping specification.");
        }

        if(groupSpec.flatteningMode === cdo.FlatteningMode.SingleLevel) {
            groupSpec = groupSpec.toSingleLevel();
        }

        if(reverse) {
            groupSpec = groupSpec.reverse();
        }

        if(hasKey) {
            groupSpecKeys.push(groupSpec.key);
        }

        if(groupSpec.extensionComplexTypeNames !== null) {
            groupSpec.extensionComplexTypeNames.forEach(function(dataSetName) {
                var dataSet;
                if(extensionDataSetsMapProvided === null || !(dataSet = extensionDataSetsMapProvided[dataSetName])) {
                    throw def.error.operationInvalid("Grouping specification requires extension data set '{0}'.", [dataSetName]);
                }

                if(extensionDataSetsMap === null) {
                    extensionDataSetsMap = Object.create(null);
                }

                extensionDataSetsMap[dataSetName] = dataSet;

                if(hasKey) {
                    extensionDataSetsKey += dataSetName + ':' + dataSet.id + ';';
                }
            });
        }

        return groupSpec;
    });

    this._extensionDataSetsMap = extensionDataSetsMap;

    if(hasKey) {
        this.key = groupSpecKeys.join('!!') + ":" +
            [isVisible, isNull, whereKey, extensionDataSetsKey].join(':');
    }
}).
add(/** @lends cdo.GroupingOper# */{

    /**
     * Gets a map of datum arrays, indexed by extension data set name,
     * `null`, when there are no extension references, or
     * `false`, when any extension has no datums.
     *
     * @return {Object.<string, !cdo.Datum[]>|boolean} The extension datums map, or `null` or `false`.
     */
    _getExtensionDatumsMap: function() {
        var extensionDatumsMap = null;
        var extensionDataSetsMap = this._extensionDataSetsMap;
        if(extensionDataSetsMap) {
            extensionDatumsMap = Object.create(null);

            var baseExtensionDatumsMap = this._linkParent.extensionDatums;

            var isNoDatums = def.query(Object.keys(extensionDataSetsMap))
                .each(function(dataSetName) {

                    var dataSet = extensionDataSetsMap[dataSetName];

                    var datums = dataSet._datums;
                    if(datums.length === 0) {
                        return false; // break;
                    }

                    // Is the base data set already limited to a set of these datums?
                    // If so, intersect.
                    // If we get 0 datums, then the whose grouping results in 0 datums...
                    if(baseExtensionDatumsMap !== null) {
                        var baseDatums = baseExtensionDatumsMap[dataSetName];
                        if(baseDatums) {
                            datums = baseDatums.filter(function(baseDatum) {
                                return datums.indexOf(baseDatum) >= 0;
                            });
                        }
                    }

                    if(datums.length === 0) {
                        return false; // break
                    }

                    extensionDatumsMap[dataSetName] = datums;
                });

            if(isNoDatums) {
                return false;
            }
        }

        return extensionDatumsMap;
    },

    /**
     * Performs the grouping operation.
     *
     * @return {cdo.Data} The resulting root data.
     */
    execute: function() {
        // Setup a priori datum filters

        var datums = this._linkParent._datums;

        var datumsQuery = def.query(datums).where(this._preFilter);

        // Group datums.
        var rootNode = this._group(datumsQuery);

        // Render resulting node into a new linked child data set.
        return this._generateData(rootNode, null, this._linkParent, null);
    },

    executeAdd: function(rootData, newDatums) {

        var newDatumsQuery = def.query(newDatums).where(this._preFilter);

        // Group new datums
        var newRootNode = this._group(newDatumsQuery);

        // Render resulting node into specified root data.
        this._generateData(newRootNode, null, this._linkParent, rootData);

        return newRootNode.datums;
    },

    _group: function(datumsQuery) {

        // Create the root node - the root node of the first grouping spec.
        var rootNode = {
            isRoot: true,
            treeHeight: def
                .query(this._groupSpecs)
                .select(function(groupSpec) {
                    return (groupSpec.flatteningMode & cdo.FlatteningMode.Dfs) ? 1 : groupSpec.depth;
                })
                .reduce(def.add, 0),

            datums: [],
            datumsById: {},

            // J.I.C. of early bailout; ensure the root node has all of these.
            groupSpec: this._groupSpecs[0],
            groupLevelSpec: this._groupSpecs[0].levels[0]

            // children
            // atoms          // not on rootNode
            // isFlattenGroup // on parents of a flattened group spec
        };

        // assert rootNode.treeHeight > 0

        // Any extensions with no datums cause the whole grouping to result in no datums.
        var extensionDatumsMap = this._getExtensionDatumsMap();
        if(extensionDatumsMap !== false) {
            this._groupSpecRecursive(rootNode, def.query(datumsQuery).array(), extensionDatumsMap, 0);
        }

        return rootNode;
    },

    /**
     * Executes the grouping operation recursively,
     * processing the next of the operations' grouping specifications in each recursive call.
     *
     * @param {object} groupParentNode - The parent node.
     * @param {!cdo.Datum[]} groupDatums - An array of datums to group.
     * @param {Object.<string, !cdo.Datum[]>} groupExtensionDatumsMap - The group's extension datums map.
     * @param {number} groupSpecIndex - The index of the grouping specification to group on.
     *
     * @private
     */
    _groupSpecRecursive: function(groupParentNode, groupDatums, groupExtensionDatumsMap, groupSpecIndex) {

        var groupSpec = this._groupSpecs[groupSpecIndex];

        if((groupSpec.flatteningMode & cdo.FlatteningMode.Dfs) !== 0)
            this._groupSpecRecursiveFlattened(groupParentNode, groupDatums, groupExtensionDatumsMap, groupSpec, groupSpecIndex);
        else
            this._groupSpecRecursiveNormal(groupParentNode, groupDatums, groupExtensionDatumsMap, groupSpec, groupSpecIndex);
    },

    _groupSpecRecursiveNormal: function(groupParentNode, groupDatums, groupExtensionDatumsMap, groupSpec, groupSpecIndex) {
        var levelSpecs = groupSpec.levels;
        var L = levelSpecs.length;
        var isLastGroupSpec = (groupSpecIndex === this._groupSpecs.length - 1);

        if(groupParentNode.isRoot) {
            groupParentNode.label = groupSpec.rootLabel;
        }

        groupLevelRecursive.call(this, groupParentNode, groupDatums, groupExtensionDatumsMap, 0);

        function groupLevelRecursive(levelParentNode, levelDatums, levelExtensionDatumsMap, levelIndex) {

            var levelSpec = levelSpecs[levelIndex];
            var isLastLevel = (levelIndex === L - 1);
            var isLastLevelOfLastGroupSpec = isLastGroupSpec && isLastLevel;

            levelParentNode.groupSpec = groupSpec;
            levelParentNode.groupLevelSpec = levelSpec;

            // ---------------

            // Need to add child nodes explicitly to levelParentNode (cause when flattening these are not added).
            var childNodes = levelParentNode.children =
                this._groupLevelDatums(levelSpec, levelParentNode, levelDatums, levelExtensionDatumsMap, /* doFlatten: */false);

            for(var i = 0, C = childNodes.length ; i < C ; i++) {

                var childNode = childNodes[i];

                // `levelParentNode.datums` is set to the datums of its children, in post order.
                //
                // This way, datums order of non-leaf levels will reflect the grouping "pattern".
                // NOTE: levelParentNode.datums is initially empty

                // Any more levels or grouping specs?
                if(!isLastLevelOfLastGroupSpec) {

                    // Backup the just grouped child datums and reset them in childNode.
                    var childDatums = childNode.datums;
                    childNode.datums = [];
                    childNode.datumsById = {};

                    // Now send childDatums down to be further grouped (and re-ordered).

                    // By the end of the following recursive call,
                    // childNode.datums will have been filled again, in post-order.
                    if(!isLastLevel)
                        // NEXT LEVEL
                        groupLevelRecursive.call(this, childNode, childDatums, childNode.extensionDatumsMap, levelIndex + 1);
                    else /* if(!isLastGroupSpec) */
                        // NEXT GROUPING SPEC
                        this._groupSpecRecursive(childNode, childDatums, childNode.extensionDatumsMap, groupSpecIndex + 1);
                }

                // Datums were already added to _childNode_.
                this._addChildDatums(
                    levelParentNode.datums, levelParentNode.datumsById, childNode.datums, groupExtensionDatumsMap);
            }
        }
    },

    _addChildDatums: function(datums, datumsById, childDatums, groupExtensionDatumsMap) {

        if(groupExtensionDatumsMap === null) {
            // There is no way that there are duplicates.
            def.array.append(datums, childDatums);
        } else {
            var i = -1;
            var L = childDatums.length;
            while(++i < L) {
                var childDatum = childDatums[i];
                if(datumsById[childDatum.id] === undefined) {
                    datumsById[childDatum.id] = childDatum;
                    datums.push(childDatum);
                }
            }
        }
    },

    _groupSpecRecursiveFlattened: function(realGroupParentNode, groupDatums, groupExtensionDatumsMap, groupSpec, groupIndex) {
        var isPostOrder = groupSpec.flatteningMode === cdo.FlatteningMode.DfsPost;
        var levelSpecs = groupSpec.levels;
        var L = levelSpecs.length;
        var isLastGroup = (groupIndex === this._groupSpecs.length - 1);
        var flatChildren = [];
        var flatChildrenByKey = {}; // Don't create children with equal keys

        // Must create a rootNode for the grouping operation
        // Cannot be realGroupParentNode. TODO: Why???
        var groupParentNode = {
            key:      '', // Key is local to group
            absKey:   '',
            atoms:    {},
            datums:   [],
            datumsById: {},
            label:    groupSpec.rootLabel,
            dimNames: []
        };

        var addFlatChildNode = function(childNode) {
            flatChildren.push(childNode);
            flatChildrenByKey[childNode.key] = childNode;
        };

        realGroupParentNode.children = flatChildren;
        realGroupParentNode.childrenByKey = flatChildrenByKey;

        if(!isPostOrder) {
            addFlatChildNode(groupParentNode);
        }

        // Group datums
        groupLevelRecursive.call(this, groupParentNode, groupDatums, groupExtensionDatumsMap, 0);

        if(isPostOrder) {
            addFlatChildNode(groupParentNode);
        }

        realGroupParentNode.datums = groupParentNode.datums;

        function groupLevelRecursive(levelParentNode, levelDatums, levelExtensionDatumsMap, levelIndex) {
            var levelSpec = levelSpecs[levelIndex];
            var isLastLevel = (levelIndex === L - 1);
            var isLastLevelOfLastGroupSpec = isLastGroup && isLastLevel;

            var childNodes = this._groupLevelDatums(levelSpec, levelParentNode, levelDatums, levelExtensionDatumsMap, /*doFlatten*/true);

            // Add children's datums to levelParentNode, in post order.
            // This way, datums are reordered to follow the grouping "pattern".
            //
            // NOTE: levelParentNode.datums is initially empty
            var levelParentNodeDatums = !isLastGroup ? [] : levelParentNode.datums;
            var levelParentNodeDatumsById = !isLastGroup ? {} : levelParentNode.datumsById;

            for(var i = 0, C = childNodes.length ; i < C ; i++) {
                var childNode = childNodes[i],

                    // `levelParentNode.datums` are set to the datums of its children, in post order.
                    // This way, datums order of non-leaf levelSpecs will
                    //  reflect the grouping "pattern".
                    // NOTE: levelParentNode.datums is initially empty
                    childDatums = childNode.datums; // backup original datums

                // Add children at a "hidden" property
                // so that the test "if(!childNode._children.length)"
                // below, can be done.
                def.array.lazy(levelParentNode, '_children').push(childNode);

                if(def.hasOwn(flatChildrenByKey, childNode.key)) {
                    // Duplicate key.
                    // Don't add as child of realGroupParentNode.
                    //
                    // We need to add its datums to group parent, anyway.
                    this._addChildDatums(
                        levelParentNodeDatums, levelParentNodeDatumsById, childDatums, groupExtensionDatumsMap);
                    continue;
                }

                var specParentChildIndex = flatChildren.length;
                if(!isPostOrder) {
                    addFlatChildNode(childNode);
                    levelParentNode.isFlattenGroup = true;
                }

                if(!isLastLevelOfLastGroupSpec) {
                    childNode.datums = [];
                    childNode.datumsById = {};

                    if(!isLastLevel)
                        groupLevelRecursive.call(this, childNode, childDatums, levelExtensionDatumsMap, levelIndex + 1);
                    else /*if(!isLastGroup)*/
                        this._groupSpecRecursive(childNode, childDatums, levelExtensionDatumsMap, groupIndex + 1);
                }

                // Datums are now already added to 'childNode'.
                this._addChildDatums(
                    levelParentNodeDatums, levelParentNodeDatumsById, childNode.datums, groupExtensionDatumsMap);

                if(isPostOrder) {
                    if(def.hasOwn(flatChildrenByKey, childNode.key)) {
                        /*jshint expr:true*/
                        childNode.isFlattenGroup || def.assert("Must be a parent for duplicate keys to exist.");

                        // TODO: how I wish I could understand any of this now...
                        // Explain this better, when possible.

                        // A child of childNode
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
                        if(childNode._children.length === 1) {
                            flatChildren.splice(
                                    specParentChildIndex,
                                    flatChildren.length - specParentChildIndex);

                            // A total group that must be accounted for
                            // because it has own datums.
                            childNode.isDegenerateFlattenGroup = true;
                        }
                        // else, both are added to realGroupParentNode,
                        // and their datas will be given separate keys
                        // they will both be shown.
                        // Below, we overwrite anyway, with no harmful effect
                    }

                    addFlatChildNode(childNode);
                    levelParentNode.isFlattenGroup = true;
                }
            }

            // datums can no longer change
            if(!isLastGroup) {
                this._groupSpecRecursive(levelParentNode, levelParentNodeDatums, levelExtensionDatumsMap, groupIndex + 1);
            }
        }
    },

    /**
     * Groups the given datums into groups having distinct values in the level's dimensions.
     *
     * Returns an array of child group nodes of `levelParentNode`, which, however,
     * have not been added to `levelParentNode.children` (as, when flattening, this is not done).
     *
     * When `_postFilter` is defined, some of the given datums may get excluded.
     * If a child node ends up with no datums, it is not returned.
     * However, it may be the case that the datum that gives order to the group (the firstDatum)
     * is excluded (because it is null?).
     * Because of that, datums are only excluded after getting a chance to be the first datum of a group.
     *
     * @param {cdo.GroupingLevelSpec} levelSpec - The grouping level specification.
     * @param {object} levelParentNode - The level's parent node.
     * @param {!cdo.Datum[]} levelDatums - An array of datums to group.
     * @param {Object.<string, !cdo.Datum[]>} levelExtensionDatumsMap - The level's extension datums map.
     * @param {boolean} doFlatten - `true` when flattening, in which case `#_onNewChildNodeFlattened` is called
     * with the new child node.
     *
     * @private
     */
    _groupLevelDatums: function(levelSpec, levelParentNode, levelDatums, levelExtensionDatumsMap, doFlatten) {
        var childNodeList = [];
        var childNodeMap = Object.create(null);

        var postFilter = this._postFilter;
        var keySep = null; // for flattened nodes

        var j = -1;
        var D = levelDatums.length;
        var buildKey;
        var buildGroupNode;
        var nodeComparer;

        var extensionDimensions = levelSpec.extensionDimensions;
        if(extensionDimensions !== null) {

            buildKey = levelSpec.buildKeyWithExtension;
            buildGroupNode = levelSpec.buildGroupNodeWithExtension;
            nodeComparer = levelSpec.compareNodesWithExtension.bind(levelSpec);

            var crossJoinExtensionDatumsMaps = [];

            crossJoinExtensionDatumsRecursive(crossJoinExtensionDatumsMaps, 0, levelExtensionDatumsMap);

            while(++j < D) groupDatumExtended.call(this, levelDatums[j], crossJoinExtensionDatumsMaps);

        } else {
            buildKey = levelSpec.buildKeyMain;
            buildGroupNode = levelSpec.buildGroupNodeMain;
            nodeComparer = levelSpec.compareNodesMain.bind(levelSpec);

            while(++j < D) groupDatum.call(this, levelDatums[j], levelExtensionDatumsMap);
        }

        if(postFilter) {
            // remove nodes that ended up with no datums passing the filter
            j = childNodeList.length;
            while(j--) if(childNodeList[j].datums.length === 0) childNodeList.splice(j, 1);
        }

        return childNodeList;

        /**
         * Groups a main datum and extension datums by key.
         *
         * @param {!cdo.Datum} datum - The main datum to process.
         * @param {Object.<string, !cdo.Datum[]>} extensionDatumsMap - A map of arrays of extension datums.
         */
        function groupDatum(datum, extensionDatumsMap) {

            var key = buildKey.call(levelSpec, datum, extensionDatumsMap);
            var childNode = def.hasOwnProp.call(childNodeMap, key) && childNodeMap[key];

            if(childNode) {
                // Add datum to existing childNode of same key.
                if(!postFilter || postFilter(datum)) {
                    childNode.datums.push(datum);
                }
            } else {
                // The first datum with a given key results in a new child group node.

                /* childNode = {
                 *   atoms: {
                 *     "city": atomLisbon,
                 *     "valueRole.dim": atomQty
                 *   },
                 *   dimNames: ["city", "valueRole.dim"]
                 * }
                 */
                childNode = buildGroupNode.call(levelSpec, datum, extensionDatumsMap);
                childNode.key = key;

                // Even if the first datum gets excluded by `postFilter`, it determines the group's relative order.
                // (see nodeComparer)
                childNode.firstDatum = datum;
                childNode.datums = !postFilter || postFilter(datum) ? [datum] : [];
                childNode.extensionDatumsMap = extensionDatumsMap;

                if(doFlatten) {
                    if(keySep === null) keySep = datum.owner.keySep;

                    this._onNewChildNodeFlattened(key, keySep, childNode, levelSpec, levelParentNode);
                }

                def.array.insert(childNodeList, childNode, nodeComparer);
                childNodeMap[key] = childNode;
            }
        }

        function groupDatumExtended(datum, extensionDatumsMaps) {

            var i = -1;
            var L = extensionDatumsMaps.length;

            while(++i < L) groupDatum.call(this, datum, extensionDatumsMaps[i]);
        }

        // Each extension dimension will cause a cross join to be performed with corresponding datums of levelExtensionDatumsMap.
        // Extension dimensions which are not cross-joined, pass all of their datums to the next grouping level.
        function crossJoinExtensionDatumsRecursive(outputMaps, extDimIndex, extensionDatumsMap) {

            var extDimension = extensionDimensions[extDimIndex];
            var extDataSetName = extDimension.dataSetName;
            var extDatums = levelExtensionDatumsMap[extDataSetName];

            var i = -1;
            var L = extDatums.length;
            var nextExtDimIndex = extDimIndex + 1;
            var isLastExtDim = nextExtDimIndex >= extensionDimensions.length;

            while(++i < L) {
                var childExtensionDatumsMap = Object.create(extensionDatumsMap);

                childExtensionDatumsMap[extDataSetName] = [extDatums[i]];

                if(isLastExtDim) {
                    outputMaps.push(childExtensionDatumsMap);
                } else {
                    crossJoinExtensionDatumsRecursive(outputMaps, nextExtDimIndex, childExtensionDatumsMap);
                }
            }
        }
    },

    _onNewChildNodeFlattened: function(key, keySep, childNode, level, levelParentNode) {
        // `childNode.atoms` must contain (locally) those of the levelParentNode,
        // so that when flattened, they have a unique key.
        // TODO: this seems buggy. What about null atoms, do they get copied as well?
        // Also, does this need to be done when !levelParentNode.dimNames.atoms.
        def.copy(childNode.atoms, levelParentNode.atoms);

        // levelParentNode.dimNames.concat(childNode.dimNames);
        childNode.dimNames = level.accAllDimensionNames();

        // The _key_ is the _absKey_, trimmed of keySep at the end.
        // Foo~Bar~~~~ <--- this happens because of null values.
        if(levelParentNode.dimNames.length) {
            var absKey = levelParentNode.absKey + keySep + key;
            childNode.absKey = absKey;
            childNode.key    = cdo.Complex.rightTrimKeySep(absKey, keySep);
        } else {
            childNode.absKey = key;
        }
    },

    _generateData: function(node, parentNode, parentData, rootData) {

        // The data corresponding to `node`.
        var data = null;

        // Was `data` created in this call?
        // !rootData => isNew
        var isNew = false;

        if(node.isRoot) {
            // Root node
            if(rootData !== null) {
                data = rootData;
                data._addDatumsLocal(node.datums);
            } else {
                isNew = true;

                // TODO: should receive atoms with null atoms for used extension dimensions...

                // Create a linked root data set.
                data = new cdo.GroupingRootData({
                    groupingOper: this,
                    groupingSpec: node.groupSpec,
                    groupingLevelSpec: node.groupLevelSpec,

                    linkParent: parentData,
                    datums: node.datums,
                    extensionDatums: node.extensionDatumsMap
                });
                data.treeHeight = node.treeHeight;
            }
        } else {
            if(rootData !== null) {
                data = parentData.child(node.key);
                if(data !== null) {
                    // Add the datums to the data, and its atoms to its dimensions.
                    // Should also update linkedChildren (not children).
                    data._addDatumsSimple(node.datums);
                }
            }

            if(data === null) {
                isNew = true;

                var index = null;
                var siblings;

                // Insert the new sibling in correct order
                // node.datums[0] is representative of the new Data's position
                if(rootData !== null && (siblings = parentData.childNodes).length > 0) {

                    index = ~def.array.binarySearch(
                        siblings,
                        node.datums[0],
                        parentNode.groupLevelSpec.mainDatumComparer);
                }

                data = new cdo.GroupData({
                    groupingOper: this,
                    groupingSpec: node.groupSpec,
                    groupingLevelSpec: node.groupLevelSpec,

                    parent: parentData,
                    atoms:  node.atoms,
                    datums: node.datums,
                    index:  index,
                    atomsDimNames: node.dimNames,
                    extensionDatums: node.extensionDatumsMap
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
        var L = childNodes ? childNodes.length : 0;
        if(L > 0) {
            var i = -1;
            while(++i < L) this._generateData(childNodes[i], node, data, rootData);

        } else if(isNew && !node.isRoot) {
            // A new leaf node
            var leafs = data.root._leafs;
            data.leafIndex = leafs.length;
            leafs.push(data);
        }

        return data;
    }
});
