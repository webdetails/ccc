/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * CartesianAbstract is the base class for all 2D cartesian space charts.
 */
def
.type('pvc.CartesianAbstract', pvc.BaseChart)
.init(function(options) {
    
    this.axesPanels = {};
    
    this.base(options);
})
.add({
    _axisClassByType: {
        'base':  pvc_CartesianAxis,
        'ortho': pvc_CartesianAxis
    },

    _gridDockPanel: null,

    _defaultAxisBandSizeRatio: 0.9,

    axesPanels: null, 
    
    // V1 properties
    yAxisPanel: null,
    xAxisPanel: null,
    secondXAxisPanel: null,
    secondYAxisPanel: null,
    yScale: null,
    xScale: null,


    /**
     * Creates a scale for a given axis, with domain applied, but no range yet,
     * assigns it to the axis and assigns the scale to special v1 chart instance fields.
     * 
     * @param {pvc.visual.Axis} axis The axis.
     * @param {number} chartLevel The chart level.
     */
    _setAxisScale: function(axis, chartLevel) {

        this.base(axis, chartLevel);
        
        var isOrtho = axis.type === 'ortho';
        var isCart  = isOrtho || axis.type === 'base';
        if(isCart) {
            /* V1 fields xScale, yScale, secondScale */
            if(isOrtho && axis.index === 1)
                this.secondScale = axis.scale;
            else if(!axis.index)
                this[axis.orientation + 'Scale'] = axis.scale;
        }
    },

    /** @override */
    _initAxesEnd: function() {
        var p = this.parent;
        this._axisOffsetPaddings = p ? p._axisOffsetPaddings : this._calcAxesOffsetPaddings();
        this._plotsClientSizeInfo = p ? p._plotsClientSizeInfo : this._calcPlotsClientSizeInfo();

        this.base();
    },

    _eachCartAxis: function(f, x) {

        var chartAxes = this.axesByType;
        ['base', 'ortho'].forEach(function(type) {
            var typeAxes = chartAxes[type];
            if(typeAxes) typeAxes.forEach(function(axis) { f.call(x, axis); });
        });
    },

    /** @virtual */
    _calcPlotsClientSizeInfo: function() {
        if(!this.parent) {
            var sizeMin = new pvc_Size(0, 0),
                sizeMax = new pvc_Size(Infinity, Infinity),
                size    = new pvc_Size();

            this._eachCartAxis(function(axis) {
                var a_size = axis.orientation === 'x' ? 'width' : 'height',
                    rangeInfo = axis.getScaleRangeInfo();

                if(rangeInfo) {
                    if(rangeInfo.value != null) {
                        size[a_size] = Math.max(size[a_size] || 0, rangeInfo.value);
                    } else if(rangeInfo.min != null) {
                        sizeMin[a_size] = Math.max(sizeMin[a_size], rangeInfo.min);
                        sizeMax[a_size] = Math.min(sizeMax[a_size], rangeInfo.max);
                    }
                }
            });

            sizeMax.width  = Math.max(sizeMax.width,  sizeMin.width );
            sizeMax.height = Math.max(sizeMax.height, sizeMin.height);

            if(size.width != null)
                size.width = Math.max(Math.min(size.width, sizeMax.width), sizeMin.width);
            else if(pv.floatEqual(sizeMin.width, sizeMax.width))
                size.width = sizeMin.width;

            if(size.height != null)
                size.height = Math.max(Math.min(size.height, sizeMax.height), sizeMin.height);
            else if(pv.floatEqual(sizeMin.height, sizeMax.height))
                size.height = sizeMin.height;

            return {value: size, min: sizeMin, max: sizeMax};
        }
    },

    /** @virtual */
    _calcAxesOffsetPaddings: function() {
        var pctPaddings = {},
            hasAny = false;

        function setSide(side, pct) {
            var value = pctPaddings[side];
            if(value == null || pct > value) {
                hasAny = true;
                pctPaddings[side] = pct;
            }
        }

        function processAxis(axis) {
            var offset = axis && axis.option('Offset');
            if(offset != null && offset > 0 && offset < 1) {
                if(axis.orientation === 'x') {
                    setSide('left',  offset);
                    setSide('right', offset);
                } else {
                    setSide('top',    offset);
                    setSide('bottom', offset);
                }
            }
        }

        this._eachCartAxis(processAxis);

        return hasAny ? pctPaddings : null;
    },

    _createContent: function(parentPanel, contentOptions) {
        
        this._createFocusWindow();

        // Create the grid/docking panel
        this._gridDockPanel = new pvc.CartesianGridDockingPanel(this, parentPanel, {
            margins:  contentOptions.margins,
            paddings: contentOptions.paddings
        });
        
        // Create child axis panels.
        // The order is relevant because of docking order.
        ['base', 'ortho'].forEach(function(type) {

            var typeAxes = this.axesByType[type];
            if(typeAxes) def.query(typeAxes)
                .reverse()
                .each(function(axis) { this._createAxisPanel(axis); }, this);
        }, this);
        
        // Create plot content panels inside the grid docking panel
        this.base(this._gridDockPanel, {
            clickAction:       contentOptions.clickAction,
            doubleClickAction: contentOptions.doubleClickAction
        });
    },
    

    // NEW603 C
    // Applies the slidingWindow select/score functions to the data
   /** @override */
   _createScoringOptions: function(options) {
         this._createSlidingWindow();
         if(this.slidingWindow){
            var sw = this.slidingWindow;
            //override default scoring functions
            this.data.score = function(datum) { sw.score.call( sw , datum ); }
            this.data.select = function(allData, remove) { sw.select.call( sw , allData, remove ); }
            return this;
        }
    },

    // NEW603 C 
    // creates a slidingWindow and initializes its options
    _createSlidingWindow: function() {

        var sw = this.options.slidingWindow;

        if(this.slidingWindow){ this.slidingWindow.delete; }

        if(sw) {

            sw = new pvc.visual.SlidingWindow(this);
            this.slidingWindow = sw;
            sw._initFromOptions();

        } 
        return this;
    },

    _createFocusWindow: function() {
        if(this.selectableByFocusWindow()) {
            // In case we're being re-rendered,
            // capture the axes' focusWindow, if any.
            // and set it as the next focusWindow.
            var fwData, fw = this.focusWindow;
            if(fw) fwData = fw._exportData();
            
            fw = this.focusWindow = new pvc.visual.CartesianFocusWindow(this);
            
            if(fwData) fw._importData(fwData);
            
            fw._initFromOptions();
            
        } else if(this.focusWindow) {
            delete this.focusWindow;
        }
    },
    
    /**
     * Creates an axis panel, if it is visible.
     * @param {pvc.visual.CartesianAxis} axis The cartesian axis.
     * @type pvc.AxisPanel
     */
    _createAxisPanel: function(axis) {
        if(axis.option('Visible')) {
            var titlePanel,
                title = axis.option('Title');

            if(!def.empty(title)) {

                //NEW603 C
                /* Save axes title panel's layout information if this is a re-render 
                and layout should be preserved.
                This is done before replacing the old panel by a new one */
                var sizeOld, marginsOld, paddingsOld;

                if (this.axesPanels[axis.id]            &&
                    this.axesPanels[axis.id].titlePanel &&
                    this.options.preserveLayout){
                    sizeOld     =  this.axesPanels[axis.id].titlePanel.titleSize;
                    marginsOld  =  this.axesPanels[axis.id].titlePanel.margins;
                    paddingsOld =  this.axesPanels[axis.id].titlePanel.paddings;
                }

                titlePanel = new pvc.AxisTitlePanel(this, this._gridDockPanel, axis, {
                    title:        title,
                    font:         axis.option('TitleFont') || axis.option('Font'),
                    anchor:       axis.option('Position'),
                    align:        axis.option('TitleAlign'),
                    margins:      marginsOld ? axis.option.getSpecified('TitleMargins', marginsOld.resolve()) : 
                                               axis.option('TitleMargins'),
                    paddings:     paddingsOld ? axis.option.getSpecified('TitlePaddings', paddingsOld.resolve()) : 
                                                axis.option('TitlePaddings'),
                    titleSize:    sizeOld ? axis.option.getSpecified('TitleSize', sizeOld.resolve()) : 
                                            axis.option('TitleSize'), 
                    titleSizeMax: axis.option('TitleSizeMax')
                });
            }
            
            //NEW603 C
            /* Save axes panel's layout information if this is a re-render 
            and layout should be preserved. 
            This is done before replacing the old panel by a new one */
            var sizeOld2, marginsOld2, paddingsOld2;

            if (this.axesPanels[axis.id] && this.options.preserveLayout){
                sizeOld2     =  this.axesPanels[axis.id].size;
                marginsOld2  =  this.axesPanels[axis.id].margins;
                paddingsOld2 =  this.axesPanels[axis.id].paddings;
            }

            var panel = new pvc.AxisPanel(this, this._gridDockPanel, axis, {
                anchor:            axis.option('Position'),
                size:              sizeOld2 ? axis.option.getSpecified('Size', sizeOld2.resolve()) : 
                                            axis.option('Size'), 
                sizeMax:           axis.option('SizeMax'),
                clickAction:       axis.option('ClickAction'),
                doubleClickAction: axis.option('DoubleClickAction'),
                useCompositeAxis:  axis.option('Composite'),
                font:              axis.option('Font'),
                labelSpacingMin:   axis.option('LabelSpacingMin'),
                grid:              axis.option('Grid'),
                gridCrossesMargin: axis.option('GridCrossesMargin'),
                ruleCrossesMargin: axis.option('RuleCrossesMargin'),
                zeroLine:          axis.option('ZeroLine'),
                showTicks:         axis.option('Ticks'),
                showMinorTicks:    axis.option('MinorTicks'),
                margins:           marginsOld2  ? marginsOld2  : undefined,
                paddings:          paddingsOld2 ? paddingsOld2 : undefined
            });
            
            if(titlePanel) panel.titlePanel = titlePanel;
            
            this.axesPanels[axis.id] = panel;
            this.axesPanels[axis.orientedId] = panel;
            
            // Legacy fields
            if(axis.v1SecondOrientedId) this[axis.v1SecondOrientedId + 'AxisPanel'] = panel;
            
            return panel;
        }
    },
    
    _onLaidOut: function() {
        if(this.plotPanelList && this.plotPanelList[0]) { // not the root of a multi chart

            // Set scale ranges, after layout
            this._eachCartAxis(this._setCartAxisScaleRange, this);
        }
    },
    
    _setCartAxisScaleRange: function(axis) {
        var info   = this.plotPanelList[0]._layoutInfo,
            size   = info.clientSize,
            a_size = (axis.orientation === 'x') ? size.width : size.height;

        axis.setScaleRange(a_size);
        axis.setTicks(axis.ticks);
        
        return axis.scale;
    },
        
    _getAxesRoundingPaddings: function() {
        var axesPaddings = {};
        
        var axesByType = this.axesByType;
        ['base', 'ortho'].forEach(function(type) {
            var typeAxes = axesByType[type];
            if(typeAxes) typeAxes.forEach(processAxis);
        });
        
        return axesPaddings;
        
        function setSide(side, pct, locked) {
            var value = axesPaddings[side];
            if(value == null || pct > value) {
                axesPaddings[side] = pct;
                axesPaddings[side + 'Locked'] = locked;
            } else if(locked) {
                axesPaddings[side + 'Locked'] = locked;
            }
        }
        
        function processAxis(axis) {
            if(axis) {
                var tickRoundPads;
                // {begin: , end: , beginLocked: , endLocked: }
                tickRoundPads = axis.getScaleRoundingPaddings();
                 
                if(tickRoundPads) {
                    var isX = axis.orientation === 'x';
                    setSide(isX ? 'left'  : 'bottom', tickRoundPads.begin, tickRoundPads.beginLocked);
                    setSide(isX ? 'right' : 'top'   , tickRoundPads.end,   tickRoundPads.endLocked);
                }
            }
        }
    },

    _getContinuousVisibleExtentConstrained: function(axis, min, max) {
        if(axis.type === 'ortho' && axis.role.isNormalized == true)
            /*
             * Forces showing 0-100 in the axis.
             * Note that the bars are stretched automatically by the band layout,
             * so this scale ends up being ignored by the bars.
             * Note also that each category would have a different scale,
             * so it isn't possible to provide a single correct scale,
             * that would satisfy all the bars...
             */
            return {min: 0, max: 100, minLocked: true, maxLocked: true};

        return this.base(axis, min, max);
    },

    _coordinateSmallChartsLayout: function(scopesByType) {
        // TODO: optimize the case where
        // the title panels have a fixed size and
        // the x and y FixedMin and FixedMax are all specified...
        // Don't need to coordinate in that case.

        this.base(scopesByType);

        // Force layout and retrieve sizes of
        // * title panel
        // * y panel if column or global scope (column scope coordinates x scales, but then the other axis' size also affects the layout...)
        // * x panel if row    or global scope
        var titleSizeMax  = 0,
            titleOrthoLen,
            axisIds = null,
            sizesMaxByAxisId = {}; // {id:  {axis: axisSizeMax, title: titleSizeMax} }

        // Calculate maximum sizes
        this.children.forEach(function(childChart) {

            childChart.basePanel.layout();

            var size, panel = childChart.titlePanel;
            if(panel) {
                if(!titleOrthoLen) titleOrthoLen = panel.anchorOrthoLength();

                size = panel[titleOrthoLen];
                if(size > titleSizeMax) titleSizeMax = size;
            }

            // ------

            var axesPanels = childChart.axesPanels;
            if(!axisIds) {
                axisIds = def.query(def.ownKeys(axesPanels))
                    .where(function(alias) { return alias === axesPanels[alias].axis.id; })
                    .select(function(id) {
                        // side effect
                        sizesMaxByAxisId[id] = {axis: 0, title: 0};
                        return id;
                    })
                    .array();
            }

            axisIds.forEach(function(id) {
                var axisPanel = axesPanels[id],
                    sizes = sizesMaxByAxisId[id],
                    ol = axisPanel.axis.orientation === 'x' ? 'height' : 'width';
                size = axisPanel[ol];
                if(size > sizes.axis) sizes.axis = size;

                var titlePanel = axisPanel.titlePanel;
                if(titlePanel) {
                    size = titlePanel[ol];
                    if(size > sizes.title) sizes.title = size;
                }
            });
        }, this);

        // Apply the maximum sizes to the corresponding panels
        this.children.forEach(function(childChart) {

            if(titleSizeMax > 0) {
                var panel  = childChart.titlePanel;
                panel.size = panel.size.clone().set(titleOrthoLen, titleSizeMax);
            }

            // ------

            var axesPanels = childChart.axesPanels;
            axisIds.forEach(function(id) {
                var axisPanel = axesPanels[id],
                    sizes = sizesMaxByAxisId[id],
                    ol = axisPanel.axis.orientation === 'x' ? 'height' : 'width';

                axisPanel.size = axisPanel.size.clone().set(ol, sizes.axis);

                var titlePanel = axisPanel.titlePanel;
                if(titlePanel) titlePanel.size = titlePanel.size.clone().set(ol, sizes.title);
            });

            // Invalidate their previous layout
            childChart.basePanel.invalidateLayout();
        }, this);
    },

    markEventDefaults: {
        strokeStyle: "#5BCBF5",        /* Line Color */
        lineWidth: "0.5",              /* Line Width */
        textStyle: "#5BCBF5",          /* Text Color */
        verticalOffset: 10,            /* Distance between vertical anchor and label */
        verticalAnchor: "bottom",      /* Vertical anchor: top or bottom */
        horizontalAnchor: "right",     /* Horizontal anchor: left or right */
        forceHorizontalAnchor: false,  /* Horizontal anchor position will be respected if true */
        horizontalAnchorSwapLimit: 80, /** @deprecated  Horizontal anchor will switch if less than this space available */
        font: '10px sans-serif'
    },
    
    // TODO: chart orientation 
    // TODO: horizontal lines 
    // TODO: discrete scales
    markEvent: function(sourceValue, label, options) {
        var me = this,
            baseAxis  = me.axes.base,
            orthoAxis = me.axes.ortho,
            baseRole  = baseAxis.role,
            baseScale = baseAxis.scale,
            baseDim   = me.data.owner.dimensions(baseRole.grouping.lastDimensionName());

        if(baseAxis.isDiscrete()) {
            me.log.warn("Can only mark events in charts with a continuous base scale.");
            return me;
        }

        var o = $.extend({}, me.markEventDefaults, options),
            pseudoAtom = baseDim.read(sourceValue, label),
            basePos    = baseScale(pseudoAtom.value),
            baseRange  = baseScale.range(),
            baseEndPos = baseRange[1];
        if(basePos < baseRange[0] || basePos > baseEndPos) {
            me.log.warn("Cannot mark event because it is outside the base scale's domain.");
            return me;
        }
        
        // Chart's main plot
        var pvPanel = this.plotPanelList[0].pvPanel,
            h = orthoAxis.scale.range()[1];

        // Detect where to place the label
        var ha = o.horizontalAnchor;
        if(!o.forceHorizontalAnchor) {
            var alignRight    = ha === "right",
                availableSize = alignRight ? (baseEndPos - basePos) : basePos,
                labelSize = pv.Text.measureWidth(pseudoAtom.label, o.font);
            if(availableSize < labelSize) ha = alignRight ? "left" : "right";
        }
        
        var topPos = o.verticalAnchor === "top" ? o.verticalOffset : (h - o.verticalOffset);
        
        // Shouldn't this be a pv.Rule?
        var line = pvPanel.add(pv.Line)
            .data([0, h])
            .bottom(def.identity) // from 0 to h
            .left  (basePos)
            .lineWidth  (o.lineWidth)
            .strokeStyle(o.strokeStyle);

        line.anchor(ha)
            .visible(function() { return !this.index; })
            .top(topPos)
            .add(pv.Label)
            .font(o.font)
            .text(pseudoAtom.label)
            .textStyle(o.textStyle);
        
        return me;
    },
    
    defaults: {
        // Indicates that the *base* axis is a timeseries
        timeSeries: false,
        timeSeriesFormat: "%Y-%m-%d"
        
        // Show a frame around the plot area
        // plotFrameVisible: undefined
    },


});
