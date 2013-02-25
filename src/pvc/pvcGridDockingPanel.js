
def
.type('pvc.GridDockingPanel', pvc.BasePanel)
.add({
    anchor: 'fill',
    
    /**
     * Implements a docking/grid layout variant.
     * <p>
     * The layout contains 5 target positions: top, bottom, left, right and center.
     * These are mapped to a 3x3 grid. The corner cells always remain empty.
     * In the center cell, panels are superimposed.
     * </p>
     * <p>
     * Additionally, panels' paddings are shared:
     * Left and right paddings are shared by the top, center and bottom panels.
     * Top and bottom paddings are shared by the left, center and right panels.
     * </p>
     * <p>
     * Child panel's can inform of existing overflowPaddings - 
     * resulting of things that are ok to overflow, 
     * as long as they don't leave the parent panel's space, 
     * and that the parent panel itself tries to reserve space for it or 
     * ensure it is in a free area.
     * </p>
     * <p>
     * The empty corner cells of the grid layout can absorb some of the overflow 
     * content from non-fill child panels. 
     * If, for example, a child panel is placed at the 'left' cell and it
     * overflows in 'top', that overflow can be partly absorbed by 
     * the top-left corner cell, as long as there's a panel in the top cell that
     * imposes that much height. 
     * </p>
     * <p>
     * If the corner space is not enough to absorb the overflow paddings
     * 
     * </p>
     * 
     * @override
     */
    _calcLayout: function(layoutInfo){
        var me = this;
        
        if(!me._children) {
            return;
        }

        var useLog = pvc.debug >= 5;
        
        // Objects we can mutate
        
        // These are not this panel's margins, but the current offsets where children are placed
        var margins  = new pvc.Sides(0);
        
        // Real paddings
        var overflowPaddings = new pvc.Sides(layoutInfo.paddings);
        var paddings = new pvc.Sides(0);
        var remSize = def.copyOwn(layoutInfo.clientSize);
        var aolMap = pvc.BasePanel.orthogonalLength;
        var aoMap  = pvc.BasePanel.relativeAnchor;
        var alMap  = pvc.BasePanel.parallelLength;
        
        var childKeyArgs = {
                force: true,
                referenceSize: layoutInfo.clientSize
            };
        
        var fillChildren = [];
        var sideChildren = [];
        var sideChildrenInfo = [];
        
        // loop detection
        var paddingHistory = {}; 

        var LoopDetected = 1;
        var NormalPaddingsChanged = 2;
        var OverflowPaddingsChanged = 4;
        var FillSizeChanged = 8;
        
        var emptyNewPaddings = new pvc.Sides(); // used below in place of null requestPaddings
        var isDisasterRecovery = false;

        if(useLog){ me._group("CCC GRID LAYOUT clientSize = " + pvc.stringify(remSize)); }
        try{
            // PHASE 0 - Initialization
            //
            // Splits children in two groups: FILL and SIDE, according to its anchor.
            // Children explicitly not requiring layout are excluded (!child.anchor).
            //
            // For FILL children, finds the maximum of the resolved paddings.
            // These paddings will be the minimum that will result from this layout.
            /*global console:true*/
            this._children.forEach(initChild);
            
            // PHASE 1 - "MARGINS" are imposed by SIDE children
            //
            // Lays out non-fill children receiving each, the remaining space as clientSize.
            //
            // Each adds its orthogonal length to the margin side where it is anchored.
            // The normal length is only correctly known after all non-fill
            // children have been laid out once.
            //
            // As such the child is only positioned on the anchor coordinate.
            // The orthogonal anchor coordinate is only set on the second phase.
            //
            // SIDE children may change paddings as well.
            if(useLog){ me._group("Phase 1 - Determine MARGINS and FILL SIZE from SIDE panels"); }
            try{
                sideChildren.forEach(function(child, index) {
                    changes |= layoutChild1Side(child, index);
                });
                
                // Reset margins
                margins = new pvc.Sides(0);
                margins = new pvc.Sides(0);
                
                // Round 2
                var changes = 0;
                overflowPaddings = new pvc.Sides(layoutInfo.paddings);
                sideChildren.forEach(function(child, index) {
                    changes |= layoutChild1Side(child, index);
                });
                
                // It's OK to change anything in this phase.
                // Yet, we want to handle overflow paddings
                // immediately, because these require
                // re-layout of the whole panel; the sooner, the better.
                if((changes & OverflowPaddingsChanged) !== 0){
                    layoutInfo.requestPaddings = overflowPaddings;
                    return; // repeat
                }
            } finally {
                // -> remSize now contains the size of the CENTER cell and is not changed any more
                
                if(useLog){
                    me._groupEnd();
                    me._log("Final FILL margins = " + pvc.stringify(margins));
                    me._log("Final FILL border size = " + pvc.stringify(remSize));
                }
            }

            // PHASE 2 - Relayout each SIDE child with its final orthogonal length
            // PHASE 3 - Layout FILL children
            //
            // Repeat 2 and 3 while paddings changed
            if(useLog){ me._group("Phase 2 - Determine COMMON PADDINGS"); }
            try{
                doMaxTimes(9, layoutCycle);
            } finally {
                if(useLog){
                    me._groupEnd();
                    me._log("Final FILL clientSize = " + pvc.stringify({width: (remSize.width - paddings.left - paddings.right), height: (remSize.height - paddings.top - paddings.bottom)}));
                    me._log("Final COMMON paddings = " + pvc.stringify(paddings));
                }
            }

            layoutInfo.gridMargins  = new pvc.Sides(margins );
            layoutInfo.gridPaddings = new pvc.Sides(paddings);
            layoutInfo.gridSize     = new pvc.Size (remSize );

            // All available client space is consumed.
            // As such, there's no need to return anything.
            // return;
        } finally {
            if(useLog){ me._groupEnd(); }
        }

        // --------
        
        function layoutCycle(remTimes, iteration) {
            if(useLog){ me._group("LayoutCycle " + (isDisasterRecovery ? "- Disaster MODE" : ("#" + (iteration + 1)))); }
            try{
                var index, count;
                var canChange = !isDisasterRecovery && (remTimes > 0); // layoutInfo.canChange !== false && 
                var changes;
                var ownPaddingsChanged = false;
                var breakAndRepeat;

                index = 0;
                count = sideChildren.length;
                while(index < count) {
                    if(useLog){ me._group("SIDE Child #" + (index + 1)); }
                    try{
                        changes = layoutChild2Side(sideChildren[index], index, canChange);
                        if(!isDisasterRecovery && changes) {
                            breakAndRepeat = false;
                            if((changes & OverflowPaddingsChanged) !== 0){
                                // Don't stop right away cause there might be
                                // other overflow paddings requests,
                                // of other side childs.
                                // Translate children overflow paddings in
                                // own paddings.
                                if(useLog){ me._log("SIDE Child #" + (index + 1) + " changed overflow paddings"); }
                                if(!ownPaddingsChanged) {
                                    ownPaddingsChanged = true;
                                    // If others change we don't do nothing.
                                    // The previous assignment remains.
                                    // It's layoutInfo.paddings that is changed, internally.
                                    layoutInfo.requestPaddings = overflowPaddings;
                                }
                            }

                            if((changes & NormalPaddingsChanged) !== 0){
                                if(remTimes > 0){
                                    if(useLog){ me._log("SIDE Child #" + (index + 1) + " changed normal paddings"); }
                                    breakAndRepeat = true;
                                } else if(pvc.debug >= 2){
                                    me._warn("SIDE Child #" + (index + 1) + " changed paddings but no more iterations possible.");
                                }
                            }
                            
                            if((changes & LoopDetected) !== 0){
                                // Oh no...
                                isDisasterRecovery = true;
                                
                                layoutCycle(0);
                                
                                return false; // stop;
                            }

                            if(breakAndRepeat) { 
                                return true;
                            }
                        }
                    } finally {
                        if(useLog){ me._groupEnd(); }
                    }
                    index++;
                }
                
                if(ownPaddingsChanged){
                    if(useLog){ me._log("Restarting due to overflowPaddings change"); }
                    return false; // stop;
                }

                index = 0;
                count = fillChildren.length;
                while(index < count){
                    if(useLog){ me._group("FILL Child #" + (index + 1)); }
                    try{
                        changes = layoutChildFill(fillChildren[index], canChange);
                        if(!isDisasterRecovery && changes){
                            breakAndRepeat = false;

                            if((changes & NormalPaddingsChanged) !== 0){
                                if(remTimes > 0){
                                    if(pvc.debug >= 5){
                                        me._log("FILL Child #" + (index + 1) + " increased paddings");
                                    }
                                    breakAndRepeat = true; // repeat
                                } else if(pvc.debug >= 2){
                                    me._warn("FILL Child #" + (index + 1) + " increased paddings but no more iterations possible.");
                                }
                            }

                            if((changes & LoopDetected) !== 0){
                                // Oh no...
                                isDisasterRecovery = true;
                                layoutCycle(0);
                                return false; // stop;
                            }

                            if(breakAndRepeat) {
                                return true;
                            }
                        }
                    } finally {
                        if(useLog){ me._groupEnd(); }
                    }
                    
                    index++;
                }

                return false; // stop
            } finally {
                if(useLog){ me._groupEnd(); }
            }
        }
        
        function doMaxTimes(maxTimes, fun){
            var index = 0;
            while(maxTimes--){
                // remTimes = maxTimes
                if(fun(maxTimes, index) === false){
                    return true;
                }
                index++;
            }
            
            return false;
        }
        
        function initChild(child) {
            var a = child.anchor;
            if(a){
                if(a === 'fill') {
                    fillChildren.push(child);
                    
                    var childPaddings = child.paddings.resolve(childKeyArgs.referenceSize);
                    
                    // After the op. it's not a pvc.Side anymore, just an object with same named properties.
                    paddings = pvc.Sides.resolvedMax(paddings, childPaddings);
                } else {
                    /*jshint expr:true */
                    def.hasOwn(aoMap, a) || def.fail.operationInvalid("Unknown anchor value '{0}'", [a]);
                    
                    sideChildren.push(child);
                    sideChildrenInfo.push({width: 0, height: 0});
                }
            }
        }
        
        function layoutChild1Side(child, index) {
            if(useLog){ me._group("SIDE Child #" + (index + 1)); }
            try{
                var changes = 0;

                var a = child.anchor;
                var aol  = aolMap[a];
                
                // current aolength, already accounted in remSize
                var olen = sideChildrenInfo[index][aol];
                
                childKeyArgs.paddings = filterAnchorPaddings(a, paddings);

                if(olen){ // reverse effect of previous updateSide
                    remSize[aol] += olen;
                    //margins[a]   -= olen; (margins were reset, so need to do this)
                    sideChildrenInfo[index][aol] = 0;
                }
                
                var childSize = new pvc.Size(remSize);
                me._log("=> Available Child Size=" + pvc.stringify(childSize));
                
                child.layout(childSize, childKeyArgs);

                if(child.isVisible){
                    changes |= checkPaddingsChanged(a, paddings, child, /*canChange*/ true) | // <<-- NOTE BITwise OR
                               checkOverflowPaddingsChanged(a, overflowPaddings, child, /*canChange*/ true);

                    // Only set the *anchor* position
                    // The other orthogonal position is dependent on the size of the other non-fill children
                    positionChildAnchor(a, child);

                    updateSide(a, child, index, /*isSideChild*/true);
                }

                return changes;
            } finally {
                if(useLog){ me._groupEnd(); }
            }
        }
        
        function layoutChildFill(child, canChange) {
            var changes = 0;
            
            var a = child.anchor; // 'fill'
            
            childKeyArgs.paddings  = filterAnchorPaddings(a, paddings);
            childKeyArgs.canChange = canChange;
            
            var childSize = new pvc.Size(remSize);
            me._log("=> Available Child Size=" + pvc.stringify(childSize));
            child.layout(childSize, childKeyArgs);
            
            if(child.isVisible){
                changes |= checkPaddingsChanged(a, paddings, child, canChange);
                
                positionChildAnchor(a, child);
                positionChildAnchorOrtho (child, a);
            }
            
            return changes;
        }
        
        function layoutChild2Side(child, index, canChange) {
            var changed = 0;
            if(child.isVisible){
                var a          = child.anchor;
                var al         = alMap[a];
                var aol        = aolMap[a];
                var length     = remSize[al];
                var olength    = child[aol];
                var childSize2 = new pvc.Size(def.set({}, al, length, aol, olength));
                
                childKeyArgs.paddings  = filterAnchorPaddings(a, paddings);
                childKeyArgs.canChange = canChange;
                
                me._log("=> Available Child Size=" + pvc.stringify(childSize2));
                
                child.layout(childSize2, childKeyArgs);
                
                if(child.isVisible){
                    changed = checkSideChildResized(a, child, index, canChange) | // <-- NOTE BITwise OR
                              checkPaddingsChanged (a, paddings, child, canChange) |
                              checkOverflowPaddingsChanged(a, overflowPaddings, child, canChange);
                    
                    //if(!changed){
                    positionChildAnchorOrtho(child, child.align);
                    //}
                }
            }
            
            return changed;
        }
        
        function positionChildAnchor(side, child) {
            var sidePos;
            if(side === 'fill') {
                side = 'left';
                sidePos = margins.left + remSize.width / 2 - (child.width / 2);
            } else {
                sidePos = margins[side];
            }
            
            child.setPosition(def.set({}, side, sidePos));
        }
        
        // Decreases available size and increases margins
        function updateSide(side, child, index, isSideChild) {
            var sideol = aolMap[side],
                olen   = child[sideol];
            
            if(isSideChild){
                sideChildrenInfo[index][sideol] = olen;
            }
            
            margins[side]   += olen;
            remSize[sideol] -= olen;
        }
        
        function positionChildAnchorOrtho(child, align) {
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
        
        function filterAnchorPaddings(a, paddings){
            var filtered = new pvc.Sides();
            
            getAnchorPaddingsNames(a).forEach(function(side){
                filtered.set(side, paddings[side]);
            });
            
            return filtered;
        }
        
        function checkSideChildResized(a, child, index, canChange) {
            var changed = 0;
            
            var aol  = aolMap[a];
            var olen = child[aol];
            var addOLen = olen - sideChildrenInfo[index][aol];
            if(Math.abs(addOLen) > 0) {
                if(pvc.debug >= 3) {
                    me._log("Child changed " + aol + " by " + addOLen);
                }
                
                if(!canChange) {
                    if(pvc.debug >= 2) {
                        me._warn("Child wanted more/less " + aol + ", but layout iterations limit has been reached.");
                    }
                } else {
                    changed = FillSizeChanged;
                    
                    margins[a  ] += addOLen;
                    remSize[aol] -= addOLen;
                    sideChildrenInfo[index][aol] = olen;
                }
            }
            
            return changed;
        }
        
        function checkPaddingsChanged(a, paddings, child, canChange){
            var newPaddings = child._layoutInfo.requestPaddings;

            var changed = 0;
            
            // Additional paddings are requested?
            if(newPaddings){
                if(useLog && pvc.debug >= 10){
                    me._log("=> clientSize=" + pvc.stringify(child._layoutInfo.clientSize));
                    me._log("<= requestPaddings=" + pvc.stringify(newPaddings));
                }

                // Compare requested paddings with existing paddings
                getAnchorPaddingsNames(a).forEach(function(side){
                    var value     = paddings[side] || 0;
                    var newValue  = Math.floor(10000 * (newPaddings[side] || 0)) / 10000;
                    var increase  = newValue - value;
                    var minChange = Math.max(1, Math.abs(0.01 * value));

                    // STABILITY requirement
                    if(increase !== 0 && Math.abs(increase) >= minChange){
                        if(!canChange){
                            if(pvc.debug >= 2){
                                me._warn("CANNOT change but child wanted to: " + side + "=" + newValue);
                            }
                        } else {
                            changed |= NormalPaddingsChanged;
                            paddings[side] = newValue;

                            if(useLog){
                                me._log("Changed padding " + side + " <- " + newValue);
                            }
                        }
                    }
                });

                if(changed){
                    var paddingKey = pvc.Sides
                                        .names
                                        .map(function(side){ return (paddings[side] || 0).toFixed(0); })
                                        .join('|');

                    if(def.hasOwn(paddingHistory, paddingKey)){
                        // LOOP detected
                        if(pvc.debug >= 2){
                            me._warn("LOOP detected!!!!");
                        }
                        changed |= LoopDetected;
                    } else {
                        paddingHistory[paddingKey] = true;
                    }

                    paddings.width  = paddings.left + paddings.right ;
                    paddings.height = paddings.top  + paddings.bottom;
                }
            }
            
            return changed;
        }
        
        function checkOverflowPaddingsChanged(a, ownPaddings, child, canChange){
            var overflowPaddings = child._layoutInfo.overflowPaddings || emptyNewPaddings;
            
            var changed = 0;
            
            if(useLog && pvc.debug >= 10){
                me._log("<= overflowPaddings=" + pvc.stringify(overflowPaddings));
            }
                
            getAnchorPaddingsNames(a).forEach(function(side){
                if(overflowPaddings.hasOwnProperty(side)){
                    var value    = ownPaddings[side] || 0;
                    var newValue = Math.floor(10000 * (overflowPaddings[side] || 0)) / 10000;
                    newValue -= margins[side]; // corners absorb some of it

                    var increase = newValue - value;
                    var minChange = Math.max(1, Math.abs(0.05 * value));

                    // STABILITY & SPEED requirement
                    if(increase >= minChange) { // Only when positive is more space needed
                        if(!canChange){
                            if(pvc.debug >= 2){
                                me._warn("CANNOT change overflow padding but child wanted to: " + side + "=" + newValue);
                            }
                        } else {
                            changed |= OverflowPaddingsChanged;
                            ownPaddings[side] = newValue;

                            if(useLog){
                                me._log("changed overflow padding " + side + " <- " + newValue);
                            }
                        }
                    }
                }
            });

            if(changed){
                ownPaddings.width  = ownPaddings.left + ownPaddings.right ;
                ownPaddings.height = ownPaddings.top  + ownPaddings.bottom;
            }
            
            return changed;
        }
        
        function getAnchorPaddingsNames(a){
            switch(a){
                case 'left':
                case 'right':  return pvc.Sides.vnames;
                case 'top':
                case 'bottom': return pvc.Sides.hnames;
                case 'fill':   return pvc.Sides.names;
            }
        }
    }
});
