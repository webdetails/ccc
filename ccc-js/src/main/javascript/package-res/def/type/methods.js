/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/
def.methods = def_methods;
def.method  = def_method;
def.abstractMethod = def.fail.notImplemented;


function def_methods(proto, mixins, ka) {
    proto = F_protoOrSelf(proto);

    var baseProto  = def.protoOf(proto), // Hoping that a proper prototype chain exists.
        rootProto  = def.rootProtoOf(proto),
        enumerable = def.get(ka, 'enumerable', true);

    def.array.each(mixins, function(mixin) {
        if((mixin = F_protoOrSelf(mixin))) {
            if(O_getOwnPropDesc)
                def.ownKeys(mixin).forEach(function(p) {
                    def_methodPropDesc_(proto, p, O_getOwnPropDesc(mixin, p), baseProto, rootProto, enumerable);
                });
            else
                def.eachOwn(mixin, function(v, p) {
                    def_method_(proto, p, v, baseProto, rootProto, enumerable);
                });
        }
    });

    return def;
}

function def_method(proto, p, v, ka) {
    proto = F_protoOrSelf(proto);
    var enumerable = def.get(ka, 'enumerable', true);
    return def_method_(proto, p, v, def.protoOf(proto), def.rootProtoOf(proto), enumerable);
}

function def_isValidMethodName(p) {
    // Don't let overwrite 'constructor' of prototype
    return p !== 'base' && p !== 'constructor';
}

/** @ignore */
function def_method_(proto, p, v, baseProto, rootProto, enumerable) {
    if(v !== undefined && baseProto[p] !== v && def_isValidMethodName(p))
        def_methodValue(proto, p, v, rootProto, enumerable);

    return def;
}

function def_methodValue(proto, p, v, rootProto, enumerable) {
    var m;
    if (v && (m = def.fun.as(v))) {
        v = def.overrides(m, def_inheritedMethod(proto, p), rootProto);
        if (enumerable)
            proto[p] = v;
        else
            def.setNonEnum(proto, p, v);
    } else {
        // Can use native object value directly.
        mixinProp(proto, p, v, /*protectNativeValue*/def.identity);
    }
}

/** @ignore */
function def_methodPropDesc_(proto, p, propDesc, baseProto, rootProto, enumerable) {
    "use strict";

    var v;
    if(def_isValidMethodName(p)) {
        if(propDesc.get || propDesc.set) {
            var basePropDesc = def_inheritedPropDesc(baseProto, p);
            if(basePropDesc) {
                // When specifying one, must inherit the other and viceversa,
                // or we reset the non-specified one.
                if(propDesc.get || basePropDesc.get)
                    propDesc.get = def.overrides(propDesc.get, basePropDesc.get, rootProto);
                if(propDesc.set || basePropDesc.set)
                    propDesc.set = def.overrides(propDesc.set, basePropDesc.set, rootProto);
            }
            if(!enumerable) propDesc.enumerable = false;
            O_defProp(proto, p, propDesc);
        } else if((v = propDesc.value) !== undefined) {
            def_methodValue(proto, p, v, rootProto, enumerable);
        }
    }
    return def;
}

function def_inheritedPropDesc(proto, p) {
    var propDesc;
    if(p in proto)
        while((proto = def.protoOf(proto)))
            if((propDesc = O_getOwnPropDesc(proto, p)))
                return propDesc;
}