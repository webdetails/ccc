
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
 * This is PHASE 1 of the evaluation algorithm:
 *
 * 1. If `property` has a **local value** in `template`, use it.
 *    1. If the value is not a function or does not call _base_, STOP.
 *    2. While `property` has a **previous value** in `template`, use it.
 *       1. If the value is not a function or does not call _base_, STOP.
 *
 * 2. If `template` has a **prototype** template,
 *    go to 1., with `template.proto` as `template`,
 *    but with default value processing disabled.
 *
 * 3. If parent template processing is enabled.
 *    1. If `template` has a parent, and
 *       the parent property is not of a list type:
 *       * Add the parent property to the property path.
 *       * Go to 2., with the parent as `template` and
 *         add the parent property to the property path.
 *         * Going to 1. would lead back to where we are now.
 *         * Also, structural properties do not have previous values.
 *
 * 4. If default value processing is enabled:
 *    1. If `ClassOf(template)` has a `defaults` template,
 *       go to 1., with it as `template`,
 *       but with default value processing disabled.
 *
 * PHASE 2:
 * 1. If no value was found,
 *    or if the last used value is a function that calls base:
 *    1. If this is a stable value evaluator, use the _null_ value.
 *    2. Else, if this is an interaction value evaluator,
 *       use the result of the stable value evaluator
 *       (calls the property getter, recursively).
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

    var vis = [];

    if(!findEvaluatorsTemplate(
            leafTemplate,
            [{fullName: fullName, vlayer: vlayer}],
            0,
            /*canUseDefault:*/true,
            /*canGoParent:*/true)) {
        // PHASE 2: Ultimate default value: null or stable getter.
        // Interaction layer has the stable value as an implicit `base`.
        if(vlayer === INTERA_LAYER) {
            // Evaluating the STABLE value is done by reentering the property getter.
            // So we simply encode a recursive call to the getter.
            if(vis.length)
                vis.push({value: cgf_buildPropGetter(shortName), isFun: true});
            // else
            //   When at top level, add nothing.
            //   Prop getter handles calling stable getter.
        } else {
            vis.push({value: null, isFun: false});
        }
    }

    return buildEvaluator();

    function buildEvaluator() {
        var i = vis.length,
            evaluator;

        // Special case where nothing is returned.
        // assert i > 0 || vlayer === INTERA_LAYER
        if(!i) return null;

        // All the elements in the array, but the last, must be isFun!

        // Special case where there are no functions: a single constant value.
        // We return the valueInfo to allow specialized handling:
        // the value will be stored in the Elements' _propsStaticStable prototype object.
        if(i === 1 && !vis[0].isFun) return vis[0];

        // Create base methods first, override afterwards.
        while(i--) {
            var vi = vis[i],
                value = vi.value;
            if(!vi.isFun) value = def.fun.constant(value);

            if(evaluator)
                evaluator = cast
                    ? cgf_buildPropVarWithBaseAndCast(
                            value,
                            evaluator,
                            cast,
                            vi.castReturnFunCount)

                    : cgf_buildPropVarWithBase(value, evaluator);
            else
                evaluator = cast
                    ? cgf_buildPropVarWithCast(value, cast, vi.castReturnFunCount)
                    : cgf_buildPropVar(value);
        }

        return evaluator;
    }

    // Return true as soon as:
    // i)  a constant value is found, or
    // ii) a function that does not call base is found.
    function findEvaluatorsTemplate(template, props, j, canUseDefault, canGoParent) {
        return findEvaluatorsValue(
            template,
            template._props[props[j].vlayer][props[j].fullName],
            props,
            j,
            canUseDefault,
            canGoParent);
    }

    function findEvaluatorsValue(template, vi, props, j, canUseDefault, canGoParent) {
        // Have a Value.
        if(vi) {
            if(j < props.length - 1) {
                // Structural property. Need to go deeper.
                // NOTE: vi is directly the template.
                if(vi != null &&
                   findEvaluatorsTemplate(vi, props, j + 1, canUseDefault, /*canGoParent:*/false))
                    return true;

            } else {
                // Terminal property - Atom
                vis.push(vi);

                // Continue, if value is a function that calls base.
                // Otherwise, no point in going further.
                return !vi.isFun ||
                       !vi.callsBase ||
                       findEvaluatorsValue(template, vi.base, props, j,
                           canUseDefault, canGoParent);
            }
        }

        var parentTemplate, piParent;

        if(canGoParent && (parentTemplate = template.parent) &&
           (piParent = template.parentProperty) && !piParent.prop.isList &&
           // Skipping vi evaluation to not come back here!
           findEvaluatorsValue(parentTemplate, null,
                [{fullName: piParent.prop.fullName, vlayer: 0}].concat(props),
                0,
                /*canUseDefault:*/canUseDefault, /*canGoParent:*/true))
            return true;

        var protoTemplate, defaultTemplate;

        // Resolves to null, when `proto` is cgf.dom.proto.parent and it has no parent.
        if((protoTemplate = template.proto()) &&
           findEvaluatorsTemplate(protoTemplate, props, j,
               /*canUseDefault:*/false, /*canGoParent:*/false))
           return true;

        // Default value from the defaults instance of the leaf template's class.
        if(canUseDefault &&
           (defaultTemplate = template.constructor.defaults) &&
           findEvaluatorsTemplate(defaultTemplate, props, j,
               /*canUseDefault:*/false, /*canGoParent:*/false))
           return true;

        return false;
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
