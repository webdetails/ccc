def.scope(function(){

    /**
     * Initializes a color axis.
     * 
     * @name pvc.visual.ColorAxis
     * 
     * @class Represents an axis that maps colors to the values of a role.
     * 
     * @extends pvc.visual.Axis
     */
    def
    .type('pvc.visual.ColorAxis', pvc.visual.Axis)
    .add(/** @lends pvc.visual.ColorAxis# */{
        
        scaleNullRangeValue: function(){
            return this.option('NullColor') || null;
        },
        
        scaleUsesAbs: function(){
            return this.option('UseAbs');
        },
        
        bind: function(dataCells){
            this.base(dataCells);
            
            // -- collect distinct plots
            // ColorTransform depends on this
            // Colors depends on ColorTransform
            this._plotList = 
                def
                .query(dataCells)
                .select(function(dataCell){ return dataCell.plot; })
                .distinct(function(plot){ return plot && plot.id; })
                .array()
                ;
            
            return this;
        },
        
        calculateScale: function(){
            /*jshint expr:true */
            var scale;
            var dataCells = this.dataCells;
            if(dataCells){
                var chart = this.chart;
                if(this.scaleType === 'discrete'){
                    var domainValues = 
                        def
                        .query(dataCells)
                        .selectMany(function(dataCell){
                            var role = dataCell.role;
                            if(role && role.isBound()){
                                // Visible and not visible!
                                var partData = chart.partData(dataCell.dataPartValue);
                                var domainData = partData && partData.flattenBy(role);
                                
                                dataCell.data = domainData;
                                
                                return domainData && domainData.children();
                            }
                        })
                        .distinct(function(child){ return child.key; })
                        .select(function(child){ return def.nullyTo(child.value, ''); })
                        .array()
                        ;
                    
                    this.domainValues = domainValues;
                    
                    // Call the transformed color scheme with the domain values
                    //  to obtain a final scale object
                    scale = this.option('Colors').call(null, domainValues);
                } else {
                    if(dataCells.length === 1){
                        // Local scope: 
                        // Visible only!
//                        var visibleDomainData = 
//                            chart
//                            .partData(this.dataCell.dataPartValue)
//                            .flattenBy(this.role, {visible: true})
//                            ;
                        
                        var globalVisibleData = chart.data.owner.where(null, {visible: true});
                        
                        scale = pvc.color.scale({
                            type: this.option('ScaleType'),
                            colorRange: this.option('ColorRange'), 
                            colorRangeInterval: this.option('ColorRangeInterval'), 
                            minColor:  this.option('MinColor'),
                            maxColor:  this.option('MaxColor'),
                            nullColor: this.option('NullColor'), // TODO: already handled by the axis wrapping
                            data:      globalVisibleData,
                            colorDimension: this.role.firstDimensionName()
                        });
                    }
                }
            }
            
            this.setScale(scale);
            
            return this;
        },
        
        _wrapScale: function(scale){
            // Check if there is a color transform set
            // and if so, transform the color scheme
            // If the user specified the colors,
            // do not apply default color transforms...
            var applyTransf;
            if(this.scaleType === 'discrete'){
                applyTransf = this.option.isSpecified('ColorTransform') || !this.option.isSpecified('Colors');
            } else {
                applyTransf = true;
            }
            
            if(applyTransf){
                var colorTransf = this.option('ColorTransform');
                if(colorTransf){
                    scale = scale.transform(colorTransf);
                }
            }
            
            return this.base(scale);
        },
        
        sceneScale: function(keyArgs){
            var varName = def.get(keyArgs, 'sceneVarName') || this.role.name;
            
            return this.scale.by1(function(scene){
                return scene.vars[varName].value;
            });
        },
        
        _buildOptionId: function(){
            return this.id + "Axis";
        },
        
        _getOptionsDefinition: function(){
            return colorAxis_optionsDef;
        }
    });
    
    /* PRIVATE STUFF */
    function castSize(size){
        // Single size or sizeMax (a number or a string)
        // should be interpreted as meaning the orthogonal length.
        
        if(!def.object.is(size)){
            var position = this.option('Position');
            size = new pvc.Size()
                .setSize(size, {
                    singleProp: pvc.BasePanel.orthogonalLength[position]
                });
        }
        
        return size;
    }
    
    function castAlign(align){
        var position = this.option('Position');
        return pvc.parseAlign(position, align);
    }
    
    /*global axis_optionsDef:true*/
    var colorAxis_optionsDef = def.create(axis_optionsDef, {
        /*
         * colors (maintained due to the naked first color axis rule)
         * colorAxisColors
         * color2AxisColors
         * color3AxisColors
         * -----
         * secondAxisColor (V1 compatibility)
         */
        Colors: {
            resolve: pvc.options.resolvers([
                '_resolveFixed',
                '_resolveNormal',
                function(optionInfo){
                    // Handle naming exceptions
                    var colors;
                    if(this.index === 1){
                        colors = this._chartOption('secondAxisColor');
                        if(colors){
                            optionInfo.specify(colors);
                            return true;
                        }
                    }
                    
                    if(this.index === 0){
                        // Assumes default pvc scale
                        colors = pvc.createColorScheme();
                    } else { 
                        // Use colors of axes with own colors.
                        // Use a color scheme that always returns 
                        // the global color scale of the role
                        var me = this;
                        colors = function(){ // ignore domain values
                            return me.chart._getRoleColorScale(me.role.name);
                        };
                    }
                    
                    optionInfo.defaultValue(colors);
                    return true;
                },
                '_resoveDefault'
            ]),
            cast: pvc.colorScheme
        },
        
        /*
         * A function that transforms the colors
         * of the color scheme:
         * pv.Color -> pv.Color
         */
        ColorTransform: {
            resolve: function(optionInfo){
                if(this._resolveNormal(optionInfo)){
                    return true;
                }
                
                if(this._plotList.length === 1){
                    var name = this._plotList[0].name;
                    if(name === 'plot2' || name === 'trend'){
                        optionInfo.defaultValue(pvc.brighterColorTransform);
                        return true;
                    }
                }
            },
            
            cast: def.fun.to
        },
        
        NullColor: {
            resolve: '_resolveFull',
            cast:    pv.color,
            value:   pv.color("#efc5ad")
        },
        
        // ------------
        // Continuous color scale
        ScaleType: {
            resolve: pvc.options.resolvers([
                '_resolveFixed',
                '_resolveNormal',
                pvc.options.specify(function(optionInfo){
                    if(!this.typeIndex){
                        return this._chartOption('colorScaleType');
                    }
                }),
                '_resolveDefault'
            ]),
            cast:  pvc.parseContinuousColorScaleType,
            value: 'linear'
        },
        
        UseAbs: {
            resolve: '_resolveFull',
            cast:    Boolean,
            value:   false
        },
        
        ColorRange: {
            resolve: '_resolveFull',
            cast:    def.array.to,
            value:   ['red', 'yellow','green']
                     .map(function(name){ return pv.Color.names[name]; })
        },
        
        ColorRangeInterval: { // for quantization in discrete scale type
            resolve: '_resolveFull',
            cast:    def.array.to
        },
        
        MinColor: {
            resolve: '_resolveFull',
            cast:    pv.color
        },
        
        MaxColor: {
            resolve: '_resolveFull',
            cast:    pv.color
        },
        
        // ------------
        /* 
         * LegendVisible 
         */
        LegendVisible: {
            resolve: '_resolveNormal',
            cast:    Boolean,
            value:   true
        },
        
        LegendClickMode: {
            resolve: '_resolveNormal',
            cast:    pvc.parseLegendClickMode,
            value:   'toggleVisible'
        },
        
        LegendDrawLine: {
            resolve: '_resolveNormal',
            cast:    Boolean,
            value:   false
        },
        
        LegendDrawMarker: {
            resolve: '_resolveNormal',
            cast:    Boolean,
            value:   true
        },
        
        LegendShape: {
            resolve: '_resolveNormal',
            cast:    pvc.parseShape
        }
    });
});