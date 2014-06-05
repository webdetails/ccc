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
def
.type('pvc.visual.SizeAxis', pvc_Axis)
.init(function(chart, type, index, keyArgs) {
    
    // prevent naked resolution of size axis
    keyArgs = def.set(keyArgs, 'byNaked', false);
    
    this.base(chart, type, index, keyArgs);
})
.add(/** @lends pvc.visual.SizeAxis# */{
    /** @override */scaleTreatsNullAs: function() { return 'min'; },
    /** @override */scaleUsesAbs:      function() { return this.option('UseAbs'); },
    
    setScaleRange: function(range) {
        var scale = this.scale;
        scale.min  = range.min;
        scale.max  = range.max;
        scale.size = range.max - range.min;
        
        scale.range(scale.min, scale.max);
        
        if(pvc.debug >= 4) pvc.log("Scale: " + pvc.stringify(def.copyOwn(scale)));
        
        return this;
    },
    
    _getOptionsDefinition: function() { return sizeAxis_optionsDef; }
});

/*global axis_optionsDef:true */
var sizeAxis_optionsDef = def.create(axis_optionsDef, {
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
        cast:    pvc.castNumber
    },
    
    FixedMax: {
        resolve: '_resolveFull',
        cast:    pvc.castNumber
    },
    
    UseAbs: {
        resolve: '_resolveFull',
        cast:    Boolean,
        value:   false
    }
});