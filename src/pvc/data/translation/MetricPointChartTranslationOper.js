
/**
 * @name pvc.data.MetricPointChartTranslationOper
 * 
 * @class The translation mixin of the Metric XY charts.
 * 
 * <p>
 * The default format is:
 * </p>
 * <pre>
 * +----------+----------+----------+----------+----------+
 * | 0        | 1        | 2        | 3        | 4        |
 * +----------+----------+----------+----------+----------+
 * | series   | x        | y        | color    | size     |
 * +----------+----------+----------+----------+----------+
 * | discrete | number   | number   | num/disc | number   |
 * +----------+----------+----------+----------+----------+
 * </pre>
 * 
 * @extends pvc.data.MatrixTranslationOper
 */
def.type('pvc.data.MetricPointChartTranslationOper')
.add(/** @lends pvc.data.MetricPointChartTranslationOper# */{
    
    _meaLayoutRoles: ['x', 'y', 'color', 'size'],
    
    configureType: function(){
        var itemTypes = this._itemTypes;
        
        var V = itemTypes.length;
        
        // VItem Indexes of continuous columns not yet being read
        var freeMeaIndexes = [];
        
        // Idem, but for discrete columns
        var freeDisIndexes = [];
        
        def
        .range(0, V)
        .each(function(j){
            if(!this._userUsedIndexes[j]){
                if(itemTypes[j] === 1){
                    freeMeaIndexes.push(j);
                } else {
                    freeDisIndexes.push(j);
                }
            }
        }, this);
        
        var N;
        var autoDimNames = [];
        var F = freeMeaIndexes.length;
        if(F > 0){
            // Bind the first M unbound roles
            for(var i = 0 ; i < F ; i++){
                this._getUnboundRoleDefaultDimNames(this._meaLayoutRoles[i], 1, autoDimNames);
            }
            
            N = autoDimNames.length;
            if(N > 0){
                freeMeaIndexes.length = N;
                this.defReader({names: autoDimNames, indexes: freeMeaIndexes});
            }
        }
        
        // All discrete measures go to series dimensions
        F = freeDisIndexes.length;
        if(F > 0){
            autoDimNames.length = 0;
            this._getUnboundRoleDefaultDimNames('series', F, autoDimNames);
            
            N = autoDimNames.length;
            if(N > 0){
                freeDisIndexes.length = N;
                this.defReader({names: autoDimNames, indexes: freeDisIndexes});
            }
        }
    },
    
    defDimensionType: function(dimName, dimSpec){
        var dimGroup = pvc.data.DimensionType.dimensionGroupName(dimName);
        switch(dimGroup){
            case 'x':
                var isCategoryTimeSeries = this.options.isCategoryTimeSeries;
                dimSpec = def.setUDefaults(dimSpec, 'valueType', isCategoryTimeSeries ? Date : Number);
                break;
                
            case 'y':
            case 'color':
            case 'size':
                dimSpec = def.setUDefaults(dimSpec, 'valueType', Number);
                break;
        }
        
        return this.base(dimName, dimSpec);
    }
});