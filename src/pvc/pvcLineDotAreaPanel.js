/*
 * LineDotArea panel.
 * Class that draws all line/dot/area combinations.
 * Specific options are:
 * <i>showDots</i> - Show or hide dots. Default: true
 * <i>showAreas</i> - Show or hide dots. Default: false
 * <i>showLines</i> - Show or hide dots. Default: true
 * <i>showValues</i> - Show or hide line value. Default: false
 *
 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>line_</i> - for the actual line
 * <i>linePanel_</i> - for the panel where the lines sit
 * <i>lineDot_</i> - the dots on the line
 * <i>lineLabel_</i> - for the main line label
 */
pvc.LineDotAreaPanel = pvc.CartesianAbstractPanel.extend({
    anchor: 'fill',
    stacked: false,
    pvLine: null,
    pvArea: null,
    pvDot: null,
    pvLabel: null,
    pvScatterPanel: null, // TODO: change this name!
    
    showLines: true,
    showDots: true,
    showValues: true,
    
    valuesAnchor: "right",
    valueRoleName: null,
    
    _creating: function(){
        // Register BULLET legend prototype marks
        var groupScene = this.defaultVisibleBulletGroupScene();
        if(groupScene && !groupScene.hasRenderer()){
            var colorAxis = groupScene.colorAxis;
            var drawMarker = def.nullyTo(colorAxis.option('DrawMarker', true), this.showDots  || this.showAreas);
            var drawRule   = def.nullyTo(colorAxis.option('DrawLine',   true), this.showLines && !this.showAreas);
            if(drawMarker || drawRule){
                var keyArgs = {};
                if((keyArgs.drawMarker = drawMarker)){
                    var markerShape = colorAxis.option('Shape', true);
                    
                    if(this.showDots){
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
                    
                    this.extend(keyArgs.markerPvProto, 'dot', {constOnly: true});
                }
                
                if((keyArgs.drawRule = drawRule)){
                    keyArgs.rulePvProto = new pv.Line()
                           .lineWidth(1.5, pvc.extensionTag);
                    
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
        
        this.valueRoleName = this.chart.axes.ortho.role.name;

        var myself = this,
            chart = this.chart,
            options = chart.options,
            isStacked = this.stacked,
            showDots  = this.showDots,
            showAreas = this.showAreas,
            showLines = this.showLines,
            anchor = this.isOrientationVertical() ? "bottom" : "left";

        // ------------------
        // DATA
        var isBaseDiscrete = chart._catRole.grouping.isDiscrete(),
            data = this._getVisibleData(), // shared "categ then series" grouped data
            isDense = !(this.width > 0) || (data._children.length / this.width > 0.5), //  > 100 categs / 200 pxs
            rootScene = this._buildScene(data, isBaseDiscrete);

        // Disable selection?
        if(isDense && (options.selectable || options.hoverable)) {
            options.selectable = false;
            options.hoverable  = false;
            if(pvc.debug >= 3) {
                pvc.log("Warning: Disabling selection and hovering because the chart is to \"dense\".");
            }
        }
       
        // ---------------
        // BUILD
        if(showAreas){
            // Areas don't look good above the axes
            this.pvPanel.zOrder(-7);
        } else {
            // // Above axes
            this.pvPanel.zOrder(1);
        }
        
        this.pvScatterPanel = this.pvPanel.add(pv.Panel)
            .lock('data', rootScene.childNodes)
            ;
        
        // -- AREA --
        var areaFillColorAlpha = showAreas && showLines && !isStacked ? 0.5 : null;
        
        this.pvArea = new pvc.visual.Area(this, this.pvScatterPanel, {
                extensionId: 'area',
                antialias:   showAreas && !showLines,
                segmented:   !isDense,
                noTooltips:  false 
            })
            
            .lock('visible', def.retTrue)
            
            /* Data */
            .lock('data',   function(seriesScene){ return seriesScene.childNodes; }) // TODO
            
            /* Position & size */
            .override('x',  function(){ return this.scene.basePosition;  })
            .override('y',  function(){ return this.scene.orthoPosition; })
            .override('dy', function(){ return chart.animate(0, this.scene.orthoLength); })
            
            /* Color & Line */
            .override('color', function(type){
                return showAreas ? this.base(type) : null;
            })
            .override('baseColor', function(type){
                var color = this.base(type);
                if(color && !this.hasExtension() && areaFillColorAlpha != null){
                    color = color.alpha(areaFillColorAlpha);
                }
                
                return color;
            })
            .override('fixAntialiasStrokeWidth', function(){
                // Hide a vertical line from 0 to the alone dot
                // Hide horizontal lines of nulls near zero
                if(this.scene.isNull || this.scene.isAlone) {
                     return 0;
                }

                return this.base();
            })
            .pvMark
            ;
        
        // -- LINE --
        var showDotsOnly = showDots && !showLines && !showAreas,
            
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
            lineCopiesAreaColor = !showLines && showAreas,
            
            /* When areas are shown with no alpha (stacked), 
             * make dots darker so they get 
             * distinguished from areas. 
             */
            darkerLineAndDotColor = isStacked && showAreas;
        
        function lineAndDotNormalColor(type){
            var color = this.base(type);
            if(darkerLineAndDotColor && color && !this.hasExtension()){
                color = color.darker(0.6);
            }
            
            return color;
        }
        
        this.pvLine = new pvc.visual.Line(
            this, 
            this.pvArea.anchor(this.anchorOpposite(anchor)), 
            {
                extensionId: 'line',
                freePosition: true
                //noHover:      true // TODO: SIGN check if not broken
            })
            /* 
             * Line.visible =
             *  a) showLines
             *     or
             *  b) (!showLines and) showAreas
             *      and
             *  b.1) discrete base and stacked
             *       and
             *       b.1.1) not null or is an intermediate null
             *  b.2) not null
             */
            .lock('visible',
                    showDotsOnly ? 
                    def.retFalse : 
                    (isBaseDiscrete && isStacked ? 
                    function(){ return !this.scene.isNull || this.scene.isIntermediate; } :
                    function(){ return !this.scene.isNull; })
            )
            
            /* Color & Line */
            .override('color', function(type){
                if(lineCopiesAreaColor && !this.scene.isActiveSeries()) {
                    // This obtains the color of the same index area
                    return myself.pvArea.fillStyle();
                }
                
                return this.base(type);
            })
            .override('baseColor', lineAndDotNormalColor)
            .override('baseStrokeWidth', function(){
                var strokeWidth;
                if(showLines){
                    strokeWidth = this.base();
                }
                
                return strokeWidth == null ? 1.5 : strokeWidth; 
            })
            .pvMark
            ;
        
           
        // -- DOT --
        var showAloneDots = !(showAreas && isBaseDiscrete && isStacked);
        
        this.pvDot = new pvc.visual.Dot(this, this.pvLine, {
                extensionId: 'dot',
                freePosition: true
            })
            .intercept('visible', function(){
                var scene = this.scene;
                return (!scene.isNull && !scene.isIntermediate /*&& !scene.isInterpolated*/) && 
                       this.delegateExtension(true);
            })
            .override('color', function(type){
                /* 
                 * Handle showDots
                 * -----------------
                 * Despite !showDots,
                 * show a dot anyway when:
                 * 1) it is active, or
                 * 2) it is single  (the only dot in its series and there's only one category) (and in areas+discreteCateg+stacked case)
                 * 3) it is alone   (surrounded by null dots) (and not in areas+discreteCateg+stacked case)
                 */
                if(!showDots){
                    var visible = this.scene.isActive ||
                                  (!showAloneDots && this.scene.isSingle) ||
                                  (showAloneDots && this.scene.isAlone);
                    if(!visible) {
                        return pvc.invisibleFill;
                    }
                }
                
                // TODO: review interpolated style/visibility
                if(this.scene.isInterpolated && type === 'fill'){
                    return this.base(type).alpha(0.5);
                }
                
                // Follow normal logic
                return this.base(type);
            })
            .optionalMark('lineCap', 'round')
            .intercept('strokeDasharray', function(){
                var dashArray = this.delegateExtension();
                if(dashArray === undefined){
                    // TODO: review interpolated style/visibility
                    dashArray = this.scene.isInterpolated ? '.' : null; 
                }
                
                return dashArray;
            })
            .override('baseColor', lineAndDotNormalColor)
            .override('baseSize', function(){
                /* When not showing dots, 
                 * but a datum is alone and 
                 * wouldn't be visible using lines or areas,  
                 * show the dot anyway, 
                 * with a size = to the line's width^2
                 * (ideally, a line would show as a dot when only one point?)
                 */
                if(!showDots) {
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
        if(this.showValues){
            this.pvLabel = this.pvDot
                .anchor(this.valuesAnchor)
                .add(pv.Label)
                // ------
                .bottom(0)
                .text(function(scene){ return scene.vars.value.label; })
                ;
        }
    },

    /**
     * @override
     */
    applyExtensions: function(){

        this.extend(this.pvScatterPanel, "scatterPanel");

        this.extend(this.pvLabel, "label");
        this.extend(this.pvLabel, "lineLabel");
        
        this.base();
    },

    /**
     * Renders this.pvScatterPanel - the parent of the marks that are affected by interaction changes.
     * @override
     */
    _renderInteractive: function(){
        this.pvScatterPanel.render();
    },

    /**
     * Returns an array of marks whose instances are associated to a datum or group, or null.
     * @override
     */
    _getSelectableMarks: function(){
        var marks = [];
        
        marks.push(this.pvDot);
        
        if(this.showLines || this.showAreas){
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
        var chart = this.chart,
            valueDim = data.owner.dimensions(chart.axes.ortho.role.firstDimensionName()),
            firstCategDim = !isBaseDiscrete ? data.owner.dimensions(chart.axes.base.role.firstDimensionName()) : null,
            isStacked = this.stacked,
            visibleKeyArgs = {visible: true, zeroIfNone: false},
            
            /* TODO: BIG HACK */
            orthoScale = this.dataPartValue !== '1' ?
                            chart.axes.ortho.scale :
                            chart.axes.ortho2.scale,
                        
            orthoNullValue = def.scope(function(){
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
            }),
            orthoZero = orthoScale(0),
            sceneBaseScale = chart.axes.base.sceneScale({sceneVarName: 'category'});
        
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
        .each(function(seriesData1, seriesIndex){
            var seriesScene = new pvc.visual.Scene(rootScene, {group: seriesData1 || data});

            seriesScene.vars.series = new pvc.visual.ValueLabelVar(
                        seriesData1 ? seriesData1.value : null,
                        seriesData1 ? seriesData1.label : "");
            
            
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
                
                serCatScene.vars.category = 
                    new pvc.visual.ValueLabelVar(categData.value, categData.label);
                
                // -------------
                
                var valueVar = new pvc.visual.ValueLabelVar(
                                    value,
                                    valueDim.format(value));
                
                /* accumulated value, for stacked */
                // NOTE: the null value can only happen if interpolation is 'none'
                valueVar.accValue = value != null ? value : orthoNullValue;
                
                serCatScene.vars.value = valueVar;
                
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
        var seriesCount = reversedSeriesScenes.length;
        
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
            if(interIsNull && !this.showAreas) {
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
                    interBasePosition = toScene.basePosition - (sceneBaseScale.range().band / 2);
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
            
            interScene.vars.category = toScene.vars.category;
            
            var interValueVar = new pvc.visual.ValueLabelVar(
                                    interValue,
                                    valueDim.format(interValue));
            
            interValueVar.accValue = interAccValue;
            
            interScene.vars.value = interValueVar;
            interScene.ownerScene     = toScene;
            interScene.isIntermediate = true;
            interScene.isSingle       = false;
            interScene.isNull         = interIsNull;
            interScene.isAlone        = interIsNull && toScene.isNull && fromScene.isNull;
            interScene.basePosition   = interBasePosition;
            interScene.orthoPosition  = orthoZero;
            interScene.orthoLength    = orthoScale(interAccValue) - orthoZero;
            
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
                            def.array.append(
                                def.own(serData1.atoms),
                                def.own(catData1.atoms)) :
                            (serData1 ? def.own(serData1.atoms) :  def.own(catData1.atoms))
                            ;
            
            return new pvc.data.Datum(data, atoms, true);
        }
    }
});
