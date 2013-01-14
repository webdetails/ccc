
(function(){

    pv.Mark.prototype.getSign = function(){
        return this.sign || createBasic(this);
    };
    
    pv.Mark.prototype.getScene = function(){
        return this.getSign().scene;
    };
    
    function createBasic(pvMark){
        var as = getAncestorSign(pvMark) || 
                 def.assert("There must exist an ancestor sign");
        var bs = new pvc.visual.BasicSign(as.panel, pvMark);
        var i;
        var s = pvMark.scene;
        if(s && (i = pvMark.index) != null && i >= 0){
            // Mark is already rendering; build the current instance
            bs._buildInstance(pvMark, s[i], /*lateCall*/ true);
        }
        return bs;
    }
    
    // Obtains the first sign accessible from the argument mark.
    function getAncestorSign(pvMark){
        var sign;
        do{
            pvMark = pvMark.parent;
        } while(pvMark && !(sign = pvMark.sign) && (!pvMark.proto || !(sign = pvMark.proto.sign)));
        
        return sign;
    }
    
    // Used to wrap a mark, dynamically, 
    // with minimal impact and functionality.
    def.type('pvc.visual.BasicSign')
    .init(function(panel, pvMark){
        this.chart  = panel.chart;
        this.panel  = panel;
        this.pvMark = pvMark;
        
        /* Extend the pv mark */
        pvMark
            .localProperty('_scene', Object)
            .localProperty('group',  Object);
        
        this.lockMark('_scene', function(scene){ return scene; })
            /* TODO: remove these when possible and favor access through scene */
            .lockMark('group', function(scene){ return scene && scene.group; })
            .lockMark('datum', function(scene){ return scene && scene.datum; })
            ;
        
        pvMark.sign = this;
        
        /* Intercept the protovis mark's buildInstance */
        
        // Avoid doing a function bind, cause buildInstance is a very hot path
        pvMark.__buildInstance = pvMark.buildInstance;
        pvMark.buildInstance   = this._dispatchBuildInstance;
    })
    .add({
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
        
        delegate: function(dv, tag){
            return this.pvMark.delegate(dv, tag);
        },
        
        delegateExtension: function(dv){
            return this.pvMark.delegate(dv, pvc.extensionTag);
        },
        
        hasDelegate: function(tag){
            return this.pvMark.hasDelegate(tag);
        },
        
        // Using it is a smell...
    //    hasExtension: function(){
    //        return this.pvMark.hasDelegate(pvc.extensionTag);
    //    },
        
        // -------------
        
        _bindWhenFun: function(value){
            if(typeof value === 'function'){
                /* return value.bind(this); */
                return function(){
                    var sign = this.getSign();
                    return value.apply(sign, arguments);
                };
            }
            
            return value;
        },
        
        _lockDynamic: function(name, method){
            /* def.methodCaller('' + method, this) */
            var me = this;
            return this.lockMark(
                        name,
                        function(){
                            var sign = this.getSign();
                            var m = sign[method] ||
                                    me  [method] ||
                                    def.assert("No method with name '" + method + "' is defined");
                            
                            return m.apply(sign, arguments);
                        });
        },
        
        // --------------
        
        /* SCENE MAINTENANCE */
        _dispatchBuildInstance: function(instance){
            // this: the mark
            this.sign._buildInstance(this, instance);
        },
        
        _buildInstance: function(mark, instance, lateCall){
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
            
            if(!lateCall){
                mark.__buildInstance.call(mark, instance);
            }
        }
    });
}());