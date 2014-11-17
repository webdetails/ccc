/**
 * A mixin class for visual elements that can contain other visual elements.
 * @name cgf.visual.VisualParent.Element
 * @mixin
 * @extends cgf.visual.VisualSized.Element
 */
var cgf_visual_VisualParentElementMethods = /** @lends cgf.visual.VisualParent.Element# */{

    get isVisualParent() { return true; },

    /**
     * Enumerates the visual child elements of this element.
     *
     * @param {function} fun A function that receives as arguments the visual child element,
     * the index of the child element and, lastly, the index of the visual child template.
     * If the function returns `false`, the enumeration stops.
     * The function is called having _x_ as the `this` context.
     * @param {object} [x] The `this` context on which _fun_ is called.
     * @return {boolean} `true` if all elements were enumerated or `false` if the enumeration
     * was stopped before.
     */
    eachVisualChild: function(fun, x) {
        var childInfos = this.template._childrenVisual,
            j = -1,
            J = childInfos.length;

        while(++j < J) {
            var childInfo  = childInfos[j],
                propInfo   = childInfo.propInfo,
                prop       = propInfo.prop,
                childGroup = propInfo.isAdhoc ? this.get(prop) : this[prop.shortName],
                i, I;

            if(prop.isList) childGroup = childGroup[childInfo.template.childIndex];

            if(childGroup != null) {
                if(def.array.is(childGroup)) {
                    i = -1;
                    I = childGroup.length;
                    while(++i < I) if(fun.call(x, childGroup[i], i, j) === false) return false;
                } else {
                    if(fun.call(x, childGroup, 0, j) === false) return false;
                }
            }
        }

        return true;
    },

    /**
     * Performs the layout's prepare phase.
     *
     * This implementation only positions children absolutely.
     *
     * This method is called as many times as needed, by the element's parent element.
     * Each time, in principle,
     * a different available reference size is given
     * (any margins that the element has are already discounted).
     *
     * @param {cgf.visual.ISize} availableRefSize
     * The size that the parent should be able to allocate for the
     * child without overflow. The size is that of the element's reference box.
     */
    _layoutPrepare: function(availableRefSize) {
        var li = this._layoutInfo = this._createLayoutInfo(),

            /**
             * The available size for children.
             *
             * A child that does not specify its position,
             * or one of its components,
             * is placed at coordinate 0.
             *
             * The available size reflects this element's
             * specified size and/or sizeMax.
             *
             * A dimension that has no size constraint is
             * provided with value `Infinity`,
             * meaning that all the space that the child may need is available.
             * This is a way of asking the child to take on its preferred size.
             *
             * @type cgf.visual.ISize
             */
            childAvailSize = {
                // TODO: not sure if we should be constraining with
                // availableRefSize as well.
                width:  cgf_boundedNumber.fixedOrMaxOrDefault(li.boundedContentWidth,  Infinity),
                height: cgf_boundedNumber.fixedOrMaxOrDefault(li.boundedContentHeight, Infinity)
            };

            //isAutoWidth  = isNaN(li.contentWidth ),
            //isAutoHeight = isNaN(li.contentHeight),
            //autoContentWidth  = 0,
            //autoContentHeight = 0;

        this.eachVisualChild(function(child) {
            child._layoutPrepare(childAvailSize);
        }, this);
    },

    _layoutEnd: function() {
        this.eachVisualChild(function(child) {
            child._layoutEnd();
        }, this);
    },
    
    /**
     * Creates a layout info instance,
     * appropriate for a parent visual element.
     *
     * @return {cgf.visual.VisualParent.LayoutInfo} The layout info.
     * @override
     */
    _createLayoutInfo123: function() {
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
         * @type {cgf.visual.ISize}
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
         * @type {cgf.visual.IPosition}
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
