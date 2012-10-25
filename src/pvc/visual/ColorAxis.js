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
            var dataCells = this.dataCells;
            if(dataCells){
                var chart = this.chart;
                
                var domainValues = 
                    def
                    .query(dataCells)
                    .selectMany(function(dataCell){
                        var role = dataCell.role;
                        if(role && role.isBound()){
                            var domainData = 
                                chart
                                .partData(dataCell.dataPartValue)
                                .flattenBy(role)
                                ;
                            
                            dataCell.data = domainData;
                            
                            return domainData.children();
                        }
                    })
                    .distinct(function(childData){ return childData.key; })
                    .select(function(child){ return child.value; })
                    .array()
                    ;
                
                this.domainValues = domainValues;
                
                var scale = this.option('TransformedColors').call(null, domainValues);
                
                this.setScale(scale);
            }
            
            return this;
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
         * colors  (maintained due to the naked first color axis rule)
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
        
        TransformedColors: {
            resolve: function(optionInfo){
                // Check if there is a color transform set
                // and if so, transform the color scheme
                // If the user specified the colors,
                // do not apply default color transforms...
                
                var colors = this.option('Colors');
                var colorTransf = this.option('ColorTransform');
                if(colors && 
                   colorTransf && 
                   (!this.option.isSpecified('Colors') || this.option.isSpecified('ColorTransform'))){
                    colors = pvc.transformColorScheme(colors, colorTransf);
                }
                
                optionInfo.specify(colors);
            }
        },
        
        // ------------
        /* 
         * legendVisible 
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