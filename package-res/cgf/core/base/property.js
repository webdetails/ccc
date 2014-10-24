/**
 * Creates a property with a given short name and, optionally, a cast function.
 *
 * See {@link cgf.Property} for more information.
 *
 * @alias property
 * @memberof cgf
 * @function
 * @param {string} name The short name of the property.
 * @param {function} [cast] The cast function.
 * When unspecified, the property will accept any type of value.
 *
 * @return {cgf.Property} The new property.
 */
cgf.property = cgf_property;

/**
 * A property serves as a unique identifier for associating information to other objects.
 *
 * The {@link cgf.Property} class is a documentation class.
 * To create an instance of it you use the {@link cgf.property} function.
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
 * Having properties whose meaning is defined globally
 * allows property bags to be safely merged.
 *
 * Moreover, any property can be attributed to any object,
 * even if it has no direct accessor for it.
 *
 * @example <caption>Creating properties.</caption>
 * var widthProp = cgf.property('width', Number);
 * var textProp  = cgf.property('text', String);
 * var tagProp   = cgf.property('tag');
 *
 * @example <caption>Custom cast function.</caption>
 * // Width only accepts non-negative, finite numbers.
 * // Returning `null`indicates casting failure.
 * var widthProp = cgf.property('width', function(v) {
 *     v = +v;
 *     return isNaN(v) || !isFinite(v) || v < 0 ? null : v;
 * });
 *
 * @example <caption>Using the property's function interface.</caption>
 * var widthProp = cgf.property('width', Number);
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
 * @name cgf.Property
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
 */
function cgf_property(shortName, cast) {
    var shortId = def.nextId('cgf-prop-' + shortName); // one-based

    function property(inst, value) {
        return arguments.length > 1 ? inst.set(property, value) : inst.get(property);
    }

    property.shortName = shortName;
    property.fullName  = def.indexedId(shortName, shortId - 1);
    property.cast      = cast || null;

    return property;
}

// --------------

/**
 * Root namespace for standard **CGF** properties.
 *
 * @name cgf.props
 * @namespace
 */
var cgf_props = cgf.props = /** @lends cgf.props */{

    // TODO: make scenes property accept enumerables?
    // Causes nully => [nully]
    /**
     * DOC ME: The `scenes` property is core to **CGF**.
     *
     * Its cast function accepts array-like values.
     *
     * @type cgf.Property
     */
    scenes: cgf.property('scenes', def.array.like),

    /**
     * DOC ME: The `applicable` property is core to **CGF**.
     *
     * It has the cast function `Boolean`.
     *
     * @type cgf.Property
     */
    applicable: cgf.property('applicable', Boolean)
};
