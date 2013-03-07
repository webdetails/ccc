
(function(){

    function createBasic(pvMark) {
        var as = getAncestorSign(pvMark) || def.assert("There must exist an ancestor sign");
        var bs = new pvc.visual.BasicSign(as.panel, pvMark);
        var s = pvMark.scene;
        var i, pvInstance;
        if(s && (i = pvMark.index) != null && i >= 0 && (pvInstance = s[i])) {
            // Mark is already rendering; build the current instance
            bs._inContext(
                    /*f*/function(){ this.__buildInstance(pvInstance); }, 
                    /*x*/pvMark,
                    /*scene*/pvInstance.data,
                    pvInstance,
                    /*lateCall*/true);
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
    .init(function(panel, pvMark){
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
        compatVersion: function(){ return this.chart.compatVersion(); },

        // Defines a local property on the underlying protovis mark
        localProperty: function(name, type){
            this.pvMark.localProperty(name, type);
            return this;
        },
        
        lock: function(name, value){
            return this.lockMark(name, this._bindWhenFun(value));
        },
        
        optional: function(name, value, tag){
            return this.optionalMark(name, this._bindWhenFun(value), tag);
        },
        
        // -------------
        
        lockMark: function(name, value){
            this.pvMark.lock(name, value);
            return this;
        },
        
        optionalMark: function(name, value, tag){
            this.pvMark[name](value, tag);
            return this;
        },
        
        // --------------
        
        delegate: function(dv, tag){ return this.pvMark.delegate(dv, tag); },
        
        delegateExtension: function(dv){ return this.pvMark.delegate(dv, pvc.extensionTag); },
        
        hasDelegate: function(tag){ return this.pvMark.hasDelegate(tag); },
        
        // Using it is a smell...
    //    hasExtension: function(){
    //        return this.pvMark.hasDelegate(pvc.extensionTag);
    //    },
        
        // -------------
        
        _bindWhenFun: function(value) {
            if(def.fun.is(value)) {
                return function() { return value.apply(this.getSign(), arguments); };
            }
            
            return value;
        },
        
        _lockDynamic: function(name, method) {
            /* def.methodCaller('' + method, this) */
            var me = this;
            return me.lockMark(
                name,
                function() {
                    var sign = this.getSign();
                    var m = sign[method] ||
                            me  [method] ||
                            def.assert("No method with name '" + method + "' is defined");
                    
                    return m.apply(sign, arguments);
                });
        },
        
        // --------------
        
        /* SCENE MAINTENANCE */
        // this: the mark
        _dispatchBuildInstance: function(pvInstance) {
            this.sign._inContext(
                    /*f*/function() { this.__buildInstance(pvInstance); }, 
                    /*x*/this, 
                    /*scene*/pvInstance.data,
                    pvInstance,
                    /*lateCall*/false);
        },
        
        _inContext: function(f, x, scene, pvInstance, lateCall) {
            var pvMark = this.pvMark;
            if(!pvInstance) { pvInstance = pvMark.scene[pvMark.index]; }
            if(!scene     ) { scene = pvInstance.data; }
            
            var index = scene ? scene.childIndex() : 0;
            
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
            if(!lateCall) {
                try {
                    f.call(x, pvInstance);
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