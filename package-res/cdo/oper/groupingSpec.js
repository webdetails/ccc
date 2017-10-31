/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// TODO: I think the construction of Levels and Dimensions should be done from within the parent Grouping and Level.
// The way it is, it just looks awkward and some validations are not even being performed, like ensuring that the
// received levelSpecs/dimSpecs are consistent with the given complexType and extensionComplexTypesMap.
// The reason for this being like this might have to do it #ensure. Even so, there might be a way around it.

def.space('cdo').FlatteningMode =
    def.makeEnum([
        'SingleLevel', // A grouping spec flattened into a single level is obtained and only then the grouping operation is performed.
        'DfsPre',      // The grouping spec is not changed.
                       // All resulting nodes are flattened into a single level, in Depth-First-Search pre-order
        'DfsPost'      // The grouping spec is not changed.
                       // All resulting nodes are flattened into a single level, in Depth-First-Search post-order
    ], {
        // No flattening is performed before or after the grouping operation.
        // The result of the grouping operation is a tree of data sets whose
        // structure mirrors that of the grouping specification.
        zero: 'None',
        all:  'AllMask'
    });

/**
 * The mask which includes both DFS flattening modes - those performed during the grouping operation.
 * For internal use.
 * @private
 */
cdo.FlatteningMode.Dfs = cdo.FlatteningMode.DfsPre | cdo.FlatteningMode.DfsPost;

/**
 * Initializes a grouping specification.
 *
 * <p>
 * A grouping specification contains information similar to that of an SQL 'order by' clause.
 * </p>
 *
 * <p>
 * A grouping specification supports the grouping operation.
 * </p>
 *
 * @see cdo.GroupingOper
 *
 * @name cdo.GroupingSpec
 *
 * @class
 *
 * @property {string}  key A <i>semantic</i> hash of this grouping specification.
 * @property {boolean} isNull Indicates that there are no levels, and dimensions.
 * @property {boolean} isSingleDimension Indicates that there is only one level and dimension.
 * @property {boolean} isSingleLevel Indicates that there is only one level.
 * @property {boolean} hasExtensionComplexTypes Indicates if there are any extension complex types.
 * @property {cdo.ComplexType} type The complex type against which dimension names were resolved.
 * @property {string[]} extensionComplexTypeNames The names of extension complex types, if any.
 * @property {cdo.GroupingLevelSpec} levels An array of level specifications.
 * @property {cdo.GroupingDimensionSpec} firstDimension The first dimension specification, if any.
 * @property {cdo.GroupingDimensionSpec} lastDimension The last dimension specification, if any.
 * @property {cdo.FlatteningMode} flatteningMode The flattening mode.
 * @property {string} rootLabel The label of the resulting root node.
 *
 * @constructor
 * @param {def.Query} levelSpecs An enumerable of {@link cdo.GroupingLevelSpec}.
 * @param {cdo.ComplexType} [type] A complex type.
 * @param {Object.<string, cdo.ComplexType>} [extensionComplexTypesMap] A map of extension complex types by name.
 * @param {object} [ka] Keyword arguments.
 * @param {cdo.FlatteningMode} [ka.flatteningMode=cdo.FlatteningMode.None] The flattening mode.
 * @param {string} [ka.rootLabel=''] The label of the root node.
 */
def.type('cdo.GroupingSpec')
.init(function(levelSpecs, complexType, extensionComplexTypesMap, ka) {

    // Bound at construction time or lazily, through bind.
    this.complexType = complexType || null;
    complexType = this.complexType;

    var referencedExtensionComplexTypeNamesMap = null;

    var levelKeys = [];

    // Accumulated main dimension names, from first level to last.
    var mainDimNames = [];
    var allDimNames = [];

    var isDiscrete = false;
    var singleContinuousValueType = null;

    this.levels = def.query(levelSpecs || undefined) // -> null query
        // Filter out empty levels....
        .where(function(levelSpec) {
            return levelSpec.allDimensions.length > 0;
        })
        .select(function(levelSpec) {

            levelKeys.push(levelSpec.key);

            mainDimNames.push.apply(mainDimNames, levelSpec.dimensionNames());

            levelSpec.allDimensions.forEach(function(dimSpec) {

                // Register referenced complex type names.
                if(dimSpec.dataSetName) {
                    if(referencedExtensionComplexTypeNamesMap === null) {
                        referencedExtensionComplexTypeNamesMap = Object.create(null);
                    }

                    referencedExtensionComplexTypeNamesMap[dimSpec.dataSetName] = true;
                    allDimNames.push(dimSpec.fullName);
                } else {
                    allDimNames.push(dimSpec.name);
                }

                if(complexType !== null && !isDiscrete) {
                    var dimType = dimSpec.dimensionType;
                    if(dimType.isDiscrete) {
                        isDiscrete = true;
                    } else if(singleContinuousValueType === null) {
                        singleContinuousValueType = dimType.valueType;
                    } else if(singleContinuousValueType !== dimType.valueType) {
                        isDiscrete = true;
                    }
                }
            });

            // Provide the level with the accumulated all dimensions names.
            levelSpec._setAccAllDimNames(allDimNames.slice(0));

            return levelSpec;
        })
        .array();

    // ---

    this.extensionComplexTypesMap = null;
    this.extensionComplexTypeNames =
        referencedExtensionComplexTypeNamesMap && Object.keys(referencedExtensionComplexTypeNamesMap);

    if(complexType !== null && referencedExtensionComplexTypeNamesMap) {
        this._setExtensionComplexTypesMap(extensionComplexTypesMap);
    }

    // ---

    // TODO: should this contain only distinct dimension names?
    this._dimNames = mainDimNames;
    this._allDimNames = allDimNames;

    this.depth = this.levels.length;

    this._isDiscrete = complexType !== null ? isDiscrete : undefined;
    this._singleContinuousValueType = complexType !== null ? (isDiscrete ? null : singleContinuousValueType) : undefined;

    this.isSingleDimension = allDimNames.length === 1;

    this.firstDimension = this.depth > 0 ? this.levels[0].allDimensions[0] : null;
    this.lastDimension  = this.depth > 0 ? this.levels[this.depth - 1].lastDimension() : null;

    this.rootLabel = def.get(ka, 'rootLabel') || "";
    this.flatteningMode = def.get(ka, 'flatteningMode') || cdo.FlatteningMode.None;

    // ---

    // @see #ensure
    this._cacheKey = this._calcCacheKey();

    // NOTE: `levelKeys` already reflects `referencedExtensionComplexTypeNamesMap`.
    this.key = this._cacheKey + "##" + levelKeys.join('||');
})
.add(/** @lends cdo.GroupingSpec# */{

    _calcCacheKey: function(ka) {
        return [def.get(ka, 'flatteningMode') || this.flatteningMode,
                def.get(ka, 'rootLabel') || this.rootLabel]
               .join('#');
    },

    // region bind
    /**
     * Late binds a grouping specification to a complex type and, optionally, to a set of extension complex types.
     *
     * @param {!cdo.ComplexType} complexType A complex type.
     * @param {Object.<string, cdo.ComplexType>} [extensionComplexTypesMap] A map of extension complex types by name.
     */
    bind: function(complexType, extensionComplexTypesMap) {

        this.complexType = complexType || def.fail.argumentRequired('complexType');

        this._setExtensionComplexTypesMap(extensionComplexTypesMap);

        extensionComplexTypesMap = this.extensionComplexTypesMap;

        // Discrete if it contains:
        // 1. any dimensions that are marked as discrete or
        // 2. dimensions of mixed value types (not all dimensions have the same value type).

        var isDiscrete = false;
        var singleContinuousValueType = null;

        this.levels.forEach(function(levelSpec) {

            levelSpec.bind(complexType, extensionComplexTypesMap);

            if(!isDiscrete) {
                var allDimSpecs = levelSpec.allDimensions;
                var i = -1;
                var L = allDimSpecs.length;
                while(++i < L) {
                    var dimType = allDimSpecs[i].dimensionType;
                    if(dimType.isDiscrete) {
                        isDiscrete = true;
                        break;
                    }

                    if(singleContinuousValueType === null) {
                        singleContinuousValueType = dimType.valueType;
                    } else if(singleContinuousValueType !== dimType.valueType) {
                        isDiscrete = true;
                        break;
                    }
                }
            }
        });

        this._isDiscrete = isDiscrete;
        this._singleContinuousValueType = isDiscrete ? null : singleContinuousValueType;
    },

    get isBound() {
        return !!this.complexType;
    },

    _setExtensionComplexTypesMap: function(extensionComplexTypesMap) {

        if(this.hasExtensionComplexTypes) {
            if(!extensionComplexTypesMap) {
                var error = def.error.operationInvalid("Expects a map of extension types.");
                error.code = "need-extension-map";
                throw error;
            }

            this.extensionComplexTypesMap = def.copyProps(extensionComplexTypesMap, this.extensionComplexTypeNames);
        } else {
            this.extensionComplexTypesMap = null;
        }
    },
    // endregion

    // region Structure information
    get isNull() {
        return this.depth === 0;
    },

    get isSingleLevel() {
        return this.depth === 1;
    },

    get hasExtensionComplexTypes() {
        return !!this.extensionComplexTypeNames;
    },

    /**
     * Indicates that the data of the grouping should be taken as discrete.
     *
     * Typically, group by operations are only performed on discrete groupings.
     *
     * A grouping is considered discrete if at least one of its dimensions is marked discrete
     * or if all of its dimensions are continuous, but they don't all have the same value type.
     *
     * @return {boolean} `true` if the grouping is discrete; `false` otherwise.
     *
     * @see #singleContinuousValueType
     */
    isDiscrete: function() {
        return this._isDiscrete;
    },

    /**
     * Gets the value type that is shared by all of the dimensions of the grouping.
     *
     * Only defined for non-discrete grouping specifications.
     *
     * @type {?function}
     */
    get singleContinuousValueType() {
        return this._singleContinuousValueType;
    },

    /**
     * Gets the name of the only dimension of the grouping.
     * @type {string}
     * @readonly
     * @throws {Error} When the grouping does not contain exactly one dimension.
     */
    get singleDimensionName() {
        if(this.isSingleDimension) {
            return this.firstDimension.name;
        }
        throw def.error.operationInvalid("Expected grouping to contain exactly one dimension.");
    },

    /**
     * Obtains the dimension type of the only dimension of the grouping.
     *
     * Null if grouping is unbound.
     *
     * @type {cdo.DimensionType}
     * @readonly
     * @throws {Error} When the grouping does not contain exactly one dimension.
     */
    get singleDimensionType() {
        if(this.isSingleDimension) {
            return this.firstDimension.dimensionType;
        }
        throw def.error.operationInvalid("Grouping contains more than one dimension.");
    },

    /**
     * Obtains an enumerable of the contained dimension specifications.
     *
     * @type def.Query
     */
    dimensions: function() {
        return def.query(this.levels).prop('dimensions').selectMany();
    },

    allDimensions: function() {
        return def.query(this.levels).prop('allDimensions').selectMany();
    },

    extensionDimensions: function() {
        return def.query(this.levels).prop('extensionDimensions').selectMany();
    },

    /**
     * The names of the main dimensions of this grouping.
     *
     * @type {!string[]}
     */
    dimensionNames: function() {
        return this._dimNames;
    },

    /**
     * The names of all of the dimensions of this grouping.
     *
     * @type {!string[]}
     */
    get allDimensionNames() {
        return this._allDimNames;
    },

    /**
     * Obtains the dimension type of the first dimension spec., if any.
     * @type cdo.DimensionType
     *
     * @deprecated Use this.firstDimension.dimensionType or this.singleDimensionType
     */
    firstDimensionType: function() {
        var d = this.firstDimension;
        return d && d.dimensionType;
    },

    /**
     * Obtains the dimension name of the first dimension spec., if any.
     * @type string
     *
     * @deprecated Use this.firstDimension.name or this.singleDimensionName
     */
    firstDimensionName: function() {
        var dt = this.firstDimensionType();
        return dt && dt.name;
    },

    /**
     * Obtains the dimension value type of the first dimension spec., if any.
     * @type string
     *
     * @deprecated Use this.firstDimension.dimensionType.valueType or this.singleDimensionType.valueType
     */
    firstDimensionValueType: function() {
        var dt = this.firstDimensionType();
        return dt && dt.valueType;
    },

    /**
     * Obtains the dimension type of the last dimension spec., if any.
     * @type cdo.DimensionType
     *
     * @deprecated Use this.lastDimension.dimensionType or this.singleDimensionType
     */
    lastDimensionType: function() {
        var d = this.lastDimension;
        return d && d.dimensionType;
    },

    /**
     * Obtains the dimension name of the last dimension spec., if any.
     * @type string
     *
     * @deprecated Use this.lastDimension.name or this.singleDimensionName
     */
    lastDimensionName: function() {
        var dt = this.lastDimensionType();
        return dt && dt.name;
    },

    /**
     * Obtains the dimension value type of the last dimension spec., if any.
     * @type string
     *
     * @deprecated Use this.lastDimension.dimensionType.valueType or this.singleDimensionType.valueType
     */
    lastDimensionValueType: function() {
        var dt = this.lastDimensionType();
        return dt && dt.valueType;
    },
    // endregion

    // region Ensure
    /**
     * Obtains a version of this grouping specification
     * that conforms to the specified arguments.
     *
     * @param {string}  [ka.flatteningMode] The desired flattening mode.
     * @param {boolean} [ka.isSingleLevel=false] Indicates that the grouping should have only a single level.
     * If that is not the case, all grouping levels are collapsed into a single level containing all dimensions.
     *
     * @param {string}  [ka.rootLabel] The label of the resulting root node.
     *
     * @type cdo.GroupingSpec
     */
    ensure: function(ka) {
        var result;
        if(ka) {
            var cacheKey = this._calcCacheKey(ka);
            if(cacheKey !== this._cacheKey) {
                var cache = def.lazy(this, '_groupingCache');
                result = def.getOwn(cache, cacheKey);
                if(!result) result = cache[cacheKey] = this._ensure(ka);
            }
        }

        return result || this;
    },

    _ensure: function(ka) {
        return new cdo.GroupingSpec(
            this.levels, // Share Levels
            this.complexType,
            this.extensionComplexTypesMap,
            {
                flatteningMode: def.get(ka, 'flatteningMode') || this.flatteningMode,
                rootLabel:      def.get(ka, 'rootLabel')      || this.rootLabel
            });
    },

    /**
     * Obtains a single-level version of this grouping specification.
     *
     * @return {!cdo.GroupingSpec} A single-level grouping specification.
     */
    toSingleLevel: function() {

        if(this.isSingleLevel) {
            return this;
        }

        var allDimSpecs = this.allDimensions().array();

        var singleLevelSpec = new cdo.GroupingLevelSpec(allDimSpecs, this.complexType, this.extensionComplexTypesMap);

        return new cdo.GroupingSpec(
            [singleLevelSpec],
            this.complexType,
            this.extensionComplexTypesMap,
            {
                flatteningMode: cdo.FlatteningMode.SingleLevel,
                rootLabel:      this.rootLabel
            });
    },

    /**
     * Obtains a reversed version of this grouping specification,
     * where every contained dimension has a negated `isReversed` property value.
     *
     * @return {!cdo.GroupingSpec} The reversed grouping specification.
     */
    reverse: function() {

        var reversedLevelSpecs = this.levels.map(function(levelSpec) { return levelSpec.reverse(); });

        return new cdo.GroupingSpec(
            reversedLevelSpecs,
            this.complexType,
            this.extensionComplexTypesMap,
            {
                flatteningMode: this.flatteningMode,
                rootLabel:      this.rootLabel
            });
    },
    // endregion

    view: function(complex) {
        // Datums never have extension atoms in their atoms map.
        var dimNames = (complex instanceof cdo.Datum)
            ? this.dimensionNames()
            : this.allDimensionNames;

        return complex.view(dimNames);
    },

    toString: function() {
        return this.levels.map(String).join(', ');
    }
});

/**
 * A grouping level describes the structure of one level of a hierarchical grouping operation.
 *
 * A grouping level corresponds to one level of the data tree that results from a grouping operation.
 *
 * The dimensions of the grouping level determine the fixed atoms that each data of that level will have.
 *
 * Essentially, a grouping level contains an array of dimension specifications, in {@link #dimensions}.
 *
 * @name cdo.GroupingLevelSpec
 * @class
 */
def.type('cdo.GroupingLevelSpec')
.init(function(allDimSpecs) {

    // Collect keys, names and dimensions.
    var allDimKeys = [];
    var allDimNames = [];
    var dimNames = [];
    var dimensions = [];
    var extDimensions = null;

    this.dimensions = dimensions;

    this.allDimensions = def.query(allDimSpecs)
       .select(function(dimSpec) {

           allDimKeys.push(dimSpec.key);

           if(!dimSpec.dataSetName) {
               allDimNames.push(dimSpec.name);
               dimNames.push(dimSpec.name);
               dimensions.push(dimSpec);
           } else {
               allDimNames.push(dimSpec.fullName);

               if(extDimensions === null) extDimensions = [];

               extDimensions.push(dimSpec);
           }

           return dimSpec;
       })
       .array();

    this.extensionDimensions = extDimensions;

    // Can contain duplicate names.
    this._dimNames = dimNames;
    this._allDimNames = allDimNames;

    // Set by #_setAccAllDimNames.
    this._accDimNames = null;

    this.depth = this.allDimensions.length;

    this.key = allDimKeys.join(',');
})
.add( /** @lends cdo.GroupingLevelSpec# */{

    _setAccAllDimNames: function(accDimNames) {
        this._accDimNames = accDimNames;
    },

    // Accumulated all dimensions names.
    accAllDimensionNames: function() {
        return this._accDimNames;
    },

    dimensionNames: function() {
        return this._dimNames;
    },

    /**
     * Gets an array of the names of all dimensions, including extension dimensions.
     *
     * For main dimensions, the included name is the local {@link cdo.DimensionSpec#name},
     * while for extension dimensions, it is the full name {@link cdo.DimensionSpec#fullName}.
     * This is consistent with the naming used in {@link cdo.Data#atoms}.
     *
     * @type {string[]}
     * @readOnly
     */
    get allDimensionNames() {
        return this._allDimNames;
    },

    lastDimension: function() {
        return this.allDimensions[this.depth - 1];
    },

    bind: function(complexType, extensionComplexTypesMap) {

        this.allDimensions.forEach(function(dimSpec) {
            dimSpec.bindComplexType(complexType, extensionComplexTypesMap);
        });
    },

    compareNodesMain: function(nodeA, nodeB) {
        var dims = this.dimensions;
        var D = dims.length;
        var i = -1;
        var result;

        while(++i < D)
            if((result = dims[i].compareDatums(nodeA.firstDatum, nodeB.firstDatum)) !== 0)
                return result;
        return 0;
    },

    compareNodesWithExtension: function(nodeA, nodeB) {
        var allDimensions = this.allDimensions;
        var D = allDimensions.length;
        var i = -1;
        var result;
        var dimSpec;
        var dataSetName;
        var datumA;
        var datumB;

        while(++i < D) {
            if((dataSetName = (dimSpec = allDimensions[i]).dataSetName) !== null) {
                datumA = nodeA.extensionDatumsMap[dataSetName][0];
                datumB = nodeB.extensionDatumsMap[dataSetName][0];
            } else {
                datumA = nodeA.firstDatum;
                datumB = nodeB.firstDatum;
            }

            if((result = dimSpec.compareDatums(datumA, datumB)) !== 0) {
                return result;
            }
        }
        return 0;
    },

    buildKeyMain: function(datum) {
        return cdo.Complex.compositeKey(datum, this._dimNames);
    },

    buildKeyWithExtension: function(datum, extensionDatumsMap) {
        var key = '';

        var allDimensions = this.allDimensions;
        var D = allDimensions.length;
        var i = -1;

        var keySep = datum.owner.keySep;
        var datoms = datum.atoms;
        var dimSpec;

        while(++i < D) {
            var atomKey = (dimSpec = allDimensions[i]).dataSetName !== null
                ? extensionDatumsMap[dimSpec.dataSetName][0].atoms[dimSpec.name].key
                : datoms[dimSpec.name].key;

            if(!i) {
                key = atomKey;
            } else {
                key += (keySep + atomKey);
            }
        }

        return key;
    },

    buildGroupNodeMain: function(datum) {

        var dimNames = this._dimNames;

        return {
            atoms: def.copyProps(datum.atoms, dimNames),
            dimNames: dimNames
        };
    },

    buildGroupNodeWithExtension: function(datum, extensionDatumsMap) {
        var atoms = {};
        var allDimensions = this.allDimensions;
        var D = allDimensions.length;
        var datoms = datum.atoms;
        var i = -1;
        var dimSpec;

        while(++i < D) {
            if((dimSpec = allDimensions[i]).dataSetName !== null) {
                atoms[dimSpec.fullName] = extensionDatumsMap[dimSpec.dataSetName][0].atoms[dimSpec.name];
            } else {
                atoms[dimSpec.name] = datoms[dimSpec.name];
            }
        }

        return {
            atoms: atoms,
            dimNames: this._allDimNames
        };
    },

    /**
     * Obtains a reversed version of this grouping level specification,
     * where every contained dimension has a negated `isReversed` property value.
     *
     * @return {!cdo.GroupingLevelSpec} The reversed grouping level specification.
     */
    reverse: function() {
        var reversedDimSpecs = this.allDimensions.map(function(dimSpec) { return dimSpec.reverse(); });

        return new cdo.GroupingLevelSpec(reversedDimSpecs, this.complexType, this.extensionComplexTypesMap);
    },

    toString: function() {
        return def.query(this.allDimensions).select(String).array().join('|');
    }
});

/**
 * @name cdo.GroupingDimensionSpec
 * @class
 */
def.type('cdo.GroupingDimensionSpec')
.init(function(fullName, isReversed, dimensionType) {

    // e.g. "valueRole.dim"
    this.fullName = fullName;

    // Parse name into dataSetName and name.
    var m = /^(?:(.+?)\.)?(.+)$/.exec(fullName);

    // main dataSet has name null
    this.dataSetName = (m && m[1]) || null; // e.g. "valueRole"
    this.name = m ? m[2] : fullName;        // e.g. "dim"

    this.isReversed = !!isReversed;

    this.key = fullName + ":" + (isReversed ? '0' : '1');

    this.dimensionType = null;

    if(dimensionType) this.bind(dimensionType);
})
.add( /** @lends cdo.GroupingDimensionSpec */ {
    /**
     * Late binds a dimension specification to a complex type.
     *
     * @param {!cdo.ComplexType} complexType - A complex type.
     * @param {Object.<string, cdo.ComplexType>} [extensionComplexTypesMap] A map of extension complex types by name.
     *
     * @return {!cdo.GroupingDimensionSpec} `this` instance.
     */
    bindComplexType: function(complexType, extensionComplexTypesMap) {

        complexType || def.fail.argumentRequired('complexType');

        var dimComplexType;
        if(this.dataSetName) {
            var extensionComplexType = def.get(extensionComplexTypesMap, this.dataSetName);
            if(!extensionComplexType)
                throw def.error.operationInvalid("The data set name '{0}' of dimension '{1}' is not defined.", [
                    this.dataSetName,
                    this.fullName
                ]);

            dimComplexType = extensionComplexType;
        } else {
            dimComplexType = complexType;
        }

        this.bind(dimComplexType.dimensions(this.name));

        return this;
    },

    /**
     * Late binds a dimension specification to its dimension type.
     *
     * @param {!cdo.DimensionType} dimensionType - A dimension type.
     *
     * @return {!cdo.GroupingDimensionSpec} `this` instance.
     */
    bind: function(dimensionType) {

        this.dimensionType = dimensionType || def.fail.argumentRequired('dimensionType');

        if(dimensionType.isComparable) {

            var mainAtomComparer = dimensionType.atomComparer(this.isReversed);
            var dimName = this.name;

            this.compareDatums = function(datumA, datumB) {
                return mainAtomComparer(datumA.atoms[dimName], datumB.atoms[dimName]);
            };
        } else if(this.isReversed) {

            this.compareDatums = function(datumA, datumB) {
                return datumB.id - datumA.id;
            };
        } else {

            this.compareDatums = function(datumA, datumB) {
                return datumA.id - datumB.id;
            };
        }

        return this;
    },

    compareDatums: function(datumA, datumB) {
        throw def.error.operationInvalid("Not Bound.");
    },

    /**
     * Obtains a reversed version of this grouping dimensions specification,
     * where its `isReversed` property value has been negated.
     *
     * @return {!cdo.GroupingDimensionSpec} The reversed grouping dimension specification.
     */
    reverse: function() {
        return new cdo.GroupingDimensionSpec(this.fullName, !this.isReversed, this.dimensionType);
    },

    toString: function() {
        return this.fullName +
            (this.dimensionType ? (' ("' + this.dimensionType.label + '")') : '') +
            (this.isReversed    ? ' desc'                                   : '');
    }
});

/**
 * Parses a grouping specification string.
 *
 * @param {string|string[]} [specText] The grouping specification text,
 * or array of grouping specification level text.
 * When unspecified, a null grouping is returned.
 *
 * <p>
 * An example:
 * </p>
 * <pre>
 * "series1 asc, series2 desc, category"
 * </pre>
 * <p>
 * The following will group all the 'series' in one level and the 'category' in another:
 * </p>
 * <pre>
 * "series1 asc|series2 desc, category"
 * </pre>
 *
 * @param {cdo.ComplexType} [complexType] The main complex type against which to resolve dimension names.
 * @param {Object.<string, cdo.ComplexType>} [extensionComplexTypesMap] A map of extension complex types by name.
 *
 * @return {!cdo.GroupingSpec} The new grouping specification.
 */
cdo.GroupingSpec.parse = function(specText, complexType, extensionComplexTypesMap) {

    var levelSpecs = null;

    if(specText) {
        var levels = def.string.is(specText)
            ? specText.split(/\s*,\s*/)
            : def.array.as(specText);

        levelSpecs = def.query(levels)
            .select(function(levelText) {
                var dimSpecs = groupSpec_parseGroupingLevel(levelText, complexType, extensionComplexTypesMap);

                return new cdo.GroupingLevelSpec(dimSpecs, complexType, extensionComplexTypesMap);
            });
    }

    return new cdo.GroupingSpec(levelSpecs, complexType, extensionComplexTypesMap);
};

var groupSpec_matchDimSpec = /^\s*(.+?)(?:\s+(asc|desc))?\s*$/i;

/**
 * @private
 * @static
 */
function groupSpec_parseGroupingLevel(groupLevelText, complexType, extensionComplexTypesMap) {

    def.string.is(groupLevelText) || def.fail.argumentInvalid('groupLevelText', "Invalid grouping specification.");

    return def.query(groupLevelText.split(/\s*\|\s*/))
       .where(def.truthy)
       .select(function(dimSpecText) {
            var match = groupSpec_matchDimSpec.exec(dimSpecText) ||
                            def.fail.argumentInvalid(
                                'groupLevelText',
                                "Invalid grouping level syntax '{0}'.",
                                [dimSpecText]);
            var name = match[1];
            var order = (match[2] || '').toLowerCase();
            var isReversed = order === 'desc';

            var dimSpec = new cdo.GroupingDimensionSpec(name, isReversed);
            if(complexType) {
                dimSpec.bindComplexType(complexType, extensionComplexTypesMap);
            }
            return dimSpec;
        });
}
