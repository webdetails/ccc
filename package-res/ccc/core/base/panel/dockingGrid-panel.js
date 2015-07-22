/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_Sides:true, pvc_Size:true */

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
    _calcLayout: function(layoutInfo) {
        var me = this;
        
        if(!me._children) return;

        var useLog = def.debug >= 5,
            // Objects we can mutate
            margins  = new pvc_Sides(0),
            paddings = new pvc_Sides(0),
            remSize = def.copyOwn(layoutInfo.clientSize),
            increasedClientSize = new pvc_Size(0, 0),
            aolMap = pvc.BasePanel.orthogonalLength,
            aoMap  = pvc.BasePanel.relativeAnchor,
            alMap  = pvc.BasePanel.parallelLength,
            childKeyArgs = {force: true, referenceSize: layoutInfo.clientSize},
            fillChildren = [],
            sideChildren = [],
            // loop detection
            paddingHistory = {},
            LoopDetected = 1,
            NormalPaddingsChanged = 2,
            OverflowPaddingsChanged = 4,
            OwnClientSizeChanged = 8,
            emptyNewPaddings = new pvc_Sides(), // used below in place of null requestPaddings
            isDisasterRecovery = false;
            preserveLayout = layoutInfo.preserved;

        if(useLog) me.log.group("CCC GRID LAYOUT clientSize = " + def.describe(remSize));
        try {
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
            // The normal length is only correctly known after all side
            // children have been laid out once.
            //
            // As such, in this phase, the child is only positioned on the anchor coordinate.
            // The orthogonal anchor coordinate is set on the second phase.
            //
            // SIDE children may change paddings as well.
            if(useLog) me.log.group("Phase 1 - Determine MARGINS and FILL SIZE from SIDE panels");
            try {
                (function() {
                    for(var i = 0, L = sideChildren.length; i < L; i++) {
                        if((layoutChild1Side(sideChildren[i], i) & OwnClientSizeChanged) != 0) {
                            if(useLog) me.log("Restarting due to clientSize increase");
                            return layoutInfo.clientSize; // increased.
                        }
                    }
                }());
            } finally {
                // -> remSize now contains the size of the CENTER cell and is not changed any more
                if(useLog) {
                    me.log.groupEnd();
                    me.log("Final FILL margins = " + def.describe(margins));
                    me.log("Final FILL border size = " + def.describe(remSize));
                }
            }

            // PHASE 2 - Relayout each SIDE child with its final orthogonal length
            // PHASE 3 - Layout FILL children
            //
            // Repeat 2 and 3 while paddings changed
            if(useLog) me.log.group("Phase 2 - Determine COMMON PADDINGS");
            try {
                doMaxTimes(9, layoutCycle);
            } finally {
                if(useLog) {
                    me.log.groupEnd();
                    me.log("Final FILL clientSize = " + def.describe({
                        width:  (remSize.width ||0 - paddings.width ||0),
                        height: (remSize.height||0 - paddings.height||0)}));
                    me.log("Final COMMON paddings = " + def.describe(paddings));
                }
            }

            layoutInfo.gridMargins  = new pvc_Sides(margins );
            layoutInfo.gridPaddings = new pvc_Sides(paddings);
            layoutInfo.gridSize     = new pvc_Size(remSize  );


            return layoutInfo.clientSize; // may have increased.

        } finally {
            if(useLog) me.log.groupEnd();
        }

        // --------
        
        function layoutCycle(remTimes, iteration) {
            if(useLog) me.log.group("LayoutCycle " + (isDisasterRecovery ? "- Disaster MODE" : ("#" + (iteration + 1))));
            try {
                var canChange = layoutInfo.canChange !== false && !isDisasterRecovery && (remTimes > 0),
                    ownPaddingsChanged = false,
                    ownClientSizeChanged = false,
                    index = 0,
                    count = sideChildren.length,
                    layoutChanged, breakAndRepeat;

                while(index < count) {
                    if(useLog) me.log.group("SIDE Child #" + (index + 1));
                    try {
                        layoutChanged = layoutChild2Side(sideChildren[index], canChange);
                        if(!isDisasterRecovery && layoutChanged) {
                            breakAndRepeat = false;
                            if((layoutChanged & OverflowPaddingsChanged) !== 0) {
                                // Don't stop right away cause there might be
                                // other overflow paddings requests, of other side childs.
                                // Translate children overflow paddings in own paddings.
                                if(useLog) me.log("SIDE Child #" + (index + 1) + " changed overflow paddings");
                                if(!ownPaddingsChanged) {
                                    ownPaddingsChanged = true;
                                    // If changed more than once, we do nothing.
                                    // The initial assignment to requestPaddings remains valid.
                                    // It is the same layoutInfo.paddings instance that is changed, internally.
                                    layoutInfo.requestPaddings = layoutInfo.paddings;
                                }
                            }

                            if((layoutChanged & NormalPaddingsChanged) !== 0) {
                                if(remTimes > 0) {
                                    if(useLog) me.log("SIDE Child #" + (index + 1) + " changed normal paddings");
                                    breakAndRepeat = true;
                                } else if(def.debug >= 2) {
                                    me.log.warn("SIDE Child #" + (index + 1) + " changed paddings but no more iterations possible.");
                                }
                            }
                            
                            if((layoutChanged & LoopDetected) !== 0) {
                                // Oh no...
                                isDisasterRecovery = true;
                                layoutCycle(0);
                                return false; // stop;
                            }

                            if(breakAndRepeat) return true;
                        }
                    } finally {
                        if(useLog) me.log.groupEnd();
                    }
                    index++;
                }
                
                if(ownPaddingsChanged) {
                    if(useLog) me.log("Restarting due to overflowPaddings change");
                    return false; // stop;
                }

                index = 0;
                count = fillChildren.length;
                while(index < count) {
                    if(useLog) me.log.group("FILL Child #" + (index + 1));
                    try {
                        layoutChanged = layoutChildFill(fillChildren[index], canChange);
                        if(!isDisasterRecovery && layoutChanged) {
                            breakAndRepeat = false;

                            if((layoutChanged & OwnClientSizeChanged) !== 0) {
                                ownClientSizeChanged = true;
                                // Don't stop right away cause there might be
                                // other clientSize increase requests, of other fill childs.
                                // Translate children clientSize increases in own clientSize increases.
                                if(useLog) me.log("FILL Child #" + (index + 1) + " increased client size");
                            }

                            if((layoutChanged & NormalPaddingsChanged) !== 0) {
                                if(remTimes > 0) {
                                    if(def.debug >= 5) me.log("FILL Child #" + (index + 1) + " increased paddings");
                                    if(!ownClientSizeChanged) breakAndRepeat = true; // repeat
                                } else if(def.debug >= 2) {
                                    me.log.warn("FILL Child #" + (index + 1) + " increased paddings but no more iterations possible.");
                                }
                            }

                            if((layoutChanged & LoopDetected) !== 0) {
                                // Oh no...
                                isDisasterRecovery = true;
                                layoutCycle(0);
                                return false; // stop;
                            }

                            if(breakAndRepeat) return true;
                        }
                    } finally {
                        if(useLog) me.log.groupEnd();
                    }
                    index++;
                }

                if(ownClientSizeChanged) {
                    if(useLog) me.log("Restarting due to clientSize increase");
                }

                return false; // stop
            } finally {
                if(useLog) me.log.groupEnd();
            }
        }
        
        function doMaxTimes(maxTimes, fun) {
            var index = 0;
            while(maxTimes--) {
                // remTimes = maxTimes
                if(fun(maxTimes, index) === false) return true;
                index++;
            }
            return false;
        }
        
        function initChild(child) {
            var a = child.anchor;
            if(a) {
                if(a === 'fill') {
                    fillChildren.push(child);

                    var childPaddings = child.paddings.resolve(childKeyArgs.referenceSize);
                    
                    // After the op. it's not a pvc.Side anymore, just an object with same named properties.
                    paddings = pvc_Sides.resolvedMax(paddings, childPaddings);
                } else {
                    /*jshint expr:true */
                    def.hasOwn(aoMap, a) || def.fail.operationInvalid("Unknown anchor value '{0}'", [a]);
                    
                    sideChildren.push(child);
                }
            }
        }
        
        function layoutChild1Side(child, index) {
            if(useLog) me.log.group("SIDE Child #" + (index + 1));
            try {
                var layoutChanged = 0,
                    a = child.anchor,
                    canChange = layoutInfo.canChange !== false;

                childKeyArgs.paddings = filterAnchorPaddings(a, paddings);

                child.layout(new pvc_Size(remSize), childKeyArgs);

                if(child.isVisible) {
                    layoutChanged |= checkAnchorPaddingsChanged(a, paddings, child) | // <-- NOTE BITwise OR
                                     checkChildSizeIncreased(child, canChange, /*isFill*/false);

                    // Only set the *anchor* position
                    // The other orthogonal position is dependent on the size of the other non-fill children
                    positionChildNormal(a, child);

                    updateSide(a, child);
                }

                return layoutChanged;
            } finally {
                if(useLog) me.log.groupEnd();
            }
        }
        
        function layoutChildFill(child, canChange) {
            var layoutChanged = 0,
                a = child.anchor; // 'fill'
            
            childKeyArgs.paddings  = filterAnchorPaddings(a, paddings);
            childKeyArgs.canChange = canChange;
            
            child.layout(new pvc_Size(remSize), childKeyArgs);
            
            if(child.isVisible) {
                layoutChanged |= checkAnchorPaddingsChanged(a, paddings, child, canChange) |   // <-- NOTE BITwise OR
                                 checkChildSizeIncreased(child, canChange, /*isFill*/true);
                
                positionChildNormal(a, child);
                positionChildOrtho (child, a);
            }
            
            return layoutChanged;
        }
        
        function layoutChild2Side(child, canChange) {
            var layoutChanged = 0;
            if(child.isVisible) {
                var a = child.anchor,
                    al  = alMap[a],
                    aol = aolMap[a],
                    length  = remSize[al],
                    olength = child[aol],
                    childSize2 = new pvc_Size(def.set({}, al, length, aol, olength));
                
                childKeyArgs.paddings = filterAnchorPaddings(a, paddings);
                childKeyArgs.canChange = canChange;
                
                child.layout(childSize2, childKeyArgs);
                
                if(child.isVisible) {
                    layoutChanged = checkAnchorPaddingsChanged(a, paddings, child, canChange) |   // <-- NOTE BITwise OR
                                    checkOverflowPaddingsChanged(a, layoutInfo.paddings, child, canChange) |   // <-- NOTE BITwise OR
                                    checkChildSizeIncreased(child, canChange, /*isFill*/false);
                    
                    if(!layoutChanged) positionChildOrtho(child, child.align);
                }
            }
            return layoutChanged;
        }
        
        function positionChildNormal(side, child) {
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
        function updateSide(side, child) {
            var sideol = aolMap[side],
                olen   = child[sideol];
            
            margins[side]   += olen;
            remSize[sideol] -= olen;
        }
        
        function positionChildOrtho(child, align) {
            var sideo;
            if(align === 'fill') align = 'middle';
            
            var sideOPos;
            switch(align) {
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
        
        function filterAnchorPaddings(a, paddings) {
            var filtered = new pvc_Sides();
            
            getAnchorPaddingsNames(a).forEach(function(side) {
                filtered.set(side, paddings[side]);
            });
            
            return filtered;
        }

        function checkAnchorPaddingsChanged(a, paddings, child, canChange) {
            var newPaddings = child._layoutInfo.requestPaddings,
                changed = 0;
            
            // Additional paddings are requested?
            if(newPaddings) {
                if(useLog && def.debug >= 10) {
                    me.log("=> clientSize=" + def.describe(child._layoutInfo.clientSize));
                    me.log("<= requestPaddings=" + def.describe(newPaddings));
                }

                // Compare requested paddings with existing paddings
                getAnchorPaddingsNames(a).forEach(function(side) {
                    var value     = paddings[side] || 0,
                        newValue  = Math.floor(10000 * (newPaddings[side] || 0)) / 10000,
                        increase  = newValue - value,
                        minChange = Math.max(1, Math.abs(0.01 * value));

                    // STABILITY requirement
                    if(increase !== 0 && Math.abs(increase) >= minChange) {
                        if(!canChange) {
                            if(def.debug >= 2) me.log.warn("CANNOT change but child wanted to: " + side + "=" + newValue);
                        } else {
                            changed |= NormalPaddingsChanged;
                            paddings[side] = newValue;
                            if(useLog) me.log("Changed padding " + side + " <- " + newValue);
                        }
                    }
                });

                if(changed) {
                    var paddingKey = pvc_Sides
                        .names
                        .map(function(side) { return (paddings[side] || 0).toFixed(0); })
                        .join('|');

                    if(def.hasOwn(paddingHistory, paddingKey)) {
                        // LOOP detected
                        if(def.debug >= 2) me.log.warn("LOOP detected!!!!");
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
        
        function checkOverflowPaddingsChanged(a, ownPaddings, child, canChange) {
            // NEW603 C
            /* If the layout phase corresponds to a re-layouut (chart is a re-render)
               don't allow overflowPaddings, since the preserved paddings already account
               for the final overflowPaddings in the first render*/
            var overflowPaddings = (!child.chart._preserveLayout) ? 
                                        (child._layoutInfo.overflowPaddings || emptyNewPaddings) : 
                                         emptyNewPaddings,
                changed = 0;
            
            if(useLog && def.debug >= 10) me.log("<= overflowPaddings=" + def.describe(overflowPaddings));
                
            getAnchorPaddingsNames(a).forEach(function(side) {
                if(overflowPaddings.hasOwnProperty(side)) {
                    var value    = ownPaddings[side] || 0,
                        newValue = (Math.floor(10000 * (overflowPaddings[side] || 0)) / 10000)
                            - margins[side], // corners absorb some of it
                        increase = newValue - value,
                        minChange = Math.max(1, Math.abs(0.05 * value));

                    // STABILITY & SPEED requirement
                    if(increase >= minChange) {
                        if(!canChange) {
                            if(def.debug >= 2) me.log.warn("CANNOT change overflow padding but child wanted to: " + side + "=" + newValue);
                        } else {
                            changed |= OverflowPaddingsChanged;
                            ownPaddings[side] = newValue;

                            if(useLog) me.log("changed overflow padding " + side + " <- " + newValue);
                        }
                    }
                }
            });

            if(changed) {
                ownPaddings.width  = ownPaddings.left + ownPaddings.right ;
                ownPaddings.height = ownPaddings.top  + ownPaddings.bottom;
            }
            
            return changed;
        }

        function checkChildSizeIncreased(child, canChange, isFill) {
            var changed = 0;

            function checkDimension(a_length) {

                var clientLength = (remSize[a_length] || 0) + increasedClientSize[a_length],
                    childLength  = child  [a_length] || 0,
                    increase = childLength - clientLength;

                if(increase > 0) {
                    if(!canChange) {
                        if(def.debug >= 2)
                            me.log.warn("CANNOT change child size but child wanted to: " + a_length + "=" + childLength +
                                " available=" + clientLength);
                    } else {
                        increasedClientSize[a_length] += increase;
                        changed |= OwnClientSizeChanged;
                        layoutInfo.clientSize[a_length] += increase;

                        if(useLog) me.log("changed child size " + a_length + " <- " + childLength);
                    }
                }
            }

            if(isFill) pvc_Size.names.forEach(checkDimension);
            else checkDimension(child.anchorLength());

            return changed;
        }
        
        function getAnchorPaddingsNames(a) {
            switch(a) {
                case 'left':
                case 'right':  return pvc_Sides.vnames;
                case 'top':
                case 'bottom': return pvc_Sides.hnames;
                case 'fill':   return pvc_Sides.names;
            }
        }
    }
});
