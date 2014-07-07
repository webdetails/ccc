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
        // Assumes that chart is the BoxChart
        var visualRoles = this.chart.visualRoles,
            dimsReaders = [];
        
        if(!visualRoles.series.isPreBound()) {
            var S = this._getLogicalGroupLength('series');
            if(S) this._collectDimReaders(dimsReaders, 'series', null, S);
        }

        if(!visualRoles.category.isPreBound()) {
            var C = this._getLogicalGroupLength('category');
            if(C) this._collectDimReaders(dimsReaders, 'category', null, C);
        }

        // Try to bind as much measure roles as there are free measures
        var M = this._getLogicalGroupLength('value');
        if(M) {
            var index = 0;
            pvc.visual.BoxPlot.measureRolesNames.forEach(function(roleName) {
                var role = visualRoles[roleName];
                if(!role.isPreBound()) {
                    index = this._collectDimReaders(
                        dimsReaders,
                        /*logicalGroupName*/'value',
                        /*dimGroupName*/role.defaultDimensionName,
                        /*number of desired dimensions*/1,
                        /*startIndex*/index,
                        /*levelCount*/1);
                }
            }, this);
        }

        dimsReaders.forEach(this.defReader, this);
    }
});