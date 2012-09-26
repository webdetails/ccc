
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

    _bindAxes: function(hasMultiRole){
        
        if(!hasMultiRole || this.parent){
            var axis = this.axes.ortho;
            if(!axis.isBound()){
                axis.bind(this._buildRolesDataCells(pvc.BoxplotChart.measureRolesNames));
            }
            
            axis = this.axes.ortho2;
            if(axis && !axis.isBound()){
                axis.bind(this._buildRolesDataCells(pvc.BoxplotChart.measureRolesNames[0]));
            }
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
        
        if(options.secondAxis){
            if(pvc.debug >= 3){
                pvc.log("Creating LineDotArea panel.");
            }

            var linePanel = new pvc.LineDotAreaPanel(this, parentPanel, def.create(baseOptions, {
                orientation:  options.orientation,
                stacked:      false,
                showValues:   !(this.compatVersion() <= 1) && options.showValues,
                valuesAnchor: options.valuesAnchor,
                showLines:    options.showLines,
                showDots:     options.showDots,
                showAreas:    options.showAreas
            }));

            this._linePanel = linePanel;
            
            // HACK:
            this._linePanel._v1DimRoleName['value'] = 'median';
            
            // Legacy fields
            boxPanel.pvSecondLine = linePanel.pvLine;
            boxPanel.pvSecondDot  = linePanel.pvDot;
        }
        
        return boxPanel;
    },
    
    defaults: def.create(pvc.CategoricalAbstract.prototype.defaults, {
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
    measureRolesNames: ['median', 'percentil25', 'percentil75', 'percentil5', 'percentil95']
});