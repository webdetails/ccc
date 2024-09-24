/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Registry of plot classes by type.
 * @type Object.<string, function>
 */
var pvc_plotClassByType = {};

/**
 * Initializes a plot.
 *
 * @name pvc.visual.Plot
 * @class Represents a plot.
 * @extends pvc.visual.OptionsBase
 * @constructor
 * @param {pvc.BaseChart} chart The associated chart.
 * @param {object} [keyArgs] Keyword arguments. See the base class for more information.
 * @param {string} [keyArgs.optionId] The option id to use.
 *     Defaults to the <i>id</i>.
 */
def('pvc.visual.Plot', pvc.visual.OptionsBase.extend({
    init: function(chart, keyArgs) {
        // Peek plot type-index
        var typePlots = def.getPath(chart, ['plotsByType', this.type]),
            index = typePlots ? typePlots.length : 0,

        // Elements of the first plot (of any type) can be accessed without prefix.
        // Peek chart's plotList (globalIndex is only set afterwards in addPlot).
            globalIndex = chart.plotList.length,
            isMain      = !globalIndex,
            internalPlot = def.get(keyArgs, 'isInternal', true);

        keyArgs = def.setDefaults(keyArgs,
            'byNaked', isMain,
            'byName',  internalPlot,
            'byV1',    internalPlot);

        // ById - always.
        // Yet, external plots get a random option id, to discourage its direct use.
        if(!internalPlot)  keyArgs.optionId = pvc.uniqueExtensionAbsPrefix();

        this.base(chart, this.type, index, keyArgs);

        if(this.name && (this.name === "$" || this.name.indexOf(".") >= 0))
            throw def.error.argumentInvalid("name", def.format("Invalid plot name '{0}'.", [this.name]));

        this.prettyId    = this.name || this.id;
        this.isInternal  = !!internalPlot;
        this.isMain      = isMain;

        // -------------

        // Last prefix has higher precedence.

        // The plot id is a valid prefix (id=type+index).
        var prefixes = this.extensionPrefixes = [this.optionId];

        if(internalPlot) {
            // Elements of the first plot of the chart (the main plot) can be accessed without prefix.
            if(isMain) prefixes.push('');

            // The plot name is a valid prefix.
            if(this.name) prefixes.push(this.name);
        }

        this.visualRoles = {};
        this.visualRoleList = [];

        this.dataCellList = [];
        this.dataCellsByRole = {}; // role name -> [] dataCells

        this._isBound = undefined;

        // -------------

        var plotSpec = def.get(keyArgs, 'spec');
        if(plotSpec) this.processSpec(plotSpec);
    },

    methods: /** @lends pvc.visual.Plot# */{

        // Reading on constructor caused problems because processSpec had not been called yet, for internal plots.
        get dataPartValue() {
            return this.option('DataPart');
        },

        /** @override */
        _buildOptionId: function(keyArgs) { return def.get(keyArgs, 'optionId', this.id); },

        processSpec: function(plotSpec) {
            // Process extension points and publish options with the plot's optionId prefix.
            var me = this,
                options = me.chart.options,
                // Name has precedence in option resolution,
                // so use it if it is defined,
                // so that the the option variant with
                // the highest precedence is used.
                extId = (me.isInternal ? me.name : null) || me.optionId;

            me.chart._processExtensionPointsIn(plotSpec, extId, function(optValue, optId, optName) {
                // Not an extension point => it's an option
                switch(optName) {
                    // Already handled
                    case 'name':
                    case 'type':
                        break;

                    // Handled specially
                    case 'visualRoles':
                        me._visualRolesOptions = optValue; // NOTE: smashes, so only works once.

                        // Make every relative role name reference to refer to "this" plot's local role.
                        if(def.object.is(optValue)) def.each(optValue, function(spec) {
                            if(def.object.is(spec) && spec.from) spec.from = me.ensureAbsRoleRef(spec.from);
                        });
                        break;

                    default: options[optId] = optValue; break;
                }
            });
        },

        ensureAbsRoleRef: function(roleName) {
            return roleName && roleName.indexOf('.') < 0
                ? this.prettyId + '.' + roleName
                : roleName;
        },

        /** @overridable */
        _getColorRoleSpec: def.fun.constant(null),

        _addVisualRole: function(name, spec) {
            var roleList = this.visualRoleList;
            spec = def.set(spec,
                'index', roleList.length,
                'plot',  this);

            var role = new pvc.visual.Role(this.chart, name, spec);
            this.visualRoles[name] = role;
            roleList.push(role);
            return role;
        },

        _addDataCell: function(dataCell) {
            this.dataCellList.push(dataCell);
            def.array.lazy(this.dataCellsByRole, dataCell.role.name).push(dataCell);
        },

        /**
         * Gets a map of bound dimensions complex types that can be referenced by key visual roles of this plot,
         * or `null`, if none.
         *
         * A plot-level key visual role can only be bound to measure visual roles' dimensions of the same plot.
         *
         * @type {Object.<string, cdo.ComplexType}
         * @readOnly
         */
        get boundDimensionsComplexTypesMap() {

            var complexTypesMap = null;

            def.eachOwn(this.visualRoles, function(role) {
                // We need to let unbound measure roles through.
                // The result of this method is used to bind the discrete roles of this plot.
                // This will allow the binding of the discrete role to succeed even if a
                // referenced measure role is not bound.
                // Later, if the unbound measure role is required, the conclusion is reached that plot is unbound.
                // Else, if the unbound measure role is not required, an empty boundDimensionsDataSet can be obtained to represent it,
                // which results in the discrete role's grouping yielding no data...
                //
                // true or null (unbound)
                if(role.isMeasureEffective !== false) {

                    if(!complexTypesMap) complexTypesMap = {};

                    // Complex types are shared by all visual roles with the same boundDimensionsDataSetName (~ local name).
                    complexTypesMap[role.boundDimensionsDataSetName] = this.chart.getBoundDimensionsComplexTypeOf(role);
                }
            }, this);

            return complexTypesMap;
        },

        /**
         * Gets the map of bound dimensions data sets, indexed by data set name,
         * of bound measure visual roles of this plot,
         * or `null`, if none.
         *
         * @type {Object.<string,cdo.Data>}
         * @readOnly
         */
        get boundDimensionsDataSetsMap() {

            var dataSetsMap = this._boundDimensionsDataSetsMap;
            if(!dataSetsMap) {

                def.eachOwn(this.visualRoles, function(role) {

                    // See related comment in boundDimensionsComplexTypesMap.
                    // true or null (unbound)
                    if(role.isMeasureEffective !== false) {

                        if(!dataSetsMap) dataSetsMap = Object.create(null);

                        dataSetsMap[role.boundDimensionsDataSetName] = role.boundDimensionsDataSet;
                    }
                }, this);

                this._boundDimensionsDataSetsMap = dataSetsMap;
            }

            return dataSetsMap;
        },

        /** @overridable */
        interpolatable: function() {
            return false;
        },

        visualRole: function(name) {
            return def.getOwn(this.visualRoles, name, null);
        },

        /**
         * Called to finish construction of the plot.
         * Only from now on are all plot options guaranteed to be available
         * for consumption, so any initialization that is performed based on
         * the value of plot options must be deferred until this call.
         *
         * The base implementation initializes known plot visual roles.
         *
         * @overridable
         * @see pvc.visual.Plot#processSpec
         */
        initEnd: function() {
            this._initVisualRoles();
            this._initDataCells();
        },

        /** @overridable */
        _initVisualRoles: function() {
            var roleSpec = this._getColorRoleSpec();
            if(roleSpec) this._addVisualRole('color', roleSpec);
        },

        /** @overridable */
        _initDataCells: function() {
            if(this.visualRoles.color) {
                var dataCell = this._getColorDataCell();
                if (dataCell) this._addDataCell(dataCell);
            }
        },

        /**
         * Finishes the binding phase of the plot.
         *
         * All visual roles are now either bound or unbound.
         * If one of the plot's required visual roles is not bound,
         * then the plot is not bound.
         *
         * After this call, {@link pvc.visual.Plot#isBound} always returns
         * a boolean value, and not `undefined`.
         *
         * A plot which is not bound will not be used by the chart.
         */
        bindEnd: function() {
            if(this._isBound !== undefined)
                throw def.error.operationInvalid("Plot binding has already ended.");

            this._isBound = this.visualRoleList.every(function(role) {
                return !role.isRequired || role.isBound();
            });
        },

        /**
         * Makes sure that the visual role is bound, throwing an error if not.
         *
         * @throws {Error} When the visual role is not bound, stating required'ness of an unsatisfied visual role.
         */
        assertBound: function() {
            if(!this.isBound) {
                this.visualRoleList.forEach(function(role) {
                    if(role.isRequired && !role.isBound())
                        throw def.error.operationInvalid("The required visual role '{0}' is unbound.", [role.name]);
                });
            }
        },

        /**
         * Indicates if all of the plot's required visual roles are bound.
         *
         * Returns `undefined` until {@link pvc.visual.Plot#bindEnd} is called.
         *
         * @type {boolean|undefined}
         * @readOnly
         */
        get isBound() {
            return this._isBound;
        },

        /**
         * Gets a value that indicates if the plot is bound on the given base data.
         *
         * A plot is bound on a given data set if it is bound by itself,
         * as per {@link pvc.visual.Plot#isBound} and
         * if its data cells of required measure visual roles are all bound
         * and compatible with any measure discriminator dimensions already set on `baseData`.
         *
         * @param {!cdo.Data} baseData - The base data.
         * @return {boolean|undefined} `undefined` if the plot's binding phase has not finished; `true` if the plot is bound in the given data; `false` otherwise.
         */
        isDataBoundOn: function(baseData) {
            // Any required roles are unbound?
            var isBound = this.isBound;
            if(isBound !== undefined) {
                var isBoundByData = def.lazy(this, "_isBoundByData");
                var isBound = def.getOwn(isBoundByData, baseData.id, null);
                if(isBound === null) {
                    isBound = def.query(this.dataCellList).all(function(dataCell) {
                        // Unbound optional roles don't affect data bound'ness.
                        return !dataCell.role.isBound() || dataCell.isDataBoundOn(baseData);
                    });

                    isBoundByData[baseData.id] = isBound;
                }
            }

            return isBound;
        },

        /**
         * Creates a plot's data set,
         * according to the plot's "main structure" of data,
         * and based on a given base data.
         *
         * The default implementation filter's the given data set according to any specified filters.
         *
         * @param {!cdo.Data} baseData - The base data.
         *
         * @param {object} [ka] - Keyword arguments.
         * @param {boolean} [ka.visible = null] - Only considers datums that have the specified visible state.
         * @param {boolean} [ka.isNull = null] - Only considers datums with the specified isNull attribute.
         * @param {boolean} [ka.inverted = false] - Indicates that an inverted data grouping should be used.
         *
         * @return {!cdo.Data} A data set.
         *
         * @overridable
         */
        createData: function(baseData, ka) {

            // Currently, only bullet plot is using this base implementation.

            return baseData.where(null, ka);
        },


        interpolateDataCell: function(dataCell/*, baseData*/) {
            if(dataCell.plot !== this) throw def.error.operationInvalid("DataCell not of this plot.");
        },

        generateTrendsDataCell: function(newDatums, dataCell/*, baseData*/) {
            if(dataCell.plot !== this) throw def.error.operationInvalid("DataCell not of this plot.");
        },


        /**
         * Gets the extent of the values of the specified role
         * over all datums of the visible data of this plot on the specified chart.
         *
         * @param {pvc.visual.BaseChart} chart The chart requesting the cell extent.
         * @param {pvc.visual.Axis} valueAxis The value axis.
         * @param {pvc.visual.DataCell} valueDataCell The data cell.
         * @type object
         *
         * @overridable
         */
        getContinuousVisibleCellExtent: function(chart, valueAxis, valueDataCell) {

            if(valueDataCell.plot !== this) {
                throw def.error.operationInvalid("Datacell not of this plot.");
            }

            // if(valueDataCell.axisType !== valueAxis.type || valueDataCell.axisIndex !== valueAxis.index)
            //   throw def.error.operationInvalid("valueAxis and valueDataCell do not match.");

            var valueRole = valueDataCell.role;

            // not supported/implemented?
            if(valueRole.name === 'series') {
                throw def.error.notImplemented();
            }

            var data = chart.visiblePlotData(this); // [ignoreNulls=true]

            if(valueAxis.scaleSumNormalized()) {
                // e.g. Pie / Sunburst angle axis.
                return {min: 0, max: Math.abs(valueRole.numberValueOf(data).value || 0)};
            }

            // Non-normalized.

            // E.g. Time-series. Category role bound to a Date or Number dimension in
            // the base axis of a point plot.

            // Taking the union of the extents of each dimension,
            // although currently only cases of a single dimension are known.
            // This is probably the only thing that can be done,
            // without further information, as a fallback behaviour.
            var valueDimNames = valueRole.grouping.dimensionNames();
            var useAbs = valueAxis.scaleUsesAbs();

            return def.query(valueDimNames).select(function(valueDimName) {
                var extent = data.dimensions(valueDimName).extent({abs: useAbs});
                if(extent !== undefined) {
                    // TODO: aren't these Math.abs repeating work??
                    var minValue = extent.min.value;
                    var maxValue = extent.max.value;
                    return {
                        min: (useAbs ? Math.abs(minValue) : minValue),
                        max: (useAbs ? Math.abs(maxValue) : maxValue)
                    };
                }
            })
            .reduce(pvc.unionExtents, null);
        },

        _getColorDataCell: function() {
            var colorRole = this.visualRoles.color;
            if(colorRole)
                return new pvc.visual.ColorDataCell(
                    this,
                    /*axisType*/'color',
                    this.option('ColorAxis') - 1,
                    colorRole);
        }
    },

    options: {
        // Box model options?

        Orientation: {
            resolve: function(optionInfo) {
                return optionInfo.specify(this._chartOption('orientation') || 'vertical'), true;
            },
            cast: String
        },

        ValuesVisible: {
            resolve: '_resolveFull',
            data: {
                resolveV1: function(optionInfo) {
                    if(this.globalIndex === 0) {
                        var show = this._chartOption('showValues');
                        if(show !== undefined) {
                            optionInfo.specify(show);
                        } else {
                            show = this.type !== 'point';
                            optionInfo.defaultValue(show);
                        }
                        return true;
                    }
                }
            },
            cast:  Boolean,
            value: false
        },

        ValuesAnchor: {
            resolve: '_resolveFull',
            cast:    pvc.parseAnchor
        },

        ValuesFont: {
            resolve: '_resolveFull',
            cast:    String,
            value:   '10px sans-serif'
        },

        // Each plot type must provide an appropriate default mask
        // depending on its scene variable names
        ValuesMask: {
            resolve: '_resolveFull',
            cast:    String,
            value:   "{value}"
        },

        ValuesOptimizeLegibility: {
            resolve: '_resolveFull',
            cast:    Boolean,
            value:   false
        },

        ValuesOverflow: {
            resolve: '_resolveFull',
            cast:    pvc.parseValuesOverflow,
            value:   'hide'
        },

        DataPart: {
            resolve: '_resolveFull',
            cast:  String,
            value: '0'
        },

        // ---------------
        /*
         ColorRole: {
         resolve: '_resolveFixed',
         cast:    String,
         value:   'color'
         },
         */

        ColorAxis: {
            resolve: pvc.options.resolvers([
                function(optionInfo) {
                    // plot0 must use color axis 0!
                    // There are cases where the color role is unbound in the main plot
                    // and another plot has ColorAxis: 2...
                    if(this.globalIndex === 0) return optionInfo.specify(1), true;
                },
                '_resolveFull'
            ]),
            cast:  function(value) {
                value = def.number.to(value);
                return value != null ? def.between(value, 1, 10) : 1;
            },
            value: 1
        }
    },

    "type.methods": {
        registerClass: function(Class) {
            pvc_plotClassByType[Class.prototype.type] = Class;
        },

        getClass: function(type) {
            return def.getOwn(pvc_plotClassByType, type);
        }
    }
}));
