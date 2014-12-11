
/**
 * @name cgf.visual.Visual.Element
 * @class The base abstract class of visual element.
 * @extends cgf.dom.EntityTemplate.Element
 * @abstract
 */
cgf_visual_Visual.Element
    .add(/** @lends cgf.visual.Visual.Element# */{
        /**
         * Gets a value indicating if this element is a content element.
         * @type boolean
         */
        get isContent() { return false; },

        /**
         * Gets a value indicating if this element has size.
         * @type boolean
         */
        get isSized() { return false; },

        /**
         * Gets a value indicating if this element can have visual children.
         * @type boolean
         */
        get isVisualParent() { return false; },

        /**
         * Gets a value indicating if this element is a layout root.
         * @type boolean
         */
        get isLayoutRoot() { return false; },

        /**
         * Gets a value indicating if this element lays out all of its children
         * using absolute positioning.
         * @type boolean
         */
        get isPositionAbsOnly() { return true; },

        get visualParent() {
            return def.as(this.parent, cgf_visual_Visual.Element);
        },

        /**
         * Gets the canvas of the visual tree of this element,
         * if any, or `null` if none.
         *
         * If the current element is itself a canvas element,
         * it is not returned, but its nearest ancestor canvas, if any, is.
         *
         * @type {cgf.visual.Canvas}
         * @virtual
         */
        get canvas() {
            var c = this.visualParent;
            while(c) {
                if(def.is(c, cgf_visual_Canvas.Element)) return c;
                c = c.visualParent;
            }
            return null;
        },

        /**
        * Gets the nearest ascendant element, or self,
        * that is a layout root,
        * if any, or `null` if none.
        *
        * @type {cgf.visual.Element}
        * @virtual
        */
        get layoutRoot() {
            var c = this;
            do { if(c.isLayoutRoot) return c; } while((c = c.visualParent));
            return null;
        },

        /**
         * Determines the absolute value of a number in a given unit.
         *
         * This implementation evaluates the standard visual units:
         * `"%"`, `"%w"`, `"%h"`, `"em"`, `"vw"`, `"vh"`, `"%min"`, `"%max"`.
         *
         * @param {number} num The number to evaluate, expressed in unit _unit_.
         * @param {number} unit The unit in which _num_ is expressed.
         *
         * @return {number} The absolute value, or `NaN`, when the unit is not defined,
         * or it cannot be evaluated in the current state.
         *
         * @override
         */
        evalUnit: function(num, unit) {
            if(!unit || !num || !isFinite(num)) return num; // 0, NaN, +Infinity, -Infinity

            // TODO: implement me
            var p;
            switch(unit) {
                case '%':
                case '%h':   return (p = this.parent) ? ((num / 100) * p.contentWidth ) : NaN;
                case '%v':   return (p = this.parent) ? ((num / 100) * p.contentHeight) : NaN;
                case '%min': return (p = this.parent)
                    ? ((num / 100) * Math.min(p.contentWidth, p.contentHeight))
                    : NaN;
                case '%max': return (p = this.parent)
                    ? ((num / 100) * Math.max(p.contentWidth, p.contentHeight))
                    : NaN;

                case 'em':   return num * 10; // TODO: font size inheritance...
                // TODO: vw, vh, cw, ch ... ?
            }

            // TODO: log unknown unit.
            return NaN;
        },

        /**
         * Obtains the (stable) layout object,
         * performing layout if needed.
         *
         * The layout object contains layout information
         * that is not reflected in the element's
         * template properties.
         */
        get layout() {
            // Check that the layout object exists and is not dirty.
            // The automatically generated template property getters
            // check the corresponding version.
            // A custom property must check the version explicitly.
            var li = this._layoutInfo;
            if(!li || li.version < this._versions[ATOMIC_STABLE_GROUP]) {
                this._layoutStable();
                li = this._layoutInfo;
            }

            return li;
        },

        _build_layoutStable: function() {
            // Called after an output property of this builder has been evaluated.
            // Layout always needs to start from a layout root element.
            // If it's invalid in any of the layout sub-tree's elements,
            // it's considered invalid from the top...
            var lr = this.layoutRoot ||
                def.fail.operationInvalid("Layout requires a root canvas element");

            lr._layoutTree(this._versions[ATOMIC_STABLE_GROUP]);
        },

        /**
         * Called on a layout root element to perform the layout operation
         * on its layout sub-tree.
         *
         * The default implementation performs no special placement
         * of child entities.
         * However,
         * its methods {@link cgf.Visual.Element#_layoutPrepare} and
         * {@link cgf.Visual.Element#_layoutCommit} are called.
         *
         * All child elements will default to content position `0,0`.
         *
         * When the size of this element, or one of its components, is unspecified,
         * it is taken to be the size of the bounding box that
         * encompasses all the positive quadrant part of child elements' bounding boxes...
         * ???
         *
         * @param {number} version The element version at the node that
         *     triggered the tree layout.
         */
        _layoutTree: function(version) {
            if(version > this._versions[ATOMIC_STABLE_GROUP])
                this._versions[ATOMIC_STABLE_GROUP] = version;

            // Being a layout root,
            // our (possibly non-existing) parent
            // gives us all the space we may need...
            var availableRefSize = {width: Infinity, height: Infinity};

            this._layoutPrepare(availableRefSize, null);
            this._layoutEnd();
        },

        /**
         * Performs the initial layout phase.
         *
         * The layout info object is created and filled with layout results,
         * that vary according to the element type.
         *
         * This implementation performs basic, local, layout tasks,
         * as appropriate to leaf elements.
         *
         * Overriding implementations _must_ call the base implementation.
         *
         * See override in VisualParent.Element mixin.
         *
         * @param {cgf.visual.ISize} availableRefSize
         * The size that the parent should be able to allocate for the
         * child without overflow.
         * The size is that of the element's reference box.
         * @param {cgf.visual.Visual.LayoutInfo} liParent The parent layout info object,
         * or `null`, if this element is a layout root.
         *
         * @return {cgf.visual.Visual.LayoutInfo} The layout info object,
         *     which is also the value of {@link cgf.Visual.Element#_layoutInfo}.
         *
         * @virtual
         */
        _layoutPrepare: function(availableRefSize, liParent) {

            // Make sure to mark the "layout" builder as evaluating.
            // Otherwise, reading output properties would cause reentry and
            // setting them would throw.
            // Should call this base implementation before anything else.
            //
            // The builder evaluation is only stopped in #_layoutEnd.
            this._evaluating._build_layoutStable = true;

            var li = {
                    version: liParent ? liParent.version : this._versions[ATOMIC_STABLE_GROUP],
                    previous: this._layoutInfo // may be nully
                },
                isSized = this.isSized,
                isPosAbs = 0,
                l, r, t, b, w, h, w0, h0,
                processPos, plength, size, sizeMin, sizeMax, pad;

            // Layout property is set a priori, when going down:
            // * prevents reentry;
            // * allows children to refer to, for example,
            //   the parent's presumed content size, during their own layout;
            // * setting NaN values on yet unknown fields, allows to,
            //   indirectly, by NaN propagation, detect (invalid) circular dependencies.
            this._layoutInfo = li;

            if(isSized) {
                size = this.size;
                w = w0 = size.width;  // may be null
                h = h0 = size.height; // idem
            } else {
                w = h = 0;
            }

            // posAbs -> any position fixed (parent-% or abs)
            //
            // both positions of same direction fixed -> implied length,
            //    but require parent length to be defined.
            //
            // if posAbs and any percent (position, size, sizeMin, sizeMax)

            if(this.isContent) {
                // Some parents (Canvas && base Panel) only support absolute positioning.
                isPosAbs = this.parent.isPositionAbsOnly;

                // Detects any non-nulls, that cause use of absolute positioning.
                processPos = function(v) {
                    if(!isPosAbs && v != null) isPosAbs = true;
                    return v;
                };

                l = processPos(this.left  );
                t = processPos(this.top   );
                r = processPos(this.right );
                b = processPos(this.bottom);

                li.isPositionAbs = isPosAbs;

                if(isPosAbs) {
                    // The way this is being done,
                    // an abs positioned element will have no way to
                    // determine its size from its content.
                    // Also, sizeMin/Max are also not being taken into account.
                    // So, if, for example, left and right are fixed,
                    // and parent.width is not yet determined,
                    // we should only determine actual width after the element
                    // has had a chance to calculate it from its content...

                    /*
                     *                 PW=? > L + R  { W > 0 / Wmin }
                     *      |------------------------|
                     *      |---->+-----------+<-----|
                     *         L        W=?       R
                     *
                     *              [Wmin, Wmax]
                     *
                     *                  PW=?  > L2 + W2
                     *      |------------------------|
                     *      |------>+-------+<-------|
                     *         L2       W2       R2 = PW -(L2 + W2)
                     *
                     *      PW >= max_i { (Li||0) + (Wi||0) + (Ri||0) }
                     */

                    // If parent already has a fixed content width,
                    // all the envolved variables can be resolved now.
                    // Otherwise,
                    // it is only possible in a second phase,
                    // when the parent already has a fixed content width.
                    // The parent may have other children that allow him
                    // to determine a fixed width.
                    // The only thing this element is good for is to help
                    // establish the minimum size that the parent must have
                    // so that it contains all its children.
                    // If this element has a specified absolute min width,
                    // we're good to go, otherwise,
                    // determining the minimum width requires analyzing the
                    // element's own content.
                    plength = liParent.contentWidth;
                    if(!isNaN(plength)) {
                        if(w == null) {
                            if(l == null) this.left  = l = 0;
                            if(r == null) this.right = r = 0;
                            w = Math.max(0, plength - l - r);
                        } else if(l == null) {
                            if(r == null)
                                // Center in parent
                                this.left = this.right = (plength - w) / 2;
                            else
                                this.left = plength - w - r;
                        } else /*if(r == null)*/ {
                            // When r is also defined, smash it; over-constrained.
                            this.right = plength - w - l;
                        }
                        // w,l,r are now not NaN/null
                    } else {
                        this.left = this.right = NaN;
                    }

                    plength = liParent.contentHeight;
                    if(!isNaN(plength)) {
                        if(h == null) {
                            if(t == null) this.top    = t = 0;
                            if(b == null) this.bottom = b = 0;
                            h = Math.max(0, plength - t - b);
                        } else if(t == null) {
                            if(b == null)
                                // Center in parent
                                this.top = this.bottom = (plength - h) / 2;
                            else
                                this.top = plength - h - b;
                        } else /*if(b == null)*/ {
                            // When b is also defined, smash it; over-constrained.
                            this.bottom = plength - h - t;
                        }
                        // h,t,b are now not NaN/null
                    } else {
                        this.top = this.bottom = NaN;
                    }
                } else {
                    this.left = this.right  =
                    this.top  = this.bottom = NaN;
                }
            }

            if(isSized) {
                sizeMin = this.sizeMin;
                sizeMax = this.sizeMax;

                li.boundedWidth = cgf_boundedNumber(
                        nullOrNegativeOrInfiniteTo(sizeMin.width, 0), // null -> 0
                        w,
                        nullOrNegativeTo(sizeMax.width, posInf)); // null -> Infinity

                li.boundedHeight = cgf_boundedNumber(
                        nullOrNegativeOrInfiniteTo(sizeMin.height, 0), // null -> 0
                        h,
                        nullOrNegativeTo(sizeMax.height, posInf));  // null -> Infinity

                // <=> fixedOrDefault
                w = def.number.as(li.boundedWidth, NaN);
                if(w !== w0) size.width = w;

                h = def.number.as(li.boundedHeight, NaN);
                if(h !== h0) size.height = h;

                // Note that parents are always sized.
                if(this.isVisualParent) {
                    pad = this.padding; // canvas does not have this

                    li.contentLeft = (pad && pad.left) || 0;
                    li.contentTop  = (pad && pad.top ) || 0;

                    // Subtract padding to width/height.
                    li.boundedContentWidth = cgf_boundedNumber.addFixed(
                        li.boundedWidth,
                        -((pad && pad.width) || 0),
                        toNonNegative);

                    li.boundedContentHeight = cgf_boundedNumber.addFixed(
                        li.boundedHeight,
                        -((pad && pad.height) || 0),
                        toNonNegative);

                    // li.width and li.height may be NaN.
                    li.contentWidth  = def.number.as(li.boundedContentWidth,  NaN);
                    li.contentHeight = def.number.as(li.boundedContentHeight, NaN);
                }
            }

            return li;
            // /**
            //  * @name cgf.visual.Visual.LayoutInfo
            //  * @class The layout information associated with a {@link cgf.visual.Visual.Element} class.
            //  */
            // return /** @lends cgf.visual.Visual.LayoutInfo# **/{
            //     /**
            //      * Gets the laid out position of the element's reference box,
            //      * expressed in its parent's content coordinate system.
            //      *
            //      * The parent's content coordinate system
            //      * has its origin at
            //      * the top-left corner of
            //      * its content box,
            //      * _y_ growing downwards, and
            //      * _x_ growing rightwards.
            //      *
            //      * Note that positions are only set on the layout's _commit_ phase,
            //      * (on all elements but the root, canvas, element)
            //      * and that, before that,
            //      * position coordinates have the default value of `NaN`.
            //      *
            //      * @type {cgf.visual.IPosition}
            //      */
            //     position: {
            //         x: NaN,
            //         y: NaN
            //     },
            //
            //     /**
            //      * Gets the laid out size of the element's reference box,
            //      * expressed in its parent's coordinate system.
            //      *
            //      * The parent's content coordinate system
            //      * has its origin at
            //      * the top-left corner of
            //      * its content box,
            //      * _y_ growing downwards, and
            //      * _x_ growing rightwards.
            //      *
            //      * Note that final sizes are only set on the end of the layout's _prepare_ phase,
            //      * and that, before that,
            //      * size dimensions have the default value of `NaN`.
            //      *
            //      * @type {cgf.visual.ISize}
            //      */
            //     size: {
            //         width:  NaN,
            //         height: NaN
            //     }
            // };
        },

        // Basic, for leaf elements.
        _layoutEnd: function() {
            this._layoutInfo.previous = null; // Release memory.
            this._evaluating._build_layoutStable = false;
        }
    });
