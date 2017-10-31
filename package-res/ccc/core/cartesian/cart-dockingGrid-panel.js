/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def
.type('pvc.CartesianGridDockingPanel', pvc.GridDockingPanel)
.init(function(chart, parent, options) {
    this.base(chart, parent, options);

    this._plotBgPanel = new pvc.PlotBgPanel(chart, this);
})
.add({

    /** @override */
    _getFillSizeMin: function() {
        var plotSizeMin = !this.chart.parent ? this.chart.options.plotSizeMin : null;
        return plotSizeMin != null ? pvc_Size.to(plotSizeMin) : null;
    },

    /** @override */
    _createCore: function(layoutInfo) {
        var chart = this.chart,
            axes  = chart.axes,
            // TODO: find first bound axis of each orientation and use it
            xAxis = axes.x || axes.x2, // J.I.C.
            yAxis = axes.y || axes.y2;

        if(xAxis && !xAxis.isBound()) xAxis = null;
        if(yAxis && !yAxis.isBound()) yAxis = null;

        // Full grid lines
        if(xAxis && xAxis.option('Grid')) this.xGridRule = this._createGridRule(xAxis);
        if(yAxis && yAxis.option('Grid')) this.yGridRule = this._createGridRule(yAxis);

        this.base(layoutInfo);

        if(chart.focusWindow) this._createFocusWindow(layoutInfo);

        var plotFrameVisible = (chart.compatVersion() > 1)
            ? def.get(chart.options, 'plotFrameVisible', true)
            : !!(xAxis.option('EndLine') || yAxis.option('EndLine'));

        if(plotFrameVisible) this.pvFrameBar = this._createFrame(layoutInfo, axes);

        if(xAxis && xAxis.scaleType === 'numeric' && xAxis.option('ZeroLine'))
            this.xZeroLine = this._createZeroLine(xAxis, layoutInfo);

        if(yAxis && yAxis.scaleType === 'numeric' && yAxis.option('ZeroLine'))
            this.yZeroLine = this._createZeroLine(yAxis, layoutInfo);
    },

    _createGridRule: function(axis) {
        var scale = axis.scale;
        if(scale.isNull) return;

        // Composite axis don't fill ticks
        var isDiscrete = axis.role.grouping.isDiscrete(),
            rootScene  = this._getAxisGridRootScene(axis);
        if(!rootScene) return;

        var margins   = this._layoutInfo.gridMargins,
            paddings  = this._layoutInfo.gridPaddings,
            tick_a = axis.orientation === 'x' ? 'left' : 'bottom',
            len_a  = this.anchorLength(tick_a),
            obeg_a = this.anchorOrtho(tick_a),
            oend_a = this.anchorOpposite(obeg_a),
            mainPlot = this.chart.plotPanelList[0],
            tick_offset = axis.orientation === 'x'
                // mainPlot.isVisible ?
                ? ((mainPlot.position.left   || 0) + paddings.left  )
                : ((mainPlot.position.bottom || 0) + paddings.bottom), //margins[tick_a] + paddings[tick_a],
            obeg = margins[obeg_a],
            oend = margins[oend_a],
            tickScenes = rootScene.leafs().array(),
            tickCount = tickScenes.length,
            wrapper;

        //      TODO: Implement GridCrossesMargin ...
        //        var orthoAxis = this._getOrthoAxis(axis.type);
        //        if(!orthoAxis.option('GridCrossesMargin')) {
        //            obeg += paddings[obeg_a];
        //            oend += paddings[oend_a];
        //        }

        // Grid rules are generated for MAJOR ticks only.
        // For discrete axes, each category
        // has a grid line at the beginning of the band,
        // and an extra end line in the last band
        if(isDiscrete && tickCount) tickScenes.push(tickScenes[tickCount - 1]);

        if(this.compatVersion() <= 1) wrapper = function(v1f) {
            return function(tickScene) {
                return v1f.call(this, tickScene.vars.tick.rawValue);
            };
        };

        var pvGridRule = new pvc.visual.Rule(this, this.pvPanel, {
                extensionId: axis.extensionPrefixes.map(function(prefix) { return prefix + 'Grid'; }),
                wrapper:     wrapper
            })
            .lock('data', tickScenes)
            .lock(len_a, null)
            .override('defaultColor', def.fun.constant(pv.color("#f0f0f0")))
            .pvMark
            .antialias(true)
            [obeg_a](obeg)
            [oend_a](oend)
            .zOrder(-12)
            .events('none');

        if(isDiscrete) {
            // TODO: now that the grid rules' scenes are independent of the
            // axes scenes, we should not have to use the end scene twice.
            var halfStep = scale.range().step / 2;
            pvGridRule
                [tick_a](function(tickScene) {
                    var tickPosition = tick_offset + scale(tickScene.vars.tick.value);

                    // Use **pvMark** index, cause the last two scenes report the same index.
                    var isLastLine = this.index === tickCount;

                    return tickPosition + (isLastLine ? halfStep : -halfStep);
                });
        } else {
            pvGridRule
                [tick_a](function(tickScene) {
                    return tick_offset + scale(tickScene.vars.tick.value);
                });
        }

        return pvGridRule;
    },

    _getAxisGridRootScene: function(axis) {
        var isDiscrete = axis.isDiscrete(),
            data = isDiscrete ? axis.domainData() : this.data,
            rootScene = new pvc.visual.CartesianAxisRootScene(null, {
                    panel:  this,
                    source: data
                });

        if(isDiscrete) {
            // Grid-lines are drawn even for scenes
            // of hidden/grouped ticks.
            data.childNodes.forEach(function(tickData) {
                new pvc.visual.CartesianAxisTickScene(rootScene, {
                    source:    tickData,
                    tick:      tickData.value,
                    tickRaw:   tickData.rawValue,
                    tickLabel: tickData.label
                });
            });
        } else {
            // TODO: what sense does it make to show continuous ticks
            // when the axis panel is hidden? How much does each grid-line represent?
            // Only see this useful on a scenario where the step is obvious, implied, etc.

            // When the axis panel is visible, ticks will have been set in the axis.
            var ticks = axis.ticks || axis.calcContinuousTicks();

            ticks.forEach(function(majorTick, index) {
                new pvc.visual.CartesianAxisTickScene(rootScene, {
                    tick:      majorTick,
                    tickRaw:   majorTick,
                    tickLabel: axis.scale.tickFormat(majorTick, index)
                });
            }, this);
        }

        return rootScene;
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

    _createFrame: function(layoutInfo, axes) {
        if(axes.base.scale.isNull || (axes.ortho.scale.isNull && (!axes.ortho2 || axes.ortho2.scale.isNull)))
            return;

        var margins = layoutInfo.gridMargins,
            left   = margins.left,
            right  = margins.right,
            top    = margins.top,
            bottom = margins.bottom,
            extensionIds = [];

        if(this.compatVersion() <= 1) extensionIds.push('xAxisEndLine', 'yAxisEndLine');

        extensionIds.push('plotFrame');

        // TODO: Implement GridCrossesMargin ...
        // Need to find the correct bounding box.
        // xScale(xScale.domain()[0]) -> xScale(xScale.domain()[1])
        // and
        // yScale(yScale.domain()[0]) -> yScale(yScale.domain()[1])

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
            .zOrder(-8);
    },

    _createZeroLine: function(axis, layoutInfo) {
        var scale = axis.scale;
        if(!scale.isNull) {
            var domain = scale.domain();

            // Domain crosses zero?
            if(domain[0] * domain[1] < -1e-12) {
                // TODO: Implement GridCrossesMargin ...

                var a = axis.orientation === 'x' ? 'left' : 'bottom',
                    len_a  = this.anchorLength(a),
                    obeg_a = this.anchorOrtho(a),
                    oend_a = this.anchorOpposite(obeg_a),
                    margins = layoutInfo.gridMargins,
                    paddings = layoutInfo.gridPaddings,
                    zeroPosition = margins[a] + paddings[a] + scale(0),
                    obeg = margins[obeg_a],
                    oend = margins[oend_a],
                    rootScene = new pvc.visual.Scene(null, {panel: this});

                return new pvc.visual.Rule(this, this.pvPanel, {
                        extensionId: axis.extensionPrefixes.map(function(prefix) { return prefix + 'ZeroLine'; })
                    })
                    .lock('data', [rootScene])
                    .lock(len_a,  null)
                    .lock(obeg_a, obeg)
                    .lock(oend_a, oend)
                    .lock(a,      zeroPosition)
                    .override('defaultColor', def.fun.constant(pv.color("#666666")))
                    .pvMark
                    .events('none')
                    .lineWidth(1)
                    .antialias(true)
                    .zOrder(-9);
            }
        }
    },

    _createFocusWindow: function(layoutInfo) {
        var me = this,
            topRoot = me.topRoot,
            chart   = me.chart,
            focusWindow = chart.focusWindow.base,
            axis  = focusWindow.axis,
            scale = axis.scale;

        if(scale.isNull) return;

        var resizable  = focusWindow.option('Resizable'),
            movable    = focusWindow.option('Movable'  ),
            isDiscrete = axis.isDiscrete(),
            isV        = chart.isOrientationVertical(),
            a_left  = isV ? 'left' : 'top',
            a_top   = isV ? 'top' : 'left',
            a_width = me.anchorOrthoLength(a_left),
            a_right = me.anchorOpposite   (a_left),
            a_height= me.anchorOrthoLength(a_top),
            a_bottom= me.anchorOpposite   (a_top),
            a_x     = isV ? 'x' : 'y',
            a_dx    = 'd' + a_x,
            a_y     = isV ? 'y' : 'x',
            a_dy    = 'd' + a_y,
            margins    = layoutInfo.gridMargins,
            paddings   = layoutInfo.gridPaddings,
            space = {
                left:   margins.left   + paddings.left,
                right:  margins.right  + paddings.right,
                top:    margins.top    + paddings.top,
                bottom: margins.bottom + paddings.bottom
            },
            clientSize = layoutInfo.clientSize,
            wf = clientSize[a_width ],
            hf = clientSize[a_height];

        space.width  = space.left + space.right;
        space.height = space.top  + space.bottom;

        // Child plot's client size
        var w  = wf - space[a_width ],
            h  = hf - space[a_height],
            padLeft  = paddings[a_left ],
            padRight = paddings[a_right],

            scene = new pvc.visual.Scene(null, {panel: this}),

            // Initialize x,y,dx and dy properties from focusWindow
            band     = isDiscrete ? scale.range().step : 0,
            halfBand = band/2;

        scene[a_x] = scale(focusWindow.begin) - halfBand;

        // Add band for an inclusive discrete end
        scene[a_dx] = band + (scale(focusWindow.end) - halfBand) - scene[a_x];

        resetSceneY();

        function resetSceneY() {
            scene[a_y ] = 0 - paddings[a_top];
            scene[a_dy] = h + paddings[a_top] + paddings[a_bottom];
        }

        // -----------------

        function sceneProp(p) {
            return function() { return scene[p]; };
        }
        function boundLeft() {
            var begin = scene[a_x];
            return Math.max(0, Math.min(w, begin));
        }
        function boundWidth() {
            var begin = boundLeft();
            var end   = scene[a_x] + scene[a_dx];
            end = Math.max(0, Math.min(w, end));
            return end - begin;
        }
        function addSelBox(panel, id) {
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
            //.override('defaultStrokeWidth', function( ) { return 0; })
            .pvMark
            .lock('data')
            .lock('visible')
            .lock(a_left,  boundLeft )
            .lock(a_width, boundWidth)
            .lock(a_top,    sceneProp(a_y ))
            .lock(a_height, sceneProp(a_dy))
            .lock(a_bottom)
            .lock(a_right )
            .sign;
        }

        // BACKGROUND
        var baseBgPanel = this._plotBgPanel.pvPanel.borderPanel;
        baseBgPanel
            .lock('data', [scene]);

        if(movable && resizable) { // cannot activate resizable while we can't guarantee that it respects length
            // Allow creating a new focus area.
            // Works when "dragging" on the courtains area,
            // (if inside the paddings area).
            baseBgPanel.paddingPanel
                .events('all')
                .cursor('crosshair')
                .event('mousedown',
                      pv.Behavior.select()
                          .autoRender(false)
                          .collapse(isV ? 'y' : 'x')
                          .positionConstraint(function(drag) {
                              var op = drag.phase ==='start' ?
                                      'new' :
                                      'resize-end';
                              return positionConstraint(drag, op);
                          }))
                .event('selectstart', function() {
                    // reset the scene's orthogonal props
                    resetSceneY();

                    // Redraw on mouse down.
                    onDrag.apply(null, arguments);
                })
                .event('select',    onDrag)
                .event('selectend', onDrag);
        } else {
            baseBgPanel.paddingPanel
                .events('all');
        }

        // This panel serves mainly to enable dragging of the focus area,
        // and possibly, for bg coloring.
        // The drag action is only available when there aren't visual elements
        // in the front. This allows to keep elements interactive.
        var focusBg = addSelBox(baseBgPanel.paddingPanel, 'focusWindowBg')
            .override('defaultColor', def.fun.constant(pvc.invisibleFill))
            .pvMark;

        if(movable) {
            focusBg
                .events('all')
                .cursor('move')
                .event("mousedown",
                        pv.Behavior.drag()
                            .autoRender(false)
                            .collapse(isV ? 'y' : 'x')
                            .positionConstraint(function(drag) {
                                positionConstraint(drag, 'move');
                             }))
                .event("drag",    onDrag)
                .event("dragend", onDrag);
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
            .events(function() {
                var drag = scene.drag;
                return drag && drag.phase !== 'end' ? 'all' : 'none';
            })
            .cursor(function() {
                var drag = scene.drag;
                return drag && drag.phase !== 'end' ?
                        ((drag.type === 'drag' || (drag.type === 'select' && !resizable)) ?
                         'move' :
                         (isV ? 'ew-resize' : 'ns-resize')) : null;
            })
            .antialias(false);

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
            .override('defaultColor', function(scene, type) {
                return type === 'stroke' ? null : curtainFillColor;
            })
            .pvMark
            .lock('data', [scene, scene])
            .lock('visible')
            .events('none')
            .lock(a_left,   function() { return !this.index ? -padLeft : boundLeft() + boundWidth(); })
            .lock(a_right,  function() { return !this.index ? null     : -padRight; })
            .lock(a_width,  function() { return !this.index ?  padLeft + boundLeft() : null; })
            .lock(a_top,    sceneProp(a_y ))
            .lock(a_height, sceneProp(a_dy))
            .lock(a_bottom);

        // FG FOCUS BOX
        // for coloring and anchoring
        var selectBoxFg = addSelBox(baseFgPanel, 'focusWindow')
            .override('defaultColor', def.fun.constant(null))
            .pvMark
            .events('none');

        // FG BOUNDARY/RESIZE GRIP
        var addResizeSideGrip = function(side) {
            // TODO: reversed scale??
            var a_begin = (side === 'left' || side === 'top') ? 'begin' : 'end',
                opposite  = me.anchorOpposite(side),
                fillColor = 'linear-gradient(to ' + opposite + ', ' + curtainFillColor + ', #444 90%)',
                grip = new pvc.visual.Bar(me, selectBoxFg.anchor(side), {
                        extensionId:   focusWindow.id + 'Grip' + def.firstUpperCase(a_begin),
                        normalStroke:  true,
                        noHover:       true,
                        noSelect:      true,
                        noClick:       true,
                        noDoubleClick: true,
                        noTooltip:     true,
                        showsInteraction: false
                    })
                    .override('defaultColor', function(scene, type) {
                        return type === 'stroke' ? null : fillColor;
                    })
                    .pvMark
                    .lock('data')
                    .lock('visible')
                    [a_top   ](scene[a_y ])
                    [a_height](scene[a_dy]);

            if(resizable) {
                var opId = 'resize-' + a_begin;
                grip
                    .events('all')
                    [a_width](5)
                    .cursor(isV ? 'ew-resize' : 'ns-resize')
                    .event("mousedown",
                        pv.Behavior.resize(side)
                            .autoRender(false)
                            .positionConstraint(function(drag) {
                                positionConstraint(drag, opId);
                             })
                            .preserveOrtho(true))
                    .event("resize",    onDrag)
                    .event("resizeend", onDrag);
            } else {
                grip
                    .events('none')
                    [a_width](1);
            }

            return grip;
        };

        addResizeSideGrip(a_left );
        addResizeSideGrip(a_right);

        // --------------------

        function onDrag() {
            var ev = arguments[arguments.length - 1],
                isEnd = ev.drag.phase === 'end';

            // Prevent tooltips and hovers
            topRoot._selectingByRubberband = !isEnd;

            baseBgPanel.render();
            baseFgPanel.render();


            var pbeg = scene[a_x],
                pend = scene[a_x] + scene[a_dx];
            if(!isV) {
                // from bottom, instead of top...
                var temp = w - pbeg;
                pbeg = w - pend;
                pend = temp;
            }

            focusWindow._updatePosition(pbeg, pend, /*select*/ isEnd, /*render*/ true);
        }

        // ----------------

        var a_p = a_x, a_dp = a_dx;

        function positionConstraint(drag, op) {
            // Never called on drag.phase === 'end'
            var m = drag.m,
                // Only constraining the base position
                p = m[a_p],
                l,
                l0 = scene[a_dp],
                target;

            switch(op) {
                case 'new':
                    l = 0;
                    target = 'begin';
                    break;

                case 'resize-begin':
                    l = (scene[a_p] + l0) - p;
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

            var min = drag.min[a_p],
                max = drag.max[a_p],
                oper = {
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
            switch(op) {
                case 'new':
                    // Handled by the Select behavior
                    if(oper.length !== l) drag[a_dp + 'min'] = l = oper.length;
                    break;

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

    /*
     * @override
     */
    _getDatumsOnRect: function(datumMap, rect, keyArgs) {
        // TODO: this is done for x and y axis only, which is ok for now,
        // as only discrete axes use selection and
        // multiple axis are only continuous...
        var chart = this.chart,
            xAxisPanel = chart.axesPanels.x,
            yAxisPanel = chart.axesPanels.y,
            xDatumMap,
            yDatumMap;

        //1) x axis
        if(xAxisPanel) {
            xDatumMap = new def.Map();
            xAxisPanel._getDatumsOnRect(xDatumMap, rect, keyArgs);
            if(!xDatumMap.count) xDatumMap = null;
        }

        //2) y axis
        if(yAxisPanel) {
            yDatumMap = new def.Map();
            yAxisPanel._getOwnDatumsOnRect(yDatumMap, rect, keyArgs);
            if(!yDatumMap.count) yDatumMap = null;
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
            chart.plotPanelList.forEach(function(plotPanel) {
                plotPanel._getDatumsOnRect(datumMap, rect, keyArgs);
            }, this);
        }
    }
});
