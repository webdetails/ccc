var cgf_VisualContent = cgf.VisualContent = cgf_Visual.extend();

cgf_VisualContent
    /**
     * @name cgf.VisualContent
     * @class A visual content is a template that can be a child, or content, of another visual.
     * @extends cgf.Visual
     * @abstract
     */
    .properties([
        (cgf_props.margin = cgf.property("margin", {
            factory: def.fun.typeFactory(cgf.Sides)
        })),

        cgf_props.left,
        cgf_props.right,
        cgf_props.top,
        cgf_props.bottom
    ])

    .add(/** @lends cgf.VisualContent# */{
        /**
         * Ensures that the parent of a visual content template is a visual template.
         *
         * @param {cgf.EntityTemplate} newParent The new parent.
         *
         * @override
         * @throws {def.error.argumentInvalid} When argument <i>newParent</i> is not a visual template.
         */
        _onParentChanging: function(newParent) {

            if(newParent && !(newParent instanceof cgf_Visual))
                throw def.error.argumentInvalid("parent", "Must be a visual template.");

            this.base.apply(this, arguments);
        }
    });
