/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_Axis:true */

def
.type('pvc.visual.NormalizedAxis', pvc_Axis)
.init(function(chart, type, index, keyArgs){

    // prevent naked resolution of the axis
    keyArgs = def.set(keyArgs, 'byNaked', false);
    
    this.base(chart, type, index, keyArgs);
})
.add(/** @lends pvc.visual.NormalizedAxis# */{
    /** @override */
    _buildOptionId: function() {
        return this.id + "Axis";
    },

    /** @override */scaleTreatsNullAs:  function() { return 'zero'; },
    /** @override */scaleUsesAbs:       function() { return this.option('UseAbs'); },
    /** @override */scaleSumNormalized: def.retTrue,

    setScaleRange: function(range){
        var scale = this.scale;
        scale.min  = range.min;
        scale.max  = range.max;
        scale.size = range.max - range.min;
        
        scale.range(scale.min, scale.max);
        
        if(pvc.debug >= 4){
            pvc.log("Scale: " + pvc.stringify(def.copyOwn(scale)));
        }
        
        return this;
    },

    /** @override */
    _getOptionsDefinition: function() { return normAxis_optionsDef; }
});

/*global axis_optionsDef:true */
var normAxis_optionsDef = def.create(axis_optionsDef, {
    // Not needed. Yet has the benefit of locking the zero min
    // (although that's not needed as well, cause FixeMin/Max are not defined).
    // But JIC.
    OriginIsZero: {
        value:   true
    },

    // Whether to apply abs to each datum value in a category before summing.
    // **The sum of each category is then always abs'ed.**
    UseAbs: {
        resolve: '_resolveFull',
        cast:    Boolean,
        value:   false
    }
});