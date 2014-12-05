/**
 * Constructs a type with the specified name in the current namespace.
 *
 * @function
 * @param {string} [name] The new type name, relative to the base argument.
 * When unspecified, an anonymous type is created.
 * The type is not published in any namespace.
 *
 * @param {object} [baseType] The base type.
 * @param {object} [space] The namespace where to define a named type.
 * The default namespace is the current namespace.
 *
 * @deprecated use <i>extend</i> on a base constructor instead.
 */
def.type = def.argumentsTypeBound([
    // name[, baseType[, space]] | baseType[, space] | space
    'string', 'function', 'object'
], function(name, baseCtor, space) {
    var BaseMetaType = baseCtor ? baseCtor.MetaType : def_MetaType,
        TypeCtor = BaseMetaType.extend().Ctor;
    return def(name, TypeCtor, space);
});
