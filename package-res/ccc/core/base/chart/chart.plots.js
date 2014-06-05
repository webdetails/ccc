/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

pvc.BaseChart
.add({
    _initPlots: function() {
        var parent = this.parent;
        if(!parent) {
            this.plots = {};
            this.plotList = [];
            this.plotsByType = {};
            
            this._createPlotsInternal();
            var trendPlotDefExt = this._defPlotsExternal();
            this._initPlotTrend(trendPlotDefExt);
        } else {
            this.plots = parent.plots;
            this.plotList = parent.plotList;
            this.plotsByType = parent.plotsByType;
        }

        this._initPlotsEnd();
    },
    
    // Any plots enforced by the chart type.
    _createPlotsInternal: function() {
        // NOOP
    },

    _defPlotsExternal: function() {
        var plots = this.plots, 
            plotDefs = this.options.plots, 
            trendPlotDefExt;

        if(plotDefs) plotDefs.forEach(function(plotDef) {
            if(plotDef) {
                var name = plotDef.name;
                // Defer 'trend' till after it is defined internally
                if(name === 'trend')
                    trendPlotDefExt = plotDef;
                else if(name !== 'plot2' || plots.plot2)
                    this._defPlotExternal(name, plotDef);
            }
        }, this);

        return trendPlotDefExt;
    },

    _initPlotTrend: function(trendPlotDefExt) {
        // This is done here, and not in _addPlot, cause it would evaluate the
        // "Trend" option to soon, before the application of plot-local options.
        var needsTrendPlot = this.plotList.some(function(p) {
            return p.option.isDefined('Trend') && !!p.option('Trend');
        });

        if(needsTrendPlot) {
            this._createPlotTrend();
            if(trendPlotDefExt && this.plots.trend) this._defPlotExternal('trend', trendPlotDefExt);
        }
    },

    _defPlotExternal: function(name, plotSpec) {
        var plot, type = plotSpec.type;

        // Convert names to first lower case.
        // "main" is an alias name for referring to the main plot.
        if(name) {
            name = def.firstLowerCase(name);
            plot = this.plots && this.plots[name];

            // If existing plot, validate plot's type, if specified.
            if(plot && type && type !== plot.type)
                throw def.error.argumentInvalid(
                    "plots",
                    "Plot named '{0}' is already defined and is of a different type: '{1}'",
                    [name, plot.type]);
        }

        if(!plot) this._addPlot(this._createPlotExternal(name, type, plotSpec));
        else plot.processSpec(plotSpec);
    },

    _createPlotExternal: function(name, type, plotSpec) {
        if(!type) throw def.error.argumentInvalid("plots", "Plot 'type' option is required.");
        
        var PlotClass = pvc.visual.Plot.getClass(type);
        if(!PlotClass)
            throw def.error.argumentInvalid("plots", "The plot type '{0}' is not defined.", [type]);

        var isFirst = !this.plotList.length;

        return new PlotClass(this, {
            name:       name,
            isInternal: false,
            spec:       plotSpec
        });
    },

    _createPlotTrend: function() {
        // Override with an appropriate Trend plot configuration
    },

    // Called by the pvc.visual.Plot class
    _addPlot: function(plot) {
        var plots = this.plots,
            index = plot.index, 
            name  = plot.name, 
            id    = plot.id;
        
        if(name && def.hasOwn(plots, name))
            throw def.error.operationInvalid("Plot name '{0}' already taken.", [name]);
        
        if(def.hasOwn(plots, id))
            throw def.error.operationInvalid("Plot id '{0}' already taken.", [id]);
        
        var typePlots = def.array.lazy(this.plotsByType, plot.type);
        if(def.hasOwn(typePlots, index))
            throw def.error.operationInvalid("Plot index '{0}' of type '{1}' already taken.", [index, plot.type]);
        
        plot.globalIndex = this.plotList.length;

        var isMain = !plot.globalIndex;

        typePlots[index] = plot;
        
        this.plotList.push(plot);
        
        plots[id] = plot;
        if(name) plots[name] = plot;
        if(isMain) plots.main = plot;
    },

    _initPlotsEnd: function() {
        // type -> index -> [datacell array]
        var dataCellsByAxisTypeThenIndex;
        if(this.parent) {
            dataCellsByAxisTypeThenIndex = this.parent._dataCellsByAxisTypeThenIndex;
        } else {
            dataCellsByAxisTypeThenIndex = {};

            this.plotList.forEach(function(plot) {
                plot.initEnd();

                this._registerPlotVisualRoles(plot);
                this._indexPlotDataCells(plot, dataCellsByAxisTypeThenIndex);
            }, this);
        }

        this._dataCellsByAxisTypeThenIndex = dataCellsByAxisTypeThenIndex;
    },

    _registerPlotVisualRoles: function(plot) {
        var name = plot.name,
            id = plot.id,
            isMain = plot.isMain;

        plot.visualRoleList.forEach(function(role) {
            var rname = role.name, names = [];

            if(isMain) {
                // Prevent collision with chart level roles.
                if(!(rname in this.visualRoles)) names.push(rname);
                names.push("main." + rname);
            }
            names.push(id + "." + rname);
            if(name) names.push(name + "." + rname);

            this._addVisualRoleCore(role, names);
        }, this);
    },

    // Ask the plot for "potential" DataCells.
    // A DataCell is only effective if its visual role actually becomes bound.
    _indexPlotDataCells: function(plot, dataCellsByAxisTypeThenIndex) {
        plot.dataCellList.forEach(function(dataCell) {
            var dataCellsByAxisIndex =
                def.array.lazy(dataCellsByAxisTypeThenIndex, dataCell.axisType);

            def.array.lazy(dataCellsByAxisIndex, dataCell.axisIndex).push(dataCell);
        });
    }
});

