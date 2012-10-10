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
        
        this.optionId = pvc.buildIndexedId('legend', this.index);
        
        // ------------
        
        /* this.scaleType === 'discrete' && */
        
        // All this, currently only works well for discrete colors...
        // pvc.createColorScheme creates discrete color scale factories
        var options = chart.options;
        var colorsFactory = def.get(keyArgs, 'colorScheme');
        if(!colorsFactory){
            if(this.index === 1){
                var useOwnColors = options.secondAxisOwnColors;
                if(useOwnColors == null){
                    useOwnColors = chart.compatVersion() <= 1;
                }
                
                if(useOwnColors){
                    /* if secondAxisColor is unspecified, assumes default color scheme. */
                    colorsFactory = pvc.createColorScheme(options.secondAxisColor);
                }
            } else {
                colorsFactory = pvc.createColorScheme(options.colors);
            }
        }
        
        this.hasOwnColors = !!colorsFactory;
        
        if(!colorsFactory){
            var color0Axis = chart.axes.color;
            // TODO: Should throw when null? Bind, below, will fail...
            colorsFactory = color0Axis ? color0Axis.colorsFactory : null;
        }
        
        this.colorsFactory = colorsFactory;
        
        this.isVisible = this.option('Visible');
    })
    .add(/** @lends pvc.visual.ColorAxis# */{
        
        legendBulletGroupScene: null,
        
        calculateScale: function(){
            /*jshint expr:true */
            this.role || def.fail.operationInvalid('Axis is unbound.');
            
            if(this.role.isBound()){
                var dataCell   = this.dataCell;
                var domainData = this.chart.partData(dataCell.dataPartValue)
                                      .flattenBy(dataCell.role);
                
                var scale;
                if(!this.hasOwnColors){
                    var color0Axis = this.chart.axes.color;
                    scale = color0Axis ? color0Axis.scale : null;
                }
                
                if(!scale){
                    this.hasOwnColors = true;
                    
                    var domainValues = domainData
                                          .children()
                                          .select(function(child){ return child.value; })
                                          .array();
                    scale = this.colorsFactory.call(null, domainValues);
                }
                
                this.setScale(scale);
                
                this.domainData = domainData;
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