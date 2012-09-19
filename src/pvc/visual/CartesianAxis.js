def.scope(function(){

    var $VA = pvc.visual.Axis;
/**
 * Initializes a cartesian axis.
 * 
 * @name pvc.visual.CartesianAxis
 * 
 * @class Represents an axis for a role in a cartesian chart.
 * <p>
 * The main properties of an axis: {@link #type}, {@link #orientation} and relevant chart's properties 
 * are related as follows:
 * </p>
 * <pre>
 * axisType={base, ortho} = f(axisOrientation={x,y})
 * 
 *          Vertical   Horizontal   (chart orientation)
 *         +---------+-----------+
 *       x | base    |   ortho   |
 *         +---------+-----------+
 *       y | ortho   |   base    |
 *         +---------+-----------+
 * (axis orientation)
 * </pre>
 * 
 * @extends pvc.visual.Axis
 * 
 * @property {pvc.CartesianAbstract} chart The associated cartesian chart.
 * @property {string} type The type of the axis. One of the values: 'base' or 'ortho'.
 * @property {string} orientation The orientation of the axis. 
 * One of the values: 'x' or 'y', for horizontal and vertical axis orientations, respectively.
 * @property {string} orientedId The id of the axis with respect to the orientation and the index of the axis ("").
 * 
 * @constructor
 * @param {pvc.CartesianAbstract} chart The associated cartesian chart.
 * @param {string} type The type of the axis. One of the values: 'base' or 'ortho'.
 * @param {number} [index=0] The index of the axis within its type.
 * @param {object} [keyArgs] Keyword arguments.
 * See {@link pvc.visual.Axis} for supported keyword arguments. 
 */
def
.type('pvc.visual.CartesianAxis', $VA)
.init(function(chart, type, index, keyArgs){
    
    this.base(chart, type, index, keyArgs);
    
    // ------------
    
    var options = chart.options;
    
    this.orientation = $VCA.getOrientation(this.type, options.orientation);
    this.orientedId  = $VCA.getOrientedId(this.orientation, this.index);
    this.v1OptionId  = $VCA.getV1OptionId(this.orientation, this.index);

    if(this.index !== 1) {
        this.isVisible = options['show' + def.firstUpperCase(this.orientedId) + 'Scale'];
    } else {
        this.isVisible = !!options.secondAxisIndependentScale; // options.secondAxis is already true or wouldn't be here
    }
})
.add(/** @lends pvc.visual.CartesianAxis# */{
    
    setScale: function(scale){
        var oldScale = this.scale;
        
        this.base(scale);
        
        if(oldScale){
            // If any
            delete this.domain;
            delete this.ticks;
            delete this._roundingPaddings;
        }
        
        if(scale){
            if(!scale.isNull && this.scaleType !== 'Discrete'){
                // Original data domain, before nice or tick rounding
                this.domain = scale.domain();
                
                if(this.scaleType === 'Continuous'){
                    var roundMode = this.option('DomainRoundMode');
                    if(roundMode === 'nice'){
                        scale.nice();
                    }
                }
            }
        }
        
        return this;
    },
    
    setTicks: function(ticks){
        var scale = this.scale;
        
        /*jshint expr:true */
        (scale && !scale.isNull) || def.fail.operationInvalid("Scale must be set and non-null.");
        
        this.ticks = ticks;
        
        if(scale.type === 'Continuous' && this.option('DomainRoundMode') === 'tick'){
            
            delete this._roundingPaddings;
            
            // Commit calculated ticks to scale's domain
            var tickCount = ticks && ticks.length;
            if(tickCount){
                this.scale.domain(ticks[0], ticks[tickCount - 1]);
            } else {
                // Reset scale domain
                this.scale.domain(this.domain[0], this.domain[1]);
            }
        }
    },
    
    setScaleRange: function(size){
        var scale = this.scale;
        scale.min  = 0;
        scale.max  = size;
        scale.size = size; // original size // TODO: remove this...
        
        // -------------
        
        if(scale.type === 'Discrete'){
            if(scale.domain().length > 0){ // Has domain? At least one point is required to split.
                var bandRatio = this.chart.options.panelSizeRatio || 0.8;
                scale.splitBandedCenter(scale.min, scale.max, bandRatio);
            }
        } else {
            scale.range(scale.min, scale.max);
        }
        
        if(pvc.debug >= 4){
            pvc.log("Scale: " + JSON.stringify(def.copyOwn(scale)));
        }
        
        return scale;
    },
    
    getScaleRoundingPaddings: function(){
        var roundingPaddings = this._roundingPaddings;
        if(!roundingPaddings){
            roundingPaddings = {begin: 0, end: 0};
            
            var scale = this.scale;
            var roundMode;
            
            while(scale && !scale.isNull && scale.type === 'Continuous' && 
                  (roundMode = this.option('DomainRoundMode')) !== 'none'){
                
                var currDomain = scale.domain();
                var origDomain = this.domain || def.assert("Must be set");
                
                var currLength = currDomain[1] - currDomain[0];
                if(currLength){
                    var dif = origDomain[0] - currDomain[0];
                    if(dif > 0){
                        roundingPaddings.begin = dif / currLength;
                    }

                    dif = currDomain[1] - origDomain[1];
                    if(dif > 0){
                        roundingPaddings.end = dif / currLength;
                    }
                }
                
                break;
            }
            
            this._roundingPaddings = roundingPaddings;
        }
        
        return roundingPaddings;
    },
    
    _getOptionsDefinition: function(){
        return cartAxis_optionsDef;
    }
});

var $VCA = pvc.visual.CartesianAxis;

/**
 * Obtains the type of the axis given an axis orientation and a chart orientation.
 * 
 * @param {string} axisOrientation The orientation of the axis. One of the values: 'x' or 'y'.
 * @param {string} chartOrientation The orientation of the chart. One of the values: 'horizontal' or 'vertical'.
 * 
 * @type string
$VCA.getTypeFromOrientation = function(axisOrientation, chartOrientation){
    return ((axisOrientation === 'x') === (chartOrientation === 'vertical')) ? 'base' : 'ortho';  // NXOR
};
 */

/**
 * Obtains the orientation of the axis given an axis type and a chart orientation.
 * 
 * @param {string} type The type of the axis. One of the values: 'base' or 'ortho'.
 * @param {string} chartOrientation The orientation of the chart. One of the values: 'horizontal' or 'vertical'.
 * 
 * @type string
 */
$VCA.getOrientation = function(type, chartOrientation){
    return ((type === 'base') === (chartOrientation === 'vertical')) ? 'x' : 'y';  // NXOR
};

/**
 * Calculates the oriented id of an axis given its orientation and index.
 * @param {string} orientation The orientation of the axis.
 * @param {number} index The index of the axis within its type. 
 * @type string
 */
$VCA.getOrientedId = function(orientation, index){
    switch(index) {
        case 0: return orientation; // x, y
        case 1: return "second" + orientation.toUpperCase(); // secondX, secondY
    }
    
    return orientation + "" + (index + 1); // y3, x4,...
};

/**
 * Calculates the V1 options id of an axis given its orientation and index.
 * 
 * @param {string} orientation The orientation of the axis.
 * @param {number} index The index of the axis within its type. 
 * @type string
 */
$VCA.getV1OptionId = function(orientation, index){
    switch(index) {
        case 0: return orientation; // x, y
        case 1: return "second";    // second
    }
    
    return orientation + "" + (index + 1); // y3, x4,...
};

/* PRIVATE STUFF */

/**
 * Obtains the value of an option using a specified final name.
 * 
 * @name pvc.visual.CartesianAxis#_chartOption
 * @function
 * @param {string} name The chart option name.
 * @private
 * @type string
 */
function chartOption(name) {
    return this.chart.options[name];
}

// Creates a resolve method, 
// suitable for an option manager option specification, 
// that combines a list of resolvers. 
// The resolve stops when the first resolver returns the value <c>true</c>,
// returning <c>true</c> as well.
function resolvers(list){
    return function(axis){
        for(var i = 0, L = list.length ; i < L ; i++){
            if(list[i].call(this, axis) === true){
                return true;
            }
        }
    };
}

function axisSpecify(getAxisPropValue){
    return axisResolve(getAxisPropValue, 'specify');
}

function axisDefault(getAxisPropValue){
    return axisResolve(getAxisPropValue, 'defaultValue');
}

function axisResolve(getAxisPropValue, operation){
    return function(axis){ 
        var value = getAxisPropValue.call(axis, this.name, this);
        if(value !== undefined){
            this[operation || 'specify'](value);
            return true;
        }
    };
}

// baseAxisOffset, orthoAxisOffset, 
axisSpecify.byId = axisSpecify(function(name){
    return chartOption.call(this, this.id + "Axis" + name);
});

// xAxisOffset, yAxisOffset, secondAxisOffset
axisSpecify.byV1OptionId = axisSpecify(function(name){
    return chartOption.call(this, this.v1OptionId + 'Axis' + name); 
});

// axisOffset
axisSpecify.byCommonId = axisSpecify(function(name){
    return chartOption.call(this, 'axis' + name);
});

var resolveNormal = resolvers([
   axisSpecify.byId,
   axisSpecify.byV1OptionId,
   axisSpecify.byCommonId
]);

var specNormal = { resolve: resolveNormal };

/* orthoFixedMin, orthoFixedMax */
var fixedMinMaxSpec = {
    resolve: resolvers([
        axisSpecify.byId,
        axisSpecify.byV1OptionId,
        axisSpecify(function(name){
            if(!this.index && this.type === 'ortho'){
                // Bare Id (no "Axis")
                return chartOption.call(this, this.id + name);
            }
        }),
        axisSpecify.byCommonId
    ]),
    cast: Number2
};

var cartAxis_optionsDef = def.create(axis_optionsDef, {
    /*
     * 1     <- useCompositeAxis
     * >= 2  <- false
     */
    Composite: {
        resolve: resolvers([
            axisSpecify(function(name){
                // Only first axis can be composite?
                if(this.index > 0) {
                    return false;
                }
                
                return chartOption.call(this, 'useCompositeAxis');
            }),
            resolveNormal
        ]),
        cast:  Boolean,
        value: false
    },
    
    /* xAxisSize,
     * secondAxisSize || xAxisSize 
     */
    Size: {
        resolve: resolveNormal,
        cast:    Number2
    },
    
    SizeMax: specNormal,
    
    /* xAxisPosition,
     * secondAxisPosition <- opposite(xAxisPosition) 
     */
    Position: {
        resolve: resolvers([
            resolveNormal,
            
            // Dynamic default value
            axisDefault(function(name){
                if(this.index > 0) {
                    // Use the position opposite to that of the first axis 
                    // of same orientation
                    var optionId0 = $VCA.getV1OptionId(this.orientation, 0);
                    
                    var position0 = chartOption.call(this, optionId0 + 'Axis' + name) ||
                                    'left';
                    
                    return pvc.BasePanel.oppositeAnchor[position0];
                }
            })
        ])
    },
    
    /* orthoFixedMin, orthoFixedMax */
    FixedMin: fixedMinMaxSpec,
    FixedMax: fixedMinMaxSpec,
    
    /* 1 <- originIsZero
     * 2 <- secondAxisOriginIsZero
     */
    OriginIsZero: {
        resolve: resolvers([
            resolveNormal,
            axisSpecify(function(name){
                switch(this.index){
                    case 0: return chartOption.call(this, 'originIsZero');
                    case 1: return chartOption.call(this, 'secondAxisOriginIsZero');
                }
            })
        ]),
        cast:  Boolean,
        value: true 
    }, 
    
    /* 1 <- axisOffset, 
     * 2 <- secondAxisOffset, 
     */
    Offset:  {
        resolve: resolvers([
            axisSpecify.byId,
            axisSpecify.byV1OptionId,
            // axisOffset only applies to index 0!
            axisSpecify(function(name){
                switch(this.index) {
                    case 0: return chartOption.call(this, 'axisOffset');
                    case 1: return chartOption.call(this, 'secondAxisOffset');
                }
            })
        ]),
        cast: Number2
    },
    
    LabelSpacingMin: {
        resolve: resolveNormal,
        cast:    Number2,
        value:   1 // em
    },
    
    OverlappedLabelsHide: {
        resolve: resolveNormal,
        cast:    Boolean,
        value:   false 
    },
    
    OverlappedLabelsMaxPct: {
        resolve: resolveNormal,
        cast:    Number2,
        value:   0.2
    },
    
    /* RULES */
    FullGrid: {
        resolve: resolveNormal,
        cast:    Boolean,
        value:   false
    },
    FullGridCrossesMargin: {
        resolve: resolveNormal,
        cast:    Boolean,
        value:   true
    },
    EndLine:  {
        resolve: resolveNormal,
        cast:    Boolean
    },
    ZeroLine: {
        resolve: resolveNormal,
        cast:    Boolean,
        value:   true 
    },
    RuleCrossesMargin: {
        resolve: resolveNormal,
        cast:    Boolean,
        value:   true
    },
    
    /* TICKS */
    DesiredTickCount: {
        resolve: resolveNormal,
        cast: Number2
    },
    MinorTicks: {
        resolve: resolveNormal,
        cast:    Boolean,
        value:   true 
    },
    DomainRoundMode: {
        resolve: resolveNormal,
        cast:    String,
        value:   'none'
    },
    TickExponentMin: {
        resolve: resolveNormal,
        cast:    Number2 
    },
    TickExponentMax: {
        resolve: resolveNormal,
        cast:    Number2
    },
    
    /* TITLE */
    Title: {
        resolve: resolveNormal,
        cast:    String  
    },
    TitleSize: {
        resolve: resolveNormal,
        cast:    Number2 
    }, // It's a pvc.Size, actually
    TitleSizeMax: specNormal, 
    TitleFont: {
        resolve: resolveNormal,
        cast:    String 
    },
    TitleMargins:  specNormal,
    TitlePaddings: specNormal,
    TitleAlign: {
        resolve: resolveNormal,
        cast:    String 
    },
    
    Font: {
        resolve: resolveNormal,
        cast:    String
    },
    
    ClickAction: specNormal,
    DoubleClickAction: specNormal
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