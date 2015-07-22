/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_Axis:true */

def('pvc.visual.NormalizedAxis', pvc_Axis.extend({
    init: function(chart, type, index, keyArgs) {

        // prevent naked resolution of the axis
        keyArgs = def.set(keyArgs, 'byNaked', false);

        this.base(chart, type, index, keyArgs);
    },
    methods: /** @lends pvc.visual.NormalizedAxis# */{
        /** @override */scaleTreatsNullAs:  function() { return 'zero'; },
        /** @override */scaleUsesAbs:       def.retTrue,
        /** @override */scaleSumNormalized: def.retTrue,

        setScaleRange: function(range) {
            var scale = this.scale;
            scale.min  = range.min;
            scale.max  = range.max;
            scale.size = range.max - range.min;

            scale.range(scale.min, scale.max);

            if(def.debug >= 4) def.log("Scale: " + def.describe(def.copyOwn(scale)));

            return this;
        }
    },
    options: {
        // Locks the min to 0.
        OriginIsZero: {
            value:   true
        },
    }
}));