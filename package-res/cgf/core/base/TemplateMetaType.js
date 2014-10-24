
/**
 * Creates a meta-type for a {@link cgf.Template} derived type.
 *
 * @alias TemplateMetaType
 * @memberOf cgf
 *
 * @param {function} [Ctor=null] The corresponding constructor function.
 *
 * To create the {@link cgf.Template} class and its derived classes, <tt>null</null> is passed in this argument
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
function cgf_TemplateMetaType(Ctor, baseType, keyArgs) {

    def.MetaType.apply(this, arguments);

    // Inherit base properties and
    // base Element class
    // from a base TemplateMetaType.
    var baseMetaType = this.baseType,
        propMap, propList, Template, Element;

    /**
     * Gets the element constructor function owned by
     * this template class.
     *
     * This class either is {@link cgf.TemplatedElement} itself,
     * or one derived from the element class owned by
     * the base template class.
     *
     * This class is abstract.
     * Final non-abstract classes are derived from this one
     * for every template instance of this class.
     *
     * @name cgf.Template.Element
     * @type function
     * @see cgf.Template#Element
     */
    if(baseMetaType instanceof cgf_TemplateMetaType) {
        propMap  = Object.create(baseMetaType.propMap);
        propList = baseMetaType.propList.slice();
        Element  = baseMetaType.Ctor.Element.extend();
    } else {
        Element  = cgf_TemplatedElement;
    }

    this.propMap  = propMap  || {};
    this.propList = propList || [];

    Template = this.Ctor;
    Template.Element = Element;
    Element.Template = Template;
}

// Wires-up cgf.TemplateMetaType  to inherit from def.MetaType.
def.MetaType.subType(cgf_TemplateMetaType, {
    // Notice, below, every public property is proxied automatically to the Template
    // (or derived) constructor function.
    methods: /** @lends cgf.TemplateMetaType# */{
        // defaults: added below

        /**
         * Configures the array of constructor initialization steps
         * of every template-derived class.
         *
         * @private
         *
         * @param {Array.<function>} steps The array of constructor initialization steps.
         *
         * @memberOf cgf.TemplateMetaType
         * @override
         * @see def.MetaType#_addInitSteps
         * @ignore
         */
        _addInitSteps: function(steps) {
            // Called after post steps are added.

            // Last thing to initialize is configuration.
            function initConfig(parent, config) {
                if(config) def.configure(this, config);
            }

            steps.push(initConfig);

            // `base` adds init steps.
            this.base(steps);

            // First thing to initialize is initFields
            // Each template instance stores a template properties dictionary in a private field.
            function initFields(/*parent, config*/) {
                cgf_initTemplateProperties(this, {});
            }

            steps.push(initFields);
        },

        /**
         * Obtains the element constructor function of this template class.
         *
         * Use this property to customize the
         * associated {@link cgf.TemplatedElement}'s class.
         *
         * @example <caption>Customizing the associated Element class.</caption>
         * var Section = cgf.Template.extend({
         *     properties: [
         *         cgf.property('startAngle', Number),
         *         cgf.property('endAngle', Number)
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
         * @name cgf.Template.element
         * @function
         * @return function
         */

        /**
         * Obtains the element constructor function of this template class.
         * @method
         * @return {function} The element constructor function.
         * @see cgf.Template.element
         */
        element: def.configurable(true, function() {
            return this.Ctor.Element;
        }),

        /**
         * Adds properties to the template class.
         *
         * @example <caption>Defining a template class with custom properties.</caption>
         * var Shape = cgf.Template.extend({
         *     properties: [
         *         cgf.property('color', String),
         *         cgf.property('size',  Number)
         *     ]
         * });
         *
         * var shape = new Shape()
         *    .color(function(s, i) { return (i % 2) ? 'green' : 'red'; })
         *    .size(19);
         *
         * @param {Array.<cgf.Property>|cgf.Property} [props] An array of properties, or a single property.
         *
         * @name cgf.Template.properties
         * @function
         * @return {function} The template class constructor function.
         * @throws {def.error.argumentInvalid} If any of the specified properties is already a
         * property of the template class.
         */

        /**
         * Adds properties to the template class.
         *
         * @param {Array.<cgf.Property>|cgf.Property} [props] An array of properties, or a single property.
         *
         * @return {cgf.TemplateMetaType} This template meta-type.
         * @throws {def.error.argumentInvalid} If any of the specified properties is already a
         * property of the template class.
         * @see cgf.Template.properties
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
         * having the name of the property's {@link cgf.Property#shortName}.
         *
         * The element classes that are later generated,
         * for each instance of this template class,
         * will be given a get/set JavaScript property,
         * to access the value of the property.
         *
         * Adding a template property fixates the interpretation given
         * to its {@link cgf.Property#shortName},
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
         * @param {cgf.TemplateProperty} prop A template property.
         *
         * @name cgf.Template.property
         * @function
         * @return {function} The template class constructor function.
         * @throws {def.error.argumentInvalid} If the specified property is already a
         * property of the template class.
         */

        /**
         * Adds a template property to the template meta-type.
         *
         * @param {cgf.TemplateProperty} prop A template property.
         *
         * @method
         * @return {cgf.TemplateMetaType } This template meta-type.
         * @throws {def.error.argumentInvalid} If the specified property is already a
         * property of the template meta-type.
         *
         * @see cgf.Template.property
         */
        property: def.configurable(false, function(prop) {
            var shortName = prop.shortName;
            if(def.hasOwn(this.propMap, shortName))
                throw def.error.argumentInvalid(
                    'prop',
                    "A property with local name '{0}' is already defined.",
                    [shortName]);

            var index = this.propList.length,
                propHolder = {
                    prop:  prop,
                    index: index
                };

            this.propMap[shortName] = propHolder;
            this.propList.push(propHolder);

            // Create configure accessor method in Template#
            function configPropAccessor(v) {
                return arguments.length ? this.set(prop, v) : this.get(prop);
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
            this.propList.forEach(function(propHolder) {
                this._setupElemClassGetter(elemProto, propHolder, template, rootProto, propsBase);
            }, this);

            return Element;
        },

        _setupElemClassGetter: function(elemProto, propHolder, template, rootProto, propsBase) {
            var prop      = propHolder.prop,
                shortName = prop.shortName,
                evalName  = "_eval" + def.firstUpperCase(shortName),
                fullName  = prop.fullName,
                isScenes  = prop === cgf_props.scenes,
                evaluator = cgf_buildPropEvaluator(template, template, prop.fullName, rootProto, prop.cast);

            // 1. Install evaluator function in Element's class prototype.
            //  The scenes property is very special - it does not evaluate on an Element instance.
            //  The _evalScenes method is published in the template.
            //  Also, no getter is published for the "scenes" property.
            if(!def.fun.is(evaluator)) {
                // It's a holder object: {value: value}
                if(isScenes)
                    // Use constant function anyway
                    template[evalName] = def.fun.constant(evaluator.value);
                else
                    // Store constant values in base proto
                    propsBase[fullName] = evaluator.value;
            } else {
                (isScenes ? template : elemProto)[evalName] = evaluator;
            }

            // 2. Install getter property in Element's class prototype.
            if(!isScenes)
                Object.defineProperty(elemProto, shortName, {
                    enumerable:   true,
                    configurable: false,
                    get: this._buildElemClassGetter(fullName, evalName)
                });
        },

        _buildElemClassGetter: function(fullName, evalName) {

            return propGetter;

            function propGetter() {
                var props = this._props, v;
                if((v = props[fullName]) === undefined) props[fullName] = v = this[evalName]();
                return v;
            }
        }
    }
});