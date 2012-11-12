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
        
        var options = chart.options;
        
        // x, y
        this.orientation = $VCA.getOrientation(type, options.orientation);
        
        // x, y, x2, y2, x3, y3, ...
        this.orientedId = $VCA.getOrientedId(this.orientation, index);
        
        // secondX, secondY
        if(chart._allowV1SecondAxis &&  index === 1){
            this.v1SecondOrientedId = 'second' + this.orientation.toUpperCase();
        }
        
        // id
        // base, ortho, base2, ortho2, ...
        
        // scaleType
        // discrete, continuous, numeric, timeSeries
        
        // common
        // axis
        
        this.base(chart, type, index, keyArgs);
        
        // For now scale type is left off, 
        // cause it is yet unknown.
        // In bind, prefixes are recalculated (see _syncExtensionPrefixes)
        var extensions = this.extensionPrefixes = [
            this.id + 'Axis', 
            this.orientedId + 'Axis'
        ];
        
        if(this.v1SecondOrientedId){
            extensions.push(this.v1SecondOrientedId + 'Axis');
        }
        
        this._extPrefAxisPosition = extensions.length;
        
        extensions.push('axis');
    })
    .add(/** @lends pvc.visual.CartesianAxis# */{
        
        bind: function(dataCells){
            
            this.base(dataCells);
            
            this._syncExtensionPrefixes();
            
            return this;
        },
        
        _syncExtensionPrefixes: function(){
            var extensions = this.extensionPrefixes;
            
            // remove until 'axis' (inclusive)
            extensions.length = this._extPrefAxisPosition;
            
            var st = this.scaleType;
            if(st){
                extensions.push(st + 'Axis'); // specific
                if(st !== 'discrete'){
                    extensions.push('continuousAxis'); // generic
                }
            }
            
            // Common
            extensions.push('axis');
        },
        
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
                if(!scale.isNull && this.scaleType !== 'discrete'){
                    // Original data domain, before nice or tick rounding
                    this.domain = scale.domain();
                    
                    if(this.scaleType === 'numeric'){
                        var roundMode = this.option('DomainRoundMode');
                        if(roundMode === 'nice'){
                            scale.nice();
                        }
                        
                        var tickFormatter = this.option('TickFormatter');
                        if(tickFormatter){
                            scale.tickFormatter(tickFormatter);
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
            
            if(scale.type === 'numeric' && this.option('DomainRoundMode') === 'tick'){
                
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
            
            if(scale.type === 'discrete'){
                if(scale.domain().length > 0){ // Has domain? At least one point is required to split.
                    var bandRatio = this.chart.options.panelSizeRatio || 0.8;
                    scale.splitBandedCenter(scale.min, scale.max, bandRatio);
                }
            } else {
                scale.range(scale.min, scale.max);
            }
            
            return scale;
        },
        
        getScaleRoundingPaddings: function(){
            var roundingPaddings = this._roundingPaddings;
            if(!roundingPaddings){
                roundingPaddings = {begin: 0, end: 0};
                
                var scale = this.scale;
                var roundMode;
                
                while(scale && !scale.isNull && scale.type === 'numeric' && 
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
    
    // TODO: refactor all this, unify with base Axis code
    
    var $VCA = pvc.visual.CartesianAxis;

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
        if(index === 0) {
            return orientation; // x, y
        }
        
        return orientation + (index + 1); // x2, y3, x4,...
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
    
    function axisSpecify(getAxisPropValue){
        return axisResolve(getAxisPropValue, 'specify');
    }
    
    function axisDefault(getAxisPropValue){
        return axisResolve(getAxisPropValue, 'defaultValue');
    }
    
    function axisResolve(getAxisPropValue, operation){
        return function(optionInfo){ 
            var value = getAxisPropValue.call(this, optionInfo.name, optionInfo);
            if(value !== undefined){
                optionInfo[operation || 'specify'](value);
                return true;
            }
        };
    }
    
    // baseAxisOffset, orthoAxisOffset, 
    axisSpecify.byId = axisSpecify(function(name){
        return chartOption.call(this, this.id + "Axis" + name);
    });
    
    // xAxisOffset, yAxisOffset, x2AxisOffset
    axisSpecify.byOrientedId = axisSpecify(function(name){
        return chartOption.call(this, this.orientedId + "Axis" + name);
    });
    
    // secondAxisOffset
    axisSpecify.byV1OptionId = axisSpecify(function(name){
        if(this.index === 1){
            return chartOption.call(this, 'secondAxis' + name);
        }
    });
    
    // numericAxisLabelSpacingMin
    axisSpecify.byScaleType = axisSpecify(function(name){
        // this.scaleType
        // * discrete
        // * numeric    | continuous
        // * timeSeries | continuous
        var st = this.scaleType;
        if(st){
            var value = chartOption.call(this, st + 'Axis' + name);
            if(value === undefined && st !== 'discrete'){
                value = chartOption.call(this, 'continuousAxis' + name);
            }
            
            return value;
        }
    });
    
    // axisOffset
    axisSpecify.byCommonId = axisSpecify(function(name){
        return chartOption.call(this, 'axis' + name);
    });
    
    var resolveNormal = pvc.options.resolvers([
       axisSpecify.byId,
       axisSpecify.byOrientedId,
       axisSpecify.byV1OptionId,
       axisSpecify.byScaleType,
       axisSpecify.byCommonId
    ]);
    
    var specNormal = { resolve: resolveNormal };
    
    /* orthoFixedMin, orthoFixedMax */
    var fixedMinMaxSpec = {
        resolve: pvc.options.resolvers([
            axisSpecify.byId,
            axisSpecify.byOrientedId,
            axisSpecify.byV1OptionId,
            axisSpecify(function(name){
                if(!this.index && this.type === 'ortho'){
                    // Bare Id (no "Axis")
                    return chartOption.call(this, this.id + name);
                }
            }),
            axisSpecify.byScaleType,
            axisSpecify.byCommonId
        ]),
        cast: pvc.castNumber
    };
    
    function castDomainScope(scope, axis){
        return pvc.parseDomainScope(scope, axis.orientation);
    }
    
    function castAxisPosition(side){
        if(side){
            if(def.hasOwn(pvc.Sides.namesSet, side)){
                var mapAlign = pvc.BasePanel[this.orientation === 'y' ? 'horizontalAlign' : 'verticalAlign2'];
                return mapAlign[side];
            }
            
            if(pvc.debug >= 2){
                pvc.log(def.format("Invalid axis position value '{0}'.", [side]));
            }
        }
        
        // Ensure a proper value
        return this.orientation === 'x' ? 'bottom' : 'left';
    }
    
    /*global axis_optionsDef:true*/
    var cartAxis_optionsDef = def.create(axis_optionsDef, {
        Visible: {
            resolve: pvc.options.resolvers([
                axisSpecify.byId,
                axisSpecify.byOrientedId,
                axisSpecify.byV1OptionId,
                axisSpecify(function(name){ // V1 - showXScale, showYScale, showSecondScale
                    if(this.index <= 1){
                        var v1OptionId = this.index === 0 ? 
                            def.firstUpperCase(this.orientation) :
                            'Second';
                        
                        return chartOption.call(this, 'show' + v1OptionId + 'Scale');
                    }
                }),
                axisSpecify.byScaleType,
                axisSpecify.byCommonId
            ]),
            cast:    Boolean,
            value:   true
        },
        
        /*
         * 1     <- useCompositeAxis
         * >= 2  <- false
         */
        Composite: {
            resolve: pvc.options.resolvers([
                axisSpecify(function(name){
                    // Only first axis can be composite?
                    if(this.index > 0) {
                        return false;
                    }
                }),
                resolveNormal,
                axisSpecify(function(name){
                    return chartOption.call(this, 'useCompositeAxis');
                })
            ]),
            cast:  Boolean,
            value: false
        },
        
        /* xAxisSize,
         * secondAxisSize || xAxisSize 
         */
        Size: {
            resolve: resolveNormal,
            cast:    pvc.Size.to 
        },
        
        SizeMax: {
            resolve: resolveNormal,
            cast:    pvc.Size.to 
        },
        
        /* xAxisPosition,
         * secondAxisPosition <- opposite(xAxisPosition) 
         */
        Position: {
            resolve: pvc.options.resolvers([
                resolveNormal,
                
                // Dynamic default value
                axisDefault(function(name){
                    if(!this.typeIndex){
                        return this.orientation === 'x' ? 'bottom' : 'left';
                    }
                    
                    // Use the position opposite to that of the first axis 
                    // of same orientation (the same as type)
                    var firstAxis = this.chart.axesByType[this.type].first;
                    var position  = firstAxis.option('Position');
                    
                    return pvc.BasePanel.oppositeAnchor[position];
                })
            ]),
            
            cast: castAxisPosition
        },
        
        /* orthoFixedMin, orthoFixedMax */
        FixedMin: fixedMinMaxSpec,
        FixedMax: fixedMinMaxSpec,
        
        /* 1 <- originIsZero
         * 2 <- secondAxisOriginIsZero (v1 && bar)
         */
        OriginIsZero: {
            resolve: pvc.options.resolvers([
                resolveNormal,
                axisSpecify(function(name){
                    switch(this.index){
                        case 0: return chartOption.call(this, 'originIsZero');
                        case 1:
                            if(this.chart._allowV1SecondAxis){
                                return chartOption.call(this, 'secondAxisOriginIsZero');
                            }
                            break;
                    }
                })
            ]),
            cast:  Boolean,
            value: true 
        }, 
        
        DomainScope: {
            resolve: resolveNormal,
            cast:    castDomainScope,
            value:  'global'
        },
        
        /* 1 <- axisOffset, 
         * 2 <- secondAxisOffset (V1 && bar)
         */
        Offset: {
            resolve: pvc.options.resolvers([
                axisSpecify.byId,
                axisSpecify.byOrientedId,
                axisSpecify.byV1OptionId,
                axisSpecify.byScaleType,
                // axisOffset only applies to index 0!
                axisSpecify(function(name){
                    switch(this.index) {
                        case 0: return chartOption.call(this, 'axisOffset');
                        case 1:
                            if(this.chart._allowV1SecondAxis){
                                return chartOption.call(this, 'secondAxisOffset');
                            }
                            break;
                    }
                })
            ]),
            cast: pvc.castNumber
        },
        
        // em
        LabelSpacingMin: {
            resolve: resolveNormal,
            cast:    pvc.castNumber
        },
        
        OverlappedLabelsMode: {
            resolve: resolveNormal,
            cast:    pvc.parseOverlappedLabelsMode,
            value:   'hide'
        },
        
        /* RULES */
        FullGrid: { // deprecated
            resolve: resolveNormal,
            cast:    Boolean,
            value:   false
        },
        
        Grid: {
            resolve: pvc.options.resolvers([
                         resolveNormal,
                         axisSpecify(function(){
                             return this.option('FullGrid');
                         })
                     ]),
            cast:    Boolean,
            value:   false
        },
        
        GridCrossesMargin: { // experimental
            resolve: resolveNormal,
            cast:    Boolean,
            value:   true
        },
        
        EndLine:  { // deprecated
            resolve: resolveNormal,
            cast:    Boolean
        },
        ZeroLine: {
            resolve: resolveNormal,
            cast:    Boolean,
            value:   true 
        },
        RuleCrossesMargin: { // experimental
            resolve: resolveNormal,
            cast:    Boolean,
            value:   true
        },
        
        /* TICKS */
        Ticks: {
            resolve: resolveNormal,
            cast:    Boolean
        },
        DesiredTickCount: { // secondAxisDesiredTickCount (v1 && bar)
            resolve: resolveNormal,
            cast: pvc.castNumber
        },
        MinorTicks: {
            resolve: resolveNormal,
            cast:    Boolean,
            value:   true 
        },
        TickFormatter: {
            resolve: resolveNormal,
            cast:    def.fun.as
        },
        DomainRoundMode: { // secondAxisRoundDomain (bug && v1 && bar), secondAxisDomainRoundMode (v1 && bar)
            resolve: resolveNormal,
            cast:    pvc.parseDomainRoundingMode,
            value:   'tick'
        },
        TickExponentMin: {
            resolve: resolveNormal,
            cast:    pvc.castNumber  
        },
        TickExponentMax: {
            resolve: resolveNormal,
            cast:    pvc.castNumber 
        },
        
        /* TITLE */
        Title: {
            resolve: resolveNormal,
            cast:    String  
        },
        TitleSize: {
            resolve: resolveNormal,
            cast:    pvc.castNumber  
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
        
        Font: { // axisLabelFont (v1 && index == 0 && HeatGrid)
            resolve: resolveNormal,
            cast:    String
        },
        
        ClickAction: specNormal,      // (v1 && index === 0) 
        DoubleClickAction: specNormal // idem
    });
});