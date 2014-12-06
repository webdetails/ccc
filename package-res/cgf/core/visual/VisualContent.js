var cgf_visual_VisualContent =
defTemplate(cgf_visual, 'VisualContent', cgf_visual_Visual.extend());

cgf_visual_props.position = cgf.dom.property("position", {
        factory: def.fun.typeFactory(cgf_visual.SidesPart)
    });

cgf_visual_VisualContent
    /**
     * @name cgf.visual.VisualContent
     * @class A visual content is a template that can be a child, or content, of another visual.
     * @extends cgf.visual.Visual
     * @abstract
     */
    .properties([
        (cgf_visual_props.margin = cgf.dom.property("margin", {
            factory: def.fun.typeFactory(cgf.visual.SidesPart)
        })),
        {prop: cgf_visual_props.position, builderStable: '_layoutStable'}
    ])

    .add(/** @lends cgf.visual.VisualContent# */{
        /**
         * Ensures that the parent of a visual content template is a visual template.
         *
         * @param {cgf.dom.EntityTemplate} newParent The new parent.
         *
         * @override
         * @throws {def.error.argumentInvalid} When argument <i>newParent</i> is not a visual template.
         */
        _onParentChanging: function(newParent) {

            if(newParent && !(newParent instanceof cgf_visual_Visual))
                throw def.error.argumentInvalid("parent", "Must be a visual template.");

            this.base.apply(this, arguments);
        },

        left: function(v)  {
            return arguments.length
                ? (this.position().left(v), this)
                : this.position().left();
        },

        right: function(v)  {
            return arguments.length
                ? (this.position().right(v), this)
                : this.position().right();
        },

        top: function(v)  {
            return arguments.length
                ? (this.position().top(v), this)
                : this.position().top();
        },

        bottom: function(v)  {
            return arguments.length
                ? (this.position().bottom(v), this)
                : this.position().bottom();
        }
    });
