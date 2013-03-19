
(function() {

    function createBasic(pvMark) {
        var as = getAncestorSign(pvMark) || def.assert("There must exist an ancestor sign");
        var bs = new pvc.visual.BasicSign(as.panel, pvMark);
        var s = pvMark.scene;
        var i, pvInstance;
        if(s && (i = pvMark.index) != null && i >= 0 && (pvInstance = s[i])) {
            // Mark is already rendering; set the current instance in context
            bs._inContext(/*scene*/pvInstance.data, pvInstance);
        }
        
        return bs;
    }
    
    // Obtains the first sign accessible from the argument mark.
    function getAncestorSign(pvMark) {
        var sign;
        do   { pvMark = pvMark.parent; } 
        while(pvMark && !(sign = pvMark.sign) && (!pvMark.proto || !(sign = pvMark.proto.sign)));
        return sign;
    }
    
    pv.Mark.prototype.getSign    = function() { return this.sign || createBasic(this); };
    pv.Mark.prototype.getScene   = function() { return this.getSign().scene;     };
    pv.Mark.prototype.getContext = function() { return this.getSign().context(); };
    
    // Used to wrap a mark, dynamically, 
    // with minimal impact and functionality.
    def
    .type('pvc.visual.BasicSign')
    .init(function(panel, pvMark) {
        this.chart  = panel.chart;
        this.panel  = panel;
        this.pvMark = pvMark;
        
        /*jshint expr:true*/
        !pvMark.sign || def.assert("Mark already has an attached Sign.");

        pvMark.sign = this;
        
        // Intercept the protovis mark's buildInstance
        // Avoid doing a function bind, cause buildInstance is a very hot path
        
        pvMark.__buildInstance = pvMark.buildInstance;
        pvMark.buildInstance   = this._dispatchBuildInstance;
    })
    .add({
        compatVersion: function() { return this.chart.compatVersion(); },

        // Defines a local property on the underlying protovis mark
        localProperty: function(name, type) {
            this.pvMark.localProperty(name, type);
            return this;
        },
        
        lock: function(pvName, value) {
            return this.lockMark(pvName, this._bindWhenFun(value, pvName));
        },
        
        optional: function(pvName, value, tag) {
            return this.optionalMark(pvName, this._bindWhenFun(value, pvName), tag);
        },
        
        // -------------
        
        lockMark: function(name, value) {
            this.pvMark.lock(name, value);
            return this;
        },
        
        optionalMark: function(name, value, tag) {
            this.pvMark[name](value, tag);
            return this;
        },
        
        // --------------
        
        delegate: function(dv, tag) { return this.pvMark.delegate(dv, tag); },
        
        delegateExtension: function(dv) { return this.pvMark.delegate(dv, pvc.extensionTag); },
        
        hasDelegate: function(tag) { return this.pvMark.hasDelegate(tag); },
        
        // Using it is a smell...
    //    hasExtension: function(){
    //        return this.pvMark.hasDelegate(pvc.extensionTag);
    //    },
        
        // -------------
        
        _createPropInterceptor: function(pvName, fun) {
            var me = this;
            var isDataProp = pvName === 'data';
            
            return function() {
                // Was function inherited by a pv.Mark without a sign?
                var sign = this.sign;
                if(!sign || sign !== me) {
                    return me._getPvSceneProp(pvName, /*defaultIndex*/this.index);
                }
                
                // Data prop is evaluated while this.index = -1, and the parent mark's stack
                if(!isDataProp) {
                    // Is sign _inContext or Is a stale context?
                    var pvInstance = this.scene[this.index];
                    if(!sign.scene || sign.scene !== pvInstance.data) {
                        // This situation happens when animating, because buildInstance is not called.
                        me._inContext(/*scene*/pvInstance.data, pvInstance);
                    }
                }
                
                return fun.apply(me, arguments);
            };
        },
        
        _getPvSceneProp: function(prop, defaultIndex) {
            // Property method was inherited via pv proto(s)
            var pvMark   = this.pvMark;
            var pvScenes = pvMark.scene;
            if(pvScenes) {
                // Have a scenes object, but which index should be used?
                var index = pvMark.hasOwnProperty('index') ? 
                    pvMark.index : 
                    Math.min(defaultIndex, pvScenes.length - 1);
                
               if(index != null) { return pvScenes[index][prop]; }
            }
            
            throw def.error.operationInvalid("Cannot evaluate inherited property.");
        },
        
        // -------------
        
        _bindWhenFun: function(value, pvName) {
            if(def.fun.is(value)) {
                var me = this;
                return me._createPropInterceptor(pvName, function() {
                    return value.apply(me, arguments);
                });
            }
            
            return value;
        },
        
        _lockDynamic: function(pvName, method) {
            /* def.methodCaller('' + method, this) */
            var me = this;
            return me.lockMark(
                pvName,
                me._createPropInterceptor(pvName, function() {
                    return me[method].apply(me, arguments);
                }));
        },
        
        /* SCENE MAINTENANCE */
        // this: the mark
        _dispatchBuildInstance: function(pvInstance) {
            function callBuildInstanceInContext() {
                this.__buildInstance(pvInstance); 
            }
            
            this.sign._inContext(
                    /*scene*/pvInstance.data,
                    pvInstance,
                    /*f*/callBuildInstanceInContext, 
                    /*x*/this);
        },
        
        _inContext: function(scene, pvInstance, f, x) {
            var pvMark = this.pvMark;
            if(!pvInstance) { pvInstance = pvMark.scene[pvMark.index]; }
            if(!scene     ) { scene = pvInstance.data || def.assert("A scene is required!"); }
            
            var index = scene.childIndex();
            
            var oldScene, oldIndex, oldState;
            var oldPvInstance = this.pvInstance;
            if(oldPvInstance) {
                oldScene = this.scene;
                oldIndex = this.index;
                oldState = this.state;
            }
            
            this.pvInstance = pvInstance;
            this.scene = scene;
            this.index = index < 0 ? 0 : index;

            /*
             * Update the scene's render id,
             * which possibly invalidates per-render
             * cached data.
             */
            /*global scene_renderId:true */
            scene_renderId.call(scene, pvMark.renderId());
            
            /* state per: sign & scene & render */
            this.state = {};
            if(f) {
                try {
                    return f.call(x, pvInstance);
                } finally {
                    this.state = oldState;
                    this.pvInstance = oldPvInstance;
                    this.scene = oldScene;
                    this.index = oldIndex;
                }
            } // otherwise... old stuff gets stale... but there's no big problem
        },
        
        /* CONTEXT */
        context: function(createNew) {
            var state;
            if(createNew || !(state = this.state)) { 
               return this._createContext();
            }
            
            return def.lazy(state, 'context', this._createContext, this); 
        },
        
        _createContext: function() { return new pvc.visual.Context(this.panel, this.pvMark); }
    });
}());