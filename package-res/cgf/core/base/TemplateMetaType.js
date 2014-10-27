
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
        propMap, propList,
        Template, Element,
        childrenMap, childrenList;

    if(baseMetaType instanceof cgf_TemplateMetaType) {
        propMap  = Object.create(baseMetaType.propMap);
        propList = baseMetaType.propList.slice();

        childrenMap  = Object.create(baseMetaType.childrenMap);
        childrenList = baseMetaType.childrenList.slice();

        Element  = baseMetaType.Ctor.Element.extend();
    } else {
        Element  = cgf_TemplatedElement;
    }

    /**
     * Properties by name.
     * @type Object.<string, cgf.Property>
     */
    this.propMap  = propMap  || {};

    /**
     * Property list.
     * @type Array.<cgf.Property>
     */
    this.propList = propList || [];

    /**
     * Named children info by name.
     * @type Object.<string, object>
     */
    this.childrenMap  = childrenMap  || {};

    /**
     * Named children info list.
     * @type Array
     */
    this.childrenList = childrenList || [];

    Template = this.Ctor;

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
    Template.Element = Element;

    /**
     * Gets the template constructor function that owns
     * this element class.
     *
     * @name cgf.Element.Template
     * @type function
     */
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
         * Gets the element constructor function of this template class.
         * @method
         * @return {function} The element constructor function.
         * @see cgf.Template.Element
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
         * Adds a template property to the template class.
         *
         * @param {cgf.TemplateProperty} prop A template property.
         *
         * @method
         * @return {cgf.TemplateMetaType} The `this` value.
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

        /**
         * Adds named child templates to the template class.
         *
         * @param {Object.<string,function>} children A map of child name to child
         * template class constructor or a cast function.
         *
         * @name cgf.Template.children
         *
         * @method
         * @return {cgf.Template} The `this` value.
         *
         * @throws {def.error.argumentRequired} If one of the names is empty.
         * @throws {def.error.argumentInvalid} If one of the names is already
         * the name of another child template,
         * property or template class member.
         * @throws {def.error.argumentInvalid} If one of the map values
         * is not a function, or if it is a class constructor that
         * does not inherit from {@link cgf.Template}.
         */

        /**
         * Adds named child templates to the template class.
         *
         * @param {Object.<string,function>} children A map of child name to child
         * template class constructor or a cast function.
         *
         * @method
         * @return {cgf.TemplateMetaType} The `this` value.
         *
         * @throws {def.error.argumentRequired} If one of the names is empty.
         * @throws {def.error.argumentInvalid} If one of the names is already
         * the name of another child template,
         * property or template class member.
         * @throws {def.error.argumentInvalid} If one of the map values
         * is not a function, or if it is a class constructor that
         * does not inherit from {@link cgf.Template}.
         */
        children: function(children) {
            def.each(children, function(spec, name) {
                if(!isNaN(+name)) throw def.error.argumentInvalid('children', "Invalid child name.");
                this.child(name, spec);
            }, this);
        },

        /**
         * Adds a named child template to the template class.
         *
         * @name cgf.Template.child
         *
         * @param {string} name The name of the child template.
         * @param {function} [TemplCtor=cgf.Template] The template class constructor or a cast function.
         *
         * @method
         * @return {cgf.Template} The `this` value.
         *
         * @throws {def.error.argumentRequired} If argument <i>name</i> is not specified or is empty.
         * @throws {def.error.argumentInvalid} If the specified name is already
         * the name of another child template,
         * property or template class member.
         * @throws {def.error.argumentInvalid} If argument <i>TemplCtor</i>
         * is not a function, or if it is a class constructor that
         * does not inherit from {@link cgf.Template}.
         */

        /**
         * Adds a named child template to the template class.
         *
         * @param {string} name The name of the child template.
         * @param {function} [TemplCtor=cgf.Template] The template class constructor or a cast function.
         *
         * @method
         * @return {cgf.TemplateMetaType} The `this` value.
         *
         * @throws {def.error.argumentRequired} If argument <i>name</i> is not specified or is empty.
         * @throws {def.error.argumentInvalid} If the specified name is already
         * the name of another child template,
         * property or template class member.
         * @throws {def.error.argumentInvalid} If argument <i>TemplCtor</i>
         * is not a function, or if it is a class constructor that
         * does not inherit from {@link cgf.Template}.
         */
        child: def.configurable(false, function(name, TemplCtor) {
            if(!name) throw def.error.argumentRequired('name');

            if(def.hasOwn(this.propMap, name) ||
               def.hasOwn(this.childrenMap, name) ||
               this.Ctor.prototype[name] !== undefined)
                throw def.error.argumentInvalid(
                    'name',
                    "Child template cannot use name '{0}', because it's already being used.",
                    [name]);

            var cast;
            if(!TemplCtor) {
                cast = def.createAs(cgf_Template);
            } else if(!def.fun.is(TemplCtor)) {
                throw def.error.argumentInvalid('TemplCtor', "Not a function.");
            } else if(!def.isSubClassOf(TemplCtor, cgf_Template)) {
                if(TemplCtor.meta instanceof def.MetaType)
                    throw def.error.argumentInvalid(
                        'TemplCtor',
                        "In child template '{0}', class does not inherit from cgf.Template.",
                        [name]);

                cast = TemplCtor;
            } else {
                cast = def.createAs(cgf_Template);
            }

            var childInfo = {
                name:  name,
                index: this.childrenList.length,
                cast:  cast
            };

            this.childrenMap[name] = childInfo;
            this.childrenList.push(childInfo);

            // Create configure accessor method in Template#
            function configChildAccessor(v) {
                return arguments.length ? this.set(prop, v) : this.get(prop);
            }

            this.Ctor.method(name, configChildAccessor);
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
                this._setupElemClassPropGetter(elemProto, propHolder, template, rootProto, propsBase);
            }, this);

            this.childrenList.forEach(function(childInfo) {

            }, this);

            return Element;
        },

        _setupElemClassPropGetter: function(elemProto, propHolder, template, rootProto, propsBase) {
            var prop      = propHolder.prop,
                shortName = prop.shortName,
                evalName  = "_eval" + def.firstUpperCase(shortName),
                fullName  = prop.fullName,
                isScenes  = prop === cgf_props.scenes,
                evaluator = cgf_buildPropEvaluator(template, prop.fullName, rootProto, prop.cast);

            //  NOTE: The `scenes` property is special:
            //    it does not evaluate with an Element instance as the `this` context.
            //    It evaluates on a fake element object that has a scenes and an index property,
            //    with the values of the parent scene and the parent scene index.
            //    (see cgf.Template#evalScenes)
            //
            //  Its evaluator method is published in `template`.
            //  Has no element getter.
            //  Each element has instead a property for its corresponding scene.

            // 1. Install evaluator function in Element's class prototype.
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
                    get: this._buildElemClassPropGetter(fullName, evalName)
                });
        },

        _buildElemClassPropGetter: function(fullName, evalName) {

            return propGetter;

            function propGetter() {
                var props = this._props, v;
                if((v = props[fullName]) === undefined) props[fullName] = v = this[evalName]();
                return v;
            }
        }
    }
});