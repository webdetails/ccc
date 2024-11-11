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
def.mixin = createMixin(Object.create);

def.copyOwn(def.mixin, {
    custom:  createMixin,
    inherit: def.mixin,
    copy:    createMixin(def.copy),
    share:   createMixin(def.identity)
});

/** @private */
function createMixin(protectNativeObject) {
    return function(instance/*mixin1, mixin2, ...*/) {
        return mixinMany(instance, A_slice.call(arguments, 1), protectNativeObject);
    };
}

/** @private */
function mixinMany(instance, mixins, protectNativeObject) {
    var mixin, i = 0, L = mixins.length;

    while(i < L) if((mixin = mixins[i++])) {
        mixin = def.object.as(mixin.prototype || mixin);
        if(mixin) mixinRecursive(instance, mixin, protectNativeObject);
    }

    return instance;
}

/** @private */
function mixinRecursive(instance, mixin, protectNativeObject) {
    for(var p in mixin) mixinProp(instance, p, mixin[p], protectNativeObject);
}

/** @private */
function mixinProp(instance, p, vMixin, protectNativeObject) {
    if(vMixin !== undefined) {
        var oMixin,
            oTo = def.object.asNative(instance[p]);

        if(oTo) {
            oMixin = def.object.as(vMixin);
            if(oMixin) {
                // If oTo is inherited, don't change it
                // Inherit from it and assign it locally.
                // It will be the target of the mixin.
                if(!O_hasOwn.call(instance, p)) instance[p] = oTo = Object.create(oTo);

                // Mixin the two objects
                mixinRecursive(oTo, oMixin, protectNativeObject);
            } else {
                // Overwrite oTo with a simple value
                instance[p] = vMixin;
            }
        } else {
            // Target property does not contain a native object.
            oMixin = def.object.asNative(vMixin);
            // Should vMixin be set directly in instance[p] ?
            // Should we copy its properties into a fresh object ?
            // Should we inherit from it ?
            if(oMixin) vMixin = (protectNativeObject || Object.create)(oMixin);

            instance[p] = vMixin;
        }
    }
}