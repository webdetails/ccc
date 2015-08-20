/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_Axis:true */

/**
 * Initializes a size axis.
 * 
 * @name pvc.visual.SizeAxis
 * 
 * @class Represents an axis that maps sizes to the values of a role.
 * 
 * @extends pvc.visual.Axis
 */
def('pvc.visual.SizeAxis', pvc_Axis.extend({
    init: function(chart, type, index, keyArgs) {

        // prevent naked resolution of size axis
        keyArgs = def.set(keyArgs, 'byNaked', false);

        this.base(chart, type, index, keyArgs);
    },
    methods: /** @lends pvc.visual.SizeAxis# */{
        /** @override */scaleTreatsNullAs: function() { return 'min'; },
        /** @override */scaleUsesAbs:      function() { return this.option('UseAbs'); },

        setScaleRange: function(range) {
            var scale = this.scale;
            scale.min  = range.min;
            scale.max  = range.max;
            scale.size = range.max - range.min;

            scale.range(scale.min, scale.max);

            if(def.debug >= 4) def.log("Scale: " + def.describe(def.copyOwn(scale)));

            return this;
        },

        // CDF603 
        /* Specify a default FixedLength 
           Eg. used when imposing ratio through sliding window */
        setInitialLength: function(fixedLength){
            this.option.defaults({ 'FixedLength': fixedLength });
        },

    },
    options: {
        /* sizeAxisOriginIsZero
         * Force zero to be part of the domain of the scale to make
         * the scale "proportionally" comparable.
         */
        OriginIsZero: {
            resolve: '_resolveFull',
            cast:    Boolean,
            value:   false
        },

        FixedMin: {
            resolve: '_resolveFull',
            cast:    def.number.to
        },

        FixedMax: {
            resolve: '_resolveFull',
            cast:    def.number.to
        },

        FixedLength: {
            resolve: '_resolveFull',
            cast:    def.number.to
        },

        DomainAlign: {
            resolve: '_resolveFull',
            cast: pvc.parseDomainAlign,
            value: 'center'
        },

        UseAbs: {
            resolve: '_resolveFull',
            cast:    Boolean,
            value:   false
        }
    }
}));