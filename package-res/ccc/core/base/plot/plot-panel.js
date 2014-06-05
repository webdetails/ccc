/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/** 
 * Registry of plot panel classes by type.
 * @type Object.<string, function>
 */
var pvc_plotPanelClassByType = {};

def
.type('pvc.PlotPanel', pvc.BasePanel)
.init(function(chart, parent, plot, options) {
    // Prevent the border from affecting the box model,
    // providing a static 0 value, independently of the actual drawn value...
    //this.borderWidth = 0;
    
    this.base(chart, parent, options);
    
    this.plot = plot;
    this._extensionPrefix = plot.extensionPrefixes;
    this.dataPartValue  = plot.option('DataPart');
    this.axes.color     = chart._getAxis('color', (plot.option('ColorAxis') || 0) - 1);
    this.orientation    = plot.option('Orientation'  );
    this.valuesVisible  = plot.option('ValuesVisible');
    this.valuesAnchor   = plot.option('ValuesAnchor' );
    this.valuesMask     = plot.option('ValuesMask'   );
    this.valuesFont     = plot.option('ValuesFont'   );
    this.valuesOverflow = plot.option('ValuesOverflow');
    this.valuesOptimizeLegibility = plot.option('ValuesOptimizeLegibility');
    
    this.visualRoles = plot.visualRoles;
    this.visualRoleList = plot.visualRoleList;
})
.add({
    anchor:  'fill',

    visualRoles: null,

    /** @override */
    visibleData: function(ka) { return this.chart.visiblePlotData(this.plot, this.dataPartValue, ka); },

    _getExtensionId: function() {
        // NOTE: 'chart' is deprecated. Use 'plot'.
        return ['chart', 'plot'];
    },
    
    // For setting the renderer of a group scene.
    defaultLegendGroupScene: function() {
        var colorAxis = this.axes.color;
        if(colorAxis && colorAxis.option('LegendVisible') && colorAxis.isBound()) {
            return def
                .query(colorAxis.dataCells)
                .where (function(dataCell) { return dataCell.plot === this.plot; }, this)
                .select(function(dataCell) { return dataCell.legendGroupScene(); })
                .first(def.notNully);
        }
    },

    /**
     * Obtains the visual roles owned by the panel that are played by a given dimension name,
     * in definition order.
     * Optionally, returns the chart-level visual roles as well.
     *
     * Do NOT modify the returned array.
     *
     * @param {string} dimName The name of the dimension.
     * @param {boolean} [includeChart=false] Indicates wether chart visual roles should be included as well.
     * @return {pvc.visual.Role[]} The array of visual roles or <tt>null</tt>, if none.
     * @see pvc.BaseChart#visualRolesOf
     * @virtual
     */
    visualRolesOf: function(dimName, includeChart) {
        var visualRolesByDim = this._visRolesByDim;
        if(!visualRolesByDim) {
            visualRolesByDim = this._visRolesByDim = {};
            this.visualRoleList.forEach(function(r) {
                var g = r.grouping;
                if(g) g.dimensionNames().forEach(function(n) {
                    def.array.lazy(visualRolesByDim, n).push(r);
                });
            });
        }

        var plotVisRoles  = def.getOwn(visualRolesByDim, dimName, null),
            chartVisRoles = includeChart ? this.chart.visualRolesOf(dimName) : null;

        return plotVisRoles && chartVisRoles ? plotVisRoles.concat(chartVisRoles) : (plotVisRoles || chartVisRoles);
    },

    /** @override */
    _getTooltipPanelClasses: function() {
        return ['plot', 'plot-' + this.plot.type];
    },

    /* @override */
    isOrientationVertical: function() {
        return this.orientation === pvc.orientation.vertical;
    },

    /* @override */
    isOrientationHorizontal: function() {
        return this.orientation === pvc.orientation.horizontal;
    }
})
.addStatic({
    registerClass: function(Class, type) {
        pvc_plotPanelClassByType[type || Class.prototype.plotType] = Class;
    },

    getClass: function(type) {
        return def.getOwn(pvc_plotPanelClassByType, type);
    }
});