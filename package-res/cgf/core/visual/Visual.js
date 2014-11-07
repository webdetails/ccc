var cgf_visual_Visual = cgf.Visual = cgf.visual.Visual = cgf_dom_EntityTemplate.extend();

cgf_visual_Visual
    /**
     * Creates a visual,
     * optionally given a configuration value.
     *
     * @constructor
     * @param {any} [config] A configuration value.
     *
     * @name cgf.visual.Visual
     *
     * @class A visual is a template that has a visual representation.
     * Elements spawned by a visual template can be rendered, using a _d3_.
     *
     * @extends cgf.dom.EntityTemplate
     * @abstract
     */
    .init(function(config) {

        this.base(config);

        this._childrenVisual = []; // TODO: -> VisualParent mixin...

        this.render = this.render.bind(this);
    })

    .properties([
        // TODO: DOC ME
        (cgf_visual_props.visible = cgf.dom.property("visible", Boolean)),
        (cgf_visual_props.styleClassName = cgf.dom.property("styleClassName", String ))
    ])

    .add(/** @lends cgf.visual.Visual# */{
        /**
         * Gets the tag name of the main DOM element rendered by this template.
         *
         * Must be a non-empty string.
         *
         * @name cgf.visual.Visual#tagName
         * @type string
         * @abstract
         */

        /**
         * Gets the template's _main_ DOM element's style class name, if any.
         *
         * Note that this is different from the Visual element's
         * {@link cgf.visual.props.styleClassName} property,
         * which is evaluated for each element instance.
         *
         * This getter should be overridden  to provide a class, or classes,
         * that are specific to the template class,
         * to allow styling of its elements.
         *
         * Multiple classes should be separated using spaces.
         *
         * The default implementation returns no style class name.
         *
         * @type string
         */
        get styleClassName() { return ""; },

        /**
         * Renders the visual in the provided _d3_ update selection.
         *
         * This method can be called freely on any `this` context,
         * which makes it ideal for passing it to d3.Selection#call.
         *
         * @example <caption>Calling <i>render</i> using a d3 selection's <i>call</i> method.</caption>
         * var root = new cgf.visual.Canvas();
         *
         * d3.select('#example')
         *   .data([1, 2])
         *   .call(root.render);
         *
         * @see cgf.render
         *
         * @method
         *
         * @param {d3.Selection} d3SelUpd The d3 update selection object.
         * @return {cgf.visual.Visual} The `this` value.
         */
        render: def.configurable(false, function(d3SelUpd) {
            this._render(d3SelUpd);
            return this;
        }),

        /**
         * Actually renders a visual in a _d3_ update selection.
         *
         * @param {d3.Selection} d3SelUpd The d3 update selection object.
         * @protected
         * @virtual
         */
        _render: function(d3SelUpd) {
            this._renderEnter(d3SelUpd.enter());

            this._renderEnterOrUpdate(d3SelUpd);

            this._renderExit(d3SelUpd.exit());
        },

        _renderEnter: function(d3SelEnter) {
            return d3SelEnter.append(this.tagName)
                .attr("class", function(elem) {
                    return def.string.join(" ", elem.template.styleClassName, elem.styleClassName);
                });
        },

        _renderEnterOrUpdate: function(d3SelUpd) {
            return d3SelUpd;
        },

        _renderExit: function(d3SelExit) {
            d3SelExit.remove();
            return d3SelExit;
        }
    })

    .type().add({
        defaults: new cgf_visual_Visual()
            .proto(cgf_dom_Template.defaults)
            .visible(true)
    });

