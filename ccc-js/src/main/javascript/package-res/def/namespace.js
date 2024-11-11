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
/** @private */
var def_currentSpace = def, // at the end of the file it is set to def.global
    def_globalSpaces = {}, // registered global namespaces by name: globalName -> object
    def_spaceStack   = [];

/**
 * Registers a name and an object as a global namespace.
 * @param {string} name The name of the global namespace component to register.
 * @param {object} space The object that represents the namespace.
 * @returns {object} the registered namespace object.
 */
def.globalSpace = function(name, space) {
    return def_globalSpaces[name] = space;
};

/** @private */
function def_getNamespace(name, base) {
    var current = base || def_currentSpace;
    if(name) {
        var parts = name.split('.'),
            L = parts.length;
        if(L) {
            var i = 0, part;
            if(current === def.global) {
                part = parts[0];
                var globalSpace = def.getOwn(def_globalSpaces, part);
                if(globalSpace) {
                    current = globalSpace;
                    i++;
                }
            }

            while(i < L) {
                part = parts[i++];
                current = current[part] || (current[part] = {});
            }
        }
    }
    return current;
}

/**
 * Defines a relative namespace with
 * name <i>name</i> on the current namespace,
 * or, optionally, on a given base namespace.
 *
 * If a definition function is specified,
 * it is executed having the namespace as current namespace.
 *
 * If the namespace already exists, it is preserved,
 * but the definition function, if specified, is executed anyway.
 *
 * <p>
 * Namespace declarations may be nested.
 * </p>
 * <p>
 * The current namespace can be obtained by
 * calling {@link def.space} with no arguments.
 * The current namespace affects other nested declarations, such as {@link def.type}.
 * </p>
 * <p>
 * A composite namespace name contains dots, ".", separating its elements.
 * </p>
 * @example
 * <pre>
 * def.space('foo.bar', function(space) {
 *     space.hello = 1;
 * });
 * </pre>
 *
 * @function
 *
 * @param {String} name The name of the namespace to obtain.
 * If nully, the current namespace is implied.
 * @param {String|object} [base] The base namespace object or name.
 * @param {Function} definition
 * A function that is called within the desired namespace
 * as first argument and while it is current.
 *
 * @returns {object} The namespace.
 */
def.space = function(name, base, definition) {
    if(def.fun.is(base)) {
        definition = base;
        base = null;
    }

    if(def.string.is(base)) base = def_getNamespace(base);

    var space = def_getNamespace(name, base);
    if(definition) {
        def_spaceStack.push(def_currentSpace);
        try {
            definition(space);
        } finally {
            def_currentSpace = def_spaceStack.pop();
        }
    }

    return space;
};


