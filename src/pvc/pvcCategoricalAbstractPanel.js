
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
     * Returns a datum given its visible series and category indexes.
     * @virtual
     */
    _getRenderingDatumByIndexes: function(visibleSerIndex, visibleCatIndex){
        var de = this.chart.dataEngine,
            datumFilter = {
                category: de.getVisibleCategories()[visibleCatIndex],
                series:   de.getVisibleSeries()[visibleSerIndex]
            };

        return de.datum(datumFilter, {createNull: true});
    },

    // ----------------------------
    // Click / Double-click

    _handleDoubleClick: function(mark, ev){
        var action = this.chart.options.doubleClickAction;
        if(action){
            var datum = mark.datum();
            if(datum){
                var atoms = datum.atoms,
                    s = atoms.series.rawValue,
                    c = atoms.category.rawValue,
                    v = atoms.value.value;

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
            var atoms = datum.atoms,
                s = atoms.series.rawValue,
                c = atoms.category.rawValue,
                v = atoms.value.value;

            action.call(mark, s, c, v, ev, datum);
        }

        // Selection
        var options = this.chart.options;
        if(options.selectable){
            if(options.ctrlSelectMode && !ev.ctrlKey){
                // hard select
                datum.owner.clearSelected();
                datum.setSelected(true);
            } else {
                datum.toggleSelected();
            }

            this._handleSelectionChanged();
        }
    },

    _handleSelectionChanged: function(){
        this.topRoot._renderSignums();

        // Fire action
        var action = this.chart.options.selectionChangedAction;
        if(action){
            var selections = this.chart.dataEngine.owner.selectedDatums();
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
    _detectSelectingDatums: function(){
        var datums = [];
        
        //pvc.log("RubberBand: " + JSON.stringify(this.rubberBand));
        
        var selectableMarks = this._getSignums();
        if(selectableMarks){
            selectableMarks.forEach(function(mark){
                this._forEachSelectingMarkInstance(mark, function(datum){
                    datums.push(datum);
                }, this);
            }, this);
        }
        
        return datums;
    },
    
    /**
     * Add rubber-band functionality to main panel (includes axis).
     * Override to prevent rubber band selection.
     * 
     * @virtual
     **/
    _createSelectionOverlay: function(){
        var myself = this,
            chart = this.chart,
            options  = chart.options,
            dataEngine = chart.dataEngine;

        var dMin = 10; // Minimum dx or dy for a rubber band selection to be relevant

        var isSelecting = false;

        // Rubber band
        var rubberPvParentPanel = this.chart.basePanel.pvPanel,
            toScreen;
        
        var selectBar = this.selectBar = rubberPvParentPanel.add(pv.Bar)
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
            rubberPvParentPanel.fillStyle(invisibleFill);
        }
        
        // NOTE: The fact that the selection behavior is
        // attached to the root panel (screen) causes the selection rectangle to
        // be in root panel coordinates
        
        var selectionEndedDate;
        rubberPvParentPanel
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
                
                dataEngine.owner.clearSelected();
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
                    
                    toScreen || (toScreen = rubberPvParentPanel.toScreenTransform());
                    myself.rubberBand = rb.clone().apply(toScreen);
                }

                selectBar.render();
            })
            .event('selectend', function(){
                if(isSelecting){
                    var ev = arguments[arguments.length - 1];
                    
                    toScreen || (toScreen = rubberPvParentPanel.toScreenTransform());
                    myself.rubberBand = this.selectionRect.clone().apply(toScreen);
                    
                    isSelecting = false;
                    selectBar.render(); // hide rubber band

                    // Process selection
                    myself._dispatchRubberBandSelection(ev);

                    selectionEndedDate = new Date();
                }
            });
    },
    
    // Callback to handle end of rubber band selection
    _dispatchRubberBandSelection: function(ev){
        var rb = this.rubberBand,
            chart = this.chart,    
            xAxisPanel = chart.xAxisPanel,
            yAxisPanel = chart.yAxisPanel,
            selectedDatums,
            toggle = false,
            xAxisAny = false,
            yAxisAny = false,
            xDatumsByKey,
            yDatumsByKey;
        
        //1) x axis            
        if(xAxisPanel){
            xDatumsByKey = {};
            xAxisAny = xAxisPanel._detectSelectingDatums(xDatumsByKey, rb);
        }
        
        //2) y axis
        if(yAxisPanel){
            yDatumsByKey = {};
            yAxisAny = yAxisPanel._detectSelectingDatums(yDatumsByKey, rb);
        }
        
        // Rubber band selects on both axes?
        if(xAxisAny && yAxisAny) {
            // Intersect datums
            selectedDatums = [];
            def.forEachOwn(yDatumsByKey, function(datum, key){
                if(def.hasOwn(xDatumsByKey, key)) {
                    selectedDatums.push(datum);
                }
            });
            
            toggle = true;
            
        // Rubber band selects over any of the axes?
        } else if(xAxisAny) { 
            selectedDatums = def.own(xDatumsByKey);
        } else if(yAxisAny) {
            selectedDatums = def.own(yDatumsByKey);
        } else {
            // Ask the panel for signum selections
            selectedDatums = this._detectSelectingDatums();
        }
        
        // ----------------
        
        if(!ev.ctrlKey && chart.options.ctrlSelectMode){
            chart.dataEngine.owner.clearSelected();
        }
        
        if(selectedDatums){
            if(toggle){
                pvc.data.Data.toggleSelected(selectedDatums);
            } else {
                pvc.data.Data.setSelected(selectedDatums, true);
            }

            this._handleSelectionChanged();
        }
    },
    
    _forEachSelectingMarkInstance: function(mark, fun, ctx){
        if(mark.type === 'area' || mark.type === 'line'){
            var instancePrev = null,
                seriesPrev;
                
            this._forEachSignumInstance(mark, function(instance, t){
                // Skip first instance
                if(instancePrev){
                    var series = instance.datum.atoms.series.key; // TODO: this does not seem right...
                    if(series === seriesPrev){
                        var shape = mark.getInstanceShape(instancePrev, instance).apply(t);
                        if (shape.intersectsRect(this.rubberBand)){
                            fun.call(ctx, instancePrev.datum);
                        }
                    }
                }

                instancePrev = instance;
                seriesPrev   = instance.datum.atoms.series.key;
            }, this);
        } else {
            mark.forEachInstance(function(instance, t){
                var shape = mark.getInstanceShape(instance).apply(t);
                //pvc.log(instance.datum.atoms.value.value + ": " + JSON.stringify(shape));
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