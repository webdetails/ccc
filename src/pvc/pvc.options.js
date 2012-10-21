
// Options management utility
def.scope(function(){
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
     * <li>alias - name or array of names on which the option is also registered.
     * </li>
     * </ul>
     * 
     * @param {object} [context=null] Optional context object on which to call
     * the 'resolve' function specified in {@link specs}.
     * 
     * @type function
     */
    function options(specs, context){
        /*jshint expr:true */
        specs || def.fail.argumentRequired('specs');
        
        var _infos = {};
        
        def.each(specs, function(spec, name){
            var info = new OptionInfo(name, option, context, spec);
            
            _infos[info.name] = info;
            
            var aliases = info.alias;
            if(aliases){
                aliases.forEach(function(alias){
                    _infos[alias] = info;
                });
            }
        });
        
        /** @private */
        function resolve(name){
            var info = def.getOwn(_infos, name) || 
                       def.fail.operationInvalid("Undefined option '{0}'", [name]);
            
            return info.resolve();
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
        function option(name, noDefault){
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
        function isSpecified(name){
            return resolve(name).isSpecified;
        }
        
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
        function specified(name){
            return option(name, /*noDefault*/ true);
        }
        
        /**
         * Indicates if an option with the given name is defined.
         * @name pvc.options#isDefined
         * @function
         * @param {string} name The name of the option.
         * @type boolean
         */
        function isDefined(name){
            return def.hasOwn(_infos, name);
        }
        
        /**
         * Specifies options' values given an object
         * with properties as option names
         * and values as option values.
         * <p>
         * Only properties whose name is the name of a defined option,
         * or one of its aliases, are taken into account.
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
        function specify(opts){
            return set(opts, false);
        }
        
        /**
         * Sets options' default values.
         * @name pvc.options#defaults
         * @function
         * @param {object} [opts] An object with option default values
         * @returns {function} The options manager.
         * @see #specify
         */
        function defaults(opts){
            return set(opts, true);
        }
        
        /**
         * Obtains the default value of an option, given its name.
         * <p>
         * If a property has no default value, <c>undefined</c> is returned.
         * </p>
         * @name pvc.options#defaultValue
         * @function
         * @param {string} name The name of the option.
         */
        function getDefaultValue(name){
            return resolve(name)._defaultValue;
        }
        
        /** @private */
        function set(opts, isDefault){
            for(var name in opts){
                var info = def.getOwn(_infos, name);
                if(info){
                    var value = opts[name];
                    if(value !== undefined){
                        info.set(name, isDefault);
                    }
                }
            }
            
            return option;
        }
        
        // ------------
        
        option.option = option;
        options.specified  = specified; 
        option.isSpecified = isSpecified;
        option.isDefined   = isDefined;
        
        option.defaultValue = getDefaultValue;
        
        option.specify  = specify;
        option.defaults = defaults;
        
        return option;
    }
    
    // ------------
    
    pvc.options = options;
    
    // ------------
    
    /**
     * @name pvc.options.Info
     * @class An option in an options manager. 
     */
    var OptionInfo = def.type()
    .init(function(name, option, context, spec){
        this.name = name;
        
        this._context = context;
        this.option = option;
        
        this.cast = def.get(spec, 'cast');
        
        // Assumed already cast
        // May be undefined
        var value = def.get(spec, 'value');
        if(value !== undefined){
            this._defaultValue = this.value = value;
        }
        
        this.resolveCore = def.get(spec, 'resolve');
        if(!this.resolveCore){
            this.isResolved = true;
        }
        
        // --------
        
        this.alias = def.array.as(def.get(spec, 'alias'));
    })
    .add( /** @lends @name pvc.options.Info#  */{
        isSpecified: false,
        isResolved: false,
        value: undefined,
        
        /** @private */
        _defaultValue: undefined,
        
        /**
         * Resolves an option if it is not yet resolved.
         * @type pvc.options.Info
         */
        resolve: function(){
            if(!this.isResolved){
                // In case of re-entry, the initial default value is obtained.
                this.isResolved = true;
                
                // Must call set, specify or setDefault
                this.resolveCore(this._context);
            }
            
            return this;
        },
        
        /**
         * Specifies the value of the option.
         * 
         * @param {any} value the option value.
         * @type pvc.options.Info
         */
        specify: function(value){
            return this.set(value, false);
        },
        
        /**
         * Gets, and optionally sets, the default value.
         * @param {any} [value=undefined] the option default value.
         * @type any
         */
        defaultValue: function(defaultValue){
            if(defaultValue !== undefined){
                this.set(defaultValue, true);
            }
            
            return this._defaultValue;
        },
        
        /**
         * Sets the option's value or default value.
         * 
         * @param {any} [value=undefined] the option value or default value.
         * @param {boolean} [isDefault=false] indicates if the operation sets the default value.
         * 
         * @type pvc.options.Info
         */
        set: function(value, isDefault){
            if(value != null){
                if(this.cast){
                    // not a method // <<--??being called like one...
                    value = this.cast(value, this._context);
                }
            }
            
            if(!isDefault){
                this.isSpecified = true;
                this.isResolved  = true;
                this.value = value;
            } else {
                this._defaultValue = value;
                
                // Don't touch an already specified value
                if(!this.isSpecified){
                    this.value = value;
                }
            }
            
            return this;
        }
    });
});