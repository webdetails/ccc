
/*
 * Metric Line/Dot panel.
 * Class that draws dot and line plots.
 * Specific options are:
 * <i>showDots</i> - Show or hide dots. Default: true
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
pvc.MetricLineDotPanel = pvc.CartesianAbstractPanel.extend({
    anchor: 'fill',
    
    pvLine: null,
    pvDot: null,
    pvLabel: null,
    pvScatterPanel: null, 
    
    showLines:  true,
    showDots:   true,
    showValues: true,
    
    valuesAnchor: "right",
    
    dotShape: "circle",
    
    _v1DimRoleName: {
        'series':   'series',
        'category': 'x',
        'value':    'y'
    },
    
    /*
    * @override
    */
   _calcLayout: function(availableSize, layoutInfo){
       this.base(availableSize, layoutInfo);
       
       // --------------------
       /* Adjust axis offset to avoid dots getting off the content area */
       
       var chart = this.chart;
       
       if(chart._dotSizeDim){
           /* Determine Max/Min Dot Size */
           var length = Math.max((this.width + this.height) / 2, 2);
           var maxRadius = length / 8;
           if(this.dotShape === 'diamond'){
               // Protovis draws diamonds inscribed on
               // a square with half-side radius*Math.SQRT2
               // (so that diamonds just look like a rotated square)
               // For the height of the dimanod not to exceed the cell size
               // we compensate that factor here.
               maxRadius /= Math.SQRT2;
           }
           
           // Small margin
           maxRadius -= 2;
           
           var maxArea  = maxRadius * maxRadius,
               minArea  = 12,
               areaSpan = maxArea - minArea;
           
           if(areaSpan <= 1){
               // Very little space
               // Rescue Mode - show *something*
               maxArea = Math.max(maxArea, 2);
               minArea = 1;
               areaSpan = maxArea - minArea;
               maxRadius = Math.sqrt(maxArea);
               
               if(pvc.debug >= 3){
                   pvc.log("Using rescue mode dot area calculation due to insufficient space.");
               }
           }
           
           this.maxDotRadius = maxRadius;
           this.maxDotArea   = maxArea;
           this.minDotArea   = minArea;
           this.dotAreaSpan  = areaSpan;
           
           if(!chart.root._explicitAxisOffset){
               /* Half a circle must fit at any edge of the main content area */
               // TODO: Something should be wrong with the calculations?
               // Dots still come out a little bit, and this compensates for it.
               var offsetRadius  = maxRadius + 6,
                   minAxisOffset = pvc.MetricXYAbstract.defaultOptions.axisOffset,
                   axisOffset = offsetRadius / Math.max(this.width, 2);

               if(axisOffset > minAxisOffset){
                   if(pvc.debug >= 3){
                       pvc.log(def.format("Using X axis offset of '{0}' to compensate for dot size.", [axisOffset]));
                   }
                   
                   chart.options.xAxisOffset = axisOffset;
               }

               axisOffset = offsetRadius / Math.max(this.height, 2);
               if(axisOffset > minAxisOffset){
                   if(pvc.debug >= 3){
                       pvc.log(def.format("Using Y axis offset of '{0}' to compensate for dot size.", [axisOffset]));
                   }

                   chart.options.yAxisOffset = axisOffset;
               }
           }
        } else {
            /* Make X and Y axis offsets take the same abs width */
            /* TODO: should be able to test if any offset, X, or Y is the default value... */
            var defaultAxisOffset = pvc.MetricXYAbstract.defaultOptions.axisOffset,
                xAxisOffset = chart.axes.x.options('Offset'),
                yAxisOffset = chart.axes.y.options('Offset'),
                adjustX = (xAxisOffset === defaultAxisOffset),
                adjustY = (yAxisOffset === defaultAxisOffset);

            if(adjustX || adjustY){
                var offsetLength;

                if(adjustX && adjustY){
                    offsetLength = Math.max(this.width, this.height) * xAxisOffset;
                } else if(adjustX){
                    offsetLength = this.height * yAxisOffset;
                } else /*if(adjustY) */{
                    offsetLength = this.width * xAxisOffset;
                }

                if(adjustX){
                    this.chart.options.xAxisOffset = xAxisOffset = offsetLength / Math.max(this.width, 2);
                    if(pvc.debug >= 3){
                       pvc.log(def.format("Using X axis offset of '{0}' to balance with that of Y axis.", [xAxisOffset]));
                   }
                }

                if(adjustY){
                    this.chart.options.yAxisOffset = yAxisOffset = offsetLength / Math.max(this.height, 2);
                    if(pvc.debug >= 3){
                       pvc.log(def.format("Using Y axis offset of '{0}' to balance with that of X axis.", [yAxisOffset]));
                   }
                }
            }
        }
   },
    
    /**
     * @override
     */
    _createCore: function(){
        this.base();
         
        var myself = this,
            chart = this.chart,
            options = chart.options,
            invisibleFill = 'rgba(127,127,127,0.00001)';

        // ------------------
        // DATA
        var data            = chart._getVisibleData(), // shared "series" grouped data
            isDense         = !(this.width > 0) || (data._leafs.length / this.width > 0.5), //  > 100 pts / 200 pxs
            hasColorRole    = !!chart._colorRole.grouping,
            hasDotSizeRole  = this.showDots && !!chart._dotSizeDim,
            sizeValueToArea; 
        
        if(hasDotSizeRole){
            sizeValueToArea = this._getDotSizeRoleScale();
            if(!sizeValueToArea){
                hasDotSizeRole = false;
            }
        }
                    
        var rootScene = this._buildScene(data, hasColorRole, hasDotSizeRole);

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
        
        // -- LINE --
        var line = new pvc.visual.Line(this, this.pvScatterPanel, {
                extensionId: 'line'
            })
            /* Data */
            .lock('data', function(seriesScene){ return seriesScene.childNodes; }) // TODO    
            
            .lockValue('visible', this.showLines)
            
            /* Position & size */
            .override('x', function(){ return this.scene.basePosition;  })
            .override('y', function(){ return this.scene.orthoPosition; })
            ;
        
        this.pvLine = line.pvMark;
            
        // -- DOT --
        var dot = new pvc.visual.Dot(this, this.pvLine, {
                extensionId: 'dot',
                activeSeriesAware: this.showLines
            })
            .intercept('visible', function(){
                return !this.scene.isIntermediate && this.delegate(true);
            })
            .lockValue('shape', this.dotShape)
            .override('x',  function(){ return this.scene.basePosition;  })
            .override('y',  function(){ return this.scene.orthoPosition; })
            .override('color', function(type){
                /* 
                 * Handle showDots
                 * -----------------
                 * Despite !showDots,
                 * show a dot anyway when:
                 * 1) it is active, or
                 * 2) it is single  (the only dot in the dataset)
                 */
                if(!myself.showDots){
                    var visible = this.scene.isActive ||
                                  this.scene.isSingle;
                    if(!visible) {
                        return invisibleFill;
                    }
                }
                
                // Follow normal logic
                return this.base(type);
            })
            ;
            
        this.pvDot = dot.pvMark;
        
        // -- COLOR --
        if(!hasColorRole){
            if(!myself.showLines){
                dot.override('baseColor', function(type){
                    var color = this.base(type);
                    color.opacity = 0.8;
                    return color;
                });
            }
        } else {
            var colorScale = this._getColorRoleScale(data);
            
            line.override('baseColor', function(type){
                var color = this.delegate();
                if(color === undefined){
                    var colorValue = this.scene.acts.color.value;
                    color = colorValue == null ?
                                options.nullColor :
                                colorScale(colorValue);
                }
                
                return color;
            });
            
            dot.override('baseColor', function(type){
                var color = this.delegate();
                if(color === undefined){
                    var colorValue = this.scene.acts.color.value;
                    
                    color = colorValue == null ?
                                options.nullColor :
                                colorScale(colorValue);
                    
                    if(type === 'stroke'){
                        color = color.darker();
                    }
                    
                    if(!myself.showLines){
                        color.opacity = 0.8;
                    }
                }
                
                return color;
            });
            
            dot.override('interactiveColor', function(type, color){
                if(this.scene.isActive) {
                    // Don't make border lighter on active
                    return color;
                }
                
                return this.base(type, color);
            });
        }
        
        // -- DOT SIZE --
        if(!hasDotSizeRole){
            dot.override('baseSize', function(){
                /* When not showing dots, 
                 * but a datum is alone and 
                 * wouldn't be visible using lines,  
                 * show the dot anyway, 
                 * with a size = to the line's width^2
                 */
                if(!myself.showDots) {
                    if(this.scene.isSingle) {
                        // Obtain the line Width of the "sibling" line
                        var lineWidth = Math.max(myself.pvLine.scene[this.pvMark.index].lineWidth, 0.2) / 2;
                        return lineWidth * lineWidth;
                    }
                }
                
                return this.base();
            });
        } else {
            /* Ignore any extension */
            dot.override('baseSize', function(){
                return sizeValueToArea(this.scene.acts.dotSize.value);
            });
        }
        
        // -- LABEL --
        if(this.showValues){
            this.pvLabel = this.pvDot
                .anchor(this.valuesAnchor)
                .add(pv.Label)
                // ------
                .bottom(0)
                .text(function(scene){ 
                    return def.join(",", scene.acts.x.label, scene.acts.y.label);
                })
                ;
        }
    },
    
    /* Ignore 'by series' color.
     * Series, then, only control the dots that are connected with lines.
     * 
     * Color is calculated per datum.
     * Datums of the same series may each have a different color.
     * This is true whether the color dimension is discrete or continuous.
     * When the color dimension is discrete, the effect will look
     * similar to a series color, the difference being that datums
     * may be from the same series (same connected line) and
     * have different colors.
     * If lines are not shown there's however no way to tell if the
     * color comes from the series or from the color role.
     * A "normal" color legend may be shown for the color role.
     * 
     * The color role may be discrete of one or more dimensions, 
     * or continuous.
     * 
     * If the role has 1 continuous dimension,
     * the color scale may be (see pvc.color): 
     * - discrete (continuous->discrete), 
     * - linear or 
     * - normally distributed.
     * 
     * Is the color scale shared between small multiple charts?
     * It should be specifiable. Accordingly, the domain of 
     * the color scale is chosen to be the root or the local data
     * (this does not imply sharing the same color scale function instance).
     * 
     * If the role has 1 discrete dimension, or more than one dimension,
     * the color scale will be discrete (->discrete),
     * behaving just like the series color scale.
     * The colors are taken from the chart's series colors.
     * The domain for the scale is the root data, 
     * thus allowing to show a common color legend, 
     * in case multiple charts are used.
     * 
     */
    _getColorRoleScale: function(data){
        var chart = this.chart,
            options = chart.options;
        
        if(chart._colorRole.grouping.isDiscrete()){
            /* Legend-like color scale */
            var grouping  = chart._colorRole.grouping.singleLevelGrouping(),
                colorData = data.owner.groupBy(grouping), // visible or invisible
                values    = colorData.children()
                              .select(function(child){ return child.value; })
                              .array();
            
            return chart.colors(values);
        }
        
        return pvc.color.scale(
            def.create(false, options, {
                /* Override/create these options, inherit the rest */
                type: options.colorScaleType || 'linear', 
                data: data.owner, // shared scale
                colorDimension: chart._colorRole.firstDimensionName()
            }));
    },
    
    _getDotSizeRoleScale: function(){
        /* Per small chart scale */
        
        // TODO ~ copy paste from HeatGrid
        var sizeValExtent = this.chart._dotSizeDim.extent({visible: true}),
            sizeValMin    = sizeValExtent.min.value,
            sizeValMax    = sizeValExtent.max.value,
            sizeValSpan   = Math.abs(sizeValMax - sizeValMin); // may be zero
        
        if(isFinite(sizeValSpan) && sizeValSpan > 0.001) {
            // Linear mapping
            // TODO: a linear scale object ??
            var sizeSlope = this.dotAreaSpan / sizeValSpan,
                minArea   = this.minDotArea;
            
            if(pvc.debug >= 3){
                pvc.log("Dot Size Scale info: " + JSON.stringify({
                    sizeValMin:  sizeValMin,
                    sizeValMax:  sizeValMax,
                    sizeValSpan: sizeValSpan,
                    sizeSlope:   sizeSlope,
                    minArea:     minArea,
                    dotAreaSpan: this.dotAreaSpan
                }));
            }
            
            return function(sizeVal){
                return minArea + sizeSlope * (sizeVal == null ? 0 : (sizeVal - sizeValMin));
            };
        }
    },
    
    /**
     * @override
     */
    applyExtensions: function(){

        this.base();

        this.extend(this.pvLabel, "lineLabel_");
        this.extend(this.pvScatterPanel, "scatterPanel_");
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
        
        if(this.showLines){
            marks.push(this.pvLine);
        }
        
        return marks;
    },
    
    _buildScene: function(data, hasColorRole){
        var rootScene = new pvc.visual.Scene(null, {panel: this, group: data});
        
        var chart = this.chart,
            sceneBaseScale  = chart.axes.base.sceneScale(),
            sceneOrthoScale = chart.axes.ortho.sceneScale(),
            getColorRoleValue,
            getDotSizeRoleValue;
            
        if(hasColorRole){
             var colorGrouping = chart._colorRole.grouping.singleLevelGrouping();
             if(colorGrouping.isSingleDimension){ // TODO
                 var colorDimName = chart._colorRole.firstDimensionName();
                 
                 getColorRoleValue = function(scene){
                     return scene.atoms[colorDimName].value;
                 };
             } else {
                 // TODO - collect grouping value...
             }
        }
        
        if(chart._dotSizeDim){
            var dotSizeDimName = chart._dotSizeDim.name;
            
            getDotSizeRoleValue = function(scene){
                return scene.atoms[dotSizeDimName].value;
            };
        }
         
        // --------------
        
        /** 
         * Create starting scene tree 
         */
        data.children()
            .each(createSeriesScene, this);
        
        /** 
         * Update the scene tree to include intermediate leaf-scenes,
         * to add in the creation of lines and areas. 
         */
        rootScene
            .children()
            .each(completeSeriesScenes, this);
        
        return rootScene;
        
        function applyScales(scene){
            scene.basePosition  = sceneBaseScale(scene);
            scene.orthoPosition = sceneOrthoScale(scene);
        }
        
        function createSeriesScene(seriesGroup){
            /* Create series scene */
            var seriesScene = new pvc.visual.Scene(rootScene, {group: seriesGroup});
            
            seriesScene.acts.series = {
                value: seriesGroup.value,
                label: seriesGroup.label
            };
            
            seriesGroup.datums().each(function(datum){
                /* Create leaf scene */
                var scene = new pvc.visual.Scene(seriesScene, {datum: datum});
                
                var atom = datum.atoms[chart._xDim.name];
                scene.acts.x = {
                    value: atom.value,
                    label: atom.label
                };
                
                atom = datum.atoms[chart._yDim.name];
                scene.acts.y = {
                    value: atom.value,
                    label: atom.label
                };
                
                if(getColorRoleValue){
                    scene.acts.color = {
                        value: getColorRoleValue(scene),
                        label: null
                    };
                }
                
                if(getDotSizeRoleValue){
                    var dotSizeValue = getDotSizeRoleValue(scene);
                    scene.acts.dotSize = {
                        value: dotSizeValue,
                        label: chart._dotSizeDim.format(dotSizeValue)
                    };
                }
                
                scene.isIntermediate = false;
                
                applyScales(scene);
            });
        }
        
        function completeSeriesScenes(seriesScene) {
            var seriesScenes = seriesScene.childNodes, 
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
                    pointCount = seriesScenes.length ; c < pointCount ; c++, toChildIndex++) {
                
                /* Complete toScene */
                var toScene = seriesScenes[toChildIndex];
                toScene.isSingle = !fromScene && !toScene.nextSibling;  // Look ahead
                
                /* Possibly create intermediate scene 
                 * (between fromScene and toScene)
                 */
                if(fromScene) {
                    var interScene = createIntermediateScene(
                            seriesScene,
                            fromScene, 
                            toScene,
                            toChildIndex);
                    
                    if(interScene){
                        toChildIndex++;
                    }
                }
                
                // --------
                
                fromScene = toScene;
            }
        }
        
        function createIntermediateScene(
                     seriesScene, 
                     fromScene, 
                     toScene, 
                     toChildIndex){
            
            /* Code for single, continuous and numeric dimensions */
            var interYValue = (toScene.acts.y.value + fromScene.acts.y.value) / 2;
            var interXValue = (toScene.acts.x.value + fromScene.acts.x.value) / 2;
            
            //----------------
            
            var interScene = new pvc.visual.Scene(seriesScene, {
                    /* insert immediately before toScene */
                    index: toChildIndex,
                    datum: toScene.datum
                });
            
            interScene.acts.x = {
                value: interXValue,
                label: chart._xDim.format(interXValue)
            };
            
            interScene.acts.y = {
                value: interYValue,
                label: chart._yDim.format(interYValue)
            };
            
            if(getColorRoleValue){
                interScene.acts.color = toScene.acts.color;
            }
            
            if(getDotSizeRoleValue){
                interScene.acts.dotSize = toScene.acts.dotSize;
            }
            
            interScene.isIntermediate = true;
            interScene.isSingle = false;
            
            applyScales(interScene);
            
            return interScene;
        }
    }
});
