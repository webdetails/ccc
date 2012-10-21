
/**
 * MetricXYAbstract is the base class of metric XY charts.
 * (Metric stands for:
 *   Measure, Continuous or Not-categorical base and ortho axis)
 */
pvc.MetricXYAbstract = pvc.CartesianAbstract.extend({

    constructor: function(options){

        this.base(options);

        var parent = this.parent;
        if(parent) {
            this._xRole = parent._xRole;
            this._yRole = parent._yRole;
        }
    },
    
    _processOptionsCore: function(options){
        
        this.base(options);
        
        // Has no meaning in this chart type
        // Only used by discrete scales
        options.panelSizeRatio = 1;
    },

    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){

        this.base();

        this._addVisualRoles({
            x: {
                isMeasure: true,
                isRequired: true,
                requireSingleDimension: true,
                requireIsDiscrete: false,
                defaultDimensionName: 'x'
            },
            y: {
                isMeasure: true,
                isRequired: true,
                requireSingleDimension: true,
                requireIsDiscrete: false,
                defaultDimensionName: 'y'
            }
        });

        this._xRole = this.visualRoles('x');
        this._yRole = this.visualRoles('y');
    },

    _initData: function(){
        this.base.apply(this, arguments);

        // Cached
        this._xDim = this.data.dimensions(this._xRole.firstDimensionName());
        this._yDim = this.data.dimensions(this._yRole.firstDimensionName());
    },
    
    _bindAxes: function(hasMultiRole){
        
        this.base(hasMultiRole);
      
        /**
         * Axes are created even when hasMultiRole && !parent
         * because it is needed to read axis options in the root chart.
         * Also binding occurs to be able to know its scale type. 
         * Yet, their scales are not setup at the root level.
         */
        
        var axes = this.axes;
            
        var axis = axes.base;
        if(!axis.isBound()){
            axis.bind({role: this._xRole});
        }
        
        axis = axes.ortho;
        if(!axis.isBound()){
            axis.bind({role: this._yRole});
        }
    },
    
    defaults: def.create(pvc.CartesianAbstract.prototype.defaults, {
        valuesAnchor: "right"
    })
});
