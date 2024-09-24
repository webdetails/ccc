/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_Sides:true, pvc_Size:true */

def
.type('pvc.GridDockingPanel', pvc.ContentPanel)
.add({
    _getFillSizeMin: function() {
        return null;
    },

    /**
     * Implements a docking/grid layout variant.
     * <p>
     * The layout contains 5 target positions: top, bottom, left, right and center.
     * These are mapped to a 3x3 grid placed inside the panel's client-size.
     * The corner cells always remain empty. In the center cell, child panels are superimposed.
     * In the side cells, child panels are stacked.
     * </p>
     *
     * <p>
     * All child panels have margins = 0 and their position and size are controlled by the layout.
     * a) Width is shared by the top, center and bottom panels.
     * b) Height is shared by the left, center and right panels.
     *
     * Actually, if any of the panels asks for a greater than available shared length,
     * that excess length is propagated outward, to this panel's parent,
     * by requesting the excess length for this panel as well.
     *
     * If, instead, any of the panels uses a lower shared length, it will be positioned centered in the
     * available length.
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
     * Side child panel's can inform of optional content overflow, in orthogonal directions,
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
     * If the corner space is not enough to absorb the optional content overflow,
     * the excess is converted into paddings of the grid-layout panel itself,
     * requesting new paddings to the layout's parent panel.
     * </p>
     *
     * @override
     */
    _calcLayout: function(_layoutInfo) {

        var _me = this;
        if(!_me._children) return;

        var _useLog = def.debug >= 10;

        var _canChangeInitial = _layoutInfo.restrictions.canChange !== false;

        // Anchor properties conversion maps.
        var _aolMap = pvc.BasePanel.orthogonalLength;
        var _alMap  = pvc.BasePanel.parallelLength;

        // LayoutChanged bit codes.
        var ContentOverflowChanged = 2;
        var OptionalContentOverflowChanged = 4;
        var OwnClientSizeChanged = 8;
        var MarginsChanged = 16;

        // keyArgs for child.layout() calls.
        var _childLayoutKeyArgs = {force: true};

        // -----------
        // Layout state

        // A sides object that collects optional content overflow from side panels,
        // collected in phases 1 and 2.
        // Cleared on every phase's iteration, before the first side panel is laid out.
        // In the end, phase 3, if optional content overflow is not covered by existing margins,
        // the excess is converted in this panels' own content overflow, and consequently,
        // repeating its layout with new paddings.
        var _contentOverflowOptional;

        // Settled in phase1.
        // The final fillSize must be greater than or equal to fillSizeMin; checked on the end of phase1.
        var _margins = new pvc_Sides(0);
        var _fillSize = def.copyOwn(_layoutInfo.clientSize);
        var _fillSizeMin = this._getFillSizeMin();
        if(_fillSizeMin) _fillSizeMin = _fillSizeMin.resolve(null); // resolve(null) enforces using only absolute sizes

        // How much has been incremented on our own client size,
        // due to calling checkChildSizeIncreased or checkFillSizeMin
        var ownClientSizeIncrease = {width: 0, height: 0};

        //  Settled in phase2
        var _contentOverflow = new pvc_Sides(0);
        var _hasContentOverflow = false;

        // ---

        var _fillChildren = [];
        var _sideChildren = [];

        if(_useLog) _me.log.group("CCC GRID LAYOUT");
        try {
            doLayout();
        } finally {
            if(_useLog) _me.log.groupEnd();
        }

        _layoutInfo.gridMargins  = pvc_Sides.updateSize(_margins);
        _layoutInfo.gridPaddings = pvc_Sides.updateSize(_contentOverflow);
        _layoutInfo.gridSize     = new pvc_Size(_fillSize);

        return _layoutInfo.clientSize; // may have increased.

        function doLayout() {
            var layoutChange = 0;
            //if(_useLog) _me.log.group("Phase 0 - Initialize child panels");
            try {
                _me._children.forEach(phase0_initChild);
            } finally {
            //    if(_useLog) _me.log.groupEnd();
            }

            if(_useLog) _me.log.group("Phase 1 - Determine MARGINS and FILL SIZE from SIDE panels");
            try {
                layoutChange = phase1();
            } finally {
                // -> fillSize now contains the size of the CENTER cell and is not changed any more
                if(_useLog) {
                    _me.log("Final FILL margins = " + def.describe(_margins));
                    _me.log("Final FILL border size = " + def.describe(_fillSize));

                    _me.log.groupEnd();
                }
            }

            // Also check fill size min
            layoutChange = layoutChange | checkFillSizeMin(_canChangeInitial);

            // Size did not increase?
            if(!layoutChange) {
                if(_useLog) _me.log.group("Phase 2 - Determine COMMON PADDINGS");
                try {
                    layoutChange = phase2();
                } finally {
                    if(_useLog) {
                        _me.log("Final COMMON paddings  = " + def.describe(_contentOverflow));
                        _me.log("Final FILL client size = " + def.describe({
                                width:  (_fillSize.width ||0) - (_contentOverflow.width ||0),
                                height: (_fillSize.height||0) - (_contentOverflow.height||0)
                            }));
                        _me.log.groupEnd();
                    }
                }
            }

            // Optional content overflow doesn't affect the `layoutChange` flag.
            if(_canChangeInitial && !layoutChange && _contentOverflowOptional) {
                _layoutInfo.contentOverflow = _contentOverflowOptional;
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
                if(a === 'fill')
                    _fillChildren.push(child);
                else
                    _sideChildren.push(child);
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
                i++;
                if(_useLog) _me.log.group("Iteration #" + i + " / " + MAX_TIMES);
                try {
                    layoutChange = phase1_iteration(sideChildrenSizes, i === MAX_TIMES);
                    if(layoutChange && (layoutChange & OwnClientSizeChanged) !== 0) {
                        if(_useLog) _me.log("Restarting due to clientSize increase.");

                        return layoutChange;
                    }
                } finally {
                    if(_useLog) _me.log.groupEnd();
                }
            } while((i < MAX_TIMES) && (layoutChange & MarginsChanged) !== 0);

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

            return 0;
        }

        function phase1_iteration(sideChildrenSizes, isLastIteration) {
            var layoutChange = 0;

            var canChangeChild = _canChangeInitial && !isLastIteration;

            _contentOverflowOptional = null;

            _contentOverflow = new pvc_Sides(0);
            _hasContentOverflow = false;

            var i = -1;
            var L = _sideChildren.length;
            while(++i < L) {
                var child = _sideChildren[i];

                if(_useLog) child.log.group("Layout");
                try {
                    var anchor  = child.anchor;
                    var p_alen  = _alMap [anchor];
                    var p_aolen = _aolMap[anchor];

                    // Remove previous iteration's length from layout state
                    var olenPrev = sideChildrenSizes[i];
                    if(olenPrev != null) {
                        _margins[anchor]  -= olenPrev;
                        _fillSize[p_aolen] += olenPrev;
                    }

                    var sizeRef = {width: null, height: null};
                    // E.g. xAxis left/right paddings are relative to the fill area width,
                    // to satisfy axis offset semantics.
                    sizeRef[p_alen]  = _fillSize[p_alen];
                    // E.g. xAxisSize option is relative to the grid's client height.
                    sizeRef[p_aolen] = _layoutInfo.clientSize[p_aolen];

                    // Make things converge a bit faster by antecipating the assumption of the minimum `p_alen`.
                    var sizeAvail = new pvc_Size(_fillSize);
                    if(_fillSizeMin && sizeAvail[p_alen] < _fillSizeMin[p_alen]) {
                        sizeAvail[p_alen] = _fillSizeMin[p_alen];
                    }

                    _childLayoutKeyArgs.sizeAvailable = sizeAvail;
                    _childLayoutKeyArgs.sizeRef = sizeRef;
                    //_childLayoutKeyArgs.paddings = null;//{}; // 0
                    _childLayoutKeyArgs.canChange = canChangeChild;

                    child.layout(_childLayoutKeyArgs);

                    var olen;

                    if(!child.isVisible) {
                        olen = 0;
                    } else {
                        // Check non-ortho length increase
                        if(checkChildSizeIncreased(child, canChangeChild)) return OwnClientSizeChanged;

                        // Check ortho-length changes
                        if(olenPrev == null || Math.abs(child[p_aolen] - olenPrev) > pvc.roundPixel.epsilon) {
                            olen = child[p_aolen];
                        } else {
                            olen = olenPrev;
                        }
                    }

                    if(olenPrev == null || olen != olenPrev) layoutChange |= MarginsChanged;

                    sideChildrenSizes[i] = olen;
                    if(olen) {
                        _margins[anchor]  += olen;
                        _fillSize[p_aolen] -= olen;
                    }

                    // Requires an updated _fillSize
                    if(child.isVisible)
                        checkChildOptionalContentOverflowChanged(child, canChangeChild);

                } finally {
                    if(_useLog) child.log.groupEnd();
                }
            }

            return layoutChange;
        }
        //endregion

        //region Phase 2 - Determine COMMON PADDINGS
        // Cannot process optional content overflow before a full round, and having processed every contentOverflow.
        // Otherwise, would ask for contentOverflowOptional that later are covered by "fixed" plot paddings
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

                    // When i < MAX_TIMES, layoutChange can be one of:
                    //   OwnClientSizeChanged, ContentOverflowChanged
                    // WHen i === MAX_TIMES, layoutChange must be 0.

                    if(layoutChange && (layoutChange & OwnClientSizeChanged) !== 0) {
                        if(_useLog) _me.log("Restarting due to clientSize increase.");

                        return layoutChange;
                    }
                } finally {
                    if(_useLog) _me.log.groupEnd();
                }
            } while((i < MAX_TIMES) && (layoutChange & ContentOverflowChanged) !== 0);

            return 0;
        }

        // Normal paddings are usually imposed by the fill panels (from bubble sizes and axis offsets,
        // which are summarized by the plot panels).
        // Thus, in this phase, in the first iteration, right after phase 1 laying out the side panels,
        // it is better to start directly with the fill panels.
        // Not only is the layout of the side panels still valid,
        // but it is the fill panels that are more likely to change the paddings.
        // If these change the paddings, the side panels' layout become invalid, and a new iteration is needed.
        // (in particular, domain round paddings may change due to different client size)
        // All subsequent iterations start from the side panels.
        //
        // When isLastIteration, unless client size changed, the result must be 0!
        function phase2_iteration(isFirstIteration, isLastIteration) {

            var canChangeChild = _canChangeInitial && !isLastIteration;
            var sideCount = _sideChildren.length;
            var children  = _sideChildren.concat(_fillChildren);
            var layoutChange;

            // TODO: Can optimize these cases or not?
            // If has content overflow, need to relayout the side panels...
            //var i = (isFirstIteration && !_hasContentOverflow ? sideCount : 0) - 1;
            var i = -1;
            var L = children.length;

            // First side child of an iteration resets the request paddings.
            if(i < 0) _contentOverflowOptional = null;

            while(++i < L) {
                var child  = children[i];
                var isFill = i >= sideCount;

                if(_useLog) child.log.group("Layout");
                try {
                    phase2_layoutChild(child, canChangeChild, isFill);

                    if(child.isVisible) {
                        if(checkChildSizeIncreased(child, canChangeChild)) return OwnClientSizeChanged;

                        if((layoutChange = checkChildContentOverflowChanged(child, canChangeChild))) {

                            // assert canChangeChild

                            // => layoutChange & ContentOverflowChanged
                            return ContentOverflowChanged;
                        }

                        if(!isFill) checkChildOptionalContentOverflowChanged(child, canChangeChild);

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
            var sizeAvail, sizeFix, sizeRef, pads;
            if(isFill) {
                sizeAvail = pvc_Size.clone(_fillSize);
                sizeRef   = _fillSize;
                pads      = def.copyOwn(_contentOverflow);
            } else {
                var anchor = child.anchor;
                var al  = _alMap [anchor];
                var aol = _aolMap[anchor];

                sizeFix = {width: null, height: null};
                sizeFix[al ] = _fillSize[al];
                sizeFix[aol] = child[aol]; // fixed in phase 1

                sizeRef = {width: null, height: null};
                sizeRef[al ] = _fillSize[al];
                sizeRef[aol] = _layoutInfo.clientSize[aol];

                pads = def.copyOwn(pvc_Sides.filterAnchor(anchor, _contentOverflow));
            }

            _childLayoutKeyArgs.sizeAvailable = sizeAvail;
            _childLayoutKeyArgs.size = sizeFix;
            _childLayoutKeyArgs.sizeRef = sizeRef;
            _childLayoutKeyArgs.paddings = pads;
            _childLayoutKeyArgs.canChange = canChangeChild;

            child.layout(_childLayoutKeyArgs);
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
        //endregion

        function checkChildSizeIncreased(child, canChangeChild) {
            var layoutChange = 0;
            var sizeIncrease = child.getLayout().sizeIncrease;

            if(sizeIncrease) {
                if(child.anchor === "fill")
                    pvc_Size.names.forEach(checkDimension);
                else
                    checkDimension(child.anchorLength());
            }

            return layoutChange;

            function checkDimension(a_len) {
                var addLen = sizeIncrease[a_len];
                if(addLen > pvc.roundPixel.epsilon) {
                    if(!canChangeChild) {
                        if(_useLog)
                            child.log.warn("Child wanted more " +
                                a_len + ", but layout iterations limit has been reached.");
                    } else {
                        layoutChange |= OwnClientSizeChanged;

                        _layoutInfo.clientSize[a_len] += addLen;

                        ownClientSizeIncrease[a_len] += addLen;
                    }
                }
            }
        }

        function checkFillSizeMin(canChange) {

            var layoutChange = 0;

            if(_fillSizeMin) {
                checkDimension('width');
                checkDimension('height');
            }

            return layoutChange;

            function checkDimension(a_len) {
                var addLen = _fillSizeMin[a_len] - _fillSize[a_len];

                // Discount for any clientSize increase already performed by checkChildSizeIncreased.
                addLen -= ownClientSizeIncrease[a_len];

                if(addLen > pvc.roundPixel.epsilon) {
                    if(!canChange) {
                        if(_useLog)
                            _me.log.warn("Wanted more fill " + a_len + ", " + addLen +
                                ", but layout iterations limit has been reached.");
                    } else {
                        layoutChange |= OwnClientSizeChanged;

                        _layoutInfo.clientSize[a_len] += addLen;

                        if(_useLog)
                            _me.log.warn("Increasing client " + a_len + " by " + addLen + " to satisfy minimum fill " + a_len + ".");
                    }
                }
            }
        }

        function checkChildContentOverflowChanged(child, canChangeChild) {
            var layoutChange = 0;

            var contentOverflow = child._layoutInfo.contentOverflow;
            if(contentOverflow) {
                if(_useLog) child.log("ContentOverflow=" + def.describe(contentOverflow));

                // Compare child content overflow with common content overflow
                pvc_Sides.getAnchorSides(child.anchor).forEach(function(side) {
                    // Precision is 1/10th of a pixel.

                    var value    = _contentOverflow[side] || 0;
                    var valueNew = contentOverflow[side] || 0;
                    if((valueNew - value) > pvc.roundPixel.epsilon) {
                        if(!canChangeChild) {
                            if(_useLog)
                                child.log.warn("CANNOT change but child wanted to: " + side + "=" + valueNew);

                        } else {
                            layoutChange |= ContentOverflowChanged;

                            _contentOverflow[side] = valueNew;

                            if(_useLog) child.log("Changed content overflow: " + side + " <- " + valueNew);
                        }
                    }
                });

                // Calculate width and height
                if(layoutChange) pvc_Sides.updateSize(_contentOverflow);
            }

            return layoutChange;
        }

        function checkChildOptionalContentOverflowChanged(child, canChangeChild) {
            var layoutChange = 0;

            // If the layout phase corresponds to a re-layout (chart is a re-render),
            // don't allow contentOverflowOptional, since the preserved paddings already account
            // for the final contentOverflowOptional in the first render.

            var contentOverflowOptional;
            if(_me.chart._preserveLayout || !(contentOverflowOptional = child._layoutInfo.contentOverflowOptional))
                return layoutChange;

            if(_useLog) child.log("<= contentOverflowOptional=" + def.describe(contentOverflowOptional));

            var ownPaddings = _layoutInfo.paddings;
            var a_len = child.anchorLength();

            pvc_Sides.getAnchorSides(child.anchor).forEach(function(side) {
                if(contentOverflowOptional.hasOwnProperty(side)) {
                    // Precision is 1/10th of a pixel.

                    var value = ownPaddings[side] || 0,
                        // This is the overflow from the clientSize + padding box.
                        // If the panel uses a clientSize less than _fillSize, the overflow is not the actual fill overflow.
                        childOverflow = contentOverflowOptional[side] || 0,
                        childLen      = child._layoutInfo.size[a_len],
                        fillOverflow  = Math.max(0, (childLen + childOverflow) - _fillSize[a_len]),
                        // corners absorb some of it
                        valueNew = Math.max(0, fillOverflow - _margins[side]);

                    if(valueNew - value > pvc.roundPixel.epsilon) {
                        if(!canChangeChild) {
                            if(def.debug >= 2)
                                child.log.warn("CANNOT change optional content overflow but child wanted to: " + side + "=" + valueNew);
                        } else {
                            layoutChange |= OptionalContentOverflowChanged;

                            // Must preserve existing paddings.
                            if(!_contentOverflowOptional) _contentOverflowOptional = new pvc_Sides(ownPaddings);

                            _contentOverflowOptional[side] = Math.max(_contentOverflowOptional[side] || 0, valueNew);

                            if(_useLog) child.log("Changed optional content overflow " + side + " <- " + valueNew);
                        }
                    }
                }
            });

            return layoutChange;
        }
    }
});
