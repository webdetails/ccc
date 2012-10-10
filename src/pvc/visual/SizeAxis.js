def.scope(function(){

    var $VA = pvc.visual.Axis;
    
    /**
     * Initializes a size axis.
     * 
     * @name pvc.visual.SizeAxis
     * 
     * @class Represents an axis that maps sizes to the values of a role.
     * 
     * @extends pvc.visual.Axis
     */
    def
    .type('pvc.visual.SizeAxis', $VA)
    .init(function(chart, type, index, keyArgs){
        
        this.base(chart, type, index, keyArgs);
        
        this.optionId = pvc.buildIndexedId('sizeAxis', this.index);
        
        // ------------
        
        /* this.scaleType === 'discrete' && */
    
    })
    .add(/** @lends pvc.visual.SizeAxis# */{
        
        scaleTreatsNullAs: function(){
            return 'min';
        },
        
        scaleUsesAbs: function(){
            return this.option('UseAbs');
        },
        
        setScaleRange: function(range){
            var scale = this.scale;
            scale.min  = range.min;
            scale.max  = range.max;
            scale.size = range.max - range.min;
            
            scale.range(scale.min, scale.max);
            
            if(pvc.debug >= 4){
                pvc.log("Scale: " + JSON.stringify(def.copyOwn(scale)));
            }
            
            return this;
        },
        
        _getOptionsDefinition: function(){
            return sizeAxis_optionsDef;
        },
        
        _getOptionByOptionId: function(name){
            return chartOption.call(this, this.optionId + name);
        }
    });
    
    var $VSA = pvc.visual.SizeAxis;
    
    /* PRIVATE STUFF */
    
    function chartOption(name) {
        return this.chart.options[name];
    }
    
    function resolve(fun, operation){
        return function(axis){
            var value = fun.call(axis, this.name, this);
            if(value !== undefined){
                this[operation || 'specify'](value);
                return true;
            }
        };
    }
    
    resolve.byOptionId = resolve($VSA.prototype._getOptionByOptionId);
    
    function resolveNormal(axis){
        return resolve.byOptionId.call(this, axis);
    }
    
    /*global axis_optionsDef:true */
    var sizeAxis_optionsDef = def.create(axis_optionsDef, {
        /* sizeAxisOriginIsZero
         * Force zero to be part of the domain of the scale to make
         * the scale "proportionally" comparable.
         */
        OriginIsZero: {
            resolve: resolveNormal,
            cast:    Boolean,
            value:   false
        },
        
        FixedMin: {
            resolve: resolveNormal,
            cast:    Number2
        },
        
        FixedMax: {
            resolve: resolveNormal,
            cast:    Number2
        },
        
        UseAbs: {
            resolve: resolveNormal,
            cast:    Boolean,
            value:   false
        }
    });
    
    function Number2(value) {
        if(value != null) {
            value = +value; // to number
            if(isNaN(value)) {
                value = null;
            }
        }
        
        return value;
    }

});