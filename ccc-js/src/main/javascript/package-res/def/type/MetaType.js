
/*
    MetaType

    Public only methods
    Forward to Private object

    def.MetaType 0-> type singleton instance
      * constructor -> function - def.MetaType sub-type constructor
      * Ctor        -> associated real-constructor
      *
      * baseType    -> def.MetaType? instance
      * rootType    -> def.MetaType instance
      *
      * steps       -> Array.<function>
      * external [boolean] if constructor was given
      *
      * _init    [function] local/propagated init method
      * _post    [function] local/propagated post method

    def.MetaType constructor
      * Ctor -> associated real-constructor
      * Static Methods

    Real-Constructor
      * meta -> def.MetaType instance
      * Meta -> def.MetaType sub-type constructor


*/

// The class of constructors.
// Defines the methods that all constructor functions have.
// This is a similar feature to that of "inheritable static methods".
def('MetaType', def_MetaType);

function def_MetaType(TypeCtor, baseType, keyArgs) {

    this.baseType = baseType || null;

    var MetaType = this.constructor;
    if(MetaType.Ctor) throw def.error.operationInvalid("MetaType already has an associated type constructor.");
    if(TypeCtor && TypeCtor.Meta) throw def.error.argumentInvalid("TypeCtor", "Specified type constructor already has an associated MetaType.");

    this.external = !!TypeCtor;
    this.rootType = baseType ? baseType.rootType : this;

    this._init   = baseType ? baseType._init : null;
    this._post   = baseType ? baseType._post : null;

    var baseMixins = baseType && baseType._mixins;
    this._mixins = baseMixins ? baseMixins.slice() : null;
    this.steps   = undefined;

    TypeCtor = this._initConstructor(TypeCtor || this._createConstructor());

    this.Ctor = // convenience (could be obtained through this.constructor.Ctor)
    MetaType.Ctor = TypeCtor;
}

function def_isMetaType(fun) {
    return def.fun.is(fun) && (fun.meta instanceof def_MetaType);
}

var metaTypeExcludeStaticCopy = {
    "Ctor": 1,
    "BaseType": 1,
    "prototype": 1 // required by Rhino, which does not support enumerable correctly.
};

// MetaType Static interface - inherited by every sub-type.
def.copyOwn(def_MetaType, /** @lends def.MetaType */{

    methods: def_MetaTypeStatic_methods,

    add: def.configurable(false, function() {
        return def_MetaTypeStatic_methods.apply(this, arguments);
    }),

    inst: def.configurable(false, function() { return this.Ctor; }),

    subType: def.configurable(false, function(MetaType, metaTypeConfig, metaTypeKeyArgs) {
        var BaseMetaType = this,
            BaseTypeCtor = BaseMetaType.Ctor,
            // Singleton instance
            baseMetaType = (BaseTypeCtor && BaseTypeCtor.meta) ||
                def.fail.operationInvalid("MetaType is not yet instantiated.");

        // Connect constructor's prototypes.
        // The meta type constructors' prototype chain
        // provides the inheritance chain for the static interface of the real types.
        // The public, instance interface of the meta types is the public, inheritable static interface of the real types.
        // Later, the real constructor gets copies (rather proxies) of these instance methods.
        def.fun.inherit(MetaType, BaseMetaType);

        // Copy-Inherit Static Members of BaseMetaType (except if overridden, private or a special member)
        def.copyx(MetaType, BaseMetaType, {
            where: function(o, p) {
                return O_hasOwn.call(o, p) &&
                       p.charAt(0) !== "_" &&
                       !O_hasOwn.call(metaTypeExcludeStaticCopy, p);
            }
        });

        MetaType.BaseType = BaseMetaType;

        // Create the meta type's singleton instance.
        new MetaType(/*Ctor*/null, /*baseMetaType*/baseMetaType, /*ka*/metaTypeKeyArgs);

        if(metaTypeConfig) def.configure(MetaType, metaTypeConfig);

        return MetaType;
    }),

    // Creates a meta type derived from this one,
    // with an automatically generated a constructor.
    //
    // Contrast with def.MetaType#subType.
    extend: def.configurable(false, function(typeConfig, typeKeyArgs) {
        var BaseMetaType = this;

        function MetaType() {
            return BaseMetaType.apply(this, arguments);
        }

        // TODO: this does not look good!
        // Implements valueOf that returns the BaseMetaType.
        // This allows to see-through "configurable" info attached to the base type.
        def.fun.wraps(MetaType, BaseMetaType);

        return BaseMetaType.subType(MetaType, typeConfig, typeKeyArgs);
    })
});

function def_MetaTypeStatic_methods(mixins, ka) {
    // Update proto, for inherited classes.
    // NOTE: method properties must be enumerable,
    // otherwise, def_MetaTypeStatic_syncCtor
    // won't be able to copy these to the TypeCtor.
    def.methods(this, mixins, ka);

    // Sync associated type constructor.
    var TypeCtor = this.Ctor;
    if(TypeCtor) def_MetaTypeStatic_syncCtor.call(this, TypeCtor, mixins);

    return this;
}

function def_MetaTypeStatic_syncCtor(TypeCtor, mixins) {
    var TypeProto = this.prototype;

    def.array.each(mixins, function(mixin) {
        def.each(F_protoOrSelf(mixin), function(v, p) {
            // Do not copy private methods.
            // These are kept in MetaType# only.
            if(!def.isPropPrivate(p)) {
                v = TypeProto[p];
                if(def.fun.is(v))
                    def_MetaTypeStatic_exportMethod(TypeCtor, p, v);
                else
                    TypeCtor[p] = v;
            }
        });
    });
}

function def_MetaTypeStatic_exportMethod(to, p, m) {
    function exportedTypeMethod() {
        var metaType = this.meta,
            result = m.apply(metaType, arguments);
        return result === metaType ? this : result;
    }

    to[p] = def.fun.wraps(exportedTypeMethod, m);
}

// Instance interface
def_MetaType.add(/** @lends def.MetaType# */{
    closed: function() {
        return !!this.steps;
    },

    close: function() {
        if(!this.steps) this._closeCore((this.steps = []));
        return this;
    },

    _assertOpened: function() {
        if(this.closed()) throw def.error.operationInvalid("MetaType is closed.");
    },

    _closeCore: function(steps) {
        this._addPostSteps(steps);
        this._addInitSteps(steps);
    },

    _createConstructor: function() {
        var S = 1,
            type = this,
            steps = [function initClass() {
                steps = type.close().steps; // replace
                S = steps.length;
                return true; // reset iteration!
            }];

        function Class() {
            var i = S;
            while(i--) if(steps[i].apply(this, arguments) === true) i = S;
        }

        return Class;
    },

    _initConstructor: function(TypeCtor) {
        // Must copy inherited properties as well.
        var MetaType = this.constructor;
        def_MetaTypeStatic_syncCtor.call(MetaType, TypeCtor, MetaType);

        TypeCtor.meta = this;

        if(this.baseType) def.fun.inherit(TypeCtor, this.baseType.close().Ctor);

        TypeCtor.MetaType = MetaType;

        return TypeCtor;
    },

    _addPostSteps: function(steps) {
        def.array.eachReverse(this._mixins, function(mixin) {
            if(mixin._post) steps.push(mixin._post);
        });

        if(this._post) steps.push(this._post);
    },

    _addInitSteps: function(steps) {
        def.array.eachReverse(this._mixins, function(mixin) {
            if(mixin._init) steps.push(mixin._init);
        });

        if(this._init) steps.push(this._init);
    },

    init: function(init) {
        if(!init) throw def.error.argumentRequired('init');

        this._assertOpened();

        this._init = def.overrides(init, this._init, this.rootType.Ctor.prototype);

        return this;
    },

    postInit: function(postInit) {
        if(!postInit) throw def.error.argumentRequired('postInit');

        this._assertOpened();

        this._post = def.overrides(postInit, this._post, this.rootType.Ctor.prototype);

        return this;
    },

    type: def.configurable(true, function() {
        return this.constructor;
    }),

    add: def.configurable(false, function(mixin, ka) {
        // Register metaType mixins.
        if(def_isMetaType(mixin)) this._mixMetaType(mixin.meta);

        return def.methods(this.Ctor, mixin, ka), this;
    }),

    _mixMetaType: function(meta) {
        // TODO: Should not add same meta type twice in a hierarchy.
        def.array.lazy(this, '_mixins').push(meta);
    },

    methods: function(mixins, ka) {
        def.array.each(mixins, this.add, this);
        return this;
    },

    method: def.configurable(false, function(p, v, ka) {
        return def.method(this.Ctor, p, v, ka), this;
    }),

    configure: function(config) {
        return def.configure.generic(this, config), this;
    },

    // Creates a sub-type of this one and instantiates it.
    extend: def.configurable(false, function(instConfig, typeKeyArgs) {
        var SubTypeCtor = this.constructor.extend(/*typeConfig*/null, typeKeyArgs).Ctor;
        return SubTypeCtor.configure(instConfig);
    })
});
