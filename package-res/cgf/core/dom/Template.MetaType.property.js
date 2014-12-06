
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
 *
 * A property evaluator evaluates the function that the user specified
 * in the template for that property.
 * If a property is specified consecutive times with a function value,
 * the evaluator will be built such that those functions can delegate (call `base`)
 * to the previously set function value.
 * An evaluator can also delegate to a previously set constant value.
 *
 * This is the order of evaluation:
 * 1. Value set in the template.
 * 2. Follow previously set values.
 *     1. The previous value.
 *     2. Take the previous value's previous value, if any, and continue.
 * 3. Follow the _proto_ chain:
 *     1. Value set in the _proto_ template.
 *     2. Follow any previously set values in the _proto_ template.
 *     3. Take the _proto_ template's _proto_, if any, and continue.
 * 4. Value set in the template class' _defaults_ instance, if any.
 * 5. Follow any previously set values in the _defaults_ instance.
 * 6. Follow the _defaults_ instance _proto_ chain.
 * 7. If this is a stable value evaluator, the _null_ value.
 * 8. If this is an interaction value evaluator,
 *    a function that calls the stable value evaluator,
 *    which is done by calling the property getter, recursively.
 *
 * Note that
 * previous values of prototype templates are followed,
 * but that
 * the only _defaults_ template taken into consideration
 * is that of the initial template's class.
 *
 * When following the above order of evaluation
 * statically results in a constant value,
 * instead of returning a constant function evaluating to that value,
 * it is returned wrapped in a plain object's `value` property.
 * Constant values can later be handled specially.
 *
 * @param {cgf.dom.Template} leafTemplate The template.
 * @param {string} fullName The full name of the property.
 * @param {string} shortName The short name of the property.
 * @param {number} vlayer The value layer that the evaluator will evaluate.
 * @param {function} [cast=null] The property cast function, if any.
 *
 * @return {function|object|null} The evaluator function,
 * a wrapper object containing a constant value in its property `value`, or
 * `null` when a level 0 interactive handler has no value.
 *
 * @private
 */
function cgf_buildPropAtomicEvaluator(leafTemplate, fullName, shortName, vlayer, cast) {

    return buildPropEvaluatorTemplate(leafTemplate, /*baseLevel*/0, /*canUseDefault*/true);

    function buildPropEvaluatorTemplate(template, baseLevel, canUseDefault) {
        return buildPropEvaluatorValue(
            template,
            template._props[vlayer][fullName],
            baseLevel,
            canUseDefault);
    }

    function buildPropEvaluatorValue(template, valueInfo, baseLevel, canUseDefault) {
        if(!valueInfo) {
            var protoTemplate = template.proto(); // NOTE: resolves to null if cgf.dom.proto.parent and it has no parent.
            if(protoTemplate) return buildPropEvaluatorTemplate(protoTemplate, baseLevel, canUseDefault);

            // Default value from the leaf template's Template class' defaults
            if(canUseDefault) {
                var defaultTemplate = leafTemplate.constructor.defaults;
                if(defaultTemplate)
                    return buildPropEvaluatorTemplate(defaultTemplate, baseLevel, /*canUseDefault*/false);
            }

            // Interaction layer has the stable value as an implicit `base`.
            if(vlayer === INTERA_LAYER)
                // Evaluating the STABLE value is done by reentering the property getter.
                // So we simply encode a recursive call to the getter.
                return !baseLevel
                    ? null // Signal there's nothing here. Prop getter handles calling stable getter.
                    : cgf_buildPropGetter(shortName);

            // See description below, about "baseLevel is 0".
            return !baseLevel ? {value: null} : cgf_propEmptyValue;
        }

        var value = valueInfo.value;
        if(valueInfo.isFun) {
            if(valueInfo.callsBase) {
                // Create base methods first, override afterwards.
                // Note valueInfo.base may be null, in which case,
                // it either ends up delegating to a proto's provided impl,
                // a defaults template impl, or,
                // if all missing, an emptyValue function.
                var base = buildPropEvaluatorValue(template, valueInfo.base, baseLevel + 1, canUseDefault);
                return cast
                    ? cgf_buildPropVarWithBaseAndCast(value, base, cast, valueInfo.castReturnFunCount)
                    : cgf_buildPropVarWithBase(value, base);
            }

            return cast
                ? cgf_buildPropVarWithCast(value, cast, valueInfo.castReturnFunCount)
                : cgf_buildPropVar(value);
        }

        // When baseLevel is 0, return the value wrapped in an object,
        // cause it is later handled specially.
        // It is stored in the Elements' _propsStaticStable prototype object.
        return !baseLevel ? {value: value} : def.fun.constant(value);
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
