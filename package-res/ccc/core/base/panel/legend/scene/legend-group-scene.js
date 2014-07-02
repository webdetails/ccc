/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a legend group scene.
 *
 * @name pvc.visual.legend.LegendGroupScene

 * @extends pvc.visual.Scene
 *
 * @constructor
 * @param {pvc.visual.legend.LegendRootScene} parent The parent root scene.
 * @param {object} [keyArgs] Keyword arguments.
 * See {@link pvc.visual.Scene} for additional keyword arguments.
 * @param {pv.visual.legend.renderer} [keyArgs.renderer] Keyword arguments.
 */
def
.type('pvc.visual.legend.LegendGroupScene', pvc.visual.Scene)
.init(function(rootScene, keyArgs) {

    this.base(rootScene, keyArgs);

    this.legendBaseIndex = def.get(keyArgs, 'legendBaseIndex') || 0;
    this.colorAxis = def.get(keyArgs, 'colorAxis');
    this.clickMode = def.get(keyArgs, 'clickMode');

    // Some group scenes don't have axes (see waterfall).
    if(!this.clickMode && this.colorAxis) this.clickMode = this.colorAxis.option('LegendClickMode');
})
.add(/** @lends pvc.visual.legend.LegendGroupScene# */{
    // Implements pvc.visual.legend.symbolRenderer
    _rendererCreate: function(legendPanel, pvSymbolPanel, wrapper) {
        var colorAxis = this.colorAxis;
        if(!colorAxis) return;

        var legendBaseIndex = this.legendBaseIndex,
            anyRenderer = false,
            dataPartDimName = colorAxis.chart._getDataPartDimName();

        function createDataPartSymbolPanel(dataPartValue) {

            var pvDPSymPanel = new pvc.visual.Panel(legendPanel, pvSymbolPanel).pvMark;

            if(dataPartDimName) {
                pvDPSymPanel.visible(function(scene) {
                    // Check if this data value is part of the group's scene.
                    return !!scene.group.dimensions(dataPartDimName).atom(dataPartValue);
                });
            }

            return pvDPSymPanel;
        }

        colorAxis.dataCells.forEach(function(dc, index) {
            var renderer = dc.legendSymbolRenderer();
            if(renderer) {
                anyRenderer = true;
                var pvDPSymPanel = createDataPartSymbolPanel(dc.plot.option('DataPart'));
                renderer(legendPanel, pvDPSymPanel, wrapper, def.indexedId('', legendBaseIndex + index));
            }
        });

        function defaultRenderer() {
            var pvDefaultSymPanel = new pvc.visual.Panel(legendPanel, pvSymbolPanel).pvMark;

            // Currently, a legend item is not generated if no data cell will be visible for its data part values.
            // The following would evaluate visibility at every item.
            // .visible(function() {
            //     // Only if no other previous sibling DataPart Sym Panel is visible.
            //     var index = this.childIndex, siblings = this.parent.children, prev;
            //     while(index > 0 && !(prev = siblings[--index].scene[0]).visible);
            //     return !(prev && prev.visible);
            // });

            var keyArgs = {
                drawLine:    colorAxis.option('LegendDrawLine'  ),
                drawMarker:  colorAxis.option('LegendDrawMarker'),
                markerShape: colorAxis.option('LegendShape'     )
            };

            var renderer = pvc.visual.legend.symbolRenderer(keyArgs);

            // The default renderer uses only the base legend index for extension.
            renderer(legendPanel, pvDefaultSymPanel, wrapper, def.indexedId('', legendBaseIndex));
        }

        // Currently, the default renderer is only used for axes where
        // none of the plot panels provides a renderer.
        if(!anyRenderer) defaultRenderer();
    },

    // Allows knowing if there is an explicitly set or already defaulted renderer.
    hasRenderer: function() {
        return !!this._renderer;
    },

    renderer: function(_) {
        if(arguments.length) {
            if(_ && typeof _ === 'object') _ = pvc.visual.legend.symbolRenderer(_);
            this._renderer = _;
            return this;
        }
        return this._renderer ||
            (this._renderer = this._rendererCreate.bind(this));
    },

    itemSceneType: function() {
        var ItemType = this._itemSceneType;
        if(!ItemType) {
            // Inherit, anonymously, from LegendItemScene
            ItemType = def.type(pvc.visual.legend.LegendItemScene);

            // Mixin behavior depending on click mode
            var clickMode = this.clickMode;
            switch(clickMode) {
                case 'toggleselected':
                    ItemType.add(pvc.visual.legend.LegendItemSceneSelection);
                    break;

                case 'togglevisible':
                    ItemType.add(pvc.visual.legend.LegendItemSceneVisibility);
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