/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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
 * @extends cdo.MatrixTranslationOper
 */
def.type('pvc.data.MetricPointChartTranslationOper')
.add(/** @lends pvc.data.MetricPointChartTranslationOper# */{
    
    _meaLayoutRoles: ['x', 'y', 'color', 'size'],
    
    configureType: function() {
        // VItem Indexes of continuous columns not yet being read
        var freeMeaIndexes = [],
            // Idem, but for discrete columns
            freeDisIndexes = [];
        
        this.collectFreeDiscreteAndConstinuousIndexes(freeDisIndexes, freeMeaIndexes);
        
        // Distribute free measure columns by unbound measure roles 
        var N,
            autoDimNames = [],
            F = freeMeaIndexes.length;

        if(F > 0) {
            // Collect the default dimension names of the 
            // first F unbound roles
            var R = this._meaLayoutRoles.length,
                i = 0;
            while(i < R && autoDimNames.length < F) {
                // If the measure role is unbound and has a default dimension,
                //  the next unused dimension of the default dimension group name
                //  is placed in autoDimNames.
                // If any, this dimension will be fed with the next freeMeaIndexes
                this._getUnboundRoleDefaultDimNames(this._meaLayoutRoles[i], 1, autoDimNames);
                i++;
            }
            
            N = autoDimNames.length;
            if(N > 0) {
                freeMeaIndexes.length = N;
                this.defReader({names: autoDimNames, indexes: freeMeaIndexes});
            }
        }
        
        // All discrete columns go to series dimensions
        F = freeDisIndexes.length;
        if(F > 0) {
            autoDimNames.length = 0;
            this._getUnboundRoleDefaultDimNames('series', F, autoDimNames);
            
            N = autoDimNames.length;
            if(N > 0) {
                freeDisIndexes.length = N;
                this.defReader({names: autoDimNames, indexes: freeDisIndexes});
            }
        }
    }
});