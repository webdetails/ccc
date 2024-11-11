/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/
new pvc.LineChart({
    canvas: "cccExample",
    width:  700,
    height: 400,

    // Data source
    crosstabMode: false,

    // Main plot
    plot_call: function() {
        // Add a rule mark to the main plot's main panel.

        this.add(pv.Rule)
            // Don't add the rule if the scale is null (no data)
            .visible(function() {
                var orthoAxis = this.getContext().chart.axes.ortho;
                return !orthoAxis.scale.isNull;
            })
            .bottom(function() {
                var orthoAxis = this.getContext().chart.axes.ortho;

                // Domain before tick rounding
                var origDomain = orthoAxis.domain;
                var maxValue   = origDomain[1];

                return orthoAxis.scale(maxValue);
            })
            .height(null)
            .left(0)
            .right(0)
            .strokeDasharray('- ')
            .strokeStyle('red');
    },

    // Cartesian axes
    axisGrid: true,
    axisOffset: 0.1,

    // Panels
    legend: true
})
.setData(relational_04)
.render();
