/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

pvc.parseSunburstSliceOrder =
    pvc.makeEnumParser('sliceOrder', ['bySizeAscending', 'bySizeDescending', 'none'], 'bySizeDescending');

pvc.parseSunburstColorMode =
    pvc.makeEnumParser('colorMode', ['fan', 'slice', 'level'], 'fan');

/**
 * Initializes a sunburst plot.
 *
 * @name pvc.visual.SunburstPlot
 * @class Represents a sunburst plot.
 * @extends pvc.visual.Plot
 */
def('pvc.visual.SunburstPlot', pvc.visual.Plot.extend({
    init: function(chart, keyArgs) {

        this.base(chart, keyArgs);

        if(!(chart instanceof pvc.SunburstChart))
            throw def.error(def.format("Plot type '{0}' can only be used from within a sunburst chart.", [this.type]));
    },
    methods: /** @lends pvc.visual.SunburstPlot# */{
        type: 'sunburst',

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
                requireIsDiscrete: true,
                rootLabel: this.option('RootCategoryLabel')
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
                    this.visualRoles.size));
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

        ColorMode: {
            resolve: '_resolveFull',
            cast:    pvc.parseSunburstColorMode,
            value:   'fan'
        },

        RootCategoryLabel: {
            resolve: '_resolveFull',
            cast: String,
            value: "All"
        },

        SliceOrder: {
            resolve: '_resolveFull',
            cast: pvc.parseSunburstSliceOrder,
            value: 'bySizeDescending'
        },

        EmptySlicesVisible: {
            resolve: '_resolveFull',
            cast: Boolean,
            value: false
        },

        EmptySlicesLabel: {
            resolve: '_resolveFull',
            cast:  String,
            value: ''
        }
    }
}));

pvc.visual.Plot.registerClass(pvc.visual.SunburstPlot);
