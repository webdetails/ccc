
pvc.GridDockingPanel = pvc.BasePanel.extend({
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
        
        if(!this._children) {
            return;
        }
        
        // Objects we can mutate
        var margins  = new pvc.Sides(0);
        var paddings = new pvc.Sides(0);
        var remSize = def.copyOwn(layoutInfo.clientSize);
        var overFlowPaddings;
        var aolMap = pvc.BasePanel.orthogonalLength;
        var aoMap  = pvc.BasePanel.relativeAnchor;
        var alMap  = pvc.BasePanel.parallelLength;
        
        var childKeyArgs = {
                force: true,
                referenceSize: layoutInfo.clientSize
            };
        
        var fillChildren = [];
        var sideChildren = [];
        
        // loop detection
        var paddingHistory = {}; 
        var loopSignal = {};
        var overflowPaddingsSignal = {};
        var isDisasterRecovery = false;
        
        
        // PHASE 0 - Initialization
        //
        // Splits children in two groups: FILL and SIDE, according to its anchor.
        // Children explicitly not requiring layout are excluded (!child.anchor).
        //
        // For FILL children, finds the maximum of the resolved paddings.
        // These paddings will be the minimum that will result from this layout.
        this._children.forEach(initChild);
        
        // PHASE 1 - MARGINS are imposed by SIDE children
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
        sideChildren.forEach(layoutChild1Side);
        
        // -> remSize now contains the size of the CENTER cell and is not changed any more
        
        // PHASE 2 - Relayout each SIDE child with its final orthogonal length
        // PHASE 3 - Layout FILL children
        // 
        // Repeat 2 and 3 while paddings changed
        
        doMaxTimes(9, layoutCycle);
        
        layoutInfo.gridMargins  = new pvc.Sides(margins );
        layoutInfo.gridPaddings = new pvc.Sides(paddings);
        layoutInfo.gridSize     = new pvc.Size(remSize  );
        
        // All available client space is consumed.
        // As such, there's no need to return anything.
        // return;
        
        // --------
        
        function layoutCycle(remTimes, iteration){
            if(pvc.debug >= 5){
                pvc.log("\n[GridDockingPanel] ==== LayoutCycle " + (isDisasterRecovery ? "Disaster MODE" : ("#" + (iteration + 1))));
            }
            
            var index, count;
            var canChange = layoutInfo.canChange !== false && !isDisasterRecovery && (remTimes > 0);
            var paddingsChanged;
            var ownPaddingsChanged = false;
            
            index = 0;
            count = sideChildren.length;
            while(index < count){
                if(pvc.debug >= 5){
                    pvc.log("[GridDockingPanel] SIDE Child i=" + index);
                }
                
                paddingsChanged = layoutChild2Side(sideChildren[index], canChange);
                if(!isDisasterRecovery && paddingsChanged){
                    if(paddingsChanged === loopSignal){
                        // Oh no...
                        isDisasterRecovery = true;
                        layoutCycle(0);
                        return false; // stop;
                    }
                    
                    if(paddingsChanged === overflowPaddingsSignal){
                        // Don't stop right away cause there might be other overflow paddings requests
                        // of other side childs
                        if(!ownPaddingsChanged){
                            ownPaddingsChanged = true;
                            layoutInfo.requestPaddings = layoutInfo.paddings; 
                        }
                    } else {
                        if(remTimes > 0){
                            if(pvc.debug >= 5){
                                pvc.log("[GridDockingPanel] SIDE Child i=" + index + " increased paddings");
                            }
                            return true; // repeat
                        } else if(pvc.debug >= 2){
                            pvc.log("[Warning] [GridDockingPanel] SIDE Child i=" + index + " increased paddings but no more iterations possible.");
                        }
                    }
                }
                index++;
            }
            
            if(ownPaddingsChanged){
                if(pvc.debug >= 5){
                    pvc.log("[GridDockingPanel] Restarting due to overflowPaddings change");
                }
                return false; // stop;
            }
            
            index = 0;
            count = fillChildren.length;
            while(index < count){
                if(pvc.debug >= 5){
                    pvc.log("[GridDockingPanel] FILL Child i=" + index);
                }
                
                paddingsChanged = layoutChildFill(fillChildren[index], canChange);
                if(!isDisasterRecovery && paddingsChanged){
                    if(paddingsChanged === loopSignal){
                        // Oh no...
                        isDisasterRecovery = true;
                        layoutCycle(0);
                        return false; // stop;
                    }
                    
                    if(remTimes > 0){
                        if(pvc.debug >= 5){
                            pvc.log("[GridDockingPanel] FILL Child i=" + index + " increased paddings");
                        }
                        return true; // repeat
                    } else if(pvc.debug >= 2){
                        pvc.log("[Warning] [GridDockingPanel] FILL Child i=" + index + " increased paddings but no more iterations possible.");
                    }
                }
                index++;
            }
            
            return false; // stop
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
                }
            }
        }
        
        function layoutChild1Side(child) {
            var paddingsChanged = false;
            
            var a = child.anchor;
            
            childKeyArgs.paddings = filterAnchorPaddings(a, paddings);
            
            child.layout(new pvc.Size(remSize), childKeyArgs);
            
            if(child.isVisible){
                
                paddingsChanged = checkAnchorPaddingsChanged(a, paddings, child);

                // Only set the *anchor* position
                // The other orthogonal position is dependent on the size of the other non-fill children
                positionChildNormal(a, child);
                
                updateSide(a, child);
            }
            
            return paddingsChanged;
        }
        
        function layoutChildFill(child, canChange) {
            var paddingsChanged = false;
            
            var a = child.anchor; // 'fill'
            
            childKeyArgs.paddings  = filterAnchorPaddings(a, paddings);
            childKeyArgs.canChange = canChange;
            
            child.layout(new pvc.Size(remSize), childKeyArgs);
            
            if(child.isVisible){
                paddingsChanged = checkAnchorPaddingsChanged(a, paddings, child, canChange);
                
                positionChildNormal(a, child);
                positionChildOrtho (child, a);
            }
            
            return paddingsChanged;
        }
        
        function layoutChild2Side(child, canChange) {
            var paddingsChanged = false;
            if(child.isVisible){
                var a = child.anchor;
                var al  = alMap[a];
                var aol = aolMap[a];
                var length  = remSize[al];
                var olength = child[aol];
                
                var childSize2 = new pvc.Size(def.set({}, al, length, aol, olength));
                
                childKeyArgs.paddings = filterAnchorPaddings(a, paddings);
                childKeyArgs.canChange = canChange;
                
                child.layout(childSize2, childKeyArgs);
                
                if(child.isVisible){
                    paddingsChanged = checkAnchorPaddingsChanged(a, paddings, child, canChange);
                    
                    if(checkOverflowPaddingsChanged(a, layoutInfo.paddings, child, canChange)){
                        return overflowPaddingsSignal;
                    }
                        
                    positionChildOrtho(child, child.align);
                }
            }
            
            return paddingsChanged;
        }
        
        function positionChildNormal(side, child) {
            var sidePos;
            if(side === 'fill'){
                side = 'left';
                sidePos = margins.left + remSize.width / 2 - (child.width / 2);
            } else {
                sidePos = margins[side];
            }
            
            child.setPosition(def.set({}, side, sidePos));
        }
        
        // Decreases available size and increases margins
        function updateSide(side, child) {
            var sideol = aolMap[side],
                olen   = child[sideol];
            
            margins[side]   += olen;
            remSize[sideol] -= olen;
        }
        
        function positionChildOrtho(child, align) {
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
        
        function checkAnchorPaddingsChanged(a, paddings, child, canChange){
            var newPaddings = child._layoutInfo.requestPaddings;
            
            var changed = false;
            if(newPaddings){
                if(pvc.debug >= 10){
                    pvc.log("[GridDockingPanel] => clientSize=" + pvc.stringify(child._layoutInfo.clientSize));
                    pvc.log("[GridDockingPanel] <= requestPaddings=" + pvc.stringify(newPaddings));
                }
                
                getAnchorPaddingsNames(a).forEach(function(side){
                    if(newPaddings.hasOwnProperty(side)){
                        var value    = paddings[side] || 0;
                        var newValue = Math.floor(10000 * (newPaddings[side] || 0)) / 10000;
                        var increase = newValue - value;
                        
                        // STABILITY requirement
                        if(increase !== 0 && Math.abs(increase) >= Math.abs(0.01 * value)){
                            if(!canChange){
                                if(pvc.debug >= 2){
                                    pvc.log("[Warning] [GridDockingPanel] CANNOT change but child wanted to: " + side + "=" + newValue);
                                }
                            } else {
                                changed = true;
                                paddings[side] = newValue;
                                
                                if(pvc.debug >= 5){
                                    pvc.log("[Warning] [GridDockingPanel]   changed padding " + side + " <- " + newValue);
                                }
                            }
                        }
                    }
                });
                
                if(changed){
                    var paddingKey = pvc.Sides
                                        .names
                                        .map(function(side){ return (paddings[side] || 0).toFixed(3); })
                                        .join('|');
                    
                    if(def.hasOwn(paddingHistory, paddingKey)){
                        // LOOP detected
                        if(pvc.debug >= 2){
                            pvc.log("[GridDockingPanel] LOOP detected");
                        }
                        changed = loopSignal;
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
            var overflowPaddings = child._layoutInfo.overflowPaddings;
            
            var changed = false;
            if(overflowPaddings){
                if(pvc.debug >= 10){
                    pvc.log("[GridDockingPanel] <= overflowPaddings=" + pvc.stringify(overflowPaddings));
                }
                
                getAnchorPaddingsNames(a).forEach(function(side){
                    if(overflowPaddings.hasOwnProperty(side)){
                        var value    = ownPaddings[side] || 0;
                        var newValue = Math.floor(10000 * (overflowPaddings[side] || 0)) / 10000;
                        newValue -= margins[side]; // corners absorb some of it
                        
                        var increase = newValue - value;
                        
                        // STABILITY & SPEED requirement
                        if(increase > Math.abs(0.05 * value)){
                            if(!canChange){
                                if(pvc.debug >= 2){
                                    pvc.log("[Warning] [GridDockingPanel] CANNOT change overflow  padding but child wanted to: " + side + "=" + newValue);
                                }
                            } else {
                                changed = true;
                                ownPaddings[side] = newValue;
                                
                                if(pvc.debug >= 5){
                                    pvc.log("[GridDockingPanel]   changed overflow padding " + side + " <- " + newValue);
                                }
                            }
                        }
                    }
                });
                
                if(changed){
                    ownPaddings.width  = ownPaddings.left + ownPaddings.right ;
                    ownPaddings.height = ownPaddings.top  + ownPaddings.bottom;
                }
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
