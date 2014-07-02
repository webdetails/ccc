/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pv_Mark:true, pvc_ValueLabelVar:true */

/*
 * Point panel.
 * Class that draws all line/dot/area combinations.
 * Specific options are:
 * <i>dotsVisible</i> - Show or hide dots. Default: true
 * <i>areasVisible</i> - Show or hide dots. Default: false
 * <i>linesVisible</i> - Show or hide dots. Default: true
 * <i>valuesVisible</i> - Show or hide line value. Default: false
 *
 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>line_</i> - for the actual line
 * <i>linePanel_</i> - for the panel where the lines sit
 * <i>lineDot_</i> - the dots on the line
 * <i>lineLabel_</i> - for the main line label
 */
def
.type('pvc.PointPanel', pvc.CategoricalAbstractPanel)
.init(function(chart, parent, plot, options) {

    this.base(chart, parent, plot, options);

    this.linesVisible  = plot.option('LinesVisible'); // TODO
    this.dotsVisible   = plot.option('DotsVisible' ); // TODO
    this.areasVisible  = plot.option('AreasVisible'); // TODO
    if(!this.linesVisible && !this.dotsVisible && !this.areasVisible) {
        this.linesVisible = true;
        plot.option.specify({'LinesVisible': true});
    }

    // Legacy fields
    if(!chart.scatterChartPanel) chart.scatterChartPanel = this;
})
.add({
    plotType: 'point',
    _ibits: -1, // reset

    pvLine: null,
    pvArea: null,
    pvDot: null,
    pvLabel: null,
    pvScatterPanel: null,

    _creating: function() {
        // Register legend prototype marks
        var colorDataCell = this.plot.dataCellsByRole.color[0];
        if(!colorDataCell.legendSymbolRenderer() && colorDataCell.legendVisible()) {
            var colorAxis  = this.axes.color,
                drawMarker = def.nullyTo(
                    colorAxis.option('LegendDrawMarker', /*noDefault*/true),
                    this.dotsVisible || this.areasVisible),
                drawLine   = !drawMarker ||
                    def.nullyTo(
                        colorAxis.option('LegendDrawLine', /*noDefault*/true),
                        this.linesVisible && !this.areasVisible),

                extAbsPrefix = pvc.uniqueExtensionAbsPrefix(),
                keyArgs   = {drawMarker: drawMarker, drawLine: drawLine, extensionPrefix: {abs: extAbsPrefix}};

            this.chart._processExtensionPointsIn(colorDataCell.role.legend(), extAbsPrefix);

            if(drawMarker) {
                var markerShape = colorAxis.option('LegendShape', true);

                if(this.dotsVisible) {
                    if(!markerShape) markerShape = 'circle'; // Dot's default shape

                    keyArgs.markerPvProto = new pv.Dot()
                        .lineWidth(1.5, pvc.extensionTag) // act as if it were a user extension
                        .shapeSize(12,  pvc.extensionTag); // idem
                } else {
                    keyArgs.markerPvProto = new pv_Mark();
                }

                keyArgs.markerShape = markerShape;

                if(this._applyV1BarSecondExtensions)
                    this.chart.extend(keyArgs.markerPvProto, 'barSecondDot', {constOnly: true});

                // Configure with constant extension points of "dot"
                this.extend(keyArgs.markerPvProto, 'dot', {constOnly: true});
            }

            if(drawLine) {
                keyArgs.rulePvProto = new pv.Line()
                    .lineWidth(1.5, pvc.extensionTag);

                if(this._applyV1BarSecondExtensions)
                    this.chart.extend(keyArgs.rulePvProto, 'barSecondLine', {constOnly: true});

                // Configure with constant extension points of "line"
                this.extend(keyArgs.rulePvProto, 'line', {constOnly: true});
            }

            colorDataCell.legendSymbolRenderer(keyArgs);
        }
    },

    /**
     * @override
     */
    _createCore: function() {
        this.base();

        var me = this,
            chart = this.chart,
            isStacked = this.stacked,
            dotsVisible  = this.dotsVisible,
            areasVisible = this.areasVisible,
            linesVisible = this.linesVisible,
            anchor = this.isOrientationVertical() ? "bottom" : "left",

            // ------------------
            // DATA
            baseAxis = this.axes.base,
            // Need to use the order that the axis uses.
            // Note that the axis may show data from multiple plots,
            //  and thus consider null datums inexistent in `data`,
            //  and thus have a different categories order.
            axisCategDatas = baseAxis.domainItems(),
            isBaseDiscrete = baseAxis.role.grouping.isDiscrete(),
            data = this.visibleData({ignoreNulls: false}), // shared "categ then series" grouped data
            rootScene = this._buildScene(data, axisCategDatas, isBaseDiscrete),
            wrapper;

        // ---------------
        // BUILD
        // -7 : when areas visible, this don't look good above the axes.
        // 1 : Above axes
        this.pvPanel.zOrder(areasVisible ? -7 : 1);

        this.pvScatterPanel = new pvc.visual.Panel(this, this.pvPanel, {extensionId: 'panel'})
            .lock('data', rootScene.childNodes)
            .pvMark;

        // -- AREA --
        var areaFillColorAlpha = areasVisible && linesVisible && !isStacked ? 0.5 : null;

        if(this.compatVersion() <= 1) {
            wrapper = isStacked
                ? function(v1f) {
                      return function(dotScene) {
                          return v1f.call(this, dotScene.vars.value.rawValue);
                      };
                  }
                : function(v1f) {
                      return function(dotScene) {
                          var d = {
                                category: dotScene.vars.category.rawValue,
                                value:    dotScene.vars.value.rawValue
                            },
                            // Compensate for the effect of intermediate scenes on mark's index
                            pseudo = Object.create(this);

                          pseudo.index = dotScene.dataIndex;
                          return v1f.call(pseudo, d);
                      };
                  };
        }

        var lineAreaVisibleProp = isBaseDiscrete && isStacked
                ? function(scene) { return !scene.isNull || scene.isIntermediate; }
                : function(scene) { return !scene.isNull;},

            isLineAreaNoSelect = /*dotsVisible && */chart.selectableByFocusWindow();

        this.pvArea = new pvc.visual.Area(this, this.pvScatterPanel, {
                extensionId: 'area',
                noTooltip:   false,
                wrapper:     wrapper,
                noSelect:    isLineAreaNoSelect,
                noRubberSelect: true, // Line is better for selection
                showsSelection: !isLineAreaNoSelect
            })
            // Data
            .lockMark('data', function(seriesScene) { return seriesScene.childNodes; }) // TODO

            // TODO: If it were allowed to hide the area, the anchored line would fail to evaluate
            // Do not use anchors to connect Area -> Line -> Dot ...
            .lockMark('visible', lineAreaVisibleProp)

            // Position & size
            .override('x',  function(scene) { return scene.basePosition;  }) // left
            .override('y',  function(scene) { return scene.orthoPosition; }) // bottom
            .override('dy', function(scene) { return chart.animate(0, scene.orthoLength); }) // height

            // Color & Line
            .override('color', function(scene, type) { return areasVisible ? this.base(scene, type) : null; })
            .override('baseColor', function(scene, type) {
                var color = this.base(scene, type);
                return (!this._finished && color && areaFillColorAlpha != null)
                    ? color.alpha(areaFillColorAlpha)
                    : color;
            })
            .override('dimColor', function(color, type) {
                return isStacked
                    ? pvc.toGrayScale(color, 1, null, null).brighter()
                    : this.base(color, type);
            })
            .lock('events', areasVisible ? 'painted' : 'none')
            .pvMark;

        // -- LINE --
        var dotsVisibleOnly = dotsVisible && !linesVisible && !areasVisible,
            // When areas are shown with no alpha (stacked),
            // make dots darker so they get distinguished from areas.
            darkerLineAndDotColor = isStacked && areasVisible,
            extensionIds = ['line'];

        if(this._applyV1BarSecondExtensions) extensionIds.push({abs: 'barSecondLine'});

        // Line.visible =
        // a) linesVisible
        //    or
        // b) (!linesVisible and) areasVisible
        //    and
        // b.1) discrete base and stacked
        //    and
        // b.1.1) not null or is an intermediate null
        // b.2) not null

        // NOTE: false or a function
        var lineVisibleProp = !dotsVisibleOnly && lineAreaVisibleProp,
            // When areasVisible && !linesVisible, lines are shown when active/activeSeries
            // and hidden if not. If lines that show/hide would react to events
            // they would steal events to the area and generate strange flicker-like effects.
            noLineInteraction = areasVisible && !linesVisible;

        this.pvLine = new pvc.visual.Line(
            this,
            this.pvArea.anchor(this.anchorOpposite(anchor)),
            {
                extensionId:    extensionIds,
                freePosition:   true,
                wrapper:        wrapper,
                noTooltip:      noLineInteraction,
                noDoubleClick:  noLineInteraction,
                noClick:        noLineInteraction,
                noHover:        noLineInteraction,
                noSelect:       noLineInteraction || isLineAreaNoSelect,
                showsSelection: !isLineAreaNoSelect
            })
            // TODO: If it were allowed to hide the line, the anchored dot would fail to evaluate
            .lockMark('visible', lineVisibleProp)
            .override('defaultColor', function(scene, type) {
                var color = this.base(scene, type);
                return (!this._finished && darkerLineAndDotColor && color)
                    ? color.darker(0.6)
                    : color;
            })
            .override('normalColor', function(scene, color/*, type*/) {
                return linesVisible ? color : null;
            })
            .override('interactiveColor', function(scene, color, type) {
                // When !linesVisible, keep them hidden if nothing is selected and it is not active
                return (!linesVisible && !this.mayShowAnySelected(scene) && !this.mayShowActive(scene))
                    ? null
                    : this.base(scene, color, type);
            })
            .override('baseStrokeWidth', function(scene) {
                var strokeWidth;
                if(linesVisible) strokeWidth = this.base(scene);
                return strokeWidth == null ? 1.5 : strokeWidth;
            })
            .intercept('strokeDasharray', function(scene) {
                var dashArray = this.delegateExtension();
                if(dashArray === undefined) {
                    var useDash = scene.isInterpolated;
                    if(!useDash) {
                        var next = scene.nextSibling;
                        useDash = next && next.isIntermediate && next.isInterpolated;
                        if(!useDash) {
                            var previous = scene.previousSibling;
                            useDash = previous  && scene.isIntermediate && previous.isInterpolated;
                        }
                    }
                    dashArray = useDash ? '. ' : null;
                }
                return dashArray;
            })
            .pvMark;

        // -- DOT --
        var showAloneDots = !(areasVisible && isBaseDiscrete && isStacked);

        extensionIds = ['dot'];

        if(this._applyV1BarSecondExtensions) extensionIds.push({abs: 'barSecondDot'});

        this.pvDot = new pvc.visual.Dot(this, this.pvLine, {
                extensionId:  extensionIds,
                freePosition: true,
                wrapper:      wrapper
            })
            .intercept('visible', function(scene) {
                return (!scene.isNull && !scene.isIntermediate /*&& !scene.isInterpolated*/) &&
                       this.delegateExtension(true);
            })
            .override('color', function(scene, type) {
                // Handle dotsVisible
                // Despite !dotsVisible,
                // show a dot anyway when:
                // 1) it is active, or
                // 2) it is single  (the only dot in its series and there's only one category) (and in areas+discreteCateg+stacked case)
                // 3) it is alone   (surrounded by null dots) (and not in areas+discreteCateg+stacked case)
                if(!dotsVisible) {
                    var visible = scene.isActive ||
                                  (!showAloneDots && scene.isSingle) ||
                                  (showAloneDots && scene.isAlone);
                    if(!visible) return pvc.invisibleFill;
                }

                // Normal logic
                var color = this.base(scene, type);

                // TODO: review interpolated style/visibility
                return (scene.isInterpolated && type === 'fill')
                    ? (color && pv.color(color).brighter(0.5))
                    : color;
            })
           // .override('interactiveColor', function(scene, color, type) {
           //   return scene.isInterpolated && type === 'stroke' ?
           //          color :
           //          this.base(scene, color, type);
           // })
           // .optionalMark('lineCap', 'round')
           // .intercept('strokeDasharray', function(scene) {
           //     var dashArray = this.delegateExtension();
           //     if(dashArray === undefined) {
           //         // TODO: review interpolated style/visibility
           //         dashArray = scene.isInterpolated ? '.' : null;
           //     }

           //     return dashArray;
           // })
            .override('defaultColor', function(scene, type) {
                var color = this.base(scene, type);
                return (!this._finished && darkerLineAndDotColor && color)
                    ? color.darker(0.6)
                    : color;
            })
            .override('baseSize', function(scene) {
                /* When not showing dots,
                 * but a datum is alone and
                 * wouldn't be visible using lines or areas,
                 * show the dot anyway,
                 * with a size = to the line's width^2
                 * (ideally, a line would show as a dot when only one point?)
                 */
                if(!dotsVisible) {
                    var visible = scene.isActive ||
                                  (!showAloneDots && scene.isSingle) ||
                                  (showAloneDots && scene.isAlone);

                    if(visible && !scene.isActive) {
                        // Obtain the line Width of the "sibling" line
                        var lineWidth = Math.max(me.pvLine.lineWidth(), 0.2) / 2;
                        return def.sqr(lineWidth);
                    }
                }

                // TODO: review interpolated style/visibility
                var v = this.base(scene);
                return scene.isInterpolated ? (0.8 * v) : v;
            })
            .pvMark;

        var label = pvc.visual.ValueLabel.maybeCreate(this, this.pvDot, {wrapper: wrapper});
        if(label) this.pvLabel = label.pvMark;
    },

    /**
     * Renders this.pvScatterPanel - the parent of the marks that are affected by interaction changes.
     * @override
     */
    renderInteractive: function() { this.pvScatterPanel.render(); },

    /* On each series, scenes for existing categories are interleaved with intermediate scenes.
     *
     * Protovis Dots are only shown for main (non-intermediate) scenes.
     *
     * The desired effect is that selecting a dot selects half of the
     * line on the left and half of the line on the right.
     *
     *  * main scene
     *  + intermediate scene
     *  - line that starts from the previous scene
     *
     *
     *        * - + - * - + - *
     *            [-------[
     *                ^ line extent of a dot
     *
     * Each segment of a Protovis segmented line starts from the initial point
     * till just before the next point.
     *
     * So, selecting a dot must select the the line that starts on the
     * main dot, but also the line that starts on the previous intermediate dot.
     *
     * If a main dot shares its datums (or group) with its preceding
     * intermediate dot, the selection will work like so.
     *
     * -------
     *
     * Another influencing concern is interpolation.
     *
     * The desired effect is that any two dots separated by a number of missing/null
     * categories get connected by linearly interpolating the missing values.
     * Moreover, the left half of the new line should be selected
     * when the left dot is selected and the right half of the new line
     * should be selected when the right dot is selected .
     *
     * In the discrete-base case, the "half of the line" point always coincides
     *  a) with the point of an existing category (when count of null categs is odd)
     *  or
     *  b) with an intermediate point added afterwards (when count of null categs is even).
     *
     *  a) Interpolate missing/null category in S1 (odd case)
     *  mid point ----v
     *  S1    * - + - 0 - + - * - + - *
     *  S2    * - + - * - + - * - + - *
     *  Data  A   A   B   B   B   B   C
     *
     *  a) Interpolate missing/null category in S1 (even case)
     *    mid point ------v
     *  S1    * - + - 0 - + - 0 - + - * - + - *
     *  S2    * - + - * - + - * - + - * - + - *
     *  Data  A   A   A   B   B   B   B
     *
     * In the continuous-base case,
     * the middle point between two non-null categories
     * separated by missing/null categories in between,
     * does not, in general, coincide with the position of an existing category...
     *
     * As such, interpolation may add new "main" points (to all the series),
     * and interpolation of one series leads to the interpolation
     * on a series that did not initially need interpolation...
     *
     * Interpolated dots to the left of the mid point are bound to
     * the left data and interpolated dots to the right and
     * including the mid point are bound to the right data.
     */

    _buildScene: function(data, axisCategDatas, isBaseDiscrete) {
        var rootScene  = new pvc.visual.Scene(null, {panel: this, source: data}),
            chart     = this.chart,
            serRole   = this.visualRoles.series,
            valueRole = this.visualRoles.value,
            isStacked = this.stacked,
            valueVarHelper = new pvc.visual.RoleVarHelper(rootScene, 'value', valueRole, {hasPercentSubVar: isStacked}),
            colorVarHelper = new pvc.visual.RoleVarHelper(rootScene, 'color', this.visualRoles.color),
            valueDimName  = valueRole.lastDimensionName(),
            valueDim = data.owner.dimensions(valueDimName),

            // TODO: There's no series axis...so something like what an axis would select must be repeated here.
            // Maintaining order requires basing the operation on a data with nulls still in it.
            // `data` may not have nulls anymore.
            axisSeriesData = serRole.isBound()
                ? serRole.flatten(
                    this.partData(),
                    {visible: true, isNull: chart.options.ignoreNulls ? false : null})
                : null,
            orthoScale = this.axes.ortho.scale,
            orthoNullValue = def.scope(function() {
                    // If the data does not cross the origin,
                    // Choose the value that's closer to 0.
                    var domain = orthoScale.domain(),
                        dmin = domain[0],
                        dmax = domain[1];
                    return (dmin * dmax >= 0)
                        // Both positive or both negative or either is zero
                        ? (dmin >= 0 ? dmin : dmax)
                        : 0;
                }),
            orthoZero = orthoScale(orthoNullValue/*0*/),
            sceneBaseScale = this.axes.base.sceneScale({sceneVarName: 'category'});

        // ----------------------------------
        // I   - Create series scenes array.
        // ----------------------------------
        (axisSeriesData ? axisSeriesData.children() : def.query([null])) // null series
        /* Create series scene */
        .each(function(axisSeriesData/*, seriesIndex*/) {
            var seriesScene = new pvc.visual.Scene(rootScene, {source: axisSeriesData || data});

            seriesScene.vars.series = pvc_ValueLabelVar.fromComplex(axisSeriesData);

            colorVarHelper.onNewScene(seriesScene, /* isLeaf */ false);

            // Create series-categ scene
            axisCategDatas.forEach(function(axisCategData, categIndex) {
                var categData = data.child(axisCategData.key),
                    group = categData;

                if(group && axisSeriesData) group = group.child(axisSeriesData.key);

                var serCatScene = new pvc.visual.Scene(seriesScene, {source: group});

                // -------------

                serCatScene.dataIndex = categIndex;
                serCatScene.vars.category = pvc_ValueLabelVar.fromComplex(categData);

                // -------------

                valueVarHelper.onNewScene(serCatScene, /* isLeaf */ true);

                var valueVar = serCatScene.vars.value,
                    value    = valueVar.value;

                // accumulated value, for stacked
                valueVar.accValue = value != null ? value : orthoNullValue;

                // -------------

                colorVarHelper.onNewScene(serCatScene, /* isLeaf */ true);

                // -------------
                // When ignoreNulls=false and nullInterpolatedMode!='none'
                // an interpolated datum may appear along a null datum...
                // Testing if the first datum is interpolated is thus not sufficient.
                var isInterpolated = group != null &&
                                     group.datums().prop('isInterpolated').any(def.truthy);
                //isInterpolatedMiddle = firstDatum.isInterpolatedMiddle;

                serCatScene.isInterpolated = isInterpolated;
                //serCatScene.isInterpolatedMiddle = isInterpolatedMiddle;

                // TODO: selection, owner Scene ?
                //if(scene.isInterpolated) {
                //    scene.ownerScene = toScene;
                //}

                // -------------

                serCatScene.isNull = value == null;
                serCatScene.isIntermediate = false;
            }, this);

        }, this);

        // reversed so that "below == before" w.r.t. stacked offset calculation
        // See {@link belowSeriesScenes2} variable.
        var reversedSeriesScenes = rootScene.children().reverse().array(),
            belowSeriesScenes2; // used below, by completeSeriesScenes

        // Update the scene tree to include intermediate leaf-scenes,
        // to help in the creation of lines and areas.
        reversedSeriesScenes.forEach(completeSeriesScenes, this);

        // Trim leading and trailing null scenes.
        reversedSeriesScenes.forEach(trimNullSeriesScenes, this);

        return rootScene;

        function completeSeriesScenes(seriesScene) {
            var seriesScenes2 = [],
                seriesScenes = seriesScene.childNodes,
                fromScene,
                notNullCount = 0,
                firstAloneScene = null;

            // As intermediate nodes are added,
            // seriesScene.childNodes array is changed.
            //
            // The var 'toChildIndex' takes inserts into account;
            // its value is always the index of 'toScene' in
            // seriesScene.childNodes.
            for(var c = 0, /* category index */
                    toChildIndex = 0,
                    categCount = seriesScenes.length ;
                c < categCount ;
                c++,
                toChildIndex++) {

                var toScene = seriesScenes[toChildIndex],
                    c2 = c * 2; /* doubled category index, for seriesScenes2  */

                seriesScenes2[c2] = toScene;

                /* Complete toScene */
                completeMainScene.call(this,
                        fromScene,
                        toScene,
                        /* belowScene */
                        belowSeriesScenes2 && belowSeriesScenes2[c2]);

                if(toScene.isAlone && !firstAloneScene) firstAloneScene = toScene;
                if(!toScene.isNull) notNullCount++;

                // Possibly create intermediate scene (between fromScene and toScene)
                if(fromScene) {
                    var interScene = createIntermediateScene.call(this,
                            seriesScene,
                            fromScene,
                            toScene,
                            toChildIndex,
                            /* belowScene */
                            belowSeriesScenes2 && belowSeriesScenes2[c2 - 1]);

                    if(interScene) {
                        seriesScenes2[c2 - 1] = interScene;
                        toChildIndex++;
                    }
                }

                // --------

                fromScene = toScene;
            }

            if(notNullCount === 1 && firstAloneScene && categCount === 1)
                firstAloneScene.isSingle = true;

            if(isStacked) belowSeriesScenes2 = seriesScenes2;
        }

        function completeMainScene(fromScene, toScene, belowScene) {

            var toAccValue = toScene.vars.value.accValue;

            if(belowScene) {
                if(toScene.isNull && !isBaseDiscrete) toAccValue = orthoNullValue;
                else toAccValue += belowScene.vars.value.accValue;

                toScene.vars.value.accValue = toAccValue;
            }

            toScene.basePosition  = sceneBaseScale(toScene);
            toScene.orthoPosition = orthoZero;
            toScene.orthoLength   = orthoScale(toAccValue) - orthoZero;

            var isNullFrom = (!fromScene || fromScene.isNull),
                isAlone    = isNullFrom && !toScene.isNull;
            if(isAlone) {
                // Confirm, looking ahead
                var nextScene = toScene.nextSibling;
                isAlone = !nextScene || nextScene.isNull;
            }

            toScene.isAlone  = isAlone;
            toScene.isSingle = false;
        }

        function createIntermediateScene(seriesScene, fromScene, toScene, toChildIndex, belowScene) {

            var interIsNull = fromScene.isNull || toScene.isNull;
            if(interIsNull && !this.areasVisible) return null;

            var interValue, interAccValue, interBasePosition;

            if(interIsNull) {
                /* Value is 0 or the below value */
                if(belowScene && isBaseDiscrete) {
                    var belowValueVar = belowScene.vars.value;
                    interAccValue = belowValueVar.accValue;
                    interValue = belowValueVar[valueRole.name];
                } else {
                    interValue = interAccValue = orthoNullValue;
                }

                if(isStacked && isBaseDiscrete) {
                    // The intermediate point is at the start of the "to" band
                    // don't use .band, cause it does not include margins...
                    interBasePosition = toScene.basePosition - (sceneBaseScale.range().step / 2);
                } else if(fromScene.isNull) { // Come from NULL
                    // Align directly below the (possibly) non-null dot
                    interBasePosition = toScene.basePosition;
                } else /*if(toScene.isNull) */{ // Go to NULL
                    // Align directly below the non-null from dot
                    interBasePosition = fromScene.basePosition;
                }
                // else {
                //     interBasePosition = (toScene.basePosition + fromScene.basePosition) / 2;
                // }
            } else {
                var fromValueVar = fromScene.vars.value,
                    toValueVar   = toScene.vars.value;

                interValue = (toValueVar.value + fromValueVar.value) / 2;

                // Average of the already offset values
                interAccValue     = (toValueVar.accValue  + fromValueVar.accValue ) / 2;
                interBasePosition = (toScene.basePosition + fromScene.basePosition) / 2;
            }

            //----------------

            var interScene = new pvc.visual.Scene(seriesScene, {
                    /* insert immediately before toScene */
                    index:  toChildIndex,
                    source: /*toScene.isInterpolatedMiddle ? fromScene.group: */toScene.source
                });

            interScene.dataIndex = toScene.dataIndex;
            interScene.vars.category = toScene.vars.category;

            var interValueVar = new pvc_ValueLabelVar(
                                    interValue,
                                    valueDim.format(interValue),
                                    interValue);

            interValueVar.accValue = interAccValue;

            interScene.vars.value = interValueVar;
            interScene.ownerScene     = toScene;
            interScene.isInterpolated = toScene.isInterpolated;
            interScene.isIntermediate = true;
            interScene.isSingle       = false;
            interScene.isNull         = interIsNull;
            interScene.isAlone        = interIsNull && toScene.isNull && fromScene.isNull;
            interScene.basePosition   = interBasePosition;
            interScene.orthoPosition  = orthoZero;
            interScene.orthoLength    = orthoScale(interAccValue) - orthoZero;

            colorVarHelper.onNewScene(interScene, /* isLeaf */ true);

            return interScene;
        }

        function trimNullSeriesScenes(seriesScene) {

            var seriesScenes = seriesScene.childNodes,
                L = seriesScenes.length;

            // from beginning
            var scene, siblingScene;
            while(L && (scene = seriesScenes[0]).isNull) {

                // Don't remove the intermediate dot before the 1st non-null dot
                siblingScene = scene.nextSibling;
                if(siblingScene && !siblingScene.isNull) break;

                seriesScene.removeAt(0);
                L--;
            }

            // from end
            while(L && (scene = seriesScenes[L - 1]).isNull) {

                // Don't remove the intermediate dot after the last non-null dot
                siblingScene = scene.previousSibling;
                if(siblingScene && !siblingScene.isNull) break;

                seriesScene.removeAt(L - 1);
                L--;
            }
        }
    }
});

pvc.PlotPanel.registerClass(pvc.PointPanel);
