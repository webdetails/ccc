/**
 * The main chart component
 */
pvc.BaseChart = pvc.Abstract.extend({
    /**
     * Indicates if the chart has been disposed.
     */
    _disposed: false,
    
    _updateSelectionSuspendCount: 0,
    _selectionNeedsUpdate:   false,
    
    /**
     * The chart's parent chart.
     * 
     * <p>
     * The root chart has null as the value of its parent property.
     * </p>
     * 
     * @type pvc.BaseChart
     */
    parent: null,
    
    /**
     * The chart's root chart.
     * 
     * <p>
     * The root chart has itself as the value of the root property.
     * </p>
     * 
     * @type pvc.BaseChart
     */
    root: null,
    
    /**
     * A map of {@link pvc.visual.Axis} by axis id.
     */
    axes: null,
    
    /**
     * A map from axis type to role name or names.
     * This should be overridden in specific chart classes.
     * 
     * @example
     * <pre>
     * {
     *   'base':   'category',
     *   'ortho':  ['value', 'value2']
     * }
     * </pre>
     */
    _axisType2RoleNamesMap: null,
    
    /**
     * A map of {@link pvc.visual.Role} by name.
     * 
     * @type object
     */
    _visualRoles: null,

    _serRole: null,
    _dataPartRole: null,
    
    /**
     * An array of the {@link pvc.visual.Role} that are measures.
     * 
     * @type pvc.visual.Role[]
     */
    _measureVisualRoles: null,
    
    /**
     * Indicates if the chart has been pre-rendered.
     * <p>
     * This field is set to <tt>false</tt>
     * at the beginning of the {@link #_preRender} method
     * and set to <tt>true</tt> at the end.
     * </p>
     * <p>
     * When a chart is re-rendered it can, 
     * optionally, also repeat the pre-render phase. 
     * </p>
     * 
     * @type boolean
     */
    isPreRendered: false,

    /**
     * The version value of the current/last creation.
     * 
     * <p>
     * This value is changed on each pre-render of the chart.
     * It can be useful to invalidate cached information that 
     * is only valid for each creation.
     * </p>
     * <p>
     * Version values can be compared using the identity operator <tt>===</tt>.
     * </p>
     * 
     * @type any
     */
    _createVersion: 0,
    
    /**
     * A callback function that is called 
     * when the protovis' panel render is about to start.
     * 
     * <p>
     * Note that this is <i>after</i> the pre-render phase.
     * </p>
     * 
     * <p>
     * The callback is called with no arguments, 
     * but having the chart instance as its context (<tt>this</tt> value). 
     * </p>
     * 
     * @function
     */
    renderCallback: undefined,

    /**
     * The data that the chart is to show.
     * @type pvc.data.Data
     */
    dataEngine: null,
    data: null,
    
    /**
     * The resulting data of 
     * grouping {@link #data} by the data part role, 
     * when bound.
     * 
     * @type pvc.data.Data
     */
    _partData: null,

    /**
     * The data source of the chart.
     * <p>
     * The {@link #data} of a root chart 
     * is loaded with the data in this array.
     * </p>
     * @type any[]
     */
    resultset: [],
    
    /**
     * The meta-data that describes each 
     * of the data components of {@link #resultset}.
     * @type any[]
     */
    metadata: [],

    /**
     * The base panel is the root container of a chart.
     * <p>
     * The base panel of a <i>root chart</i> is the top-most root container.
     * It has {@link pvc.BasePanel#isTopRoot} equal to <tt>true</tt>.
     * </p>
     * <p>
     * The base panel of a <i>non-root chart</i> is the root of the chart's panels,
     * but is not the top-most root panel, over the charts hierarchy.
     * </p>
     * 
     * @type pvc.BasePanel
     */
    basePanel:   null,
    
    /**
     * The panel that shows the chart's title.
     * <p>
     * This panel is the first child of {@link #basePanel} to be created.
     * It is only created when the chart has a non-empty title.
     * </p>
     * <p>
     * Being the first child causes it to occupy the 
     * whole length of the side of {@link #basePanel} 
     * to which it is <i>docked</i>.
     * </p>
     * 
     * @type pvc.TitlePanel
     */
    titlePanel:  null,
    
    /**
     * The panel that shows the chart's main legend.
     * <p>
     * This panel is the second child of {@link #basePanel} to be created.
     * There is an option to not show the chart's legend,
     * in which case this panel is not created.
     * </p>
     * 
     * <p>
     * The current implementation of the legend panel
     * presents a <i>discrete</i> association of colors and labels.
     * </p>
     * 
     * @type pvc.LegendPanel
     */
    legendPanel: null,
    
    /**
     * The panel that hosts child chart's base panels.
     * 
     * @type pvc.MultiChartPanel
     */
    _multiChartPanel: null,

    /**
     * The name of the visual role that
     * the legend panel will be associated to.
     * 
     * <p>
     * The legend panel displays each distinct role value
     * with a marker and a label.
     * 
     * The marker's color is obtained from the parts color scales,
     * given the role's value.
     * </p>
     * <p>
     * The default dimension is the 'series' dimension.
     * </p>
     * 
     * @type string
     */
    legendSource: "series",
    
    /**
     * An array of colors, represented as names, codes or {@link pv.Color} objects
     * that is associated to each distinct value of the {@link #legendSource} dimension.
     * 
     * <p>
     * The legend panel associates each distinct dimension value to a color of {@link #colors},
     * following the dimension's natural order.
     * </p>
     * <p>
     * The default dimension is the 'series' dimension.
     * </p>
     * 
     * @type (string|pv.Color)[]
     */
    colors: null,
    secondAxisColor: null,
    
    /**
     * Contains the number of pages that a multi-chart contains
     * when rendered with the previous render options.
     * <p>
     * This property is updated after a render of a chart
     * where the visual role "multiChart" is assigned and
     * the option "multiChartPageIndex" has been specified. 
     * </p>
     * 
     * @type number|null
     */
    multiChartPageCount: null,
    
    /**
     * Contains the currently rendered multi-chart page index, 
     * relative to the previous render options.
     * <p>
     * This property is updated after a render of a chart
     * where the visual role "multiChart" is assigned and
     * the <i>option</i> "multiChartPageIndex" has been specified. 
     * </p>
     * 
     * @type number|null
     */
    multiChartPageIndex: null,
    
    constructor: function(options) {
        var parent = this.parent = def.get(options, 'parent') || null;
        
        /* DEBUG options */
        if(pvc.debug >= 3 && !parent && options){
            try {
                pvc.log("INITIAL OPTIONS:\n" + JSON.stringify(options));
            } catch(ex) {
                /* SWALLOW usually a circular JSON structure */
            }
        }
        
        if(parent) {
            // options != null
            this.root = parent.root;
            this.dataEngine =
            this.data = options.data ||
                        def.fail.argumentRequired('options.data');
            
            this.left = options.left;
            this.top  = options.top;
            this._visualRoles = parent._visualRoles;
            this._measureVisualRoles = parent._measureVisualRoles;

            if(parent._serRole) {
                this._serRole = parent._serRole;
            }

            if(parent._dataPartRole) {
                this._dataPartRole = parent._dataPartRole;
            }
            
        } else {
            this.root = this;
            
            this._visualRoles = {};
            this._measureVisualRoles = [];
        }
        
        this._axisType2RoleNamesMap = {};
        this.axes = {};
        
        this.options = def.mixin({}, this.defaults, options);
    },
    
    compatVersion: function(){
        return this.options.compatVersion;
    },
    
    /**
     * Processes options after user options and defaults have been merged.
     * Applies restrictions,
     * performs validations and
     * options values implications.
     */
    _processOptions: function(){

        var options = this.options;

        this._processOptionsCore(options);
        
        /* DEBUG options */
        if(pvc.debug >= 3 && options && !this.parent){
            try {
                pvc.log("CURRENT OPTIONS:\n" + JSON.stringify(options));
            }catch(ex) {
                /* SWALLOW usually a circular JSON structure */
            }
        }
        
        this._processExtensionPoints();
        
        return options;
    },

    /**
     * Processes options after user options and default options have been merged.
     * Override to apply restrictions, perform validation or
     * options values implications.
     * When overriden, the base implementation should be called.
     * The implementation must be idempotent -
     * its successive application should yield the same results.
     * @virtual
     */
    _processOptionsCore: function(options){
        // Disable animation if environment doesn't support it
        if (!$.support.svg || pv.renderer() === 'batik') {
            options.animate = false;
        }
        
        // Sanitize some options
        if(options.showTooltips){
            var ts = options.tipsySettings;
            if(ts){
                this.extend(ts, "tooltip");
            }
        }
    },
    
    /**
     * Building the visualization is made in 2 stages:
     * First, the {@link #_preRender} method prepares and builds 
     * every object that will be used.
     * 
     * Later the {@link #render} method effectively renders.
     */
    _preRender: function(keyArgs) {
        var options = this.options;
        
        /* Increment pre-render version to allow for cache invalidation  */
        this._createVersion++;
        
        this.isPreRendered = false;

        if(pvc.debug >= 3){
            pvc.log("Prerendering in pvc");
        }
        
        /* Any data exists or throws */
        this._checkNoData();
        
        if (!this.parent) {
            // Now's as good a time as any to completely clear out all
            //  tipsy tooltips
            pvc.removeTipsyLegends();
        }
        
        /* Options may be changed between renders */
        this._processOptions();
        
        /* Initialize root visual roles */
        if(!this.parent && this._createVersion === 1) {
            this._initVisualRoles();
            this._bindVisualRolesPre();
        }
        
        /* Initialize the data */
        this._initData(keyArgs);

        var hasMultiRole = this._isRoleAssigned('multiChart');
        
        /* Initialize axes */
        this._initAxes(hasMultiRole);
        
        /* Initialize chart panels */
        this._initChartPanels(hasMultiRole);
        
        this.isPreRendered = true;
    },
    
    _checkNoData: function(){
        // Child charts are created to consume *existing* data
        if (!this.parent) {
            
            // If we don't have data, we just need to set a "no data" message
            // and go on with life.
            if(!this.allowNoData && this.resultset.length === 0) {
                /*global NoDataException:true */
                throw new NoDataException();
            }
        }
    },
    
    _initAxes: function(isMulti){
        if(!this.parent){
            var colorRoleNames = this._axisType2RoleNamesMap.color;
            if(!colorRoleNames && this.legendSource){
                colorRoleNames = this.legendSource;
                this._axisType2RoleNamesMap.color = colorRoleNames;
            }
            
            if(colorRoleNames){
                // Create the color (legend) axis at the root chart
                this._createAxis('color', 0);
                
                if(this.options.secondAxis){
                    this._createAxis('color', 1);
                }
            }
        } else {
            // Copy
            var root = this.root;
            
            var colorAxis = root.axes.color;
            if(colorAxis){
                this.axes.color = colorAxis;
                this.colors = root.colors;
            }
            
            colorAxis = root.axes.color2;
            if(colorAxis){
                this.axes.color2 = colorAxis;
                this.secondAxisColor = root.secondAxisColor;
            }
        }
    },
    
    /**
     * Creates an axis of a given type and index.
     * 
     * @param {string} type The type of the axis.
     * @param {number} index The index of the axis within its type (0, 1, 2...).
     *
     * @type pvc.visual.Axis
     */
    _createAxis: function(axisType, axisIndex){
        // Collect visual roles
        var dataCells = this._getAxisDataCells(axisType, axisIndex);
        
        var axis = this._createAxisCore(axisType, axisIndex, dataCells);
        
        this.axes[axis.id] = axis;
        
        return axis;
    },
    
    _getAxisDataCells: function(axisType, axisIndex){
        // Collect visual roles
        return this._buildAxisDataCells(axisType, axisIndex, null);
    },
    
    _buildAxisDataCells: function(axisType, axisIndex, dataPartValues){
        // Collect visual roles
        return def.array.as(this._axisType2RoleNamesMap[axisType])
               .map(function(roleName){
                   return {
                       role: this.visualRoles(roleName), 
                       dataPartValues: dataPartValues
                   };
               }, this);
    },
    
    _createAxisCore: function(axisType, axisIndex, dataCells){
        switch(axisType){
            case 'color': 
                var colorAxis = new pvc.visual.ColorAxis(this, axisType, axisIndex, dataCells);
                switch(axisIndex){
                    case 0:
                        this.colors = colorAxis.colorsFactory;
                        break;
                        
                    case 1:
                        if(this.options.secondAxisOwnColors){
                            this.secondAxisColor = colorAxis.colorsFactory;
                        }
                        break;
                }
                
                return colorAxis;
        }
        
        throw def.error.operationInvalid("Invalid axis type '{0}'", [axisType]);
    },
    
    _initChartPanels: function(hasMultiRole){
        /* Initialize chart panels */
        this._initBasePanel  ();
        this._initTitlePanel ();
        this._initLegendPanel();
        
        if(!this.parent && hasMultiRole) {
            this._initMultiChartPanel();
        } else {
            var options = this.options;
            this._preRenderContent({
                margins:            options.contentMargins,
                paddings:           options.contentPaddings,
                clickAction:        options.clickAction,
                doubleClickAction:  options.doubleClickAction
            });
        }
    },
    
    /**
     * Override to create chart specific content panels here.
     * No need to call base.
     * 
     * @param {object} contentOptions Object with content specific options. Can be modified.
     * @param {pvc.Sides} [contentOptions.margins] The margins for the content panels. 
     * @param {pvc.Sides} [contentOptions.paddings] The paddings for the content panels.
     * 
     * @virtual
     */
    _preRenderContent: function(contentOptions){
        /* NOOP */
    },
    
    /**
     * Initializes the data engine and roles
     */
    _initData: function(keyArgs) {
        if(!this.parent) {
            var data = this.data;
            if(!data || def.get(keyArgs, 'reloadData', true)) {
               this._onLoadData();
            } else {
                // TODO: Do this in a cleaner way. Give control to Data
                // We must at least dispose children and cache...
                /*global data_disposeChildLists:true, data_syncDatumsState:true */
                data_disposeChildLists.call(data);
                data_syncDatumsState.call(data);
            }
        }

        delete this._partData;
        
        if(pvc.debug >= 3){
            pvc.log(this.data.getInfo());
        }
    },

    _onLoadData: function(){
        var data = this.data,
            complexType   = data ? data.type : new pvc.data.ComplexType(),
            translOptions = this._createTranslationOptions(),
            translation   = this._createTranslation(complexType, translOptions);

        translation.configureType();

        if(pvc.debug >= 3){
            pvc.log(complexType.describe());
        }

        // ----------
        // Roles are bound before actually loading data,
        // in order to be able to filter datums
        // whose "every dimension in a measure role is null".
        this._bindVisualRoles(complexType);

        if(pvc.debug >= 3){
            this._logVisualRoles();
        }

        // ----------

        if(!data) {
            data =
                this.dataEngine =
                this.data = new pvc.data.Data({
                    type:     complexType,
                    labelSep: this.options.groupedLabelSep
                });
        } // else TODO: assert complexType has not changed...
        
        // ----------

        var loadKeyArgs = {
            where:  this._getLoadFilter(),
            isNull: this._getIsNullDatum()
         };
        
        data.load(translation.execute(data), loadKeyArgs);
    },

    _getLoadFilter: function(){
        if(this.options.ignoreNulls) {
            return function(datum){
                var isNull = datum.isNull;
                
                if(isNull && pvc.debug >= 4){
                    pvc.log("Datum excluded.");
                }
                
                return !isNull;
            };
        }
    },
    
    _getIsNullDatum: function(){
        var measureDimNames = this.measureDimensionsNames(),
            M = measureDimNames.length;
        if(M) {
            // Must have at least one measure role dimension not-null
            return function(datum){
                var atoms = datum.atoms;
                for(var i = 0 ; i < M ; i++){
                    if(atoms[measureDimNames[i]].value != null){
                        return false;
                    }
                }

                return true;
            };
        }
    },

    _createTranslation: function(complexType, translOptions){
        
        var TranslationClass = translOptions.crosstabMode ? 
                    pvc.data.CrosstabTranslationOper : 
                    pvc.data.RelationalTranslationOper;

        return new TranslationClass(complexType, this.resultset, this.metadata, translOptions);
    },

    _createTranslationOptions: function(){
        var options = this.options,
            dataOptions = options.dataOptions || {};

        var secondAxisSeriesIndexes;
        if(options.secondAxis){
            secondAxisSeriesIndexes = options.secondAxisSeriesIndexes;
            if(secondAxisSeriesIndexes === undefined){
                secondAxisSeriesIndexes = options.secondAxisIdx;
            }
        }

        var valueFormat = options.valueFormat,
            valueFormatter;
        if(valueFormat && valueFormat !== this.defaults.valueFormat){
            valueFormatter = function(v) {
                return v != null ? valueFormat(v) : "";
            };
        }

        return {
            compatVersion:     options.compatVersion,
            secondAxisSeriesIndexes: secondAxisSeriesIndexes,
            seriesInRows:      options.seriesInRows,
            crosstabMode:      options.crosstabMode,
            isMultiValued:     options.isMultiValued,

            dimensionGroups:   options.dimensionGroups,
            dimensions:        options.dimensions,
            readers:           options.readers,

            measuresIndexes:   options.measuresIndexes, // relational multi-valued

            multiChartIndexes: options.multiChartIndexes,

            // crosstab
            separator:         dataOptions.separator,
            measuresInColumns: dataOptions.measuresInColumns,
            measuresIndex:     dataOptions.measuresIndex || dataOptions.measuresIdx, // measuresInRows
            measuresCount:     dataOptions.measuresCount || dataOptions.numMeasures, // measuresInRows
            categoriesCount:   dataOptions.categoriesCount,

            // Timeseries *parse* format
            isCategoryTimeSeries: options.timeSeries,

            timeSeriesFormat:     options.timeSeriesFormat,
            valueNumberFormatter: valueFormatter
        };
    },

    /**
     * Initializes each chart's specific roles.
     * @virtual
     */
    _initVisualRoles: function(){
        this._addVisualRoles({
            multiChart: {defaultDimensionName: 'multiChart*'}
        });

        if(this._hasDataPartRole()){
            this._addVisualRoles({
                dataPart: {
                    defaultDimensionName: 'dataPart',
                    requireSingleDimension: true,
                    requireIsDiscrete: true
                }
            });

            // Cached
            this._dataPartRole = this.visualRoles('dataPart');
        }

        var serRoleSpec = this._getSeriesRoleSpec();
        if(serRoleSpec){
            this._addVisualRoles({series: serRoleSpec});

            // Cached
            this._serRole = this.visualRoles('series');
        }
    },

    /**
     * Binds visual roles to grouping specifications
     * that have not yet been bound to and validated against a complex type.
     *
     * This allows infering proper defaults to
     * dimensions bound to roles, by taking them from the roles requirements.
     */
    _bindVisualRolesPre: function(){
        
        def.eachOwn(this._visualRoles, function(visualRole){
            visualRole.setIsReversed(false);
        });
        
        /* Process user specified bindings */
        var boundDimNames = {};
        def.each(this.options.visualRoles, function(roleSpec, name){
            var visualRole = this._visualRoles[name] ||
                def.fail.operationInvalid("Role '{0}' is not supported by the chart type.", [name]);
            
            var groupingSpec;
            if(roleSpec && typeof roleSpec === 'object'){
                if(def.get(roleSpec, 'isReversed', false)){
                    visualRole.setIsReversed(true);
                }
                
                groupingSpec = roleSpec.dimensions;
            } else {
                groupingSpec = roleSpec;
            }
            
            // !groupingSpec results in a null grouping being preBound
            // A pre bound null grouping is later discarded in the post bind
            if(groupingSpec !== undefined){
                var grouping = pvc.data.GroupingSpec.parse(groupingSpec);

                visualRole.preBind(grouping);

                /* Collect dimension names bound to a *single* role */
                grouping.dimensions().each(function(dimSpec){
                    if(def.hasOwn(boundDimNames, dimSpec.name)){
                        // two roles => no defaults at all
                        delete boundDimNames[dimSpec.name];
                    } else {
                        boundDimNames[dimSpec.name] = visualRole;
                    }
                });
            }
        }, this);

        /* Provide defaults to dimensions bound to a single role */
        var dimsSpec = (this.options.dimensions || (this.options.dimensions = {}));
        def.eachOwn(boundDimNames, function(role, name){
            var dimSpec = dimsSpec[name] || (dimsSpec[name] = {});
            if(role.valueType && dimSpec.valueType === undefined){
                dimSpec.valueType = role.valueType;

                if(role.requireIsDiscrete != null && dimSpec.isDiscrete === undefined){
                    dimSpec.isDiscrete = role.requireIsDiscrete;
                }
            }

            if(dimSpec.label === undefined){
                dimSpec.label = role.label;
            }
        }, this);
    },

    _hasDataPartRole: function(){
        return false;
    },

    _getSeriesRoleSpec: function(){
        return null;
    },

    _addVisualRoles: function(roles){
        def.eachOwn(roles, function(keyArgs, name){
            var visualRole = new pvc.visual.Role(name, keyArgs);
            this._visualRoles[name] = visualRole;
            if(visualRole.isMeasure){
                this._measureVisualRoles.push(visualRole);
            }
        }, this);
    },
    
    _bindVisualRoles: function(type){
        
        var boundDimTypes = {};

        function bind(role, dimNames){
            role.bind(pvc.data.GroupingSpec.parse(dimNames, type));
            def.array.as(dimNames).forEach(function(dimName){
                boundDimTypes[dimName] = true;
            });
        }
        
        /* Process role pre binding */
        def.eachOwn(this._visualRoles, function(visualRole, name){
            if(visualRole.isPreBound()){
                visualRole.postBind(type);
                // Null groupings are discarded
                if(visualRole.grouping){
                    visualRole
                        .grouping
                        .dimensions().each(function(dimSpec){
                            boundDimTypes[dimSpec.name] = true;
                        });
                }
            }
        }, this);
        
        /*
         * (Try to) Automatically bind unbound roles.
         * Validate role required'ness.
         */
        def.eachOwn(this._visualRoles, function(role, name){
            if(!role.grouping){

                /* Try to bind automatically, to defaultDimensionName */
                var dimName = role.defaultDimensionName;
                if(dimName) {
                    /* An asterisk at the end of the name indicates
                     * that any dimension of that group is allowed.
                     * If the role allows multiple dimensions,
                     * then the meaning is greedy - use them all.
                     * Otherwise, use only one.
                     */
                    var match = dimName.match(/^(.*?)(\*)?$/) ||
                            def.fail.argumentInvalid('defaultDimensionName');
                    
                    var anyLevel = !!match[2];
                    if(anyLevel) {
                        // TODO: does not respect any index explicitly specified
                        // before the *. Could mean >=...
                        var groupDimNames = type.groupDimensionsNames(match[1], {assertExists: false});
                        if(groupDimNames){
                            var freeGroupDimNames = 
                                    def.query(groupDimNames)
                                        .where(function(dimName2){ return !def.hasOwn(boundDimTypes, dimName2); });

                            if(role.requireSingleDimension){
                                var freeDimName = freeGroupDimNames.first();
                                if(freeDimName){
                                    bind(role, freeDimName);
                                    return;
                                }
                            } else {
                                freeGroupDimNames = freeGroupDimNames.array();
                                if(freeGroupDimNames.length){
                                    bind(role, freeGroupDimNames);
                                    return;
                                }
                            }
                        }
                    } else if(!def.hasOwn(boundDimTypes, dimName) &&
                              type.dimensions(dimName, {assertExists: false})){
                        bind(role, dimName);
                        return;
                    }

                    if(role.autoCreateDimension){
                        /* Create a hidden dimension and bind the role and the dimension */
                        var defaultName = match[1];
                        type.addDimension(defaultName,
                            pvc.data.DimensionType.extendSpec(defaultName, {isHidden: true}));
                        bind(role, defaultName);
                        return;
                    }
                }

                if(role.isRequired) {
                    throw def.error.operationInvalid("Chart type requires unassigned role '{0}'.", [name]);
                }
                
                // Unbind role from any previous binding
                role.bind(null);
            }
        }, this);
    },

    _logVisualRoles: function(){
        var out = ["\n------------------------------------------"];
        out.push("Visual Roles Information");

        def.eachOwn(this._visualRoles, function(role, name){
            out.push("  " + name + def.array.create(18 - name.length, " ").join("") +
                    (role.grouping ? (" <-- " + role.grouping) : ''));
        });
        
        out.push("------------------------------------------");

        pvc.log(out.join("\n"));
    },

    /**
     * Obtains a roles array or a specific role, given its name.
     * 
     * @param {string} roleName The role name.
     * @param {object} keyArgs Keyword arguments.
     * @param {boolean} assertExists Indicates if an error should be thrown if the specified role name is undefined.
     * 
     * @type pvc.data.VisualRole[]|pvc.data.VisualRole 
     */
    visualRoles: function(roleName, keyArgs){
        if(roleName == null) {
            return def.own(this._visualRoles);
        }
        
        var role = def.getOwn(this._visualRoles, roleName) || null;
        if(!role && def.get(keyArgs, 'assertExists', true)) {
            throw def.error.argumentInvalid('roleName', "Undefined role name '{0}'.", [roleName]);
        }
        
        return role;
    },

    measureVisualRoles: function(){
        return this._measureVisualRoles;
    },

    measureDimensionsNames: function(){
        return def.query(this._measureVisualRoles)
                   .select(function(visualRole){ return visualRole.firstDimensionName(); })
                   .where(def.notNully)
                   .array();
    },
    
    /**
     * Indicates if a role is assigned, given its name. 
     * 
     * @param {string} roleName The role name.
     * @type boolean
     */
    _isRoleAssigned: function(roleName){
        return !!this._visualRoles[roleName].grouping;
    },
    
    partData: function(dataPartValues){
        if(!this._partData){
            if(!this._dataPartRole || !this._dataPartRole.grouping){
                /* Undefined or unbound */
                this._partData = this.data;
            } else {
                // Visible and not
                this._partData = this._dataPartRole.flatten(this.data);
            }
        }
        
        if(!dataPartValues){
            return this._partData;
        }

        dataPartValues = def.query(dataPartValues).distinct().array();
        dataPartValues.sort();

        var dataPartDimName = this._dataPartRole.firstDimensionName();

        if(dataPartValues.length === 1){
            // TODO: should, at least, call some static method of Atom to build a global key
            return this._partData._childrenByKey[dataPartDimName + ':' + dataPartValues[0]] || 
                   new pvc.data.Data({linkParent: this._partData, datums: []}); // don't blow code ahead...
        }

        return this._partData.where([
                    def.set({}, dataPartDimName, dataPartValues)
                ]);
    },

    /**
     * Creates and initializes the base panel.
     */
    _initBasePanel: function() {
        var options = this.options;
        var basePanelParent = this.parent && this.parent._multiChartPanel;
        
        this.basePanel = new pvc.BasePanel(this, basePanelParent, {
            margins:  options.margins,
            paddings: options.paddings,
            size:     {width: options.width, height: options.height}
        });
    },

    /**
     * Creates and initializes the title panel,
     * if the title is specified.
     */
    _initTitlePanel: function(){
        var options = this.options;
        if (!def.empty(options.title)) {
            this.titlePanel = new pvc.TitlePanel(this, this.basePanel, {
                title:      options.title,
                font:       options.titleFont,
                anchor:     options.titlePosition,
                align:      options.titleAlign,
                alignTo:    options.titleAlignTo,
                offset:     options.titleOffset,
                inBounds:   options.titleInBounds,
                margins:    options.titleMargins,
                paddings:   options.titlePaddings,
                titleSize:  options.titleSize,
                titleSizeMax: options.titleSizeMax
            });
        }
    },
    
    /**
     * Creates and initializes the legend panel,
     * if the legend is active.
     */
    _initLegendPanel: function(){
        var options = this.options;
        if (options.legend) {
            // Only one legend panel, so only "Panel" options
            // of the first 'color' axis are taken into account
            var colorAxis = this.axes.color; 
            
            this.legendPanel = new pvc.LegendPanel(this, this.basePanel, {
                anchor:     colorAxis.option('Position'),
                align:      colorAxis.option('Align'),
                alignTo:    options.legendAlignTo,
                offset:     options.legendOffset,
                inBounds:   options.legendInBounds,
                size:       colorAxis.option('Size'),
                sizeMax:    colorAxis.option('SizeMax'),
                margins:    colorAxis.option('Margins'),
                paddings:   colorAxis.option('Paddings'),
                font:       colorAxis.option('Font'),
                scenes:     def.getPath(options, 'legend.scenes'),
                
                // Bullet legend
                minMarginX: options.legendMinMarginX, // V1 -> paddings
                minMarginY: options.legendMinMarginY, // V1 -> paddings
                textMargin: options.legendTextMargin,
                padding:    options.legendPadding,
                shape:      options.legendShape,
                markerSize: options.legendMarkerSize,
                drawLine:   options.legendDrawLine,
                drawMarker: options.legendDrawMarker
            });
            
            this._initLegendScenes(this.legendPanel);
        }
    },
    
    /* 
    TODO: I'm lost! Where do I belong?
    
    shape, drawLine, drawMarker,
    if(isV1Compat && options.shape === undefined){
        options.shape = 'square';
    }
    */
    
    /**
     * Creates the legend group scenes of a chart.
     *
     * The default implementation creates
     * one legend group for each existing data part value
     * for the dimension in {@link #legendSource}.
     *
     * Legend groups are registered with the id prefix "part"
     * followed by the corresponding part value.
     */
    _initLegendScenes: function(legendPanel){
        
        var rootScene;
        
        addAxis.call(this, this.axes.color );
        addAxis.call(this, this.axes.color2);
        
        // ------------
        
        function addAxis(colorAxis){
            if(colorAxis && colorAxis.domainData){
                processAxis.call(this, colorAxis);
            }
        }
        
        function processAxis(colorAxis){
            var domainData = colorAxis.domainData;
            
            if(!rootScene){
                rootScene = legendPanel._getBulletRootScene();
            }
            
            var groupScene = rootScene.createGroup({
                group:           domainData,
                colorAxis:       colorAxis,
                extensionPrefix: pvc.visual.Axis.getId('legend', rootScene.childNodes.length)
             });
            
            // For latter binding an appropriate bullet renderer
            colorAxis.legendBulletGroupScene = groupScene;
            
            var partColorScale = colorAxis.scale;
            
            domainData
                .children()
                .each(function(itemData){
                    var itemScene = groupScene.createItem({group: itemData});
                    def.set(itemScene,
                        'color', partColorScale(itemData.value),
                        'shape', 'square');
                });
        }
    },

    /**
     * Creates and initializes the multi-chart panel.
     */
    _initMultiChartPanel: function(){
        this._multiChartPanel = new pvc.MultiChartPanel(this, this.basePanel);
        
        // BIG HACK: force legend to be rendered after the small charts, 
        // to allow them to register legend renderers.
        this.basePanel._children.unshift(this.basePanel._children.pop());
    },
    
    useTextMeasureCache: function(fun, ctx){
        var root = this.root;
        var textMeasureCache = root._textMeasureCache || 
                               (root._textMeasureCache = pvc.text.createCache());
        
        return pvc.text.useCache(textMeasureCache, fun, ctx || this);
    },
    
    /**
     * Render the visualization.
     * If not pre-rendered, do it now.
     */
    render: function(bypassAnimation, recreate, reloadData){
        this.useTextMeasureCache(function(){
            try{
                if (!this.isPreRendered || recreate) {
                    this._preRender({reloadData: reloadData});
                } else if(!this.parent && this.isPreRendered) {
                    pvc.removeTipsyLegends();
                }
    
                this.basePanel.render({
                    bypassAnimation: bypassAnimation, 
                    recreate: recreate
                 });
                
            } catch (e) {
                if (e instanceof NoDataException) {
                    if(pvc.debug > 1){
                        pvc.log("No data found.");
                    }
    
                    this._addErrorPanelMessage("No data found", true);
                } else {
                    // We don't know how to handle this
                    pvc.logError(e.message);
                    
                    if(pvc.debug > 0){
                        this._addErrorPanelMessage("Error: " + e.message, false);
                    }
                    //throw e;
                }
            }
        });
    },

    _addErrorPanelMessage: function(text, isNoData){
        var options = this.options,
            pvPanel = new pv.Panel()
                        .canvas(options.canvas)
                        .width(options.width)
                        .height(options.height),
            pvMsg = pvPanel.anchor("center").add(pv.Label)
                        .text(text);

        if(isNoData){
            this.extend(pvMsg, "noDataMessage");
        }
        
        pvPanel.render();
    },

    /**
     * Animation
     */
    animate: function(start, end) {
        return this.basePanel.animate(start, end);
    },
    
    /**
     * Indicates if the chart is currently 
     * rendering the animation start phase.
     * <p>
     * Prefer using this function instead of {@link #animate} 
     * whenever its <tt>start</tt> or <tt>end</tt> arguments
     * involve a non-trivial calculation. 
     * </p>
     * 
     * @type boolean
     */
    isAnimatingStart: function() {
        return this.basePanel.isAnimatingStart();
    },
    
    /**
     * Method to set the data to the chart.
     * Expected object is the same as what comes from the CDA: 
     * {metadata: [], resultset: []}
     */
    setData: function(data, options) {
        this.setResultset(data.resultset);
        this.setMetadata(data.metadata);

        // TODO: Danger!
        $.extend(this.options, options);
    },
    
    /**
     * Sets the resultset that will be used to build the chart.
     */
    setResultset: function(resultset) {
        /*jshint expr:true */
        !this.parent || def.fail.operationInvalid("Can only set resultset on root chart.");
        
        this.resultset = resultset;
        if (!resultset.length) {
            pvc.log("Warning: Resultset is empty");
        }
    },

    /**
     * Sets the metadata that, optionally, 
     * will give more information for building the chart.
     */
    setMetadata: function(metadata) {
        /*jshint expr:true */
        !this.parent || def.fail.operationInvalid("Can only set resultset on root chart.");
        
        this.metadata = metadata;
        if (!metadata.length) {
            pvc.log("Warning: Metadata is empty");
        }
    },
    
    _processExtensionPoints: function(){
        var points = this.options.extensionPoints;
        var components = {};
        if(points){
            for(var p in points) {
                var id, prop;
                var splitIndex = p.indexOf("_");
                if(splitIndex > 0){
                    id   = p.substring(0, splitIndex);
                    prop = p.substr(splitIndex + 1);
                    if(id && prop){
                        var component = def.getOwn(components, id) ||
                                        (components[id] = new def.OrderedMap());
                        
                        component.add(prop, points[p]);
                    }
                }
            }
        }
        
        this._components = components;
    },
    
    /**
     * This is the method to be used for the extension points
     * for the specific contents of the chart. already ge a pie
     * chart! Goes through the list of options and, if it
     * matches the prefix, execute that method on the mark.
     * WARNING: It's the user's responsibility to make sure that
     * unexisting methods don't blow this.
     */
    extend: function(mark, id, keyArgs) {
        // if mark is null or undefined, skip
        if (mark) {
            var component = def.getOwn(this._components, id);
            if(component){
                if(mark.borderPanel){
                    mark = mark.borderPanel;
                }
                
                var logOut    = pvc.debug >= 3 ? [] : null;
                var constOnly = def.get(keyArgs, 'constOnly', false); 
                var wrap      = mark.wrap;
                var keyArgs   = {tag: pvc.extensionTag};
                
                component.forEach(function(v, m){
                    // Not everything that is passed to 'mark' argument
                    //  is actually a mark...(ex: scales)
                    // Not locked and
                    // Not intercepted and
                    if(mark.isLocked && mark.isLocked(m)){
                        if(logOut) {logOut.push(m + ": locked extension point!");}
                    } else if(mark.isIntercepted && mark.isIntercepted(m)) {
                        if(logOut) {logOut.push(m + ":" + JSON.stringify(v) + " (controlled)");}
                    } else {
                        if(logOut) {logOut.push(m + ": " + JSON.stringify(v)); }

                        // Extend object css and svg properties
                        if(v != null){
                            var type = typeof v;
                            if(type === 'object'){
                                if(m === 'svg' || m === 'css'){
                                    var v2 = mark.propertyValue(m);
                                    if(v2){
                                        v = def.copy(v2, v);
                                    }
                                }
                            } else if((wrap || constOnly) && type === 'function'){
                                if(constOnly){
                                    return;
                                }
                                
                                v = wrap.call(mark, v, m);
                            }
                        }
                        
                        // Distinguish between mark methods and properties
                        if (typeof mark[m] === "function") {
                            if(mark.intercept){
                                mark.intercept(m, v, keyArgs);
                            } else {
                                // Not really a mark
                                mark[m](v);
                            }
                        } else {
                            mark[m] = v;
                        }
                    }
                });

                if(logOut){
                    if(logOut.length){
                        pvc.log("Applying Extension Points for: '" + id + "'\n\t* " + logOut.join("\n\t* "));
                    } else if(pvc.debug >= 5) {
                        pvc.log("No Extension Points for: '" + id + "'");
                    }
                }
            }
        } else if(pvc.debug >= 4){
            pvc.log("Applying Extension Points for: '" + id + "' (target mark does not exist)");
        }
    },

    /**
     * Obtains the specified extension point.
     */
    _getExtension: function(id, prop) {
        var component = def.getOwn(this._components, id);
        if(component){
            return component.get(prop);
        }
    },
    
    /** 
     * Clears any selections and, if necessary,
     * re-renders the parts of the chart that show selected marks.
     * 
     * @type undefined
     * @virtual 
     */
    clearSelections: function(){
        if(this.data.owner.clearSelected()) {
            this.updateSelections();
        }
    },
    
    _suspendSelectionUpdate: function(){
        if(this === this.root) {
            this._updateSelectionSuspendCount++;
        } else {
            this.root._suspendSelectionUpdate();
        }
    },
    
    _resumeSelectionUpdate: function(){
        if(this === this.root) {
            if(this._updateSelectionSuspendCount > 0) {
                if(!(--this._updateSelectionSuspendCount)) {
                    if(this._selectionNeedsUpdate) {
                        this.updateSelections();
                    }
                }
            }
        } else {
            this._resumeSelectionUpdate();
        }
    },
    
    /** 
     * Re-renders the parts of the chart that show selected marks.
     * 
     * @type undefined
     * @virtual 
     */
    updateSelections: function(){
        if(this === this.root) {
            if(this._inUpdateSelections) {
                return;
            }
            
            if(this._updateSelectionSuspendCount) {
                this._selectionNeedsUpdate = true;
                return;
            }
            
            pvc.removeTipsyLegends();
            
            // Reentry control
            this._inUpdateSelections = true;
            try {
                // Fire action
                var action = this.options.selectionChangedAction;
                if(action){
                    var selections = this.data.selectedDatums();
                    action.call(null, selections);
                }
                
                /** Rendering afterwards allows the action to change the selection in between */
                this.basePanel._renderInteractive();
            } finally {
                this._inUpdateSelections   = false;
                this._selectionNeedsUpdate = false;
            }
        } else {
            this.root.updateSelections();
        }
    },
    
    _onUserSelection: function(datums){
        if(!datums || !datums.length){
            return datums;
        }
        
        if(this === this.root) {
            // Fire action
            var action = this.options.userSelectionAction;
            if(action){
                return action.call(null, datums) || datums;
            }
            
            return datums;
        }
        
        return this.root._onUserSelection(datums);
    },
    
    isOrientationVertical: function(orientation) {
        return (orientation || this.options.orientation) === pvc.orientation.vertical;
    },

    isOrientationHorizontal: function(orientation) {
        return (orientation || this.options.orientation) === pvc.orientation.horizontal;
    },
    
    /**
     * Disposes the chart, any of its panels and child charts.
     */
    dispose: function(){
        if(!this._disposed){
            
            // TODO: 
            
            this._disposed = true;
        }
    },
    
    defaults: {
//        canvas: null,

        width:  400,
        height: 300,
        
//        multiChartMax: undefined,
//        multiChartMaxColumns: undefined,
//        multiChartWidth: undefined,
//        multiChartAspectRatio: undefined,
//        multiChartSingleRowFillsHeight: undefined,
//        multiChartSingleColFillsHeight: undefined,
//        multiChartMaxHeight: undefined,
        
        orientation: 'vertical',
        
//        extensionPoints:   undefined,
//        
//        visualRoles:       undefined,
//        dimensions:        undefined,
//        dimensionGroups:   undefined,
//        readers:           undefined,
        
        ignoreNulls:       true, // whether to ignore or keep "null"-measure datums upon loading
        crosstabMode:      true,
//        multiChartIndexes: undefined,
        isMultiValued:     false,
        seriesInRows:      false,
        groupedLabelSep:   undefined,
//        measuresIndexes:   undefined,
//        dataOptions:       undefined,
//        
//        timeSeries:        undefined,
//        timeSeriesFormat:  undefined,

        animate: true,

//        title:         null,
        titlePosition: "top", // options: bottom || left || right
        titleAlign:    "center", // left / right / center
//        titleAlignTo:  undefined,
//        titleOffset:   undefined,
//        titleInBounds: undefined,
//        titleSize:     undefined,
//        titleSizeMax:  undefined,
//        titleMargins:  undefined,
//        titlePaddings: undefined,
//        titleFont:     undefined,
        
        legend:           false, // Show Legends
        legendPosition:   "bottom",
//        legendFont:       undefined,
//        legendSize:       undefined,
//        legendSizeMax:    undefined,
//        legendAlign:      undefined,
//        legendAlignTo:    undefined,
//        legendOffset:     undefined,
//        legendInBounds:   undefined,
//        legendMinMarginX: undefined,
//        legendMinMarginY: undefined,
//        legendTextMargin: undefined,
//        legendPadding:    undefined, // ATTENTION: this is different from legendPaddings
//        legendShape:      undefined,
//        legendDrawLine:   undefined,
//        legendDrawMarker: undefined,
//        legendMarkerSize: undefined,
//        legendMargins:    undefined,
//        legendPaddings:   undefined,
//        legendClickMode:  undefined,
        
//        colors: null,

        secondAxis: false,
        secondAxisIdx: -1,
//        secondAxisSeriesIndexes: undefined,
//        secondAxisColor: undefined,
//        secondAxisOwnColors: undefined, // false

        showTooltips: true,
        
//        tooltipFormat: undefined,
        
        v1StyleTooltipFormat: function(s, c, v, datum) {
            return s + ", " + c + ":  " + this.chart.options.valueFormat(v) +
                   (datum && datum.percent ? ( " (" + datum.percent.label + ")") : "");
        },
        
        tipsySettings: {
            gravity: "s",
            delayIn:     200,
            delayOut:    80, // smoother moving between marks with tooltips, possibly slightly separated
            offset:      2,
            opacity:     0.8,
            html:        true,
            fade:        false, // fade out
            corners:     false,
            followMouse: false
        },
        
        valueFormat: def.scope(function(){
            var pvFormat = pv.Format.number().fractionDigits(0, 2);
            
            return function(d) {
                return pvFormat.format(d);
                // pv.Format.number().fractionDigits(0, 10).parse(d));
            };
        }),
        
        /* For numeric values in percentage */
        percentValueFormat: def.scope(function(){
            var pvFormat = pv.Format.number().fractionDigits(0, 1);
            
            return function(d){
                return pvFormat.format(d * 100) + "%";
            };
        }),
        
        // Content/Plot area clicking
        clickable:  false,
//        clickAction: null,
//        doubleClickAction: null,
        doubleClickMaxDelay: 300, //ms
//      clickAction: function(s, c, v) {
//          pvc.log("You clicked on series " + s + ", category " + c + ", value " + v);
//      },
        
        hoverable:  false,
        selectable: false,
        
//        selectionChangedAction: null,
//        userSelectionAction: null, 
            
        // Use CTRL key to make fine-grained selections
        ctrlSelectMode: true,
        clearSelectionMode: 'emptySpaceClick', // or null <=> 'manual' (i.e., by code)
        
        // Selection - Rubber band
        rubberBandFill: 'rgba(203, 239, 163, 0.6)', // 'rgba(255, 127, 0, 0.15)',
        rubberBandLine: '#86fe00', //'rgb(255,127,0)',
        
//        renderCallback: undefined,
//
//        margins:  undefined,
//        paddings: undefined,
//        
//        contentMargins:  undefined,
//        contentPaddings: undefined,
        
        compatVersion: Infinity // numeric, 1 currently recognized
    }
});

