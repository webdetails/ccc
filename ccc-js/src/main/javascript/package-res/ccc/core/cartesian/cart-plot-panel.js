/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_Sides:true */

def
.type('pvc.CartesianAbstractPanel', pvc.PlotPanel)
.init(function(chart, parent, plot, options) {

    // Prevent the border from affecting the box model,
    // providing a static 0 value, independently of the actual drawn value...
    //this.borderWidth = 0;

    this.base(chart, parent, plot, options);

    var axes = this.axes;

    function addAxis(axis) {
        axes[axis.type] = axis;

        // TODO: are these really needed??
        axes[axis.orientedId] = axis;
        if(axis.v1SecondOrientedId) axes[axis.v1SecondOrientedId] = axis;
    }

    addAxis(chart._getAxis('base',  plot.option('BaseAxis' ) - 1));
    addAxis(chart._getAxis('ortho', plot.option('OrthoAxis') - 1));
})
.add({
    _getOptionSizeMin: function(chart) {
        // SizeMin is the FillSizeMin of the CartesianGridDockingPanel and is managed by it.
        return null;
    },

    _calcLayout: function(layoutInfo) {
        var chart = this.chart,
            clientSizeInfo = chart._plotsClientSizeInfo,
            clientSize;

        if(clientSizeInfo) {
           clientSize = layoutInfo.clientSize;
           var clientSizeFix = clientSizeInfo.value,
               clientSizeMin = clientSizeInfo.min,
               clientSizeMax = clientSizeInfo.max;

            if(clientSizeFix.width != null)
                clientSize.width  = clientSizeFix.width;
            else
                clientSize.width  = Math.max(Math.min(clientSize.width,  clientSizeMax.width ), clientSizeMin.width );

            if(clientSizeFix.height != null)
                clientSize.height = clientSizeFix.height;
            else
                clientSize.height = Math.max(Math.min(clientSize.height, clientSizeMax.height), clientSizeMin.height);
        }

        // Speed up by not calculating request paddings on preserve layout.
        if(!chart._preserveLayout)
            layoutInfo.contentOverflow = this._calcContentOverflow(layoutInfo);

        return clientSize;
    },

    _calcContentOverflow: function(li) {
        var contentOverflow;

        var offsetPads = this.chart._axisOffsetPaddings;
        if(offsetPads) {
            var tickRoundPads = this.chart._getAxesRoundingOverflow();

            pvc_Sides.names.forEach(function(side) {
                // Only request offset-padding if the tickRoundPads.side is not locked.
                if(!tickRoundPads[side + 'Locked']) {
                    // Offset paddings are a percentage of the outer length
                    // (there are no margins in this panel).
                    var len_a = pvc.BasePanel.orthogonalLength[side];
                    var offLen = li.size[len_a] * (offsetPads[side] || 0);

                    // Rounding paddings are the number of pixels of client length
                    // that already are "padding", due to domain rounding.
                    var roundLen = tickRoundPads[side] || 0;

                    // So, if the user wants offLen padding but the
                    // client area already contains roundLen of padding,
                    // request only the remaining, if any.
                    (contentOverflow || (contentOverflow = {}))[side] = Math.max(offLen - roundLen, 0);
                }
            }, this);
        }

        return contentOverflow;
    },

    /** @override */
    _createCore: function() {
        // Send the panel behind the axis, title and legend, panels.
        this.pvPanel.zOrder(-10);

        var contentOverflow = this.chart.options.leafContentOverflow || 'auto',
            hideOverflow = (contentOverflow === 'auto')
                ? this._guessHideOverflow()
                : (contentOverflow === 'hidden');

        // Padding area is used by bubbles and other vizs without problem.
        if(hideOverflow) this.pvPanel.borderPanel.overflow('hidden');
    },

    /**
     * Determines if panel overflow should be hidden.
     *
     * The default implementation returns true if any of this plot's cartesian axes
     * has defined `FixedMin`, `FixedMax`, `FixedLength`, `Ratio` options or
     * a true `PreserveRatio` option.
     *
     * @return {boolean} `true` to hide overflow, `false` otherwise.
     */
    _guessHideOverflow: function() {
        return cartPlotPanel_axisMayOverflow(this.axes.ortho) ||
               cartPlotPanel_axisMayOverflow(this.axes.base);
    }
});

function cartPlotPanel_axisMayOverflow(axis) {
    return !axis.isDiscrete() &&
           (axis.option('FixedMin')    != null ||
            axis.option('FixedMax')    != null ||
            axis.option('FixedLength') != null ||
            axis.option('Ratio')       != null ||
            axis.option('PreserveRatio'));
}
