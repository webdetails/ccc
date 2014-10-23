// Creates an object whose prototype is the specified object.
def.create = function(/*[deep,] baseProto, mixin1, mixin2, ...*/) {
    var mixins = A_slice.call(arguments),
        deep = true,
        baseProto = mixins.shift();

    if(typeof baseProto === 'boolean') {
        deep = baseProto;
        baseProto = mixins.shift();
    }

    var instance;
    if(baseProto) {
        instance = Object.create(baseProto);
        if(deep) createRecursive(instance);
    } else {
        instance = {};
    }

    if(mixins.length > 0) {
        mixins.unshift(instance);
        def.mixin.apply(def, mixins);
    }

    return instance;
};

/** @private */
function createRecursive(instance) {
    var p, vObj;
    for(p in instance)
        if((vObj = def.object.asNative(instance[p])))
            createRecursive( (instance[p] = Object.create(vObj)) );
}
