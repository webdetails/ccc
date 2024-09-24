/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


pvc.parseTreemapLayoutMode =
    pvc.makeEnumParser('layoutMode', ['squarify', 'slice-and-dice', 'slice', 'dice'], 'squarify');

pvc.parseTreemapColorMode =
    pvc.makeEnumParser('colorMode', ['byParent', 'bySelf'], 'byParent');

/**
 * Initializes a treemap plot.
 *
 * @name pvc.visual.TreemapPlot
 * @class Represents a treemap plot.
 * @extends pvc.visual.Plot
 */
def('pvc.visual.TreemapPlot', pvc.visual.Plot.extend({
    init: function(chart, keyArgs) {

        this.base(chart, keyArgs);

        if(!(chart instanceof pvc.TreemapChart))
            throw def.error(def.format("Plot type '{0}' can only be used from within a treemap chart.", [this.type]));
    },
    methods: /** @lends pvc.visual.TreemapPlot# */{
        type: 'treemap',

        /** @override */
        _initVisualRoles: function() {

            this.base();

            this._addVisualRole('category', {
                isRequired: true,
                defaultDimension: 'category*',
                autoCreateDimension: true,
                rootLabel: this.option('RootCategoryLabel')
            });

            this._addVisualRole('size', {
                isMeasure:  true,
                isRequired: false,
                isPercent:  true,
                requireSingleDimension: false,
                requireIsDiscrete: false,
                valueType: Number,
                defaultDimension: 'size'
            });
        },

        /** @override */
        _getColorRoleSpec: function() {
            return {
                defaultSourceRole: 'category',
                defaultDimension:  'color*',
                rootLabel: this.option('RootCategoryLabel'),
                requireIsDiscrete:  true
            };
        },

        /** @override */
        createData: function(baseData, ka) {
            return this.visualRoles.category.select(baseData, ka);
        },

        /** @override */
        _initDataCells: function() {

            this.base();

            this._addDataCell(new pvc.visual.DataCell(
                    this,
                    /*axisType*/ 'size',
                    this.option('SizeAxis') - 1,
                    this.visualRole('size')));
        }
    },

    options: {
        SizeRole: {
            resolve: '_resolveFixed',
            value:   'size'
        },

        SizeAxis: {
            resolve: '_resolveFixed',
            value:   1
        },

        ValuesAnchor: { // NOT USED
            cast:  pvc.parseAnchor,
            value: 'center'
        },

        ValuesVisible: { // OVERRIDE
            value: true
        },

        ValuesMask: { // OVERRIDE
            resolve: '_resolveFull',
            value:   "{category}"
        },

        ValuesOptimizeLegibility: { // OVERRIDE
            value: true
        },

        // Treemap specifc
        LayoutMode: {
            resolve: '_resolveFull',
            cast:  pvc.parseTreemapLayoutMode,
            value: 'squarify'
        },

        ColorMode: {
            resolve: '_resolveFull',
            cast: pvc.parseTreemapColorMode,
            value: 'byparent'
        },

        RootCategoryLabel: {
            resolve: '_resolveFull',
            cast: String,
            value: "All"
        }
    }
}));

pvc.visual.Plot.registerClass(pvc.visual.TreemapPlot);
