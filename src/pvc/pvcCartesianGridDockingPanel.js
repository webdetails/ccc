
def
.type('pvc.CartesianGridDockingPanel', pvc.GridDockingPanel)
.add({
    
    _getExtensionId: function(){
        return !this.chart.parent ? 'content' : 'smallContent';
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
        if(xAxis.option('Visible') && xAxis.option('Grid')) {
            this.xGridRule = this._createGridRule(xAxis);
        }
        
        if(yAxis.option('Visible') && yAxis.option('Grid')) {
            this.yGridRule = this._createGridRule(yAxis);
        }
        
        this.base(layoutInfo);

        var plotFrameVisible;
        if(chart.compatVersion <= 1){
            plotFrameVisible = !!(xAxis.option('EndLine') || yAxis.option('EndLine'));
        } else {
            plotFrameVisible = def.get(chart.options, 'plotFrameVisible', true);
        }
            
        if(plotFrameVisible) {
            this.pvFrameBar = this._createFrame(layoutInfo, axes);
        }
            
        if(xAxis.scaleType !== 'discrete' && xAxis.option('ZeroLine')) {
            this.xZeroLine = this._createZeroLine(xAxis, layoutInfo);
        }

        if(yAxis.scaleType !== 'discrete' && yAxis.option('ZeroLine')) {
            this.yZeroLine = this._createZeroLine(yAxis, layoutInfo);
        }
    },
    
    _createGridRule: function(axis){
        var scale = axis.scale;
        if(scale.isNull){
            return;
        } 
        
        // Composite axis don't fill ticks
        var isDiscrete = axis.role.grouping.isDiscrete();
        var axisPanel  = this.chart.axesPanels[axis.id];
        var rootScene  = axisPanel._getRootScene();
        if(!rootScene){
            return;
        }
        
        var margins   = this._layoutInfo.gridMargins;
        var paddings  = this._layoutInfo.gridPaddings;
        
        var tick_a = axis.orientation === 'x' ? 'left' : 'bottom';
        var len_a  = this.anchorLength(tick_a);
        var obeg_a = this.anchorOrtho(tick_a);
        var oend_a = this.anchorOpposite(obeg_a);
        
        var tick_offset = margins[tick_a] + paddings[tick_a];
        
        var obeg = margins[obeg_a];
        var oend = margins[oend_a];
        
//      TODO: Implement GridCrossesMargin ...
//        var orthoAxis = this._getOrthoAxis(axis.type);
//        if(!orthoAxis.option('GridCrossesMargin')){
//            obeg += paddings[obeg_a];
//            oend += paddings[oend_a];
//        }
        
        var tickScenes = rootScene.leafs().array();
        var tickCount = tickScenes.length;
        if(isDiscrete && tickCount){
            // Grid rules are generated for MAJOR ticks only.
            // For discrete axes, each category
            // has a grid line at the beginning of the band,
            // and an extra end line in the last band
            tickScenes.push(tickScenes[tickCount - 1]);
        }
        
        var wrapper;
        if(this.compatVersion() <= 1){
            wrapper = function(v1f){
                return function(tickScene){
                    return v1f.call(this, tickScene.vars.tick.rawValue);
                };
            };
        }
        
        var pvGridRule = new pvc.visual.Rule(this, this.pvPanel, {
                extensionId: axis.extensionPrefixes.map(function(prefix){ return prefix + 'Grid'; }),
                wrapper:     wrapper
            })
            .lock('data', tickScenes)
            .lock(len_a, null)
            .override('defaultColor', function(){
                return pv.color("#f0f0f0");
            })
            .pvMark
            .lineWidth(1)
            .antialias(true)
            [obeg_a](obeg)
            [oend_a](oend)
            .zOrder(-12)
            ;
        
        if(isDiscrete){
            var halfStep = scale.range().step / 2;
            pvGridRule
                .lock(tick_a, function(tickScene){
                    var tickPosition = tick_offset + scale(tickScene.vars.tick.value);
                    
                    // Use **pvMark** index, cause the last two scenes report the same index.
                    var isLastLine = this.index === tickCount;
                    
                    return tickPosition + (isLastLine ? halfStep : -halfStep);
                })
                ;
        } else {
            pvGridRule
                .lock(tick_a, function(tickScene){
                    return tick_offset + scale(tickScene.vars.tick.value);
                });
        }
        
        return pvGridRule;
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
     * Grid:      -12
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
        
        // TODO: Implement GridCrossesMargin ...
        // Need to find the correct bounding box.
        // xScale(xScale.domain()[0]) -> xScale(xScale.domain()[1])
        // and
        // yScale(yScale.domain()[0]) -> yScale(yScale.domain()[1])
        var extensionIds = [];
        if(this.compatVersion() <= 1){
            extensionIds.push('xAxisEndLine');
            extensionIds.push('yAxisEndLine');
        }
        
        extensionIds.push('plotFrame');
        
        return new pvc.visual.Panel(this, this.pvPanel, {
                extensionId: extensionIds
            })
            .pvMark
            .lock('left',   left)
            .lock('right',  right)
            .lock('top',    top)
            .lock('bottom', bottom)
            .lock('fillStyle', null)
            .strokeStyle("#808285")
            .lineWidth(1)
            .antialias(false)
            .zOrder(-8)
            ;
    },
    
    _createZeroLine: function(axis, layoutInfo){
        var scale = axis.scale;
        if(!scale.isNull){
            var domain = scale.domain();
    
            // Domain crosses zero?
            if(domain[0] * domain[1] < -1e-12){
                // TODO: Implement GridCrossesMargin ...
                
                var a = axis.orientation === 'x' ? 'left' : 'bottom';
                var len_a  = this.anchorLength(a);
                var obeg_a = this.anchorOrtho(a);
                var oend_a = this.anchorOpposite(obeg_a);
                
                var margins = layoutInfo.gridMargins;
                var paddings = layoutInfo.gridPaddings;
                
                var zeroPosition = margins[a] + paddings[a] + scale(0);
                
                var obeg = margins[obeg_a];
                var oend = margins[oend_a];
                
                var rootScene = new pvc.visual.Scene(null, {
                        panel: this 
                    });
                
                return new pvc.visual.Rule(this, this.pvPanel, {
                        extensionId: axis.extensionPrefixes.map(function(prefix){ return prefix + 'ZeroLine'; })
                    })
                    .lock('data', [rootScene])
                    .lock(len_a,  null)
                    .lock(obeg_a, obeg)
                    .lock(oend_a, oend)
                    .lock(a,      zeroPosition)
                    .override('defaultColor', function(){
                        return pv.color("#808285");
                    })
                    .pvMark
                    .lineWidth(1)
                    .antialias(true)
                    .zOrder(-9)
                    ;
            }
        }
    },

    _getOrthoAxis: function(type){
        var orthoType = type === 'base' ? 'ortho' : 'base';
        return this.chart.axes[orthoType];
    },
    
    /*
     * @override
     */
    _getDatumsOnRect: function(datumMap, rect, keyArgs){
        // TODO: this is done for x and y axis only, which is ok for now,
        // as only discrete axes use selection and
        // multiple axis are only continuous...
        var chart = this.chart,
            xAxisPanel = chart.axesPanels.x,
            yAxisPanel = chart.axesPanels.y,
            xDatumMap,
            yDatumMap;

        //1) x axis
        if(xAxisPanel){
            xDatumMap = new def.Map();
            xAxisPanel._getDatumsOnRect(xDatumMap, rect, keyArgs);
            if(!xDatumMap.count) {
                xDatumMap = null;
            }
        }

        //2) y axis
        if(yAxisPanel){
            yDatumMap = new def.Map();
            yAxisPanel._getOwnDatumsOnRect(yDatumMap, rect, keyArgs);
            if(!yDatumMap.count) {
                yDatumMap = null;
            }
        }

        // Rubber band selects on both axes?
        if(xDatumMap && yDatumMap) {
            xDatumMap.intersect(yDatumMap, /* into */ datumMap);
            
            keyArgs.toggle = true;

            // Rubber band selects over any of the axes?
        } else if(xDatumMap) {
            datumMap.copy(xDatumMap);
        } else if(yDatumMap) {
            datumMap.copy(yDatumMap);
        } else {
            chart.plotPanelList.forEach(function(plotPanel){
                plotPanel._getDatumsOnRect(datumMap, rect, keyArgs);
            }, this);
        }
    }
});
