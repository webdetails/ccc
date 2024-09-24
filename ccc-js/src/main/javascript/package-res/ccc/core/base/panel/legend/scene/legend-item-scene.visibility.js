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
        if(isOn == null) {
            // If null datums were included, as they're always visible,
            // the existence of a single null datum would result in always being true.
            isOn = this._isOn = this.datums().any(function(datum) {
                return !datum.isNull && datum.isVisible;
            });
        }

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
            //  other a-priori-executable item that is On.
            // Otherwise, when executed, all datums could/would become invisible,
            //  and we want to prevent that,
            //  when by direct user action.
            // This works as long as other items contain different datums.
            // When discriminator dimensions are used, two items can contain exactly the same datums.
            // Hiding the datums of one hides the datums of the other,
            //  and the other scene may be the last ON one...
            // Other more complex scenarios can also be devised,
            //  like one in which the datums of a scene are the union of the datums of
            //  all of the other scenes.
            //  Hiding the datums of the former, causes hiding all of the latter.
            // So, in general:
            //  If the datums of this scene are hidden, will all of the other scenes be hidden as well?
            //  Are all other scenes's datums a subset of this scene's datums?
            var groupScenes = this.root.childNodes;
            var g = -1;
            var G = groupScenes.length;
            var groupScene;
            while(++g < G) {
                if((groupScene = groupScenes[g]).clickMode === 'togglevisible') {

                    var items = groupScene.childNodes;
                    var i = -1;
                    var I = items.length;
                    var item;

                    while(++i < I) {
                        if((item = items[i]) !== this &&
                           item._executableApriori() &&
                           item._hasAnyNonNullVisibleDatumsNotIn(this)) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    },

    /**
     * Indicates if this scene contains at least one non-null, visible datum
     * that another given scene does not contain.
     *
     * @param {!pvc.visual.Scene} otherScene - The other scene.
     * @return {boolean} `true` if yes; `false`, otherwise.
     */
    _hasAnyNonNullVisibleDatumsNotIn: function(otherScene) {

        var group = otherScene.group;

        // If null datums were included, as they're always visible,
        // the existence of a single null datum would result in always being true.
        return this.datums().any(function(datum) {
            return !datum.isNull && datum.isVisible && !group.contains(datum);
        });
    },

    /**
     * The scene is executable a priori if it contains at least one datum which is not a trend datum.
     * Trend-only scenes, are not executable.
     *
     * @return {boolean} `true` if executable a priori; `false`, otherwise.
     */
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
        if(cdo.Data.toggleVisible(this.datums())) {
            // This is so that overriding code that runs after
            // calling this.base gets actual isOn, etc, results.
            this.clearCachedState();
            this.chart().render(true, true, false);
        }
    },

    clearCachedState: function() {
        delete this._execble;
        delete this._isOn;
        delete this._execApriori;
    }
});
