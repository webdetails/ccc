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
     * The content panel is a child of the base panel that contains every other content panels,
     * such as plot panels.
     *
     * On a small-multiples chart, the content panel is a a {@link pvc.MultiChartPanel}
     * that has as children the child charts' base panels.
     *
     * @type pvc.ContentPanel
     */
    contentPanel: null,

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

    _initChartPanels: function() {

        var hasMultiRole = this.visualRoles.multiChart.isBound();
        var isRoot = !this.parent;

        this._initBasePanel();

        this._initTitlePanel();

        if(isRoot) {
            // null when disabled
            var legendPanel = this._initLegendPanel();

            // Is multi-chart root?
            if(hasMultiRole) {
                this._initMultiChartPanel();

                // All child small charts have been constructed and _create'd by now.
            }

            if(legendPanel) {
                this._initLegendScenes(legendPanel);
            }
        }

        // Is leaf (not a multi-chart root)?
        var isLeaf = !(isRoot && hasMultiRole);
        if(isLeaf) {
            var o = this.options;

            this.contentPanel = this._createContentPanel(
                /*parentPanel*/this.basePanel,
                /*options*/{
                margins:  (hasMultiRole ? o.smallContentMargins  : o.contentMargins),
                paddings: (hasMultiRole ? o.smallContentPaddings : o.contentPaddings)
            });

            this._createContent(
                /*parentPanel*/this.contentPanel,
                /*options*/{
                clickAction: o.clickAction,
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
        var o = this.options,
            title = o.title,
            titleVisible = o.titleVisible;

        // V1 depends on being able to pass "   " spaces...
        if(titleVisible == null) titleVisible = !def.empty(title);

        if(titleVisible) {
            /* Save title layout information if this is a re-render and layout should be preserved
               This is done before replacing the old panel by a new one */
            var titlePanel = this.titlePanel;
            var state;
            if(titlePanel && this._preserveLayout) state = titlePanel._getLayoutState();

            this.titlePanel = new pvc.TitlePanel(this, this.basePanel, {
                title:        title,
                font:         o.titleFont,
                anchor:       o.titlePosition,
                align:        o.titleAlign,
                alignTo:      o.titleAlignTo,
                offset:       o.titleOffset,
                keepInBounds: o.titleKeepInBounds,
                margins:      state ? state.margins  : o.titleMargins,
                paddings:     state ? state.paddings : o.titlePaddings,
                titleSize:    state ? state.size     : o.titleSize,
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

        var legendAreaVisible = o.legendAreaVisible;
        if(legendAreaVisible == null) legendAreaVisible = o.legend;

        // global legend(s) switch
        if(legendAreaVisible) { // legend is disabled on small charts...
            var legend = new pvc.visual.Legend(this, 'legend', 0);

            /* Save legend layout information if this is a re-render and layout should be preserved
            This is done before replacing the old panel by a new one */
            var state;

            var legendPanel = this.legendPanel;
            if(legendPanel && this._preserveLayout) state = legendPanel._getLayoutState();

            // TODO: pass all these options to LegendPanel class
            return this.legendPanel = new pvc.LegendPanel(this, this.basePanel, {
                anchor:       legend.option('Position'),
                align:        legend.option('Align'),
                alignTo:      o.legendAlignTo,
                offset:       o.legendOffset,
                keepInBounds: o.legendKeepInBounds,
                size:         state ? state.size     : legend.option('Size'),
                margins:      state ? state.margins  : legend.option('Margins'),
                paddings:     state ? state.paddings : legend.option('Paddings'),
                sizeMax:      legend.option('SizeMax'),
                font:         legend.option('Font'),
                scenes:       def.getPath(o, 'legend.scenes'),

                // Legend
                textMargin:   o.legendTextMargin,
                itemPadding:  o.legendItemPadding,
                itemSize:     legend.option('ItemSize'),
                itemCountMax: legend.option('ItemCountMax'),
                overflow:     legend.option('Overflow'),
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

        this.contentPanel = this._multiChartPanel = new pvc.MultiChartPanel(
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

        // In this implementation, a legend group scene is created per color axis that
        // is bound, discrete and that contains at least one data cell for which the legend should be visible.
        //
        // Within a legend group, one legend item scene is created per domain item of the color axis domain data.
        //
        // Using custom code
        // (see WaterfallPlot#_initLegendScenes, called above, through _initLegendScenesHandlers),
        // it is also possible to add custom legend groups not associated with color axes ...

        var colorAxes = this.axesByType.color;
        if(!colorAxes) return;

        var dataPartDimName = this._getDataPartDimName(); // null when role unbound

        // Legacy legend index
        // Always index from 0 (independently of the first color axis' index).
        // Overall groups, each data cell gets a legend index
        // (even if its marked legend hidden; legacy),
        // that is used for extending the data cell's associated marks.
        var legendGroupBaseIndex = 0;

        var rootScene;
        var getRootScene = function() {
            return rootScene || (rootScene = legendPanel._getRootScene());
        };

        colorAxes.forEach(function(colorAxis) {

            if(this._maybeCreateLegendGroupScene(colorAxis, getRootScene, legendGroupBaseIndex, dataPartDimName) !== null) {
                legendGroupBaseIndex += colorAxis.dataCells.length;
            }
        }, this);
    },

    /*
        Item Panel
        > Item Marker Panel
          > Group Scene 1 Panel (color axis 1)
            * visible if itemScene.parent = Group Scene 1

            > Data Cell 1 Panel
              * visible if:
                - itemScene.getDataPart() = Data Part of Data Cell 1
                - measure-discriminator in itemScene.group is consistent with data cell's plot visual roles

            > Data Cell 2 Panel

          > Group Scene 2 Panel (color axis 2)
            * visible if itemScene.parent = Group Scene 2

            > Data Cell 3 Panel

            > Data Cell 4 Panel

        @see LegendPanel#_createCore
        @see LegendGroupScene#_rendererCreate
    */
    _maybeCreateLegendGroupScene: function(colorAxis, getRootScene, legendGroupBaseIndex, dataPartDimName) {

        if(!colorAxis.option('LegendVisible') || !colorAxis.isBound() || !colorAxis.isDiscrete()) {
            return null;
        }

        // At least one data cell is visible in the legend?
        var visibleDataCells = colorAxis.dataCells.filter(function(dataCell) { return dataCell.legendVisible(); });
        if(visibleDataCells.length === 0) {
            return null;
        }

        // The same color scale is used by all data cells.
        var colorScale = colorAxis.scale;

        // For which data parts is there at least one visible data cell showing it?
        // Used below to not create item scenes for which there would be no visible data cell panel.
        var visibleDataCellsByDataPart = dataPartDimName !== null
            ? def.query(visibleDataCells).uniqueIndex(function(dataCell) { return dataCell.dataPartValue; })
            : null;

        var groupScene = getRootScene().createGroup({
            source: colorAxis.domainData(),
            colorAxis: colorAxis,
            legendBaseIndex: legendGroupBaseIndex
        });

        // ---

        // For each item data,
        // find at least one data cell whose role either does not have extension complex types
        // or for which itemData contains a discriminator measure whose value is one of the
        // data cell's plot's measure role's dimension...
        var dataCellsWithExtensionComplexTypesToCheck = null;

        def.query(visibleDataCells).each(function(dataCell) {
            if(!dataCell.role.grouping.hasExtensionComplexTypes) {
                // If at least one data cell exists without extension complex types,
                // then we don't need to check extension complex types data cells
                // to know if item scenes will be visible.
                dataCellsWithExtensionComplexTypesToCheck = null; // don't need to check
                return false; // break
            }

            if(dataCellsWithExtensionComplexTypesToCheck === null) {
                dataCellsWithExtensionComplexTypesToCheck = [];
            }
            dataCellsWithExtensionComplexTypesToCheck.push(dataCell);
        });

        // Create one Item scene per domain item.
        colorAxis.domainItems().forEach(function(itemData) {

            if(dataPartDimName !== null) {
                // Don't create an item scene that does not contain at least one datum whose "dataPart"
                // value is one of the data parts for which there are (visible) data cells.
                var dataPartAtomsInItemData = itemData.dimensions(dataPartDimName).atoms();

                var itemHasAnyVisibleDataCells = dataPartAtomsInItemData.some(function(dataPartAtom) {
                    return def.hasOwn(visibleDataCellsByDataPart, dataPartAtom.value);
                });

                if(!itemHasAnyVisibleDataCells) {
                    return;
                }
            }

            if(dataCellsWithExtensionComplexTypesToCheck !== null) {
                // Need at least one data cell showing the item scene.

                var isAtLeastOneDataCellVisible = def.query(dataCellsWithExtensionComplexTypesToCheck)
                    .any(function(dataCell) {
                        // Will data cell be visible on itemData?
                        // Code similar to that in pvc.visual.legend.LegendGroupScene#_createDataCellPanel.
                        return dataCell.role.grouping.extensionDimensions()
                            .all(function(dimSpec) {
                                // All of its extension dimensions are bound?
                                var measureRole;
                                var measureRoleName = pvc.visual.Role.parseDataSetName(dimSpec.dataSetName);
                                return measureRoleName !== null &&
                                    (measureRole = dataCell.plot.visualRole(measureRoleName)) !== null &&
                                    measureRole.isBoundDimensionCompatible(itemData);
                            });
                    });

                if(!isAtLeastOneDataCellVisible) {
                    return;
                }
            }

            var itemScene = groupScene.createItem({source: itemData});

            // TODO: HACK: how to make this integrate better
            // with the way scenes/signs get the default color.
            var itemValue = colorAxis.domainItemValue(itemData);
            // NOTE: CommonUI/Analyzer currently accesses this field, though. Must fix that first.
            itemScene.color = colorScale(itemValue);
        });

        return groupScene;
    },

    _createContentPanel: function(parentPanel, contentOptions) {

        return new pvc.ContentPanel(this, parentPanel, {
            margins:  contentOptions.margins,
            paddings: contentOptions.paddings
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

        this.plotList.forEach(function(plot) {
            if(!this.parent || plot.isDataBoundOn(this.data)) {
                this._createPlotPanel(plot, parentPanel, contentOptions);
            }
        }, this);
    },

    _createPlotPanel: function(plot, parentPanel, contentOptions) {
        var PlotPanelClass = pvc.PlotPanel.getClass(plot.type);
        if(!PlotPanelClass)
            throw def.error.invalidOperation("There is no registered panel class for plot type '{0}'.", [plot.type]);

        var options = Object.create(contentOptions);

        // Add preserved plot layout info to options if the layout should be preserved.
        if(this._preserveLayout) {
            var state = this._preservedPlotsLayoutInfo[plot.id];
            options.size     = state.size;
            options.paddings = state.paddings;
            options.margins  = state.margins;
        }

        var panel = new PlotPanelClass(this, parentPanel, plot, options);
        var name = plot.name;
        var plotPanels = this.plotPanels;

        plotPanels[plot.id] = panel;
        if(name) plotPanels[name] = panel;
        if(!plot.globalIndex) plotPanels.main = panel;

        this.plotPanelList.push(panel);
    }
});
