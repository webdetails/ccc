
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

        // Add percentil dimension group defaults
        // This only helps in default bindings...
        var dimGroups = this.options.dimensionGroups || (this.options.dimensionGroups = {});
        var percentilDimGroup = dimGroups.percentil || (dimGroups.percentil = {});
        if(percentilDimGroup.valueType === undefined){
            percentilDimGroup.valueType = Number;
            percentilDimGroup.label = "{0}% Percentil"; // replaced by dim group level + 1
        }

        var medianDimGroup = dimGroups.median || (dimGroups.median = {});
        if(medianDimGroup.valueType === undefined){
            medianDimGroup.valueType = Number;
        }
    },

     _processOptionsCore: function(options){
         this.base.call(this, arguments);

         options.secondAxis = options.showLines || options.showDots || options.showAreas;
         // Not supported
         options.secondAxisIndependentScale = false;
         options.stacked = false;
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

        var rolesSpec = def.scope(function(){

            var roleSpecBase = {
                    isMeasure: true,
                    requireSingleDimension: true,
                    requireIsDiscrete: false,
                    valueType: Number
                };

            return def.query([
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
        });

        this._addVisualRoles(rolesSpec);

        this._axisRoleNameMap.ortho = pvc.BoxplotChart.measureRolesNames;
    },
    
    _createTranslation: function(complexType){
        var translation = this.base(complexType),
            /*
             * By now the translation has already been initialized
             * and its virtualItemSize is determined.
             */
            freeSize = translation.freeVirtualItemSize()
            ;

        /* Configure the translation with default dimensions readers. */
        var autoDimsReaders = [];

        function addRole(name){
            var visualRole = this.visualRoles(name);
            if(!visualRole.isPreBound()){
                var dimName = visualRole.defaultDimensionName.match(/^(.*?)(\*)?$/)[1];
                if(!complexType.dimensions(dimName, {assertExists: false})){
                    autoDimsReaders.push(dimName);
                }
            }
        }

        addRole.call(this, 'category');
        pvc.BoxplotChart.measureRolesNames.forEach(addRole, this);

        autoDimsReaders.slice(0, freeSize);

        if(autoDimsReaders.length){
            translation.defReader({names: autoDimsReaders});
        }
       
        return translation;
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
                showAreas:      options.showAreas
            });

            this._linePanel = linePanel;
        }

        return boxPanel;
    }
}, {
    measureRolesNames: ['median', 'percentil25', 'percentil75', 'percentil5', 'percentil95'],
    defaultOptions: {
        crosstabMode: false,
        seriesInRows: false,
        boxplotColor: "darkgreen",
        boxSizeRatio: 1/3,
        maxBoxSize:   Infinity,
        showDots:  false,
        showLines: false,
        showAreas: false,
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

        var myself = this,
            a = this.isOrientationVertical() ? "bottom" : "left",
            anchor = a,
            ao  = this.anchorOrtho(anchor),
            al  = this.anchorLength(anchor),
            aol = this.anchorOrthoLength(anchor),
            strokeColor = pv.color(this.boxplotColor),
            boxFillColor = pv.color('limegreen')
            ;

        // Define a panel for each category label.
        // later the individuals bars of series will be drawn in
        // these panels.
        this.pvBoxPanel = this.pvPanel.add(pv.Panel)
            .data(rootScene.childNodes)
            [ao](function(scene){ return scene.acts.category.position; }) // left
            [al](function(scene){ return scene.acts.category.length; }) // width
            ;
            
        function setupVRule(rule){
            rule.lock(ao,  function(){ return this.pvMark.parent[al]() / 2; }) // left
                .override('defaultColor', function(type){
                    if(type === 'stroke') { return strokeColor; }
                })
                ;

            return rule;
        }

        this.pvVRuleTop = setupVRule(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:  'boxVRule',
                freePosition: true,
                noHoverable: false
            }))
            .lock(a,   function(){ return this.scene.acts.percentil75.position; }) // bottom
            .lock(aol, function(){ // height
                var acts = this.scene.acts;
                return acts.percentil95.position - acts.percentil75.position;
            })
            .pvMark
            ;


        this.pvVRuleBot = setupVRule(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:  'boxVRule',
                freePosition: true,
                noHoverable: false
            }))
            .lock(a,   function(){ return this.scene.acts.percentil5.position; }) // bottom
            .lock(aol, function(){ // height
                var acts = this.scene.acts;
                return acts.percentil25.position - acts.percentil5.position;
            })
            .pvMark
            ;
        
        this.pvBar = new pvc.visual.Bar(this, this.pvBoxPanel, {
                extensionId: 'boxBar',
                freePosition: true,
                normalStroke: true
            })
            .lock(a,   function(){ return this.scene.acts.percentil25.position; }) // bottom
            .lock(aol, function(){ // height
                var acts = this.scene.acts;
                return acts.percentil75.position - acts.percentil25.position;
            })
            .lock(ao, function(){ // left
                var bandLength2 = this.pvMark.parent[al]() / 2;
                return bandLength2 - this.scene.acts.category.boxLength/2;
            })
            .lock(al, function(){ return this.scene.acts.category.boxLength; }) // width
            .override('defaultColor', function(type){
                switch(type){
                    case 'fill':   return boxFillColor;
                    case 'stroke': return strokeColor;
                }
            })
            .override('defaultStrokeWidth', def.constant(1))
            .pvMark
            ;

        function setupHRule(rule){
            rule.lock(ao, function(){ // left
                    var bandLength2 = this.pvMark.parent[al]() / 2;
                    return bandLength2 - this.scene.acts.category.boxLength/2;
                })
                .lock(al, function(){ return this.scene.acts.category.boxLength;  }) // width
                .override('defaultColor', function(type){
                    if(type === 'stroke') { return strokeColor; }
                })
                ;
            return rule;
        }
        
        this.pvHRule5 = setupHRule(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:  'boxHRule5',
                freePosition: true,
                noHoverable: false
            }))
            .lock(a,  function(){ return this.scene.acts.percentil5.position; }) // bottom
            .pvMark
            ;

        this.pvHRule95 = setupHRule(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:  'boxHRule95',
                freePosition: true,
                noHoverable: false
            }))
            .lock(a,  function(){ return this.scene.acts.percentil95.position; }) // bottom
            .pvMark
            ;

        this.pvHRule50 = setupHRule(new pvc.visual.Rule(this, this.pvBoxPanel, {
                extensionId:  'boxHRule50',
                freePosition: true,
                noHoverable: false
            }))
            .lock(a,  function(){ return this.scene.acts.median.position; }) // bottom
            .override('defaultStrokeWidth', def.constant(2))
            .pvMark
            ;
    },

    /**
     * @override
     */
    applyExtensions: function(){

        this.base();

        // Extend bar and barPanel
        this.extend(this.pvBoxPanel,"boxPanel_");
        this.extend(this.pvBoxPanel,"box_");
        
        this.extend(this.pvBar,"boxBar_");
        this.extend(this.hRule50,"boxHRule50_");
        this.extend(this.hRule5,"boxHRule5_");
        this.extend(this.hRule95,"boxHRule95_");
        this.extend(this.pvVRuleTop,"boxVRule_");
        this.extend(this.pvVRuleBot,"boxVRule_");
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
            visibleKeyArgs = {visible: true},
            data = this._getVisibleData(),
            rootScene  = new pvc.visual.Scene(null, {panel: this, group: data}),
            baseScale  = chart.axes.base.scale,
            bandWidth  = baseScale.range().band,
            bandWidth2 = bandWidth / 2,
            boxWidth   = Math.min(bandWidth * this.boxSizeRatio, this.maxBoxSize),
            orthoScale = chart.axes.ortho.scale;

        /**
         * Create starting scene tree
         */
        data.children() // categories
            .each(createCategScene, this);

        return rootScene;
        
        function createCategScene(categData){
            var categScene = new pvc.visual.Scene(rootScene, {group: categData}),
                acts = categScene.acts;
            
            acts.category = {
                value:  categData.value,
                label:  categData.label,
                group:  categData,
                position: baseScale(categData.value) - bandWidth2,
                length:   bandWidth,
                boxLength: boxWidth
            };

            chart.measureVisualRoles().forEach(function(role){
                var dimName = measureRolesDimNames[role.name],
                    dim   = categData.dimensions(dimName),
                    value = dim.sum(visibleKeyArgs);

                acts[role.name] = {
                    value:    value,
                    label:    dim.format(value),
                    position: orthoScale(value)
                };
            });
        }
    }
});
