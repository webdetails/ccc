
/**
 * @name cgf.ParentVisual
 * @class A visual class that can be a parent of other visual elements.
 *
 * This class has the property {@link cgf.ParentVisual#size}.
 * @extends cgf.Visual
 */
var cgf_ParentVisual = cgf.ParentVisual = cgf_Visual.extend({
    properties: [
        cgf_props.size
    ],

    element: {
        methods: /** @lends cgf.ParentVisual */{
            /**
             */
            get contentWidth() {
                return this.size.width;
            },

            get contentHeight() {
                return this.size.height;
            }
        }
    }
});