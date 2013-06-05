/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a heat grid plot.
 *
 * @name pvc.visual.HeatGridPlot
 * @class Represents a heat grid plot.
 * @extends pvc.visual.CategoricalPlot
 */
def
.type('pvc.visual.HeatGridPlot', pvc.visual.CategoricalPlot)
.add({
    type: 'heatGrid',
    _getOptionsDefinition: function(){
        return pvc.visual.HeatGridPlot.optionsDef;
    }
});

pvc.visual.HeatGridPlot.optionsDef = def.create(
    pvc.visual.CategoricalPlot.optionsDef,
    {
        SizeRole: {
            value: 'size'
        },

        SizeAxis: {
            value: 1
        },

        UseShapes: {
            resolve: '_resolveFull',
            cast:    Boolean,
            value:   false
        },

        Shape: {
            resolve: '_resolveFull',
            cast:    pvc_parseShape,
            value:   'square'
        },

        NullShape: {
            resolve: '_resolveFull',
            cast:    pvc_parseShape,
            value:   'cross'
        },

        ValuesVisible: { // override
            getDefault: function(/*optionInfo*/){
                // Values do not work very well when UseShapes
                return !this.option('UseShapes');
            },
            value: null // clear inherited default value
        },

        ValuesMask: { // override, dynamic default
            value: null
        },

        ValuesAnchor: { // override default value only
            value: 'center'
        },

        OrthoRole: { // override
            value: 'series'
        },

        OrthoAxis: { // override
            resolve: null
        },

        // Not supported
        NullInterpolationMode: {
            resolve: null,
            value: 'none'
        },

        // Not supported
        Stacked: { // override
            resolve: null,
            value: false
        }
    });