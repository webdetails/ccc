

/**
 * To tag pv properties set by extension points
 * @type string
 * @see pvc.BaseChart#extend
 */
pvc.extensionTag = 'extension';

/**
 * Extends a type created with {@link def.type}
 * with the properties in {@link exts},
 * possibly constrained to the properties of specified names.
 * <p>
 * The properties whose values are not functions
 * are converted to constant functions that return the original value.
 * </p>
 * @param {function} type
 *      The type to extend.
 * @param {object} [exts]
 *      The extension object whose properties will extend the type.
 * @param {string[]} [names]
 *      The allowed property names.
 */
pvc.extendType = function(type, exts, names) {
    if(exts) {
        var exts2;
        var sceneVars = type.prototype._vars;
        var addExtension = function(ext, n) {
            if(ext !== undefined) {
                if(!exts2) exts2 = {};
                if(sceneVars && sceneVars[n]) n = '_' + n + 'EvalCore';

                exts2[n] = def.fun.to(ext);
            }
        };

        if(names)
            names.forEach(function(n) { addExtension(exts[n], n); });
        else
            def.each(addExtension);

        if(exts2) type.add(exts2);
    }
};

function pvc_unwrapExtensionOne(id, prefix) {
    if(id) {
        if(id.abs != null) return id.abs;

        return prefix ? (prefix + def.firstUpperCase(id)) : id;
    }
    return prefix;
}

var pvc_oneNullArray = [null];

pvc.makeExtensionAbsId = function(id, prefix) {
    if(!id) return prefix;

    var result = [];

    prefix = def.array.to(prefix) || pvc_oneNullArray;
    id     = def.array.to(id);
    for(var i = 0, I = prefix.length ; i < I ; i++) {
        for(var j = 0, J = id.length ; j < J ; j++) {
            var absId = pvc_unwrapExtensionOne(id[j], prefix[i]);
            if(absId) result.push(absId);
        }
    }

    return result;
};
