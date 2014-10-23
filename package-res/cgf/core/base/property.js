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
 * A property has a base name and unique name.
 *
 * A property can have an associated cast function,
 * that is used to cast the property's value,
 * whenever set.
 *
 * A property is simultaneously a function.
 * Its interface is like that of an accessor,
 * but which receives the instance on which its value is to be written to or read from.
 * Usage of the property as a function requires that the instance implements
 * appropriate <i>get</i> and <i>set</i> methods.
 *
 * @name cgf.Property
 * @class
 * @extends Function
 *
 * TODO: Clarify the raison d'aitre of the multiple identifications...
 *
 * @property {number} id The id.
 * @property {string} localName The base name.
 * @property {string} uniqueName The unique name.
 * @property {(function(any):any)?} cast The cast function.
 * A function that has one argument, the value to cast, and that returns a casted value.
 * The value to cast is never <tt>null</tt> or <tt>undefined</tt>.
 * When <tt>null</tt> is returned, it means that a cast failure has occurred.
 */

function cgf_property(name, cast) {
    var id = def.nextId('cgf-prop');

    function property(inst, value) {
        return arguments.length > 1 ? inst.set(property, value) : inst.get(property);
    }

    property.id         = id;
    property.localName  = name;
    property.uniqueName = name + id;
    property.cast       = cast || null;

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
