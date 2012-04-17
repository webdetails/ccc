
/**
 * CategoricalAbstract is the base class for all categorical or timeseries
 */
pvc.CategoricalAbstract = pvc.TimeseriesAbstract.extend({

    _gridDockPanel: null,
    
    yAxisPanel : null,
    xAxisPanel : null,
    secondXAxisPanel: null,
    secondYAxisPanel: null,
    _mainContentPanel: null, // This will act as a holder for the specific panel

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

        if(!options.stacked){
            options.percentageNormalized = false;
        }
    },
    
    _initDataAndVisualRoles: function(){
        // Clear data related cache
        if(this._categSeriesVisibleData) {
            delete this._categSeriesVisibleData;
        }
        
        this.base();
    },
    
    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){
        
        this.base();
        
        this._addVisualRoles({
            series:   { isRequired: true, defaultDimensionName: 'series*'   },
            category: { isRequired: true, defaultDimensionName: 'category*' }
        });
    },
    
    _isSecondAxisVertical: function(){
        return this.isOrientationVertical();
    },

    _preRenderCore: function(){
        var options = this.options;

        pvc.log("Prerendering in CategoricalAbstract");
        
        /*
         * Create the grid/docking panel
         */
        this._gridDockPanel = new pvc.CategoricalGridDockingPanel(this, this.basePanel);
        
        /* Create child axis panels
         * The order is relevant because of docking. 
         */
        this.initSecondXAxis();
        this.initXAxis();
        this.initSecondYAxis();
        this.initYAxis();
        
        /* Create main content panel */
        this._mainContentPanel = this._createMainContentPanel(this._gridDockPanel);
        
        /* Force layout */
        this.basePanel.layout();
        
        /* Create scales */
        this.xScale = this.getXScale();
        this.yScale = this.getYScale();
        if(options.secondAxis){
            this.secondScale = this.getSecondScale();
        }

        /* Give scales to corresponding axes */
        this.secondXAxisPanel && this.secondXAxisPanel.setScale(this.secondScale);
        this.secondYAxisPanel && this.secondYAxisPanel.setScale(this.secondScale);
        this.xAxisPanel && this.xAxisPanel.setScale(this.xScale);
        this.yAxisPanel && this.yAxisPanel.setScale(this.yScale);
    },

    /* @abstract */
    _createMainContentPanel: function(parentPanel){
        throw new Error("Not implemented.");
    },

    /**
     * Initializes the X axis. It's in a separate function to allow overriding this value.
     */
    initXAxis: function(){
    	var options = this.options;
        if (options.showXScale){
            this.xAxisPanel = new pvc.XAxisPanel(this, this._gridDockPanel, {
                ordinal: this.isXAxisOrdinal(),
                showAllTimeseries: false,
                anchor: options.xAxisPosition,
                axisSize: options.xAxisSize,
                fullGrid:  options.xAxisFullGrid,
                endLine: options.xAxisEndLine,
                domainRoundMode:  options.xAxisDomainRoundMode,
                desiredTickCount: options.xAxisDesiredTickCount,
                minorTicks:  options.xAxisMinorTicks,
                ordinalRoleName: this._getAxisOrdinalRole('x'),
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
            this.yAxisPanel = new pvc.YAxisPanel(this, this._gridDockPanel, {
                ordinal: this.isYAxisOrdinal(),
                showAllTimeseries: false,
                anchor:   options.yAxisPosition,
                axisSize: options.yAxisSize,
                fullGrid: options.yAxisFullGrid,
                endLine:  options.yAxisEndLine,
                domainRoundMode:  options.yAxisDomainRoundMode,
                desiredTickCount: options.yAxisDesiredTickCount,
                minorTicks:       options.yAxisMinorTicks,
                ordinalRoleName: this._getAxisOrdinalRole('y'),
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
           
            this.secondXAxisPanel = new pvc.SecondXAxisPanel(this, this._gridDockPanel, {
                ordinal: this.isXAxisOrdinal(),
                showAllTimeseries: false,
                anchor: pvc.BasePanel.oppositeAnchor[options.xAxisPosition],
                axisSize: options.secondAxisSize,
                domainRoundMode:  options.secondAxisDomainRoundMode,
                desiredTickCount: options.secondAxisDesiredTickCount,
                minorTicks:       options.secondAxisMinorTicks,
                ordinalRoleName: this._getAxisOrdinalRole('x'),
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

            this.secondYAxisPanel = new pvc.SecondYAxisPanel(this, this._gridDockPanel, {
                ordinal: this.isYAxisOrdinal(),
                showAllTimeseries: false,
                anchor: pvc.BasePanel.oppositeAnchor[options.yAxisPosition],
                axisSize: options.secondAxisSize,
                domainRoundMode:  options.secondAxisDomainRoundMode,
                desiredTickCount: options.secondAxisDesiredTickCount,
                minorTicks:       options.secondAxisMinorTicks,
                ordinalRoleName: this._getAxisOrdinalRole('y'),
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
     *  The name of the role to use in an ordinal axis.
     */
    _getAxisOrdinalRole: function(axis){
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
     */
    getXScale: function(){
        if (this.isOrientationVertical()) {
            return this.options.timeSeries? 
                this.getTimeseriesScale() :
                this.getOrdinalScale();
        }

        return this.options.orthoAxisOrdinal ? 
            this.getOrdinalScale({orthoAxis: "x"}) :
            this.getLinearScale({bypassAxisOffset: true});
    },

    /**
     * yy scale for categorical charts.
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
    
    _getCategorySeriesVisibleData: function(){
        var data = this._categSeriesVisibleData;
        if(!data) {
            var catGrouping = this.visualRoles('category').grouping.singleLevelGrouping(),
                serGrouping = this.visualRoles('series'  ).grouping.singleLevelGrouping(),
                // One multi-dimensional, two-levels data grouping
                crossGrouping = pvc.data.GroupingSpec.multiple([catGrouping, serGrouping]);

            data = this.dataEngine.groupBy(crossGrouping, { visible: true });
            this._categSeriesVisibleData = data;
        }
        
        return data;
    },
    
    _getCategoriesMaxSumOfVisibleSeries: function(valueRoleName){
        var role = this.visualRoles(valueRoleName || 'value');
        if(!role.grouping.isSingleDimension) {
            pvc.log("[WARNING] A linear scale can only be obtained for a single dimension role.");
        }
        
        var valueDimName = role.firstDimensionName(),
            data = this._getCategorySeriesVisibleData();
        
        return data.children()
                   .select(function(catGroup){ return catGroup.dimensions(valueDimName).sum(); })
                   .max();
    },
    
    _getVisibleValueExtent: function(valueRoleName){
        var role = this.visualRoles(valueRoleName || 'value');
        if(!role.grouping.isSingleDimension) {
            pvc.log("[WARNING] A linear scale can only be obtained for a single dimension role.");
        }
        
        var valueDimName = role.firstDimensionName(),
            data = this._getCategorySeriesVisibleData();
        
        return data.leafs()
                   .select(function(serGroup){ 
                       return serGroup.dimensions(valueDimName).sum();
                    })
                   .range();
    },
    
    _getVisibleCategoryExtent: function(){
        var role = this.visualRoles('category');
        if(!role.grouping.isSingleDimension) {
            pvc.log("[WARNING] A linear scale can only be obtained for a single dimension role.");
        }
        
        var categDimName = role.firstDimensionName(),
            data = this._getCategorySeriesVisibleData();
        
        return data.children()
                .select(function(catGroup){ return catGroup.atoms[categDimName].value; })
                .range();
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
     *   orthoAxis: "y", "x" or null, default is null
     */
    getOrdinalScale: function(keyArgs){

        var orthoAxis = def.get(keyArgs, 'orthoAxis', null),
            options   = this.options;
        
        // DOMAIN
        var roleName = orthoAxis ? 'series' : 'category',
            data = this.visualRoleData(roleName, {singleLevelGrouping: true, visible: true}),
            leafKeys = data.leafs().select(function(leaf){ return leaf.absKey; }).array();
        
        var scale = new pv.Scale.ordinal(leafKeys);
        
        // RANGE
        var isX;
        if (orthoAxis) {   // added by CvK
            isX = (orthoAxis === 'x');
        } else {
            isX = this.isOrientationVertical();
        }
        
        scale.min = 0;
        scale.max = this._mainContentPanel[isX ? 'width' : 'height'];
        
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
     *   bypassAxisOffset:  boolean, default is false
     *   valueRole: string defaults to 'value' 
     */
    getLinearScale: function(keyArgs){

        var bypassAxisOffset = def.get(keyArgs, 'bypassAxisOffset', false),
            options   = this.options,
            isX = this.isOrientationHorizontal(),
            dMin, // Domain
            dMax,
            bound,
            lockedMin = true,
            lockedMax = true;
        
        var dExtent, // null when no data...
            hasExtent = false;
        function getExtent(){
            if(!hasExtent) {
                dExtent = this._getVisibleValueExtent(def.get(keyArgs, 'valueRole', 'value'));
            }
            return dExtent;
        }
        /* 
         * Note that in the following dMin and dMax calculations,
         * orthFixedMin and orthoFixedMax don't yet take into account if
         * stacked or percentageNormalized are set.
         * @see _processOptionsCore
         */
        
        // Min
        if(options.stacked) {
            // Includes percentageNormalized
            dMin = 0;
            lockedMin = false;
        } else {
            bound = parseFloat(options.orthoFixedMin);
            if(!isNaN(bound)){
                dMin = bound;
            } else {
                
                //dMin = this.dataEngine.getVisibleSeriesAbsoluteMin() || 0; // may be < 0 or undefined !
                dMin = getExtent.call(this) ? dExtent.min : 0;
                lockedMin = false;
            }
        }

        // Max
        if(options.percentageNormalized) {
            dMax = 100;
            lockedMax = false;
        } else {
            bound = parseFloat(options.orthoFixedMax);
            if(!isNaN(bound)){
                dMax = bound;
            } else if(options.stacked) {
                dMax = this._getCategoriesMaxSumOfVisibleSeries() || 0; // may be undefined !
                lockedMax = false;
            } else {
                dMax = getExtent.call(this) ? dExtent.max : 0;
                lockedMax = false;
            }
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

        var scale = new pv.Scale.linear(dMin, dMax);
        
        // Domain rounding
        // Must be done before applying offset
        pvc.roundScaleDomain(
                scale, 
                isX ? options.xAxisDomainRoundMode  : options.yAxisDomainRoundMode, 
                isX ? options.xAxisDesiredTickCount : options.yAxisDesiredTickCount);
        
        // Adding a small offset to the scale's dMin and dMax,
        //  as long as they are not 0 and originIsZero=true.
        // We update the domain but do not update the ticks cache.
        // The result is to show an area with no ticks in the expanded zones.
        if(!bypassAxisOffset &&
           options.axisOffset > 0 &&
           (!lockedMin || !lockedMax)){
            
            var domain = scale.domain();
            dMin = domain[0];
            dMax = domain[1];
            
            var dOffset = (dMax - dMin) * options.axisOffset;
            if(!lockedMin && !lockedMax){
                scale.domain(dMin - dOffset, dMax + dOffset);
            } else if(!lockedMin) {
                scale.domain(dMin - dOffset, dMax);
            } else {
                scale.domain(dMin, dMax + dOffset);
            }
        }
        
        // ----------------------------

        // RANGE
        scale.min = 0;
        scale.max = isX ? this._mainContentPanel.width : this._mainContentPanel.height;
        scale.range(scale.min, scale.max);
        
        return scale;
    },

    /**
     * Scale for the timeseries axis.
     * xx if orientation is vertical, yy otherwise.
     *
     * Keyword arguments:
     *   bypassAxisOffset: boolean, default is false
     */
    getTimeseriesScale: function(keyArgs){

        var bypassAxisOffset = def.get(keyArgs, 'bypassAxisOffset', false),
            options = this.options,
            isX = this.isOrientationVertical();
        
        // DOMAIN
        var dExtent = this._getVisibleCategoryExtent(); // null when no data...
        if(dExtent) {
            dMin = dExtent.min;
            dMax = dExtent.max;
            
            // Adding a small offset to the scale's domain:
            if(!bypassAxisOffset && options.axisOffset > 0){
                var dOffset = (dMax.getTime() - dMin.getTime()) * options.axisOffset;
                dMin = new Date(dMin.getTime() - dOffset);
                dMax = new Date(dMax.getTime() + dOffset);
            }
        } else {
            dMin = dMax = new Date();
        }
        
        if((dMax - dMin) === 0) {
            dMax = new Date(dMax.getTime() + 3600000); // 1 h
        }
        
        var scale = new pv.Scale.linear(dMin, dMax);

        // Domain rounding
        // TODO: pvc.scaleTicks(scale) does not like Dates...
        pvc.roundScaleDomain(
                scale, 
                isX ? options.xAxisDomainRoundMode  : options.yAxisDomainRoundMode,
                isX ? options.xAxisDesiredTickCount : options.yAxisDesiredTickCount);
        
        // RANGE
        scale.min = 0;
        scale.max = isX ? this._mainContentPanel.width : this._mainContentPanel.height;
        scale.range(scale.min , scale.max);
        
        return scale;
    },

    /**
     * Scale for the second linear axis. yy if orientation is vertical, xx otherwise.
     *
     * Keyword arguments:
     *   bypassAxisOffset: boolean, default is false (only implemented for not independent scale)
     */
    getSecondScale: function(keyArgs){

        var options = this.options;
        
        if(!options.secondAxis || !options.secondAxisIndependentScale){
            return this.getLinearScale(keyArgs);
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
        var isX = !this._isSecondAxisVertical();
        scale.min = 0;
        scale.max = isX ? this._mainContentPanel.width : this._mainContentPanel.height;
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
        
        var scale = this.getTimeseriesScale({ bypassAxisOffset: true });

        // Are we outside the allowed scale? 
        var d = pv.Format.date(this.options.timeSeriesFormat).parse(dateString);
        var dpos = scale( d );
        
        if( dpos < scale.range()[0] || dpos > scale.range()[1]){
            pvc.log("Event outside the allowed range, returning");
            return;
        }

        // Add the line

        var panel = this._mainContentPanel.pvPanel;
        var h = this.yScale.range()[1];

        // Detect where to place the horizontalAnchor
        //var anchor = o.horizontalAnchor;
        if( !o.forceHorizontalAnchor ){
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
            .visible(function(){
                return this.index == 0;
            });
    }
}, {
    defaultOptions: {
        showAllTimeseries: false,
        showXScale: true,
        showYScale: true,

        originIsZero: true,

        axisOffset: 0,
        axisLabelFont: '9px sans-serif',
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

        panelSizeRatio: 0.9
    }
});