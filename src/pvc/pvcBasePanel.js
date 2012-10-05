
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
    
    _extensionPrefix: '',
    
    /**
     * Total height of the panel in pixels.
     * Includes vertical paddings and margins.
     * @type number  
     */
    height: null,
    
    /**
     * Total width of the panel in pixels.
     * Includes horizontal paddings and margins.
     * @type number
     */
    width: null,
    
    anchor: "top",
    
    pvPanel: null, // padding/client pv panel (within border box, separated by paddings)
    
    margins:   null,
    paddings:  null,
    
    isRoot:    false,
    isTopRoot: false,
    root:      null, 
    topRoot:   null,
    
    _coreInfo: null,   // once per create info (only for information that is: layout independent *and* required by layout)
    _layoutInfo: null, // once per layout info
    
    _signs: null,
    
    /**
     * The data that the panel uses to obtain "data".
     * @type pvc.data.Data
     */
    data: null,

    dataPartValue: null,
    
    _colorAxis: null,
    
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
    
    _isRubberBandSelecting: false,
    
    /**
     * Shared state between {@link _handleClick} and {@link #_handleDoubleClick}.
     */
    _ignoreClicks: 0,
    
    /**
     * Indicates the name of the role that should be used whenever a V1 dimension value is required.
     * Only the first dimension of the specified role is considered.
     * <p>
     * In a derived class use {@link Object.create} to override this object for only certain
     * v1 dimensions.
     * </p>
     * @ type string
     */
    _v1DimRoleName: {
        'series':   'series',
        'category': 'category',
        'value':    'value'
    },
    
    _sceneTypeExtensions: null,
    
    clickAction:       null,
    doubleClickAction: null,
    
    constructor: function(chart, parent, options) {
        
        if(options){
            if(options.scenes){
                this._sceneTypeExtensions = options.scenes;
                delete options.scenes;
            }
            
            if(options.colorAxis){
                this._colorAxis = options.colorAxis;
                delete options.colorAxis;
            }
            
            if(options.extensionPrefix){
                this._extensionPrefix = options.extensionPrefix;
                delete options.extensionPrefix;
            }
        }
        
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
        
        var margins = options && options.margins;
        if(!parent && margins === undefined){
            // Give a default 2 px margin on the root panel
            //  because otherwise borders of panels may be clipped..
            margins = 3;
        }
        
        this.margins  = new pvc.Sides(margins);
        this.paddings = new pvc.Sides(options && options.paddings);
        this.size     = new pvc.Size (options && options.size    );
        this.sizeMax  = new pvc.Size (options && options.sizeMax );
        
        if(!parent) {
            this.parent    = null;
            this.root      = this;
            this.topRoot   = this;
            this.isRoot    = true;
            this.isTopRoot = true;
            this.data      = this.chart.data;
            
        } else {
            this.parent    = parent;
            this.root      = parent.root;
            this.topRoot   = parent.topRoot;
            this.isTopRoot = false;
            this.isRoot    = (parent.chart !== chart);
            this.data      = parent.data; // TODO

            if(this.isRoot) {
                this.position.left = chart.left; 
                this.position.top  = chart.top;
            }
            
            parent._addChild(this);
        }
        
        /* Root panels do not need layout */
        if(this.isRoot) {
            this.anchor  = null;
            this.align   = null;
            this.alignTo = null;
            this.offset  = null;
        } else {
            this.align = pvc.parseAlign(this.anchor, this.align);
            
            // * a string with a named alignTo value
            // * a number
            // * a PercentValue object
            var alignTo = this.alignTo;
            var side = this.anchor;
            if(alignTo != null && alignTo !== '' && (side === 'left' || side === 'right')){
                if(alignTo !== 'page-middle'){
                    if(!isNaN(+alignTo.charAt(0))){
                        alignTo = pvc.PercentValue.parse(alignTo); // percent or number
                    } else {
                        alignTo = pvc.parseAlign(side, alignTo);
                    }
                }
            } else {
                alignTo = this.align;
            }
            
            this.alignTo = alignTo;
            
            this.offset = new pvc.Offset(this.offset);
        }
    },
    
    compatVersion: function(options){
        return this.chart.compatVersion(options);
    },
    
    defaultColorAxis: function(){
        return this._colorAxis || this.chart.axes.color;
    },
    
    defaultVisibleBulletGroupScene: function(){
        var colorAxis = this.defaultColorAxis();
        if(colorAxis && colorAxis.isVisible){
            return colorAxis.legendBulletGroupScene;
        }
        return null;
    },
    
    _getLegendBulletRootScene: function(){
        return this.chart._getLegendBulletRootScene();
    },
    
    /**
     * Adds a panel as child.
     */
    _addChild: function(child){
        // <Debug>
        /*jshint expr:true */
        child.parent === this || def.assert("Child has a != parent.");
        // </Debug>
        
        (this._children || (this._children = [])).push(child);
    },
    
    _addSign: function(sign){
        (this._signs || (this._signs = [])).push(sign); 
    },
    
    /* LAYOUT PHASE */
    
    /** 
     * Calculates and sets its size,
     * taking into account a specified total size.
     * 
     * @param {pvc.Size} [availableSize] The total size available for the panel.
     * <p>
     * On root panels this argument is not specified,
     * and the panels' current {@link #width} and {@link #height} are used as default. 
     * </p>
     * @param {object}  [keyArgs] Keyword arguments.
     * @param {boolean} [keyArgs.force=false] Indicates that the layout should be
     * performed even if it has already been done.
     * @param {pvc.Size} [keyArgs.referenceSize] The size that should be used for 
     * percentage size calculation. 
     * This will typically be the <i>client</i> size of the parent.
     * @param {pvc.Sides} [keyArgs.paddings] The paddings that should be used for 
     * the layout. Default to the panel's paddings {@link #paddings}.
     * @param {pvc.Sides} [keyArgs.margins] The margins that should be used for 
     * the layout. Default to the panel's margins {@link #margins}.
     * @param {boolean} [keyArgs.canChange=true] Whether this is a last time layout. 
     */
    layout: function(availableSize, keyArgs){
        if(!this._layoutInfo || def.get(keyArgs, 'force', false)) {
            
            var referenceSize = def.get(keyArgs, 'referenceSize');
            if(!referenceSize && availableSize){
                referenceSize = def.copyOwn(availableSize);
            }
            
            // Does this panel have a **desired** fixed size specified?
            
            // * size may have no specified components 
            // * referenceSize may be null
            var desiredSize = this.size.resolve(referenceSize);
            var sizeMax     = this.sizeMax.resolve(referenceSize);
            
            if(!availableSize) {
                if(desiredSize.width == null || desiredSize.height == null){
                    throw def.error.operationInvalid("Panel layout without width or height set.");
                }
                
                availableSize = def.copyOwn(desiredSize);
            }
            
            if(!referenceSize && availableSize){
                referenceSize = def.copyOwn(availableSize);
            }
            
            // Apply max size to available size
            if(sizeMax.width != null && availableSize.width > sizeMax.width){
                availableSize.width = sizeMax.width;
            }
            
            if(sizeMax.height != null && availableSize.height > sizeMax.height){
                availableSize.height = sizeMax.height;
            }
            
            var margins  = (def.get(keyArgs, 'margins' ) || this.margins ).resolve(referenceSize);
            var paddings = (def.get(keyArgs, 'paddings') || this.paddings).resolve(referenceSize);
            
            var spaceWidth  = margins.width  + paddings.width;
            var spaceHeight = margins.height + paddings.height;
            
            var availableClientSize = new pvc.Size(
                    Math.max(availableSize.width  - spaceWidth,  0),
                    Math.max(availableSize.height - spaceHeight, 0)
                );
            
            var desiredClientSize = def.copyOwn(desiredSize);
            if(desiredClientSize.width != null){
                desiredClientSize.width = Math.max(desiredClientSize.width - spaceWidth, 0);
            }
            
            if(desiredClientSize.height != null){
                desiredClientSize.height = Math.max(desiredClientSize.height - spaceHeight, 0);
            }
            
            var prevLayoutInfo = this._layoutInfo || null;
            var canChange = def.get(keyArgs, 'canChange', true);
            
            var layoutInfo = 
                this._layoutInfo = {
                    canChange:         canChange,
                    referenceSize:     referenceSize,
                    margins:           margins,
                    paddings:          paddings,
                    desiredClientSize: desiredClientSize,
                    clientSize:        availableClientSize,
                    pageClientSize:    prevLayoutInfo ? prevLayoutInfo.pageClientSize : availableClientSize.clone(),
                    previous:          prevLayoutInfo
                };
            
            if(prevLayoutInfo){
                // Free old memory
                delete prevLayoutInfo.previous;
                delete prevLayoutInfo.pageClientSize;
            }
            
            var clientSize = this._calcLayout(layoutInfo);
            
            var size;
            if(!clientSize){
                size = availableSize; // use all available size
                clientSize = availableClientSize;
            } else {
                layoutInfo.clientSize = clientSize;
                size = {
                    width:  clientSize.width  + spaceWidth,
                    height: clientSize.height + spaceHeight
                };
            }
            
            this.isVisible = (clientSize.width > 0 && clientSize.height > 0);
            
            delete layoutInfo.desiredClientSize;
            
            this.width  = size.width;
            this.height = size.height;
            
            if(!canChange && prevLayoutInfo){
                delete layoutInfo.previous;
            }
        }
    },
    
    /**
     * Override to calculate panel client size.
     * <p>
     * The default implementation performs a dock layout {@link #layout} on child panels
     * and uses all of the available size. 
     * </p>
     * 
     * @param {object} layoutInfo An object that is supplied with layout information
     * and on which to export custom layout information.
     * <p>
     * This object is later supplied to the method {@link #_createCore},
     * and can thus be used to store any layout by-product
     * relevant for the creation of the protovis marks and
     * that should be cleared whenever a layout becomes invalid.
     * </p>
     * <p>
     * The object is supplied with the following properties:
     * </p>
     * <ul>
     *    <li>referenceSize - size that should be used for percentage size calculation. 
     *        This will typically be the <i>client</i> size of the parent.
     *    </li>
     *    <li>margins - the resolved margins object. All components are present, possibly with the value 0.</li>
     *    <li>paddings - the resolved paddings object. All components are present, possibly with the value 0.</li>
     *    <li>desiredClientSize - the desired fixed client size. Do ignore a null width or height property value.</li>
     *    <li>clientSize - the available client size, already limited by a maximum size if specified.</li>
     * </ul>
     * <p>
     * Do not modify the contents of the objects of 
     * any of the supplied properties.
     * </p>
     * @virtual
     */
    _calcLayout: function(layoutInfo){
        
        if(!this._children) {
            return;
        }
        
        
        var aolMap = pvc.BasePanel.orthogonalLength;
        var aoMap  = pvc.BasePanel.relativeAnchor;
        var altMap = pvc.BasePanel.leftTopAnchor;
        var aofMap = pvc.Offset.namesSidesToOffset;
        
        // Classify children
        
        var fillChildren = [];
        var sideChildren = [];
        
        this._children.forEach(function(child) {
            var a = child.anchor;
            if(a){ // requires layout
                if(a === 'fill') {
                    fillChildren.push(child);
                } else {
                    /*jshint expr:true */
                    def.hasOwn(aoMap, a) || def.fail.operationInvalid("Unknown anchor value '{0}'", [a]);
                    
                    sideChildren.push(child);
                }
            }
        });
    
        // When expanded (see checkChildLayout)
        // a re-layout is performed.
        var clientSize = def.copyOwn(layoutInfo.clientSize);
        var childKeyArgs = {
                force: true,
                referenceSize: clientSize
            };
        
        var margins, remSize;
        
        doMaxTimes(3, layoutCycle, this);
        
        /* Return possibly changed clientSize */
        return clientSize;
        
        // --------------------
        function doMaxTimes(maxTimes, fun, ctx){
            var index = 0;
            while(maxTimes--){
                // remTimes = maxTimes
                if(fun.call(ctx, maxTimes, index) === false){
                    return true;
                }
                index++;
            }
            
            return false;
        }
        
        function layoutCycle(remTimes, iteration){
            if(pvc.debug >= 5){
                pvc.log("\n[BasePanel] ==== LayoutCycle #" + (iteration + 1));
            }
            
            // Objects we can mutate
            // Reset margins and remSize
            margins = new pvc.Sides(0);
            remSize = def.copyOwn(clientSize);
            
            var canResize = (remTimes > 0);
            
            // Reset margins and remSize
            // ** Instances we can mutate
            margins = new pvc.Sides(0);
            remSize = def.copyOwn(clientSize);
            
            var index, count, child;
            
            // Lay out SIDE child panels
            index = 0;
            count = sideChildren.length;
            while(index < count){
                child = sideChildren[index];
                if(pvc.debug >= 5){
                    pvc.log("[BasePanel] SIDE Child i=" + index + " at " + child.anchor);
                }
                
                if(layoutChild.call(this, child, canResize)){
                    return true; // resized => break
                }
                
                index++;
            }
            
            // Lay out FILL child panels
            index = 0;
            count = fillChildren.length;
            while(index < count){
                child = fillChildren[index];
                if(pvc.debug >= 5){
                    pvc.log("[BasePanel] FILL Child i=" + index);
                }
                
                if(layoutChild.call(this, child, canResize)){
                    return true; // resized => break
                }
                
                index++;
            }
            
            return false; // !resized
        }
        
        function layoutChild(child, canResize) {
            var resized  = false;
            var paddings;
            
            childKeyArgs.canChange = canResize;
            
            doMaxTimes(3, function(remTimes, iteration){
                if(pvc.debug >= 5){
                    pvc.log("[BasePanel]   Attempt #" + (iteration + 1));
                }
                
                childKeyArgs.paddings = paddings;
                childKeyArgs.canChange = remTimes > 0;
                
                child.layout(new pvc.Size(remSize), childKeyArgs);
                if(child.isVisible){
                    resized = checkChildResize.call(this, child, canResize);
                    if(resized){
                        return false; // stop
                    }
                    
                    paddings = child._layoutInfo.requestPaddings;
                    if(paddings){
                        // Child wants to repeat its layout with != paddings
                        if(remTimes > 0){
                            paddings = new pvc.Sides(paddings);
                            if(pvc.debug >= 5){
                                pvc.log("[BasePanel] Child requested paddings change: " + JSON.stringify(paddings));
                            }
                            return true; // again
                        }
                        
                        if(pvc.debug >= 2){
                            pvc.log("[Warning] [BasePanel] FILL Child requests paddings change but no more iterations possible.");
                        }
                        
                        // ignore overflow
                    }
                    
                    // --------
                    
                    positionChild.call(this, child);
                        
                    if(child.anchor !== 'fill'){
                        updateSide.call(this, child);
                    }
                }
                
                return false; // stop
            }, this);
            
            return resized;
        }
        
        function checkChildResize(child, canResize){
            var resized = false;
            var addWidth = child.width - remSize.width;
            if(addWidth > 0){
                if(!canResize){
                    if(pvc.debug >= 2){
                        pvc.log("[Warning] Layout iterations limit reached.");
                    }
                } else {
                    resized = true;
                    
                    remSize   .width += addWidth;
                    clientSize.width += addWidth;
                }
            }
            
            var addHeight = child.height - remSize.height;
            if(addHeight > 0){
                if(!canResize){
                    if(pvc.debug >= 2){
                        pvc.log("[Warning] Layout iterations limit reached.");
                    }
                } else {
                    resized = true;
                    
                    remSize   .height += addHeight;
                    clientSize.height += addHeight;
                }
            }
            
            return resized;
        }
        
        function positionChild(child) {
            var side  = child.anchor;
            var align = child.align;
            var alignTo = child.alignTo;
            var sidePos;
            if(side === 'fill'){
                side = 'left';
                sidePos = margins.left + remSize.width / 2 - (child.width / 2);
                align = alignTo = 'middle';
            } else {
                sidePos = margins[side];
            }
            
            var sideo, sideOPosChildOffset;
            switch(align){
                case 'top':
                case 'bottom':
                case 'left':
                case 'right':
                    sideo = align;
                    sideOPosChildOffset = 0;
                    break;
                
                case 'center':
                case 'middle':
                    // 'left', 'right' -> 'top'
                    // else -> 'left'
                    sideo = altMap[aoMap[side]];
                    
                    // left -> width; top -> height
                    sideOPosChildOffset = - child[aolMap[sideo]] / 2;
                    break;
            }
            
            
            var sideOPosParentOffset;
            var sideOTo;
            switch(alignTo){
                case 'top':
                case 'bottom':
                case 'left':
                case 'right':
                    sideOTo = alignTo;
                    sideOPosParentOffset = (sideOTo !== sideo) ? remSize[aolMap[sideo]] : 0;
                    break;

                case 'center':
                case 'middle':
                    sideOTo = altMap[aoMap[side]];
                    
                    sideOPosParentOffset = remSize[aolMap[sideo]] / 2;
                    break;
                        
                case 'page-center':
                case 'page-middle':
                    sideOTo = altMap[aoMap[side]];
                    
                    var lenProp = aolMap[sideo];
                    var pageLen = Math.min(remSize[lenProp], layoutInfo.pageClientSize[lenProp]);
                    sideOPosParentOffset = pageLen / 2;
                    break;
            }
            
            var sideOPos = margins[sideOTo] + sideOPosParentOffset + sideOPosChildOffset;
            
            var resolvedOffset = child.offset.resolve(remSize);
            if(resolvedOffset){
                sidePos  += resolvedOffset[aofMap[side ]] || 0;
                sideOPos += resolvedOffset[aofMap[sideo]] || 0;
            }
            
            if(child.inBounds){
                if(sidePos < 0){
                    sidePos = 0;
                }
                
                if(sideOPos < 0){
                    sideOPos = 0;
                }
            }
            
            child.setPosition(
                    def.set({}, 
                        side,  sidePos,
                        sideo, sideOPos));
        }
        
        // Decreases available size and increases margins
        function updateSide(child) {
            var side   = child.anchor;
            var sideol = aolMap[side];
            var olen   = child[sideol];
            
            margins[side]   += olen;
            remSize[sideol] -= olen;
        }
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
            
            delete this._signs;
            delete this._coreInfo;
            
            /* Layout */
            this.layout();
            
            if(!this.isVisible){
                return;
            }
            
            if(this.isRoot) {
                this._creating();
            }
            
            var margins  = this._layoutInfo.margins;
            var paddings = this._layoutInfo.paddings;
            
            /* Protovis Panel */
            if(this.isTopRoot) {
                this.pvRootPanel = 
                this.pvPanel = new pv.Panel().canvas(this.chart.options.canvas);
                
                if(margins.width > 0 || margins.height > 0){
                    this.pvPanel
                        .width (this.width )
                        .height(this.height);
                    
                    // As there is no parent panel,
                    // the margins cannot be accomplished by positioning
                    // on the parent panel and sizing.
                    // We thus create another panel to be a child of pvPanel
                   
                    this.pvPanel = this.pvPanel.add(pv.Panel);
                }
            } else {
                this.pvPanel = this.parent.pvPanel.add(this.type);
            }
            
            var pvBorderPanel = this.pvPanel;
            
            // Set panel size
            var width  = this.width  - margins.width;
            var height = this.height - margins.height;
            pvBorderPanel
                .width (width)
                .height(height);
            
            // Set panel positions
            var hasPositions = {};
            def.eachOwn(this.position, function(v, side){
                pvBorderPanel[side](v + margins[side]);
                hasPositions[this.anchorLength(side)] = true;
            }, this);
            
            if(!hasPositions.width && margins.left > 0){
                pvBorderPanel.left(margins.left);
            }
            
            if(!hasPositions.height && margins.top > 0){
                pvBorderPanel.top(margins.top);
            }
            
            // Check padding
            if(paddings.width > 0 || paddings.height > 0){
                // We create separate border (outer) and inner (padding) panels
                this.pvPanel = pvBorderPanel.add(pv.Panel)
                                   .width (width  - paddings.width )
                                   .height(height - paddings.height)
                                   .left(paddings.left)
                                   .top (paddings.top );
            }
            
            pvBorderPanel.borderPanel  = pvBorderPanel;
            pvBorderPanel.paddingPanel = this.pvPanel;
            
            this.pvPanel.paddingPanel  = this.pvPanel;
            this.pvPanel.borderPanel   = pvBorderPanel;
            
            if(pvc.debug >= 15){
                this.pvPanel // inner
                    .strokeStyle('lightgreen')
                    .lineWidth(1)
                    .strokeDasharray('- ');
                
                pvBorderPanel // outer
                    .strokeStyle('lightblue')
                    .lineWidth(1)
                    .strokeDasharray(null); 
            }
            
            var extensionId = this._getExtensionId();
            if(extensionId != null){ // '' is allowed cause this is relative to #_getExtensionPrefix
                // Wrap the panel that is extended with a Panel sign
                new pvc.visual.Panel(this, null, {
                    panel:       pvBorderPanel,
                    extensionId: extensionId
                });
            }
            
            /* Protovis marks that are pvc Panel specific,
             * and/or create child panels.
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

    _creating: function(){
        if(this._children) {
            this._children.forEach(function(child){
                child._creating();
            });
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
        
        if(!this.isVisible){
            return;
        }
        
        var chart = this.chart,
            options = chart.options;
        
        if (options.renderCallback) {
            options.renderCallback.call(this._getContext());
        }
        
        var pvPanel = this.pvRootPanel;
        
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
     * the marks returned by #_getSelectableMarks, 
     * or this.pvPanel if none is returned (and it has no children)
     * which is generally in excess of what actually requires
     * to be re-rendered.
     * The call is then propagated to any child panels.
     * 
     * @virtual
     */
    renderInteractive: function(){
        if(this.isVisible){
            var pvMarks = this._getSelectableMarks();
            if(pvMarks && pvMarks.length){
                pvMarks.forEach(function(pvMark){ pvMark.render(); });
            } else if(!this._children) {
                this.pvPanel.render();
            }
            
            if(this._children){
                this._children.forEach(function(child){
                    child.renderInteractive();
                });
            }
        }
    },

    /**
     * Returns an array of marks whose instances are associated to a datum, or null.
     * @virtual
     */
    _getSelectableMarks: function(){
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
    
    /* SIZE & POSITION */
    setPosition: function(position){
        for(var side in position){
            if(def.hasOwn(pvc.Sides.namesSet, side)){
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
    
    createAnchoredSize: function(anchorLength, size){
        if (this.isAnchorTopOrBottom()) {
            return new pvc.Size(size.width, Math.min(size.height, anchorLength));
        } 
        return new pvc.Size(Math.min(size.width, anchorLength), size.height);
    },
    
    /* EXTENSION */
    
    /**
     * Override to apply specific extensions points.
     * @virtual
     */
    applyExtensions: function(){
        if (this._signs) {
            this._signs.forEach(function(sign){
                sign.applyExtensions();
            });
        }
    },

    /**
     * Extends a protovis mark with extension points 
     * having a given panel-relative component id.
     */
    extend: function(mark, id, keyArgs) {
        this.chart.extend(mark, this._makeExtensionAbsId(id), keyArgs);
    },
    
    /**
     * Extends a protovis mark with extension points 
     * having a given absolute component id.
     */
    extendAbs: function(mark, absId, keyArgs) {
        this.chart.extend(mark, absId, keyArgs);
    },
    
    _extendSceneType: function(typeKey, type, names){
        var typeExts = def.get(this._sceneTypeExtensions, typeKey);
        if(typeExts){
            pvc.extendType(type, typeExts, names);
        }
    },
    
    _getExtensionId: function(){
        if (this.isRoot) {
            return 'base';
        }
    },
    
    _getExtensionPrefix: function(){
        return this._extensionPrefix;
    },
    
    _makeExtensionAbsId: function(id){
        var prefix = this._getExtensionPrefix();
        if(!prefix){
            return id;
        }
        
        return id ?
               (prefix + def.firstUpperCase(id)) :
               prefix;
    },
    
    /**
     * Obtains an extension point given its identifier and property.
     */
    _getExtension: function(id, prop) {
        return this.chart._getExtension(this._makeExtensionAbsId(id), prop);
    },
    
    _getExtensionAbs: function(absId, prop) {
        return this.chart._getExtension(absId, prop);
    },

    _getConstantExtension: function(id, prop) {
        return this.chart._getConstantExtension(this._makeExtensionAbsId(id), prop);
    },
    
    // -----------------------------
    
    /**
     * Returns the underlying protovis Panel.
     * If 'layer' is specified returns
     * the protovis panel for the specified layer name.
     */
    getPvPanel: function(layer) {
        var mainPvPanel = this.pvPanel;
        if(!layer){
            return mainPvPanel;
        }

        if(!this.parent){
            throw def.error.operationInvalid("Layers are not possible in a root panel.");
        }

        if(!mainPvPanel){
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
            var pvParentPanel = this.parent.pvPanel;
            
            pvPanel = pvParentPanel.borderPanel.add(this.type)
                .extend(mainPvPanel.borderPanel);
            
            var pvBorderPanel = pvPanel;

            if(mainPvPanel !== mainPvPanel.borderPanel){
                pvPanel = pvBorderPanel.add(pv.Panel)
                                       .extend(mainPvPanel);
            }
            
            pvBorderPanel.borderPanel  = pvBorderPanel;
            pvBorderPanel.paddingPanel = pvPanel;
            
            pvPanel.paddingPanel  = pvPanel;
            pvPanel.borderPanel   = pvBorderPanel;
            
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
    _getV1DimName: function(v1Dim){
        var dimNames = this._v1DimName || (this._v1DimNameCache = {});
        var dimName  = dimNames[v1Dim];
        if(dimName == null) {
            var role = this.chart.visualRoles(this._v1DimRoleName[v1Dim], {assertExists: false});
            dimName = role ? role.firstDimensionName() : '';
            dimNames[v1Dim] = dimName;
        }
        
        return dimName;
    },
    
    _getV1Datum: function(scene){
        return scene.datum;
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
     * Obtains the visualization context of the panel,
     * prepared for a specified mark and event.
     *  
     * Creates a new context when necessary.
     * 
     * <p>
     * Override to perform specific updates. 
     * </p>
     * 
     * @param {pv.Mark} mark The protovis mark being rendered or targeted by an event.
     * @param {object} [event] An event object.
     * @type pvc.visual.Context
     * @virtual
     */
    _getContext: function(mark, ev){
        var context = this._context;
        if(!context || context.isPinned){
            this._context = this._createContext(mark, ev);
        } else {
            /*global visualContext_update:true */
            visualContext_update.call(context, mark, ev);
        }
        
        return this._context;
    },
    
    _isTooltipEnabled: function(){
        return !this.isRubberBandSelecting() && !this.isAnimating();
    },
    
    _ensurePropEvents: function(pvMark){
        // labels and other marks don't receive events by default
        var events = pvMark.propertyValue('events', /*inherit*/ true);
        if(!events || events === 'none'){
            pvMark.events('all');
        }
    },
    
    /* HOVERABLE */
    _addPropHoverable: function(pvMark){
        var panel  = this;
        
        var onEvent;
        var offEvent;
//        switch(pvMark.type) {
//            default:
//            case 'dot':
//            case 'line':
//            case 'area':
//            case 'rule':
//                onEvent  = 'point';
//                offEvent = 'unpoint';
//               panel._requirePointEvent();
//                break;

//            default:
                onEvent = 'mouseover';
                offEvent = 'mouseout';
//                break;
//        }
        
        pvMark
            .event(onEvent, function(scene){
                scene.setActive(true);

                if(!panel.isRubberBandSelecting() && !panel.isAnimating()) {
                    panel.renderInteractive();
                }
            })
            .event(offEvent, function(scene){
                if(scene.clearActive()) {
                    /* Something was active */
                    if(!panel.isRubberBandSelecting() && !panel.isAnimating()) {
                        panel.renderInteractive();
                    }
                }
            });
        
        this._ensurePropEvents(pvMark);
    },
    
    /* TOOLTIP */ 
    _addPropTooltip: function(pvMark, keyArgs){
        var options = this.chart.options;
        
        var tipsySettings;
        var nowTipsySettings = def.get(keyArgs, 'tipsySettings');
        if(nowTipsySettings){
            tipsySettings = def.create(options.tipsySettings, nowTipsySettings);
        } else {
            tipsySettings = Object.create(options.tipsySettings);
        }
        
        var buildTooltip = def.get(keyArgs, 'buildTooltip') ||
                           this._getTooltipBuilder(tipsySettings);
        if(!buildTooltip){
            return;
        }
        
        tipsySettings.isEnabled = this._isTooltipEnabled.bind(this);
        
        var tipsyEvent = def.get(keyArgs, 'tipsyEvent');
        if(!tipsyEvent) {
//          switch(pvMark.type) {
//                case 'dot':
//                case 'line':
//                case 'area':
//                    this._requirePointEvent();
//                    tipsyEvent = 'point';
//                    tipsySettings.usesPoint = true;
//                    break;
                
//                default:
                    tipsyEvent = 'mouseover';
//            }
        }
        
        var isLazy = def.get(keyArgs, 'isLazy', true);
        
        pvMark.localProperty("tooltip"/*, Function | String*/) 
              .tooltip(this._createTooltipProp(pvMark, buildTooltip, isLazy))
              .title(function(){ return '';} ) // Prevent browser tooltip
              .event(tipsyEvent, pv.Behavior.tipsy(tipsySettings || options.tipsySettings));
        
        this._ensurePropEvents(pvMark);
    },
    
    _getTooltipBuilder: function(tipsySettings){
        var options = this.chart.options;
        var isV1Compat = this.compatVersion() <= 1;
        
        var tooltipFormat = options.tooltipFormat;
        if(!tooltipFormat) {
            if(!isV1Compat){
                return this._buildDataTooltip;
            }
            
            tooltipFormat = options.v1StyleTooltipFormat;
            if(!tooltipFormat){
                return;
            }
        }
        
        if(isV1Compat){
            var isSourceHtml = def.getPath(
                    this.chart._initialOptions, 
                    'tipsySettings.html', 
                    false);
            var isTargetHtml = tipsySettings.html;
            var doEscape = isTargetHtml && !isSourceHtml;
            
            return function(context){
                var tooltipText = tooltipFormat.call(
                        context.panel, 
                        context.getV1Series(),
                        context.getV1Category(),
                        context.getV1Value() || '',
                        context.getV1Datum());
                
                return doEscape ? 
                       def.html.escape(tooltipText) : 
                       tooltipText;
            };
        }
        
        return function(context){
            return tooltipFormat.call(context, context.scene);
        };
    },
    
    _createTooltipProp: function(pvMark, buildTooltip, isLazy){
        var myself = this;
        if(!isLazy){
            return function(){
                // Capture current context
                var context = myself._getContext(pvMark, null);
                return buildTooltip.call(myself, context);
            };
        }
        
        return function(){
            // Capture current context
            var context = myself._getContext(pvMark, null);
            context.pin();
            
            var tooltip;
            return function() {
                if(tooltip == null) {
                    tooltip = buildTooltip.call(myself, context);
                    context = null; // release pinned context;
                } 
                
                return tooltip; 
            };
        };
    },
    
    _requirePointEvent: function(radius){
        if(!this.isTopRoot) {
            return this.topRoot._requirePointEvent(radius);
        }

        if(!this._attachedPointEvent){

            // Fire point and unpoint events
            this.pvPanel
                .events('all')
                .event("mousemove", pv.Behavior.point(radius || 20));

            this._attachedPointEvent = true;
        }
    },
    
    _buildDataTooltip: function(context){

        var scene = context.scene;
        
        // No group and no datum?
        if(!scene.atoms) {
            return "";
        }
        
        var group = scene.group;
        var isMultiDatumGroup = group && group._datums.length > 1;
        
        // Single null datum?
        var firstDatum = scene.datum;
        if(!isMultiDatumGroup && (!firstDatum || firstDatum.isNull)) {
            return "";
        }
        
        var chart = this.chart;
        var data = chart.data;
        var visibleKeyArgs = {visible: true};
        
        var tooltip = [];
        
        if(firstDatum.isInterpolated){
            tooltip.push('<i>Interpolation</i>: ' + def.html.escape(firstDatum.interpolation) + '<br/>');
        }
        
        /* TODO: Big HACK to prevent percentages from
         * showing up in the Lines of BarLine
         */
        var playingPercentMap = context.panel.stacked === false ? 
                                null :
                                data.type.getPlayingPercentVisualRoleDimensionMap();
        
        var commonAtoms = isMultiDatumGroup ? group.atoms : scene.datum.atoms;
        
        function addDim(escapedDimLabel, label){
            tooltip.push('<b>' + escapedDimLabel + "</b>: " + (def.html.escape(label) || " - ") + '<br/>');
        }
        
        function calcPercent(atom, dimName) {
            var pct;
            if(group) {
                pct = group.dimensions(dimName).percentOverParent(visibleKeyArgs);
            } else {
                pct = data.dimensions(dimName).percent(atom.value);
            }
            
            return chart.options.percentValueFormat.call(null, pct);
        }
        
        var anyCommonAtom = false;
        
        def.each(commonAtoms, function(atom, dimName){
            var dimType = atom.dimension.type;
            if(!dimType.isHidden){
                if(!isMultiDatumGroup || atom.value != null) {
                    anyCommonAtom = true;
                    
                    var valueLabel = atom.label;
                    if(playingPercentMap && playingPercentMap.has(dimName)) {
                        valueLabel += " (" + calcPercent(atom, dimName) + ")";
                    }
                    
                    addDim(def.html.escape(atom.dimension.type.label), valueLabel);
                }
            }
        });
        
        if(isMultiDatumGroup) {
            if(anyCommonAtom){
                tooltip.push('<hr />');
            }
            
            tooltip.push("<b>#</b>: " + group._datums.length + '<br/>');
            
            group.freeDimensionNames().forEach(function(dimName){
                var dim = group.dimensions(dimName);
                if(!dim.type.isHidden){
                    var dimLabel = def.html.escape(dim.type.label),
                        valueLabel;
                    
                    if(dim.type.valueType === Number) {
                        // Sum
                        valueLabel = dim.format(dim.sum(visibleKeyArgs));
                        if(playingPercentMap && playingPercentMap.has(dimName)) {
                            valueLabel += " (" + calcPercent(null, dimName) + ")";
                        }
                        
                        dimLabel = "&sum; " + dimLabel;
                    } else {
                        valueLabel = dim.atoms(visibleKeyArgs).map(function(atom){ return atom.label || "- "; }).join(", ");
                    }
                    
                    addDim(dimLabel, valueLabel);
                }
            });
        }
        
        return '<div style="text-align: left;">' + tooltip.join('\n') + '</div>';
    },
    
    /* CLICK & DOUBLE-CLICK */
    _addPropClick: function(pvMark){
        var myself = this;
        
        function onClick(){
            var ev = arguments[arguments.length - 1];
            return myself._handleClick(this, ev);
        }
        
        pvMark.cursor("pointer")
              .event("click", onClick);
        
        this._ensurePropEvents(pvMark);
    },

    _addPropDoubleClick: function(pvMark){
        var myself = this;
        
        function onDoubleClick(){
            var ev = arguments[arguments.length - 1];
            return myself._handleDoubleClick(this, ev);
        }
        
        pvMark.cursor("pointer")
              .event("dblclick", onDoubleClick);
        
        this._ensurePropEvents(pvMark);
    },
    
    _isDoubleClickable: function(keyArgs){
        var options = keyArgs || this.chart.options;
        return options.clickable && !!this.doubleClickAction;
    },
    
    _handleDoubleClick: function(pvMark, ev){
        if(!this._isDoubleClickable()){
            return;
        }
        
        this._ignoreClicks = 2;
        
        var sign = pvMark.sign;
        if(!sign || sign.isDoubleClickable()){
            var context = this._getContext(pvMark, ev);
            this._onDoubleClick(context);
        }
    },
    
    _onDoubleClick: function(context){
        var handler = this.doubleClickAction;
        if(handler){
            if(this.compatVersion() <= 1){
                this._onV1DoubleClick(context, handler);
            } else {
                handler.call(context, context.scene);
            }
        }
    },
    
    _onV1DoubleClick: function(context, handler){
        handler.call(context.pvMark, 
                /* V1 ARGS */
                context.getV1Series(),
                context.getV1Category(),
                context.getV1Value(),
                context.event,
                context.getV1Datum());
    },
    
    _isClickable: function(keyArgs){
        var options = keyArgs || this.chart.options;
        return options.clickable && !!this.clickAction;
    },
    
    _shouldHandleClick: function(keyArgs){
        var options = keyArgs || this.chart.options;
        return options.selectable || this._isClickable(options);
    },
    
    _handleClick: function(pvMark, ev){
        if(!this._shouldHandleClick()){
            return;
        }

        var options = this.chart.options,
            context;
        
        if(!this.doubleClickAction){
            // Use shared context
            context = this._getContext(pvMark, ev);
            this._handleClickCore(context);
        } else {
            // Delay click evaluation so that
            // it may be canceled if double click meanwhile
            // fires.
            var myself = this;
            
            // Capture current context
            context = this._createContext(pvMark, ev);
            /*global window:true*/
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
            var sign = context.sign;
            if(!sign || sign.isClickable()){
                this._onClick(context);
            }
            
            if((sign  && sign.isSelectable()) || 
               (!sign && this.chart.options.selectable && context.scene.datum)){
                this._onSelect(context);
            }
        }
    },
    
    _onClick: function(context){
        var handler = this.clickAction;
        if(handler){
            if(this.compatVersion() <= 1){
                this._onV1Click(context, handler);
            } else {
                handler.call(context, context.scene);
            }
        }
    },
    
    _onV1Click: function(context, handler){
        handler.call(context.pvMark, 
                /* V1 ARGS */
                context.getV1Series(),
                context.getV1Category(),
                context.getV1Value(),
                context.event,
                context.getV1Datum());
    },
    
    /* SELECTION & RUBBER-BAND */
    _onSelect: function(context){
        var datums = context.scene.datums().array();
        if(datums.length){
            datums = this._onUserSelection(datums);
            if(datums && datums.length){
                var chart = this.chart;
                
                var changed;
                if(chart.options.ctrlSelectMode && !context.event.ctrlKey){
                    changed = chart.data.replaceSelected(datums);
                } else {
                    changed = pvc.data.Data.toggleSelected(datums);
                }
                
                if(changed){
                    this._onSelectionChanged();
                }
            }
        }
    },
    
    _onUserSelection: function(datums){
        return this.chart._onUserSelection(datums);
    },
    
    _onSelectionChanged: function(){
        this.chart.updateSelections();
    },
    
    isRubberBandSelecting: function(){
        return this.topRoot._isRubberBandSelecting;
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
            data = chart.data;

        var dMin = 2; // Minimum dx or dy for a drag to be considered a rubber band selection

        this._isRubberBandSelecting = false;

        // Rubber band
        var rubberPvParentPanel = this.pvRootPanel || this.pvPanel.paddingPanel,
            toScreen,
            rb;
        
        var selectBar = 
            this.selectBar = 
            new pvc.visual.Bar(this, rubberPvParentPanel, {
                extensionId:   'rubberBand',
                normalStroke:  true,
                noHover:       true,
                noSelect:      true,
                noClick:       true,
                noDoubleClick: true,
                noTooltips:    true
            })
            .override('defaultStrokeWidth', function(){
                return 1.5;
            })
            .override('defaultColor', function(type){
                return options[type === 'stroke' ? 'rubberBandLine' : 'rubberBandFill'];
            })
            .override('interactiveColor', function(color){
                return color;
            })
            .pvMark
            .lock('data', [new pvc.visual.Scene(null, {panel: this})])
            .lock('visible', function() { return !!rb;  })
            .lock('left',    function() { return rb.x;  })
            .lock('right')
            .lock('top',     function() { return rb.y;  })
            .lock('bottom')
            .lock('width',   function() { return rb.dx; })
            .lock('height',  function() { return rb.dy; })
            .lock('cursor')
            .lock('events', 'none')
            ;
        
        // IE must have a fill style to fire events
        if(!this._getExtensionAbs('base', 'fillStyle')){
            rubberPvParentPanel.fillStyle(pvc.invisibleFill);
        }
        
        // Require all events, wether it's painted or not
        rubberPvParentPanel.events('all');
        
        // NOTE: Rubber band coordinates are always transformed to canvas/client 
        // coordinates (see 'select' and 'selectend' events)
         
        var selectionEndedDate;
        rubberPvParentPanel
            .event('mousedown', pv.Behavior.selector(false))
            .event('select', function(){
                if(!rb){
                    if(myself.isAnimating()){
                        return;
                    }
                    
                    var rb1 = this.selectionRect;
                    if(Math.sqrt(rb1.dx * rb1.dx + rb1.dy * rb1.dy) <= dMin){
                        return;
                    }
                    
                    rb = rb1;
                    myself._isRubberBandSelecting = true;
                    
                    if(!toScreen){
                        toScreen = rubberPvParentPanel.toScreenTransform();
                    }
                    
                    myself.rubberBand = rb.clone().apply(toScreen);
                } else {
                    rb = this.selectionRect;
                }
                
                selectBar.render();
            })
            .event('selectend', function(){
                if(rb){
                    var ev = arguments[arguments.length - 1];
                    
                    if(!toScreen){
                        toScreen = rubberPvParentPanel.toScreenTransform();
                    }
                    
                    myself.rubberBand = rb = this.selectionRect.clone().apply(toScreen);
                    
                    rb = null;
                    myself._isRubberBandSelecting = false;
                    selectBar.render(); // hide rubber band
                    
                    // Process selection
                    myself._dispatchRubberBandSelectionTop(ev);
                    
                    selectionEndedDate = new Date();
                    
                    myself.rubberBand = rb = null;
                }
            });
        
        if(options.clearSelectionMode === 'emptySpaceClick'){
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
                    
                    if(data.owner.clearSelected()) {
                        myself._onSelectionChanged();
                    }
                });
        }
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
                chart.data.owner.clearSelected();
            }
            
            chart.useTextMeasureCache(this._dispatchRubberBandSelection, this);
            
        } finally {
            chart._resumeSelectionUpdate();
        }
    },
    
    // Callback to handle end of rubber band selection
    _dispatchRubberBandSelection: function(ev){
        // Ask the panel for selectable marks
        var datumsByKey = {},
            keyArgs = {toggle: false};
        if(this._detectDatumsUnderRubberBand(datumsByKey, this.rubberBand, keyArgs)) {
            var selectedDatums = def.own(datumsByKey); 
            
            selectedDatums = this._onUserSelection(selectedDatums);
            
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
     * marks returned by #_getSelectableMarks.
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
        var any = false;
        if(this.isVisible){
            var pvMarks = this._getSelectableMarks();
            if(pvMarks && pvMarks.length){
                pvMarks.forEach(function(pvMark){
                    this._forEachMarkDatumUnderRubberBand(pvMark, function(datum){
                        datumsByKey[datum.key] = datum;
                        any = true;
                    }, this, rb);
                }, this);
            }
        }
        
        return any;
    },
    
    _forEachMarkDatumUnderRubberBand: function(pvMark, fun, ctx, rb){
        if(!rb) {
            rb = this.rubberBand;
        }
        
        function processShape(shape, instance) {
            // pvc.log(datum.key + ": " + JSON.stringify(shape) + " intersects? " + shape.intersectsRect(this.rubberBand));
            if (shape.intersectsRect(rb)){
                var group = instance.group;
                var datums = group ? group._datums : def.array.as(instance.datum);
                if(datums) {
                    datums.forEach(function(datum){
                        if(!datum.isNull) {
                            if(pvc.debug >= 10) {
                                pvc.log(datum.key + ": " + JSON.stringify(shape) + " mark type: " + pvMark.type);
                            }
                    
                            fun.call(ctx, datum);
                        }
                    });
                }
            }
        }
        
        // center, partial and total (not implemented)
        var selectionMode = def.get(pvMark, 'rubberBandSelectionMode', 'partial');
        var shapeMethod = (selectionMode === 'center') ? 'getInstanceCenterPoint' : 'getInstanceShape';
        
        if(pvMark.type === 'area' || pvMark.type === 'line'){
            var instancePrev;
            
            pvMark.eachInstanceWithData(function(instance, toScreen){
                if(!instance.visible || instance.isBreak || (instance.datum && instance.datum.isNull)) {
                    // Break the line
                    instancePrev = null;
                } else {
                    if(instancePrev){
                        var shape = pvMark[shapeMethod](instancePrev, instance).apply(toScreen);
                        processShape(shape, instancePrev);
                    }
    
                    instancePrev = instance;
                }
            }, this);
        } else {
            pvMark.eachInstanceWithData(function(instance, toScreen){
                if(!instance.isBreak && instance.visible) {
                    var shape = pvMark[shapeMethod](instance).apply(toScreen);
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
    
    leftBottomAnchor: {
        top:    "bottom",
        bottom: "bottom",
        left:   "left",
        right:  "left"
    },
    
    leftTopAnchor: {
        top:    "top",
        bottom: "top",
        left:   "left",
        right:  "left"
    },
    
    horizontalAlign: {
        top:    "right",
        bottom: "left",
        middle: "center",
        right:  "right",
        left:   "left",
        center: "center"
    },
    
    verticalAlign: {
        top:    "top",
        bottom: "bottom",
        middle: "middle",
        right:  "bottom",
        left:   "top",
        center: "middle"
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
    },

    oppositeLength: {
        width:  "height",
        height: "width"
    }
});
