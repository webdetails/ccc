/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_Sides:true, pvc_Size:true */
(function() {

    def
    .type('pvc.GridDockingPanel', pvc.BasePanel)
    .add({
        anchor: 'fill',

        /**
         * Implements a docking/grid layout variant.
         * <p>
         * The layout contains 5 target positions: top, bottom, left, right and center.
         * These are mapped to a 3x3 grid placed inside the panel's client-size.
         * The corner cells always remain empty. In the center cell, child panels are superimposed.
         * </p>
         *
         * <p>
         * All child panels have margins = 0 and their position and size is controlled by the layout:
         * a) Width is shared by the top, center and bottom panels.
         * b) Height is shared by the left, center and right panels.
         * </p>
         *
         * <p>
         * Additionally, the paddings of child panels are also controlled by the layout,
         * so that:
         * a) Left and right paddings are shared by the top, center and bottom panels.
         * b) Top and bottom paddings are shared by the left, center and right panels.
         * </p>
         *
         * <p>
         * Side child panel's can inform of overflow (overflowPaddings), in orthogonal directions,
         * from content that, for them, is ok to overflow, even if it overlaps with other sibling's content.
         * It's the responsibility of the parent panel to guarantee that these overflows
         * don't leave the parent panel's border box.
         * </p>
         *
         * <p>
         * The empty corner cells of the grid layout absorb some of the overflowed content from side child panels.
         * If, for example, a child panel is placed at the 'left' cell and it
         * overflows in the 'top' side, that overflow can be partly absorbed by
         * the top-left corner cell, as long as there's a panel in the top cell that
         * imposes that much height.
         * </p>
         *
         * <p>
         * If the corner space is not enough to absorb the overflow paddings,
         * the excess is converted into paddings of the grid-layout panel itself,
         * requesting new paddings to the layout's parent panel.
         * </p>
         *
         * @override
         */
        _calcLayout: function(layoutInfo) {
            var me = this;

            if(!me._children) return;

            var useLog = def.debug >= 5;

            var canChangeInitial = layoutInfo.canChange !== false;

            // Anchor properties conversion maps.
            var aolMap = pvc.BasePanel.orthogonalLength;
            var aoMap  = pvc.BasePanel.relativeAnchor;
            var alMap  = pvc.BasePanel.parallelLength;

            // LayoutChanged bit codes.
            var LoopDetected = 1;
            var NormalPaddingsChanged = 2;
            var OverflowPaddingsChanged = 4;
            var OwnClientSizeChanged = 8;
            var MarginsChanged = 16;

            // keyArgs for child.layout() calls.
            var childLayoutKeyArgs = {force: true, referenceSize: layoutInfo.clientSize};

            // Layout state
            var margins = new pvc_Sides(0);
            var childPaddings = new pvc_Sides(0);
            // Cycle detection
            var childPaddingsHistory = {};

            var fillSize = def.copyOwn(layoutInfo.clientSize);
            var increasedClientSize = new pvc_Size(0, 0);

            var fillChildren = [];
            var sideChildren = [];

            var isDisasterRecovery = false;

            if(useLog) me.log.group("CCC GRID LAYOUT clientSize = " + def.describe(fillSize));
            try {
                doLayout();
            } finally {
                if(useLog) me.log.groupEnd();
            }

            layoutInfo.gridMargins  = new pvc_Sides(margins);
            layoutInfo.gridPaddings = new pvc_Sides(childPaddings);
            layoutInfo.gridSize     = new pvc_Size(fillSize);

            return layoutInfo.clientSize; // may have increased.

            function doLayout() {

                var layoutChanged = 0;

                me._children.forEach(phase0_initChild);

                if(useLog) me.log.group("Phase 1 - Determine MARGINS and FILL SIZE from SIDE panels");
                try {
                    layoutChanged = phase1();
                } finally {
                    // -> fillSize now contains the size of the CENTER cell and is not changed any more
                    if(useLog) {
                        me.log.groupEnd();
                        me.log("Final FILL margins = " + def.describe(margins));
                        me.log("Final FILL border size = " + def.describe(fillSize));
                    }
                }

                if(!layoutChanged) {
                    if(useLog) me.log.group("Phase 2 - Determine COMMON PADDINGS");
                    try {
                        doMaxTimes(9, phase2_layoutIteration);
                    } finally {
                        if(useLog) {
                            me.log.groupEnd();

                            me.log("Final FILL clientSize = " + def.describe({
                                    width:  (fillSize.width ||0 - childPaddings.width ||0),
                                    height: (fillSize.height||0 - childPaddings.height||0)}));
                            me.log("Final COMMON paddings = " + def.describe(childPaddings));
                        }
                    }
                }
            }

            // --------

            //region Phase 0 - Initialization

            // Splits children in two groups: FILL and SIDE, according to its anchor.
            // Children explicitly not requiring layout are excluded (!child.anchor).
            //
            // For FILL children, finds the maximum of the resolved paddings.
            // These paddings will be the minimum that will result from this layout.
            function phase0_initChild(child) {
                var a = child.anchor;
                if(a) {
                    if(a === 'fill') {
                        fillChildren.push(child);

                        var oneChildPaddings = child.paddings.resolve(childLayoutKeyArgs.referenceSize);

                        // After the op. it's not a pvc.Side anymore, just an object with same named properties.
                        childPaddings = pvc_Sides.resolvedMax(childPaddings, oneChildPaddings);
                    } else {
                        /*jshint expr:true */
                        def.hasOwn(aoMap, a) || def.fail.operationInvalid("Unknown anchor value '{0}'", [a]);

                        sideChildren.push(child);
                    }
                }
            }
            //endregion

            //region Phase 1 - Determine MARGINS and FILL SIZE from SIDE panels
            function phase1() {
                var layoutChange = 0;
                var sideChildrenSizes = new Array(sideChildren.length);

                var MAX_TIMES = 5;

                // Usually converges within 3 iterations.
                // Looks like the last iteration could be spared sometimes.
                var i = 0;
                do {
                    if(useLog) me.log.group("Iteration #" + (i + 1) + " / " + MAX_TIMES);
                    try {
                        layoutChange = phase1_iteration(sideChildrenSizes);
                        if(layoutChange && (layoutChange & OwnClientSizeChanged) !== 0) {
                            if(useLog) me.log("Restarting due to clientSize increase.");

                            return layoutChange;
                        }
                    } finally {
                        if(useLog) me.log.groupEnd();
                    }
                } while((++i < MAX_TIMES) && (layoutChange & MarginsChanged) !== 0);

                // ---

                // Update the anchor position of every child.
                // Set the *anchor* position, only.
                // The orthogonal position is dependent on the actual size of the child panel...
                var i = -1;
                var count = sideChildren.length;
                var margins = new pvc_Sides(0);
                while(++i < count) {
                    var child  = sideChildren[i];
                    var anchor = child.anchor;
                    var pos = margins[anchor] || 0;

                    child.setPosition(def.set({}, anchor, pos));

                    margins[anchor] = pos + sideChildrenSizes[i];
                }

                // May be non-zero if remTimes when 0
                return layoutChange;
            }

            function phase1_iteration(sideChildrenSizes) {
                var layoutChange = 0;

                var i = -1;
                var count = sideChildren.length;
                while(++i < count) {
                    var child  = sideChildren[i];
                    var anchor = child.anchor;
                    var aoLen  = aolMap[anchor];

                    // Remove previous iteration's length from layout state
                    var olenPrev = sideChildrenSizes[i];
                    if(olenPrev != null) {
                        margins[anchor] -= olenPrev;
                        fillSize[aoLen] += olenPrev;
                    }

                    childLayoutKeyArgs.paddings  = filterAnchorPaddings(anchor, childPaddings);
                    childLayoutKeyArgs.canChange = canChangeInitial;

                    child.layout(new pvc_Size(fillSize), childLayoutKeyArgs);

                    if(child.isVisible && checkChildSizeIncreased(child, canChangeInitial)) {
                        return OwnClientSizeChanged;
                    }

                    var olen = child.isVisible ? child[aoLen] : 0;

                    if(Math.abs(olen - olenPrev) < 0.1) {
                        // Ignore minor changes
                        olen = olenPrev;
                    } else {
                        layoutChange |= MarginsChanged;
                    }

                    // Update layout state.
                    sideChildrenSizes[i] = olen;
                    if(olen) {
                        margins[anchor] += olen;
                        fillSize[aoLen] -= olen;
                    }
                }

                return layoutChange;
            }
            //endregion

            //region Phase 2 - Determine COMMON PADDINGS
            function phase2_layoutIteration(remTimes, iteration) {
                if(useLog)
                    me.log.group("LayoutIteration " + (isDisasterRecovery ? "- Disaster MODE" : ("#" + (iteration + 1))));

                var canChangeChild = canChangeInitial && !isDisasterRecovery && (remTimes > 0);
                var index, count, layoutChange;

                try {
                    // SIDE children
                    index = 0;
                    count = sideChildren.length;
                    var ownPaddingsChanged = false;
                    while(index < count) {
                        if(useLog) me.log.group("SIDE Child #" + (index + 1));
                        try {
                            layoutChange = phase2_layoutChildSide(sideChildren[index], canChangeChild);
                            if(layoutChange) {
                                // assert canChangeChild

                                if((layoutChange & LoopDetected) !== 0) {
                                    // Oh no...
                                    isDisasterRecovery = true;
                                    phase2_layoutIteration(0, 0);
                                    return false; // stop;
                                }

                                if((layoutChange & NormalPaddingsChanged) !== 0) {
                                    // Repeat Phase 2
                                    if(useLog) me.log("SIDE Child #" + (index + 1) + " changed normal paddings");

                                    // breakAndRepeat
                                    //if(!ownPaddingsChanged)
                                    return true;
                                }

                                if((layoutChange & OverflowPaddingsChanged) !== 0) {
                                    // Don't stop right away cause there might be
                                    // other overflow paddings requests, of other side children.
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

                    // FILL children
                    index = 0;
                    count = fillChildren.length;
                    var ownClientSizeChanged = false;
                    while(index < count) {
                        if(useLog) me.log.group("FILL Child #" + (index + 1));
                        try {
                            layoutChange = phase2_layoutChildFill(fillChildren[index], canChangeChild);
                            if(layoutChange) {
                                // assert canChangeChild

                                if((layoutChange & LoopDetected) !== 0) {
                                    // Oh no...
                                    isDisasterRecovery = true;
                                    phase2_layoutIteration(0, 0);
                                    return false; // stop;
                                }

                                if((layoutChange & OwnClientSizeChanged) !== 0) {
                                    ownClientSizeChanged = true;
                                    // Don't stop right away cause there might be
                                    // other clientSize increase requests, of other fill childs.
                                    // Translate children clientSize increases in own clientSize increases.
                                    if(useLog) me.log("FILL Child #" + (index + 1) + " increased client size");
                                }

                                if((layoutChange & NormalPaddingsChanged) !== 0) {

                                    if(def.debug >= 5) me.log("FILL Child #" + (index + 1) + " increased paddings");

                                    // breakAndRepeat
                                    if(!ownClientSizeChanged) return true;
                                }
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

            function phase2_layoutChildSide(child, canChangeChild) {
                var layoutChange = 0;
                if(child.isVisible) {
                    var anchor = child.anchor,
                        anchorLength = alMap[anchor],
                        anchorOrthoLength = aolMap[anchor],

                        length = fillSize[anchorLength],
                        olength = child[anchorOrthoLength], // fixed in phase1
                        childSize2 = new pvc_Size(def.set({}, anchorLength, length, anchorOrthoLength, olength));

                    childLayoutKeyArgs.paddings  = filterAnchorPaddings(anchor, childPaddings);
                    childLayoutKeyArgs.canChange = canChangeChild;

                    child.layout(childSize2, childLayoutKeyArgs);

                    if(child.isVisible) {
                        layoutChange =
                            checkChildPaddingsChanged(child, canChangeChild)         |   // <-- NOTE BITwise OR
                            checkChildOverflowPaddingsChanged(child, canChangeChild) |
                            checkChildSizeIncreased(child, canChangeChild);

                        if(!layoutChange) {
                            positionChildAnchorOrtho(child, child.align);
                        }
                    }
                }
                return layoutChange;
            }

            function phase2_layoutChildFill(child, canChangeChild) {
                var layoutChange = 0;
                var anchor = child.anchor; // 'fill'

                childLayoutKeyArgs.paddings  = filterAnchorPaddings(anchor, childPaddings);
                childLayoutKeyArgs.canChange = canChangeChild;

                child.layout(new pvc_Size(fillSize), childLayoutKeyArgs);

                if(child.isVisible) {
                    layoutChange |=
                        checkChildPaddingsChanged(child, canChangeChild) |   // <-- NOTE BITwise OR
                        checkChildSizeIncreased(child, canChangeChild);

                    if(!layoutChange) {
                        // Anchor position
                        child.setPosition({left: margins.left + fillSize.width / 2 - (child.width / 2)});

                        positionChildAnchorOrtho(child, anchor);
                    }
                }

                return layoutChange;
            }

            function positionChildAnchorOrtho(child, anchorOrthoOrAlign) {
                var pos, anchorOrtho;

                switch(anchorOrthoOrAlign) {
                    case 'top':
                    case 'bottom':
                    case 'left':
                    case 'right':
                        anchorOrtho = anchorOrthoOrAlign;
                        pos = margins[anchorOrtho];
                        break;

                    case 'fill':
                    case 'middle':
                        anchorOrtho = 'bottom';
                        pos = margins.bottom + (fillSize.height / 2) - (child.height / 2);
                        break;

                    case 'center':
                        anchorOrtho = 'left';
                        pos = margins.left + fillSize.width / 2 - (child.width / 2);
                        break;
                }

                child.setPosition(def.set({}, anchorOrtho, pos));
            }

            function checkChildPaddingsChanged(child, canChangeChild) {
                var anchor = child.anchor,
                    requestPaddings = child._layoutInfo.requestPaddings,
                    layoutChange = 0;

                // Additional paddings are requested?
                if(requestPaddings) {
                    if(useLog && def.debug >= 10) {
                        me.log("=> clientSize=" + def.describe(child._layoutInfo.clientSize));
                        me.log("<= requestPaddings=" + def.describe(requestPaddings));
                    }

                    // Compare requested paddings with existing paddings
                    getAnchorPaddingsNames(anchor).forEach(function(side) {
                        var value = childPaddings[side] || 0,
                            requestValue = Math.floor(10000 * (requestPaddings[side] || 0)) / 10000,
                            increase  = requestValue - value,
                            minChange = Math.max(1, Math.abs(0.01 * value));

                        // STABILITY requirement
                        if(increase !== 0 && Math.abs(increase) >= minChange) {
                            if(!canChangeChild) {
                                if(def.debug >= 2)
                                    me.log.warn("CANNOT change but child wanted to: " + side + "=" + requestValue);

                            } else {
                                layoutChange |= NormalPaddingsChanged;
                                childPaddings[side] = requestValue;

                                if(useLog) me.log("Changed paddings " + side + " <- " + requestValue);
                            }
                        }
                    });

                    if(layoutChange) {
                        var paddingKey = getPaddingsKey(childPaddings, 0);
                        if(def.hasOwn(childPaddingsHistory, paddingKey)) {
                            // LOOP detected
                            if(def.debug >= 2) me.log.warn("LOOP detected!!!!");

                            layoutChange |= LoopDetected;
                        } else {
                            childPaddingsHistory[paddingKey] = true;
                        }

                        // Calculate width and height
                        childPaddings.width  = childPaddings.left + childPaddings.right ;
                        childPaddings.height = childPaddings.top  + childPaddings.bottom;
                    }
                }

                return layoutChange;
            }

            function checkChildOverflowPaddingsChanged(child, canChangeChild) {
                var layoutChange = 0;

                /* If the layout phase corresponds to a re-layout (chart is a re-render),
                 * don't allow overflowPaddings, since the preserved paddings already account
                 * for the final overflowPaddings in the first render.
                 */

                var overflowPaddings;
                if(me.chart._preserveLayout || !(overflowPaddings = child._layoutInfo.overflowPaddings))
                    return layoutChange;

                if(useLog && def.debug >= 10) me.log("<= overflowPaddings=" + def.describe(overflowPaddings));

                var ownPaddings = layoutInfo.paddings;

                getAnchorPaddingsNames(child.anchor).forEach(function(side) {
                    if(overflowPaddings.hasOwnProperty(side)) {
                        var value    = ownPaddings[side] || 0,
                            // corners absorb some of it
                            newValue = (Math.floor(10000 * (overflowPaddings[side] || 0)) / 10000) - margins[side],
                            increase = newValue - value,
                            minChange = Math.max(1, Math.abs(0.05 * value));

                        // STABILITY & SPEED requirement
                        if(increase >= minChange) {
                            if(!canChangeChild) {
                                if(def.debug >= 2)
                                    me.log.warn("CANNOT change overflow paddings but child wanted to: " + side + "=" + newValue);
                            } else {
                                layoutChange |= OverflowPaddingsChanged;
                                ownPaddings[side] = newValue;

                                if(useLog) me.log("Changed overflow paddings " + side + " <- " + newValue);
                            }
                        }
                    }
                });

                if(layoutChange) {
                    // Calculate width and height
                    ownPaddings.width  = ownPaddings.left + ownPaddings.right ;
                    ownPaddings.height = ownPaddings.top  + ownPaddings.bottom;
                }

                return layoutChange;
            }
            //endregion

            function checkChildSizeIncreased(child, canChangeChild) {
                var layoutChange = 0;

                function checkDimension(a_length) {
                    var availableLen = fillSize[a_length] || 0;
                    var requestedLen = availableLen + increasedClientSize[a_length],
                        childLength  = child[a_length] || 0,
                        excessLen = childLength - requestedLen;

                    if(excessLen > pv.epsilon) {
                        if(!canChangeChild) {
                            if(def.debug >= 2)
                                me.log.warn("CANNOT change child size but child wanted to: " + a_length + "=" + childLength +
                                    " available=" + requestedLen);
                        } else {
                            layoutChange |= OwnClientSizeChanged;

                            increasedClientSize[a_length] += excessLen;
                            layoutInfo.clientSize[a_length] += excessLen;

                            if(useLog) me.log("changed child size " + a_length + " <- " + childLength);
                        }
                    }
                }

                if(child.anchor === "fill")
                    pvc_Size.names.forEach(checkDimension);
                else
                    checkDimension(child.anchorLength());

                return layoutChange;
            }
        }
    });

    //region Layout Helpers
    function doMaxTimes(maxTimes, fun) {
        var index = 0;
        while(maxTimes--) {
            // remTimes = maxTimes
            if(fun(maxTimes, index) === false) return false;
            index++;
        }
        return true;
    }

    function filterAnchorPaddings(a, paddings) {
        var filtered = new pvc_Sides();

        getAnchorPaddingsNames(a).forEach(function(side) {
            filtered.set(side, paddings[side]);
        });

        return filtered;
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

    function getPaddingsKey(paddings, precision) {
        if(precision == null) precision = 0;
        return pvc_Sides
            .names
            .map(function(side) { return (paddings[side] || 0).toFixed(precision); })
            .join('|');
    }
    //endregion
}());
