
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
    
    // Ratio of the biggest bubble diameter to 
    // the length of plot area dimension according to option 'dotSizeRatioTo'
    dotSizeRatio: 1/5,
    
    dotSizeRatioTo: 'minWidthHeight', // 'height', 'width', 
    
    autoDotSizePadding: true,
    
    _v1DimRoleName: {
        'series':   'series',
        'category': 'x',
        'value':    'y'
    },
    
    constructor: function(chart, parent, options) {
        
        this.base(chart, parent, options);
        
        if(!this.offsetPaddings){
            this.offsetPaddings = new pvc.Sides(0.01);
        }
    },
    
    _creating: function(){
        // Register BULLET legend prototype marks
        var groupScene = this.defaultVisibleBulletGroupScene();
        if(groupScene && !groupScene.hasRenderer()){
            var colorAxis = groupScene.colorAxis;
            var drawMarker = def.nullyTo(colorAxis.option('DrawMarker', true), this.showDots);
            var drawRule   = def.nullyTo(colorAxis.option('DrawLine',   true), this.showLines);
            if(drawMarker || drawRule){
                var keyArgs = {};
                if((keyArgs.drawMarker = drawMarker)){
                    keyArgs.markerShape = colorAxis.option('Shape', true) 
                                          || 'circle'; // Dot's default shape
                    keyArgs.markerPvProto = new pv.Dot()
                            .lineWidth(1.5)
                            .shapeSize(12);
                    
                    this.extend(keyArgs.markerPvProto, 'dot_', {constOnly: true});
                }
                
                if((keyArgs.drawRule = drawRule)){
                    keyArgs.rulePvProto = new pv.Line()
                            .lineWidth(1.5);
                    
                    this.extend(keyArgs.rulePvProto, 'line_', {constOnly: true});
                }
                
                groupScene.renderer(
                    new pvc.visual.legend.BulletItemDefaultRenderer(keyArgs));
            }
        }
    },
    
    _getRootScene: function(){
        var rootScene = this._rootScene;
        if(!rootScene){
            // First time stuff
            var chart = this.chart;
            // Shared "series" grouped data
            var data = this._getVisibleData();
            var hasColorRole = !!chart._colorRole.grouping;
            var hasDotSizeRole = this.showDots && !!chart._dotSizeDim;
            
            var sizeValRange;
            if(hasDotSizeRole){
                var sizeValExtent = chart._dotSizeDim.extent({visible: true});
                hasDotSizeRole = !!sizeValExtent;
                if(hasDotSizeRole){
                   var sizeValMin  = sizeValExtent.min.value,
                       sizeValMax  = sizeValExtent.max.value;

                    //Need to calculate manually the abs - probably there's a better way to do this
                    if (this.dotSizeAbs) {
                        var atoms = chart._dotSizeDim.atoms({visible:true});
                        
                        for (var i=0; i < atoms.length; i++) {
                            if (i == 0)
                                sizeValMin = sizeValMax = Math.abs(atoms[0].value);
                            else {
                                var newValue = Math.abs(atoms[i].value);
                                if (newValue > sizeValMax) sizeValMax = newValue;
                                if (newValue < sizeValMin) sizeValMin = newValue;
                            }                            
                        }                    
                    }
                                
                    var sizeValSpan = Math.abs(sizeValMax - sizeValMin); // may be zero
                    
                    hasDotSizeRole = isFinite(sizeValSpan) && sizeValSpan > 1e-12;
                    if(hasDotSizeRole){
                        sizeValRange = {min: sizeValMin, max: sizeValMax};
                    }
                }
            }
            
            rootScene = this._buildScene(data, hasColorRole, hasDotSizeRole);
            
            rootScene.sizeValRange = sizeValRange; // TODO: not pretty?
            
            this._rootScene = rootScene;
        }
        
        return rootScene;
    },
    
    /*
    * @override
    */
    _calcLayout: function(layoutInfo){
        var chart = this.chart;
        var rootScene = this._getRootScene();
        var clientSize = layoutInfo.clientSize;
        
        /* Adjust axis offset to avoid dots getting off the content area */
        
        if(rootScene.hasDotSizeRole){
            /* Determine Max/Min Dot Size */
            
            var radiusRange = this._calcDotRadiusRange(layoutInfo);
            
            // Diamond Adjustment
            if(this.dotShape === 'diamond'){
                // Protovis draws diamonds inscribed on
                // a square with half-side radius*Math.SQRT2
                // (so that diamonds just look like a rotated square)
                // For the height/width of the dimanod not to exceed the cell size
                // we compensate that factor here.
                radiusRange.max /= Math.SQRT2;
                radiusRange.min /= Math.SQRT2;
            }
           
            var maxArea   = radiusRange.max * radiusRange.max,
                minArea   = radiusRange.min * radiusRange.min,
                areaSpan = maxArea - minArea;
           
            if(areaSpan <= 1){
                // Very little space
                // Rescue Mode - show *something*
                maxArea  = Math.max(maxArea, 2);
                minArea  = 1;
                areaSpan = maxArea - minArea;
               
                radiusRange = {
                    min: Math.sqrt(minArea),
                    max: Math.sqrt(maxArea)
                };
               
                if(pvc.debug >= 3){
                    pvc.log("Using rescue mode dot area calculation due to insufficient space.");
                }
            }
           
            this.maxDotRadius = radiusRange.max;
           
            this.maxDotArea  = maxArea;
            this.minDotArea  = minArea;
            this.dotAreaSpan = areaSpan;
           
            this.dotSizeScale = this._getDotSizeRoleScale(rootScene.sizeValRange);
        }
        
        this._calcAxesPadding(layoutInfo, rootScene);
    },
  
   _getDotDiameterRefLength: function(layoutInfo){
       // Use the border box to always have the same size for != axis offsets (paddings)
       
       var clientSize = layoutInfo.clientSize;
       var paddings   = layoutInfo.paddings;
       
       switch(this.dotSizeRatioTo){
           case 'minWidthHeight': 
               return Math.min(
                       clientSize.width  + paddings.width, 
                       clientSize.height + paddings.height);
           
           case 'width':  return clientSize.width  + paddings.width ;
           case 'height': return clientSize.height + paddings.height;
       }
       
       if(pvc.debug >= 2){
           pvc.log(
              def.format(
                  "Invalid option 'dotSizeRatioTo' value. Assuming 'minWidthHeight'.", 
                  [this.dotSizeRatioTo]));
       }
       
       this.dotSizeRatioTo = 'minWidthHeight';
       
       return this._getDotDiameterRefLength(layoutInfo);
   },
   
   _calcDotRadiusRange: function(layoutInfo){
       var refLength = this._getDotDiameterRefLength(layoutInfo);
       
       // Diameter is 1/5 of ref length
       var max = (this.dotSizeRatio / 2) * refLength;
       
       // Minimum SIZE (not radius) is 12
       var min = Math.sqrt(12); 
       
       return {min: min, max: max};
   },
   
   _calcAxesPadding: function(layoutInfo, rootScene){
       
       // If we were not to take axes rounding padding effect
       // into account, it could be as simple as:
       // var offsetRadius = radiusRange.max + 6;
       // requestPaddings = new pvc.Sides(offsetRadius);
       
       var requestPaddings;
       
       if(!this.autoDotSizePadding){
           requestPaddings = this._calcRequestPaddings(layoutInfo);
       } else {
           var chart = this.chart;
           var axes  = chart.axes;
           var clientSize = layoutInfo.clientSize;
           var paddings   = layoutInfo.paddings;
           
           requestPaddings = {};
           
           /* The Worst case implementation would be like:
            *   Use more padding than is required in many cases,
            *   but ensures that no dot ever leaves the "stage".
            * 
            *   Half a circle must fit in the client area
            *   at any edge of the effective plot area 
            *   (the client area minus axis offsets).
            */
           
           // X and Y axis orientations
           axes.x.setScaleRange(clientSize.width );
           axes.y.setScaleRange(clientSize.height);
           
           // X and Y visual roles
           var sceneXScale = chart.axes.base.sceneScale({sceneVarName:  'x'});
           var sceneYScale = chart.axes.ortho.sceneScale({sceneVarName: 'y'});
           
           var xLength = chart.axes.base.scale.max;
           var yLength = chart.axes.ortho.scale.max;
           
           var hasDotSizeRole = rootScene.hasDotSizeRole;
           var sizeScale = this.dotSizeScale;
           if(!hasDotSizeRole){
               // Use the dot default size
               var defaultSize = def.number.as(this._getExtension('dot', 'shapeRadius'), 0);
               if(!(defaultSize > 0)){
                   defaultSize = def.number.as(this._getExtension('dot', 'shapeSize'), 0);
                   if(!(defaultSize) > 0){
                       defaultSize = 12;
                   }
               } else {
                   // Radius -> Size
                   defaultSize = defaultSize * defaultSize;
               }
               
               sizeScale = def.fun.constant(defaultSize);
           }
           
           // TODO: these padding requests do not take the resulting new scale into account
           // and as such do not work exactly...
           //var xMinPct = xScale(xDomain.min) /  clientSize.width;
           //var overflowLeft = (offsetRadius - xMinPct * (paddings.left + clientSize.width)) / (1 - xMinPct);
           
           requestPaddings = {};
           
           // Resolve (not of PercentValue so cannot use pvc.Sides#resolve)
           var op;
           if(this.offsetPaddings){
               op = {};
               pvc.Sides.names.forEach(function(side){
                   var len_a = pvc.BasePanel.orthogonalLength[side];
                   op[side] = (this.offsetPaddings[side] || 0) * (clientSize[len_a] + paddings[len_a]);
               }, this);
           }
           
           var setSide = function(side, padding){
               if(op){
                   padding += (op[side] || 0);
               }
               
               if(padding < 0){
                   padding = 0;
               }
               
               var value = requestPaddings[side];
               if(value == null || padding > value){
                   requestPaddings[side] = padding;
               }
           };
           
           var processScene = function(scene){
               var x = sceneXScale(scene);
               var y = sceneYScale(scene);
               var r = Math.sqrt(sizeScale(hasDotSizeRole ? scene.vars.dotSize.value : 0));
               
               // How much overflow on each side?
               setSide('left',   r - x);
               setSide('bottom', r - y);
               setSide('right',  x + r - xLength );
               setSide('top',    y + r - yLength);
           };
           
           rootScene
               .children()
               .selectMany(function(seriesScene){ return seriesScene.childNodes; })
               .each(processScene);
       }
       
       layoutInfo.requestPaddings = requestPaddings;
   },
   
    /**
     * @override
     */
    _createCore: function(layoutInfo){
        this.base();
         
        var myself = this,
            chart = this.chart,
            options = chart.options;

        // ------------------
        // DATA
        var rootScene = this._getRootScene(),
            data      = rootScene.group,
            // data._leafs.length is currently an approximation of datum count due to datum filtering in the scenes only...
            isDense   = !(this.width > 0) || (data._leafs.length / this.width > 0.5); //  > 100 pts / 200 pxs 
        
        this._finalizeScene(rootScene);

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
        
        // this.pvPanel.strokeStyle('red');
        
        this.pvPanel.zOrder(1); // Above axes
        
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
                        return pvc.invisibleFill;
                    }
                }
                
                // Follow normal logic
                return this.base(type);
            })
            ;
            
        this.pvDot = dot.pvMark;
        
        this.pvDot.rubberBandSelectionMode = 'center';
        
        // -- COLOR --
        // When no lines are shown, dots are shown with transparency,
        // which helps in distinguishing overlapped dots.
        // With lines shown, it would look strange.
        if(!rootScene.hasColorRole){
            // ANALYZER requirements, so until there's no way to configure it...
//            if(!myself.showLines){
//                dot.override('baseColor', function(type){
//                    var color = this.base(type);
//                    color.opacity = 0.85;
//                    return color;
//                });
//            }
        } else {
            var colorScale = this._getColorRoleScale(data);
            
            line.override('baseColor', function(type){
                var color = this.delegate();
                if(color === undefined){
                    var colorValue = this.scene.vars.color.value;
                    color = colorValue == null ?
                                options.nullColor :
                                colorScale(colorValue);
                }
                
                return color;
            });
            
            dot.override('baseColor', function(type){
                var color = this.delegate();
                if(color === undefined){
                    var colorValue = this.scene.vars.color.value;
                    
                    color = colorValue == null ?
                                options.nullColor :
                                colorScale(colorValue);
                    
                    if(type === 'stroke'){
                        color = color.darker();
                    }
                    
                 // ANALYZER requirements, so until there's no way to configure it...
//                    if(!myself.showLines){
//                        color = color.alpha(color.opacity * 0.85);
//                    }
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
        if(!rootScene.hasDotSizeRole){
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
            var sizeValueToArea = this._getDotSizeRoleScale(rootScene.sizeValRange);

            var dotSizeAbs = this.dotSizeAbs;
            if (this.dotSizeAbs) {
                dot.override('strokeColor', function () {
                    return this.scene.vars.dotSize.value < 0 ? "#000000" : null;
                });
            }


            /* Ignore any extension */
            dot .override('baseSize', function(){
                    var value = this.scene.vars.dotSize.value;
                    if (dotSizeAbs)
                        value = Math.abs(value);
                    return sizeValueToArea(value);
                })
                .override('interactiveSize', function(size){
                    if(this.scene.isActive){
                        var radius = Math.sqrt(size) * 1.1;
                        return radius * radius;
                    }
                    
                    return size;
                })
                ;
            
            // Default is to hide overflow dots, 
            // for a case where the provided offset, or calculated one is not enough 
            // (dotSizeRatioTo='width' or 'height' don't guarantee no overflow)
            // Padding area is used by the bubbles.
            this.pvPanel.borderPanel.overflow("hidden");
        }
        
        // -- LABEL --
        if(this.showValues){
            this.pvLabel = this.pvDot
                .anchor(this.valuesAnchor)
                .add(pv.Label)
                // ------
                .bottom(0)
                .text(function(scene){ 
                    return def.string.join(",", scene.vars.x.label, scene.vars.y.label);
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
            var colorValues = chart._colorRole
                                .flatten(data.owner) // visible or invisible
                                .children()
                                .select(function(child){ return child.value; })
                                .array();
            
            return chart.colors(colorValues);
        }
        
        return pvc.color.scale(
            def.create(false, options, {
                /* Override/create these options, inherit the rest */
                type: options.colorScaleType || 'linear', 
                data: data.owner, // shared scale
                colorDimension: chart._colorRole.firstDimensionName()
            }));
    },
    
    _getDotSizeRoleScale: function(sizeValRange){
        /* Per small chart scale */
        // TODO ~ copy paste from HeatGrid        

        var sizeValMin  = sizeValRange.min,
            sizeValMax  = sizeValRange.max,
            sizeValSpan = sizeValMax - sizeValMin; // > 0
        
        // Linear mapping
        // TODO: a linear scale object ??
        var sizeSlope = this.dotAreaSpan / sizeValSpan,
            minArea   = this.minDotArea;
        
        return function(sizeVal){
            return minArea + sizeSlope * (sizeVal == null ? 0 : (sizeVal - sizeValMin));
        };
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
    
    _finalizeScene: function(rootScene){
        var chart = this.chart,
            sceneBaseScale  = chart.axes.base.sceneScale({sceneVarName: 'x'}),
            sceneOrthoScale = chart.axes.ortho.sceneScale({sceneVarName: 'y'});
        
        rootScene
            .children()
            .selectMany(function(seriesScene){ return seriesScene.childNodes; })
            .each(function(leafScene){
                leafScene.basePosition  = sceneBaseScale(leafScene);
                leafScene.orthoPosition = sceneOrthoScale(leafScene);
            }, this);
    
        return rootScene;
    },
    
    _buildScene: function(data, hasColorRole, hasDotSizeRole){
        var rootScene = new pvc.visual.Scene(null, {panel: this, group: data});
        rootScene.hasColorRole = hasColorRole;
        rootScene.hasDotSizeRole = hasDotSizeRole;
        
        var chart = this.chart,
            getColorRoleValue,
            getDotSizeRoleValue;
        
        if(hasColorRole){
             var colorGrouping = chart._colorRole.grouping;//.singleLevelGrouping();
             if(colorGrouping.isSingleDimension){ // TODO
                 var colorDimName = chart._colorRole.firstDimensionName();
                 
                 getColorRoleValue = function(scene){
                     return scene.atoms[colorDimName].value;
                 };
             } else {
                 getColorRoleValue = function(scene) {
                     return colorGrouping.view(scene.datum).value;
                 };
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
        
        function createSeriesScene(seriesGroup){
            /* Create series scene */
            var seriesScene = new pvc.visual.Scene(rootScene, {group: seriesGroup});
            
            seriesScene.vars.series = new pvc.visual.ValueLabelVar(
                                seriesGroup.value,
                                seriesGroup.label);
            
            seriesGroup.datums().each(function(datum){
                var xAtom = datum.atoms[chart._xDim.name];
                if(xAtom.value == null){
                    return;
                }
                
                var yAtom = datum.atoms[chart._yDim.name];
                if(yAtom.value == null){
                    return;
                }
                
                /* Create leaf scene */
                var scene = new pvc.visual.Scene(seriesScene, {datum: datum});
                
                scene.vars.x = new pvc.visual.ValueLabelVar(xAtom.value, xAtom.label);
                scene.vars.y = new pvc.visual.ValueLabelVar(yAtom.value, yAtom.label);
                
                if(getColorRoleValue){
                    scene.vars.color = new pvc.visual.ValueLabelVar(
                                getColorRoleValue(scene),
                                "");
                }
                
                if(getDotSizeRoleValue){
                    var dotSizeValue = getDotSizeRoleValue(scene);
                    scene.vars.dotSize = new pvc.visual.ValueLabelVar(
                                            dotSizeValue,
                                            chart._dotSizeDim.format(dotSizeValue));
                }
                
                scene.isIntermediate = false;
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
            var interYValue = (toScene.vars.y.value + fromScene.vars.y.value) / 2;
            var interXValue = (toScene.vars.x.value + fromScene.vars.x.value) / 2;
            
            //----------------
            
            var interScene = new pvc.visual.Scene(seriesScene, {
                    /* insert immediately before toScene */
                    index: toChildIndex,
                    datum: toScene.datum
                });
            
            interScene.vars.x = new pvc.visual.ValueLabelVar(
                                    interXValue,
                                    chart._xDim.format(interXValue));
            
            interScene.vars.y = new pvc.visual.ValueLabelVar(
                                    interYValue,
                                    chart._yDim.format(interYValue));
            
            if(getColorRoleValue){
                interScene.vars.color = toScene.vars.color;
            }
            
            if(getDotSizeRoleValue){
                interScene.vars.dotSize = toScene.vars.dotSize;
            }
            
            interScene.isIntermediate = true;
            interScene.isSingle = false;
            
            return interScene;
        }
    }
});
