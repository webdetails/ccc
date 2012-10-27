
def
.type('pvc.MultiChartPanel', pvc.BasePanel)
.add({
    anchor: 'fill',
    _multiInfo: null,
    
    createSmallCharts: function(){
        var chart = this.chart;
        var options = chart.options;
        
        /* I - Determine how many small charts to create */
        
        // multiChartMax can be Infinity
        var multiChartMax = Number(options.multiChartMax);
        if(isNaN(multiChartMax) || multiChartMax < 1) {
            multiChartMax = Infinity;
        }
        
        var multiChartRole = chart.visualRoles('multiChart');
        var data = chart.data.flattenBy(multiChartRole, {visible: true});
        var leafCount = data._children.length;
        var count = Math.min(leafCount, multiChartMax);
        if(count === 0) {
            // Shows no message to the user.
            // An empty chart, like when all series are hidden through the legend.
            return;
        }
        
        /* II - Determine basic layout (row and col count) */
        
        // multiChartColumnsMax can be Infinity
        var multiChartColumnsMax = +options.multiChartColumnsMax; // to number
        if(isNaN(multiChartColumnsMax) || multiChartMax < 1) {
            multiChartColumnsMax = 3;
        }
        
        var colCount = Math.min(count, multiChartColumnsMax);
        // <Debug>
        /*jshint expr:true */
        colCount >= 1 && isFinite(colCount) || def.assert("Must be at least 1 and finite");
        // </Debug>
        
        var rowCount = Math.ceil(count / colCount);
        // <Debug>
        /*jshint expr:true */
        rowCount >= 1 || def.assert("Must be at least 1");
        // </Debug>

        /* III - Determine if axes need coordination (null if no coordination needed) */
        
        var coordRootAxesByScopeType = this._getCoordinatedRootAxesByScopeType();
        var coordScopesByType, addChartToScope, indexChartByScope;
        if(coordRootAxesByScopeType){
            coordScopesByType = {};
            
            // Each scope is a specific 
            // 'row', 'column' or the single 'global' scope 
            addChartToScope = function(childChart, scopeType, scopeIndex){
                var scopes = def.array.lazy(coordScopesByType, scopeType);
                
                def.array.lazy(scopes, scopeIndex).push(childChart);
            };
            
            indexChartByScope = function(childChart){
                // Index child charts by scope
                //  on scopes having axes requiring coordination.
                if(coordRootAxesByScopeType.row){
                    addChartToScope(childChart, 'row', childChart.smallRowIndex);
                }
                
                if(coordRootAxesByScopeType.column){
                    addChartToScope(childChart, 'column', childChart.smallColIndex);
                }
                
                if(coordRootAxesByScopeType.global){
                    addChartToScope(childChart, 'global', 0);
                }
            };
        }
        
        /* IV - Create and _preRender small charts */
        var childOptionsBase = this._buildSmallChartsBaseOptions();
        var ChildClass = chart.constructor;
        for(var index = 0 ; index < count ; index++) {
            var childData = data._children[index];
            
            var colIndex = (index % colCount);
            var rowIndex = Math.floor(index / colCount);
            var childOptions = def.set(
                Object.create(childOptionsBase),
                'smallColIndex', colIndex,
                'smallRowIndex', rowIndex,
                'title',         childData.absLabel, // does not change with trends 
                'data',          childData);
            
            var childChart = new ChildClass(childOptions);
            
            if(!coordRootAxesByScopeType){
                childChart._preRender();
            } else {
                // options, data, plots, axes, 
                // trends, interpolation, axes_scales
                childChart._preRenderPhase1();
                
                indexChartByScope(childChart);
            }
        }
        
        // Need _preRenderPhase2?
        if(coordRootAxesByScopeType){
            // For each scope type having scales requiring coordination
            // find the union of the scales' domains for each
            // scope instance
            // Finally update all scales of the scope to have the 
            // calculated domain.
            def.eachOwn(coordRootAxesByScopeType, function(axes, scopeType){
                axes.forEach(function(axis){
                    
                    coordScopesByType[scopeType]
                        .forEach(function(scopeCharts){
                            this._coordinateScopeAxes(axis.id, scopeCharts);
                        }, this);
                    
                }, this);
            }, this);
            
            // Finalize _preRender, now that scales are coordinated
            chart.children.forEach(function(childChart){
                childChart._preRenderPhase2();
            });
        }
        
        // By now, trends and interpolation
        // have updated the data's with new Datums, if any.
        
        this._multiInfo = {
          data:     data,
          count:    count,
          rowCount: rowCount,
          colCount: colCount,
          multiChartColumnsMax: multiChartColumnsMax,
          coordScopesByType: coordScopesByType
        };
    },
    
    _getCoordinatedRootAxesByScopeType: function(){
        // Index axes that need to be coordinated, by scopeType
        var hasCoordination = false;
        var rootAxesByScopeType = 
            def
            .query(this.chart.axesList)
            .multipleIndex(function(axis){
                if(axis.scaleType !== 'discrete' && // Not implemented (yet...)
                   axis.option.isDefined('DomainScope')){
                    
                    var scopeType = axis.option('DomainScope');
                    if(scopeType !== 'cell'){
                        hasCoordination = true;
                        return scopeType;
                    }
                }
            })
            ;
        
        return hasCoordination ? rootAxesByScopeType : null;
    },
    
    _coordinateScopeAxes: function(axisId, scopeCharts){
        var unionExtent =
            def
            .query(scopeCharts)
            .select(function(childChart){
                var scale = childChart.axes[axisId].scale;
                if(!scale.isNull){
                    var domain = scale.domain();
                    return {min: domain[0], max: domain[1]};
                }
            })
            .reduce(pvc.unionExtents, null)
            ;
        
        if(unionExtent){
            // Fix the scale domain of every scale.
            scopeCharts.forEach(function(childChart){
                var axis  = childChart.axes[axisId];
                var scale = axis.scale;
                if(!scale.isNull){
                    scale.domain(unionExtent.min, unionExtent.max);
                    
                    axis.setScale(scale); // force update of dependent info.
                }
            });
        }
    },
    
    _buildSmallChartsBaseOptions: function(){
        // All size-related information is only supplied later in #_createCore.
        var chart = this.chart;
        var options = chart.options;
        return def.set(
            Object.create(options), 
               'parent',        chart,
               'legend',        false,
               'titleFont',     options.smallTitleFont,
               'titlePosition', options.smallTitlePosition,
               'titleAlign',    options.smallTitleAlign,
               'titleAlignTo',  options.smallTitleAlignTo,
               'titleOffset',   options.smallTitleOffset,
               'titleKeepInBounds', options.smallTitleKeepInBounds,
               'titleMargins',  options.smallTitleMargins,
               'titlePaddings', options.smallTitlePaddings,
               'titleSize',     options.smallTitleSize,
               'titleSizeMax',  options.smallTitleSizeMax);
    },
    
    /**
     * <p>
     * Implements small multiples chart layout.
     * Currently, it's essentially a flow-layout, 
     * from left to right and then top to bottom.
     * </p>
     * 
     * <p>
     * One small multiple chart is generated per unique combination 
     * of the values of the 'multiChart' visual role.
     * </p>
     * 
     * <p>
     * The option "multiChartMax" is the maximum number of small charts 
     * that can be laid out.
     * 
     * This can be useful if the chart's size cannot grow or 
     * if it cannot grow too much.
     * 
     * Pagination can be implemented with the use of this and 
     * the option 'multiChartPageIndex', to allow for effective printing of 
     * small multiple charts.
     * </p>
     * 
     * <p>
     * The option "multiChartPageIndex" is the desired page index.
     * This option requires that "multiChartMax" is also specified with
     * a finite and >= 1 value.
     * 
     * After a render is performed, 
     * the chart properties
     * {@link pvc.BaseChart#multiChartPageCount} and 
     * {@link pvc.BaseChart#multiChartPageIndex} will have been updated. 
     * </p>
     * 
     * <p>
     * The option 'multiChartColumnsMax' is the
     * maximum number of charts that can be laid  out in a row.
     * The default value is 3.
     * 
     * The value +Infinity can be specified, 
     * in which case there is no direct limit on the number of columns.
     * 
     * If the width of small charts does not fit in the available width 
     * then the chart's width is increased. 
     * </p>
     * <p>
     * The option 'smallWidth' can be specified to fix the width, 
     * of each small chart, in pixels or, in string "1%" format, 
     * as a percentage of the available width.
     * 
     * When not specified, but the option "multiChartColumnsMax" is specified and finite,
     * the width of the small charts is the available width divided
     * by the maximum number of charts in a row that <i>actually</i> occur
     * (so that if there are less small charts than 
     *  the maximum that can be placed on a row, 
     *  these, nevertheless, take up the whole width).
     * 
     * When both the options "smallWidth" and "multiChartColumnsMax" 
     * are unspecified, then the behavior is the same as if
     * the value "33%" had been specified for "smallWidth":
     * 3 charts will fit in the chart's initially specified width,
     * yet the chart's width can grow to accommodate for further small charts.
     * </p>
     * <p>
     * The option "multiChartSingleRowFillsHeight" affects the 
     * determination of the small charts height for the case where a single
     * row exists.
     * When the option is true, or unspecified, and a single row exists,
     * the height of the small charts will be all the available height,
     * looking similar to a non-multi-chart version of the same chart.
     *  When the option is false, 
     *  the determination of the small charts height does not depend
     *  on the number of rows, and proceeds as follows.
     * </p>
     * <p>
     * If the layout results in more than one row or 
     * when "multiChartSingleRowFillsHeight" is false,
     * the height of the small charts is determined using the option
     * 'smallAspectRatio', which is, by definition, width / height.
     * A typical aspect ratio value would be 5/4, 4/3 or the golden ratio (~1.62).
     * 
     * When the option is unspecified, 
     * a suitable value is determined,
     * using internal heuristic methods 
     * that generally depend on the concrete chart type
     * and specified options.
     * 
     * No effort is made to fill all the available height. 
     * The layout can result in two rows that occupy only half of the 
     * available height.
     * If the layout is such that the available height is exceeded, 
     * then the chart's height is increased.
     * </p>
     * <p>
     * The option 'margins' can be specified to control the 
     * spacing between small charts.
     * The default value is "2%".
     * Margins are only applied between small charts: 
     * the outer margins of border charts are always 0.  
     * </p>
     * <p>The option 'paddings' is applied to each small chart.</p>
     * 
     * ** Orthogonal scroll bar on height/width overflow??
     * ** Legend vertical center on page height ?? Dynamic?
     * 
     * @override
     */
    _calcLayout: function(layoutInfo){
        var multiInfo = this._multiInfo;
        if(!multiInfo){
            return;
        }
        
        var chart = this.chart;
        var options = chart.options;
        var clientSize = layoutInfo.clientSize;
        
        // TODO - multi-chart pagination
//        var multiChartPageIndex;
//        if(isFinite(multiChartMax)) {
//            multiChartPageIndex = chart.multiChartPageIndex;
//            if(isNaN(multiChartPageIndex)){
//                multiChartPageIndex = null;
//            } else {
//                // The next page number
//                // Initially, the chart property must have -1 to start iterating.
//                multiChartPageIndex++;
//            }
//        }
        
        var prevLayoutInfo = layoutInfo.previous;
        var initialClientWidth  = prevLayoutInfo ? prevLayoutInfo.initialClientWidth  : clientSize.width ;
        var initialClientHeight = prevLayoutInfo ? prevLayoutInfo.initialClientHeight : clientSize.height;
        
        var smallWidth  = pvc.PercentValue.parse(options.smallWidth);
        if(smallWidth != null){
            smallWidth = pvc.PercentValue.resolve(smallWidth, initialClientWidth);
        }
        
        var smallHeight = pvc.PercentValue.parse(options.smallHeight);
        if(smallHeight != null){
            smallHeight = pvc.PercentValue.resolve(smallHeight, initialClientHeight);
        }
        
        var ar = +options.smallAspectRatio; // + is to number
        if(isNaN(ar) || ar <= 0){
            ar = this._calulateDefaultAspectRatio();
        }
        
        if(smallWidth == null){
            if(isFinite(multiInfo.multiChartColumnsMax)){
                // Distribute currently available client width by the effective max columns.
                smallWidth = clientSize.width / multiInfo.colCount;
            } else {
                // Single Row
                // Chart grows in width as needed
                if(smallHeight == null){
                    // Both null
                    // Height uses whole height
                    smallHeight = initialClientHeight;
                }
                
                // Now use aspect ratio to calculate width
                smallWidth = ar * smallHeight;
            }
        }
        
        if(smallHeight == null){
            if((multiInfo.rowCount === 1 && def.get(options, 'multiChartSingleRowFillsHeight', true)) ||
               (multiInfo.colCount === 1 && def.get(options, 'multiChartSingleColFillsHeight', true))){
                
                // Height uses whole height
                smallHeight = initialClientHeight;
            } else {
                smallHeight = smallWidth / ar;
            }
        }
        
        // ----------------------
        
        def.set(
           layoutInfo, 
            'initialClientWidth',  initialClientWidth,
            'initialClientHeight', initialClientHeight,
            'width',  smallWidth,
            'height', smallHeight);
        
        return {
            width:  smallWidth * multiInfo.colCount,
            height: Math.max(clientSize.height, smallHeight * multiInfo.rowCount) // vertical align center: pass only: smallHeight * multiInfo.rowCount
        };
    },
    
    _calulateDefaultAspectRatio: function(/*totalWidth*/){
        if(this.chart instanceof pvc.PieChart){
            // 5/4 <=> 10/8 < 10/7 
            return 10/7;
        }
        
        // Cartesian, ...
        return 5/4;
        
        // TODO: this is not working well horizontal bar charts, for example
//        var chart = this.chart;
//        var options = chart.options;
//        var chromeHeight = 0;
//        var chromeWidth  = 0;
//        var defaultBaseSize  = 0.4;
//        var defaultOrthoSize = 0.2;
//        
//        // Try to estimate "chrome" of small chart
//        if(chart instanceof pvc.CartesianAbstract){
//            var isVertical = chart.isOrientationVertical();
//            var size;
//            if(options.showXScale){
//                size = parseFloat(options.xAxisSize || 
//                                  (isVertical ? options.baseAxisSize : options.orthoAxisSize) ||
//                                  options.axisSize);
//                if(isNaN(size)){
//                    size = totalWidth * (isVertical ? defaultBaseSize : defaultOrthoSize);
//                }
//                
//                chromeHeight += size;
//            }
//            
//            if(options.showYScale){
//                size = parseFloat(options.yAxisSize || 
//                                  (isVertical ? options.orthoAxisSize : options.baseAxisSize) ||
//                                  options.axisSize);
//                if(isNaN(size)){
//                    size = totalWidth * (isVertical ? defaultOrthoSize : defaultBaseSize);
//                }
//                
//                chromeWidth += size;
//            }
//        }
//        
//        var contentWidth  = Math.max(totalWidth - chromeWidth, 10);
//        var contentHeight = contentWidth / this._getDefaultContentAspectRatio();
//        
//        var totalHeight = chromeHeight + contentHeight;
//        
//        return totalWidth / totalHeight;
    },
    
//    _getDefaultContentAspectRatio: function(){
//        if(this.chart instanceof pvc.PieChart){
//            // 5/4 <=> 10/8 < 10/7 
//            return 10/7;
//        }
//        
//        // Cartesian
//        return 5/2;
//    },
    
    _getExtensionId: function(){
        return 'content';
    },
    
    _createCore: function(li){
        var mi = this._multiInfo;
        if(!mi){
            // Empty
            return;
        }
        
        var chart = this.chart;
        var options = chart.options;
        
        var smallMargins = options.smallMargins;
        if(smallMargins == null){
            smallMargins = new pvc.Sides(new pvc.PercentValue(0.02));
        } else {
            smallMargins = new pvc.Sides(smallMargins);
        }
        
        var smallPaddings = new pvc.Sides(options.smallPaddings);
        
        chart.children.forEach(function(childChart){
            childChart._setSmallLayout({
                left:      childChart.smallColIndex * li.width,
                top:       childChart.smallRowIndex * li.height,
                width:     li.width,
                height:    li.height,
                margins:   this._buildSmallMargins(childChart, smallMargins),
                paddings:  smallPaddings
            });
        }, this);
        
        var coordScopesByType = mi.coordScopesByType;
        if(coordScopesByType){
            chart._coordinateSmallChartsLayout(coordScopesByType);
        }
        
        this.base(li); // calls _create on child chart's basePanel
    },
    
    _buildSmallMargins: function(childChart, smallMargins){
        var mi = this._multiInfo;
        var lastColIndex = mi.colCount - 1;
        var lastRowIndex = mi.rowCount - 1;
        var colIndex = childChart.smallColIndex;
        var rowIndex = childChart.smallRowIndex;
        
        var margins = {};
        if(colIndex > 0){
            margins.left = smallMargins.left;
        }
        if(colIndex < lastColIndex){
            margins.right = smallMargins.right;
        }
        if(rowIndex > 0){
            margins.top = smallMargins.top;
        }
        if(rowIndex < lastRowIndex){
            margins.bottom = smallMargins.bottom;
        }
        
        return margins;
    }
});
