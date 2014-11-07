
cgf.dom.property = cgf_dom_property;

/**
 * A property serves as a unique identifier for associating information to other objects.
 *
 * The {@link cgf.dom.Property} class is a documentation class.
 * To create an instance of it you use the {@link cgf.dom.property} function.
 *
 * A property has a short name and a full, globally unique, name.
 * The full name is determined automatically from the short name,
 * by appending "2", "3", etc.,
 * to created properties having already existing names.
 *
 * A property can have an associated `cast` function,
 * that is (can/should be) used to cast the property's value,
 * whenever it is set.
 *
 * A property object is simultaneously a function.
 * Its signature is like that of an accessor method,
 * but which receives the instance on which its value is to be written to or read from.
 *
 * Usage of the property as a function requires that
 * the instance implements appropriate _get_ and _set_ methods.
 * The actual property value storage is abstracted by these methods.
 *
 * When a property has a list value,
 * the _get_ method obtains the current list
 * and the _set_ method appends a new item or items (if a an array is provided) to the list.
 *
 * An additional method, _rem_, can be provided,
 * to allow removal of one or more list items.
 *
 * Having properties whose meaning is defined globally
 * allows property bags to be safely merged.
 *
 * Moreover, any property can be attributed to any object,
 * even if it has no direct accessor for it.
 *
 * @example <caption>Creating properties.</caption>
 * var widthProp = cgf.dom.property('width', Number);
 * var textProp  = cgf.dom.property('text', String);
 * var tagProp   = cgf.dom.property('tag');
 *
 * @example <caption>Custom cast function.</caption>
 * // Width only accepts non-negative, finite numbers.
 * // Returning `null` indicates casting failure.
 * var widthProp = cgf.dom.property('width', function(v) {
 *     v = +v;
 *     return isNaN(v) || !isFinite(v) || v < 0 ? null : v;
 * });
 *
 * @example <caption>Using the property's function interface.</caption>
 * var widthProp = cgf.dom.property('width', Number);
 *
 * // An object implementing an adhoc property store.
 * var sampleInstance = {
 *     _props: {},
 *
 *     get: function(p) { return this._props[p.fullName]; },
 *     set: function(p, v) { this._props[p.fullName] = v; }
 * };
 *
 * var value = widthProp(sampleInstance);
 *
 * expect(value).toBe(undefined);
 *
 * widthProp(sampleInstance, 1);
 * value = widthProp(sampleInstance);
 *
 * expect(value).toBe(1);
 *
 * @name cgf.dom.Property
 * @class
 * @extends Function
 *
 * @property {string} shortName The short name.
 * @property {string} fullName The full name.
 * @property {function} cast The cast function.
 * A function that receives one argument — the value to cast — and returns a casted value.
 * The value to cast is never `null` or `undefined`.
 *
 * When the cast function returns `null`, it means that a cast failure has occurred.
 *
 * When the property is a list, the cast function is called on each item of it.
 *
 * @property {function} factory The property's value factory function, or `null, if none.
 *
 * The `factory` function serves two purposes.
 *
 * One is that of informing of the underlying type of value stored,
 * as understood by {@link def.is} and {@link def.classify}.
 *
 * Either the factory function itself is considered to be the class of the value,
 * or its `of` property should contain the underlying base constructor function
 * that it uses to create instances.
 * Whatever the case, the actual class of the values of the property
 * is stored in property {@link cgf.dom.Property#type}.
 *
 * Another purpose is to create a value, if necessary.
 *
 * Generally, the factory function receives as arguments
 * a configuration value and a prototype value.
 *
 * @property {boolean} isList Indicates if the property stores multiple values or a single value.
 */

/**
 * Creates a property with a given short name and, optionally, a cast function.
 *
 * See {@link cgf.dom.Property} for more information.
 *
 * @alias property
 * @memberof cgf
 * @param {string} name The short name of the property.
 * @param {function|object} [propSpec] The property specification, or, when a function, its `cast` function.
 * @param {function} [propSpec.factory] The property's value factory function.
 *
 * @param {function} [propSpec.type] The property type function.
 * Defaults to the value of the factory's _of_ property or the factory itself.
 *
 * @param {function} [propSpec.cast] The property cast function.
 * Defaults to an _as_ function created using the _type_, if this is defined,
 * otherwise, the property will accept any type of value.

 * @param {boolean} [propSpec.isList=false] Indicates if the property value is a list of values.
 *
 * @return {cgf.dom.Property} The new property.
 */
function cgf_dom_property(shortName, propSpec) {
    var shortId = def.nextId('cgf-prop-' + shortName), // one-based
        cast, factory, type;

    function property(inst, value) {
        return arguments.length > 1 ? inst.set(property, value) : inst.get(property);
    }

    if(def.fun.is(propSpec)) {
        cast = propSpec;
        propSpec = null;
    } else {
        cast = def.get(propSpec, 'cast') || null;
    }

    factory = def.fun.as(def.get(propSpec, 'factory')) || null;

    type = def.get(propSpec, 'type') || null;
    if(!type && factory) type = def.fun.as(factory.of) || factory;

    if(!cast && type) cast = def.createAs(type);

    property.shortName = shortName;
    property.fullName  = def.indexedId(shortName, shortId - 1);
    property.cast      = cast;
    property.factory   = factory;
    property.type      = type;
    property.isList    = !!def.get(propSpec, 'isList');

    return property;
}

