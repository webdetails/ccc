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
    _calcLayout: function(layoutInfo) {
        var clientSizeInfo = this.chart._plotsClientSizeInfo,
            clientSize;

        if(clientSizeInfo) {
           clientSize = layoutInfo.clientSize;
           var clientSizeFixed = clientSizeInfo.value,
               clientSizeMin   = clientSizeInfo.min,
               clientSizeMax   = clientSizeInfo.max;

            if(clientSizeFixed.width != null)
                clientSize.width  = clientSizeFixed.width;
            else
                clientSize.width  = Math.max(Math.min(clientSize.width,  clientSizeMax.width ), clientSizeMin.width );

            if(clientSizeFixed.height != null)
                clientSize.height = clientSizeFixed.height;
            else
                clientSize.height = Math.max(Math.min(clientSize.height, clientSizeMax.height), clientSizeMin.height);
        }

        var id = this.plot.id;

        //NEW603 C
         /* If the layout phase corresponds to a re-layouut (chart is a re-render)
            don't allow new requested Paddings to be calculated and insert the first render's
            requested Paddings - the offset should be taken into account here*/
        if(this.chart._preserveLayout) 
            layoutInfo.requestPaddings = this.chart.preservedPlotsLayoutInfo[id].reqPaddings;
        else 
            layoutInfo.requestPaddings = this._calcRequestPaddings(layoutInfo);
        
        return clientSize;
    },

    _calcRequestPaddings: function(layoutInfo) {
        var reqPads;
        var offPads = this.chart._axisOffsetPaddings;

        if(offPads) {
            var tickRoundPads = this.chart._getAxesRoundingPaddings();
            var clientSize = layoutInfo.clientSize;
            var pads       = layoutInfo.paddings;

            pvc_Sides.names.forEach(function(side) {
                var len_a = pvc.BasePanel.orthogonalLength[side],
                    clientLen  = clientSize[len_a],
                    paddingLen = pads[len_a],
                    len = clientLen + paddingLen;

                // Only request offset-padding if the tickRoundPads.side is not locked.
                if(!tickRoundPads[side + 'Locked']) {
                    // Offset paddings are a percentage of the outer length
                    // (there are no margins in this panel).
                    var offLen = len * (offPads[side] || 0),

                        // Rounding paddings are the percentage of the
                        // client length that already actually is padding
                        // due to domain rounding.
                        roundLen = clientLen * (tickRoundPads[side] || 0);

                    // So, if the user wants offLen padding but the
                    // client area already contains roundLen of padding,
                    // request only the remaining, if any.
                    (reqPads || (reqPads = {}))[side] = Math.max(offLen - roundLen, 0);
                }
            }, this);
        }

        return reqPads;
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
     * has a defined `FixedMin` or `FixedMax` option.
     *
     * @return {boolean} `true` to hide overflow, `false` otherwise.
     */
    _guessHideOverflow: function() {

        function axisHasFixedMinOrMax(axis) {
            return (!axis.isDiscrete()) &&  // 
                        (axis.option('FixedMin') != null    || 
                         axis.option('FixedMax') != null    ||
                         axis.option('FixedLength') != null ||
                         axis.option('Ratio') != null       || // Ratio eventually imposes fixed domain limits
                         axis.option('PreserveRatio') );
        }

        return axisHasFixedMinOrMax(this.axes.ortho) || axisHasFixedMinOrMax(this.axes.base);
    }
});
