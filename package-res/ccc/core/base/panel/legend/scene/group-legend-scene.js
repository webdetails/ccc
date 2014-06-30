/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a legend bullet group scene.
 *
 * @name pvc.visual.legend.BulletGroupScene

 * @extends pvc.visual.Scene
 *
 * @constructor
 * @param {pvc.visual.legend.BulletRootScene} parent The parent bullet root scene.
 * @param {object} [keyArgs] Keyword arguments.
 * See {@link pvc.visual.Scene} for additional keyword arguments.
 * @param {pv.visual.legend.renderer} [keyArgs.renderer] Keyword arguments.
 */
def
.type('pvc.visual.legend.BulletGroupScene', pvc.visual.Scene)
.init(function(rootScene, keyArgs) {

    this.base(rootScene, keyArgs);

    this.extensionPrefix =  def.get(keyArgs, 'extensionPrefix') || '';
    this._renderer = def.get(keyArgs, 'renderer');

    this.colorAxis = def.get(keyArgs, 'colorAxis');
    this.clickMode = def.get(keyArgs, 'clickMode');
    if(!this.clickMode && this.colorAxis) this.clickMode = this.colorAxis.option('LegendClickMode');
})
.add(/** @lends pvc.visual.legend.BulletGroupScene# */{
    hasRenderer: function() { return !!this._renderer; },

    renderer: function(renderer) {
        if(renderer != null) {
            this._renderer = renderer;
        } else {
            renderer = this._renderer;
            if(!renderer) {
                var keyArgs,
                    colorAxis = this.colorAxis;
                if(colorAxis) {
                    keyArgs = {
                        drawRule:    colorAxis.option('LegendDrawLine'  ),
                        drawMarker:  colorAxis.option('LegendDrawMarker'),
                        markerShape: colorAxis.option('LegendShape')
                    };
                }

                renderer = new pvc.visual.legend.BulletItemDefaultRenderer(keyArgs);
                this._renderer = renderer;
            }
        }

        return renderer;
    },

    itemSceneType: function() {
        var ItemType = this._itemSceneType;
        if(!ItemType) {
            // Inherit, anonymously, from BulletItemScene
            ItemType = def.type(pvc.visual.legend.BulletItemScene);

            // Mixin behavior depending on click mode
            var clickMode = this.clickMode;
            switch(clickMode) {
                case 'toggleselected':
                    ItemType.add(pvc.visual.legend.BulletItemSceneSelection);
                    break;

                case 'togglevisible':
                    ItemType.add(pvc.visual.legend.BulletItemSceneVisibility);
                    break;
            }

            var legendPanel = this.panel();

            // Apply legend item scene extensions
            legendPanel._extendSceneType('item', ItemType, ['isOn', 'executable', 'execute', 'value', 'labelText']);

            // Apply legend item scene Vars extensions
            // extensionPrefix contains "", "2", "3", ...
            // -> "legendItemScene", "legend$ItemScene", or
            // -> "legend2ItemScene", "legend$ItemScene", or
            var itemSceneExtIds = pvc.makeExtensionAbsId(
                    pvc.makeExtensionAbsId("ItemScene", [this.extensionPrefix, '$']),
                    legendPanel._getExtensionPrefix());

            var impl = legendPanel.chart._getExtension(itemSceneExtIds, 'value');
            if(impl !== undefined) ItemType.prototype.variable('value', impl);

            this._itemSceneType = ItemType;
        }

        return ItemType;
    },

    createItem: function(keyArgs) {
        var ItemType = this.itemSceneType();
        return new ItemType(this, keyArgs);
    }
});