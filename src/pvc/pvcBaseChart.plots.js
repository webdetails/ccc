pvc.BaseChart
.add({
    _initPlots: function(hasMultiRole){
        
        this.plotPanelList = null;
        
        // reset plots
        if(!this.parent){
            this.plots = {};
            this.plotList = [];
            this.plotsByType = {};
            
            this._initPlotsCore(hasMultiRole);
        } else {
            var root = this.root;
            
            this.plots = root.plots;
            this.plotList = root.plotList;
            this.plotsByType = root.plotsByType;
        }
    },
    
    _initPlotsCore: function(/*hasMultiRole*/){
        // NOOP
    },

    _addPlot: function(plot){
        var plotsByType = this.plotsByType;
        var plots = this.plots;
        
        var plotType  = plot.type;
        var plotIndex = plot.index;
        var plotName  = plot.name;
        var plotId    = plot.id;
        
        if(plotName && def.hasOwn(plots, plotName)){
            throw def.error.operationInvalid("Plot name '{0}' already taken.", [plotName]);
        }
        
        if(def.hasOwn(plots, plotId)){
            throw def.error.operationInvalid("Plot id '{0}' already taken.", [plotId]);
        }
        
        var typePlots = def.array.lazy(plotsByType, plotType);
        if(def.hasOwn(typePlots, plotIndex)){
            throw def.error.operationInvalid("Plot index '{0}' of type '{1}' already taken.", [plotIndex, plotType]);
        }
        
        plot.globalIndex = this.plotList.length;
        typePlots[plotIndex] = plot;
        this.plotList.push(plot);
        plots[plotId] = plot;
        if(plotName){
            plots[plotName] = plot;
        }
    },
    
    _collectPlotAxesDataCells: function(plot, dataCellsByAxisTypeThenIndex){
        /* Configure Color Axis Data Cell */
        var colorRoleName = plot.option('ColorRole');
        if(colorRoleName){
            var colorRole = this.visualRoles(colorRoleName);
            if(colorRole.isBound()){
                var colorDataCellsByAxisIndex = 
                    def
                    .array
                    .lazy(dataCellsByAxisTypeThenIndex, 'color');
                    
                def
                .array
                .lazy(colorDataCellsByAxisIndex, plot.option('ColorAxis') - 1)
                .push({
                    plot: plot,
                    role: colorRole,
                    dataPartValue: plot.option('DataPart')
                });
            }
        }
    },
    
    // Called by the pvc.PlotPanel class
    _addPlotPanel: function(plotPanel){
        def.lazy(this, 'plotPanels')[plotPanel.plot.id] = plotPanel;
        def.array.lazy(this, 'plotPanelList').push(plotPanel);
    },
    
    /* @abstract */
    _createPlotPanels: function(/*parentPanel, baseOptions*/){
        throw def.error.notImplemented();
    }
});

