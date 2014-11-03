/**
 * @name cgf.Visual.Element
 * @class The element class of visual templates.
 * @extends cgf.Template.Element
 * @mixes cgf.Template.Element.SceneStorageMixin
 */
cgf.Visual.Element.methods([cgf_TemplatedElement.SceneStorageMixin, /** @lends cgf.Visual.Element# */{

    /** @override */
    invalidate: function() {
        this.base();

        this._layoutInfo = null;
    },

    /**
     * Gets the preferred size of this element,
     * according to its last measurement, if any,
     * or `null` if it hasn't been measured before.
     *
     * Note that the returned preferred size may be currently dirty.
     * To make sure that an up-to-date preferred size,
     * {@link cgf.Visual#layoutMeasure} must be called before.
     *
     * @example
     * <pre>
     * var elem = new Visual().createElement();
     * var prefSize = elem.layoutMeasure().preferredSize();
     * </pre>
     *
     * @return {cgf.Size} The element's preferred size.
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
    set _isRenderDirty(v)  { def.bit.set(this._flags1, VIS_FLAGS1.renderDirty, v); }

    get layout() {
        return this._layoutInfo || this._calcLayout();
    },

    _calcLayout: function() {
        var li = this._layoutInfo = {
            x: 0,
            y: 0
        };

        return li;
    },


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
     * {@link cgf.props.left left},
     * {@link cgf.props.top top},
     * {@link cgf.props.right right},
     * {@link cgf.props.bottom bottom},
     * {@link cgf.props.width width},
     * {@link cgf.props.widthMin widthMin},
     * {@link cgf.props.widthMax widthMax},
     * {@link cgf.props.height height},
     * {@link cgf.props.heightMin heightMin},
     * {@link cgf.props.heightMax heightMax},
     * {@link cgf.props.margin margin},
     * {@link cgf.props.padding padding},
     * etc.
     *
     * @param {cgf.Size} [availSize] The available size.
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
     * @return {cgf.Visual} This instance.
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
}]);