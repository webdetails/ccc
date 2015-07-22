/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

pvc.BaseChart
.add({
    /**
     * The base panel is the root container of a chart.
     * <p>
     * The base panel of a <i>root chart</i> is the top-most root container.
     * It has {@link pvc.BasePanel#isTopRoot} equal to <tt>true</tt>.
     * </p>
     * <p>
     * The base panel of a <i>non-root chart</i> is the root of the chart's panels,
     * but is not the top-most root panel, over the charts hierarchy.
     * </p>
     *
     * @type pvc.BasePanel
     */
    basePanel:   null,

    /**
     * The panel that shows the chart's title.
     * <p>
     * This panel is the first child of {@link #basePanel} to be created.
     * It is only created when the chart has a non-empty title.
     * </p>
     * <p>
     * Being the first child causes it to occupy the
     * whole length of the side of {@link #basePanel}
     * to which it is <i>docked</i>.
     * </p>
     *
     * @type pvc.TitlePanel
     */
    titlePanel:  null,

    /**
     * The panel that shows the chart's main legend.
     * <p>
     * This panel is the second child of {@link #basePanel} to be created.
     * There is an option to not show the chart's legend,
     * in which case this panel is not created.
     * </p>
     *
     * <p>
     * The current implementation of the legend panel
     * presents a <i>discrete</i> association of colors and labels.
     * </p>
     *
     * @type pvc.LegendPanel
     */
    legendPanel: null,

    /**
     * The panel that hosts child chart's base panels.
     *
     * @type pvc.MultiChartPanel
     */
    _multiChartPanel: null,

    _initChartPanels: function(hasMultiRole) {
        this._initBasePanel ();
        this._initTitlePanel();

        // null on small charts or when not enabled
        var preserve = this._preserveLayout,
            legendPanel = this._initLegendPanel(),
            // Is multi-chart root?
            isMultichartRoot = hasMultiRole && !this.parent;

        if(isMultichartRoot) this._initMultiChartPanel();
        if(legendPanel)      this._initLegendScenes(legendPanel);
        if(!isMultichartRoot) {
            var o = this.options;

            this._createContent(
                /*parentPanel*/this.basePanel,
                /*options*/{
                size     : preserve ? this.preservedPlotsLayoutInfoList[0].size : 
                                      undefined,
                margins  : preserve ? this.preservedPlotsLayoutInfoList[0].margins   : 
                                      (hasMultiRole ? o.smallContentMargins      : 
                                                      o.contentMargins),
                paddings : preserve ? this.preservedPlotsLayoutInfoList[0].paddings  : 
                                      (hasMultiRole ? o.smallContentPaddings     : 
                                                    o.contentPaddings),
                clickAction:       o.clickAction,
                doubleClickAction: o.doubleClickAction
            });
        }
    },

    /**
     * Creates and initializes the base panel.
     */
    _initBasePanel: function() {
        var p = this.parent;

        this.basePanel = new pvc.BasePanel(this, p && p._multiChartPanel, {
            margins:  this.margins,
            paddings: this.paddings,
            size:     {width: this.width, height: this.height}
        });
    },

    /**
     * Creates and initializes the title panel,
     * if the title is specified.
     */
    _initTitlePanel: function() {
        var me = this,
            o = me.options,
            title = o.title;

        if(!def.empty(title)) { // V1 depends on being able to pass "   " spaces...

            //NEW603 C
            /* Save title layout information if this is a re-render and layout should be preserved 
            This is done before replacing the old panel by a new one */
            var sizeOld, marginsOld, paddingsOld;

            if (this.titlePanel && this._preserveLayout){
                    sizeOld     =  this.titlePanel.titleSize;
                    marginsOld  =  this.titlePanel.margins;
                    paddingsOld =  this.titlePanel.paddings;
            }

            this.titlePanel = new pvc.TitlePanel(me, me.basePanel, {
                title:        title,
                font:         o.titleFont,
                anchor:       o.titlePosition,
                align:        o.titleAlign,
                alignTo:      o.titleAlignTo,
                offset:       o.titleOffset,
                keepInBounds: o.titleKeepInBounds,
                margins:      marginsOld  ? marginsOld.resolve()  : o.titleMargins,
                paddings:     paddingsOld ? paddingsOld.resolve() : o.titlePaddings,
                titleSize:    sizeOld     ? sizeOld.resolve()     : o.titleSize,  
                //NEW603 TODO: check if resolve necessary
                titleSizeMax: o.titleSizeMax
            });
        }
    },

    /**
     * Creates and initializes the legend panel,
     * if the legend is active.
     */
    _initLegendPanel: function() {
        var o = this.options;
        // global legend(s) switch
        if(o.legend) { // legend is disabled on small charts...
            var legend = new pvc.visual.Legend(this, 'legend', 0);

            //NEW603 C
            /* Save legend layout information if this is a re-render and layout should be preserved 
            This is done before replacing the old panel by a new one */
            var sizeOld, marginsOld, paddingsOld;

            if (this.legendPanel && this._preserveLayout){
                sizeOld     =  this.legendPanel.size;
                marginsOld  =  this.legendPanel.margins;
                paddingsOld =  this.legendPanel.paddings;
            }

            // TODO: pass all these options to LegendPanel class
            return this.legendPanel = new pvc.LegendPanel(this, this.basePanel, {
                anchor:       legend.option('Position'),
                align:        legend.option('Align'),
                alignTo:      o.legendAlignTo,
                offset:       o.legendOffset,
                keepInBounds: o.legendKeepInBounds,
                size:         sizeOld ? legend.option.getSpecified('Size', sizeOld.resolve()) : 
                                        legend.option('Size'), 
                sizeMax:      legend.option('SizeMax'),
                margins:      marginsOld ? legend.option.getSpecified('Margins', marginsOld.resolve()) : 
                                           legend.option('Margins'),
                paddings:     paddingsOld ? legend.option.getSpecified('Paddings', paddingsOld.resolve()) : 
                                            legend.option('Paddings'),
                //NEW603 TODO: check if resolve necessary
                font:         legend.option('Font'),
                scenes:       def.getPath(o, 'legend.scenes'),

                // Legend
                textMargin:   o.legendTextMargin,
                itemPadding:  o.legendItemPadding,
                itemSize:     legend.option('ItemSize'),
                markerSize:   o.legendMarkerSize
                //shape:      options.legendShape // TODO: <- doesn't this come from the various color axes?
            });
        }
    },

    _getLegendRootScene: function() {
        return this.legendPanel && this.legendPanel._getRootScene();
    },

    /**
     * Creates and initializes the multi-chart panel.
     */
    _initMultiChartPanel: function() {
        var basePanel = this.basePanel,
            options = this.options;

        this._multiChartPanel = new pvc.MultiChartPanel(
            this,
            basePanel,
            {
                margins:  options.contentMargins,
                paddings: options.contentPaddings
            });

        this._multiChartPanel.createSmallCharts();

        // BIG HACK: force legend to be rendered after the small charts,
        // to allow them to register legend renderers.
        // Currently is: Title -> Legend -> MultiChart
        // Changes to: MultiChart -> Title -> Legend
        basePanel._children.unshift(basePanel._children.pop());
    },

    _coordinateSmallChartsLayout: function(/*scopesByType*/) {},

    // TODO: this should be done using an events facade.
    _registerInitLegendScenes: function(handler) {
        def.array.lazy(this, '_initLegendScenesHandlers').push(handler);
    },

    /**
     * Creates the legend group scenes of a chart.
     *
     * The default implementation creates
     * one legend group per each data cell of each color axis.
     *
     * One legend item per domain data value of each data cell.
     */
    _initLegendScenes: function(legendPanel) {
        if(this._initLegendScenesHandlers)
            this._initLegendScenesHandlers.forEach(function(f) { f(legendPanel); });

        // A legend group is created for each data cell of color axes that
        //  are bound, discrete and visible.
        var colorAxes = this.axesByType.color;
        if(!colorAxes) return;

        var dataPartDimName = this._getDataPartDimName(), // null when role unbound
            rootScene,

            // Legacy legend index
            // Always index from 0 (independently of the first color axis' index)
            legendIndex = 0,

            getRootScene = function() {
                return rootScene || (rootScene = legendPanel._getRootScene());
            };

        colorAxes.forEach(function(axis) {
            var visibleDataCells;
            if(axis.option('LegendVisible') &&
               axis.isBound() &&
               axis.isDiscrete() &&
               (visibleDataCells = axis.dataCells.filter(function(dc) { return dc.legendVisible(); })).length) {

                // colorScale is shared by all data cells.
                var colorScale = axis.scale,
                    data = axis.domainData(),
                    visibleDataParts = dataPartDimName && def.query(visibleDataCells)
                        .uniqueIndex(function(dc) { return dc.dataPartValue; }),
                    groupScene;

                groupScene = getRootScene().createGroup({
                    source: data,
                    colorAxis: axis,
                    legendBaseIndex: legendIndex
                });

                // Create one item scene per domain item.
                axis.domainItems(data).forEach(function (itemData) {
                    // Don't create an item if no data part will be visible for it.
                    if(dataPartDimName) {
                        var anyDataPartVisible = itemData.dimensions(dataPartDimName).atoms().some(function(atom) {
                            return def.hasOwn(visibleDataParts, atom.value);
                        });
                        if(!anyDataPartVisible) return;
                    }

                    var itemScene = groupScene.createItem({source: itemData}),
                        itemValue = axis.domainItemValue(itemData);

                    // TODO: HACK: how to make this integrate better
                    // with the way scenes/signs get the default color.
                    // NOTE: CommonUI/Analyzer currently accesses this field, though. Must fix that first.
                    itemScene.color = colorScale(itemValue);
                });

                legendIndex += axis.dataCells.length;
            }
        });
    },

    /**
     * Override to create chart specific content panels here.
     * Default implementation method creates plot panels.
     *
     * @param {pvc.BasePanel} parentPanel parent panel for content.
     * @param {object} contentOptions Object with content specific options. Can be modified.
     * @param {pvc.Sides} [contentOptions.margins] The margins for the content panels.
     * @param {pvc.Sides} [contentOptions.paddings] The paddings for the content panels.
     * @virtual
     */
    _createContent: function(parentPanel, contentOptions) {
        var index = 0;

        this.plotList.forEach(function(plot) {
            this._createPlotPanel(plot, parentPanel, contentOptions, index);
            index++; //NEW603 C added index information to plots: position in plotList, assuming it does not change
        }, this);
    },

    _createPlotPanel: function(plot, parentPanel, contentOptions, index) {
        var PlotPanelClass = pvc.PlotPanel.getClass(plot.type);        

        if(!PlotPanelClass)
            throw def.error.invalidOperation("There is no registered panel class for plot type '{0}'.", [plot.type]);

        var opts     = Object.create(contentOptions);

        //NEW603 C
        /* Add preserved plot layout info to options if the layout should be preserved
           This uses the index in list, assuming the order is the same
        */
        if(this._preserveLayout){
            var infoPrev = this.preservedPlotsLayoutInfoList[index];
            //NEW603 TODO use plot id as key instead of list?
            opts['paddings'] = infoPrev ? infoPrev.paddings : undefined;
            opts['margins']  = infoPrev ? infoPrev.margins  : undefined;
        }

        var panel = new PlotPanelClass(this, parentPanel, plot, opts),
            name = plot.name,
            plotPanels = this.plotPanels;
            
        plotPanels[plot.id] = panel;
        if(name) plotPanels[name] = panel;
        if(!plot.globalIndex) plotPanels.main = panel;

        this.plotPanelList.push(panel);
    }
});
