/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @name pvc.visual.legend.BulletItemSceneVisibility
 * 
 * @class A visibility behavior mixin for a legend bullet item scene. 
 * Represents and controls the visible state of its datums.
 * 
 * @extends pvc.visual.legend.BulletItemScene
 */
def
.type('pvc.visual.legend.BulletItemSceneVisibility')
.add(/** @lends pvc.visual.legend.BulletItemSceneVisibility# */{
    /**
     * Returns <c>true</c> if at least one non-null datum of the scene's {@link #datums} is visible.
     * @type boolean
     */
    isOn: function() {
        // If null datums were included, as they're always visible,
        // the existence of a single null datum would result in always being true.
        return this.datums().any(function(datum) { return !datum.isNull && datum.isVisible; });
    },
    
    executable: def.fun.constant(true),
    
    /**
     * Toggles the visible state of the datums present in this scene
     * and forces a re-render of the chart (without reloading data).
     * @override
     */
    execute: function() {
        // Re-render chart
        if(cdo.Data.toggleVisible(this.datums())) this.chart().render(true, true, false);
    }
});
