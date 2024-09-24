/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def
.type('pvc.CategoricalAbstractPanel', pvc.CartesianAbstractPanel)
.init(function(chart, parent, plot, options) {

    this.base(chart, parent, plot, options);

    this.stacked = plot.option('Stacked');
})
.add({
    /**
     * Builds the panel's scene tree based on the data to display.
     *
     * @param {pvc.data.Data} data - The visible data.
     * @param {Array.<pvc.data.Data>} axisSeriesDatas - The visible axis series datas.
     * @param {Array.<pvc.data.Data>} axisCategDatas - The visible axis categories datas.
     * @return {pvc.visual.Scene} The root scene.
     * @abstract
     */
    _buildScene: function(data, axisSeriesDatas, axisCategDatas) {

        this.chart._onWillCreatePlotPanelScene(this, data, axisSeriesDatas, axisCategDatas);

        return this._buildSceneCore(data, axisSeriesDatas, axisCategDatas);
    }
});
