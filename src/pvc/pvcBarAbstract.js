
/**
 * BarAbstract is the base class for generating charts of the bar family.
 */
pvc.BarAbstract = pvc.CategoricalAbstract.extend({

    constructor: function(options){

        this.base(options);

        // Apply options
        pvc.mergeDefaults(this.options, pvc.BarAbstract.defaultOptions, options);

        var parent = this.parent;
        if(parent) {
            this._valueRole = parent._valueRole;
            if(parent._value2Role){
                this._value2Role = parent._value2Role;
            }
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
            value:  {
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

        if(this.options.secondAxis){
            this._addVisualRoles({
                /* value2: continuous, numeric */
                value2: {
                    isMeasure: true,
                    isPercent: this.options.stacked,
                    requireSingleDimension: true,
                    requireIsDiscrete: false,
                    singleValueType: Number,
                    defaultDimensionName: 'value2'
                }
            });

            this._value2Role = this.visualRoles('value2');
        }
    },

    _initData: function(){
        this.base.apply(this, arguments);

        var data = this.dataEngine;

        // Cached
        this._valueDim = data.dimensions(this._valueRole.firstDimensionName());

        if(this._value2Role){
            this._value2Dim = data.dimensions(this._value2Role.firstDimensionName());
        }
    }
}, {
    defaultOptions: {
        showValues:   true,
        barSizeRatio: 0.9,   // for grouped bars
        maxBarSize:   2000,
        barStackedMargin: 0, // for stacked bars
        valuesAnchor: "center",
        showValuePercentage: false
    }
});