
var cgf_Template = cgf.Template = cgf_TemplateMetaType.Ctor.configure({

    init: function(parent/*, config*/) {
        this._proto = null;

        this.parent = parent || null;
        this.childIndex = -1;

        this.children = [];

        // Built and set when creating the first element of this template instance.
        this.Element = null;

        this.render = this.render.bind(this);
    },

    methods: /** @lends cgf.Template# */{

        /**
         * Gets the value of the specified property.
         *
         * @param {cgf.property} prop The property.
         * @return {any} The value of the property in this template, or <tt>undefined</tt>,
         * if not present.
         */
        get: function(prop) {
            var valueInfo = cgf_propsPrivProp(this)[prop.fullName];
            if(valueInfo) return valueInfo.value;
        },

        /**
         * Sets the value of the specified property to the specified value.
         *
         * @param {cgf.property} prop The property.
         * @param {any} value The new value.
         *
         * @return {cgf.Template} This instance.
         */
        set: function(prop, value) {
            if(value !== undefined) {
                var props = cgf_propsPrivProp(this),
                    fullName = prop.fullName,
                    isFun, callsBase, propBase;

                if(value === null) {
                    // Reset local value; Inherit.
                    // How to set local to non-inherit and to its default? auto?
                    // Need explicit values on the property domain to do that.
                    props[fullName] = null;
                } else {
                    if((isFun = def.fun.is(value))) {
                        if((callsBase = cgf_delegates(value))) propBase = props[fullName];
                    } else if(prop.cast) {
                        value = cgf_castValue(value, prop.cast);
                        // Failed cast. Do nothing.
                        if(value === null) return this;
                        // NOTE: it can be a function now, but it's taken as a constant value.
                    }
                    // value != null
                    props[fullName] = {
                        value:     value, // after cast, when constant
                        isFun:     isFun,
                        callsBase: callsBase || false,
                        base:      propBase  || null
                    };
                }
            }
            return this;
        },

        /**
         * Gets or sets a template's <i>prototype</i> template.
         *
         * @param {cgf.Template} [_] The new prototype template.
         * If <tt>null</tt>, the prototype template is cleared.
         * If the special {@link cgf.proto.parent} value is provided,
         * the prototype is set to this template's parent template.
         *
         * @return {cgf.Template} When set, this instance, when get, the current prototype template.
         */
        proto: function(_) {
            if(arguments.length) return (this._proto = cgf_protoResolve(_, this.parent)), this;
            return this._proto;
        },

        /**
         * Gets or sets a template's <i>prototype</i> template.
         *
         * This method is kept for protovis compatibility.
         *
         * @deprecated Use {@link cgf.Template#proto} instead.
         * @method
         * @param {cgf.Template} [_] The new prototype template.
         *
         * @return {cgf.Template} When set, this instance, when get, the current prototype template.
         */
        extend: def.configurable(false, function(_) {
            return this.proto.apply(this, arguments);
        }),

        /**
         * Gets the child templates array or
         * adds child templates.
         *
         * @param {Array.<any>} [_] An array of child templates to add,
         * or a single child template.
         *
         * @return {Array.<cgf.Template>|cgf.Template} When set, this instance, when get, the current child templates.
         */
        content: function(_) {
            return arguments.length
                ? (def.array.each(_, function(child) { this.add(child); }, this), this)
                : this.children;
        },

        /**
         * Adds a child template of a specified type.
         *
         * Optionally, the new child template can be configured and
         * use a custom prototype template.
         *
         * @method
         *
         * @param {function} ChildTemplCtor The child template constructor function.
         * @param {object} [config] The child configuration object.
         *
         * @return {cdo.Template} The new child template.
         */
        add: def.configurable(false, function(ChildTemplCtor, config) {

            var child = cgf_template_create(ChildTemplCtor, this, config);

            child.childIndex = this.children.push(child) - 1;

            this._onChildAdded(child);

            return child;
        }),

        /** @virtual */
        _onChildAdded: function(child) {},

        _initElemClass: function() {
            return (this.Element = this.constructor.meta._buildElemClass(this));
        },

        createElement: def.configurable(false, function(parentElem, scene, index) {
            var Element = this.Element || this._initElemClass();
            return new Element(parentElem, scene, index);
        }),


        // This method is generated in #_buildElemClass.
        // _evalScenes: function() {},

        evalScenes: def.configurable(false, function(parentScene) {
            // Also creates _evalScenes
            if(!this.Element) this._initElemClass();

            // Evaluate `scenes` having as JS context an object with scene and index properties.
            // This allows us to reuse the way properties are compiled - assuming an Element as JS context.
            return this._evalScenes.call({scene: parentScene || null, index: -1});
        }),

        /**
         * Generates a list of elements of this template,
         * given the specified parent scene.
         *
         * @method
         * @param {object} [parentScene] The parent scene,
         * in which this template's <tt>scenes</tt> property is evaluated to
         * obtain the scenes to spawn this template with.
         *
         * @return {Array.<cgf.Element>} An array of elements of
         * the class of element of this template: {@link cgf.Template#Element}.
         */
        spawn: def.configurable(false, function(parentScene) {
            return this.spawnScenes(/*parentElem*/null, this.evalScenes(parentScene));
        }),

        spawnScenes: def.configurable(false, function(parentElem, scenes) {
            if(!scenes) throw def.error.argumentRequired("scenes");

            return scenes.map(function(scene, index) {
                return this.createElement(parentElem, scene, index);
            }, this);
        }),

        /**
         * Renders the template in the provided d3 update selection.
         *
         * This method can be called without care for the JavaScript instance.
         * This makes it ideal for passing it to d3.Selection#call, for example:
         * <pre>
         * var template = new d3.Template();
         *
         * d3.select('#example')
         *   .data([1, 2])
         *   .call(template.render);
         * </pre>
         *
         * @method
         *
         * @param {d3.Selection} d3Sel The d3 selection object.
         * @return {cgf.Template} <tt>this</tt> template.
         */
        render: def.configurable(false, function(d3UpdSel) {
            this._render(d3UpdSel);
            return this;
        }),

        _render: function(d3UpdSel) {
            // Do something
        }
    },

    properties: [cgf_props.scenes, cgf_props.applicable]
});

// Set a global defaults instance.

cgf_Template.type().add({
    defaults: new cgf_Template()
        // Default behavior is to propagate the parent scene,
        // spawning a single child of this (child) template meta-type.
        .scenes(function(parentScene) { return [parentScene]; })
        .applicable(true)
});

// ------------------

function cgf_protoResolve(proto, parent) {
    return (proto === cgf_protoParent ? parent : proto) || null;
}

// TODO: shouldn't this be a tryConfigure for the template class?
// ChildTemplCtor is a Template instance,
// a Template Ctor, or
// an object with a {$type: property}
// The type property either is a string with the name of the type or a Template Ctor.
// For now, only the Template Ctor is supported.

// TODO: template type registry? or some way directly handled by def.configure?

function cgf_template_create(ChildTemplCtor, parent, config) {
    var child;
    if(ChildTemplCtor instanceof cgf_Template) {
        child = ChildTemplCtor;
        if(child.parent !== parent)
            throw def.error.argumentInvalid("child", "Does not have this as parent.");
        // proto and config ignored
    } else if(def.fun.is(ChildTemplCtor)){
        child = new ChildTemplCtor(parent, config);
    } else {
        // Assume a configuration object. Ignore config.
        config = ChildTemplCtor;
        var $type = config.$type;
        if(def.fun.is($type)) {
            ChildTemplCtor = $type;
            child = new ChildTemplCtor(parent, config);
        } else {
            throw def.error.argumentInvalid('ChildTemplCtor', "$type is not a template class.");
        }
    }
    return child;
}
