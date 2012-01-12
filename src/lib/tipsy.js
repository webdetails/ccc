pv.Behavior.tipsy = function(opts) {
    var tip;

    /**
     * @private When the mouse leaves the root panel, trigger a mouseleave event
     * on the tooltip span. This is necessary for dimensionless marks (e.g.,
     * lines) when the mouse isn't actually over the span.
    */
    function trigger() {
        if (tip) {
            $(tip).tipsy("hide");
            if(tip.parentNode) {
                tip.parentNode.removeChild(tip);
            }
            tip = null;
        }
    }
  
    function mouseMoveAbs(ev){//assumes absolute positioning
        if(tip) {
            var tipLbl = $(tip).tipsy("tip");
            tipLbl.css('left', (ev.pageX + 8) + "px");
            tipLbl.css('top',  (ev.pageY + 8) + "px");
        }
    }
  
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
        
        var left   = mark.left(),
            top    = mark.top(),
            width  = mark.width(),
            height = mark.height(),
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
  
    return function(d) {
        /* Create and cache the tooltip span to be used by tipsy. */
        if (!tip) {
            var c = this.root.canvas();
            c.style.position = "relative";
            $(c).mouseleave(trigger);
        
            tip = c.appendChild(document.createElement("div"));
            tip.style.position = "absolute";
            tip.style.pointerEvents = "none"; // ignore mouse events
            $(tip).tipsy(opts);
        }

        /* Propagate the tooltip text. */
        //tip.title =  this.tooltip != null ? this.tooltip() : this.title() || this.text();
        tip.title = (this.instance()? this.instance().tooltip : null) ||
                    (typeof this.tooltip == 'function' ? this.tooltip() : null) ||
                    this.title() || 
                    this.text();

        /*
        * Compute bounding box. TODO support area, lines, wedges, stroke. Also
        * note that CSS positioning does not support subpixels, and the current
        * rounding implementation can be off by one pixel.
        */
        var left, top;
        if (this.properties.width) {
        	// Bar
            var bounds = getVisibleScreenBounds(this);
            
            left = Math.floor(bounds.left);
            top  = Math.floor(bounds.top );
            
            tip.style.width  = (Math.ceil(bounds.width ) + 1) + "px";
            tip.style.height = (Math.ceil(bounds.height) + 1) + "px";
        
        } else {
            /* Compute the transform to offset the tooltip position. */
            var t = toScreenTransform(this.parent);
            
            if( this.properties.outerRadius){
                // Wedge
                var angle = this.endAngle() - this.angle()/2;
                var radius = this.outerRadius() - (this.outerRadius() - this.innerRadius())*0.3;
                left = Math.floor(this.left() + Math.cos(angle)*radius + t.x);
                top  = Math.floor(this.top()  + Math.sin(angle)*radius + t.y);
            } else {
                left = Math.floor(this.left() * t.k + t.x);
                top  = Math.floor(this.top()  * t.k + t.y);
            }
        }

        tip.style.left = left + "px";
        tip.style.top  = top  + "px";
    
        //} else if (this.properties.shapeRadius && !opts.followMouse) {
        //  var r = this.shapeRadius();
        //  t.x -= r;
        //  t.y -= r;
        //  tip.style.height = tip.style.width = Math.ceil(2 * r * t.k) + "px";
        
        if(opts.followMouse){
            $(pv.event.target).mousemove(mouseMoveAbs);
        }
        /*
         * Cleanup the tooltip span on mouseout. Immediately trigger the tooltip;
         * this is necessary for dimensionless marks. Note that the tip has
         * pointer-events disabled (so as to not interfere with other mouse
         * events, such as "click"); thus the mouseleave event handler is
         * registered on the event target rather than the tip overlay.
         */
        $(pv.event.target).mouseleave(trigger);
        //if (tip.style.height || tip.style.width){
        //  $(pv.event.target).mouseleave(trigger);
        //}
        $(tip).tipsy("show");
    };
};
