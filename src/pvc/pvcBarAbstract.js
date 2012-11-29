
/**
 * BarAbstract is the base class for generating charts of the bar family.
 */
def
.type('pvc.BarAbstract', pvc.CategoricalAbstract)
.init(function(options){

    this.base(options);

    var parent = this.parent;
    if(parent) {
        this._valueRole = parent._valueRole;
    }
})
.add({
    // NOTE
    // Timeseries category with bar charts are supported differently in V2 than in V1
    // They worked in v1 if the data set brought all
    // categories, according to chosen timeseries scale date unit
    // Then, bars were drawn with a category scale, 
    // whose positions ended up coinciding with the ticks in a linear axis...
    // To mimic v1 behavior the category dimensions are "coerced" to isDiscrete
    // The axis will be categoric, the parsing will work, 
    // and the formatting will be the desired one

    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){
        
        this.base();
        
        this._addVisualRole('value', {
            isMeasure: true,
            isRequired: true,
            isPercent: this.options.stacked,
            requireSingleDimension: true,
            requireIsDiscrete: false,
            valueType: Number,
            defaultDimension: 'value'
        });

        this._valueRole = this.visualRoles('value');
    },
    
    _getCategoryRoleSpec: function(){
        var catRoleSpec = this.base();
        
        // Force dimension to be discrete!
        catRoleSpec.requireIsDiscrete = true;
        
        return catRoleSpec;
    },
    
    _initData: function(){
        this.base.apply(this, arguments);

        var data = this.data;

        // Cached
        this._valueDim = data.dimensions(this._valueRole.firstDimensionName());
    }
});