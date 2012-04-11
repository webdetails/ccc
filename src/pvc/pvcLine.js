
/**
 * ScatterAbstract is the class that will be extended by
 * dot, line, stackedline and area charts.
 */
pvc.ScatterAbstract = pvc.CategoricalAbstract.extend({

    scatterChartPanel : null,
    
    constructor: function(options){

        this.base(options);

        // Apply options
        pvc.mergeDefaults(this.options, pvc.ScatterAbstract.defaultOptions, options);
    },

    /* @override */
    createCategoricalPanel: function(){
        pvc.log("Prerendering in ScatterAbstract");

        this.scatterChartPanel = new pvc.ScatterChartPanel(this, {
            showValues:     this.options.showValues,
            valuesAnchor:   this.options.valuesAnchor,
            showLines:      this.options.showLines,
            showDots:       this.options.showDots,
            showAreas:      this.options.showAreas,
            orientation:    this.options.orientation
        });

        return this.scatterChartPanel;
    }
}, {
    defaultOptions: {
        showDots: false,
        showLines: false,
        showAreas: false,
        showValues: false,
        axisOffset: 0.04,
        valuesAnchor: "right",
        panelSizeRatio: 1
    }
});

/**
 * Dot Chart
 */
pvc.DotChart = pvc.ScatterAbstract.extend({

    constructor: function(options){

        this.base(options);

        this.options.showDots = true;
    }
});

/**
 * Line Chart
 */
pvc.LineChart = pvc.ScatterAbstract.extend({

    constructor: function(options){

        this.base(options);

        this.options.showLines = true;
    }
});

/**
 * Stacked Line Chart
 */
pvc.StackedLineChart = pvc.ScatterAbstract.extend({

    constructor: function(options){

        this.base(options);

        this.options.showLines = true;
        this.options.stacked = true;
    }
});

/**
 * Stacked Area Chart
 */
pvc.StackedAreaChart = pvc.ScatterAbstract.extend({

    constructor: function(options){

        this.base(options);

        this.options.showAreas = true;
        this.options.stacked = true;
    }
});

/*
 * Scatter chart panel. Base class for generating the other xy charts. Specific options are:
 * <i>showDots</i> - Show or hide dots. Default: true
 * <i>showAreas</i> - Show or hide dots. Default: false
 * <i>showLines</i> - Show or hide dots. Default: true
 * <i>showValues</i> - Show or hide line value. Default: false
 *
 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>line_</i> - for the actual line
 * <i>linePanel_</i> - for the panel where the lines sit
 * <i>lineDot_</i> - the dots on the line
 * <i>lineLabel_</i> - for the main line label
 */
pvc.ScatterChartPanel = pvc.CategoricalAbstractPanel.extend({

    pvLine: null,
    pvLineOrArea: null,
    pvDot: null,
    pvLabel: null,
    pvCategoryPanel: null,

    showAreas: false,
    showLines: true,
    showDots: true,
    showValues: true,
    
    valuesAnchor: "right",

    /**
     * @override
     */
    createCore: function(){
        var myself = this,
            chart = this.chart,
            options = chart.options,
            isStacked = options.stacked,
            showAreas = this.showAreas,
            isDiscreteCateg = !options.timeSeries,
            anchor = this.isOrientationVertical() ? "bottom" : "left",
            invisibleFill = 'rgba(127,127,127,0.00001)';

        // ------------------
        // DATA
        var de = chart.dataEngine,
            // Two multi-dimension single-level data groupings
            catGrouping = chart.visualRoles('category').grouping.singleLevelGrouping(),
            serGrouping = chart.visualRoles('series'  ).grouping.singleLevelGrouping(),
            
            // One multi-dimensional, two-levels data grouping
            crossGrouping = pvc.data.GroupingSpec.multiple([serGrouping, catGrouping]),
            
            valueDimName = chart.visualRoles('value').grouping.dimensions().first().name,
            categDimName = catGrouping.dimensions().first().name, // For timeseries
            
            keyArgs      = {visible: true},
            catRootData  = de.groupBy(catGrouping,   keyArgs),
            serRootData  = de.groupBy(serGrouping,   keyArgs),
            data         = de.groupBy(crossGrouping, keyArgs),
            isDense      = !(this.width > 0) || (data._leafs.length / this.width > 0.5), //  > 100 pts / 200 pxs
            isSegmented  = !isDense,
            dotsBySeries = this._doLayout(catRootData, data, valueDimName, categDimName);

        // Disable selection?
        if(!isSegmented && options.selectable) {
            options.selectable = false;
            pvc.log("Warning: Disabling selection because the chart is to \"dense\".");
        }
        
        // -- DOT --
        function dotColorInterceptor(getDatumColor, args){
            if(!myself.showDots){
                var dot = args[0],
                    showAloneDot = dot.isAlone && (!(showAreas && isDiscreteCateg) || dot.isSingle);
                
                if(!showAloneDot) {
                    return invisibleFill;
                }
            }
            
            var darker = !getDatumColor && myself.showAreas ? 0.6 : null;
            var color = calcColor.call(this, getDatumColor, args, null, darker, /* grayAlpha */ 1);
//            
//            if(args[0].isIntermediate) {
//                return color.darker().darker();
//            }
//            
            return color;
        }
        
        function dotRadiusInterceptor(getShapeRadius, args) {
            var radius = getShapeRadius ? getShapeRadius.apply(this, args) : null;
            this.instance().shapeRadiusBackup = radius; // ugly
            return null;
        }
        
        function dotSizeInterceptor(getShapeSize, args) {
            if(!myself.showDots) {
                var dot = args[0];
                if(dot.isAlone) {
                    // Obtain the line Width of the "sibling" line
                    var lineWidth = Math.max(myself.pvLine.scene[this.index].lineWidth, 0.2) / 2;
                    return lineWidth * lineWidth;
                }
            }
            
            var radius = this.shapeRadiusBackup();
            if(radius != null) {
                return radius * radius;
            }
            
            return getShapeSize ? getShapeSize.apply(null, args) : 12;
        }
        
        // -- LINE --
        function lineColorInterceptor(getDatumColor, args){
            if(!myself.showLines) {
                // This obtains the color of the same index area
                return myself.pvArea.fillStyle();
            }
            
            var darker = !getDatumColor && isStacked ? 0.6 : null;
            return calcColor.call(this, getDatumColor, args, null, darker);
        }
        
        function lineWidthInterceptor(getLineWidth, args) {
            if(!myself.showLines || !getLineWidth) {
                return isDense ? 0.00001 : 1.5;
            }
            
            return getLineWidth.apply(this, args);
        }
        
        // -- AREA --
        var areaColorAlpha = this.showAreas && this.showLines && !isStacked ?
                            0.5 : null;

        function fillColorInterceptor(getDatumColor, args){
            if(!myself.showAreas){
                return invisibleFill;
            }

            var hasSelections = de.owner.selectedCount() > 0,
                grayAlpha = isStacked && hasSelections ? 1 : null,
                areaAlpha = areaColorAlpha;
           
            return calcColor.call(this, getDatumColor, args, areaAlpha, null, grayAlpha);
        }

        // Color "controller"
        var colors = def.scope(function(){
            var serData = de.owner.groupBy(serGrouping), // visible or invisible
                seriesKeys = serData.children()
                    .select(function(seriesData){ 
                        return seriesData.key; 
                    })
                    .array();
            return chart.colors(seriesKeys);
        });
        
        function calcColor(getDatumColor, args, alpha, darker, grayAlpha, grayIfSelected){
            var color;

            if(getDatumColor){
                color = getDatumColor.apply(this, args);
                if(color === null){
                    return null;
                }
            }

            if(color === undefined){
                var dot = args[0];
                color = colors(dot.seriesGroup.key);
            }

            // ----------

            if(de.owner.selectedCount() > 0 && (grayIfSelected || !this.datum().isSelected)){
                color = pvc.toGrayScale(color, grayAlpha);
            } else if(alpha != null){
                color = color.alpha(alpha);
            }

            if(darker != null){
                color = color.darker(darker);
            }

            return color;
        }
        
        // ---------------
        // BUILD
        //this.pvPanel.zOrder(0);

        if(options.showTooltips || this._shouldHandleClick()){
            this.pvPanel
              // Receive events even if in a transparent panel (#events default is "painted")
              .events("all")
              .event("mousemove", pv.Behavior.point(40)) // fire point and unpoint events
              ;
        }
        
        this.pvScatterPanel = this.pvPanel.add(pv.Panel)
            .lock('data', serRootData._children)
            ;
        
        // -- AREA --
        this.pvArea = this.pvScatterPanel.add(pv.Area)
            .lock('data',      function(seriesData1){ return dotsBySeries[seriesData1.absKey]; })
            .lock('datum',     function(dot){ return dot.datum; })
            .lock('segmented', isSegmented) // fixed

            // Physical dimensions
            .lock(anchor,                         function(dot) { return dot.orthoPosition;                   }) // ex: bottom
            .lock(this.anchorOrthoLength(anchor), function(dot) { return chart.animate(0, dot.orthoLength);   }) // ex: height
            .lock(this.anchorOrtho(anchor),       function(dot) { return dot.basePosition;                    }) // ex: left
              
            // Style
            .intercept('fillStyle', fillColorInterceptor, this._getExtension('area', 'fillStyle'))
            ;
        
        /* Using antialias causes the vertical separation
         * of *segmented* areas to be noticed.
         * When lines are also shown, not using antialias
         * is ok because the ladder border that it causes is hidden by the line.
         * 
         * So, we only use antialias if there isn't a line 
         * to cover the side effect of not using it.
         */
        var useAntialias = showAreas && !this.showLines;
        this.pvArea
            .lock('antialias', useAntialias);
            
    if(isSegmented && useAntialias){
            // isDense = false
            
            // We have to try to hide the vertical lines noticeable between areas,
            // caused by using antialias...
            this.pvArea
                .lock('strokeStyle', function(){ return this.fillStyle(); })
                .lock('lineWidth',   function(dot){
                    if((dot.isAlone && !isDiscreteCateg) || (dot.isNull && (!dot.next || dot.next.isNull))) {
                        // Hide a vertical line from 0 to the alone dot
                        // Hide horizontal lines of nulls near zero
                        return 0.00001;
                    }
                    
                    // Hide the line when using alpha
                    // Otherwise, show it to bridge the gaps of segmented areas.
                    // If the line is too thick, 
                    // the junctions become horrible on very small angles.
                    var color = this.strokeStyle();
                    return (!color || color.a < 1) ? 0.00001 : 1;
                });
        } else {
            this.pvArea
                // These have no meaning in the area and should not be used
                .lock('strokeStyle', null)
                .lock('lineWidth',   0);
        }
        
        // -- LINE --
        this.pvLine = this.pvArea.anchor(this.anchorOpposite(anchor)).add(pv.Line)
            .lock('visible',   
                    isStacked && isDiscreteCateg ? 
                            function(dot){ return !(!dot.isIntermediate && dot.isNull); } :
                            function(dot){ return !dot.isNull; }
            )
            .lock('segmented', true) // fixed
            .antialias(true)
            .intercept('strokeStyle', lineColorInterceptor, this._getExtension('line', 'strokeStyle'))
            .intercept('lineWidth',   lineWidthInterceptor, this._getExtension('line', 'lineWidth'  ))
            .text(this._createPropDatumTooltip())
            ;
        
            
        // -- DOT --
        this.pvDot = this.pvLine.add(pv.Dot)
            .visible(function(dot){ return !dot.isNull && !dot.isIntermediate; })
            .strokeDasharray(null) // prevent default inheritance
            .localProperty('shapeRadiusBackup')
            .intercept('shapeRadius',  dotRadiusInterceptor,  this._getExtension('dot', 'shapeRadius'))
            .intercept('shapeSize',    dotSizeInterceptor,    this._getExtension('dot', 'shapeSize'))
            .lineWidth(1.5) // Break inheritance
            .intercept('strokeStyle', dotColorInterceptor, this._getExtension('dot', 'strokeStyle'))
            .intercept('fillStyle',   dotColorInterceptor, this._getExtension('dot', 'fillStyle'))
            ;

        // -- LABEL --
        if(this.showValues){
            this.pvLabel = this.pvDot
                .anchor(this.valuesAnchor)
                .add(pv.Label)
                // ------
                .bottom(0)
                .text(function(){
                    return options.valueFormat(this.datum().atoms.value.value);
                })
                ;
        }
        
        // -- INTERACTION --
        if(options.showTooltips){
            // TODO - tooltips centered on areas?
//            var settings = def.copyOwn(
//                        def.create(options.tipsySettings),
//                        {
//                            gravity: function(){
//                                return tipsyBehavior.tipMark.type === 'area' ? "c" : "s";
//                            }
//                        });
            this.pvDot
                .localProperty("tooltip", String) // see pvc.js
                .tooltip(function(){
                    var tooltip;

                    if(options.customTooltip){
                        var datum = this.datum();
                        if(!datum.isNull) {
                            var atoms = datum.atoms,
                                v = atoms.value.value,
                                s = atoms.series.rawValue,
                                c = atoms.category.rawValue;

                            tooltip = options.customTooltip.call(null, s, c, v, datum);
                        }
                    }

                    return tooltip;
                })
                .title(function(){
                    return ''; // prevent browser tooltip
                })
                .event("point", pv.Behavior.tipsy(options.tipsySettings))
                ;
        }
        
        if (this._shouldHandleClick()){
            this._addPropClick(this.pvDot);

            if(this.showAreas){
                // Interaction
                this.pvArea
                    .events("all");
                
                this._addPropClick(this.pvArea);
            }
        }

        if(options.doubleClickAction) {
            this._addPropDoubleClick(this.pvDot);

            if(this.showAreas){
                this.pvArea
                    .events("all");
            
                this._addPropDoubleClick(this.pvArea);
            }
        }
    },

    /**
     * @override
     */
    applyExtensions: function(){

        this.base();

        // Extend lineLabel
        this.extend(this.pvLabel, "lineLabel_");
        
        this.extend(this.pvScatterPanel, "scatterPanel_");
        this.extend(this.pvArea,  "area_");
        this.extend(this.pvLine,  "line_");
        this.extend(this.pvDot,   "dot_");
        this.extend(this.pvLabel, "label_");
    },

    /**
     * Renders this.pvBarPanel - the parent of the marks that are affected by selection changes.
     * @override
     */
    _renderSignums: function(){
        this.pvScatterPanel.render();
    },

    /**
     * Returns an array of marks whose instances are associated to a datum, or null.
     * @override
     */
    _getSignums: function(){
        var marks = [];
        
        marks.push(this.pvDot);
        
        if(this.showLines || this.showAreas){
            marks.push(this.pvLine);
        }
        
        return marks;
    },
  
    _doLayout: function(catRootData, data, valueDimName, categDimName){
        var chart = this.chart,
            options = chart.options,
            isDiscreteCateg = !options.timeSeries,
            isStacked = options.stacked,
            createNullIntermediates = this.showAreas,
            orthoScale = chart.getLinearScale({bypassAxisSize: true}),
            orthoNullValue = def.scope(function(){
                var domain = orthoScale.domain(),
                    dmin = domain[0],
                    dmax = domain[1];
                if(dmin * dmax >= 0) {
                    // Both positive or negative or either is zero
                    return dmin >= 0 ? dmin : dmax;
                }
                
                return 0;
            }),
            orthoZero = orthoScale(0),
            dotBaseScale;
        
        if(options.timeSeries) {
            dotBaseScale = def.scope(function(){
                var baseScale = chart.getTimeseriesScale({bypassAxisSize: true/*, bypassAxisOffset: true */});
                
                function dotScale(dot){
                    return baseScale(dot.datum.atoms[categDimName].value);
                }
                
                return dotScale;
            });
            
        } else { // ~ Discrete base scale
            dotBaseScale = def.scope(function(){
                var baseScale = chart.getOrdinalScale({bypassAxisSize: true}),
                    halfBand  = baseScale.range().band / 2;
                
                function dotScale(dot){
                    return baseScale(dot.categoryGroup.key) + halfBand;
                }
                
                dotScale.halfBand = halfBand;
                
                return dotScale;
            });
        }
        
        // --------------
        
        var categDatas = catRootData._children,
            categCount = categDatas.length,
            belowDots2;
        
        /** 
         * A map with an array of Dots, by series key,
         * i.e.:
         *   seriesKey -> Dot[] 
         */
        var dotsBySeriesKey = data.children()
            .reverse() // because of stacked offset calculation
            .object({
                name:  function(seriesData){ return seriesData.key; },
                value: calcSeriesDots
            });
        
        /** 
         * Trim leading and trailing null dots.
         */
        def.forEachOwn(dotsBySeriesKey, function(dots2, key){
            dotsBySeriesKey[key] = trimNullDots(dots2);
        });
        
        return dotsBySeriesKey;
        
        function calcSeriesDots(seriesData) {
            
            var dots = categDatas.map(function(categData1){
                var categKey = categData1.key,
                    categData = seriesData._childrenByKey[categKey],
                    datum = categData && categData._datums[0],
                    value = datum && datum.atoms[valueDimName].value;
                
                return {
                    seriesGroup:   seriesData,
                    categoryGroup: categData1,
                    group:         categData, // may be null
                    isNull:        !datum,
                    datum:         datum || createNullDatum(seriesData, categData1),
                    value:         value != null ? value : orthoNullValue
                };
            });
            
            // 2nd pass
            var dots2 = [],
                fromDot2;
            
            for(var c = 0 ; c < categCount ; c++) {
                var toDot = dots[c],
                    isFirstDot = c === 0, // <=> !fromDot2
                    c2 = c * 2;
                
                var toValue = toDot.value;
                
                if(belowDots2) {
                    if(toDot.isNull && !isDiscreteCateg) {
                        toValue = orthoNullValue;
                    } else {
                        toValue += belowDots2[c2].value;
                    }
                }
                
                var toBasePosition = dotBaseScale(toDot);
                
                // Before Intermediate Dot
                if(!isFirstDot) {
                    var interIsNull = fromDot2.isNull || toDot.isNull;
                    if(!interIsNull || createNullIntermediates) {
                        var interValue, interBasePosition;
                        if(interIsNull) {
                            if(!belowDots2) {
                                interValue = orthoNullValue;
                            } else if(isDiscreteCateg) {
                                interValue = belowDots2[c2 - 1].value;
                            } else if(fromDot2.isNull) {
                                // Value of Below main point
                                //interValue = belowDots2[c2].value;
                                interValue = orthoNullValue;
                            } else /*if(toDot.isNull)*/ {
                                // Value of Below/From main point
                                //interValue = belowDots2[c2 - 2].value;
                                interValue = orthoNullValue;
                            }
                            
                            if(isStacked && isDiscreteCateg) {
                                // The intermediate point is at the start of the "to" band
                                interBasePosition = toBasePosition - dotBaseScale.halfBand;
                            } else if(fromDot2.isNull) { // Come from NULL
                                // Align directly below the (possibly) non-null dot
                                interBasePosition = toBasePosition;
                            } else /*if(toDot.isNull) */{ // Go to NULL
                                // Align directly below the non-null from dot
                                interBasePosition = fromDot2.basePosition;
                            } 
//                            else {
//                                interBasePosition = (toBasePosition + fromDot2.basePosition) / 2;
//                            }
                        } else {
                            // Average of the already offset values
                            interValue  = (toValue + fromDot2.value) / 2;
                            interBasePosition = (toBasePosition + fromDot2.basePosition) / 2;
                        }
                        
                        //----------------
                        dots2[c2 - 1] = def.create(false, toDot, {
                            isIntermediate: true,
                            value:          interValue,
                            isNull:         interIsNull,
                            isAlone:        interIsNull && toDot.isNull && fromDot2.isNull,
                            basePosition:   interBasePosition,
                            orthoPosition:  orthoZero,
                            orthoLength:    orthoScale(interValue) - orthoZero
                        });
                    }
                }
                
                // ---------------
                var isAlone     = !toDot.isNull && (!fromDot2 || fromDot2.isNull),
                    isSingle  = isAlone;
                if(isAlone) {
                    // Look ahead
                    var nextDot = dots[c + 1];
                    isAlone  = !nextDot || nextDot.isNull;
                    isSingle = !fromDot2 && !nextDot;
                }
                
                var toDot2 = dots2[c2] = def.create(false, toDot, {
                    isAlone:       isAlone,
                    isSingle:      isSingle,
                    value:         toValue,
                    basePosition:  toBasePosition,
                    orthoPosition: orthoZero,
                    orthoLength:   orthoScale(toValue) - orthoZero
                });
                
                // --------
                
                fromDot2 = toDot2;
            }
            
            if(isStacked) {
                belowDots2 = dots2;
            }
            
            return dots2;
        }
        
        function trimNullDots(dots2) {
            // Remove not defined indexes...
            var a = [];
            for(var p in dots2) {
                if(dots2.hasOwnProperty(p)) {
                    a.push(dots2[p]);
                }
            }
            dots2 = a;
            
            var L = dots2.length;
            while(L && dots2[0].isNull) {
                dots2.shift();
                L--;
            }
            
            while(L && dots2[L - 1].isNull) {
                dots2.pop();
                L--;
            }
            
            for(var i = 0 ; i < L ; i++) {
                var dot2 = dots2[i]; 
                dot2.prev = dots2[i - 1];
                dot2.next = dots2[i + 1];
            }
            
            return dots2;
        } 
        
        function createNullDatum(serData1, catData1) {
            // Create a null datum with col and row coordinate atoms
            var atoms = def.array.append(
                            def.own(serData1.atoms),
                            def.own(catData1.atoms));
            
            return new pvc.data.Datum(data, atoms, true);
        }
    }
});
