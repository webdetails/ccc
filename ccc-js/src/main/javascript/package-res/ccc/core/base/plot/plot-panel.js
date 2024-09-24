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

    if(options.sizeMin == null) options.sizeMin = this._getOptionSizeMin(chart);

    // Respect if layout is fixed.
    // _axisOffsetPct is only defined for cartesian charts.
    if(options.paddings == null) options.paddings = chart._axisOffsetPct;

    this.base(chart, parent, options);

    this.plot = plot;
    this.dataPartValue = plot.dataPartValue;

    this._extensionPrefix = plot.extensionPrefixes;
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
    visibleData: function(ka) {
        return this.chart.visiblePlotData(this.plot, ka);
    },

    partData: function() {
        return this.chart.partData(this.dataPartValue);
    },

    _getExtensionId: function() {
        // NOTE: 'chart' is deprecated. Use 'plot'.
        return ['chart', 'plot'];
    },

    _getOptionSizeMin: function(chart) {
        var plotSizeMin = !chart.parent ? chart.options.plotSizeMin : null;
        return plotSizeMin != null ? pvc_Size.to(plotSizeMin) : null;
    },

    /**
     * Obtains the visual roles owned by the panel, in definition order,
     * that are played by a main dimension, given its name.
     *
     * Optionally, returns the chart-level visual roles as well.
     *
     * Do NOT modify the returned array.
     *
     * @param {string} mainDimName The name of the main dimension.
     * @param {boolean} [includeChart=false] Indicates whether chart visual roles should be included as well.
     *
     * @return {pvc.visual.Role[]} The array of visual roles or <tt>null</tt>, if none.
     *
     * @see pvc.BaseChart#visualRolesOf
     *
     * @virtual
     */
    visualRolesOf: function(mainDimName, includeChart) {

        var plotVisRoles  = def.getOwn(this._visualRolesByDim, mainDimName, null),
            chartVisRoles = includeChart ? this.chart.visualRolesOf(mainDimName) : null;

        return plotVisRoles && chartVisRoles ? plotVisRoles.concat(chartVisRoles) : (plotVisRoles || chartVisRoles);
    },

    get _visualRolesByDim() {
        var visualRolesByDim = this.__visRolesByDim;
        if(!visualRolesByDim) {
            visualRolesByDim = this.__visRolesByDim = {};

            this.visualRoleList.forEach(function(role) {
                var grouping = role.grouping;
                if(grouping) grouping.dimensionNames().forEach(function(dimName) {
                    def.array.lazy(visualRolesByDim, dimName).push(role);
                });
            });
        }

        return visualRolesByDim;
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
.type()
.add({
    registerClass: function(Class, typeName) {
        pvc_plotPanelClassByType[typeName || Class.prototype.plotType] = Class;
    },

    getClass: function(typeName) {
        return def.getOwn(pvc_plotPanelClassByType, typeName);
    }
});
