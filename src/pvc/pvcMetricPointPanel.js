
/*
 * Metric Line/Dot panel.
 * Class that draws dot and line plots.
 * Specific options are:
 * <i>dotsVisible</i> - Show or hide dots. Default: true
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
.type('pvc.MetricPointPanel', pvc.CartesianAbstractPanel)
.init(function(chart, parent, plot, options) {
    
    this.base(chart, parent, plot, options);
    
    var sizeAxisIndex = plot.option('SizeAxis');
    this.axes.size  = sizeAxisIndex != null ? chart.getAxis('size', sizeAxisIndex - 1) : null;
    this.linesVisible  = plot.option('LinesVisible'); // TODO
    this.dotsVisible   = plot.option('DotsVisible' ); // TODO
    if(!this.linesVisible && !this.dotsVisible){
        this.linesVisible = true;
        plot.option.specify({'LinesVisible': true});
    }
    
    this.dotShape = plot.option('Shape');
    
    if(!this.offsetPaddings){
        this.offsetPaddings = new pvc.Sides(0.01);
    }
})
.add({
    
    pvLine: null,
    pvDot: null,
    pvLabel: null,
    pvScatterPanel: null, 
    
    dotShape: "circle",
    
    // Ratio of the biggest bubble diameter to 
    // the length of plot area dimension according to option 'sizeAxisRatioTo'
    sizeAxisRatio: 1/5,
    
    sizeAxisRatioTo: 'minWidthHeight', // 'height', 'width', 
    
    autoPaddingByDotSize: true,
    
    // Override default mappings
    _v1DimRoleName: {
        //'series':   'series',
        'category': 'x',
        'value':    'y'
    },
    
    _creating: function(){
        // Register BULLET legend prototype marks
        var groupScene = this.defaultVisibleBulletGroupScene();
        if(groupScene && !groupScene.hasRenderer()){
            var colorAxis = groupScene.colorAxis;
            var drawMarker = def.nullyTo(colorAxis.option('LegendDrawMarker', true), this.dotsVisible);
            var drawRule   = def.nullyTo(colorAxis.option('LegendDrawLine',   true), this.linesVisible);
            if(drawMarker || drawRule){
                var keyArgs = {};
                if((keyArgs.drawMarker = drawMarker)){
                    keyArgs.markerShape = 
                        colorAxis.option('LegendShape', true) || 
                        'circle'; // Dot's default shape
                    
                    keyArgs.markerPvProto = new pv.Dot()
                            .lineWidth(1.5, pvc.extensionTag) // act as if it were a user extension
                            .shapeSize(12, pvc.extensionTag); // idem
                    
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
    
    _getRootScene: function(){
        var rootScene = this._rootScene;
        if(!rootScene){
            var hasColorRole = this.chart._colorRole.isBound();
            
            var sizeAxis = this.axes.size;
            var hasSizeRole = sizeAxis && sizeAxis.isBound() && !sizeAxis.scale.isNull;
            
            // --------------
            
            this._rootScene = 
            rootScene = this._buildScene(hasColorRole, hasSizeRole);
        }
        
        return rootScene;
    },
    
    /*
    * @override
    */
    _calcLayout: function(layoutInfo){
        var rootScene = this._getRootScene();
        
        /* Determine Dot Size Scale */
        if(rootScene.hasSizeRole){
            var areaRange = this._calcDotAreaRange(layoutInfo);
            
            this.sizeScale = this.chart.axes.size
                .setScaleRange(areaRange)
                .scale;
        }
        
        /* Adjust axis offset to avoid dots getting off the content area */
        this._calcAxesPadding(layoutInfo, rootScene);
    },
  
    _getDotDiameterRefLength: function(layoutInfo){
        // Use the border box to always have the same size for != axis offsets (paddings)
       
        var clientSize = layoutInfo.clientSize;
        var paddings   = layoutInfo.paddings;
       
        switch(this.sizeAxisRatioTo){
            case 'minWidthHeight': 
                return Math.min(
                        clientSize.width  + paddings.width, 
                        clientSize.height + paddings.height);
           
            case 'width':  return clientSize.width  + paddings.width ;
            case 'height': return clientSize.height + paddings.height;
        }
       
        if(pvc.debug >= 2){
            this._log(
                def.format(
                    "Invalid option 'sizeAxisRatioTo' value. Assuming 'minWidthHeight'.", 
                    [this.sizeAxisRatioTo]));
        }
       
        this.sizeRatioTo = 'minWidthHeight';
       
        return this._getDotDiameterRefLength(layoutInfo);
    },
   
    _calcDotRadiusRange: function(layoutInfo){
        var refLength = this._getDotDiameterRefLength(layoutInfo);
       
        // Diameter is 1/5 of ref length
        var max = (this.sizeAxisRatio / 2) * refLength;
       
        // Minimum SIZE (not radius) is 12
        var min = Math.sqrt(12); 
       
        return {min: min, max: max};
    },
   
    _calcDotAreaRange: function(layoutInfo){
       
        var radiusRange = this._calcDotRadiusRange(layoutInfo);
       
        // Diamond Adjustment
        if(this.dotShape === 'diamond'){
            // Protovis draws diamonds inscribed on
            // a square with half-side radius*Math.SQRT2
            // (so that diamonds just look like a rotated square)
            // For the height/width of the diamondnot to exceed the cell size
            // we compensate that factor here.
            radiusRange.max /= Math.SQRT2;
            radiusRange.min /= Math.SQRT2;
        }
      
        var maxArea  = radiusRange.max * radiusRange.max,
            minArea  = radiusRange.min * radiusRange.min,
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
                this._log("Using rescue mode dot area calculation due to insufficient space.");
            }
        }
      
        return {
            min:  minArea,
            max:  maxArea,
            span: areaSpan
        };
    },
   
    _calcAxesPadding: function(layoutInfo, rootScene){
        // If we were not to take axes rounding padding effect
        // into account, it could be as simple as:
        // var offsetRadius = radiusRange.max + 6;
        // requestPaddings = new pvc.Sides(offsetRadius);
       
        var requestPaddings;
       
        if(!this.autoPaddingByDotSize){
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
           
            var hasSizeRole = rootScene.hasSizeRole;
            var sizeScale = this.sizeScale;
            if(!hasSizeRole){
                // Use the dot default size
                var defaultSize = def.number.as(this._getExtension('dot', 'shapeRadius'), 0);
                if(defaultSize <= 0){
                    defaultSize = def.number.as(this._getExtension('dot', 'shapeSize'), 0);
                    if(defaultSize <= 0){
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
            
            // TODO: this seams to not be working on negative x, y values
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
                var r = Math.sqrt(sizeScale(hasSizeRole ? scene.vars.size.value : 0));
               
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
            data      = rootScene.group;
            
        this._finalizeScene(rootScene);

        // ---------------
        // BUILD
        
        this.pvPanel.zOrder(1); // Above axes
        
        this.pvScatterPanel = new pvc.visual.Panel(this, this.pvPanel, {
                extensionId: 'panel'
            })
            .lock('data', rootScene.childNodes)
            .pvMark
            ;
        
        var wrapper;
        if(this.compatVersion() <= 1){
            wrapper = function(v1f){
                return function(dotScene){
                    var d = {
                            category: dotScene.vars.x.rawValue,
                            value:    dotScene.vars.y.rawValue
                        };
                    
                    // Compensate for the effect of intermediate scenes on mark's index
                    var pseudo = Object.create(this);
                    pseudo.index = dotScene.dataIndex;
                    return v1f.call(pseudo, d);
                };
            };
        }
        
        // -- LINE --
        var isLineNoSelect = /*dotsVisible && */chart._canSelectWithFocusWindow();
        
        var line = new pvc.visual.Line(this, this.pvScatterPanel, {
                extensionId: 'line',
                wrapper:     wrapper,
                noTooltip:   false,
                noHover:     true,
                noSelect:       isLineNoSelect,
                showsSelection: !isLineNoSelect
            })
            /* Data */
            .lock('data', function(seriesScene){ return seriesScene.childNodes; })    
            
            .lock('visible', this.linesVisible)
            
            /* Position & size */
            .override('x', function(){ return this.scene.basePosition;  })
            .override('y', function(){ return this.scene.orthoPosition; })
            ;
        
        this.pvLine = line.pvMark;
            
        // -- DOT --
        var dot = new pvc.visual.Dot(this, this.pvLine, {
                extensionId: 'dot',
                wrapper:     wrapper,
                activeSeriesAware: this.linesVisible
            })
            .intercept('visible', function(){
                return !this.scene.isIntermediate && this.delegateExtension(true);
            })
            .lock('shape', this.dotShape)
            .override('x',  function(){ return this.scene.basePosition;  })
            .override('y',  function(){ return this.scene.orthoPosition; })
            .override('color', function(type){
                /* 
                 * Handle dotsVisible
                 * -----------------
                 * Despite !dotsVisible,
                 * show a dot anyway when:
                 * 1) it is active, or
                 * 2) it is single  (the only dot in the dataset)
                 */
                if(!myself.dotsVisible){
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
        dot.override('defaultColor', function(type){
            var color = this.base(type);
            
            if(color && type === 'stroke'){
                color = color.darker();
            }
            
            // When no lines are shown, dots are shown with transparency,
            // which helps in distinguishing overlapped dots.
            // With lines shown, it would look strange.
            // ANALYZER requirements, so until there's no way to configure it...
            // TODO: this probably can now be done with ColorTransform
//          if(!myself.linesVisible){
//              color = color.alpha(color.opacity * 0.85);
//          }
            
            return color;
        });
        
        dot.override('interactiveColor', function(color, type){
            if(type === 'stroke' && this.scene.isActive) {
                // Don't make border brighter on active
                return color;
            }
            
            return this.base(color, type);
        });
        
        // -- DOT SIZE --
        if(!rootScene.hasSizeRole){
            dot.override('baseSize', function(){
                /* When not showing dots, 
                 * but a datum is alone and 
                 * wouldn't be visible using lines,  
                 * show the dot anyway, 
                 * with a size = to the line's width^2
                 */
                if(!myself.dotsVisible) {
                    if(this.scene.isSingle) {
                        // Obtain the line Width of the "sibling" line
                        var lineWidth = Math.max(myself.pvLine.scene[this.pvMark.index].lineWidth, 0.2) / 2;
                        return lineWidth * lineWidth;
                    }
                }
                
                return this.base();
            });
        } else {
            var sizeAxis = chart.axes.size;
            if (sizeAxis.scaleUsesAbs()) {
                dot
                .override('strokeColor', function () {
                    return this.scene.vars.size.value < 0 ? "#000000" : this.base();
                })
                .optional('lineCap', 'round') // only used by strokeDashArray
                .optionalMark('strokeDasharray', function (scene){
                    return scene.vars.size.value < 0 ? 'dot' : null; // .  .  .
                })
                .optionalMark('lineWidth', function (scene){
                    return scene.vars.size.value < 0 ? 1.8 : 1.5;
                })
                ;
            }
            
            var sizeScale  = this.sizeScale;
            
            /* Ignore any extension */
            dot .override('baseSize', function(){
                    return sizeScale(this.scene.vars.size.value);
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
            // (sizeAxisRatioTo='width' or 'height' don't guarantee no overflow)
            // Padding area is used by the bubbles.
            this.pvPanel.borderPanel.overflow("hidden");
        }
        
        // -- LABEL --
        if(this.valuesVisible){
            var extensionIds = ['label'];
            if(this.compatVersion() <= 1){
                extensionIds.push('lineLabel');
            }
            
            this.pvLabel = new pvc.visual.Label(
                this, 
                this.pvDot.anchor(this.valuesAnchor), 
                {
                    extensionId: extensionIds,
                    wrapper:     wrapper
                })
                .pvMark
                .font(this.valuesFont) // default
                .text(function(scene){ 
                    return def.string.join(",", scene.vars.x.label, scene.vars.y.label);
                })
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
        
        if(this.linesVisible){
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
    
    _buildScene: function(hasColorRole, hasSizeRole){
        var data = this._getVisibleData();
        var rootScene = new pvc.visual.Scene(null, {panel: this, group: data});
        rootScene.hasColorRole = hasColorRole;
        rootScene.hasSizeRole  = hasSizeRole;
        
        var chart = this.chart;
        var colorVarHelper = new pvc.visual.ColorVarHelper(chart, chart._colorRole);
        var xDimType = chart._xRole.firstDimensionType();
        var yDimType = chart._yRole.firstDimensionType();
        
        var getSizeRoleValue;
        if(chart._sizeDim){
            var sizeDimName = chart._sizeDim.name;
            
            getSizeRoleValue = function(scene){
                return scene.atoms[sizeDimName].value;
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
                                seriesGroup.label,
                                seriesGroup.rawValue);
            
            colorVarHelper.onNewScene(seriesScene, /* isLeaf */ false);
            
            seriesGroup.datums().each(function(datum, dataIndex){
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
                scene.dataIndex = dataIndex;
                scene.vars.x = Object.create(xAtom);
                scene.vars.y = Object.create(yAtom);
                
                if(getSizeRoleValue){
                    var sizeValue = getSizeRoleValue(scene);
                    scene.vars.size = new pvc.visual.ValueLabelVar(
                                            sizeValue,
                                            chart._sizeDim.format(sizeValue),
                                            sizeValue);
                }
                
                colorVarHelper.onNewScene(scene, /* isLeaf */ true);
                
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
            
            /* Code for single, continuous and date/numeric dimensions
             * Calls corresponding dimension's cast to ensure we have a date object,
             * when that's the dimension value type.
             */
            var interYValue = yDimType.cast.call(null, ((+toScene.vars.y.value) + (+fromScene.vars.y.value)) / 2);
            var interXValue = xDimType.cast.call(null, ((+toScene.vars.x.value) + (+fromScene.vars.x.value)) / 2);
            
            //----------------
            
            var interScene = new pvc.visual.Scene(seriesScene, {
                    /* insert immediately before toScene */
                    index: toChildIndex,
                    datum: toScene.datum
                });
            
            interScene.dataIndex = toScene.dataIndex;
            
            interScene.vars.x = new pvc.visual.ValueLabelVar(
                                    interXValue,
                                    chart._xDim.format(interXValue),
                                    interXValue);
            
            interScene.vars.y = new pvc.visual.ValueLabelVar(
                                    interYValue,
                                    chart._yDim.format(interYValue),
                                    interYValue);
            
            if(getSizeRoleValue){
                interScene.vars.size = toScene.vars.size;
            }
            
            colorVarHelper.onNewScene(interScene, /* isLeaf */ true);
            
            interScene.ownerScene = toScene;
            interScene.isIntermediate = true;
            interScene.isSingle = false;
            
            return interScene;
        }
    }
});
