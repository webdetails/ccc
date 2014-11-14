/**
 * @name cgf.visual.SizeValue
 * @class A value template for the size property.
 * @extends cgf.dom.ValueTemplate
 */
cgf.SizeValue = cgf.visual.SizeValue = cgf.dom.ValueTemplate.extend({
    methods: /** @lends cgf.visual.SizeValue# */{
        /**
         * Configures this object, given a value,
         * that is directed to property {@link cgf.visual.SizeValue#all all}.
         * Also, the {@link cgf.visual.SizeValue#width width} and {@link cgf.visual.SizeValue#height height}
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
         * {@link cgf.visual.SizeValue#width width} and
         * {@link cgf.visual.SizeValue#height height}.
         *
         * @name cgf.visual.SizeValue#all
         * @method
         * @param {function|string|number} [all] The all value.
         * @return {cgf.visual.SizeValue|function|string|number}
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
         * @name cgf.visual.SizeValue#width
         * @method
         * @param {function|string|number} [width] The width value.
         * @return {cgf.visual.SizeValue|function|string|number}
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
         * @name cgf.visual.SizeValue#height
         * @method
         * @param {function|string|number} [height] The height value.
         * @return {cgf.visual.SizeValue|function|string|number}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property height
         */
        cgf_visual_props.height
    ]
});

/**
 * @class The element class of the {@link cgf.visual.SizeValue} template.
 * @name cgf.visual.SizeValue.Element
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

cgf.visual.SizeValue.type().add({
    defaults: new cgf.visual.SizeValue()
        .width (cgf_getAll)
        .height(cgf_getAll)
});

(function() {
    var f = def.fun.typeFactory(cgf.visual.SizeValue);

    cgf_visual_props.size    = cgf.dom.property("size",    {factory: f});
    cgf_visual_props.sizeMin = cgf.dom.property("sizeMin", {factory: f});
    cgf_visual_props.sizeMax = cgf.dom.property("sizeMax", {factory: f});
}());
