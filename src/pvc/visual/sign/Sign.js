
def.type('pvc.visual.Sign')
.init(function(panel, pvMark, keyArgs){
    this.chart  = panel.chart;
    this.panel  = panel;
    this.pvMark = pvMark;
    
    this.extensionId = def.get(keyArgs, 'extensionId');
    this.isActiveSeriesAware = def.get(keyArgs, 'activeSeriesAware', true);
            
    /* Extend the pv mark */
    pvMark
        .localProperty('_scene', Object)
        .localProperty('group',  Object);
    
    this.lock('_scene', function(){ 
            return this.scene; 
        })
        /* TODO: remove these when possible and favor access through scene */
        .lock('group', function(){ 
            return this.scene.group; 
        })
        .lock('datum', function(){ 
            return this.scene.datum; 
        });
        
    pvMark.sign = def.constant(this);
    
    /* Intercept the protovis mark's buildInstance */
    pvMark.buildInstance = this._buildInstance.bind(this, pvMark.buildInstance);
})
.postInit(function(panel, pvMark, keyArgs){
    this._addInteractive(keyArgs);
})
.add({
    _addInteractive: function(keyArgs){
        var panel   = this.panel,
            pvMark  = this.pvMark,
            options = this.chart.options;

        if(!def.get(keyArgs, 'noTooltips', false) && options.showTooltips){
            this.panel._addPropTooltip(pvMark);
        }

        if(!def.get(keyArgs, 'noHoverable', false) && options.hoverable) {
            // Add hover-active behavior
            // May still require the point behavior on some ascendant panel
            var onEvent,
                offEvent;

            switch(pvMark.type) {
                case 'dot':
                case 'line':
                case 'area':
                    onEvent  = 'point';
                    offEvent = 'unpoint';
                    break;

                default:
                    onEvent = 'mouseover';
                    offEvent = 'mouseout';
                    break;
            }

            pvMark
                .event(onEvent, function(scene){
                    scene.setActive(true);

                    if(!panel.topRoot.rubberBand) {
                        panel._renderInteractive();
                    }
                })
                .event(offEvent, function(scene){
                    if(scene.clearActive()) {
                        /* Something was active */
                        if(!panel.topRoot.rubberBand) {
                            panel._renderInteractive();
                        }
                    }
                });
        }

        if(!def.get(keyArgs, 'noClick', false) && panel._shouldHandleClick()){
            panel._addPropClick(pvMark);
        }

        if(!def.get(keyArgs, 'noDoubleClick', false) && options.doubleClickAction) {
            panel._addPropDoubleClick(pvMark);
        }
    },
    
    /* SCENE MAINTENANCE */
    _buildInstance: function(baseBuildInstance, instance){
        /* Reset scene/instance state */
        this.pvInstance = instance; // pv Scene
        this.scene = instance.data;
        
        /* 
         * Update the scene's render id, 
         * which possibly invalidates per-render
         * cached data.
         */
        scene_renderId.call(this.scene, this.pvMark.renderId());

        /* state per: sign & scene & render */
        this.state = {};

        this._initScene();
        
        baseBuildInstance.call(this.pvMark, instance);
    },
    
    _initScene: function(){
        /* NOOP */
    },
    
    /* Extensibility */
    intercept: function(name, method){
        if(typeof method !== 'function'){
            // Assume string with name of method
            // This allows instance-overriding methods,
            //  because the method's value is lazily captured.
            method = def.methodCaller('' + method);
        }
        
        var me = this;
        this.pvMark.intercept(
                name,
                function(fun, args){
                    var prevExtFun = me._extFun, prevExtArgs = me._extArgs;
                    me._extFun = fun, me._extArgs = args;
                    try {
                        return method.apply(me, args);
                    } finally{
                        me._extFun = prevExtFun, me._extArgs = prevExtArgs;
                    }
                },
                this._getExtension(name));
        
        return this;
    },
    
    delegate: function(dv){
        // TODO wrapping context
        var result;
        if(this._extFun) {
            result = this._extFun.apply(this, this._extArgs);
            if(result === undefined) {
                result = dv;
            }
        } else {
            result = dv;
        }
        
        return result;
    },
    
    hasDelegate: function(){
        return !!this._extFun;
    },

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

    lock: function(name, method){
        if(typeof method !== 'function'){
            method = def.methodCaller('' + method, this);
        } else {
            method = method.bind(this);
        }
        
        return this.lockValue(name, method);
    },
    
    lockValue: function(name, value){
        this.pvMark.lock(name, value);
        return this;
    },
    
    optional: function(name, method){
        if(typeof method !== 'function'){
            method = def.methodCaller('' + method, this);
        } else {
            method = method.bind(this);
        }
        
        return this.optionalValue(name, method);
    },
    
    optionalValue: function(name, value){
        this.pvMark[name](value);
        return this;
    },
    
    _getExtension: function(name){
        return this.panel._getExtension(this.extensionId, name);
    },
    
    _versionedExtFun: function(prop, extPointFun, version){
        return extPointFun;
    },
    
    /* COLOR */
    color: function(type){
        var color = this.baseColor(type);
        if(color === null){
            return null;
        }

        if(this.scene.anyInteraction()) {
            color = this.interactiveColor(type, color);
        } else {
            color = this.normalColor(type, color);
        }

        return color;
    },
    
    seriesColorScale: function(){
        return this._seriesColorScale || 
                (this._seriesColorScale = this.chart.seriesColorScale());
    },
    
    baseColor: function(type){
        var color = this.delegate();
        if(color === undefined){
            color = this.seriesColor(type);
        }
        
        return color;
    },

    seriesColor: function(type){
        /* Normal color is a function of the series */
        return this.seriesColorScale()(this.scene.acts.series.value);
    },

    normalColor: function(type, color){
        return color;
    },

    interactiveColor: function(type, color){
        return color;
    },

    dimColor: function(type, color){
        return pvc.toGrayScale(color);
    }
});
