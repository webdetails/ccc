
/**
 * CategoricalAbstract is the base class for all categorical or timeseries
 */
pvc.CategoricalAbstract = pvc.CartesianAbstract.extend({

    constructor: function(options){
        
        this.base(options);

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
      
        var catRoleSpec = this._getCategoryRoleSpec() || 
                          def.fail.operationInvalid("Must define the category role.");
        
        this._addVisualRoles({category: catRoleSpec});

        // ---------
        // Cached
        this._catRole = this.visualRoles('category');
    },
    
    _getCategoryRoleSpec: function(){
        return { 
            isRequired: true, 
            defaultDimensionName: 'category*', 
            autoCreateDimension: true 
        };
    },
    
    _bindAxes: function(hasMultiRole){
        
        this.base(hasMultiRole);
        
        if(!hasMultiRole || this.parent){
            var axes = this.axes;
            
            var axis = axes.base;
            if(!axis.isBound()){
                axis.bind(this._buildRolesDataCells('category'));
            }
            
            var orthoDataCells;
            
            ['ortho', 'ortho2'].forEach(function(id){
                axis = axes[id];
                if(axis && !axis.isBound()){
                    if(!orthoDataCells){
                        var orthoRoleName = this.options.orthoAxisOrdinal ? 'series' : 'value';
                        orthoDataCells = this._buildRolesDataCells(orthoRoleName, {
                            isStacked: !!this.options.stacked
                        });
                    }
                    
                    axis.bind(orthoDataCells);
                }
            }, this);
        }
    },
    
    _interpolateDataCell: function(dataCell){
        var nullInterpMode = dataCell.nullInterpolationMode;
        if(nullInterpMode){
            var InterpType;
            switch(dataCell.nullInterpolationMode){
                case 'linear': InterpType = pvc.data.LinearInterpolationOper; break;
                case 'zero':   InterpType = pvc.data.ZeroInterpolationOper;   break;
                case 'none':   break;
                default: throw def.error.argumentInvalid('nullInterpolationMode', '' + nullInterpMode);
            }
        
            if(InterpType){
                this._assertSingleContinuousValueRole(dataCell.role);
                
                var visibleData = this._getVisibleData(dataCell.dataPartValue);
                
                new InterpType(
                     visibleData, 
                     this._catRole,
                     this._serRole,
                     dataCell.role,
                     dataCell.isStacked)
                .interpolate();
            }
        }
    },
    
    /**
     * @override
     */
    _createVisibleData: function(dataPartValue, keyArgs){
        var serGrouping = this._serRole && this._serRole.flattenedGrouping();
        var catGrouping = this._catRole.flattenedGrouping();
        var partData    = this.partData(dataPartValue);
        
        var ignoreNulls = def.get(keyArgs, 'ignoreNulls');
        
        // Allow for more caching when isNull is null
        var groupKeyArgs = { visible: true, isNull: ignoreNulls ? false : null};
        
        return serGrouping ?
               // <=> One multi-dimensional, two-levels data grouping
               partData.groupBy([catGrouping, serGrouping], groupKeyArgs) :
               partData.groupBy(catGrouping, groupKeyArgs);
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
     * @param {pvc.visual.Role} valueDataCell The data cell.
     * @type object
     *
     * @override
     */
    _getContinuousVisibleCellExtent: function(valueAxis, valueDataCell){
        var valueRole = valueDataCell.role;
        
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
                return this.base(valueAxis, valueDataCell);
        }
        
        this._assertSingleContinuousValueRole(valueRole);
        
        var dataPartValue = valueDataCell.dataPartValue;
        var valueDimName = valueRole.firstDimensionName();
        var data = this._getVisibleData(dataPartValue);
        var useAbs = valueAxis.scaleUsesAbs();
        
        if(valueAxis.type !== 'ortho' || !valueDataCell.isStacked){
            return data.leafs()
                       .select(function(serGroup){
                           var value = serGroup.dimensions(valueDimName).sum();
                           return useAbs && value < 0 ? -value : value;
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
                var range = this._getStackedCategoryValueExtent(catGroup, valueDimName, useAbs);
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
     * Supports {@link #_getContinuousVisibleExtent}.
     */
    _getStackedCategoryValueExtent: function(catGroup, valueDimName, useAbs){
        var posSum = null,
            negSum = null;

        catGroup
            .children()
            /* Sum all datum's values on the same leaf */
            .select(function(serGroup){
                var value = serGroup.dimensions(valueDimName).sum();
                return useAbs && value < 0 ? -value : value;
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
     * Supports {@link #_getContinuousVisibleExtent}.
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

        var baseScale = this.axes.base.scale;
        
        if(baseScale.type !== 'Timeseries'){
            pvc.log("Attempting to mark an event on a non timeSeries chart");
            return;
        }

        var o = $.extend({}, this.markEventDefaults, options);
        
        // TODO: format this using dimension formatter...
        
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
        orthoAxisOrdinal: false, // when true => ortho axis gets the series role (instead of the value role)
        
        nullInterpolationMode: 'none',
        
        stacked: false
    })
});
