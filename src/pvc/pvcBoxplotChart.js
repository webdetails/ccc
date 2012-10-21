
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
    
    legendSource: null,
    
    constructor: function(options){
        
        options.legend = false; // TODO: is this needed here?
        
        this.base(options);
    },

    _processOptionsCore: function(options){
        this.base.apply(this, arguments);

        this._showLinePanel = options.showLines || options.showDots || options.showAreas;
         
        // Not supported
        options.secondAxis = false;
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
                {name: 'median',       label: 'Median',  defaultDimensionName: 'median', isRequired: true},
                {name: 'lowerQuartil', label: 'Lower Quartil', defaultDimensionName: 'lowerQuartil'},
                {name: 'upperQuartil', label: 'Upper Quartil', defaultDimensionName: 'upperQuartil'},
                {name: 'minimum',      label: 'Minimum', defaultDimensionName: 'minimum' },
                {name: 'maximum',      label: 'Maximum', defaultDimensionName: 'maximum'}
            ])
            .object({
                name:  function(info){ return info.name; },
                value: function(info){ return def.create(roleSpecBase, info); }
            });
        
        this._addVisualRoles(rolesSpec);
    },
    
    _getTranslationClass: function(translOptions){
        return def
            .type(this.base(translOptions))
            .add(pvc.data.BoxplotChartTranslationOper);
    },

    _bindAxes: function(hasMultiRole){
        
        var axis = this.axes.ortho;
        if(!axis.isBound()){
            axis.bind(this._buildRolesDataCells(pvc.BoxplotChart.measureRolesNames));
        }
        
        this.base(hasMultiRole);
    },
    
    /* @override */
    _createMainContentPanel: function(parentPanel, baseOptions){
        if(pvc.debug >= 3){
            pvc.log("Prerendering in boxplotChart");
        }
        
        var options = this.options;
        
        var boxPanel = new pvc.BoxplotPanel(this, parentPanel, def.create(baseOptions, {
            orientation:        options.orientation,
            // boxplot specific options
            boxSizeRatio:       options.boxSizeRatio,
            maxBoxSize:         options.maxBoxSize,
            boxplotColor:       options.boxplotColor
        }));

        // legacy field
        this.bpChartPanel = boxPanel;
        
        if(this._showLinePanel){
            if(pvc.debug >= 3){
                pvc.log("Creating LineDotArea panel.");
            }

            var linePanel = new pvc.LineDotAreaPanel(this, parentPanel, def.create(baseOptions, {
                extensionPrefix: 'second',
                orientation:  options.orientation,
                stacked:      false,
                showValues:   options.showValues,
                valuesAnchor: options.valuesAnchor,
                showLines:    options.showLines,
                showDots:     options.showDots,
                showAreas:    options.showAreas
            }));

            this._linePanel = linePanel;
            
            // HACK:
            this._linePanel._v1DimRoleName.value = 'median';
            
            // Legacy fields
            boxPanel.pvSecondLine = linePanel.pvLine;
            boxPanel.pvSecondDot  = linePanel.pvDot;
        }
        
        return boxPanel;
    },
    
    defaults: def.create(pvc.CategoricalAbstract.prototype.defaults, {
        crosstabMode: false,
        boxplotColor: 'darkgreen',
        boxSizeRatio: 1/3,
        maxBoxSize:   Infinity,
        showDots:     false,
        showLines:    false,
        showAreas:    false,
        showValues:   false,
        valuesAnchor: 'right'
    })
}, {
    measureRolesNames: ['median', 'lowerQuartil', 'upperQuartil', 'minimum', 'maximum']
});