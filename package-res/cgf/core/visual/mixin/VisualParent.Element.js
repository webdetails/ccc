
/**
 * A mixin class for visual elements that can contain other visual elements.
 * @name cgf.visual.VisualParent.Element
 * @mixin
 * @extends cgf.visual.VisualSized.Element
 */
var cgf_visual_VisualParentElementMethods = /** @lends cgf.visual.VisualParent.Element# */{
    /**
     * Creates a layout info instance,
     * appropriate for a parent visual element.
     *
     * @return {cgf.visual.VisualParent.LayoutInfo} The layout info.
     * @override
     */
    _createLayoutInfo: function() {
        /**
         * The layout information associated with a {@link cgf.visual.VisualParent.Element} class.
         * @name cgf.visual.VisualParent.LayoutInfo
         * @class
         * @extends cgf.visual.Visual.LayoutInfo
         */
        var li = this.base();

        // The content size that is available to children during layout.
        //
        // Infinity, on any of the dimensions,
        // means that the parent will size to the content's size
        // on that dimension.
        //
        // Note that the width and height values need not remain the same
        // during this element's layout.
        // As the layout of each of its children is performed,
        // the available size for any following children may change.
        //
        // Many layout logics take the parent's available content size into account.
        // This can be done for one or both of the size dimensions.
        // Others, disregard it and always assume the minimum or intrinsic size.
        //
        // Should this be an argument to layoutPrepare(availableSize) instead?
        // It isn't this iteratively changed size that percent evaluators need to access.
        // At most it would be the initial value of this field: contentSize.
        //li.contentAvailableSize = {
        //    width:  Infinity,
        //    height: Infinity
        //};

        /**
         * Gets the size of the element's content box,
         * expressed in the local coordinate system.
         *
         * The local coordinate system has its origin
         * at the top-left corner of the element's reference box,
         * _y_ growing downwards, and
         * _x_ growing rightwards.
         *
         * The content box is offset inwards,
         * from the element's reference box,
         * by properties like padding.
         *
         * When content size is fixed, a priori, totally or partially,
         * then the width and/or height properties will have valid, _not_ `NaN`, values,
         * since the beginning of the layout process.
         *
         * In this case,
         * it is valid for children to refer back to the content width and/or height,
         * during their layout (and parent's).
         * The evaluation of % positional/size properties works this way.
         *
         * When a dimension is not fixed, a priori,
         * referring to it during the layout's _prepare_ phase
         * results in the propagation of the `NaN` value,
         * with undefined consequences.
         *
         * Both size dimensions are necessarily set to valid, _not_ `NaN`, values,
         * by the end of the layout's _prepare_ phase.
         *
         * @alias contentSize
         * @memberOf cgf.visual.VisualParent.LayoutInfo#
         * @type {cgf.visual.Visual.LayoutInfo.Size}
         */
        li.contentSize = {
            width:  NaN,
            height: NaN
        };

        /**
         * Gets the laid out position of the element's content box,
         * expressed in the local coordinate system.
         *
         * The local coordinate system has its origin
         * at the top-left corner of the element's reference box,
         * _y_ growing downwards, and
         * _x_ growing rightwards.
         *
         * The content box is offset inwards,
         * from the element's reference box,
         * by properties like padding.
         *
         * This property is available since the beginning of the layout process.
         *
         * @alias contentPosition
         * @memberOf cgf.visual.VisualParent.LayoutInfo#
         * @type {cgf.visual.Visual.LayoutInfo.Position}
         */
        li.contentPosition = {
            x: NaN,
            y: NaN
        };

        return li;
    }
};

function cgf_mixVisualParentElement(VisualElement) {
    return cgf_mixVisualSizedElement(VisualElement).add(cgf_visual_VisualParentElementMethods);
}