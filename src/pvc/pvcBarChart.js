
/**
 * BarChart is the main class for generating... bar charts (another surprise!).
 */
pvc.BarChart = pvc.BarAbstract.extend({
    
    _initPlotsCore: function(hasMultiRole){
        var options = this.options;
        
        new pvc.visual.BarPlot(this);
        
        // secondAxis V1 compatibility
        if(options.plot2 || options.secondAxis){
            // Line Plot
            new pvc.visual.PointPlot(this, {
                name: 'plot2',
                fixed: {
                    DataPart: '1'
                },
                defaults: {
                    ColorAxis:    2,
                    LinesVisible: true,
                    DotsVisible:  true
                }});
        }
        
        var trend = options.trendType;
        if(trend && trend !== 'none'){
            // Trend Plot
            new pvc.visual.PointPlot(this, {
                name: 'trend',
                fixed: {
                    DataPart: 'trend',
                    TrendType: 'none',
                    NullInterpolatioMode: 'none'
                },
                defaults: {
                    LinesVisible: true,
                    DotsVisible:  true
                }
            });
        }
    },
    
    _hasDataPartRole: function(){
        return true;
    },
    
    _generateTrendsDataCell: function(dataCell){
        /*jshint onecase:true */
        switch(dataCell.trendType){
            case 'linear':
                this._generateTrendsDataCellLinear(dataCell);
                break;
        }
    },
    
    calcOrdinaryLinearRegressionModel: function(rowsQuery, funX, funY){
        var i = 0;
        var N = 0;
        var sumX  = 0;
        var sumY  = 0;
        var sumXY = 0;
        var sumXX = 0;
        var parseNum = function(value){
            return value != null ? (+value) : NaN;  // to Number works for dates as well
        };
        
        while(rowsQuery.next()){
            var row = rowsQuery.item;
            
            // Ignore null && NaN values
            
            var x = funX ? parseNum(funX(row)) : i; // use the index itself for discrete stuff
            if(!isNaN(x)){
                var y = parseNum(funY(row));
                if(!isNaN(y)){
                    N++;
                    
                    sumX  += x;
                    sumY  += y;
                    sumXY += x * y;
                    sumXX += x * x;
                }
            }
            
            i++; // Discrete nulls must still increment the index
        }
        
        // y = alpha + beta * x
        var alpha, beta;
        if(N > 0){
            var avgX  = sumX  / N;
            var avgY  = sumY  / N;
            var avgXY = sumXY / N;
            var avgXX = sumXX / N;
        
            beta  = (avgXY - (avgX * avgY)) / (avgXX - avgX * avgX);
            alpha = avgY - beta * avgX;
            
            return {alpha: alpha, beta: beta};
        }
    },
    
    _generateTrendsDataCellLinear: function(dataCell){
        // Roles
        var dataPartDimName = this._dataPartRole.firstDimensionName();
        var serRole = this._serRole;
        var xRole   = this._catRole;
        var yRole   = dataCell.role;
        this._warnSingleContinuousValueRole(yRole);
        
        var yDimName    = yRole.firstDimensionName();
        var xIsDiscrete = xRole.isDiscrete();
        
        var sumKeyArgs = { zeroIfNone: false };
        var newDatums = [];
        
        // Visible data grouped by category and then series
        var data = this._getVisibleData(dataCell.dataPartValue);
        var catDatas = data._children;
        
        // TODO: It is usually the case, but not certain, that the base axis' 
        // dataCell(s) span "all" data parts.
        // The data that will be shown in the base scale...
        // Ideally the base scale would already be set up...
        var allPartsData = this._getVisibleData(null, {ignoreNulls: false});
        var allCatDataRoot = allPartsData.flattenBy(xRole, {ignoreNulls: false});
        var allCatDatas = allCatDataRoot._children;
        
        // For each series...
        def
        .scope(function(){
            return (serRole && serRole.isBound())   ?
                   data.flattenBy(serRole).children() : // data already only contains visible data
                   def.query([null]) // null series
                   ;
        })
        .each(function(serData1){
            if(xIsDiscrete){
                genSeriesTrendXDiscrete.call(this, serData1);
            } else {
                genSeriesTrendXContinuous.call(this, serData1);
            }
        }, this)
        ;
  
        if(newDatums.length){
            this.data.owner.add(newDatums);
        }
        
        // y = alpha + beta * x
        function buildLine(linearModel){
            var a = linearModel.alpha;
            var b = linearModel.beta;
            return function(v){
                return a + b * (+v);
            };
        }
        
        function genSeriesTrendXDiscrete(serData1){
            var funX = null; // means: "use index as X value"
            var funY = function(allCatData){
                var group = data._childrenByKey[allCatData.key];
                if(group && serData1){
                    group = group._childrenByKey[serData1.key];
                }
                
                // When null, the data point ends up being ignored
                return group ? group.dimensions(yDimName).sum(sumKeyArgs) : null;
            };
            
            var linearModel = this.calcOrdinaryLinearRegressionModel(def.query(allCatDatas), funX, funY);
            if(linearModel){
                var lineFun = buildLine(linearModel);
                
                // At least one point...
                // Sample the line on each x and create a datum for it
                // on the 'trend' data part
                allCatDatas.forEach(function(allCatData, index){
                    var trendX = index;// serCatData.value;
                    //if(trendX != null){
                        var trendY = lineFun(trendX);
                        
                        var catData = data._childrenByKey[allCatData.key];
                        var efCatData = (catData || allCatData);
                        
                        var atoms;
                        var proto = catData;
                        if(serData1){
                            var catSerData = catData && 
                                             catData._childrenByKey[serData1.key];
                            
                            if(catSerData){
                                atoms = Object.create(catSerData._datums[0].atoms);
                            } else {
                                // Missing data point
                                atoms = Object.create(efCatData._datums[0].atoms);
                                
                                // Now copy series atoms
                                def.copyOwn(atoms, serData1.atoms);
                            }
                        } else {
                            // Series is unbound
                            atoms = Object.create(efCatData._datums[0].atoms);
                        }
                        
                        atoms[yDimName] = trendY;
                        atoms[dataPartDimName] = this._dataPartTrendGCell;
                        
                        var newDatum = new pvc.data.Datum(efCatData.owner, atoms);
                        newDatum.isVirtual = true;
                        newDatum.isTrend   = true;
                        newDatum.trendType = 'linear';
                        
                        newDatums.push(newDatum);
                    //}
                }, this);
            }
        }
        
        function genSeriesTrendXContinuous(serData){
        }
        
        // Release cause it is probably not needed anymore
        // groupedData.dispose();
    },
    
    _dataPartTrendGCell: {v: 'trend', f: "Linear trend"},
    
    /**
     * @override 
     */
    _createMainContentPanel: function(parentPanel, baseOptions){
        if(pvc.debug >= 3){
            pvc.log("Prerendering in barChart");
        }
        
        var options = this.options;
        var plots = this.plots;
        
        var barPlot = plots.bar;
        var barPanel = new pvc.BarPanel(
                this, 
                parentPanel, 
                barPlot, 
                Object.create(baseOptions));

        // legacy field
        this.barChartPanel = barPanel;
        
        var plot2Plot = plots.plot2;
        if(plot2Plot){
            if(pvc.debug >= 3){
                pvc.log("Creating Point panel.");
            }
            
            var pointPanel = new pvc.PointPanel(
                    this, 
                    parentPanel, 
                    plot2Plot,
                    Object.create(baseOptions));
            
            // Legacy fields
            barPanel.pvSecondLine = pointPanel.pvLine;
            barPanel.pvSecondDot  = pointPanel.pvDot;
            
            pointPanel._applyV1BarSecondExtensions = true;
        }
        
        var trendPlot = plots.trend;
        if(trendPlot){
            if(pvc.debug >= 3){
                pvc.log("Creating Trends Point panel.");
            }
            
            new pvc.PointPanel(
                    this, 
                    parentPanel, 
                    trendPlot,
                    Object.create(baseOptions));
        }
        
        return barPanel;
    }
    
    //defaults: def.create(pvc.BarAbstract.prototype.defaults, {})
});
