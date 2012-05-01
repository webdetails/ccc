
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
    
    pvLine: null,
    pvArea: null,
    pvDot: null,
    pvLabel: null,
    pvScatterPanel: null, // TODO: change this name!
    
    showLines: true,
    showDots: true,
    showValues: true,
    
    valuesAnchor: "right",
    
    /**
     * @override
     */
    _createCore: function(){
        this.base();
         
        var myself = this,
            chart = this.chart,
            options = chart.options,
            isStacked = options.stacked,
            showDots  = this.showDots,
            showAreas = this.showAreas,
            showLines = this.showLines,
            anchor = this.isOrientationVertical() ? "bottom" : "left",
            invisibleFill = 'rgba(127,127,127,0.00001)';

        // ------------------
        // DATA
        var de = chart.dataEngine,
            // Two multi-dimension single-level data groupings
            catGrouping    = chart.visualRoles('category').grouping.singleLevelGrouping(),
            serGrouping    = chart.visualRoles('series'  ).grouping.singleLevelGrouping(),
            valueDimName   = chart.visualRoles('value').firstDimensionName(),
            isBaseDiscrete = catGrouping.isDiscrete(),
            
            keyArgs      = { visible: true },
            catAxisData  = de.groupBy(catGrouping, keyArgs),
            serAxisData  = de.groupBy(serGrouping, keyArgs),
            data         = chart._getVisibleData(), // shared "categ then series" grouped data
            isDense      = !(this.width > 0) || (data._leafs.length / this.width > 0.5), //  > 100 pts / 200 pxs
            rootScene = this._buildScene(catAxisData, serAxisData, data, valueDimName, isBaseDiscrete);

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
        //this.pvPanel.zOrder(0);

        if(options.showTooltips || options.hoverable || this._shouldHandleClick()){
            this.pvPanel
              // Receive events even if in a transparent panel (#events default is "painted")
              .events("all")
              .event("mousemove", pv.Behavior.point(40)) // fire point and unpoint events
              ;
        }
        
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
            
            /* Data */
            .lock('data',   function(seriesScene){ return seriesScene.childNodes; }) // TODO
            
            /* Position & size */
            .override('x',  function(){ return this.scene.basePosition;  })
            .override('y',  function(){ return this.scene.orthoPosition; })
            .override('dy', function(){ return chart.animate(0, this.scene.orthoLength); })
            
            /* Color & Line */
            .override('color', function(type){
                return showAreas ? this.base(type) : invisibleFill;
            })
            .override('normalColor', function(type){
                var color = this.base(type);
                if(color && !this.hasDelegate() && areaFillColorAlpha != null){
                    color = color.alpha(areaFillColorAlpha);
                }
                
                return color;
            })
            .override('fixAntialiasStrokeWidth', function(){
                if((this.scene.isAlone && !isBaseDiscrete) || 
                   (this.scene.isNull && (!this.scene.nextSibling || this.scene.nextSibling.isNull))) {
                    // Hide a vertical line from 0 to the alone dot
                    // Hide horizontal lines of nulls near zero
                    return 0.00001;
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
            .lock('visible',
                    showDotsOnly ? def.constant(false) : 
                    (isStacked && isBaseDiscrete ? 
                            function(){ return !(!this.scene.isIntermediate && this.scene.isNull); } :
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
            .override('normalColor', lineAndDotNormalColor)
            .override('normalStrokeWidth', function(){
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
            .override('normalColor', lineAndDotNormalColor)
            .override('normalSize', function(){
                /* When not showing dots, 
                 * but a datum is alone and 
                 * wouldn't be visible using lines or areas,  
                 * show the dot anyway, 
                 * with a size = to the line's width^2
                 * (ideally, a line would show as a dot when only one point?)
                 */
                if(!showDots) {
                    if(this.scene.isAlone) {
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
                .text(function(scene){ return scene.acts.value.label; })
                ;
        }
    },

    /**
     * @override
     */
    applyExtensions: function(){

        this.base();

        // Extend lineLabel
        this.extend(this.pvLabel, "lineLabel_");
        
        this.extend(this.pvScatterPanel, "scatterPanel_");
        this.extend(this.pvArea,  "area_");
        this.extend(this.pvLine,  "line_");
        this.extend(this.pvDot,   "dot_");
        this.extend(this.pvLabel, "label_");
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
  
    _buildScene: function(catAxisData, serAxisData, data, valueDimName, isBaseDiscrete){
        var rootScene = new pvc.visual.Scene(null, {panel: this, group: data});
        
        var chart = this.chart,
            ownerValueDim = data.owner.dimensions(valueDimName),
            options = chart.options,
            isStacked = options.stacked,
            visibleKeyArgs = {visible: true},
            createNullIntermediates = this.showAreas,
            orthoScale = chart.axes.ortho.scale,
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
        
        var categDatas = catAxisData._children;
        
        /** 
         * Create starting scene tree 
         */
        serAxisData
            .children()
            .each(createSeriesScene, this);
        
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
            var seriesScene = new pvc.visual.Scene(rootScene, {group: seriesData1}),
                seriesKey   = seriesData1.key;
            
            seriesScene.acts.series = {
                value: seriesData1.value,
                label: seriesData1.label
            };
            
            categDatas.forEach(function(categData1){
                /* Create leaf scene */
                var categKey = categData1.key,
                    group = data._childrenByKey[categKey]._childrenByKey[seriesKey],
                    
                    /* If there's no group, provide, at least, a null datum */
                    datum = group ? null : createNullDatum(seriesData1, categData1),
                    scene = new pvc.visual.Scene(seriesScene, {group: group, datum: datum});
                
                scene.acts.category = {
                    value: categData1.value,
                    label: categData1.label
                };
                
                var value = group ? group.dimensions(valueDimName).sum(visibleKeyArgs) : null;
                scene.acts.value = {
                    /* accumulated value, for stacked */
                    accValue: value != null ? value : orthoNullValue,
                    value:    value,
                    label:    ownerValueDim.format(value)
                };
                
                scene.isNull = !group; // A virtual scene?
                scene.isIntermediate = false;
            });
        }
        
        function completeSeriesScenes(seriesScene) {
            var seriesScenes2 = [],
                seriesScenes = seriesScene.childNodes, 
                fromScene;
            
            /* As intermediate nodes are added, 
             * seriesScene.childNodes array is changed.
             * 
             * The var 'toChildIndex' takes inserts into account;
             * its value is always the index of 'toScene' in 
             * seriesScene.childNodes.
             */
            for(var c = 0, /* category index */
                    toChildIndex = 0, 
                    categCount = seriesScenes.length ; c < categCount ; c++, toChildIndex++) {
                
                var toScene = seriesScenes[toChildIndex],
                    c2 = c * 2; /* doubled category index, for seriesScenes2  */
                
                seriesScenes2[c2] = toScene;
                
                /* Complete toScene */
                completeMainScene(
                        seriesScene,
                        fromScene, 
                        toScene,
                        /* belowScene */ belowSeriesScenes2 && belowSeriesScenes2[c2]);
                
                
                /* Possibly create intermediate scene 
                 * (between fromScene and toScene) 
                 */
                if(fromScene) {
                    var interScene = createIntermediateScene(
                            seriesScene,
                            fromScene, 
                            toScene,
                            toChildIndex,
                            /* belowScene */ belowSeriesScenes2 && belowSeriesScenes2[c2 - 1]);
                    
                    if(interScene){
                        seriesScenes2[c2 - 1] = interScene;
                        toChildIndex++;
                    }
                }
                
                // --------
                
                fromScene = toScene;
            }
            
            if(isStacked){
                belowSeriesScenes2 = seriesScenes2;
            } 
        }
        
        function completeMainScene(
                      seriesScenes, 
                      fromScene, 
                      toScene, 
                      belowScene){
            
            var toAccValue = toScene.acts.value.accValue;
            
            if(belowScene) {
                if(toScene.isNull && !isBaseDiscrete) {
                    toAccValue = orthoNullValue;
                } else {
                    toAccValue += belowScene.acts.value.accValue;
                }
                
                toScene.acts.value.accValue = toAccValue;
            }
            
            toScene.basePosition  = sceneBaseScale(toScene);
            toScene.orthoPosition = orthoZero;
            toScene.orthoLength   = orthoScale(toAccValue) - orthoZero;
            
            var isAlone  = !toScene.isNull && (!fromScene || fromScene.isNull),
                isSingle = isAlone;
            if(isAlone) {
                // Look ahead
                var nextScene = toScene.nextSibling;
                isAlone  = !nextScene || nextScene.isNull;
                isSingle = !fromScene && !nextScene;
            }
            
            toScene.isAlone  = isAlone;
            toScene.isSingle = isSingle;
        }
        
        function createIntermediateScene(
                     seriesScene, 
                     fromScene, 
                     toScene, 
                     toChildIndex,
                     belowScene){
            
            var interIsNull = fromScene.isNull || toScene.isNull;
            if(interIsNull && !createNullIntermediates) {
                return null;
            }
            
            var interValue, interAccValue, interBasePosition;
                
            if(interIsNull) {
                if(belowScene && isBaseDiscrete) {
                    var belowValueAct = belowScene.acts.value;
                    interAccValue = belowValueAct.accValue;
                    interValue = belowValueAct.value;
                } else {
                    interValue = interAccValue = orthoNullValue;
                }
                
                if(isStacked && isBaseDiscrete) {
                    // The intermediate point is at the start of the "to" band
                    interBasePosition = toScene.basePosition - sceneBaseScale.halfBand;
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
                var fromValueAct = fromScene.acts.value,
                    toValueAct   = toScene.acts.value;
                
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
            interScene.acts.value = {
                accValue: interAccValue,
                value:    interValue,
                label:    ownerValueDim.format(interValue)
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
            while(L && seriesScenes[0].isNull) {
                seriesScene.removeAt(0);
                L--;
            }
            
            while(L && seriesScenes[L - 1].isNull) {
                seriesScene.removeAt(L - 1);
                L--;
            }
        } 
        
        function createNullDatum(serData1, catData1) {
            // Create a null datum with col and row coordinate atoms
            var atoms = def.array.append(
                            def.own(serData1.atoms),
                            def.own(catData1.atoms));
            
            return new pvc.data.Datum(data, atoms, true);
        }
    }
});
