
/**
 * Base panel. 
 * A lot of them will exist here, with some common properties. 
 * Each class that extends pvc.base will be 
 * responsible to know how to use it.
 */
pvc.BasePanel = pvc.Abstract.extend({

    chart: null,
    parent: null,
    _children: null,
    type: pv.Panel, // default one
    height: null,
    width: null,
    anchor: "top",
    pvPanel: null,
    fillColor: "red",
    margins:   null,
    isRoot:    false,
    isTopRoot: false,
    root:      null, 
    topRoot:   null,
    
    _layoutInfo: null,
    
    /**
     * Indicates if the top root panel is rendering with animation
     * and, if so, the current phase of animation.
     * 
     * <p>This property can assume the following values:</p>
     * <ul>
     * <li>0 - Not rendering with animation (may even not be rendering at all).</li>
     * <li>1 - Rendering the animation's <i>start</i> point,</li>
     * <li>2 - Rendering the animation's <i>end</i> point.</li>
     * </ul>
     * 
     * @see #animate
     * @see #isAnimatingStart
     * 
     * @type number
     */
    _isAnimating: 0,
    
    /**
     * Shared state between {@link _handleClick} and {@link #_handleDoubleClick}.
     */
    _ignoreClicks: 0,
    
    /**
     * Indicates the name of the role that should be used to whenever a legacy dimension value is required.
     * Only the first dimension of the specified role is considered.
     * <p>
     * In a derived class use {@link Object.create} to override this object for only certain
     * legacy dimensions.
     * </p>
     * @ type string
     */
    _legacyDimRole: {
        'series':   'series',
        'category': 'category',
        'value':    'value'
    },
    
    constructor: function(chart, parent, options) {
        
        // TODO: Danger...
        $.extend(this, options);
        
        this.chart = chart;
        
        this.position = {
            /*
            top:    0,
            right:  0,
            bottom: 0,
            left:   0
            */
        };
        
        this.margins = {
            top:    0,
            right:  0,
            bottom: 0,
            left:   0
        };
        
        if(!parent) {
            this.parent    = null;
            this.root      = this;
            this.topRoot   = this;
            this.isRoot    = true;
            this.isTopRoot = true;
        } else {
            this.parent    = parent;
            this.root      = parent.root;
            this.topRoot   = parent.topRoot;
            this.isTopRoot = false;
            this.isRoot    = (parent.chart !== chart);
            
            if(this.isRoot) {
                this.position.left = chart.left; 
                this.position.top  = chart.top;
            }
            
            parent._addChild(this);
        }
        
        /* Root panels do not need layout */
        if(this.isRoot) {
            this.anchor = null;
        }
    },
    
    /**
     * Adds a panel as child.
     */
    _addChild: function(child){
        // <Debug>
        child.parent === this || def.assert("Child has a != parent.");
        // </Debug>
        
        (this._children || (this._children = [])).push(child);
    },
    
    /* LAYOUT PHASE */
    
    /** 
     * Calculates and sets its size,
     * taking into account a specified available size.
     * 
     * @param {pvc.Size} [availableSize] The size available for the panel.
     * <p>
     * On a root panel this argument is not specified,
     * and the panel's current size should be used as default. 
     * </p>
     * @param {object}  [keyArgs] Keyword arguments.
     * @param {boolean} [keyArgs.force=false] Indicates that the layout should be 
     * performed even if it has already been done. 
     */
    layout: function(availableSize, keyArgs){
        if(!this._layoutInfo || def.get(keyArgs, 'force', false)) {
            
            this._layoutInfo = null;
            
            if(!availableSize) {
                this.isRoot || def.error.argumentRequired('availableSize');
                (this.width >= 0 && this.height >= 0) || 
                    def.error.operationInvalid("Root panel layout without width or height set.");
                
                availableSize = new pvc.Size(this.width, this.height);
            }
            
            var layoutInfo = {};
            this._calcLayout(availableSize, layoutInfo);
            // <Debug>
            if(!(this.width  <= availableSize.width && 
                 this.height <= availableSize.height)) {
                throw def.error.operationInvalid("Layout invalid.");
            }
            // </Debug>
            
            this._layoutInfo = layoutInfo;
        }
    },
    
    /**
     * Override to calculate and set panel dimensions.
     * <p>
     * The default implementation performs a dock layout {@link #layout} on child panels
     * and uses all of the specified available size. 
     * </p>
     * 
     * @param {pvc.Size} availableSize The available size.
     * @param {object} layoutInfo An object on which to export layout information.
     * This object is later supplied to the method {@link #_createCore},
     * and can thus be used to store any layout by-product
     * relevant for the creation of the protovis marks.
     * 
     * @virtual
     */
    _calcLayout: function(availableSize, layoutInfo){
        
        this.setSize(availableSize);
        
        if(!this._children) {
            return;
        }
        
        var margins = def.copy(this.margins);
        
        // An object we can mutate
        var remSize = {
            width:  Math.max(availableSize.width  - margins.left - margins.right,  0),
            height: Math.max(availableSize.height - margins.top  - margins.bottom, 0)
        };
        
        var aolMap = pvc.BasePanel.orthogonalLength,
            aoMap   = pvc.BasePanel.relativeAnchor;
        
        // Decreases available size and increases margins
        function updateSide(side, child) {
            var sideol = aolMap[side],
                olen   = child[sideol];
            
            margins[side]   += olen;
            remSize[sideol] -= olen;
        }
        
        function positionChild(side, child) {
            var sideo = aoMap[side];
            child.setPosition(def.set({}, side, margins[side], sideo, margins[sideo]));
        }
        
        var childKeyArgs = {force: true};
        var fillChildren = [];
        
        function layoutChildI(child) {
            var a = child.anchor;
            if(a === 'fill') {
                // These are layed out on the second phase
                fillChildren.push(child);
            } else if(a) {
                def.hasOwn(aoMap, a) || def.fail.operationInvalid("Unknown anchor value '{0}'", [a]);
                
                child.layout(new pvc.Size(remSize), childKeyArgs);
                
                positionChild(a, child);
                
                updateSide(a, child);
            }
        }
        
        function layoutChildII(child) {
            child.layout(new pvc.Size(remSize), childKeyArgs);
            
            positionChild('left', child);
        }
        
        this._children.forEach(layoutChildI);
        
        fillChildren.forEach(layoutChildII);
    },
    
    _invalidateLayout: function(){
        this._layoutInfo = null;
    },
    
    /** 
     * CREATION PHASE
     * 
     * Where the protovis main panel, and any other marks, are created.
     * 
     * If the layout has not been performed it is so now.
     */
    _create: function(force) {
        if(!this.pvPanel || force) {
            
            this.pvPanel = null;
            
            /* Layout */
            this.layout();
            
            /* Protovis Panel */
            if(this.isTopRoot) {
               this.pvPanel = new pv.Panel()
                                      .canvas(this.chart.options.canvas);
            } else {
                this.pvPanel = this.parent.pvPanel.add(this.type);
            }
            
            // Set panel size
            this.pvPanel
                .width (this.width )
                .height(this.height);
            
            // Set panel positions
            def.eachOwn(this.position, function(v, side){
                this.pvPanel[side](v);
            }, this);
            
            /* Protovis marks that are pvcPanel specific,
             * and/or #_creates child panels.
             */
            this._createCore(this._layoutInfo);
            
            /* RubberBand */
            if (this.isTopRoot && this.chart.options.selectable && pv.renderer() !== 'batik'){
                this._initRubberBand();
            }

            /* Extensions */
            this.applyExtensions();
        }
    },
    
    /**
     * Override to create specific protovis components for a given panel.
     * 
     * The default implementation calls {@link #_create} on each child panel.
     * 
     * @param {object} layoutInfo The object with layout information 
     * "exported" by {@link #_calcLayout}.
     * 
     * @virtual
     */
    _createCore: function(layoutInfo){
        if(this._children) {
            this._children.forEach(function(child){
                child._create();
            });
        }
    },
    
    /** 
     * RENDER PHASE
     * 
     * Where protovis components are rendered.
     * 
     * If the creation phase has not been performed it is so now.
     */
    
    /**
     * Renders the top root panel.
     * <p>
     * The render is always performed from the top root panel,
     * independently of the panel on which the method is called.
     * </p>
     * 
     * @param {object} [keyArgs] Keyword arguments.
     * @param {boolean} [keyArgs.bypassAnimation=false] Indicates that animation should not be performed.
     * @param {boolean} [keyArgs.recreate=false] Indicates that the panel and its descendants should be recreated.
     */
    render: function(keyArgs){
        
        if(!this.isTopRoot) {
            return this.topRoot.render(keyArgs);
        }
        
        this._create(def.get(keyArgs, 'recreate', false));
        
        var chart = this.chart,
            options = chart.options;
        
        if (options.renderCallback) {
            options.renderCallback.call(chart);
        }
        
        var pvPanel = this.pvPanel;
        
        this._isAnimating = options.animate && !def.get(keyArgs, 'bypassAnimation', false) ? 1 : 0;
        try {
            // When animating, renders the animation's 'start' point
            pvPanel.render();
            
            // Transition to the animation's 'end' point
            if (this._isAnimating) {
                this._isAnimating = 2;
                
                var me = this;
                pvPanel
                    .transition()
                    .duration(2000)
                    .ease("cubic-in-out")
                    .start(function(){
                        me._isAnimating = 0;
                        me._onRenderEnd(true);
                    });
            } else {
                this._onRenderEnd(false);
            }
        } finally {
            this._isAnimating = 0;
        }
    },
    
    /**
     * Called when a render has ended.
     * When the render performed an animation
     * and the 'animated' argument will have the value 'true'.
     *
     * The default implementation calls each child panel's
     * #_onRenderEnd method.
     * @virtual
     */
    _onRenderEnd: function(animated){
        if(this._children){
            this._children.forEach(function(child){
                child._onRenderEnd(animated);
            });
        }
    },
    
    /**
     * The default implementation renders
     * the marks returned by #_getSignums, 
     * or this.pvPanel if none is returned (and it has no children)
     * which is generally in excess of what actually requires
     * to be re-rendered.
     * The call is then propagated to any child panels.
     * 
     * @virtual
     */
    _renderSignums: function(){
        var marks = this._getSignums();
        if(marks && marks.length){
            marks.forEach(function(mark){ mark.render(); });
        } else if(!this._children) {
            this.pvPanel.render();
        }
        
        if(this._children){
            this._children.forEach(function(child){
                child._renderSignums();
            });
        }
    },

    /**
     * Returns an array of marks whose instances are associated to a datum, or null.
     * @virtual
     */
    _getSignums: function(){
        return null;
    },
    
    
    /* ANIMATION */
    
    animate: function(start, end) {
        return (this.topRoot._isAnimating === 1) ? start : end;
    },
    
    /**
     * Indicates if the panel is currently 
     * rendering the animation start phase.
     * <p>
     * Prefer using this function instead of {@link #animate} 
     * whenever its <tt>start</tt> or <tt>end</tt> arguments
     * involve a non-trivial calculation. 
     * </p>
     * 
     * @type boolean
     */
    isAnimatingStart: function() {
        return (this.topRoot._isAnimating === 1);
    },
    
    /**
     * Indicates if the panel is currently 
     * rendering animation.
     * 
     * @type boolean
     */
    isAnimating: function() {
        return (this.topRoot._isAnimating > 0);
    },
    
    
    /* EXTENSION */
    
    /**
     * Override to apply specific extensions points.
     * @virtual
     */
    applyExtensions: function(){
        if (this.isRoot) {
            this.extend(this.pvPanel, "base_");
        }
    },

    /**
     * This is the method to be used for the extension points
     * for the specific contents of the chart. already ge a pie
     * chart! Goes through the list of options and, if it
     * matches the prefix, execute that method on the mark.
     * WARNING: It's the user's responsibility to make sure that
     * unexisting methods don't blow this.
     */
    extend: function(mark, prefix) {
        this.chart.extend(mark, prefix);
    },

    /**
     * Obtains the specified extension point.
     * Arguments are concatenated with '_'.
     */
    _getExtension: function(extPoint) {
        return this.chart._getExtension.apply(this.chart, arguments);
    },

    /* SIZE & POSITION */
    setPosition: function(position){
        for(var side in position){
            if(this.margins.hasOwnProperty(side)){
                var s = position[side]; 
                if(s === null) {
                    delete this.position[side];
                } else {
                    s = +s; // -> to number
                    if(!isNaN(s) && isFinite(s)){
                        this.position[side] = s;
                    }
                }
            }
        }
    },
    
    /**
     * Sets the size for the panel, 
     * for when the parent panel is undefined
     */
    setSize: function(w, h) {
        if(w instanceof pvc.Size) {
            h = w.height;
            w = w.width;
        }
        
        if(h !== this.width || w !== this.height) {
            this.width  = w;
            this.height = h;
            
            this._invalidateLayout();
        }
    },
    
    setAnchoredSize: function(anchorLength, availableSize){
        if (this.isAnchorTopOrBottom()) {
            this.setSize(availableSize.width, Math.min(availableSize.height, anchorLength));
        } else {
            this.setSize(Math.min(availableSize.width, anchorLength), availableSize.height);
        }
    },

    /**
     * Returns the width of the Panel
     */
    getWidth: function() {
        return this.width;
    },

    /**
     * Returns the height of the Panel
     */
    getHeight: function() {
        return this.height;
    },
    
    setWidth: function(w) {
        if(w !== this.width) {
            this.width = w;
            this._invalidateLayout();
        }
    },
    
    setHeight: function(h) {
        if(h !== this.height) {
            this.height = h;
            this._invalidateLayout();
        }
    },

    /**
     * Sets the margins of the panel.
     * Must be called after #setSize and before any child panels are added.
     */
    setMargins: function(margins){
        var m = margins.all;
        if(m != null){
            var allEqualMargins = pv.dict(Object.keys(this.margins), function(){ return m; });
            this.setMargins(allEqualMargins);
        } else {
            var any;
            for(var anchor in margins){
                if(this.margins.hasOwnProperty(anchor)){
                    m = +margins[anchor]; // -> to number
                    if(m >= 0){
                        this.margins[anchor] = m;
                        any = true;
                    }
                }
            }
            
            if(any) {
                this._invalidateLayout();
            }
        }
    },

    /**
     * Returns the underlying protovis Panel.
     * If 'layer' is specified returns
     * the protovis panel for the specified layer name.
     */
    getPvPanel: function(layer) {
        if(!layer){
            return this.pvPanel;
        }

        if(!this.parent){
            throw def.error.operationInvalid("Layers are not possible in a root panel.");
        }

        if(!this.pvPanel){
            throw def.error.operationInvalid(
               "Cannot access layer panels without having created the main panel.");
        }

        var pvPanel = null;
        if(!this._layers){
            this._layers = {};
        } else {
            pvPanel = this._layers[layer];
        }

        if(!pvPanel){
            pvPanel = this.parent.pvPanel.add(this.type)
                            .extend(this.pvPanel);

            this.initLayerPanel(pvPanel, layer);

            this._layers[layer] = pvPanel;
        }

        return pvPanel;
    },
    
    /**
     * Initializes a new layer panel.
     * @virtual
     */
    initLayerPanel: function(pvPanel, layer){
    },
    
    /* EVENTS & VISUALIZATION CONTEXT */
    _getLegacyDimName: function(legacyDim){
        var dimNames = this._legacyDimName || (this._legacyDimName = {});
        var dimName  = dimNames[legacyDim];
        if(dimName == null) {
            var role = this.chart.visualRoles(this._legacyDimRole[legacyDim], {assertExists: false});
            dimName = role ? role.firstDimensionName() : '';
            dimNames[legacyDim] = dimName;
        }
        
        return dimName;
    },
    
    /**
     * Creates the visualization context of the panel.
     * <p>
     * Override to use a specific visualization context class. 
     * </p>
     * 
     * @param {pv.Mark} mark The protovis mark being rendered or targeted by an event.
     * @param {object} [event] An event object.
     * @type pvc.visual.Context
     * @virtual
     */
    _createContext: function(mark, ev){
        return new pvc.visual.Context(this, mark, ev);
    },
    
    /**
     * Updates the visualization context of the panel.
     * <p>
     * Override to perform specific updates. 
     * </p>
     * 
     * @param {pvc.visual.Context} context The panel's visualization context.
     * @param {pv.Mark} mark The protovis mark being rendered or targeted by an event.
     * @param {object} [event] An event object.
     * @type pvc.visual.Context
     * @virtual
     */
    _updateContext: function(context, mark, ev){
        visualContext_update.call(context, mark, ev);
    },
    
    _getContext: function(mark, ev){
        if(!this._context) {
            this._context = this._createContext(mark, ev);
        } else {
            this._updateContext(this._context, mark, ev);
        }
        
        return this._context;
    },
    
    /* TOOLTIP */ 
    _addPropTooltip: function(mark, keyArgs){
        var myself = this,
            tipsyEvent = def.get(keyArgs, 'tipsyEvent'), 
            options = this.chart.options,
            buildTooltip;
        
        if(!tipsyEvent) {
            switch(mark.type) {
                case 'dot':
                case 'line':
                case 'area':
                    tipsyEvent = 'point';
                    break;
                    
                default:
                    tipsyEvent = 'mouseover';
            }
        }
        
        var tooltipFormat = options.tooltipFormat;
        if(!tooltipFormat) {
            buildTooltip = this._buildTooltip;
        } else {
            buildTooltip = function(context){
                return tooltipFormat.call(context, 
                                context.getSeries(), 
                                context.getCategory(), 
                                context.getValue() || '', 
                                context.datum);
            };
        } 
        
        mark.localProperty("tooltip")
            /* Lazy tooltip creation, when requested */
            .tooltip(function(){
                var tooltip,
                    // Capture current context
                    context = myself._createContext(mark, null);
                
                // No group or datum?
                if(!context.atoms) {
                    return "";
                }
                
                return function() {
                    if(tooltip == null) {
                        tooltip = buildTooltip.call(myself, context);
                        context = null; // release context;
                    } 
                    return tooltip; 
                };
            })
            /* Prevent browser tooltip */
            .title(function(){
                return '';
            })
            .event(tipsyEvent, pv.Behavior.tipsy(options.tipsySettings));
    },
    
    _buildTooltip: function(context){
        
        var chart = this.chart,
            dataEngine = chart.dataEngine,
            visibleKeyArgs = {visible: true},
            group = context.group,
            isMultiDatumGroup = group && group._datums.length > 1;
        
        // Single null datum?
        if(!isMultiDatumGroup && context.datum.isNull) {
            return "";
        }
        
        var tooltip = [],
            playingPercentMap = dataEngine.type.getPlayingPercentVisualRoleDimensionMap();
            commonAtoms = isMultiDatumGroup ? context.group.atoms : context.atoms;
        
        function addDim(escapedDimLabel, label){
            tooltip.push('<b>' + escapedDimLabel + "</b>: " + (def.escapeHtml(label) || " - ") + '<br/>');
        }
        
        function calcPercent(atom, dimName) {
            var pct;
            if(group) {
                pct = group.dimensions(dimName).percentOverParent(visibleKeyArgs);
            } else {
                pct = dataEngine.dimensions(dimName).percent(atom.value);
            }
            
            return chart.options.valueFormat.call(null, Math.round(pct * 1000) / 10) + "%";
        }
        
        def.each(commonAtoms, function(atom, dimName){
            if(!isMultiDatumGroup || atom.value != null) {
                var valueLabel = atom.label;
                if(playingPercentMap.has(dimName)) {
                    valueLabel += " (" + calcPercent(atom, dimName) + ")";
                }
                
                addDim(def.escapeHtml(atom.dimension.type.label), valueLabel);
            }
        });
        
        if(isMultiDatumGroup) {
            tooltip.push('<hr />');
            tooltip.push("<b>#</b>: " + group._datums.length + '<br/>');
            
            group.freeDimensionNames().forEach(function(dimName){
                var dim = group.dimensions(dimName),
                    dimLabel = def.escapeHtml(dim.type.label),
                    valueLabel;
                
                if(dim.type.valueType === Number) {
                    // Sum
                    valueLabel = dim.format(dim.sum(visibleKeyArgs));
                    if(playingPercentMap.has(dimName)) {
                        valueLabel += " (" + calcPercent(null, dimName) + ")";
                    }
                    
                    dimLabel = "&sum; " + dimLabel;
                } else {
                    valueLabel = dim.atoms(visibleKeyArgs).map(function(atom){ return atom.label; }).join(", ");
                }
                
                addDim(dimLabel, valueLabel);
            });
        }
        
        return '<div style="text-align: left;">' + tooltip.join('\n') + '</div>';
    },
    
    /* CLICK & DOUBLE-CLICK */
    _addPropClick: function(mark){
        var myself = this;
        
        function onClick(){
            var ev = arguments[arguments.length - 1];
            return myself._handleClick(this, ev);
        }
        
        mark.cursor("pointer")
            .events('all') // some marks, like labels, need this  
            .event("click", onClick);
    },

    _addPropDoubleClick: function(mark){
        var myself = this;
        
        function onDoubleClick(){
            var ev = arguments[arguments.length - 1];
            return myself._handleDoubleClick(this, ev);
        }
        
        mark.cursor("pointer")
            .events('all') // some marks, like labels, need this
            .event("dblclick", onDoubleClick);
    },
    
    _handleDoubleClick: function(mark, ev){
        var handler = this.chart.options.doubleClickAction;
        if(handler){
            this._ignoreClicks = 2;
            
            var context = this._getContext(mark, ev);
            this._onDoubleClick(context);
        }
    },
    
    _onDoubleClick: function(context){
        var handler = this.chart.options.doubleClickAction;
        handler.call(context, 
                /* LEGACY ARGS */
                context.getSeries(), 
                context.getCategory(), 
                context.getValue(), 
                context.event);
    },
    
    _shouldHandleClick: function(){
        var options = this.chart.options;
        return options.selectable || (options.clickable && options.clickAction);
    },
    
    _handleClick: function(mark, ev){
        if(!this._shouldHandleClick()){
            return;
        }

        var options = this.chart.options,
            context;
        
        if(!options.doubleClickAction){
            // Use shared context
            context = this._getContext(mark, ev);
            this._handleClickCore(context);
        } else {
            // Delay click evaluation so that
            // it may be canceled if double click meanwhile
            // fires.
            var myself = this;
            
            // Capture current context
            context = this._createContext(mark, ev);
            window.setTimeout(
                function(){
                    myself._handleClickCore.call(myself, context);
                },
                options.doubleClickMaxDelay || 300);

        }
    },

    _handleClickCore: function(context){
        if(this._ignoreClicks) {
            this._ignoreClicks--;
        } else {
            this._onClick(context);
            
            if(this.chart.options.selectable && context.datum){
                this._onSelect(context);
            }
        }
        
    },
    
    _onClick: function(context){
        var handler = this.chart.options.clickAction;
        if(handler){
            handler.call(context, 
                    /* LEGACY ARGS */
                    context.getSeries(), 
                    context.getCategory(), 
                    context.getValue(), 
                    context.event);
        }
    },
    
    /* SELECTION & RUBBER-BAND */
    _onSelect: function(context){
        var datums = context.datums(),
            chart  = this.chart;
        if(chart.options.ctrlSelectMode && !context.event.ctrlKey){
            chart.dataEngine.owner.clearSelected();
            
            pvc.data.Data.setSelected(datums, true);
        } else {
            pvc.data.Data.toggleSelected(datums);
        }

        this._onSelectionChanged();
    },
    
    _onSelectionChanged: function(){
        this.chart.updateSelections();
    },
    
    /**
     * Add rubber-band functionality to panel.
     * Override to prevent rubber band selection.
     * 
     * @virtual
     */
    _initRubberBand: function(){
        var myself = this,
            chart = this.chart,
            options  = chart.options,
            dataEngine = chart.dataEngine;

        var dMin = 10; // Minimum dx or dy for a rubber band selection to be relevant

        var isSelecting = false;

        // Rubber band
        var rubberPvParentPanel = this.pvPanel,
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
        
        // NOTE: Rubber band coordinates are always transformed to screen coordinates (see 'select' and 'selectend' events)
        var selectionEndedDate;
        rubberPvParentPanel
            .event('mousedown', pv.Behavior.selector(false))
            
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
                
                if(dataEngine.owner.clearSelected()) {
                    myself._onSelectionChanged();
                }
            })
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
                    myself._dispatchRubberBandSelectionTop(ev);

                    selectionEndedDate = new Date();
                }
            });
    },
    
    _dispatchRubberBandSelectionTop: function(ev){
        /* Only update selection, which is a global op, after all selection changes */
        
        if(pvc.debug >= 3) {
            pvc.log('rubberBand ' + JSON.stringify(this.rubberBand));
        }
        
        var chart = this.chart;
        chart._suspendSelectionUpdate();
        try {
            if(!ev.ctrlKey && chart.options.ctrlSelectMode){
                chart.dataEngine.owner.clearSelected();
            }
            
            this._dispatchRubberBandSelection();
            
        } finally {
            chart._resumeSelectionUpdate();
        }
    },
    
    // Callback to handle end of rubber band selection
    _dispatchRubberBandSelection: function(ev){
        // Ask the panel for signum selections
        var datumsByKey = {},
            keyArgs = {toggle: false};
        if(this._detectDatumsUnderRubberBand(datumsByKey, this.rubberBand, keyArgs)) {
            var selectedDatums = def.own(datumsByKey); 
            
            var changed;
            if(keyArgs.toggle){
                pvc.data.Data.toggleSelected(selectedDatums);
                changed = true;
            } else {
                changed = pvc.data.Data.setSelected(selectedDatums, true);
            }
            
            if(changed) {
                this._onSelectionChanged();
            }
        }
        
        // --------------
        
        if(this._children) {
            this._children.forEach(function(child){
                child.rubberBand = this.rubberBand;
                child._dispatchRubberBandSelection(child);
            }, this);
        }
    },
    
    /**
     * The default implementation obtains
     * datums associated with the instances of 
     * marks returned by #_getSignums.
     * 
     * <p>
     * Override to provide a specific
     * selection detection implementation.
     * </p>
     * 
     * @param {object} datumsByKey The map that receives the found datums, indexed by their key. 
     * @param {pvc.Rect} rb The rubber band to use. The default value is the panel's current rubber band.
     * @param {object} keyArgs Keyword arguments.
     * @param {boolean} [keyArgs.toggle=false] Returns a value that indicates to the caller that the selection should be toggled.
     * 
     * @returns {boolean} <tt>true</tt> if any datum was found under the rubber band.
     * 
     * @virtual
     */
    _detectDatumsUnderRubberBand: function(datumsByKey, rb, keyArgs){
        var any = false,
            selectableMarks = this._getSignums();
        
        if(selectableMarks){
            selectableMarks.forEach(function(mark){
                this._forEachMarkDatumUnderRubberBand(mark, function(datum){
                    datumsByKey[datum.key] = datum;
                    any = true;
                }, this, rb);
            }, this);
        }
        
        return any;
    },
    
    _forEachMarkDatumUnderRubberBand: function(mark, fun, ctx, rb){
        if(!rb) {
            rb = this.rubberBand;
        }
        
        function processShape(shape, instance) {
            // pvc.log(datum.key + ": " + JSON.stringify(shape) + " intersects? " + shape.intersectsRect(this.rubberBand));
            if (shape.intersectsRect(rb)){
                var group = instance.group;
                var datums = group ? group._datums : def.array(instance.datum);
                if(datums) {
                    datums.forEach(function(datum){
                        if(!datum.isNull) {
                            if(pvc.debug >= 3) {
                                pvc.log(datum.key + ": " + JSON.stringify(shape) + " intersects? true " + mark.type.toUpperCase());
                            }
                    
                            fun.call(ctx, datum);
                        }
                    });
                }
            }
        }
        
        if(mark.type === 'area' || mark.type === 'line'){
            var instancePrev;
            
            mark.forEachSignumInstance(function(instance, toScreen){
                if(!instance.visible || instance.isBreak || (instance.datum && instance.datum.isNull)) {
                    // Break the line
                    instancePrev = null;
                } else {
                    if(instancePrev){
                        var shape = mark.getInstanceShape(instancePrev, instance).apply(toScreen);
                        processShape(shape, instancePrev);
                    }
    
                    instancePrev = instance;
                }
            }, this);
        } else {
            mark.forEachSignumInstance(function(instance, toScreen){
                if(!instance.isBreak && instance.visible) {
                    var shape = mark.getInstanceShape(instance).apply(toScreen);
                    processShape(shape, instance);
                }
            }, this);
        }
    },
    
    /* ANCHORS & ORIENTATION */
    
    /**
     * Returns true if the anchor is one of the values 'top' or
     * 'bottom'.
     */
    isAnchorTopOrBottom: function(anchor) {
        if (!anchor) {
            anchor = this.anchor;
        }
        return anchor === "top" || anchor === "bottom";
    },

    anchorOrtho: function(anchor) {
        if (!anchor) {
            anchor = this.anchor;
        }
        return pvc.BasePanel.relativeAnchor[anchor];
    },

    anchorOrthoMirror: function(anchor) {
        if (!anchor) {
            anchor = this.anchor;
        }
        return pvc.BasePanel.relativeAnchorMirror[anchor];
    },

    anchorOpposite: function(anchor) {
        if (!anchor) {
            anchor = this.anchor;
        }
        return pvc.BasePanel.oppositeAnchor[anchor];
    },

    anchorLength: function(anchor) {
        if (!anchor) {
            anchor = this.anchor;
        }
        return pvc.BasePanel.parallelLength[anchor];
    },

    anchorOrthoLength: function(anchor) {
        if (!anchor) {
            anchor = this.anchor;
        }
        return pvc.BasePanel.orthogonalLength[anchor];
    },

    isOrientationVertical: function(orientation) {
        return this.chart.isOrientationVertical(orientation);
    },

    isOrientationHorizontal: function(orientation) {
        return this.chart.isOrientationHorizontal(orientation);
    }
}, {
    // Determine what is the associated method to
    // call to position the labels correctly
    relativeAnchor: {
        top: "left",
        bottom: "left",
        left: "bottom",
        right: "bottom"
    },

    relativeAnchorMirror: {
        top: "right",
        bottom: "right",
        left: "top",
        right: "top"
    },

    oppositeAnchor: {
        top: "bottom",
        bottom: "top",
        left: "right",
        right: "left"
    },

    parallelLength: {
        top: "width",
        bottom: "width",
        right: "height",
        left: "height"
    },

    orthogonalLength: {
        top: "height",
        bottom: "height",
        right: "width",
        left: "width"
    }
});
