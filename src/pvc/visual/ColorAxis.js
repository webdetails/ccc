def.scope(function(){

    var $VA = pvc.visual.Axis;
    
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
    .type('pvc.visual.ColorAxis', $VA)
    .init(function(chart, type, index, keyArgs){
        
        this.base(chart, type, index, keyArgs);
        
        var optionId = def.get(keyArgs, 'optionId');
        if(optionId == null){
            optionId = pvc.buildIndexedId('legend', this.index);
        }
        
        var dataPartValues = def.get(keyArgs, 'dataPartValues');
        if(dataPartValues == null){
            dataPartValues = [];
        } else {
            dataPartValues = def.query(dataPartValues).array();
        }
        
        this._dataPartValues =  dataPartValues;
        
        this.optionId = optionId;
        this.isVisible = this.option('Visible');
    })
    .add(/** @lends pvc.visual.ColorAxis# */{
        
        addDataPartValue: function(dataPartValue){
            this._dataPartValues.push(dataPartValue);
        },
        
        getDataPartValues: function(){
            return this._dataPartValues;
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
                
                var scale = this.option('Colors').call(null, domainValues);
                
                this.domainValues = domainValues;
                
                this.setScale(scale);
            }
              
            return this;
        },
        
        _getOptionsDefinition: function(){
            return colorAxis_optionsDef;
        },
        
        _getOptionByOptionId: function(name){
            return chartOption.call(this, this.optionId + name);
        }
    });
    
    var $VCA = pvc.visual.ColorAxis;
    
    /* PRIVATE STUFF */
    
    /**
     * Obtains the value of an option using a specified final name.
     * 
     * @name pvc.visual.CartesianAxis#_chartOption
     * @function
     * @param {string} name The chart option name.
     * @private
     * @type string
     */
    function chartOption(name) {
        return this.chart.options[name];
    }
    
    function resolve(fun, operation){
        return function(axis){
            var value = fun.call(axis, this.name, this);
            if(value !== undefined){
                this[operation || 'specify'](value);
                return true;
            }
        };
    }
    
    resolve.byOptionId = resolve($VCA.prototype._getOptionByOptionId);
    
    function resolveNormal(axis){
        return resolve.byOptionId.call(this, axis);
    }
    
    function castSize(size, axis){
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
    
    function castAlign(align, axis){
        var position = this.option('Position');
        return pvc.parseAlign(position, align);
    }
    
    /*global axis_optionsDef:true*/
    var colorAxis_optionsDef = def.create(axis_optionsDef, {
        /*
         * legendColors
         * legend2Colors
         * trendColors
         * -----
         * colors
         * secondAxisColor (compat)
         */
        Colors: {
            resolve: function(axis){
                // Give precedence to "normalized" option names
                // Like resolveNormal does:
                var colors = axis._getOptionByOptionId('Colors');
                if(colors == null){
                    // Handle naming exceptions
                    if(axis.index === 0){
                        colors = chartOption.call(axis, 'colors');
                    } else if(axis.index === 1){
                        colors = chartOption.call(axis, 'secondAxisColor');
                    }
                }
                
                var isDefault = (colors == null);
                if(!isDefault){
                    colors = pvc.colorScheme(colors);
                } else if(axis.index === 0){
                    // Assumes default pvc scale
                    colors = pvc.createColorScheme(colors);
                } else {
//                  // Inherit colors of axis-0
//                  var color0Axis = axis.chart.axes.color;
//                  if(color0Axis){
//                      colors = color0Axis.option('Colors');
//                  }
                    // Use a color scheme that always returns 
                    // the global color scale of the role
                    colors = function(){ // ignore domain values
                        return axis.chart._getRoleColorScale(axis.role.name);
                    };
                }
                
                // Check if there is a color transform set
                // and if so, transform the color scheme
                // If the user specified the colors,
                // do not apply default color transforms...
                if(isDefault || this.option.isSpecified('ColorsTransform')){
                    var colorTransf = this.option('ColorsTransform');
                    if(colorTransf){
                        colors = pvc.transformColorScheme(colors, colorTransf);
                    }
                }
                
                this.set(colors, isDefault);
                
                return true;
            }
            //cast: pvc.colorScheme
        },
        
        /*
         * A function that transforms the colors
         * of the color scheme:
         * pv.Color -> pv.Color
         */
        ColorsTransform: {
            resolve: function(axis){
                if(resolveNormal.call(this, axis)){
                    return true;
                }
                
                if(axis.index === 1 || axis.optionId === 'trend'){
                    this.defaultValue(pvc.brighterColorTransform);
                    return true;
                }
            },
            
            cast: def.fun.to
        },
        
        /* 
         * legendVisible 
         */
        Visible: {
            resolve: resolveNormal,
            cast:    Boolean,
            value:   true
        },
        
        /* legendPosition */
        Position: {
            resolve: resolveNormal,
            cast:    pvc.parsePosition,
            value:   'bottom'
        },
        
        /* legendSize,
         * legend2Size 
         */
        Size: {
            resolve: resolveNormal,
            cast:    castSize
        },
        
        SizeMax: {
            resolve: resolveNormal,
            cast:    castSize
        },
        
        Align: {
            resolve: function(axis){
                if(!resolve.byOptionId.call(this, axis)){
                    // Default value of align depends on position
                    var position = this.option('Position');
                    var align;
                    if(position !== 'top' && position !== 'bottom'){
                        align = 'top';
                    } else if(axis.chart.compatVersion() <= 1) { // centered is better
                        align = 'left';
                    }
                    
                    this.defaultValue(align);
                }
            },
            cast: castAlign
        },
        
        Margins:  {
            resolve: function(axis){
                if(!resolve.byOptionId.call(this, axis)){
                    
                    // Default value of margins depends on position
                    if(axis.chart.compatVersion() > 1){
                        var position = this.option('Position');
                        
                        // Set default margins
                        var margins = def.set({}, pvc.BasePanel.oppositeAnchor[position], 5);
                        
                        this.defaultValue(margins);
                    }
                }
            },
            cast: pvc.Sides.as
        },
        
        Paddings: {
            resolve: resolveNormal,
            cast:    pvc.Sides.as,
            value:   5
        },
        
        Font: {
            resolve: resolveNormal,
            cast:    String,
            value:   '10px sans-serif'
        },
        
        ClickMode: {
            resolve: resolveNormal,
            cast:    pvc.parseLegendClickMode,
            value:   'toggleVisible'
        },
        
        DrawLine: {
            resolve: resolveNormal,
            cast:    Boolean,
            value:   false
        },
        
        DrawMarker: {
            resolve: resolveNormal,
            cast:    Boolean,
            value:   true
        },
        
        Shape: {
            resolve: resolveNormal,
            cast:    pvc.parseShape
        }
    });
    
    function Number2(value) {
        if(value != null) {
            value = +value; // to number
            if(isNaN(value)) {
                value = null;
            }
        }
        
        return value;
    }

});