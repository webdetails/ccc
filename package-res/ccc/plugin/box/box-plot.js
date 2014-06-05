/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a box plot.
 * 
 * @name pvc.visual.BoxPlot
 * @class Represents a box plot.
 * @extends pvc.visual.CategoricalPlot
 */
def
.type('pvc.visual.BoxPlot', pvc.visual.CategoricalPlot)
.add({
    type: 'box',

    /** @override */
    _getOptionsDefinition: function() { return pvc.visual.BoxPlot.optionsDef; },

    /** @override */
    _initVisualRoles: function() {

        this.base();

        var roleSpecBase = {
            isMeasure: true,
            requireSingleDimension: true,
            requireIsDiscrete: false,
            valueType: Number
        };

        [
            {name: 'median',       label: 'Median',        defaultDimension: 'median', isRequired: true},
            {name: 'lowerQuartil', label: 'Lower Quartil', defaultDimension: 'lowerQuartil'},
            {name: 'upperQuartil', label: 'Upper Quartil', defaultDimension: 'upperQuartil'},
            {name: 'minimum',      label: 'Minimum',       defaultDimension: 'minimum' },
            {name: 'maximum',      label: 'Maximum',       defaultDimension: 'maximum'}
        ].forEach(function(info) {
            this._addVisualRole(info.name, def.create(roleSpecBase, info));
        }, this);
    },

    /** @override */
    _getOrthoRoles: function() {
        return pvc.visual.BoxPlot.measureRolesNames.map(this.visualRole, this);
    }
});

pvc.visual.BoxPlot.addStatic({
    measureRolesNames: ['median', 'lowerQuartil', 'upperQuartil', 'minimum', 'maximum']
});

pvc.visual.BoxPlot.optionsDef = def.create(
    pvc.visual.CategoricalPlot.optionsDef,
    {
        // NO Values Label!

        Stacked: { // Not supported
            resolve: null,
            value:   false
        },

        BoxSizeRatio: {
            resolve: '_resolveFull',
            cast: function(value) {
                value = pvc.castNumber(value);
                return value == null ? 1    :
                       value <  0.05 ? 0.05 :
                       value >  1    ? 1    :
                       value;
            },
            value: 1/3
        },
        
        BoxSizeMax: {
            resolve: '_resolveFull',
            data: {
                resolveV1: function(optionInfo) {
                    // default to v1 option
                    return this._specifyChartOption(optionInfo, 'maxBoxSize'), true;
                }
            },
            cast: function(value) {
                value = pvc.castNumber(value);
                return value == null ? Infinity :
                       value <  1    ? 1        :
                       value;
            },
            value: Infinity
        }
    });

pvc.visual.Plot.registerClass(pvc.visual.BoxPlot);