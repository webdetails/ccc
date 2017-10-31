/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes an axis.
 *
 * @name pvc.visual.Axis
 *
 * @class Represents an axis for a role in a chart.
 *
 * @extends pvc.visual.OptionsBase
 *
 * @property {pvc.visual.Role} role The associated visual role.
 * @property {pv.Scale} scale The associated scale.
 *
 * @constructor
 * @param {pvc.BaseChart} chart The associated chart.
 * @param {string} type The type of the axis.
 * @param {number} [index=0] The index of the axis within its type.
 * @param {object} [keyArgs] Keyword arguments.
 */
var pvc_Axis =
def('pvc.visual.Axis', pvc.visual.OptionsBase.extend({
    init: function(chart, type, index, keyArgs) {

        this.base(chart, type, index, keyArgs);

        this.dataCells = null;
        this.dataCell = null;
        this.role = null;

        this._dataCellsByKey = null;
        this._dataCellsScaleInfoByKey = null;

        this._domainData   = null;
        this._domainItems  = null;
        this._domainValues = null;

        this.scaleType = null;

        this._state = {};

        if(keyArgs && keyArgs.state) {
            def.copy(this._state, keyArgs.state);
        }

        // Fills #axisIndex and #typeIndex
        chart._addAxis(this);
    },

    methods: /** @lends pvc.visual.Axis# */{

        /** @override */
        _buildOptionId: function() {
            return this.id + "Axis";
        },

        // region Bind
        /**
         * Binds the axis to a set of data cells.
         *
         * Only after this operation is performed will options with a scale type prefix be found.
         *
         * @param {pvc.visual.DataCell|pvc.visual.DataCell[]} dataCells - The associated data cell(s).
         *
         * @return {pvc.visual.Axis} This instance.
         *
         * @throws {Error} When the axis is already bound.
         * @throws {Error} When the given data cells are not compatible with the axis or
         * are incompatible between themselves.
         */
        bind: function(dataCells) {

            dataCells || def.fail.argumentRequired('dataCells');
            !this.dataCells || def.fail.operationInvalid('Axis is already bound.');

            this.dataCells = def.array.to(dataCells);

            this._dataCellsByKey = def.query(this.dataCells).uniqueIndex(function(dc) { return dc.key; });

            this.dataCell = this.dataCells[0];
            this.role = this.dataCell && this.dataCell.role;

            this.scaleType = axis_groupingScaleType(this.role.grouping);

            this._conciliateVisualRoles();

            return this;
        },

        isBound: function() {
            return !!this.role;
        },

        __assertBound: function() {
            this.isBound() || def.fail.operationInvalid('Axis is not bound.');
        },

        isDiscrete: function() {
            return !!this.role && this.role.isDiscrete();
        },

        _conciliateVisualRoles: function() {
            var L = this.dataCells.length;
            if(L > 1) {

                var grouping = this._getBoundRoleGrouping(this.role);

                var createError = function(msg, args) {
                    return def.error.operationInvalid(def.format(msg, args));
                };

                var otherRole,
                    otherGrouping,
                    possibleFlatteningModes,
                    flatteningMode,
                    otherFlatteningMode,
                    rootLabel,
                    dimNamesKey,
                    i;

                if(this.scaleType === 'discrete') {
                    // Same sequence of dimension names +
                    // same flattening mode (conciliate-able) +
                    // same rootLabel (conciliate-able)

                    // Discover possible flattening modes shared by all visual roles in the axis
                    possibleFlatteningModes = this.role.flatteningModes;

                    // Choose the first non-empty root label.
                    rootLabel = this.role.rootLabel;

                    dimNamesKey = String(this.role.grouping.dimensionNames());

                    for(i = 1; (i < L) && possibleFlatteningModes; i++) {

                        otherRole = this.dataCells[i].role;

                        possibleFlatteningModes &= otherRole.flatteningModes;

                        if(!rootLabel) {
                            rootLabel = otherRole.rootLabel;
                        }

                        otherGrouping = this._getBoundRoleGrouping(otherRole);

                        // NOTE: this notion of compatibility ignores how dimensions are organized into levels.
                        // Is it because only the dimensions of leaf nodes matter?
                        // When creating data items, only the grouping of the first role is used,
                        // so that if the groupings of the other roles have a different structure, it is ignored...
                        // Should we assert that these need to have the same levels/dimensions structure?
                        if(dimNamesKey !== String(otherGrouping.dimensionNames())) {
                            throw createError(
                                "The visual roles '{0}', on axis '{1}', assumed discrete, should be bound to the same dimension list.", [
                                    [this.role.prettyId(), otherRole.prettyId()].join("', '"),
                                    this.id
                                ]);
                        }
                    }

                    // No common flattening modes possible for every visual role.
                    if(possibleFlatteningModes === cdo.FlatteningMode.None) {
                        throw createError("The visual roles on axis '{0}', assumed discrete, do not share a possible flattening mode.", [this.id]);
                    }

                    // Find the flattening mode to use for all.
                    flatteningMode = 0;
                    for(i = 0; i < L ; i++) {
                        otherRole = this.dataCells[i].role;
                        otherFlatteningMode = otherRole.flatteningMode;

                        // `>` practical way of making DfsPre/Post being chosen over SingleLevel (and None)
                        if((otherFlatteningMode & possibleFlatteningModes) && (otherFlatteningMode > flatteningMode)) {
                            flatteningMode = otherFlatteningMode;
                        }
                    }

                    // Default to the flattening mode that corresponds to the
                    // first (least-significant) set bit in possibleFlatteningModes.
                    if(!flatteningMode) {
                        flatteningMode = possibleFlatteningModes & (-possibleFlatteningModes);
                    }

                    // Update flattening mode and root label of all roles.
                    for(i = 0; i < L ; i++) {
                        otherRole = this.dataCells[i].role;
                        otherRole.rootLabel = rootLabel;
                        otherRole.flatteningMode = flatteningMode;

                        // This prevents any other flattening mode being chosen by other axis that the role may be in.
                        otherRole.flatteningModes = flatteningMode;
                    }
                } else {
                    if(!grouping.firstDimension.dimensionType.isComparable) {
                        throw createError("The visual roles on axis '{0}', assumed continuous, should have 'comparable' groupings.", [this.id]);
                    }

                    for(i = 1; i < L ; i++) {
                        otherRole = this.dataCells[i].role;
                        otherGrouping = this._getBoundRoleGrouping(otherRole);
                        if(this.scaleType !== axis_groupingScaleType(otherGrouping)) {
                            throw createError("The visual roles on axis '{0}', assumed continuous, should have scales of the same type.", [this.id]);
                        }

                        if(this.role.isNormalized !== otherRole.isNormalized) {
                            throw createError("The visual roles on axis '{0}', assumed normalized, should be of the same type.", [this.id]);
                        }
                    }
                }
            }
        },

        _getBoundRoleGrouping: function(role) {
            var grouping = role.grouping;
            if(!grouping || !grouping.isBound) {
                throw def.error.operationInvalid("Axis' role '{0}' is unbound.", [role.name]);
            }

            return grouping;
        },
        // endregion

        // region State
        // Returns state object
        getState: function() {
            return this._buildState();
        },

        // @virtual
        _buildState: function() {
            return {};
        },
        // endregion

        // region dataCellScaleInfo
        setDataCellScaleInfo: function(dataCell, scaleInfo) {
            if(this._dataCellsByKey[dataCell.key] !== dataCell) {
                throw def.error.argumentInvalid("dataCell", "Not present in this axis.");
            }

            def.lazy(this, '_dataCellsScaleInfoByKey')[dataCell.key] = scaleInfo;
        },

        getDataCellScaleInfo: function(dataCell) {
            return def.getOwn(this._dataCellsScaleInfoByKey, dataCell.key);
        },
        // endregion

        // region domainData
        /**
         * Indicates if the axis' domain data only includes visible datums.
         *
         * The default implementation always returns `true`.
         *
         * @return {boolean}
         *
         * @overridable
         */
        domainVisibleOnly: def.retTrue,

        /**
         * Indicates if the axis' domain data set should ignore null datums.
         *
         * The default implementation always returns `false`.
         *
         * @return {boolean}
         *
         * @overridable
         */
        domainIgnoreNulls: def.retFalse,

        /**
         * Indicates if the axis' domain data set should be reversed.
         *
         * The default implementation always returns `false`.
         *
         * @return {boolean}
         *
         * @overridable
         */
        domainReverse: def.retFalse,

        /**
         * Gets the grouping method used to obtain the axis' domain data from its visual role,
         * given a base data and keyword arguments.
         *
         * The default implementation always returns `flatten`.
         *
         * Other implementations can return 'select' instead.
         *
         * @return {string} The visual role method name.
         *
         * @overridable
         */
        domainGroupOperator: def.fun.constant('flatten'),

        /**
         * Gets the name of the property of each domain data item that
         * gets the value that constitutes the scale domain of the axis.
         *
         * The default implementation always returns `value`.
         *
         * Other implementations can return 'key' or 'absKey' instead.
         *
         * @overridable
         */
        domainItemValueProp: def.fun.constant('value'),

        /**
         * @overridable
         */
        _selectDomainItems: function(domainData) {
            return domainData.children();
        },

        domainData: function() {

            this.__assertBound();

            var domainData = this._domainData;
            if(!domainData) {

                var dataPartValues = def.query(this.dataCells)
                        .select(def.propGet('dataPartValue'))
                        .distinct()
                        .array();

                var partsData = this.chart.partData(dataPartValues);

                this._domainData = domainData = this._createDomainData(partsData);
            }

            return domainData;
        },

        // TODO: not used?
        /** @deprecated */
        domainCellData: function(cellIndex) {

            this.__assertBound();

            var dataCells = this.dataCells;
            if(dataCells.length === 1) {
                return this.domainData();
            }

            var dataCell = dataCells[cellIndex];
            var partData = this.chart.partData(dataCell.dataPartValue);

            return this._createDomainData(partData);
        },

        // TODO: not used?
        /** @deprecated */
        domainCellItems: function(cellDataOrIndex) {

            this.__assertBound();

            var dataCells = this.dataCells;
            if(dataCells.length === 1) {
                return this.domainItems();
            }

            var cellData = def.number.is(cellDataOrIndex)
                ? this.domainCellData(/*cellIndex*/cellDataOrIndex)
                : cellDataOrIndex;

            return this._selectDomainItems(cellData).array();
        },

        domainValues: function() {
            var domainValues = this._domainValues;
            if(!domainValues) domainValues = (this._calcDomainItems(), this._domainValues);
            return domainValues;
        },

        domainItems: function() {
            var domainItems = this._domainItems;
            if(!domainItems)  domainItems = (this._calcDomainItems(), this._domainItems);
            return domainItems;
        },

        domainItemCount: function() {
            return this.domainItems().length;
        },

        domainItemValue: function(itemData) {
            return def.nullyTo(itemData[this.domainItemValueProp()], '');
        },

        /**
         * Gets the map of bound dimensions data sets, indexed by data set name,
         * or `null`, if none.
         *
         * This data sets map should be used in group by operations using this axis's role's grouping.
         *
         * @type {Object.<string,cdo.Data>}
         * @readOnly
         */
        get boundDimensionsDataSetsMap() {

            var dataSetsMap = null;

            // If the axis has multiple data cells, their roles must, nonetheless, be compatible -
            // have the same dimensions and flattening mode.
            //
            // If this axis is discrete, and one of these dimensions is a "measure discriminator dimension",
            // then it must be the case that all plots with data cells on this axis share a measure visual role
            // with the same name (for example, a visual role named "value", whose discriminator dimension is
            // called "valueRole.dim").
            //
            // If
            // "plotA.value" visual role is bound to "Sales" and "Qty" and
            // "plotB.value" is bound to "UnitPrice",
            // then the axis should provide a "valueRole" bound dimensions data set containing exactly:
            // "Sales", "Qty", "UnitPrice".
            //
            // Because we know that the only shared discrete visual role that has an axis is "category",
            // and that axis sharing, in this case, only happens when using overlapped plots,
            // and that all overlapped plots share the same category axis,
            // then we know that this set of dimensions is the set of all dimensions.
            // Thus, the chart-level data set of bound dimensions is suitable.
            //
            // If this stops being the case, we'll need to create a filtered, linked data set,
            // like those of visual roles.

            if(this.isBound() && this.isDiscrete()) {
                var dataSetNames = this.role.grouping.extensionComplexTypeNames;
                if(dataSetNames) {
                    var chartLevelBoundDimensionsDataSetsMap = this.chart.boundDimensionsDataSetsMap;

                    dataSetsMap = Object.create(null);

                    dataSetNames.forEach(function(dataSetName) {
                        dataSetsMap[dataSetName] = chartLevelBoundDimensionsDataSetsMap[dataSetName];
                    });
                }
            }

            return dataSetsMap;
        },

        /**
         * Creates the data set from which domain data items are selected,
         * the values of which constitute the scale's domain.
         *
         * @param {!cdo.Data} baseData - The base data set.
         *
         * @return {!cdo.Data} The domain data set.
         *
         * @protected
         * @overridable
         *
         * @see #_selectDomainItems
         */
        _createDomainData: function(baseData) {

            this.__assertBound();

            var keyArgs = {
                visible: this.domainVisibleOnly() ? true : null,
                isNull:  this.chart.options.ignoreNulls || this.domainIgnoreNulls() ? false : null,
                reverse: this.domainReverse(),
                extensionDataSetsMap: this.boundDimensionsDataSetsMap
            };

            return this.role[this.domainGroupOperator()](baseData, keyArgs);
        },

        _calcDomainItems: function() {

            var domainData = this.domainData();

            var domainItems = [];
            var domainValues = [];
            var domainValuesSet = Object.create(null);
            var hasOwn = def.hasOwnProp;

            this._selectDomainItems(domainData).each(function(itemData) {

                var itemValue = this.domainItemValue(itemData);

                if(!(hasOwn.call(domainValuesSet, itemValue))) {
                    domainValuesSet[itemValue] = 1;

                    domainValues.push(itemValue);
                    domainItems .push(itemData);
                }
            }, this);

            this._domainItems = domainItems;
            this._domainValues = domainValues;
        },
        // endregion

        // region Scale

        // should null values be converted to zero or to the minimum value in what scale is concerned?
        // 'null', 'zero', 'min'
        /** @overridable */scaleTreatsNullAs:   def.fun.constant('null'),
        /** @overridable */scaleNullRangeValue: def.fun.constant(null),
        /** @overridable */scaleUsesAbs:        def.retFalse,
        /** @overridable */scaleSumNormalized:  def.retFalse,

        setScale: function(scale, noWrap) {
            /*jshint expr:true */
            this.isBound() || def.fail.operationInvalid('Axis is not bound.');

            this.scale = scale ? (noWrap ? scale : this._wrapScale(scale)) : null;

            return this;
        },

        _wrapScale: function(scale) {
            scale.type = this.scaleType;

            var by;

            // Applying 'scaleNullRangeValue' to discrete scales
            // would cause problems in discrete color scales,
            // where we want null to be matched to the first color of the color scale
            // (typically happens when there is only a null series).
            if(scale.type !== 'discrete') {
                var useAbs = this.scaleUsesAbs(),
                    nullAs = this.scaleTreatsNullAs();
                if(nullAs && nullAs !== 'null') {
                    var nullIsMin = nullAs === 'min'; // Otherwise 'zero'
                    // Below, the min valow is evaluated each time on purpose,
                    // because otherwise we would have to rewrap when the domain changes.
                    // It does change, for example, on MultiChart scale coordination.
                    if(useAbs)
                        by = function(v) {
                            return scale(v == null ? (nullIsMin ? scale.domain()[0] : 0) : (v < 0 ? -v : v));
                        };
                    else
                        by = function(v) {
                            return scale(v == null ? (nullIsMin ? scale.domain()[0] : 0) : v);
                        };
                } else {
                    var nullRangeValue = this.scaleNullRangeValue();
                    if(useAbs)
                        by = function(v) {
                            return v == null ? nullRangeValue : scale(v < 0 ? -v : v);
                        };
                    else
                        by = function(v) {
                            return v == null ? nullRangeValue : scale(v);
                        };
                }
            } else {
                // ensure null -> ""
                by = function(v) {
                    return scale(v == null ? '' : v);
                };
            }

            // don't overwrite scale with by! it would cause infinite recursion...
            return def.copy(by, scale);
        },

        /**
         * Obtains a scene-scale function to compute values of this axis' main role.
         *
         * @param {object} [keyArgs] Keyword arguments object.
         * @param {string} [keyArgs.sceneVarName] The local scene variable name by which this axis's role is known. Defaults to the role's name.
         * @param {boolean} [keyArgs.nullToZero=true] Indicates that null values should be converted to zero before applying the scale.
         * @type function
         */
        sceneScale: function(keyArgs) {
            var varName  = def.get(keyArgs, 'sceneVarName') || this.role.name,
                grouping = this.role.grouping,
                scale = this.scale;

            // TODO: isn't this redundant with the code in _wrapScale??
            if(grouping.singleContinuousValueType === Number) {

                var nullToZero = def.get(keyArgs, 'nullToZero', true);

                var by = function(scene) {
                    var value = scene.vars[varName].value;
                    if(value == null) {
                        if(!nullToZero) return value;
                        value = 0;
                    }
                    return scale(value);
                };
                def.copy(by, scale);

                return by;
            }

            return scale.by1(function(scene) {
                return scene.vars[varName].value;
            });
        }
        // endregion
    }
}));

function axis_groupingScaleType(grouping) {
    return grouping.isDiscrete()                       ? 'discrete'   :
           grouping.singleContinuousValueType === Date ? 'timeSeries' :
           'numeric';
}
