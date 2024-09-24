/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_PercentValue:true */

/**
 * Initializes a pie plot.
 *
 * @name pvc.visual.PiePlot
 * @class Represents a pie plot.
 * @extends pvc.visual.Plot
 */
def('pvc.visual.PiePlot', pvc.visual.Plot.extend({
    init: function(chart, keyArgs) {

        this.base(chart, keyArgs);

        if(!(chart instanceof pvc.PieChart))
            throw def.error(def.format("Plot type '{0}' can only be used from within a pie chart.", [this.type]));
    },
    methods: /** @lends pvc.visual.PiePlot# */{
        /** @override */
        type: 'pie',

        /** @override */
        _initVisualRoles: function() {

            this.base();

            this._addVisualRole('category', {
                isRequired: true,
                defaultDimension: 'category*',
                autoCreateDimension: true
            });

            this._addVisualRole('value', {
                isMeasure:  true,
                isRequired: true,
                isPercent:  true,
                requireSingleDimension: false,
                requireIsDiscrete: false,
                valueType: Number,
                defaultDimension: 'value'
            });
        },

        /** @override */
        _getColorRoleSpec: function() {
            return {
                isRequired: true,
                defaultSourceRole: 'category',
                defaultDimension: 'color*',
                requireIsDiscrete: true
            };
        },

        /** @override */
        createData: function(baseData, ka) {
            return this.visualRoles.category.flatten(baseData, ka);
        },

        /** @override */
        _initDataCells: function() {

            this.base();

            this._addDataCell(new pvc.visual.DataCell(
                this,
                /*axisType*/'category',
                /*axisIndex*/this.index,
                /*role*/this.visualRole('category')));

            this._addDataCell(new pvc.visual.DataCell(
                this,
                /*axisType*/'angle',
                /*axisIndex*/this.index,
                /*role*/this.visualRoles.value));
        }
    },

    options: {
        ActiveSliceRadius: {
            resolve: '_resolveFull',
            cast:    pvc_PercentValue.parse,
            value:   new pvc_PercentValue(0.05)
        },

        ExplodedSliceRadius: {
            resolve: '_resolveFull',
            cast:    pvc_PercentValue.parse,
            value:   0
        },

        ExplodedSliceIndex:  {
            resolve: '_resolveFull',
            cast:    def.number.to,
            value:   null // all exploded when radius > 0
        },

        ValuesAnchor: { // override
            cast:  pvc.parseAnchorWedge,
            value: 'outer'
        },

        ValuesVisible: { // override
            value: true
        },

        ValuesLabelStyle: {
            resolve: function(optionInfo) {
                return this.chart.compatVersion() > 1
                    ? this._resolveFull(optionInfo)
                    : (optionInfo.specify('inside'), true);
            },
            cast: function(value) {
                switch(value) { case 'inside': case 'linked': return value; }

                if(def.debug >= 2) def.log("[Warning] Invalid 'ValuesLabelStyle' value: '" + value + "'.");

                return 'linked';
            },
            value: 'linked'
        },

        // Depends on being linked or not
        // Examples:
        // "{value} ({value.percent}) {category}"
        // "{value}"
        // "{value} ({value.percent})"
        // "{#productId}" // Atom name
        ValuesMask: { // OVERRIDE
            resolve: '_resolveFull',
            data: {
                resolveDefault: function(optionInfo) {
                    optionInfo.defaultValue(
                            this.option('ValuesLabelStyle') === 'linked' ?
                            "{value} ({value.percent})" :
                            "{value}");
                    return true;
                }
            }
        },

        /* Linked Label Style
         *
         *     (| elbowX)                         (| anchorX)
         *      +----------------------------------+          (<-- baseY)
         *      |                                    \
         *      |   (link outset)                      \ (targetX,Y)
         *      |                                        +----+ label
         *    -----  <-- current outer radius      |<-------->|<------------>
         *      |   (link inset)                     (margin)   (label size)
         *
         */

        /**
         * Percentage of the client radius that the
         * link is inset in a slice.
         */
        LinkInsetRadius:  {
            resolve: '_resolveFull',
            cast:    pvc_PercentValue.parse,
            value:   new pvc_PercentValue(0.05)
        },

        /**
         * Percentage of the client radius that the
         * link extends outwards from the slice,
         * until it reaches the link "elbow".
         */
        LinkOutsetRadius: {
            resolve: '_resolveFull',
            cast:    pvc_PercentValue.parse,
            value:   new pvc_PercentValue(0.025)
        },

        /**
         * Percentage of the client width that separates
         * a link label from the link's anchor point.
         * <p>
         * Determines the width of the link segment that
         * connects the "anchor" point with the "target" point.
         * Includes the space for the small handle at the end.
         * </p>
         */
        LinkMargin: {
            resolve: '_resolveFull',
            cast:    pvc_PercentValue.parse,
            value:   new pvc_PercentValue(0.025)
        },

        /**
         * Link handle width, in em units.
         */
        LinkHandleWidth: {
            resolve: '_resolveFull',
            cast:    def.number.to,
            value:   0.5
        },

        /**
         * Percentage of the client width that is reserved
         * for labels on each of the sides.
         */
        LinkLabelSize: {
            resolve: '_resolveFull',
            cast:    pvc_PercentValue.parse,
            value:   new pvc_PercentValue(0.15)
        },

        /**
         * Minimum vertical space that separates consecutive link labels,
         * in em units.
         */
        LinkLabelSpacingMin: {
            resolve: '_resolveFull',
            cast:    def.number.to,
            value:   0.5
        }
    }
}));

pvc.visual.Plot.registerClass(pvc.visual.PiePlot);
