/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes an abstract bar plot.
 *
 * @name pvc.visual.BarPlotAbstract
 * @class Represents an abstract bar plot.
 * @extends pvc.visual.CategoricalPlot
 */
def
.type('pvc.visual.BarPlotAbstract', pvc.visual.CategoricalPlot)
.add({
    /** @override */
    _getOptionsDefinition: function() {
        return pvc.visual.BarPlotAbstract.optionsDef;
    },

    /** @override */
    _initVisualRoles: function() {

        this.base();

        this._addVisualRole('value', {
            isMeasure: true,
            isRequired: true,
            isPercent: this.option('Stacked'),
            requireSingleDimension: true,
            requireIsDiscrete: false,
            valueType: Number,
            defaultDimension: 'value'
        });
    },

    // NOTE
    // Timeseries category with bar charts are supported differently in V2 than in V1
    // They worked in v1 if the data set brought all
    // categories, according to chosen timeseries scale date unit
    // Then, bars were drawn with a category scale,
    // whose positions ended up coinciding with the ticks in a linear axis...
    // To mimic v1 behavior the category dimensions are "coerced" to isDiscrete
    // The axis will be categoric, the parsing will work,
    // and the formatting will be the desired one

    /** @override */
    _getCategoryRoleSpec: function() {
        var catRoleSpec = this.base();
        // Force dimension to be discrete!
        catRoleSpec.requireIsDiscrete = true;
        return catRoleSpec;
    }
});

pvc.visual.BarPlotAbstract.optionsDef = def.create(
    pvc.visual.CategoricalPlot.optionsDef, {

    BarSizeRatio: { // for grouped bars
        resolve: '_resolveFull',
        cast: function(value) {
            value = pvc.castNumber(value);

            return value == null ? 1    :
                   value <  0.05 ? 0.05 :
                   value >  1    ? 1    :
                   value;
        },
        value: 0.9
    },

    BarSizeMax: {
        resolve: '_resolveFull',
        data: {
            resolveV1: function(optionInfo) {
                // default to v1 option
                return this._specifyChartOption(optionInfo, 'maxBarSize'), true;
            }
        },
        cast: function(value) {
            value = pvc.castNumber(value);

            return value == null ? Infinity :
                   value <  1    ? 1        :
                   value;
        },
        value: 2000
    },

    BarOrthoSizeMin: {
        resolve: '_resolveFull',
        cast:    pvc.castNonNegativeNumber,
        value:   1.5 // px
    },

    BarStackedMargin: { // for stacked bars
        resolve: '_resolveFull',
        cast: function(value) {
            value = pvc.castNumber(value);

            return (value != null && value < 0) ? 0 : value;
        },
        value: 0
    },

    OverflowMarkersVisible: {
        resolve: '_resolveFull',
        cast:    Boolean,
        value:   true
    },

    ValuesAnchor: { // override default value only
        value: 'center'
    }
});