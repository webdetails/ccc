/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a sunburst plot.
 * 
 * @name pvc.visual.SunburstPlot
 * @class Represents a sunburst plot.
 * @extends pvc.visual.Plot
 */
def
.type('pvc.visual.SunburstPlot', pvc.visual.Plot)
.add({
    type: 'sunburst',
    
    _getOptionsDefinition: function() { return pvc.visual.SunburstPlot.optionsDef; },
    
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
    }
});

pvc.visual.SunburstPlot.optionsDef = def.create(
    pvc.visual.Plot.optionsDef, {
        SizeRole: {
            resolve: '_resolveFixed',
            value:   'size'
        },
        
        SizeAxis: {
            resolve: '_resolveFixed',
            value:   1
        },
        
        ValuesAnchor: { // NOT USED
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
        
        // Sunburst specifc
        LayoutMode: {
            resolve: '_resolveFull',
            cast:  pvc.parseSunburstLayoutMode,
            value: 'squarify'
        },
        
        ColorMode: {
            resolve: '_resolveFull',
            cast: pvc.parseSunburstColorMode,
            value: 'byparent'
        },
        
        RootCategoryLabel: {
            resolve: '_resolveFull',
            cast: String,
            value: "All"
        },
        
        SliceOrder: {
          resolve: '_resolveFull',
          cast: pvc.parseSunburstSliceOrder,
          value: 'bySizeAscending'
        }
    });