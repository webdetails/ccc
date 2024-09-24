/*!
 * tipsy, facebook style tooltips for jquery
 * version 1.0.0a
 * (c) 2008-2010 jason frame [jason@onehackoranother.com]
 * released under the MIT license
 */
(function($) {

    function fixTitle($ele) {
        var title = $ele.attr('title');
        if(title || typeof($ele.attr('original-title')) !== 'string') {
            $ele.attr('original-title', title || '')
                .removeAttr('title');
        }
    }

    function Tipsy(element, options) {
        this.$element = $(element);
        this.options = options;
        this.enabled = true;
        fixTitle(this.$element);
    }

    Tipsy.prototype = {
        enter: function() {
            var tipsy = this,
                options = this.options;

            if(options.delayIn == 0) {
                tipsy.hoverState = null;
                tipsy.show();
            } else {
                tipsy.hoverState = 'in';
                setTimeout(function() {
                    if (tipsy.hoverState === 'in') {
                        tipsy.hoverState = null;
                        tipsy.show();
                    }
                }, options.delayIn);
            }
        },

        leave: function() {
            var tipsy = this,
                options = this.options;

            if(options.delayOut == 0) {
                tipsy.hide();
            } else {
                tipsy.hoverState = 'out';
                setTimeout(function() { if(tipsy.hoverState === 'out') tipsy.hide(); }, options.delayOut);
            }
        },

        visible: function() {
            var parent;
            return this.hoverState === 'in' || // almost visible
                   (this.hoverState !== 'out' &&
                   !!(this.$tip &&
                      (parent = this.$tip[0].parentNode) &&
                      (parent.nodeType !== 11))); // Document fragment
        },

        update: function() {
            if(this.visible())
                this.show(true);
            else
                this.enter();
        },

        setOptions: function(options) {

            options = $.extend({}, $.fn.tipsy.defaults, options);

            if(options.arrowVisible == null) {
                options.arrowVisible = !options.useCorners;
            }

            this.options = $.fn.tipsy.elementOptions(this.$element[0], options);
        },

        show: function(isUpdate) {
            // Don't override delay in
            if(this.hoverState === 'in') return;

            var title = this.getTitle();
            if(!this.enabled || !title) {
                this.hoverState = null;
                this.hide();
                return;
            }

            var $tip = this.tip(), tip = $tip[0];

            $tip.find('.tipsy-inner')[this.options.html ? 'html' : 'text'](title);

            // Reset classname in case of dynamic gravity
            var className = this.options.className;
            tip.className = 'tipsy' + (className ? (' ' + className) : '');

            if(!isUpdate) $tip.remove();

            var parent = tip.parentNode;
            if(!parent || (parent.nodeType === 11)) { // Document fragment
                $tip.css({top: 0, left: 0, visibility: 'hidden', display: 'block'})
                    .appendTo(document.body);
            }

            var $elem = this.$element,
                elem = $elem[0],
                pos;

            // Adds SVG support.
            // Modified from https://github.com/logical42/tipsy-svg--for-rails
            if('getBoundingClientRect' in elem) {
                var rect = elem.getBoundingClientRect(),
                    $doc = $(document);

                pos = {
                    left:   rect.left + $doc.scrollLeft(),
                    top:    rect.top  + $doc.scrollTop(),
                    width:  rect.right  - rect.left,
                    height: rect.bottom - rect.top
                }
            } else {
                pos = $.extend({}, $elem.offset());
                pos.width  = elem.offsetWidth;
                pos.height = elem.offsetHeight;
            }

            var tipOffset  = this.options.offset,
                useCorners = this.options.useCorners,
                showArrow  = this.options.arrowVisible,
                actualWidth,
                actualHeight;

            if('getBoundingClientRect' in tip) {
                var tipRect = tip.getBoundingClientRect();
                actualWidth  = tipRect.right - tipRect.left;
                actualHeight = tipRect.bottom - tipRect.top;
            } else {
                actualWidth  = tip.offsetWidth;
                actualHeight = tip.offsetHeight;
            }

            if(!showArrow)
                // More or less the padding reserved for the arrow
                tipOffset -= 4;

            function calcPosition(gravity) {
                var tp;
                switch(gravity.charAt(0)) {
                    case 'n':
                        tp = {top: pos.top + pos.height + tipOffset, left: pos.left + pos.width / 2 - actualWidth / 2};
                        break;
                    case 's':
                        tp = {top: pos.top - actualHeight - tipOffset, left: pos.left + pos.width / 2 - actualWidth / 2};
                        break;
                    case 'e':
                        tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth - tipOffset};
                        break;
                    case 'w':
                        tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width + tipOffset};
                        break;
                }

                if(gravity.length === 2) {
                    if(gravity.charAt(1) == 'w') {
                        tp.left = useCorners ?
                                    pos.left + pos.width + tipOffset:
                                    pos.left + pos.width / 2 - 15;
                    } else {
                        tp.left = useCorners ?
                                    pos.left - actualWidth - tipOffset :
                                    pos.left + pos.width / 2 - actualWidth + 15;
                    }
                }

                return tp;
            }

            var gravity = this.options.gravity;
            if(typeof gravity == 'function')
                gravity = gravity.call(elem, {width: actualWidth, height: actualHeight}, calcPosition);

            var tp = calcPosition(gravity);

            // Add a duplicate w/e char at the end when using corners
            $tip.addClass('tipsy-' + gravity + (useCorners && gravity.length > 1 ? gravity.charAt(1) : ''));

            var cssNow, cssAnim, anim = this.options.animate;
            if(isUpdate && anim > 0)
                cssAnim = tp;
            else
                cssNow = tp;

            if(showArrow) {
                var hideArrow = useCorners && gravity.length === 2;
                // If corner, hide the arrow, cause arrow styles don't support corners nicely
                $tip.find('.tipsy-arrow')[hideArrow ? 'hide' : 'show']();
            }

            var doFadeIn = this.options.fade && !isUpdate; // || !this._prevGravity || (this._prevGravity !== gravity));
            if(doFadeIn) {
                cssNow  = $.extend(cssNow  || {}, {opacity: 0, display: 'block', visibility: 'visible'});
                cssAnim = $.extend(cssAnim || {}, {opacity: this.options.opacity});
            } else {
                cssNow  = $.extend(cssNow  || {}, {visibility: 'visible', opacity: this.options.opacity});
            }

            if(cssNow)  $tip.css(cssNow);
            if(cssAnim) $tip.stop().animate(cssAnim, anim > 0 ? anim : 400);

            this._prevGravity = gravity;

            this.hoverState = null;
        },

        hide: function() {
            if(this.options.fade) {
                this.tip().stop().fadeOut(function() { $(this).remove(); });
            } else if(this.$tip) {
                this.tip().remove();
            }

            this.hoverState = null;
        },

        setTitle: function(title) {
            title = (title == null) ? "" : ("" + title);
            this.$element
                .attr('original-title', title)
                .removeAttr('title');
        },

        getTitle: function() {
            var title, $e = this.$element, o = this.options;
            fixTitle($e);
            if(typeof o.title === 'string') {
                title = $e.attr(o.title == 'title' ? 'original-title' : o.title);
            } else if(typeof o.title === 'function') {
                title = o.title.call($e[0]);
            }
            title = ('' + title).replace(/(^\s*|\s*$)/, "");
            return title || o.fallback;
        },

        tip: function() {
            if(!this.$tip) {
                var className = this.options.className;
                this.$tip = $('<div class="tipsy' + (className ? (" " + className) : "") + '"></div>');
                if(this.options.arrowVisible) {
                    this.$tip.html('<div class="tipsy-arrow"></div><div class="tipsy-inner"/></div>');
                } else {
                    this.$tip.html('<div class="tipsy-inner"/></div>');
                }

                // Remove it from document fragment parent
                // So that visible tests do not fail
                // Does not work on IE
                this.$tip.remove();
            }
            return this.$tip;
        },

        validate: function() {
            var parent = this.$element[0].parentNode;
            if(!parent || (parent.nodeType === 11)) {
                this.hide();
                this.$element = null;
                this.options = null;
            }
        },

        enable: function() { this.enabled = true; },
        disable: function() { this.enabled = false; },
        toggleEnabled: function() { this.enabled = !this.enabled; }
    };

    $.fn.tipsy = function(options, arg) {

        if(options === true) return this.data('tipsy');
        if(typeof options === 'string') return this.data('tipsy')[options](arg);

        options = $.extend({}, $.fn.tipsy.defaults, options);
        if(options.arrowVisible == null) options.arrowVisible = !options.useCorners;

        function get(ele) {
            var tipsy = $.data(ele, 'tipsy');
            if(!tipsy) {
                tipsy = new Tipsy(ele, $.fn.tipsy.elementOptions(ele, options));
                $.data(ele, 'tipsy', tipsy);
            }
            return tipsy;
        }

        function enter() {
            get(this).enter();
        }

        function leave() {
            get(this).leave();
        }

        if(!options.live) this.each(function() { get(this); });

        if(options.trigger != 'manual') {
            var binder   = options.live ? 'live' : 'bind',
                eventIn  = options.trigger == 'hover' ? 'mouseenter' : 'focus',
                eventOut = options.trigger == 'hover' ? 'mouseleave' : 'blur';
            this[binder](eventIn,  enter)
                [binder](eventOut, leave);
        }

        return this;
    };

    $.fn.tipsy.defaults = {
        delayIn:  0,
        delayOut: 0,
        animate:  0,
        fade: false,
        fallback: '',
        gravity: 'n',
        html: false,
        live: false,
        offset: 0,
        opacity: 0.8,
        title: 'title',
        trigger: 'hover',
        useCorners: false,  // use corners in nw, ne and sw, se gravities
        arrowVisible: null, // show or hide the arrow (default is !useCorners)
        className: '' // custom additional class name for the tipsy root div
    };

    // Overwrite this method to provide options on a per-element basis.
    // For example, you could store the gravity in a 'tipsy-gravity' attribute:
    // return $.extend({}, options, {gravity: $(ele).attr('tipsy-gravity') || 'n' });
    // (remember - do not modify 'options' in place!)
    $.fn.tipsy.elementOptions = function(ele, options) {
        return $.metadata ? $.extend({}, options, $(ele).metadata()) : options;
    };

    $.fn.tipsy.autoNS = function() {
        return $(this).offset().top > ($(document).scrollTop() + $(window).height() / 2) ? 's' : 'n';
    };

    $.fn.tipsy.autoWE = function() {
        return $(this).offset().left > ($(document).scrollLeft() + $(window).width() / 2) ? 'e' : 'w';
    };



})(jQuery);
