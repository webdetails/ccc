
// Apart from the default value that this.delegate() supports,
// this.base() is equivalent, but just because no arguments are passed
// to the function in propInfo.value -- the wrapper.
// The wrapper function handles passing this.scene and this.index to the actual user provided handler.

function cgf_buildPropEvaluator(leafTemplate, fullName, rootProto, cast) {

    return buildPropEvaluatorTemplate(leafTemplate, /*level*/0, /*canUseDefault*/true);

    function buildPropEvaluatorTemplate(template, level, canUseDefault) {
        return buildPropEvaluatorValue(template, cgf_propsPrivProp(template)[fullName], level, canUseDefault);
    }

    function buildPropEvaluatorValue(template, valueInfo, level, canUseDefault) {
        if(!valueInfo) {
            var protoTemplate = template.proto();
            if(protoTemplate) return buildPropEvaluatorTemplate(protoTemplate, level, canUseDefault);

            // Default value from the leaf template's Template class' defaults
            if(canUseDefault) {
                var defaultTemplate = leafTemplate.constructor.defaults;
                if(defaultTemplate)
                    return buildPropEvaluatorTemplate(defaultTemplate, level, /*canUseDefault*/false);
            }

            return cgf_propEmptyValue;
        }

        var value = valueInfo.value;
        if(valueInfo.isFun) {
            if(valueInfo.callsBase) {
                // Create base methods first, override afterwards.
                // Note valueInfo.base may be null.
                var base = buildPropEvaluatorValue(template, valueInfo.base, level + 1, canUseDefault);
                if(base) // Override
                    return cast
                        ? cgf_buildPropVarWithBaseAndCast(value, base, rootProto, cast)
                        : cgf_buildPropVarWithBase(value, base, rootProto);
            }

            return cast
                ? cgf_buildPropVarWithCast(value, cast)
                : cgf_buildPropVar(value);
        }

        // When level is 0, return the value wrapped in an object,
        // cause it is later handled specially.
        // It is stored in the Elements' _props prototype object.
        return !level ? {value: value} : def.fun.constant(value);
    }
}

function cgf_propEmptyValue() { return null; }

function cgf_buildPropVarWithBaseAndCast(fun, base, proto, cast) {
    return function cgf_propVarWithBaseAndCast() {
        var _ = proto.base; proto.base = base;
        try {
            return cgf_castValue(fun.call(this, this.scene, this.index), cast);
        } finally { proto.base = _; }
    };
}

function cgf_buildPropVarWithBase(fun, base, proto) {
    return function cgf_propVarWithBase() {
        var _ = proto.base; proto.base = base;
        try {
            return fun.call(this, this.scene, this.index);
        } finally { proto.base = _; }
    };
}

function cgf_buildPropVarWithCast(fun, cast) {
    return function cgf_propVarWithCast() {
        return cgf_castValue(fun.call(this, this.scene, this.index), cast);
    };
}

function cgf_buildPropVar(fun) {
    return function cgf_propVar() {
        return fun.call(this, this.scene, this.index);
    };
}

function cgf_castValue(v, cast) {
    return (v != null && (v = cast(v)) != null) ? v : null;
}

// --------------

var cgf_reDelegates = /\.\s*(delegate|base)\b/;

function cgf_delegates(f) {
    return cgf_reDelegates.test(f);
}

// --------------

/**
 * Initializes a template instance with a properties dictionary.
 * The dictionary is stored in a private field.
 *
 * Only template properties can read from and write to
 * this private field.
 *
 * @name cgf.initTemplateProperties
 * @param {object} templ The template instance to initialize.
 * @param {object} [props] A properties dictionary.
 * When not specified, a plain object is used.
 * @return {object} The properties dictionary.
 * @private
 */

function cgf_initTemplateProperties(templ, props) {
    cgf_propsPrivProp.init(templ, props || (props = {}));
    return props;
}
