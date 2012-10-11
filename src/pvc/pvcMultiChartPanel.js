
pvc.MultiChartPanel = pvc.BasePanel.extend({
    anchor: 'fill',
    
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
     * The option 'multiChartMaxColumns' is the
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
     * The option 'multiChartWidth' can be specified to fix the width, 
     * of each small chart, in pixels or, in string "1%" format, 
     * as a percentage of the available width.
     * 
     * When not specified, but the option "multiChartMaxColumns" is specified and finite,
     * the width of the small charts is the available width divided
     * by the maximum number of charts in a row that <i>actually</i> occur
     * (so that if there are less small charts than 
     *  the maximum that can be placed on a row, 
     *  these, nevertheless, take up the whole width).
     * 
     * When both the options "multiChartWidth" and "multiChartMaxColumns" 
     * are unspecified, then the behavior is the same as if
     * the value "33%" had been specified for "multiChartWidth":
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
     * 'multiChartAspectRatio', which is, by definition, width / height.
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
     * The option 'multiChartMargins' can be specified to control the 
     * spacing between small charts.
     * The default value is "2%".
     * Margins are only applied between small charts: 
     * the outer margins of border charts are always 0.  
     * </p>
     * 
     * ** Orthogonal scroll bar on height/width overflow??
     * ** Legend vertical center on page height ?? Dynamic?
     * 
     * @override
     */
    _calcLayout: function(layoutInfo){
        var chart = this.chart;
        
        var multiChartRole = chart.visualRoles('multiChart');
        if(!multiChartRole.grouping){
            // Not assigned
            return;
        }
        
        var clientSize = layoutInfo.clientSize;
        var options = chart.options;
        
        // multiChartMax can be Infinity
        var multiChartMax = Number(options.multiChartMax);
        if(isNaN(multiChartMax) || multiChartMax < 1) {
            multiChartMax = Infinity;
        }
        
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
        
        var data  = multiChartRole.flatten(chart.data, {visible: true});
        var leafCount = data._children.length;
        var count = Math.min(leafCount, multiChartMax);
        if(count === 0) {
            // Shows no message to the user.
            // An empty chart, like when all series are hidden through the legend.
            return;
        }
        
        // multiChartMaxColumns can be Infinity
        var multiChartMaxColumns = +options.multiChartMaxColumns; // to number
        if(isNaN(multiChartMaxColumns) || multiChartMax < 1) {
            multiChartMaxColumns = 3;
        }
        
        var colCount = Math.min(count, multiChartMaxColumns);
        // <Debug>
        /*jshint expr:true */
        colCount >= 1 && isFinite(colCount) || def.assert("Must be at least 1 and finite");
        // </Debug>
        
        var rowCount = Math.ceil(count / colCount);
        // <Debug>
        /*jshint expr:true */
        rowCount >= 1 || def.assert("Must be at least 1");
        // </Debug>
        
        var width = pvc.PercentValue.parse(options.multiChartWidth);
        if(width == null){
            var colsInAvailableWidth = isFinite(multiChartMaxColumns) ? colCount : 3;
            width = new pvc.PercentValue(1 / colsInAvailableWidth);
        }
        
        width = pvc.PercentValue.resolve(width, clientSize.width);

        var height;
        if((rowCount === 1 && def.get(options, 'multiChartSingleRowFillsHeight', true)) ||
           (colCount === 1 && def.get(options, 'multiChartSingleColFillsHeight', true))){
            // Use the initial client height
            var prevLayoutInfo = layoutInfo.previous;
            if(!prevLayoutInfo){
                height = clientSize.height;
            } else {
                height = prevLayoutInfo.height;
            }
        } else {
            // ar ::= width / height
            var ar = +options.multiChartAspectRatio; // + is to number
            if(isNaN(ar) || ar <= 0){
                 // Determine a suitable aspect ratio
                ar = this._calulateDefaultAspectRatio(width);
            }
            
            // If  multiChartMaxHeight is specified, the height of each chart cannot be bigger
            height = width / ar;
            
            var maxHeight = +def.get(options, 'multiChartMaxHeight'); // null -> 0
            if(!isNaN(maxHeight) && maxHeight > 0){
                height = Math.min(height, maxHeight);
            }
        }

        // ----------------------
        
        def.set(
           layoutInfo, 
            'data',  data,
            'count', count,
            'width',  width,
            'height', height,
            'colCount', colCount,
            'rowCount', rowCount);
        
        return {
            width:  width  * colCount,
            height: Math.max(clientSize.height, height * rowCount) // vertical align center: pass only: height * rowCount
        };
    },
    
    _calulateDefaultAspectRatio: function(totalWidth){
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
    
    _createCore: function(li){
        if(!li.data){
            // Empty
            return;
        }
        
        var chart = this.chart;
        var options = chart.options;
        var smallChartMargins = options.multiChartMargins || 
                                new pvc.Sides(new pvc.PercentValue(0.02));
        
        // Index axes that need to be coordinated, by scopeType
        var hasCoordination = false;
        var rootAxes = chart.axes;
        var rootAxesByScopeType = 
            def
            .query(def.ownKeys(rootAxes))
            // filter entries of axis aliases 
            .where(function(alias){ return rootAxes[alias].id === alias; })
            .select(function(id){ return rootAxes[id]; })
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
        
        // ----------------------
        // Create and layout small charts
        var ChildClass = chart.constructor;
        
        var lastColIndex = li.colCount - 1;
        var lastRowIndex = li.rowCount - 1;
        
        var preRenderKeyArgs, scopesByType, addChartToScope, childCharts;
        if(hasCoordination){
            childCharts  = [];
            scopesByType = {};
            preRenderKeyArgs = {isScaleCoordination: true};
            
            // Each scope is a specific 
            // 'row', 'column' or the single 'global' scope 
            addChartToScope = function(childChart, scopeType, scopeIndex){
                var scopes = scopesByType[scopeType] || 
                             (scopesByType[scopeType] = []);
                
                (scopes[scopeIndex] || (scopes[scopeIndex] = []))
                    .push(childChart);
            };
        }
        
        for(var index = 0 ; index < li.count ; index++) {
            var childData = li.data._children[index];
            
            var colIndex = (index % li.colCount);
            var rowIndex = Math.floor(index / li.colCount);
            
            var margins = {};
            if(colIndex > 0){
                margins.left = smallChartMargins.left;
            }
            if(colIndex < lastColIndex){
                margins.right = smallChartMargins.right;
            }
            if(rowIndex > 0){
                margins.top = smallChartMargins.top;
            }
            if(rowIndex < lastRowIndex){
                margins.bottom = smallChartMargins.bottom;
            }
            
            var childOptions = def.create(options, {
                    parent:     chart,
                    title:      childData.absLabel,
                    legend:     false,
                    data:       childData,
                    width:      li.width,
                    height:     li.height,
                    left:       colIndex * li.width,
                    top:        rowIndex * li.height,
                    margins:    margins,
                    extensionPoints: {
                        // This lets the main bg color show through AND
                        // allows charts to overflow to other charts without that being covered
                        // Notably, axes values tend to overflow a little bit.
                        // Also setting to null, instead of transparent, for example
                        // allows the rubber band to set its "special transparent" color
                        base_fillStyle: null
                    }
                });
            
            var childChart = new ChildClass(childOptions);
            if(!hasCoordination){
                childChart._preRender();
            } else {
                childChart._preRenderPhase1();
                
                // Index child charts by scope
                //  on scopes having axes requiring coordination.
                if(rootAxesByScopeType.row){
                    addChartToScope(childChart, 'row', rowIndex);
                }
                
                if(rootAxesByScopeType.column){
                    addChartToScope(childChart, 'column', colIndex);
                }
                
                if(rootAxesByScopeType.global){
                    addChartToScope(childChart, 'global', 0);
                }
                
                childCharts.push(childChart);
            }
        }
        
        // Need _preRenderPhase2?
        if(hasCoordination){
            // For each scope type having scales requiring coordination
            // find the union of the scales' domains for each
            // scope instance
            // Finally update all scales of the scope to have the 
            // calculated domain.
            def.eachOwn(rootAxesByScopeType, function(axes, scopeType){
                axes.forEach(function(axis){
                    
                    scopesByType[scopeType]
                        .forEach(function(scopeCharts){
                            this._coordinateScopeAxes(axis.id, scopeCharts);
                        }, this);
                    
                }, this);
            }, this);
            
            // Finalize _preRender, now that scales are coordinated
            childCharts.forEach(function(childChart){
                childChart._preRenderPhase2();
            });
            
            chart._coordinateSmallChartsLayout(childCharts, scopesByType);
        }
        
        this.base(li); // calls _create on child chart's basePanel
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
    }
});
