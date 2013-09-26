/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_Sides:true, pvc_Size:true, pvc_PercentValue:true, pvc_Offset:true */

/**
 * Base panel. 
 * A lot of them will exist here, with some common properties. 
 * Each class that extends pvc.base will be 
 * responsible to know how to use it.
 */
def
.type('pvc.BasePanel', pvc.Abstract)
.add(pvc.visual.Interactive)
.init(function(chart, parent, options) {
    
    this.chart = chart; // must be set before base() because of log init
    

    this.base();
    
    this.axes = {};
    
    if(options){
        if(options.scenes){
            this._sceneTypeExtensions = options.scenes;
            delete options.scenes;
        }
        
        var axes = options.axes;
        if(axes){
            def.copy(this.axes, axes);
            delete options.axes;
        }
    }
    
    // TODO: Danger...
    $.extend(this, options); // clickAction and doubleClickAction are set here

    if(!this.axes.color){
        this.axes.color = chart.axes.color;
    }
    
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
        // TODO: FIXME: Give a default margin on the root panel
        //  because otherwise borders of panels may be clipped..
        // Even now that the box model supports borders,
        // the "plot" panel still gets drawn outside
        // cause it is drawn over? See the box plot...
        // The rubber band also should take its border into account
        //  to not be drawn off...
        margins = 3;
    }
    
    this.margins  = new pvc_Sides(margins);
    this.paddings = new pvc_Sides(options && options.paddings);
    this.size     = new pvc_Size (options && options.size    );
    this.sizeMax  = new pvc_Size (options && options.sizeMax );
    
    if(!parent) {
        this.parent    = null;
        this.root      = this;
        this.topRoot   = this;
        this.isRoot    = true;
        this.isTopRoot = true;
        this._ibits    = chart._ibits;
    } else {
        this.parent    = parent;
        this.isTopRoot = false;
        this.isRoot    = (parent.chart !== chart);
        this.root      = this.isRoot ? this : parent.root;
        this.topRoot   = parent.topRoot;
        this._ibits    = parent._ibits;
        
        if(this.isRoot) {
            this.position.left = chart.left; 
            this.position.top  = chart.top;
        }
        
        parent._addChild(this);
    }
    
    this.data = (this.isRoot ? chart : parent).data;

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
                    alignTo = pvc_PercentValue.parse(alignTo); // percent or number
                } else {
                    alignTo = pvc.parseAlign(side, alignTo);
                }
            }
        } else {
            alignTo = this.align;
        }
        
        this.alignTo = alignTo;
        
        this.offset = new pvc_Offset(this.offset);
    }
    
    if(this.borderWidth == null){
        var borderWidth;
        var extensionId = this._getExtensionId();
        if(extensionId){
            var strokeStyle = this._getExtension(extensionId, 'strokeStyle');
            if(strokeStyle != null){
                borderWidth = +this._getConstantExtension(extensionId, 'lineWidth'); 
                if(isNaN(borderWidth) || !isFinite(borderWidth)){
                    borderWidth = null;
                }
            }
        }
        
        this.borderWidth = borderWidth == null ? 0 : 1.5;
    }
    
    // Parent panel may not have a clickAction, 
    // and so, inheriting its clickable and doubleClickable doesn't work.
    var I = pvc.visual.Interactive;
    var ibits = this._ibits;
    ibits = def.bit.set(ibits, I.Clickable,       (chart._ibits & I.Clickable      ) && !!this.clickAction      );
    ibits = def.bit.set(ibits, I.DoubleClickable, (chart._ibits & I.DoubleClickable) && !!this.doubleClickAction);
    this._ibits = ibits;
})
.add({
    chart: null,
    parent: null,
    _children: null,
    type: pv.Panel, // default one
    
    _extensionPrefix: '',
    
    _rubberSelectableMarks: null,

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
    
    /**
     * The static effective border width of the panel.
     * 
     * If a constant extension point exists,
     * its value is used to initialize this property.
     * 
     * If an extension point exists for the <tt>strokeStyle</tt> property,
     * and its value is not null, 
     * the width, taken from the extension point, or defaulted, is considered.
     * Otherwise, the effective width is 0.
     * 
     * The default active value is <tt>1.5</tt>.
     * 
     * @type number
     */
    borderWidth: null,
    
    anchor: "top",
    
    pvPanel: null, // padding/client pv panel (within border box, separated by paddings)
    
    margins:   null,
    paddings:  null,
    
    isRoot:    false,
    isTopRoot: false,
    root:      null, 
    topRoot:   null,
    
    _layoutInfo: null, // once per layout info
    
    _signs: null,
    
    /**
     * The data that the panel uses to obtain "data".
     * @type pvc.data.Data
     */
    data: null,

    dataPartValue: null,
    
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
     * @see #animatingStart
     * 
     * @type number
     */
    _animating: 0,
    
    _selectingByRubberband: false,
    
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
    
    compatVersion: function(options){
        return this.chart.compatVersion(options);
    },
    
    _createLogInstanceId: function(){
        return "" + 
               this.constructor + this.chart._createLogChildSuffix();
    },
    
    defaultVisibleBulletGroupScene: function() {
        // Return legendBulletGroupScene, 
        // from the first data cell of same dataPartValue and 
        // having one legendBulletGroupScene.
        var colorAxis = this.axes.color;
        if(colorAxis && colorAxis.option('LegendVisible')) {
            var dataPartValue = this.dataPartValue;
            return def
                .query (colorAxis.dataCells)
                .where (function(dataCell) { return dataCell.dataPartValue === dataPartValue; })
                .select(function(dataCell) { return dataCell.legendBulletGroupScene; })
                .first (def.truthy);
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
        def.array.lazy(this, '_signs').push(sign);
        if(sign.selectableByRubberband()){
            def.array.lazy(this, '_rubberSelectableMarks').push(sign.pvMark);
        }
    },

    visibleData: function(ka) { return this.chart.visibleData(this.dataPartValue, ka); },

    partData: function() { return this.chart.partData(this.dataPartValue); },
    
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
     * @param {object}  [ka] Keyword arguments.
     * @param {boolean} [ka.force=false] Indicates that the layout should be
     * performed even if it has already been done.
     * @param {pvc.Size} [ka.referenceSize] The size that should be used for 
     * percentage size calculation. 
     * This will typically be the <i>client</i> size of the parent.
     * @param {pvc.Sides} [ka.paddings] The paddings that should be used for 
     * the layout. Default to the panel's paddings {@link #paddings}.
     * @param {pvc.Sides} [ka.margins] The margins that should be used for 
     * the layout. Default to the panel's margins {@link #margins}.
     * @param {boolean} [ka.canChange=true] Whether this is a last time layout. 
     */
    layout: function(availableSize, ka){
        if(!this._layoutInfo || def.get(ka, 'force', false)) {
            
            var referenceSize = def.get(ka, 'referenceSize');
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
            
            var halfBorder   = this.borderWidth / 2;
            var realMargins  = (def.get(ka, 'margins' ) || this.margins ).resolve(referenceSize);
            var realPaddings = (def.get(ka, 'paddings') || this.paddings).resolve(referenceSize);
            
            var margins  = pvc_Sides.inflate(realMargins,  halfBorder);
            var paddings = pvc_Sides.inflate(realPaddings, halfBorder);
            
            var spaceWidth  = margins.width  + paddings.width;
            var spaceHeight = margins.height + paddings.height;
            
            var availableClientSize = new pvc_Size(
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
            var canChange = def.get(ka, 'canChange', true);
            
            var layoutInfo = 
                this._layoutInfo = {
                    canChange:         canChange,
                    referenceSize:     referenceSize,
                    
                    realMargins:       realMargins,
                    realPaddings:      realPaddings,
                    
                    borderWidth:       this.borderWidth,
                    
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
            
            if(!canChange && prevLayoutInfo) {
                delete layoutInfo.previous;
            }
            
            if(pvc.debug >= 5) {
                this._log("Size       = " + pvc.stringify(size));
                this._log("Margins    = " + pvc.stringify(layoutInfo.margins));
                this._log("Paddings   = " + pvc.stringify(layoutInfo.paddings));
                this._log("ClientSize = " + pvc.stringify(layoutInfo.clientSize));
            }
            
            this._onLaidOut();
        }
    },
    
    _onLaidOut: function() {
        if(this.isRoot) {
            this.chart._onLaidOut();
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
        var clientSize;
        var me = this;

        // These are used in layoutCycle
        var margins, remSize, useLog;

        if(me._children) {
            var aolMap = pvc.BasePanel.orthogonalLength;
            var aoMap  = pvc.BasePanel.relativeAnchor;
            var altMap = pvc.BasePanel.leftTopAnchor;
            var aofMap = pvc_Offset.namesSidesToOffset;

            // Classify children

            var fillChildren = [];
            var sideChildren = [];

            me._children.forEach(function(child) {
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

            useLog = pvc.debug >= 5;
            
            // When expanded (see checkChildLayout)
            // a re-layout is performed.
            clientSize = def.copyOwn(layoutInfo.clientSize);
            var childKeyArgs = {
                    force: true,
                    referenceSize: clientSize
                };

            if(useLog){ me._group("CCC DOCK LAYOUT clientSize = " + pvc.stringify(clientSize)); }
            try{
                doMaxTimes(5, layoutCycle, me);
            } finally {
                if(useLog){ me._groupEnd(); }
            }
        }

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
            if(useLog){ me._group("LayoutCycle #" + (iteration + 1) + " (remaining: " + remTimes + ")"); }
            try{
               var canResize = (remTimes > 0);

                // Reset margins and remSize
                // ** Instances we can mutate
                margins = new pvc_Sides(0);
                remSize = def.copyOwn(clientSize);

                // Lay out SIDE child panels
                var child;
                var index = 0;
                var count = sideChildren.length;
                while(index < count){
                    child = sideChildren[index];
                    if(useLog){ me._group("SIDE Child #" + (index + 1) + " at " + child.anchor); }
                    try{
                        if(layoutChild.call(this, child, canResize)){
                            return true; // resized => break
                        }
                    } finally {
                        if(useLog){ me._groupEnd(); }
                    }
                    index++;
                }

                // Lay out FILL child panels
                index = 0;
                count = fillChildren.length;
                while(index < count){
                    child = fillChildren[index];
                    if(useLog){ me._group("FILL Child #" + (index + 1)); }
                    try{
                        if(layoutChild.call(this, child, canResize)){
                            return true; // resized => break
                        }
                    } finally {
                        if(useLog){ me._groupEnd(); }
                    }
                    index++;
                }

                return false; // !resized
            } finally {
                if(useLog){ me._groupEnd(); }
            }
        }
        
        function layoutChild(child, canResize) {
            var resized = false;
            var paddings;
            
            childKeyArgs.canChange = canResize;
            
            doMaxTimes(3, function(remTimes, iteration){
                if(useLog){ me._group("Attempt #" + (iteration + 1)); }
                try{

                    childKeyArgs.paddings  = paddings;
                    childKeyArgs.canChange = remTimes > 0;

                    child.layout(new pvc_Size(remSize), childKeyArgs);
                    if(child.isVisible){
                        resized = checkChildResize.call(this, child, canResize);
                        if(resized){
                            return false; // stop
                        }

                        var requestPaddings = child._layoutInfo.requestPaddings;
                        if(checkPaddingsChanged(paddings, requestPaddings)){
                            paddings = requestPaddings;

                            // Child wants to repeat its layout with != paddings
                            if(remTimes > 0){
                                paddings = new pvc_Sides(paddings);
                                if(useLog){ this._log("Child requested paddings change: " + pvc.stringify(paddings)); }
                                return true; // again
                            }

                            if(pvc.debug >= 2){
                                this._warn("Child requests paddings change but iterations limit has been reached.");
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
                } finally {
                    if(useLog){ me._groupEnd(); }
                }
            }, this);
            
            return resized;
        }

        function checkPaddingsChanged(paddings, newPaddings){
            if(!newPaddings){
                return false;
            }
            
            // true if stopped, false otherwise
            return def.query(pvc_Sides.names).each(function(side){
                var curPad = (paddings && paddings[side]) || 0;
                var newPad = (newPaddings && newPaddings[side]) || 0;
                 if(Math.abs(newPad - curPad) >= 0.1){
                     // Stop iteration
                     return false;
                 }
            });
        }

        function checkChildResize(child, canResize){
            var resized = false;
            var addWidth = child.width - remSize.width;
            if(addWidth > 0){
                if(pvc.debug >= 3){
                    this._log("Child added width = " + addWidth);
                }
                
                if(!canResize){
                    if(pvc.debug >= 2){
                        this._warn("Child wanted more width, but layout iterations limit has been reached.");
                    }
                } else {
                    resized = true;
                    
                    remSize   .width += addWidth;
                    clientSize.width += addWidth;
                }
            }
            
            var addHeight = child.height - remSize.height;
            if(addHeight > 0){
                if(pvc.debug >= 3){
                    this._log("Child added height =" + addHeight);
                }
                
                if(!canResize){
                    if(pvc.debug >= 2){
                        this._warn("Child wanted more height, but layout iterations limit has been reached.");
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
            
            if(child.keepInBounds){
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
    
    invalidateLayout: function() {
        this._layoutInfo = null;
        
        if(this._children) {
            this._children.forEach(function(child) {
                child.invalidateLayout();
            });
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
            if(this.pvRootPanel) { this.pvRootPanel = null; }

            delete this._signs;
            
            /* Layout */
            this.layout();

            if(this.isTopRoot && this.chart._isMultiChartOverflowClip) {
                // Must repeat chart._create
                return;
            }

            if(!this.isVisible) { return; }
            
            if(this.isRoot) { this._creating(); }
            
            var margins  = this._layoutInfo.margins;
            var paddings = this._layoutInfo.paddings;
            
            /* Protovis Panel */
            if(this.isTopRoot) {
                this.pvRootPanel = 
                this.pvPanel = new pv.Panel().canvas(this.chart.options.canvas);
                
                // Ensure there's always a scene, right from the root mark
                var scene = new pvc.visual.Scene(null, {panel: this});
                this.pvRootPanel.lock('data', [scene]);
                
                if(margins.width > 0 || margins.height > 0) {
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

            if(pvc.debug >= 15 && (margins.width > 0 || margins.height > 0)) {
                // Outer Box
                (this.isTopRoot ? this.pvRootPanel : this.parent.pvPanel)
                    .add(this.type)
                    .width (this.width)
                    .height(this.height)
                    .left  (this.position.left   != null ? this.position.left   : null)
                    .right (this.position.right  != null ? this.position.right  : null)
                    .top   (this.position.top    != null ? this.position.top    : null)
                    .bottom(this.position.bottom != null ? this.position.bottom : null)
                    .strokeStyle('orange')
                    .lineWidth(1)
                    .strokeDasharray('- .')
                    ;
            }

            // Set panel positions
            var hasPositions = {};
            def.eachOwn(this.position, function(v, side){
                pvBorderPanel[side](v + margins[side]);
                hasPositions[this.anchorLength(side)] = true;
            }, this);
            
            if(!hasPositions.width){
                if(margins.left > 0){
                    pvBorderPanel.left(margins.left);
                }
                if(margins.right > 0){
                    pvBorderPanel.right(margins.right);
                }
            }
            
            if(!hasPositions.height){
                if(margins.top > 0){
                    pvBorderPanel.top(margins.top);
                }
                if(margins.bottom > 0){
                    pvBorderPanel.bottom(margins.bottom);
                }
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
            
            if(pvc.debug >= 15) {
                // Client Box
                this.pvPanel
                    .strokeStyle('lightgreen')
                    .lineWidth(1)
                    .strokeDasharray('- ');

                if(this.pvPanel !== pvBorderPanel){
                    // Border Box
                    pvBorderPanel
                        .strokeStyle('blue')
                        .lineWidth(1)
                        .strokeDasharray('. ');
                }
            }
            
            var extensionId = this._getExtensionId();
//            if(extensionId != null){ // '' is allowed cause this is relative to #_getExtensionPrefix
            // Wrap the panel that is extended with a Panel sign
            new pvc.visual.Panel(this, null, {
                panel:       pvBorderPanel,
                extensionId: extensionId
            });
//            }
            
            /* Protovis marks that are pvc Panel specific,
             * and/or create child panels.
             */
            this._createCore(this._layoutInfo);
            
            if(this.isTopRoot) { 
                /* Multi-chart overflow & clip */
                if(this.chart._multiChartOverflowClipped) {
                    this._addMultichartOverflowClipMarker();
                }

                /* Selection */
                this._initSelection(); 
            }

            /* Extensions */
            this.applyExtensions();
            
            /* Log Axes Scales */
            if(this.isRoot && pvc.debug > 5) {
                var out = ["SCALES SUMMARY", pvc.logSeparator];
                
                this.chart.axesList.forEach(function(axis) {
                    var scale = axis.scale;
                    if(scale) {
                        var d = scale.domain && scale.domain();
                        var r = scale.range  && scale.range ();
                        out.push(axis.id);
                        out.push("    domain: " + (!d ? '?' : pvc.stringify(d)));
                        out.push("    range : " + (!r ? '?' : pvc.stringify(r)));
                        
                    }
                }, this);
                
                this._log(out.join("\n"));
            }
        }
    },

    _creating: function() {
        if(this._children) {
            this._children.forEach(function(child) { child._creating(); });
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
    _createCore: function(/*layoutInfo*/){
        if(this._children) {
            this._children.forEach(function(child) { child._create(); });
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
     * @param {object} [ka] Keyword arguments.
     * @param {boolean} [ka.bypassAnimation=false] Indicates that animation should not be performed.
     * @param {boolean} [ka.recreate=false] Indicates that the panel and its descendants should be recreated.
     */
    render: function(ka) {
        
        if(!this.isTopRoot) { return this.topRoot.render(ka); }
        
        this._create(def.get(ka, 'recreate', false));
        
        if(this.isTopRoot && this.chart._isMultiChartOverflowClip) {
            // Must repeat chart._create
            return;
        }

        if(!this.isVisible) { return; }
        
        this._onRender();
        
        var options = this.chart.options;
        var pvPanel = this.pvRootPanel;

        // May be animating already...
        // If that is the case,
        //  the following pvPanel.render() call will cause
        //  the ongoing animation to be stopped, 
        //  and consequently, the previous passed callback handler to be called,
        //  before leaving the pvPanel.render() call.
        // See the callback below.
        var prevAnimating = this._animating;
        var animate = this.chart.animatable();
        this._animating = animate && !def.get(ka, 'bypassAnimation', false) ? 1 : 0;
        try {
            // When animating, renders the animation's 'start' point
            pvPanel.render();

            // Transition to the animation's 'end' point
            if(this._animating) {
                this._animating = 2;
                
                var me = this;
                pvPanel
                    .transition()
                    .duration(2000)
                    .ease("cubic-in-out")
                    .start(function() {
                        if(prevAnimating) {
                            prevAnimating = 0;
                        } else {
                            me._animating = 0;
                            me._onRenderEnd(true);
                        }
                    });
            } else {
                this._onRenderEnd(false);
            }
        } finally {
            this._animating = 0;
        }
    },
    
    _onRender: function(){
        var renderCallback = this.chart.options.renderCallback;
        if (renderCallback) {
            if(this.compatVersion() <= 1){
                renderCallback.call(this.chart);
            } else {
                var context = this.context();
                renderCallback.call(context, context.scene);
            }
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
                return;
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
        return this._rubberSelectableMarks;
    },
    
    
    /* ANIMATION */
    
    animate: function(start, end) {
        return (this.topRoot._animating === 1) ? start : end;
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
    animatingStart: function() {
        return (this.topRoot._animating === 1);
    },
    
    /**
     * Indicates if the panel is currently 
     * rendering animation.
     * 
     * @type boolean
     */
    animating: function() { return (this.topRoot._animating > 0); },
    
    /* SIZE & POSITION */
    setPosition: function(position){
        for(var side in position){
            if(def.hasOwn(pvc_Sides.namesSet, side)){
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
            return new pvc_Size(size.width, Math.min(size.height, anchorLength));
        } 
        return new pvc_Size(Math.min(size.width, anchorLength), size.height);
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
    extend: function(mark, id, ka) {
        this.chart.extend(mark, this._makeExtensionAbsId(id), ka);
    },
    
    /**
     * Extends a protovis mark with extension points 
     * having a given absolute component id.
     */
    extendAbs: function(mark, absId, ka) {
        this.chart.extend(mark, absId, ka);
    },
    
    _extendSceneType: function(typeKey, type, names){
        var typeExts = def.get(this._sceneTypeExtensions, typeKey);
        if(typeExts) {
            pvc.extendType(type, typeExts, names);
        }
    },
    
    _absBaseExtId: {abs: 'base'},
    _absSmallBaseExtId: {abs: 'smallBase'},
    
    _getExtensionId: function(){
        if (this.isRoot) {
            return !this.chart.parent ? this._absBaseExtId : this._absSmallBaseExtId;
        }
    },
    
    _getExtensionPrefix: function() { return this._extensionPrefix; },
    
    _makeExtensionAbsId: function(id) {
        return pvc.makeExtensionAbsId(id, this._getExtensionPrefix());
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
        if(!layer) { return mainPvPanel; }

        if(!this.parent){
            throw def.error.operationInvalid("Layers are not possible in a root panel.");
        }

        if(!mainPvPanel){
            throw def.error.operationInvalid(
               "Cannot access layer panels without having created the main panel.");
        }

        var pvPanel = null;
        if(!this._layers) {
            this._layers = {};
        } else {
            pvPanel = this._layers[layer];
        }

        if(!pvPanel) {
            var pvParentPanel = this.parent.pvPanel;
            
            pvPanel = pvParentPanel.borderPanel.add(this.type)
                .extend(mainPvPanel.borderPanel);
            
            var pvBorderPanel = pvPanel;

            if(mainPvPanel !== mainPvPanel.borderPanel) {
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
    initLayerPanel: function(/*pvPanel, layer*/) {},
    
    /* EVENTS & VISUALIZATION CONTEXT */
    _getV1DimName: function(v1Dim){
        var dimNames = this._v1DimName || (this._v1DimNameCache = {});
        var dimName  = dimNames[v1Dim];
        if(dimName == null) {
            var role = this.chart.visualRoles[this._v1DimRoleName[v1Dim]];
            dimName = role ? role.firstDimensionName() : '';
            dimNames[v1Dim] = dimName;
        }
        
        return dimName;
    },
    
    _getV1Datum: function(scene){ return scene.datum; },
    
    /**
     * Obtains the visualization context of the panel.
     *  
     * Creates a new context when necessary.
     * 
     * <p>
     * Override to perform specific updates. 
     * </p>
     * 
     * @type pvc.visual.Context
     * @virtual
     */
    context: function() {
        var context = this._context;
        if(!context || context.isPinned) {
            context = this._context = new pvc.visual.Context(this);
        } else {
            /*global visualContext_update:true */
            visualContext_update.call(context);
        }
        
        return context;
    },
    
    /* TOOLTIP */ 
    _isTooltipEnabled: function(){
        return !this.selectingByRubberband() && !this.animating();
    },
    
    // Axis panel overrides this
    _getTooltipFormatter: function(tipOptions) {
        var isV1Compat = this.compatVersion() <= 1;
        
        var tooltipFormat = tipOptions.format;
        if(!tooltipFormat) {
            if(!isV1Compat){ return this._summaryTooltipFormatter; }
            
            tooltipFormat = this.chart.options.v1StyleTooltipFormat;
            if(!tooltipFormat) { return; }
        }
        
        if(isV1Compat) {
            return function(context) {
                return tooltipFormat.call(
                        context.panel, 
                        context.getV1Series(),
                        context.getV1Category(),
                        context.getV1Value() || '',
                        context.getV1Datum());
            };
        }
        
        return function(context) { return tooltipFormat.call(context, context.scene); };
    },
  
    _summaryTooltipFormatter: function(context) {
        var scene = context.scene;
        
        // No group and no datum?
        if(!scene.datum) { return ""; }
        
        var group = scene.group;
        var isMultiDatumGroup = group && group.count() > 1;
        
        // Single null datum?
        var firstDatum = scene.datum;
        if(!isMultiDatumGroup && (!firstDatum || firstDatum.isNull)) { return ""; }
        
        var data = scene.data();
        var visibleKeyArgs = {visible: true};
        var tooltip = [];
        
        if(firstDatum.isInterpolated){
            tooltip.push('<i>Interpolation</i>: ' + def.html.escape(firstDatum.interpolation) + '<br/>');
        } else if(firstDatum.isTrend){
            tooltip.push('<i>Trend</i>: ' + def.html.escape(firstDatum.trendType) + '<br/>');
        }
        
        var complexType = data.type;
        
        /* TODO: Big HACK to prevent percentages from
         * showing up in the Lines of BarLine
         */
        var playingPercentMap = context.panel.stacked === false ? 
                                null :
                                complexType.getPlayingPercentVisualRoleDimensionMap();

        var percentValueFormat = playingPercentMap ?
                                 context.chart.options.percentValueFormat:
                                 null;

        var commonAtoms = isMultiDatumGroup ? group.atoms : scene.datum.atoms;
        var commonAtomsKeys = complexType.sortDimensionNames(def.keys(commonAtoms));
        
        function addDim(escapedDimLabel, label){
            tooltip.push('<b>' + escapedDimLabel + "</b>: " + (def.html.escape(label) || " - ") + '<br/>');
        }
        
        function calcPercent(atom, dimName) {
            var pct;
            if(group) {
                pct = group.dimensions(dimName).percentOverParent(visibleKeyArgs);
            } else {
                pct = data.dimensions(dimName).percent(atom.value, visibleKeyArgs);
            }
            
            return percentValueFormat(pct);
        }
        
        var anyCommonAtom = false;
        commonAtomsKeys.forEach(function(dimName){
            var atom = commonAtoms[dimName];
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
            if(anyCommonAtom){ tooltip.push('<hr />'); }
            
            tooltip.push("<b>#</b>: " + group._datums.length + '<br/>');
            
            complexType
            .sortDimensionNames(group.freeDimensionNames())
            .forEach(function(dimName){
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
                        valueLabel = dim
                            .atoms(visibleKeyArgs)
                            .map(function(atom){ return atom.label || "- "; }).join(", ");
                    }
                    
                    addDim(dimLabel, valueLabel);
                }
            });
        }
        
        return '<div style="text-align: left;">' + tooltip.join('\n') + '</div>';
    },
    
//  _requirePointEvent: function(radius) {
//      if(!this.isTopRoot) { return this.topRoot._requirePointEvent(radius); }
//
//      if(!this._attachedPointEvent) {
//          // Fire point and unpoint events
//          this.pvPanel
//              .events('all')
//              .event('mousemove', pv.Behavior.point(radius || 20));
//
//          this._attachedPointEvent = true;
//      }
//  },
  
    /* CLICK & DOUBLE-CLICK */
    // Default implementation dispatches to panel's clickAction
    // Overriden by Legend Panel
    _onClick: function(context) {
        var handler = this.clickAction;
        if(handler) {
            if(this.compatVersion() <= 1) {
                this._onV1Click(context, handler);
            } else {
                handler.call(context, context.scene);
            }
        }
    },
    
    // Default implementation dispatches to panel's doubleClickAction
    _onDoubleClick: function(context) {
        var handler = this.doubleClickAction;
        if(handler) {
            if(this.compatVersion() <= 1) {
                this._onV1DoubleClick(context, handler);
            } else {
                handler.call(context, context.scene);
            }
        }
    },
    
    // Overriden by Axis Panel
    _onV1Click: function(context, handler) {
        handler.call(context.pvMark, 
                /* V1 ARGS */
                context.getV1Series(),
                context.getV1Category(),
                context.getV1Value(),
                context.event,
                context.getV1Datum());
    },
    
    // Overriden by Axis Panel
    _onV1DoubleClick: function(context, handler) {
        handler.call(context.pvMark, 
                /* V1 ARGS */
                context.getV1Series(),
                context.getV1Category(),
                context.getV1Value(),
                context.event,
                context.getV1Datum());
    },

    /* OVERFLOW */
    _addMultichartOverflowClipMarker: function() {
        var m = 10;
        var dr = 5;
        function getRadius(mark) {
            var r = mark.shapeRadius();
            if(r == null) { 
                var  s = mark.shapeSize();
                if(s != null) { r = Math.sqrt(s); }
            }

            return r || dr;
        }

        var pvDot = new pvc.visual.Dot(
            this,
            this.pvPanel,
            {
                noSelect:      true,
                noHover:       true,
                noClick:       true,
                noDoubleClick: true,
                noTooltip:     false,
                freePosition:  true,
                extensionId:   'multiChartOverflowMarker'
            })
            .lock('data')
            .pvMark
            .shape("triangle")
            .shapeRadius(dr)
            .top (null)
            .left(null)
            .bottom(function() { return getRadius(this) + m; })
            .right (function() { return getRadius(this) + m; })
            .shapeAngle(0)
            .lineWidth(1.5)
            .strokeStyle("red")
            .fillStyle("rgba(255, 0, 0, 0.2)");

        // When non-interactive tooltip prop is not created...
        if(def.fun.is(pvDot.tooltip)) {
            pvDot.tooltip("Some charts did not fit the available space.");
        }
    },
    
    /* SELECTION & RUBBER-BAND */
    selectingByRubberband: function() { return this.topRoot._selectingByRubberband; },
    
    /**
     * Add rubber-band and clickClearSelection functionality to the panel.
     * Override to prevent rubber band selection.
     * 
     * @virtual
     */
    _initSelection: function() {
        var me = this,
            chart = me.chart;
        
        if(!me.interactive()) { return; }
        
        var clickClearsSelection = me.unselectable(),
            useRubberband        = me.selectableByRubberband();
        
        // NOOP?
        if(!useRubberband && !clickClearsSelection) { return; }
        
        var data = me.data,
            pvParentPanel = me.pvRootPanel || me.pvPanel.paddingPanel;
        
        // IE must have a fill style to fire events
        if(!me._getExtensionAbs('base', 'fillStyle')) {
            pvParentPanel.fillStyle(pvc.invisibleFill);
        }
        
        // Require all events, wether it's painted or not
        pvParentPanel.lock('events', 'all');
        
        if(!useRubberband) {
            if(clickClearsSelection) {
                // Install clearSelectionMode click
                pvParentPanel
                    .event("click", function() {
                        /*jshint expr:true */
                        data.clearSelected() && chart.updateSelections();
                    });
            }
            return;
        }
        
        var dMin2 = 4; // Minimum dx or dy, squared, for a drag to be considered a rubber band selection

        me._selectingByRubberband = false;

        // Rubber band
        var toScreen, rb;
        
        var selectBar = 
            this.selectBar = 
            new pvc.visual.Bar(me, pvParentPanel, {
                extensionId:   'rubberBand',
                normalStroke:  true,
                noHover:       true,
                noSelect:      true,
                noClick:       true,
                noDoubleClick: true,
                noTooltip:     true
            })
            .override('defaultStrokeWidth', def.fun.constant(1.5))
            .override('defaultColor', function(type) {
                return type === 'stroke' ? 
                       '#86fe00' :                 /* 'rgb(255,127,0)' */ 
                       'rgba(203, 239, 163, 0.6)'  /* 'rgba(255, 127, 0, 0.15)' */
                       ;
            })
            .override('interactiveColor', function(color) { return color; })
            .pvMark
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
        
        // NOTE: Rubber band coordinates are always transformed to canvas/client 
        // coordinates (see 'select' and 'selectend' events)
        var selectionEndedDate; 
        pvParentPanel
            .intercept('data', function() {
                var scenes = this.delegate();
                if(scenes) {
                    scenes.forEach(function(scene) {
                        // Initialize x,y,dx and dy properties
                        if(scene.x == null) { scene.x = scene.y = scene.dx = scene.dy = 0; }
                    });
                }
                return scenes;
            })
            .event('mousedown', pv.Behavior.select().autoRender(false))
            .event('select', function(scene) {
                if(!rb) {
                    if(me.animating()) { return; }
                    if(scene.dx * scene.dx + scene.dy * scene.dy <= dMin2) { return; }
                    
                    rb = new pv.Shape.Rect(scene.x, scene.y, scene.dx, scene.dy);
                    
                    me._selectingByRubberband = true;
                    
                    if(!toScreen) { toScreen = pvParentPanel.toScreenTransform(); }
                    
                    me.rubberBand = rb.apply(toScreen);
                } else {
                    rb = new pv.Shape.Rect(scene.x, scene.y, scene.dx, scene.dy);
                    // not updating rubberBand ?
                }
                
                selectBar.render();
            })
            .event('selectend', function() {
                if(rb) {
                    var ev = arguments[arguments.length - 1];
                    
                    if(!toScreen) { toScreen = pvParentPanel.toScreenTransform(); }
                    
                    var rbs = rb.apply(toScreen);
                    
                    rb = null;
                    me._selectingByRubberband = false;
                    selectBar.render(); // hide rubber band
                    
                    // Process selection
                    try     { me._processRubberBand(rbs, ev);  }
                    finally { selectionEndedDate = new Date(); }
                }
            });
        
        if(clickClearsSelection) {
            pvParentPanel
                .event("click", function() {
                    // It happens sometimes that the click is fired 
                    // after mouse up, ending up clearing a just made selection.
                    if(selectionEndedDate) {
                        var timeSpan = new Date() - selectionEndedDate;
                        if(timeSpan < 300) {
                            selectionEndedDate = null;
                            return;
                        }
                    }
                    
                    if(data.clearSelected()) { chart.updateSelections(); }
                });
        }
    },
    
    _processRubberBand: function(rb, ev, ka) {
        this.rubberBand = rb;
        try     { this._onRubberBandSelectionEnd(ev, ka); } 
        finally { this.rubberBand  = null; }
    },
    
    _onRubberBandSelectionEnd: function(ev, ka) {
        if(pvc.debug >= 20) { this._log("rubberBand " + pvc.stringify(this.rubberBand)); }
        
        ka = Object.create(ka || {});
        ka.toggle = false; // output argument
        
        var datums = this._getDatumsOnRubberBand(ev, ka);
        if(datums) {
            var chart = this.chart;
            
            // Make sure selection changed action is called only once
            // Checks if any datum's selected changed, at the end
            chart._updatingSelections(function() {
                var clearBefore = (!ev.ctrlKey && chart.options.ctrlSelectMode);
                if(clearBefore) {
                    chart.data.owner.clearSelected();
                    pvc.data.Data.setSelected(datums, true);
                } else if(ka.toggle) {
                    pvc.data.Data.toggleSelected(datums);
                } else {
                    pvc.data.Data.setSelected(datums, true);
                }
            });
        }
    },
    
    _getDatumsOnRubberBand: function(ev, ka) {
        var datumMap = new def.Map();
        
        this._getDatumsOnRect(datumMap, this.rubberBand, ka);
            
        var datums = datumMap.values();
        if(datums.length) {
            datums = this.chart._onUserSelection(datums);
            if(datums && !datums.length) { datums = null; }
        }
        
        return datums;
    },
    
    // Callback to handle end of rubber band selection
    _getDatumsOnRect: function(datumMap, rect, ka) {
        this._getOwnDatumsOnRect(datumMap, rect, ka);
        
        var cs = this._children;
        if(cs) {
            cs.forEach(function(c) { c._getDatumsOnRect(datumMap, rect, ka); });
        }
    },
    
    _getOwnDatumsOnRect: function(datumMap, rect, ka) {
        var me = this;
        if(!me.isVisible) { return false; }
        
        var pvMarks = me._getSelectableMarks();
        if(!pvMarks || !pvMarks.length) { return false; }
        
        var inCount = datumMap.count;
        
        var selectionMode = def.get(ka, 'markSelectionMode');
        var processDatum = function(datum) {
            if(!datum.isNull) { datumMap.set(datum.id, datum); }
        };
        var processScene = function(scene) {
            if(scene.selectableByRubberband()) {
                scene.datums().each(processDatum);
            }
        };
        var processMark = function(pvMark) {
            pvMark.eachSceneWithDataOnRect(rect, processScene, null, selectionMode);
        };
        
        pvMarks.forEach(processMark);
        
        return inCount < datumMap.count; // any locally added?
    },
    
    /* ANCHORS & ORIENTATION */
    
    /**
     * Returns true if the anchor is one of the values 'top' or 'bottom'.
     */
    isAnchorTopOrBottom: function(anchor) {
        if (!anchor) { anchor = this.anchor; }
        return anchor === "top" || anchor === "bottom";
    },

    isOrientationVertical:   function(o) { return this.chart.isOrientationVertical  (o); },
    isOrientationHorizontal: function(o) { return this.chart.isOrientationHorizontal(o); }
})
.addStatic({
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
    
    verticalAlign2: {
        top:    "top",
        bottom: "bottom",
        middle: "middle",
        right:  "top",
        left:   "bottom",
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

def.scope(function() {
    // Create Anchor methods
    
    var BasePanel = pvc.BasePanel;
    var methods = {};
    var anchorDicts = {
        anchorOrtho:       'relativeAnchor',
        anchorOrthoMirror: 'relativeAnchorMirror',
        anchorOpposite:    'oppositeAnchor',
        anchorLength:      'parallelLength',
        anchorOrthoLength: 'orthogonalLength'
    };
    
    def.eachOwn(anchorDicts, function(d, am) {
        var dict = BasePanel[d];
        methods[am] = function(a) { return dict[a || this.anchor]; };
    });
    
    BasePanel.add(methods);
});
