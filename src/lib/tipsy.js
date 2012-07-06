(function(){
var behaviorByGroup = {}; 

function addBehavior(behavior, group) {
    var behaviors = behaviorByGroup[group] || (behaviorByGroup[group] = []);
    
    behaviors.push(behavior);
}

function hideGroup(group, senderBehavior) {
    var behaviors = behaviorByGroup[group];
    if(behaviors && behaviors.length) {
        behaviors.forEach(function(behavior){
            if(behavior !== senderBehavior){
                behavior.hide();
            }
        });
    }
}

pv.Behavior.tipsy = function(opts) {
    /**
     * One tip is reused per behavior instance.
     * Tipically there is one behavior instance per mark,
     * and this is reused across all its mark instances.
     */
    
    if(!opts) {
        opts = {};
    } else {
        opts = Object.create(opts);
    }
    
    /**
     * Trigger must be manual because the mouse entering/leaving
     * the fake target is not always adequate.
     * When followMouse, the fakeTarget is always moving,
     * and is not usable.
     * What matters is the real SVG target.
     */
    opts.trigger = 'manual';
    
    /**
     * Gravity is intercepted to allow for off screen bounds reaction. 
     */
    opts.userGravity = opts.gravity || $.fn.tipsy.defaults.gravity;
    
    opts.gravity = calculateGravity;
    
    var $fakeTipTarget, // target div
        $targetElem,
        prevMouseX,
        prevMouseY,
        id = "tipsyPvBehavior" + (opts.id || new Date().getTime()),
        group     = opts.exclusionGroup,
        usesPoint = opts.usesPoint,
        $canvas,
        isEnabled = opts.isEnabled;

    function getTooltipText(mark) {
        var instance = mark.instance();
        var title = (instance && instance.tooltip) ||
                    (typeof mark.tooltip == 'function' && mark.tooltip()) ||
                    mark.title() ||
                    mark.text();
         
        // Allow deferred tooltip creation! 
        if(typeof title === 'function') {
            title = title();
        }
        
        return title || ""; // Prevent "undefined" from showing up
    }
    
    function getInstanceBounds(mark) {
        /*
         * Compute bounding box. 
         * TODO: support area, lines. 
         */
        var left, top, width, height;
        if (mark.properties.width) {
            // Bar, panel
            var bounds = getVisibleScreenBounds(mark);
            
            left = bounds.left;
            top  = bounds.top;
            width  = bounds.width;
            height = bounds.height;
            
        } else {
            /* Compute the transform to offset the tooltip position. */
            var t = toScreenTransform(mark.parent);
            var instance = mark.instance();
            if(mark.properties.outerRadius){
                // Wedge
                var angle  = instance.endAngle    - instance.angle / 2;
                var radius = instance.outerRadius - (instance.outerRadius - instance.innerRadius) * 0.3;
                
                left = instance.left + Math.cos(angle) * radius + t.x;
                top  = instance.top  + Math.sin(angle) * radius + t.y;
                
            } else if(mark.properties.shapeRadius){
                var radius = Math.max(2, instance.shapeRadius),
                    cx = instance.left,
                    cy = instance.top;
    
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
        
        return { left: left2, top: top2, width: width, height: height };
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
    
    function calculateGravity(tipSize, calcPosition){
        /*jshint expr:true */
        
        // <Debug>
        // jquery.tipsy calls this on the element to which it is attached
        (this === $fakeTipTarget[0]) || def.assert();
        // </Debug>
        
        var scrollOffset = pv.scrollOffset(this);
        
        // Obtain desired user gravity
        var gravity = opts.userGravity;
        if(typeof gravity === 'function'){
            gravity = gravity.call(this) || $.fn.tipsy.defaults.gravity;
        }
        
        // backwards compatibility for special gravity, 'c', 
        // added to jquery.tipsy to avoid the style applying to the arrow, 
        // causing it to not show.
        if(gravity === 'c'){
            gravity = 'w';
        }
        
        var bestScore = scoreGravity(gravity);
        if(!bestScore.isTotal){
            // Find the best scored gravity.
            // Start from the position *after* 'gravity' in the gravities array,
            // turning around when the end is reached.
            
            var g = _gravities.indexOf(gravity);
            for(var n = 1, L = _gravities.length ; n < L ; n++){
                var i = (g + n) % L;
                bestScore = chooseScores(bestScore, scoreGravity(_gravities[i]));
            }
            
//            if(gravity !== bestScore.gravity){
//                console.log("[TIPSY] Choosing gravity '" + bestScore.gravity + "' over '" + gravity + "'");
//            }
            
            gravity = bestScore.gravity;
        }
        
//        console.log("[TIPSY] Gravity '" + gravity + "'");
    
        return gravity;
        
        function scoreGravity(gravity){
            var tp = calcPosition(gravity);
            return scorePosition(gravity, tp);
        }
        
        function scorePosition(gravity, tp){
            var wScore = calcPosScore(tp.left, 'width' );
            var hScore = calcPosScore(tp.top,  'height');
            var isTotal = wScore.fits && hScore.fits;
            
            return {
                gravity:   gravity,
                width:     wScore, 
                height:    hScore,
                value:     wScore.value + hScore.value + (2 - gravity.length), // prefer simple gravities
                isTotal:   isTotal,
                isPartial: !isTotal && (wScore.fits || hScore.fits)
            };
        }
        
        function calcPosScore(absPos, a_len){
            var maxLen = $(window)[a_len]();
            var len  = tipSize[a_len];
            
            var pos  = absPos - scrollOffset[a_len === 'width' ? 0 : 1];
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
        if(score1.isTotal){
            if(!score2.isTotal){
                return score1;
            }
        } else if(score2.isTotal){
            if(!score1.isTotal){
                return score2;
            }
        } else if(score1.isPartial){
            if(!score2.isPartial){
                return score1;
            }
        } else if(score2.isPartial){
            if(!score1.isPartial){
                return score2;
            }
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
            left:   bounds.left,
            top:    bounds.top,
            width:  bounds.width,
            height: bounds.height
        });
    }
    
    function createTipsy(mark) {
        var c = mark.root.canvas();
        
        $canvas = $(c);
        
        c.style.position = "relative";
        $canvas.mouseleave(hideTipsy);
        
        /* Reuse the specified div id */
        var fakeTipTarget = document.getElementById(id);
        if(fakeTipTarget) {
            var tipsy = $.data(fakeTipTarget, 'tipsy');
            if(tipsy) {
                tipsy.hide();
                $.data(fakeTipTarget, 'tipsy', null);
                tipsy = null;
            }
        } else {
            fakeTipTarget = document.createElement("div");
            fakeTipTarget.id = id;
            c.appendChild(fakeTipTarget);
            
            var fakeStyle = fakeTipTarget.style;
            fakeStyle.padding = '0px';
            fakeStyle.margin  = '0px';
            fakeStyle.position = "absolute";
            fakeStyle.pointerEvents = "none"; // ignore mouse events
            fakeStyle.display = 'block';
            
            // <Debug>
//            fakeStyle.borderColor = 'red';
//            fakeStyle.borderWidth = "1px";
//            fakeStyle.borderStyle = 'solid';
            // </Debug>
        }
        
        $fakeTipTarget = $(fakeTipTarget);
        
        // Create the tipsy instance
        $fakeTipTarget.tipsy(opts);
    }
    
    function getMouseBounds(ev){
        if(!ev){ ev = pv.event; }
        
        var delta = 5;
        var offset = $canvas.offset();
        return {
            left:   ev.pageX - offset.left - delta,
            top:    ev.pageY - offset.top  - delta,
            width:  10 + 2*delta,
            height: 20
        };
    }
    
    function setTarget(targetElem){
        
        if((!$targetElem && targetElem) || 
           ( $targetElem && $targetElem[0] !== targetElem)){
//            console.log("[TIPSY] Changing target element.");
            
            if($targetElem){
                if(opts.followMouse){
                    $targetElem.unbind('mousemove', updateTipsy);
                }
                
                if(!usesPoint) {
                    $targetElem.unbind('mouseleave', hideTipsy);
                }
            }
            
            // ---------
            
            $targetElem = targetElem ? $(targetElem) : null;
            
            // ---------
            
            if($targetElem){
                if(opts.followMouse){
                    prevMouseX = prevMouseY = null;
                    $targetElem.mousemove(updateTipsy);
                }
                
                if(!usesPoint) {
                    $targetElem.mouseleave(hideTipsy);
                }
                
                if(group) {
                    hideGroup(group, tipsyBehavior);
                }
            }
        }
    }
    
    function hideTipsy() {
//        console.log("[TIPSY] Hide");
        
        // Release real target
        setTarget(null);
        
        if ($fakeTipTarget) {
            $fakeTipTarget.tipsy("leave");
        }
    }
    
    function updateTipsy(ev){
        if($fakeTipTarget) {
            
            /* Don't know why: 
             * the mouseover event is triggered at a fixed interval
             * as long as the mouse is over the element, 
             * even if the mouse position does not change... 
             */
            if(prevMouseX != null && 
               prevMouseX === ev.clientX && 
               prevMouseY === ev.clientY){ 
                 return;
            }
            
//            console.log("[TIPSY] Update");
            
            prevMouseX = ev.clientX; 
            prevMouseY = ev.clientY;
            
            // -------------
            
            setFakeTipTargetBounds(getMouseBounds(ev));
            
            $fakeTipTarget.tipsy("update");
        }
    }
    
    function initBehavior(mark){
        // First time
        
//        console.log("[TIPSY] Creating");
        
        createTipsy(mark);
        
        if(group) {
            addBehavior(tipsyBehavior, group);
        }
        
        /*
         * Cleanup the tooltip span on mouseout.
         * This is necessary for dimensionless marks.
         *
         * Note that the tip has pointer-events disabled
         * (so as to not interfere with other mouse events, such as "click");
         * thus the mouseleave event handler is registered on
         * the event target rather than the tip overlay.
         */
        if(usesPoint){
            // Being used as a point handler
            // Should hide the tipsy only in the unpoint event
            mark.event('unpoint', hideTipsy);
        }
    }
    
    function showTipsy(mark) {
//        console.log("[TIPSY] Show IN");
        
        if (!$canvas) {
            initBehavior(mark);
        }
        
        setTarget(pv.event.target);
        
        $fakeTipTarget.attr('title', getTooltipText(mark));
        
        setFakeTipTargetBounds(opts.followMouse ? getMouseBounds() : getInstanceBounds(mark));
        
        $fakeTipTarget.tipsy("enter");
        
//        console.log("[TIPSY] Show OUT");
    }
    
    // On point or mouseover
    function tipsyBehavior() {
        var mark = this;
        
        if(!isEnabled || isEnabled(tipsyBehavior, mark)){
            showTipsy(mark);
        }
    }
    
    tipsyBehavior.hide = hideTipsy;

    return tipsyBehavior;
};

function toParentTransform(parentPanel){
    return pv.Transform.identity.
                translate(parentPanel.left(), parentPanel.top()).
                times(parentPanel.transform());
}

function toScreenTransform(parent){
    var t = pv.Transform.identity;
    do {
        t = t.translate(parent.left(), parent.top())
             .times(parent.transform());
    } while ((parent = parent.parent));

    return t;
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
        if(left < 0){
            width += left;
            left = 0;
        }

        if(top < 0){
            height += top;
            top = 0;
        }

        right  = mark.right();
        if(right < 0){
            width += right;
        }

        bottom = mark.bottom();
        if(bottom < 0){
            height += bottom;
        }

        // Transform to parent coordinates
        var t = toParentTransform(parent),
            s = t.k;

        left   = t.x + (s * left);
        top    = t.y + (s * top );
        width  = s * width;
        height = s * height;

        mark = parent;
    }

    return {
        left:   left,
        top:    top,
        width:  width,
        height: height
    };
}

}());