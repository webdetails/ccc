
/**
 * @name cgf.visual.Canvas.Element
 * @class A canvas element is the root of a visual tree.
 * Cannot be content for another visual element.
 *
 * @extends cgf.visual.Visual.Element
 * @mixes cgf.visual.VisualParent.Element
 */
cgf_visual_Canvas.Element
    .methods(/** @lends cgf.visual.Canvas.Element# */{

        /**
         * Creates a layout info instance,
         * appropriate for a panel element.
         *
         * @return {cgf.visual.VisualParent.LayoutInfo} The layout info.
         * @override
         */
        _createLayoutInfo: function() {
            var li = this.base();

            // No paddings,
            // so content size is directly the value of #size.
            // TODO: min-max
            var s = this.size;

            li.contentSize = {
                width:  nullToNaN(s.width ),
                height: nullToNaN(s.height)
            };

            li.contentPosition = {
                x: 0,
                y: 0
            };

            return li;
        }
    });

cgf_mixVisualParentElement(cgf_visual_Canvas.Element);