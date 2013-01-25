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
                    this.domain.minLocked = !!scale.minLocked;
                    this.domain.maxLocked = !!scale.maxLocked;
                    
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
            var scale  = this.scale;
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
                roundingPaddings = {
                        begin: 0, 
                        end:   0, 
                        beginLocked: false, 
                        endLocked:   false
                };
                
                var scale = this.scale;
                if(scale && !scale.isNull && scale.type !== 'discrete'){
                    var originalDomain = this.domain;
                    
                    roundingPaddings.beginLocked = originalDomain.minLocked;
                    roundingPaddings.endLocked   = originalDomain.maxLocked;
                    
                    if(scale.type === 'numeric' && this.option('DomainRoundMode') !== 'none'){
                        var currDomain = scale.domain();
                        var origDomain = this.domain || def.assert("Original domain must be set");
                        var currLength = currDomain[1] - currDomain[0];
                        if(currLength){
                            // begin dif
                            var dif = origDomain[0] - currDomain[0];
                            if(dif > 0){
                                roundingPaddings.begin = dif / currLength;
                            }
                            
                            // end dif
                            dif = currDomain[1] - origDomain[1];
                            if(dif > 0){
                                roundingPaddings.end = dif / currLength;
                            }
                        }
                    }
                }
                
                this._roundingPaddings = roundingPaddings;
            }
            
            return roundingPaddings;
        },
        
        _getOptionsDefinition: function(){
            return cartAxis_optionsDef;
        },
        
        _buildOptionId: function(){
            return this.id + "Axis";
        },
        
        _registerResolversNormal: function(rs, keyArgs){
            // II - By V1 Only Logic
            if(this.chart.compatVersion() <= 1){
                rs.push(this._resolveByV1OnlyLogic);
            }
            
            // IV - By OptionId
            rs.push(
               this._resolveByOptionId,
               this._resolveByOrientedId);
            
            if(this.index === 1){
                rs.push(this._resolveByV1OptionId);
            }
            
            rs.push(
               this._resolveByScaleType,
               this._resolveByCommonId);
            
        },
        
        // xAxisOffset, yAxisOffset, x2AxisOffset
        _resolveByOrientedId: pvc.options.specify(function(optionInfo){
            return this._chartOption(this.orientedId + "Axis" + optionInfo.name);
        }),
        
        // secondAxisOffset
        _resolveByV1OptionId: pvc.options.specify(function(optionInfo){
            //if(this.index === 1){
            return this._chartOption('secondAxis' + optionInfo.name);
            //}
        }),
        
        // numericAxisLabelSpacingMin
        _resolveByScaleType: pvc.options.specify(function(optionInfo){
            // this.scaleType
            // * discrete
            // * numeric    | continuous
            // * timeSeries | continuous
            var st = this.scaleType;
            if(st){
                var name  = optionInfo.name;
                var value = this._chartOption(st + 'Axis' + name);
                if(value === undefined && st !== 'discrete'){
                    value = this._chartOption('continuousAxis' + name);
                }
                
                return value;
            }
        }),
        
        // axisOffset
        _resolveByCommonId: pvc.options.specify(function(optionInfo){
            return this._chartOption('axis' + optionInfo.name);
        }),
        
        initFocusWindow: function(){
            var scale      = this.scale;
            var isDiscrete = this.isDiscrete();
            var contCast   = !isDiscrete ? this.role.firstDimensionType().cast : null;
            var domain     = scale.domain();
            
            var b = this.option('FocusWindowBegin' );
            var e = this.option('FocusWindowEnd'   );
            var l = this.option('FocusWindowLength');
            var a, L;
            if(isDiscrete){
                L = domain.length;
                var ib, ie, ia;
                if(b != null){
                    var nb = +b;
                    if(!isNaN(nb)){
                        if(nb === Infinity){
                            ib = L - 1;
                            b  = domain[ib];
                        } else if(nb === -Infinity){
                            ib = 0;
                            b  = domain[ib];
                        }
                    }
                    
                    if(ib == null){
                        ib = domain.indexOf(''+b);
                        if(ib < 0){
                            b = null;
                        }
                    }
                }
                
                if(e != null){
                    var ne = +e;
                    if(!isNaN(ne)){
                        if(ne === Infinity){
                            ie = L - 1;
                            e  = domain[ie];
                        } else if(ne === -Infinity){
                            ie = 0;
                            e  = domain[ie];
                        }
                    }
                    
                    if(ie == null){
                        ie = domain.indexOf(''+e);
                        if(ie < 0){
                            e = null;
                        }
                    }
                }
                
                if(l != null){
                    l = +l;
                    if(isNaN(l)){
                        l = null;
                    } else if(l < 0 && (b != null || e != null)) {
                        // Switch b and e 
                        a  = b;
                        ia = ib;
                        b = e, ib = ie, e = a, ie = ia;
                        l = -l;
                    }
                    
                    // l > L ??
                }
                
                if(b != null){
                    if(e != null){
                        if(ib > ie){
                            // Switch b and e
                            a  = b;
                            var ia = ib;
                            b = e, ib = ie, e = a, ie = ia;
                        }
                        // l is ignored
                        l = ie - ib + 1;
                    } else {
                        // b && !e
                        if(l == null){
                            // to the end of the domain?
                            l = L - ib;
                        }
                        
                        ie = ib + l - 1;
                        if(ie > L - 1){
                            ie = L - 1;
                            l = ie - ib + 1;
                        }
                        
                        e = domain[ie];
                    }
                } else {
                    // !b
                    if(e != null){
                        // !b && e
                        if(l == null){
                            // from the beginning of the domain?
                            l = ie;
                            // ib = 0
                        }
                        
                        ib = ie - l + 1;
                        if(ib < 0){
                            ib = 0;
                            l = ie - ib + 1;
                        }
                        
                        b = domain[ib];
                    } else {
                        // !b && !e
                        if(l == null){
                            l = Math.max(~~(L / 3), 1); // 1/3 of the width?
                        }
                        
                        if(l > L){
                            l = L;
                            ib = 0;
                            ie = L - 1;
                        } else {
                            // ~~ <=> Math.floor for x >= 0
                            ia = ~~(L / 2); // window center
                            ib = ia - ~~(l/2);
                            ie = ib + l - 1;
                        }
                        
                        b = domain[ib];
                        e = domain[ie];
                    }
                }
                
            } else {
                // Continuous
                
                if(l != null){
                    l = +l;
                    if(isNaN(l)){
                        l = null;
                    } else if(l < 0 && (b != null || e != null)) {
                        // Switch b and e 
                        a  = b;
                        b = e, e = a;
                        l = -l;
                    }
                    
                    // l > L ??
                }
                
                var min = domain[0];
                var max = domain[1];
                L  = max - min; 
                if(b != null){
                    // -Infinity is a placeholder for min
                    if(b < min){
                        b = min;
                    }
                    
                    // +Infinity is a placeholder for max
                    if(b > max){
                        b = max;
                    }
                }
                
                if(e != null){
                    // -Infinity is a placeholder for min
                    if(e < min){
                        e = min;
                    }
                    
                    // +Infinity is a placeholder for max
                    if(e > max){
                        e = max;
                    }
                }
                
                if(b != null){
                    if(e != null){
                        if(b > e){
                            // Switch b and e
                            a  = b;
                            b = e, e = a;
                        }
                        l = e - b;
                    } else {
                        // b && !e
                        if(l == null){
                            // to the end of the domain?
                            l = max - b;
                        }
                        
                        e = b + l;
                        if(e > max){
                            e = max;
                            l = e - b;
                        }
                    }
                } else {
                    // !b
                    if(e != null){
                        // !b && e
                        if(l == null){
                            // from the beginning of the domain?
                            l = e - min;
                            // b = min
                        }
                        
                        b = e - l;
                        if(b < min){
                            b = min;
                            l = e - b;
                        }
                    } else {
                        // !b && !e
                        if(l == null){
                            l = Math.max(~~(L / 3), 1); // 1/3 of the width?
                        }
                        
                        if(l > L){
                            l = L;
                            b = min;
                            e = max;
                        } else {
                            // ~~ <=> Math.floor for x >= 0
                            a = ~~(L / 2); // window center
                            b = a - ~~(l/2);
                            e = b + l;
                        }
                    }
                }
                
                b = contCast(b);
                e = contCast(e);
                l = contCast(l);
            }
            
            var focusWin = this.focusWindow = {
                begin:  b,
                end:    e,
                length: l
            };

            // INITIAL SELECTION
            // TODO: Only the first dataCell is supported...
            var selectDatums;
            var chart      = this.chart;
            var dataCell   = this.dataCell;
            var role       = dataCell.role;
            var partData   = chart.partData(dataCell.dataPartValue, {visible: true});
            var domainData;
            if(isDiscrete){
                domainData = partData.flattenBy(role);
                
                var dataBegin = domainData._childrenByKey[focusWin.begin];
                var dataEnd   = domainData._childrenByKey[focusWin.end  ];
                if(dataBegin && dataEnd){
                    var indexBegin = dataBegin.childIndex();
                    var indexEnd   = dataEnd  .childIndex();
                    selectDatums = def
                        .range(indexBegin, indexEnd - indexBegin + 1)
                        .select(function(index){ return domainData._children[index]; })
                        .selectMany(function(data){ return data._datums; })
                        .distinct(function(datum){ return datum.key; })
                        ;
                }
            } else {
                domainData = partData;
                
                var dimName = role.firstDimensionName();
                selectDatums = def
                    .query(partData._datums)
                    .where(function(datum){
                        var v = datum.atoms[dimName].value;
                        return v != null && v >= focusWin.begin && v <= focusWin.end;
                    });
            }
            
            if(selectDatums){
                selectDatums.each(function(datum){
                    datum.setSelected(true); 
                });
                
                // Fire events; don't render
                chart.root.updateSelections({render: false});
            }
            
            return focusWin;
        }
    });
    
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
    var fixedMinMaxSpec = {
        resolve: '_resolveFull',
        data: {
            /* orthoFixedMin, orthoFixedMax */
            resolveV1: function(optionInfo){
                if(!this.index && this.type === 'ortho'){
                    // Bare Id (no "Axis")
                    this._specifyChartOption(optionInfo, this.id + optionInfo.name);
                }
                return true;
            }
        },
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
    
    var normalV1Data = {
        resolveV1: function(optionInfo){
            if(!this.index){
                if(this._resolveByOrientedId(optionInfo)){
                    return true;
                }
            } else if(this._resolveByV1OptionId(optionInfo)) { // secondAxis...
                return true;
            }
            
            this._resolveDefault(optionInfo);
            
            return true;
        }
    };
    
    var defaultPosition = pvc.options.defaultValue(function(optionInfo){
        if(!this.typeIndex){
            return this.orientation === 'x' ? 'bottom' : 'left';
        }
        
        // Use the position opposite to that of the first axis 
        // of same orientation (the same as type)
        var firstAxis = this.chart.axesByType[this.type].first;
        var position  = firstAxis.option('Position');
        
        return pvc.BasePanel.oppositeAnchor[position];
    });
    
    function castSize(value){
        var position = this.option('Position');
        return pvc.Size.toOrtho(value, position);
    }
    
    function castTitleSize(value){
        var position = this.option('Position');
        
        return pvc.Size.to(value, {singleProp: pvc.BasePanel.orthogonalLength[position]});
    }
    
    /*global axis_optionsDef:true*/
    var cartAxis_optionsDef = def.create(axis_optionsDef, {
        Visible: {
            resolve: '_resolveFull',
            data: {
                /* showXScale, showYScale, showSecondScale */
                resolveV1: function(optionInfo){
                    if(this.index <= 1){
                        var v1OptionId = this.index === 0 ? 
                            def.firstUpperCase(this.orientation) :
                            'Second';
                        
                        this._specifyChartOption(optionInfo, 'show' + v1OptionId + 'Scale');
                    }
                    return true;
                }
            },
            cast:    Boolean,
            value:   true
        },
        
        /*
         * 1     <- useCompositeAxis
         * >= 2  <- false
         */
        Composite: {
            resolve: function(optionInfo){
                // Only first axis can be composite?
                if(this.index > 0) {
                    optionInfo.specify(false);
                    return true;
                }
                
                return this._resolveFull(optionInfo);
            },
            data: {
                resolveV1: function(optionInfo){
                    this._specifyChartOption(optionInfo, 'useCompositeAxis');
                    return true;
                }
            },
            cast:  Boolean,
            value: false
        },
        
        /* xAxisSize,
         * secondAxisSize || xAxisSize 
         */
        Size: {
            resolve: '_resolveFull',
            data:    normalV1Data,
            cast:    castSize
        },
        
        SizeMax: {
            resolve: '_resolveFull',
            cast:    castSize
        },
        
        /* xAxisPosition,
         * secondAxisPosition <- opposite(xAxisPosition) 
         */
        Position: {
            resolve: '_resolveFull',
            data: {
                resolveV1: normalV1Data.resolveV1,
                resolveDefault: defaultPosition
            },
            cast: castAxisPosition
        },
        
        FixedMin: fixedMinMaxSpec,
        FixedMax: fixedMinMaxSpec,
        
        /* 1 <- originIsZero (v1)
         * 2 <- secondAxisOriginIsZero (v1 && bar)
         */
        OriginIsZero: {
            resolve: '_resolveFull',
            data: {
                resolveV1: function(optionInfo){
                    switch(this.index){
                        case 0: 
                            this._specifyChartOption(optionInfo, 'originIsZero');
                            break;
                        case 1:
                            if(this.chart._allowV1SecondAxis){
                                this._specifyChartOption(optionInfo, 'secondAxisOriginIsZero');
                            }
                            break;
                    }
                    
                    return true;
                } 
            },
            cast:  Boolean,
            value: true 
        }, 
        
        DomainScope: {
            resolve: '_resolveFull',
            cast:    castDomainScope,
            value:   'global'
        },
        
        /* 1 <- axisOffset, 
         * 2 <- secondAxisOffset (V1 && bar)
         */
        Offset: {
            resolve: '_resolveFull',
            data: {
                resolveV1: function(optionInfo){
                    switch(this.index) {
                        case 0: 
                            this._specifyChartOption(optionInfo, 'axisOffset');
                            break;
                            
                        case 1:
                            if(this.chart._allowV1SecondAxis){
                                this._specifyChartOption(optionInfo, 'secondAxisOffset');
                                break;
                            }
                            break;
                    }
                    
                    return true;
                }
            },
            cast: pvc.castNumber
        },
        
        // em
        LabelSpacingMin: {
            resolve: '_resolveFull',
            cast:    pvc.castNumber
        },
        
        OverlappedLabelsMode: {
            resolve: '_resolveFull',
            cast:    pvc.parseOverlappedLabelsMode,
            value:   'hide'
        },
        
        /* RULES */
        Grid: {
            resolve: '_resolveFull',
            data: {
                resolveV1: function(optionInfo){
                    if(!this.index){
                        this._specifyChartOption(optionInfo, this.orientation + 'AxisFullGrid');
                    }
                    return true;
                }
            },
            cast:    Boolean,
            value:   false
        },
        
        GridCrossesMargin: { // experimental
            resolve: '_resolveFull',
            cast:    Boolean,
            value:   true
        },
        
        EndLine:  { // deprecated
            resolve: '_resolveFull',
            cast:    Boolean
        },
        
        ZeroLine: {
            resolve: '_resolveFull',
            cast:    Boolean,
            value:   true 
        },
        RuleCrossesMargin: { // experimental
            resolve: '_resolveFull',
            cast:    Boolean,
            value:   true
        },
        
        /* TICKS */
        Ticks: {
            resolve: '_resolveFull',
            cast:    Boolean
        },
        DesiredTickCount: { // secondAxisDesiredTickCount (v1 && bar)
            resolve: '_resolveFull',
            data: {
                resolveV1: normalV1Data.resolveV1,
                resolveDefault: function(optionInfo){
                    if(this.chart.compatVersion() <= 1){
                        optionInfo.defaultValue(5);
                        return true;
                    }
                }
            },
            cast: pvc.castNumber
        },
        MinorTicks: {
            resolve: '_resolveFull',
            data:    normalV1Data,
            cast:    Boolean,
            value:   true 
        },
        TickFormatter: {
            resolve: '_resolveFull',
            cast:    def.fun.as
        },
        DomainRoundMode: { // secondAxisRoundDomain (bug && v1 && bar), secondAxisDomainRoundMode (v1 && bar)
            resolve: '_resolveFull',
            data: {
                resolveV1: normalV1Data.resolveV1,
                resolveDefault: function(optionInfo){
                    if(this.chart.compatVersion() <= 1){
                        optionInfo.defaultValue('none');
                        return true;
                    }
                }
            },
            
            cast:    pvc.parseDomainRoundingMode,
            value:   'tick'
        },
        TickExponentMin: {
            resolve: '_resolveFull',
            cast:    pvc.castNumber  
        },
        TickExponentMax: {
            resolve: '_resolveFull',
            cast:    pvc.castNumber 
        },
        
        /* TITLE */
        Title: {
            resolve: '_resolveFull',
            cast:    String
        },
        TitleSize: {
            resolve: '_resolveFull',
            cast:    castTitleSize
        },
        TitleSizeMax: {
            resolve: '_resolveFull',
            cast:    castTitleSize
        }, 
        TitleFont: {
            resolve: '_resolveFull',
            cast:    String 
        },
        TitleMargins:  {
            resolve: '_resolveFull',
            cast:    pvc.Sides.as 
        },
        TitlePaddings: {
            resolve: '_resolveFull',
            cast:    pvc.Sides.as 
        },
        TitleAlign: {
            resolve: '_resolveFull',
            cast: function castAlign(align){
                var position = this.option('Position');
                return pvc.parseAlign(position, align);
            }
        },
        
        Font: { // axisLabelFont (v1 && index == 0 && HeatGrid)
            resolve: '_resolveFull',
            cast:    String
        },
        
        ClickAction: { 
            resolve: '_resolveFull',
            data: normalV1Data
        }, // (v1 && index === 0) 
        DoubleClickAction: { 
            resolve: '_resolveFull',
            data: normalV1Data
        }, // idem
        
        // 1st Base axis
        FocusWindowResizable: {
            resolve: '_resolveFull',
            cast:    Boolean,
            value:   true
        },
        
        // 1st Base axis
        FocusWindowMovable:   {
            resolve: '_resolveFull',
            cast:    Boolean,
            value:   true
        },
        
        // 1st Base Continuous Axis function v -> vconstrained
        FocusWindowConstraint: {
            resolve: '_resolveFull',
            cast:    def.fun.as
        },
        
        // 1st Base axis
        FocusWindowBegin: {
            resolve: '_resolveFull'
        },
        
        // 1st Base axis
        FocusWindowEnd: {
            resolve: '_resolveFull'
        },
        
        // 1st Base axis
        FocusWindowLength: {
            resolve: '_resolveFull'
        }
    });
});