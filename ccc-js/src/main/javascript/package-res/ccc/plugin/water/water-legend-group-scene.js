/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a waterfall legend group scene.
 * 
 * @name pvc.visual.legend.WaterfallLegendGroupScene

 * @extends pvc.visual.legend.LegendGroupScene
 * 
 * @constructor
 * @param {pvc.visual.legend.LegendRootScene} parent The parent root scene.
 * @param {object} [keyArgs] Keyword arguments.
 * See {@link pvc.visual.Scene} for additional keyword arguments.
 * @param {pv.visual.legend.renderer} [keyArgs.renderer] Keyword arguments.
 */
def
.type('pvc.visual.legend.WaterfallLegendGroupScene', pvc.visual.legend.LegendGroupScene)
.init(function(rootScene, plot, keyArgs) {
    
    keyArgs = def.set(keyArgs, 'clickMode', 'none');
    
    this.base(rootScene, keyArgs);

    this.plot = plot;

    this.createItem(keyArgs); // label && color
})
.add(/** @lends pvc.visual.legend.WaterfallLegendGroupScene# */{
    itemSceneType: function() {
        return pvc.visual.legend.WaterfallLegendItemScene;
    }
});
