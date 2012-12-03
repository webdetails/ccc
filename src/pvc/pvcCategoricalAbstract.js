/**
 * CategoricalAbstract is the base class for all categorical or timeseries
 */
pvc.CategoricalAbstract = pvc.TimeseriesAbstract.extend({

    yAxisPanel : null,
    xAxisPanel : null,
    secondXAxisPanel: null,
    secondYAxisPanel: null,
    
    categoricalPanel: null, // This will act as a holder for the specific panel

    yScale: null,
    xScale: null,

    constructor: function(options){

        this.base(options);

        pvc.mergeDefaults(this.options, pvc.CategoricalAbstract.defaultOptions, options);
    },

    /**
     * Processes options after user options and default options have been merged.
     * @override
     */
    _processOptionsCore: function(options){

        this.base(options);

        // Sanitize some options
        if(options.showTooltips){
            var tipsySettings = options.tipsySettings;
            if(tipsySettings){
                tipsySettings = options.tipsySettings = pvc.create(tipsySettings);
                this.extend(tipsySettings, "tooltip_");
            }
        }

        if (!options.showYScale){
            options.yAxisSize = 0;
        }

        if (!options.showXScale){
            options.xAxisSize = 0;
        }

        if(options.secondAxis && options.secondAxisIndependentScale){
            options.secondAxisSize = this._isSecondAxisVertical() ?
                                        options.yAxisSize :
                                        options.xAxisSize;
        } else {
            options.secondAxisSize = 0;
        }

        if(options.stacked){
            options.orthoFixedMin = 0;

            if(options.percentageNormalized){
                options.orthoFixedMax = 100;
            }
        } else {
            options.percentageNormalized = false;
        }
    },

    _isSecondAxisVertical: function(){
        return this.isOrientationVertical();
    },

    preRender: function(){
        var options = this.options;
        
        // NOTE: creates root BasePanel, 
        //  and its Title and Legend child panels.
        this.base();

        pvc.log("Prerendering in CategoricalAbstract");

        this.initSecondXAxis();
        this.initXAxis();
        this.initSecondYAxis();
        this.initYAxis();
        
        // NOTE: must be evaluated before axis panels' creation
        //  because getZZZZScale calls assume this (bypassAxisSize = false)
        this.xScale = this.getXScale();
        this.yScale = this.getYScale();
        if(options.secondAxis){
            this.secondScale = this.getSecondScale();
        }

        // --------------

        if(this.secondXAxisPanel){
            this.secondXAxisPanel.setScale(this.secondScale);
            this.secondXAxisPanel.appendTo(this.basePanel); // Add it
        }
        
        if(this.xAxisPanel){
            this.xAxisPanel.setScale(this.xScale);
            this.xAxisPanel.appendTo(this.basePanel); // Add it
        }
        
        if(this.secondYAxisPanel){
            this.secondYAxisPanel.setScale(this.secondScale);
            this.secondYAxisPanel.appendTo(this.basePanel); // Add it
        }
        
        if(this.yAxisPanel){
            this.yAxisPanel.setScale(this.yScale);
            this.yAxisPanel.appendTo(this.basePanel); // Add it
        }

        // ---------------
        
        this.categoricalPanel = this.createCategoricalPanel();
        this.categoricalPanel.appendTo(this.basePanel); // Add it
    },

    /* @abstract */
    createCategoricalPanel: function(){
        throw new Error("Not implemented.");
    },

    /**
     * Initializes the X axis. It's in a separate function to allow overriding this value.
     */
    initXAxis: function(){
    	var options = this.options;
        if (options.showXScale){
            this.xAxisPanel = new pvc.XAxisPanel(this, {
                ordinal: this.isXAxisOrdinal(),
                showAllTimeseries: false,
                anchor: options.xAxisPosition,
                axisSize: options.xAxisSize,
                fullGrid:  options.xAxisFullGrid,
                endLine: options.xAxisEndLine,
                domainRoundMode:  options.xAxisDomainRoundMode,
                desiredTickCount: options.xAxisDesiredTickCount,
                minorTicks:  options.xAxisMinorTicks,
                ordinalDimensionName: this.getAxisOrdinalDimension('x'),
                useCompositeAxis: options.useCompositeAxis,
                font: options.axisLabelFont,
                title: options.xAxisTitle,
                titleFont: options.axisTitleFont,
                titleSize: options.xAxisTitleSize,
                clickAction: options.xAxisClickAction,
                doubleClickAction: options.xAxisDoubleClickAction
            });
        }
    },

    /**
     * Initializes the Y axis. It's in a separate function to allow overriding this value.
     */
    initYAxis: function(){
    	var options = this.options;
        if (options.showYScale){
            this.yAxisPanel = new pvc.YAxisPanel(this, {
                ordinal: this.isYAxisOrdinal(),
                showAllTimeseries: false,
                anchor:   options.yAxisPosition,
                axisSize: options.yAxisSize,
                fullGrid: options.yAxisFullGrid,
                endLine:  options.yAxisEndLine,
                domainRoundMode:  options.yAxisDomainRoundMode,
                desiredTickCount: options.yAxisDesiredTickCount,
                minorTicks:       options.yAxisMinorTicks,
                ordinalDimensionName: this.getAxisOrdinalDimension('y'),
                useCompositeAxis: options.useCompositeAxis,
                font: options.axisLabelFont,
                title: options.yAxisTitle,
                titleSize: options.yAxisTitleSize,
                titleFont:  options.axisTitleFont,
                clickAction:       options.yAxisClickAction,
                doubleClickAction: options.yAxisDoubleClickAction
            });
        }
    },

    /**
     * Initializes the second axis for X, if exists and only for horizontal charts.
     */
    initSecondXAxis: function(){
    	var options = this.options;
        if(options.secondAxis && 
           options.secondAxisIndependentScale &&
           this.isOrientationHorizontal()){
           
            this.secondXAxisPanel = new pvc.SecondXAxisPanel(this, {
                ordinal: this.isXAxisOrdinal(),
                showAllTimeseries: false,
                anchor: pvc.BasePanel.oppositeAnchor[options.xAxisPosition],
                axisSize: options.secondAxisSize,
                domainRoundMode:  options.secondAxisDomainRoundMode,
                desiredTickCount: options.secondAxisDesiredTickCount,
                minorTicks:       options.secondAxisMinorTicks,
                ordinalDimensionName: this.getAxisOrdinalDimension('x'),
                tickColor: options.secondAxisColor,
                title: options.secondAxisTitle,
                titleFont: options.axisTitleFont,
                titleSize: options.secondAxisTitleSize
            });
        }
    },

    /**
     * Initializes the second axis for Y, if exists and only for vertical charts.
     */
    initSecondYAxis: function(){
    	var options = this.options;
        if(options.secondAxis && 
           options.secondAxisIndependentScale &&
           this.isOrientationVertical()){

            this.secondYAxisPanel = new pvc.SecondYAxisPanel(this, {
                ordinal: this.isYAxisOrdinal(),
                showAllTimeseries: false,
                anchor: pvc.BasePanel.oppositeAnchor[options.yAxisPosition],
                axisSize: options.secondAxisSize,
                domainRoundMode:  options.secondAxisDomainRoundMode,
                desiredTickCount: options.secondAxisDesiredTickCount,
                minorTicks:       options.secondAxisMinorTicks,
                ordinalDimensionName: this.getAxisOrdinalDimension('y'),
                tickColor: options.secondAxisColor,
                title: options.secondAxisTitle,
                titleFont: options.axisTitleFont,
                titleSize: options.secondAxisTitleSize
            });
        }
    },

    /**
     * Indicates if xx is an ordinal scale.
     */
    isXAxisOrdinal: function(){
        return this.isOrientationVertical()? 
            !this.options.timeSeries : 
            this.options.orthoAxisOrdinal;
    },

    /**
     * Indicates if yy is an ordinal scale.
     */
    isYAxisOrdinal: function(){
        return this.isOrientationVertical()? 
            this.options.orthoAxisOrdinal :
            !this.options.timeSeries;
    },

    /**
     *  The data dimension name to use on an ordinal axis.
     */
    getAxisOrdinalDimension: function(axis){
        var onSeries = false;

        // onSeries can only be true if the perpendicular axis is ordinal
        if (this.options.orthoAxisOrdinal) {
            // (X && !V) || (!X && V)
            var isVertical = this.isOrientationVertical();
            onSeries = (axis == "x") ? !isVertical : isVertical;
        }

        return onSeries ? 'series' : 'category';
    },

    /**
     * xx scale for categorical charts.
     * Must be called before axis panels are created (bypassAxisSize = false).
     */
    getXScale: function(){
        if (this.isOrientationVertical()) {
            return this.options.timeSeries? 
                this.getTimeseriesScale({bypassAxisOffset: true}) :
                this.getOrdinalScale();
        }

        return this.options.orthoAxisOrdinal ? 
            this.getOrdinalScale({orthoAxis: "x"}) :
            this.getLinearScale({bypassAxisOffset: true});
    },

    /**
     * yy scale for categorical charts.
     * Must be called before axis panels are created (bypassAxisSize = false).
     */
    getYScale: function(){
        if (this.isOrientationVertical()) {
            return this.options.orthoAxisOrdinal ? 
                this.getOrdinalScale({orthoAxis: "y"}) : 
                this.getLinearScale();
        }
        
        return this.options.timeSeries ? 
            this.getTimeseriesScale(): 
            this.getOrdinalScale();
    },

    _getAxisSize: function(bypass, axisName){
        if(bypass){
            return 0;
        }

        var axis = this[axisName + "AxisPanel"];
        return axis ? axis.axisSize : 0;
    },

    /**
     * Scale for an ordinal axis.
     * If orthoAxis is null:
     *   xx if orientation is vertical, yy otherwise.
     * Else 
     *   yy if if orthoAxis is "y"
     *   xx if if orthoAxis is "x"
     *
     * Keyword arguments:
     *   bypassAxisSize: boolean,     default is false
     *   orthoAxis: "y", "x" or null, default is null
     */
    getOrdinalScale: function(keyArgs){

        var bypassAxisSize = pvc.get(keyArgs, 'bypassAxisSize', false),
            orthoAxis = pvc.get(keyArgs, 'orthoAxis', null),
            options   = this.options,
            yAxisSize = this._getAxisSize(bypassAxisSize, 'y'),
            xAxisSize = this._getAxisSize(bypassAxisSize, 'x');
        
        // DOMAIN
        var data = orthoAxis ?
                this.dataEngine.getVisibleSeries() :
                this.dataEngine.getVisibleCategories();
        
        // NOTE: assumes data elements convert well to string
        var scale = new pv.Scale.ordinal(data);
        
        // RANGE
        if (orthoAxis) {   // added by CvK
            if (orthoAxis == "y") {
                scale.min = 0;
                scale.max = this.basePanel.height - xAxisSize;
            } else {   // assume orthoAxis == "x"
                if(options.yAxisPosition == "left"){
                    scale.min = yAxisSize;
                    scale.max = this.basePanel.width;
                } else {
                    scale.min = 0;
                    scale.max = this.basePanel.width - yAxisSize;
                }
            }
        } else {   // !orthoAxis (so normal ordinal axis)
            var isX = this.isOrientationVertical(),
                rSize = isX ? this.basePanel.width : this.basePanel.height;

            if (isX){
                var secondYAxisSize = bypassAxisSize || !this._isSecondAxisVertical() ? 
                                        0 :
                                        options.secondAxisSize;
                if(options.yAxisPosition == "left"){
                    scale.min = yAxisSize;
                    scale.max = rSize - secondYAxisSize;
                } else {
                    scale.min = secondYAxisSize;
                    scale.max = rSize - yAxisSize;
                }
            } else {
                var secondXAxisSize = this._getAxisSize(
                                bypassAxisSize || this._isSecondAxisVertical(),
                                'second');
                scale.min = 0;
                scale.max = rSize - xAxisSize - secondXAxisSize;
            }
        }  // end else-part -- if (orthoAxis)

        var panelSizeRatio = options.panelSizeRatio;
        scale.splitBanded(scale.min, scale.max, panelSizeRatio);
        
        var range = scale.range(),
            step  = range.band / panelSizeRatio; // =def (band + margin)
        
        range.step   = step;
        range.margin = step * (1 - panelSizeRatio);
        
        return scale;
    },

    /**
     * Scale for a linear axis.
     * xx if orientation is horizontal, yy otherwise.
     * 
     * Keyword arguments:
     *   bypassAxisSize:    boolean, default is false
     *   bypassAxisOffset:  boolean, default is false
     */
    getLinearScale: function(keyArgs){

        var bypassAxisSize   = pvc.get(keyArgs, 'bypassAxisSize',   false),
            bypassAxisOffset = pvc.get(keyArgs, 'bypassAxisOffset', false),
            options   = this.options,
            isX = this.isOrientationHorizontal(),
            dMin, // Domain
            dMax,
            bound,
            lockedMin = true,
            lockedMax = true;
        
        /* 
         * Note that in the following dMin and dMax calculations,
         * orthFixedMin and orthoFixedMax already take into account if
         * stacked or percentageNormalized are set.
         * @see _processOptionsCore
         */

        // Min
        bound = parseFloat(options.orthoFixedMin);
        if(!isNaN(bound)){
            dMin = bound;
        } else {
            dMin = this.dataEngine.getVisibleSeriesAbsoluteMin(); // may be < 0 !
            lockedMin = false;
        }

        // Max
        bound = parseFloat(options.orthoFixedMax);
        if(!isNaN(bound)){
            dMax = bound;
        } else if(options.stacked) {
            dMax = this.dataEngine.getCategoriesMaxSumOfVisibleSeries(); // may be < 0 !
            lockedMax = false;
        } else {
            dMax = this.dataEngine.getVisibleSeriesAbsoluteMax(); // may be < 0 !
            lockedMax = false;
        }
        
        /*
         * If both negative or both positive
         * the scale does not contain the number 0.
         *
         * Currently this option ignores locks. Is this all right?
         */
        if(options.originIsZero && (dMin * dMax > 0)){
            if(dMin > 0){
                dMin = 0;
                lockedMin = true;
            } else {
                dMax = 0;
                lockedMax = true;
            }
        }

        /*
         * If the bounds (still) are the same, things break,
         * so we add a wee bit of variation.
         *
         * This one must ignore locks.
         */
        if (dMin === dMax) {
            dMin = dMin !== 0 ? dMin * 0.99 : options.originIsZero ? 0 : -0.1;
            dMax = dMax !== 0 ? dMax * 1.01 : 0.1;
        } else if(dMin > dMax){
            // What the heck...
            // Is this ok or should throw?
            bound = dMin;
            dMin = dMax;
            dMax = bound;
        }

        // Adding a small offset to the scale's dMin and dMax,
        //  as long as they are not 0 and originIsZero=true.
        // DCL: 'axisOffset' is a percentage??
        if(!bypassAxisOffset &&
           options.axisOffset > 0 &&
           (!lockedMin || !lockedMax)){

            var dOffset = (dMax - dMin) * options.axisOffset;
            if(!lockedMin){
                dMin -= dOffset;
            }

            if(!lockedMax){
                dMax += dOffset;
            }
        }
        
        var scale = new pv.Scale.linear(dMin, dMax);
        
        // Domain rounding
        pvc.roundScaleDomain(
                scale, 
                isX ? options.xAxisDomainRoundMode  : options.yAxisDomainRoundMode,
                isX ? options.xAxisDesiredTickCount : options.yAxisDesiredTickCount);
        
        // ----------------------------

        // RANGE
        
        // NOTE: By the time this is evaluated by getZZZScale() methods,
        // axis panels have not yet been created,
        // but titles and legends already have been.
        // In those situations it is specified: bypassAxisSize = false
        var rSize = isX ? this.basePanel.width : this.basePanel.height;
        if(isX){
            var yAxisSize = this._getAxisSize(bypassAxisSize, 'y'),
                secondYAxisSize = this._getAxisSize(bypassAxisSize || !this._isSecondAxisVertical(), 'second');

            if(options.yAxisPosition == "left"){
                scale.min = yAxisSize;
                scale.max = rSize - secondYAxisSize;
            } else {
                scale.min = secondYAxisSize;
                scale.max = rSize - yAxisSize;
            }

        } else {
            var xAxisSize = this._getAxisSize(bypassAxisSize, 'x'),
                secondXAxisSize = this._getAxisSize(bypassAxisSize || this._isSecondAxisVertical(), 'second');
            
            scale.min = 0;
            scale.max = rSize - xAxisSize - secondXAxisSize;
        }

        scale.range(scale.min, scale.max);
        
        return scale;
    },

    /**
     * Scale for the timeseries axis.
     * xx if orientation is vertical, yy otherwise.
     *
     * Keyword arguments:
     *   bypassAxisSize:   boolean, default is false
     *   bypassAxisOffset: boolean, default is false
     */
    getTimeseriesScale: function(keyArgs){

        var bypassAxisSize   = pvc.get(keyArgs, 'bypassAxisSize',   false),
            bypassAxisOffset = pvc.get(keyArgs, 'bypassAxisOffset', false),
            options = this.options,
            isX = this.isOrientationVertical();
        
        // DOMAIN
        var categories = this.dataEngine.getVisibleCategories();
        
        // Adding a small offset to the scale's domain:
        var parser = pv.Format.date(options.timeSeriesFormat),
            dMin = parser.parse(categories[0]),
            dMax = parser.parse(categories[categories.length - 1]),
            dOffset = 0;
        
        if(!bypassAxisOffset){
            dOffset = (dMax.getTime() - dMin.getTime()) * options.axisOffset;
        }

        var scale = new pv.Scale.linear(
                                new Date(dMin.getTime() - dOffset),
                                new Date(dMax.getTime() + dOffset));

        // Domain rounding
        // TODO: pvc.scaleTicks(scale) does not like Dates...
        pvc.roundScaleDomain(
                scale, 
                isX ? options.xAxisDomainRoundMode  : options.yAxisDomainRoundMode,
                isX ? options.xAxisDesiredTickCount : options.yAxisDesiredTickCount);
        
        // RANGE
        var rSize = isX ? this.basePanel.width : this.basePanel.height;
        
        if(isX){
            var yAxisSize = this._getAxisSize(bypassAxisSize, 'y'),
                secondYAxisSize = this._getAxisSize(bypassAxisSize || !this._isSecondAxisVertical(), 'second');

            if(options.yAxisPosition == "left"){
                scale.min = yAxisSize;
                scale.max = rSize - secondYAxisSize;
            } else {
                scale.min = secondYAxisSize;
                scale.max = rSize - yAxisSize;
            }
        } else {
            var xAxisSize = this._getAxisSize(bypassAxisSize, 'x'),
                secondXAxisSize = this._getAxisSize(bypassAxisSize || this._isSecondAxisVertical(), 'second');
            
            scale.min = 0;
            scale.max = rSize - xAxisSize - secondXAxisSize;
        }

        scale.range(scale.min , scale.max);
        
        return scale;
    },

    /**
     * Scale for the second linear axis. yy if orientation is vertical, xx otherwise.
     *
     * Keyword arguments:
     *   bypassAxisSize:   boolean, default is false
     *   bypassAxisOffset: boolean, default is false (only implemented for not independent scale)
     */
    getSecondScale: function(keyArgs){

        var options = this.options;
        
        if(!options.secondAxis || !options.secondAxisIndependentScale){
            return this.getLinearScale(keyArgs);
        }
        
        // DOMAIN
        var bypassAxisSize   = pvc.get(keyArgs, 'bypassAxisSize',   false),
            dMax = options.secondAxisOrthoFixedMax || this.dataEngine.getSecondAxisMax(),
            dMin = this.dataEngine.getSecondAxisMin();

        if(dMin * dMax > 0 && options.secondAxisOriginIsZero){
            if(dMin > 0){
                dMin = 0;
            } else {
                dMax = 0;
            }
        }

        // Adding a small offset to the scale's domain:
        var dOffset = (dMax - dMin) * options.secondAxisOffset,
            scale = new pv.Scale.linear(
                        dMin - (options.secondAxisOriginIsZero && dMin == 0 ? 0 : dOffset),
                        dMax + (options.secondAxisOriginIsZero && dMax == 0 ? 0 : dOffset));

        // Domain rounding
        pvc.roundScaleDomain(scale, options.secondAxisRoundDomain, options.secondAxisDesiredTickCount);
                
        // RANGE
        var xAxisSize = this._getAxisSize(bypassAxisSize, 'x'),
            yAxisSize = this._getAxisSize(bypassAxisSize, 'y'),
            isX = !this._isSecondAxisVertical(),
            rSize = isX ? this.basePanel.width : this.basePanel.height;
                
        if(isX){
            if(options.yAxisPosition == "left"){
                scale.min = yAxisSize;
                scale.max = rSize;
            } else {
                scale.min = 0;
                scale.max = rSize - yAxisSize;
            }
        } else {
            scale.min = 0;
            scale.max = rSize - xAxisSize;
        }

        scale.range(scale.min, scale.max);
        
        return scale;
    },
    
    markEventDefaults: {
        strokeStyle: "#5BCBF5",  /* Line Color */
        lineWidth: "0.5",  /* Line Width */
        textStyle: "#5BCBF5", /* Text Color */
        verticalOffset: 10, /* Distance between vertical anchor and label */
        verticalAnchor: "bottom", /* Vertical anchor: top or bottom */
        horizontalAnchor: "right", /* Horizontal anchor: left or right */
        forceHorizontalAnchor: false, /* Horizontal anchor position will be respected if true */
        horizontalAnchorSwapLimit: 80 /* Horizontal anchor will switch if less than this space available */
    },
    
    markEvent: function(dateString, label, options){

        if(!this.options.timeSeries){
            pvc.log("Attempting to mark an event on a non timeSeries chart");
            return;
        }

        var o = $.extend({}, this.markEventDefaults, options);
        
        var scale = this.getTimeseriesScale({
                        bypassAxisSize:   true,
                        bypassAxisOffset: true
                    });

        // Are we outside the allowed scale? 
        var d = pv.Format.date(this.options.timeSeriesFormat).parse(dateString);
        var dpos = scale( d );
        
        if( dpos < scale.range()[0] || dpos > scale.range()[1]){
            pvc.log("Event outside the allowed range, returning");
            return;
        }

        // Add the line

        var panel = this.categoricalPanel.pvPanel;
        var h = this.yScale.range()[1];

        // Detect where to place the horizontalAnchor
        //var anchor = o.horizontalAnchor;
        if( !o.forceHorizontalAnchor )
        {
            var availableSize = o.horizontalAnchor == "right"?scale.range()[1]-dpos:dpos;
            
            // TODO: Replace this availableSize condition with a check for the text size
            if (availableSize < o.horizontalAnchorSwapLimit ){
                o.horizontalAnchor = o.horizontalAnchor == "right"?"left":"right";
            }
            
        }

        var line = panel.add(pv.Line)
            .data([0,h])
            .strokeStyle(o.strokeStyle)
            .lineWidth(o.lineWidth)
            .bottom(function(d){
                return d;
            })
            .left(dpos);

        //var pvLabel = 
        line.anchor(o.horizontalAnchor)
            .top( o.verticalAnchor == "top" ? o.verticalOffset : (h - o.verticalOffset))
            .add(pv.Label)
            .text(label)
            .textStyle(o.textStyle)
            .visible(function(d){
                return this.index==0;
            });
    },

    clearSelections: function(){
        this.dataEngine.clearSelections();
        this.categoricalPanel._handleSelectionChanged();
    }

}, {
    defaultOptions: {
        showAllTimeseries: false,
        showXScale: true,
        showYScale: true,

        originIsZero: true,

        axisOffset: 0,
        axisLabelFont: '10px sans-serif',
        axisTitleFont: '12px sans-serif', // 'bold '
        
        orthoFixedMin: null, // when percentageNormalized => 0
        orthoFixedMax: null, // when percentageNormalized => 100

        timeSeries: false,
        timeSeriesFormat: "%Y-%m-%d",

        // CvK  added extra parameter for implementation of HeatGrid
        orthoAxisOrdinal: false,
        // if orientation==vertical then perpendicular-axis is the y-axis
        //  else perpendicular-axis is the x-axis.

        useCompositeAxis: false,

        xAxisPosition: "bottom",
        xAxisSize: undefined,
        xAxisFullGrid: false,
        xAxisEndLine:  false,
        xAxisDomainRoundMode: 'none',  // for linear scales
        xAxisDesiredTickCount: null,   // idem
        xAxisMinorTicks:  true,   // idem
        xAxisClickAction: null,
        xAxisDoubleClickAction: null,
        xAxisTitle: undefined,
        xAxisTitleSize: undefined,

        yAxisPosition: "left",
        yAxisSize: undefined,
        yAxisFullGrid: false,
        yAxisEndLine:  false,
        yAxisDomainRoundMode: 'none',
        yAxisDesiredTickCount: null,
        yAxisMinorTicks:  true,
        yAxisClickAction: null,
        yAxisDoubleClickAction: null,
        yAxisTitle: undefined,
        yAxisTitleSize: undefined,
        
        secondAxisIndependentScale: false,
        secondAxisOriginIsZero: true,
        secondAxisOffset: 0,
        secondAxisColor: "blue",
        //secondAxisSize: 0, // calculated
        secondAxisDomainRoundMode: 'none',  // only with independent second scale
        secondAxisDesiredTickCount: null,   // idem
        secondAxisMinorTicks: true,
        secondAxisTitle: undefined,
        secondAxisTitleSize: undefined,
        secondAxisOrthoFixedMax: null,

        panelSizeRatio: 0.9,
        
        // Content/Plot area clicking
        clickAction: null,
        doubleClickAction: null,
        doubleClickMaxDelay: 300, //ms

        // Selection
        // Use CTRL key to make fine-grained selections
        ctrlSelectMode: true,

        // function to be invoked when a selection occurs
        // (shape click-select, row/column click and lasso finished)
        selectionChangedAction: null,

        // Selection - Rubber band
        rubberBandFill: 'rgba(203, 239, 163, 0.6)', // 'rgba(255, 127, 0, 0.15)',
        rubberBandLine: '#86fe00', //'rgb(255,127,0)',

        // Tooltips
        showTooltips:  true,
        customTooltip: null, // function(s, c, v, datum) -> tooltip text
        tipsySettings: {
            gravity: "s",
            fade: true
        }
    }
});