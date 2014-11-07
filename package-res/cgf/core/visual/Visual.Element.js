
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

        /** @override */
        invalidate: function() {
            this.base();

            this.invalidateLayout();
        },

        invalidateLayout: function() {
            this._layoutInfo = null;
        },

        _calcLayout: function() {
            // Layout property is set a priori:
            // * this prevents reentry;
            // * this allows children to refer to, for example, the parent's presumed content size,
            //   during their own layout;
            // * setting NaN values on yet unknown fields, allows to, indirectly, by NaN propagation,
            //   detect (invalid) circular dependencies.
            var li = this._layoutInfo = this._createLayoutInfo();

            this._layoutPrepare();

            return li;
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

                // TODO: not all element types have size...
                // Have layout box w/ size: Canvas, Panel, Bar, Image
                // Have special meaning:    Area, Rule   (width xor height ...)
                // Don't:                   Dot, Line, Label (auto), Wedge

                // Can have visual content: Canvas (at most 1 child), Panel (, Layout)
                // => have layout box
                // -> need to support child#margin

                // Can have #padding: Panel
                //  With special meaning: possibly Label

                // Can be visual content: all but Canvas.

                // Can have #margin: all that can be visual content => all but Canvas.

                // Don't have fill:   Canvas, Label, Rule
                // Don't have stroke: Canvas, Label

                // Visual
                //
                // ^-- (mixin) VisualPainted CHECK - possibly, even split into stroke and fill
                //     * stroke, fill
                //
                // ^-- (mixin) VisualSized CHECK
                //     * size, sizeMin, sizeMax (mixins don't support props...)
                //     * layout.size
                //
                //     ^-- (mixin) VisualParent (=> VisualSized) CHECK
                //         * layout.contentSize
                //         * layout.contentPosition
                //
                // ^-- VisualContent
                //     * margin
                //     * left, right, top, bottom (absolute positioning)
                //     * layout.position
                //
                //     ^-- Panel, Bar, Image, Line, Area, Rule, Dot, Label, Wedge
                //
                //     ^-- Bar    (+               VisualSized, VisualPainted, VisualContent)
                //
                //     ^-- Panel  (+ VisualParent, VisualSized, VisualPainted, VisualContent)
                //         * padding
                //
                // ^-- Canvas     (+ VisualParent, VisualSized                               )



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