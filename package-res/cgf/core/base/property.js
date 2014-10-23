/**
 * Creates a property with a given base name and cast function.
 *
 * @alias property
 * @memberof cgf
 * @function
 * @param {string} name The base name of the property.
 * @param {function} [cast] The cast function.
 * When unspecified, the created property will accept any type of value.
 *
 * @return {cgf.Property} The created property.
 */
cgf.property = cgf_property;

/**
 * A property serves as a unique identifier for associating information to other objects.
 *
 * A property has a short name and a full, unique name.
 * The full name is determined automatically from the short name,
 * by appending "2", "3", etc.,
 * to created properties having already existing names.
 *
 * A property can have an associated cast function,
 * that is used to cast the property's value,
 * whenever set.
 *
 * A property is simultaneously a function.
 * Its signature is like that of an accessor method,
 * but which receives the instance on which its value is to be written to or read from:
 * Usage of the property as a function requires that the instance implements
 * appropriate <i>get</i> and <i>set</i> methods.
 *
 * So, a property does not preclude any storage implementation for property values on instances.
 *
 * Having properties defined globally, this way,
 * allows property bags to be mixed/merged "safely",
 * cause property meaning is global by full name.
 *
 * Also, properties defined this way can be assigned to any object,
 * even if it has no direct accessors for those properties.
 *
 * @example Using property as a function.
 * <pre>
 *     var widthProp = cgf.property('width', Number);
 *
 *     var sampleInstance = {
 *         _props: {},
 *         get: function(p) { return this._props[p.fullName]; },
 *         set: function(p, v) { this._props[p.fullName] = v; }
 *     };
 *
 *     var value = widthProp(sampleInstance);
 *
 *     expect(value).toBe(undefined);
 *
 *     widthProp(sampleInstance, 1);
 *     value = widthProp(sampleInstance);
 *
 *     expect(value).toBe(1);
 * </pre>
 *
 * @name cgf.Property
 * @class
 * @extends Function
 *
 * @property {string} shortName The short name.
 * @property {string} fullName The full name.
 * @property {(function(any):any)?} cast The cast function.
 * A function that has one argument, the value to cast, and that returns a casted value.
 * The value to cast is never <tt>null</tt> or <tt>undefined</tt>.
 * When <tt>null</tt> is returned, it means that a cast failure has occurred.
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
 * Namespace root for standard CGF properties.
 *
 * @name cgf.props
 * @namespace
 */
var cgf_props = cgf.props = /** @lends cgf.props */{

    // TODO: make scenes property accept enumerables?
    // Causes nully => [nully]
    /**
     * The <tt>scenes</tt> property is core to CGF templating system...
     *
     * @type cgf.Property
     */
    scenes: cgf.property('scenes', def.array.like),

    applicable: cgf.property('applicable', Boolean)
};
