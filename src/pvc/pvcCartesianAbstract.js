
/**
 * CartesianAbstract is the base class for all 2D cartesian space charts.
 */
def
.type('pvc.CartesianAbstract', pvc.BaseChart)
.init(function(options){
    
    this.axesPanels = {};
    
    this.base(options);
})
.add({
    _gridDockPanel: null,
    _mainContentPanel: null,
    
    axesPanels: null, 
    
    // V1 properties
    yAxisPanel: null,
    xAxisPanel: null,
    secondXAxisPanel: null,
    secondYAxisPanel: null,
    yScale: null,
    xScale: null,
    
    _visibleDataCache: null,
    
    _getSeriesRoleSpec: function(){
        return { isRequired: true, defaultDimension: 'series*', autoCreateDimension: true, requireIsDiscrete: true };
    },
    
    _getColorRoleSpec: function(){
        return { isRequired: true, defaultSourceRole: 'series', requireIsDiscrete: true };
    },

    _initData: function(){
        // Clear data related cache
        if(this._visibleDataCache) {
            delete this._visibleDataCache;
        }
        
        this.base.apply(this, arguments);
    },
    
    _collectPlotAxesDataCells: function(plot, dataCellsByAxisTypeThenIndex){
        
        this.base(plot, dataCellsByAxisTypeThenIndex);
        
        /* NOTE: Cartesian axes are created even when hasMultiRole && !parent
         * because it is needed to read axis options in the root chart.
         * Also binding occurs to be able to know its scale type. 
         * Yet, their scales are not setup at the root level.
         */
        
        /* Configure Base Axis Data Cell */
        if(plot.option.isDefined('BaseAxis')){
            var baseDataCellsByAxisIndex = 
                def
                .array
                .lazy(dataCellsByAxisTypeThenIndex, 'base');
            
            def
            .array
            .lazy(baseDataCellsByAxisIndex, plot.option('BaseAxis') - 1)
            .push({
                plot:          plot,
                role:          this.visualRoles(plot.option('BaseRole')),
                dataPartValue: plot.option('DataPart')
            });
        }
        
        /* Configure Ortho Axis Data Cell */
        if(plot.option.isDefined('OrthoAxis')){
            
            var trendType = plot.option('TrendType'); // != null
            if(trendType === 'none'){ 
                trendType = null; 
            }
            
            var isStacked = plot.option.isDefined('Stacked') ?
                            plot.option('Stacked') :
                            undefined;
            
            var orthoDataCellsByAxisIndex = 
                def
                .array
                .lazy(dataCellsByAxisTypeThenIndex, 'ortho');
            
            var orthoRoleNames = def.array.to(plot.option('OrthoRole'));
            
            var dataCellBase = {
                dataPartValue: plot.option('DataPart' ),
                isStacked:     isStacked,
                trendType:     trendType,
                nullInterpolationMode: plot.option('NullInterpolationMode')
            };
            
            var orthoDataCells = 
                def
                .array
                .lazy(orthoDataCellsByAxisIndex, plot.option('OrthoAxis') - 1);
            
            orthoRoleNames.forEach(function(orthoRoleName){
                var dataCell = Object.create(dataCellBase);
                dataCell.role = this.visualRoles(orthoRoleName);
                orthoDataCells.push(dataCell);
            }, this)
            ;
        }
    },
    
    _addAxis: function(axis){
        this.base(axis);
        
        switch(axis.type){
            case 'base':
            case 'ortho':
                this.axes[axis.orientedId] = axis;
                break;
        }
        
        return this;
    },
        
    _generateTrendsDataCell: function(dataCell){
        /*jshint onecase:true */
        var trendType =  dataCell.trendType;
        if(trendType){
            var trendInfo = pvc.trends.get(trendType);
            
            var newDatums = [];
            
            this._generateTrendsDataCellCore(newDatums, dataCell, trendInfo);
            
            if(newDatums.length){
                this.data.owner.add(newDatums);
            }
        }
    },
    
    _generateTrendsDataCellCore: function(dataCell, trendInfo){
        // abstract
        // see Metric and Categorical implementations
    },
        
    _setAxesScales: function(hasMultiRole){
        
        this.base(hasMultiRole);
        
        if(!hasMultiRole || this.parent){
            ['base', 'ortho'].forEach(function(type){
                var axisOfType = this.axesByType[type];
                if(axisOfType){
                    axisOfType.forEach(this._createAxisScale, this);
                }
            }, this);
        }
    },
    
    /**
     * Creates a scale for a given axis, with domain applied, but no range yet,
     * assigns it to the axis and assigns the scale to special v1 chart instance fields.
     * 
     * @param {pvc.visual.CartesianAxis} axis The axis.
     * @type pv.Scale
     */
    _createAxisScale: function(axis){
        var isOrtho = axis.type === 'ortho';
        var isCart  = isOrtho || axis.type === 'base';
        
        var scale = this._createScaleByAxis(axis);
        if(scale.isNull && pvc.debug >= 3){
            this._log(def.format("{0} scale for axis '{1}'- no data", [axis.scaleType, axis.id]));
        }
        
        scale = axis.setScale(scale).scale;
        
        if(isCart){
            /* V1 fields xScale, yScale, secondScale */
            if(isOrtho && axis.index === 1) {
                this.secondScale = scale;
            } else if(!axis.index) {
                this[axis.orientation + 'Scale'] = scale;
            }
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
        var createScale = this['_create' + def.firstUpperCase(axis.scaleType) + 'ScaleByAxis'];
        
        return createScale.call(this, axis);
    },
    
    _preRenderContent: function(contentOptions){
        /* Create the grid/docking panel */
        this._gridDockPanel = new pvc.CartesianGridDockingPanel(this, this.basePanel, {
            margins:  contentOptions.margins,
            paddings: contentOptions.paddings
        });
        
        /* Create child axis panels
         * The order is relevant because of docking order. 
         */
        ['base', 'ortho'].forEach(function(type){
            var typeAxes = this.axesByType[type];
            if(typeAxes){
                def
                .query(typeAxes)
                .reverse()
                .each(function(axis){
                    this._createAxisPanel(axis);
                }, this)
                ;
            }
        }, this);
        
        /* Create main content panel 
         * (something derived from pvc.CartesianAbstractPanel) */
        this._mainContentPanel = this._createMainContentPanel(this._gridDockPanel, {
            clickAction:        contentOptions.clickAction,
            doubleClickAction:  contentOptions.doubleClickAction
        });
    },
    
    /**
     * Creates an axis panel, if it is visible.
     * @param {pvc.visual.CartesianAxis} axis The cartesian axis.
     * @type pvc.AxisPanel
     */
    _createAxisPanel: function(axis){
        if(axis.option('Visible')) {
            var titlePanel;
            var title = axis.option('Title');
            if (!def.empty(title)) {
                titlePanel = new pvc.AxisTitlePanel(this, this._gridDockPanel, axis, {
                    title:        title,
                    font:         axis.option('TitleFont') || axis.option('Font'),
                    anchor:       axis.option('Position'),
                    align:        axis.option('TitleAlign'),
                    margins:      axis.option('TitleMargins'),
                    paddings:     axis.option('TitlePaddings'),
                    titleSize:    axis.option('TitleSize'),
                    titleSizeMax: axis.option('TitleSizeMax')
                });
            }
            
            var panel = new pvc.AxisPanel(this, this._gridDockPanel, axis, {
                anchor:            axis.option('Position'),
                axisSize:          axis.option('Size'),
                axisSizeMax:       axis.option('SizeMax'),
                clickAction:       axis.option('ClickAction'),
                doubleClickAction: axis.option('DoubleClickAction'),
                
                useCompositeAxis:  axis.option('Composite'),
                font:              axis.option('Font'),
                labelSpacingMin:   axis.option('LabelSpacingMin'),
                tickExponentMin:   axis.option('TickExponentMin'),
                tickExponentMax:   axis.option('TickExponentMax'),
                fullGrid:          axis.option('FullGrid'),
                fullGridCrossesMargin: axis.option('FullGridCrossesMargin'),
                ruleCrossesMargin: axis.option('RuleCrossesMargin'),
                zeroLine:          axis.option('ZeroLine'),
                domainRoundMode:   axis.option('DomainRoundMode'),
                desiredTickCount:  axis.option('DesiredTickCount'),
                showTicks:         axis.option('Ticks'),
                showMinorTicks:    axis.option('MinorTicks')
            });
            
            if(titlePanel){
                panel.titlePanel = titlePanel;
            }
            
            this.axesPanels[axis.id] = panel;
            this.axesPanels[axis.orientedId] = panel;
            
            // V1 fields
            if(axis.index <= 1) {
                this[axis.orientedId + 'AxisPanel'] = panel;
            }
            
            return panel;
        }
    },

    /* @abstract */
    _createMainContentPanel: function(parentPanel, baseOptions){
        throw def.error.notImplemented();
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

        // With composite axis, only 'singleLevel' flattening works well
        var dataPartValues = 
            axis.
            dataCells.
            map(function(dataCell){ return dataCell.dataPartValue; });
        
        var baseData = this._getVisibleData(dataPartValues, {ignoreNulls: false});
        var data = baseData && baseData.flattenBy(axis.role);
        
        var scale = new pv.Scale.ordinal();
        if(!data || !data.count()){
            scale.isNull = true;
        } else {
            var values = data.children()
                             .select(function(child){ return child.value; })
                             .array();
            
            scale.domain(values);
        }
        
        return scale;
    },
    
    /**
     * Creates a continuous time-series scale for a given axis.
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
    _createTimeSeriesScaleByAxis: function(axis){
        /* DOMAIN */
        var extent = this._getContinuousVisibleExtent(axis); // null when no data...
        
        var scale = new pv.Scale.linear();
        if(!extent){
            scale.isNull = true;
        } else {
            var dMin = extent.min;
            var dMax = extent.max;

            if((dMax - dMin) === 0) {
                dMax = new Date(dMax.getTime() + 3600000); // 1 h
            }
        
            scale.domain(dMin, dMax);
        }
        
        return scale;
    },

    /**
     * Creates a continuous numeric scale for a given axis.
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
    _createNumericScaleByAxis: function(axis){
        /* DOMAIN */
        var extent = this._getContinuousVisibleExtentConstrained(axis);
        
        var scale = new pv.Scale.linear();
        if(!extent){
            scale.isNull = true;
        } else {
            var dMin = extent.min;
            var dMax = extent.max;
    
            /*
             * If both negative or both positive
             * the scale does not contain the number 0.
             *
             * Currently this option ignores locks. Is this all right?
             */
            var originIsZero = axis.option('OriginIsZero');
            if(originIsZero && (dMin * dMax > 0)){
                if(dMin > 0){
                    dMin = 0;
                } else {
                    dMax = 0;
                }
            }
    
            /*
             * If the bounds (still) are the same, things break,
             * so we add a wee bit of variation.
             * Ignoring locks.
             */
            if(dMin > dMax){
                var tmp = dMin;
                dMin = dMax;
                dMax = tmp;
            }
            
            if (dMax - dMin <= 1e-12) {
                dMin = dMin !== 0 ? dMin * 0.99 : originIsZero ? 0 : -0.1;
                dMax = dMax !== 0 ? dMax * 1.01 : 0.1;
            } 
            
            scale.domain(dMin, dMax);
        }
        
        return scale;
    },
    
    _onLaidOut: function(){
        if(this._mainContentPanel){ // not the root of a multi chart
            /* Set scale ranges, after layout */
            ['base', 'ortho'].forEach(function(type){
                var axes = this.axesByType[type];
                if(axes){
                    axes.forEach(this._setCartAxisScaleRange, this);
                }
            }, this);
        }
    },
    
    _setCartAxisScaleRange: function(axis){
        var info = this._mainContentPanel._layoutInfo;
        var size = (axis.orientation === 'x') ?
           info.clientSize.width :
           info.clientSize.height;
        
        axis.setScaleRange(size);

        return axis.scale;
    },
        
    _getAxesRoundingPaddings: function(){
        var axesPaddings = {};
        
        var axes  = this.axes;
        processAxis(axes.x);
        processAxis(axes.secondX);
        processAxis(axes.y);
        processAxis(axes.secondY);
        
        return axesPaddings;
        
        function setSide(side, pct){
            var value = axesPaddings[side];
            if(value == null || pct > value){
                axesPaddings[side] = pct;
            }
        }
        
        function processAxis(axis){
            if(axis){
                // {begin: , end: }
                var roundingPaddings = axis.getScaleRoundingPaddings();
                if(roundingPaddings){
                    if(axis.orientation === 'x'){
                        setSide('left',  roundingPaddings.begin);
                        setSide('right', roundingPaddings.end);
                    } else {
                        setSide('bottom', roundingPaddings.begin);
                        setSide('top',    roundingPaddings.end);
                    }
                }
            }
        }
    },
    
    /*
     * Obtains the chart's visible data
     * grouped according to the charts "main grouping".
     * 
     * @param {string|string[]} [dataPartValue=null] The desired data part value or values.
     * @param {object} [keyArgs=null] Optional keyword arguments object.
     * @param {boolean} [keyArgs.ignoreNulls=true] Indicates that null datums should be ignored.
     * 
     * @type pvc.data.Data
     */
    _getVisibleData: function(dataPartValue, keyArgs){
        var ignoreNulls = def.get(keyArgs, 'ignoreNulls', true);
        if(ignoreNulls && this.options.ignoreNulls){
            // If already globally ignoring nulls, there's no need to do it explicitly anywhere
            ignoreNulls = false;
        }
        
        keyArgs = keyArgs ? Object.create(keyArgs) : {};
        keyArgs.ignoreNulls = ignoreNulls;
        
        var key = ignoreNulls + '|' + dataPartValue, // relying on array.toString, when an array
            data = def.getOwn(this._visibleDataCache, key);
        if(!data) {
            data = this._createVisibleData(dataPartValue, keyArgs);
            if(data){
                (this._visibleDataCache || (this._visibleDataCache = {}))
                    [key] = data;
            }
        }
        
        return data;
    },

    /*
     * Creates the chart's visible data
     * grouped according to the charts "main grouping".
     *
     * <p>
     * The default implementation groups data by series visual role.
     * </p>
     *
     * @param {string|string[]} [dataPartValue=null] The desired data part value or values.
     * 
     * @type pvc.data.Data
     * @protected
     * @virtual
     */
    _createVisibleData: function(dataPartValue, keyArgs){
        var partData = this.partData(dataPartValue);
        if(!partData){
            return null;
        }
        
        var ignoreNulls = def.get(keyArgs, 'ignoreNulls');
        
        return this._serRole && this._serRole.grouping ?
               partData.flattenBy(this._serRole, {visible: true, isNull: ignoreNulls ? false : null}) :
               partData;
    },
    
    _warnSingleContinuousValueRole: function(valueRole){
        if(!valueRole.grouping.isSingleDimension) {
            this._log("[WARNING] A linear scale can only be obtained for a single dimension role.");
        }
        
        if(valueRole.grouping.isDiscrete()) {
            this._log("[WARNING] The single dimension of role '{0}' should be continuous.", [valueRole.name]);
        }
    },
    
    /**
     * @virtual
     */
    _getContinuousVisibleExtentConstrained: function(axis, min, max){
        if(min == null) {
            min = axis.option('FixedMin');
        }
        
        if(max == null) {
            max = axis.option('FixedMax');
        }
        
        if(min == null || max == null) {
            var baseExtent = this._getContinuousVisibleExtent(axis); // null when no data
            if(!baseExtent){
                return null;
            }
            
            if(min == null){
                min = baseExtent.min;
            }
            
            if(max == null){
                max = baseExtent.max;
            }
        }
        
        return {min: min, max: max};
    },
    
    /**
     * Gets the extent of the values of the specified axis' roles
     * over all datums of the visible data.
     * 
     * @param {pvc.visual.CartesianAxis} valueAxis The value axis.
     * @type object
     *
     * @protected
     * @virtual
     */
    _getContinuousVisibleExtent: function(valueAxis){
        
        var dataCells = valueAxis.dataCells;
        if(dataCells.length === 1){
            // Most common case is faster
            return this._getContinuousVisibleCellExtent(valueAxis, dataCells[0]);
        }
        
        // This implementation takes the union of 
        // the extents of each data cell.
        // Even when a data cell has multiple data parts, 
        // it is evaluated as a whole.
        
        return def
            .query(dataCells)
            .select(function(dataCell){
                return this._getContinuousVisibleCellExtent(valueAxis, dataCell);
            }, this)
            .reduce(pvc.unionExtents, null);
    },

    /**
     * Gets the extent of the values of the specified role
     * over all datums of the visible data.
     *
     * @param {pvc.visual.CartesianAxis} valueAxis The value axis.
     * @param {pvc.visual.Role} valueDataCell The data cell.
     * @type object
     *
     * @protected
     * @virtual
     */
    _getContinuousVisibleCellExtent: function(valueAxis, valueDataCell){
        var valueRole = valueDataCell.role;
        
        this._warnSingleContinuousValueRole(valueRole);

        if(valueRole.name === 'series') {
            /* not supported/implemented? */
            throw def.error.notImplemented();
        }
        
        var useAbs = valueAxis.scaleUsesAbs();
        var data  = this._getVisibleData(valueDataCell.dataPartValue);
        var extent = data && data
            .dimensions(valueRole.firstDimensionName())
            .extent({ abs: useAbs });
        
        if(extent){
            var minValue = extent.min.value;
            var maxValue = extent.max.value;
            return {
                min: (useAbs ? Math.abs(minValue) : minValue), 
                max: (useAbs ? Math.abs(maxValue) : maxValue) 
            };
        }
    },
    
    defaults: def.create(pvc.BaseChart.prototype.defaults, {
        /* Percentage of occupied space over total space in a discrete axis band */
        panelSizeRatio: 0.9,

        // Indicates that the *base* axis is a timeseries
        timeSeries: false,
        timeSeriesFormat: "%Y-%m-%d",

        useCompositeAxis: false
        
        // Show a frame around the plot area
//        showPlotFrame: undefined
    })
});
