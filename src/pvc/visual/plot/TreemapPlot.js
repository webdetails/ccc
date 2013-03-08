def.scope(function(){
    
    /**
     * Initializes a treemap plot.
     * 
     * @name pvc.visual.TreemapPlot
     * @class Represents a treemap plot.
     * @extends pvc.visual.Plot
     */
    def
    .type('pvc.visual.TreemapPlot', pvc.visual.Plot)
    .add({
        type: 'treemap',
        
        _getOptionsDefinition: function() {
            return pvc.visual.TreemapPlot.optionsDef;
        },
        
        collectDataCells: function(dataCells) {
            
            this.base(dataCells);
            
            // Add Size DataCell
            var sizeRoleName = this.option('SizeRole');
            if(sizeRoleName) {
                dataCells.push(new pvc.visual.DataCell(
                        this,
                        /*axisType*/ 'size', 
                        this.option('SizeAxis') - 1, 
                        sizeRoleName, 
                        this.option('DataPart')));
            }
        },
        
        /** @override */
        _getColorDataCell: function() {
            var colorRoleName = this.option('ColorRole');
            if(colorRoleName) {
                return new pvc.visual.TreemapColorDataCell(
                        this,
                        /*axisType*/ 'color',
                        this.option('ColorAxis') - 1, 
                        colorRoleName, 
                        this.option('DataPart'));
            }
        }
    });
    
    pvc.visual.TreemapPlot.optionsDef = def.create(
        pvc.visual.Plot.optionsDef, {
            SizeRole: {
                resolve: '_resolveFixed',
                value:   'size'
            },
            
            SizeAxis: {
                resolve: '_resolveFixed',
                value:   1
            },
            
            ValuesAnchor: {
                cast:  pvc.parseAnchor,
                value: 'center'
            },
            
            ValuesVisible: { // OVERRIDE
                value: true
            },

            ValuesMask: { // OVERRIDE
                resolve: '_resolveFull',
                value:   "{category}"
            },
            
            ValuesOptimizeLegibility: { // OVERRIDE
                value: true
            },
            
            // Treemap specifc
            LayoutMode: {
                resolve: '_resolveFull',
                cast:  pvc.parseTreemapLayoutMode,
                value: 'squarify'
            },
            
            ColorMode: {
                resolve: '_resolveFull',
                cast: pvc.parseTreemapColorMode,
                value: 'byparent'
            },
            
            RootCategoryLabel: {
                resolve: '_resolveFull',
                cast: String,
                value: 'Root'
            }
        });
});