
/**
 * BarChart is the main class for generating... bar charts (another surprise!).
 */
pvc.BarChart = pvc.BarAbstract.extend({
    
    _processOptionsCore: function(options){
        
        this.base(options);
        
        if(options.secondAxis && !options.showLines && !options.showDots && !options.showAreas){
            options.showLines = true;
        }
    },
    
    _hasDataPartRole: function(){
        return true;
    },
    
    _bindAxes: function(hasMultiRole){
    
        var options = this.options;
        
        var trend = options.trendType;
        if(trend === 'none'){
            trend = null;
        }
        
        var axes = this.axes;
        var orthoDataCells;
        var isStacked = !!options.stacked;
        var valueRole = this.visualRoles('value');
        
        if(options.secondAxis){
            var nullInterpolationMode = options.nullInterpolationMode;
            
            if(axes.ortho2){
                // Separate scales =>
                // axis ortho 0 represents data part 0 + trend (if any)
                // axis ortho 1 represents data part 1
                orthoDataCells = [{
                    role: valueRole,
                    dataPartValue: '0',
                    isStacked: isStacked,
                    trendType: trend
                }];
                
                if(trend){
                    // The scale must be big enough for the trend data
                    orthoDataCells.push({
                        role: valueRole,
                        dataPartValue: 'trend'
                    });
                }
                
                axes.ortho.bind(orthoDataCells);
                
                // Regression is not applied to the lines 
                axes.ortho2
                    .bind({
                        role: valueRole,
                        dataPartValue: '1',
                        nullInterpolationMode: nullInterpolationMode
                    });
                
            } else {
                // Common scale => 
                // axis ortho 0 represents both data parts
                orthoDataCells = [{
                        role: valueRole,
                        dataPartValue: '0',
                        isStacked: isStacked,
                        trendType: trend
                    }, {
                        role: valueRole,
                        dataPartValue: '1',
                        trendType: trend,
                        nullInterpolationMode: nullInterpolationMode
                    }
                ];
                
                if(trend){
                    // The scale must be big enough for the trend data
                    orthoDataCells.push({
                        role: valueRole,
                        dataPartValue: 'trend'
                    });
                }
                
                axes.ortho.bind(orthoDataCells);
            }
        } else {
            
            orthoDataCells = [{
                role: valueRole,
                dataPartValue: '0',
                isStacked: isStacked,
                trendType: trend
            }];
            
            if(trend){
                // The scale must be big enough for the trend data
                orthoDataCells.push({
                    role: valueRole,
                    dataPartValue: 'trend'
                });
            }
            
            axes.ortho.bind(orthoDataCells);
        }
        
        this.base(hasMultiRole);
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
        
        // The data that wil show in the base scale...
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
        var barPanel = new pvc.BarPanel(this, parentPanel, def.create(baseOptions, {
            colorAxis:          this.axes.color,
            dataPartValue:      '0',
            barSizeRatio:       options.barSizeRatio,
            maxBarSize:         options.maxBarSize,
            showValues:         options.showValues,
            valuesAnchor:       options.valuesAnchor,
            orientation:        options.orientation,
            showOverflowMarkers: options.showOverflowMarkers
        }));

        // legacy field
        this.barChartPanel = barPanel;
        
        if(options.secondAxis){
            if(pvc.debug >= 3){
                pvc.log("Creating Point panel.");
            }
            
            // 
            // barSecondLine_strokeStyle (legacy)
            // barSecondDot_strokeStyle  (legacy)
            // 
            // barPanel, bar, barLabel, label
            // 
            // {<>, trend, second} + {scatterPanel, line, area(shade, dot, label, lineLabel}
            // 
            // l/d/a
            // 
            // trendPanel
            
            var linePanel = new pvc.PointPanel(this, parentPanel, def.create(baseOptions, {
                extensionPrefix: 'second',
                orthoAxis:      this.axes.ortho2, // if null defaults to 1
                colorAxis:      this.axes.color2, // if null defaults to 1
                dataPartValue:  '1',
                stacked:        false,
                showValues:     (this.compatVersion() > 1) && options.showValues,
                valuesAnchor:   options.valuesAnchor != 'center' ? options.valuesAnchor : 'right',
                showLines:      options.showLines,
                showDots:       options.showDots,
                showAreas:      options.showAreas,
                orientation:    options.orientation
            }));

            this._linePanel = linePanel;
            
            // Legacy fields
            barPanel.pvSecondLine = linePanel.pvLine;
            barPanel.pvSecondDot  = linePanel.pvDot ;
            
            barPanel._linePanel = linePanel;
        }
        
        var trend = options.trendType;
        if(trend && trend !== 'none'){
            if(pvc.debug >= 3){
                pvc.log("Creating Trends Point panel.");
            }
            
            var trendLinePanel = new pvc.PointPanel(this, parentPanel, def.create(baseOptions, {
                extensionPrefix: 'trend',
                colorAxis:       this.axes.color3, // if null defaults to 1
                dataPartValue:   'trend',
                stacked:         false,
                showValues:      options.trendShowValues,
                valuesAnchor:    options.trendValuesAnchor,
                showLines:       options.trendShowLines,
                showDots:        options.trendShowDots,
                showAreas:       options.trendShowAreas,
                orientation:     options.orientation
            }));
        }
        
        return barPanel;
    },
    
    defaults: def.create(pvc.BarAbstract.prototype.defaults, {
        showDots:  true,
        showLines: true,
        showAreas: false
    })
});
