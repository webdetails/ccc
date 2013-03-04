
def
.type('pvc.TreemapChart', pvc.BaseChart)
.add({
    _animatable: true,

    _getColorRoleSpec: function(){
        return { 
            isRequired: true, 
            defaultSourceRole: 'category', 
            defaultDimension: 'color*'
            /*, requireIsDiscrete: true*/ 
        };
    },
    

    _processOptionsCore: function(options){
        
        this.base(options);
        
        // NOT YET supported...
        //options.legend = false;
    },
    
    _initVisualRoles: function(){
        
        this.base();
        
        this._addVisualRole('category', { 
                isRequired: true, 
                defaultDimension: 'category*', 
                autoCreateDimension: true 
            });
            
        this._addVisualRole('size', {
                isMeasure:  true,
                isRequired: false,
                isPercent:  true,
                requireSingleDimension: true, 
                requireIsDiscrete: false,
                valueType: Number, 
                defaultDimension: 'size' 
            });
    },
    
    _getTranslationClass: function(translOptions){
        return def
            .type(this.base(translOptions))
            .add(pvc.data.TreemapChartTranslationOper);
    },
    
    _setAxesScales: function(hasMultiRole) {
        
        this.base(hasMultiRole);
        
        if(!hasMultiRole || this.parent){
            var sizeAxis = this.axes.size;
            if(sizeAxis && sizeAxis.isBound()) {
                this._createAxisScale(sizeAxis);
                
                sizeAxis.setScaleRange({min: 100, max: 1000});
            }
        }
    },
    
    _initPlotsCore: function(/*hasMultiRole*/){
        new pvc.visual.TreemapPlot(this);
    },
    
    _preRenderContent: function(contentOptions) {

        this.base();
        
        var treemapPlot = this.plots.treemap;
        new pvc.TreemapPanel(this, this.basePanel, treemapPlot, contentOptions);
    },
    
    _createVisibleData: function(dataPartValue, keyArgs){
        var visibleData = this.base(dataPartValue, keyArgs);
        if(!visibleData){
            return null;
        }
        
        var ignoreNulls = def.get(keyArgs, 'ignoreNulls');
        return this
            .visualRoles('category')
            .select(visibleData, {visible: true, isNull: ignoreNulls ? false : null});
    }
});
