
pvc.GridDockingPanel = pvc.BasePanel.extend({
    anchor: 'fill',
    
    /**
     * Implements a docking/grid layout variant.
     * <p>
     * The layout contains 5 target positions: top, bottom, left, right and center.
     * These are mapped to a 3x3 grid. The corner cells always remain empty.
     * In the center cell, panels are superimposed.
     * </p>
     * 
     * @override
     */
    _calcLayout: function(availableSize, layoutInfo){
        
        this.setSize(availableSize);
        
        if(!this._children) {
            return;
        }
        
        var margins = def.copy(this.margins);
        
        // An object we can mutate
        var remSize = {
            width:  Math.max(availableSize.width  - margins.left - margins.right,  0),
            height: Math.max(availableSize.height - margins.top  - margins.bottom, 0)
        };
        
        var aolMap = pvc.BasePanel.orthogonalLength,
            aoMap   = pvc.BasePanel.relativeAnchor;
        
        // Decreases available size and increases margins
        function updateSide(side, child) {
            var sideol = aolMap[side],
                olen   = child[sideol];
            
            margins[side]   += olen;
            remSize[sideol] -= olen;
        }
        
        function positionChildI(side, child) {
            child.setPosition(def.set({}, side, margins[side]));
        }
        
        function positionChild(side, child) {
            var sideo = aoMap[side];
            child.setPosition(def.set({}, side, margins[side], sideo, margins[sideo]));
        }
        
        var childKeyArgs = {force: true};
        
        function layoutChildI(child) {
            var a = child.anchor;
            if(a && a !== 'fill') {
                /*jshint expr:true */
                def.hasOwn(aoMap, a) || def.fail.operationInvalid("Unknown anchor value '{0}'", [a]);
                
                child.layout(new pvc.Size(remSize), childKeyArgs);
                
                // Only set the *anchor* position
                // The other orthogonal position is dependent on the size of the other non-fill children
                positionChildI(a, child);
                
                updateSide(a, child);
            }
        }
        
        function layoutChildII(child) {
            var a = child.anchor;
            if(a === 'fill') {
                child.layout(new pvc.Size(remSize), childKeyArgs);
                
                positionChild('left', child);
            } else if(a) {
                
                var ao = aoMap[a];
                positionChildI(ao, child);
                
                if(child.isAnchorTopOrBottom()) {
                    child.setWidth(remSize.width);
                } else {
                    child.setHeight(remSize.height);
                }
            }
        }
        
        this._children.forEach(layoutChildI );
        
        this._children.forEach(layoutChildII);
    }
});
