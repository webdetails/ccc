
pvc.CategoricalAbstractPanel = pvc.BasePanel.extend({

    orientation: "vertical",

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
        this.setSize(this._parent.width, this._parent.height);

        // Create the this.pvPanel
        this.base();

        // Send the panel behind the axis, title and legend, panels
        this.pvPanel.zOrder(-10);

        // Overflow
        var options = this.chart.options;
        if ((options.orthoFixedMin != null) || (options.orthoFixedMax != null)){
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

    // ----------------------------
    // Click / Double-click

    _handleDoubleClick: function(mark, d, ev){
        var action = this.chart.options.doubleClickAction;
        if(action){
            var datum = this._getRenderingDatum(mark);
            if(datum){
                var s = datum.elem.series.value,
                    c = datum.elem.category.value;

                this._ignoreClicks = 2;

                action.call(mark, s, c, d, ev, datum);
            }
        }
    },

    _shouldHandleClick: function(){
        var options = this.chart.options;
        return options.selectable || (options.clickable && options.clickAction);
    },
    
    _handleClick: function(mark, d, ev){
        if(!this._shouldHandleClick()){
            return;
        }

        // Selection
        var datum = this._getRenderingDatum(mark);
        if(datum){
            var options = this.chart.options;
            
            if(!options.doubleClickAction){
                this._handleClickCore(mark, datum, d, ev);
            } else {
                // Delay click evaluation so that
                // it may be canceled if double click meanwhile
                // fires.
                var myself = this;
                window.setTimeout(
                    function(){
                        myself._handleClickCore.call(myself, mark, datum, d, ev);
                    },
                    options.doubleClickMaxDelay || 300);

            }
        }
    },

    _handleClickCore: function(mark, datum, d, ev){
        if(this._ignoreClicks) {
            this._ignoreClicks--;
            return;
        }

        // Classic clickAction
        var action = this.chart.options.clickAction;
        if(action){
            // TODO: first value of a multi-valued datum?????
            if(d != null && d[0] !== undefined){
                d = d[0];
            }

            var s = datum.elem.series.value,
                c = datum.elem.category.value;

            action.call(mark, s, c, d, ev, datum);
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
        this._renderSelectableMarks();

        // Fire action
        var action = this.chart.options.selectionChangedAction;
        if(action){
            var selections = this.chart.dataEngine.getSelections();

            action.call(null, selections);
        }
    },
    
    /**
     * The default implementation renders this.pvPanel,
     * which is generally in excess of what actually requires
     * to be re-rendered.
     *
     * Override to render a more specific set of marks.
     * @virtual
     */
    _renderSelectableMarks: function(){
        this.pvPanel.render();
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

        this.rubberBand = {x: 0, y: 0, dx: 4, dy: 4};

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
        function dispatchRubberBandSelection(rb, ev){
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
                //if there are label selections, they already include any chart selections
                //3) Chart: translate coordinates (drawn bottom-up)
                //first get offsets
                y = rb.y - titleOffset['top' ] - xAxisOffset['top' ];
                x = rb.x - titleOffset['left'] - yAxisOffset['left'];

                //top->bottom
                y = myself.height - y - rb.dy;
				
				// Keep rubber band screen coordinates
                rb.x0 = rb.x;
                rb.y0 = rb.y;

                rb.x = x;
                rb.y = y;

                selectedData = myself._collectRubberBandSelections();
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
        var selectBar = this.selectBar = this.pvPanel.root//TODO
           .add(pv.Bar)
                .visible(function() {return isSelecting;} )
                .left(function(d) {return d.x;})
                .top(function(d) {return d.y;})
                .width(function(d) {return d.dx;})
                .height(function(d) {return d.dy;})
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
            .data([myself.rubberBand])
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
                
                var ev = arguments[arguments.length - 1];
                //if(options.ctrlSelectMode && !ev.ctrlKey)
                dataEngine.clearSelections();
                myself._handleSelectionChanged();
            })
            .event('mousedown', pv.Behavior.selector(false))
            .event('select', function(rb){
                if(!isSelecting){
                    if(Math.sqrt(rb.dx * rb.dx + rb.dy * rb.dy) <= dMin){
                        return;
                    }

                    isSelecting = true;
                    myself.rubberBand = rb;
                }

                selectBar.render();
            })
            .event('selectend', function(rb, ev){
                if(isSelecting){
                    isSelecting = false;
                    selectBar.render(); // hide rubber band

                    // Process selection
                    dispatchRubberBandSelection(rb, ev);

                    selectionEndedDate = new Date();
                }
            });
    },

    /**
     * Should override to provide selection detection
     * for a specific chart type.
     *
     * Use _intersectsRubberBandSelection to check if a shape
     * is covered by the rubber band.
     *
     * Return a 'where' specification suitable for
     * dataEngine#getWhere.
     * @virtual
     */
    _collectRubberBandSelections: function(){
        return null;
    },

    /**
     * @protected
     */
    _intersectsRubberBandSelection: function(startX, startY, endX, endY){
        var rb = this.rubberBand;
        return rb &&
            ((startX >= rb.x && startX < rb.x + rb.dx) || (endX >= rb.x && endX < rb.x + rb.dx))
            &&
            ((startY >= rb.y && startY < rb.y + rb.dy) || (endY >= rb.y && endY < rb.y + rb.dy));
    },
	
	// Uses screen coordinates
    _intersectsRubberBandSelection0: function(begX, endX, begY, endY){
        var rb = this.rubberBand;
        return rb &&
                // Some intersection on X
               (rb.x0 + rb.dx > begX) &&
               (rb.x0         < endX) &&
               // Some intersection on Y
               (rb.y0 + rb.dy > begY) &&
               (rb.y0         < endY);
    },
	
    _forEachInstanceInRubberBand: function(mark, fun, ctx){
        var index = 0;
        mark.forEachInstances(function(instance, t){
            var begX = t.transformHPosition(instance.left),
                endX = begX + t.transformLength(instance.width  || 0),
                begY = t.transformVPosition(instance.top),
                endY = begY + t.transformLength(instance.height || 0);

//            pvc.log("data=" + instance.data +
//                    " position=[" + [begX, endX, begY, endY] +  "]" +
//                    " index=" + index);

            if (this._intersectsRubberBandSelection0(begX, endX, begY, endY)){
                fun.call(ctx, instance, index);
            }

            index++;
        }, this);
    }
});