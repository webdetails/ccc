
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
 * <p>
 * Color dimensions will be continuous by default.
 * If that is not the case, 
 * an explicit dimension valueType definition must be provided.
 * </p>
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
        
        // Distribute free measure columns by unbound measure roles 
        var N;
        var autoDimNames = [];
        var F = freeMeaIndexes.length;
        if(F > 0){
            // Collect the default dimension names of the 
            // first F unbound roles
            var R = this._meaLayoutRoles.length;
            var i = 0;
            while(i < R && autoDimNames.length < F){
                // If the measure role is unbound and has a default dimension,
                //  the next unused dimension of the default dimension group name
                //  is placed in autoDimNames.
                // If any, this dimension will be fed with the next freeMeaIndexes
                this._getUnboundRoleDefaultDimNames(this._meaLayoutRoles[i], 1, autoDimNames);
                i++;
            }
            
            N = autoDimNames.length;
            if(N > 0){
                freeMeaIndexes.length = N;
                this.defReader({names: autoDimNames, indexes: freeMeaIndexes});
            }
        }
        
        // All discrete columns go to series dimensions
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
    }
});