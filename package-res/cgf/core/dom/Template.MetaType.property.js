
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
 * This is the evaluation algorithm:
 *
 * `Template:     leafTemplate`
 * `PropertyPath: [propInfo]`
 * `Property:     PropertyPath[0]`
 *
 * 1. The value of `Property` set in `Template`.
 * 2. Any previouly set values of `Property` in `Template`, from last set to first set.
 *
 * 3. Go to 1. with `Template.proto`, if any,
 *    disabling _defaults_ instance handling (step 5.).
 *
 * 4. Go to 1. with `Template.parent`, if any,
 *    and if the `Template.parentPropInfo` is not of type list,
 *    adding the parent property to the property path:
 *
 *    `Template:     Template.parent`
 *    `PropertyPath: PropertyPath.concat(Template.parentPropInfo)`
 *
 * 5. Go to 1. with `ClassOf(Template).defaults`, if any,
 *    disabling _defaults_ instance handling (step 5.):
 *
 *    `Template: ClassOf(Template).defaults`
 *
 * 6. If this is a stable value evaluator: the _null_ value.
 * 7. If this is an interaction value evaluator:
 *    the result of the stable value evaluator (calls the property getter, recursively).
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

    var valueInfos = [];

    buildPropEvaluatorTemplate(leafTemplate, /*canUseDefault*/true);

    return buildEvaluator();

    function buildEvaluator() {
        var i = valueInfos.length,
            evaluator;

        // Special case where nothing is returned.
        // assert i > 0 || vlayer === INTERA_LAYER
        if(!i) return null;

        // All the elements in the array, but the last, must be isFun!

        // Special case where there are no functions: a single constant value.
        // We return the valueInfo to allow specialized handling:
        // the value will be stored in the Elements' _propsStaticStable prototype object.
        if(i === 1 && !valueInfos[0].isFun) return valueInfos[0];

        // Create base methods first, override afterwards.
        while(i--) {
            var valueInfo = valueInfos[i],
                value = valueInfo.value;
            if(!valueInfo.isFun) value = def.fun.constant(value);

            if(evaluator)
                evaluator = cast
                    ? cgf_buildPropVarWithBaseAndCast(value, evaluator, cast, valueInfo.castReturnFunCount)
                    : cgf_buildPropVarWithBase(value, evaluator);
            else
                evaluator = cast
                    ? cgf_buildPropVarWithCast(value, cast, valueInfo.castReturnFunCount)
                    : cgf_buildPropVar(value);
        }

        return evaluator;
    }

    // Search
    function buildPropEvaluatorTemplate(template, canUseDefault) {
        return buildPropEvaluatorValue(
            template,
            template._props[vlayer][fullName],
            canUseDefault);
    }

    function buildPropEvaluatorValue(template, valueInfo, canUseDefault) {
        var protoTemplate, defaultTemplate;
        if(!valueInfo) {
            // Resolves to null, when `proto` is cgf.dom.proto.parent and it has no parent.
            if((protoTemplate = template.proto()) &&
               !buildPropEvaluatorTemplate(protoTemplate, /*canUseDefault:*/false))
               return false;

            if(!canUseDefault) return true; // keep looking.

            // Default value from the defaults instance of the leaf template's class.
            if((defaultTemplate = template.constructor.defaults) &&
               !buildPropEvaluatorTemplate(defaultTemplate, /*canUseDefault*/false))
                return false;

            // Interaction layer has the stable value as an implicit `base`.
            if(vlayer === INTERA_LAYER) {
                // Evaluating the STABLE value is done by reentering the property getter.
                // So we simply encode a recursive call to the getter.
                if(valueInfos.length)
                    valueInfos.push({value: cgf_buildPropGetter(shortName), isFun: true});
                // else
                //   When at top level, add nothing.
                //   Prop getter handles calling stable getter.
            } else {
                valueInfos.push({value: null, isFun: false});
            }

            return false;
        }

        // Have a Value
        valueInfos.push(valueInfo);

        // Continue, if value is a function and it calls base.
        // Otherwise, no point in going further.
        return valueInfo.isFun &&
            valueInfo.callsBase &&
            buildPropEvaluatorValue(template, valueInfo.base, canUseDefault);
    }
}

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
