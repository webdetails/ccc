
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
    _calcLayout: function(layoutInfo){
        
        if(!this._children) {
            return;
        }
        
        // Objects we can mutate
        var margins = new pvc.Sides(0);
        var remSize = def.copyOwn(layoutInfo.clientSize);
        
        var aolMap = pvc.BasePanel.orthogonalLength,
            aoMap  = pvc.BasePanel.relativeAnchor,
            alMap  = pvc.BasePanel.parallelLength;
        
        var childKeyArgs = {force: true};
        var childReferenceSize = layoutInfo.clientSize;
        
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
        
        function layoutChildI(child) {
            var a = child.anchor;
            if(a && a !== 'fill') {
                /*jshint expr:true */
                def.hasOwn(aoMap, a) || def.fail.operationInvalid("Unknown anchor value '{0}'", [a]);
                
                child.layout(new pvc.Size(remSize), childReferenceSize, childKeyArgs);
                
                // Only set the *anchor* position
                // The other orthogonal position is dependent on the size of the other non-fill children
                positionChildI(a, child);
                
                updateSide(a, child);
            }
        }
        
        function layoutChildII(child) {
            var a = child.anchor;
            if(a === 'fill') {
                child.layout(new pvc.Size(remSize), childReferenceSize, childKeyArgs);
                
                positionChild('left', child);
            } else if(a) {
                var ao  = aoMap[a];
                var al  = alMap[a];
                var aol = aolMap[a];
                var length      = child[al];
                var olength     = remSize[aol];
                var childSizeII = new pvc.Size(def.set({}, al, length, aol, olength));
                
                child.layout(childSizeII, childReferenceSize, childKeyArgs);
                
                positionChildI(ao, child);
            }
        }
        
        this._children.forEach(layoutChildI );
        
        // remSize now contains the center cell and is not changed in phase II
        // fill children are layed out in that cell
        // other non-fill children already layed out in phase I
        // "relayout" once now that the other (orthogonal) length is now determined.
        
        this._children.forEach(layoutChildII);
        
        // Consume all available client space, so no need to return anything
    }
});
