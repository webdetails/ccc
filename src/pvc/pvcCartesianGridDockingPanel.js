
def
.type('pvc.CartesianGridDockingPanel', pvc.GridDockingPanel)
.init(function(chart, parent, options) {
    this.base(chart, parent, options);
    
    this._plotBgPanel = new pvc.PlotBgPanel(chart, this);
})
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
        
        if(chart.focusWindow){
            this._createFocusWindow(layoutInfo);
        }
        
        var plotFrameVisible;
        if(chart.compatVersion() <= 1){
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
            .events('none')
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
            .events('none')
            .strokeStyle("#666666")
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
                        return pv.color("#666666");
                    })
                    .pvMark
                    .events('none')
                    .lineWidth(1)
                    .antialias(true)
                    .zOrder(-9)
                    ;
            }
        }
    },
    
    _createFocusWindow: function(layoutInfo){
        var me = this;
        var topRoot = me.topRoot;
        var chart   = me.chart;
        
        var focusWindow = chart.focusWindow.base;
        
        var axis  = focusWindow.axis;
        var scale = axis.scale;
        if(scale.isNull){
            return;
        }
        
        var resizable  = focusWindow.option('Resizable');
        var movable    = focusWindow.option('Movable'  );
        var isDiscrete = axis.isDiscrete();
        
        var isV     = chart.isOrientationVertical();
        var a_left  = isV ? 'left' : 'top';
        var a_top   = isV ? 'top' : 'left';
        var a_width = me.anchorOrthoLength(a_left);
        var a_right = me.anchorOpposite(a_left);
        var a_height= me.anchorOrthoLength(a_top);
        var a_bottom= me.anchorOpposite(a_top);
        var a_x     = isV ? 'x' : 'y';
        var a_dx    = 'd' + a_x;
        var a_y     = isV ? 'y' : 'x';
        var a_dy    = 'd' + a_y;
        
        var margins     = layoutInfo.gridMargins;
        var paddings    = layoutInfo.gridPaddings;
        
        var space = {
            left:   margins.left   + paddings.left,
            right:  margins.right  + paddings.right,
            top:    margins.top    + paddings.top,
            bottom: margins.bottom + paddings.bottom
        };
        
        space.width  = space.left + space.right;
        space.height = space.top  + space.bottom;
        
        var clientSize = layoutInfo.clientSize;
        
        var wf = clientSize[a_width ];
        var hf = clientSize[a_height];
        
        // Child plot's client size
        var w  = wf - space[a_width ];
        var h  = hf - space[a_height];
        
        var padLeft  = paddings[a_left ];
        var padRight = paddings[a_right];
        
        // -----------------
        
        var scene = new pvc.visual.Scene(null, {panel: this});
        
        // Initialize x,y,dx and dy properties from focusWindow
        var band     = isDiscrete ? scale.range().step : 0;
        var halfBand = band/2;
        
        scene[a_x] = scale(focusWindow.begin) - halfBand,
        
        // Add band for an inclusive discrete end
        scene[a_dx] = band + (scale(focusWindow.end) - halfBand) - scene[a_x],
        
        resetSceneY();
        
        function resetSceneY(){
            scene[a_y ] = 0 - paddings[a_top   ];
            scene[a_dy] = h + paddings[a_top] + paddings[a_bottom];
        }
        
        // -----------------
        
        var sceneProp = function(p){
            return function(){ return scene[p]; };
        };
        
        var boundLeft = function(){
            var begin = scene[a_x];
            return Math.max(0, Math.min(w, begin));
        };

        var boundWidth = function(){
            var begin = boundLeft();
            var end   = scene[a_x] + scene[a_dx];
            end = Math.max(0, Math.min(w, end));
            return end - begin;
        };
            
        var addSelBox = function(panel, id){
            return new pvc.visual.Bar(me, panel, {
                extensionId:   id,
                normalStroke:  true,
                noHover:       true,
                noSelect:      true,
                noClick:       true,
                noDoubleClick: true,
                noTooltip:     true,
                showsInteraction: false
            })
            //.override('defaultStrokeWidth', function( ){ return 0; })
            .pvMark
            .lock('data')
            .lock('visible')
            .lock(a_left,  boundLeft )
            .lock(a_width, boundWidth)
            .lock(a_top,    sceneProp(a_y ))
            .lock(a_height, sceneProp(a_dy))
            .lock(a_bottom)
            .lock(a_right )
            .sign
            ;
        };
        
        // BACKGROUND
        var baseBgPanel = this._plotBgPanel.pvPanel.borderPanel;
        baseBgPanel
            .lock('data', [scene])
            ;
        
        if(movable && resizable){ // cannot activate resizable while we can't guarantee that it respects length
            // Allow creating a new focus area.
            // Works when "dragging" on the courtains area,
            // (if inside the paddings area).
            baseBgPanel.paddingPanel
                .lock('events', 'all')
                .lock('cursor', 'crosshair')
                .event('mousedown',
                      pv.Behavior.select()
                          .autoRender(false)
                          .collapse(isV ? 'y' : 'x')
                          //.preserveLength(!resizable)
                          .positionConstraint(function(drag){
                              var op = drag.phase ==='start' ? 
                                      'new' : 
                                      'resize-end';
                              return positionConstraint(drag, op);
                          }))
                .event('selectstart', function(ev){
                    // reset the scene's orthogonal props
                    resetSceneY();
                    
                    // Redraw on mouse down.
                    onDrag(ev);
                })
                .event('select',    onDrag)
                .event('selectend', onDrag)
                ;
        } else {
            baseBgPanel.paddingPanel
                .events('all')
                ;
        }
        
        // This panel serves mainly to enable dragging of the focus area,
        // and possibly, for bg coloring.
        // The drag action is only available when there aren't visual elements
        // in the front. This allows to keep elements interactive.
        var focusBg = addSelBox(baseBgPanel.paddingPanel, 'focusWindowBg')
            .override('defaultColor', function(type){ 
                return pvc.invisibleFill;
            })
            .pvMark
            ;
        
        if(movable){
            focusBg
                .lock('events', 'all' )
                .lock('cursor', 'move')
                .event("mousedown", 
                        pv.Behavior.drag()
                            .autoRender(false)
                            .collapse(isV ? 'y' : 'x')
                            .positionConstraint(function(drag){
                                positionConstraint(drag, 'move');
                             }))
                .event("drag",    onDrag)
                .event("dragend", onDrag)
                ;
        } else {
            focusBg.events('none');
        }
        
        // --------------------------------------
        // FOREGROUND
        
        // Coordinate system like that of the plots.
        // X and Y scales can be used on this.
        var baseFgPanel = new pvc.visual.Panel(me, me.pvPanel)
            .pvMark
            .lock('data', [scene])
            .lock('visible')
            .lock('fillStyle', pvc.invisibleFill)
            .lock('left',      space.left  )
            .lock('right',     space.right )
            .lock('top',       space.top   )
            .lock('bottom',    space.bottom)
            .lock('zOrder',    10) // above axis rules
            /* Use the panel to show a steady cursor while moving/resizing,
             * by receiving all events.
             * The drag continues to live because it listens to the 
             * root's mousemove/up and we're not cancelling the events.
             * Visual elements do not receive the events because
             * they're in a sibling panel.
             */
            .lock('events', function(){
                var drag = scene.drag;
                return drag && drag.phase !== 'end' ? 'all' : 'none';
            })
            .lock('cursor', function(){
                var drag = scene.drag;
                return drag && drag.phase !== 'end' ? 
                        ((drag.type === 'drag' || (drag.type === 'select' && !resizable)) ? 
                         'move' :
                         (isV ? 'ew-resize' : 'ns-resize')) : null;
            })
            .antialias(false)
            ;
        
        // FG BASE CURTAIN
        var curtainFillColor = 'rgba(20, 20, 20, 0.1)';
        
        new pvc.visual.Bar(me, baseFgPanel, {
                extensionId:   'focusWindowBaseCurtain',
                normalStroke:  true,
                noHover:       true,
                noSelect:      true,
                noClick:       true,
                noDoubleClick: true,
                noTooltip:     true,
                showsInteraction: false
            })
            .override('defaultColor', function(type){
                return type === 'stroke' ? null : curtainFillColor; 
            })
            .pvMark
            .lock('data', [scene, scene])
            .lock('visible')
            .lock('events', 'none')
            .lock(a_left,   function(){ return !this.index ? -padLeft : boundLeft() + boundWidth(); })
            .lock(a_right,  function(){ return !this.index ? null     : -padRight; })
            .lock(a_width,  function(){ return !this.index ?  padLeft + boundLeft() : null; })
            .lock(a_top,    sceneProp(a_y ))
            .lock(a_height, sceneProp(a_dy))
            .lock(a_bottom)
            ;
        
        // FG FOCUS BOX
        // for coloring and anchoring
        var selectBoxFg = addSelBox(baseFgPanel, 'focusWindow')
            .override('defaultColor', function(type){ return null; })
            .pvMark
            .lock('events', 'none')
            ;
        
        // FG BOUNDARY/RESIZE GRIP
        var addResizeSideGrip = function(side){
            // TODO: reversed scale??
            var a_begin = (side === 'left' || side === 'top') ? 'begin' : 'end';
            
            var opposite  = me.anchorOpposite(side);
            var fillColor = 'linear-gradient(to ' + opposite + ', ' + curtainFillColor + ', #444 90%)';
            var grip = new pvc.visual.Bar(me, selectBoxFg.anchor(side), {
                    extensionId:   focusWindow.id + 'Grip' + def.firstUpperCase(a_begin),
                    normalStroke:  true,
                    noHover:       true,
                    noSelect:      true,
                    noClick:       true,
                    noDoubleClick: true,
                    noTooltip:     true,
                    showsInteraction: false
                })
                .override('defaultColor', function(type){
                    return type === 'stroke' ? null : fillColor;
                })
                .pvMark
                .lock('data')
                .lock('visible')
                [a_top   ](scene[a_y ])
                [a_height](scene[a_dy])
                ;
            
            if(resizable){
                var opId = 'resize-' + a_begin;
                grip
                    .lock('events', 'all')
                    [a_width](5)
                    .cursor(isV ? 'ew-resize' : 'ns-resize')
                    .event("mousedown", 
                        pv.Behavior.resize(side)
                            .autoRender(false)
                            .positionConstraint(function(drag){
                                positionConstraint(drag, opId);
                             })
                            .preserveOrtho(true))
                    .event("resize",    onDrag)
                    .event("resizeend", onDrag)
                    ;
            } else {
                grip
                    .events('none')
                    [a_width](1)
                    ;
            }
            
            return grip;
        };
            
        addResizeSideGrip(a_left );
        addResizeSideGrip(a_right);
        
        // --------------------
        
        function onDrag(){
            var ev = arguments[arguments.length - 1];
            var isEnd = ev.drag.phase === 'end';
            
            // Prevent tooltips and hovers
            topRoot._isRubberBandSelecting = !isEnd;
            
            baseBgPanel.render();
            baseFgPanel.render();
            
            
            var pbeg = scene[a_x];
            var pend = scene[a_x] + scene[a_dx];
            if(!isV){
                // from bottom, instead of top...
                var temp = w - pbeg;
                pbeg = w - pend;
                pend = temp;
            }
            
            focusWindow._updatePosition(pbeg, pend, /*select*/ isEnd, /*render*/ true);
        }
        
        // ----------------
        var a_p  = a_x;
        var a_dp = a_dx;
        
        function positionConstraint(drag, op){
            // Never called on drag.phase === 'end'
            var m = drag.m;
            
            // Only constraining the base position
            var p = m[a_p];
            var b, e, l;
            var l0 = scene[a_dp];
            
            var target;
            switch(op){
                case 'new':
                    l = 0;
                    target = 'begin';
                    break;
                
                case 'resize-begin':
                    l = l0;
                    target = 'begin';
                    break;
                    
                case 'move':
                    l = l0;
                    target = 'begin';
                    break;
                
                case 'resize-end': // use on Select and Resize
                    l = p - scene[a_p];
                    target = 'end';
                    break;
            }
            
            var min = drag.min[a_p];
            var max = drag.max[a_p];
            
            var oper = {
                type:    op,
                target:  target,
                point:   p,
                length:  l,  // new length
                length0: l0, // prev length
                min:     min,
                max:     max,
                minView: 0,
                maxView: w
            };
            
            focusWindow._constraintPosition(oper);
            
            // Sync
            m[a_p] = oper.point;
            
            // TODO: not working on horizontal orientation???
            // Overwrite min or max on resize
            switch(op){
                case 'resize-begin':
                    // The maximum position is the end grip
                    oper.max = Math.min(oper.max, scene[a_p] + scene[a_dp]);
                    break;
                    
                case 'resize-end':
                    // The minimum position is the begin grip
                    oper.min = Math.max(oper.min, scene[a_p]);
                    break;
            }
            
            drag.min[a_p] = oper.min;
            drag.max[a_p] = oper.max;
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
