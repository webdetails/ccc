
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
    _calcLayout: function(clientSize, layoutInfo, referenceSize){
        
        if(!this._children) {
            return;
        }
        
        // Objects we can mutate
        var margins = new pvc.Sides(0);
        var remSize = def.copy(clientSize);
        
        var aolMap = pvc.BasePanel.orthogonalLength,
            aoMap  = pvc.BasePanel.relativeAnchor;
        
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
                
                child.layout(new pvc.Size(remSize), clientSize, childKeyArgs);
                
                // Only set the *anchor* position
                // The other orthogonal position is dependent on the size of the other non-fill children
                positionChildI(a, child);
                
                updateSide(a, child);
            }
        }
        
        function layoutChildII(child) {
            var a = child.anchor;
            if(a === 'fill') {
                child.layout(new pvc.Size(remSize), clientSize, childKeyArgs);
                
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
        
        return clientSize;
    }
});
