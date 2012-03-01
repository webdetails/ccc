
pvc.CategoricalAbstractPanel = pvc.BasePanel.extend({

    orientation: "vertical",
    stacked: false,

    constructor: function(chart, options){

        // Shared state between _handleClick and _handleDoubleClick
        this._ignoreClicks = 0;

        this.base(chart, options);
    },

    /*
     * @override
     */
    create: function(){
        // Occupy all space available in the parent panel
        this.consumeFreeClientSize();

        // Create the this.pvPanel
        this.base();

        // Send the panel behind the axis, title and legend, panels
        this.pvPanel.zOrder(-10);

        // Overflow
        var options = this.chart.options;
        if (parseFloat(options.orthoFixedMin) > 0 ||
            parseFloat(options.orthoFixedMax) > 0){
            this.pvPanel["overflow"]("hidden");
        }
        
        // Create something usefull...
        this.createCore();
        
        if (options.selectable && pv.renderer() !== 'batik'){
            this._createSelectionOverlay();
        }
    },

    /**
     * Override to create marks specific to a given chart.
     * @virtual 
     */
    createCore: function(){
        // NOOP
    },
    
    /**
     * @override
     */
    applyExtensions: function(){
        this.base();

        // Extend body
        this.extend(this.pvPanel, "chart_");
    },
    
    /* @override */
    isOrientationVertical: function(){
        return this.orientation == "vertical";
    },

    /* @override */
    isOrientationHorizontal: function(){
        return this.orientation == "horizontal";
    },

    /**
     * Override to detect the datum that is being rendered.
     * Called during PV rendering, from within property functions.
     * This should only be called on places where it is possible,
     * through the indexes of current PV mark to 'guess' an
     * associated datum.
     * @virtual
     */
    _getRenderingDatum: function(mark){
        return null;
    },

    /**
     * Returns a datum given its visible series and category indexes.
     * @virtual
     */
    _getRenderingDatumByIndexes: function(visibleSerIndex, visibleCatIndex){
        var de = this.chart.dataEngine,
            datumRef = {
                category: de.translateDimensionVisibleIndex('category', visibleCatIndex),
                series:   de.translateDimensionVisibleIndex('series',   visibleSerIndex)
            };

        return de.findDatum(datumRef, true);
    },

    // ----------------------------
    // Click / Double-click

    _handleDoubleClick: function(mark, ev){
        var action = this.chart.options.doubleClickAction;
        if(action){
            var datum = mark.datum();
            if(datum){
                var s = datum.elem.series.rawValue,
                    c = datum.elem.category.rawValue,
                    v = datum.value;

                this._ignoreClicks = 2;

                action.call(mark, s, c, v, ev, datum);
            }
        }
    },

    _shouldHandleClick: function(){
        var options = this.chart.options;
        return options.selectable || (options.clickable && options.clickAction);
    },
    
    _handleClick: function(mark, ev){
        if(!this._shouldHandleClick()){
            return;
        }

        // Selection
        var datum = mark.datum();
        if(datum){
            var options = this.chart.options;
            
            if(!options.doubleClickAction){
                this._handleClickCore(mark, datum, ev);
            } else {
                // Delay click evaluation so that
                // it may be canceled if double click meanwhile
                // fires.
                var myself = this;
                window.setTimeout(
                    function(){
                        myself._handleClickCore.call(myself, mark, datum, ev);
                    },
                    options.doubleClickMaxDelay || 300);

            }
        }
    },

    _handleClickCore: function(mark, datum, ev){
        if(this._ignoreClicks) {
            this._ignoreClicks--;
            return;
        }

        // Classic clickAction
        var action = this.chart.options.clickAction;
        if(action){
            var dims = datum.elem,
                s = dims.series.rawValue,
                c = dims.category.rawValue,
                v = datum.value;

            action.call(mark, s, c, v, ev, datum);
        }

        // Selection
        var options = this.chart.options;
        if(options.selectable){
            if(options.ctrlSelectMode && !ev.ctrlKey){
                // hard select
                datum.engine.clearSelections();
                datum.setSelected(true);
            } else {
                datum.toggleSelected();
            }

            this._handleSelectionChanged();
        }
    },

    _handleSelectionChanged: function(){
        this._renderSignums();

        // Fire action
        var action = this.chart.options.selectionChangedAction;
        if(action){
            var selections = this.chart.dataEngine.getSelections();

            action.call(null, selections);
        }
    },

    _addPropClick: function(mark){
        var myself = this;
        mark.cursor("pointer")
            .event("click", function(){
                var ev = arguments[arguments.length - 1];
                return myself._handleClick(this, ev);
            });
    },

    _addPropDoubleClick: function(mark){
        var myself = this;
        mark.cursor("pointer")
            .event("dblclick", function(){
                var ev = arguments[arguments.length - 1];
                return myself._handleDoubleClick(this, ev);
            });
    },
    
    /**
     * The default implementation renders
     * the marks returned by #_getSignums, 
     * or this.pvPanel if none is returned.
     * which is generally in excess of what actually requires
     * to be re-rendered.
     *
     * Override to render a more specific set of marks.
     * @virtual
     */
    _renderSignums: function(){
        var marks = this._getSignums();
        if(!marks || !marks.length){
            this.pvPanel.render();
        } else {
            marks.forEach(function(mark){ mark.render(); });
        }
    },

    /**
     * Returns an array of marks whose instances are associated to a datum, or null.
     * @virtual
     */
    _getSignums: function(){
        return null;
    },

    /**
     * The default implementation returns
     * the datums associated with
     * the instances of the marks returned by #_getSignums.
     * 
     * Override to provide a specific
     * selection detection implementation.
     *
     * When overriding, 
     * use #_intersectsRubberBandSelection
     * to check if a mark is covered by the rubber band.
     *
     * Returns an array of being selected datum.
     * @virtual
     */
    _detectSelectingData: function(){
        var data = [];

        var selectableMarks = this._getSignums();
        if(selectableMarks){
            selectableMarks.forEach(function(mark){
                this._forEachSelectingMarkInstance(mark, function(datum){
                    data.push(datum);
                }, this);
            }, this);
        }
        
        return data;
    },
    
    /**
     * Add rubberband functionality to main panel (includes axis).
     * Override to prevent rubber band selection.
     * @virtual
     **/
    _createSelectionOverlay: function(){
        //TODO: flip support: parallelLength etc..

        var myself = this,
            isHorizontal = this.isOrientationHorizontal(),
            chart = this.chart,
            options  = chart.options,
            dataEngine = chart.dataEngine,
            titlePanel = chart.titlePanel,
            xAxisPanel = chart.xAxisPanel,
            yAxisPanel = chart.yAxisPanel;

        var dMin = 10; // Minimum dx or dy for a rubber band selection to be relevant

        var isSelecting = false;

        // Helper
        // Sets all positions to 0 except the specified one
        var positions = ['top', 'left', 'bottom', 'right'];
        function setPositions(position, value){
            var obj = {};
            for(var i = 0; i < positions.length ; i++){
                obj[positions[i]] = (positions[i] == position) ? value : 0;
            }
            return obj;
        }

        // Callback to handle end of rubber band selection
        function dispatchRubberBandSelection(ev){
            var rb = myself.rubberBand;

            // Get offsets
            var titleOffset;
            if(titlePanel != null){
                titleOffset = setPositions(options.titlePosition, titlePanel.titleSize);
            } else {
                titleOffset = setPositions();
            }

            var xAxisOffset = setPositions(options.xAxisPosition, xAxisPanel ? xAxisPanel.height : 0),
                yAxisOffset = setPositions(options.yAxisPosition, yAxisPanel ? yAxisPanel.width  : 0);

            var y = 0,
                x = 0;

            // Rubber band selects over any of the axes?
            var xSelections = [],
                ySelections = [];

            if(options.useCompositeAxis){
                //1) x axis
                x = rb.x - titleOffset['left'] - yAxisOffset['left'];
                y = rb.y - titleOffset['top'];

                if(options.xAxisPosition === 'bottom'){//chart
                    y -= myself.height;
                }

                if(xAxisPanel){
                    xSelections = xAxisPanel.getAreaSelections(x, y, rb.dx, rb.dy);
                }
                
                //2) y axis
                x = rb.x - titleOffset['left'];
                y = rb.y - titleOffset['top'] - xAxisOffset['top'];

                if(options.yAxisPosition === 'right'){//chart
                    x -= myself.width;
                }

                if(yAxisPanel){
                    ySelections = yAxisPanel.getAreaSelections(x, y, rb.dx, rb.dy);
                }
            }

            var cSelections = isHorizontal ? ySelections : xSelections,
                sSelections = isHorizontal ? xSelections : ySelections;

            if(options.ctrlSelectMode && !ev.ctrlKey){
                dataEngine.clearSelections();
            }

            var selectedData,
                toggle = false;

            // Rubber band selects on both axes?
            if(ySelections.length > 0 && xSelections.length > 0){
                // Select the INTERSECTION
                selectedData = dataEngine.getWhere([
                    {series: sSelections, /* AND */ category: cSelections}
                ]);
                
            } else if (ySelections.length > 0 || xSelections.length > 0){
                // Select the UNION
                toggle = true;

                selectedData = dataEngine.getWhere([
                    {series: sSelections}, // OR
                    {category: cSelections}
                ]);

            } else {
                selectedData = myself._detectSelectingData();
            }

            if(selectedData){
                if(toggle){
                    dataEngine.toggleSelections(selectedData);
                } else {
                    dataEngine.setSelections(selectedData, true);
                }

                myself._handleSelectionChanged();
            }
        }

        // Rubber band
        var selectBar = this.selectBar = this.pvPanel.root
            .add(pv.Bar)
                .visible(function() {return isSelecting;} )
                .left(function() {return this.parent.selectionRect.x; })
                .top(function() {return this.parent.selectionRect.y; })
                .width(function() {return this.parent.selectionRect.dx; })
                .height(function() {return this.parent.selectionRect.dy; })
                .fillStyle(options.rubberBandFill)
                .strokeStyle(options.rubberBandLine);

        // Rubber band selection behavior definition
        if(!options.extensionPoints ||
           !options.extensionPoints.base_fillStyle){

            var invisibleFill = 'rgba(127,127,127,0.00001)';
            this.pvPanel.root.fillStyle(invisibleFill);
        }

        var selectionEndedDate;
        this.pvPanel.root
            .event("click", function() {
                // It happens sometimes that the click is fired 
                //  after mouse up, ending up clearing a just made selection.
                if(selectionEndedDate){
                    var timeSpan = new Date() - selectionEndedDate;
                    if(timeSpan < 300){
                        selectionEndedDate = null;
                        return;
                    }
                }
                
                dataEngine.clearSelections();
                myself._handleSelectionChanged();
            })
            .event('mousedown', pv.Behavior.selector(false))
            .event('select', function(){
                if(!isSelecting && !chart.isAnimating){
                    var rb = this.selectionRect;
                    if(Math.sqrt(rb.dx * rb.dx + rb.dy * rb.dy) <= dMin){
                        return;
                    }

                    isSelecting = true;
                    myself.rubberBand = rb;
                }

                selectBar.render();
            })
            .event('selectend', function(dummy, ev){
                if(isSelecting){
                    isSelecting = false;
                    selectBar.render(); // hide rubber band

                    // Process selection
                    dispatchRubberBandSelection(ev);

                    selectionEndedDate = new Date();
                }
            });
    },

    _forEachSelectingMarkInstance: function(mark, fun, ctx){
        if(mark.type === 'area' || mark.type === 'line'){
            var instancePrev = null,
                seriesPrev;
                
            this._forEachSignumInstance(mark, function(instance, t){
                // Skip first instance
                if(instancePrev){
                    var series = instance.datum.elem.series.absValue;
                    if(series === seriesPrev){
                        var shape = mark.getInstanceShape(instancePrev, instance).apply(t);
                        if (shape.intersectsRect(this.rubberBand)){
                            fun.call(ctx, instancePrev.datum);
                        }
                    }
                }

                instancePrev = instance;
                seriesPrev   = instance.datum.elem.series.absValue;
            }, this);
        } else {
            mark.forEachInstance(function(instance, t){
                var shape = mark.getInstanceShape(instance).apply(t);
                if (shape.intersectsRect(this.rubberBand)){
                    fun.call(ctx, instance.datum);
                }
            }, this);
        }
    },

    _forEachSignumInstance: function(mark, fun, ctx){
        mark.forEachInstance(function(instance, t){
            if(instance.datum){
                fun.call(ctx, instance, t);
            }
        });
    }
});