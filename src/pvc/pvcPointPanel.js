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
    if(!this.linesVisible && !this.dotsVisible && !this.areasVisible){
        this.linesVisible = true;
        plot.option.specify({'LinesVisible': true});
    }
})
.add({
    pvLine: null,
    pvArea: null,
    pvDot: null,
    pvLabel: null,
    pvScatterPanel: null,
    
    _creating: function(){
        // Register BULLET legend prototype marks
        var groupScene = this.defaultVisibleBulletGroupScene();
        if(groupScene && !groupScene.hasRenderer()){
            var colorAxis = groupScene.colorAxis;
            var drawMarker = def.nullyTo(colorAxis.option('LegendDrawMarker', /*no default*/ true), this.dotsVisible || this.areasVisible);
            var drawRule   = !drawMarker || 
                             def.nullyTo(colorAxis.option('LegendDrawLine',   /*no default*/ true), this.linesVisible && !this.areasVisible);
            if(drawMarker || drawRule){
                var keyArgs = {};
                if((keyArgs.drawMarker = drawMarker)){
                    var markerShape = colorAxis.option('LegendShape', true);
                    
                    if(this.dotsVisible){
                        if(!markerShape){ 
                            markerShape = 'circle'; // Dot's default shape
                        }
                        
                        keyArgs.markerPvProto = new pv.Dot()
                                .lineWidth(1.5, pvc.extensionTag) // act as if it were a user extension
                                .shapeSize(12,  pvc.extensionTag); // idem
                    } else {
                        keyArgs.markerPvProto = new pv.Mark();
                    }
                    
                    keyArgs.markerShape = markerShape;
                    
                    if(this._applyV1BarSecondExtensions){
                        this.chart.extend(keyArgs.markerPvProto, 'barSecondDot', {constOnly: true});
                    }       
                    this.extend(keyArgs.markerPvProto, 'dot', {constOnly: true});
                }
                
                if((keyArgs.drawRule = drawRule)){
                    keyArgs.rulePvProto = new pv.Line()
                           .lineWidth(1.5, pvc.extensionTag);
                    
                    if(this._applyV1BarSecondExtensions){
                        this.chart.extend(keyArgs.rulePvProto, 'barSecondLine', {constOnly: true});
                    }
                    this.extend(keyArgs.rulePvProto, 'line', {constOnly: true});
                }
                
                groupScene.renderer(
                    new pvc.visual.legend.BulletItemDefaultRenderer(keyArgs));
            }
        }
    },
    
    /**
     * @override
     */
    _createCore: function(){
        this.base();
        
        var myself = this;
        var chart = this.chart;
        var isStacked = this.stacked;
        var dotsVisible  = this.dotsVisible;
        var areasVisible = this.areasVisible;
        var linesVisible = this.linesVisible;
        var anchor = this.isOrientationVertical() ? "bottom" : "left";

        this.valueRole     = chart.visualRoles(this.plot.option('OrthoRole'));
        this.valueRoleName = this.valueRole.name;
        this.valueDimName  = this.valueRole.firstDimensionName();
        
        // ------------------
        // DATA
        var isBaseDiscrete = this.axes.base.role.grouping.isDiscrete();
        var data = this._getVisibleData(); // shared "categ then series" grouped data
        var rootScene = this._buildScene(data, isBaseDiscrete);
       
        // ---------------
        // BUILD
        if(areasVisible){
            // Areas don't look good above the axes
            this.pvPanel.zOrder(-7);
        } else {
            // // Above axes
            this.pvPanel.zOrder(1);
        }
        
        this.pvScatterPanel = new pvc.visual.Panel(this, this.pvPanel, {
                extensionId: 'panel'
            })
            .lock('data', rootScene.childNodes)
            .pvMark
            ;
        
        // -- AREA --
        var areaFillColorAlpha = areasVisible && linesVisible && !isStacked ? 0.5 : null;
        
        var wrapper;
        if(this.compatVersion() <= 1){
            if(isStacked){
                wrapper = function(v1f){
                    return function(dotScene){
                        return v1f.call(this, dotScene.vars.value.rawValue);
                    };
                };
            } else {
                wrapper = function(v1f){
                    return function(dotScene){
                        var d = {
                                category: dotScene.vars.category.rawValue,
                                value:    dotScene.vars.value.rawValue
                            };
                        
                        // Compensate for the effect of intermediate scenes on mark's index
                        var pseudo = Object.create(this);
                        pseudo.index = dotScene.dataIndex;
                        return v1f.call(pseudo, d);
                    };
                };
            }
        }
        
        var isLineAreaVisible = isBaseDiscrete && isStacked ? 
                function(){ return !this.scene.isNull || this.scene.isIntermediate; } :
                function(){ return !this.scene.isNull; };
        
        var isLineAreaNoSelect = /*dotsVisible && */chart._canSelectWithFocusWindow();
        
        this.pvArea = new pvc.visual.Area(this, this.pvScatterPanel, {
                extensionId: 'area',
                noTooltip:   false,
                wrapper:     wrapper,
                noSelect:    isLineAreaNoSelect,
                showsSelection: !isLineAreaNoSelect
            })
            .lock('visible', isLineAreaVisible)
            // If it were allowed to hide the line this way, the anchored dot would fail to evaluate
//            .intercept('visible', function(){
//                return isLineAreaVisible && this.delegateExtension(true);
//            })
            /* Data */
            .lock('data',   function(seriesScene){ return seriesScene.childNodes; }) // TODO
            
            /* Position & size */
            .override('x',  function(){ return this.scene.basePosition;  }) // left
            .override('y',  function(){ return this.scene.orthoPosition; }) // bottom
            .override('dy', function(){ return chart.animate(0, this.scene.orthoLength); }) // height
            
            /* Color & Line */
            .override('color', function(type){
                return areasVisible ? this.base(type) : null;
            })
            .override('baseColor', function(type){
                var color = this.base(type);
                if(!this._finished && color && areaFillColorAlpha != null){
                    color = color.alpha(areaFillColorAlpha);
                }
                
                return color;
            })
            .override('dimColor', function(color, type){
                return isStacked ? 
                    pvc.toGrayScale(color, 1, null, null).brighter() :
                    this.base(color, type);
            })
            .lock('events', areasVisible ? 'painted' : 'none')
            .pvMark
            ;
        
        // -- LINE --
        var dotsVisibleOnly = dotsVisible && !linesVisible && !areasVisible,
            
            /* When not showing lines, but showing areas,
             * we copy the area fillStyle so that
             * the line can cover the area and not be noticed.
             * We need this to hide the ladder 
             * on the border of the area, 
             * due to not using antialias.
             * 
             * When the scene has the active series,
             * the line is shown "highlighted" anyway.
             */
            lineCopiesAreaColor = !linesVisible && areasVisible,
            
            /* When areas are shown with no alpha (stacked), 
             * make dots darker so they get 
             * distinguished from areas. 
             */
            darkerLineAndDotColor = isStacked && areasVisible;
         
        var extensionIds = ['line'];
        if(this._applyV1BarSecondExtensions){
            extensionIds.push({abs: 'barSecondLine'});
        }
        
        /* 
         * Line.visible =
         *  a) linesVisible
         *     or
         *  b) (!linesVisible and) areasVisible
         *      and
         *  b.1) discrete base and stacked
         *       and
         *       b.1.1) not null or is an intermediate null
         *  b.2) not null
         */
        var isLineVisible = !dotsVisibleOnly && isLineAreaVisible;
        
        this.pvLine = new pvc.visual.Line(
            this, 
            this.pvArea.anchor(this.anchorOpposite(anchor)), 
            {
                extensionId:    extensionIds,
                freePosition:   true,
                wrapper:        wrapper,
                noTooltip:      false,
                noSelect:       isLineAreaNoSelect,
                showsSelection: !isLineAreaNoSelect
            })
            .lock('visible', isLineVisible)
            // If it were allowed to hide the line this way, the anchored dot would fail to evaluate  
//            .intercept('visible', function(){
//                return isLineVisible && this.delegateExtension(true);
//            })
            /* Color & Line */
            .override('defaultColor', function(type){
                var color = this.base(type);
                
                if(!this._finished && darkerLineAndDotColor && color){
                    color = color.darker(0.6);
                }
                return color;
            })
            .override('normalColor', function(color, type){
                return linesVisible ? color : null;
            })
            .override('baseStrokeWidth', function(){
                var strokeWidth;
                if(linesVisible){
                    strokeWidth = this.base();
                }
                
                return strokeWidth == null ? 1.5 : strokeWidth; 
            })
            .intercept('strokeDasharray', function(){
                var dashArray = this.delegateExtension();
                if(dashArray === undefined){
                    var scene = this.scene;
                    var useDash = scene.isInterpolated;
                    if(!useDash){
                        var next = scene.nextSibling;
                        useDash = next && next.isIntermediate && next.isInterpolated;
                        if(!useDash){
                            var previous = scene.previousSibling;
                            useDash = previous  && scene.isIntermediate && previous.isInterpolated;
                        }
                    }
                    
                    dashArray = useDash ? '. ' : null;
                }
                
                return dashArray;
            })
            .pvMark
            ;
        
           
        // -- DOT --
        var showAloneDots = !(areasVisible && isBaseDiscrete && isStacked);
        
        extensionIds = ['dot'];
        if(this._applyV1BarSecondExtensions){
            extensionIds.push({abs: 'barSecondDot'});
        }
        
        this.pvDot = new pvc.visual.Dot(this, this.pvLine, {
                extensionId: extensionIds,
                freePosition: true,
                wrapper:     wrapper
            })
            .intercept('visible', function(){
                var scene = this.scene;
                return (!scene.isNull && !scene.isIntermediate /*&& !scene.isInterpolated*/) && 
                       this.delegateExtension(true);
            })
            .override('color', function(type){
                /* 
                 * Handle dotsVisible
                 * -----------------
                 * Despite !dotsVisible,
                 * show a dot anyway when:
                 * 1) it is active, or
                 * 2) it is single  (the only dot in its series and there's only one category) (and in areas+discreteCateg+stacked case)
                 * 3) it is alone   (surrounded by null dots) (and not in areas+discreteCateg+stacked case)
                 */
                if(!dotsVisible){
                    var visible = this.scene.isActive ||
                                  (!showAloneDots && this.scene.isSingle) ||
                                  (showAloneDots && this.scene.isAlone);
                    if(!visible) {
                        return pvc.invisibleFill;
                    }
                }
                
                // TODO: review interpolated style/visibility
                if(this.scene.isInterpolated && type === 'fill'){
                    var color = this.base(type);
                    return color && pv.color(color).brighter(0.5);
                }
                
                // Follow normal logic
                return this.base(type);
            })
//            .override('interactiveColor', function(color, type){
//              return this.scene.isInterpolated && type === 'stroke' ? 
//                     color :
//                     this.base(color, type);
//            })
            .optionalMark('lineCap', 'round')
//            .intercept('strokeDasharray', function(){
//                var dashArray = this.delegateExtension();
//                if(dashArray === undefined){
//                    // TODO: review interpolated style/visibility
//                    dashArray = this.scene.isInterpolated ? '.' : null; 
//                }
//                
//                return dashArray;
//            })
            .override('defaultColor', function(type){
                var color = this.base(type);
                
                if(!this._finished && darkerLineAndDotColor && color){
                    color = color.darker(0.6);
                }
                return color;
            })
            .override('baseSize', function(){
                /* When not showing dots, 
                 * but a datum is alone and 
                 * wouldn't be visible using lines or areas,  
                 * show the dot anyway, 
                 * with a size = to the line's width^2
                 * (ideally, a line would show as a dot when only one point?)
                 */
                if(!dotsVisible) {
                    var visible = this.scene.isActive ||
                                  (!showAloneDots && this.scene.isSingle) ||
                                  (showAloneDots && this.scene.isAlone);
                    
                    if(visible && !this.scene.isActive) {
                        // Obtain the line Width of the "sibling" line
                        var lineWidth = Math.max(myself.pvLine.lineWidth(), 0.2) / 2;
                        return lineWidth * lineWidth;
                    }
                }
                
                // TODO: review interpolated style/visibility
                if(this.scene.isInterpolated){
                    return 0.8 * this.base();
                }
                
                return this.base();
            })
            .pvMark
            ;
        
        // -- LABEL --
        if(this.valuesVisible){
            this.pvLabel = new pvc.visual.Label(
                this, 
                this.pvDot.anchor(this.valuesAnchor), 
                {
                    extensionId: 'label',
                    wrapper:     wrapper
                })
                .pvMark
                .font(this.valuesFont) // default
                .text(function(scene){ return scene.vars.value.label; })
                ;
        }
    },

    /**
     * Renders this.pvScatterPanel - the parent of the marks that are affected by interaction changes.
     * @override
     */
    renderInteractive: function(){
        this.pvScatterPanel.render();
    },

    /**
     * Returns an array of marks whose instances are associated to a datum or group, or null.
     * @override
     */
    _getSelectableMarks: function(){
        var marks = [];
        
        marks.push(this.pvDot);
        
        if(this.linesVisible || this.areasVisible){
            marks.push(this.pvLine);
        }
        
        return marks;
    },
    
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

    _buildScene: function(data, isBaseDiscrete){
        var rootScene  = new pvc.visual.Scene(null, {panel: this, group: data});
        var categDatas = data._children;
        var chart = this.chart;
        var colorVarHelper = new pvc.visual.ColorVarHelper(chart, chart._colorRole);
        var valueDim = data.owner.dimensions(this.valueDimName);
        var isStacked = this.stacked;
        var visibleKeyArgs = {visible: true, zeroIfNone: false};
        var orthoScale = this.axes.ortho.scale;
        var orthoNullValue = def.scope(function(){
                // If the data does not cross the origin, 
                // Choose the value that's closer to 0.
                var domain = orthoScale.domain(),
                    dmin = domain[0],
                    dmax = domain[1];
                if(dmin * dmax >= 0) {
                    // Both positive or both negative or either is zero
                    return dmin >= 0 ? dmin : dmax;
                }
                
                return 0;
            });
        var orthoZero = orthoScale(orthoNullValue/*0*/);
        var sceneBaseScale = this.axes.base.sceneScale({sceneVarName: 'category'});
        
        // ----------------------------------
        // I   - Create series scenes array.
        // ----------------------------------
        def
        .scope(function(){
            var serRole = chart._serRole;
            return (serRole && serRole.grouping)    ?
                   serRole.flatten(data).children() : // data already only contains visible data
                   def.query([null]) // null series
                   ;
        })
        /* Create series scene */
        .each(function(seriesData1/*, seriesIndex*/){
            var seriesScene = new pvc.visual.Scene(rootScene, {group: seriesData1 || data});

            seriesScene.vars.series = new pvc.visual.ValueLabelVar(
                        seriesData1 ? seriesData1.value : null,
                        seriesData1 ? seriesData1.label : "",
                        seriesData1 ? seriesData1.rawValue : null);
            
            colorVarHelper.onNewScene(seriesScene, /* isLeaf */ false);
            
            /* Create series-categ scene */
            categDatas.forEach(function(categData, categIndex){
                var group = categData;
                if(seriesData1){
                    group = group._childrenByKey[seriesData1.key];
                }
                
                var value = group ?
                    group.dimensions(valueDim.name).sum(visibleKeyArgs) : 
                    null;
                
                // TODO: really needed ?
                /* If there's no group, provide, at least, a null datum */
                var datum = group ? 
                    null : 
                    createNullDatum(seriesData1 || data, categData);
                
                // -------------
                
                var serCatScene = new pvc.visual.Scene(seriesScene, {group: group, datum: datum});
                
                // -------------
                serCatScene.dataIndex = categIndex;
                
                serCatScene.vars.category = 
                    new pvc.visual.ValueLabelVar(categData.value, categData.label, categData.rawValue);
                
                // -------------
                
                var valueVar = new pvc.visual.ValueLabelVar(
                                    value,
                                    valueDim.format(value),
                                    value);
                
                /* accumulated value, for stacked */
                // NOTE: the null value can only happen if interpolation is 'none'
                valueVar.accValue = value != null ? value : orthoNullValue;
                
                serCatScene.vars.value = valueVar;
                
                colorVarHelper.onNewScene(serCatScene, /* isLeaf */ true);
                
                // -------------
                
                var isInterpolated = false;
                //var isInterpolatedMiddle = false;
                if(group){
                    var firstDatum = group._datums[0];
                    if(firstDatum && firstDatum.isInterpolated){
                        isInterpolated = true;
                        //isInterpolatedMiddle = firstDatum.isInterpolatedMiddle;
                    }
                }
                
                serCatScene.isInterpolated = isInterpolated;
                //serCatScene.isInterpolatedMiddle = isInterpolatedMiddle;
                
                // TODO: selection, owner Scene ?
                //if(scene.isInterpolated){
                //    scene.ownerScene = toScene;
                //}
                
                // -------------
                
                serCatScene.isNull = value == null;
                serCatScene.isIntermediate = false;
            }, this);
            
        }, this);
        
        // reversed so that "below == before" w.r.t. stacked offset calculation
        // See {@link belowSeriesScenes2} variable.
        var reversedSeriesScenes = rootScene.children().reverse().array();
        
        /** 
         * Update the scene tree to include intermediate leaf-scenes,
         * to help in the creation of lines and areas. 
         */
        var belowSeriesScenes2; // used below, by completeSeriesScenes
        reversedSeriesScenes.forEach(completeSeriesScenes, this);
        
        /** 
         * Trim leading and trailing null scenes.
         */
        reversedSeriesScenes.forEach(trimNullSeriesScenes, this);
        
        return rootScene;
        
        function completeSeriesScenes(seriesScene) {
            var seriesScenes2 = [],
                seriesScenes = seriesScene.childNodes, 
                fromScene,
                notNullCount = 0,
                firstAloneScene = null;
            
            /* As intermediate nodes are added, 
             * seriesScene.childNodes array is changed.
             * 
             * The var 'toChildIndex' takes inserts into account;
             * its value is always the index of 'toScene' in 
             * seriesScene.childNodes.
             */
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
                
                if(toScene.isAlone && !firstAloneScene){
                    firstAloneScene = toScene;
                }
                
                if(!toScene.isNull){
                    notNullCount++;
                }
                
                /* Possibly create intermediate scene 
                 * (between fromScene and toScene) 
                 */
                if(fromScene) {
                    var interScene = createIntermediateScene.call(this,
                            seriesScene,
                            fromScene, 
                            toScene,
                            toChildIndex,
                            /* belowScene */
                            belowSeriesScenes2 && belowSeriesScenes2[c2 - 1]);
                    
                    if(interScene){
                        seriesScenes2[c2 - 1] = interScene;
                        toChildIndex++;
                    }
                }
                
                // --------
                
                fromScene = toScene;
            }
            
            if(notNullCount === 1 && firstAloneScene && categCount === 1){
                firstAloneScene.isSingle = true;
            }
            
            if(isStacked){
                belowSeriesScenes2 = seriesScenes2;
            } 
        }
        
        function completeMainScene( 
                      fromScene, 
                      toScene, 
                      belowScene){
            
            var toAccValue = toScene.vars.value.accValue;
            
            if(belowScene) {
                if(toScene.isNull && !isBaseDiscrete) {
                    toAccValue = orthoNullValue;
                } else {
                    toAccValue += belowScene.vars.value.accValue;
                }
                
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
                isAlone  = !nextScene || nextScene.isNull;
            }
            
            toScene.isAlone  = isAlone;
            toScene.isSingle = false;
        }
        
        function createIntermediateScene(
                     seriesScene, 
                     fromScene, 
                     toScene, 
                     toChildIndex,
                     belowScene){
            
            var interIsNull = fromScene.isNull || toScene.isNull;
            if(interIsNull && !this.areasVisible) {
                return null;
            }
            
            var interValue, interAccValue, interBasePosition;
                
            if(interIsNull) {
                /* Value is 0 or the below value */
                if(belowScene && isBaseDiscrete) {
                    var belowValueVar = belowScene.vars.value;
                    interAccValue = belowValueVar.accValue;
                    interValue = belowValueVar[this.valueRoleName];
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
//                    else {
//                        interBasePosition = (toScene.basePosition + fromScene.basePosition) / 2;
//                    }
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
                    index: toChildIndex,
                    group: /*toScene.isInterpolatedMiddle ? fromScene.group: */toScene.group, 
                    datum: toScene.group ? null : toScene.datum
                });
            
            interScene.dataIndex = toScene.dataIndex;
            interScene.vars.category = toScene.vars.category;
            
            var interValueVar = new pvc.visual.ValueLabelVar(
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
                if(siblingScene && !siblingScene.isNull){
                    break;
                }
                
                seriesScene.removeAt(0);
                L--;
            }
            
            // from end
            while(L && (scene = seriesScenes[L - 1]).isNull) {
                
                // Don't remove the intermediate dot after the last non-null dot
                siblingScene = scene.previousSibling;
                if(siblingScene && !siblingScene.isNull){
                    break;
                }
                
                seriesScene.removeAt(L - 1);
                L--;
            }
        } 
        
        function createNullDatum(serData1, catData1) {
            // Create a null datum with col and row coordinate atoms
            var atoms = serData1 && catData1 ?
                        def.copy(def.copy({}, serData1.atoms), catData1.atoms) :
                        (serData1 ? serData1.atoms :  catData1.atoms)
                        ;
            
            return new pvc.data.Datum(data, atoms, true);
        }
    }
});
