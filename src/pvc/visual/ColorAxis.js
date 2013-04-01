/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_Size:true, pvc_Axis:true */

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
.type('pvc.visual.ColorAxis', pvc_Axis)
.add(/** @lends pvc.visual.ColorAxis# */{
    
    scaleNullRangeValue: function() { return this.option('Missing') || null; },
    
    scaleUsesAbs: function() { return this.option('UseAbs'); },
    
    bind: function(dataCells) {
        this.base(dataCells);
        
        // -- collect distinct plots
        // Transform depends on this
        // Colors depends on Transform
        this._plotList = 
            def
            .query(dataCells)
            .select(function(dataCell){ return dataCell.plot; })
            .distinct(function(plot){ return plot && plot.id; })
            .array();
        
        return this;
    },
    
    // Called from within setScale
    _wrapScale: function(scale) {
        // Check if there is a color transform set
        // and if so, transform the color scheme.
        // If the user specified the colors,
        // do not apply default color transforms...
        var applyTransf;
        if(this.scaleType === 'discrete') {
            applyTransf = this.option.isSpecified('Transform') || 
                          (!this.option.isSpecified('Colors') && !this.option.isSpecified('Map'));
        } else {
            applyTransf = true;
        }
        
        if(applyTransf) {
            var colorTransf = this.option('Transform');
            if(colorTransf) { scale = scale.transform(colorTransf); }
        }
        
        return this.base(scale);
    },
    
    scheme: function() { return def.lazy(this, '_scheme', this._createScheme, this); },
    
    _createColorMapFilter: function(colorMap) {
        // Fixed Color Values (map of color.key -> first domain value of that color)
        var fixedColors = def.uniqueIndex(colorMap, function(c){ return c.key; });
        return {
            domain: function(k) { return !def.hasOwn(colorMap,    k    ); },
            color:  function(c) { return !def.hasOwn(fixedColors, c.key); }
        };
    },
    
    // Override to be able to add colors, 
    // derived from the base colors,
    // before mapping, transform and null handling.
    _getBaseScheme: function() { return this.option('Colors'); },
    
    _createScheme: function() {
        var me = this;
        var baseScheme = me._getBaseScheme();
        
        if(me.scaleType !== 'discrete') {
            // TODO: this implementation doesn't support NormByCategory...
            return function(/*domainAsArrayOrArgs*/) {
                // Create a fresh baseScale, from the baseColorScheme
                // Use baseScale directly
                var scale = baseScheme.apply(null, arguments);
                
                // Apply Transforms, nulls, etc, according to the axis' rules
                return me._wrapScale(scale);
            };
        }
        
        var colorMap = me.option('Map'); // map domain key -> pv.Color
        if(!colorMap) {
            return function(/*domainAsArrayOrArgs*/) {
                // Create a fresh baseScale, from the baseColorScheme
                // Use baseScale directly
                var scale = baseScheme.apply(null, arguments);
                
                // Apply Transforms, nulls, etc, according to the axis' rules
                return me._wrapScale(scale);
            };
        } 

        var filter = this._createColorMapFilter(colorMap);
            
        return function(d/*domainAsArrayOrArgs*/) {
            
            // Create a fresh baseScale, from the baseColorScheme
            var scale;
            if(!(d instanceof Array)) { d = def.array.copy(arguments); }
            
            // Filter the domain before creating the scale
            d = d.filter(filter.domain);
            
            var baseScale = baseScheme(d);
            
            // Remove fixed colors from the baseScale
            var r = baseScale.range().filter(filter.color);
            
            baseScale.range(r);
            
            // Intercept so that mapped keys are tested first
            scale = function(k) { return def.getOwn(colorMap, k) || baseScale(k); };
            
            def.copy(scale, baseScale);
            
            // override domain and range methods
            var d2, r2;
            scale.domain = function() {
                if (arguments.length) { throw def.error.operationInvalid("The scale cannot be modified."); }
                return d2 || (d2 = def.array.append(def.ownKeys(colorMap), d));
            };
            
            scale.range = function() {
                if (arguments.length) { throw def.error.operationInvalid("The scale cannot be modified."); }
                return r2 || (r2 = def.array.append(def.own(colorMap), r));
            };
            
            // At last, apply Transforms, nulls, etc, according to the axis' rules
            return me._wrapScale(scale);
        };
    },
    
    sceneScale: function(keyArgs) {
        var varName = def.get(keyArgs, 'sceneVarName') || this.role.name;

        var fillColorScaleByColKey = this.scalesByCateg;
        if(fillColorScaleByColKey) {
            var colorMissing = this.option('Missing');
            
            return function(scene) {
                var colorValue = scene.vars[varName].value;
                if(colorValue == null) { return colorMissing; }
                
                var catAbsKey = scene.group.parent.absKey;
                return fillColorScaleByColKey[catAbsKey](colorValue);
            };
        }
        
        return this.scale.by1(function(scene) {
            return scene && scene.vars[varName].value;
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
function colorAxis_castColorMap(colorMap){
    var resultMap;
    if(colorMap){
        var any;
        def.eachOwn(colorMap, function(v, k){
            any = true;
            colorMap[k] = pv.color(v);
        });
        
        if(any){
            resultMap = colorMap;
        }
    }
    
    return resultMap;
}

var colorAxis_legendDataSpec = {
    resolveDefault: function(optionInfo){
        // Naked
        if(!this.index && 
           this._specifyChartOption(optionInfo, def.firstLowerCase(optionInfo.name))){
            return true;
        }
    }
};

var colorAxis_defContColors;

function colorAxis_getDefaultColors(/*optionInfo*/) {
    var colors;
    var scaleType = this.scaleType;
    if(!scaleType) {
        // Axis is unbound
        colors = pvc.createColorScheme();
    } else if(scaleType === 'discrete') {
        if(this.index === 0) {
            // Assumes default pvc scale
            colors = pvc.createColorScheme();
        } else { 
            // Use colors of axes with own colors.
            // Use a color scheme that always returns 
            // the global color scale of the role
            // The following fun ignores passed domain values.
            var me = this;
            colors = function() { return me.chart._getRoleColorScale(me.role.name); };
        }
    } else {
        if(!colorAxis_defContColors) { colorAxis_defContColors = ['red', 'yellow','green'].map(pv.color); }
        colors = colorAxis_defContColors.slice();
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
        getDefault: colorAxis_getDefaultColors,
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
    
    /**
     * For ordinal color scales, a map of keys and their fixed colors.
     * 
     * @example
     * <pre>
     *  {
     *      'Lisbon': 'red',
     *      'London': 'blue'
     *  }
     * </pre>
     */
    Map: {
        resolve: '_resolveFull',
        cast:    colorAxis_castColorMap
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
                if(plotList.length <= 2){
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
        cast:  pv.color,
        value: pv.color('lightgray')
    },
    
    Unbound: { // Color to use when color role is unbound (only applies to optional color roles) 
        resolve: '_resolveFull',
        getDefault: function(optionInfo) {
            var scheme = this.option('Colors');
            return scheme().range()[0] || pvc.defaultColor; // J.I.C.?
        },
        cast:  pv.color
    },
    
    // ------------
    
    LegendVisible: {
        resolve: '_resolveFull',
        data:    colorAxis_legendDataSpec,
        cast:    Boolean,
        value:   true
    },
    
    LegendClickMode: {
        resolve: '_resolveFull',
        data:    colorAxis_legendDataSpec,
        cast:    pvc.parseLegendClickMode,
        value:   'togglevisible'
    },
    
    LegendDrawLine: {
        resolve: '_resolveFull',
        data:    colorAxis_legendDataSpec,
        cast:    Boolean,
        value:   false
    },
    
    LegendDrawMarker: {
        resolve: '_resolveFull',
        data:    colorAxis_legendDataSpec,
        cast:    Boolean,
        value:   true
    },
    
    LegendShape: {
        resolve: '_resolveFull',
        data:    colorAxis_legendDataSpec,
        cast:    pvc.parseShape
    }
});