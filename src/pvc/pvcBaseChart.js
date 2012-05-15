
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
     * The {@link #dataEngine} of a root chart 
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

    constructor: function(options) {
        this.parent = def.get(options, 'parent') || null;
        if(this.parent) {
            this.root = this.parent.root;
            this.dataEngine =
            this.data = def.get(options, 'dataEngine') ||
                        def.fail.argumentRequired('options.dataEngine');
            
            this.left = options.left;
            this.top  = options.top;
            this._visualRoles = this.parent._visualRoles;
            this._measureVisualRoles = this.parent._measureVisualRoles;
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
            // Child charts are created to consume existing data
            if(!this.allowNoData && this.resultset.length === 0) {
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
        this._initLegendPanel();
        
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
        var dataEngine = this.dataEngine;
        
        if(!this.parent) {
            if(!dataEngine || def.get(keyArgs, 'reloadData', true)) {
                
                var isReload = !!dataEngine;

                var complexType = dataEngine ?
                                    dataEngine.type :
                                    new pvc.data.ComplexType();
                
                var translation = this._createTranslation(complexType);
                translation.configureType();
                
                if(pvc.debug >= 3){
                    pvc.log(complexType.describe());
                }
                
                // ----------
                // Roles are bound before loading data,
                // in order to be able to filter datums
                // whose "every dimension in a measure role is null".
                this._bindVisualRoles(complexType);
                
                // ----------
                
                if(!dataEngine) {
                    dataEngine =
                        this.dataEngine =
                        this.data = new pvc.data.Data({type: complexType});
                } else {
                    // TODO: assert complexType has not changed...
                }
                
                // ----------

                var loadKeyArgs,
                    measureDimNames = this.measureDimensionsNames();
                if(measureDimNames.length) {
                    // Must have at least one measure role dimension not-null
                    loadKeyArgs = {
                       where: function(datum){
                            var atoms = datum.atoms;
                            return def.query(measureDimNames).any(function(dimName){
                               return atoms[dimName].value != null;
                            });
                       }
                    };
                }
                
                dataEngine.load(translation.execute(dataEngine), loadKeyArgs);
            } else {
                // TODO: Do this in a cleaner way. Give control to Data
                // We must at least dispose children and cache...
                data_disposeChildLists.call(dataEngine);
                data_syncDatumsState.call(dataEngine);
            }
        }

        if(this._legendColorScales){
            delete this._legendColorScales;
        }
        
        if(this.__partData){
            delete this.__partData;
        }
        
        if(pvc.debug){
            pvc.log(dataEngine.getInfo());
        }
    },
    
    _createTranslation: function(complexType){
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

        var translOptions = {
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
            valueNumberFormatter: options.valueFormat
        };
        
        var translationClass = translOptions.crosstabMode ? 
                pvc.data.CrosstabTranslationOper : 
                pvc.data.RelationalTranslationOper;

        return new translationClass(complexType, this.resultset, this.metadata, translOptions);
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
        }
    },

    _hasDataPartRole: function(){
        return false;
    },
    
    _addVisualRoles: function(roles){
        def.eachOwn(roles, function(keyArgs, name){
            var visualRole = new pvc.visual.Role(name, keyArgs);
            this._visualRoles[name] = visualRole;
            if(visualRole.isMeasure) {
                this._measureVisualRoles.push(visualRole);
            }
        }, this);
    },
    
    _bindVisualRoles: function(type){
        
        /* Process user specified mappings */
        var assignedVisualRoles = {};
        def.each(this.options.visualRoles, function(roleSpec, name){
            this._visualRoles[name] || 
                def.fail.argumentInvalid("The specified role name '{0}' is not supported by the chart type.", [name]);
            
            assignedVisualRoles[name] = pvc.data.GroupingSpec.parse(roleSpec, type);
        }, this);
        
        /* Bind Visual Roles dimensions assigned by user, 
         * to default dimensions 
         * and validate required'ness */
        def.eachOwn(this._visualRoles, function(role, name){
            if(def.hasOwn(assignedVisualRoles, name)) {
                role.bind(assignedVisualRoles[name]);
            } else {
                var dimName = role.defaultDimensionName;
                if(dimName) {
                    /* An asterisk at the end of the name indicates a dimension group default mapping */
                    var match = dimName.match(/^(.*?)(\*)?$/);
                    if(match) {
                        if(match[2]) {
                            var roleDimNames = type.groupDimensionsNames(match[1], {assertExists: false});
                            if(roleDimNames) {
                                role.bind(pvc.data.GroupingSpec.parse(roleDimNames, type));
                                return;
                            }
                        } else {
                            var roleDim = type.dimensions(dimName, {assertExists: false});
                            if(roleDim) {
                                role.bind(pvc.data.GroupingSpec.parse(dimName, type));
                                return;
                            }
                        }
                    }
                }
                
                if(role.isRequired) {
                    /* HACK */
                    if(name === 'series'){
                        type.addDimension(name, pvc.data.DimensionType.extendSpec(name, {isHidden: true}));
                        role.bind(pvc.data.GroupingSpec.parse(name, type));
                        return;
                    }
                    
                    throw def.error.operationInvalid("Chart type requires unassigned role '{0}'.", [name]);
                }
                
                // Unbind role from any previous binding
                role.bind(null);
            }
        }, this);
    },
    
    /**
     * Obtains the data that is assigned to a given role, given its name.
     * 
     * @param {string} roleName The role name.
     * @param {object} keyArgs Keyword arguments.
     * See additional available arguments in {@link pvc.data.Data#groupBy}.
     * 
     * @param {boolean} [keyArgs.singleLevelGrouping=false] 
     * Indicates that a single-grouping level data is desired.
     * If the role's grouping contains multiple levels, 
     * a single-level equivalent grouping is evaluated instead.
     * 
     * @param {boolean} [keyArgs.reverse=false] 
     * Indicates that the sort order of dimensions should be reversed.
     * 
     * @param {boolean} [keyArgs.assertExists=true] Indicates if an error should be thrown if the specified role name is undefined.
     * @returns {pvc.data.Data} The role's data if it exists or null if it does not. 
     */
    visualRoleData: function(roleName, keyArgs){
        var role = this._visualRoles[roleName];
        if(!role) {
            if(def.get(keyArgs, 'assertExists', true)) {
                throw def.error.argumentInvalid('roleName', "Undefined role name '{0}'.", [roleName]);
            }
            
            return null;
        }
        
        var grouping = role.grouping;
        if(def.get(keyArgs, 'singleLevelGrouping', false)) { 
            grouping = grouping.singleLevelGrouping(keyArgs);
        } else if(def.get(keyArgs, 'reverse', false)){
            grouping = grouping.reversed();
        }
        
        return this.dataEngine.groupBy(grouping, keyArgs);
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

    _partData: function(dataPartValue){
        if(!this.__partData){
            var dataPartRole = this.visualRoles('dataPart', {assertExists: false});
            if(!dataPartRole || !dataPartRole.grouping){
                this.__partData = this.data;
            } else {
                // Visible and not
                this.__partData = this.data.groupBy(dataPartRole.grouping.singleLevelGrouping());
            }
        }

        if(!dataPartValue){
            return this.__partData;
        }
        
        // TODO: should, at least, call some static method of Atom to build a global key
        return this.__partData._childrenByKey['dataPart:' + dataPartValue];
    },

    _partValues: function(){
        var dataPartRole = this.visualRoles('dataPart', {assertExists: false});
        if(!dataPartRole || !dataPartRole.grouping){
            return null;
        }
        
        return this._partData()
                   .children()
                   .select(function(child){ return child.value; })
                   .array();
    },

    _legendData: function(dataPartValue){
        var grouping = this.visualRoles(this.legendSource)
                           .grouping
                           .singleLevelGrouping();
        
        return this._partData(dataPartValue).groupBy(grouping);
    },

    _legendColorScale: function(dataPartValue){
        if(this.parent){
            return this.root._legendColorScale(dataPartValue);
        }

        if(!dataPartValue || !this.secondAxisColor){
            dataPartValue = '';
        }

        var scale = def.getOwn(this._legendColorScales, dataPartValue);
        if(!scale){
            var legendData = this._legendData(dataPartValue);
            var legendValues = legendData.children()
                                         .select(function(leaf){ return leaf.value; })
                                         .array();

            var colorsFactory = (!dataPartValue || dataPartValue === '0') ?
                                    this.colors :
                                    this.secondAxisColor;

            scale = colorsFactory(legendValues);
            
            (this._legendColorScales || (this._legendColorScales = {}))
                [dataPartValue] = scale;
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
     * Creates and initializes the legend panel,
     * if the legend is active.
     */
    _initLegendPanel: function(){
        var options = this.options;
        if (options.legend) {
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
        }
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
            }

            this.basePanel.render({
                bypassAnimation: bypassAnimation, 
                recreate: recreate
             });
            
        } catch (e) {
            if (e instanceof NoDataException) {
                
                pvc.log("No data found. Creating message.");
                
                var options = this.options,
                    pvPanel = new pv.Panel()
                                .canvas(options.canvas)
                                .width(options.width)
                                .height(options.height),
                    pvMsg   = pvPanel.anchor("center").add(pv.Label)
                                .text("No data found");
                
                this.extend(pvMsg, "noDataMessage_");
                
                pvPanel.render();

            } else {
                // We don't know how to handle this
                pvc.logError(e.message);
                throw e;
            }
        }
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
        !this.parent || def.fail.operationInvalid("Can only set resultset on root chart.");
        this.resultset = resultset;
        if (resultset.length == 0) {
            pvc.log("Warning: Resultset is empty");
        }
    },

    /**
     * Sets the metadata that, optionally, 
     * will give more information for building the chart.
     */
    setMetadata: function(metadata) {
        !this.parent || def.fail.operationInvalid("Can only set resultset on root chart.");
        this.metadata = metadata;
        if (metadata.length == 0) {
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
        var doLog = pvc.debug >= 3;
        if(doLog){
            pvc.log("Applying Extension Points for: '" + prefix +
                    "'" + (mark ? "" : "(target mark does not exist)"));
        }

        if (mark) {
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
                            if(doLog) {pvc.log("* " + m + ": locked extension point!");}
                        } else if(mark.isIntercepted && mark.isIntercepted(m)) {
                            if(doLog) {pvc.log("* " + m + ":" + JSON.stringify(v) + " (controlled)");}
                        } else {
                            if(doLog) { pvc.log("* " + m + ": " + JSON.stringify(v)); }

                            // Distinguish between mark methods and properties
                            if (typeof mark[m] === "function") {
                                mark[m](v);
                            } else {
                                mark[m] = v;
                            }
                        }
                    }
                }
            }
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
        if(this.dataEngine.owner.clearSelected()) {
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
                    var selections = this.dataEngine.selectedDatums();
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
