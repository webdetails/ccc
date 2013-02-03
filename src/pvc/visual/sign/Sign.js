
def.type('pvc.visual.Sign', pvc.visual.BasicSign)
.init(function(panel, pvMark, keyArgs){
    
    this.base(panel, pvMark, keyArgs);
    
    this.bits = 0;
    
    var extensionIds = def.get(keyArgs, 'extensionId');
    if(extensionIds != null){ // empty string is a valid extension id.
        this.extensionAbsIds = def.array.to(panel._makeExtensionAbsId(extensionIds));
    }
    
    this.isActiveSeriesAware = def.get(keyArgs, 'activeSeriesAware', true) && 
                               !!this.chart.visualRoles('series', {assertExists: false});
    
    /* Extend the pv mark */
    var wrapper = def.get(keyArgs, 'wrapper');
    if(!wrapper){
        wrapper = function(f){
            return function(scene){
                return f.call(panel._getContext(pvMark), scene);
            };
        };
    }
    pvMark.wrapper(wrapper);
    
    if(!def.get(keyArgs, 'freeColor', true)){
        this._bindProperty('fillStyle',   'fillColor',   'color')
            ._bindProperty('strokeStyle', 'strokeColor', 'color')
            ;
    }
})
.postInit(function(panel, pvMark, keyArgs){
    
    panel._addSign(this);
    
    this._addInteractive(keyArgs);
})
.add({
    // To be called on prototype
    property: function(name){
        var upperName  = def.firstUpperCase(name);
        var baseName   = 'base'        + upperName;
        var defName    = 'default'     + upperName;
        var normalName = 'normal'      + upperName;
        var interName  = 'interactive' + upperName;
        
        var methods = {};
        
        // color
        methods[name] = function(arg){
            delete this._finished;
            
            var value;
            this._arg = arg; // for use in calling default methods (see #_bindProperty)
            try{
                value = this[baseName](arg);
                if(value == null){ // undefined included
                    return null;
                }
                
                if(this.hasOwnProperty('_finished')){
                    return value;
                }
                
                if(this.showsInteraction() && this.scene.anyInteraction()) {
                    // interactiveColor
                    value = this[interName](value, arg);
                } else {
                    // normalColor
                    value = this[normalName](value, arg);
                }
            } finally{
                delete this._arg;
            }
            
            return value;
        };
        
        // baseColor
        methods[baseName] = function(arg){
            // Override this method if user extension
            // should not always be called.
            // It is possible to call the default method directly, if needed.
            
            // defName is installed as a user extension and 
            // is called if the user hasn't extended...
            return this.delegateExtension();
        };
        
        // defaultColor
        methods[defName]    = function(arg){ return; };
        
        // normalColor
        methods[normalName] = function(value, arg){ return value; };
        
        // interactiveColor
        methods[interName]  = function(value, arg){ return value; };
        
        this.constructor.add(methods);
        
        return this;
    },
    
    // Call this function with a final property value
    // to ensure that it will not be processed anymore
    finished: function(value){
        this._finished = true;
        return value;
    },
    
    /* Extensibility */
    /**
     * Any protovis properties that have been specified 
     * before the call to this method
     * are either locked or are defaults.
     * 
     * This method applies user extensions to the protovis mark.
     * Default properties are replaced.
     * Locked properties are respected.
     * 
     * Any function properties that are specified 
     * after the call to this method
     * will have access to the user extension by 
     * calling {@link pv.Mark#delegate}.
     */
    applyExtensions: function(){
        if(!this._extended){
            this._extended = true;
            
            var extensionAbsIds = this.extensionAbsIds;
            if(extensionAbsIds){
                extensionAbsIds.forEach(function(extensionAbsId){
                    this.panel.extendAbs(this.pvMark, extensionAbsId);
                }, this);
            }
        }
        
        return this;
    },
    
    // -------------
    
    intercept: function(name, fun){
        return this._intercept(name, fun.bind(this));
    },
    
    // -------------
    
    lockDimensions: function(){
        this.pvMark
            .lock('left')
            .lock('right')
            .lock('top')
            .lock('bottom')
            .lock('width')
            .lock('height');
        
        return this;
    },
    
    // -------------
    _extensionKeyArgs: {tag: pvc.extensionTag},
    
    _bindProperty: function(pvName, prop, realProp){
        var me = this;
        
        if(!realProp){
            realProp = prop;
        }
        
        var defaultPropName = "default" + def.firstUpperCase(realProp);
        if(def.fun.is(this[defaultPropName])){
            // Intercept with default method first, before extensions,
            // so that extensions, when ?existent?, can delegate to the default.
            
            // Extensions will be applied next.
            
            // If there already exists an applied extension then
            // do not install the default (used by legend proto defaults,
            // that should act like user extensions, and not be shadowed by prop defaults).
            
            // Mark default as pvc.extensionTag, 
            // so that it is chosen when 
            // the user hasn't specified an extension point.

            if(!this.pvMark.hasDelegateValue(pvName, pvc.extensionTag)){
                var defaultMethodCaller = function(){
                    return me[defaultPropName](me._arg);
                };
                
                this.pvMark.intercept(
                        pvName, 
                        defaultMethodCaller, 
                        this._extensionKeyArgs);
            }
        }
        
        // Intercept with main property method
        // Do not pass arguments, cause property methods do not use them,
        // they use this.scene instead.
        // The "arg" argument can only be specified explicitly,
        // like in strokeColor -> color and fillColor -> color,
        // via "helper property methods" that ?fix? the argument.
        // In these cases, 'strokeColor' is the "prop", while
        // "color" is the "realProp".
        function mainMethodCaller(){
            return me[prop]();
        }
        
        return this._intercept(pvName, mainMethodCaller);
    },
    
    _intercept: function(name, fun){
        var mark = this.pvMark;
        
        // Apply all extensions, in order
        
        var extensionAbsIds = this.extensionAbsIds;
        if(extensionAbsIds){
            def
            .query(extensionAbsIds)
            .select(function(extensionAbsId){ 
                return this.panel._getExtensionAbs(extensionAbsId, name);
             }, this)
            .where(def.notUndef)
            .each(function(extValue){
                extValue = mark.wrap(extValue, name);
                
                // Gets set on the mark; We intercept it afterwards.
                // Mark with the pvc.extensionTag so that it is 
                // possible to filter extensions.
                mark.intercept(name, extValue, this._extensionKeyArgs);
            }, this);
        }
        
        // Intercept with specified function (may not be a property function)
        
        (mark._intercepted || (mark._intercepted = {}))[name] = true;
        
        mark.intercept(name, fun);
        
        return this;
    }
})
.prototype
.property('color')
.constructor
.add({
    _bitShowsActivity:     2,
    _bitShowsSelection:    4,
    _bitShowsInteraction:  4 | 2, // 6
    _bitShowsTooltip:      8,
    _bitSelectable:       16,
    _bitHoverable:        32,
    _bitClickable:        64,
    _bitDoubleClickable: 128,
    
    showsInteraction:  function(){ return (this.bits & this._bitShowsInteraction) !== 0; },
    showsActivity:     function(){ return (this.bits & this._bitShowsActivity   ) !== 0; },
    showsSelection:    function(){ return (this.bits & this._bitShowsSelection  ) !== 0; },
    showsTooltip:      function(){ return (this.bits & this._bitShowsTooltip    ) !== 0; },
    isSelectable:      function(){ return (this.bits & this._bitSelectable      ) !== 0; },
    isHoverable:       function(){ return (this.bits & this._bitHoverable       ) !== 0; },
    isClickable:       function(){ return (this.bits & this._bitClickable       ) !== 0; },
    isDoubleClickable: function(){ return (this.bits & this._bitDoubleClickable ) !== 0; },
    
    extensionAbsIds: null,
    
    _addInteractive: function(keyArgs){
        var panel   = this.panel,
            pvMark  = this.pvMark,
            chart   = this.chart,
            options = chart.options;
        
        var bits = this.bits;
        bits |= this._bitShowsInteraction;
        
        if(chart._tooltipEnabled && !def.get(keyArgs, 'noTooltip')){
            bits |= this._bitShowsTooltip;
            
            this.panel._addPropTooltip(pvMark, def.get(keyArgs, 'tooltipArgs'));
        }
        
        var clickSelectable = false;
        var clickable = false;
        
        if(options.selectable || options.hoverable){
            if(options.selectable && !def.get(keyArgs, 'noSelect')){
                bits |= this._bitSelectable;
                clickSelectable = !def.get(keyArgs, 'noClickSelect') &&
                                  chart._canSelectWithClick();
            }
            
            if(options.hoverable && !def.get(keyArgs, 'noHover')){
                bits |= this._bitHoverable;
                
                panel._addPropHoverable(pvMark);
            }
        }
        
        // By default interaction is SHOWN if the sign
        // is sensitive to interactive events.
        
        // This must be after the previous options, that affect bits with _bitShowsInteraction
        var showsInteraction = def.get(keyArgs, 'showsInteraction');
        if(showsInteraction != null){
            if(showsInteraction){
                bits |=  this._bitShowsInteraction;
            } else {
                bits &= ~this._bitShowsInteraction;
            }
        }
        
        var showsActivity = def.get(keyArgs, 'showsActivity');
        if(showsActivity != null){
            if(showsActivity){
                bits |=  this._bitShowsActivity;
            } else {
                bits &= ~this._bitShowsActivity;
            }
        }
        
        var showsSelection = def.get(keyArgs, 'showsSelection');
        if(showsSelection != null){
            if(showsSelection){
                bits |=  this._bitShowsSelection;
            } else {
                bits &= ~this._bitShowsSelection;
            }
        }
        
        if(!def.get(keyArgs, 'noClick') && panel._isClickable()){
            bits |= this._bitClickable;
            clickable = true;
        }
        
        if(clickSelectable || clickable){
            panel._addPropClick(pvMark);
        }
        
        if(!def.get(keyArgs, 'noDoubleClick') && panel._isDoubleClickable()){
            bits |= this._bitDoubleClickable;
            
            panel._addPropDoubleClick(pvMark);
        }
        
        this.bits = bits;
    },
    
    /* COLOR */
    fillColor: function(){ 
        return this.color('fill');
    },
    
    strokeColor: function(){ 
        return this.color('stroke');
    },

    defaultColor: function(type){
        return this.defaultColorSceneScale()(this.scene);
    },

    dimColor: function(color, type){
        return pvc.toGrayScale(color, -0.3, null, null); // ANALYZER requirements, so until there's no way to configure it...
    },
    
    _initDefaultColorSceneScale: function(){
        var colorAxis = this.panel.axes.color;
        return colorAxis ? 
               colorAxis.sceneScale({nullToZero: false}) :
               def.fun.constant(pvc.defaultColor)
               ;
    },
    
    defaultColorSceneScale: function(){
        return this._defaultColorSceneScale || 
               (this._defaultColorSceneScale = this._initDefaultColorSceneScale());
    }
});
