
/**
 * MetricXYAbstract is the base class of metric XY charts.
 * (Metric stands for:
 *   Measure, Continuous or Not-categorical base and ortho axis)
 */
def
.type('pvc.MetricXYAbstract', pvc.CartesianAbstract)
.init(function(options){

    this.base(options);

    var parent = this.parent;
    if(parent) {
        this._xRole = parent._xRole;
        this._yRole = parent._yRole;
    }
})
.add({
    _processOptionsCore: function(options){
        
        this.base(options);
        
        // Has no meaning in this chart type
        // Only used by discrete scales
        options.panelSizeRatio = 1;
    },

    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){

        this.base();

        this._xRole = this._addVisualRole('x', {
                isMeasure: true,
                isRequired: true,
                requireSingleDimension: true,
                requireIsDiscrete: false,
                defaultDimension: 'x'
            });
        this._yRole = this._addVisualRole('y', {
                isMeasure: true,
                isRequired: true,
                requireSingleDimension: true,
                requireIsDiscrete: false,
                defaultDimension: 'y'
            });
    },

    _initData: function(){
        this.base.apply(this, arguments);

        // Cached
        this._xDim = this.data.dimensions(this._xRole.firstDimensionName());
        this._yDim = this.data.dimensions(this._yRole.firstDimensionName());
    },
    
    _generateTrendsDataCellCore: function(newDatums, dataCell, trendInfo){
        var serRole = this._serRole;
        var xRole   = this._xRole;
        var yRole   = dataCell.role;
        
        this._warnSingleContinuousValueRole(yRole);
        
        var dataPartDimName = this._dataPartRole.firstDimensionName();
        var xDimName = xRole.firstDimensionName();
        var yDimName = yRole.firstDimensionName();
        
        // Visible part data, possibly grouped by series (if series is bound)
        var data = this._getVisibleData(dataCell.dataPartValue);
        
        // For each series...
        def
        .scope(function(){
            return serRole.isBound()   ?
                   data.children() : // data already only contains visible data
                   def.query([data]) // null series
                   ;
        })
        .each(genSeriesTrend, this)
        ;
        
        function genSeriesTrend(serData){
            var funX = function(datum){
                    return datum.atoms[xDimName].value;
                };
            
            var funY = function(datum){
                    return datum.atoms[yDimName].value;
                };
            
            var trendModel = trendInfo.model(serData.datums(), funX, funY);
            if(trendModel){
                // Works well for linear, but for other interpolation types
                // what is the correct sampling spacing?
                var firstDatum = serData.firstDatum();
                var xExtent = serData.dimensions(xDimName).extent();
                if(xExtent.min !== xExtent.max){
                    var xPoints = [xExtent.min.value, xExtent.max.value];
                    // At least one point...
                    // Sample the line on each x and create a datum for it
                    // on the 'trend' data part
                    xPoints.forEach(function(trendX, index){
                        var trendY = trendModel.sample(trendX);
                        var atoms = Object.create(serData.atoms); // just common atoms
                        atoms[xDimName] = trendX;
                        atoms[yDimName] = trendY;
                        atoms[dataPartDimName] = trendInfo.dataPartAtom;
                        
                        var newDatum = new pvc.data.Datum(data.owner, atoms);
                        newDatum.isVirtual = true;
                        newDatum.isTrend   = true;
                        newDatum.trendType = trendInfo.type;
                        
                        newDatums.push(newDatum);
                    }, this);
                }
            }
        }
    },

    defaults: def.create(pvc.CartesianAbstract.prototype.defaults, {})
});
