/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @name pvc.visual.legend.LegendItemSceneVisibility
 * 
 * @class A visibility behavior mixin for a legend item scene.
 * Represents and controls the visible state of its datums.
 * 
 * @extends pvc.visual.legend.LegendItemScene
 */
def
.type('pvc.visual.legend.LegendItemSceneVisibility')
.add(/** @lends pvc.visual.legend.LegendItemSceneVisibility# */{
    /**
     * Returns <c>true</c> if at least one non-null datum of the scene's {@link #datums} is visible.
     * @type boolean
     */
    isOn: function() {
        // isOn can be cached cause datums' visible changes require re-rendering everything.
        var isOn = this._isOn;
        if(isOn == null)
            // If null datums were included, as they're always visible,
            // the existence of a single null datum would result in always being true.
            isOn = this._isOn = this.datums().any(function(datum) {
                return !datum.isNull && datum.isVisible;
            });
        return isOn;
    },

    /**
     * Returns <c>true</c> if the scene's {@link #datums}
     * contains at least one non-trend datum and
     * if at least one other sibling scene is on.
     *
     * Trend series cannot be set to invisible,
     * cause they are re-created each time that visible changes.
     *
     * @type boolean
     */
    executable: function() {
        return def.lazy(this, '_execble', this._calcExecutable, this);
    },

    _calcExecutable: function() {
        if(this._executableApriori()) {
            // Can be executable as long as there is at least one
            //  other apriori-executable item that is On.
            // Otherwise, when executed, all datums could/would become invisible,
            //  and we want to prevent that,
            //  when by direct user action.
            var groups = this.root.childNodes,
                g = -1,
                G = groups.length,
                group;
            while(++g < G) {
                if((group = groups[g]).clickMode === 'togglevisible') {
                    var items = group.childNodes,
                        i = -1,
                        I = items.length,
                        item;
                    while(++i < I)
                        if((item = items[i]) !== this &&
                           item._executableApriori() &&
                           item.isOn())
                            return true;
                }
            }
        }
        return false;
    },

    _executableApriori: function() {
        return def.lazy(this, '_execApriori', this._calcExecutableApriori, this);
    },

    _calcExecutableApriori: function() {
        return this.datums().any(function(d) { return !d.isTrend; });
    },
    
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
