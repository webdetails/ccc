/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @name pvc.data.BoxplotChartTranslationOper
 * 
 * @class The translation mixin operation of the box plot chart.
 * 
 * <p>
 * The default box plot format is:
 * </p>
 * <pre>
 * +----------+----------+--------------+--------------+------------+-------------+
 * | 0        | 1        | 2            | 3            | 4          | 5           |
 * +----------+----------+--------------+--------------+------------+-------------+
 * | category | median   | lowerQuartil | upperQuartil | minimum    | maximum     |
 * +----------+----------+--------------+--------------+------------+-------------+
 * | any      | number   | number       | number       | number     | number      |
 * +----------+----------+--------------+--------------+------------+-------------+
 * </pre>
 * 
 * @extends cdo.MatrixTranslationOper
 */
def.type('pvc.data.BoxplotChartTranslationOper')
.add(/** @lends pvc.data.BoxplotChartTranslationOper# */{
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
        
        this._getUnboundRoleDefaultDimNames('category', freeDisIndexes.length, autoDimNames);
        
        // Try to bind as much measure roles as there are free measures
        def
        .query(pvc.visual.BoxPlot.measureRolesNames)
        .take (freeMeaIndexes.length) // first free measures
        .each(function(roleName) {
            this._getUnboundRoleDefaultDimNames(roleName, 1, autoDimNames);
        }, this);

        if(autoDimNames.length) this.defReader({names: autoDimNames});
    }
});