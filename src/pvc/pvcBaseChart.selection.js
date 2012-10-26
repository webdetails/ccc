pvc.BaseChart
.add({
    _updateSelectionSuspendCount: 0,
    _selectionNeedsUpdate: false,
    
    /** 
     * Clears any selections and, if necessary,
     * re-renders the parts of the chart that show selected marks.
     * 
     * @type undefined
     * @virtual 
     */
    clearSelections: function(){
        if(this.data.owner.clearSelected()) {
            this.updateSelections();
        }
        
        return this;
    },
    
    _suspendSelectionUpdate: function(){
        if(this === this.root) {
            this._updateSelectionSuspendCount++;
        } else {
            this.root._suspendSelectionUpdate();
        }
    },
    
    _resumeSelectionUpdate: function(){
        if(this === this.root) {
            if(this._updateSelectionSuspendCount > 0) {
                if(!(--this._updateSelectionSuspendCount)) {
                    if(this._selectionNeedsUpdate) {
                        this.updateSelections();
                    }
                }
            }
        } else {
            this._resumeSelectionUpdate();
        }
    },
    
    /** 
     * Re-renders the parts of the chart that show selected marks.
     * 
     * @type undefined
     * @virtual 
     */
    updateSelections: function(){
        if(this === this.root) {
            if(this._inUpdateSelections) {
                return this;
            }
            
            if(this._updateSelectionSuspendCount) {
                this._selectionNeedsUpdate = true;
                return this;
            }
            
            pvc.removeTipsyLegends();
            
            // Reentry control
            this._inUpdateSelections = true;
            try {
                // Fire action
                var action = this.options.selectionChangedAction;
                if(action){
                    var selections = this.data.selectedDatums();
                    action.call(this.basePanel._getContext(), selections);
                }
                
                /** Rendering afterwards allows the action to change the selection in between */
                this.basePanel.renderInteractive();
            } finally {
                this._inUpdateSelections   = false;
                this._selectionNeedsUpdate = false;
            }
        } else {
            this.root.updateSelections();
        }
        
        return this;
    },
    
    _onUserSelection: function(datums){
        if(!datums || !datums.length){
            return datums;
        }
        
        if(this === this.root) {
            // Fire action
            var action = this.options.userSelectionAction;
            if(action){
                return action.call(null, datums) || datums;
            }
            
            return datums;
        }
        
        return this.root._onUserSelection(datums);
    }
});

