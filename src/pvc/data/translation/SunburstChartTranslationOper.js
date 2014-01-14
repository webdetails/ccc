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
 * | any      | number   | number/disc  |
 * +----------+----------+--------------+
 * </pre>
 * 
 * @extends pvc.data.MatrixTranslationOper
 */
def.type('pvc.data.SunburstChartTranslationOper')
.add(/** @lends pvc.data.SunburstChartTranslationOper# */{
    /**
     * @override
     */
    _configureTypeCore: function() {
        var autoDimNames = [];
        
        // VItem Indexes of continuous columns not yet being read
        var freeMeaIndexes = [];
        
        // Idem, but for discrete columns
        var freeDisIndexes = [];
        
        this.collectFreeDiscreteAndConstinuousIndexes(freeDisIndexes, freeMeaIndexes);
        
        var D = freeDisIndexes.length;
        var M = freeMeaIndexes.length;
        
        if(D) { this._getUnboundRoleDefaultDimNames('category', D, autoDimNames); }
        if(M) {
            def.query(['size', 'color']).take(M).each(function(roleName) {
                this._getUnboundRoleDefaultDimNames(roleName, 1, autoDimNames);
            }, this);
        }
        
        if(autoDimNames.length) { this.defReader({names: autoDimNames}); }
    }
});