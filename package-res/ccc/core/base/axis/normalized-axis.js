/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_Axis:true */

def
.type('pvc.visual.NormalizedAxis', pvc_Axis)
.init(function(chart, type, index, keyArgs) {

    // prevent naked resolution of the axis
    keyArgs = def.set(keyArgs, 'byNaked', false);
    
    this.base(chart, type, index, keyArgs);
})
.add(/** @lends pvc.visual.NormalizedAxis# */{
    /** @override */scaleTreatsNullAs:  function() { return 'zero'; },
    /** @override */scaleUsesAbs:       def.retTrue,
    /** @override */scaleSumNormalized: def.retTrue,

    setScaleRange: function(range) {
        var scale = this.scale;
        scale.min  = range.min;
        scale.max  = range.max;
        scale.size = range.max - range.min;
        
        scale.range(scale.min, scale.max);
        
        if(pvc.debug >= 4) pvc.log("Scale: " + pvc.stringify(def.copyOwn(scale)));
        
        return this;
    },

    /** @override */
    _getOptionsDefinition: function() { return normAxis_optionsDef; }
});

/*global axis_optionsDef:true */
var normAxis_optionsDef = def.create(axis_optionsDef, {
    // Locks the min to 0.
    OriginIsZero: {
        value:   true
    }
});