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
            return this.option('Missing') || null;
        },
        
        scaleUsesAbs: function(){
            return this.option('UseAbs');
        },
        
        bind: function(dataCells){
            this.base(dataCells);
            
            // -- collect distinct plots
            // Transform depends on this
            // Colors depends on Transform
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
                        
                        var visibleDomainData;
                        if(chart._getVisibleData){ // only cartesian charts have
                            visibleDomainData = chart.root._getVisibleData(this.dataCell.dataPartValue);
                        } else {
                            visibleDomainData = chart.data.owner.where(null, {visible: true});
                        }
                        
                        var normByCateg = this.option('NormByCategory');
                        
                        var scaleOptions = {
                            type:        this.option('ScaleType'),
                            colors:      this.option('Colors')().range(), // obtain the underlying colors array
                            colorDomain: this.option('Domain'), 
                            colorMin:    this.option('Min'),
                            colorMax:    this.option('Max'),
                            colorNull:   this.option('Missing'), // TODO: already handled by the axis wrapping
                            data:        visibleDomainData,
                            colorDimension: this.role.firstDimensionName(),
                            normPerBaseCategory:normByCateg
                        };
                        
                        if(normByCateg){
                            this.scalesByCateg = pvc.color.scales(scaleOptions);
                        } else {
                            scale = pvc.color.scale(scaleOptions);
                        }
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
                applyTransf = this.option.isSpecified('Transform') || !this.option.isSpecified('Colors');
            } else {
                applyTransf = true;
            }
            
            if(applyTransf){
                var colorTransf = this.option('Transform');
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
        },
        
        _resolveByNaked: pvc.options.specify(function(optionInfo){
            // The first of the type receives options without the "Axis" suffix.
            if(!this.index){
                return this._chartOption(this.id + def.firstUpperCase(optionInfo.name));
            }
        }),
        
        _specifyV1ChartOption: function(optionInfo, asName){
            if(!this.index &&
                this.chart.compatVersion() <= 1 && 
                this._specifyChartOption(optionInfo, asName)){
                return true;
            }
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
    
    var legendData = {
        resolveDefault: function(optionInfo){
            // Naked
            if(!this.index && 
               this._specifyChartOption(optionInfo, def.firstLowerCase(optionInfo.name))){
                return true;
            }
        }
    };
    
    function getDefaultColor(optionInfo){
        var colors;
        if(this.scaleType === 'discrete'){
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
        } else {
            colors = ['red', 'yellow','green']
                     .map(function(name){ return pv.Color.names[name]; });
        }
        
        return colors;
    }
    
    
    /*global axis_optionsDef:true*/
    var colorAxis_optionsDef = def.create(axis_optionsDef, {
        /*
         * colors (special case)
         * colorAxisColors
         * color2AxisColors
         * color3AxisColors
         * 
         * -----
         * secondAxisColor (V1 compatibility)
         */
        Colors: {
            resolve:    '_resolveFull',
            getDefault: getDefaultColor,
            data: {
                resolveV1: function(optionInfo){
                    if(this.scaleType === 'discrete'){
                        if(this.index === 0){ 
                            this._specifyChartOption(optionInfo, 'colors');
                        } else if(this.index === 1 && this.chart._allowV1SecondAxis) {
                            this._specifyChartOption(optionInfo, 'secondAxisColor');
                        }
                    } else {
                        this._specifyChartOption(optionInfo, 'colorRange');
                    }
                    
                    return true;
                },
                resolveDefault: function(optionInfo){ // after normal resolution
                    // Handle naming exceptions
                    if(this.index === 0){ 
                       this._specifyChartOption(optionInfo, 'colors');
                    }
                }
            },
            cast: pvc.colorScheme
        },
        
        /*
         * A function that transforms the colors
         * of the color scheme:
         * pv.Color -> pv.Color
         */
        Transform: {
            resolve: '_resolveFull',
            data: {
                resolveDefault: function(optionInfo){
                    var plotList = this._plotList;
                    if(plotList <= 2){
                        var onlyTrendAndPlot2 = 
                            def
                            .query(plotList)
                            .all(function(plot){
                                var name = plot.name;
                                return (name === 'plot2' || name === 'trend');
                            });
                        
                        if(onlyTrendAndPlot2){
                            optionInfo.defaultValue(pvc.brighterColorTransform);
                            return true;
                        }
                    }
                }
            },
            cast: def.fun.to
        },
        
        NormByCategory: {
            resolve: function(optionInfo){
                if(!this.chart._allowColorPerCategory){
                    optionInfo.specify(false);
                    return true;
                }
                
                return this._resolveFull(optionInfo);
            },
            data: {
                resolveV1: function(optionInfo){
                    this._specifyV1ChartOption(optionInfo, 'normPerBaseCategory');
                    return true;
                }
            },
            cast:    Boolean,
            value:   false
        },
        
        // ------------
        // Continuous color scale
        ScaleType: {
            resolve: '_resolveFull',
            data: {
                resolveV1: function(optionInfo){
                    this._specifyV1ChartOption(optionInfo, 'scalingType');
                    return true;
                }
            },
            cast:    pvc.parseContinuousColorScaleType,
            value:   'linear'
        },
        
        UseAbs: {
            resolve: '_resolveFull',
            cast:    Boolean,
            value:   false
        },
        
        Domain: {
            resolve: '_resolveFull',
            data: {
                resolveV1: function(optionInfo){
                    this._specifyV1ChartOption(optionInfo, 'colorRangeInterval');
                    return true;
                }
            },
            cast: def.array.to
        },
        
        Min: {
            resolve: '_resolveFull',
            data: {
                resolveV1: function(optionInfo){
                    this._specifyV1ChartOption(optionInfo, 'minColor');
                    return true;
                }
            },
            cast: pv.color
        },
        
        Max: {
            resolve: '_resolveFull',
            data: {
                resolveV1: function(optionInfo){
                    this._specifyV1ChartOption(optionInfo, 'maxColor');
                    return true;
                }
            },
            cast: pv.color
        },
        
        Missing: { // Null, in lower case is reserved in JS...
            resolve: '_resolveFull',
            data: {
                resolveV1: function(optionInfo){
                    this._specifyV1ChartOption(optionInfo, 'nullColor');
                    return true;
                }
            },
            cast: pv.color,
            value: pv.color("#efc5ad")
        },
        
        // ------------
        
        /* 
         * LegendVisible 
         */
        LegendVisible: {
            resolve: '_resolveFull',
            data:    legendData,
            cast:    Boolean,
            value:   true
        },
        
        LegendClickMode: {
            resolve: '_resolveFull',
            data:    legendData,
            cast:    pvc.parseLegendClickMode,
            value:   'toggleVisible'
        },
        
        LegendDrawLine: {
            resolve: '_resolveFull',
            data:    legendData,
            cast:    Boolean,
            value:   false
        },
        
        LegendDrawMarker: {
            resolve: '_resolveFull',
            data:    legendData,
            cast:    Boolean,
            value:   true
        },
        
        LegendShape: {
            resolve: '_resolveFull',
            data:    legendData,
            cast:    pvc.parseShape
        }
    });
});