
/**
 * CartesianAbstract is the base class for all 2D cartesian space charts.
 */
pvc.CartesianAbstract = pvc.TimeseriesAbstract.extend({
    _gridDockPanel: null,
    
    axes: null,
    axesPanels: null, 
    _seriesColorScale: null,
    
    yAxisPanel : null,
    xAxisPanel : null,
    secondXAxisPanel: null,
    secondYAxisPanel: null,
    
    _mainContentPanel: null, // This will act as a holder for the specific panel

    yScale: null,
    xScale: null,
    
    _axisRoleNameMap: null, 
    // example
//    {
//        'base':   'category',
//        'ortho':  'value'
//    },
    
    _visibleDataCache: null,
    
    constructor: function(options){
        
        this._axisRoleNameMap = {};
        this.axes = {};
        this.axesPanels = {};
        
        this.base(options);

        pvc.mergeDefaults(this.options, pvc.CartesianAbstract.defaultOptions, options);

        var parent = this.parent;
        if(parent) {
            this._serRole = parent._serRole;
            this._serGrouping = parent._serGrouping;
        }
    },
    
    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){
        
        this.base();
        
        this._addVisualRoles({
            series: { isRequired: true, defaultDimensionName: 'series*' }
        });

        // Cached
        this._serRole = this.visualRoles('series');
    },

    _bindVisualRoles: function(){
        this.base.apply(this, arguments);

        // Cached
        this._serGrouping = this._serRole.grouping.singleLevelGrouping();
    },

    _initData: function(){
        // Clear data related cache
        if(this._visibleDataCache) {
            delete this._visibleDataCache;
            delete this._seriesColorScale;
        }
        
        this.base.apply(this, arguments);

        // Cached
        this._serAxisData = this.dataEngine.groupBy(this._serGrouping, {visible: true});
    },

    seriesColorScale: function(){
        if(this.parent){
            return this.root.seriesColorScale();
        }

        if(!this._seriesColorScale){
            // visible or *invisible* data!!
            var serData = this.dataEngine.owner.groupBy(this._serGrouping),
                seriesValues = serData.children()
                                    .select(function(seriesData){ return seriesData.value; })
                                    .array();
            
            this._seriesColorScale = this.colors(seriesValues);
        }
        
        return this._seriesColorScale;
    },
    
    _preRenderCore: function(){
        var options = this.options;

        pvc.log("Prerendering in CartesianAbstract");
        
        /* Create the grid/docking panel */
        this._gridDockPanel = new pvc.CartesianGridDockingPanel(this, this.basePanel);
        
        /* Create axes */
        var baseAxis   = this._createAxis('base',  0),
            orthoAxis  = this._createAxis('ortho', 0),
            ortho2Axis = options.secondAxis ? this._createAxis('ortho', 1) : null;
        
        /* Create child axis panels
         * The order is relevant because of docking order. 
         */
        if(ortho2Axis) {
            this._createAxisPanel(ortho2Axis);
        }
        this._createAxisPanel(baseAxis );
        this._createAxisPanel(orthoAxis);
        
        /* Create main content panel */
        this._mainContentPanel = this._createMainContentPanel(this._gridDockPanel);
        
        /* Force layout */
        this.basePanel.layout();
        
        /* Create scales, after layout */
        this._createAxisScale(baseAxis );
        this._createAxisScale(orthoAxis);
        if(ortho2Axis){
            this._createAxisScale(ortho2Axis);
        }
    },
    
    /**
     * Creates a cartesian axis.
     * 
     * @param {string} type The type of the axis. One of the values: 'base' or 'ortho'.
     * @param {number} index The index of the axis within its type (0, 1, 2...).
     *
     * @type pvc.visual.CartesianAxis
     */
    _createAxis: function(axisType, axisIndex){ 
        var role = this.visualRoles(this._axisRoleNameMap[axisType]); // TODO: axis index?
        var axis = new pvc.visual.CartesianAxis(this, axisType, axisIndex, role);
        
        this.axes[axis.id] = axis;
        this.axes[axis.orientedId] = axis;
        
        return axis;
    },
    
    /**
     * Creates an axis panel, if it is visible.
     * @param {pvc.visual.CartesianAxis} axis The cartesian axis.
     * @type pvc.AxisPanel
     */
    _createAxisPanel: function(axis){
        if(axis.isVisible) {
            var panel = pvc.AxisPanel.create(this, this._gridDockPanel, axis, {
                useCompositeAxis:  axis.options('Composite'),
                font:              axis.options('LabelFont'),
                titleFont:         axis.options('TitleFont'),
                anchor:            axis.options('Position'),
                axisSize:          axis.options('Size'),
                fullGrid:          axis.options('FullGrid'),
                fullGridCrossesMargin: axis.options('FullGridCrossesMargin'),
                ruleCrossesMargin: axis.options('RuleCrossesMargin'),
                zeroLine:          axis.options('ZeroLine'),
                domainRoundMode:   axis.options('DomainRoundMode'),
                desiredTickCount:  axis.options('DesiredTickCount'),
                minorTicks:        axis.options('MinorTicks'),
                title:             axis.options('Title'),
                titleSize:         axis.options('TitleSize'),
                clickAction:       axis.options('ClickAction'),
                doubleClickAction: axis.options('DoubleClickAction')
            });
            
            this.axesPanels[axis.id] = panel;
            this.axesPanels[axis.orientedId] = panel;
            
            // Legacy fields
            if(axis.index <= 1) {
                this[axis.orientedId + 'AxisPanel'] = panel;
            }
            
            return panel;
        }
    },

    /* @abstract */
    _createMainContentPanel: function(parentPanel){
        throw def.error.notImplemented();
    },
    
    /**
     * Creates a scale for a given axis, assigns it to the axis
     * and assigns the scale to special v1 chart instance fields.
     * 
     * @param {pvc.visual.CartesianAxis} axis The axis.
     * @type pv.Scale
     */
    _createAxisScale: function(axis){
        var scale = this._createScaleByAxis(axis);
        axis.setScale(scale);
        
        /* V1 fields xScale, yScale, secondScale */
        if(axis.index == 0) {
            this[axis.orientation + 'Scale'] = scale;
        } else if(axis.index === 1 && axis.type === 'ortho') {
            this.secondScale = scale;
        }
        
        return scale;
    },
    
    /**
     * Creates a scale for a given axis.
     * 
     * @param {pvc.visual.CartesianAxis} axis The axis.
     * @type pv.Scale
     */
    _createScaleByAxis: function(axis){
        var scaleType = axis.scaleType();
        
        var createScaleMethod = this['_create' + scaleType + 'ScaleByAxis'];
        
        return createScaleMethod.call(this, axis);
    },
    
    /**
     * Creates a discrete scale for a given axis.
     * <p>
     * Uses the chart's <tt>panelSizeRatio</tt> to calculate the band.
     * </p>
     * 
     * @param {pvc.visual.CartesianAxis} axis The axis.
     * @virtual
     * @type pv.Scale
     */
    _createDiscreteScaleByAxis: function(axis){
        /* DOMAIN */
        var data   = this.dataEngine.groupBy(axis.role.grouping.singleLevelGrouping(), { visible: true }),
            values = data.children().select(function(child){ return child.value; }).array(),
            scale  = new pv.Scale.ordinal(values);
        
        scale.type = 'Discrete';
        
        /* RANGE */
        this._setAxisScaleRange(scale, axis);

        if(values.length > 0){
            var bandRatio = this.options.panelSizeRatio || 0.8;
            scale.splitBandedCenter(scale.min, scale.max, bandRatio);
        }
        
        return scale;
    },
    
    /**
     * Creates a continuous timeseries scale for a given axis.
     * 
     * <p>
     * Uses the axis' option <tt>Offset</tt> to calculate excess domain margins at each end of the scale.
     * </p>
     * <p>
     * Also takes into account the specified axis' options 
     * <tt>DomainRoundMode</tt> and <tt>DesiredTickCount</tt>.
     * </p>
     * 
     * @param {pvc.visual.CartesianAxis} axis The axis.
     * @virtual
     * @type pv.Scale
     */
    _createTimeseriesScaleByAxis: function(axis){
        /* DOMAIN */
        var dExtent = this._getVisibleValueExtent(axis.role), // null when no data...
            dMin,
            dMax;
        
        if(dExtent) {
            dMin = dExtent.min;
            dMax = dExtent.max;
            
            // Adding a small offset to the scale's domain:
//            var axisOffset = axis.options('Offset');
//            if(axisOffset > 0){
//                var dOffset = (dMax.getTime() - dMin.getTime()) * axisOffset;
//                dMin = new Date(dMin.getTime() - dOffset);
//                dMax = new Date(dMax.getTime() + dOffset);
//            }
        } else {
            dMin = dMax = new Date();
        }
        
        if((dMax - dMin) === 0) {
            dMax = new Date(dMax.getTime() + 3600000); // 1 h
        }
        
        var scale = new pv.Scale.linear(dMin, dMax);

        // Domain rounding
        // TODO: pvc.scaleTicks(scale) does not like Dates...
        //pvc.roundScaleDomain(scale, axis.options('DomainRoundMode'), axis.options('DesiredTickCount'));
        
        /* RANGE */
        this._setAxisScaleRange(scale, axis);
        
        scale.range(scale.min, scale.max);
        
        return scale;
    },

    _createContinuousScaleByAxis: function(axis){
        /* DOMAIN */
        var extent = this._getVisibleValueExtentConstrained(axis),
            dMin = extent.min,
            dMax = extent.max;

         if(pvc.debug >= 3){
             pvc.log("Continuous scale extent: " + JSON.stringify(extent));
         }

        /*
         * If both negative or both positive
         * the scale does not contain the number 0.
         *
         * Currently this option ignores locks. Is this all right?
         */
        var originIsZero = axis.options('OriginIsZero');
        if(originIsZero && (dMin * dMax > 0)){
            if(dMin > 0){
                dMin = 0;
                extent.minLocked = true;
            } else {
                dMax = 0;
                extent.maxLocked = true;
            }
        }

        /*
         * If the bounds (still) are the same, things break,
         * so we add a wee bit of variation.
         *
         * This one must ignore locks.
         */
        if (dMin === dMax) {
            dMin = dMin !== 0 ? dMin * 0.99 : originIsZero ? 0 : -0.1;
            dMax = dMax !== 0 ? dMax * 1.01 : 0.1;
        } else if(dMin > dMax){
            // What the heck...
            // Is this ok or should throw?
            var bound = dMin;
            dMin = dMax;
            dMax = bound;
        }
        
        var scale = new pv.Scale.linear(dMin, dMax);
        
        // Domain rounding
        // Must be done before applying offset
        // because otherwise the offset gets amplified by the rounding
        pvc.roundScaleDomain(scale, axis.options('DomainRoundMode'), axis.options('DesiredTickCount'));
        
        // Adding a small offset to the scale's dMin and dMax,
        //  as long as they are not 0 and originIsZero=true.
        // We update the domain but do not update the ticks cache.
        // The result is we end up showing two zones, on each end, with no ticks.
//        var bypassAxisOffset = false; //def.get(keyArgs, 'bypassAxisOffset', false);
//        var axisOffset = axis.options('Offset');
//        if(!bypassAxisOffset && axisOffset > 0 &&  // TODO axisIndex awareness...
//           (!extent.minLocked || !extent.maxLocked)){ // at least one of min and max isn't locked
//
//            var domain = scale.domain();
//            dMin = domain[0];
//            dMax = domain[1];
//
//            var dOffset = (dMax - dMin) * axisOffset;
//            if(!extent.minLocked && !extent.maxLocked){
//                scale.domain(dMin - dOffset, dMax + dOffset);
//            } else if(!extent.minLocked) {
//                scale.domain(dMin - dOffset, dMax);
//            } else {
//                scale.domain(dMin, dMax + dOffset);
//            }
//        }
        
        // ----------------------------
        
        /* RANGE */
        this._setAxisScaleRange(scale, axis);

        scale.range(scale.min, scale.max);
        
        return scale;
    },
    
    _setAxisScaleRange: function(scale, axis){
        var size = (axis.orientation === 'x') ?
                        this._mainContentPanel.width :
                        this._mainContentPanel.height;
        
        scale.min    = 0;
        scale.max    = size; 
        scale.size   = size; // original size
        
        var axisOffset = axis.options('Offset');
        if(axisOffset > 0){
            var rOffset = size * axisOffset;
            scale.offset = rOffset;
            scale.min += rOffset;
            scale.max -= rOffset;
        } else {
            scale.offset = 0;
        }

        return scale;
    },

    _getVisibleData: function(){
        var data = this._visibleDataCache;
        if(!data) {
            data = this._visibleDataCache = this._createVisibleData();
        }
        
        return data;
    },
    
    /**
     * @virtual
     */
    _createVisibleData: function(){
        var seriesGrouping = this.visualRoles('series').grouping.singleLevelGrouping();
        
        return this.dataEngine.groupBy(seriesGrouping, { visible: true });
    },
    
    _assertSingleContinuousValueRole: function(valueRole){
        if(!valueRole.grouping.isSingleDimension) {
            pvc.log("[WARNING] A linear scale can only be obtained for a single dimension role.");
        }
        
        if(valueRole.grouping.isDiscrete()) {
            pvc.log("[WARNING] The single dimension of role '{0}' should be continuous.", [valueRole.name]);
        }
    },
    
    /**
     * Gets the extent of the values of the specified role
     * over all datums of the visible data.
     * 
     * @param {pvc.visual.Role} valueRole The value role.
     * @type object
     * 
     * @virtual
     */
    _getVisibleValueExtent: function(valueRole){
        this._assertSingleContinuousValueRole(valueRole);
        
        if(valueRole.name === 'series') { 
            /* not supported/implemented? */
            throw def.error.notImplemented();
        }
        
        var valueDimName = valueRole.firstDimensionName();
        var extent = this._getVisibleData().dimensions(valueDimName).extent();
        return extent ? {min: extent.min.value, max: extent.max.value} : undefined;
    },
    
    /**
     * @virtual
     */
    _getVisibleValueExtentConstrained: function(axis, min, max){
        var extent = {
                minLocked: false,
                maxLocked: false
            };
        
        if(min == null) {
            min = axis.options('FixedMin');
            if(min != null){
                extent.minLocked = true;
            }
        }
        
        if(max == null) {
            max = axis.options('FixedMax');
            if(max != null){
                extent.maxLocked = true;
            }
        }
        
        var baseExtent;
        if(min == null || max == null) {
            baseExtent = this._getVisibleValueExtent(axis.role); // null when no data
            
            if(min == null){
                min = baseExtent ? baseExtent.min : 0;
            }
            
            if(max == null){
                max = baseExtent ? baseExtent.max : 0;
            }
        }
        
        extent.min = min;
        extent.max = max;
        
        return extent;
    }
}, {
    defaultOptions: pvc.visual.CartesianAxis.createAllDefaultOptions({
        showAllTimeseries: false,

        /* Percentage of occupied space over total space in a discrete axis band */
        panelSizeRatio: 0.9,

        // Indicates that the *base* axis is a timeseries
        timeSeries: false,
        timeSeriesFormat: "%Y-%m-%d",
        
        originIsZero: true,

        useCompositeAxis: false,

        /* Non-standard axes options and defaults */
        showXScale: true,
        showYScale: true,
        
        xAxisPosition: "bottom",
        yAxisPosition: "left",

        secondAxisIndependentScale: false,
        secondAxisColor: "blue"
    })
});
