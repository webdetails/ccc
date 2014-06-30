/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pv_Mark:true */

pv_Mark.prototype.getSign    = function() { return this.sign || sign_createBasic(this); };
pv_Mark.prototype.getScene   = function() { return this.getSign().scene();   };
pv_Mark.prototype.getContext = function() { return this.getSign().context(); };

function sign_createBasic(pvMark) {
    var as = mark_getAncestorSign(pvMark) || def.assert("There must exist an ancestor sign");
    return new pvc.visual.BasicSign(as.panel, pvMark);
}

// Obtains the first sign accessible from the argument mark.
function mark_getAncestorSign(pvMark) {
    var sign;
    do   { pvMark = pvMark.parent; } 
    while(pvMark && !(sign = pvMark.sign) && (!pvMark.proto || !(sign = pvMark.proto.sign)));
    return sign;
}

// Override without respect.
pv_Mark.prototype.preBuildInstance = function(s) {
    // Update the scene's render id,
    // which possibly invalidates per-render cached data.

     /*global scene_renderId:true */
    var scene = s.data;
    if(scene instanceof pvc.visual.Scene) scene_renderId.call(scene, this.renderId());
};

// Used to wrap a mark, dynamically, 
// with minimal impact and functionality.
def
.type('pvc.visual.BasicSign')
.init(function(panel, pvMark) {
    this.chart  = panel.chart;
    this.panel  = panel;
    
    /*jshint expr:true*/
    !pvMark.sign || def.assert("Mark already has an attached Sign.");

    this.pvMark = pvMark;
    pvMark.sign = this;
})
.add({
    compatVersion: function() { return this.chart.compatVersion(); },

    // Defines a local property on the underlying protovis mark
    localProperty: function(name, type) {
        return this.pvMark.localProperty(name, type), this;
    },
    
    lock: function(pvName, value) {
        return this.lockMark(pvName, this._bindWhenFun(value, pvName));
    },
    
    optional: function(pvName, value, tag) {
        return this.optionalMark(pvName, this._bindWhenFun(value, pvName), tag);
    },
    
    // -------------
    
    lockMark: function(name, value) {
        //noinspection CommaExpressionJS
        return this.pvMark.lock(name, value), this;
    },
    optionalMark: function(name, value, tag) {
        //noinspection CommaExpressionJS
        return this.pvMark[name](value, tag), this;
    },
    
    // --------------
    
    delegate: function(dv, tag) { return this.pvMark.delegate(dv, tag); },
    
    delegateExtension: function(dv) { return this.pvMark.delegate(dv, pvc.extensionTag); },

    delegateNotExtension: function(dv) { return this.pvMark.delegateExcept(dv, pvc.extensionTag); },
    
    hasDelegate: function(tag) { return this.pvMark.hasDelegate(tag); },
    
    // Using it is a smell...
//    hasExtension: function() {
//        return this.pvMark.hasDelegate(pvc.extensionTag);
//    },
    
    // -------------
    
    _createPropInterceptor: function(pvName, fun) {
        var me = this;
        return function() {
            // this instanceof pv.Mark
            
            // Was function inherited by a pv.Mark without a sign?
            var sign = this.sign;
            return (!sign || sign !== me)
                ? me._getPvSceneProp(pvName, /*defaultIndex*/this.index)
                : fun.apply(me, arguments);
        };
    },
    
    _getPvSceneProp: function(prop, defaultIndex) {
        // TODO: Why is pvMark.instance(defaultIndex) is not used???

        // Property method was inherited via pv proto(s)
        var pvMark   = this.pvMark,
            pvScenes = pvMark.scene;
        if(pvScenes) {
            // Have a scenes object, but which index should be used?
            var index = pvMark.hasOwnProperty('index') ? 
                    pvMark.index :
                    Math.min(defaultIndex, pvScenes.length - 1);
            
           if(index != null) return pvScenes[index][prop];
        }
        throw def.error.operationInvalid("Cannot evaluate inherited property.");
    },
    
    // -------------
    
    _bindWhenFun: function(value, pvName) {
        if(def.fun.is(value)) {
            var me = this;
            
            // NOTE: opted by this form, instead of: value.bind(me);
            // because bind does not exist in some browsers
            // and the bind polyfill uses apply (which would then be much slower).
            return me._createPropInterceptor(pvName, function(scene) { 
                return value.call(me, scene);
            });
        }
        
        return value;
    },
    
    _lockDynamic: function(pvName, method) {
        /* def.methodCaller('' + method, this) */
        var me = this;
        return me.lockMark(
            pvName,
            me._createPropInterceptor(pvName, function(scene) {
                return me[method].call(me, scene);
            }));
    },

    scene: function() {
        var instance = this.pvMark.instance(),
            scene = instance && instance.data;
        return scene instanceof pvc.visual.Scene ? scene : null;
    },

    // per-instance/per-render state
    instanceState: function(s) { return this.pvMark.instanceState(s); },

    context: function(scene, createIndep) {
        // This is a hot function
        var state;
        if(createIndep || !(state = this.instanceState())) return this._createContext(scene);
        
        return state.cccContext || (state.cccContext = this._createContext(scene));
    },

    _createContext: function(scene) { return new pvc.visual.Context(this.panel, this.pvMark, scene); }
});