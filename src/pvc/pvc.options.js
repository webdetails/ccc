/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Options management utility

/**
 * Creates an options manager given an options specification object,
 * and, optionally, a corresponding context object.
 * 
 * @name pvc.options
 * @class An options manager.
 * @example
 * <pre>
 * var foo = {};
 * 
 * foo.options = pvc.options({
 *         Name: {
 *             alias: 'legendName',
 *             cast:  String,
 *             value: 'John Doe',
 *             resolve: function(context){
 *                 this.setDefault();
 *             }
 *         }
 *     }, foo);
 *     
 * foo.options.specify({
 *    'legendName': "Fritz"
 * });
 * 
 * foo.options('Name2'); // -> "Fritz"
 * </pre>
 * 
 * @constructor
 * @param {object} specs An object whose properties, owned or inherited,
 * have the name of an option to define, and whose values are option
 * specification objects, each having the following <i>optional</i> properties:
 * <ul>
 * <li>resolve - 
 * a method that allows to apply custom value resolution logic for an option.
 * 
 * It is called 
 * on the {@link pvc.options.Info} instance with the 
 * previously specified context object as argument. 
 * </li>
 * <li>cast  - a cast function, called to normalize the value of an option</li>
 * <li>value - the default value of the property, considered already cast</li>
 * </li>
 * </ul>
 * 
 * @param {object} [context=null] Optional context object on which to call
 * the 'resolve' function specified in {@link specs}.
 * 
 * @type function
 */
function pvc_options(specs, context) {
    /*jshint expr:true */
    specs || def.fail.argumentRequired('specs');
    
    var _infos = {};
    
    def.each(specs, function(spec, name) {
        var info = new pvc_OptionInfo(name, option, context, spec);
        _infos[info.name] = info;
    });
    
    /** @private */
    function resolve(name) {
        // Throws if option does not exist. But it's as is because of perf. reasons.
        return _infos[name].resolve();
    }
    
    /**
     * Obtains the value of an option given its name.
     * <p>
     * If a value for the option hasn't been provided
     * a default value is returned, 
     * from the option specification.
     * </p>
     * @name pvc.options#option
     * @function
     * @param {string} name The name of the option.
     * @param {booleam} [noDefault=false] Prevents returning a default value.
     * If a value for the option hasn't been provided, undefined is returned.
     * 
     *  @type any
     */
    function option(name, noDefault) {
        var info = resolve(name);
        return noDefault && !info.isSpecified ? undefined : info.value;
    }
    
    /**
     * Indicates if a value for a given option has been specified.
     * @name pvc.options#isSpecified
     * @function
     * @param {string} name The name of the option.
     * @type boolean
     */
    function isSpecified(name) { return resolve(name).isSpecified; }
    
    /**
     * Obtains the value of an option given its name,
     * but only if it has been specified (not defaulted).
     * <p>
     * This is a convenience method for calling {@link #option}
     * with the <tt>noDefault</tt> argument with the value <tt>true</tt>.
     * </p>
     * 
     * @name pvc.options#specified
     * @function
     * @param {string} name The name of the option.
     * 
     * @type any
     */
    function specified(name) { return option(name, /*noDefault*/ true); }
    
    /**
     * Indicates if an option with the given name is defined.
     * @name pvc.options#isDefined
     * @function
     * @param {string} name The name of the option.
     * @type boolean
     */
    function isDefined(name) { return def.hasOwn(_infos, name); }
    
    /**
     * Specifies options' values given an object
     * with properties as option names
     * and values as option values.
     * <p>
     * Only properties whose name is the name of a defined option 
     * are taken into account.
     * </p>
     * <p>
     * Every property, own or inherited, is considered, 
     * as long as its value is not <c>undefined</c>.
     * </p>
     * @name pvc.options#specify
     * @function
     * @param {object} [opts] An object with option values
     * @returns {function} The options manager. 
     */
    function specify(opts) { return set(opts, false); }
    
    /**
     * Sets options' default values.
     * @name pvc.options#defaults
     * @function
     * @param {object} [opts] An object with option default values
     * @returns {function} The options manager.
     * @see #specify
     */
    function defaults(opts) { return set(opts, true); }
    
    /**
     * Obtains the default value of an option, given its name.
     * <p>
     * If a property has no default value, <c>undefined</c> is returned.
     * </p>
     * @name pvc.options#defaultValue
     * @function
     * @param {string} name The name of the option.
     */
    function getDefaultValue(name) { return resolve(name)._defaultValue; }
    
    /** @private */
    function set(opts, isDefault) {
        for(var name in opts) {
            var info = def.hasOwnProp.call(_infos, name) && _infos[name];
            if(info) {
                var value = opts[name];
                if(value !== undefined) { info.set(value, isDefault); }
            }
        }
        
        return option;
    }
    
    // ------------
    
    option.option = option;
    option.specified   = specified; 
    option.isSpecified = isSpecified;
    option.isDefined   = isDefined;
    
    option.defaultValue = getDefaultValue;
    
    option.specify  = specify;
    option.defaults = defaults;
    
    return option;
}

// ------------
 
// Creates a resolve method, 
// that combines a list of resolvers. 
// The resolve stops when the first resolver returns the value <c>true</c>,
// returning <c>true</c> as well.
function options_resolvers(list) {
    return function(optionInfo) {
        for(var i = 0, L = list.length ; i < L ; i++) {
            var m = list[i];
            
            if(typeof m === 'string') { m = this[m]; } 
            
            if(m.call(this, optionInfo) === true) { return true; }
        }
    };
}

function options_constantResolver(value, op) {
    return function(optionInfo) {
        optionInfo.specify(value);
        return true;
    };
}

function options_specifyResolver(fun, op) {
    return function(optionInfo) {
        var value = fun.call(this, optionInfo);
        if(value !== undefined) {
            optionInfo.specify(value);
            return true;
        }
    };
}

function options_defaultResolver(fun) {
    return function(optionInfo) {
        var value = fun.call(this, optionInfo);
        if(value !== undefined) {
            optionInfo.defaultValue(value);
            return true;
        }
    };
}

pvc_options.resolvers    = options_resolvers;
pvc_options.constant     = options_constantResolver;
pvc_options.specify      = options_specifyResolver;
pvc_options.defaultValue = options_defaultResolver;

// ------------

pvc.options = pvc_options;

// ------------

/**
 * @name pvc.options.OptionInfo
 * @class An option in an options manager.
 * @private
 */
var pvc_OptionInfo = 
def
.type() // Anonymous type
.init(function(name, option, context, spec){
    this.name = name;
    this._context = context;
    this.option = option;
    
    this._cast = def.get(spec, 'cast');
    
    // Assumed already cast
    // May be undefined
    var value = def.get(spec, 'value');
    if(value !== undefined) { this._defaultValue = this.value = value; }
    
    var resolve = def.get(spec, 'resolve'); // function or string
    if(resolve) { this._resolve = resolve; } 
    else        { this.isResolved = true; }

    var getDefault = def.get(spec, 'getDefault'); // function or string
    if(getDefault) { this._getDefault = getDefault; }
    
    var data = def.get(spec, 'data');
    if(data != null) { this.data = data; }
    
    // --------
    // Can be used by resolvers...
    this.alias = def.array.to(def.get(spec, 'alias'));
})
.add( /** @lends pvc.options.OptionInfo#  */{
    isSpecified: false,
    isResolved:  false,
    value:   undefined,
    
    /** @private */
    _defaultValue: undefined,
    
    /**
     * Resolves an option if it is not yet resolved.
     * @type pvc.options.Info
     */
    resolve: function() {
        if(!this.isResolved) {
            // In case of re-entry, the initial default value is obtained.
            this.isResolved = true;
            
            // Must call 'set', 'specify' or 'defaultValue'
            // Otherwise, the current default value becomes _the_ value.
            this._getFunProp('_resolve').call(this._context, this);
            
            // Handle the case where none of the above referred methods is called.
            if(this.value == null) {
                var value = this._dynDefault();
                if(value != null) {
                    delete this.isSpecified;
                    this.value = this._defaultValue = value;
                }
            }
        }
        
        return this;
    },
    
    /**
     * Specifies the value of the option.
     * 
     * @param {any} value the option value.
     * @type pvc.options.Info
     */
    specify: function(value) { return this.set(value, false); },
    
    /**
     * Gets, and optionally sets, the default value.
     * @param {any} [value=undefined] the option default value.
     * @type any
     */
    defaultValue: function(defaultValue) {
        if(defaultValue !== undefined) { this.set(defaultValue, true); }
        
        return this._defaultValue;
    },
    
    cast: function(value) {
        if(value != null) {
            var cast = this._getFunProp('_cast');
            if(cast) { value = cast.call(this._context, value, this); }
        }
        return value;
    },
    
    /**
     * Sets the option's value or default value.
     * 
     * @param {any} [value=undefined] the option value or default value.
     * @param {boolean} [isDefault=false] indicates if the operation sets the default value.
     * 
     * @type pvc.options.Info
     */
    set: function(value, isDefault) {
        if(value != null) { value = this.cast(value); }
        
        if(value == null) {
            value = this._dynDefault();
            if(value != null) { isDefault = true; }
        }
        
        if(!isDefault) {
            this.isSpecified = true;
            this.isResolved  = true;
            this.value = value;
        } else {
            delete this.isSpecified; // J.I.C. 'defaultValue' is called after a 'specify'
            
            this._defaultValue = value;
            
            // Don't touch an already specified value
            if(!this.isSpecified) { this.value = value; }
        }
        
        return this;
    },
    
    _dynDefault: function() {
        var get = this._getFunProp('_getDefault');
        return get && this.cast(get.call(this._context, this));
    },

    _getFunProp: function(name) {
        var fun = this[name];
        if(fun) {
            var context = this._context;
            if(context && typeof fun === 'string') { fun = context[fun]; }
        }
        return fun;
    }
});