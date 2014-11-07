/**
 * @name cgf.visual.Sides
 * @class A value template for margin and padding properties.
 * @extends cgf.dom.ValueTemplate
 */
cgf.Sides = cgf.visual.Sides = cgf.dom.ValueTemplate.extend({
    methods: /** @lends cgf.visual.Sides# */{
        /**
         * Configures this object, given a value,
         * that is directed to property {@link cgf.visual.Sides#all all}.
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
         * of property {@link cgf.visual.props.allSides}.
         *
         * The `all` value is the default value of all the other
         * four "sides" properties:
         * {@link cgf.visual.Sides#left left},
         * {@link cgf.visual.Sides#right right},
         * {@link cgf.visual.Sides#top top} and
         * {@link cgf.visual.Sides#bottom bottom}.
         *
         * @name cgf.visual.Sides#all
         * @method
         * @param {function|string|number} [all] The all value.
         * @return {cgf.visual.Sides|function|string|number}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property allSides
         */
        cgf_visual_props.allSides,

        /**
         * Gets or sets the left side size.
         *
         * This is the template accessor
         * of property {@link cgf.visual.props.left}.
         *
         * @name cgf.visual.Sides#left
         * @method
         * @param {function|string|number} [left] The left value.
         * @return {cgf.visual.Sides|function|string|number}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property left
         */
        cgf_visual_props.left,

        /**
         * Gets or sets the top side size.
         *
         * This is the template accessor
         * of property {@link cgf.visual.props.top}.
         *
         * @name cgf.visual.Sides#top
         * @method
         * @param {function|string|number} [right] The top value.
         * @return {cgf.visual.Sides|function|string|number}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property top
         */
        cgf_visual_props.top,

        /**
         * Gets or sets the right side size.
         *
         * This is the template accessor
         * of property {@link cgf.visual.props.right}.
         *
         * @name cgf.visual.Sides#right
         * @method
         * @param {function|string|number} [right] The right value.
         * @return {cgf.visual.Sides|function|string|number}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property right
         */
        cgf_visual_props.right,

        /**
         * Gets or sets the bottom side size.
         *
         * This is the template accessor
         * of property {@link cgf.visual.props.bottom}.
         *
         * @name cgf.visual.Sides#bottom
         * @method
         * @param {function|string|number} [bottom] The bottom value.
         * @return {cgf.visual.Sides|function|string|number}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property bottom
         */
        cgf_visual_props.bottom
    ],
    element: {
        /**
         * @class The element class of the {@link cgf.visual.Sides} template.
         * @name cgf.visual.Sides.Element
         *
         * @property {number} all Gets the resolved "all sides" size.
         *
         * This is the element getter
         * of property {@link cgf.visual.props.allSides}.
         *
         * @property {number} left Gets the resolved left side size.
         *
         * This is the element getter
         * of property {@link cgf.visual.props.left}.
         *
         * @property {number} right Gets the resolved right side size.
         *
         * This is the element getter
         * of property {@link cgf.visual.props.right}.
         *
         * @property {number} top Gets the resolved top side size.
         *
         * This is the element getter
         * of property {@link cgf.visual.props.top}.
         *
         * @property {number} bottom Gets the resolved bottom side size.
         *
         * This is the element getter
         * of property {@link cgf.visual.props.bottom}.
         */
        methods: /** cgf.visual.Sides.Element# */{

            /**
             * Gets the sum of the resolved horizontal sides.
             *
             * @type {number}
             */
            get width() { return this.left + this.right; },

            /**
             * Gets the sum of the resolved vertical sides.
             *
             * @type {number}
             */
            get height() { return this.top + this.bottom; }
        }
    }
});

cgf.visual.Sides.type().add({
    defaults: new cgf.visual.Sides()
        .all(0)
        .left(cgf_getAll)
        .right(cgf_getAll)
        .top(cgf_getAll)
        .bottom(cgf_getAll)
});