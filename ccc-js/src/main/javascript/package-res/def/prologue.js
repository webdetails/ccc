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
 * qname, value[, space]
 *
 * Object.<string,*>[, space]
 * Array.<Object.<string,*>>[, space]
 *
 * @name def
 * @namespace The 'definition' library root namespace.
 * @variant namespace
 */

/**
 * TODO: Document this
 * @param {String|def.QualifiedName|object|array} [name] The qualified name to define,
 *  as a string or a qualified name instance.
 *
 * @param {String|object} value The definition value.
 * @param {String|object} [space] The base namespace object or name.
 */
function def(qname, value, space) {
    if(qname && !(qname instanceof def.QualifiedName)) {
        var t = typeof qname;
        if(t === 'object') {
            for(var p in qname) def_1(p, qname[p], /*space*/value);
            return def;
        }

        if(t === 'array') {
            for(var p in qname) def_1(qname[p], /*space*/value);
            return def;
        }
    }

    // t is empty, or t === string, or t is a qualified name
    def_1(qname, value, space);
    return value;
}

function def_1(qname, value, space) {
    qname = def.qualName(qname);
    space = def.space(qname.namespace, space);
    if(qname.name) {
        // TODO: log definition overwrite
        //if(O_hasOwn.call(space, name))
        //throw def.error.operationInvalid("Name '{0}' is already defined in namespace.", [name]);
        space[qname.name] = value;

        // functions included
        // replaces the name if already there, which implies that defining a value
        // on two names, will result in the second "gaining" the name.
        if(value instanceof Object) def.qualNameOf(value, qname);
    }
}

/**
 * The JavaScript global object.
 * @type {object}
 */
def.global = this;

def.copyOwn = function(a, b) {
    var to, from;
    if(arguments.length >= 2)
        to = (a || {}), from = b;
    else
        to = {}, from = a;

    for(var p in from) if(O_hasOwn.call(from, p)) to[p] = from[p];

    return to;
};