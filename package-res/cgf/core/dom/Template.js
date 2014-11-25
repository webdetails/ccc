
var STABLE_LAYER = 0,
    INTERA_LAYER = 1,

    STRUCT_STABLE_GROUP = 0,
    ATOMIC_STABLE_GROUP = 2,
    ATOMIC_INTERA_GROUP = 3;

// Variable declared in Template.MetaType.js
cgf_dom_Template
    /**
     * Creates a template,
     * optionally given a configuration value.
     *
     * @constructor
     * @param {any} [config] A configuration value.
     *
     * @name cgf.dom.Template
     *
     * @class This is the base abstract class of element templates.
     *
     * Element templates constrain the content structure and values of properties of elements.
     * A template defines rules for creating many elements when it is bound to data.
     */
    .init(function(config) {

        // DOC ME!
        this._proto  = null;
        this._parent = null;
        this._parentPropInfo = null;
        this._props  = {"0": {}, "1": {}}; // STABLE_LAYER, INTERA_LAYER

        /**
         * Gets an ordered map of structural adhoc property infos, by full name, or _nully_, if none.
         * @name cgf.dom.Template#_structuralAdhocProps
         * @type def.OrderedMap
         * @private
         */

        /**
         * Gets the child index of this template in its parent template, if any, or `-1`, if none.
         *
         * This property is immutable.
         *
         * @memberOf cgf.dom.Template#
         * @type number
         */
        this.childIndex = -1;

        /**
         * Gets the element class of this template instance,
         * or `null`, if not yet initialized.
         *
         * The element class of this template instance,
         * derives from its template class' own
         * element class, stored at {@link cgf.dom.Template.Element}.
         *
         * This class is created lazily when the first element
         * of this template instance is created,
         * through {@link cgf.dom.Template#createElement}.
         *
         * @memberOf cgf.dom.Template#
         * @type Function
         */
        this.Element = null;
    })

    .properties([
        /**
         * Gets or sets the scene values that
         * spawn the elements of a template instance.
         *
         * This is the template accessor
         * of property {@link cgf.dom.props.scenes}.
         *
         * @name cgf.dom.Template#scenes
         * @method
         * @param {function|Array|any} [scenes] An array of scenes, a scene, or,
         * a function that given a parent scene returns one scene,
         * or an array of scenes.
         *
         * @return {function|Array|cgf.dom.Template}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property scenes
         */
        cgf_dom_props.scenes,

        /**
         * Gets or sets the "applicable" value or
         * element evaluator function.
         *
         * This is the template accessor
         * of property {@link cgf.dom.props.applicable}.
         *
         * @name cgf.dom.Template#applicable
         * @method
         * @param {function|boolean} [applicable] A boolean value or function.
         * @return {function|boolean|cgf.dom.Template}
         * When getting, the value of the property,
         * when setting, the `this` value.
         *
         * @template-property applicable
         */
        cgf_dom_props.applicable,

        cgf_dom_props.content
    ])

    .add(/** @lends cgf.dom.Template# */{

        // -------------------
        // parent related

        // NOTE: properties do not support @throws
        /**
         * Gets the parent template.
         *
         * @type {cgf.dom.EntityTemplate}
         */
        get parent() {
            return this._parent;
        },

        /**
         * Gets the parent property of the parent template that contains this template.
         *
         * @type {cgf.dom.PropertyInfo}
         */
        get parentProperty() {
            return this._parentPropInfo;
        },

        /**
         * Sets the parent template and
         * the short name of the parent property which contains it.
         *
         * @param {cgf.dom.EntityTemplate} parent The parent template.
         * @param {cgf.dom.PropertyInfo} [parentPropInfo] The property info of the parent template
         * that contains this template.
         *
         * @throws {def.error.argumentRequired} When argument _parent_ is <i>nully</i>.
         * @throws {def.error.argumentInvalid} When in debug and argument _parent_ is not an entity template.
         * @throws {def.error.operationInvalid} When set to a parent other than the current one.
         */
        setParent: function(parent, parentPropInfo) {
            if(!parent) throw def.error.argumentRequired('parent', "Cannot set to null.");
            if(DEBUG && !(parent instanceof cgf_dom_EntityTemplate))
                throw def.error.argumentInvalid('parent', "Cannot set to a non-entity template.");

            var current = this._parent;
            if(current) {
                if(current !== parent)
                    throw def.error.operationInvalid("Cannot change the parent once set.");
                return;
            }

            if(!parentPropInfo) parentPropInfo = null;

            this._onParentChanging(parent, parentPropInfo, current);

            this._parent = parent;
            this._parentPropInfo = parentPropInfo;
        },

        /**
         * Called when the parent template is about to change.
         *
         * @param {cgf.dom.EntityTemplate} newParent The new parent.
         * @param {cgf.dom.PropertyInfo} [parentPropInfo] The property info of the parent template
         * that contains this template.
         *
         * @param {cgf.dom.EntityTemplate} oldParent The old parent, or _nully_, when none.
         *
         * @protected
         * @virtual
         */
        _onParentChanging: function(newParent, parentPropInfo, oldParent) {
            var proto = this._proto,
                protoIsParent = !!proto &&
                    ((proto === cgf_dom_protoParent) || (proto === oldParent));

            if(protoIsParent) this._proto = newParent || cgf_dom_protoParent;
        },

        // -------------------
        // proto & extend

        /**
         * Gets or sets a template's _prototype_ template.
         *
         * @param {cgf.dom.Template} [proto] The new prototype template.
         * If `null`, the prototype template is cleared.
         * If the special {@link cgf.dom.proto.parent} value is provided,
         * the prototype is set to this template's parent template.
         *
         * @return {cgf.dom.Template} When set, this instance;
         * when get, the current prototype template.
         */
        proto: function(proto) {
            if(arguments.length) {
                this._proto = (proto === cgf_dom_protoParent && this._parent)
                    ? this._parent
                    : proto;

                return this;
            }

            return (this._proto === cgf_dom_protoParent) ? null : this._proto;
        },

        /**
         * Gets or sets a template's <i>prototype</i> template.
         *
         * This method exists for compatibility with
         * the {@link http://mbostock.github.com/protovis/ protovis} library.
         *
         * @deprecated Use {@link cgf.dom.Template#proto} instead.
         * @method
         * @param {cgf.dom.Template} [proto] The new prototype template.
         *
         * @return {cgf.dom.Template} When set, this instance;
         * when get, the current prototype template.
         */
        extend: def.configurable(false, function(proto) {
            return this.proto.apply(this, arguments);
        }),

        // -------------------
        // get & set related

        // TODO: document cgf.dom.PropertyInfo; it has became public...!

        /**
         * Creates an adhoc property info for a given property.
         *
         * @param {cgf.dom.Property} prop The property.
         * @return {cgf.dom.PropertyInfo} The property info.
         * @private
         */
        _createAdhocInfo: function(prop) {
            var isStructural, isEntity;
            return {
                prop: prop,
                groupName: prop.group,
                get isStructural() {
                    if(isStructural == null) isStructural = def.isSubClassOf(prop.type, cgf_dom_Template);
                    return isStructural;
                },
                get isEntity() {
                    if(isEntity == null)
                        isEntity = this.isStructural && def.isSubClassOf(prop.type, cgf_dom_EntityTemplate);
                    return isEntity;
                },
                isAdhoc: true,
                builders: [null, null], // STABLE_LAYER, INTERA_LAYER
                hasInteraction: false,
                registered: false // when structural, indicates if already registered in _structuralAdhocProps.
            };
        },

        /**
         * Gets a property info for a given property.
         *
         * If the property is registered in the template class,
         * the class property info is returned.
         * Otherwise, and adhoc property info is created and returned.
         *
         * Ad-hoc property infos of structural properties are cached,
         * in {@link cgf.dom.Template#_structuralAdhocProps},
         * whenever they result in the addition of a child template
         * (see {@link cgf.dom.Template#_onChildAdded}.
         *
         * @param {cgf.dom.Property} prop The property.
         * @return {cgf.dom.PropertyInfo} The property info.
         * @private
         */
        _getInfo: function(prop) {
            var info = this.constructor.meta.props.get(prop.shortName);
            if(!info) {
                // Reuse registered adhoc structural property infos.
                var adhocs = this._structuralAdhocProps;
                if(adhocs) info = adhocs.get(prop.fullName);

                if(!info) info = this._createAdhocInfo(prop);
            }
            return info;
        },

        /**
         * Gets the stable or interaction value of the specified property.
         *
         * @param {cgf.dom.property} prop The property.
         * @param {number} [vlayer=0] The value layer: 0-stable, 1-interaction.
         * @return {any} The value of the property in this template, or `undefined`,
         * if not present.
         */
        get: function(prop, vlayer) {
            var propInfo = this._getInfo(prop);
            return this._get(propInfo, vlayer||STABLE_LAYER);
        },

        /**
         * Sets the stable or interaction value of the
         * specified property to the specified value.
         *
         * @param {cgf.dom.property} prop The property.
         * @param {any} value The new value.
         * @param {number} [vlayer=0] The value layer: 0-stable, 1-interaction.
         *
         * @return {cgf.dom.Template} This instance.
         */
        set: function(prop, value, vlayer) {
            if(value !== undefined) this._set(this._getInfo(prop), value, vlayer||STABLE_LAYER);
            return this;
        },

        _get: function(propInfo, vlayer) {
            if(propInfo.isStructural) {
                if(vlayer) //  !== 0
                    throw def.error.operationInvalid("Structural properties only have stable values.");
                return this._getStructural(propInfo);
            }

            var valueInfo = this._props[vlayer][propInfo.prop.fullName];
            if(valueInfo) return valueInfo.value;
        },

        _getStructural: function(propInfo) {
            var prop = propInfo.prop,
                value = this._props[STABLE_LAYER][prop.fullName];

            // Should an empty array be returned? Yes.
            // Or a present, single value, property.
            if(prop.isList || value) return value;

            // For class-registered properties,
            //  auto create the value when null.
            if(!propInfo.isAdhoc)
                return this._createStructural(propInfo, prop.type/*, config: null*/);
        },

        _set: function(propInfo, value, vlayer) {
            if(value !== undefined) {
                if(propInfo.isStructural)
                    this._setStructural(propInfo, value, vlayer);
                else
                    this._setAtomic(propInfo, value, vlayer);
            }

            return this;
        },

        _setAtomic: function(propInfo, value, vlayer) {
            var props = this._props[vlayer],
                prop  = propInfo.prop,
                fullName = prop.fullName,
                valueInfo;

            if(value === null) {
                // Reset local value; Inherit.
                valueInfo = null;
            } else {
                var isFun, callsBase, propBase, castReturnFunCount = 1;
                if((isFun = def.fun.is(value))) {
                    if((callsBase = cgf_delegates(value))) propBase = props[fullName];
                } else if(prop.cast) {
                    value = cgf_castValue(value, prop.cast);
                    // Failed cast. Do nothing.
                    if(value === null) {
                        // TODO: throw or log this
                        return this;
                    }

                    // NOTE: it can have become a function now.
                    if((isFun = def.fun.is(value)) && (callsBase = cgf_delegates(value))) {
                        propBase = props[fullName];
                        castReturnFunCount--;
                    }
                }

                // value != null
                valueInfo = { // atomic value info; supports delegation.
                    value:     value, // after cast, when constant
                    isFun:     isFun,
                    callsBase: callsBase || false,
                    base:      propBase  || null,

                    // Number of times that a cast evaluation is allowed to return a function,
                    // for further evaluation.
                    castReturnFunCount: castReturnFunCount
                };
            }

            props[fullName] = valueInfo;
        },

        _setStructural: function(propInfo, value) {
            var prop = propInfo.prop;

            // A structural (template) value property.

            // Can be a list property.
            // Structural values do not accept functions.
            // Only atomic properties can be evaluated dynamically, that way.

            // A structural value, can be:
            // * a Template constructor
            //   * .add(Foo)
            //   * .set(cgf.dom.props.children, Foo)
            //   * .children(Foo)
            // * a Template instance
            //   * .add(new Foo(config))
            // * an array of Template constructors and/or template instances...
            if(value == null) {
                // Cannot remove list items this way => Noop.

                // TODO: Setting single structural property to null.

                // Nullifying implies parents would need to change...
                //if(!prop.isList) {
                // Ignore, for now.
                //props[fullName] = null;
                //}
                return null;
            }

            // A Template class?
            if(def.fun.is(value))
                return this._createStructural(propInfo, /*Template:*/value /*, config: null*/);

            // An instance of the property's template type?
            if(def.is(value, prop.type)) {
                value.setParent(this, propInfo);
                return this._setStructuralSlot(propInfo, value);
            }

            // An array of values?
            if(prop.isList && def.array.is(value))
                return value.map(function(valuei) {
                    return this._setStructural(propInfo, valuei);
                }, this);

            // A configuration object?
            if(def.object.isNative(value)) {
                // If it has a $type property, then create the instance.
                // It gets linked with the current value, through proto.
                var $type = value.$type;
                if($type != null) {
                    if(!def.fun.is($type))
                        throw def.error.argumentInvalid('$type', "Not a template class or factory function.");

                    return this._createStructural(propInfo, /*Template:*/$type, /*config:*/value);
                }
            }

            // Configure the existing value, if any, or
            // create a new one, if possible, and
            // configure it.
            var config = value;

            // Lists always add a new value and configure it.
            if(!prop.isList && (value = this._props[STABLE_LAYER][prop.fullName]))
                return def.configure(value, config);

            // Can we create a new value?
            if(prop.factory)
                return this._createStructural(propInfo, prop.factory, config);

            throw def.error.argumentInvalid(prop.fullName, "There's no value to configure.");
        },

        /**
         * Creates an instance of a specified {@link cgf.dom.Template} sub-class or factory function.
         *
         * Assigns the new instance's {@link cgf.dom.Template#parent} property.
         * Assigns the new instance's {@link cgf.dom.Template#proto} property
         * to either the property's existing value, or if none,
         * the value of that property in the template class' _defaults_ instance,
         * if any.
         *
         * @param {cgf.dom.PropertyInfo} propInfo The info of the property.
         * @param {function} Template The template class constructor or a factory function.
         * @param {any} [config] A configuration value.
         *
         * @return {cgf.dom.Template} The new child template.
         * @private
         */
        _createStructural: function(propInfo, Template, config) {
            var prop = propInfo.prop,
                child;

            if(Template.meta) {
                if(!def.isSubClassOf(Template, prop.type))
                    throw def.error.operationInvalid("Constructor is not a sub-class of a certain cgf.dom.Template sub-class.");

                child = new Template(config);
            } else {
                // Assume it is a factory of templates.
                child = Template(config);
                if(!def.is(child, prop.type))
                    throw def.error.operationInvalid("Factory expected to create instances of a certain sub-class of cgf.dom.Template.");
            }

            child.setParent(this, propInfo); // throws if already has a != parent

            // Set the prototype
            if(!prop.isList && !child.proto()) {
                var proto = this._props[STABLE_LAYER][prop.fullName];
                if(!proto) {
                    var defaultsTemplate = prop.type.defaults;
                    if(defaultsTemplate) proto = defaultsTemplate.get(prop);
                }

                if(proto) child.proto(proto);
            }

            return this._setStructuralSlot(propInfo, child);
        },

        _setStructuralSlot: function(propInfo, child) {
            var prop = propInfo.prop;
            if(prop.isList)
                // TODO: review the name of this property
                child.childIndex =
                    def.array.lazy(this._props[STABLE_LAYER], prop.fullName).push(child) - 1;
            else
                this._props[STABLE_LAYER][prop.fullName] = child;

            this._onChildAdded(child, propInfo, STABLE_LAYER);

            return child;
        },

        /**
         * Called for each added child template.
         *
         * @param {cgf.dom.Template} child The just added child template.
         * @param {cgf.dom.PropertyInfo} propInfo The info of the property to which child was added.
         * @param {number} vlayer The value layer: 0-stable, 1-interaction.
         * @protected
         * @virtual
         */
        _onChildAdded: function(child, propInfo, vlayer) {
            if(propInfo.isAdhoc && !propInfo.registered) {

                // TODO: are all unregistered adhocs, also structural?

                // Register adhoc structural properties,
                // so that these are also handled in the spawn phase.
                var adhocs = this._structuralAdhocProps;
                if(!adhocs) this._structuralAdhocProps = adhocs = new def.OrderedMap();

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
         * Use method {@link cgf.dom.Template#content} for that purpose.
         *
         * @method
         *
         * @param {function} child A template instance,
         * a template _constructor_ function, or
         * a configuration object.
         *
         * @return {cgf.dom.Template} The new template.
         * @virtual
         * @throws {def.error.argumentRequired} If <i>child</i> is not specified.
         * @throws {def.error.argumentInvalid} If <i>child</i> is of an invalid type.
         *
         * @example <caption>Adding a child template.</caption>
         * // A custom template class.
         * var Circle = cgf.dom.EntityTemplate.extend({
         *    properties: [
         *       cgf.dom.property('radius', Number)
         *    ]
         * });
         *
         * var root = new cgf.dom.EntityTemplate();
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

            var propInfo = this._getInfo(cgf_dom_props.content);
            return this._setStructural(propInfo, child);
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
         * @param {cgf.dom.Element} [parentElem=null] The parent element of the new element.
         * @param {object} [scene=null] The scene of the new element.
         * @param {number} [index=-1] The index of the scene specified in argument `scene`.
         *
         * @return {cgf.dom.Template.Element} The new element of
         * the class of element of this template: {@link cgf.dom.Template#Element}.
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
         * Generates an element, or a list of elements, of this template,
         * given the specified parent scene.
         *
         * If the template's {@link cgf.dom.props.scenes} property
         * evaluated to an array of scenes,
         * then an array of child elements will be spawned.
         * Otherwise, if it evaluates to a single scene,
         * then a single element is spawned and returned.
         *
         * @method
         * @param {object} [parentScene] The parent scene,
         * in which this template's `scenes` property is evaluated to
         * obtain the scene or scenes to spawn this template with.
         *
         * @return {cgf.dom.Template.Element|Array.<cgf.dom.Template.Element>} An element or
         * array of elements of the class of element of this template: {@link cgf.dom.Template#Element}.
         *
         * @see cgf.dom.Template#createElement
         */
        spawn: def.configurable(false, function(parentScene) {
            return this.spawnScenes(/*parentElem*/null, this.evalScenes(parentScene));
        }),

        // DOC ME!
        spawnScenes: def.configurable(false, function(parentElem, scenes) {
            if(!scenes) throw def.error.argumentRequired("scenes");

            if(def.array.is(scenes))
                return scenes.map(function(scene, index) {
                    return this.createElement(parentElem, scene, index);
                }, this);

            return this.createElement(parentElem, scenes, 0);
        })
    })

    .type().add({
        // Set a global defaults instance.
        defaults: new cgf_dom_Template()
            // TODO: document these defaults.
            // Default behavior is to propagate the parent scene,
            // spawning a single child of this (child) template meta-type -
            // not an array of a single element...
            .scenes(function(parentScene) { return parentScene; })
            .applicable(true)
    });
