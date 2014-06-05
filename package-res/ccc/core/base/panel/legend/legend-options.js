/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_Size:true, pvc_Sides:true */
    
/**
 * Initializes a legend.
 * 
 * @name pvc.visual.Legend
 * 
 * @class Manages the options of a chart legend.
 * @extends pvc.visual.OptionsBase
 */
def
.type('pvc.visual.Legend', pvc.visual.OptionsBase)
.init(function(chart, type, index, keyArgs) {
    // prevent naked resolution of legend
    keyArgs = def.set(keyArgs, 'byNaked', false);
    
    this.base(chart, type, index, keyArgs);
})
.add(/** @lends Legend# */{
    _getOptionsDefinition: function() { return legend_optionsDef; }
});

/* PRIVATE STUFF */
function legend_castSize(size) {
    // Single size or sizeMax (a number or a string)
    // should be interpreted as meaning the orthogonal length.
    
    if(!def.object.is(size)) {
        var position = this.option('Position');
        size = new pvc_Size()
            .setSize(size, {
                singleProp: pvc.BasePanel.orthogonalLength[position]
            });
    }
    
    return size;
}

function legend_castAlign(align) {
    var position = this.option('Position');
    return pvc.parseAlign(position, align);
}

function legendItem_castSize(size) {
    return new pvc_Size().setSize(size, {singleProp: 'width'});
}

/*global axis_optionsDef:true*/
var legend_optionsDef = {
    /* legendPosition */
    Position: {
        resolve: '_resolveFull',
        cast:    pvc.parsePosition,
        value:   'bottom'
    },
    
    /* legendSize,
     * legend2Size 
     */
    Size: {
        resolve: '_resolveFull',
        cast:    legend_castSize
    },
    
    SizeMax: {
        resolve: '_resolveFull',
        cast:    legend_castSize
    },
    
    Align: {
        resolve: '_resolveFull',
        data: {
            resolveDefault: function(optionInfo) {
                // Default value of align depends on position
                var position = this.option('Position');
                var align;
                if(position !== 'top' && position !== 'bottom')
                    align = 'top';
                else if(this.chart.compatVersion() <= 1) // centered is better
                    align = 'left';

                return optionInfo.defaultValue(align), true;
            }
        },
        cast: legend_castAlign
    },
    
    Margins:  {
        resolve: '_resolveFull',
        data: {
            resolveDefault: function(optionInfo) {
                // Default value of align depends on position
                // Default value of margins depends on position
                if(this.chart.compatVersion() > 1) {
                    var position = this.option('Position'),
                        // Set default margins
                        margins = def.set({}, pvc.BasePanel.oppositeAnchor[position], 5);
                    
                    optionInfo.defaultValue(margins);
                }
                return true;
            }
        },
        cast: pvc_Sides.as
    },
    
    Paddings: {
        resolve: '_resolveFull',
        cast:    pvc_Sides.as,
        value:   5
    },
    
    Font: {
        resolve: '_resolveFull',
        cast:    String
    },

    ItemSize: {
        resolve: '_resolveFull',
        cast:    legendItem_castSize
    }
};