/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/
def.overrides = def_overrides;
//def.overridesDyn = def_overridesDyn;
def.fun.callsBase = def_callsBase;

function def_overrides(method, base, proto) {
    if(!method) return base;
    if(!base || (base === method) || !def_callsBase(method)) return method;

    def_validateProtoBase(proto);

    // Functions indented this way on purpose,
    // so that it causes the least debugging steps possible.

    function overridenClass() {
        var _ = proto.base; proto.base = base;
        try {
            return method.apply(this, arguments);
        } finally { proto.base = _; }
    }

    function overridenInstance() {
        var proto = def_safeProtoBase(this), _ = proto.base; proto.base = base;
        try {
            return method.apply(this, arguments);
        } finally { proto.base = _; }
    }

    return def.fun.wraps(proto ? overridenClass : overridenInstance, method);
}

// this.base, me.base, ...
var _reCallsBase = /\.\s*base\b/;

function def_callsBase(f) {
    // TODO: don't sniff the function if the browser
    // is known to not support Function#toString.
    // (Opera something?)
    return _reCallsBase.test(f);
}

function def_validateProtoBase(proto) {
    if(proto === O_proto) throw def.error.invalidArgument('proto', "Cannot change Object.prototype.");
    return proto;
}

function def_safeProtoBase(inst) {
    def_validateProtoBase(def.protoOf(inst));
}

/**
 * Inherits a method from a given prototype.
 * Also catches methods previously defined on the prototype itself.
 * Takes care to exclude values inherited from Object.prototype.
 * (assuming === => inherited from Object)
 *
 * @ignore
 */
function def_inheritedMethod(proto, p) {
    var m = def.fun.as(proto[p]);
    return m === O_proto[p] ? null : m;
}