/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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
        var dataCells = [];
        
        plot.collectDataCells(dataCells);
        
        if(dataCells.length) {
            def
            .query(dataCells)
            .where(function(dataCell) { return dataCell.role.isBound(); })
            .each (function(dataCell) {
                /* Index DataCell in dataCellsByAxisTypeThenIndex */
                var dataCellsByAxisIndex = 
                    def.array.lazy(dataCellsByAxisTypeThenIndex, dataCell.axisType);
                
                def.array.lazy(dataCellsByAxisIndex, dataCell.axisIndex)
                    .push(dataCell);
            });
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

