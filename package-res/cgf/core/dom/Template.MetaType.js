
/**
 * @name cgf.dom.TemplatePropertySpec
 * @class Contains the options required to associate a property with a template.
 *
 * @property {cgf.dom.Property} prop The associated property.
 *
 * @property {boolean} hasInteraction Indicates if the property has
 *  separate stable and interaction values, or only stable values.
 *  By default, a property has both stable and interaction values.
 *
 * @property {string} builderStable The name of the stable value builder.
 *  The name of the actual builder method is
 *  the upper-cased builder name prefixed with "_build".
 *
 *  A builder cannot be used simultaneously as a stable and an interaction builder.
 *
 * @property {string} builderInteraction The name of the interaction value builder.
 *  The name of the actual builder method is
 *  the upper-cased builder name prefixed with "_build".
 *
 *  A builder cannot be used simultaneously as a stable and an interaction builder.
 *
 *  This option cannot be specified non-empty, when _hasInteraction_ is `false`.
 */

/**
 * Creates a meta-type for a {@link cgf.dom.Template} derived type.
 *
 * @name cgf.dom.Template.MetaType
 *
 * @param {function} [Ctor=null] The corresponding constructor function.
 *
 * To create the {@link cgf.dom.Template} class and its derived classes, <tt>null</null> is passed in this argument
 * and a default constructor is automatically created by {@link def.MetaType}.
 *
 * @param {def.MetaType} [baseType=null] The base type object, if any.
 * @param {object} [keyArgs=null] Optional keyword arguments.
 *
 * @see def.MetaType
 *
 * @constructor
 * @extends def.MetaType
 */
function cgf_dom_TemplateMetaType(Ctor, baseType, keyArgs) {

    def.MetaType.apply(this, arguments);

    // Inherit base properties and
    // base Element class
    // from a base Template.MetaType.
    var baseMetaType = this.baseType,
        builders = new def.OrderedMap(),
        props, Template, Element;

    if(baseMetaType instanceof cgf_dom_TemplateMetaType) {
        props = new def.OrderedMap(baseMetaType.props);

        // Inherit builder infos.
        baseMetaType.builders.forEach(function(baseBuilder, name) {
            builders.add(name, {
                name:      name,
                vlayer:    baseBuilder.vlayer,
                propInfos: baseBuilder.propInfos.slice()
            });
        });

        Element = baseMetaType.Ctor.Element.extend();
    } else {
        props = new def.OrderedMap();

        Element = cgf_dom_TemplatedElement;
    }

    /**
     * Gets an ordered map having the property info instances.
     *
     * The map has the properties' short name as keys
     * and is ordered by property definition order.
     * @memberOf cgf.dom.Template.MetaType#
     * @type def.OrderedMap
     */
    this.props = props;

    /**
     * Gets an ordered map having the builder info instances.
     *
     * The map has the builders names as keys
     * and is ordered by builder definition order.
     *
     * @memberOf cgf.dom.Template.MetaType#
     * @type def.OrderedMap
     */
    this.builders = builders;

    Template = this.Ctor;

    Template.Element = Element;

    /**
     * Gets the template constructor function that owns
     * this element class.
     *
     * @name cgf.dom.Element.Template
     * @type function
     */
    Element.Template = Template;
}

// Wires-up cgf.dom.Template.MetaType  to inherit from def.MetaType.
def.MetaType.subType(cgf_dom_TemplateMetaType, {
    // Notice, below, every public property is proxied automatically to the Template
    // (or derived) constructor function.
    methods: /** @lends cgf.dom.Template.MetaType# */{
        // defaults: added below

        /**
         * Configures the array of constructor initialization steps
         * of every template-derived class.
         *
         * @private
         *
         * @param {Array.<function>} steps The array of constructor initialization steps.
         *
         * @memberOf cgf.dom.Template.MetaType
         * @override
         * @see def.MetaType#_addInitSteps
         * @ignore
         */
        _addInitSteps: function(steps) {
            // Called after post steps are added.

            // Last thing to initialize is configuration.
            function initConfig(config) {
                if(config) def.configure(this, config);
            }

            steps.push(initConfig);

            // `base` adds init steps.
            this.base(steps);
        },

        /**
         * Obtains the element constructor function of this template class.
         *
         * Use this property to customize the
         * associated {@link cgf.dom.Template.Element}'s class.
         *
         * @example <caption>Customizing the associated Element class.</caption>
         * var Section = cgf.dom.Template.extend({
         *     properties: [
         *         cgf.dom.property('startAngle', Number),
         *         cgf.dom.property('endAngle', Number)
         *     ],
         *
         *     // Members of Section template instances
         *     methods: {
         *         // ...
         *     },
         *
         *     // Configure the Elements' class
         *     element: {
         *        // Members of the spawned elements.
         *        methods: {
         *            get midAngle() { return (this.startAngle + this.endAngle) / 2; }
         *        }
         *     }
         * });
         *
         * var section = new Section()
         *      .startAngle(0)
         *      .endAngle(Math.PI);
         *
         * var sectionElem = section.createElement();
         *
         * expect(sectionElem.midAngle).toBe(Math.PI/2);
         *
         * @name cgf.dom.Template.element
         * @function
         * @return function
         */

        /**
         * Gets the element constructor function of this template class.
         * @method
         * @return {function} The element constructor function.
         * @see cgf.dom.Template.Element
         */
        element: def.configurable(true, function() {
            return this.Ctor.Element;
        }),

        /**
         * Adds properties to the template class.
         *
         * @example <caption>Defining a template class with custom properties.</caption>
         * var Shape = cgf.dom.Template.extend({
         *     properties: [
         *         cgf.dom.property('color', String),
         *         cgf.dom.property('size',  Number)
         *     ]
         * });
         *
         * var shape = new Shape()
         *    .color(function(s, i) { return (i % 2) ? 'green' : 'red'; })
         *    .size(19);
         *
         * @param {Array.<cgf.dom.Property>|cgf.dom.Property} [props] An array of properties, or a single property.
         *
         * @name cgf.dom.Template.properties
         * @function
         * @return {function} The template class constructor function.
         * @throws {def.error.argumentInvalid} If any of the specified properties is already a
         * property of the template class.
         */

        /**
         * Adds properties to the template class.
         *
         * @param {Array.<cgf.dom.Property>|cgf.dom.Property} [props] An array of properties, or a single property.
         *
         * @return {cgf.dom.Template.MetaType} This template meta-type.
         * @throws {def.error.argumentInvalid} If any of the specified properties is already a
         * property of the template class.
         * @see cgf.dom.Template.properties
         */
        properties: function(props) {
            if(props) def.array.each(props, this.property, this);
            return this;
        },

        /**
         * Adds a template property to the template class.
         *
         * An error is thrown if the specified property
         * is already part of the template class.
         *
         * ##### Remarks:
         *
         * A property accessor method is added to the template class,
         * having the name of the property's {@link cgf.dom.Property#shortName}.
         *
         * The element classes that are later generated,
         * for each instance of this template class,
         * will be given a get/set JavaScript property,
         * to access the value of the property.
         *
         * Adding a template property fixates the interpretation given
         * to its {@link cgf.dom.Property#shortName},
         * in this class, and any of its sub-classes, to refer to a certain property instance.
         * Derived classes cannot change this (i.e. technically, they could).
         *
         * Naming conflict problems can still arise if a base class,
         * later in time, adds a new property with a short name,
         * that some existing sub-class had already been using, for a different property.
         *
         * The only solution to guard against this possibility
         * is to not use the short name accessor altogether,
         * and use the generic get/set methods only.
         * This is not a practical solution. It's more worth to take the risk.
         *
         * @param {cgf.dom.Property} prop A property.
         *
         * @name cgf.dom.Template.property
         * @function
         * @return {function} The template class constructor function.
         * @throws {def.error.argumentInvalid} If the specified property is already a
         * property of the template class.
         */

        /**
         * Adds a template property to the template class.
         *
         * @param {cgf.dom.Property|cgf.dom.TemplatePropertySpec} templPropSpec
         * A property or a template property specification.
         *
         * @method
         * @return {cgf.dom.Template.MetaType} The `this` value.
         * @throws {def.error.argumentInvalid} If the specified property is already a
         * property of the template meta-type.
         *
         * @see cgf.dom.Template.property
         */
        property: def.configurable(false, function(templPropSpec) {
            if(!templPropSpec) throw def.error.argumentRequired('templPropSpec');

            var prop;
            if(def.is(templPropSpec, cgf_dom_property)) {
                prop = templPropSpec;
            } else {
                prop = templPropSpec.prop;
                if(!prop) throw def.error.argumentRequired('templPropSpec.prop');
            }

            var shortName = prop.shortName;
            if(this.props.has(shortName))
                throw def.error.argumentInvalid(
                    'prop',
                    "A property with local name '{0}' is already defined.",
                    [shortName]);

            var isScenes     = prop === cgf_dom_props.scenes,
                isStructural = !isScenes && def.isSubClassOf(prop.type, cgf_dom_Template),
                hasInteract  = def.nullyTo(templPropSpec.hasInteraction, !isStructural && !isScenes),
                builder1     = templPropSpec.builderInteraction,
                builder0     = templPropSpec.builderStable,
                builder0Info, builder1Info;

            if(hasInteract) {
                if(isStructural)
                    throw def.error.argumentInvalid(
                        'templPropSpec.hasInteraction',
                        "Structural properties cannot have interaction.");
            } else {
                if(builder1)
                    throw def.error.argumentInvalid(
                        'templPropSpec.interactionBuilder',
                        "Cannot have an interaction builder when !hasInteraction.");
            }

            if(builder0) {
                if((builder0Info = this.builders.get(builder0))) {
                   if(builder0Info.vlayer !== 0)
                       throw def.error.argumentInvalid(
                           'templPropSpec.stableBuilder',
                           "The specified stable builder is already an interaction builder.");
                } else {
                    this.builders.add(builder0, (builder0Info = {
                        name:       builder0,
                        methodName: "_build" + def.firstUpperCase(builder0),
                        vlayer:     0,
                        propInfos:  []
                    }));
                }
            }

            if(builder1) {
                if((builder1Info = this.builders.get(builder1))) {
                    if(builder1Info.vlayer !== 1)
                        throw def.error.argumentInvalid(
                            'templPropSpec.interactionBuilder',
                            "The specified interaction builder is already a stable builder.");
                } else {
                    this.builders.add(builder1, (builder1Info = {
                        name:      builder1,
                        methodName: "_build" + def.firstUpperCase(builder1),
                        vlayer:    1,
                        propInfos: []
                    }));
                }
            }

            var propInfo = {
                prop: prop,

                isStructural: isStructural,
                isEntity:  isStructural && def.isSubClassOf(prop.type, cgf_dom_EntityTemplate),
                isAdhoc:   false,

                builders: [builder0Info, builder1Info],
                hasInteraction: hasInteract
            };

            if(builder0Info) builder0Info.propInfos.push(propInfo);
            if(builder1Info) builder1Info.propInfos.push(propInfo);

            this.props.add(shortName, propInfo);

            this._setupTemplClassStableAccessor(shortName, propInfo);

            if(hasInteract)
                // e.g.:  .margin({width$: 1})
                this._setupTemplClassInteractionAccessor(shortName + "$", propInfo);

            return this;
        }),

        _setupTemplClassStableAccessor: function(name, propInfo) {

            function configStablePropAccessor(v) {
                return arguments.length
                    ? this._set(propInfo, v, /*vlayer:*/STABLE_LAYER)
                    : this._get(propInfo,    /*vlayer:*/STABLE_LAYER);
            }

            // Template#
            this.Ctor.method(name, configStablePropAccessor);
        },

        _setupTemplClassInteractionAccessor: function(name, propInfo) {

            function configInteractionPropAccessor(v) {
                return arguments.length
                    ? this._set(propInfo, v, /*vlayer:*/INTERA_LAYER)
                    : this._get(propInfo,    /*vlayer:*/INTERA_LAYER);
            }

            // Template#
            this.Ctor.method(name, configInteractionPropAccessor);
        },

        _buildElemClass: function(template) {
            var Element   = this.Ctor.Element.extend(),
                elemProto = Element.prototype,
                rootProto = def.rootProtoOf(elemProto),
                propsStaticStable = {};

            elemProto.template = template;
            elemProto._propsStaticStable = propsStaticStable;

            // Add methods for every template meta-type property,
            // with all values set in template.
            this.props.forEach(function(propInfo) {
                this._setupElemClassPropGetter(
                    elemProto,
                    propInfo,
                    template,
                    rootProto,
                    propsStaticStable);
            }, this);

            return Element;
        },

        _setupElemClassPropGetter: function(elemProto, propInfo, template, rootProto, propsStaticStable) {
            //  NOTE: The `scenes` property is special:
            //    it does not evaluate with an Element instance as the `this` context.
            //    It evaluates on a fake element object that has a scenes and an index property,
            //    with the values of the parent scene and the parent scene index.
            //    (see cgf.dom.Template#evalScenes)
            //
            //  Its evaluator method is published in `template`.
            //  Has no element getter.
            //  Each element has instead a property for its corresponding scene.

            var prop      = propInfo.prop,
                fullName  = prop.fullName,
                shortName = prop.shortName,

                // isScenes => !isStructural (and isStructural => !isScenes)
                isStructural = propInfo.isStructural,
                isScenes     = !isStructural && (prop === cgf_dom_props.scenes),

                // 1. Build evaluator functions.
                // May cause side-effects in template/propsStaticStable
                evalStable = buildValueTypeEvaluator(STABLE_LAYER),
                evalIntera = propInfo.hasInteraction
                    ? buildValueTypeEvaluator(INTERA_LAYER) : null;

            // 2. Install getter property in Element's class prototype.
            // The element class getter always gets the current value type,
            // starting from interactive, then stable, then default.

            if(!isScenes)
                Object.defineProperty(elemProto, shortName, {
                    enumerable:   true,
                    configurable: false,
                    get: this._buildElemClassPropGetter(propInfo, [evalStable, evalIntera]),
                    set: this._buildElemClassPropSetter(propInfo)
                });

            function buildValueTypeEvaluator(vlayer) {

                // Structural properties only have stable values.
                // Structural properties are never constant/shared.
                // assert vlayer === STABLE_LAYER
                // assert isFun
                if(isStructural) return cgf_buildPropStructEvaluator(propInfo);

                // isAtomic
                var evaluator = cgf_buildPropAtomicEvaluator(
                        template,
                        fullName,
                        shortName,
                        rootProto,
                        prop.cast,
                        vlayer);

                if(!evaluator) return null;

                var isFun = def.fun.is(evaluator);

                if(isScenes) {
                    // The scenes property is so special that the result of
                    // its evaluation isn't even stored in the elements' _props...
                    // assert vlayer === STABLE_LAYER

                    // TODO: do not need the box anymore on evaluator, for non-function values?
                    // If so, we can make this simpler with def.fun.as
                    template._eval_scenes = isFun
                        ? evaluator
                        : def.fun.constant(evaluator.value); // Use constant function anyway.

                    return null;
                }

                if(!isFun) {
                    // Constant
                    if(vlayer === INTERA_LAYER) {
                        // Interactive layer does not store constants specially.
                        // This layer will typically have function values.
                        evaluator = def.fun.constant(evaluator.value);
                    } else { // STABLE_LAYER
                        // Constant & Stable
                        propsStaticStable[fullName] = /** @type cgf.dom.Template.Element.PropertyValueHolder */{
                            value:      evaluator.value,
                            version:    Infinity,
                            evaluating: false // never is really; just for class-like completion
                        };

                        return null;
                    }
                }

                return evaluator;
            }
        },

        _buildElemClassPropGetter: function(propInfo, evaluators) {

            var stableVersionKey = propInfo.isStructural ? 0 : 2,
                fullName = propInfo.prop.fullName,
                builders = propInfo.builders.map(function(b) { return b && b.methodName; });

            return propGetter;

            function propGetter() {
                /** @this cgf.Template.Element */
                return getPropValue.call(this, this._vlayer);
            }

            function getVersion(elem, vlayer) {
                return elem._versions[/*intera*/vlayer ? 3 : stableVersionKey];
            }

            function getPropValue(vlayer) {
                // TODO: this needs to be better understood.
                // What default can/should be returned here?
                // def.nullyTo(this._propsStaticStable[fullName], null);
                if(vlayer < 0) return null;

                var propsLayer = this._props[vlayer],
                    holder  = propsLayer[fullName],
                    version, hversion, value, evaluator;

                // TODO: _evalInLayer called in sequence for evaluator and builder
                // causes two consecutive, unnecessary, vlayer switches.

                if(holder) {
                    if(isFinite((hversion = holder.version))) {
                        if(holder.evaluating)
                            // Reentering means getting the underlying value (stable, default).
                            // We don't immediately change this._vlayer; we do it lazily,
                            // if needed, whenever we call an evaluator/builder.
                            return getPropValue.call(this, vlayer - 1);

                        if(hversion >= (version = getVersion(this, vlayer)))
                            return holder.value;

                        // Existing value is invalid
                        // assert evaluator
                        holder.version = version; // TODO: version prior to evaluation...may change in between?
                        holder.evaluating = true;

                        try {
                            holder.value = value = this._evalInLayer(evaluators[vlayer], vlayer);
                        } finally {
                            holder.evaluating = false;
                        }
                    } else {
                        // Static/Stable holders have infinite version
                        // These have no evaluator (the reason why they are static...).
                        // But again, builders must be given the chance to change
                        // even static stable values.
                        value = holder.value;
                    }
                } else if((evaluator = evaluators[vlayer])) {
                    propsLayer[fullName] = holder = {
                        value:      undefined,
                        version:    getVersion(this, vlayer),
                        evaluating: true
                    };

                    try {
                        holder.value = value = this._evalInLayer(evaluator, vlayer);
                    } finally {
                        holder.evaluating = false;
                    }
                } else {
                    value = getPropValue.call(this, vlayer - 1);
                }

                // Call builder, if any, and it is not running already.
                if((builder = builders[vlayer])) {

                    // Having a builder actually requires storing a local value :-(
                    // This is because, otherwise, we don't know we've been here before
                    // and we end up evaluating the builder another/every time we read.
                    if(!holder || !isFinite(hversion)) propsLayer[fullName] = holder = {
                        value:      value,
                        version:    getVersion(this, vlayer),
                        evaluating: false
                    };

                    if(!this._evaluating[builder]) {
                        this._evaluating[builder] = true;

                        try {
                            this._evalInLayer(this[builder], vlayer);
                        } finally {
                            this._evaluating[builder] = false;
                        }

                        // Read value; may have been changed by builder.
                        value = holder.value;
                    }
                }

                return value;
            }
        },

        _buildElemClassPropSetter: function(propInfo) {
            var builders = propInfo.builders;
            if(!builders[0] && !builders[1]) return;

            var fullName = propInfo.prop.fullName,
                cast     = propInfo.prop.cast;

            return propSetter;

            function propSetter(value) {
                /** @this cgf.Template.Element */
                if(value !== undefined) {
                    var vlayer = this._vlayer;
                    if(DEBUG && vlayer < 0) throw def.error.operationInvalid("Cannot set layer.");

                    var propsLayer = this._props[vlayer],
                        holder  = propsLayer[fullName],
                        builder = builders[vlayer];

                    // Can only be called during builder execution.
                    if(!holder  || (DEBUG && !isFinite(holder.version)) ||
                       !builder || !this._evaluating[builder.methodName])
                       throw def.error.operationInvalid("Cannot set.");

                    // TODO: Assuming value is not a function...
                    if(cast) {
                        value = cgf_castValue(value, cast);
                        if(value == null) return; // Invalid
                    } else {
                        value = def.nullyTo(value, null);
                    }

                    holder.value = value;
                }
            }
        }
    }
});

// ---------------

var cgf_dom_Template = cgf.Template = cgf.dom.Template = cgf_dom_TemplateMetaType.Ctor;
