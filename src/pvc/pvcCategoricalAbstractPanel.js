
def
.type('pvc.CategoricalAbstractPanel', pvc.CartesianAbstractPanel)
.init(function(chart, parent, plot, options){
    
    this.base(chart, parent, plot, options);
    
    this.stacked = plot.option('Stacked');
});