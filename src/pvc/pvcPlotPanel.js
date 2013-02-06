
def
.type('pvc.PlotPanel', pvc.BasePanel)
.init(function(chart, parent, plot, options) {
    // Prevent the border from affecting the box model,
    // providing a static 0 value, independently of the actual drawn value...
    //this.borderWidth = 0;
    
    this.base(chart, parent, options);
    
    this.plot = plot;
    this._extensionPrefix = plot.extensionPrefixes;
    this.dataPartValue = plot.option('DataPart');
    this.axes.color    = chart._getAxis('color', (plot.option('ColorAxis') || 0) - 1);
    this.orientation   = plot.option('Orientation'  );
    this.valuesVisible = plot.option('ValuesVisible');
    this.valuesAnchor  = plot.option('ValuesAnchor' );
    this.valuesMask    = plot.option('ValuesMask'   );
    this.valuesFont    = plot.option('ValuesFont'   );
    
    var roles = this.visualRoles = Object.create(chart._visualRoles);
    
    var colorRoleName = plot.option('ColorRole');
    roles.color = colorRoleName ? chart.visualRoles(colorRoleName) : null;
    
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
    
    /* @override */
    isOrientationVertical: function(){
        return this.orientation === pvc.orientation.vertical;
    },

    /* @override */
    isOrientationHorizontal: function(){
        return this.orientation === pvc.orientation.horizontal;
    }
});