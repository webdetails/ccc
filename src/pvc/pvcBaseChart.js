
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
     * The version value of the current/last pre-render phase.
     * 
     * <p>
     * This value is changed on each pre-render of the chart.
     * It can be useful to invalidate cached information that 
     * is only valid for each pre-render.
     * </p>
     * <p>
     * Version values can be compared using the identity operator <tt>===</tt>.
     * </p>
     * 
     * @type any
     */
    _preRenderVersion: 0,
    
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
    
    __partData: null,

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
     * List of legend groups.
     */
    legendGroupsList: null,

    /**
     * Map of legend groups by id.
     */
    legendGroups: null,

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

    constructor: function(options) {
        var parent = this.parent = def.get(options, 'parent') || null;
        if(parent) {
            this.root = parent.root;
            this.dataEngine =
            this.data = def.get(options, 'data') ||
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

        this.options = pvc.mergeDefaults({}, pvc.BaseChart.defaultOptions, options);
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
        if(pvc.debug >= 3 && options){
            try {
                pvc.log("OPTIONS:\n" + JSON.stringify(options));
            }catch(ex) {
                /* SWALLOW usually a circular JSON structure */
            }
        }

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

        var margins = options.margins;
        if(margins){
            options.margins = this._parseMargins(margins);
        }
        
        // Sanitize some options
        if(options.showTooltips){
            var tipsySettings = options.tipsySettings;
            if(tipsySettings){
                tipsySettings = options.tipsySettings = def.create(tipsySettings);
                this.extend(tipsySettings, "tooltip_");
                if(tipsySettings.exclusionGroup === undefined) {
                    tipsySettings.exclusionGroup = 'chart';
                }
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
        this._preRenderVersion++;
        
        this.isPreRendered = false;

        if(pvc.debug >= 3){
            pvc.log("Prerendering in pvc");
        }
        
        if (!this.parent) {
            // If we don't have data, we just need to set a "no data" message
            // and go on with life.
            // Child charts are created to consume *existing* data
            if(!this.allowNoData && this.resultset.length === 0) {
                /*global NoDataException:true */
                throw new NoDataException();
            }
            
            // Now's as good a time as any to completely clear out all
            //  tipsy tooltips
            pvc.removeTipsyLegends();
        }

        /* Options may be changed between renders */
        this._processOptions();
        
        /* Initialize root chart roles */
        if(!this.parent && this._preRenderVersion === 1) {
            this._initVisualRoles();
            this._bindVisualRolesPre();
        }

        /* Initialize the data engine */
        this._initData(keyArgs);

        /* Create color schemes */
        this.colors = pvc.createColorScheme(options.colors);

        if(options.secondAxis){
            var ownColors = options.secondAxisOwnColors;
            if(ownColors == null){
                ownColors = options.compatVersion <= 1;
            }
            
            if(ownColors){
                /* if secondAxisColor is unspecified, assumes default color scheme. */
                this.secondAxisColor = pvc.createColorScheme(options.secondAxisColor);
            }
        }
        
        /* Initialize chart panels */
        this._initBasePanel();
        this._initTitlePanel();
        this._initLegend();
        
        if(!this.parent && this._isRoleAssigned('multiChartColumn')) {
            this._initMultiChartPanel();
        } else {
            this._preRenderCore();
        }

        this.isPreRendered = true;
    },

    /**
     * Override to create chart specific content panels here.
     * No need to call base.
     * @virtual
     */
    _preRenderCore: function(){
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

        if(this._legendColorScales){
            delete this._legendColorScales;
        }
        
        if(this.__partData){
            delete this.__partData;
        }
        
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
                this.data = new pvc.data.Data({type: complexType});
        } // else TODO: assert complexType has not changed...
        
        // ----------

        var loadFilter = this._getLoadFilter(),
            loadKeyArgs = loadFilter ? {where: loadFilter} : null;

        data.load(translation.execute(data), loadKeyArgs);
    },

    _getLoadFilter: function(){
        var measureDimNames = this.measureDimensionsNames(),
            M = measureDimNames.length;
        if(M) {
            // Must have at least one measure role dimension not-null
            return function(datum){
                var atoms = datum.atoms;
                for(var i = 0 ; i < M ; i++){
                    if(atoms[measureDimNames[i]].value != null){
                        return true;
                    }
                }

                if(pvc.debug >= 4){
                    pvc.log("Datum excluded.");
                }

                return false;
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

            if(secondAxisSeriesIndexes == null){
                options.secondAxis = false;
            }
        }

        var valueFormat = options.valueFormat,
            valueFormatter;
        if(valueFormat && valueFormat !== pvc.BaseChart.defaultOptions.valueFormat){
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

            multiChartColumnIndexes: options.multiChartColumnIndexes,
            multiChartRowIndexes: options.multiChartRowIndexes,

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
            multiChartColumn: {defaultDimensionName: 'multiChartColumn*'},
            multiChartRow:    {defaultDimensionName: 'multiChartRow*'}
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
        /* Process user specified bindings */
        var boundDimNames = {};
        def.each(this.options.visualRoles, function(roleSpec, name){
            var visualRole = this._visualRoles[name] ||
                def.fail.argumentInvalid("Role '{0}' is not supported by the chart type.", [name]);

            // !roleSpec results in a null grouping being preBound
            // A pre bound null grouping is later discarded in the post bind
            if(roleSpec !== undefined){
                var grouping = pvc.data.GroupingSpec.parse(roleSpec);

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
            def.array(dimNames).forEach(function(dimName){
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

    _partData: function(dataPartValues){
        if(!this.__partData){
            if(!this._dataPartRole || !this._dataPartRole.grouping){
                /* Undefined or unbound */
                this.__partData = this.data;
            } else {
                // Visible and not
                this.__partData = this._dataPartRole.flatten(this.data);
            }
        }
        
        if(!dataPartValues){
            return this.__partData;
        }

        dataPartValues = def.query(dataPartValues).distinct().array();
        dataPartValues.sort();

        var dataPartDimName = this._dataPartRole.firstDimensionName();

        if(dataPartValues.length === 1){
            // Faster this way...
            // TODO: should, at least, call some static method of Atom to build a global key
            return this.__partData._childrenByKey[dataPartDimName + ':' + dataPartValues[0]];
        }

        return this.__partData.where([
                    def.set({}, dataPartDimName, dataPartValues)
                ]);
    },

    _partValues: function(){
        if(!this._dataPartRole || !this._dataPartRole.grouping){
            /* Undefined or unbound */
            return null;
        }
        
        return this._partData()
                   .children()
                   .select(function(child){ return child.value; })
                   .array();
    },

    _legendData: function(dataPartValues){
        var role = this.visualRoles(this.legendSource, {assertExists: false});
        return role ? role.flatten(this._partData(dataPartValues)) : null;
    },

    _legendColorScale: function(dataPartValues){
        if(this.parent){
            return this.root._legendColorScale(dataPartValues);
        }

        if(!dataPartValues || !this.secondAxisColor){
            dataPartValues = '';
        }

        var key = '' + (dataPartValues ? dataPartValues : ''), // relying on Array.toString;
            scale = def.getOwn(this._legendColorScales, key);

        if(!scale){
            var legendData = this._legendData(dataPartValues),
                colorsFactory = (!key || key === '0') ? this.colors : this.secondAxisColor
                ;
            if(legendData){
                var legendValues = legendData.children()
                                            .select(function(leaf){ return leaf.value; })
                                            .array();

                

                scale = colorsFactory(legendValues);
            } else {
                scale = colorsFactory();
            }
            
            (this._legendColorScales || (this._legendColorScales = {}))[key] = scale;
        }

        return scale;
    },

    /**
     * Creates and initializes the base panel.
     */
    _initBasePanel: function() {
        var options = this.options,
            margins = options.margins,
            basePanelParent = this.parent && this.parent._multiChartPanel;
        
        this.basePanel = new pvc.BasePanel(this, basePanelParent);
        this.basePanel.setSize(options.width, options.height);
        
        if(margins){
            this.basePanel.setMargins(margins);
        }
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
                anchor:     options.titlePosition,
                titleSize:  options.titleSize,
                titleAlign: options.titleAlign
            });
        }
    },

    /**
     * Initializes the legend,
     * if the legend is active.
     */
    _initLegend: function(){
        if (this.options.legend) {
            this.legendGroupsList = [];
            this.legendGroups     = {};

            this._initLegendGroups();
            this._initLegendPanel();
        }
    },

    /**
     * Initializes the legend groups of a chart.
     *
     * The default implementation registers
     * one legend group for each existing data part value
     * for the dimension in {@link #legendSource}.
     *
     * Legend groups are registered with the id prefix "part"
     * followed by the corresponding part value.
     */
    _initLegendGroups: function(){
        var partValues = this._partValues() || [null],
            me = this;

        partValues.forEach(function(partValue){
            var partData = this._legendData(partValue);
            if(partData){
                var partColorScale = this._legendColorScale(partValue),
                    partShape = (!partValue || partValue === '0' ? 'square' : 'bar'),
                    legendGroup = {
                        id:        "part" + partValue,
                        type:      "discreteColorAndShape",
                        partValue: partValue,
                        partLabel: partData.label,
                        group:     partData,
                        items:     []
                    },
                    legendItems = legendGroup.items;
            
                partData
                    .children()
                    .each(function(itemData){
                        legendItems.push({
                            value:    itemData.value,
                            label:    itemData.label,
                            group:    itemData,
                            color:    partColorScale(itemData.value),
                            useRule:  undefined,
                            shape:    partShape,
                            isOn: function(){
                                return this.group.datums(null, {visible: true}).any();
                            },
                            click: function(){
                                pvc.data.Data.toggleVisible(this.group.datums());

                                // Re-render chart
                                me.render(true, true, false);
                            }
                        });
                    }, this);

                this._addLegendGroup(legendGroup);
            }
        }, this);
    },

    _addLegendGroup: function(legendGroup){
        var id = legendGroup.id;
        /*jshint expr:true */
        !def.hasOwn(this.legendGroups, id) || 
            def.fail.argumentInvalid('legendGroup', "Duplicate legend group id.");
        
        legendGroup.index = this.legendGroupsList.length;
        this.legendGroups[id] = legendGroup;
        this.legendGroupsList.push(legendGroup);
    },

    /**
     * Creates and initializes the legend panel.
     */
    _initLegendPanel: function(){
        var options = this.options;
        this.legendPanel = new pvc.LegendPanel(this, this.basePanel, {
            anchor:     options.legendPosition,
            legendSize: options.legendSize,
            font:       options.legendFont,
            align:      options.legendAlign,
            minMarginX: options.legendMinMarginX,
            minMarginY: options.legendMinMarginY,
            textMargin: options.legendTextMargin,
            padding:    options.legendPadding,
            shape:      options.legendShape,
            markerSize: options.legendMarkerSize,
            drawLine:   options.legendDrawLine,
            drawMarker: options.legendDrawMarker
        });
    },

    /**
     * Creates and initializes the multi-chart panel.
     */
    _initMultiChartPanel: function(){
        this._multiChartPanel = new pvc.MultiChartPanel(this, this.basePanel);
    },
    
    /**
     * Render the visualization.
     * If not pre-rendered, do it now.
     */
    render: function(bypassAnimation, recreate, reloadData) {
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
            var isNoData = (e instanceof NoDataException);
            if (isNoData) {
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
            this.extend(pvMsg, "noDataMessage_");
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
    
    /**
     * This is the method to be used for the extension points
     * for the specific contents of the chart. already ge a pie
     * chart! Goes through the list of options and, if it
     * matches the prefix, execute that method on the mark.
     * WARNING: It's the user's responsibility to make sure that
     * unexisting methods don't blow this.
     */
    extend: function(mark, prefix, keyArgs) {
        // if mark is null or undefined, skip
        if (mark) {
            var logOut = pvc.debug >= 3 ? [] : null;
            
            var points = this.options.extensionPoints;
            if(points){
                for (var p in points) {
                    // Starts with
                    if(p.indexOf(prefix) === 0){
                        var m = p.substring(prefix.length);

                        // Not everything that is passed to 'mark' argument
                        //  is actually a mark...(ex: scales)
                        // Not locked and
                        // Not intercepted and
                        var v = points[p];
                        if(mark.isLocked && mark.isLocked(m)){
                            if(logOut) {logOut.push(m + ": locked extension point!");}
                        } else if(mark.isIntercepted && mark.isIntercepted(m)) {
                            if(logOut) {logOut.push(m + ":" + JSON.stringify(v) + " (controlled)");}
                        } else {
                            if(logOut) {logOut.push(m + ": " + JSON.stringify(v)); }

                            // Extend object css and svg properties
                            if(v && (m === 'svg' || m === 'css') && typeof v === 'object'){
                                var v2 = mark.getStaticPropertyValue(m);
                                if(v2){
                                    v = def.copy(v2, v);
                                }
                            }
                            
                            // Distinguish between mark methods and properties
                            if (typeof mark[m] === "function") {
                                mark[m](v);
                            } else {
                                mark[m] = v;
                            }
                        }
                    }
                }

                if(logOut){
                    if(logOut.length){
                        pvc.log("Applying Extension Points for: '" + prefix + "'\n\t* " + logOut.join("\n\t* "));
                    } else if(pvc.debug >= 4) {
                        pvc.log("Applying Extension Points for: '" + prefix + "' (none)");
                    }
                }
            }
        } else if(pvc.debug >= 4){
            pvc.log("Applying Extension Points for: '" + prefix + "' (target mark does not exist)");
        }
    },

    /**
     * Obtains the specified extension point.
     * Arguments are concatenated with '_'.
     */
    _getExtension: function(extPoint) {
        var points = this.options.extensionPoints;
        if(!points){
            return undefined; // ~warning
        }

        extPoint = pvc.arraySlice.call(arguments).join('_');
        return points[extPoint];
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
    
    isOrientationVertical: function(orientation) {
        return (orientation || this.options.orientation) === "vertical";
    },

    isOrientationHorizontal: function(orientation) {
        return (orientation || this.options.orientation) == "horizontal";
    },

    /**
     * Converts a css-like shorthand margin string
     * to a margins object.
     *
     * <ol>
     *   <li> "1" - {all: 1}</li>
     *   <li> "1 2" - {top: 1, left: 2, right: 2, bottom: 1}</li>
     *   <li> "1 2 3" - {top: 1, left: 2, right: 2, bottom: 3}</li>
     *   <li> "1 2 3 4" - {top: 1, right: 2, bottom: 3, left: 4}</li>
     * </ol>
     */
    _parseMargins: function(margins){
        if(margins != null){
            if(typeof margins === 'string'){

                var comps = margins.split(/\s+/);
                switch(comps.length){
                    case 1:
                        margins = {all: comps[0]};
                        break;
                    case 2:
                        margins = {top: comps[0], left: comps[1], right: comps[1], bottom: comps[0]};
                        break;
                    case 3:
                        margins = {top: comps[0], left: comps[1], right: comps[1], bottom: comps[2]};
                        break;
                    case 4:
                        margins = {top: comps[0], right: comps[2], bottom: comps[3], left: comps[4]};
                        break;

                    default:
                        if(pvc.debug) {
                            pvc.log("Invalid 'margins' option value: " + JSON.stringify(margins));
                        }
                        margins = null;
                }
            } else if (typeof margins === 'number') {
                margins = {all: margins};
            } else if (typeof margins !== 'object') {
                if(pvc.debug) {
                    pvc.log("Invalid 'margins' option value: " + JSON.stringify(margins));
                }
                margins = null;
            }
        }

        return margins;
    },
    
    /**
     * Disposes the chart, any of its panels and child charts.
     */
    dispose: function(){
        if(!this._disposed){
            
            // TODO: 
            
            this._disposed = true;
        }
    }
}, {
    // NOTE: undefined values are not considered by $.extend
    // and thus BasePanel does not receive null properties...
    defaultOptions: {
        canvas: null,

        width:  400,
        height: 300,
        
        multiChartLimit: null,
        multiChartWrapColumn: 3,
        
        orientation: 'vertical',
        
        extensionPoints:   undefined,
        
        visualRoles:       undefined,
        dimensions:        undefined,
        dimensionGroups:   undefined,
        readers:           undefined,
        
        crosstabMode:      true,
        multiChartColumnIndexes: undefined,
        multiChartRowIndexes: undefined,
        isMultiValued:     false,
        seriesInRows:      false,
        measuresIndexes:   undefined,
        dataOptions:       undefined,
        
        timeSeries:        undefined,
        timeSeriesFormat:  undefined,

        animate: true,

        title:         null,
        titlePosition: "top", // options: bottom || left || right
        titleAlign:    "center", // left / right / center
        titleSize:     undefined,

        legend:           false,
        legendPosition:   "bottom",
        legendFont:       undefined,
        legendSize:       undefined,
        legendAlign:      undefined,
        legendMinMarginX: undefined,
        legendMinMarginY: undefined,
        legendTextMargin: undefined,
        legendPadding:    undefined,
        legendShape:      undefined,
        legendDrawLine:   undefined,
        legendDrawMarker: undefined,
        legendMarkerSize: undefined,
        
        colors: null,

        secondAxis: false,
        secondAxisIdx: -1,
        secondAxisSeriesIndexes: undefined,
        secondAxisColor: undefined,
        secondAxisOwnColors: undefined, // false

        showTooltips: true,
        
        tooltipFormat: undefined,
        
        v1StyleTooltipFormat: function(s, c, v, datum) {
            return s + ", " + c + ":  " + this.chart.options.valueFormat(v) +
                   (datum && datum.percent ? ( " (" + datum.percent.label + ")") : "");
        },
        
        tipsySettings: {
            gravity: "s",
            delayIn:  400,
            offset:   2,
            opacity:  0.7,
            html:     true,
            fade:     true
        },
        
        valueFormat: function(d) {
            return pv.Format.number().fractionDigits(0, 2).format(d);
            // pv.Format.number().fractionDigits(0, 10).parse(d));
        },
        
        /* For numeric values in percentage */
        percentValueFormat: function(d){
            return pv.Format.number().fractionDigits(0, 2).format(d) + "%";
        },
        
        // Content/Plot area clicking
        clickable:  false,
        clickAction: null,
        doubleClickAction: null,
        doubleClickMaxDelay: 300, //ms
//      clickAction: function(s, c, v) {
//          pvc.log("You clicked on series " + s + ", category " + c + ", value " + v);
//      },
        
        hoverable:  false,
        selectable: false,
        selectionChangedAction: null,
        
        // Selection
        // Use CTRL key to make fine-grained selections
        ctrlSelectMode: true,
        // Selection - Rubber band
        rubberBandFill: 'rgba(203, 239, 163, 0.6)', // 'rgba(255, 127, 0, 0.15)',
        rubberBandLine: '#86fe00', //'rgb(255,127,0)',
        
        renderCallback: undefined,

        margins: undefined,
        
        compatVersion: Infinity // numeric, 1 currently recognized
    }
});
