/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a waterfall plot.
 * 
 * @name pvc.visual.WaterfallPlot
 * @class Represents a waterfall plot.
 * @extends pvc.visual.BarPlotAbstract
 */
def
.type('pvc.visual.WaterfallPlot', pvc.visual.BarPlotAbstract)
.init(function(chart, keyArgs) {

    this.base(chart, keyArgs);

    chart._registerInitLegendScenes(this._initLegendScenes.bind(this));
})
.add({
    type: 'water',

    _waterColor: pv.color("#1f77b4").darker(),

    /** @override */
    _initEnd: function() {
        // After all options have been set, the chart's
        // extension points may now be safely queried.
        var extAbsId    = pvc.makeExtensionAbsId('line', this.extensionPrefixes);
        var strokeStyle = this.chart._getConstantExtension(extAbsId, 'strokeStyle');
        if(strokeStyle) this._waterColor = pv.color(strokeStyle);

        this.base();
    },

    /** @override */
    _getCategoryRoleSpec: function() {
        var catRoleSpec = this.base(),
            travProp = this.isFalling() ? 'FlattenDfsPre' : 'FlattenDfsPost';

        // This sets traversalMode as well, as there is only one possible value.
        // This ensures that two water-plots are incompatible if they have different Directions,
        // something that is detected in Axis#_conciliateVisualRoles.
        catRoleSpec.traversalModes = pvc.visual.TraversalMode[travProp];
        catRoleSpec.rootLabel      = this.option('AllCategoryLabel');

        return catRoleSpec;
    },

    isFalling: function() {
        return this.option('Direction') === 'down';
    },

    /** @override */    
    _getOptionsDefinition: function() { return pvc.visual.WaterfallPlot.optionsDef; },

    /**
     * Reduce operation of category ranges, into a global range.
     *
     * Propagates the total value.
     *
     * Also creates an array of rule information that is stored in the axis as the data cell's scale info.
     * This is used by the waterfall panel to draw the rules.
     * This cannot be stored in the chart, for example, so that multiple charts are supported.
     * It would also prevent using more than one waterfall plot in a chart.
     *
     * Supports {@link #_getContinuousVisibleExtent}.
     */
    _reduceStackedCategoryValueExtent: function(chart, result, catRange, catGroup, valueAxis, valueDataCell) {
        // That min + max are the variation of this category
        // relies on the concrete base._getStackedCategoryValueExtent() implementation...
        // Max always contains the sum of positives, if any, or 0
        // Min always contains the sum of negatives, if any, or 0
        // max >= 0
        // min <= 0
        //
        // When falling, the first category is surely *the* global total.
        // When falling, the first category must set the initial offset
        // and, unlike every other category group such that _isFlattenGroup===true,
        // it does contribute to the offset, and positively.
        // The offset property accumulates the values.

        // previous offset
        var offsetPrev  = result ? result.offset : 0,
            offsetDelta = catRange.min + catRange.max,
            offsetNext;

        if(!result) {
            if(catRange) {
                offsetNext = offsetPrev + offsetDelta;
                valueAxis.setDataCellScaleInfo(valueDataCell, [{
                    offset: offsetNext,
                    group:  catGroup,
                    range:  catRange
                }]);

                // Copy the range object
                return {
                    min:    catRange.min,
                    max:    catRange.max,
                    offset: offsetNext
                };
            }
            return null;
        }
        
        var isFalling = this.isFalling(),
            isProperGroup = catGroup._isFlattenGroup && !catGroup._isDegenerateFlattenGroup;
        if(!isProperGroup) {
            // offset, min, max may be affected
            var dir = isFalling ? -1 : 1;
            offsetNext = result.offset = offsetPrev + dir * offsetDelta;
            
            if(offsetNext > result.max) result.max = offsetNext;
            else
            if(offsetNext < result.min) result.min = offsetNext;
            
        } else {
            // offset not affected
            // min, max may be affected
            var deltaUp = -catRange.min; // positive
            if(deltaUp > 0) {
                var top = offsetPrev + deltaUp;
                if(top > result.max) result.max = top;
            }
            
            var deltaDown = -catRange.max; // negative
            if(deltaDown < 0) {
                var bottom = offsetPrev + deltaDown;
                if(bottom < result.min) result.min = bottom;
            }
        }

        // Add a ruleInfo to the data cell's scale info.
        valueAxis.getDataCellScaleInfo(valueDataCell).push({
            offset: isFalling ? offsetPrev : result.offset,
            group:  catGroup,
            range:  catRange
        });
        
        return result;
    },

    _initLegendScenes: function(legendPanel) {
        
        var rootScene = legendPanel._getLegendRootScene();
        
        new pvc.visual.legend.WaterfallLegendGroupScene(rootScene, this, {
            extensionPrefix: def.indexedId('', 1),
            label: this.option('TotalLineLabel'),
            color: this._waterColor
        });
    }
});

pvc.visual.Plot.registerClass(pvc.visual.WaterfallPlot);

pvc.visual.WaterfallPlot.optionsDef = def.create(
    pvc.visual.BarPlotAbstract.optionsDef, 
    {
        Stacked: { // override
            resolve: null, 
            value:   true
        },
        
        TotalLineLabel: {
            resolve: '_resolveFull',
            cast:    String,
            value:   "Accumulated"
        },
        
        TotalValuesVisible: { 
            resolve: '_resolveFull',
            data: {
                // Dynamic default
                resolveDefault: function(optionInfo) {
                    return optionInfo.defaultValue(this.option('ValuesVisible')), true;
                }
            },
            cast:    Boolean
        },
        
        Direction: { // up/down
            resolve: '_resolveFull',
            cast:    pvc.parseWaterDirection,
            value:   'down'
        },
        
        AreasVisible: {
            resolve: '_resolveFull',
            cast:    Boolean,
            value:   true
        },
        
        AllCategoryLabel: {
            resolve: '_resolveFull',
            cast:    String,
            value:   "All"
        }
    });