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
    
    nullInterpolationMode: 'linear',
    
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
        this.pvPanel.zOrder(-7);

        this.pvScatterPanel = this.pvPanel.add(pv.Panel)
            .lock('data', rootScene.childNodes)
            ;
        
        // -- AREA --
        var areaFillColorAlpha = showAreas && showLines && !isStacked ? 0.5 : null;
        
        this.pvArea = new pvc.visual.Area(this, this.pvScatterPanel, {
                extensionId: 'area',
                antialias:   showAreas && !showLines,
                segmented:   !isDense,
                noTooltips:  false,
                noHoverable: false // While the area itself does not change appearance, the pvLine does due to activeSeries... 
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
                return (!scene.isNull && !scene.isIntermediate && !scene.isInterpolated) && 
                       this.delegate(true);
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
                                  (!showAloneDots && this.scene.isSingle) ||
                                  (showAloneDots && this.scene.isAlone);
                    
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
                .text(function(scene){ return scene.vars.value.label; })
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
        var rootScene  = new pvc.visual.Scene(null, {panel: this, group: data}),
            categDatas = data._children,
            interpolate = this.nullInterpolationMode === 'linear';
        
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
            sceneBaseScale = chart.axes.base.sceneScale({sceneVarName: 'category'});
        
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
        
        var reversedSeriesScenes = createSeriesScenes.call(this),
            seriesCount = reversedSeriesScenes.length;
        
        // 1st pass
        // Create category infos array.
        var categInfos = categDatas.map(createCategInfo, this);
        
        function createCategInfo(categData1, categIndex){
            
            var categKey = categData1.key;
            var seriesInfos = []; // of this category
            var categInfo = {
                data: categData1,
                value: categData1.value,
                label: categData1.label,
                isInterpolated: false,
                seriesInfos: seriesInfos,
                index: categIndex
            };
            
            reversedSeriesScenes.forEach(function(seriesScene){
                var group = data._childrenByKey[categKey];
                var seriesData1 = seriesScene.vars.series.value == null ? null : seriesScene.group;
                if(seriesData1){
                    group = group._childrenByKey[seriesData1.key];
                }
                
                var value = group ? group.dimensions(valueDim.name).sum(visibleKeyArgs) : null;
                var seriesInfo = {
                    data:   seriesData1,
                    group:  group,
                    value:  value,
                    isNull: value == null,
                    categ:  categInfo
                };
                
                seriesInfos.push(seriesInfo);
            }, this);
            
            return categInfo;
        }
        
        // --------------
        // 2nd pass
        // --------------
        
        // ~ isBaseDiscrete, firstCategDim
        var Interpolation = def
        .type()
        .init(function(categInfos){
            this._categInfos = categInfos;
            this._outCategInfos = [];
            
            this._seriesCount = categInfos.length > 0 ? categInfos[0].seriesInfos.length : 0;
            
            this._seriesStates = def
                .range(0, this._seriesCount)
                .select(function(seriesIndex){ 
                    return new InterpolationSeriesState(this, seriesIndex); 
                }, this)
                .array();
            
            // Determine the sort order of the continuous base categories
            // Categories assumed sorted.
            if(!isBaseDiscrete && categInfos.length >= 2){
                if((+categInfos[1].value) >= (+categInfos[0].value)){
                    this._comparer = def.compare;
                } else {
                    this._comparer = function(b, a){ return def.compare(a, b); };
                }
            }
        })
        .add({
            interpolate: function(){
                var categInfo;
                while((categInfo = this._categInfos.shift())){
                    categInfo.seriesInfos.forEach(this._visitSeries, this);
                    
                    this._outCategInfos.push(categInfo);
                }
                
                return this._outCategInfos;
            },
            
            _visitSeries: function(seriesInfo, seriesIndex){
                this._seriesStates[seriesIndex].visit(seriesInfo);                
            },
            
            firstNonNullOfSeries: function(seriesIndex){
                var categIndex = 0,
                    categCount = this._categInfos.length;
                
                while(categIndex < categCount){
                    var categInfo = this._categInfos[categIndex++];
                    if(!categInfo.isInterpolated){
                        var seriesInfo = categInfo.seriesInfos[seriesIndex];
                        if(!seriesInfo.isNull){
                            return seriesInfo;
                        }
                    }
                }
            },
            
            _setCategory: function(categValue){
                /*jshint expr:true  */
                !isBaseDiscrete || def.assert("Only for continuous base.");
                
                // Insert sort into this._categInfos
                
                function getCategValue(categInfo){ 
                    return +categInfo.value; 
                }
                
                // Check if and where to insert
                var index = def.array.binarySearch(
                                this._categInfos, 
                                +categValue, 
                                this._comparer, 
                                getCategValue);
                if(index < 0){
                    // New category
                    // Insert at the two's complement of index
                    var categInfo = {
                        value: firstCategDim.type.cast(categValue), // possibly creates a Date object
                        isInterpolated: true
                    };
                    
                    categInfo.label = firstCategDim.format(categInfo.value);
                        
                    categInfo.seriesInfos = def
                        .range(0, this._seriesCount)
                        .select(function(seriesScene, seriesIndex){
                            return {
                                value:  null,
                                isNull: true,
                                categ:  categInfo
                            };
                        })
                        .array();
                    
                    this._categInfos.splice(~index, 0, categInfo);
                }
                
                return index;
            }
        });
        
        // ~ isBaseDiscrete, isStacked
        var InterpolationSeriesState = def
        .type()
        .init(function(interpolation, seriesIndex){
            this.interpolation = interpolation;
            this.index = seriesIndex;
            
            this._lastNonNull(null);
        })
        .add({
            visit: function(seriesInfo){
                if(seriesInfo.isNull){
                    this._interpolate(seriesInfo);
                } else {
                    this._lastNonNull(seriesInfo);
                }
            },
            
            _lastNonNull: function(seriesInfo){
                if(arguments.length){
                    this.__lastNonNull = seriesInfo; // Last non-null
                    this.__nextNonNull = undefined;
                }
                
                return this.__lastNonNull;
            },
            
            _nextNonNull: function(){
                return this.__nextNonNull;
            },
            
            _initInterpData: function(){
                if(this.__nextNonNull !== undefined){
                    return;
                }
                
                var next = this.__nextNonNull = this.interpolation.firstNonNullOfSeries(this.index) || null;
                var last = this.__lastNonNull;
                if(next && last){
                    var fromValue  = last.value;
                    var toValue    = next.value;
                    var deltaValue = toValue - fromValue;
                    
                    if(isBaseDiscrete){
                        var stepCount = next.categ.index - last.categ.index;
                        /*jshint expr:true */
                        (stepCount >= 2) || def.assert("Must have at least one interpolation point.");
                        
                        this._stepValue   = deltaValue / stepCount;
                        this._middleIndex = ~~(stepCount / 2); // Math.floor <=> ~~
                        
                        var dotCount = (stepCount - 1);
                        this._isOdd  = (dotCount % 2) > 0;
                    } else {
                        var fromCateg  = +last.categ.data.value;
                        var toCateg    = +next.categ.data.value;
                        var deltaCateg = toCateg - fromCateg;
                        
                        this._steep = deltaValue / deltaCateg; // should not be infinite, cause categories are different
                        
                        this._middleCateg = (toCateg + fromCateg) / 2;
                        
                        // (Maybe) add a category
                        this.interpolation._setCategory(this._middleCateg);
                    }
                }
            },
            
            _interpolate: function(seriesInfo){
                this._initInterpData();
                
                var next = this.__nextNonNull;
                var last = this.__lastNonNull;
                if(!next && !last){
                    return;
                }
                
                var value;
                var group;
                var isInterpolatedMiddle;
                if(next && last){
                    if(isBaseDiscrete){
                        var groupIndex = (seriesInfo.categ.index - last.categ.index);
                        value = last.value + groupIndex * this._stepValue;
                        
                        if(this._isOdd){
                            group = groupIndex < this._middleIndex ? last.group : next.group;
                            isInterpolatedMiddle = groupIndex === this._middleIndex;
                        } else {
                            group = groupIndex <= this._middleIndex ? last.group : next.group;
                            isInterpolatedMiddle = false;
                        }
                        
                    } else {
                        var categ = +seriesInfo.categ.value;
                        var lastCateg = +last.categ.data.value;
                        
                        value = last.value + this._steep * (categ - lastCateg);
                        group = categ < this._middleCateg ? last.group : next.group;
                        isInterpolatedMiddle = categ === this._middleCateg;
                    }
                } else {
                    // Only "stretch" ends on stacked visualization
                    if(!isStacked) {
                        return;
                    }
                    
                    var the = next || last;
                    value = the.value;
                    group = the.group;
                    isInterpolatedMiddle = false;
                }
                
                seriesInfo.group  = group;
                seriesInfo.value  = value;
                seriesInfo.isNull = false;
                seriesInfo.isInterpolated = true;
                seriesInfo.isInterpolatedMiddle = isInterpolatedMiddle;
            }
        });
        
        if(interpolate){
            categInfos = new Interpolation(categInfos).interpolate();
        }
        
        /**
         * Create child category scenes of each series scene.
         */
        reversedSeriesScenes.forEach(createSeriesSceneCategories, this);
        
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
        
        function createSeriesScenes(){
            if(chart._serRole && chart._serRole.grouping){
                chart._serRole
                    .flatten(data)
                    .children()
                    .each(createSeriesScene, this);
            } else {
                createSeriesScene.call(this, null);
            }
            
            // reversed so that "below == before" w.r.t. stacked offset calculation
            return rootScene.children().reverse().array();
        }
        
        function createSeriesScene(seriesData1){
            /* Create series scene */
            var seriesScene = new pvc.visual.Scene(rootScene, {group: seriesData1 || data});

            seriesScene.vars.series = new pvc.visual.ValueLabelVar(
                        seriesData1 ? seriesData1.value : null,
                        seriesData1 ? seriesData1.label : "");
        }

        function createSeriesSceneCategories(seriesScene, seriesIndex){
            
            categInfos.forEach(createCategScene, this);
            
            function createCategScene(categInfo){
                var seriesInfo = categInfo.seriesInfos[seriesIndex];
                var group = seriesInfo.group;
                var value = seriesInfo.value;
                
                /* If there's no group, provide, at least, a null datum */
                var datum = group ? 
                            null : 
                            createNullDatum(
                                    seriesInfo.data || seriesScene.group, 
                                    categInfo.data  );
                
                // ------------
                
                var scene = new pvc.visual.Scene(seriesScene, {group: group, datum: datum});
                scene.vars.category = new pvc.visual.ValueLabelVar(categInfo.value, categInfo.label);
                
                var valueVar = new pvc.visual.ValueLabelVar(
                                    value, 
                                    valueDim.format(value));
                
                /* accumulated value, for stacked */
                valueVar.accValue = value != null ? value : orthoNullValue;
                
                scene.vars.value = valueVar;
                
                scene.isInterpolatedMiddle = seriesInfo.isInterpolatedMiddle;
                scene.isInterpolated = seriesInfo.isInterpolated;
                scene.isNull = seriesInfo.isNull;
                scene.isIntermediate = false;
            }
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
                    group: toScene.isInterpolatedMiddle ? fromScene.group: toScene.group, 
                    datum: toScene.group ? null : toScene.datum
                });
            
            interScene.vars.category = toScene.vars.category;
            
            var interValueVar = new pvc.visual.ValueLabelVar(
                                    interValue,
                                    valueDim.format(interValue));
            
            interValueVar.accValue = interAccValue;
            
            interScene.vars.value = interValueVar;
                
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
