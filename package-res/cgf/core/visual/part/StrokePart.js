/**
 * @name cgf.visual.StrokePart
 * @class A part template for the stroke property.
 * @extends cgf.dom.PartTemplate
 */
cgf.StrokePart = cgf.visual.StrokePart = cgf.dom.PartTemplate.extend({
    methods: /** @lends cgf.visual.StrokePart# */{
        /**
         * Tries to configure the stroke with a given string value.
         *
         * TODO: This implementation supports a CSS2 stroke property syntax.
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
         * Gets or sets the stroke `color`.
         *
         * This is the template accessor
         * of property {@link cgf.visual.props.color}.
         *
         * @name cgf.visual.StrokePart#color
         * @method
         * @param {function|string} [value] The color value.
         * @return {cgf.visual.StrokePart|function|string}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property color
         */
        cgf_visual_props.color,

        /**
         * Gets or sets the stroke width.
         *
         * This is the template accessor
         * of property {@link cgf.visual.props.strokeWidth}.
         *
         * @name cgf.visual.StrokePart#width
         * @method
         * @param {function|string|number} [width] The stroke width.
         * @return {cgf.visual.SizePart|function|number}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property width
         */
        cgf_visual_props.strokeWidth
    ]
});

/**
 * @class The element class of the {@link cgf.visual.StrokePart} template.
 * @name cgf.visual.StrokePart.Element
 *
 * @property {string} color Gets the stroke color.
 *
 * This is the element getter
 * of property {@link cgf.visual.props.color}.
 *
 * @property {number} width Gets the stroke width.
 *
 * This is the element getter
 * of property {@link cgf.visual.props.strokeWidth}.
 */

cgf.visual.StrokePart.type().add({
    defaults: new cgf.visual.StrokePart()
        .color('black')
        .width(1)
});

cgf_visual_props.stroke = cgf.dom.property("stroke", {
    factory: def.fun.typeFactory(cgf.visual.StrokePart)
});
