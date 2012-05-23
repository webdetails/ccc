
/**
 * WaterfallChart is the class that generates waterfall charts.
 *
 * The waterfall chart is an alternative to the pie chart for
 * showing distributions. The advantage of the waterfall chart is that
 * it possibilities to visualize sub-totals and offers more convenient
 * possibilities to compare the size of categories (in a pie-chart you
 * have to compare wedges that are at a different angle, which
 * requires some additional processing/brainpower of the end-user).
 *
 * Waterfall charts are basically Bar-charts with some added
 * functionality. Given the complexity of the added features this
 * class has it's own code-base. However, it would be easy to
 * derive a BarChart class from this class by switching off a few
 * features.
 *
 * If you have an issue or suggestions regarding the Waterfall-charts
 * please contact CvK at cde@vinzi.nl
 */
pvc.WaterfallChart = pvc.BarAbstract.extend({

    _isFalling: true,
    _ruleInfos: null,
    _waterColor: pv.Color.names.darkblue,//darkblue,darkslateblue,royalblue,seagreen, //pv.color("#808285").darker(),

    constructor: function(options){

        this.base(options);
        
        // Apply options
        pvc.mergeDefaults(this.options, pvc.WaterfallChart.defaultOptions, options);

        var parent = this.parent;
        if(parent) {
            this._isFalling = parent._isFalling;
        }
    },

    /**
     * Processes options after user options and default options have been merged.
     * @override
     */
    _processOptionsCore: function(options){

        // Waterfall charts are always stacked
        options.stacked = true;
        if(options.showWaterValues === undefined){
            options.showWaterValues = options.showValues;
        }

        // Doesn't work (yet?)
        options.useCompositeAxis = false;

        this.base(options);
    },

    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){
        
        this.base();

        this._isFalling = (this.options.waterDirection === 'down');
        
        this._catRole.setFlatteningMode(this._isFalling ? 'tree-pre' : 'tree-post');
        this._catRole.setFlattenRootLabel(this.options.allCategoryLabel);
    },

    _initLegendGroups: function(){
        
        this.base();

        var strokeStyle = this._getExtension("barWaterfallLine", "strokeStyle");
        if(strokeStyle && !def.isFun(strokeStyle)){
            this._waterColor = pv.color(strokeStyle);
        }

        this._addLegendGroup({
            id:        "waterfallTotalLine",
            type:      "discreteColorAndShape",
            items:     [{
                value: null,
                label: this.options.accumulatedLineLabel,
                color: this._waterColor,
                shape: 'bar',
                isOn:  def.constant(true),
                click: null
            }]
        });
    },
    
    /**
     * Reduce operation of category ranges, into a global range.
     *
     * Propagates the total value.
     *
     * Also creates the array of rule information {@link #_ruleInfos}
     * used by the waterfall panel to draw the rules.
     *
     * Supports {@link #_getVisibleValueExtent}.
     */
    _reduceStackedCategoryValueExtent: function(result, catRange, catGroup){
        /*
         * That min + max are the variation of this category
         * relies on the concrete base._getStackedCategoryValueExtent() implementation...
         * Max always contains the sum of positives, if any, or 0
         * Min always contains the sum of negatives, if any, or 0
         * max >= 0
         * min <= 0
         */
        /*
         * When falling, the first category is surely *the* global total.
         * When falling, the first category must set the initial offset
         * and, unlike every other category group such that _isFlattenGroup===true,
         * it does contribute to the offset, and positively.
         * The offset property accumulates the values.
         */
        var offset, negOffset;
        if(!result){
            if(catRange){
                offset    = catRange.max;
                negOffset = catRange.min;
                this._ruleInfos = [{
                    offset: offset,
                    negOffset: negOffset,
                    group:  catGroup,
                    range:  catRange
                }];

                // Copy the range object
                return {
                    min: catRange.min,
                    max: catRange.max,
                    offset: offset,
                    negOffset: negOffset
                };
            }

            return null;
        }

        offset = result.offset;
        negOffset = result.negOffset;
        if(this._isFalling){
            this._ruleInfos.push({
                offset: offset,
                negOffset: negOffset,
                group:  catGroup,
                range:  catRange
            });
        }

        if(!catGroup._isFlattenGroup){
            var dir = this._isFalling ? -1 : 1;

            offset    = result.offset    = offset    + dir * catRange.max,
            negOffset = result.negOffset = negOffset - dir * catRange.min;

            if(negOffset < result.min){
                result.min = negOffset;
            }

            if(offset > result.max){
                result.max = offset;
            }
        }

        if(!this._isFalling){
            this._ruleInfos.push({
                offset: offset,
                negOffset: negOffset,
                group:  catGroup,
                range:  catRange
            });
        }
        
        return result;
    },
    
    /* @override */
    _createMainContentPanel: function(parentPanel){
        if(pvc.debug >= 3){
            pvc.log("Prerendering in WaterfallChart");
        }
        
        var options = this.options;
        
        return new pvc.WaterfallPanel(this, parentPanel, {
            waterfall:    options.waterfall,
            barSizeRatio: options.barSizeRatio,
            maxBarSize:   options.maxBarSize,
            showValues:   options.showValues,
            orientation:  options.orientation
        });
    }
}, {
    defaultOptions: {
        // down or up
        waterDirection: 'down',
        showWaterValues: undefined, // defaults to showValues
        showWaterGroupAreas: true,
        allCategoryLabel: "All",
        accumulatedLineLabel: "Accumulated"
    }
});
