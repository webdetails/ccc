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
         * Creates a layout info instance, appropriate for a panel element.
         *
         * @return {cgf.visual.VisualParent.LayoutInfo} The layout info.
         * @override
         */
        _createLayoutInfo: function() {
            var li = this.base(),
                s  = this.size,
                p  = this.padding,
                w  = s.width,
                h  = s.height,
                pw = p.width,
                ph = p.height;

            li.contentSize = {
                width:  w != null ? (w - pw) : NaN,
                height: h != null ? (h - ph) : NaN
            };

            li.contentPosition = {
                x: p.left,
                y: p.top
            };

            return li;
        }
    });

cgf_mixVisualParentElement(cgf_visual_Panel.Element);
