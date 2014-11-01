
var cgf_Template = cgf.Template = cgf_TemplateMetaType.Ctor.configure({
    /**
     * Creates a template,
     * optionally given a configuration value.
     *
     * @constructor
     * @param {any} [config] A configuration value.
     *
     * @alias Template
     * @memberOf cgf
     *
     * @class This is the base abstract class of element templates.
     *
     * Element templates constrain the content structure and values of properties of elements.
     * A template defines rules for creating many elements when it is bound to data.
     */
    init: function(config) {

        // DOC ME!
        this._proto  = null;
        this._parent = null;
        this._props  = {};

        /**
         * Gets an ordered map of complex adhoc property infos, by full name, or _nully_, if none.
         * @name _complexAdhocProps
         * @type def.OrderedMap
         * @private
         */

        /**
         * Gets the child index of this template in its parent template, if any, or `-1`, if none.
         *
         * This property is immutable.
         *
         * @type number
         */
        this.childIndex = -1;

        /**
         * Gets the element class of this template instance,
         * or `null`, if not yet initialized.
         *
         * The element class of this template instance,
         * derives from its template class' own
         * element class, stored at {@link cgf.Template.Element}.
         *
         * This class is created lazily when the first element
         * of this template instance is created,
         * through {@link cgf.Template#createElement}.
         *
         * @type Function
         */
        this.Element = null;
    },

    methods: /** @lends cgf.Template# */{

        // -------------------
        // parent related

        /**
         * Gets the parent template, or `null`, if none.
         *
         * @type cgf.Template
         */
        get parent() {
            return this._parent;
        },

        /**
         * Sets the parent template.
         *
         * @parent {cgf.Template} The parent template.
         * @throws {def.error.argumentRequired} When argument <i>parent</i> is not specified.
         * @throws {def.error.operationInvalid} When the template already has a different parent.
         */
        set parent(parent) {
            if(!parent) throw def.error.argumentRequired('parent');

            var current = this._parent;
            if(current) {
                if(current !== parent) throw def.error.operationInvalid("The parent template cannot be changed.");
                return;
            }

            this._onParentChanging(parent, current);

            this._parent = parent;
        },

        /**
         * Called when the parent template is about to change.
         *
         * @param {cgf.Template} newParent The new parent.
         * @param {cgf.Template} oldParent The old parent, or _nully_, when none.
         *
         * @protected
         * @virtual
         */
        _onParentChanging: function(newParent, oldParent) {
            var proto = this._proto,
                protoIsParent = !!proto &&
                    ((proto === cgf_protoParent) || (proto === oldParent));

            if(protoIsParent) this._proto = newParent || cgf_protoParent;
        },

        // -------------------
        // proto & extend

        /**
         * Gets or sets a template's _prototype_ template.
         *
         * @param {cgf.Template} [proto] The new prototype template.
         * If `null`, the prototype template is cleared.
         * If the special {@link cgf.proto.parent} value is provided,
         * the prototype is set to this template's parent template.
         *
         * @return {cgf.Template} When set, this instance;
         * when get, the current prototype template.
         */
        proto: function(proto) {
            if(arguments.length) {
                this._proto = (proto === cgf_protoParent && this._parent)
                    ? this._parent
                    : proto;

                return this;
            }

            return (this._proto === cgf_protoParent) ? null : this._proto;
        },

        /**
         * Gets or sets a template's <i>prototype</i> template.
         *
         * This method exists for compatibility with
         * the {@link http://mbostock.github.com/protovis/ protovis} library.
         *
         * @deprecated Use {@link cgf.Template#proto} instead.
         * @method
         * @param {cgf.Template} [proto] The new prototype template.
         *
         * @return {cgf.Template} When set, this instance;
         * when get, the current prototype template.
         */
        extend: def.configurable(false, function(proto) {
            return this.proto.apply(this, arguments);
        }),

        // -------------------
        // get & set related

        /**
         * Creates an adhoc property info for a given property.
         *
         * @param {cgf.Property} prop The property.
         * @return {cgf.PropertyInfo} The property info.
         * @private
         */
        _createAdhocInfo: function(prop) {
            var isComplex;
            return {
                prop: prop,
                get isComplex() {
                    if(isComplex == null) isComplex = def.isSubClassOf(prop.type, cgf_Template);
                    return isComplex;
                },
                isAdhoc: true,
                registered: false // when complex, indicates if already registered in _complexAdhocProps.
            };
        },

        /**
         * Gets a property info for a given property.
         *
         * If the property is registered in the template class,
         * the class property info is returned.
         * Otherwise, and adhoc property info is created and returned.
         *
         * Adhoc property infos of complex properties are cached, in {@link cgf.Template#_complexAdhocProps},
         * whenever they result in the addition of a child template
         * (see {@link cgf.Template#_onChildAdded}.
         *
         * @param {cgf.Property} prop The property.
         * @return {cgf.PropertyInfo} The property info.
         * @private
         */
        _getInfo: function(prop) {
            var info = this.constructor.meta.props.get(prop.shortName);
            if(!info) {
                // Reuse registered adhoc complex property infos.
                var adhocs = this._complexAdhocProps;
                if(adhocs) info = adhocs.get(prop.fullName);

                if(!info) info = this._createAdhocInfo(prop);
            }
            return info;
        },

        /**
         * Gets the value of the specified property.
         *
         * @param {cgf.property} prop The property.
         * @return {any} The value of the property in this template, or `undefined`,
         * if not present.
         */
        get: function(prop) {
            return this._get(this._getInfo(prop));
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
            if(value !== undefined) this._set(this._getInfo(prop), value);
            return this;
        },

        _get: function(propInfo) {
            if(propInfo.isComplex) return this._getComplex(propInfo);

            var value = this._props[propInfo.prop.fullName];
            if(value) return value.value;
        },

        _getComplex: function(propInfo) {
            var prop = propInfo.prop,
                value = this._props[prop.fullName];

            // Should an empty array be returned? Yes.
            // Or a present, single value, property.
            if(prop.isList || value) return value;

            // For class-registered properties,
            //  auto create the value when null.
            if(!propInfo.isAdhoc) return this._createComplex(propInfo, prop.type/*, config: null*/);
        },

        _set: function(propInfo, value) {
            if(value !== undefined) {
                if(propInfo.isComplex)
                    this._setComplex(propInfo, value);
                else
                    this._setSimple(propInfo, value);
            }

            return this;
        },

        _setSimple: function(propInfo, value) {
            var props = this._props,
                prop  = propInfo.prop,
                fullName = prop.fullName,
                valueInfo;

            if(value === null) {
                // Reset local value; Inherit.
                valueInfo = null;
            } else {
                var isFun, callsBase, propBase;
                if((isFun = def.fun.is(value))) {
                    if((callsBase = cgf_delegates(value))) propBase = props[fullName];
                } else if(prop.cast) {
                    value = cgf_castValue(value, prop.cast);
                    // Failed cast. Do nothing.
                    if(value === null) return this;
                    // NOTE: it can be a function now, but it's taken as a constant value.
                }

                // value != null
                valueInfo = { // simple value info; supports delegation.
                    value:     value, // after cast, when constant
                    isFun:     isFun,
                    callsBase: callsBase || false,
                    base:      propBase  || null
                };
            }

            props[fullName] = valueInfo;
        },

        _setComplex: function(propInfo, value) {
            var prop = propInfo.prop;

            // A complex (template) value property.

            // Can be a list property.
            // Complex values do not accept functions.
            // Only simple properties can be evaluated dynamically, that way.

            // A complex value, can be:
            // * a Template constructor
            //   * .add(Foo)
            //   * .set(cgf.props.children, Foo)
            //   * .children(Foo)
            // * a Template instance
            //   * .add(new Foo(config))
            // * an array of Template constructors and/or template instances...
            if(value == null) {
                // Cannot remove list items this way => Noop.

                // TODO: Setting single complex property to null.

                // Nullifying implies parents would need to change...
                //if(!prop.isList) {
                // Ignore, for now.
                //props[fullName] = null;
                //}
                return null;
            }

            // A Template class?
            if(def.fun.is(value)) {
                return this._createComplex(propInfo, /*Template:*/value /*, config: null*/);
            }

            // An instance of the property's template type?
            if(def.is(value, prop.type)) {
                value.parent = this;
                return this._setComplexSlot(propInfo, value);
            }

            // A configuration object?
            if(def.object.isNative(value)) {
                // If it has a $type property, then create the instance.
                // It gets linked with the current value, through proto.
                var $type = value.$type;
                if($type != null) {
                    if(!def.fun.is($type))
                        throw def.error.argumentInvalid('$type', "Not a template class or factory function.");

                    return this._createComplex(propInfo, /*Template:*/$type, /*config:*/value);
                }

                // Configure the existing value, if any, or
                // create a new one, if possible, and
                // configure it.
                var config = value;

                // Lists always add a new value and configure it.
                if(!prop.isList && (value = this._props[prop.fullName]))
                    return def.configure(value, config);

                // Can we create a new value?
                if(prop.factory)
                    return this._createComplex(propInfo, prop.factory, config);

                throw def.error.argumentInvalid(prop.fullName, "There's no value to configure.");
            }

            // An array of values?
            if(prop.isList && def.array.is(value)) {
                return value.map(function(valuei) {
                    return this._setComplex(propInfo, valuei);
                }, this);
            }

            // Oops...
            throw def.error.argumentInvalid(prop.fullName, "Invalid value.");
        },

        /**
         * Creates an instance of a specified {@link cgf.Template} sub-class or factory function.
         *
         * Assigns the new instance's {@link cgf.Template#parent} property.
         * Assigns the new instance's {@link cgf.Template#proto} property
         * to either the property's existing value, or if none,
         * the value of that property in the template class' _defaults_ instance,
         * if any.
         *
         * @param {cgf.PropertyInfo} propInfo The info of the property.
         * @param {function} Template The template class constructor or a factory function.
         * @param {any} [config] A configuration value.
         *
         * @return {cgf.Template} The new child template.
         * @private
         */
        _createComplex: function(propInfo, Template, config) {
            var prop = propInfo.prop,
                child;

            if(Template.meta) {
                if(!def.isSubClassOf(Template, prop.type))
                    throw def.error.operationInvalid("Constructor is not a sub-class of a certain cgf.Template sub-class.");

                child = new Template(config);
            } else {
                // Assume it is a factory of templates.
                child = Template(config);
                if(!def.is(child, prop.type))
                    throw def.error.operationInvalid("Factory expected to create instances of a certain sub-class of cgf.Template.");
            }

            child.parent = this; // throws if already has a != parent

            // Set the prototype
            if(!prop.isList && !child.proto()) {
                var proto = this._props[prop.fullName];
                if(!proto) {
                    var defaultsTemplate = prop.type.defaults;
                    if(defaultsTemplate) proto = defaultsTemplate.get(prop);
                }

                if(proto) child.proto(proto);
            }

            return this._setComplexSlot(propInfo, child);
        },

        _setComplexSlot: function(propInfo, child) {
            var prop = propInfo.prop;
            if(prop.isList)
                // TODO: review the name of this property
                child.childIndex = def.array.lazy(this._props, prop.fullName).push(child) - 1;
            else
                this._props[prop.fullName] = child;

            this._onChildAdded(child, propInfo);

            return child;
        },

        /**
         * Called for each added child template.
         *
         * @param {cgf.Template} child The just added child template.
         * @param {cgf.PropertyInfo} propInfo The info of the property to which child was added.
         *
         * @protected
         * @virtual
         */
        _onChildAdded: function(child, propInfo) {
            if(propInfo.isAdhoc && !propInfo.registered) {

                // Register adhoc complex properties,
                // so that these are also handled in the spawn phase.
                var adhocs = this._complexAdhocProps;
                if(!adhocs) this._complexAdhocProps = adhocs = new def.OrderedMap();

                adhocs.add(propInfo.prop.fullName, propInfo);

                propInfo.registered = true;
            }
        },

        // -------------------
        // content & add

        /**
         * Adds one template to the generic _content_ property.
         *
         * This method is not configurable.
         * Use method {@link cgf.Template#content} for that purpose.
         *
         * @method
         *
         * @param {function} child A template instance,
         * a template _constructor_ function, or
         * a configuration object.
         *
         * @return {cgf.Template} The new template.
         * @virtual
         * @throws {def.error.argumentRequired} If <i>child</i> is not specified.
         * @throws {def.error.argumentInvalid} If <i>child</i> is of an invalid type.
         *
         * @example <caption>Adding a child template.</caption>
         * // A custom template class.
         * var Circle = cgf.AdhocTemplate.extend({
         *    properties: [
         *       cgf.property('radius', Number)
         *    ]
         * });
         *
         * var root = new cgf.AdhocTemplate();
         *
         * // Add a child of type Circle
         * // and fluently continue configuring it.
         * root.add(Circle)
         *     .radius(function(scene, index) {
         *         return 5 + index;
         *     });
         */
        add: def.configurable(false, function(child) {
            if(!child) throw def.error.argumentRequired('child');

            // Or an array could be returned...
            if(def.array.is(child)) throw def.error.argumentInvalid('child', "Cannot be an array.");

            var propInfo = this._getInfo(cgf_props.content);
            return this._setComplex(propInfo, child);
        }),

        /** @private */
        _initElemClass: function() {
            return (this.Element = this.constructor.meta._buildElemClass(this));
        },

        /**
         * Creates an element of this template's element class,
         * optionally given a parent element, a scene and a scene index.
         *
         * @method
         * @param {cgf.Element} [parentElem=null] The parent element of the new element.
         * @param {object} [scene=null] The scene of the new element.
         * @param {number} [index=-1] The index of the scene specified in argument `scene`.
         *
         * @return {cgf.Template.Element} The new element of
         * the class of element of this template: {@link cgf.Template#Element}.
         */
        createElement: def.configurable(false, function(parentElem, scene, index) {
            var Element = this.Element || this._initElemClass();
            return new Element(parentElem, scene, index);
        }),

        // This method is generated in #_buildElemClass.
        // _eval_scenes: function() {},

        // DOC ME!
        evalScenes: def.configurable(false, function(parentScene) {
            // Also creates _eval_scenes
            if(!this.Element) this._initElemClass();

            // Evaluate `scenes` having as JS context an object with scene and index properties.
            // This allows us to reuse the way properties are compiled - assuming an Element as JS context.
            // Could/Should we be receiving a parentIndex as well?
            // In that case, could we be receiving a parentElem.
            // There's not always a parentElem, specially at the root.
            // A non-templated element could be specified...
            return this._eval_scenes.call({scene: parentScene || null, index: -1});
        }),

        /**
         * Generates a list of elements of this template,
         * given the specified parent scene.
         *
         * @method
         * @param {object} [parentScene] The parent scene,
         * in which this template's `scenes` property is evaluated to
         * obtain the scenes to spawn this template with.
         *
         * @return {Array.<cgf.Template.Element>} An array of elements of
         * the class of element of this template: {@link cgf.Template#Element}.
         *
         * @see cgf.Template#createElement
         */
        spawn: def.configurable(false, function(parentScene) {
            return this.spawnScenes(/*parentElem*/null, this.evalScenes(parentScene));
        }),

        // DOC ME!
        spawnScenes: def.configurable(false, function(parentElem, scenes) {
            if(!scenes) throw def.error.argumentRequired("scenes");

            return scenes.map(function(scene, index) {
                return this.createElement(parentElem, scene, index);
            }, this);
        })
    }
});


/**
 * Root namespace for standard **CGF** properties.
 *
 * @name cgf.props
 * @namespace
 */
var cgf_props = cgf.props = /** @lends cgf.props */{

    // TODO: make scenes property accept enumerables?

    /**
     * DOC ME: The `scenes` property is core to **CGF**.
     *
     * @type cgf.Property
     */
    scenes: cgf.property('scenes'),

    /**
     * DOC ME: The `applicable` property is core to **CGF**.
     *
     * It has the cast function `Boolean`.
     *
     * @type cgf.Property
     */
    applicable: cgf.property('applicable', Boolean),

    /**
     * DOC ME: The `content` property is core to **CGF**.
     *
     * It is a list property of items of type {@link cgf.Template}.
     *
     * @type cgf.Property
     */
    content: cgf.property('content', {
        // Abstract property type.
        // No way to auto-create.
        type:   cgf_Template,
        isList: true
    })
};

cgf_Template.properties([
    /**
     * Gets or sets the scene values that
     * spawn the elements of a template instance.
     *
     * This is the template accessor
     * of property {@link cgf.props.scenes}.
     *
     * @name cgf.Template#scenes
     * @method
     * @param {function|Array|any} [scenes] An array of scenes, a scene, or,
     * a function that given a parent scene returns one scene,
     * or an array of scenes.
     *
     * @return {function|Array|cgf.Template}
     * When getting, the value of the property,
     * when setting, the `this` value.
     *
     * @template-property scenes
     */
    cgf_props.scenes,

    /**
     * Gets or sets the "applicable" value or
     * element evaluator function.
     *
     * This is the template accessor
     * of property {@link cgf.props.applicable}.
     *
     * @name cgf.Template#applicable
     * @method
     * @param {function|boolean} [applicable] A boolean value or function.
     * @return {function|boolean|cgf.Template}
     * When getting, the value of the property,
     * when setting, the `this` value.
     *
     * @template-property applicable
     */
    cgf_props.applicable,

    cgf_props.content
]);

// Set a global defaults instance.

cgf_Template.type().add({
    defaults: new cgf_Template()
        // TODO: document these defaults.
        // Default behavior is to propagate the parent scene,
        // spawning a single child of this (child) template meta-type.
        // This is ok for multiple instancing templates, but not for single-instacing ones,
        // like ValueTemplate's.
        .scenes(function(parentScene) { return [parentScene]; })
        .applicable(true)
});

// ------------------

function cgf_protoResolve(proto, parent) {
    return (proto === cgf_protoParent ? parent : proto) || null;
}
