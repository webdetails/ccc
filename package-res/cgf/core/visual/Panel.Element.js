/**
 * @name cgf.visual.Panel.Element
 * @class A panel element.
 * @extends cgf.visual.Visual.Element
 * @mixes cgf.visual.VisualParent.Element
 */
cgf_visual_Panel.Element
    .methods(/** @lends cgf.visual.Panel.Element# */{
        /*
        get outerWidth() {
            return this.size.width + this.margin.width;
        },

        get outerHeight() {
            return this.size.height + this.margin.height;
        },
        */

        get contentWidth() {
            return (this.size.width||0) - this.padding.width;
        },

        get contentHeight() {
            return (this.size.height||0) - this.padding.height;
        },

        /**
         * Creates a layout info instance,
         * appropriate for a panel element.
         *
         * @return {cgf.visual.VisualParent.LayoutInfo} The layout info.
         * @override
         */
        _createLayoutInfo: function() {
            var li = this.base();

            var s = this.size;

            li.contentSize = {
                width:  NaN,
                height: NaN
            };

            li.contentPosition = {
                x: NaN,
                y: NaN
            };

            return li;
        }
    });

cgf_mixVisualParentElement(cgf_visual_Panel.Element);