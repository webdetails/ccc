(function() {
    // Override the way jQuery tipsy obtains options,
    // allowing to return per element options.
    $.fn.tipsy.elementOptions = function(elem, options) {
        // Obtain element options from the mark property "tooltipOptions".

        var markOpts = elem.$tooltipOptions;
        options = $.extend({}, options, markOpts || {}, {
            // Always use gravity from main options
            gravity: options.gravity
        });

        return options;
    };

    var _nextTipsyId = 0;

    pv.Behavior.tipsy = function(opts) {
        /**
         * One tip is reused per behavior instance.
         * Typically there is one behavior instance per mark,
         * and this is reused across all its mark instances.
         */

        if(!opts) opts = {};

        var $fakeTipTarget, // target div
            $targetElem = null,
            _tipsyId = _nextTipsyId++,
            _nextOperId = 0,
            _prevMousePage,
            _mousePage,
            _userGravity,
            _renderId,
            _index,
            _scenes,
            _mark = null,
            _delayOut = opts.delayOut,
            _id,
            $canvas,
            _isEnabledFun = opts.isEnabled,
            _sharedTipsyInfo;

        function getTooltipText() {
            var instance = _mark.instance();
            var title =
                // Has a tooltip property?
                _mark.properties.tooltip            ? instance.tooltip :

                // A mark method that is not a property?
                typeof _mark.tooltip === 'function' ? _mark.tooltip() :

                // Title or text
                (instance.title || instance.text);

            // Allow deferred tooltip creation!
            if(typeof title === 'function') title = title();

            return title || ""; // Prevent "undefined" from showing up
        }

        function getInstanceBounds() {
            var instance = _mark.instance();

            /*
             * Compute bounding box.
             * TODO: support area, lines.
             */
            var left, top, width, height;
            if (_mark.properties.width) {
                // Bar, panel
                var bounds = getVisibleScreenBounds(_mark);

                left = bounds.left;
                top  = bounds.top;
                width  = bounds.width;
                height = bounds.height;

            } else {
                /* Compute the transform to offset the tooltip position. */
                var t = _mark.toScreenTransform();
                var radius;
                if(_mark.properties.outerRadius){
                    // Wedge
                    var midAngle = instance.startAngle + instance.angle / 2;
                    radius = instance.outerRadius;// - (instance.outerRadius - instance.innerRadius) * 0.05;

                    left = t.x + instance.left + radius * Math.cos(midAngle);
                    top  = t.y + instance.top  + radius * Math.sin(midAngle);

                } else if(_mark.properties.shapeRadius){
                    if(getTooltipOptions().ignoreRadius) {
                        radius = 0;
                    } else {
                        radius = Math.max(2, instance.shapeRadius);
                    }

                    var cx = instance.left;
                    var cy = instance.top;

                    switch(instance.shape){
                        case 'diamond':
                            radius *= Math.SQRT2;
                            // NOTE fall through
                            break;

                        case 'circle':
                            // Want the inscribed square
                            radius /= Math.SQRT2;
                            break;
                    }

                    left = (cx - radius) * t.k + t.x;
                    top  = (cy - radius) * t.k + t.y;
                    height = width = 2*radius * t.k;


                } else {
                    left = instance.left * t.k + t.x;
                    top  = instance.top  * t.k + t.y;
                }
            }

            var left2 = Math.ceil(left);
            var top2  = Math.ceil(top);

            var leftE = left2 - left; // >= 0 / < 1
            var topE  = top2  - top;  // >= 0 / < 1

            width  = Math.max(1, Math.floor((width  || 0) - leftE));
            height = Math.max(1, Math.floor((height || 0) - topE ));

            return {left: left2, top: top2, width: width, height: height};
        }

        // -------------------
        // TIPSY Gravity

        /**
         * Gravity is the direction of the tooltip arrow.
         * The arrow points to the target element.
         *
         *                                gravity = 'w'
         *    +-----------+                   n
         *    |           |              +----+----+
         *    |           |              |         |
         *    |   target  |          w <=+ Tooltip + e
         *    |           |              |         |
         *    |           |              +----+----+
         *    +-----------+                   s
         *
         */

        var _gravities = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

        function getTooltipOptions() {
            return (_mark && _mark.tooltipOptions) || opts;
        }

        // in pv context
        function updateUserGravity() {
            var opts = getTooltipOptions(),
                grav = pv.get(opts, 'gravity');

            if(grav && typeof grav === 'function') grav = grav.call(_mark);

            if(_tip.debug >= 21) _tip.log("[TIPSY] #" + _tipsyId + " Update User Gravity " + grav);

            return (_userGravity = grav || $.fn.tipsy.defaults.gravity);
        }

        function calculateGravity(tipSize, calcPosition) {
            /*jshint expr:true */

            // <Debug>
            // jquery.tipsy calls this on the element to which it is attached
            if(this !== $fakeTipTarget[0]) throw new Error("Assertion failed.");
            // </Debug>

            var $win = $(window);
            var scrollOffset = {width: $win.scrollLeft(), height: $win.scrollTop()};
            var pageSize     = {width: $win.width(),      height: $win.height()   };

            // Desired gravity (assumes updateUserGravity was called previously)
            var gravity = _userGravity;

            // backwards compatibility for special gravity, 'c',
            // added to jquery.tipsy to avoid the style applying to the arrow,
            // causing it to not show.
            if(gravity === 'c') gravity = 'w';

            var bestScore = scoreGravity(gravity);
            if(!bestScore.isTotal) {
                // Find the best scored gravity.
                // Start from the position *after* 'gravity' in the gravities array,
                // turning around when the end is reached.

                var g = _gravities.indexOf(gravity);
                for(var n = 1, L = _gravities.length ; n < L ; n++){
                    var i = (g + n) % L;
                    bestScore = chooseScores(bestScore, scoreGravity(_gravities[i]));
                }

                if(_tip.debug >= 21 && gravity !== bestScore.gravity)
                    _tip.log("[TIPSY] #" + _tipsyId + " Choosing gravity '" + bestScore.gravity + "' over '" + gravity + "'");

                gravity = bestScore.gravity;
            }

            if(_tip.debug >= 21) _tip.log("[TIPSY] #" + _tipsyId + " Gravity '" + gravity + "'");

            return gravity;

            function scoreGravity(gravity) {
                var tp = calcPosition(gravity);
                return scorePosition(gravity, tp);
            }

            function scorePosition(gravity, tp){
                var wScore = calcPosScore(tp.left, 'width' );
                var hScore = calcPosScore(tp.top,  'height');

                var isMouseInside = _mousePage && !opts.followMouse;
                if(isMouseInside) {
                    var tipRect  = new pv.Shape.Rect(tp.left, tp.top, tipSize.width, tipSize.height);
                    isMouseInside = tipRect.containsPoint(_mousePage);
                }

                var isTotal = !isMouseInside && wScore.fits && hScore.fits;
                var value = wScore.value +
                            hScore.value +
                            (2 - gravity.length) + // prefer simple gravities
                            (isMouseInside ? -1000 : 0);
                return {
                    gravity:   gravity,
                    width:     wScore,
                    height:    hScore,
                    value:     value,
                    isMouseInside: isMouseInside,
                    isTotal:   isTotal,
                    isPartial: (wScore.fits || hScore.fits)
                };
            }

            function calcPosScore(absPos, a_len){
                /*global window:true*/
                var maxLen = pageSize[a_len];
                var len    = tipSize[a_len];

                var pos  = absPos - scrollOffset[a_len];
                var opos = maxLen - (pos + len);
                var fits = pos >= 0 && opos >= 0;

                // Negative positions (off-screen) are amplified 4 times
                // so that they negatively impact the score more than positive ones.
                var value = (pos  >= 0 ?  pos : (4 *  pos)) +
                            (opos >= 0 ? opos : (4 * opos));

                return {fits: fits, value: value};
            }
        }

        function chooseScores(score1, score2){
            if(score1.isTotal) {
                if(!score2.isTotal)   return score1;
            } else if(score2.isTotal) {
                if(!score1.isTotal)   return score2;
            } else if(score1.isPartial) {
                if(!score2.isPartial) return score1;
            } else if(score2.isPartial) {
                if(!score1.isPartial) return score2;
            }

            // Are of same type. Can compare values.
            return score2.value > score1.value ? score2 : score1;
        }

        /*
         * Places and sizes the tip target div
         * on the specified bounds.
         *
         * Tipsy gravities point to this div.
         */
        function setFakeTipTargetBounds(bounds) {
            $fakeTipTarget.css({
                left:   bounds.left + parseFloat($canvas.css("padding-left")) + $canvas.scrollLeft(),
                top:    bounds.top  + parseFloat($canvas.css("padding-top" )) + $canvas.scrollTop(),
                width:  bounds.width,
                height: bounds.height
            });
        }

        // in pv context
        function createTipsy(mark) {
            if(_tip.debug >= 20) _tip.log("[TIPSY] #" + _tipsyId + " Creating _id=" + _id);

            var c = mark.root.canvas();

            $canvas = $(c);

            // Need a canvas that starts its own coordinate system
            // so that the fakeTipTarget's position:absolute is relative to it and works.
            // TODO: Ideally, we would be able to determine its position even if the
            // nearest positioned ancestor is not the canvas.
            var position = c.style.position;
            if(!position || position === "static")
                c.style.position = "relative";

            $canvas.mouseleave(hideTipsy);

            if(opts.usesPoint && opts.followMouse)
                mark.root.event('mousemove', doFollowMouse);

            // ------------

            initTipsyCanvasSharedInfo();

            // ------------

            // Use the specified div _id or create a hopefully unique one
            if(!_id) _id = "tipsyPvBehavior_" + new Date().getTime();

            /*global document:true*/
            var fakeTipTarget = document.getElementById(_id);
            if(!fakeTipTarget) {
                if(_tip.debug >= 20) _tip.log("[TIPSY] #" + _tipsyId + " Creating Fake Tip Target=" + _id);

                fakeTipTarget = document.createElement("div");
                fakeTipTarget.id = _id;
                fakeTipTarget.className = "fakeTipsyTarget";
                c.appendChild(fakeTipTarget);
            }

            var fakeStyle = fakeTipTarget.style;
            fakeStyle.padding = '0px';
            fakeStyle.margin  = '0px';
            fakeStyle.position = 'absolute';
            fakeStyle.pointerEvents = 'none'; // ignore mouse events (does not work on IE)
            fakeStyle.display = 'block';
            fakeStyle.zIndex = -10;

            $fakeTipTarget = $(fakeTipTarget);

            updateTipDebug();

            // Create the tipsy instance
            $fakeTipTarget.removeData('tipsy'); // Otherwise a new tipsy is not created, if there's one there already.

            // So that #elementOptions works
            $fakeTipTarget[0].$tooltipOptions = mark.tooltipOptions;

            var opts2 = createTipsyOptions(opts);

            $fakeTipTarget.tipsy(opts2);
        }

        function createTipsyOptions(optionsBase) {

            var options = Object.create(optionsBase);

            // Gravity is intercepted to allow for off screen bounds reaction.
            options.gravity = calculateGravity;
            options.delayOut = 0;

            // Trigger must be manual because the mouse entering/leaving
            // the **fake target** is not always adequate.
            // When followMouse=true, the fake target is always moving, and is not usable
            // for bounds control. What matters is the real SVG target.
            options.trigger = 'manual';

            if(options.animate == null) {
                options.animate = options.followMouse ? 0 : 400;
            }

            return options;
        }

        function initTipsyCanvasSharedInfo() {
            _sharedTipsyInfo = $canvas.data('tipsy-pv-shared-info');
            if(_sharedTipsyInfo) {
                var createId = ($canvas[0].$pvCreateId || 0);

                if(_sharedTipsyInfo.createId === createId){
                    _sharedTipsyInfo.behaviors.push(disposeTipsy);
                    return;
                }

                // Protovis has recreated the whole structure
                // So all existing tipsies (but this one) are invalid...
                // Hide them and let GC do the rest
                _sharedTipsyInfo.behaviors.forEach(function(dispose) { dispose(); });
            }

            _sharedTipsyInfo = {
                createId:  ($canvas[0].$pvCreateId || 0),
                behaviors: [disposeTipsy]
            };

            $canvas.data('tipsy-pv-shared-info', _sharedTipsyInfo);
        }

        function updateTipDebug() {
            if($fakeTipTarget) {
                if(_tip.debug >= 22) {
                    $fakeTipTarget.css({
                        borderColor: 'red',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        zIndex:      1000
                    });
                } else {
                    $fakeTipTarget.css({
                        borderWidth: '0px',
                        zIndex:      -10
                    });
                }
            }
        }

        // Canvas relative mouse coordinates
        function getMouseBounds(ev) {
            if(!ev) ev = pv.event;

            var delta = 5,
                offset = $canvas.offset(),
                left = offset.left + parseFloat($canvas.css("padding-left") || 0),
                top = offset.top + parseFloat($canvas.css("padding-top") || 0);

            return {
                left:   ev.pageX - left - delta,
                top:    ev.pageY - top - delta,
                width:  10 + 2 * delta,
                height: 20
            };
        }

        // in pv context
        function setMark(mark) {
            if(!mark) mark = null;

            var index, renderId, scenes;

            if(mark !== _mark) {
                _mark = mark;

                if(mark) {
                    _scenes = mark.scene;
                    _index = getOwnerInstance(_scenes, _mark.index);
                    _renderId = mark.renderId();
                } else {
                    _renderId = _scenes = _index = null;
                    if(_tip.debug >= 20) _tip.log("[TIPSY] #" + _tipsyId + " Cleared Mark");
                }
            } else if(mark) {
                if(_scenes !== (scenes = mark.scene)) {
                    _scenes  = scenes;

                    _index    = getOwnerInstance(_scenes, _mark.index);
                    _renderId = mark.renderId();

                    // Take care to redirect to the owner instance, if any.
                } else if(_index !== (index = getOwnerInstance(_scenes, _mark.index))) {
                    // Implies later doing pv context switch!!
                    _index = index;

                    _renderId = mark.renderId();
                } else if(_renderId !== (renderId = mark.renderId())) {
                    _renderId = renderId;
                } else {
                    // NO CHANGE
                    return false;
                }
            } else {
                // NO CHANGE
                return false;
            }

            // So that #elementOptions works
            $fakeTipTarget[0].$tooltipOptions = _mark && _mark.tooltipOptions;

            var opts2 = createTipsyOptions(opts);

            $fakeTipTarget.tipsy('setOptions', opts2); // does not update the tooltip UI

            if(mark && _tip.debug >= 20)
                _tip.log("[TIPSY] #" + _tipsyId +
                    " Set Mark State to " + mark.type +
                    " scenes: #"  + _scenes.length +
                    " index: "    + _index +
                    " renderId: " + _renderId);

            return true;
        }

        // in pv context
        function setTarget(targetElem, mark) {
            // Also normalizes undefined values to null.
            if(!targetElem || !mark) targetElem = mark = null;

            var changedTargetElem =
                    (!$targetElem && targetElem) ||
                    ( $targetElem && $targetElem[0] !== targetElem);

            if(changedTargetElem) {
                if(_tip.debug >= 20)
                    _tip.log("[TIPSY] #" + _tipsyId + " " +
                        (targetElem ? "Changing target element " + targetElem.tagName + "." : "Clearing target element."));

                if(changedTargetElem) {
                    if($targetElem) {
                        $targetElem.off('mousemove',  onTargetElemMouseMove);
                        $targetElem.off('mouseleave', hideTipsy);
                    }

                    $targetElem = targetElem ? $(targetElem) : null;
                }

                setMark(mark);

                if($targetElem) {
                    $targetElem.mousemove(onTargetElemMouseMove);
                    $targetElem.mouseleave(hideTipsy);
                }
            }
        }

        // in pv context
        function getRealIndex(scene, index) {
            var index0 = index;
            if(typeof _mark.getNearestInstanceToMouse === 'function') {
                index = _mark.getNearestInstanceToMouse(scene, index);
                if(_tip.debug >= 20 && index0 !== index)
                    _tip.log("[TIPSY] #" + _tipsyId + " Changing index " + index0 + " to Nearest index " + index);
            }

            return getOwnerInstance(scene, index);
        }

        function getOwnerInstance(scene, index) {
            if(typeof _mark.getOwnerInstance === 'function') {
                var index0 = index;
                index = _mark.getOwnerInstance(scene, index);
                if(_tip.debug >= 20 && index0 !== index)
                    _tip.log("[TIPSY] #" + _tipsyId + " Changing index " + index0 + " to Owner index " + index);
            }

            return index;
        }

        function getNewOperationId() {
            return _nextOperId++;
        }

        function checkCanOperate(opId) {
            return opId === _nextOperId - 1;
        }

        function hideTipsy() {
            var opId = getNewOperationId();

            if(_tip.debug >= 30) _tip.log("[TIPSY] #" + _tipsyId + " Delayed Hide Begin opId=" + opId);

            if(_delayOut > 0) {
                window.setTimeout(function() {
                    if(checkCanOperate(opId)) {
                        if(_tip.debug >= 30) _tip.log("[TIPSY] #" + _tipsyId + " Hiding opId=" + opId);
                        hideTipsyCore(opId);
                    } else {
                        if(_tip.debug >= 30) _tip.log("[TIPSY] #" + _tipsyId + " Delayed Hide Cancelled opId=" + opId);
                    }
                }, _delayOut);

                return;
            }

            if(_tip.debug >= 30) _tip.log("[TIPSY] #" + _tipsyId + " Hiding Immediately opId=" + opId);
            hideTipsyCore(opId);
        }

        function disposeTipsy() {
            if(_tip.debug >= 30) _tip.log("[TIPSY] #" + _tipsyId + " Disposing");
            hideTipsyOther();
            if($fakeTipTarget) {
                $fakeTipTarget.removeData("tipsy");
                $fakeTipTarget.each(function(elem) { elem.$tooltipOptions = null; });
                $fakeTipTarget.remove();
                $fakeTipTarget = null;
            }
            if($canvas) {
                $canvas.off('mouseleave', hideTipsy);
                $canvas = null;
            }
        }

        function hideTipsyOther() {
            var opId = getNewOperationId();
            if(_tip.debug >= 30) _tip.log("[TIPSY] #" + _tipsyId + " Hiding as Other opId=" + opId);
            hideTipsyCore(opId);
        }

        function hideTipsyCore(opId) {
            // Uncomment to debug the tooltip markup.
            // Leaves the tooltip visible.
            // return;

            // Release real target
            setTarget(null, null);
            setMark(null);

            if($fakeTipTarget && $fakeTipTarget.data("tipsy")) $fakeTipTarget.tipsy("leave");
        }

        function hideOtherTipsies() {
            var hideTipsies = _sharedTipsyInfo && _sharedTipsyInfo.behaviors;
            if(hideTipsies && hideTipsies.length > 1) {
                if(_tip.debug >= 30) _tip.group("[TIPSY] #" + _tipsyId + " Hiding Others");
                hideTipsies.forEach(function(hideTipsyFun) {
                    if(hideTipsyFun !== disposeTipsy) hideTipsyFun();
                });
                if(_tip.debug >= 30) _tip.groupEnd();
            }
        }

        function isRealMouseMove(ev) {
            // Don't know why:
            // the mouseover event is triggered at a fixed interval
            // as long as the mouse is over the element,
            // even if the mouse position does not change...
            _mousePage = new pv.Shape.Point(ev.pageX, ev.pageY);

            if(_prevMousePage && _mousePage.distance2(_prevMousePage).cost <= 8) { // = 2*2 + 2*2 = dx^2 + dy^2
               if(_tip.debug >= 30) _tip.log("[TIPSY] #" + _tipsyId + " mousemove too close");
               return false;
            }

            return true;
        }

        // in pv context of root panel... not the pointed to scene.
        function doFollowMouse() {
            if(_tip.debug >= 30) _tip.group("[TIPSY] #" + _tipsyId + " doFollowMouse");
            var ev = pv.event;

            if(!_mark || (_isEnabledFun && !_isEnabledFun(tipsyBehavior, _mark))) {
                hideTipsy();
                if(_tip.debug >= 30) _tip.groupEnd();
                return;
            }

            if($fakeTipTarget && _mark && isRealMouseMove(ev)) {
                _prevMousePage = _mousePage;

                setFakeTipTargetBounds(getMouseBounds(ev));
                hideOtherTipsies();
                $fakeTipTarget.tipsy("update");
            }
            if(_tip.debug >= 30) _tip.groupEnd();
        }

        // not in pv context
        function onTargetElemMouseMove(ev) {
            if(!$fakeTipTarget || !isRealMouseMove(ev)) return;

            // tag = {scenes: scenes, index: index}
            // instance = scenes[index];
            // mark     = scenes.mark;
            var tag = this.$scene, scenes;
            if(!tag || !(scenes = tag.scenes) || !scenes.mark || (scenes.mark !== _mark)) {
                if(_tip.debug >= 20) _tip.log("[TIPSY] #" + _tipsyId + " mousemove on != mark");
                return;
            }

            var renderId = _mark.renderId(),
                sceneChanged = (renderId !== _renderId) || (scenes !== _scenes),
                followMouse = opts.followMouse,
                index = tag.index;

            if(typeof _mark.getOwnerInstance === 'function' ||
               typeof _mark.getNearestInstanceToMouse === 'function') {
                pv.event = ev; // need this for getRealIndex/getNearestInstanceToMouse/mouse to work
                _mark.context(scenes, index, function() {
                    index = getRealIndex(scenes, index);
                });
                pv.event = null;
            }

            sceneChanged |= (index !== _index);

            if(!followMouse && !sceneChanged) {
                if(_tip.debug >= 20) _tip.log("[TIPSY] #" + _tipsyId + " !followMouse and same scene");
                return;
            }

            var opId = getNewOperationId();

            if(_tip.debug >= 20) _tip.log("[TIPSY] #" + _tipsyId + " Updating opId=" + opId);

            _prevMousePage = _mousePage;

            // -------------

            var bounds;
            if(followMouse) bounds = getMouseBounds(ev);

            if(sceneChanged) {
                // => update bounds, text and gravity

                _renderId = renderId;
                _scenes = scenes;
                _index = index;

                // Position is updated because,
                // otherwise, animations that re-render
                // the hovering mark causing it to move,
                // in a way that the mouse is still kept inside it,
                // we have to update the position of the tooltip as well.

                _mark.context(scenes, index, function(){
                    if(!followMouse) bounds = getInstanceBounds();

                    var text = getTooltipText();

                    if(_tip.debug >= 20)
                        _tip.log("[TIPSY] #" + _tipsyId + " Update text. Was hidden. Text: " + text.substr(0, 50));

                    $fakeTipTarget.tipsy('setTitle', text); // does not update the tooltip UI

                    updateUserGravity();
                });
            }

            setFakeTipTargetBounds(bounds);

            hideOtherTipsies();

            $fakeTipTarget.tipsy("update");
        }

        // in pv context
        function initMark(mark) {
            if(!$canvas) createTipsy(mark);

            if(mark._tipsy !== tipsyBehavior) {
                if(_tip.debug >= 20) _tip.log("[TIPSY] #" + _tipsyId + " Initializing mark");

                mark._tipsy = tipsyBehavior;

                /* Cleanup the tooltip span on mouseout.
                 * This is necessary for dimensionless marks.
                 *
                 * Note that the tip has pointer-events disabled
                 * (so as to not interfere with other mouse events, such as "click");
                 *  thus the mouseleave event handler is registered on
                 *  the event target rather than the tip overlay.
                 */
                if(opts.usesPoint) mark.event('unpoint', function() {
                    if(_tip.debug >= 20) _tip.group("[TIPSY] #" + _tipsyId + " unpoint");
                    hideTipsy();
                    if(_tip.debug >= 20) _tip.groupEnd();
                });
            }
        }

        // in pv context
        function showTipsy(mark) {
            var opId = getNewOperationId();

            if(_tip.debug >= 20) _tip.group("[TIPSY] #" + _tipsyId + " ShowTipsy opId=" + opId);

            initMark(mark);

            var isHidden = !_mark;

            if(opts.usesPoint)
                setMark(mark);
            else
                setTarget(pv.event.target, mark);

            var ev = pv.event;
            isRealMouseMove(ev);
            _prevMousePage = _mousePage;

            if(mark.index !== _index)
                mark.context(_scenes, _index, updateTextAndBounds);
            else
                updateTextAndBounds();

            function updateTextAndBounds() {
                var text = getTooltipText();

                if(_tip.debug >= 20) _tip.log("[TIPSY] #" + _tipsyId + " Set Text: " + text.substr(0, 50));

                $fakeTipTarget.tipsy('setTitle', text);

                setFakeTipTargetBounds(opts.followMouse ? getMouseBounds() : getInstanceBounds());

                updateUserGravity();
            }

            hideOtherTipsies();

            $fakeTipTarget.tipsy(isHidden ? 'enter' : 'update');

            if(_tip.debug >= 20) _tip.groupEnd();
        }

        // On 'point' or 'mouseover' events, according to usesPoint option
        // in pv context
        function tipsyBehavior() {
            // The mark that the tipsy-behavior is attached to
            var mark = this;

            if(!_isEnabledFun || _isEnabledFun(tipsyBehavior, mark)) showTipsy(mark);
        }

        return tipsyBehavior;
    }; // END pv.Behavior.tipsy

    var _tip = pv.Behavior.tipsy;
    _tip.debug = 0;
    _tip.setDebug = function(level) {
        _tip.debug = level;
    };

    /*global console:true*/
    _tip.log = function(m) {
        if(typeof console !== "undefined") console.log('' + m);
    };
    _tip.group = function(m) {
        if(typeof console !== "undefined") console.group('' + m);
    };
    _tip.groupEnd = function(m) {
        if(typeof console !== "undefined") console.groupEnd();
    };

    _tip.disposeAll = function(panel) {
        var rootPanel = panel && panel.root;
        if(rootPanel && rootPanel.scene) { // rendered at least one
            var canvas = rootPanel.canvas();
            if(canvas) {
                var $canvas = $(canvas),
                    sharedTipsyInfo = $canvas.data("tipsy-pv-shared-info");
                if(sharedTipsyInfo) {
                    if(sharedTipsyInfo.behaviors)
                        sharedTipsyInfo.behaviors.forEach(function(dispose) {
                            dispose();
                        });

                    $canvas.removeData("tipsy-pv-shared-info");
                }
            }
        }

        _tip.removeAll();
    };

    _tip.removeAll = function() {
        $('.tipsy').remove();
    };

    function toParentTransform(parentPanel){
        return pv.Transform.identity.
                    translate(parentPanel.left(), parentPanel.top()).
                    times(parentPanel.transform());
    }

    function getVisibleScreenBounds(mark){

        var instance = mark.instance(),
            left   = instance.left,
            top    = instance.top,
            width  = instance.width,
            height = instance.height,
            right,
            bottom,
            parent;

        while ((parent = mark.parent)){

            // Does 'mark' fit in its parent?
            if(left < 0) {
                width += left;
                left = 0;
            }

            if(top < 0) {
                height += top;
                top = 0;
            }

            right  = instance.right;
            if(right < 0) width += right;

            bottom = instance.bottom;
            if(bottom < 0) height += bottom;

            // Transform to parent coordinates
            var t = toParentTransform(parent),
                s = t.k;

            left   = t.x + (s * left);
            top    = t.y + (s * top );
            width  = s * width;
            height = s * height;

            mark = parent;
            instance = mark.instance();
        }

        return {
            left:   left,
            top:    top,
            width:  width,
            height: height
        };
    }

}());
