/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

pvc.BaseChart
.add({
    _updateSelectionSuspendCount: 0,
    _lastSelectedDatums: null,
    _userSelectionMax: 0,

    /**
     * Clears any selecting and, if necessary,
     * re-renders the parts of the chart that show selected marks.
     *
     * @type undefined
     * @virtual
     */
    clearSelections: function() {
        if(this.data.owner.clearSelected()) { this.updateSelections(); }
        return this;
    },

    _updatingSelections: function(method, context, keyArgs) {
        this._suspendSelectionUpdate();

        try     { method.call(context || this);  }
        finally { this._resumeSelectionUpdate(keyArgs); }
    },

    _suspendSelectionUpdate: function() {
        if(this === this.root) { this._updateSelectionSuspendCount++; }
        else                   { this.root._suspendSelectionUpdate(); }
    },

    _resumeSelectionUpdate: function(keyArgs) {
        if(this === this.root) {
            if(this._updateSelectionSuspendCount > 0) {
                if(!(--this._updateSelectionSuspendCount)) { this.updateSelections(keyArgs); }
            }
        } else {
            this.root._resumeSelectionUpdate(keyArgs);
        }
    },

    /**
     * Re-renders the parts of the chart that show marks.
     *
     * @type undefined
     * @virtual
     */
    updateSelections: function(keyArgs) {
        if(this === this.root) {
            if(this._inUpdateSelections || this._updateSelectionSuspendCount) { return this; }

            var selectedChangedDatumMap = this._processSelectionChange(keyArgs);
            if(!selectedChangedDatumMap) { return this; }

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
                    var selectedDatums = this.data.selectedDatums();
                    var selectedChangedDatums = selectedChangedDatumMap.values();
                    action.call(
                        this.basePanel.context(),
                        selectedDatums,
                        selectedChangedDatums);
                }

                // Rendering afterwards allows the action to change the selection in between
                if(def.get(keyArgs, 'render', true)) {
                    this.useTextMeasureCache(function() { this.basePanel.renderInteractive(); }, this);
                }
            } finally {
                this._inUpdateSelections = false;
            }
        } else {
            this.root.updateSelections(keyArgs);
        }

        return this;
    },

    _processSelectionChange: function(keyArgs) {
        // Caused by NoDataException ?
        if(!this.data) { return; }

        // Capture currently selected datums
        // Calculate the ones that changed.
        var nowSelectedDatums  = this.data.selectedDatumMap();
        var lastSelectedDatums = this._lastSelectedDatums;

        // First, apply userSelectionMax rule
        if(def.get(keyArgs, 'isUserSelection')) {
            this._limitUserSelectedDatums(nowSelectedDatums, lastSelectedDatums);
        }


        if(!lastSelectedDatums) {
            if(!nowSelectedDatums.count) { return; }

            selectedChangedDatums = nowSelectedDatums.clone();
        } else {
            selectedChangedDatums = lastSelectedDatums.symmetricDifference(nowSelectedDatums);

            if(!selectedChangedDatums.count) { return; }
        }

        this._lastSelectedDatums = nowSelectedDatums;

        return selectedChangedDatums;
    },

    _limitUserSelectedDatums: function(nowSelectedDatums, lastSelectedDatums) {
        var E;
        var selectionMax = this._userSelectionMax;
        if(selectionMax > 0 && (E = nowSelectedDatums.count - selectionMax) > 0) {

            var deselectDatum = function(nowDatum) {
                // also removes from the real nowSelectedDatums
                // but we need to remove explicitly from this clone of it
                nowDatum.setSelected(false);
                nowSelectedDatums.rem(nowDatum.id);
                E--;
            };

            var wasNotSelected = function(nowDatum) {
                return !lastSelectedDatums.has(nowDatum.id);
            };

            // There are more datums selected than allowed.
            // Start de-selecting from the ones that were not selected the previous time.
            var q = def.query(nowSelectedDatums.values());

            // it is discussable if in replace mode we should even consider the lastSelectedDatums
            if(lastSelectedDatums) { q = q.where(wasNotSelected); }

            q.take(E).each(deselectDatum);
        }
    },

    _onUserSelection: function(datums) {
        if(!datums || !datums.length) { return datums; }

        if(this === this.root) {
            // Limit selection based on
            // Fire action
            var action = this.options.userSelectionAction;
            return action ?
                   (action.call(this.basePanel.context(), datums) || datums) :
                   datums;
        }

        return this.root._onUserSelection(datums);
    }
});

