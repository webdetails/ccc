/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/
def('pvc.visual.SunburstSlice', pvc.visual.Sign.extend({
    init: function(panel, protoMark, keyArgs) {
        var pvMark = protoMark.add(pv.Wedge);
        keyArgs = def.setDefaults(keyArgs, 'freeColor', false);
        this.base(panel, pvMark, keyArgs);

        this._bindProperty('lineWidth', 'strokeWidth');
    },
    properties: ['strokeWidth'],
    methods: /** @lends pvc.visual.SunburstSlice# */{
        defaultStrokeWidth: def.fun.constant(0.5),

        interactiveStrokeWidth: function(scene, strokeWidth) {
            return this.showsActivity() && scene.isActiveDescendantOrSelf()
                ? Math.max(1, strokeWidth) * 2
                : strokeWidth;
        },

        defaultColor: function(scene, type) {
            return scene.color;
        },

        normalColor: function(scene, color, type) {
            return color && type === 'stroke'
                ? color.darker()// 'white'
                : color;
        },

        // @override
        interactiveColor: function(scene, color, type) {
            if(this.showsActivity()) {
                if(type === 'stroke') {
                    if(scene.isActiveDescendantOrSelf()) return color.brighter(2).alpha(0.7);
                } else {
                    if(scene.isActive) return color.brighter(0.2).alpha(0.8);
                }
            }
            if(this.mayShowNotAmongSelected(scene)) return this.dimColor(color, type);

            // Showing normal, after all.
            return this.normalColor(scene, color, type);
        }
    }
}));
