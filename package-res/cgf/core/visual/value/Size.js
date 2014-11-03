/**
 * @name cgf.Size
 * @class A value template for the size property.
 * @extends cgf.ValueTemplate
 */
cgf.Size = cgf_ValueTemplate.extend({
    methods: /** @lends cgf.Size# */{
        /**
         * Configures this object, given a value,
         * that is directed to property {@link cgf.Size#all all}.
         * Also, the {@link cgf.Size#width width} and {@link cgf.Size#height height}
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
         * of property {@link cgf.props.allSize}.
         *
         * The `all` value is the default value of the other
         * two dimension properties:
         * {@link cgf.Sides#width width} and
         * {@link cgf.Sides#height height}.
         *
         * @name cgf.Size#all
         * @method
         * @param {function|string|number} [all] The all value.
         * @return {cgf.Sides|function|string|number}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property allSize
         */
        cgf_props.allSize,

        /**
         * Gets or sets the horizontal dimension size.
         *
         * This is the template accessor
         * of property {@link cgf.props.width}.
         *
         * @name cgf.Size#width
         * @method
         * @param {function|string|number} [left] The width value.
         * @return {cgf.Sides|function|string|number}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property width
         */
        cgf_props.width,

        /**
         * Gets or sets the vertical dimension size.
         *
         * This is the template accessor
         * of property {@link cgf.props.height}.
         *
         * @name cgf.Size#height
         * @method
         * @param {function|string|number} [right] The height value.
         * @return {cgf.Sides|function|string|number}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property height
         */
        cgf_props.height
    ]
});

cgf.Size.type().add({
    defaults: new cgf.Size()
        .all(0)
        .width(cgf_getAll)
        .height(cgf_getAll)
});

cgf_props.size = cgf.property("size", {
    factory: def.fun.typeFactory(cgf.Size)
});