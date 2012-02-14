
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

        // Apply options
        pvc.mergeDefaults(this.options, pvc.CategoricalAbstract.defaultOptions, options);

        if(this.options.showTooltips){
            var tipsySettings = this.options.tipsySettings;
            if(tipsySettings){
                // Clone top-level structure. Should be deep clone, perhaps.
                tipsySettings = this.options.tipsySettings = pvc.mergeOwn({}, tipsySettings);

                this.extend(tipsySettings, "tooltip_");
            }
        }

        // Sanitize some options
        if (!this.options.showYScale){
            this.options.yAxisSize = 0;
        }
        
        if (!this.options.showXScale){
            this.options.xAxisSize = 0;
        }

        if(this.options.secondAxis && this.options.secondAxisIndependentScale){
            this.options.secondAxisSize = this.isOrientationVertical() ?
                this.options.yAxisSize : 
                this.options.xAxisSize;
        } else {
            this.options.secondAxisSize = 0;
        }
    },

    preRender: function(){

        // NOTE: creates root BasePanel, 
        //  and its Title and Legend child panels.
        this.base();

        pvc.log("Prerendering in CategoricalAbstract");
        
        // TODO: DCL - Again??
        // Sanitize some options:
        if (!this.options.showYScale){
            this.options.yAxisSize = 0;
        }
        
        if (!this.options.showXScale){
            this.options.xAxisSize = 0;
        }
        
        // NOTE: must be evaluated before axis panels' creation
        //  because getZZZZScale calls assume this (bypassAxis = false)
        this.xScale = this.getXScale();
        this.yScale = this.getYScale();
        
        if(this.options.secondAxis){
            this.secondScale = this.getSecondScale();
        }
        
        // Generate X axis
        if(this.options.secondAxis){
            // this goes before the other because of the fullGrid
            this.generateSecondXAxis();
        }
        
        this.generateXAxis();
        
        // Generate Y axis
        if(this.options.secondAxis){
            // this goes before the other because of the fullGrid
            this.generateSecondYAxis();
        }
        
        this.generateYAxis();

        this.categoricalPanel = this.createCategoricalPanel();
        this.categoricalPanel.appendTo(this.basePanel); // Add it
    },

    /* @abstract */
    createCategoricalPanel: function(){
        throw new Error("Not implemented.");
    },

    /**
     * Generates the X axis. It's in a separate function to allow overriding this value.
     */
    generateXAxis: function(){
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
                clickAction: options.xAxisClickAction,
                doubleClickAction: options.xAxisDoubleClickAction
            });

            //            this.xAxisPanel.setScale(this.xScale);
            this.xAxisPanel.setScale(this.xScale);
            this.xAxisPanel.appendTo(this.basePanel); // Add it
        }
    },

    /**
     * Generates the Y axis. It's in a separate function to allow overriding this value.
     */
    generateYAxis: function(){
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
                clickAction:       options.yAxisClickAction,
                doubleClickAction: options.yAxisDoubleClickAction
            });

            this.yAxisPanel.setScale(this.yScale);
            this.yAxisPanel.appendTo(this.basePanel); // Add it
        }
    },

    /**
     * Generates the second axis for X, if exists and only for horizontal charts.
     */
    generateSecondXAxis: function(){
    	var options = this.options;
        if(options.secondAxisIndependentScale && this.isOrientationHorizontal()){
           
            this.secondXAxisPanel = new pvc.SecondXAxisPanel(this, {
                ordinal: this.isXAxisOrdinal(),
                showAllTimeseries: false,
                anchor: pvc.BasePanel.oppositeAnchor[options.xAxisPosition],
                axisSize: options.secondAxisSize,
                domainRoundMode:  options.secondAxisDomainRoundMode,
                desiredTickCount: options.secondAxisDesiredTickCount,
                minorTicks:       options.secondAxisMinorTicks,
                ordinalDimensionName: this.getAxisOrdinalDimension('x'),
                tickColor: options.secondAxisColor
            });

            this.secondXAxisPanel.setScale(this.secondScale);
            this.secondXAxisPanel.appendTo(this.basePanel); // Add it
        }
    },

    /**
     * Generates the second axis for Y, if exists and only for vertical charts.
     */
    generateSecondYAxis: function(){
    	var options = this.options;
        if(options.secondAxisIndependentScale && this.isOrientationVertical()){

            this.secondYAxisPanel = new pvc.SecondYAxisPanel(this, {
                ordinal: this.isYAxisOrdinal(),
                showAllTimeseries: false,
                anchor: pvc.BasePanel.oppositeAnchor[options.yAxisPosition],
                axisSize: options.secondAxisSize,
                domainRoundMode:  options.secondAxisDomainRoundMode,
                desiredTickCount: options.secondAxisDesiredTickCount,
                minorTicks:       options.secondAxisMinorTicks,
                ordinalDimensionName: this.getAxisOrdinalDimension('y'),
                tickColor: options.secondAxisColor
            });

            this.secondYAxisPanel.setScale(this.secondScale);
            this.secondYAxisPanel.appendTo(this.basePanel); // Add it
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
     * Must be called before axis panels are created (bypassAxis = false).
     */
    getXScale: function(){
        if (this.isOrientationVertical()) {
            return this.options.timeSeries? 
                this.getTimeseriesScale(false, true) : 
                this.getOrdinalScale();
        }

        return this.options.orthoAxisOrdinal ? 
            this.getPerpOrdinalScale("x") :
            this.getLinearScale(false, true);
    },

    /**
     * yy scale for categorical charts.
     * Must be called before axis panels are created (bypassAxis = false).
     */
    getYScale: function(){
        if (this.isOrientationVertical()) {
            return this.options.orthoAxisOrdinal ? 
                this.getPerpOrdinalScale("y") : 
                this.getLinearScale();
        }
        
        return this.options.timeSeries ? 
            this.getTimeseriesScale(): 
            this.getOrdinalScale();
    },

    /**
     * Helper function to facilitate  (refactoring)
     *     - getOrdinalScale()
     *     - getPerpOrdScale()
     *   (CvK)
     */
    getOrdScale: function(bypassAxis, orthoAxis){

        var options = this.options,
            yAxisSize = bypassAxis ? 0 : options.yAxisSize,
            xAxisSize = bypassAxis ? 0 : options.xAxisSize;
        
        // DOMAIN
        var dData = orthoAxis ? 
                this.dataEngine.getVisibleSeries(): 
                this.dataEngine.getVisibleCategories();
        
        // NOTE: presumes data elements convert well to string
        var scale = new pv.Scale.ordinal(dData);
        
        // RANGE
        if (orthoAxis) {   // added by CvK
            if (orthoAxis == "y") {
                scale.min = 0;
                scale.max = this.basePanel.height - xAxisSize;
            } else {   // assume orthoAxis == "x"
                scale.min = yAxisSize;
                scale.max = this.basePanel.width;
            }
        } else {   // !orthoAxis (so normal ordinal axis)
            var isX = this.isOrientationVertical(),
                rSize = isX ? this.basePanel.width : this.basePanel.height;

            if (isX){
                var secondYAxisSize = bypassAxis ? 0 : options.secondAxisSize;
                if(options.yAxisPosition == "left"){
                    scale.min = yAxisSize;
                    scale.max = rSize - secondYAxisSize;
                } else {
                    scale.min = secondYAxisSize;
                    scale.max = rSize - yAxisSize;
                }
            } else {
                var secondXAxisSize = bypassAxis ? 0 : options.secondAxisSize;
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
     * Scale for the ordinal axis. xx if orientation is vertical, yy otherwise.
     */
    getOrdinalScale: function(bypassAxis){
        return this.getOrdScale(bypassAxis, null);
    },
    
    /**
     * Scale for the perpendicular ordinal axis.
     *     yy if orientation is vertical,
     *     xx otherwise
     *   (CvK)
     * 
     *   orthoAxis : "y", "x" or null
     */
    getPerpOrdinalScale: function(orthoAxis){
        return this.getOrdScale(false, orthoAxis);
    },
    
    getLinearScale: function(bypassAxis, bypassOffset){

        var options   = this.options,
            isX = this.isOrientationHorizontal(),
            dMin, // Domain
            dMax;
        
        // DOMAIN
        if(options.stacked){
            dMax = this.dataEngine.getCategoriesMaxSumOfVisibleSeries();
            dMin = 0;
        } else {
            dMax = this.dataEngine.getVisibleSeriesAbsoluteMax();
            dMin = this.dataEngine.getVisibleSeriesAbsoluteMin();
        }
        
        /* If the bounds are the same, things break,
         * so we add a wee bit of variation.
         */
        if (dMin === dMax) {
            dMin = dMin !== 0 ? dMin * 0.99 : options.originIsZero ? 0 : -0.1;
            dMax = dMax !== 0 ? dMax * 1.01 : 0.1;
        }
        
        /* Both negative or both positive */
        if(dMin * dMax > 0 && options.originIsZero){
            if(dMin > 0){
                dMin = 0;
            }else{
                dMax = 0;
            }
        }

        // CvK:  added to set bounds
        var bound = parseFloat(options.orthoFixedMin);
        if(!isNaN(bound)){
            dMin = bound;
        }
        
        bound = parseFloat(options.orthoFixedMax);
        if(!isNaN(bound)){
            dMax = bound;
        }

        // Adding a small offset to the scale's dMin. and dMax.,
        //  as long as they are not 0 and originIsZero=true.
        // DCL: 'axisOffset' is a percentage??
        var dOffset = (dMax - dMin) * options.axisOffset;
        dOffset = bypassOffset ? 0 : dOffset;
        
        var scale = new pv.Scale.linear(
                        dMin - (options.originIsZero && dMin == 0 ? 0 : dOffset),
                        dMax + (options.originIsZero && dMax == 0 ? 0 : dOffset));
        
        // Domain rounding
        pvc.roundScaleDomain(
                scale, 
                isX ? options.xAxisDomainRoundMode  : options.yAxisDomainRoundMode,
                isX ? options.xAxisDesiredTickCount : options.yAxisDesiredTickCount);
        
        // RANGE
        
        // NOTE: By the time this is evaluated,
        // axis panels have not yet been created,
        // but titles and legends already have been...
        var rSize = isX ? this.basePanel.width : this.basePanel.height;
        if(isX){
            var yAxisSize = bypassAxis ? 0 : options.yAxisSize,
                secondYAxisSize = bypassAxis ? 0 : options.secondAxisSize;
            if(options.yAxisPosition == "left"){
                scale.min = yAxisSize;
                scale.max = rSize - secondYAxisSize;
            } else {
                scale.min = secondYAxisSize;
                scale.max = rSize - yAxisSize;
            }

        } else {
            var xAxisSize = bypassAxis ? 0 : options.xAxisSize,
                secondXAxisSize = bypassAxis ? 0 : options.secondAxisSize;
            scale.min = 0;
            scale.max = rSize - xAxisSize - secondXAxisSize;
        }

        scale.range(scale.min, scale.max);
        
        return scale;
    },

    /**
     * Scale for the timeseries axis. xx if orientation is vertical, yy otherwise.
     */
    getTimeseriesScale: function(bypassAxis, bypassOffset){

        var options = this.options,
            isX = this.isOrientationVertical();
        
        // DOMAIN
        var categories = this.dataEngine.getVisibleCategories();
        
        // Adding a small offset to the scale's domain:
        var parser = pv.Format.date(options.timeSeriesFormat),
            dMin = parser.parse(categories[0]),
            dMax = parser.parse(categories[categories.length - 1]),
            dOffset = 0;
        
        if(!bypassOffset){
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
            var yAxisSize = bypassAxis ? 0 : options.yAxisSize,
                secondYAxisSize = bypassAxis ? 0 : options.secondAxisSize;
            if(options.yAxisPosition == "left"){
                scale.min = yAxisSize;
                scale.max = rSize - secondYAxisSize;
            } else {
                scale.min = secondYAxisSize;
                scale.max = rSize - yAxisSize;
            }
        } else {
            var xAxisSize = bypassAxis ? 0 : options.xAxisSize,
                secondXAxisSize = bypassAxis ? 0 : options.secondAxisSize;
            scale.min = 0;
            scale.max = rSize - xAxisSize - secondXAxisSize;
        }

        scale.range(scale.min , scale.max);
        
        return scale;
    },

    /**
     * Scale for the second linear axis. yy if orientation is vertical, xx otherwise.
     */
    // NOTE: bypassOffset is not implemented
    getSecondScale: function(bypassAxis, bypassOffset){

        var options = this.options;
        
        if(!options.secondAxis || !options.secondAxisIndependentScale){
            return this.getLinearScale(bypassAxis, bypassOffset);
        }
        
        // DOMAIN
        var dMax = this.dataEngine.getSecondAxisMax(),
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
        var yAxisSize = bypassAxis ? 0 : options.yAxisSize,
            xAxisSize = bypassAxis ? 0 : options.xAxisSize,
            isX = this.isOrientationHorizontal(),
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
        
        var scale = this.getTimeseriesScale(true,true);

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
        
        orthoFixedMin: null,
        orthoFixedMax: null,

        timeSeries: false,
        timeSeriesFormat: "%Y-%m-%d",

        // CvK  added extra parameter for implementation of HeatGrid
        orthoAxisOrdinal: false,
        // if orientation==vertical then perpendicular-axis is the y-axis
        //  else perpendicular-axis is the x-axis.

        useCompositeAxis: false,

        xAxisPosition: "bottom",
        xAxisSize: 50,
        xAxisFullGrid: false,
        xAxisEndLine:  false,
        xAxisDomainRoundMode: 'none',  // for linear scales
        xAxisDesiredTickCount: null,   // idem
        xAxisMinorTicks:  true,   // idem
        xAxisClickAction: null,
        xAxisDoubleClickAction: null,
        
        yAxisPosition: "left",
        yAxisSize: 50,
        yAxisFullGrid: false,
        yAxisEndLine:  false,
        yAxisDomainRoundMode: 'none',
        yAxisDesiredTickCount: null,
        yAxisMinorTicks:  true,
        yAxisClickAction: null,
        yAxisDoubleClickAction: null,

        secondAxisIndependentScale: false,
        secondAxisOriginIsZero: true,
        secondAxisOffset: 0,
        secondAxisColor: "blue",
        //secondAxisSize: 0, // calculated
        secondAxisDomainRoundMode: 'none',  // only with independent second scale
        secondAxisDesiredTickCount: null,   // idem
        secondAxisMinorTicks: true,
        
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
        customTooltip: null, // function(s,c,d) -> tooltip text
        tipsySettings: {
            gravity: "s",
            fade: true
        }
    }
});