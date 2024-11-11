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

var fields_privProp = the_priv_key.property();

function fields_createChild(config) {
    var factory = def.classOf(this);
    return factory(config, this);
}

def.copyOwn(def, /** @lends def */{
    /**
     * Initializes an object that is an instance of a factory-class.
     *
     * Specifically, it
     * initializes the object's fields dictionary, and optionally safely stores it in it,
     * defines instance accessors for the specified <i>specs</i> argument, and, finally,
     * configures the object with the provided <i>config</i> argument.
     *
     * @param {object} inst The instance object.
     * @param {object} [config] A configuration value.
     * @param {object} [proto] The prototype instance to connect to, for obtaining default values.
     * @param {object<string, object|function>} [specs]  A map of property names to instance accessor specifications.
     *      Instead of a full accessor specification object,
     *      the factory of a property's value type can be specified.
     *
     *      An accessor function is created and set on <i>inst</i> for each property in the map.
     *
     *      For further information about the structure of an accessor specification, see {@link def.accessor}.
     *
     * @param {function} [privProp] A shared property function used to store the private fields object
     *      in a (public) property of <i>inst</i>.
     *      When equal to <tt>null</tt>,
     *      it is the responsibility of the caller to somehow associate the returned "fields" object with <i>inst</i>.
     *      When equal to <tt>undefined</tt>, or unspecified,
     *      the default fields private property is used.
     *
     *      Note that the accessor functions created by {@link def.classAccessors} depend on the fields object
     *      to be stored with each instance this way.
     *      The prototype instance feature also depends on being able to recover the "fields" object of an instance
     *      by calling a <i>privProp</i> function(or alike) on it.
     *
     * @return {object} The created fields object.
     */
    instance: function(inst, config, proto, specs, privProp) {
        var fields = def.fields(inst, proto, privProp);

        if(specs) def.instanceAccessors(inst, fields, specs);

        inst.createChild = fields_createChild;

        if(config) def.configure(inst, config);

        return fields;
    },

    fields: function(inst, proto, privProp) {

        var klass = def.classOf(inst);

        // Process `proto` instance to connect `inst`'s fields to.
        // If not specified, used the class' `defaults` instance.
        // (which will be undefined when creating the class's `defaults` instance itself).
        // Also, `proto` is only valid if it is an instance of `klass` as well,
        // otherwise, there could be conflicts in field names.
        if(!proto || !def.is(proto, klass)) proto = klass.defaults;

        // null:      don't store fields in private property.
        // undefined: use default private property.
        if(privProp === undefined) privProp = fields_privProp;

        var protoFields = proto && privProp && privProp(proto);

        // Create the local fields object, inheriting from the `proto` instance, if any.
        var fields = protoFields ? Object.create(protoFields) : {};
        fields.___proto = proto;

        // Share `fields` in a private property,
        // to allow other instances to have `inst` as a prototype.
        if(privProp) privProp.init(inst, fields);

        return fields;
    },

    classAccessors: function(classOrProto, specs, privProp) {
        var classProto = F_protoOrSelf(classOrProto);
        for(var name in specs) classProto[name] = def.classAccessor(name, specs[name], privProp);
        return def;
    },

    classAccessor: function(name, spec, privProp) {
        var setter = def_makeSetter(name, spec);

        if(!privProp) privProp = fields_privProp;

        return classAccessor;

        function classAccessor(v) {
            var fields = privProp(this);
            return arguments.length ? setter.call(this, fields, v) : fields[name];
        }
    },

    instanceAccessors: function(inst, fields, specs) {
        for(var name in specs) inst[name] = def.instanceAccessor(inst, name, specs[name], fields);
        return def;
    },

    instanceAccessor: function(inst, name, spec, fields) {
        var setter = def_makeSetter(name, spec);

        return instanceAccessor;

        function instanceAccessor(v) {
            return arguments.length ? setter.call(inst, fields, v) : fields[name];
        }
    }
});

function def_makeSetter(name, spec) {
    if(def.fun.is(spec)) spec = {factory: spec};

    // If the field has a factory, it is configurable by default.
    // A field that does not have a factory can still be configurable,
    //  and it will be, effectively, as long as the value is local.
    // Fields not having a factory will most likely be of non-object types,
    //  and configuration only applies to objects.
    var factory      = def.get(spec, "factory"),
        configurable = def.get(spec, "configurable", !!factory),
        change       = def.get(spec, "change" ),
        cast         = def.get(spec, "cast"   ),
        fail         = def.get(spec, "fail"   ),
        msg;

    spec = null;

    return setter;

    function setter(fields, v2) {
        // In setter semantics, `undefined` means "no operation".
        if(v2 !== undefined) {
            // Current value
            var v1 = fields[name];

            // The `null` value means discarding a local value,
            // letting the prototype instance's inherited value, if any, show-through.
            // If the object has no prototype instance, then just ignore the reset command.
            if(v2 === null) {
                if(fields.___proto && O_hasOwn.call(fields, name)) {
                    delete fields[name];
                    v2 = fields[name];
                    if(change && v2 !== v1) change(v2, v1, this, name);
                }
            } else if(v2 !== v1) {
                if(fail && (msg = fail(v2))) throw new def.error.argumentInvalid(name, def.string.is(msg) ? msg : "");

                // If `convert` returns a nully, it means don't do the set.
                if(cast) v2 = convert.call(this, fields, v2, v1);

                if(v2 != null) { // wasting a null test, when no cast...
                    fields[name] = v2;
                    if(change) change(v2, v1, this, name);
                }
            }
        }
        return this;
    }

    function convert(fields, v2, v1) {
        // Use `cast` to obtain a value admissible by the field.
        //   `cast` validates if the value is of an admissible type.
        //   If it is, that value is returned.
        //   If not, and if possible, converts it to a value of an admissible type.
        //   If there is no possible conversion, returns a nully value.
        // No `cast` function means that every value can be set in the field,
        //   and so, no implicit configuration is possible by using the setter.
        var vSet = cast(v2);

        // If there is no possible conversion, for v2,
        // we can only make use of it for configuration purposes.
        if(vSet == null) {
            // If this field or its current value are not configurable,
            // then v2 is considered invalid and ignored.
            if(!configurable) return;

            // Otherwise, the current value, v1, is configured with the configuration value v2.
            // However, note that only a local value is allowed to be configured.
            if(O_hasOwn.call(fields, name)) {
                // Configure existing local value
                def.configure(v1, /*config*/v2);
                return;
            }

            // If the field does not have a `factory`,
            // ignore the configuration value.
            if(!factory) return;

            // If the field has a `factory`, it can be used to
            // automatically create an instance (of some preferred type)
            // to set locally on the field.
            // The new instance will already be configured with the
            // configuration value provided to the factory.
            // Inherited from the initially inherited value v1, and
            // configure it with v2.
            vSet = factory(/*config*/v2, /*proto*/v1);

            // assert vSet != null && vSet !== v1 && vSet === cast(vSet)
        }
        return vSet;
    }
}

// ------------------

function FieldsMetaType(Ctor, baseType, keyArgs) {

    def.MetaType.apply(this, arguments);

    // Inherit base fieldsPrivProp.
    // Cannot change in the middle of the hierarchy,
    // but only in immediate sub-types of FieldsMetaType.
    var baseType = this.baseType;
    if(baseType) {
        this.fieldsPrivProp = (baseType.constructor === FieldsMetaType)
            ? (def.get(keyArgs, 'fieldsPrivProp') || fields_privProp)
            : baseType.fieldsPrivProp;
    }
}

def.MetaType.subType(FieldsMetaType, {
    methods: /** @lends  def.FieldsMetaType# */{
        fields: function(specs) {
            var accessors = {};
            for(var name in specs) accessors[name] = def.classAccessor(name, specs[name], this.fieldsPrivProp);
            return this.methods(accessors);
        },

        _addInitSteps: function(steps) {
            // Called after post steps are added.

            // Last thing to initialize is configuration.
            function initConfig(config, proto) {
                if(config) def.configure(this, config);
            }

            steps.push(initConfig);

            // `base` adds init steps.
            this.base(steps);

            // First thing to initialize is initFields
            var type = this;

            function initFields(config, proto) {
                def.fields(this, proto, type.fieldsPrivProp);
            }

            steps.push(initFields);
        }
    }
});

def('FieldsBase', FieldsMetaType.Ctor);
