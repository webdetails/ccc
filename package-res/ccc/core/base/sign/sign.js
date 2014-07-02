/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def.type('pvc.visual.Sign', pvc.visual.BasicSign)
.init(function(panel, pvMark, keyArgs) {
    var me = this;

    me.base(panel, pvMark, keyArgs);

    me._ibits = panel.ibits();

    var extensionIds = def.get(keyArgs, 'extensionId');
    if(extensionIds != null) // empty string is a valid extension id.
        me.extensionAbsIds = def.array.to(panel._makeExtensionAbsId(extensionIds));

    me.isActiveSeriesAware = def.get(keyArgs, 'activeSeriesAware', true);
    if(me.isActiveSeriesAware) {
        // Should also check if the corresponding data has > 1 atom?
        var roles = panel.visualRoles;
        var seriesRole = roles && roles.series;
        if(!seriesRole || !seriesRole.isBound()) me.isActiveSeriesAware = false;
    }

    /* Extend the pv mark */
    pvMark.wrapper(def.get(keyArgs, 'wrapper') || me.createDefaultWrapper());

    if(!def.get(keyArgs, 'freeColor', true)) {
        me._bindProperty('fillStyle',   'fillColor',   'color')
          ._bindProperty('strokeStyle', 'strokeColor', 'color');
    }
})
.postInit(function(panel, pvMark, keyArgs) {

    this._addInteractive(keyArgs);

    panel._addSign(this);
})
.add({
    // NOTE: called during init
    createDefaultWrapper: function() {
        // The default wrapper passes the context as JS-context
        // and scene as first argument
        var me = this;
        return function(f) {
            return function(scene) { return f.call(me.context(), scene); };
        };
    },

    // To be called on prototype
    property: function(name) {
        var upperName  = def.firstUpperCase(name),
            baseName   = 'base'        + upperName,
            defName    = 'default'     + upperName,
            normalName = 'normal'      + upperName,
            interName  = 'interactive' + upperName,
            methods = {};

        // ex: color
        methods[name] = function(scene, arg) {
            this._finished = false;
            this._arg = arg; // for use in calling default methods (see #_bindProperty)

            // ex: baseColor
            var value = this[baseName](scene, arg);
            if(value == null ) return null; // undefined included
            if(this._finished) return value;

            // ex: interactiveColor or normalColor
            value = this[this.showsInteraction() && scene.anyInteraction() ? interName : normalName](scene, value, arg);

            // Possible memory leak in case of error but it is not serious.
            // Performance is more important so no try/finally is added.
            this._arg = null;

            return value;
        };

        // baseColor
        //   Override this method if user extension
        //   should not always be called.
        //   It is possible to call the default method directly, if needed.
        //   defName is installed as a user extension and
        //   is called if the user hasn't extended...
        methods[baseName]   = function(/*scene, arg*/) { return this.delegateExtension(); };

        // defaultColor
        methods[defName]    = function(/*scene, arg*/) { /*return;*/ };

        // normalColor
        methods[normalName] = function(scene, value/*, arg*/) { return value; };

        // interactiveColor
        methods[interName]  = function(scene, value/*, arg*/) { return value; };

        this.constructor.add(methods);

        return this;
    },

    // Use (at least) in TreemapPanel to add isActiveDescendantOrSelf
    anyInteraction: function(scene) { return scene.anyInteraction(); },

    // Call this function with a final property value
    // to ensure that it will not be processed anymore
    finished: function(value) {
        this._finished = true;
        return value;
    },

    /* Extensibility */
    /**
     * Any protovis properties that have been specified
     * before the call to this method
     * are either locked or are defaults.
     *
     * This method applies user extensions to the protovis mark.
     * Default properties are replaced.
     * Locked properties are respected.
     *
     * Any function properties that are specified
     * after the call to this method
     * will have access to the user extension by
     * calling {@link pv.Mark#delegate}.
     */
    applyExtensions: function() {
        if(!this._extended) {
            this._extended = true;

            var extensionAbsIds = this.extensionAbsIds;
            if(extensionAbsIds) extensionAbsIds.forEach(function(extensionAbsId) {
                    this.panel.extendAbs(this.pvMark, extensionAbsId);
                }, this);
        }

        return this;
    },

    // -------------

    intercept: function(pvName, fun) {
        var interceptor = this._createPropInterceptor(pvName, fun);

        return this._intercept(pvName, interceptor);
    },

    // -------------

    lockDimensions: function() {
        this.pvMark
            .lock('left')
            .lock('right')
            .lock('top')
            .lock('bottom')
            .lock('width')
            .lock('height');

        return this;
    },

    // -------------
    _extensionKeyArgs: {tag: pvc.extensionTag},

    _bindProperty: function(pvName, prop, realProp) {
        var me = this;

        if(!realProp) realProp = prop;

        var defaultPropName = "default" + def.firstUpperCase(realProp);
        if(def.fun.is(me[defaultPropName])) {
            // Intercept with default method first, before extensions,
            // so that extensions, when ?existent?, can delegate to the default.

            // Extensions will be applied next.

            // If there already exists an applied extension then
            // do not install the default (used by legend proto defaults,
            // that should act like user extensions, and not be shadowed by prop defaults).

            // Mark default as pvc.extensionTag,
            // so that it is chosen when
            // the user hasn't specified an extension point.

            if(!me.pvMark.hasDelegateValue(pvName, pvc.extensionTag)) {
                var defaultPropMethod = function(scene) {
                    return me[defaultPropName](scene, me._arg);
                };

                me.pvMark.intercept(pvName, defaultPropMethod, me._extensionKeyArgs);
            }
        }

        // Intercept with main property method
        // Do not pass arguments, cause property methods do not use them,
        // they use this.scene instead.
        // The "arg" argument can only be specified explicitly,
        // like in strokeColor -> color and fillColor -> color,
        // via "helper property methods" that ?fix? the argument.
        // In these cases,
        // 'strokeColor' is the "prop",
        // 'color' is the "realProp" and
        // 'strokeStyle' is the pvName.
        var mainPropMethod = this._createPropInterceptor(
                pvName,
                function(scene) { return me[prop](scene); });

        return me._intercept(pvName, mainPropMethod);
    },

    _intercept: function(name, fun) {
        // Apply all extensions, in order
        var mark = this.pvMark,
            extensionAbsIds = this.extensionAbsIds;
        if(extensionAbsIds) {
            def.query(extensionAbsIds)
            .select(function(extensionAbsId) {
                return this.panel._getExtensionAbs(extensionAbsId, name);
             }, this)
            .where(def.notUndef)
            .each(function(extValue) {
                extValue = mark.wrap(extValue, name);

                // Gets set on the mark; We intercept it afterwards.
                // Mark with the pvc.extensionTag so that it is
                // possible to filter extensions.
                mark.intercept(name, extValue, this._extensionKeyArgs);
            }, this);
        }

        // Intercept with specified function (may not be a property function)
        (mark._intercepted || (mark._intercepted = {}))[name] = true;

        mark.intercept(name, fun);

        return this;
    }
})
.prototype
.property('color')
.constructor
.add(pvc.visual.Interactive)
.add({
    extensionAbsIds: null,

    _addInteractive: function(ka) {
        var me  = this,
            get = def.get;

        if(me.interactive()) {
            var bits = me.ibits(),
                I    = pvc.visual.Interactive;

            if(get(ka, 'noTooltip'    )) bits &= ~I.ShowsTooltip;
            if(get(ka, 'noHover'      )) bits &= ~I.Hoverable;
            if(get(ka, 'noClick'      )) bits &= ~I.Clickable;
            if(get(ka, 'noDoubleClick')) bits &= ~I.DoubleClickable;
            if(get(ka, 'noSelect'     )) bits &= ~I.SelectableAny;
            else if(this.selectable()) {
                if(get(ka, 'noClickSelect' )) bits &= ~I.SelectableByClick;
                if(get(ka, 'noRubberSelect')) bits &= ~I.SelectableByRubberband;
            }

            // By default interaction is SHOWN if the sign
            // is sensitive to interactive events.
            if(me.showsInteraction()) {
                if(get(ka, 'showsInteraction') === false) bits &= ~I.ShowsInteraction;
                if(me.showsActivity()  && get(ka, 'showsActivity' ) === false) bits &= ~I.ShowsActivity;
                if(me.showsSelection() && get(ka, 'showsSelection') === false) bits &= ~I.ShowsSelection;
            }

            me._ibits = bits;
        }

        if(!me.handlesEvents()) {
            me.pvMark.events('none');
        } else {
            if(me.showsTooltip()     ) me._addPropTooltip(get(ka, 'tooltipArgs'));
            if(me.hoverable()        ) me._addPropHoverable();
            if(me.handlesClickEvent()) me._addPropClick();
            if(me.doubleClickable()  ) me._addPropDoubleClick();
        }
    },

    /* COLOR */
    fillColor:   function(scene) { return this.color(scene, 'fill'  ); },
    strokeColor: function(scene) { return this.color(scene, 'stroke'); },

    defaultColor: function(scene/*, type*/) { return this.defaultColorSceneScale()(scene); },

    dimColor: function(color, type) {
        if(type === 'text') {
            return pvc.toGrayScale(
                color,
                /*alpha*/-0.75, // if negative, multiplies by color.alpha
                /*maxGrayLevel*/ null,  // null => no clipping
                /*minGrayLevel*/ null); // idem
        }

        // ANALYZER requirements, so until there's no way to configure it...
        return pvc.toGrayScale(
                color,
                /*alpha*/-0.3, // if negative, multiplies by color.alpha
                /*maxGrayLevel*/ null,  // null => no clipping
                /*minGrayLevel*/ null); // idem
    },

    defaultColorSceneScale: function() {
        return def.lazy(this, '_defaultColorSceneScale', this._initDefColorScale, this);
    },

    _initDefColorScale: function() {
        var colorAxis = this.panel.axes.color;
        return colorAxis ?
               colorAxis.sceneScale({sceneVarName: 'color'}) :
               def.fun.constant(pvc.defaultColor);
    },

    mayShowActive: function(scene, noSeries) {
        if(!this.showsActivity()) return false;

        return scene.isActive ||
               (!noSeries && this.isActiveSeriesAware && scene.isActiveSeries()) ||
               scene.isActiveDatum();
    },

    mayShowNotAmongSelected: function(scene) { return this.mayShowAnySelected(scene) && !scene.isSelected(); },
    mayShowSelected:         function(scene) { return this.showsSelection() && scene.isSelected();  },
    mayShowAnySelected:      function(scene) { return this.showsSelection() && scene.anySelected(); },

    /* TOOLTIP */
    _addPropTooltip: function(ka) {
        if(this.pvMark.hasTooltip) { return; }

        var tipOptions = def.create(
                            this.chart._tooltipOptions,
                            def.get(ka, 'options'));

        tipOptions.isLazy = def.get(ka, 'isLazy', true);

        var tooltipFormatter = def.get(ka, 'buildTooltip') ||
                           this._getTooltipFormatter(tipOptions);
        if(!tooltipFormatter) return;

        tipOptions.isEnabled = this._isTooltipEnabled.bind(this);

        var tipsyEvent = def.get(ka, 'tipsyEvent');
        if(!tipsyEvent) {
//          switch(pvMark.type) {
//                case 'dot':
//                case 'line':
//                case 'area':
//                    this._requirePointEvent();
//                    tipsyEvent = 'point';
//                    tipOptions.usesPoint = true;
//                    break;

//                default:
                    tipsyEvent = 'mouseover';
//            }
        }

        this.pvMark
            .localProperty('tooltip'/*, Function | String*/)
            .tooltip(this._createTooltipProp(tooltipFormatter, tipOptions.isLazy))
            .title(def.fun.constant('')) // Prevent browser tooltip
            .ensureEvents()
            .event(tipsyEvent, pv.Behavior.tipsy(tipOptions))
            .hasTooltip = true;
    },

    _getTooltipFormatter: function(tipOptions) { return this.panel._getTooltipFormatter(tipOptions); },

    // Dynamic result version
    _isTooltipEnabled: function() { return this.panel._isTooltipEnabled(); },

    _createTooltipProp: function(tooltipFormatter, isLazy) {
        var me = this,
            formatTooltip;

        if(!isLazy) {
            formatTooltip = function(scene) {
                var context = me.context(scene);
                return tooltipFormatter(context);
            };
        } else {
            formatTooltip = function(scene) {
                // Capture current context
                var context = me.context(scene, /*createNew*/true),
                    tooltip;

                // Function that formats the tooltip only on first use
                return function() {
                    if(context) {
                        tooltip = tooltipFormatter(context);
                        context = null; // release context;
                    }
                    return tooltip;
                };
            };
        }

        return function(scene) {
            if(scene && !scene.isIntermediate && scene.showsTooltip())
                return formatTooltip(scene);
        };
    },

    /* HOVERABLE */
    _addPropHoverable: function() {
        var panel  = this.panel,
            onEvent, offEvent;

//        switch(pvMark.type) {
//            default:
//            case 'dot':
//            case 'line':
//            case 'area':
//            case 'rule':
//                onEvent  = 'point';
//                offEvent = 'unpoint';
//               panel._requirePointEvent();
//                break;

//            default:
                onEvent = 'mouseover';
                offEvent = 'mouseout';
//                break;
//        }

        this.pvMark
            .ensureEvents()
            .event(onEvent, function(scene) {
                if(scene.hoverable() && !panel.selectingByRubberband() && !panel.animating()) {
                    scene.setActive(true);
                    panel.renderInteractive();
                }
            })
            .event(offEvent, function(scene) {
                if(scene.hoverable() && !panel.selectingByRubberband() && !panel.animating()) {
                     // Clears THE active scene, if ANY (not necessarily = scene)
                    if(scene.clearActive()) panel.renderInteractive();
                }
            });
    },

    /* CLICK & DOUBLE-CLICK */
    /**
     * Shared state between {@link _handleClick} and {@link #_handleDoubleClick}.
     */
    _ignoreClicks: 0,

    _propCursorClick: function(s) {
        var ibits = (this.ibits() & s.ibits()),
            I = pvc.visual.Interactive;
        //noinspection JSBitwiseOperatorUsage
        return (ibits & I.HandlesClickEvent) || (ibits & I.DoubleClickable) ?
               'pointer' :
               null;
    },

    _addPropClick: function() {
        var me = this;
        me.pvMark
            .cursor(me._propCursorClick.bind(me))
            .ensureEvents()
            .event('click', me._handleClick.bind(me));
    },

    _addPropDoubleClick: function() {
        var me = this;
        me.pvMark
            .cursor(me._propCursorClick.bind(me))
            .ensureEvents()
            .event('dblclick', me._handleDoubleClick.bind(me));
    },

    _handleClick: function() {
        /*global window:true*/

        // TODO: implement click/doubleClick exclusiveness directly on protovis...
        // Avoid this PV context plumbing here!

        // Not yet in context...
        var me = this,
            pvMark = me.pvMark,
            pvInstance = pvMark.instance(),
            scene = pvInstance.data,
            wait  = me.doubleClickable() && scene.doubleClickable();
        if(!wait) {
            if(me._ignoreClicks) me._ignoreClicks--;
            else                 me._handleClickCore();
        } else {
            var pvScene = pvMark.scene,
                pvIndex = pvMark.index,
                pvEvent = pv.event;

            // Delay click evaluation so that
            // it may be canceled if a double-click meanwhile fires.
            // When timeout finished, reestablish protovis context.
            window.setTimeout(function() {
                if(me._ignoreClicks) {
                    me._ignoreClicks--;
                } else {
                    try {
                        pv.event = pvEvent;
                        pvMark.context(pvScene, pvIndex, function() { me._handleClickCore(); });
                    } catch (ex) {
                        pv.error(ex);
                    } finally {
                        delete pv.event;
                    }
                }
             },
             me.chart.options.doubleClickMaxDelay || 300);
        }
    },

    _handleClickCore: function() {
        this._onClick(this.context());
    },

    _handleDoubleClick: function() {
        // The following must be tested before delegating to context
        // because we might not need to ignore the clicks.
        // Assumes that: this.doubleClickable()
        var me = this,
            scene = me.scene();
        if(scene && scene.doubleClickable()) {
            // TODO: explain why 2 ignores
            me._ignoreClicks = 2;
            // Setup the sign context
            me._onDoubleClick(me.context(scene));
        }
    },

    _onClick:       function(context) { context.click();       },
    _onDoubleClick: function(context) { context.doubleClick(); }
});

/**
 * Pass this function to an extension point with a final property value
 * to ensure that it will not be processed anymore.
 * @param v the final value.
 * @return {any} the final value.
 */
pvc.finished = function(v) {
    if(def.fun.is(v))
        return function() {
            return (this.finished ? this : this.getSign()).finished(v.apply(this, arguments));
        };

    return function() {
        return (this.finished ? this : this.getSign()).finished(v);
    };
};