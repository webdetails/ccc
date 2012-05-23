
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
            category: { isRequired: true, defaultDimensionName: 'category' },
            
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
        showValuePercentage: false
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

        this.sum = valueDim.sum(visibleKeyArgs);
        
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
                return catGroup.dimensions(valueDimName).sum(visibleKeyArgs);
            })
            .localProperty('hasSelected')
            .hasSelected(function(catGroup){
                return catGroup.selectedCount() > 0;                    
            })
            .angle(function(){ return angleScale(this.value()); })
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
        
        // Extend pie
        this.extend(this.pvPie, "pie_");

        this.pvPieLabel = this.pvPie.anchor("outer").add(pv.Label)
            .visible(this.showValues)
            // .textAngle(0)
            .text(function(catGroup) {
                var value;
                if(options.showValuePercentage) {
                    value = catGroup.dimensions(valueDimName).percentOverParent(visibleKeyArgs);
                    return options.valueFormat.call(null, Math.round(value * 1000) / 10) + "%";
                }
                
                value = myself.pvPie.value();
                return " " + valueDim.format(value);
             })
            .textMargin(10);

        // Extend pieLabel
        this.extend(this.pvPieLabel, "pieLabel_");

        // Extend body
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
