
/**
 * MetricXYAbstract is the base class of metric XY charts.
 * (Metric stands for:
 *   Measure, Continuous or Not-categorical base and ortho axis)
 */
pvc.MetricXYAbstract = pvc.CartesianAbstract.extend({

    constructor: function(options){

        var isV1Compat = (options && options.compatVersion <= 1);
        if(isV1Compat){
            /**
             * If the 'x' role isn't explicitly defined (in any way),
             * help with defaults and keep backward compatibility by
             * making the 'x' role's default dimension - the 'category' dimension -
             * a numeric one.
             */
            if(!options){ options = {}; }
            if(!options.visualRoles || !options.visualRoles.x){
                var dims   = options.dimensions || (options.dimensions = {}),
                    catDim = dims.category || (dims.category = {});

                if(catDim.valueType === undefined){
                    catDim.valueType = Number;
                }
            }
        }

        if(options && options.axisOffset != null){
            // See pvc.MetricLineDotPanel#_calcLayout
            this._explicitAxisOffset = true;
        }

        this.base(options);

        // Apply options
        pvc.mergeDefaults(this.options, pvc.MetricXYAbstract.defaultOptions, options);

        this._axisRoleNameMap = {
            'base':  'x',
            'ortho': 'y'
        };

        var parent = this.parent;
        if(parent) {
            this._xRole = parent._xRole;
            this._yRole = parent._yRole;
        }
    },

    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){

        this.base();

        var isV1Compat = (this.options.compatVersion <= 1);

        this._addVisualRoles({
            x: {
                isMeasure: true,
                isRequired: true,
                requireSingleDimension: true,
                requireIsDiscrete: false,
                valueType: Number,
                defaultDimensionName: isV1Compat ? 'category' : 'value'
            },
            y: {
                isMeasure: true,
                isRequired: true,
                requireSingleDimension: true,
                requireIsDiscrete: false,
                valueType: Number,
                defaultDimensionName: isV1Compat ? 'value' : 'value2'
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
    }
}, {
    defaultOptions: {
        axisOffset: 0.04,
        valuesAnchor: "right",
        panelSizeRatio: 1
    }
});
