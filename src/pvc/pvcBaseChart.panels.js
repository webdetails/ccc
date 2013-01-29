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
    
    _initChartPanels: function(hasMultiRole){
        /* Initialize chart panels */
        this._initBasePanel  ();
        this._initTitlePanel ();
        
        var legendPanel = this._initLegendPanel();
        
        if(!this.parent && hasMultiRole) {
            this._initMultiChartPanel();
            
            if(legendPanel){
                this._initLegendScenes(legendPanel);
            }
        } else {
            var options = this.options;
            
            if(legendPanel){
                this._initLegendScenes(legendPanel);
            }
            
            this._preRenderContent({
                margins:           hasMultiRole ? options.smallContentMargins  : options.contentMargins,
                paddings:          hasMultiRole ? options.smallContentPaddings : options.contentPaddings,
                clickAction:       options.clickAction,
                doubleClickAction: options.doubleClickAction
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
     * 
     * @virtual
     */
    _preRenderContent: function(contentOptions){
        /* NOOP */
    },
    
    /**
     * Creates and initializes the base panel.
     */
    _initBasePanel: function() {
        var options = this.options;
        var basePanelParent = this.parent && this.parent._multiChartPanel;
        
        this.basePanel = new pvc.BasePanel(this, basePanelParent, {
            margins:  this.margins,
            paddings: this.paddings,
            size:     {width: this.width, height: this.height}
        });
    },
    
    /**
     * Creates and initializes the title panel,
     * if the title is specified.
     */
    _initTitlePanel: function(){
        var options = this.options;
        if (!def.empty(options.title)) {
            var isRoot = !this.parent;
            this.titlePanel = new pvc.TitlePanel(this, this.basePanel, {
                title:        options.title,
                font:         options.titleFont,
                anchor:       options.titlePosition,
                align:        options.titleAlign,
                alignTo:      options.titleAlignTo,
                offset:       options.titleOffset,
                keepInBounds: options.titleKeepInBounds,
                margins:      options.titleMargins,
                paddings:     options.titlePaddings,
                titleSize:    options.titleSize,
                titleSizeMax: options.titleSizeMax
            });
        }
    },
    
    /**
     * Creates and initializes the legend panel,
     * if the legend is active.
     */
    _initLegendPanel: function(){
        var options = this.options;
        // global legend(s) switch
        if (options.legend) {

            var legend = new pvc.visual.Legend(this, 'legend', 0);
            
            // TODO: pass all these options to Legend class
            
            this.legendPanel = new pvc.LegendPanel(this, this.basePanel, {
                anchor:       legend.option('Position'),
                align:        legend.option('Align'),
                alignTo:      options.legendAlignTo,
                offset:       options.legendOffset,
                keepInBounds: options.legendKeepInBounds,
                size:         legend.option('Size'),
                sizeMax:      legend.option('SizeMax'),
                margins:      legend.option('Margins'),
                paddings:     legend.option('Paddings'),
                font:         legend.option('Font'),
                scenes:       def.getPath(options, 'legend.scenes'),
                
                // Bullet legend
                textMargin:   options.legendTextMargin,
                itemPadding:  options.legendItemPadding,
                markerSize:   options.legendMarkerSize
                //shape:        options.legendShape // TODO: <- doesn't this come from the various color axes?
            });
            
            return this.legendPanel;
        }
    },
    
    _getLegendBulletRootScene: function(){
        return this.legendPanel && this.legendPanel._getBulletRootScene();
    },
    
    /**
     * Creates and initializes the multi-chart panel.
     */
    _initMultiChartPanel: function(){
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
        basePanel._children.unshift(basePanel._children.pop());
    },
    
    _coordinateSmallChartsLayout: function(scopesByType){
        // NOOP
    },
    
    /**
     * Creates the legend group scenes of a chart.
     *
     * The default implementation creates
     * one legend group per data part value
     * and with one legend item per 
     * value of the "color" visual role.
     *
     * Legend groups are registered with the id prefix "part"
     * followed by the corresponding part value.
     */
    _initLegendScenes: function(legendPanel){
        
        var rootScene, dataPartDimName;
        var legendIndex = 0; // always start from 0
        
        // For all color axes...
        var colorAxes = this.axesByType.color;
        if(colorAxes){
            colorAxes.forEach(processAxis, this);
        }
        
        // ------------

        function processAxis(colorAxis){
            if(colorAxis.option('LegendVisible')){
                var dataCells = colorAxis && colorAxis.dataCells;
                if(dataCells){
                    dataCells
                    .forEach(function(dataCell){
                        if(dataCell.role.isDiscrete()){
                            var domainData = dataCell.data;
                            
                            if(!rootScene){
                                dataPartDimName = this._getDataPartDimName();
                                rootScene = legendPanel._getBulletRootScene();
                            }
                            
                            var dataPartAtom;
                            var locked = colorAxis.option('LegendClickMode') === 'toggleVisible' && 
                                         (dataPartAtom = domainData.atoms[dataPartDimName]) && 
                                         dataPartAtom.value === 'trend';
                            
                            var groupScene = rootScene.createGroup({
                                group:           domainData,
                                colorAxis:       colorAxis,
                                clickMode:       locked ? 'none' : undefined,
                                extensionPrefix: pvc.buildIndexedId('', legendIndex++)
                             });
                            
                            // For later binding an appropriate bullet renderer
                            dataCell.legendBulletGroupScene = groupScene;
                            
                            var partColorScale = colorAxis.scale;
                            
                            domainData
                                .children()
                                .each(function(itemData){
                                    var itemScene = groupScene.createItem({group: itemData});
                                    
                                    // HACK...
                                    itemScene.color = partColorScale(itemData.value);
                                });
                        }
                    }, this);
                }
            }
        }
    }
});

