
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
def
.type('pvc.BoxplotChart', pvc.CategoricalAbstract)
.add({

    _processOptionsCore: function(options){
        this.base.apply(this, arguments);

        // Not supported
        options.stacked = false;
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

        [
            {name: 'median',       label: 'Median',        defaultDimension: 'median', isRequired: true},
            {name: 'lowerQuartil', label: 'Lower Quartil', defaultDimension: 'lowerQuartil'},
            {name: 'upperQuartil', label: 'Upper Quartil', defaultDimension: 'upperQuartil'},
            {name: 'minimum',      label: 'Minimum',       defaultDimension: 'minimum' },
            {name: 'maximum',      label: 'Maximum',       defaultDimension: 'maximum'}
        ].forEach(function(info){
            this._addVisualRole(info.name, def.create(roleSpecBase, info));
        }, this);
    },
    
    _getTranslationClass: function(translOptions){
        return def
            .type(this.base(translOptions))
            .add(pvc.data.BoxplotChartTranslationOper);
    },
    
    _initPlotsCore: function(hasMultiRole){
        new pvc.visual.BoxPlot(this);
        
        if(this.options.plot2){
            // Line Plot
            new pvc.visual.PointPlot(this, {
                name: 'plot2',
                defaults: {
                    LinesVisible: true,
                    DotsVisible:  true,
                    OrthoRole:    'median',
                    ColorAxis:    2
                },
                fixed: {
                    OrthoAxis: 1
                }});
        }
    },
    
    _bindAxes: function(hasMultiRole){
        
        this.base(hasMultiRole);
        
        // Set defaults of Offset property
        var typeAxes = this.axesByType.ortho;
        if(typeAxes){
            typeAxes.forEach(function(axis){
                axis.option.defaults({Offset: 0.02});
            });
        }
    },
    
    /* @override */
    _createPlotPanels: function(parentPanel, baseOptions){
        var options = this.options;
        var plots   = this.plots;
            
        var boxPlot  = plots.box; 
        
        var boxPanel = new pvc.BoxplotPanel(
            this, 
            parentPanel, 
            boxPlot, 
            Object.create(baseOptions));

        // v1 field
        this.bpChartPanel = boxPanel;
        
        var plot2Plot = plots.plot2;
        if(plot2Plot){
            if(pvc.debug >= 3){
                this._log("Creating Point panel.");
            }
            
            var pointPanel = new pvc.PointPanel(
                    this, 
                    parentPanel, 
                    plot2Plot,
                    Object.create(baseOptions));
            
            // HACK:
            pointPanel._v1DimRoleName.value = plot2Plot.option('OrthoRole');
            
            // Legacy fields
            boxPanel.pvSecondLine = pointPanel.pvLine;
            boxPanel.pvSecondDot  = pointPanel.pvDot;
        }
    },
    
    defaults: {
        // plot2: false
        // legend: false,
        crosstabMode: false
        // panelSizeRatio
    }
})
.addStatic({
    measureRolesNames: ['median', 'lowerQuartil', 'upperQuartil', 'minimum', 'maximum']
});