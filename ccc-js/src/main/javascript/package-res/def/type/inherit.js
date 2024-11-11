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
def.fun.inherit = def_inherit;

function def_inherit(Ctor, BaseCtor) {
    // Operator instanceof works even if the constructor property is not fixed.
    // However, if the constructor is not fixed,
    // all instances of a given class hierarchy, whatever its class,
    // will evaluate the constructor property as being the root class of the class hierarchy.
    // To later allow walking up the prototype chain, even in browsers that don't support
    // Object.getPrototypeOf or __proto__, we place a __proto__ property in the new
    // Ctor.prototype, pointing to the base prototype. See def.protoOf.
    if(BaseCtor) {
        var baseProto = BaseCtor.prototype,
            proto = Ctor.prototype = Object.create(baseProto);

        def.setNonEnum(proto, 'constructor', Ctor);
        if(!('__proto__' in proto)) def.setNonEnum(proto, '__proto__', baseProto);
    }

    return Ctor;
}