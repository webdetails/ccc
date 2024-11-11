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

var def_configBlackList = {tryConfigure: 1, configure: 1, $type: 1};

/**
 * Configures an object given a configuration object.
 *
 * If the object being configured implements a method named "configure", then that method is called,
 * otherwise, configuration is handled by the generic configuration function, {@link def.configure.generic}.
 *
 * @function
 * @param {object} pub An object to configure.
 * @param {object} [config] A configuration object.
 * If it is a direct instance of <tt>Object</tt> (like objects created using literals),
 * then its own and inherited properties are used to configure <i>pub</i>.
 *
 * Else, if <i>pub</i> has a <i>tryConfigure</i> method,
 * then that method is used to (try to) configure it from the given value.
 *
 * @return {object} The configured object, <i>pub</i>.
 */
def.configure = def.config = def_config;

def.configurable = function(yes, v) {
  return def.info(v, {configurable: !!yes});
};

function def_config(pub, config) {
    if(config) {
        var cfg = pub.configure;
        if(def.fun.is(cfg))
            cfg.call(pub, config);
        else
            def_config.generic(pub, config);
    }
    return pub;
}

def.copyOwn(def_config, /** @lends def.configure */{
    /**
     * Configures an object, given a configuration object, in a generic way.
     *
     * This function is used when the object being configured does not directly implement
     * a "configure" method.
     *
     * @param {object|Array} pub An object to configure.
     * @param {object} [configs] A configuration object or an array of.
     * If it is a direct instance of <tt>Object</tt> (like objects created using literals),
     * then its own and inherited properties are used to configure <i>pub</i>.
     *
     * Else, if <i>pub</i> has a <i>tryConfigure</i> method,
     * then that method is used to (try to) configure it from the given value.
     *
     * @return {object} The configured object, <i>pub</i>.
     */
    generic: function(pub, configs) {
        if(configs) def.array.each(configs, function(config) {
            var m;
            if(config.constructor === Object)
                def_config.setters(pub, config);
            else if(pub !== config && (m = pub.tryConfigure) && def.fun.is(m) && m.call(pub, config))
                ; // noop
            // TODO: else log ignored
        });
        return pub;
    },

    isPropConfigurable: function(n) {
        return !!n && n.charAt(0) !== '_' && !O_hasOwn.call(def_configBlackList, n);
    },

    /**
     * Configures an object given a configuration object.
     *
     * The values of the configuration object's own and inherited properties
     * are passed to correspondingly named setters of `pub`.
     *
     * @param {object} pub An object to configure.
     * @param {object} [config] A configuration object whose own and inherited properties are used to configure <i>pub</i>.
     * @return {object} The configured object, <i>pub</i>.
     */
    setters: function(pub, config) {
        if(config) def_config.expand1(config).forEach(function(configx) {
            def.each(configx, function(v, name) {
                def_config.setter(pub, name, v);
            });
        });
        return pub;
    },

    setter: function(pub, name, value) {
        var m, m0, l, v0;

        if(value !== undefined &&
           def_config.isPropConfigurable(name) &&
           def.fun.is((m = pub[name])) &&
           (m0 = m.valueOf()) &&
           def.info.get(m0, 'configurable', (l = m0.length) >= 1)) {

            // TODO: Check probable break of extension point legend$Dot
            if(def.attached.is(name)) {
                def.attached(pub, name, value);
            } else if(l) {
                m.call(pub, value);
            } else {
                v0 = m.call(pub);
                if(def.object.is(v0) || def.fun.is(v0)) def_config(v0, value);
                // TODO: else log ignored
            }
        } // TODO: else log ignored
        return pub;
    },

    expand1: function(configs) {
        return def_config_expand(configs, true);
    },

    expand: def_config_expand
});

function def_config_expand(configs, one) {
    if(!configs) return [];

    var roots = [];

    def.array.each(configs, processConfig);

    return roots;

    function processConfig(config) {
        var root = {};
        roots.push(root);

        for(var name in config) if(name) {
            var v = config[name];
            if(v === undefined) continue;

            var curr  = root,
                di    = name.indexOf('.'),
                names = null, L, i, n, next;

            if(di >= 0) {
                if(one) {
                    names = [name.substr(0, di)];
                    name  = name.substr(di + 1);
                } else {
                    names = name.split('.');
                    name  = names.pop();
                }
                L = names.length;
                i = -1;
                while(++i < L) if((n = names[i])) {
                    next = curr[n];
                    if(next === undefined) {
                        curr[n] = next = {};
                    } else if(next === null || !def.object.is(next) || next.constructor !== Object) {
                        // Create a new root, and recreate the path
                        roots.push((root = next = {}));
                        i = -1;
                    }
                    curr = next;
                }
            }

            var v0 = curr[name];
            if(v0 !== v) {
                if(v0 !== undefined) {
                    // Unless these are both "merge-able" objects
                    //  this means that the user is somehow depending on the order
                    //  of keys in objects, something which is not standard in ECMAScript,
                    //  or consistent across JS engines.
                    // We support only plain JS objects and Arrays.
                    // Anything else is considered an error, logged and skipped.
                    if(!def_config_isMergeableObject(v) || !def_config_isMergeableObject(v0))
                        continue; // TODO: log this

                    // Let pass-through, but create a new root, to avoid any possible semantic confusions
                    roots.push((root = curr = {}));
                    if(names) {
                        i = -1;
                        while(++i < L) if((n = names[i])) curr = curr[n] = {};
                    }
                }

                curr[name] = v;
            }
        }
    }
}

function def_config_isMergeableObject(v) {
    return v && def.object.is(v) && !def_config_isCustomObject(v);
}

function def_config_isCustomObject(v) {
    return v.constructor !== Object && !(v instanceof Array);
}
