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
def('pvc.visual.HeatGridPlot', pvc.visual.CategoricalPlot.extend({
    methods: /** @lends pvc.visual.HeatGridPlot#*/{
        type: 'heatGrid',

        /** @override */
        interpolatable: function() {
            return false;
        },

        /** @override */
        _initVisualRoles: function() {

            this.base();

            // TODO: get a translator for this!!

            var chart = this.chart,
                sizeDimName = (chart.compatVersion() > 1 || chart.options.sizeValIdx === 1)
                    ? 'value2'
                    : 'value';

            this._addVisualRole('size', {
                isMeasure: true,
                requireSingleDimension: true,
                requireIsDiscrete: false,
                valueType: Number,
                defaultDimension: sizeDimName
            });
        },

        /* @override */
        _getColorRoleSpec: function() {
            var chart = this.chart,
                colorDimName = (chart.compatVersion() <= 1 && chart.options.colorValIdx === 1)
                    ? 'value2'
                    : 'value';

            return {
                isMeasure: true,
                requireSingleDimension: true,
                requireIsDiscrete: false,
                valueType: Number,
                defaultDimension: colorDimName
            };
        },

        /* @override */
        _getCategoryRoleSpec: function() {
            var catRoleSpec = this.base();
            // Force dimension to be discrete!
            catRoleSpec.requireIsDiscrete = true;
            return catRoleSpec;
        },

        /** @override */
        _initDataCells: function() {

            this.base();

            if(this.option('UseShapes')) {
                this._addDataCell(new pvc.visual.DataCell(
                    this,
                    /*axisType*/ 'size',
                    this.option('SizeAxis') - 1,
                    this.visualRoles.size));
            }
        },

        /** @override */
        _getOrthoRoles: function() { return [this.visualRole('series')]; }
    },

    options: {
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
            cast:    pvc.parseShape,
            value:   'square'
        },

        NullShape: {
            resolve: '_resolveFull',
            cast:    pvc.parseShape,
            value:   'cross'
        },

        ValuesVisible: { // override
            getDefault: function(/*optionInfo*/) {
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
    }
}));

pvc.visual.Plot.registerClass(pvc.visual.HeatGridPlot);
