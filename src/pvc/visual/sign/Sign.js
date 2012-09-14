
def.type('pvc.visual.Sign')
.init(function(panel, pvMark, keyArgs){
    this.chart  = panel.chart;
    this.panel  = panel;
    this.pvMark = pvMark;
    
    this.bits = 0;
    
    var extensionId = def.get(keyArgs, 'extensionId');
    if(extensionId != null){
        this.extensionAbsId = panel._makeExtensionAbsId(extensionId);
    }
    
    this.isActiveSeriesAware = def.get(keyArgs, 'activeSeriesAware', true) && 
                               !!this.chart.visualRoles('series', {assertExists: false});
    
    /* Extend the pv mark */
    pvMark
        .localProperty('_scene', Object)
        .localProperty('group',  Object);
    
    var wrapper = def.get(keyArgs, 'wrapper');
    if(!wrapper){
        wrapper = function(f){
            return function(scene){
                return f.call(panel._getContext(pvMark), scene);
            };
        };
    }
    pvMark.wrapper(wrapper);
    
    this.lockMark('_scene', function(scene){ return scene; })
        /* TODO: remove these when possible and favor access through scene */
        .lockMark('group',  function(scene){ return scene && scene.group; })
        .lockMark('datum',  function(scene){ return scene && scene.datum; })
        ;
    
    pvMark.sign = this;
    
    /* Intercept the protovis mark's buildInstance */
    
    // Avoid doing a function bind, cause buildInstance is a very hot path
    pvMark.__buildInstance = pvMark.buildInstance;
    pvMark.buildInstance   = this._dispatchBuildInstance;
})
.postInit(function(panel, pvMark, keyArgs){
    
    panel._addSign(this);
    
    this._addInteractive(keyArgs);
})
.add({
    _bitShowsInteraction:  4,
    _bitShowsTooltips:     8,
    _bitSelectable:       16,
    _bitHoverable:        32,
    _bitClickable:        64,
    _bitDoubleClickable: 128,
    
    showsInteraction:  function(){ return true; /*(this.bits & this._bitShowsInteraction ) !== 0;*/ },
    showsTooltips:     function(){ return (this.bits & this._bitShowsTooltips  ) !== 0; },
    isSelectable:      function(){ return (this.bits & this._bitSelectable     ) !== 0; },
    isHoverable:       function(){ return (this.bits & this._bitHoverable      ) !== 0; },
    isClickable:       function(){ return (this.bits & this._bitClickable      ) !== 0; },
    isDoubleClickable: function(){ return (this.bits & this._bitDoubleClickable) !== 0; },
    
    extensionAbsId: null,
    
    _addInteractive: function(keyArgs){
        var panel   = this.panel,
            pvMark  = this.pvMark,
            options = this.chart.options;
        
        var bits = this.bits;
        
        if(options.showTooltips && !def.get(keyArgs, 'noTooltips')){
            bits |= this._bitShowsTooltips;
            
            this.panel._addPropTooltip(pvMark, def.get(keyArgs, 'tooltipArgs'));
        }
        
        var selectable = false;
        var clickable  = false;
        
        if(options.selectable || options.hoverable){
            if(options.selectable && !def.get(keyArgs, 'noSelect')){
                bits |= (this._bitShowsInteraction | this._bitSelectable);
                selectable = true;
            }
            
            if(options.hoverable && !def.get(keyArgs, 'noHover')){
                bits |= (this._bitShowsInteraction | this._bitHoverable);
                
                panel._addPropHoverable(pvMark);
            }
            
            var showsInteraction = def.get(keyArgs, 'showsInteraction');
            if(showsInteraction != null){
                if(showsInteraction){
                    bits |=  this._bitShowsInteraction;
                } else {
                    bits &= ~this._bitShowsInteraction;
                }
            }
        }
        
        if(!def.get(keyArgs, 'noClick') && panel._isClickable()){
            bits |= this._bitClickable;
            clickable = true;
        }
        
        if(selectable || clickable){
            panel._addPropClick(pvMark);
        }
        
        if(!def.get(keyArgs, 'noDoubleClick') && panel._isDoubleClickable()){
            bits |= this._bitDoubleClickable;
            
            panel._addPropDoubleClick(pvMark);
        }
        
        this.bits = bits;
    },
    
    /* SCENE MAINTENANCE */
    _dispatchBuildInstance: function(instance){
        // this: the mark
        this.sign._buildInstance(this, instance);
    },
    
    _buildInstance: function(mark, instance){
        /* Reset scene/instance state */
        this.pvInstance = instance; // pv Scene
        
        var scene  = instance.data;
        this.scene = scene;
        
        var index = scene ? scene.childIndex() : 0;
        this.index = index < 0 ? 0 : index;
        
        /* 
         * Update the scene's render id, 
         * which possibly invalidates per-render
         * cached data.
         */
        /*global scene_renderId:true */
        scene_renderId.call(scene, mark.renderId());

        /* state per: sign & scene & render */
        this.state = {};

        mark.__buildInstance.call(mark, instance);
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
            
            var extensionAbsId = this.extensionAbsId;
            if(extensionAbsId){
                this.panel.extendAbs(this.pvMark, extensionAbsId);
            }
        }
        
        return this;
    },
    
    // -------------
    
    localProperty: function(name, type){
        this.pvMark.localProperty(name, type);
        return this;
    },
    
    // -------------
    
    intercept: function(name, fun){
        return this._intercept(name, fun.bind(this));
    },
    
    lock: function(name, value){
        return this.lockMark(name, this._bindWhenFun(value));
    },
    
    optional: function(name, value){
        return this.optionalMark(name, this._bindWhenFun(value));
    },
    
    // -------------
    
    lockMark: function(name, value){
        this.pvMark.lock(name, value);
        return this;
    },
    
    optionalMark: function(name, value){
        this.pvMark[name](value);
        return this;
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
    
    _interceptDynamic: function(name, method){
        // Extensions must have been applied or interception does not work.
        return this._intercept(name, def.methodCaller('' + method, this));
    },
    
    _intercept: function(name, fun){
        var extensionAbsId = this.extensionAbsId;
        if(extensionAbsId){
            var extValue = this.panel._getExtensionAbs(extensionAbsId, name);
            if(extValue !== undefined){
                // Gets set on the mark; We intercept it afterwards
                this.pvMark.intercept(name, extValue);
            }
        }
        
        var mark = this.pvMark;
        
        (mark._intercepted || (mark._intercepted = {}))[name] = true;
        mark.intercept(name, fun); // override
        
        return this;
    },
    
    _lockDynamic: function(name, method){
        return this.lockMark(name, def.methodCaller('' + method, this));
    },
    
    // -------------
    
    delegate: function(dv, tag){
        return this.pvMark.delegate(dv, tag);
    },
    
    delegateExtension: function(dv){
        return this.pvMark.delegate(dv, pvc.extensionTag);
    },
    
    hasDelegate: function(tag){
        return this.pvMark.hasDelegate(tag);
    },
    
    hasExtension: function(){
        return this.pvMark.hasDelegate(pvc.extensionTag);
    },
    
    // -------------
    
    _bindWhenFun: function(value){
        if(typeof value === 'function'){
            return value.bind(this);
        }
        
        return value;
    },
    
    /* COLOR */
    color: function(type){
        var color = this.baseColor(type);
        if(color === null){
            return null;
        }

        if(this.showsInteraction() && this.scene.anyInteraction()) {
            color = this.interactiveColor(type, color);
        } else {
            color = this.normalColor(type, color);
        }

        return color;
    },
    
    baseColor: function(type){
        var color = this.delegateExtension();
        if(color === undefined){
            color = this.defaultColor(type);
        }
        
        return color;
    },
    
    _initDefaultColorSceneScale: function(){
        var colorAxis = this.panel.defaultColorAxis();
        if(colorAxis){
            return colorAxis.sceneScale({nullToZero: false});
        } 
        
        return def.fun.constant(pvc.defaultColor);
    },
    
    defaultColorSceneScale: function(){
        return this._defaultColorSceneScale || 
               (defaultColorSceneScale = this._initDefaultColorSceneScale());
    },
    
    defaultColor: function(type){
        return this.defaultColorSceneScale()(this.scene);
    },

    normalColor: function(type, color){
        return color;
    },

    interactiveColor: function(type, color){
        return color;
    },

    dimColor: function(type, color){
        return pvc.toGrayScale(color, -0.3, null, null); // ANALYZER requirements, so until there's no way to configure it...
    }
});
