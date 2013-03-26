/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def
.type('pvc.visual.legend.WaterfallBulletItemScene', pvc.visual.legend.BulletItemScene)
.init(function() {
    
    this.base.apply(this, arguments);
    
    // Don't allow any Action
    var I = pvc.visual.Interactive;
    this._ibits = I.Interactive | I.ShowsInteraction;
});

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
.init(function(rootScene, keyArgs) {
    
    this.base(rootScene, def.set(keyArgs, 'clickMode', 'none'));
    
    var item = this.createItem({
        value:    null,
        rawValue: null,
        label:    def.get(keyArgs, 'label')
    });
    
    item.color = def.get(keyArgs, 'color');
})
.add(/** @lends pvc.visual.legend.WaterfallBulletGroupScene# */{
    renderer: function(renderer) {
        if(renderer != null) { this._renderer = renderer; }
        return this._renderer;
    },
    
    itemSceneType: def.fun.constant(pvc.visual.legend.WaterfallBulletItemScene)
});