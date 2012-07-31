
pvc.CartesianGridDockingPanel = pvc.GridDockingPanel.extend({
    /**
     * @override
     */
    applyExtensions: function(){
        this.base();

        // Extend body
        this.extend(this.pvPanel,    "content_");
        this.extend(this.xGridRule,  "xAxisGrid_");
        this.extend(this.yGridRule,  "yAxisGrid_");
        this.extend(this.pvFrameBar, "plotFrame_");
        
        if(this.chart.options.compatVersion <= 1){
            this.extend(this.pvFrameBar, "xAxisEndLine_");
            this.extend(this.pvFrameBar, "yAxisEndLine_");
        }
        
        this.extend(this.xZeroLine,  "xAxisZeroLine_");
        this.extend(this.yZeroLine,  "yAxisZeroLine_");
    },

    /**
     * @override
     */
    _createCore: function(layoutInfo){
        var chart = this.chart;
        var axes  = chart.axes;
        var xAxis = axes.x;
        var yAxis = axes.y;
        
        // Full grid lines
        if(xAxis.isVisible && xAxis.option('FullGrid')) {
            this.xGridRule = this._createGridRule(xAxis);
        }
        
        if(yAxis.isVisible && yAxis.option('FullGrid')) {
            this.yGridRule = this._createGridRule(yAxis);
        }
        
        this.base(layoutInfo);

        var contentPanel = chart._mainContentPanel;
        if(contentPanel) {
            var showPlotFrame = chart.options.showPlotFrame;
            if(showPlotFrame == null){
                if(chart.options.compatVersion <= 1){
                    showPlotFrame = !!(xAxis.option('EndLine') || yAxis.option('EndLine'));
                } else {
                    showPlotFrame = true;
                }
            }
            
            if(showPlotFrame) {
                this.pvFrameBar = this._createFrame(layoutInfo, axes);
            }
            
            if(xAxis.scaleType === 'Continuous' && xAxis.option('ZeroLine')) {
                this.xZeroLine = this._createZeroLine(xAxis, layoutInfo);
            }

            if(yAxis.scaleType === 'Continuous' && yAxis.option('ZeroLine')) {
                this.yZeroLine = this._createZeroLine(yAxis, layoutInfo);
            }
        }
    },
    
    _createGridRule: function(axis){
        var scale = axis.scale;
        var ticks;
        
        // Composite axis don't fill ticks
        if(!scale.isNull && (ticks = axis.ticks)){
            var margins  = this._layoutInfo.gridMargins;
            var paddings = this._layoutInfo.gridPaddings;
            
            var tick_a = axis.orientation === 'x' ? 'left' : 'bottom';
            var len_a  = this.anchorLength(tick_a);
            var obeg_a = this.anchorOrtho(tick_a);
            var oend_a = this.anchorOpposite(obeg_a);
            
            var tick_offset = margins[tick_a] + paddings[tick_a];
            
            var obeg = margins[obeg_a];
            var oend = margins[oend_a];
            
    //      TODO: Implement FullGridCrossesMargin ...
    //        var orthoAxis = this._getOrthoAxis(axis.type);
    //        if(!orthoAxis.option('FullGridCrossesMargin')){
    //            obeg += paddings[obeg_a];
    //            oend += paddings[oend_a];
    //        }
            
            // Grid rules are generated for MAJOR ticks only.
            // For discrete axes, each category
            // has a grid line at the beginning of the band,
            // and an extra end line in the last band
            var isDiscrete = axis.scaleType === 'Discrete';
            if(isDiscrete){
                ticks = ticks.concat(ticks[ticks.length - 1]);
            }
            
            var pvGridRule = this.pvPanel.add(pv.Rule)
                            .data(ticks)
                            .zOrder(-12)
                            .strokeStyle("#f0f0f0")
                            [obeg_a](obeg)
                            [oend_a](oend)
                            [len_a](null)
                            ;
            
            if(!isDiscrete){
                pvGridRule
                    [tick_a](function(tick){
                        return tick_offset + scale(tick);
                    });
            } else {
                var halfStep = scale.range().step / 2;
                var lastTick = ticks.length - 1;
                
                pvGridRule
                    [tick_a](function(childData){
                        var position = tick_offset + scale(childData.value);
                        return position + (this.index < lastTick ? -halfStep : halfStep);
                    });
            }
            
            return pvGridRule;
        }
    },
    
    /* zOrder
     *
     * TOP
     * -------------------
     * Axis Rules:     0
     * Line/Dot/Area Content: -7
     * Frame/EndLine: -8
     * ZeroLine:      -9   <<------
     * Content:       -10 (default)
     * FullGrid:      -12
     * -------------------
     * BOT
     */
    
    _createFrame: function(layoutInfo, axes){
        if(axes.base.scale.isNull || 
           (axes.ortho.scale.isNull && (!axes.ortho2 || axes.ortho2.scale.isNull))){
            return;
        }
                
        var margins = layoutInfo.gridMargins;
        var left   = margins.left;
        var right  = margins.right;
        var top    = margins.top;
        var bottom = margins.bottom;
        
        // TODO: Implement FullGridCrossesMargin ...
        // Need to use to find the correct bounding box.
        // xScale(xScale.domain()[0]) -> xScale(xScale.domain()[1])
        // and
        // yScale(yScale.domain()[0]) -> yScale(yScale.domain()[1])
        var pvFrame = this.pvPanel.add(pv.Bar)
                        .zOrder(-8)
                        .left(left)
                        .right(right)
                        .top (top)
                        .bottom(bottom)
                        .strokeStyle("#808285")
                        .lineWidth(0.5)
                        .lock('fillStyle', null);
        return pvFrame;
    },
    
    _createZeroLine: function(axis, layoutInfo){
        var scale = axis.scale;
        if(!scale.isNull){
            var domain = scale.domain();
    
            // Domain crosses zero?
            if(domain[0] * domain[1] <= 0){
                // TODO: Implement FullGridCrossesMargin ...
                
                var a = axis.orientation === 'x' ? 'left' : 'bottom';
                var len_a  = this.anchorLength(a);
                var obeg_a = this.anchorOrtho(a);
                var oend_a = this.anchorOpposite(obeg_a);
                
                var margins = layoutInfo.gridMargins;
                var paddings = layoutInfo.gridPaddings;
                
                var zeroPosition = margins[a] + paddings[a] + scale(0);
                
                var obeg = margins[obeg_a];
                var oend = margins[oend_a];
                
                this.pvZeroLine = this.pvPanel.add(pv.Rule)
                    .zOrder(-9)
                    .strokeStyle("#808285")
                    [obeg_a](obeg)
                    [oend_a](oend)
                    [a](zeroPosition)
                    [len_a](null)
                    ;
            }
        }
    },

    _getOrthoAxis: function(type){
        var orthoType = type === 'base' ? 'ortho' : 'base';
        return this.chart.axes[orthoType];
    }
    
//    _buildDiscreteFullGridScene: function(data){
//        var rootScene = new pvc.visual.Scene(null, {panel: this, group: data});
//        
//        data.children()
//            .each(function(childData){
//                var childScene = new pvc.visual.Scene(rootScene, {group: childData});
//                var valueVar = 
//                    childScene.vars.tick = 
//                        new pvc.visual.ValueLabelVar(
//                                    childData.value,
//                                    childData.label);
//                
//                valueVar.absLabel = childData.absLabel;
//        });
//
//        /* Add a last scene, with the same data group */
//        var lastScene  = rootScene.lastChild;
//        if(lastScene){
//            var endScene = new pvc.visual.Scene(rootScene, {group: lastScene.group});
//            endScene.vars.tick = lastScene.vars.tick;
//        }
//
//        return rootScene;
//    }
});
