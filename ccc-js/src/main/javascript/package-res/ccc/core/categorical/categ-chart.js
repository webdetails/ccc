/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * CategoricalAbstract is the base class for all categorical or timeseries
 */
def
.type('pvc.CategoricalAbstract', pvc.CartesianAbstract)
.add({
    /**
     * Called when the scene tree of a descendant categorical plot panel is to be created with the given data.
     *
     * @param {pvc.pvc.CategoricalAbstractPanel} plotPanel - The categorical plot panel.
     * @param {pvc.data.Data} data - The visible data.
     * @param {Array.<pvc.data.Data>} axisSeriesDatas - The visible axis series datas.
     * @param {Array.<pvc.data.Data>} axisCategDatas - The visible axis categories datas.
     * @abstract
     */
    _onWillCreatePlotPanelScene: function(plotPanel, data, axisSeriesDatas, axisCategDatas) {
    }
});
