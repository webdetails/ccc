
// Apart from the default value that this.delegate() supports,
// this.base() is equivalent, but just because no arguments are passed
// to the function in propInfo.value -- the wrapper.
// The wrapper function handles passing this.scene and this.index to the actual user provided handler.

function cgf_buildPropStructEvaluator(propInfo) {

    function cgf_propStruct() {
        return this._spawnStructuralProp(propInfo);
    }

    return cgf_propStruct;
}

// The root prototype used in base calls
var cgf_dom_ElementRootProto = def.rootProtoOf(cgf_dom_Element.prototype);

/**
 * Compiles an atomic property evaluator for elements of a template.
 *
 * Property evaluators are called in the context of an element.
 * A property has distinct evaluators for its stable and interaction value layers.
 */
function cgf_buildPropAtomicEvaluator(leafTemplate, fullName, shortName, cast, vlayer) {

    return buildPropEvaluatorTemplate(leafTemplate, /*level*/0, /*canUseDefault*/true);

    function buildPropEvaluatorTemplate(template, level, canUseDefault) {
        return buildPropEvaluatorValue(
            template,
            template._props[vlayer][fullName],
            level,
            canUseDefault);
    }

    function buildPropEvaluatorValue(template, valueInfo, level, canUseDefault) {
        if(!valueInfo) {
            var protoTemplate = template.proto(); // NOTE: resolves to null if cgf.dom.proto.parent and it has no parent.
            if(protoTemplate) return buildPropEvaluatorTemplate(protoTemplate, level, canUseDefault);

            // Default value from the leaf template's Template class' defaults
            if(canUseDefault) {
                var defaultTemplate = leafTemplate.constructor.defaults;
                if(defaultTemplate)
                    return buildPropEvaluatorTemplate(defaultTemplate, level, /*canUseDefault*/false);
            }

            // Interactive layer has the stable value as an implicit `base`.
            if(vlayer === INTERA_LAYER)
                // Evaluating the STABLE value is done by reentering the property getter.
                // So we simply encode a recursive call to the getter.
                return !level ? null : cgf_buildPropGetter(shortName);

            // See description below, about "level is 0".
            return !level ? {value: null} : cgf_propEmptyValue;
        }

        var value = valueInfo.value;
        if(valueInfo.isFun) {
            if(valueInfo.callsBase) {
                // Create base methods first, override afterwards.
                // Note valueInfo.base may be null, in which case,
                // it either ends up delegating to a proto's provided impl,
                // a defaults template impl, or,
                // if all missing, an emptyValue function.
                // TODO: It looks like `base` will never be falsy!
                var base = buildPropEvaluatorValue(template, valueInfo.base, level + 1, canUseDefault);
                if(base) // Override
                    return cast
                        ? cgf_buildPropVarWithBaseAndCast(value, base, cast, valueInfo.castReturnFunCount)
                        : cgf_buildPropVarWithBase(value, base);
            }

            return cast
                ? cgf_buildPropVarWithCast(value, cast, valueInfo.castReturnFunCount)
                : cgf_buildPropVar(value);
        }

        // When level is 0, return the value wrapped in an object,
        // cause it is later handled specially.
        // It is stored in the Elements' _props prototype object.
        return !level ? {value: value} : def.fun.constant(value);
    }
}

function cgf_propEmptyValue() { return null; }

function cgf_buildPropVarWithBaseAndCast(fun, base, cast, castReturnFunCount) {

    if(!castReturnFunCount)
        return function cgf_propVarWithBaseAndCast() {
            var _ = cgf_dom_ElementRootProto.base; cgf_dom_ElementRootProto.base = base;
            try {
                return cgf_castValue(fun.call(this, this.scene, this.index), cast);
            } finally { cgf_dom_ElementRootProto.base = _; }
        };

    return function cgf_propVarWithBaseAndCastAndReeval() {
        var _ = cgf_dom_ElementRootProto.base; cgf_dom_ElementRootProto.base = base;
        try {
            return cgf_evaluateCast(fun, this, cast, castReturnFunCount);
        } finally { cgf_dom_ElementRootProto.base = _; }
    };
}

function cgf_buildPropVarWithBase(fun, base) {
    return function cgf_propVarWithBase() {
        var _ = cgf_dom_ElementRootProto.base; cgf_dom_ElementRootProto.base = base;
        try {
            return fun.call(this, this.scene, this.index);
        } finally { cgf_dom_ElementRootProto.base = _; }
    };
}

function cgf_buildPropVarWithCast(fun, cast, castReturnFunCount) {
    if(!castReturnFunCount)
        return function cgf_propVarWithCast() {
            return cgf_castValue(fun.call(this, this.scene, this.index), cast);
        };

    return function cgf_propVarWithCastAndReeval() {
        return cgf_evaluateCast(fun, this, cast, castReturnFunCount);
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

function cgf_evaluateCast(v, elem, cast, count) {
    do {
        v = v.call(elem, elem.scene, elem.index);

        if(v == null || (v = cast(v)) == null) return null;

    } while(count-- && typeof v === 'function');

    return v;
}

function cgf_buildPropGetter(name) {
    return function cgf_propGet() {
        return this[name];
    };
}

// --------------

var cgf_reDelegates = /\.\s*(delegate|base)\b/;

function cgf_delegates(f) {
    return cgf_reDelegates.test(f);
}
