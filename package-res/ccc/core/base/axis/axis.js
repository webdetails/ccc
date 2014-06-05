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
def
.type('pvc.visual.Axis', pvc.visual.OptionsBase)
.init(function(chart, type, index, keyArgs) {

    this.base(chart, type, index, keyArgs);

    // Fills #axisIndex and #typeIndex
    chart._addAxis(this);
})
.add(/** @lends pvc.visual.Axis# */{

    /** @override */
    _buildOptionId: function() {
        return this.id + "Axis";
    },
    
    // should null values be converted to zero or to the minimum value in what scale is concerned?
    // 'null', 'zero', 'min'
    /** @virtual */scaleTreatsNullAs:   function() { return 'null'; },
    /** @virtual */scaleNullRangeValue: function() { return null;   },
    /** @virtual */scaleUsesAbs:        def.retFalse,
    /** @cirtual */scaleSumNormalized:  def.retFalse,

    /** @virtual */domainVisibleOnly:   def.retTrue,
    /** @virtual */domainIgnoreNulls:   def.retFalse,
    /** @virtual */domainGroupOperator: function() { return 'flatten'; },
    /** @virtual */domainItemValueProp: function() { return 'value'; },

    /**
     * Binds the axis to a set of data cells.
     *
     * <p>
     * Only after this operation is performed will
     * options with a scale type prefix be found.
     * </p>
     *
     * @param {object|object[]} dataCells The associated data cells.
     * @type pvc.visual.Axis
     */
    bind: function(dataCells) {
        /*jshint expr:true */
        var me = this;
        dataCells || def.fail.argumentRequired('dataCells');
        !me.dataCells || def.fail.operationInvalid('Axis is already bound.');

        me.dataCells = def.array.to(dataCells);
        me._dataCellsByKey = def.query(me.dataCells).uniqueIndex(function(dc) { return dc.key; });
        me.dataCell  = me.dataCells[0];
        me.role      = me.dataCell && me.dataCell.role;
        me.scaleType = axis_groupingScaleType(me.role.grouping);
        me._domainData   = null;
        me._domainValues = null;
        me._domainItems  = null;

        // TODO: todo what??

        me._conciliateVisualRoles();

        return this;
    },

    setDataCellScaleInfo: function(dataCell, scaleInfo) {
        if(this._dataCellsByKey[dataCell.key] !== dataCell)
            throw def.error.argumentInvalid("dataCell", "Not present in this axis.");

        def.lazy(this, '_dataCellsScaleInfoByKey')[dataCell.key] = scaleInfo;
    },

    getDataCellScaleInfo: function(dataCell) {
        return def.getOwn(this._dataCellsScaleInfoByKey, dataCell.key);
    },

    domainData: function() {
        this.isBound() || def.fail.operationInvalid('Axis is not bound.');

        var domainData = this._domainData;
        if(!domainData) {
            var dataPartValues = this.dataCells.map(dataCell_dataPartValue),
                partsData = this.chart.partData(dataPartValues);
            this._domainData = domainData = this._createDomainData(partsData);
        }
        return domainData;
    },

    domainCellData: function(cellIndex) {
        var dataCells = this.dataCells;
        if(dataCells.length === 1) return this.domainData();

        var dataCell = dataCells[cellIndex],
            partData = this.chart.partData(dataCell.dataPartValue);
        return this._createDomainData(partData);
    },

    domainCellItems: function(cellDataOrIndex) {
        var dataCells = this.dataCells;
        if(dataCells.length === 1) return this.domainItems();

        var cellData = def.number.is(cellDataOrIndex)
            ? this.domainCellData(/*cellIndex*/cellDataOrIndex)
            : cellDataOrIndex;

        return this._selectDomainItems(cellData).array();
    },

    domainValues: function() {
        // For discrete axes
        var domainValues = this._domainValues;
        if(!domainValues) domainValues = (this._calcDomainItems(), this._domainValues);
        return domainValues;
    },

    domainItems: function() {
        var domainItems = this._domainItems;
        if(!domainItems)  domainItems = (this._calcDomainItems(), this._domainItems);
        return domainItems;
    },

    domainItemValue: function(itemData) {
        return def.nullyTo(itemData[this.domainItemValueProp()], '');
    },

    isDiscrete: function() { return !!this.role && this.role.isDiscrete(); },

    isBound:    function() { return !!this.role; },

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
            grouping = this.role.grouping;

        // TODO: isn't this redundant with the code in _wrapScale??
        if(grouping.lastDimensionValueType() === Number) {
            var scale = this.scale,
                nullToZero = def.get(keyArgs, 'nullToZero', true);

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

        return this.scale.by1(function(scene) {
            return scene.vars[varName].value;
        });
    },

    _conciliateVisualRoles: function() {
        var L = this.dataCells.length;
        if(L > 1) {
            var me = this,
                grouping = this._getBoundRoleGrouping(this.role),
                otherRole,
                otherGrouping,
                possibleTraversalModes,
                traversalMode,
                otherTravMode,
                rootLabel,
                dimNamesKey,
                i;

            function createError(msg, args) {
                return def.error.operationInvalid(def.format(msg, args));
            }

            if(this.scaleType === 'discrete') {
                // Same sequence of dimension names +
                // same traversal mode (conciliate-able) +
                // same rootLabel (conciliate-able)

                // Discover possible traversal modes shared by all visual roles in the axis
                possibleTraversalModes = this.role.traversalModes;
                // Choose the first non-empty root label.
                rootLabel = this.role.rootLabel;
                dimNamesKey = String(this.role.grouping.dimensionNames());
                for(i = 1; i < L && possibleTraversalModes; i++) {
                    otherRole = this.dataCells[i].role;
                    possibleTraversalModes &= otherRole.traversalModes;
                    if(!rootLabel) rootLabel = otherRole.rootLabel;

                    otherGrouping = this._getBoundRoleGrouping(otherRole);
                    if(dimNamesKey !== String(otherGrouping.dimensionNames()))
                        throw createError(
                            "The visual roles '{0}', on axis '{1}', assumed discrete, should be bound to the same dimension list.", [
                                [this.role.prettyId(), otherRole.prettyId()].join("', '"),
                                this.id
                            ]);
                }

                // No common traversal modes possible for every visual role
                if(!possibleTraversalModes)
                    throw createError("The visual roles on axis '{0}', assumed discrete, do not share a possible traversal mode.", [this.id]);

                // Find the traversal mode to use for all.
                traversalMode = 0;
                for(i = 0; i < L ; i++) {
                    otherRole = this.dataCells[i].role;
                    otherTravMode = otherRole.traversalMode;
                    // `>` practical way of making FlattenDfsPre/Post being chosen over Tree,FlattenLeafs
                    if((otherTravMode & possibleTraversalModes) && otherTravMode > traversalMode)
                        traversalMode = otherTravMode;
                }

                // Default to the traversal mode that corresponds to the
                // first (least-significant) set bit in possibleTraversalModes.
                if(!traversalMode) traversalMode = possibleTraversalModes & (-possibleTraversalModes);

                for(i = 0; i < L ; i++) {
                    otherRole = this.dataCells[i].role;
                    otherRole.setRootLabel(rootLabel);
                    otherRole.setTraversalMode(traversalMode);
                    // This prevents any other traversal mode being chosen by other axis that the role may be in.
                    otherRole.setTraversalModes(traversalMode);
                }
            } else {
                if(!grouping.lastDimensionType().isComparable)
                    throw createError("The visual roles on axis '{0}', assumed continuous, should have 'comparable' groupings.", [this.id]);

                for(i = 1; i < L ; i++) {
                    otherGrouping = this._getBoundRoleGrouping(this.dataCells[i].role);
                    if(this.scaleType !== axis_groupingScaleType(otherGrouping))
                        throw createError("The visual roles on axis '{0}', assumed continuous, should have scales of the same type.", [this.id]);
                }
            }
        }
    },

    _getBoundRoleGrouping: function(role) {
        var grouping = role.grouping;
        if(!grouping) throw def.error.operationInvalid("Axis' role '" + role.name + "' is unbound.");
        return grouping;
    },

    /** @virtual */
    _createDomainData: function(baseData) {
        var keyArgs = {
            visible: this.domainVisibleOnly() ? true : null,
            isNull:  this.chart.options.ignoreNulls || this.domainIgnoreNulls() ? false : null
        };
        return this.role[this.domainGroupOperator()](baseData, keyArgs);
    },

    /** @virtual */
    _selectDomainItems: function(domainData) {
        return domainData.children();
    },

    _calcDomainItems: function() {
        var hasOwn = def.hasOwnProp,
            domainValuesSet = {},
            domainValues = [],
            domainItems  = [],
            domainData = this.domainData();

        this._selectDomainItems(domainData).each(function(itemData) {
            var itemValue = this.domainItemValue(itemData);
            if(!(hasOwn.call(domainValuesSet, itemValue))) {
                domainValuesSet[itemValue] = 1;

                domainValues.push(itemValue);
                domainItems .push(itemData );
            }
        }, this);

        this._domainItems  = domainItems ;
        this._domainValues = domainValues;
    },

    _getOptionsDefinition: function() { return axis_optionsDef; }
});

function axis_groupingScaleType(grouping) {
    return grouping.isDiscrete()                      ? 'discrete'   :
           grouping.lastDimensionValueType() === Date ? 'timeSeries' : 
           'numeric';
}

var axis_optionsDef = {
// NOOP
};