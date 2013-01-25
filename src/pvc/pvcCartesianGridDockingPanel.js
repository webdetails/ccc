
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
        
        // Plots Bg panel, below grid lines and every plot panel
        
        
        // Full grid lines
        if(xAxis.option('Visible') && xAxis.option('Grid')) {
            this.xGridRule = this._createGridRule(xAxis);
        }
        
        if(yAxis.option('Visible') && yAxis.option('Grid')) {
            this.yGridRule = this._createGridRule(yAxis);
        }
        
        this.base(layoutInfo);
        
        // TODO: these pv.renderer tests must be centralized. batik simply should disable selection as a whole.
        if(pv.renderer() !== 'batik' && chart._canSelectWithFocusWindow()){
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
        var axis    = chart.axes.base;
        var scale   = axis.scale;
        if(scale.isNull){
            return;
        }
        
        var focusWindow = axis.initFocusWindow();
        
        var resizable  = !!axis.option('FocusWindowResizable');
        var movable    = !!axis.option('FocusWindowMovable');
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
        
        var margins    = layoutInfo.gridMargins;
        var clientSize = layoutInfo.clientSize;
        
        var w = clientSize[a_width]  - margins[a_left  ] - margins[a_right];
        var h = clientSize[a_height] - margins[a_bottom] - margins[a_top  ];
        
        // -----------------
        
        var scene = new pvc.visual.Scene(null, {panel: this});
        
        // Initialize x,y,dx and dy properties from focusWindow
        var band     = isDiscrete ? scale.range().step : 0;
        var halfBand = band/2;
        
        scene[a_x]  = scale(focusWindow.begin) - halfBand,
        
        // Add band for an inclusive discrete end
        scene[a_dx] = band + (scale(focusWindow.end) - halfBand) - scene[a_x],
        
        scene[a_y]  = 0,
        scene[a_dy] = h;
        
        // -----------------
        
        var addPanel = function(zOrder, id){
            // Parent panel of selection boxes installs a coordinate system
            // like that of the plots.
            // X and Y scales can be used on this.
            return new pvc.visual.Panel(me, me.pvPanel, {
                    extensionId: id
                })
                .pvMark
                .lock('data',   [scene])
                .lock('left',   margins.left)
                .lock('right',  margins.right)
                .lock('top',    margins.top)
                .lock('bottom', margins.bottom)
                .lock('zOrder', zOrder)
                .antialias(false)
                .sign
                ;
        };
        
        var sceneProp = function(p){
            return function(){ return scene[p]; };
        };
        
        var addSelBox = function(panel, id){
            return new pvc.visual.Bar(me, panel, {
                extensionId:   id,
                normalStroke:  true,
                noHover:       true,
                noSelect:      true,
                noClick:       true,
                noDoubleClick: true,
                noTooltip:     true
            })
            .override('interactiveColor', def.identity)
            .pvMark
            .lock('data')
            .lock('visible')
            .lock(a_left,   sceneProp(a_x ))
            .lock(a_width,  sceneProp(a_dx))
            .lock(a_top,    sceneProp(a_y ))
            .lock(a_height, sceneProp(a_dy))
            .lock(a_bottom)
            .lock(a_right )
            .sign
            ;
        };
        
        var createNoIntBarSign = function(panel, id){
            return new pvc.visual.Bar(me, panel, {
                extensionId:   id,
                normalStroke:  true,
                noHover:       true,
                noSelect:      true,
                noClick:       true,
                noDoubleClick: true,
                noTooltip:     true
            })
            .override('interactiveColor', def.identity)
            ;
        };
        
        // BACKGROUND
        var baseBgPanel = addPanel(-13, 'plotBg') // below grid rules
                .pvMark
                ;
        
        if(movable && resizable){
            baseBgPanel
                .lock('events', 'all')
                .lock('cursor', 'crosshair')
                .event('mousedown', 
                      pv.Behavior.select()
                          .autoRender(false)
                          .positionConstraint(function(drag){
                              //var op = drag.phase === 'end' ? 'resize-end' : 'move';
                              return positionConstraint(drag, 'resize-end');
                          })
                          .collapse(isV ? 'y' : 'x'))
                .event('selectstart', function(){
                    // fix the scene's orthogonal props
                    scene[a_y ] = 0;
                    scene[a_dy] = h;
                })
                .event('select',    onDrag)
                .event('selectend', onDrag)
                ;
        } else {
            baseBgPanel
                .events('all');
        }
        
        // This panel is placed on the focus area in the BG
        // and serves mainly to enable dragging of the focus area
        var focusBg = addSelBox(baseBgPanel, 'focusWindowBg')
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
                            .positionConstraint(function(drag){
                                return positionConstraint(drag, 'move');
                             }))
                .event("drag",      onDrag)
                .event("dragend",   onDrag)
                ;
        } else {
            focusBg.events('none');
        }
        
        // FOREGROUND
        var baseFgPanel = addPanel(10) // above axis rules
            .pvMark 
            .lock('fillStyle', pvc.invisibleFill)
            .lock('events', function(){
                // Start capturing all events as the drag starts.
                // This allows us to show a steady cursor.
                // The drag lives because it listens to root's mousemove/up
                // and we're not cancelling the events
                var drag = scene.drag;
                return drag && drag.phase !== 'end' ? 'all' : 'none';
            })
            .lock('cursor', function(){
                var drag = scene.drag;
                return drag && drag.phase !== 'end' ? 
                        (drag.type === 'drag' ? 'move' : 
                           (isV ? 'ew-resize' : 'ns-resize')) : null;
            })
            ;
        
        // LEFT and RIGHT FG COURTAIN
        createNoIntBarSign(baseFgPanel, 'focusWindowCourtain')
            .override('defaultColor', function(type){
                return type === 'stroke' ? null : 'rgba(20, 20, 20, 0.1)';
            })
            .pvMark
            .lock('data', [scene, scene])
            .lock('visible')
            .lock(a_left,   function(){ return !this.index ? 0          : scene[a_x] + scene[a_dx]; })
            .lock(a_right,  function(){ return !this.index ? null       : 0;    })
            .lock(a_width,  function(){ return !this.index ? scene[a_x] : null; })
            .lock(a_top,    function(){ return scene[a_y ]; })
            .lock(a_height, function(){ return scene[a_dy]; })
            .lock(a_bottom)
            //.fillStyle(pvc.invisibleFill) // IE must have a fill style to fire events
            .lock('events', 'none')
            ;
        
        // Foreground Focus Box
        // For coloring and anchoring
        var selectBoxFg = addSelBox(baseFgPanel, 'focusWindow')
            .override('defaultColor', function(type){ return null; })
            .pvMark
            .lock('events', 'none')
            ;
        
        var addResizeSideGrip = function(side){
            
            var grip = selectBoxFg.anchor(side).add(pv.Bar)
                .fillStyle("#999")
                [a_top](0)
                ;
            
            if(resizable){
                // TODO: this does not take into account if the scale is reversed...
                var isBegin = side === 'left' || side === 'top';
                var opId = 'resize-' + (isBegin ? 'begin' : 'end');
                grip
                    //[a_left ](function(){ return this.delegate() - 3; })
                    [a_width](function(){ return this.instance().dragging ? 6 : 3; })
                    .lock('events', 'all')
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
                    //[a_left ](function(){ return this.delegate() - 1; })
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
            if(!isEnd){
                topRoot._isRubberBandSelecting = true;
            } else {
                topRoot._isRubberBandSelecting = false;
            }
            
            var rb = new pv.Shape.Rect(scene.x, scene.y, scene.dx, scene.dy);
            var toScreen = baseFgPanel.toScreenTransform();
            rb = rb.apply(toScreen);
            
            baseBgPanel.render();
            baseFgPanel.render();
            
            // Replace selection
            if(isEnd){
                // Update focusWindow
                if(isDiscrete){
                    var begIndex = scale.invertIndex(scene[a_x]);
                    var endIndex = scale.invertIndex(scene[a_x] + scene[a_dx]) - 1;
                    var domain = scale.domain();
                    focusWindow.begin = domain[begIndex];
                    focusWindow.end   = domain[endIndex];
                    focusWindow.length= endIndex - begIndex + 1;
                } else {
                    var beg = scale.invert(scene[a_x]);
                    var end = scale.invert(scene[a_x] + scene[a_dx]);
                    focusWindow.begin = beg;
                    focusWindow.end   = end;
                    focusWindow.length= end - beg;
                }
                
                topRoot._processRubberBand(rb, ev, {allowAdditive: false, markSelectionMode: 'center'});
            }
        }
        
        
        // ----------------
        var contCast   = !isDiscrete ? axis.role.firstDimensionType().cast : null;
        var userPositionConstraint = !isDiscrete ? axis.option('FocusWindowConstraint') : null;
        var a_p  = a_x;
        var a_dp = a_dx;
        
        function positionConstraint(drag, op){
            var m = drag.m;
            
            // Only constraining the base position
            var p = m[a_p];
            
            if(isDiscrete){
                // Align to category boundaries
                var index = scale.invertIndex(p);
                if(index >= 0){
                    var r = scale.range();
                    var S = (r.max - r.min) / scale.domain().length;
                    p = index * S;
                } //  else no domain points...
            } else if(userPositionConstraint){
                var v = contCast(scale.invert(p));
                v = userPositionConstraint(v, op);
                if(v != null){
                    p = scale(v);
                }
            }
            
            m[a_p] = p;
            
            positionConstraintNoSwitchSides(m, op);
            
            return m;
        }
        
        // Don't let the grips switch sides
        function positionConstraintNoSwitchSides(m, op){
            var p = m[a_p];
            switch(op){
                case 'resize-begin':
                    var pright = scene[a_p] + scene[a_dp];
                    if(m[a_p] > pright){
                        m[a_p] = pright;
                    }
                    break;
                    
                case 'resize-end':
                    var pleft = scene[a_p];
                    if(pleft > m[a_p]){
                        m[a_p] = pleft;
                    }
                    break;
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
