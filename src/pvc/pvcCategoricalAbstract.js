
/**
 * CategoricalAbstract is the base class for all categorical or timeseries
 */
pvc.CategoricalAbstract = pvc.CartesianAbstract.extend({

    constructor: function(options){
        
        this.base(options);

        def.set(this._axisRoleNameMap,
            'base', 'category',
            'ortho', this.options.orthoAxisOrdinal ? 'series' : 'value'
        );

        var parent = this.parent;
        if(parent) {
            this._catRole = parent._catRole;
        }
    },
    
    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){
        
        this.base();
        
        this._addVisualRoles({
            category: { isRequired: true, defaultDimensionName: 'category*', autoCreateDimension: true }
        });

        // ---------
        // Cached
        this._catRole = this.visualRoles('category');
    },

    /**
     * @override
     */
    _createVisibleData: function(dataPartValues, ignoreNulls){
        var serGrouping = this._serRole && this._serRole.flattenedGrouping(),
            catGrouping = this._catRole.flattenedGrouping(),
            partData    = this.partData(dataPartValues),
            
            // Allow for more caching when isNull is null
            keyArgs = { visible: true, isNull: ignoreNulls ? false : null};
        
        return serGrouping ?
                // <=> One multi-dimensional, two-levels data grouping
                partData.groupBy([catGrouping, serGrouping], keyArgs) :
                partData.groupBy(catGrouping, keyArgs);
    },
    
    /**
     * Obtains the extent of the specified value axis' role
     * and data part values.
     *
     * <p>
     * Takes into account that values are shown grouped per category.
     * </p>
     *
     * <p>
     * The fact that values are stacked or not, per category,
     * is also taken into account.
     * Each data part can have its own stacking.
     * </p>
     *
     * <p>
     * When more than one datum exists per series <i>and</i> category,
     * the sum of its values is considered.
     * </p>
     *
     * @param {pvc.visual.CartesianAxis} valueAxis The value axis.
     * @param {pvc.visual.Role} valueRole The role.
     * @param {string|string[]} [dataPartValues=null] The desired data part value or values.
     * @type object
     *
     * @override
     */
    _getVisibleRoleValueExtent: function(valueAxis, valueRole, dataPartValues){
        if(!dataPartValues){
            // Most common case is faster
            return this._getVisibleCellValueExtent(valueAxis, valueRole, dataPartValues);
        }

        return def.query(dataPartValues)
                    .select(function(dataPartValue){
                        return this._getVisibleCellValueExtent(valueAxis, valueRole, dataPartValue);
                    }, this)
                    .reduce(this._unionReduceExtent, null)
                    ;
    },

    _isDataCellStacked: function(valueRole, dataPartValue){
        return this.options.stacked;
    },

    _getVisibleCellValueExtent: function(valueAxis, valueRole, dataPartValue){
        switch(valueRole.name){
            case 'series':// (series throws in base)
            case 'category':
                /* Special case.
                 * The category role's single dimension belongs to the grouping dimensions of data.
                 * As such, the default method is adequate
                 * (gets the extent of the value dim on visible data).
                 *
                 * Continuous baseScale's, like timeSeries go this way.
                 */
                return pvc.CartesianAbstract.prototype._getVisibleRoleValueExtent.call(
                                this, valueAxis, valueRole, dataPartValue);
        }
        
        this._assertSingleContinuousValueRole(valueRole);

        var valueDimName = valueRole.firstDimensionName(),
            data = this._getVisibleData(dataPartValue);

        if(valueAxis.type !== 'ortho' || !this._isDataCellStacked(valueRole, dataPartValue)){
            return data.leafs()
                       .select(function(serGroup){
                           return serGroup.dimensions(valueDimName).sum();
                        })
                       .range();
        }

        /*
         * data is grouped by category and then by series
         * So direct childs of data are category groups
         */
        return data.children()
            /* Obtain the value extent of each category */
            .select(function(catGroup){
                var range = this._getStackedCategoryValueExtent(catGroup, valueDimName);
                if(range){
                    return {range: range, group: catGroup};
                }
            }, this)
            .where(def.notNully)

            /* Combine the value extents of all categories */
            .reduce(function(result, rangeInfo){
                return this._reduceStackedCategoryValueExtent(
                            result,
                            rangeInfo.range,
                            rangeInfo.group);
            }.bind(this), null);

//        The following would not work:
//        var max = data.children()
//                    .select(function(catGroup){ return catGroup.dimensions(valueDimName).sum(); })
//                    .max();
//
//        return max != null ? {min: 0, max: max} : null;
    },
    
    /**
     * Obtains the extent of a value dimension in a given category group.
     * The default implementation determines the extent by separately
     * summing negative and positive values.
     * Supports {@link #_getVisibleValueExtent}.
     */
    _getStackedCategoryValueExtent: function(catGroup, valueDimName){
        var posSum = null,
            negSum = null;

        catGroup
            .children()
            /* Sum all datum's values on the same leaf */
            .select(function(serGroup){
                return serGroup.dimensions(valueDimName).sum();
            })
            /* Add to positive or negative totals */
            .each(function(value){
                // Note: +null === 0
                if(value != null){
                    if(value >= 0){
                        posSum += value;
                    } else {
                        negSum += value;
                    }
                }
            });

        if(posSum == null && negSum == null){
            return null;
        }

        return {max: posSum || 0, min: negSum || 0};
    },

    /**
     * Reduce operation of category ranges, into a global range.
     *
     * The default implementation performs a range "union" operation.
     *
     * Supports {@link #_getVisibleValueExtent}.
     */
    _reduceStackedCategoryValueExtent: function(result, catRange, catGroup){
        return this._unionReduceExtent(result, catRange);
    },

    markEventDefaults: {
        strokeStyle: "#5BCBF5",  /* Line Color */
        lineWidth: "0.5",  /* Line Width */
        textStyle: "#5BCBF5", /* Text Color */
        verticalOffset: 10, /* Distance between vertical anchor and label */
        verticalAnchor: "bottom", /* Vertical anchor: top or bottom */
        horizontalAnchor: "right", /* Horizontal anchor: left or right */
        forceHorizontalAnchor: false, /* Horizontal anchor position will be respected if true */
        horizontalAnchorSwapLimit: 80 /* Horizontal anchor will switch if less than this space available */
    },
    
    // TODO: chart orientation?
    markEvent: function(dateString, label, options){

        if(!this.options.timeSeries){
            pvc.log("Attempting to mark an event on a non timeSeries chart");
            return;
        }

        var o = $.extend({}, this.markEventDefaults, options);
        
        var baseScale = this.axes.base.scale;
            //{ bypassAxisOffset: true }); // TODO: why bypassAxisOffset ?

        // Are we outside the allowed scale?
        var d = pv.Format.date(this.options.timeSeriesFormat).parse(dateString);
        var dpos = baseScale(d),
            range = baseScale.range();
        
        if( dpos < range[0] || dpos > range[1]){
            pvc.log("Event outside the allowed range, returning");
            return;
        }

        // Add the line

        var panel = this._mainContentPanel.pvPanel;
        var h = this.yScale.range()[1];

        // Detect where to place the horizontalAnchor
        //var anchor = o.horizontalAnchor;
        if( !o.forceHorizontalAnchor ){
            var availableSize = o.horizontalAnchor == "right"? range[1]- dpos : dpos;
            
            // TODO: Replace this availableSize condition with a check for the text size
            if (availableSize < o.horizontalAnchorSwapLimit ){
                o.horizontalAnchor = o.horizontalAnchor == "right" ? "left" : "right";
            }
        }

        var line = panel.add(pv.Line)
            .data([0,h])
            .strokeStyle(o.strokeStyle)
            .lineWidth(o.lineWidth)
            .bottom(function(d){
                return d;
            })
            .left(dpos);

        //var pvLabel = 
        line.anchor(o.horizontalAnchor)
            .top(o.verticalAnchor == "top" ? o.verticalOffset : (h - o.verticalOffset))
            .add(pv.Label)
            .text(label)
            .textStyle(o.textStyle)
            .visible(function(){
                return !this.index;
            });
    },
    
    defaults: def.create(pvc.CartesianAbstract.prototype.defaults, {
     // Ortho <- value role
        orthoAxisOrdinal: false, // when true => _axisRoleNameMap['ortho'] = 'series' (instead of value)
        
        stacked: false
    })
});
