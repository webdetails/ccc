/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_Sides:true, pvc_Size:true */
def
.type('pvc.BaseChart', pvc.Abstract)
.add(pvc.visual.Interactive)
.add(def.EventSource)
.init(function(options) {
    var originalOptions = options;

    var parent = this.parent = def.get(options, 'parent') || null;
    if(parent) {
        /*jshint expr:true */
        options || def.fail.argumentRequired('options');
    } else {
        if(pvc_initChartClassDefaults) pvc_initChartClassDefaults();
        options = def.mixin.copy({}, this.defaults, options);
    }

    this.options = options;

    if(parent) {
        this.root = parent.root;
        this.smallColIndex = options.smallColIndex; // required for the logId mask, setup in base
        this.smallRowIndex = options.smallRowIndex;
    } else {
        this.root = this;
        this._format = cdo.format.language().createChild();
    }

    this.base();

    if(def.debug >= 3)
        this.log.info("NEW CHART\n" + def.logSeparator.replace(/-/g, '=') +
                "\n  DebugLevel: " + def.debug);

    /* DEBUG options */
    if(def.debug >= 3 && !parent && originalOptions) {
        this.log.info("OPTIONS:\n", originalOptions);
        if(def.debug >= 5)
            // Log also as text, for easy copy paste of options JSON
            this.log.debug(def.describe(originalOptions, {ownOnly: false, funs: true}));
    }

    if(parent) parent._addChild(this);

    this._constructData(options);
    this._constructVisualRoles(options);
})
.add({
    /**
     * Indicates if the chart has been disposed.
     */
    _disposed: false,

    /**
     * The chart's parent chart.
     *
     * <p>
     * The root chart has null as the value of its parent property.
     * </p>
     *
     * @type pvc.BaseChart
     */
    parent: null,

    /**
     * The chart's child charts.
     *
     * @type pvc.BaseChart[]
     */
    children: null,

    /**
     * The chart's root chart.
     *
     * <p>
     * The root chart has itself as the value of the root property.
     * </p>
     *
     * @type pvc.BaseChart
     */
    root: null,

    /**
     * Indicates if the chart has been created.
     * <p>
     * This field is set to <tt>false</tt>
     * at the beginning of the {@link #_create} method
     * and set to <tt>true</tt> at the end.
     * </p>
     * <p>
     * When a chart is re-rendered it can,
     * optionally, also repeat the creation phase.
     * </p>
     *
     * @type boolean
     */
    isCreated: false,

    /**
     * The version value of the current/last creation.
     *
     * <p>
     * This value is changed on each creation of the chart.
     * It can be useful to invalidate cached information that
     * is only valid for each creation.
     * </p>
     * <p>
     * Version values can be compared using the identity operator <tt>===</tt>.
     * </p>
     *
     * @type any
     */
    _createVersion: 0,

    /**
     * A callback function that is called
     * when the protovis' panel render is about to start.
     *
     * <p>
     * Note that this is <i>after</i> the creation phase.
     * </p>
     *
     * <p>
     * The callback is called with no arguments,
     * but having the chart instance as its context (<tt>this</tt> value).
     * </p>
     *
     * @function
     */
    renderCallback: undefined,

    /**
     * Contains the number of pages that a multi-chart contains
     * when rendered with the previous render options.
     * <p>
     * This property is updated after a render of a chart
     * where the visual role "multiChart" is assigned and
     * the option "multiChartPageIndex" has been specified.
     * </p>
     *
     * @type number|null
     */
    multiChartPageCount: null,

    /**
     * Contains the currently rendered multi-chart page index,
     * relative to the previous render options.
     * <p>
     * This property is updated after a render of a chart
     * where the visual role "multiChart" is assigned and
     * the <i>option</i> "multiChartPageIndex" has been specified.
     * </p>
     *
     * @type number|null
     */
    multiChartPageIndex: null,

    _multiChartOverflowClipped: false,

    left: 0,
    top:  0,

    width: null,
    height: null,
    margins:  null,
    paddings: null,

    _allowV1SecondAxis: false,


    /**
     * Indicates if the previous layout is to be preserved.
     * <p>
     * This field is set to <tt>false</tt>
     * until the second call to the {@link #_create} method,
     * where it is set to <tt>true</tt> if a previous render
     * has occurred, by testing if the plot panels already existed
     * </p>
     * <p>
     * This will consequently indicate that the chart is a re-render
     * </p>
     *
     * @type boolean
     */
    _preserveLayout: false,


    //------------------
    compatVersion: function(options) { return (options || this.options).compatVersion; },

    /**
     * Gets the value of a compatibility flag, given its name.
     *
     * @param {string} flagName - The name of the compatibility flag.
     * @return {any} The value of the compatibility flag.
     */
    getCompatFlag: function(flagName) {
        return this.options.compatFlags[flagName];
    },

    _createLogId: function() {
        return "" + def.qualNameOf(this.constructor) + this._createLogChildSuffix();
    },

    _createLogChildSuffix: function() {
        return this.parent ?
               (" (" + (this.smallRowIndex + 1) + "," +
                       (this.smallColIndex + 1) + ")") :
               "";
    },

    _addChild: function(childChart) {
        /*jshint expr:true */
        (childChart.parent === this) || def.assert("Not a child of this chart.");

        this.children.push(childChart);
    },

    /**
     * Save plots layout information if the preserveLayout option is specified as true.
     * This has to be done before cleanup.
     */
    _savePlotsLayout: function() {
        if(this.options.preserveLayout && this.plotPanelList && this.plotPanelList.length) {

            this._preservedPlotsLayoutInfo = {};

            this.plotPanelList.forEach(function(plotPanel) {
                this._preservedPlotsLayoutInfo[plotPanel.plot.id] = plotPanel._getLayoutState();
            }, this);

            this._preserveLayout = true;
        }
    },

    /**
     * Building the visualization is made in 2 stages:
     * First, the {@link #_create} method prepares and builds
     * every object that will be used.
     *
     * Later the {@link #render} method effectively renders.
     */
    _create: function(keyArgs) {
        this._createPhase1(keyArgs);
        this._createPhase2();
    },

    _createPhase1: function(keyArgs) {
        /* Increment create version to allow for cache invalidation  */
        this._createVersion++;

        this.isCreated = false;

        if(def.debug >= 3) this.log("Creating");

        var isRoot = !this.parent,
            isMultiChartOverflowRetry = this._isMultiChartOverflowClipRetry,
            isRootInit = isRoot && !isMultiChartOverflowRetry && !this.data,
            hasMultiRole;

        // TODO: does not work for multicharts...
        this._savePlotsLayout();

        // CLEAN UP
        if(isRoot) this.children = [];
        this.plotPanels = {};
        this.plotPanelList = [];

        // Options may be changed between renders
        if(!isRoot || !isMultiChartOverflowRetry) this._processOptions();

        if(isRootInit) {
            this._processDataOptions(this.options);

            // Any data exists or throws
            // (must be done AFTER processing options
            //  because of width, height properties and noData extension point...)
            this._checkNoDataI();

            // Initialize chart-level/root visual roles.
            this._initChartVisualRoles();
        }

        // Initialize plots. These also define own visualRoles.
        if(isRootInit || !isRoot) this._initPlots();

        // Initialize the data (and _bindVisualRolesPost)
        if(!isMultiChartOverflowRetry) {
            this._initData(keyArgs);

            // When data is excluded, there may be no data after all
            if(isRoot) this._checkNoDataII();
        }

        hasMultiRole = this.visualRoles.multiChart.isBound();

        if(!isMultiChartOverflowRetry) this._initAxesEnd();

        if(isRoot) {
            if(hasMultiRole) this._initMultiCharts();

            // Trends and Interpolation on Root Chart only.
            this._interpolate(hasMultiRole);

            // Interpolated data affects generated trends.
            this._generateTrends(hasMultiRole);
        }

        this._setAxesScales(this._chartLevel());
    },

    _createPhase2: function() {
        var hasMultiRole = this.visualRoles.multiChart.isBound();

        // Initialize chart panels
        this._initChartPanels(hasMultiRole);

        this.isCreated = true;
    },

    _setSmallLayout: function(keyArgs) {
        if(keyArgs) {
            var me = this, basePanel = me.basePanel;

            function setProp(p) {
                var v = keyArgs[p];
                if(v != null) return (me[p] = v), true;
            }

            // NOTE: bitwise or is on purpose so that both are always evaluated
            //noinspection JSBitwiseOperatorUsage
            if((setProp('left') | setProp('top')) && basePanel)
                def.set(basePanel.position, 'left', this.left, 'top', this.top);

            //noinspection JSBitwiseOperatorUsage
            if((setProp('width') | setProp('height')) && basePanel)
                basePanel.size = new pvc_Size(this.width, this.height);

            if(setProp('margins' ) && basePanel) basePanel.margins  = new pvc_Sides(this.margins );
            if(setProp('paddings') && basePanel) basePanel.paddings = new pvc_Sides(this.paddings);
        }
    },

    /**
     * Processes options after user options and defaults have been merged.
     * Applies restrictions,
     * performs validations and
     * options values implications.
     */
    _processOptions: function() {
        var options = this.options, plotSpecs;
        if(!this.parent) {
            this.width    = options.width;
            this.height   = options.height;
            this.margins  = options.margins;
            this.paddings = options.paddings;
        }

        if(this.compatVersion() <= 1) {
            options.plot2 = this._allowV1SecondAxis && !!options.secondAxis;
        } else if(!options.plot2 && (plotSpecs = options.plots)) {
            options.plot2 = def.array.is(plotSpecs)
                ? def.query(plotSpecs)
                    .where(function (plotSpec) {
                        return plotSpec.name === 'plot2';
                    }).any()
                : !!plotSpecs.plot2;
        }

        this._processFormatOptions(options);

        this._processOptionsCore(options);

        this._processExtensionPoints();

        return options;
    },

    /**
     * Processes options after user options and default options have been merged.
     * Override to apply restrictions, perform validation or
     * options values implications.
     * When overridden, the base implementation should be called.
     * The implementation must be idempotent -
     * its successive application should yield the same results.
     * @virtual
     */
    _processOptionsCore: function(options) {
        var parent = this.parent;
        if(!parent) {
            var interactive = (pv.renderer() !== 'batik');
            if(interactive && (interactive = options.interactive) == null) interactive = true;

            var ibits = 0;
            if(interactive) {
                var I = pvc.visual.Interactive;
                ibits = I.Interactive | I.ShowsInteraction;

                if(this._processTooltipOptions(options)) ibits |= I.ShowsTooltip;

                // NOTE: VML animations perform really bad,
                //  and so its better for the user experience to be deactivated.
                if(options.animate && $.support.svg) ibits |= I.Animatable;

                var preventUnselect = false;
                if(options.selectable) {
                    ibits |= I.Selectable;

                    switch(pvc.parseSelectionMode(options.selectionMode)) {
                        case 'rubberbandorclick':
                            ibits |= (I.SelectableByRubberband | I.SelectableByClick);
                            break;

                        case 'rubberband':
                            ibits |= I.SelectableByRubberband;
                            break;

                        case 'click':
                            ibits |= I.SelectableByClick;
                            break;

                        case 'focuswindow':
                            ibits |= I.SelectableByFocusWindow;
                            preventUnselect = true;
                            break;
                    }
                }

                if(!preventUnselect && pvc.parseClearSelectionMode(options.clearSelectionMode) === 'emptyspaceclick')
                    ibits |= I.Unselectable;

                if(options.hoverable) ibits |= I.Hoverable;
                if(options.clickable) ibits |= (I.Clickable | I.DoubleClickable);

                this._processPointingOptions(options);

                var evs;
                if((evs = options.on    )) this.on    (evs);
                if((evs = options.before)) this.before(evs);
                if((evs = options.after )) this.after (evs);
            }
        } else {
            ibits = parent.ibits();
            this._tooltipOptions  = parent._tooltipOptions;
            this._pointingOptions = parent._pointingOptions;
        }
        this._ibits = ibits;
    },

    _pointingDefaults: {
        // mode: 'near', // 'over'
        radius: 10,
        radiusHyst: 4,
        stealClick: true,
        collapse: 'none'// 'x', 'y', 'none'
    },

    _tooltipDefaults: {
        gravity:      's',
        animate:      undefined,
        delayIn:      200,
        delayOut:     80, // smoother moving between marks with tooltips, possibly slightly separated
        offset:       2,
        opacity:      0.9,
        html:         true,
        fade:         true,
        useCorners:   false,
        arrowVisible: true,
        followMouse:  false,
        format:       undefined,
        className:    ''
    },

    _processTooltipOptions: function(options) {
        var isV1Compat = this.compatVersion() <= 1,
            tipOptions = options.tooltip,
            tipEnabled = options.tooltipEnabled;

        if(tipEnabled == null) {
            if(tipOptions) tipEnabled = tipOptions.enabled;
            if(tipEnabled == null) {
                if(isV1Compat) tipEnabled = options.showTooltips;
                if(tipEnabled == null) tipEnabled = true;
            }
        }

        if(tipEnabled) {
            tipOptions = tipOptions ? def.copy(tipOptions) : {};

            if(isV1Compat) this._importV1TooltipOptions(tipOptions, options);

            def.eachOwn(this._tooltipDefaults, function(dv, p) {
                var value = options['tooltip' + def.firstUpperCase(p)];
                if(value !== undefined)
                    tipOptions[p] = value;
                else if(tipOptions[p] === undefined)
                    tipOptions[p] = dv;
            });
        }

        this._tooltipOptions = tipOptions || {};

        return tipEnabled;
    },

    _importV1TooltipOptions: function(tipOptions, options) {
        var v1TipOptions = options.tipsySettings;
        if(v1TipOptions) {
            this.extend(v1TipOptions, 'tooltip');

            for(var p in v1TipOptions) if(tipOptions[p] === undefined) tipOptions[p] = v1TipOptions[p];

            // Force V1 html default
            if(tipOptions.html == null) tipOptions.html = false;
        }
    },

    _processPointingOptions: function(options) {
        var pointingOptions = options.pointing,
            pointingMode    = options.pointingMode;

        if(pointingMode == null) {
            if(pointingOptions) pointingMode = pointingOptions.mode;
            if(!pointingMode) pointingMode = 'near';
        }

        pointingOptions = pointingOptions ? def.copyOwn(pointingOptions) : {};
        pointingOptions.mode = pvc.parsePointingMode(pointingMode);

        def.eachOwn(this._pointingDefaults, function(dv, p) {
            if(pointingOptions[p] === undefined) pointingOptions[p] = dv;
        });

        pointingOptions.collapse = pvc.parsePointingCollapse(pointingOptions.collapse);
        pointingOptions.painted  = true;
        this._pointingOptions = pointingOptions || {};
    },

    _processFormatOptions: function(options) {
        if(!this.parent) {
            var format = options.format;
            if(format != undefined) this.format(format);

            var fp = this._format;
            this._processFormatOption(options, fp, 'number',  'valueFormat');
            this._processFormatOption(options, fp, 'percent', 'percentValueFormat');
        }
    },

    _processFormatOption: function(options, formatProvider, formatName, optionName) {
        // Was the format explicitly set through the new interface?
        var format = formatProvider[formatName]();
        if(format !== cdo.format.defaults[formatName]()) {
            // The new interface takes precedence over the legacy options property.
            options[optionName] = format;
        } else {
            // Was it explicitly set through the old interface?
            var optionFormat = options[optionName];
            if(optionFormat && optionFormat !== format) {
                if(!optionFormat._nullWrapped) {
                    // Force no null handling, as in V1's valueFormat.
                    options[optionName] = optionFormat = pv.Format.createFormatter(optionFormat);
                    optionFormat._nullWrapped = 1;
                }

                // Set it in the chart's default format.
                formatProvider[formatName](optionFormat);
            }
        }
    },

    _processDataOptions: function(options) {
        var dataOptions = options.dataOptions || (options.dataOptions = {});

        function processDataOption(globalName, localName, dv) {
            var v = options[globalName];
            if(v !== undefined) dataOptions[localName] = (v == null || v === '' ? dv : v);
            else if(dv != undefined && dataOptions[localName] === undefined) dataOptions[localName] = dv;
        }

        processDataOption('dataSeparator',            'separator', '~');
        processDataOption('dataMeasuresInColumns',    'measuresInColumns');
        processDataOption('dataCategoriesCount',      'categoriesCount');
        processDataOption('dataIgnoreMetadataLabels', 'ignoreMetadataLabels');
        processDataOption('dataWhere',                'where');
        processDataOption('dataTypeCheckingMode',     'typeCheckingMode');

        var plot2 = options.plot2,
            plot2Series, plot2SeriesIndexes;
        if(plot2) {
            if(this._allowV1SecondAxis && (this.compatVersion() <= 1)) {
                plot2SeriesIndexes = options.secondAxisIdx;
            } else {
                // Visual roles are not yet defined at this stage. For now just process the option.
                plot2Series = options.plot2Series ? def.array.as(options.plot2Series) : null;

                // TODO: temporary implementation based on V1s secondAxisIdx's implementation
                // until a real "series visual role" based implementation exists.
                if(!plot2Series || !plot2Series.length) {
                    plot2Series = null;
                    plot2SeriesIndexes = options.plot2SeriesIndexes;
                }
            }
            if(!plot2Series) plot2SeriesIndexes = def.parseDistinctIndexArray(plot2SeriesIndexes, -Infinity) || -1;
        }

        options.plot2Series = plot2Series;
        options.plot2SeriesIndexes = plot2SeriesIndexes;

        // measuresInRows
        dataOptions.measuresIndex = dataOptions.measuresIndex || dataOptions.measuresIdx;
        dataOptions.measuresCount = dataOptions.measuresCount || dataOptions.numMeasures;
    },

    // --------------

    /**
     * Gets, sets or configures the chart-level format provider.
     *
     * Always affects the root chart's format provider.
     *
     * @param {cdo.FormatProvider|object|any} [_] The new format provider,
     * a configuration object, or any other configuration value supported by
     * the format provider class.
     *
     * @return {pvc.BaseChart|cdo.FormatProvider} <tt>this</tt> or the current format provider.
     */
    format: function(_) {
        var r = this.root;
        if(r !== this) return r.format.apply(r, arguments);

        var v1 = this._format;
        if(arguments.length) {
            if(!_) throw def.error.argumentRequired('format');
            if(_ !== v1) {
                if(!def.is(_, cdo.format)) {
                    if(v1) return def.configure(v1, _), this;

                    _ = cdo.format(_);
                }
                this._format = _;
            }
            return this;
        }
        return v1;
    },

    // --------------

    /**
     * Render the visualization.
     * If not created, do it now.
     */
    render: function(keyArgs) {
        var hasError,
            renderError = null,
            bypassAnimation,
            recreate,
            reloadData,
            addData,
            dataOnRecreate;

        if(arguments.length === 1 && keyArgs && typeof keyArgs === 'object') {
            bypassAnimation = keyArgs.bypassAnimation;
            recreate = keyArgs.recreate;
            dataOnRecreate = recreate && keyArgs.dataOnRecreate;
            reloadData = dataOnRecreate === 'reload';
            addData = dataOnRecreate === 'add';
        } else {
            bypassAnimation = arguments[0];
            recreate = arguments[1];
            reloadData = arguments[2];
            addData = false;
        }

        /*global console:true*/
        if(def.debug > 1) this.log.group("CCC RENDER");

        this._lastRenderError = null;

        // Don't let selection change events to fire before the render is finished
        this._suspendSelectionUpdate();
        try {
            this.useTextMeasureCache(function() {
                try {
                    while(true) {
                        if(!this.parent)
                            pvc.removeTipsyLegends();

                        if(!this.isCreated || recreate)
                            this._create({reloadData: reloadData, addData: addData});

                        // TODO: Currently, the following always redirects the call
                        // to topRoot.render;
                        // so why should BaseChart.render not do the same?
                        this.basePanel.render({
                            bypassAnimation: bypassAnimation,
                            recreate: recreate
                        });

                        // Check if it is necessary to retry the create
                        // due to multi-chart clip overflow.
                        if(!this._isMultiChartOverflowClip) {
                            // NO
                            this._isMultiChartOverflowClipRetry = false;
                            break;
                        }

                        // Overflowed & Clip
                        recreate   = true;
                        reloadData = false;
                        this._isMultiChartOverflowClipRetry = true;
                        this._isMultiChartOverflowClip = false;
                        this._multiChartOverflowClipped = true;
                    }
                } catch(e) {
                    renderError = e;

                    if(e instanceof pvc.NoDataException) {
                        this._addErrorPanelMessage(e.message, "noDataMessage");
                    } else if(e instanceof pvc.InvalidDataException) {
                        this._addErrorPanelMessage(e.message, "invalidDataMessage");
                    } else {
                        hasError = true;

                        // We don't know how to handle this
                        this.log.error(e.message);

                        if(def.debug > 0) this._addErrorPanelMessage("Error: " + e.message, "errorMessage");
                        //throw e;
                    }
                }
            });
        } finally {
            this._lastRenderError = renderError;
            if(!hasError) this._resumeSelectionUpdate();
            if(def.debug > 1) this.log.groupEnd();
        }

        return this;
    },

    /**
     * Gets the error of the last render operation, if one occurred, or `null`.
     *
     * This method currently only returns local errors and not errors occurring in child charts.
     *
     * The `NoDataException` error is being thrown from within the *root* chart's _create method,
     * as soon as the condition is identified.
     *
     * In contrast, the `InvalidDataException` is being thrown by plot panels,
     * from within their _calcLayout or _createCore methods, which is where this situation is detectable first.
     *
     * Currently, this is only being _thrown_ if a plot panel is a root panel (in multi-charts, blank plot panels appear),
     * but nothing impedes a small-chart from throwing the error and displaying it at its base panel.
     *
     * When one small-chart has an `InvalidDataException`, other small-charts still render normally.
     *
     * @return {Error} The last render error, if any.
     */
    getLastRenderError: function() {
        return this._lastRenderError;
    },

    /**
     * Resizes a chart given new dimensions.
     *
     * When both dimensions are nully, this method does nothing.
     *
     * If the chart's previous layout, if any, had already reached its minimum size (in both directions),
     * and the both the specified dimensions are smaller than or equal to the previous layout's
     * requested size, then this method does nothing.
     *
     * This method does not perform render animations or reload data.
     *
     * @param {number} [width]  - The new width of the chart. Ignored when nully.
     * @param {number} [height] - The new height of the chart. Ignored when nully.
     *
     * @returns {!pvc.visual.Chart} The chart instance.
     */
    renderResize: function(width, height) {

        var canResizeWidth = width != null;
        var canResizeHeight = height != null;

        if(!canResizeWidth && !canResizeHeight) return this;

        // Unfortunately, in the face of min-size constraints,
        // the layout algorithm is sensitive to initial conditions.
        // So the layout is prevented if the previous layout had already attempted to go below the minimum size.
        var basePanel = this.basePanel;
        if(basePanel) {
            if(canResizeWidth) canResizeWidth = width !== basePanel.width;
            if(canResizeHeight) canResizeHeight = height !== basePanel.height;

            var prevLayoutInfo;
            var sizeIncrease;
            if((prevLayoutInfo = basePanel.getLayout()) && (sizeIncrease = prevLayoutInfo.sizeIncrease)) {

                if(canResizeWidth) canResizeWidth = !sizeIncrease.width || (width > basePanel.width);
                if(canResizeHeight) canResizeHeight = !sizeIncrease.height  || (height > basePanel.height);

                if(!canResizeWidth && !canResizeHeight) return this;
            }
        }

        // JIC the use changed options.width/height before calling this method,
        // restoring the previous recreate values.

        if(canResizeWidth)
            this.options.width = width;
        else if(basePanel)
            this.options.width = this.width;


        if(canResizeHeight)
            this.options.height = height;
        else if(basePanel)
            this.options.height = this.height;

        return this.render(true, true, false);
    },

    _addErrorPanelMessage: function(text, extensionId) {
        if(def.debug > 1) this.log(text);

        var doRender = !extensionId || (this._getExtension(extensionId, "visible") !== false);
        if(doRender) {
            var options = this.options,
                pvPanel = new pv.Panel()
                    .canvas(options.canvas)
                    .width(this.width)
                    .height(this.height),
                pvMsg = pvPanel.anchor("center").add(pv.Label)
                    .text(text);

            if(extensionId) this.extend(pvMsg, extensionId);

            pvPanel.render();
        }
    },

    useTextMeasureCache: function(fun, ctx) {
        var root = this.root,
            textMeasureCache = root._textMeasureCache ||
                               (root._textMeasureCache = pv.Text.createCache());

        return pv.Text.usingCache(textMeasureCache, fun, ctx || this);
    },

    /**
     * Animation
     */
    animate: function(start, end) { return this.basePanel.animate(start, end); },

    /**
     * Indicates if the chart is currently
     * rendering the animation start phase.
     * <p>
     * Prefer using this function instead of {@link #animate}
     * whenever its <tt>start</tt> or <tt>end</tt> arguments
     * involve a non-trivial calculation.
     * </p>
     *
     * @type boolean
     */
    animatingStart: function() { return this.basePanel.animatingStart(); },

    /**
     * Indicates if a chart is currently rendering an animation.
     * @type boolean
     */
    animating: function() {
        return !!this.basePanel && this.basePanel.animating();
    },

    isOrientationVertical: function(orientation) {
        return (orientation || this.options.orientation) === pvc.orientation.vertical;
    },

    isOrientationHorizontal: function(orientation) {
        return (orientation || this.options.orientation) === pvc.orientation.horizontal;
    },

    /**
     * Disposes the chart, any of its panels and child charts.
     */
    dispose: function() {
        if(!this._disposed) {
            this._disposed = true;

            var pvRootPanel = this.basePanel && this.basePanel.pvRootPanel,
                tipsy = pv.Behavior.tipsy;

            if(tipsy && tipsy.disposeAll)
                tipsy.disposeAll(pvRootPanel);

            if(pvRootPanel) pvRootPanel.dispose();
        }
    },

    defaults: {
//        canvas: null,

        width:  400,
        height: 300,
//      plotSizeMin: undefined

//      margins:  undefined,
//      paddings: undefined,
//      contentMargins:  undefined,
//      contentPaddings: undefined,
//      leafContentOverflow: 'auto',
//      multiChartMax: undefined,
//      multiChartColumnsMax: undefined,
//      multiChartSingleRowFillsHeight: undefined,
//      multiChartSingleColFillsHeight: undefined,
//      multiChartOverflow: 'grow',

//      smallWidth:       undefined,
//      smallHeight:      undefined,
//      smallAspectRatio: undefined,
//      smallMargins:     undefined,
//      smallPaddings:    undefined,

//      smallContentMargins:  undefined,
//      smallContentPaddings: undefined,
//      smallTitleVisible:  undefined,
//      smallTitlePosition: undefined,
//      smallTitleAlign:    undefined,
//      smallTitleAlignTo:  undefined,
//      smallTitleOffset:   undefined,
//      smallTitleKeepInBounds: undefined,
//      smallTitleSize:     undefined,
//      smallTitleSizeMax:  undefined,
//      smallTitleMargins:  undefined,
//      smallTitlePaddings: undefined,
//      smallTitleFont:     undefined,

        orientation: 'vertical',

//        extensionPoints:   undefined,
//
//        visualRoles:       undefined,
//        dimensions:        undefined,
//        dimensionGroups:   undefined,
//        calculations:      undefined,
//        readers:           undefined,

        ignoreNulls:       true, // whether to ignore or keep "null"-measure datums upon loading
        crosstabMode:      true,
//        multiChartIndexes: undefined,
        isMultiValued:     false,
        seriesInRows:      false,
        groupedLabelSep:   undefined,
//        measuresIndexes:   undefined,
//        dataOptions:       undefined,
//        dataSeparator
//        dataMeasuresInColumns
//        dataCategoriesCount
//        dataIgnoreMetadataLabels: false

//        timeSeries:        undefined,
//        timeSeriesFormat:  undefined,

        animate: true,

//        title:         null,
        //titleVisible:  undefined,
        titlePosition: "top", // options: bottom || left || right
        titleAlign:    "center", // left / right / center
//        titleAlignTo:  undefined,
//        titleOffset:   undefined,
//        titleKeepInBounds: undefined,
//        titleSize:     undefined,
//        titleSizeMax:  undefined,
//        titleMargins:  undefined,
//        titlePaddings: undefined,
//        titleFont:     undefined,

        legend:           false, // Show Legends
        legendPosition:   "bottom",
//        legendFont:       undefined,
//        legendSize:       undefined,
//        legendSizeMax:    undefined,
//        legendAlign:      undefined,
//        legendAlignTo:    undefined,
//        legendOffset:     undefined,
//        legendKeepInBounds:   undefined,
//        legendMargins:    undefined,
//        legendPaddings:   undefined,
//        legendTextMargin: undefined,
//        legendItemPadding:    undefined, // ATTENTION: this is different from legendPaddings
//        legendMarkerSize: undefined,

//        colors: null,

//SlidingWindow options

        slidingWindow: false,
//      slidingWindowLength: undefined,
//      slidingWindowDimension: undefined,
//      slidingWindowSelect: undefined,
//      preserveLayout: undefined,

        v1StyleTooltipFormat: function(s, c, v, datum) {
            return s + ", " + c + ":  " + this.chart.options.valueFormat(v) +
                   (datum && datum.percent ? ( " (" + datum.percent.label + ")") : "");
        },

        // Initialized lazily, upon first chart creation.
        //valueFormat:        cdo.numberFormat("#,0.##"),
        //percentValueFormat: cdo.numberFormat("#,0.#%"),

        //interactive: true,

        // Content/Plot area clicking
        clickable:  false,
//        clickAction: null,
//        doubleClickAction: null,
        doubleClickMaxDelay: 300, //ms
//
        hoverable:  false,

        selectable:    false,
        selectionMode: 'rubberbandOrClick',
        //selectionCountMax: 0, // <= 0 -> no limit

//        selectionChangedAction: null,
//        userSelectionAction: null,

        // Use CTRL key to make fine-grained selections
        ctrlSelectMode: true,
        clearSelectionMode: 'emptySpaceClick', // or null <=> 'manual' (i.e., by code)

//        renderCallback: undefined,

        compatVersion: Infinity, // numeric, 1 currently recognized
        compatFlags:   {
            discreteTimeSeriesTickFormat: true
        }
    }
});

var pvc_initChartClassDefaults = function() {
    var defaults = pvc.BaseChart.prototype.defaults;

    // Initialize CCC global defaults for valueFormat and percentValueFormat.
    // Lazy initialization of formats allows changing global default styles after ccc files' loading.
    if(!defaults.valueFormat)        defaults.valueFormat        = cdo.format.defaults.number ();
    if(!defaults.percentValueFormat) defaults.percentValueFormat = cdo.format.defaults.percent();
    pvc_initChartClassDefaults = null;
};
