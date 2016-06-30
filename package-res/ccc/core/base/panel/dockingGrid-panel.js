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
        _calcLayout: function(_layoutInfo) {
            var _me = this;

            if(!_me._children) return;

            var _useLog = def.debug >= 5;

            var _canChangeInitial = _layoutInfo.canChange !== false;

            // Anchor properties conversion maps.
            var _aolMap = pvc.BasePanel.orthogonalLength;
            var _aoMap  = pvc.BasePanel.relativeAnchor;
            var _alMap  = pvc.BasePanel.parallelLength;

            // LayoutChanged bit codes.
            var LoopDetected = 1;
            var NormalPaddingsChanged = 2;
            var OverflowPaddingsChanged = 4;
            var OwnClientSizeChanged = 8;
            var MarginsChanged = 16;

            // keyArgs for child.layout() calls.
            var _childLayoutKeyArgs = {force: true, referenceSize: _layoutInfo.clientSize};

            // -----------
            // Layout state

            // A sides object that collects request paddings due to overflow paddings of side panels,
            // collected in phases 1 and 2.
            // Cleared on every phase's iteration, before the first side panel is laid out.
            // In the end, phase 3, if overflow paddings are not covered by existing margins,
            // the excess is converted in this panels' own paddings, by requesting a paddings increase
            // (and consequently repeating the whole layout).
            var _requestPaddings;

            //  settled in phase1
            var _margins = new pvc_Sides(0);
            var _fillSize = def.copyOwn(_layoutInfo.clientSize);

            //  settled in phase2
            var _childPaddings = new pvc_Sides(0);
            //  Cycle detection
            var _childPaddingsHistory = {};

            var _increasedClientSize = new pvc_Size(0, 0);

            var _fillChildren = [];
            var _sideChildren = [];

            var _isDisasterRecovery = false;

            if(_useLog) _me.log.group("CCC GRID LAYOUT clientSize = " + def.describe(_fillSize));
            try {
                doLayout();
            } finally {
                if(_useLog) _me.log.groupEnd();
            }

            _layoutInfo.gridMargins  = new pvc_Sides(_margins);
            _layoutInfo.gridPaddings = new pvc_Sides(_childPaddings);
            _layoutInfo.gridSize     = new pvc_Size(_fillSize);

            return _layoutInfo.clientSize; // may have increased.

            function doLayout() {

                if(_useLog) _me.log.group("Phase 0 - Initialize child panels");
                try {
                    _me._children.forEach(phase0_initChild);
                } finally {
                    if(_useLog) {
                        _me.log("Initial COMMON paddings = " + def.describe(_childPaddings));
                        _me.log.groupEnd();
                    }
                }

                var layoutChanged = 0;

                if(_useLog) _me.log.group("Phase 1 - Determine MARGINS and FILL SIZE from SIDE panels");
                try {
                    layoutChanged = phase1();
                } finally {
                    // -> fillSize now contains the size of the CENTER cell and is not changed any more
                    if(_useLog) {
                        _me.log("Final FILL margins = " + def.describe(_margins));
                        _me.log("Final FILL border size = " + def.describe(_fillSize));

                        _me.log.groupEnd();
                    }
                }

                // Size did not increase?
                if(!layoutChanged) {
                    if(_useLog) _me.log.group("Phase 2 - Determine COMMON PADDINGS");
                    try {
                        layoutChanged = phase2();
                    } finally {
                        if(_useLog) {
                            _me.log("Final FILL clientSize = " + def.describe({
                                    width:  (_fillSize.width ||0 - _childPaddings.width ||0),
                                    height: (_fillSize.height||0 - _childPaddings.height||0)}));
                            _me.log("Final COMMON paddings = " + def.describe(_childPaddings));

                            _me.log.groupEnd();
                        }
                    }
                }

                // Request paddings don't affect the layoutChanged flag.
                if(_canChangeInitial && !layoutChanged && _requestPaddings) {
                    _layoutInfo.requestPaddings = _requestPaddings;
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
                        _fillChildren.push(child);

                        var oneChildPaddings = child.paddings.resolve(_childLayoutKeyArgs.referenceSize);

                        // After the op. it's not a pvc.Side anymore, just an object with same named properties.
                        _childPaddings = pvc_Sides.resolvedMax(_childPaddings, oneChildPaddings);
                    } else {
                        /*jshint expr:true */
                        def.hasOwn(_aoMap, a) || def.fail.operationInvalid("Unknown anchor value '{0}'", [a]);

                        _sideChildren.push(child);
                    }
                }
            }
            //endregion

            //region Phase 1 - Determine MARGINS and FILL SIZE from SIDE panels
            function phase1() {
                var layoutChange = 0;
                var sideChildrenSizes = new Array(_sideChildren.length);

                var MAX_TIMES = 5;

                // Usually converges within 3 iterations.
                // NOTE: Looks like this could be optimized to avoid the last iteration, sometimes.
                var i = 0;
                do {
                    if(_useLog) _me.log.group("Iteration #" + (i + 1) + " / " + MAX_TIMES);
                    try {
                        layoutChange = phase1_iteration(sideChildrenSizes);
                        if(layoutChange && (layoutChange & OwnClientSizeChanged) !== 0) {
                            if(_useLog) _me.log("Restarting due to clientSize increase.");

                            return layoutChange;
                        }
                    } finally {
                        if(_useLog) _me.log.groupEnd();
                    }
                } while((++i < MAX_TIMES) && (layoutChange & MarginsChanged) !== 0);

                // ---

                // Remove invisible side children.
                // Update the position of every visible child.
                // The orthogonal position is dependent on the actual size of the child panel.
                // Just in case this is their last layout, though, their ortho position is also updated now.
                //
                // Margins are recreated, using sideChildrenSizes,
                // to generate the incremental position of children stacked to the same side.
                // This allows only setting positions at the end.
                var i = -1;
                var count = _sideChildren.length;
                var margins = new pvc_Sides(0);
                while(++i < count) {
                    var child = _sideChildren[i];
                    if(child.isVisible) {
                        var anchor = child.anchor;
                        var pos = margins[anchor] || 0;

                        child.position[anchor] = pos;

                        // align is associated with the _orthogonal_ side
                        // JIC this is this panel's last layout.
                        positionSide(child, child.align);

                        margins[anchor] = pos + sideChildrenSizes[i];
                    } else {
                        // Not considered anymore.
                        _sideChildren.splice(i, 1);
                        sideChildrenSizes.splice(i, 1);
                        count--;
                        i--;
                    }
                }

                // May be non-zero if i === MAX_TIMES
                // TODO: shouldn't the last margins be used and 0 be returned?
                return layoutChange;
            }

            function phase1_iteration(sideChildrenSizes) {
                var layoutChange = 0;

                _requestPaddings = null;

                var i = -1;
                var L = _sideChildren.length;
                while(++i < L) {
                    var child  = _sideChildren[i];

                    if(_useLog) child.log.group("Layout");
                    try {
                        var anchor = child.anchor;
                        var aoLen  = _aolMap[anchor];

                        // Remove previous iteration's length from layout state
                        var olenPrev = sideChildrenSizes[i];
                        if(olenPrev != null) {
                            _margins[anchor] -= olenPrev;
                            _fillSize[aoLen] += olenPrev;
                        }

                        _childLayoutKeyArgs.paddings  = filterAnchorPaddings(anchor, _childPaddings);
                        _childLayoutKeyArgs.canChange = _canChangeInitial;

                        child.layout(new pvc_Size(_fillSize), _childLayoutKeyArgs);

                        var olen = 0;

                        if(child.isVisible) {
                            if(checkChildSizeIncreased(child, _canChangeInitial)) return OwnClientSizeChanged;

                            olen = child[aoLen];

                            checkChildOverflowPaddingsChanged(child, _canChangeInitial);
                        }

                        // Ignore minor changes
                        if(Math.abs(olen - olenPrev) < 0.1) {
                            olen = olenPrev;
                        } else {
                            layoutChange |= MarginsChanged;
                        }

                        sideChildrenSizes[i] = olen;
                        if(olen) {
                            _margins[anchor] += olen;
                            _fillSize[aoLen] -= olen;
                        }
                    } finally {
                        if(_useLog) child.log.groupEnd();
                    }
                }

                return layoutChange;
            }
            //endregion

            //region Phase 2 - Determine COMMON PADDINGS
            // Cannot process overflow paddings before a full round, and having processed every requestPaddings.
            // Otherwise, would ask for overflowPaddings that later are covered by "fixed" plot paddings
            // as those imposed by axisOffset. See CDF-912

            // process size increase, paddings change and paddings loop.
            function phase2() {
                var layoutChange = 0;

                var MAX_TIMES = 9;

                var i = 0;
                do {
                    i++;
                    if(_useLog) _me.log.group("Iteration #" + i + " / " + MAX_TIMES);
                    try {
                        layoutChange = phase2_iteration(i === 1, i === MAX_TIMES);

                        if(layoutChange && (layoutChange & OwnClientSizeChanged) !== 0) {
                            if(_useLog) _me.log("Restarting due to clientSize increase.");

                            return layoutChange;
                        }
                    } finally {
                        if(_useLog) _me.log.groupEnd();
                    }
                } while((i < MAX_TIMES) && (layoutChange & NormalPaddingsChanged) !== 0);

                // TODO: When i === MAX_TIMES, can be non-zero. Should always return 0?
                return layoutChange;
            }

            // Normal paddings are usually imposed by the fill panels (from bubble sizes and axis offsets,
            // which are summarized by the plot panels).
            // Thus, in this phase, in the first iteration, right after phase 1 laying out the side panels,
            // it is ok to start directly with the fill panels.
            // Not only is the side panels' layout still valid, but it is the fill panels the more likely to
            // change paddings. In later iterations, as soon as paddings change, the side panels' layout
            // is no longer valid and must be performed again.
            // In particular, domain round paddings may change due to a different client size.
            //
            // When isLastIteration, unless client size changed, the result must be 0!
            function phase2_iteration(isFirstIteration, isLastIteration) {

                var canChangeChild = _canChangeInitial && !_isDisasterRecovery && !isLastIteration;
                var sideCount = _sideChildren.length;
                var children  = _sideChildren.concat(_fillChildren);
                var layoutChange;

                var i = (isFirstIteration ? sideCount : 0) - 1;
                var L = children.length;

                // First side child of an iteration resets the request paddings.
                if(i < 0) _requestPaddings = null;

                while(++i < L) {
                    var child  = children[i];
                    var isFill = i >= sideCount;

                    if(_useLog) child.log.group("Layout");
                    try {
                        phase2_layoutChild(child, canChangeChild, isFill);

                        if(child.isVisible) {
                            if(checkChildSizeIncreased(child, canChangeChild)) return OwnClientSizeChanged;

                            if((layoutChange = checkChildPaddingsChanged(child, canChangeChild))) {

                                // assert canChangeChild

                                if(layoutChange & LoopDetected) {
                                    // Oh no...
                                    _isDisasterRecovery = true;
                                    phase2_iteration(true);
                                    return 0; // DONE
                                }

                                // => layoutChange & NormalPaddingsChanged
                                return NormalPaddingsChanged;
                            }

                            if(!isFill) checkChildOverflowPaddingsChanged(child, canChangeChild);

                            // Position child
                            if(isFill) {
                                positionSide(child, "center"); // H
                                positionSide(child, "middle"); // V
                            } else {
                                // align is associated with the _orthogonal_ side
                                positionSide(child, child.align);
                            }
                        }
                    } finally {
                        if(_useLog) child.log.groupEnd();
                    }
                }

                return 0; // DONE
            }

            function phase2_layoutChild(child, canChangeChild, isFill) {
                var availableSize;
                if(isFill) {
                    availableSize = new pvc_Size(_fillSize);
                    _childLayoutKeyArgs.paddings = new pvc_Sides(_childPaddings);
                } else {
                    var anchor = child.anchor;
                    var al  = _alMap [anchor];
                    var aol = _aolMap[anchor];
                    availableSize = new pvc_Size();
                    availableSize[al ] = _fillSize[al];
                    availableSize[aol] = child[aol]; // fixed in phase 1

                    _childLayoutKeyArgs.paddings = filterAnchorPaddings(anchor, _childPaddings);
                }

                _childLayoutKeyArgs.canChange = canChangeChild;

                child.layout(availableSize, _childLayoutKeyArgs);
            }

            function positionSide(child, anchorOrAlign) {
                var pos, side;

                switch(anchorOrAlign) {
                    case 'top':
                    case 'bottom':
                    case 'left':
                    case 'right':
                        side = anchorOrAlign;
                        pos  = _margins[side];
                        break;

                    case 'fill':
                    case 'middle':
                        side = 'bottom';
                        pos  = (_margins.bottom + _fillSize.height / 2) - child.height / 2;
                        break;

                    case 'center':
                        side = 'left';
                        pos  = (_margins.left   + _fillSize.width  / 2) - child.width  / 2;
                        break;
                }

                child.position[side] = pos;
            }

            function checkChildPaddingsChanged(child, canChangeChild) {
                var anchor = child.anchor,
                    requestPaddings = child._layoutInfo.requestPaddings,
                    layoutChange = 0;

                // Greater paddings are needed?
                if(requestPaddings) {
                    if(_useLog && def.debug >= 10) {
                        _me.log("=> clientSize=" + def.describe(child._layoutInfo.clientSize));
                        _me.log("<= requestPaddings=" + def.describe(requestPaddings));
                    }

                    // Compare requested paddings with existing paddings
                    getAnchorPaddingsNames(anchor).forEach(function(side) {
                        var value = _childPaddings[side] || 0,
                            requestValue = Math.floor(10000 * (requestPaddings[side] || 0)) / 10000,
                            increase  = requestValue - value,
                            minChange = Math.max(1, Math.abs(0.01 * value));

                        // STABILITY requirement
                        if(increase !== 0 && Math.abs(increase) >= minChange) {
                            if(!canChangeChild) {
                                if(def.debug >= 2)
                                    _me.log.warn("CANNOT change but child wanted to: " + side + "=" + requestValue);

                            } else {
                                layoutChange |= NormalPaddingsChanged;
                                _childPaddings[side] = requestValue;

                                if(_useLog) _me.log("Changed paddings " + side + " <- " + requestValue);
                            }
                        }
                    });

                    if(layoutChange) {
                        var paddingKey = getPaddingsKey(_childPaddings, 0);
                        if(def.hasOwn(_childPaddingsHistory, paddingKey)) {
                            // LOOP detected
                            if(def.debug >= 2) _me.log.warn("LOOP detected!!!!");

                            layoutChange |= LoopDetected;
                        } else {
                            _childPaddingsHistory[paddingKey] = true;
                        }

                        // Calculate width and height
                        _childPaddings.width  = _childPaddings.left + _childPaddings.right ;
                        _childPaddings.height = _childPaddings.top  + _childPaddings.bottom;
                    }
                }

                return layoutChange;
            }
            //endregion

            function checkChildSizeIncreased(child, canChangeChild) {
                var layoutChange = 0;

                function checkDimension(a_length) {
                    var availableLen = _fillSize[a_length] || 0;
                    var requestedLen = availableLen + _increasedClientSize[a_length],
                        childLength  = child[a_length] || 0,
                        excessLen    = childLength - requestedLen;

                    if(excessLen > pv.epsilon) {
                        if(!canChangeChild) {
                            if(def.debug >= 2)
                                _me.log.warn("CANNOT change child size but child wanted to: " +
                                    a_length + "=" + childLength +
                                    " available=" + requestedLen);
                        } else {
                            layoutChange |= OwnClientSizeChanged;

                            _increasedClientSize[a_length] += excessLen;
                            _layoutInfo.clientSize[a_length] += excessLen;

                            if(_useLog) _me.log("changed child size " + a_length + " <- " + childLength);
                        }
                    }
                }

                if(child.anchor === "fill")
                    pvc_Size.names.forEach(checkDimension);
                else
                    checkDimension(child.anchorLength());

                return layoutChange;
            }

            function checkChildOverflowPaddingsChanged(child, canChangeChild) {
                var layoutChange = 0;

                // If the layout phase corresponds to a re-layout (chart is a re-render),
                // don't allow overflowPaddings, since the preserved paddings already account
                // for the final overflowPaddings in the first render.

                var overflowPaddings;
                if(_me.chart._preserveLayout || !(overflowPaddings = child._layoutInfo.overflowPaddings))
                    return layoutChange;

                if(_useLog) child.log("<= overflowPaddings=" + def.describe(overflowPaddings));

                var ownPaddings = _layoutInfo.paddings;

                getAnchorPaddingsNames(child.anchor).forEach(function(side) {
                    if(overflowPaddings.hasOwnProperty(side)) {
                        var value    = ownPaddings[side] || 0,
                            // corners absorb some of it
                            newValue = (Math.floor(10000 * (overflowPaddings[side] || 0)) / 10000) - _margins[side];

                        if(pv.floatGreater(newValue, value)) {
                            if(!canChangeChild) {
                                if(def.debug >= 2)
                                    child.log.warn("CANNOT change overflow paddings but child wanted to: " + side + "=" + newValue);
                            } else {
                                layoutChange |= OverflowPaddingsChanged;

                                if(!_requestPaddings) _requestPaddings = new pvc_Sides(0);

                                _requestPaddings[side] = Math.max(_requestPaddings[side] || 0, newValue);

                                if(_useLog) child.log("Changed overflow paddings " + side + " <- " + newValue);
                            }
                        }
                    }
                });

                return layoutChange;
            }
        }
    });

    //region Layout Helpers
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
