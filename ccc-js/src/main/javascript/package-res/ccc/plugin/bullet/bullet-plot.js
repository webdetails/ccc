/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a bullet plot.
 * 
 * @name pvc.visual.BulletPlot
 * @class Represents a bullet plot.
 * @extends pvc.visual.Plot
 */
def.type('pvc.visual.BulletPlot', pvc.visual.Plot.extend({
    methods: /** @lends pvc.visual.BulletPlot# */{
        type: 'bullet',

        /** @override */
        _initVisualRoles: function() {

            this.base();

            this._addVisualRole('title',    {defaultDimension: 'title*'   });
            this._addVisualRole('subTitle', {defaultDimension: 'subTitle*'});
            this._addVisualRole('value', {
                //isRequired: true, // due to the no data mode
                isMeasure:  true,
                requireIsDiscrete: false,
                requireSingleDimension: false,
                valueType: Number,
                defaultDimension: 'value*'
            });
            this._addVisualRole('marker', {
                isMeasure:  true,
                requireIsDiscrete: false,
                requireSingleDimension: false,
                valueType: Number,
                defaultDimension: 'marker*'
            });
            this._addVisualRole('range', {
                isMeasure:  true,
                requireIsDiscrete: false,
                requireSingleDimension: false,
                valueType: Number,
                defaultDimension: 'range*'
            });
        }
    },

    options: {
        ValuesVisible: { // override
            value: true
        }
    }
}));

pvc.visual.Plot.registerClass(pvc.visual.BulletPlot);
