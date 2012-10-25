
pvc.CategoricalAbstractPanel = pvc.CartesianAbstractPanel.extend({
    
    constructor: function(chart, parent, plot, options) {
        
        this.base(chart, parent, plot, options);
        
        this.stacked = plot.option('Stacked');
    }
});