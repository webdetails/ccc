
/**
 * Creates a meta-type for a {@link cgf.Template} derived type.
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
    methods: {
        // defaults: added below

        /**
         * Configures the array of constructor initialization steps
         * of every template-derived class.
         *
         * @param {Array.<function>} steps The array of constructor initialization steps.
         *
         * @memberOf cgf.TemplateMetaType
         * @override
         * @see def.MetaType#_addInitSteps
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
            function initFields(parent, config) {
                cgf_initTemplateProperties(this, {});
            }

            steps.push(initFields);
        },

        /**
         * Obtains the associated element constructor function.
         *
         * Use this property to configure the
         * associated {@link cgf.TemplatedElement}'s class.
         *
         * @example
         * <pre>
         * var MyVisual = cgf.Template.extend({
         *     methods: {
         *         // methods of MyVisual template instances
         *         foo: function() { return 1; }
         *     },
         *
         *     element: {
         *        methods: {
         *            // Methods of the template instances' associated Element class' instances.
         *            bar: function() { return 2; }
         *        }
         *     }
         * });
         *
         * var myVisual = new MyVisual();
         * assert(myElem1.foo() === 1);
         *
         * var myElem1 = myVisual.createElement();
         * assert(myElem1.bar() === 2);
         * </pre>
         *
         * @name cgf.Template.element
         * @function
         * @return function
         */

        /**
         * Obtains the associated element constructor function.
         * @memberOf cgf.TemplateMetaType
         * @return function
         */
        element: def.configurable(true, function() {
            return this.Ctor.Element;
        }),

        /**
         * Adds template properties to the template class.
         *
         * @param {Array.<cgf.TemplateProperty>} [props] An array of template properties.
         *
         * @name cgf.Template.properties
         * @function
         * @return {function} The template class constructor function.
         * @throws {def.error.argumentInvalid} If any of the specified properties is already a
         * property of the template class.
         */

        /**
         * Adds template properties to the template meta type.
         *
         * You can use this property to configure the
         * template class.
         *
         * @example
         * <pre>
         * var propColor = cgf.property('color', String);
         * var propSize  = cgf.property('size',  Number);
         *
         * var MyVisual = cgf.Template.extend({
         *     properties: [
         *         propColor,
         *         propSize
         *     ]
         * });
         *
         * var myVisual = new MyVisual()
         *    .color(function(s, i) { return (i % 2) ? 'green' : 'red'; })
         *    .size(19);
         *
         * </pre>
         *
         * Note that template properties are inherited from base template classes.
         *
         * @param {Array.<cgf.TemplateProperty>} [props] An array of template properties.
         *
         * @memberOf cgf.TemplateMetaType
         * @return {cgf.TemplateMetaType } This template meta-type.
         * @throws {def.error.argumentInvalid} If any of the specified properties is already a
         * property of the template meta-type.
         */
        properties: function(props) {
            if(props) props.forEach(this.property, this);
            return this;
        },

        /**
         * Adds a template property to the template class.
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
         * @memberOf cgf.TemplateMetaType
         * @return {cgf.TemplateMetaType } This template meta-type.
         * @throws {def.error.argumentInvalid} If the specified property is already a
         * property of the template meta-type.
         */
        property: def.configurable(false, function(prop) {
            var lname = prop.localName;
            if(def.hasOwn(this.propMap, lname))
                throw def.error.argumentInvalid('prop', "A property with local name '{0}' is already defined.", [lname]);

            var index = this.propList.length,
                propHolder = {
                    prop:  prop,
                    index: index
                };

            this.propMap[lname] = propHolder;
            this.propList.push(propHolder);

            // Create configure accessor method in Template#
            function configPropAccessor(v) {
                return arguments.length ? this.set(prop, v) : this.get(prop);
            }

            this.Ctor.method(lname, configPropAccessor);

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
            var prop       = propHolder.prop,
                localName  = prop.localName,
                evalName   = "_eval" + def.firstUpperCase(localName),
                uniqueName = prop.uniqueName,
                isScenes   = prop === cgf_props.scenes,
                evaluator  = cgf_buildPropEvaluator(template, template, prop.uniqueName, rootProto, prop.cast);

            // The scenes property is very special - it does not evaluate on an Element instance.
            // The _evalScenes method is published in the template.
            // Also, no getter is published for the "scenes" property.
            if(!def.fun.is(evaluator)) {
                // It's a holder object: {value: value}
                if(isScenes)
                    // Use constant function anyway
                    template[evalName] = def.fun.constant(evaluator.value);
                else
                    // Store constant values in base proto
                    propsBase[uniqueName] = evaluator.value;
            } else {
                (isScenes ? template : elemProto)[evalName] = evaluator;
            }

            if(!isScenes) elemProto[localName] = this._buildElemClassGetter(uniqueName, evalName);
        },

        _buildElemClassGetter: function(uniqueName, evalName) {

            return propGetter;

            function propGetter() {
                var props = this._props, v;
                if((v = props[uniqueName]) === undefined) props[uniqueName] = v = this[evalName]();
                return v;
            }
        }
    }
});