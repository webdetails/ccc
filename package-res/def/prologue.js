/** @private */
var A_slice  = Array.prototype.slice,
    A_empty  = [],
    //O_proto  = Object.prototype, // moved to shim.js
    //O_hasOwn = O_proto.hasOwnProperty, // idem
    O_defProp = (function() {
        var defProp = Object.defineProperty;
        if(defProp) try { defProp({}, 'test', {}); } catch(ex) { return null; }
        return defProp;
    }()),
    O_getOwnPropDesc = (function() {
        var ownPropDesc = O_defProp && Object.getOwnPropertyDescriptor;
        // Rhino returns value === undefined!
        if(ownPropDesc && ownPropDesc({value: null}, 'value').value === null)
            return ownPropDesc;
    }()),
    F_protoOrSelf = function(F) { return F.prototype || F; };


/**
 * @name def
 * @namespace The 'definition' library root namespace.
 * @variant namespace
 */
 /**
 * TODO: Document this
 * 1) def(qpairs[object]) -> def
 *
 * 2) def(qname[string|def.QualName], value) -> value
 *    def(baseSpace[object|null|function], qpairs[object]) -> def
 *
 * 3) def(baseSpace[object|null|function], qname[string|def.QualName], value) -> value
 */
function def(a1, a2, a3) {
    var L = arguments.length;
    if(L === 1) {
        for(var p in a1) def_1(null, p, a1[p]);
        return def;
    }

    if(L === 3) return def_1(a1, a2, a3);

    if(L === 2) { // a1, a2
        var type = typeof a1;
        if(type === 'string' || a1 instanceof def_QualifiedName) return def_1(null, a1, a2);
        if(type === 'object' || type === 'function') {
            for(var p in a2) def_1(a1, p, a2[p]);
            return def;
        }
    }

    throw def.error.operationInvalid("Invalid arguments.");
}

function def_1(space, qname, value) {
    qname = def.qualName(qname);
    // When space is a function, it should not confused with the definition.
    // Hence the third argument.
    space = def.space(qname.namespace, space, null);
    if(qname.name) {
        // TODO: log definition overwrite
        //if(O_hasOwn.call(space, name))
        //throw def.error.operationInvalid("Name '{0}' is already defined in namespace.", [name]);
        space[qname.name] = value;

        // functions included
        // replaces the name if already there, which implies that defining a value
        // on two names, will result in the second "gaining" the name.
        if(value instanceof Object) {
            if(space) qname = def.qualName(qname, def.qualNameOf(space));
            def.qualNameOf(value, qname);
        }
    }
    return value;
}

/**
 * The JavaScript global object.
 * @type {object}
 */
def.global = this;

def.copyOwn = function(a, b) {
    var to, from;
    if(arguments.length >= 2) {
        to = (a || {}); from = b;
    } else {
        to = {}; from = a;
    }

    for(var p in from) if(O_hasOwn.call(from, p)) to[p] = from[p];

    return to;
};
