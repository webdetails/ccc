(function(){
var behaviorByGroup = {}; 

function addBehavior(behavior, group) {
    var behaviors = behaviorByGroup[group] || (behaviorByGroup[group] = []);
    
    behaviors.push(behavior);
}

function hideGroup(group) {
    var behaviors = behaviorByGroup[group];
    if(behaviors && behaviors.length) {
        behaviors.forEach(function(behavior){
            behavior.hide();
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
    }
    
    opts.trigger = 'manual';
    
    var tipTarget,
        id = "tipsyPvBehavior" + (opts.id || new Date().getTime()),
        group     = opts.exclusionGroup,
        usesPoint = opts.usesPoint,
        showVersion = 0,
        $mouseleaveTarget;
    
    /**
     * @private When the mouse leaves the root panel, trigger a mouseleave event
     * on the tooltip span. This is necessary for dimensionless marks (e.g.,
     * lines) when the mouse isn't actually over the span.
     */
    function hideTipsy() {
        showVersion++;
        
        if($mouseleaveTarget) {
            $mouseleaveTarget.unbind('mouseleave', hideTipsy);
            $mouseleaveTarget = null;
        }
        
        if (tipTarget) {
            $(tipTarget).tipsy("hide");
        }
    }
    
    function disposeTipsy() {
        //pvc.log('Disposing tipsy');
        hideTipsy();
        if (tipTarget) {
            if(tipTarget.parentNode) {
                tipTarget.parentNode.removeChild(tipTarget);
            }
            tipTarget = null;
        }
    }
    
    function followMouseMoveAbs(ev){
        // TODO: with Dots, only works well if gravity is set to "c"...
        if(tipTarget) {
            var tip = $(tipTarget).tipsy("tip"),
                extra = 8,//px
                x,
                y;

            // Prevent being cropped by window
            if(ev.clientX + extra + tip.width() > document.body.clientWidth){
                x = ev.pageX - extra - tip.width();
            } else {
                x = ev.pageX + extra;
            }

            if(ev.clientY + extra + tip.height() > document.body.clientHeight){
                y = ev.pageY - extra - tip.height();
            } else {
                y = ev.pageY + extra;
            }

            tip.css('left', x + "px");
            tip.css('top',  y + "px");
        }
    }
    
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
    
    function getTooltipBounds(mark) {
        /*
         * Compute bounding box. TODO support area, lines, wedges, stroke. Also
         * note that CSS positioning does not support subpixels, and the current
         * rounding implementation can be off by one pixel.
         */
        var left, top, width, height;
        if (mark.properties.width) {
            // Bar
            var bounds = getVisibleScreenBounds(mark);
            
            left   = Math.floor(bounds.left  );
            top    = Math.floor(bounds.top   );
            width  = Math.ceil (bounds.width ) + 1;
            height = Math.ceil (bounds.height) + 1;

        } else {
            /* Compute the transform to offset the tooltip position. */
            var t = toScreenTransform(mark.parent);
            var instance = mark.instance();
            if(mark.properties.outerRadius){
                // Wedge
                var angle  = instance.endAngle    - instance.angle / 2;
                var radius = instance.outerRadius - (instance.outerRadius - instance.innerRadius) * 0.3;
                
                left = Math.floor(instance.left + Math.cos(angle) * radius + t.x);
                top  = Math.floor(instance.top  + Math.sin(angle) * radius + t.y);
            } else {
                left = Math.floor(instance.left * t.k + t.x);
                top  = Math.floor(instance.top  * t.k + t.y);
            }
        }
        //} else if (this.properties.shapeRadius && !opts.followMouse) {
        //  var r = mark.shapeRadius();
        //  t.x -= r;
        //  t.y -= r;
        //  tipTarget.style.height = tipTarget.style.width = Math.ceil(2 * r * t.k) + "px";
        
        return { left: left, top: top, width: width, height: height };
    }
    
    function setTipTargetBounds(bounds) {
        var style = tipTarget.style;
    
        style.left = bounds.left + "px";
        style.top  = bounds.top  + "px";
        if(bounds.width != null && bounds.height != null) {
            style.width  = bounds.width  + "px";
            style.height = bounds.height + "px";
        }
    }
    
    function createTipsy(mark) {
        var c = mark.root.canvas();
        c.style.position = "relative";
        $(c).mouseleave(hideTipsy);
        
        /* Reuse the specified div id */
        tipTarget = document.getElementById(id);
        if(tipTarget) {
            var tipsy = $.data(tipTarget, 'tipsy');
            if(tipsy) {
                tipsy.hide();
                $.data(tipTarget, 'tipsy', null);
                tipsy = null;
            }
        } else {
            tipTarget = document.createElement("div");
            tipTarget.id = id;
            c.appendChild(tipTarget);
        }
        
        tipTarget.style.position = "absolute";
        tipTarget.style.pointerEvents = "none"; // ignore mouse events
        
        // Ceeate the tipsy instance
        $(tipTarget).tipsy(opts);
    }
    
    function initBehavior(mark) {
        
        createTipsy(mark);
        
        if(group) {
            addBehavior(tipsyBehavior, group);
        }
        
        if(opts.followMouse){
            $(pv.event.target).mousemove(followMouseMoveAbs);
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
    
    function updateAndShowTipsy(title, bounds, checkShowVersion, targetElem) {
        if(tipTarget && checkShowVersion === showVersion) {
            
            showVersion++;
            
            tipTarget.title = title;
            
            setTipTargetBounds(bounds);
            
            if(!usesPoint) {
                if($mouseleaveTarget) {
                    $mouseleaveTarget.unbind('mouseleave', hideTipsy);
                }
                $mouseleaveTarget = $(targetElem);
                $mouseleaveTarget.mouseleave(hideTipsy);
            }
            
            $(tipTarget).tipsy("show");
        }
    }
    
    function showTipsy(mark) {
        if (!tipTarget) {
            // First time
            initBehavior(mark);
        }
        
        if(group) {
            hideGroup(group);
        }
        
        showVersion++;
        
        /* Text */
        var title = getTooltipText(mark);
        
        /* Bounds */
        var bounds = getTooltipBounds(mark);
        
        var checkShowVersion = showVersion;
        
        var targetElem = pv.event.target;
        
        if(opts.delayIn > 0) {
            setTimeout(function() { updateAndShowTipsy(title, bounds, checkShowVersion, targetElem); }, opts.delayIn);
        } else {
            updateAndShowTipsy(title, bounds, checkShowVersion, targetElem);
        }
    }
    
    // On point or mouseover
    function tipsyBehavior() {
        /* Show the tooltip */
        showTipsy(this);
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