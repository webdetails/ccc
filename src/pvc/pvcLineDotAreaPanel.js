
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
            anchor = this.isOrientationVertical() ? "bottom" : "left",
            invisibleFill = 'rgba(127,127,127,0.00001)';

        // ------------------
        // DATA
        var isBaseDiscrete = chart._catRole.grouping.isDiscrete(),
            data = this._getVisibleData(), // shared "categ then series" grouped data
            isDense = !(this.width > 0) || (data._leafs.length / this.width > 0.5), //  > 100 pts / 200 pxs
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
        this.pvPanel.zOrder(-7);

        this.pvScatterPanel = this.pvPanel.add(pv.Panel)
            .lock('data', rootScene.childNodes)
            ;
        
        // -- AREA --
        var areaFillColorAlpha = showAreas && showLines && !isStacked ? 0.5 : null;
        
        this.pvArea = new pvc.visual.Area(this, this.pvScatterPanel, {
                extensionId: 'area',
                antialias:   showAreas && !showLines,
                segmented:   !isDense
            })
            
            .lock('visible', def.constant(true))
            
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
                if(color && !this.hasDelegate() && areaFillColorAlpha != null){
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
            if(color && darkerLineAndDotColor && !this.hasDelegate()){
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
                    def.constant(false) : 
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
                if(!showLines || !this.hasDelegate()) {
                    return isDense ? 0.00001 : 1.5;
                }
                
                return this.base();
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
                return (!this.scene.isNull && !this.scene.isIntermediate) && 
                       this.delegate(true);
            })
            .override('color', function(type){
                /* 
                 * Handle showDots
                 * -----------------
                 * Despite !showDots,
                 * show a dot anyway when:
                 * 1) it is active, or
                 * 2) it is single  (the only dot in the dataset)
                 * 3) it is alone   (surrounded by null dots) (and not in areas+discreteCateg+stacked case)
                 */
                if(!showDots){
                    var visible = this.scene.isActive ||
                                  this.scene.isSingle ||
                                  (this.scene.isAlone && showAloneDots);
                    if(!visible) {
                        return invisibleFill;
                    }
                }
                
                // Follow normal logic
                return this.base(type);
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
                                  this.scene.isSingle ||
                                  (this.scene.isAlone && showAloneDots);
                    
                    if(visible && !this.scene.isActive) {
                        // Obtain the line Width of the "sibling" line
                        var lineWidth = Math.max(myself.pvLine.lineWidth(), 0.2) / 2;
                        return lineWidth * lineWidth;
                    }
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
                .text(function(scene){ return scene.acts[myself.valueRoleName].label; })
                ;
        }
    },

    /**
     * @override
     */
    applyExtensions: function(){

        this.base();

        this.extend(this.pvScatterPanel, "scatterPanel_");
        this.extend(this.pvArea,  "area_");
        this.extend(this.pvLine,  "line_");
        this.extend(this.pvDot,   "dot_");
        this.extend(this.pvLabel, "label_");
        this.extend(this.pvLabel, "lineLabel_");
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
    _getSignums: function(){
        var marks = [];
        
        marks.push(this.pvDot);
        
        if(this.showLines || this.showAreas){
            marks.push(this.pvLine);
        }
        
        return marks;
    },
  
    _buildScene: function(data, isBaseDiscrete){
        var rootScene = new pvc.visual.Scene(null, {panel: this, group: data}),
            categDatas = data._children;
        
        var chart = this.chart,
            valueDim = data.owner.dimensions(chart.axes.ortho.role.firstDimensionName()),
            isStacked = this.stacked,
            visibleKeyArgs = {visible: true, zeroIfNone: false},
            /* TODO: BIG HACK */
            orthoScale = this.dataPartValue !== '1' ?
                            chart.axes.ortho.scale :
                            chart.axes.ortho2.scale,
                        
            orthoNullValue = def.scope(function(){
                var domain = orthoScale.domain(),
                    dmin = domain[0],
                    dmax = domain[1];
                if(dmin * dmax >= 0) {
                    // Both positive or negative or either is zero
                    return dmin >= 0 ? dmin : dmax;
                }
                
                return 0;
            }),
            orthoZero = orthoScale(0),
            sceneBaseScale = chart.axes.base.sceneScale();
        
        // --------------
        
        /** 
         * Create starting scene tree 
         */
        if(chart._serRole && chart._serRole.grouping){
            chart._serRole
                .flatten(data)
                .children()
                .each(createSeriesScene, this);
        } else {
            createNullSeriesScene.call(this);
        }
        
        /** 
         * Update the scene tree to include intermediate leaf-scenes,
         * to add in the creation of lines and areas. 
         */
        var belowSeriesScenes2; // used below, by completeSeriesScenes
        rootScene
            .children()
            .reverse() // so that below == before wrt stacked offset calculation
            .each(completeSeriesScenes, this);
        
        /** 
         * Trim leading and trailing null scenes.
         */
        rootScene
            .children()
            .each(trimNullSeriesScenes, this);
        
        return rootScene;

        function createSeriesScene(seriesData1){
            /* Create series scene */
            var seriesScene = new pvc.visual.Scene(rootScene, {group: seriesData1});

            seriesScene.acts.series = {
                value: seriesData1.value,
                label: seriesData1.label
            };

            createSeriesSceneCategories.call(this, seriesScene, seriesData1);
        }

        function createNullSeriesScene(){
            /* Create series scene */
            var seriesScene = new pvc.visual.Scene(rootScene, {group: data});

            seriesScene.acts.series = {
                value: null,
                label: ""
            };

            createSeriesSceneCategories.call(this, seriesScene);
        }

        function createSeriesSceneCategories(seriesScene, seriesData1){
            categDatas.forEach(function(categData1){
                /* Create leaf scene */
                var categKey = categData1.key,
                    group = data._childrenByKey[categKey]
                    ;
                    
                if(seriesData1){
                    group = group._childrenByKey[seriesData1.key];
                }

                /* If there's no group, provide, at least, a null datum */
                var datum = group ? null : createNullDatum(seriesData1, categData1),
                    scene = new pvc.visual.Scene(seriesScene, {group: group, datum: datum});
                
                scene.acts.category = {
                    value: categData1.value,
                    label: categData1.label
                };
                
                var value = group ? group.dimensions(valueDim.name).sum(visibleKeyArgs) : null;
                scene.acts[this.valueRoleName] = {
                    /* accumulated value, for stacked */
                    accValue: value != null ? value : orthoNullValue,
                    value:    value,
                    label:    valueDim.format(value)
                };
                
                scene.isNull = !group || value == null; // A virtual scene?
                scene.isIntermediate = false;
            }, this);
        }
        
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
            
            if(notNullCount === 1 && firstAloneScene){
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
            
            var toAccValue = toScene.acts[this.valueRoleName].accValue;
            
            if(belowScene) {
                if(toScene.isNull && !isBaseDiscrete) {
                    toAccValue = orthoNullValue;
                } else {
                    toAccValue += belowScene.acts[this.valueRoleName].accValue;
                }
                
                toScene.acts[this.valueRoleName].accValue = toAccValue;
            }
            
            toScene.basePosition  = sceneBaseScale(toScene);
            toScene.orthoPosition = orthoZero;
            toScene.orthoLength   = orthoScale(toAccValue) - orthoZero;
            
            var isNullFrom = (!fromScene || fromScene.isNull),
                isAlone    = isNullFrom && !toScene.isNull;
            if(isAlone) {
                // Confirm looking ahead
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
                    var belowValueAct = belowScene.acts[this.valueRoleName];
                    interAccValue = belowValueAct.accValue;
                    interValue = belowValueAct[this.valueRoleName];
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
                var fromValueAct = fromScene.acts[this.valueRoleName],
                    toValueAct   = toScene.acts[this.valueRoleName];
                
                interValue = (toValueAct.value + fromValueAct.value) / 2;
                
                // Average of the already offset values
                interAccValue     = (toValueAct.accValue  + fromValueAct.accValue ) / 2;
                interBasePosition = (toScene.basePosition + fromScene.basePosition) / 2;
            }
            
            //----------------
            
            var interScene = new pvc.visual.Scene(seriesScene, {
                    /* insert immediately before toScene */
                    index: toChildIndex,
                    group: toScene.group, 
                    datum: toScene.group ? null : toScene.datum
                });
            
            interScene.acts.category = toScene.acts.category;
            interScene.acts[this.valueRoleName] = {
                accValue: interAccValue,
                value:    interValue,
                label:    valueDim.format(interValue)
            };
            
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
            var atoms = serData1 ?
                            def.array.append(
                                def.own(serData1.atoms),
                                def.own(catData1.atoms)) :
                            catData1.atoms
                            ;
            
            return new pvc.data.Datum(data, atoms, true);
        }
    }
});
