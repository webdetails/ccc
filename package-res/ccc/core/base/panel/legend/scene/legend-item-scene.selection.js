/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @name pvc.visual.legend.LegendItemSceneSelection
 * @class A selection behavior mixin for the legend item scene.
 * Represents and controls the selected state of its datums.
 * 
 * @extends pvc.visual.legend.LegendItemScene
 */
def
.type('pvc.visual.legend.LegendItemSceneSelection')
.add(/** @lends pvc.visual.legend.LegendItemSceneSelection# */{
    /**
     * Returns <c>true</c> if there are no selected datums in the owner data, 
     * or if at least one datum of the scene's {@link #datums} is selected.
     * @type boolean
     */
    isOn: function() {
        var source = (this.group || this.datum);
        return !source.owner.selectedCount() || this.isSelected();
    },
    
    /**
     * Returns true if the chart is selectable by clicking. 
     * @type boolean
     */
    executable: function() { return this.chart().selectableByClick(); },
    
    /**
     * Toggles the selected state of the datums present in this scene
     * and updates the chart if necessary.
     */
    execute: function() {
        var datums = this.datums().array();
        if(datums.length) {
            var chart = this.chart();
            chart._updatingSelections(function() {
                datums = chart._onUserSelection(datums);
                if(datums && datums.length) cdo.Data.toggleSelected(datums, /*any*/true);
            });
        }
    }
});
