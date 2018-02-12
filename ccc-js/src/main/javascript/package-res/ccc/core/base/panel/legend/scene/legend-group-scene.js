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
    if(!this.clickMode && this.colorAxis) {
        this.clickMode = this.colorAxis.option('LegendClickMode');
    }
})
.add(/** @lends pvc.visual.legend.LegendGroupScene# */{

    // @see pvc.BaseChart#_maybeCreateLegendGroupScene

    // Implements pvc.visual.legend.symbolRenderer
    _rendererCreate: function(legendPanel, pvSymbolPanel, wrapper) {

        var colorAxis = this.colorAxis;
        if(!colorAxis) return;

        var dataPartDimName = colorAxis.chart._getDataPartDimName();
        var legendBaseIndex = this.legendBaseIndex;
        var anyRenderer = false;

        // Create a child panel of pvSymbolPanel for each data cell.
        colorAxis.dataCells.forEach(function(dataCell, index) {

            // Was a symbol renderer registered for the data cell?
            var renderer = dataCell.legendSymbolRenderer();
            if(renderer) {
                anyRenderer = true;

                var pvDataCellPanel = this._createDataCellPanel(dataCell, legendPanel, pvSymbolPanel, dataPartDimName);

                // Now let the data cell's symbol renderer add any custom marks.
                renderer(legendPanel, pvDataCellPanel, wrapper, def.indexedId('', legendBaseIndex + index));
            }
        }, this);

        // Currently, the default renderer is only used for axes where
        // none of the plot panels provides a renderer.
        if(!anyRenderer) {
            this._createDefaultRendererPanel(legendPanel, pvSymbolPanel, wrapper, legendBaseIndex);
        }
    },

    _createDataCellPanel: function(dataCell, legendPanel, pvSymbolPanel, dataPartDimName) {

        var pvDataCellPanel = new pvc.visual.Panel(legendPanel, pvSymbolPanel).pvMark;

        var colorRole = dataCell.role;
        var plot = dataCell.plot;
        var isBoundDimensionCompatibleList = null;

        // Is role bound to discriminator dimensions, such as "valueRole.dim"?
        if(colorRole.grouping.hasExtensionComplexTypes) {

            isBoundDimensionCompatibleList = colorRole.grouping.extensionDimensions()
                .select(function(dimSpec) {
                    var measureRole;
                    var measureRoleName = pvc.visual.Role.parseDataSetName(dimSpec.dataSetName);
                    if(measureRoleName !== null && (measureRole = plot.visualRole(measureRoleName)) !== null) {
                        // Chart-level scenes can contain measure discriminators even if a plot's role is only bound to a single dimension.
                        return measureRole.isBoundDimensionCompatible.bind(measureRole);
                    }
                })
                .where(def.notNully)
                .array();

            if(isBoundDimensionCompatibleList.length === 0) {
                isBoundDimensionCompatibleList = null;
            }
        }

        if(dataPartDimName !== null || isBoundDimensionCompatibleList !== null) {

            var dataPartValue = dataCell.dataPartValue;

            pvDataCellPanel.visible(function(itemScene) {

                var groupData = itemScene.group;

                // TODO: FIXME: Adding this check cause some disposed scenes are being
                // called, somehow, on hover, after showing/hiding one of the
                // item scenes in a plot2/data-part scenario.
                // Must find out the real cause for the leak!
                if(groupData._disposed) {
                    def.log.warn("[CCC] FIXME: Code running on disposed scene!");
                    return false;
                }

                // The data cell's data part value must be part of the group's scene.
                if(dataPartDimName !== null && groupData.dimensions(dataPartDimName).atom(dataPartValue) === null) {
                    return false;
                }

                // Example
                // -------
                // dataCell.role = plotColorRole
                //  plotColorRole.grouping.dimensions = "valueRole.dim"
                //
                // The value role of the same plot is:
                //  plotValueRole.grouping.dimensions = "quantity"
                //
                // However, groupData may have a discriminator dimension "valueRole.dim" = "sales".
                // Thus, this plot will not display this data item.
                //
                // If, the valueRole.dim is not set, then it is OK, cause,
                //  it may be set later, on a distinct plot level visual role.

                if(isBoundDimensionCompatibleList !== null) {
                    var i = -1;
                    var L = isBoundDimensionCompatibleList.length;
                    while(++i < L) {
                        if(!isBoundDimensionCompatibleList[i](groupData)) {
                            return false;
                        }
                    }
                }

                return true;
            });
        }

        return pvDataCellPanel;
    },

    _createDefaultRendererPanel: function(legendPanel, pvSymbolPanel, wrapper, legendBaseIndex) {

        var pvDefaultRendererPanel = new pvc.visual.Panel(legendPanel, pvSymbolPanel).pvMark;
        var colorAxis = this.colorAxis;
        var keyArgs = {
            drawLine:    colorAxis.option('LegendDrawLine'),
            drawMarker:  colorAxis.option('LegendDrawMarker'),
            markerShape: colorAxis.option('LegendShape')
        };
        var renderer = pvc.visual.legend.symbolRenderer(keyArgs);

        // The default renderer uses only the base legend index for extension.
        renderer(legendPanel, pvDefaultRendererPanel, wrapper, def.indexedId('', legendBaseIndex));
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
            if(impl !== undefined) ItemType.variable('value', impl);

            this._itemSceneType = ItemType;
        }

        return ItemType;
    },

    createItem: function(keyArgs) {
        var ItemType = this.itemSceneType();
        return new ItemType(this, keyArgs);
    }
});
