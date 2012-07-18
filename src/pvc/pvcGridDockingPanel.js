
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
            var sidePos;
            if(side === 'fill'){
                side = 'left';
                sidePos = margins.left + remSize.width / 2 - (child.width / 2);
            } else {
                sidePos = margins[side];
            }
            
            child.setPosition(def.set({}, side, sidePos));
        }
        
        function positionChildII(child, align) {
            var sideo;
            if(align === 'fill'){
                align = 'middle';
            }
            
            var sideOPos;
            switch(align){
                case 'top':
                case 'bottom':
                case 'left':
                case 'right':
                    sideo = align;
                    sideOPos = margins[sideo];
                    break;
                
                case 'middle':
                    sideo    = 'bottom';
                    sideOPos = margins.bottom + (remSize.height / 2) - (child.height / 2);
                    break;
                    
                case 'center':
                    sideo    = 'left';
                    sideOPos = margins.left + remSize.width / 2 - (child.width / 2);
                    break;
            }
            
            child.setPosition(def.set({}, sideo, sideOPos));
        }
        
        function layoutChildI(child) {
            var a = child.anchor;
            if(a && a !== 'fill') {
                /*jshint expr:true */
                def.hasOwn(aoMap, a) || def.fail.operationInvalid("Unknown anchor value '{0}'", [a]);
                
                child.layout(new pvc.Size(remSize), childReferenceSize, childKeyArgs);
                if(child.isVisible){
                    // Only set the *anchor* position
                    // The other orthogonal position is dependent on the size of the other non-fill children
                    positionChildI(a, child);
                    
                    updateSide(a, child);
                }
            }
        }
        
        function layoutChildII(child) {
            var a = child.anchor;
            if(a === 'fill') {
                child.layout(new pvc.Size(remSize), childReferenceSize, childKeyArgs);
                if(child.isVisible){
                    positionChildI (a, child);
                    positionChildII(child, a);
                }
            } else if(a) {
                if(child.isVisible){
                    var al  = alMap[a];
                    var aol = aolMap[a];
                    var length      = remSize[al];
                    var olength     = child[aol];
                    var childSizeII = new pvc.Size(def.set({}, al, length, aol, olength));
                    
                    child.layout(childSizeII, childReferenceSize, childKeyArgs);
                    if(child.isVisible){
                        var align = pvc.parseAlign(a, child.align);
                        
                        positionChildII(child, align);
                    }
                }
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
