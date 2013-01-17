def.scope(function(){
    /**
     * Initializes a point plot.
     * 
     * @name pvc.visual.PointPlot
     * @class Represents a Point plot.
     * @extends pvc.visual.CategoricalPlot
     */
    def
    .type('pvc.visual.PointPlot', pvc.visual.CategoricalPlot)
    .add({
        type: 'point',
        _getOptionsDefinition: function(){
            return pvc.visual.PointPlot.optionsDef;
        }
    });
    
    function visibleData(type, dv){
        return {
            resolveV1: function(optionInfo){
                if(this.globalIndex === 0){
                    if(!this._specifyChartOption(optionInfo, 'show' + type)){
                        optionInfo.defaultValue(dv);
                    }
                    return true;
                }
            }
        };
    }
    
    pvc.visual.PointPlot.optionsDef = def.create(
        pvc.visual.CategoricalPlot.optionsDef, {
            DotsVisible: {
                resolve: '_resolveFull',
                data:    visibleData('Dots', true),
                cast:    Boolean,
                value:   false
            },
            
            LinesVisible: {
                resolve: '_resolveFull',
                data:    visibleData('Lines', true),
                cast:    Boolean,
                value:   false
            },
            
            AreasVisible: {
                resolve: '_resolveFull',
                data:    visibleData('Areas', false),
                cast:    Boolean,
                value:   false
            },
            
            ValuesAnchor: { // override
                value: 'right'
            }
        });
});