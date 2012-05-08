
/**
 * LineDotAreaAbstract is the class that will be extended by
 * dot, line, stackedline and area charts.
 */
pvc.LineDotAreaAbstract = pvc.CategoricalAbstract.extend({

    constructor: function(options){

        this.base(options);

        // Apply options
        pvc.mergeDefaults(this.options, pvc.LineDotAreaAbstract.defaultOptions, options);

        var parent = this.parent;
        if(parent) {
            this._valueRole = parent._valueRole;
        }
    },
    
    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){
        
        this.base();
        
        this._addVisualRoles({
            /* value: required, continuous, numeric */
            value: { 
                isMeasure: true, 
                isRequired: true, 
                isPercent: this.options.stacked,  
                requireSingleDimension: true, 
                requireIsDiscrete: false, 
                singleValueType: Number, 
                defaultDimensionName: 'value' 
            }
        });

        this._valueRole = this.visualRoles('value');
    },

    _initData: function(){
        this.base.apply(this, arguments);

        // Cached
        this._valueDim = this.dataEngine.dimensions(this._valueRole.firstDimensionName());
    },

    /* @override */
    _createMainContentPanel: function(parentPanel){
        pvc.log("Prerendering in LineDotAreaAbstract");
        
        var options = this.options;
        return new pvc.LineDotAreaPanel(this, parentPanel, {
            showValues:     options.showValues,
            valuesAnchor:   options.valuesAnchor,
            showLines:      options.showLines,
            showDots:       options.showDots,
            showAreas:      options.showAreas,
            orientation:    options.orientation
        });
    }
}, {
    defaultOptions: {
        showDots: false,
        showLines: false,
        showAreas: false,
        showValues: false,
        orthoAxisOffset: 0.04,
        baseAxisOffset:  0.01, // TODO: should depend on being discrete or continuous base
        valuesAnchor: "right",
        panelSizeRatio: 1,
        tipsySettings: def.create(pvc.BaseChart.defaultOptions.tipsySettings, { offset: 15 })
    }
});

/**
 * Dot Chart
 */
pvc.DotChart = pvc.LineDotAreaAbstract.extend({

    constructor: function(options){

        this.base(options);

        this.options.showDots = true;
    }
});

/**
 * Line Chart
 */
pvc.LineChart = pvc.LineDotAreaAbstract.extend({

    constructor: function(options){

        this.base(options);

        this.options.showLines = true;
    }
});

/**
 * Stacked Line Chart
 */
pvc.StackedLineChart = pvc.LineDotAreaAbstract.extend({

    constructor: function(options){

        this.base(options);

        this.options.showLines = true;
        this.options.stacked = true;
    }
});

/**
 * Stacked Area Chart
 */
pvc.StackedAreaChart = pvc.LineDotAreaAbstract.extend({

    constructor: function(options){

        this.base(options);

        this.options.showAreas = true;
        this.options.stacked = true;
    }
});
