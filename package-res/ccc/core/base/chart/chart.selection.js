/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

pvc.BaseChart
.add({
    _updateSelectionSuspendCount: 0,
    _lastSelectedDatums: null,

    /**
     * Clears any selections and, if necessary,
     * re-renders the parts of the chart that show selected marks.
     *
     * @type undefined
     * @virtual
     */
    clearSelections: function() {
        if(this.data.owner.clearSelected()) this.updateSelections();
        return this;
    },

    _updatingSelections: function(method, context) {
        this._suspendSelectionUpdate();

        try     { method.call(context || this);  }
        finally { this._resumeSelectionUpdate(); }
    },

    _suspendSelectionUpdate: function() {
        if(this === this.root) this._updateSelectionSuspendCount++;
        else                   this.root._suspendSelectionUpdate();
    },

    _resumeSelectionUpdate: function() {
        if(this === this.root) {
            if(this._updateSelectionSuspendCount > 0 && !(--this._updateSelectionSuspendCount))
                this.updateSelections();
        } else {
            this.root._resumeSelectionUpdate();
        }
    },

    /**
     * Re-renders the parts of a chart that react to interaction.
     * @returns {pvc.visual.Chart} The chart instance.
     */
    renderInteractive: function() {
        this.useTextMeasureCache(function() { 
            this.basePanel.renderInteractive(); 
        }, this);
        return this;
    },

    /**
     * Resizes and re-renders a chart given its new dimensions.
     * @param {number} [width]  The new width of the chart. Ignored when undefined.
     * @param {number} [height] The new height of the chart. Ignored when undefined.
     * @returns {pvc.visual.Chart} The chart instance.
     */
    renderResize: function(width, height) {
        if(width  !== undefined) this.options.width  = width;
        if(height !== undefined) this.options.height = height;

        return this.render(true, true, false);
    },

    /**
     * Processes any changed selections and, optionally,
     * re-renders the parts of the chart that show marks.
     *
     * @param {object} [keyArgs] Optional keyword arguments.
     * @param {boolean} [keyArgs.render=true] Indicates if a render should be performed after processing
     * the changed selections.
     * @type undefined
     * @virtual
     */
    updateSelections: function(keyArgs) {
        if(this === this.root) {
            if(this._inUpdateSelections || this._updateSelectionSuspendCount) return this;

            var selectedChangedDatumMap = this._calcSelectedChangedDatums();
            if(!selectedChangedDatumMap) return this;

            pvc.removeTipsyLegends();

            // Reentry control
            this._inUpdateSelections = true;
            try {
                // Fire action
                var action = this.options.selectionChangedAction;
                if(action) {
                    // Can change selection further...although it's probably
                    // better to do that in userSelectionAction, called
                    // before chosen datums' selected state is actually affected.
                    var selectedDatums = this.data.selectedDatums(),
                        selectedChangedDatums = selectedChangedDatumMap.values();
                    action.call(
                        this.basePanel.context(),
                        selectedDatums,
                        selectedChangedDatums);
                }

                // Rendering afterwards allows the action to change the selection in between
                if(def.get(keyArgs, 'render', true))
                    this.useTextMeasureCache(function() { this.basePanel.renderInteractive(); }, this);
            } finally {
                this._inUpdateSelections = false;
            }
        } else {
            this.root.updateSelections();
        }

        return this;
    },

    _calcSelectedChangedDatums: function() {
        // Capture currently selected datums
        // Calculate the ones that changed.

        // Caused by NoDataException ?
        if(!this.data) return;

        var selectedChangedDatums,
            nowSelectedDatums  = this.data.selectedDatumMap(),
            lastSelectedDatums = this._lastSelectedDatums;
        if(!lastSelectedDatums) {
            if(!nowSelectedDatums.count) return;

            selectedChangedDatums = nowSelectedDatums.clone();
        } else {
            selectedChangedDatums = lastSelectedDatums.symmetricDifference(nowSelectedDatums);

            if(!selectedChangedDatums.count) return;
        }

        this._lastSelectedDatums = nowSelectedDatums;

        return selectedChangedDatums;
    },

    _onUserSelection: function(datums) {
        if(!datums || !datums.length) return datums;

        if(this === this.root) {
            // Fire action
            var action = this.options.userSelectionAction;
            return action ?
                   (action.call(this.basePanel.context(), datums) || datums) :
                   datums;
        }

        return this.root._onUserSelection(datums);
    }
});

