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
        var legendPanel = this._initLegendPanel();
        
        // Is multi-chart root?
        var isMultichartRoot = hasMultiRole && !this.parent;
        if(isMultichartRoot) { this._initMultiChartPanel(); }
        
        if(legendPanel) { this._initLegendScenes(legendPanel); }
        
        if(!isMultichartRoot) {
            var o = this.options;
            this._createContent({
                margins:           hasMultiRole ? o.smallContentMargins  : o.contentMargins,
                paddings:          hasMultiRole ? o.smallContentPaddings : o.contentPaddings,
                clickAction:       o.clickAction,
                doubleClickAction: o.doubleClickAction
            });
        }
    },
    
    /**
     * Override to create chart specific content panels here.
     * No need to call base.
     * 
     * @param {object} contentOptions Object with content specific options. Can be modified.
     * @param {pvc.Sides} [contentOptions.margins] The margins for the content panels. 
     * @param {pvc.Sides} [contentOptions.paddings] The paddings for the content panels.
     * @virtual
     */
     // TODO: maybe this should always call _createPlotPanels?
    _createContent: function(/*contentOptions*/) { /* NOOP */ },
    
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
        var me = this;
        var o = me.options;
        var title = o.title;
        if (!def.empty(title)) { // V1 depends on being able to pass "   " spaces... 
            var isRoot = !me.parent;
            this.titlePanel = new pvc.TitlePanel(me, me.basePanel, {
                title:        title,
                font:         o.titleFont,
                anchor:       o.titlePosition,
                align:        o.titleAlign,
                alignTo:      o.titleAlignTo,
                offset:       o.titleOffset,
                keepInBounds: o.titleKeepInBounds,
                margins:      o.titleMargins,
                paddings:     o.titlePaddings,
                titleSize:    o.titleSize,
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
        if (o.legend) { // legend is disabled on small charts...
            var legend = new pvc.visual.Legend(this, 'legend', 0);
            
            // TODO: pass all these options to LegendPanel class
            return this.legendPanel = new pvc.LegendPanel(this, this.basePanel, {
                anchor:       legend.option('Position'),
                align:        legend.option('Align'),
                alignTo:      o.legendAlignTo,
                offset:       o.legendOffset,
                keepInBounds: o.legendKeepInBounds,
                size:         legend.option('Size'),
                sizeMax:      legend.option('SizeMax'),
                margins:      legend.option('Margins'),
                paddings:     legend.option('Paddings'),
                font:         legend.option('Font'),
                scenes:       def.getPath(o, 'legend.scenes'),
                
                // Bullet legend
                textMargin:   o.legendTextMargin,
                itemPadding:  o.legendItemPadding,
                itemSize:     legend.option('ItemSize'),
                markerSize:   o.legendMarkerSize
                //shape:        options.legendShape // TODO: <- doesn't this come from the various color axes?
            });
        }
    },
    
    _getLegendBulletRootScene: function() {
        return this.legendPanel && this.legendPanel._getBulletRootScene();
    },
    
    /**
     * Creates and initializes the multi-chart panel.
     */
    _initMultiChartPanel: function() {
        var basePanel = this.basePanel;
        var options = this.options;
        
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
    
    /**
     * Creates the legend group scenes of a chart.
     *
     * The default implementation creates
     * one legend group per each data cell of each color axis.
     * 
     * One legend item per domain data value of each data cell.
     */
    _initLegendScenes: function(legendPanel) {
        // For all color axes...
        var colorAxes = this.axesByType.color;
        if(!colorAxes) { return; }
        
        var rootScene;
        var legendIndex = 0; // always start from 0 (whatever the color axis index)
        var dataPartDimName = this._getDataPartDimName();
        
        def
        .query(colorAxes)
        .where(function(axis) { return axis.option('LegendVisible'); })
        .each (function(axis) {
            if(axis.dataCells) {
                axis.dataCells.forEach(function(dataCell) {
                    if(dataCell.role.isDiscrete()) { createLegendGroup(dataCell, axis); }
                });
            }
        });
        
        function createLegendGroup(dataCell, colorAxis) {
            var isToggleVisible = colorAxis.option('LegendClickMode') === 'togglevisible';
            
            var domainData = dataCell.domainData();
            
            if(!rootScene) { rootScene = legendPanel._getBulletRootScene(); }
            
            // Trend series cannot be set to invisible.
            // They are created each time that visible changes.
            // So trend legend groups are created locked (clickMode = 'none')
            var clickMode;
            if(isToggleVisible) {
                var dataPartAtom = domainData.atoms[dataPartDimName];
                if(dataPartAtom && dataPartAtom.value === 'trend') {
                    clickMode = 'none';
                }
            }
            
            var groupScene = rootScene.createGroup({
                source:          domainData,
                colorAxis:       colorAxis,
                clickMode:       clickMode,
                extensionPrefix: pvc.buildIndexedId('', legendIndex++)
             });
            
            // For later binding an appropriate bullet renderer
            dataCell.legendBulletGroupScene = groupScene;
            
            // Create one item scene per domain item data
            dataCell
            .domainItemDatas()
            .each(function(itemData) { 
                var itemScene  = groupScene.createItem({source: itemData});
                var colorValue = dataCell.domainItemDataValue(itemData);
                
                // TODO: HACK...
                itemScene.color = colorAxis.scale(colorValue);
            });
        }
    }
});

