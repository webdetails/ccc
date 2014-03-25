/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def
.type('pvc.PlotPanel', pvc.BasePanel)
.init(function(chart, parent, plot, options) {
    // Prevent the border from affecting the box model,
    // providing a static 0 value, independently of the actual drawn value...
    //this.borderWidth = 0;
    
    this.base(chart, parent, options);
    
    this.plot = plot;
    this._extensionPrefix = plot.extensionPrefixes;
    this.dataPartValue  = plot.option('DataPart');
    this.axes.color     = chart._getAxis('color', (plot.option('ColorAxis') || 0) - 1);
    this.orientation    = plot.option('Orientation'  );
    this.valuesVisible  = plot.option('ValuesVisible');
    this.valuesAnchor   = plot.option('ValuesAnchor' );
    this.valuesMask     = plot.option('ValuesMask'   );
    this.valuesFont     = plot.option('ValuesFont'   );
    this.valuesOverflow = plot.option('ValuesOverflow');
    
    this.valuesOptimizeLegibility = plot.option('ValuesOptimizeLegibility');
    
    var roles = this.visualRoles = Object.create(chart.visualRoles);
    
    var colorRoleName = plot.option('ColorRole');
    roles.color = colorRoleName ? chart.visualRole(colorRoleName) : null;
    
    this.chart._addPlotPanel(this);
})
.add({
    anchor:  'fill',

    visualRoles: null,

    _getExtensionId: function(){
        // chart is deprecated
        var extensionIds = ['chart', 'plot'];
        if(this.plotName){
            extensionIds.push(this.plotName);
        }
        
        return extensionIds;
    },
    
    // For setting the renderer of a group scene.
    defaultLegendGroupScene: function() {
        var colorAxis = this.axes.color;
        if(colorAxis && colorAxis.option('LegendVisible') && colorAxis.isBound()) {
            return def
                .query(colorAxis.dataCells)
                .where (function(dataCell) { return dataCell.plot === this.plot; }, this)
                .select(function(dataCell) { return dataCell.legendGroupScene(); })
                .first(def.notNully);
        }
    },

    /* @override */
    isOrientationVertical: function(){
        return this.orientation === pvc.orientation.vertical;
    },

    /* @override */
    isOrientationHorizontal: function(){
        return this.orientation === pvc.orientation.horizontal;
    }
});