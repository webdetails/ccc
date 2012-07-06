
/**
 * BoxplotChart is the main class for generating... categorical boxplotcharts.
 * 
 * The boxplot is used to represent the distribution of data using:
 *  - a box to represent the region that contains 50% of the datapoints,
 *  - the whiskers to represent the regions that contains 95% of the datapoints, and
 *  - a center line (in the box) that represents the median of the dataset.
 * For more information on boxplots you can visit  http://en.wikipedia.org/wiki/Box_plot
 *
 * If you have an issue or suggestions regarding the ccc BoxPlot-charts
 * please contact CvK at cde@vinzi.nl
 */
pvc.BoxplotChart = pvc.CategoricalAbstract.extend({
    constructor: function(options){

        this.base(options);

        // Apply options
        pvc.mergeDefaults(this.options, pvc.BoxplotChart.defaultOptions, options);

        this._axisRoleNameMap.ortho = pvc.BoxplotChart.measureRolesNames;
    },

     _processOptionsCore: function(options){
         this.base.apply(this, arguments);

         options.secondAxis = options.showLines || options.showDots || options.showAreas;
         // Not supported
         options.secondAxisIndependentScale = false;
         options.stacked = false;
         options.legend  = false;
     },

    /**
     * Prevents creation of the series role by the cartesian charts base class.
     */
    _getSeriesRoleSpec: function(){
        return null;
    },

    _hasDataPartRole: function(){
        return true;
    },
    
    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){

        this.base();

        var roleSpecBase = {
                isMeasure: true,
                requireSingleDimension: true,
                requireIsDiscrete: false,
                valueType: Number
            };

        var rolesSpec = def.query([
                {name: 'median',      label: 'Median',        defaultDimensionName: 'median', isRequired: true},
                {name: 'percentil25', label: '25% Percentil', defaultDimensionName: 'percentil25'},
                {name: 'percentil75', label: '75% Percentil', defaultDimensionName: 'percentil75'},
                {name: 'percentil5',  label: '5% Percentil',  defaultDimensionName: 'percentil5' },
                {name: 'percentil95', label: '95% Percentil', defaultDimensionName: 'percentil95'}
            ])
            .object({
                name:  function(info){ return info.name; },
                value: function(info){ return def.create(roleSpecBase, info); }
            });
        
        this._addVisualRoles(rolesSpec);
    },
    
    _createTranslation: function(complexType, translOptions){
        return new pvc.data.BoxplotChartTranslationOper(
                        this,
                        complexType,
                        this.resultset,
                        this.metadata,
                        translOptions);
    },

    _getAxisDataParts: function(/*axis*/){
        return null;
    },

    _isDataCellStacked: function(/*role, dataPartValue*/){
        return false;
    },

    /* @override */
    _createMainContentPanel: function(parentPanel){
        if(pvc.debug >= 3){
            pvc.log("Prerendering in boxplotChart");
        }
        
        var options = this.options;
        
        var boxPanel = new pvc.BoxplotChartPanel(this, parentPanel, {
            orientation:   options.orientation,
            // boxplot specific options
            boxSizeRatio:  options.boxSizeRatio,
            maxBoxSize:    options.maxBoxSize,
            boxplotColor:  options.boxplotColor
        });

        if(options.secondAxis){
            if(pvc.debug >= 3){
                pvc.log("Creating LineDotArea panel.");
            }

            var linePanel = new pvc.LineDotAreaPanel(this, parentPanel, {
                orientation:    options.orientation,
                stacked:        false,
                showValues:     !(options.compatVersion <= 1) && options.showValues,
                valuesAnchor:   options.valuesAnchor,
                showLines:      options.showLines,
                showDots:       options.showDots,
                showAreas:      options.showAreas,
                nullInterpolationMode: options.nullInterpolationMode
            });

            this._linePanel = linePanel;
        }

        return boxPanel;
    }
}, {
    measureRolesNames: ['median', 'percentil25', 'percentil75', 'percentil5', 'percentil95'],
    defaultOptions: {
        boxplotColor: 'darkgreen',
        boxSizeRatio: 1/3,
        maxBoxSize:   Infinity,
        showDots:     false,
        showLines:    false,
        showAreas:    false,
        nullInterpolationMode: 'none',
        showValues:   false,
        valuesAnchor: 'right'
    }
});

/*
 * Boxplot chart panel generates the actual box-plot with a categorical base-axis.
 * for more information on the options see the documentation file.
 */
pvc.BoxplotChartPanel = pvc.CartesianAbstractPanel.extend({
    anchor: 'fill',
    
    /**
     * @override
     */
    _createCore: function(){

        this.base();
        
        var rootScene = this._buildScene();

        var a_bottom = this.isOrientationVertical() ? "bottom" : "left",
            a_left   = this.anchorOrtho(a_bottom),
            a_width  = this.anchorLength(a_bottom),
            a_height = this.anchorOrthoLength(a_bottom),
            strokeColor  = pv.color(this.boxplotColor),
            boxFillColor = pv.color('limegreen')
            ;

        /* Category Panel */
        this.pvBoxPanel = this.pvPanel.add(pv.Panel)
            .data(rootScene.childNodes)
            [a_left ](function(scene){
                var catAct = scene.acts.category;
                return catAct.x - catAct.width / 2;
            })
            [a_width](function(scene){ return scene.acts.category.width; })
            ;

        /* V Rules */
        function setupVRule(rule){
            rule.lock(a_left, function(){ 
                    return this.pvMark.parent[a_width]() / 2;
                })
                .override('defaultColor', function(type){
                    if(type === 'stroke') { 
                        return strokeColor;
                    }
                })
                ;

            return rule;
        }

        this.pvVRuleTop = setupVRule(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:  'boxVRule',
                freePosition: true,
                noHoverable:  false
            }))
            .intercept('visible', function(scene){
                return scene.acts.category.showVRuleAbove && this.delegate(true);
            })
            .lock(a_bottom, function(scene){ return scene.acts.category.vRuleAboveBottom; })
            .lock(a_height, function(scene){ return scene.acts.category.vRuleAboveHeight; })
            .pvMark
            ;

        this.pvVRuleBot = setupVRule(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:  'boxVRule',
                freePosition: true,
                noHoverable:  false
            }))
            .intercept('visible', function(scene){
                return scene.acts.category.showVRuleBelow && this.delegate(true);
            })
            .lock(a_bottom, function(scene){ return scene.acts.category.vRuleBelowBottom; })
            .lock(a_height, function(scene){ return scene.acts.category.vRuleBelowHeight; })
            .pvMark
            ;

        /* Box Bar */
        function setupHCateg(sign){
            sign.lock(a_left,  function(scene){ return scene.acts.category.boxLeft;  })
                .lock(a_width, function(scene){ return scene.acts.category.boxWidth; })
                ;
            
            return sign;
        }

        this.pvBar = setupHCateg(new pvc.visual.Bar(this, this.pvBoxPanel, {
                extensionId: 'boxBar',
                freePosition: true,
                normalStroke: true
            }))
            .intercept('visible', function(scene){
                return scene.acts.category.showBox && this.delegate(true);
            })
            .lock(a_bottom, function(scene){ return scene.acts.category.boxBottom; })
            .lock(a_height, function(scene){ return scene.acts.category.boxHeight; })
            .override('defaultColor', function(type){
                switch(type){
                    case 'fill':   return boxFillColor;
                    case 'stroke': return strokeColor;
                }
            })
            .override('defaultStrokeWidth', def.fun.constant(1))
            .pvMark
            ;

        /* H Rules */
        function setupHRule(rule){
            setupHCateg(rule);
            
            rule.override('defaultColor', function(type){
                    if(type === 'stroke') { return strokeColor; }
                })
                ;
            return rule;
        }
        
        this.pvHRule5 = setupHRule(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:  'boxHRule5',
                freePosition: true,
                noHoverable:  false
            }))
            .intercept('visible', function(){
                return this.scene.acts.percentil5.value != null && this.delegate(true);
            })
            .lock(a_bottom,  function(){ return this.scene.acts.percentil5.position; }) // bottom
            .pvMark
            ;

        this.pvHRule95 = setupHRule(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:  'boxHRule95',
                freePosition: true,
                noHoverable:  false
            }))
            .intercept('visible', function(){
                return this.scene.acts.percentil95.value != null && this.delegate(true);
            })
            .lock(a_bottom,  function(){ return this.scene.acts.percentil95.position; }) // bottom
            .pvMark
            ;

        this.pvHRule50 = setupHRule(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:  'boxHRule50',
                freePosition: true,
                noHoverable:  false
            }))
            .intercept('visible', function(){
                return this.scene.acts.median.value != null && this.delegate(true);
            })
            .lock(a_bottom,  function(){ return this.scene.acts.median.position; }) // bottom
            .override('defaultStrokeWidth', def.fun.constant(2))
            .pvMark
            ;
    },

    /**
     * @override
     */
    applyExtensions: function(){

        this.base();

        // Extend bar and barPanel
        this.extend(this.pvBoxPanel, "boxPanel_");
        this.extend(this.pvBoxPanel, "box_");
        this.extend(this.pvBar,      "boxBar_");
        this.extend(this.hRule50,    "boxHRule50_");
        this.extend(this.hRule5,     "boxHRule5_");
        this.extend(this.hRule95,    "boxHRule95_");
        this.extend(this.pvVRuleTop, "boxVRule_");
        this.extend(this.pvVRuleBot, "boxVRule_");
    },

    /**
     * Renders this.pvScatterPanel - the parent of the marks that are affected by interaction changes.
     * @override
     */
    _renderInteractive: function(){
        this.pvBoxPanel.render();
    },

    /**
     * Returns an array of marks whose instances are associated to a datum or group, or null.
     * @override
     */
    _getSignums: function(){
        return [this.pvBar];
    },

    _buildScene: function(){
        var chart = this.chart,
            measureRolesDimNames = def.query(chart.measureVisualRoles()).object({
                name:  function(role){ return role.name; },
                value: function(role){ return role.firstDimensionName(); }
            }),
            visibleKeyArgs = {visible: true, zeroIfNone: false},
            data = this._getVisibleData(),
            rootScene  = new pvc.visual.Scene(null, {panel: this, group: data}),
            baseScale  = chart.axes.base.scale,
            bandWidth  = baseScale.range().band,
            boxWidth   = Math.min(bandWidth * this.boxSizeRatio, this.maxBoxSize),
            orthoScale = chart.axes.ortho.scale
            ;

        /**
         * Create starting scene tree
         */
        data.children() // categories
            .each(createCategScene, this);

        return rootScene;
        
        function createCategScene(categData){
            var categScene = new pvc.visual.Scene(rootScene, {group: categData}),
                acts = categScene.acts;
            
            var catAct = acts.category = {
                value:     categData.value,
                label:     categData.label,
                group:     categData,
                x:         baseScale(categData.value),
                width:     bandWidth,
                boxWidth:  boxWidth
            };

            catAct.boxLeft = bandWidth / 2 - boxWidth / 2;
            
            chart.measureVisualRoles().forEach(function(role){
                var dimName = measureRolesDimNames[role.name],
                    act;

                if(dimName){
                    var dim = categData.dimensions(dimName),
                        value = dim.sum(visibleKeyArgs);
                    act = {
                        value: value,
                        label: dim.format(value),
                        position: orthoScale(value)
                    };
                } else {
                    act = {
                        value: null,
                        label: "",
                        position: null
                    };
                }

                acts[role.name] = act;
            });

            var has05 = acts.percentil5.value  != null,
                has25 = acts.percentil25.value != null,
                has50 = acts.median.value != null,
                has75 = acts.percentil75.value != null,
                bottom,
                top;

            var show = has25 || has75;
            if(show){
                bottom = has25 ? acts.percentil25.position :
                         has50 ? acts.median.position :
                         acts.percentil75.position
                         ;

                top    = has75 ? acts.percentil75.position :
                         has50 ? acts.median.position :
                         acts.percentil25.position
                         ;

                show = (top !== bottom);
                if(show){
                    catAct.boxBottom = bottom;
                    catAct.boxHeight = top - bottom;
                }
            }
            
            catAct.showBox  = show;
            
            // vRules
            show = acts.percentil95.value != null;
            if(show){
                bottom = has75 ? acts.percentil75.position :
                         has50 ? acts.median.position :
                         has25 ? acts.percentil25.position :
                         has05 ? acts.percentil5.position  :
                         null
                         ;
                
                show = bottom != null;
                if(show){
                    catAct.vRuleAboveBottom = bottom;
                    catAct.vRuleAboveHeight = acts.percentil95.position - bottom;
                }
            }

            catAct.showVRuleAbove = show;

            // ----

            show = has05;
            if(show){
                top = has25 ? acts.percentil25.position :
                      has50 ? acts.median.position :
                      has75 ? acts.percentil75.position :
                      null
                      ;

                show = top != null;
                if(show){
                    bottom = acts.percentil5.position;
                    catAct.vRuleBelowHeight = top - bottom;
                    catAct.vRuleBelowBottom = bottom;
                }
            }
            
            catAct.showVRuleBelow = show;
            
            // has05 = acts.percentil5.value  != null,
        }
    }
});
