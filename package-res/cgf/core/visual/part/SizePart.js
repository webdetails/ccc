/**
 * @name cgf.visual.SizePart
 * @class A part template for the size property.
 * @extends cgf.dom.PartTemplate
 */
cgf.SizePart = cgf.visual.SizePart = cgf.dom.PartTemplate.extend({
    methods: /** @lends cgf.visual.SizePart# */{
        /**
         * Configures this object, given a value,
         * that is directed to property {@link cgf.visual.SizePart#all all}.
         * Also, the {@link cgf.visual.SizePart#width width} and {@link cgf.visual.SizePart#height height}
         * properties are reset.
         *
         * @param {any} value A value, not identical to `this`, to configure from.
         * @return {boolean} Always returns <tt>true</tt>.
         */
        tryConfigure: function(all) {
            this.all(all)
                .width(null)
                .height(null);
            return true;
        }
    },
    properties: [
        /**
         * Gets or sets the `all` size.
         *
         * This is the template accessor
         * of property {@link cgf.visual.props.allSize}.
         *
         * The `all` value is the default value of the other
         * two dimension properties:
         * {@link cgf.visual.SizePart#width width} and
         * {@link cgf.visual.SizePart#height height}.
         *
         * @name cgf.visual.SizePart#all
         * @method
         * @param {function|string|number} [all] The all value.
         * @return {cgf.visual.SizePart|function|string|number}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property allSize
         */
        cgf_visual_props.allSize,

        /**
         * Gets or sets the horizontal dimension size.
         *
         * This is the template accessor
         * of property {@link cgf.visual.props.width}.
         *
         * @name cgf.visual.SizePart#width
         * @method
         * @param {function|string|number} [width] The width value.
         * @return {cgf.visual.SizePart|function|string|number}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property width
         */
        cgf_visual_props.width,

        /**
         * Gets or sets the vertical dimension size.
         *
         * This is the template accessor
         * of property {@link cgf.visual.props.height}.
         *
         * @name cgf.visual.SizePart#height
         * @method
         * @param {function|string|number} [height] The height value.
         * @return {cgf.visual.SizePart|function|string|number}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property height
         */
        cgf_visual_props.height
    ]
});

/**
 * @class The element class of the {@link cgf.visual.SizePart} template.
 * @name cgf.visual.SizePart.Element
 *
 * @property {number} all Gets the resolved "all dimensions" size.
 *
 * This is the element getter
 * of property {@link cgf.visual.props.allSize}.
 *
 * @property {number} width Gets the resolved horizontal dimension size.
 *
 * This is the element getter
 * of property {@link cgf.visual.props.width}.
 *
 * @property {number} right Gets the resolved vertical dimension size.
 *
 * This is the element getter
 * of property {@link cgf.visual.props.height}.
 */

cgf.visual.SizePart.type().add({
    defaults: new cgf.visual.SizePart()
        .width (cgf_getAll)
        .height(cgf_getAll)
});

(function() {
    var f = def.fun.typeFactory(cgf.visual.SizePart);

    cgf_visual_props.size    = cgf.dom.property("size",    {factory: f});
    cgf_visual_props.sizeMin = cgf.dom.property("sizeMin", {factory: f});
    cgf_visual_props.sizeMax = cgf.dom.property("sizeMax", {factory: f});
}());
