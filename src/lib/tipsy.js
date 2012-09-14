(function(){

var _nextTipsyId = 0;

pv.Behavior.tipsy = function(opts) {
    var _tipsyId = _nextTipsyId++;
    
    /**
     * One tip is reused per behavior instance.
     * Typically there is one behavior instance per mark,
     * and this is reused across all its mark instances.
     */
    
    if(!opts) {
        opts = {};
    } else {
        opts = Object.create(opts);
    }
    
    /**
     * Trigger must be manual because the mouse entering/leaving
     * the **fake target** is not always adequate.
     * 
     * When followMouse=true, the fake target is always moving, and is not usable
     * for bounds control. What matters is the real SVG target.
     */
    opts.trigger = 'manual';
    
    /**
     * Gravity is intercepted to allow for off screen bounds reaction. 
     */
    opts.userGravity = opts.gravity || $.fn.tipsy.defaults.gravity;
    
    opts.gravity = calculateGravity;
    
    var $fakeTipTarget, // target div
        $targetElem,
        nextOperationId = 0,
        prevMouseX,
        prevMouseY,
        delayOut = opts.delayOut,
        id,
        usesPoint = opts.usesPoint,
        $canvas,
        isEnabled = opts.isEnabled,
        sharedTipsyInfo;
    
    opts.delayOut = 0; 
        
    function getTooltipText(mark, instance) {
        if(!instance){
            instance = mark.instance();
        }
        
        var title = (instance && instance.tooltip) ||
                    // A mark method that is not a property?
                    (!mark.properties.tooltip && typeof mark.tooltip == 'function' && mark.tooltip()) ||
                    instance.title ||
                    instance.text;
         
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
            var t = mark.toScreenTransform();
            var instance = mark.instance();
            var radius;
            if(mark.properties.outerRadius){
                // Wedge
                var midAngle = instance.startAngle + instance.angle / 2;
                radius = instance.outerRadius;// - (instance.outerRadius - instance.innerRadius) * 0.05;
                
                left = t.x + instance.left + radius * Math.cos(midAngle);
                top  = t.y + instance.top  + radius * Math.sin(midAngle);
                
            } else if(mark.properties.shapeRadius){
                radius = Math.max(2, instance.shapeRadius);
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
            
            if(_tip.debug >= 6 && gravity !== bestScore.gravity){
                _tip.log("[TIPSY] #" + _tipsyId + " Choosing gravity '" + bestScore.gravity + "' over '" + gravity + "'");
            }
            
            gravity = bestScore.gravity;
        }
        
        if(_tip.debug >= 6){
            _tip.log("[TIPSY] #" + _tipsyId + " Gravity '" + gravity + "'");
        }
        
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
        
        // ------------
        
        initTipsyCanvasSharedInfo();
        
        // ------------
        
        /* Use the specified div id or create a hopefully unique one */
        if(!id){
            id = "tipsyPvBehavior_" + new Date().getTime();
        }
        
        var fakeTipTarget = document.getElementById(id);
        if(!fakeTipTarget) {
            fakeTipTarget = document.createElement("div");
            fakeTipTarget.id = id;
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
        $fakeTipTarget.data('tipsy', null); // Otherwise a new tipsy is not created, if there's one there already
        $fakeTipTarget.tipsy(opts);
    }
    
    function initTipsyCanvasSharedInfo(){
        sharedTipsyInfo = $canvas.data('tipsy-pv-shared-info');
        if(sharedTipsyInfo){
            var createId = ($canvas[0].$pvCreateId || 0);
            
            if(sharedTipsyInfo.createId === createId){
                sharedTipsyInfo.behaviors.push(hideTipsyOther);
                return;
            }
            
            // Protovis has recreated the whole structure
            // So all existing tipsies (but this one) are invalid...
            // Hide them and let GC do the rest
            sharedTipsyInfo.behaviors.forEach(function(aHideTipsy){
                aHideTipsy();
            });
        }
        
        
        sharedTipsyInfo = {
            createId:  ($canvas[0].$pvCreateId || 0),
            behaviors: [hideTipsyOther]
        };
        
        $canvas.data('tipsy-pv-shared-info', sharedTipsyInfo);
    }
    
    function updateTipDebug(){
        if($fakeTipTarget){
            if(_tip.debug >= 16){
                $fakeTipTarget.css({
                    borderColor: 'red',
                    borderWidth: '1px',
                    borderStyle: 'solid'
                });
            } else {
                $fakeTipTarget.css({
                    borderWidth: '0px'
                });
            }
        }
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
            if(_tip.debug >= 4){ _tip.log("[TIPSY] #" + _tipsyId + " Changing target element."); }
            
            if($targetElem){
                $targetElem.unbind('mousemove', updateTipsy);
                
                if(!usesPoint) {
                    $targetElem.unbind('mouseleave', hideTipsy);
                }
            }
            
            // ---------
            
            $targetElem = targetElem ? $(targetElem) : null;
            
            prevMouseX = prevMouseY = null;
            
            // ---------
            
            if($targetElem){
                $targetElem.mousemove(updateTipsy);
                
                if(!usesPoint) {
                    $targetElem.mouseleave(hideTipsy);
                }
            }
        }
    }
    
    function getNewOperationId(){
        return nextOperationId++;
    }
    
    function checkCanOperate(opId){
        return opId === nextOperationId - 1;
    }
    
    function hideTipsy() {
        var opId = getNewOperationId();
        
        if(_tip.debug >= 4){ _tip.log("[TIPSY] #" + _tipsyId + " Delayed Hide Begin opId=" + opId); }
        
        if(delayOut > 0){
            setTimeout(function(){
                if(checkCanOperate(opId)){
                    if(_tip.debug >= 4){ _tip.log("[TIPSY] #" + _tipsyId + " Hiding opId=" + opId + " nextOperationId=" + nextOperationId); }
                    hideTipsyCore(opId);
                } else {
                    if(_tip.debug >= 4){ _tip.log("[TIPSY] #" + _tipsyId + " Delayed Hide Cancelled opId=" + opId); }
                }
            }, delayOut);
            
            return;
        }
        
        if(_tip.debug >= 4){ _tip.log("[TIPSY] #" + _tipsyId + " Hiding Immediately opId=" + opId); }
        hideTipsyCore(opId);
    }
    
    function hideTipsyOther() {
        var opId = getNewOperationId();
        if(_tip.debug >= 4){ _tip.log("[TIPSY] #" + _tipsyId + " Hiding as Other opId=" + opId); }
        hideTipsyCore(opId);
    }
    
    function hideTipsyCore(opId) {
        // Release real target
        setTarget(null);
      
        if ($fakeTipTarget) {
            $fakeTipTarget.tipsy("leave");
        }
    }
    
    function hideOtherTipsies(){
        var hideTipsies = sharedTipsyInfo && sharedTipsyInfo.behaviors;
        if(hideTipsies && hideTipsies.length > 1){
            hideTipsies.forEach(function(aHideTipsy){
                if(aHideTipsy !== hideTipsyOther){
                    aHideTipsy();
                }
            });
        }
    }
    
    function updateTipsy(ev){
        if(!$fakeTipTarget) {
            return;
        }
        
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
        
        var t = this.$scene;
        var mark, scene;
        if(!t || !(scene = t.scenes) || !(mark = scene.mark)){
            return;
        }
        
        var opId = getNewOperationId();
                
        if(_tip.debug >= 4){ _tip.log("[TIPSY] #" + _tipsyId + " Updating opId=" + opId); }
        
        prevMouseX = ev.clientX;
        prevMouseY = ev.clientY;
        
        // -------------
        
        var bounds;
        if($fakeTipTarget.tipsy('visible')){
            if(!opts.followMouse){
                // No need to update text.
                // Position is updated because, 
                // otherwise, animations that re-render
                // the hovering mark and slightly move it,
                // in a way that the mouse is still kept inside it,
                // we have to update the position of the tooltip as well.
                mark.context(scene, t.index, function(){
                    bounds = getInstanceBounds(mark);
                });
            } else {
                bounds = getMouseBounds(ev);
            }
        } else {
            // Text may have changed
            mark.context(scene, t.index, function(){
                var text = getTooltipText(mark);
                
                if(_tip.debug >= 4){ _tip.log("[TIPSY] #" + _tipsyId + " Update text. Was hidden. Text: " + text); }
                
                $fakeTipTarget.tipsy('setTitle', text);
                
                bounds = opts.followMouse ? getMouseBounds(ev) : getInstanceBounds(mark);
            });
        }
        
        setFakeTipTargetBounds(bounds);
        
        hideOtherTipsies();
        
        $fakeTipTarget.tipsy("update");
    }
    
    function initBehavior(mark){
        // First time
        
        if(_tip.debug >= 4){ _tip.log("[TIPSY] #" + _tipsyId + " Creating"); }
        
        createTipsy(mark);
        
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
        var opId = getNewOperationId();
        
        if(_tip.debug >= 4){ _tip.log("[TIPSY] #" + _tipsyId + " Show IN opId=" + opId); }
        
        if (!$canvas) {
            initBehavior(mark);
        }
        
        var isHidden = !$targetElem;
        
        setTarget(pv.event.target);
        
        var text = getTooltipText(mark);
        
        if(_tip.debug >= 4){ _tip.log("[TIPSY] #" + _tipsyId + " Text: " + text); }
        
        $fakeTipTarget.tipsy('setTitle', text);
        
        setFakeTipTargetBounds(opts.followMouse ? getMouseBounds() : getInstanceBounds(mark));
        
        hideOtherTipsies();
        
        if(isHidden){
            $fakeTipTarget.tipsy('enter');
        } else {
            $fakeTipTarget.tipsy('update');
        }
        
        if(_tip.debug >= 4){ _tip.log("[TIPSY] #" + _tipsyId + " Show OUT"); }
    }
    
    // On point or mouseover
    function tipsyBehavior() {
        var mark = this;
        
        if(!isEnabled || isEnabled(tipsyBehavior, mark)){
            showTipsy(mark);
        }
    }

    return tipsyBehavior;
}; // END pv.Behavior.tipsy

var _tip = pv.Behavior.tipsy;
_tip.debug = 0;
_tip.setDebug = function(level){
    _tip.debug = level;
};

_tip.log = function(m){
    if(typeof console !== "undefined"){
        console.log('' + m);
    }
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
        if(left < 0){
            width += left;
            left = 0;
        }

        if(top < 0){
            height += top;
            top = 0;
        }
        
        right  = instance.right;
        if(right < 0){
            width += right;
        }

        bottom = instance.bottom;
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