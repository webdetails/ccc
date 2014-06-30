/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_PercentValue:true */

def
.type('pvc.MultiChartPanel', pvc.BasePanel)
.add({
    anchor: 'fill',

    createSmallCharts: function() {
        var chart = this.chart;

        var multiInfo = chart._multiInfo;
        var count;
        if(!multiInfo || !(count = multiInfo.count)) {
            // Shows no message to the user.
            // An empty chart, like when all series are hidden through the legend.
            return;
        }
        
        /* I - Determine if axes need coordination (null if no coordination needed) */
        var coordRootAxesByScopeType = this._getCoordinatedRootAxesByScopeType();
                
        var coordScopesByType, addChartToScope, indexChartByScope;
        if(coordRootAxesByScopeType) {
            coordScopesByType = {};

            // Each scope is a specific
            // 'row', 'column' or the single 'global' scope
            addChartToScope = function(childChart, scopeType, scopeIndex) {
                var scopes = def.array.lazy(coordScopesByType, scopeType);

                def.array.lazy(scopes, scopeIndex).push(childChart);
            };

            indexChartByScope = function(childChart) {
                // Index child charts by scope
                //  on scopes having axes requiring coordination.
                if(coordRootAxesByScopeType.row)
                    addChartToScope(childChart, 'row', childChart.smallRowIndex);

                if(coordRootAxesByScopeType.column)
                    addChartToScope(childChart, 'column', childChart.smallColIndex);

                if(coordRootAxesByScopeType.global)
                    addChartToScope(childChart, 'global', 0);
            };
        }

        /* II - Construct and _create small charts */
        var childOptionsBase = this._buildSmallChartsBaseOptions();
        var ChildClass = chart.constructor;
        var smallDatas = multiInfo.smallDatas;
        var colCount   = multiInfo.colCount;
        for(var index = 0; index < count; index++) {
            var smallData = smallDatas[index];

            var colIndex = (index % colCount);
            var rowIndex = Math.floor(index / colCount);

            var childOptions = def.set(
                Object.create(childOptionsBase),
                'smallColIndex', colIndex,
                'smallRowIndex', rowIndex,
                'title',         smallData.absLabel, // does not change with trends
                'data',          smallData);

            var smallChart = new ChildClass(childOptions);

            if(!coordRootAxesByScopeType) {
                smallChart._create();
            } else {
                // options, data, plots, axes, axes_scales
                smallChart._createPhase1();

                indexChartByScope(smallChart);
            }
        }

        // Need _createPhase2
        if(coordRootAxesByScopeType) {
            // For each scope type having scales requiring coordination
            // find the union of the scales' domains for each
            // scope instance
            // Finally update all scales of the scope to have the
            // calculated domain.
            var me = this;
            def.eachOwn(coordRootAxesByScopeType, function(axes, scopeType) {
                axes.forEach(function(axis) {
                    coordScopesByType[scopeType]
                        .forEach(function(scopeCharts) {
                            me._coordinateScopeAxes(axis.id, scopeCharts);
                        });
                });
            });

            // Finalize _create, now that scales are coordinated
            chart.children.forEach(function(childChart) {
                childChart._createPhase2();
            });
        }

        multiInfo.coordScopesByType = coordScopesByType;
    },

    _getCoordinatedRootAxesByScopeType: function() {
        // Index axes that need to be coordinated, by scopeType
        var hasCoordination = false;
        var rootAxesByScopeType =
            def
            .query(this.chart.axesList)
            .multipleIndex(function(axis) {
                if(axis.scaleType !== 'discrete' && // Not implemented (yet...)
                   axis.option.isDefined('DomainScope')) {

                    var scopeType = axis.option('DomainScope');
                    if(scopeType !== 'cell') {
                        hasCoordination = true;
                        return scopeType;
                    }
                }
            });

        return hasCoordination ? rootAxesByScopeType : null;
    },

    _coordinateScopeAxes: function(axisId, scopeCharts) {
        var unionExtent =
            def
            .query(scopeCharts)
            .select(function(childChart) {
                var scale = childChart.axes[axisId].scale;
                if(!scale.isNull) {
                    var domain = scale.domain();
                    return {min: domain[0], max: domain[1]};
                }
            })
            .reduce(pvc.unionExtents, null);

        if(unionExtent) {
            // Fix the scale domain of every scale.
            scopeCharts.forEach(function(childChart) {
                var axis  = childChart.axes[axisId];
                var scale = axis.scale;
                if(!scale.isNull) {
                    scale.domain(unionExtent.min, unionExtent.max);

                    axis.setScale(scale); // force update of dependent info.
                }
            });
        }
    },

    _buildSmallChartsBaseOptions: function() {
        // TODO: can't this change to a variable title panel extension prefix?

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
    _calcLayout: function(layoutInfo) {
        var chart = this.chart;
        var multiInfo = chart._multiInfo;
        if(!multiInfo) { return; }

        var multiOption = chart.multiOptions.option;
        var smallOption = chart.smallOptions.option;
        var clientSize  = layoutInfo.clientSize;

        // TODO - multi-chart pagination
        //        var multiChartPageIndex;
        //        if(isFinite(multiChartMax)) {
        //            multiChartPageIndex = chart.multiChartPageIndex;
        //            if(isNaN(multiChartPageIndex)) {
        //                multiChartPageIndex = null;
        //            } else {
        //                // The next page number
        //                // Initially, the chart property must have -1 to start iterating.
        //                multiChartPageIndex++;
        //            }
        //        }

        var prevLayoutInfo = layoutInfo.previous;
        var initialClientWidth   = prevLayoutInfo ? prevLayoutInfo.initialClientWidth  : clientSize.width ;
        var initialClientHeight  = prevLayoutInfo ? prevLayoutInfo.initialClientHeight : clientSize.height;
        
        var smallWidth = smallOption('Width');
        if(smallWidth != null) {
            smallWidth = pvc_PercentValue.resolve(smallWidth, initialClientWidth);
        }

        var smallHeight = smallOption('Height');
        if(smallHeight != null) {
            smallHeight = pvc_PercentValue.resolve(smallHeight, initialClientHeight);
        }

        var ar = smallOption('AspectRatio');
        var rowCount = multiInfo.rowCount;
        var colCount = multiInfo.colCount;
        if(smallWidth == null) {
            if(isFinite(multiInfo.colsMax)) {
                // Distribute currently available client width by the effective max columns.
                smallWidth = clientSize.width / colCount;
            } else {
                // Single Row
                // Chart grows in width as needed
                if(smallHeight == null) {
                    // Both null
                    // Height uses whole height
                    smallHeight = initialClientHeight;
                }

                // Now use aspect ratio to calculate width
                smallWidth = ar * smallHeight;
            }
        }

        if(smallHeight == null) {
            // Should use whole height?
            if((rowCount === 1 && multiOption('SingleRowFillsHeight')) ||
               (colCount === 1 && multiOption('SingleColFillsHeight'))) {
                smallHeight = initialClientHeight;
            } else {
                smallHeight = smallWidth / ar;
            }
        }

        // ----------------------
        
        var finalClientWidth  = smallWidth  * colCount;
        var finalClientHeight = smallHeight * rowCount;

        // If not already repeating due to multiChartOverflow=clip
        if(!chart._isMultiChartOverflowClipRetry) {
            
            chart._isMultiChartOverflowClip = false;

            switch(multiOption('Overflow')) {
                case 'fit': 
                    if(finalClientWidth > initialClientWidth) {
                        finalClientWidth = initialClientWidth;
                        smallWidth = finalClientWidth / colCount;
                    }
                    if(finalClientHeight > initialClientHeight) {
                        finalClientHeight = initialClientHeight;
                        smallHeight = finalClientHeight / rowCount;
                    }
                    break;

                case 'clip': 
                    // Limit the number of charts to those that actually fit entirely.
                    // If this layout is actually used, it will be necessary
                    // to repeat chart._create .
                    var colsMax = colCount;
                    var rowsMax = rowCount;
                    var clipW = finalClientWidth > initialClientWidth;
                    if(clipW) {
                        // May be 0
                        colsMax = Math.floor(initialClientWidth / smallWidth);
                    }
                    
                    var clipH = finalClientHeight > initialClientHeight;
                    if(clipH) {
                        rowsMax = Math.floor(initialClientHeight / smallHeight);
                    }

                    if(clipH || clipW) {
                        // HACK: Notify the top chart that multi-charts overflowed...
                        chart._isMultiChartOverflowClip = true;
                        chart._clippedMultiChartRowsMax = rowsMax;
                        chart._clippedMultiChartColsMax = colsMax;
                    }
                    break;
                // default 'grow'
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
            width:  finalClientWidth,
            height: Math.max(clientSize.height, finalClientHeight) // vertical align center: pass only: smallHeight * rowCount
        };
    },

    _getExtensionId: function() { return 'content'; },

    _createCore: function(li) {
        var chart = this.chart;

        !chart._isMultiChartOverflowClip || def.assert("Overflow&clip condition should be resolved.");

        var mi = chart._multiInfo;
        if(!mi) { return; } // Empty

        var smallOption = chart.smallOptions.option;
        var smallMargins  = smallOption('Margins');
        var smallPaddings = smallOption('Paddings');

        chart.children.forEach(function(childChart) {
            childChart._setSmallLayout({
                left:      childChart.smallColIndex * li.width,
                top:       childChart.smallRowIndex * li.height,
                width:     li.width,
                height:    li.height,
                margins:   this._buildSmallMargins(childChart, smallMargins, mi),
                paddings:  smallPaddings
            });
        }, this);

        var coordScopesByType = mi.coordScopesByType;
        if(coordScopesByType) {
            chart._coordinateSmallChartsLayout(coordScopesByType);
        }

        this.base(li); // calls _create on child chart's basePanel, which then calls layout, etc...
    },

    // Margins are only applied *between* small charts
    _buildSmallMargins: function(childChart, smallMargins, mi) {
        var C = mi.colCount - 1;
        var R = mi.rowCount - 1;
        var c = childChart.smallColIndex;
        var r = childChart.smallRowIndex;

        var margins = {};
        if(c > 0) { margins.left   = smallMargins.left;   }
        if(c < C) { margins.right  = smallMargins.right;  }
        if(r > 0) { margins.top    = smallMargins.top;    }
        if(r < R) { margins.bottom = smallMargins.bottom; }
        return margins;
    }
});
