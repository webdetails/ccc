
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
        axisOffset: 0.05,
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

    _seriesDimName: 'series',

//    constructor: function(chart, options){
//        this.base(chart,options);
//    },
  
    /**
     * @override
     */
    createCore: function(){

        var myself = this,
            chart = this.chart,
            options  = chart.options,
            de = chart.dataEngine,
            isVertical = this.isOrientationVertical(),
            invisibleFill = 'rgba(127,127,127,0.00001)';

        // ------------------
        // DATA
        var seriesDimension = de.getDimension(this._seriesDimName),
            visibleSeriesElems = seriesDimension.getVisibleElements(),

            // Cache series data
            dataBySeries = this._calcDataBySeries(visibleSeriesElems),
            selDataBySeries = this._calcSelDataBySeries(dataBySeries),

            stackedOffsets = options.stacked ?
                    this._computeStackedOffsets(de.getVisibleTransposedValues(), true) :
                    null;

        // ------------------
        // SIGNUM (COORDINATES)
        var anchor = isVertical ? "bottom" : "left",
            anchorOrtho = this.anchorOrtho(anchor),
            anchorOrthoLength = this.anchorOrthoLength(anchor),
            anchorOpposite = this.anchorOpposite(anchor),
            
            orthoScale = chart.getLinearScale({bypassAxisSize: true}),
            orthoZero  = orthoScale(0),
            baseScale,
            signumBasePosition,
            signumSelBasePosition;

        if(options.timeSeries){ // ~ Continuous base scale
            baseScale = chart.getTimeseriesScale({
                            bypassAxisSize:   true,
                            bypassAxisOffset: true
                        });

            signumBasePosition = function(){
                return baseScale(this.datum().elem.category.value);
            };

            signumSelBasePosition = function(){
                var pos = signumBasePosition.call(this);

                // Odd indexes correspond to intermediate auxiliary dots
                if(this.index % 2 > 0){
                    var prevScene = this.sibling();
                    if(prevScene){
                        var prevPos = prevScene[anchorOrtho];
                        pos -= (pos - prevPos) / 2;
                    }
                }

                return pos;
            };
        } else { // ~ Discrete base scale
            baseScale = chart.getOrdinalScale({bypassAxisSize: true});
            
            var halfBand = baseScale.range().band / 2;

            signumBasePosition = function(){
                return baseScale(this.datum().elem.category.value) + halfBand;
            };

            signumSelBasePosition = function(){
                var pos = signumBasePosition.call(this);

                // Odd indexes correspond to intermediate auxiliary dots
                if(this.index % 2 > 0){
                    pos -= halfBand;
                }

                return pos;
            };
        }

        function signumOrthoPosition(){
            return orthoZero;
        }

         function signumOrthoLength(){
            var len = calcSignumOrthoLength.call(this);
            return myself.chart.animate(0, len);
        }

        function signumSelOrthoLength(){
            var len = calcSignumOrthoLength.call(this);

            // Odd indexes correspond to intermediate auxiliary dots
            if(this.index % 2 > 0){
                var prevScene = this.sibling();
                if(prevScene){
                    var prevLen = prevScene[anchorOrthoLength];
                    len -= (len - prevLen) / 2;
                }
            }

            return myself.chart.animate(0, len);
        }

        // Not animated
        function calcSignumOrthoLength(){

            var datum = this.datum(),
                orthoDomainOffset;
            if(stackedOffsets){
                // Assuming all categories are visible...
                var seriesIndex = datum.elem.category.leafIndex;
                orthoDomainOffset = stackedOffsets[this.parent.index][seriesIndex];
            }

            var value = (datum.value || 0) + (orthoDomainOffset || 0);
            return orthoScale(value) - orthoZero;
        }

        // ------------------
        // COLOR
        
        // -- DOT --
        function dotColorInterceptor(getDatumColor, args){
            if(!myself.showDots){
                return invisibleFill;
            }

            var darker = !getDatumColor && myself.showAreas ? 0.6 : null;
            return calcColor.call(this, getDatumColor, args, null, darker);
        }

        // -- LINE --
        function lineColorInterceptor(getDatumColor, args){

            var darker = !getDatumColor && options.stacked ? 0.6 : null,
                grayIfSelected = true;
            
            return calcColor.call(this, getDatumColor, args, null, darker, null, grayIfSelected);
        }
        
        function lineSelColorInterceptor(getDatumColor, args){
            
            if(!myself.showLines || !this.datum().isSelected()){
                return invisibleFill;
            }

            var darker = !getDatumColor && options.stacked ? 0.6 : null;

            return calcColor.call(this, getDatumColor, args, null, darker);
        }

        // -- AREA --
        var areaColorAlpha = this.showAreas && this.showLines && !options.stacked ?
                            0.5 : null;

        function fillColorInterceptor(getDatumColor, args){
            if(!myself.showAreas){
                return invisibleFill;
            }

            var hasSelections = de.getSelectedCount() > 0,
                grayAlpha = options.stacked && hasSelections ? 1 : null,
                grayIfSelected = true;

            return calcColor.call(this, getDatumColor, args, areaColorAlpha, null, grayAlpha, grayIfSelected);
        }

        function selAreaColorInterceptor(getDatumColor, args){
            if(!myself.showAreas || !this.datum().isSelected()){
                return invisibleFill;
            }

            return calcColor.call(this, getDatumColor, args, areaColorAlpha);
        }

        // Generic color "controller"
        var colors = chart.colors(pv.range(seriesDimension.getSize()));
        
        function calcColor(getDatumColor, args, alpha, darker, grayAlpha, grayIfSelected){
            var color;

            if(getDatumColor){
                color = getDatumColor.apply(this, args);
                if(color === null){
                    return null;
                }
            }

            if(color === undefined){
                var seriesIndex = this.datum().elem[myself._seriesDimName].leafIndex;
                color = colors(seriesIndex);
            }

            // ----------

            if(de.getSelectedCount() > 0 &&
               (grayIfSelected || !this.datum().isSelected())){
                return pvc.toGrayScale(color, grayAlpha);
            }

            if(alpha != null){
                color = color.alpha(alpha);
                //color = options.stacked ? color.darker(0.6) : color.alpha(0.4);
            }

            if(darker != null){
                color = color.darker(darker);
            }

            return color;
        }
        
        // ---------------
        // BUILD
        this.pvPanel.zOrder(0);

        if(options.showTooltips || this._shouldHandleClick()){
            this.pvPanel
              // Receive events even if in a transparent panel (#events default is "painted")
              .events("all")
              .event("mousemove", pv.Behavior.point(40))
              ;
        }

        this.pvScatterPanel = this.pvPanel.add(pv.Panel).data(visibleSeriesElems);

        this.pvArea = this.pvScatterPanel.add(pv.Area)
            .lock('data',  function(seriesElem){ return dataBySeries[seriesElem.absValue]; })
            .lock('datum', function(datum){ return datum; })
            .lock('segmented', false) // fixed

            // Physical dimensions
            .lock(anchor,            signumOrthoPosition) // ex: bottom
            .lock(anchorOrthoLength, signumOrthoLength)   // ex: height
            .lock(anchorOrtho,       signumBasePosition)  // ex: left

            // Style
            // These have no meaning in the area and should not be used
            .lock('strokeStyle', null)
            .lock('lineWidth',   0)

            .intercept('fillStyle', fillColorInterceptor, this._getExtension('area', 'fillStyle'))
            ;
        
        this.pvLine = this.pvArea.anchor(anchorOpposite).add(pv.Line)
            // should lock lots of things here...
            
            // Style
            .intercept('strokeStyle', lineColorInterceptor, this._getExtension('line', 'strokeStyle'))
            .lineWidth(this.showLines ? 1.5 : 0.001)

            .text(this._createPropDatumTooltip())
            ;

        // -- SELECTION --
        this.pvSelArea = this.pvArea.add(pv.Area)
            .data(function(seriesElem){ return selDataBySeries[seriesElem.absValue]; })
            // datum function inherited
            .visible(function(){ return !chart.isAnimating; })
            .segmented(true) // fixed

            // Physical dimensions
            // anchor function inherited
            [anchorOrtho](signumSelBasePosition) // ex: left
            [anchorOrthoLength](signumSelOrthoLength) // ex: height

            // Style
            // NOTE: the order: fillStyle, strokeStyle, lineWidth IS relevant
            .intercept('fillStyle',  selAreaColorInterceptor, this._getExtension('area', 'fillStyle'))
            
            // TRY to hide vertical lines between contiguous areas
            // When alpha is used (in non-stacked charts, see logic in selAreaColorInterceptor)
            // it is better to hide the stroke altogether,
            // because strokes with alpha do not generally render with the same color as the fill.
            // When alpha is not used, we specify a larger line width to bridge the gaps between areas.
            //  But when the line with is too large, and showLines = false,
            //   when selected, the area becomes noticeably bigger than when
            //   not selected.
            //   When also showDots = false,
            //   the join between lines on small angle corners, like:  /\
            //   becomes very hairy...
            .strokeStyle(function(){ return this.fillStyle(); })
            .lineWidth(function(){
                var color = this.strokeStyle();
                return (!color || color.a < 1) ? 0.00001 : 0.5;
            })

            // Interaction
            .events("all")
            ;

//        METHOD 2 - not better - explicit lines separating areas
//        The disadvantage is that lines in areas get drawn all around, not just vertically.
//        
//        var lineColor = pv.Color.names.white.alpha(0.3);
//        function selAreaStrokeColor(){
//            if(!myself.showAreas || !this.datum().isSelected()){
//                return invisibleFill;
//            }
//
//            return lineColor;
//        }
//        .strokeStyle(selAreaStrokeColor)
//        .lineWidth(function(){ return (this.index % 2) == 0 ? 0.3 : 0.01; })

        this.pvSelLine = this.pvSelArea
            .anchor(anchorOpposite) // receives from pvSelArea/anchor: data, datum, visible, left, top, right, ...
            .extend(this.pvLine)    // receive others, not overriden by anchor from pvLine: text, lineWidth, user extensions
            .add(pv.Line)
            // ----------
            //.data(function(seriesElem){ return selDataBySeries[seriesElem.absValue]; })
            // datum function inherited
            //.visible(function(){ return !chart.isAnimating; })
            .segmented(true) // fixed
            
            .intercept('strokeStyle', lineSelColorInterceptor, this._getExtension('line', 'strokeStyle'))
            .intercept('fillStyle',   lineSelColorInterceptor, this._getExtension('line', 'fillStyle'))
            .events("all")
            ;

        // -- DOT --
        // NOTE: must be added AFTER selection marks because of Z-order!
        this.pvDot = this.pvLine.add(pv.Dot)
            .shapeSize(12)
            .lineWidth(1.5)
            .intercept('strokeStyle', dotColorInterceptor, this._getExtension('dot', 'strokeStyle'))
            .intercept('fillStyle',   dotColorInterceptor, this._getExtension('dot', 'fillStyle'))
            ;

        if(this.showValues){
            this.pvLabel = this.pvDot
                .anchor(this.valuesAnchor)
                .add(pv.Label)
                // ------
                .bottom(0)
                .text(function(){
                    return options.valueFormat(this.datum().value);
                })
                ;
        }
        
        // -- INTERACTION --
        if(options.showTooltips){
            // TODO - tooltips centered on areas?
//            var settings = pvc.mergeOwn(
//                        pvc.create(options.tipsySettings),
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
                        var datum = this.datum(),
                            v = datum.value,
                            s = datum.elem.series.rawValue,
                            c = datum.elem.category.rawValue;

                        tooltip = options.customTooltip.call(null, s, c, v, datum);
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
                this._addPropClick(this.pvSelArea);
            }
        }

        if(options.doubleClickAction) {
            this._addPropDoubleClick(this.pvDot);

            if(this.showAreas){
                this._addPropDoubleClick(this.pvSelArea);
            }
        }
    },

    /**
     * Called when a render has ended.
     *
     * Re-renders selection marks.
     */
    _onRenderEnd: function(animated){
        if(animated){
            this.pvSelArea.render();
            this.pvSelLine.render();
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
     * Returns the datum associated with the
     * current rendering indexes of this.pvLine.
     *
     * @override
     */
    _getRenderingDatum: function(mark){
        return (mark || this.pvLine).datum();
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
            marks.push(this.pvSelLine);
        }
        
        return marks;
    },

    _calcDataBySeries: function(visibleSeriesElems){
        var dataBySeries = {},
            dataEngine = this.chart.dataEngine;

        visibleSeriesElems.forEach(function(seriesElem){
            var dimsFilter = {};
            dimsFilter[this._seriesDimName] = [seriesElem.absValue];

            var data = dataEngine.getWhere([dimsFilter]);

            dataBySeries[seriesElem.absValue] = data;
        }, this);

        return dataBySeries;
    },

    _calcSelDataBySeries: function(dataBySeries){
        var selDataBySeries = {};

        pvc.forEachOwn(dataBySeries, function(data, absSeriesValue){
            selDataBySeries[absSeriesValue] = this._calcSeriesSelData(data);
        }, this);

        return selDataBySeries;
    },

    _calcSeriesSelData: function(data){
        /*
         * Area selection data is twice the size of data.
         * When an area is selected, the dot-datum must be in the middle!
         * So, we create a before-dot area and an after-dot area.
         *  j | 0           | 1            | ... j            | ... | n = N-1
         *    | -  (D0) AA0 | BA1 (D1) AA1 | ... BAj (Dj) AAj | ... | BAn (Dn) - |
         *  k | -       0   | 1        2   |     2j-1     2j  | ... | 
         *
         *  D  - Dot/Datum
         *  BA - Before-Area
         *  AA - After-Area
         *
         * Only the first and last dots do not have a before and an after area,
         * respectively.
         *
         * All AA are in an even k-index.
         */
        var categCount = data.length;
        if(categCount <= 1){
            return [];
        }
        // >= 2
        
        var selData = [];
        
        for(var c = 0 ; c < categCount ; c++){
            var datum = data[c];

            // If not the first
            if(c){
                selData.push(datum);
            }

            // If not the last
            //if(c < categCount){
                selData.push(datum);
            //}
        }

        return selData;
    },
    
    _computeStackedOffsets: function(dataSet, reverse){
        /**
         *     c0, c1, c2, c3
         * [  [              ] s0
         *    [              ] s1
         *  ]
         */
        var stackedOffsets = [],
            seriesCount = dataSet.length;

        if(seriesCount){
            var categCount  = dataSet[0].length;
            if(categCount){
                var start = reverse ? seriesCount - 2 : 1,
                    stop  = reverse ? -1 : seriesCount, // stop is exclusive...
                    step  = reverse ? -1 : 1;

                // reverse ? seriesCount - 1 : 0
                stackedOffsets[start - step] = pvc.newArray(categCount, 0);

                for(var c = 0 ; c < categCount ; c++){
                    var categOffset = 0;
                    new pvc.Range(start, stop, step).forEach(function(s){
                        var seriesOffsets = stackedOffsets[s] ||
                                            (stackedOffsets[s] = new Array(categCount)); // happens on c == 0

                        categOffset += dataSet[s - step][c] || 0;

                        seriesOffsets[c] = categOffset;
                    });
                }

            }
        }

        return stackedOffsets;
    }
});
