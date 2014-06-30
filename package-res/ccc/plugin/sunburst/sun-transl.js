/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @name pvc.data.SunburstChartTranslationOper
 * 
 * @class The translation mixin operation of the sunburst chart.
 * 
 * <p>
 * The default sunburst format is:
 * </p>
 * <pre>
 * +----------+----------+--------------+
 * | 0        | 1        | 2            |
 * +----------+----------+--------------+
 * | category | size     | color        |
 * +----------+----------+--------------+
 * | any      | number   | disc         |
 * +----------+----------+--------------+
 * </pre>
 * 
 * @extends cdo.MatrixTranslationOper
 */
def.type('pvc.data.SunburstChartTranslationOper')
.add(/** @lends pvc.data.SunburstChartTranslationOper# */{
    /**
     * @override
     */
    _configureTypeCore: function() {
        var autoDimNames = [],
        
            // VItem Indexes of continuous columns not yet being read
            freeMeaIndexes = [],
        
            // Idem, but for discrete columns
            freeDisIndexes = [];
        
        this.collectFreeDiscreteAndConstinuousIndexes(freeDisIndexes, freeMeaIndexes);
        
        var D = freeDisIndexes.length,
            M = freeMeaIndexes.length;
        
        if(D) this._getUnboundRoleDefaultDimNames('category', D, autoDimNames);
        if(M) this._getUnboundRoleDefaultDimNames('size',     1, autoDimNames);
        
        if(autoDimNames.length) this.defReader({names: autoDimNames});
    }
});