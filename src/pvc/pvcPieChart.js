
/**
 * PieChart is the main class for generating... pie charts (surprise!).
 */
pvc.PieChart = pvc.BaseChart.extend({

    pieChartPanel: null,
    legendSource: 'category',
    
    constructor: function(options) {

        this.base(options);

        // Apply options
        pvc.mergeDefaults(this.options, pvc.PieChart.defaultOptions, options);
    },
    
    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){
        
        this.base();
        
        this._addVisualRoles({
            category: { isRequired: true, defaultDimensionName: 'category*', autoCreateDimension: true },
            
            /* value: required, continuous, numeric */
            value:  { 
                isMeasure:  true,
                isRequired: true,
                isPercent:  true,
                requireSingleDimension: true, 
                requireIsDiscrete: false,
                valueType: Number, 
                defaultDimensionName: 'value' 
            }
        });
    },
    
    _preRenderCore: function() {

        this.base();

        if(pvc.debug >= 3){
            pvc.log("Prerendering in pieChart");
        }
        
        this.pieChartPanel = new pvc.PieChartPanel(this, this.basePanel, {
            innerGap: this.options.innerGap,
            explodedSliceRadius: this.options.explodedSliceRadius,
            explodedSliceIndex: this.options.explodedSliceIndex,
            showValues: this.options.showValues,
            showTooltips: this.options.showTooltips
        });
    }
},
{
    defaultOptions: {
        showValues: true,
        innerGap: 0.9,
        explodedSliceRadius: 0,
        explodedSliceIndex: null,
        valuesMask: "{0}" // 0 for value, 1 for percentage (% sign is up to you) 
    }
});

/*
 * Pie chart panel. Generates a pie chart. Specific options are: <i>showValues</i> -
 * Show or hide slice value. Default: false <i>explodedSliceIndex</i> - Index
 * of the slice to explode. Default: null <i>explodedSliceRadius</i> - If one
 * wants a pie with an exploded effect, specify a value in pixels here. If above
 * argument is specified, explodes only one slice. Else explodes all. Default: 0
 * <i>innerGap</i> - The percentage of the inner area used by the pie. Default:
 * 0.9 (90%) Has the following protovis extension points: <i>chart_</i> - for
 * the main chart Panel <i>pie_</i> - for the main pie wedge <i>pieLabel_</i> -
 * for the main pie label
 */

pvc.PieChartPanel = pvc.BasePanel.extend({
    anchor: 'fill',
    pvPie: null,
    pvPieLabel: null,
    innerGap: 0.9,
    explodedSliceRadius: 0,
    explodedSliceIndex: null,
    showTooltips: true,
    showValues: true,

    /**
     * @override
     */
    _createCore: function() {
        var myself = this,
            chart = this.chart,
            options = chart.options;

        // Add the chart. For a pie chart we have one series only
        var visibleKeyArgs = {visible: true},
            data = chart.visualRoles('category').flatten(chart.data, visibleKeyArgs),
            valueDimName = chart.visualRoles('value').firstDimensionName(),
            valueDim = data.dimensions(valueDimName);

        this.sum = data.dimensionsSumAbs(valueDimName, visibleKeyArgs);
        
        var colorProp = def.scope(function(){
         // Color "controller"
            var colorScale = chart._legendColorScale(this.dataPartValue);

            return function(catGroup) {
                var color = colorScale(catGroup.value);
                if(data.owner.selectedCount() > 0 && !this.hasSelected()) {
                    return pvc.toGrayScale(color, 0.6);
                }
                
                return color;
            };
        });
        
        var angleScale = pv.Scale
                           .linear(0, this.sum)
                           .range (0, 2 * Math.PI);
        
        var radius = Math.min(this.width, this.height) / 2,
            outerRadius  = radius * this.innerGap,
            centerBottom = this.height / 2,
            centerLeft   = this.width  / 2;
        
        if(pvc.debug >= 3) {
            pvc.log("Radius: " + outerRadius + "; Maximum sum: " + this.sum);
        }
        
        this.pvPie = this.pvPanel
            .add(pv.Wedge)
            .data(data._leafs)
            .localProperty('group')
            .group(function(catGroup){ return catGroup; })
            .localProperty('value', Number)
            .value(function(catGroup){
                return catGroup.dimensions(valueDimName).sum(visibleKeyArgs); // May be negative
            })
            .localProperty('hasSelected')
            .hasSelected(function(catGroup){
                return catGroup.selectedCount() > 0;                    
            })
            .angle(function(){ return angleScale(Math.abs(this.value())); })
            .localProperty('midAngle', Number)
            .midAngle(function(){
                var instance = this.instance();
                return instance.startAngle + (instance.angle / 2);
            })
            .bottom(function(){ return centerBottom - myself._explodeSlice('sin', this); })
            .left  (function(){ return centerLeft   + myself._explodeSlice('cos', this); })
            .outerRadius(function(){ return chart.animate(0, outerRadius); })
            .fillStyle(colorProp);

        if (options.showTooltips) {
            this._addPropTooltip(this.pvPie);
        }
        
        if(this._shouldHandleClick()){
            this._addPropClick(this.pvPie);
        }
        
        if(options.doubleClickAction) {
            this._addPropDoubleClick(this.pvPie);
        }
        
        if(this.showValues){
            var formatValue = function(value, catGroup){
                // Prefer to return the already formatted/provided label
                var datums = catGroup._datums;
                if(datums.length > 1){
                    return valueDim.format(value);
                }
                
                return datums[0].atoms[valueDimName].label;
            };
            
            var formatPercent = function(value, catGroup){
                var percent = catGroup.dimensions(valueDimName).percentOverParent(visibleKeyArgs);
                return options.valueFormat.call(null, Math.round(percent  * 1000) / 10);
            };
            
            var defaultValuesMask = options.valuesMask;
            var valuesMaskFormatter = {};
            var getFormatValuesMask = function(valuesMask){
                if(valuesMask == null){
                    if(valuesMask === null){
                        return null;
                    }
                    // is undefined
                    
                    valuesMask = defaultValuesMask;
                }
                
                var formatter = valuesMaskFormatter[valuesMask];
                if(!formatter){
                    switch(valuesMask){
                        case '{0}': formatter = formatValue;   break;
                        case '{1}': formatter = formatPercent; break;
                        default:
                            var showValue   = valuesMask.indexOf('{0}') >= 0;
                            var showPercent = valuesMask.indexOf('{1}') >= 0;
                            if(showValue || showPercent){
                                formatter = function(value, catGroup){
                                    return def.format(valuesMask, [
                                                showValue   ? formatValue  (value, catGroup) : null, 
                                                showPercent ? formatPercent(value, catGroup) : null
                                           ]);
                                };
                            } else {
                                formatter = def.fun.constant(valuesMask);
                            }
                            break;
                    }
                    
                    valuesMaskFormatter[valuesMask] = formatter;
                }
                
                return formatter;
            };
            
            var valuesMaskInterceptor = function(getValuesMask, args) {
                return getValuesMask ? getValuesMask.apply(this, args) : defaultValuesMask;
            };
            
            this.pvPieLabel = this.pvPie.anchor("outer").add(pv.Label)
                // .textAngle(0)
                .localProperty('valuesMask')
                .valuesMask(defaultValuesMask)
                // Intercepting ensures it is evaluated before "text"
                .intercept('valuesMask', valuesMaskInterceptor, this._getExtension('pieLabel', 'valuesMask'))
                .text(function(catGroup) {
                    // No text on 0-width slices... // TODO: ideally the whole slice would be visible=false; when scenes are added this is easily done
                    var value = myself.pvPie.value();
                    if(!value){
                        return null;
                    }
                    
                    var formatter = getFormatValuesMask(this.valuesMask());
                    if(!formatter){
                        return null;
                    }
                    
                    return " " + formatter(value, catGroup);
                 })
                .textMargin(10);
        }
    },
    
    applyExtensions: function(){
        this.extend(this.pvPie, "pie_");
        this.extend(this.pvPieLabel, "pieLabel_");
        this.extend(this.pvPanel, "chart_");
    },
    
    _explodeSlice: function(fun, mark) {
        var offset = 0;
        if (this.explodedSliceIndex == mark.index) {
            offset = this.explodedSliceRadius * Math[fun](mark.midAngle());
        }
        
        return offset;
    },
    
    /**
     * Renders this.pvBarPanel - the parent of the marks that are affected by selection changes.
     * @override
     */
    _renderInteractive: function(){
        this.pvPie.render();
    },

    /**
     * Returns an array of marks whose instances are associated to a datum, or null.
     * @override
     */
    _getSignums: function(){
        return [this.pvPie];
    }
});
