/**
 * @name cgf.Sides
 * @class A value template for margin and padding properties.
 * @extends cgf.ValueTemplate
 */
cgf.Sides = cgf_ValueTemplate.extend({
    methods: /** @lends cgf.Sides# */{
        /**
         * Configures this object, given a value,
         * that is directed to property {@link cgf.Sides#all all}.
         * Also, all other sides' properties are reset.
         *
         * @param {any} value A value, not identical to `this`, to configure from.
         * @return {boolean} Always returns <tt>true</tt>.
         */
        tryConfigure: function(all) {
            this.all(all)
                .left(null)
                .right(null)
                .top(null)
                .bottom(null);
            return true;
        }
    },
    properties: [
        /**
         * Gets or sets the `all` sides size.
         *
         * This is the template accessor
         * of property {@link cgf.props.allSides}.
         *
         * The `all` value is the default value of all the other
         * four "sides" properties:
         * {@link cgf.Sides#left left},
         * {@link cgf.Sides#right right},
         * {@link cgf.Sides#top top} and
         * {@link cgf.Sides#bottom bottom}.
         *
         * @name cgf.Sides#all
         * @method
         * @param {function|string|number} [all] The all value.
         * @return {cgf.Sides|function|string|number}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property allSides
         */
        cgf_props.allSides,

        /**
         * Gets or sets the left side size.
         *
         * This is the template accessor
         * of property {@link cgf.props.left}.
         *
         * @name cgf.Sides#left
         * @method
         * @param {function|string|number} [left] The left value.
         * @return {cgf.Sides|function|string|number}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property left
         */
        cgf_props.left,

        /**
         * Gets or sets the top side size.
         *
         * This is the template accessor
         * of property {@link cgf.props.top}.
         *
         * @name cgf.Sides#top
         * @method
         * @param {function|string|number} [right] The top value.
         * @return {cgf.Sides|function|string|number}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property top
         */
        cgf_props.top,

        /**
         * Gets or sets the right side size.
         *
         * This is the template accessor
         * of property {@link cgf.props.right}.
         *
         * @name cgf.Sides#right
         * @method
         * @param {function|string|number} [right] The right value.
         * @return {cgf.Sides|function|string|number}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property right
         */
        cgf_props.right,

        /**
         * Gets or sets the bottom side size.
         *
         * This is the template accessor
         * of property {@link cgf.props.bottom}.
         *
         * @name cgf.Sides#bottom
         * @method
         * @param {function|string|number} [bottom] The bottom value.
         * @return {cgf.Sides|function|string|number}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property bottom
         */
        cgf_props.bottom
    ],
    element: {
        /**
         * @class The element class of the {@link cgf.Sides} template.
         * @name cgf.Sides.Element
         *
         * @property {number} all Gets the resolved "all sides" size.
         *
         * This is the element getter
         * of property {@link cgf.props.allSides}.
         *
         * @property {number} left Gets the resolved left side size.
         *
         * This is the element getter
         * of property {@link cgf.props.left}.
         *
         * @property {number} right Gets the resolved right side size.
         *
         * This is the element getter
         * of property {@link cgf.props.right}.
         *
         * @property {number} top Gets the resolved top side size.
         *
         * This is the element getter
         * of property {@link cgf.props.top}.
         *
         * @property {number} bottom Gets the resolved bottom side size.
         *
         * This is the element getter
         * of property {@link cgf.props.bottom}.
         */
        methods: /** cgf.Sides.Element# */{

            /**
             * Gets the sum of the resolved horizontal sides.
             *
             * @return {number} The size of the horizontal sides.
             */
            get width() { return this.left + this.right; },

            /**
             * Gets the sum of the resolved vertical sides.
             *
             * @return {number} The size of the vertical sides.
             */
            get height() { return this.top + this.bottom; }
        }
    }
});

cgf.Sides.type().add({
    defaults: new cgf.Sides()
        .all(0)
        .left(cgf_getAll)
        .right(cgf_getAll)
        .top(cgf_getAll)
        .bottom(cgf_getAll)
});