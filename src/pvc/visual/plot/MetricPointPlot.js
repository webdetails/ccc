def.scope(function(){

    /**
     * Initializes a metric XY plot.
     * 
     * @name pvc.visual.MetricPointPlot
     * @class Represents a metric point plot.
     * @extends pvc.visual.MetricXYPlot
     */
    def
    .type('pvc.visual.MetricPointPlot', pvc.visual.MetricXYPlot)
    .add({
        type: 'scatter',
        _getOptionsDefinition: function(){
            return pvc.visual.MetricPointPlot.optionsDef;
        }
    });
    
    function visibleData(type){
        return {
            resolveV1: function(optionInfo){
                this._specifyChartOption(optionInfo, 'show' + type);
                return true;
            }
        };
    }
    
    pvc.visual.MetricPointPlot.optionsDef = def.create(
        pvc.visual.MetricXYPlot.optionsDef, {
            SizeRole: {
                resolve: '_resolveFixed',
                value: 'size'
            },
            
            SizeAxis: {
                resolve: '_resolveFixed',
                value: 1
            },
            
            Shape: {
                resolve: '_resolveFull',
                cast:    pvc.parseShape,
                value:   'circle'
            },
            
            DotsVisible: {
                resolve: '_resolveFull',
                data:    visibleData('Dots'),
                cast:    Boolean,
                value:   false
            },
            
            LinesVisible: {
                resolve: '_resolveFull',
                data:    visibleData('Lines'),
                cast:    Boolean,
                value:   false
            },
            
            ValuesAnchor: { // override
                value: 'right'
            }
        });
});