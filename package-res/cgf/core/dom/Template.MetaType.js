
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
        props, Template, Element;

    if(baseMetaType instanceof cgf_dom_TemplateMetaType) {
        props = new def.OrderedMap(baseMetaType.props);

        Element  = baseMetaType.Ctor.Element.extend();
    } else {
        props = new def.OrderedMap();

        Element  = cgf_dom_TemplatedElement;
    }

    /**
     * Gets an ordered map having the the property info instances.
     *
     * The map has the properties' short name as keys
     * and is ordered by property definition order.
     * @memberOf cgf.dom.Template.MetaType#
     * @type def.OrderedMap
     */
    this.props = props;

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
         * @param {cgf.dom.Property} prop A property.
         *
         * @method
         * @return {cgf.dom.Template.MetaType} The `this` value.
         * @throws {def.error.argumentInvalid} If the specified property is already a
         * property of the template meta-type.
         *
         * @see cgf.dom.Template.property
         */
        property: def.configurable(false, function(prop) {
            if(!prop) throw def.error.argumentRequired('prop');

            var shortName = prop.shortName;
            if(this.props.has(shortName))
                throw def.error.argumentInvalid(
                    'prop',
                    "A property with local name '{0}' is already defined.",
                    [shortName]);

            var isComplex = def.isSubClassOf(prop.type, cgf_dom_Template),
                propInfo = {
                    prop:      prop,
                    isComplex: isComplex,
                    isEntity:  isComplex && def.isSubClassOf(prop.type, cgf_dom_EntityTemplate),
                    isAdhoc:   false
                };

            this.props.add(shortName, propInfo);

            // Create configure accessor method in Template#
            function configPropAccessor(v) {
                return arguments.length ? this._set(propInfo, v) : this._get(propInfo);
            }

            this.Ctor.method(shortName, configPropAccessor);

            return this;
        }),

        _buildElemClass: function(template) {
            var Element = this.Ctor.Element.extend(),
                elemProto = Element.prototype,
                rootProto = def.rootProtoOf(elemProto),
                propsBase = {};

            elemProto.template   = template;
            elemProto._propsBase = propsBase;

            // Add methods for every template meta-type property,
            // with all values set in template.
            this.props.forEach(function(propInfo) {
                this._setupElemClassPropGetter(elemProto, propInfo, template, rootProto, propsBase);
            }, this);

            return Element;
        },

        _setupElemClassPropGetter: function(elemProto, propInfo, template, rootProto, propsBase) {
            var prop      = propInfo.prop,
                shortName = prop.shortName,
                evalName  = "_eval_" + shortName,
                fullName  = prop.fullName,
                isScenes  = prop === cgf_dom_props.scenes,
                evaluator = propInfo.isComplex
                    ? cgf_buildPropComplexEvaluator(propInfo)
                    : cgf_buildPropSimpleEvaluator(template, prop.fullName, rootProto, prop.cast);

            //  NOTE: The `scenes` property is special:
            //    it does not evaluate with an Element instance as the `this` context.
            //    It evaluates on a fake element object that has a scenes and an index property,
            //    with the values of the parent scene and the parent scene index.
            //    (see cgf.dom.Template#evalScenes)
            //
            //  Its evaluator method is published in `template`.
            //  Has no element getter.
            //  Each element has instead a property for its corresponding scene.

            // 1. Install evaluator function in Element's class prototype.
            if(!def.fun.is(evaluator)) {
                // It's a holder object: {value: value}
                if(isScenes)
                    // Use constant function anyway.
                    template[evalName] = def.fun.constant(evaluator.value);
                else
                    // Store constant values in base proto.
                    propsBase[fullName] = /** @type cgf.dom.Template.Element.PropertyValueHolder */{
                        value:   evaluator.value,
                        version: Infinity
                    };
            } else {
                (isScenes ? template : elemProto)[evalName] = evaluator;
            }

            // 2. Install getter property in Element's class prototype.
            if(!isScenes)
                Object.defineProperty(elemProto, shortName, {
                    enumerable:   true,
                    configurable: false,
                    get: this._buildElemClassPropGetter(fullName, evalName, propInfo.isEntity)
                });
        },

        _buildElemClassPropGetter: function(fullName, evalName, isEntity) {

            return propGetter;

            function propGetter() {
                var holder = this._props[fullName],
                    version, value;
                if(!holder) {
                    this._props[fullName] = /** @type cgf.dom.Template.Element.PropertyValueHolder */{
                        value:   (value = this[evalName]()),
                        version: isEntity ? this._versionEntities : this._versionAttributes
                    };
                } else if(holder.version < (version = (isEntity ? this._versionEntities : this._versionAttributes))) {
                    // Always sets, but may not change.
                    holder.value   = value = this[evalName]();
                    holder.version = version;
                } else {
                    value = holder.value;
                }

                return value;
            }
        }
    }
});

// ---------------

var cgf_dom_Template = cgf.Template = cgf.dom.Template = cgf_dom_TemplateMetaType.Ctor;