
var VIS_FLAGS1 = {
    measuring:     1,
    arranging:     2,

    measureDirty:  4,
    arrangeDirty:  8,
    renderDirty:  16
};

VIS_FLAGS1.arrangeDirtyImplied = VIS_FLAGS1.arrangeDirty | VIS_FLAGS1.renderDirty;
VIS_FLAGS1.measureDirtyImplied = VIS_FLAGS1.measureDirty | VIS_FLAGS1.arrangeDirtyImplied;

// -----------------

/**
 * @name cgf.visual.Visual.Element
 * @class The base abstract class of visual element.
 * @extends cgf.dom.EntityTemplate.Element
 * @abstract
 */
cgf_visual_Visual.Element
    .init(function(parent, scene, index) {

        this.base(parent, scene, index);

        // Layout fields

        // The following two are non-null if already measured before.
        this._prefSize = null;
        this._prevAvailSize = null;

        this._flags1 = 0;

    })
    .add(/** @lends cgf.visual.Visual.Element# */{

        get layout() {
            return this._layoutInfo || this._calcLayout();
        },

        get visualParent() {
            return def.as(this.parent, cgf_visual_Visual);
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
                if(def.is(c, cgf_visual_Canvas)) return c;
                c = c.visualParent;
            }
            return null;
        },

        /**
         * Determines the absolute value of a number in a given unit.
         *
         * This implementation evaluates the standard visual units:
         * `"%"`, `"%w"`, `"%h"`, `"em"`, `"vw"`, `"vh"`.
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
                case '%w': return (p = this.parent) ? ((num / 100) * p.layout.contentWidth ) : NaN;
                case '%h': return (p = this.parent) ? ((num / 100) * p.layout.contentHeight) : NaN;
                case 'em': return num * 10; // TODO: font size inheritance...
                // TODO: vw, vh, cw, ch ... ?
            }

            // TODO: log unknown unit.
            return NaN;
        },

        /**
         * Called to calculate the element's layout.
         *
         * This method is called directly from {@link cgf.Visual.Element#layout}
         * when the property {@link cgf.Visual.Element#_layoutInfo} is not set.
         * This property should be set by the end of this method's execution.
         *
         * If this element is not a layout root,
         * the layout operation is delegated to start at
         * the nearest ancestor layout root element.
         * When returning from that call,
         * it must be that the property {@link cgf.Visual.Element#_layoutInfo}
         * has been set.
         *
         * Otherwise,
         * the layout operation is started in this element,
         * by calling {@link cgf.Visual.Element#_layoutTree}.
         *
         * @return {cgf.Visual.LayoutInfo} The layout info.
         * @protected
         */
        _calcLayout: function() {
            // assert !this._layoutInfo

            // Layout property is set a priori:
            // * this prevents reentry;
            // * this allows children to refer to, for example, the parent's presumed content size,
            //   during their own layout;
            // * setting NaN values on yet unknown fields, allows to, indirectly, by NaN propagation,
            //   detect (invalid) circular dependencies.

            var vp = this.visualParent;
            if(vp)
                vp._calcLayout();
            else
                this._layoutTree();

            /*
            if(!this._layoutInfo) {
                // This means that the parent layout was already calculated, and not dirty.
                // Probably our layout had been invalidated directly.
            }

            if(!this._layoutInfoPrev) {
                // First layout.
                // Start from the root, canvas.
            }

            var li = this._layoutInfo = this._createLayoutInfo();

            this._layoutPrepare();
            */

            return this._layoutInfo;
        },

        /**
         * Called on a layout root element to perform the layout operation
         * on its layout sub-tree.
         *
         * If this is not the first layout of this element,
         * the property {@link cgf.Visual.Element#_layoutInfoPrev}
         * will contain the previous layout's layout info.
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
         */
        _layoutTree: function() {
            this._layoutPrepare();
            this._layoutCommit();
        },

        /**
         * Creates a layout info instance, appropriate for this element's type.
         *
         * @return {cgf.visual.Visual.LayoutInfo} The layout info.
         * @virtual
         */
        _createLayoutInfo: function() {
            /**
             * @name cgf.visual.Visual.LayoutInfo
             * @class The layout information associated with a {@link cgf.visual.Visual.Element} class.
             */

            // TODO: should these be integrated with some other Point/Rect classes/definitions?
            /**
             * A 2D point.
             * @typedef {Object} cgf.visual.Visual.LayoutInfo.Position
             * @property {number} x The _x_ position coordinate.
             * @property {number} y The _y_ position coordinate.
             */
            /**
             * A 2D size.
             * @typedef {Object} cgf.visual.Visual.LayoutInfo.Size
             * @property {number} width The _horizontal_ size dimension.
             * @property {number} height The _vertical_ size dimension.
             */
            return /** @lends cgf.visual.Visual.LayoutInfo# **/{
                /**
                 * Gets the laid out position of the element's reference box,
                 * expressed in its parent's content coordinate system.
                 *
                 * The parent's content coordinate system
                 * has its origin at
                 * the top-left corner of
                 * its content box,
                 * _y_ growing downwards, and
                 * _x_ growing rightwards.
                 *
                 * Note that positions are only set on the layout's _commit_ phase,
                 * (on all elements but the root, canvas, element)
                 * and that, before that,
                 * position coordinates have the default value of `NaN`.
                 *
                 * @type {cgf.visual.Visual.LayoutInfo.Position}
                 */
                position: {
                    x: NaN,
                    y: NaN
                },

                /**
                 * Gets the laid out size of the element's reference box,
                 * expressed in its parent's coordinate system.
                 *
                 * The parent's content coordinate system
                 * has its origin at
                 * the top-left corner of
                 * its content box,
                 * _y_ growing downwards, and
                 * _x_ growing rightwards.
                 *
                 * Note that final sizes are only set on the end of the layout's _prepare_ phase,
                 * and that, before that,
                 * size dimensions have the default value of `NaN`.
                 *
                 * @type {cgf.visual.Visual.LayoutInfo.Size}
                 */
                size: {
                    width:  NaN,
                    height: NaN
                }
            };
        },

        /** @override */
        invalidate: function() {

            this.base();

            this.invalidateLayout();
        },

        invalidateLayout: function() {
            if(this._layoutInfo) {
                // Keep the previous layout info, if any.
                this._layoutInfoPrev = this._layoutInfo;
                this._layoutInfo = null;

                // Layout is inherently a tree-global process.
                var vp = this.visualParent;
                if(vp) vp.invalidateLayout();
            }
        },

        /**
         * Gets the preferred size of this element,
         * according to its last measurement, if any,
         * or `null` if it hasn't been measured before.
         *
         * Note that the returned preferred size may be currently dirty.
         * To make sure that an up-to-date preferred size,
         * {@link cgf.visual.Visual#layoutMeasure} must be called before.
         *
         * @example
         * <pre>
         * var elem = new Visual().createElement();
         * var prefSize = elem.layoutMeasure().preferredSize();
         * </pre>
         *
         * @return {cgf.visual.Size} The element's preferred size.
         */
        get preferredSize() { return this._prefSize; },

        // State
        get _beenMeasured () { return this._prevAvailSize != null; },

        get _isMeasuring( ) { return (this._flags1 & VIS_FLAGS1.measuring) !== 0; },
        set _isMeasuring(v) { def.bit.set(this._flags1, VIS_FLAGS1.measuring, v); },

        get _isArranging( ) { return (this._flags1 & VIS_FLAGS1.arranging) !== 0; },
        set _isArranging(v) { def.bit.set(this._flags1, VIS_FLAGS1.arranging, v); },

        get _isMeasureDirty( ) { return (this._flags1 & VIS_FLAGS1.measureDirty) !== 0; },
        set _isMeasureDirty(v) {
            if(v) this._flags1 |= VIS_FLAGS1.measureDirtyImplied;
            else  this._flags1 &= ~VIS_FLAGS1.measureDirty;
        },

        get _isArrangeDirty( ) { return (this._flags1 & VIS_FLAGS1.arrangeDirty) !== 0; },
        set _isArrangeDirty(v) {
            if(v) this._flags1 |= VIS_FLAGS1.arrangeDirtyImplied;
            else  this._flags1 &= ~VIS_FLAGS1.arrangeDirty;
        },

        get _isRenderDirty()   { return (this._flags1 & VIS_FLAGS1.renderDirty) !== 0; },
        set _isRenderDirty(v)  { def.bit.set(this._flags1, VIS_FLAGS1.renderDirty, v); },

        // TODO: Coordinate space: local? parent? ...

        /**
         * Measures the element's size, given a certain available size,
         * for layout purposes.
         *
         * If the element is not applicable, then its size is zero.
         *
         * The measurement should respect the
         * element's size-related properties into account,
         * as specified by the user,
         * such as:
         * {@link cgf.visual.props.left left},
         * {@link cgf.visual.props.top top},
         * {@link cgf.visual.props.right right},
         * {@link cgf.visual.props.bottom bottom},
         * {@link cgf.visual.props.width width},
         * {@link cgf.visual.props.widthMin widthMin},
         * {@link cgf.visual.props.widthMax widthMax},
         * {@link cgf.visual.props.height height},
         * {@link cgf.visual.props.heightMin heightMin},
         * {@link cgf.visual.props.heightMax heightMax},
         * {@link cgf.visual.props.margin margin},
         * {@link cgf.visual.props.padding padding},
         * etc.
         *
         * @param {cgf.visual.Size} [availSize] The available size.
         * When not specified, the previous measurement's available size is used,
         * or, in case this is the first measurement,
         * a size with both dimensions having the value `Infinity`.
         *
         * In general, one or both of the size dimensions may be `Infinity`.
         * This indicates that the element's size along those dimensions is unconstrained —
         * has all the size it may need.
         *
         * This also indicates that it should determine the size it needs
         * to fit all of its content along those dimensions —
         * this is a "size to content" mode of layout.
         *
         * For the dimensions having a non-infinite value,
         * it is the maximum available size that the element can take,
         * along those dimensions,
         * without having to resort to clipping or scrolling of its content.
         *
         * @return {cgf.visual.Visual} This instance.
         * @protected
         */
        _layoutMeasure: function(availSize) {
            // If we're going to store the computed values in the same properties,
            // we need to take care to un-define its value before...

            // Where can the parent's font and width/height,
            // for the purpose of relative measures' absolutization,
            // be read from?

            // Need they be specified as arguments?
            // Can they simply be read from the parent? From where?

            // Main method should check:
            //  * Not Measuring already.
            //  * Is Visible or Occupies Space when hidden?
            //  * IsMeasureDirty || NeverMeasured?
            //  * IsAvailableSizeCloseToPrevious?
            //  * Check not measuring already.
            //
            // * Set Measuring = true
            // Call measure core
            // Update DesiredSize
            // * Set IsMeasureDirty = false
            // * Set NeverMeasured  = false
            // * Set Measuring      = false

            if(!this._isMeasuring) {

                var prevAvailSize = this._prevAvailSize;
                if(prevAvailSize) {
                    // Already measured, at least once.

                    // Is current measurement clean?
                    if(!this._isMeasureDirty) {

                        // If, however, a different available size is being specified,
                        // we must do the measurement anyway.
                        if(availSize) {
                            // Compare if they are "the same".
                            if(areSameSize(prevAvailSize, availSize)) return this;
                        } else {
                            // The default available size is infinite: {width: Infinity, height: Infinity}.
                            // Was the previous size also Infinite?
                            if(isInfiniteSize(prevAvailSize)) return this;
                        }
                    }
                    // else if previous measurement is marked dirty, just do it, whatever the case.
                }

                // Must do the measurement.

                if(!availSize) availSize = prevAvailSize || {width: Infinity, height: Infinity};

                var prefSize;
                if(this.applicable) {
                    this._isMeasuring = true;
                    try {
                        prefSize = this._layoutMeasureCore(availSize);
                    } finally {
                        this._isMeasuring = false;
                    }

                    if(!isValidActualSize(prefSize)) throw def.error.operationInvalid("Invalid measured size.");
                } else {
                    // Does not occupy space...
                    prefSize = {width: 0, height: 0};
                }

                this._prevAvailSize  = availSize;
                this._prefSize       = prefSize;
                this._isMeasureDirty = false;
            }

            return this;
        },

        _layoutMeasureCore: function(availSize) {
            return {width: 0, height: 0};
        }
    });