
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
        $.extend(this.options, pvc.CategoricalAbstract.defaultOptions, options);

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
            this.options.secondAxisSize = this.isOrientationVertical()? 
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
    	var o = this.options;
        if (o.showXScale){
            this.xAxisPanel = new pvc.XAxisPanel(this, {
                ordinal: this.isXAxisOrdinal(),
                showAllTimeseries: false,
                anchor: o.xAxisPosition,
                axisSize: o.xAxisSize,
                fullGrid:  o.xAxisFullGrid,
                endLine: o.xAxisEndLine,
                domainRoundMode:  o.xAxisDomainRoundMode,
                desiredTickCount: o.xAxisDesiredTickCount,
                minorTicks:  o.xAxisMinorTicks,
                ordinalElements: this.getAxisOrdinalElements("x"),
                
                clickAction: o.xAxisClickAction,
                useCompositeAxis: o.useCompositeAxis, 
                font: o.axisLabelFont,
                
                doubleClickAction: o.xAxisDoubleClickAction,
                clickDelay: o.axisClickDelay,
                getLabel: o.xAxisGetLabel
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
    	var o = this.options;
        if (o.showYScale){
            this.yAxisPanel = new pvc.YAxisPanel(this, {
                ordinal: this.isYAxisOrdinal(),
                showAllTimeseries: false,
                anchor:   o.yAxisPosition,
                axisSize: o.yAxisSize,
                fullGrid: o.yAxisFullGrid,
                endLine:  o.yAxisEndLine,
                domainRoundMode:  o.yAxisDomainRoundMode,
                desiredTickCount: o.yAxisDesiredTickCount,
                minorTicks:       o.yAxisMinorTicks,
                ordinalElements: this.getAxisOrdinalElements("y"),
                useCompositeAxis: o.useCompositeAxis, 
                font: o.axisLabelFont,
                clickAction:       o.yAxisClickAction,
                doubleClickAction: o.yAxisDoubleClickAction,
                clickDelay:        o.axisClickDelay,
                getLabel: o.yAxisGetLabel
            });

            this.yAxisPanel.setScale(this.yScale);
            this.yAxisPanel.appendTo(this.basePanel); // Add it
        }
    },

    /**
     * Generates the second axis for X, if exists and only for horizontal charts.
     */
    generateSecondXAxis: function(){
    	var o = this.options;
        if(o.secondAxisIndependentScale && this.isOrientationHorizontal()){
           
            this.secondXAxisPanel = new pvc.SecondXAxisPanel(this, {
                ordinal: this.isXAxisOrdinal(),
                showAllTimeseries: false,
                anchor: pvc.BasePanel.oppositeAnchor[o.xAxisPosition],
                axisSize: o.secondAxisSize,
                domainRoundMode:  o.secondAxisDomainRoundMode,
                desiredTickCount: o.secondAxisDesiredTickCount,
                minorTicks:       o.secondAxisMinorTicks,

                ordinalElements: this.getAxisOrdinalElements("x"),
                tickColor: o.secondAxisColor
            });

            this.secondXAxisPanel.setScale(this.secondScale);
            this.secondXAxisPanel.appendTo(this.basePanel); // Add it
        }
    },

    /**
     * Generates the second axis for Y, if exists and only for vertical charts.
     */
    generateSecondYAxis: function(){
    	var o = this.options;
        if(o.secondAxisIndependentScale && this.isOrientationVertical()){

            this.secondYAxisPanel = new pvc.SecondYAxisPanel(this, {
                ordinal: this.isYAxisOrdinal(),
                showAllTimeseries: false,
                anchor: pvc.BasePanel.oppositeAnchor[o.yAxisPosition],
                axisSize: o.secondAxisSize,
                domainRoundMode:  o.secondAxisDomainRoundMode,
                desiredTickCount: o.secondAxisDesiredTickCount,
                minorTicks:       o.secondAxisMinorTicks,

                ordinalElements: this.getAxisOrdinalElements("y"),
                tickColor: o.secondAxisColor
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
     *  List of elements to use in the axis ordinal.
     */
    getAxisOrdinalElements: function(axis){
        var onSeries = false;

        // onSeries can only be true if the perpendicular axis is ordinal
        if (this.options.orthoAxisOrdinal) {
            // (X && !V) || (!X && V)
            var isVertical = this.isOrientationVertical();
            onSeries = (axis == "x") ? !isVertical : isVertical;
        }

        return onSeries? 
          this.dataEngine.getVisibleSeries() : 
          this.dataEngine.getVisibleCategories();
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

        var o = this.options,
            yAxisSize = bypassAxis ? 0 : o.yAxisSize,
            xAxisSize = bypassAxis ? 0 : o.xAxisSize;
        
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
                var secondYAxisSize = bypassAxis ? 0 : o.secondAxisSize;
                if(o.yAxisPosition == "left"){
                    scale.min = yAxisSize;
                    scale.max = rSize - secondYAxisSize;
                } else {
                    scale.min = secondYAxisSize;
                    scale.max = rSize - yAxisSize;
                }
            } else {
                var secondXAxisSize = bypassAxis ? 0 : o.secondAxisSize;
                scale.min = 0;
                scale.max = rSize - xAxisSize - secondXAxisSize;
            }
        }  // end else-part -- if (orthoAxis)

        var panelSizeRatio = o.panelSizeRatio;
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

        var o   = this.options,
            isX = this.isOrientationHorizontal(),
            dMin, // Domain
            dMax;
        
        // DOMAIN
        if(o.stacked){
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
            dMin = dMin !== 0 ? dMin * 0.99 : o.originIsZero ? 0 : -0.1;
            dMax = dMax !== 0 ? dMax * 1.01 : 0.1;
        }
        
        /* Both negative or both positive */
        if(dMin * dMax > 0 && o.originIsZero){
            if(dMin > 0){
                dMin = 0;
            }else{
                dMax = 0;
            }
        }

        // CvK:  added to set bounds
        var bound = parseFloat(o.orthoFixedMin);
        if(!isNaN(bound)){
            dMin = bound;
        }
        
        bound = parseFloat(o.orthoFixedMax);
        if(!isNaN(bound)){
            dMax = bound;
        }

        // Adding a small offset to the scale's dMin. and dMax.,
        //  as long as they are not 0 and originIsZero=true.
        // DCL: 'axisOffset' is a percentage??
        var dOffset = (dMax - dMin) * o.axisOffset;
        dOffset = bypassOffset ? 0 : dOffset;
        
        var scale = new pv.Scale.linear(
                        dMin - (o.originIsZero && dMin == 0 ? 0 : dOffset),
                        dMax + (o.originIsZero && dMax == 0 ? 0 : dOffset));
        
        // Domain rounding
        pvc.roundScaleDomain(
                scale, 
                isX ? o.xAxisDomainRoundMode  : o.yAxisDomainRoundMode,
                isX ? o.xAxisDesiredTickCount : o.yAxisDesiredTickCount);
        
        // RANGE
        
        // NOTE: By the time this is evaluated,
        // axis panels have not yet been created,
        // but titles and legends already have been...
        var rSize = isX ? this.basePanel.width : this.basePanel.height;
        if(isX){
            var yAxisSize = bypassAxis ? 0 : o.yAxisSize,
                secondYAxisSize = bypassAxis ? 0 : o.secondAxisSize;
            if(o.yAxisPosition == "left"){
                scale.min = yAxisSize;
                scale.max = rSize - secondYAxisSize;
            } else {
                scale.min = secondYAxisSize;
                scale.max = rSize - yAxisSize;
            }

        } else {
            var xAxisSize = bypassAxis ? 0 : o.xAxisSize,
                secondXAxisSize = bypassAxis ? 0 : o.secondAxisSize;
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

        var o = this.options,
            isX = this.isOrientationVertical();
        
        // DOMAIN
        var categories = this.dataEngine.getVisibleCategories();
        
        // Adding a small offset to the scale's domain:
        var parser = pv.Format.date(o.timeSeriesFormat),
            dMin = parser.parse(categories[0]),
            dMax = parser.parse(categories[categories.length - 1]),
            dOffset = 0;
        
        if(!bypassOffset){
            dOffset = (dMax.getTime() - dMin.getTime()) * o.axisOffset;
        }

        var scale = new pv.Scale.linear(
                                new Date(dMin.getTime() - dOffset),
                                new Date(dMax.getTime() + dOffset));

        // Domain rounding
        // TODO: pvc.scaleTicks(scale) does not like Dates...
        pvc.roundScaleDomain(
                scale, 
                isX ? o.xAxisDomainRoundMode  : o.yAxisDomainRoundMode,
                isX ? o.xAxisDesiredTickCount : o.yAxisDesiredTickCount);
        
        // RANGE
        var rSize = isX ? this.basePanel.width : this.basePanel.height;
        
        if(isX){
            var yAxisSize = bypassAxis ? 0 : o.yAxisSize,
                secondYAxisSize = bypassAxis ? 0 : o.secondAxisSize;
            if(o.yAxisPosition == "left"){
                scale.min = yAxisSize;
                scale.max = rSize - secondYAxisSize;
            } else {
                scale.min = secondYAxisSize;
                scale.max = rSize - yAxisSize;
            }
        } else {
            var xAxisSize = bypassAxis ? 0 : o.xAxisSize,
                secondXAxisSize = bypassAxis ? 0 : o.secondAxisSize;
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

        var o = this.options;
        
        if(!o.secondAxis || !o.secondAxisIndependentScale){
            return this.getLinearScale(bypassAxis, bypassOffset);
        }
        
        // DOMAIN
        var dMax = this.dataEngine.getSecondAxisMax(),
            dMin = this.dataEngine.getSecondAxisMin();

        if(dMin * dMax > 0 && o.secondAxisOriginIsZero){
            if(dMin > 0){
                dMin = 0;
            } else {
                dMax = 0;
            }
        }

        // Adding a small offset to the scale's domain:
        var dOffset = (dMax - dMin) * o.secondAxisOffset,
            scale = new pv.Scale.linear(
                        dMin - (o.secondAxisOriginIsZero && dMin == 0 ? 0 : dOffset),
                        dMax + (o.secondAxisOriginIsZero && dMax == 0 ? 0 : dOffset));

        // Domain rounding
        pvc.roundScaleDomain(scale, o.secondAxisRoundDomain, o.secondAxisDesiredTickCount);
                
        // RANGE
        var yAxisSize = bypassAxis ? 0 : o.yAxisSize,
            xAxisSize = bypassAxis ? 0 : o.xAxisSize,
            isX = this.isOrientationHorizontal(),
            rSize = isX ? this.basePanel.width : this.basePanel.height;
                
        if(isX){
            if(o.yAxisPosition == "left"){
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
        showAllTimeseries: false, // meaningless here
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

        xAxisPosition: "bottom",
        xAxisSize: 50,
        xAxisFullGrid: false,
        xAxisEndLine:  false,
        xAxisDomainRoundMode: 'none',  // for linear scales
        xAxisDesiredTickCount: null,   // idem
        xAxisMinorTicks:  true,   // idem
        
        yAxisPosition: "left",
        yAxisSize: 50,
        yAxisFullGrid: false,
        yAxisEndLine:  false,
        yAxisDomainRoundMode: 'none',
        yAxisDesiredTickCount: null,
        yAxisMinorTicks:  true,
        
        secondAxis: false,
        secondAxisIdx: -1,
        secondAxisIndependentScale: false,
        secondAxisOriginIsZero: true,
        secondAxisOffset: 0,
        secondAxisColor: "blue",
        //secondAxisSize: 0, // calculated
        secondAxisDomainRoundMode: 'none',  // only with independent second scale
        secondAxisDesiredTickCount: null,   // idem
        secondAxisMinorTicks: true,
        
        panelSizeRatio: 0.9,
        
        // Clicking
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
        showTooltips: true,

        orientation: "vertical",
        
        tipsySettings: {
            gravity: "s",
            fade: true
        }
    }
});


pvc.CategoricalAbstractPanel = pvc.BasePanel.extend({

    orientation: "vertical",

    constructor: function(chart, options){

        // Shared state between _handleClick and _handleDoubleClick
        this._ignoreClicks = 0;

        this.base(chart, options);
    },

    /*
     * @override
     */
    create: function(){
        // Occupy all space available in the parent panel
        this.setSize(this._parent.width, this._parent.height);

        // Create the this.pvPanel
        this.base();

        // Send the panel behind the axis, title and legend, panels
        this.pvPanel.zOrder(-10);

        // Overflow
        var options = this.chart.options;
        if ((options.orthoFixedMin != null) || (options.orthoFixedMax != null)){
            this.pvPanel["overflow"]("hidden");
        }
        
        // Create something usefull...
        this.createCore();
        
        if (pv.renderer() !== 'batik'){
            this._createSelectionOverlay(this.width, this.height);
        }
    },

    /**
     * Override to create marks specific to a given chart.
     * @virtual 
     */
    createCore: function(){
        // NOOP
    },
    
    /**
     * @override
     */
    applyExtensions: function(){
        this.base();

        // Extend body
        this.extend(this.pvPanel, "chart_");
    },
    
    /* @override */
    isOrientationVertical: function(){
        return this.orientation == "vertical";
    },

    /* @override */
    isOrientationHorizontal: function(){
        return this.orientation == "horizontal";
    },

    /**
     * Override to detect the datum that is being rendered.
     * Called during PV rendering, from within property functions.
     * This should only be called on places where it is possible,
     * through the indexes of current PV mark to 'guess' an
     * associated datum.
     * @virtual
     */
    _getRenderingDatum: function(mark){
        return null;
    },

    // ----------------------------
    // Click / Double-click

    _handleDoubleClick: function(mark, d, ev){
        var action = this.chart.options.doubleClickAction;
        if(action){
            var datum = this._getRenderingDatum(mark);
            if(datum){
                var s = datum.keyValues.series,
                    c = datum.keyValues.categories;

                this._ignoreClicks = 2;

                action.call(mark, s, c, d, ev, datum);
            }
        }
    },

    _handleClick: function(mark, d, ev){
        var options = this.chart.options;
        if(!options.clickable){
            return;
        }

        // Selection
        var datum = this._getRenderingDatum(mark);
        if(datum){
            if(!options.doubleClickAction){
                this._handleClickCore(mark, datum, d, ev);
            } else {
                // Delay click evaluation so that
                // it may be canceled if double click meanwhile
                // fires.
                var myself = this;
                window.setTimeout(
                    function(){
                        myself._handleClickCore.call(myself, mark, datum, d, ev);
                    },
                    options.doubleClickMaxDelay || 300);

            }
        }
    },

    _handleClickCore: function(mark, datum, d, ev){
        if(this._ignoreClicks) {
            this._ignoreClicks--;
            return;
        }

        // Classic clickAction
        var action = this.chart.options.clickAction;
        if(action){
            // TODO: first value of a multi-valued datum?????
            if(d != null && d[0] !== undefined){
                d = d[0];
            }

            var s = datum.keyValues.series,
                c = datum.keyValues.categories;

            action.call(mark, s, c, d, ev, datum);
        }

        // Selection
        if(this.chart.options.ctrlSelectMode && !ev.ctrlKey){
            // hard select
            datum.engine.clearSelections();
            datum.setSelected(true);
        } else {
            datum.toggleSelected();
        }

        this._handleSelectionChanged();
    },

    _handleSelectionChanged: function(){
        this._renderSelectableMarks();

        // Fire action
        var action = this.chart.options.selectionChangedAction;
        if(action){
            var selections = this.chart.dataEngine.getSelections();

            action.call(null, selections);
        }
    },
    
    /**
     * The default implementation renders this.pvPanel,
     * which is generally in excess of what actually requires
     * to be re-rendered.
     *
     * Override to render a more specific set of marks.
     * @virtual
     */
    _renderSelectableMarks: function(){
        this.pvPanel.render();
    },

    /**
     * Add rubberband functionality to main panel (includes axis).
     * Override to prevent rubber band selection.
     * @virtual
     **/
    _createSelectionOverlay: function(w, h){
        //TODO: flip support: parallelLength etc..

        var myself = this,
            isHorizontal = this.isOrientationHorizontal(),
            chart = this.chart,
            opts  = chart.options,
            dataEngine = chart.dataEngine,
            titlePanel = chart.titlePanel,
            xAxisPanel = chart.xAxisPanel,
            yAxisPanel = chart.yAxisPanel;

        this.rubberBand = {x: 0, y: 0, dx: 4, dy: 4};

        if(isHorizontal){
            // switch back w, h
            var tmp = w;
            w = h;
            h = tmp;
        }

        var dMin = 10;// Math.min(w, h) / 2;

        var isSelecting = false;
        var checkSelections = false;

        // Helper
        // Sets all positions to 0 except the specified one
        var positions = ['top', 'left', 'bottom', 'right'];
        function setPositions(position, value){
            var obj = {};
            for(var i = 0; i < positions.length ; i++){
                obj[positions[i]] = (positions[i] == position) ? value : 0;
            }
            return obj;
        }

        // Callback to handle end of rubber band selection
        function dispatchRubberBandSelection(rb, ev){
            // Get offsets
            var titleOffset;
            if(titlePanel != null){
                titleOffset = setPositions(opts.titlePosition, titlePanel.titleSize);
            } else {
                titleOffset = setPositions();
            }

            var xAxisOffset = setPositions(opts.xAxisPosition, xAxisPanel.height),
                yAxisOffset = setPositions(opts.yAxisPosition, yAxisPanel.width);

            var y = 0,
                x = 0;

            // Rubber band selects over any of the axes?
            var xSelections = [],
                ySelections = [];

            if(opts.useCompositeAxis){
                //1) x axis
                x = rb.x - titleOffset['left'] - yAxisOffset['left'];
                y = rb.y - titleOffset['top'];

                if(opts.xAxisPosition === 'bottom'){//chart
                    y -= myself.height;
                }

                xSelections = xAxisPanel.getAreaSelections(x, y, rb.dx, rb.dy);

                //2) y axis
                x = rb.x - titleOffset['left'];
                y = rb.y - titleOffset['top'] - xAxisOffset['top'];

                if(opts.yAxisPosition === 'right'){//chart
                    x -= myself.width;
                }

                ySelections = yAxisPanel.getAreaSelections(x, y, rb.dx, rb.dy);
            }

            var cSelections = isHorizontal ? ySelections : xSelections,
                sSelections = isHorizontal ? xSelections : ySelections;

            if(opts.ctrlSelectMode && !ev.ctrlKey){
                dataEngine.clearSelections();
            }

            var selectedData,
                toggle = false;

            // Rubber band selects on both axes?
            if(ySelections.length > 0 && xSelections.length > 0){
                // Select the INTERSECTION
                selectedData = dataEngine.getWhere([
                    {series: sSelections, /* AND */ categories: cSelections}
                ]);
                
            } else if (ySelections.length > 0 || xSelections.length > 0){
                // Select the UNION
                toggle = true;

                selectedData = dataEngine.getWhere([
                    {series: sSelections}, // OR
                    {categories: cSelections}
                ]);

            } else {
                //if there are label selections, they already include any chart selections
                //3) Chart: translate coordinates (drawn bottom-up)
                //first get offsets
                y = rb.y - titleOffset['top' ] - xAxisOffset['top' ];
                x = rb.x - titleOffset['left'] - yAxisOffset['left'];

                //top->bottom
                y = myself.height - y - rb.dy;
				
				// Keep rubber band screen coordinates
                rb.x0 = rb.x;
                rb.y0 = rb.y;

                rb.x = x;
                rb.y = y;

                selectedData = myself._collectRubberBandSelections();
            }

            if(selectedData){
                if(toggle){
                    dataEngine.toggleSelections(selectedData);
                } else {
                    dataEngine.setSelections(selectedData, true);
                }

                myself._handleSelectionChanged();
            }
        }

        // Rubber band
        var selectBar = this.selectBar = this.pvPanel.root//TODO
           .add(pv.Bar)
                .visible(function() { return isSelecting; } )
                .left(function(d) { return d.x; })
                .top(function(d) { return d.y;})
                .width(function(d) { return d.dx;})
                .height(function(d) { return d.dy;})
                .fillStyle(opts.rubberBandFill)
                .strokeStyle(opts.rubberBandLine);

        // Rubber band selection behavior definition
        if(!opts.extensionPoints ||
           !opts.extensionPoints.base_fillStyle){

            var invisibleFill = 'rgba(127,127,127,0.01)';
            this.pvPanel.root.fillStyle(invisibleFill);
        }

        this.pvPanel.root
            .data([myself.rubberBand])
            .event("click", function() {
                var ev = arguments[arguments.length-1];
                 if(opts.ctrlSelectMode && !ev.ctrlKey){
                    dataEngine.clearSelections();

                    myself._handleSelectionChanged();
                }
            })
            .event('mousedown', pv.Behavior.selector(false))
            .event('selectstart', function(){
                isSelecting = true;
            })
            .event('select', function(rb){

                myself.rubberBand = rb;

                if(isSelecting && (rb.dx > dMin || rb.dy > dMin)){
                    checkSelections = true;
                    selectBar.render();
                }
            })
            .event('selectend', function(rb, ev){
                if(isSelecting){
                    isSelecting = false;

                    if(checkSelections){
                        checkSelections = false;
                        selectBar.render();

                        dispatchRubberBandSelection(rb, ev);
                    }
                }
            });
    },

    /**
     * Should override to provide selection detection
     * for a specific chart type.
     *
     * Use _intersectsRubberBandSelection to check if a shape
     * is covered by the rubber band.
     *
     * Return a 'where' specification suitable for
     * dataEngine#getWhere.
     * @virtual
     */
    _collectRubberBandSelections: function(){
        return null;
    },

    /**
     * @protected
     */
    _intersectsRubberBandSelection: function(startX, startY, endX, endY){
        var rb = this.rubberBand;
        return rb &&
            ((startX >= rb.x && startX < rb.x + rb.dx) || (endX >= rb.x && endX < rb.x + rb.dx))
            &&
            ((startY >= rb.y && startY < rb.y + rb.dy) || (endY >= rb.y && endY < rb.y + rb.dy));
    },
	
	// Uses screen coordinates
    _intersectsRubberBandSelection0: function(begX, endX, begY, endY){
        var rb = this.rubberBand;
        return rb &&
                // Some intersection on X
               (rb.x0 + rb.dx > begX) &&
               (rb.x0         < endX) &&
               // Some intersection on Y
               (rb.y0 + rb.dy > begY) &&
               (rb.y0         < endY);
    },
	
    _forEachInstanceInRubberBand: function(mark, fun, ctx){
        var index = 0;
        mark.forEachInstances(function(instance, t){
            var begX = t.transformHPosition(instance.left),
                endX = begX + t.transformLength(instance.width  || 0),
                begY = t.transformVPosition(instance.top),
                endY = begY + t.transformLength(instance.height || 0);

//            pvc.log("data=" + instance.data +
//                    " position=[" + [begX, endX, begY, endY] +  "]" +
//                    " index=" + index);

            if (this._intersectsRubberBandSelection0(begX, endX, begY, endY)){
                fun.call(ctx, instance, index);
            }

            index++;
        }, this);
    }
});


/**
 * AxisPanel panel.
 */
pvc.AxisPanel = pvc.BasePanel.extend({

    _parent: null,
    
    pvRule:     null,
    pvTicks:    null,
    pvLabel:    null,
    pvRuleGrid: null,
    pvEndLine:  null,
    pvScale:    null,
    
    ordinal: false,
    anchor: "bottom",
    axisSize: 30,
    tickLength: 6,
    tickColor: "#aaa",
    panelName: "axis", // override
    scale: null,
    fullGrid: false,
    endLine:  false,
    
    // To be used in linear scales
    domainRoundMode: 'none',
    desiredTickCount: null,
    minorTicks:       true,
    
    ordinalElements: [], // To be used in ordinal scales
    clickAction: null,
    doubleClickAction: null,
    
    //constructor: function(chart, options){
    //    this.base(chart,options);
    //},
    
    create: function(){
        if (this.isAnchorTopOrBottom()){
            this.width  = this._parent.width;
            this.height = this.axisSize;
        } else {
            this.height = this._parent.height;
            this.width  = this.axisSize;
        }

        // Creates this.pvPanel
        this.base();
        
        // ??
        this.extend(this.pvScale, this.panelName + "Scale_");
        
        this.renderAxis();

        // Apply extension points
        this.extend(this.pvPanel,    this.panelName + "_"     );
        this.extend(this.pvRule,     this.panelName + "Rule_" );
        this.extend(this.pvTicks,    this.panelName + "Ticks_");
        this.extend(this.pvLabel,    this.panelName + "Label_");
        this.extend(this.pvRuleGrid, this.panelName + "Grid_" );
        
        if(this.pvEndLine){
            this.extend(this.pvEndLine, this.panelName + "EndLine_");
        }
        
        if(this.pvMinorTicks){
            this.extend(this.pvMinorTicks, this.panelName + "MinorTicks_");
        }
    },

    setScale: function(scale){
        this.pvScale = scale;
        this.scale = scale; // TODO: At least HeatGrid depends on this. Maybe Remove?
    },
    
    /**
     * Initializes a new layer panel.
     * @override
     */
    initLayerPanel: function(pvPanel, layer){
        if(layer === 'gridLines'){
            pvPanel.zOrder(-10);
        }
    },
    
    renderAxis: function(){
        // Z-Order
        // ==============
        // -10 - grid lines   (on 'gridLines' background panel)
        //   0 - content (specific chart types should render content on this zOrder)
        //  10 - end line     (on main foreground panel)
        //  20 - ticks        (on main foreground panel)
        //  30 - ruler (begin line) (on main foreground panel)
        //  40 - labels       (on main foreground panel)
        
        // Range
        var rMin  = this.pvScale.min,
            rMax  = this.pvScale.max,
            rSize = rMax - rMin;
        
        this.pvRule = this.pvPanel.add(pv.Rule)
        		.zOrder(30) // see pvc.js
                .strokeStyle('black')
                // ex: anchor = bottom
                [this.anchorOpposite()](0)     // top    (of the axis panel)
                [this.anchorLength()  ](rSize) // width  
                [this.anchorOrtho()   ](rMin); // left
                
        
        if(this.endLine){
            var anchorOrthoLength = this.anchorOrthoLength(),
                ruleLength = this._parent[anchorOrthoLength] - 
                             this[anchorOrthoLength];
            
        	this.pvEndLine = this.pvRule.add(pv.Rule)
                    .zOrder(10)
                    .visible(true) // break inheritance pvRule's visible property
                    .strokeStyle("#f0f0f0")
                    [this.anchorOpposite()](-ruleLength)
                    [this.anchorLength()  ](null)
                    [this.anchorOrtho()   ](rMax)
                    [anchorOrthoLength    ]( ruleLength);
        }
         
        if (this.ordinal){
            if(this.useCompositeAxis){
                this.renderCompositeOrdinalAxis();
            } else {
                this.renderOrdinalAxis();
            }
        } else {
            this.renderLinearAxis();
        }
    },
    
    renderOrdinalAxis: function(){

        var scale = this.pvScale,
            anchorOpposite    = this.anchorOpposite(),
            anchorLength      = this.anchorLength(),
            anchorOrtho       = this.anchorOrtho(),
            anchorOrthoLength = this.anchorOrthoLength(),
            ticks = this.ordinalElements;
        
        // Ordinal ticks correspond to ordinal datums.
        // Ordinal ticks are drawn at the center of each band,
        //  and not at the beginning, as in a linear axis.
        this.pvTicks = this.pvRule.add(pv.Rule)
        	.zOrder(20) // see pvc.js
            .data(ticks)
            //[anchorOpposite   ](0)
            [anchorLength     ](null)
            [anchorOrtho      ](function(d){
                return scale(d) + (scale.range().band / 2);
            })
            [anchorOrthoLength](this.tickLength)
            .strokeStyle('rgba(0,0,0,0)'); // Transparent by default, but extensible

        var align = this.isAnchorTopOrBottom() 
                    ? "center"
                    : (this.anchor == "left") ? "right" : "left";
        
        // All ordinal labels are relevant and must be visible
        this.pvLabel = this.pvTicks.anchor(this.anchor).add(pv.Label)
        	.zOrder(40) // see pvc.js
            .textAlign(align)
            //.textBaseline("middle")
            //.text(pv.identity)
            .font("9px sans-serif");
        
        if(this.fullGrid){
            // Grid rules are visible on all ticks,
            //  but on the first tick. 
            // The 1st tick is not shown.
            // The 2nd tick separates categ 1 from categ 2.
            // The Nth tick separates categ. N-1 from categ. N
            // No grid line is drawn at the end.
            var ruleLength = this._parent[anchorOrthoLength] - 
                             this[anchorOrthoLength];
            
            this.pvRuleGrid = this.getPvPanel('gridLines').add(pv.Rule)
                .extend(this.pvRule)
                .data(ticks)
                .strokeStyle("#f0f0f0")
                [anchorOpposite   ](-ruleLength)
                [anchorLength     ](null)
                [anchorOrtho      ](function(d){
                    return scale(d) - scale.range().margin / 2;
                })
                [anchorOrthoLength]( ruleLength)
                .visible(function(){ return (this.index > 0); });
        }
    },

    renderLinearAxis: function(){
        // NOTE: Includes time series, 
        // so "d" may be a number or a Date object...
        
        var scale  = this.pvScale,
            ticks  = pvc.scaleTicks(
                        scale, 
                        this.domainRoundMode === 'tick', 
                        this.desiredTickCount),
            anchorOpposite    = this.anchorOpposite(),    
            anchorLength      = this.anchorLength(),
            anchorOrtho       = this.anchorOrtho(),
            anchorOrthoLength = this.anchorOrthoLength(),
            tickStep = Math.abs(ticks[1] - ticks[0]); // ticks.length >= 2
                
        // (MAJOR) ticks
        var pvTicks = this.pvTicks = this.pvRule.add(pv.Rule)
            .zOrder(20)
            .data(ticks)
            // [anchorOpposite ](0) // Inherited from pvRule
            [anchorLength     ](null)
            [anchorOrtho      ](scale)
            [anchorOrthoLength](this.tickLength)
            .strokeStyle('black'); // control visibility through color or through .visible
        
        // MINOR ticks are between major scale ticks
        if(this.minorTicks){
            this.pvMinorTicks = this.pvTicks.add(pv.Rule)
                .zOrder(20) // not inherited
                //.data(ticks)  // ~ inherited
                //[anchorOpposite   ](0)   // Inherited from pvRule
                //[anchorLength     ](null)  // Inherited from pvTicks
                [anchorOrtho      ](function(d){ 
                    return scale((+d) + (tickStep / 2)); // NOTE: (+d) converts Dates to numbers, just like d.getTime()
                })
                [anchorOrthoLength](this.tickLength / 2)
                .visible(function(){
                    return (!pvTicks.scene || pvTicks.scene[this.index].visible) &&
                           (this.index < ticks.length - 1); 
                });
        }
        
        this.renderLinearAxisLabel(ticks);
        
        // Now do the full grids
        if(this.fullGrid){
            // Grid rules are visible (only) on MAJOR ticks,
            // except on the first tick.
            // When EndLine is active it is drawn above the last grid line.
            var ruleLength = this._parent[anchorOrthoLength] - 
                             this[anchorOrthoLength];
            
            this.pvRuleGrid = this.getPvPanel('gridLines').add(pv.Rule)
                .extend(this.pvRule)
            	.data(ticks)
                .strokeStyle("#f0f0f0")
                [anchorOpposite   ](-ruleLength)
                [anchorLength     ](null)
                [anchorOrtho      ](scale)
                [anchorOrthoLength]( ruleLength)
//                .visible(function(d){
//                    return (this.index > 0);
//                })
                ;
        }
    },
    
    renderLinearAxisLabel: function(ticks){
     // Labels are visible (only) on MAJOR ticks,
        // On first and last tick care is taken
        //  with their H/V alignment so that
        //  the label is not drawn of the chart.

        // Use this margin instead of textMargin, 
        // which affects all margins (left, right, top and bottom).
        // Exception is the small 0.5 textMargin set below....
        var labelAnchor = this.pvTicks.anchor(this.anchor)
                                .addMargin(this.anchorOpposite(), 2);
        
        var label = this.pvLabel = labelAnchor.add(pv.Label)
            .zOrder(40)
            .text(this.pvScale.tickFormat)
            .font("9px sans-serif")
            .textMargin(0.5) // Just enough for some labels not to be cut (vertical)
            .visible(true);
        
        // Label alignment
        var rootPanel = this.pvPanel.root;
        if(this.isAnchorTopOrBottom()){
            label.textAlign(function(){
                var absLeft;
                if(this.index === 0){
                    absLeft = label.toScreenTransform().transformHPosition(label.left());
                    if(absLeft <= 0){
                        return 'left'; // the "left" of the text is anchored to the tick's anchor
                    }
                } else if(this.index === ticks.length - 1) { 
                    absLeft = label.toScreenTransform().transformHPosition(label.left());
                    if(absLeft >= rootPanel.width()){
                        return 'right'; // the "right" of the text is anchored to the tick's anchor
                    }
                }
                return 'center';
            });
        } else {
            label.textBaseline(function(){
                var absTop;
                if(this.index === 0){
                    absTop = label.toScreenTransform().transformVPosition(label.top());
                    if(absTop >= rootPanel.height()){
                        return 'bottom'; // the "bottom" of the text is anchored to the tick's anchor
                    }
                } else if(this.index === ticks.length - 1) { 
                    absTop = label.toScreenTransform().transformVPosition(label.top());
                    if(absTop <= 0){
                        return 'top'; // the "top" of the text is anchored to the tick's anchor
                    }
                }
                
                return 'middle';
            });
        }
    },
    
/////////////////////////////////////////////////
    //begin: composite axis
    
    getElementsTree: function(elements){
        var tree = {};
       for(var i =0; i<elements.length; i++){
            var baseElem = elements[i][0];
            if(!tree[baseElem]){
                tree[baseElem] = elements[i].length == 1 ? 0 : {};
            }
            var currObj = tree[baseElem];
            for(var j=1;j<elements[i].length;j++){
                var elem = elements[i][j];
                if(!currObj[elem]){
                  currObj[elem] = (j == elements[i].length-1) ? 0 : {};
                }
                currObj = currObj[elem];
            }
        }
    },
    
    getLayoutSingleCluster: function(tree, orientation, maxDepth){
        
        var myself = this;

        var depthLength = this.axisSize;
        //displace to take out bogus-root
        var baseDisplacement = (1.0/++maxDepth)* depthLength;
        var margin = maxDepth > 2 ? ((1.0/12.0) * depthLength) : 0;//heuristic compensation
        baseDisplacement -= margin;
        
        var scaleFactor = maxDepth*1.0/ (maxDepth -1);
        var orthogonalLength = pvc.BasePanel.orthogonalLength[orientation];
        //var dlen = (orthogonalLength == 'width')? 'dx' : 'dy';
        
        var displacement = (orthogonalLength == 'width')?
                ((orientation == 'left')? [-baseDisplacement, 0] : [baseDisplacement, 0]) :
                ((orientation == 'top')?  [0, -baseDisplacement] : [0, baseDisplacement]);

        //store without compensation for lasso handling   
        this.axisDisplacement = displacement.slice(0);
        for(var i=0;i<this.axisDisplacement.length;i++){
            if(this.axisDisplacement[i] < 0 ){ this.axisDisplacement[i] -= margin ;}
            else if(this.axisDisplacement[i] > 0 ){ this.axisDisplacement[i] = 0 ;}
            this.axisDisplacement[i] *= scaleFactor;
        }
        
        this.pvRule.lineWidth(0).strokeStyle(null);
        var panel = this.pvRule
                        .add(pv.Panel)[orthogonalLength](depthLength)//.overflow('hidden')
                            .strokeStyle(null).lineWidth(0) //cropping panel
                        .add(pv.Panel)[orthogonalLength](depthLength * scaleFactor ).strokeStyle(null).lineWidth(0);// panel resized and shifted to make bogus root disappear
        panel.transform(pv.Transform.identity.translate(displacement[0], displacement[1]));
        
        //set full path and label
        var nodes = pv.dom(tree).root('').nodes().map(function(node){
            //path
            var path = [];
            path.push(node.nodeName);
            for(var pnode = node.parentNode; pnode != null; pnode = pnode.parentNode){
              path.push(pnode.nodeName);
            }
            node.nodePath = path.reverse().slice(1);
            //label
            if(typeof(myself.getLabel) == 'function' ){
                node.nodeLabel = myself.getLabel(node.nodeName);
            }
            else {
                node.nodeLabel = node.nodeName;
            }
            if(node.nodeLabel == undefined){
                node.nodeLabel = '';
            }
            
            return node;
        });
        
        //create with bogus-root;pv.Hierarchy must always have exactly one root and at least one element besides the root
        var layout = panel.add(pv.Layout.Cluster.Fill)
            .nodes(nodes)
            .orient(orientation)
            ;
            
        //keep node references for lasso selection
        this.storedNodes = nodes;
        
        return layout;
    },
    
    getBreadthCounters: function(elements){
       var breadthCounters = {};
       for(var i =0; i<elements.length; i++){
            var name = elements[i][0];
            if(!breadthCounters[name]){
                breadthCounters[name] = 1;
            }
            else {
                breadthCounters[name] = breadthCounters[name] + 1;
            }
        }
        return breadthCounters;
    },
    
    getAreaSelections: function(x, y, dx, dy){
        
        var selections = [];
        
        if(!this.useCompositeAxis){
            return selections;
        }
        
        x-= this.axisDisplacement[0];
        y-= this.axisDisplacement[1];
        
        var xf = x + dx,
            yf = y + dy;
            
        this.storedNodes[0].visitBefore(function(node, i){
            if(i > 0){
                var centerX = node.x + node.dx /2,
                    centerY = node.y + node.dy /2;
            
                if(x < centerX && centerX < xf && 
                   y < centerY && centerY < yf){
                    selections.push(node.nodePath);
                }
           }
        });
        
        // Remove selections following an ascendant selection
        var lastSelection = null;
        var compressedSelections = [];
        for(var i = 0 ; i < selections.length ; i++){
            var selection = selections[i];
            if(lastSelection == null || !pvc.arrayStartsWith(selection, lastSelection)){
                lastSelection = selection;
                compressedSelections.push(selection);
            }
        }
        
        return compressedSelections;
    },
    
    renderCompositeOrdinalAxis: function(){
        var myself = this;

        var axisDirection = (this.anchor == 'bottom' || this.anchor == 'top')?
            'h':
            'v';

        var elements = this.ordinalElements.slice(0);
        //TODO: extend this to work with chart.orientation?
        if(this.anchor == 'bottom' || this.anchor == 'left') {elements.reverse();}
        
        var isHierarchy = true;
        
        //build tree with elements
        var tree = {};
        var sectionNames = [];
        for(var i =0; i<elements.length; i++){
            if(typeof(elements[i]) == 'string'){
                isHierarchy = false;
                tree[elements[i]] = 0;
                sectionNames.push(elements[i]);
                continue;
            }
            var baseElem = elements[i][0];
            if(!tree[baseElem]){
                tree[baseElem] = elements[i].length == 1 ? 0 : {};
                sectionNames.push(baseElem);
            }
            var currObj = tree[baseElem];
            for(var j=1;j<elements[i].length;j++){
                var elem = elements[i][j];
                if(!currObj[elem]){
                  currObj[elem] = (j == elements[i].length-1) ? 0 : {};
                }
                currObj = currObj[elem];
            }
        }
        
        var tipsyGravity = 's';
        switch(this.anchor){
            case 'bottom':
                tipsyGravity = 's';
                break;
            case 'top':
                tipsyGravity = 'n';
                break;
            case 'left':
                tipsyGravity = 'w';
                break;
            case 'right':
                tipsyGravity = 'e';
                break;
        }
        
        var maxDepth =isHierarchy? pv.max(elements, function(col){
            //return $.isArray(col) ? col.length : 1;
            return (col != null && col[0] !== undefined) ? col.length : 1;
        }) : 1;
        
        var layout = this.getLayoutSingleCluster(tree, this.anchor, maxDepth);
    
        var diagDepthCutoff = 2; //depth in [-1/(n+1), 1]
        var vertDepthCutoff = 2;
        //see what will fit so we get consistent rotation
        layout.node
            .def("fitInfo", null)
            .height(function(d,e,f){//just iterate and get cutoff
                var fitInfo = myself.getFitInfo(d.dx, d.dy, d.nodeLabel, myself.font, diagMargin);
                if(!fitInfo.h){
                    
                    if(axisDirection == 'v' && fitInfo.v ){//prefer vertical
                        vertDepthCutoff = Math.min(diagDepthCutoff, d.depth);
                    }
                    else {
                        diagDepthCutoff = Math.min(diagDepthCutoff, d.depth);
                    }
                }
                this.fitInfo( fitInfo );
                return d.dy;
            }) ;
        
        //click / double click interaction
        var ignoreClicks = 0;
        var DBL_CLICK_MAX_DELAY = (this.clickDelay)? this.clickDelay : 300; //ms
        var clickAction = (typeof(this.clickAction) == 'function')?
            function(d, e){
                if(ignoreClicks) { ignoreClicks--; }
                else {
                    myself.clickAction(d, e);
                }
            } :
            null;
            
        var doubleClickAction = (typeof(this.doubleClickAction) == 'function')?
            function(d, e){
                ignoreClicks = 2;
                myself.doubleClickAction(d, e);
            } :
            null;
        
        //label space (left transparent)
        //var lblBar = 
        layout.node.add(pv.Bar)
            .fillStyle('rgba(127,127,127,.001)')
            .strokeStyle( function(d){
                if(d.maxDepth == 1 || d.maxDepth ==0 ) {return null;}
                else {return "rgba(127,127,127,0.3)";} //non-terminal items, so grouping is visible
            })
            .lineWidth( function(d){
                if(d.maxDepth == 1 || d.maxDepth ==0 ) { return 0; }
                else {return 0.5;} //non-terminal items, so grouping is visible
            })
            .text(function(d){
                return d.nodeLabel;
            });
        
        //cutoffs -> snap to vertical/horizontal
        var H_CUTOFF_ANG = 0.30;
        var V_CUTOFF_ANG = 1.27;
        //var V_CUTOFF_RATIO = 0.8;
        var diagMargin = this.getFontSize(this.font) / 2;
        
        var align = this.isAnchorTopOrBottom()? 
            "center"
            : (this.anchor == "left") ? "right" : "left";
        
        //draw labels and make them fit
        this.pvLabel = layout.label.add(pv.Label)
            .def('lblDirection','h')
            .textAngle(function(d)
            {
                var fitInfo = this.fitInfo();
                
                if(d.depth >= vertDepthCutoff && d.depth < diagDepthCutoff){
                        this.lblDirection('v');
                        return -Math.PI/2;
                }
                if(d.depth >= diagDepthCutoff)
                {
                    
                    var tan = d.dy/d.dx;
                    var angle = Math.atan(tan);
                    //var hip = Math.sqrt(d.dy*d.dy + d.dx*d.dx);
                    
                    if(angle > V_CUTOFF_ANG)
                    {
                        this.lblDirection('v');
                        return -Math.PI/2;
                    }
                    else if(angle > H_CUTOFF_ANG) {
                        this.lblDirection('d');
                        return -angle;
                    }
                }
                this.lblDirection('h');
                return 0;//horizontal
            })
            .textMargin(1)
            //override central alignment for horizontal text in vertical axis
            .textAlign(function(d){
                return (axisDirection != 'v' || d.depth >= vertDepthCutoff || d.depth >= diagDepthCutoff)? 'center' : align;
            })
            .left(function(d) {
                return (axisDirection != 'v' || d.depth >= vertDepthCutoff || d.depth >= diagDepthCutoff)?
                     d.x + d.dx/2 :
                     ((align == 'right')? d.x + d.dx : d.x);
            })
            .font(myself.font)
            .text(function(d){
                var fitInfo = this.fitInfo();
                switch(this.lblDirection()){
                    case 'h':
                        if(!fitInfo.h){//TODO: fallback option for no svg
                            return myself.trimToWidth(d.dx, d.nodeLabel, myself.font, '..');
                        }
                        break;
                    case 'v':
                        if(!fitInfo.v){
                            return myself.trimToWidth(d.dy, d.nodeLabel, myself.font, '..');
                        }
                        break;
                    case 'd':
                       if(!fitInfo.d){
                          //var ang = Math.atan(d.dy/d.dx);
                          var diagonalLength = Math.sqrt(d.dy*d.dy + d.dx*d.dx) ;
                          return myself.trimToWidth(diagonalLength-diagMargin,d.nodeLabel, myself.font,'..');
                        }
                        break;
                }
                return d.nodeLabel ;
            })
            .cursor( myself.clickAction? 'pointer' : 'default')
            .events('all')//labels don't have events by default
            .event('click', function(d){
                var e = arguments[arguments.length-1];
                if(clickAction){
                    if(doubleClickAction){
                        //arg has to be passed in closure in order to work with ie
                        window.setTimeout(function(){ clickAction(d.nodePath, e); }, DBL_CLICK_MAX_DELAY);
                       // window.setTimeout(clickAction, DBL_CLICK_MAX_DELAY, d.nodePath);
                    }
                    else { clickAction(d.nodePath, e); }
                }
            });

            //tooltip
            this.pvLabel
                //.def('tooltip', '')
                .title(function(d){
                    this.instance()['tooltip'] = d.nodeLabel;
                    return '';
                })
                .event("mouseover", pv.Behavior.tipsy({//Tooltip
                    gravity: tipsyGravity,
                    fade: true,
                    offset: diagMargin * 2,
                    opacity:1
                }));

           // double click label //TODO: need doubleclick axis action + single click prevention..
            if(doubleClickAction){
                this.pvLabel.event("dblclick", function(d){
                    doubleClickAction(d.nodePath, arguments[arguments.length-1]);
                });
            }

    },
    
    getTextSizePlaceholder : function()
    {
        var TEXT_SIZE_PHOLDER_APPEND='_textSizeHtmlObj';
        if(!this.textSizeTestHolder || this.textSizeTestHolder.parent().length == 0)
        {
            var chartHolder = $('#' + this.chart.options.canvas);
            var textSizeTestHolderId = chartHolder.attr('id') + TEXT_SIZE_PHOLDER_APPEND;
            this.textSizeTestHolder = $('#' + this.chart.options.canvas + ' #' + textSizeTestHolderId);
            if(this.textSizeTestHolder.length == 0)
            {
                this.textSizeTestHolder = $('<div>')
                    .attr('id', textSizeTestHolderId)
                    .css('position', 'absolute')
                    .css('visibility', 'hidden')
                    .css('width', 'auto')
                    .css('height', 'auto');
                chartHolder.append(this.textSizeTestHolder);
            }
        }
        return this.textSizeTestHolder;
    },

    getTextSizePvLabel: function(text, font)
    {
        if(!this.textSizePvLabel || this.textSizeLabelFont != font){
            var holder = this.getTextSizePlaceholder();
            var holderId = holder.attr('id');
            var panel = new pv.Panel();
            panel.canvas(holderId);
            var lbl = panel.add(pv.Label).text(text);
            if(font){
                lbl.font(font);
            }
            panel.render();
            this.textSizePvLabel = $('#' + holderId + ' text');
            this.textSizeLabelFont = font;
        }
        else {
            this.textSizePvLabel.text(text);
        }
        
        return this.textSizePvLabel[0];
    },
    
    getTextLength: function(text, font){
        
        switch(pv.renderer()){            
            case 'vml':
                return this.getTextLenVML(text, font);
            case 'batik':
                return getTextLenCGG(text, font);
            case 'svg':
            default:
                return this.getTextLenSVG(text, font);
        }
      //  
      //return (pv.renderer() != 'vml')?//TODO: support svgweb? defaulting to svg
      //  this.getTextLenSVG(text, font) :
      //  this.getTextLenVML(text, font) ;
    },
    
    getTextLenSVG: function(text, font){
        var lbl = this.getTextSizePvLabel(text, font);
        var box = lbl.getBBox();
        return box.width;
    },
    
    getTextLenVML: function(text, font){
        return pv.Vml.text_dims(text, font).width;
    },
    
    //TODO: if not in px?..
    getFontSize: function(font){
        if(pv.renderer() == 'batik'){
            var sty = document.createElementNS('http://www.w3.org/2000/svg','text').style;
            sty.setProperty('font',font);
            return parseInt(sty.getProperty('font-size'));
        }
        else {
            var holder = this.getTextSizePlaceholder();
            holder.css('font', font);
            return parseInt(holder.css('font-size'));//.slice(0,-2);
        }
    },
    
    getFitInfo: function(w, h, text, font, diagMargin)
    {    
        if(text == '') return {h:true, v:true, d:true};
        var len = this.getTextLength(text, font);
        
        var fitInfo =
        {
            h: len <= w,
            v: len <= h,
            d: len <= Math.sqrt(w*w + h*h) - diagMargin
        };
        return fitInfo;
    },
    
    trimToWidth: function(len,text,font,trimTerminator){
      if(text == '') return text;
      var textLen = this.getTextLength(text, font);
      
      if(textLen <= len){
        return text;
      }
      
      if(textLen > len * 1.5){//cutoff for using other algorithm
        return this.trimToWidthBin(len,text,font,trimTerminator);
      }
      
      while(textLen > len){
        text = text.slice(0,text.length -1);
        textLen = this.getTextLength(text, font);
      }
      return text + trimTerminator;
    },
    
    trimToWidthBin :function(len,text,font,trimTerminator){
        
        var high = text.length-2;
        var low = 0;
        var mid;
        var textLen;
        
        while(low <= high && high > 0){
            
            mid = Math.ceil((low + high)/2);
            //text = text.slice(0,mid);
            textLen = this.getTextLength(text.slice(0,mid), font);
            
            if(textLen > len){
                high = mid-1;
            }
            else {
                if( this.getTextLength(text.slice(0,mid+1), font) < len ){
                    low = mid+1;
                }
                else return text.slice(0,mid) + trimTerminator;
            }
            
        }
        
        return text.slice(0,high) + trimTerminator; 
    },
    
    //TODO: use for IE if non-svg option kept
    doesTextSizeFit: function(length, text, font){
        var MARGIN = 4;//TODO: hcoded
        var holder = this.getTextSizePlaceholder();
        holder.text(text);
        return holder.width() - MARGIN <= length;
    }
    
    // end: composite axis
    /////////////////////////////////////////////////
});

/*
 * XAxisPanel panel.
 *
 */
pvc.XAxisPanel = pvc.AxisPanel.extend({

    anchor: "bottom",
    panelName: "xAxis"

    //constructor: function(chart, options){
    //    this.base(chart,options);
    //}
});

/*
 * SecondXAxisPanel panel.
 *
 */
pvc.SecondXAxisPanel = pvc.XAxisPanel.extend({

    panelName: "secondXAxis"

    //constructor: function(chart, options){
    //    this.base(chart,options);
    //}
});


/*
 * YAxisPanel panel.
 *
 */
pvc.YAxisPanel = pvc.AxisPanel.extend({

    anchor: "left",
    panelName: "yAxis"

    //constructor: function(chart, options){
    //    this.base(chart,options);
    //}
});

/*
 * SecondYAxisPanel panel.
 *
 */
pvc.SecondYAxisPanel = pvc.YAxisPanel.extend({

    panelName: "secondYAxis"

    //constructor: function(chart, options){
    //    this.base(chart,options);
    //}
});
