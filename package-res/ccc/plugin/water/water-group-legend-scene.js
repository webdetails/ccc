/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_ValueLabelVar:true */

/**
 * Initializes a waterfall legend bullet group scene.
 * 
 * @name pvc.visual.legend.WaterfallBulletGroupScene

 * @extends pvc.visual.legend.BulletGroupScene
 * 
 * @constructor
 * @param {pvc.visual.legend.BulletRootScene} parent The parent bullet root scene.
 * @param {object} [keyArgs] Keyword arguments.
 * See {@link pvc.visual.Scene} for additional keyword arguments.
 * @param {pv.visual.legend.renderer} [keyArgs.renderer] Keyword arguments.
 */
def
.type('pvc.visual.legend.WaterfallBulletGroupScene', pvc.visual.legend.BulletGroupScene)
.init(function(rootScene, plot, keyArgs) {
    
    keyArgs = def.set(keyArgs, 'clickMode', 'none');
    
    this.base(rootScene, keyArgs);

    this.plot = plot;

    this.createItem(keyArgs); // label && color
})
.add(/** @lends pvc.visual.legend.WaterfallBulletGroupScene# */{
    renderer: function(renderer) {
        if(renderer != null) this._renderer = renderer;
        return this._renderer;
    },
    
    itemSceneType: function() {
        return pvc.visual.legend.WaterfallBulletItemScene;
    }
});

def
.type('pvc.visual.legend.WaterfallBulletItemScene', pvc.visual.legend.BulletItemScene)
.init(function(bulletGroup, keyArgs) {
    
    this.base.apply(this, arguments);
    
    // Don't allow any Action
    var I = pvc.visual.Interactive;
    this._ibits = I.Interactive | I.ShowsInteraction;
    
    this.color = def.get(keyArgs, 'color');
    
    // Pre-create 'value' variable
    this.vars.value = new pvc_ValueLabelVar(null, def.get(keyArgs, 'label'));
});
