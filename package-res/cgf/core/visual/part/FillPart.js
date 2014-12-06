/**
 * @name cgf.visual.FillPart
 * @class A part template for the fill property.
 * @extends cgf.dom.PartTemplate
 */
cgf.FillPart = defTemplate(cgf_visual, 'FillPart', cgf.dom.PartTemplate.extend({
    methods: /** @lends cgf.visual.FillPart# */{
        /**
         * Tries to configure the fill with a given string value.
         *
         * TODO: This implementation supports a CSS2 fill property syntax.
         *
         * @param {any} value A value, not identical to `this`, to configure from.
         *
         * @return {boolean} Returns `true` if the specified value
         * is a string, `false`, otherwise.
         */
        tryConfigure: function(value) {
            if(def.string.is(value)) {
                this.color(value);
                return true;
            }
            return false;
        }
    },
    properties: [
        /**
         * Gets or sets the fill `color`.
         *
         * This is the template accessor
         * of property {@link cgf.visual.props.color}.
         *
         * @name cgf.visual.FillPart#color
         * @method
         * @param {function|string} [value] The color value.
         * @return {cgf.visual.FillPart|function|string}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property color
         */
        cgf_visual_props.color
    ]
}));

/**
 * @class The element class of the {@link cgf.visual.FillPart} template.
 * @name cgf.visual.FillPart.Element
 *
 * @property {string} color Gets the fill color.
 *
 * This is the element getter
 * of property {@link cgf.visual.props.color}.
 */

cgf_visual_props.fill = cgf.dom.property("fill", {
    factory: def.fun.typeFactory(cgf_visual.FillPart)
});
