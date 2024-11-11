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
new pvc.BarChart({
    canvas: "cccExample",
    width:  600,
    height: 400,

    // Uncomment Me
    //orientation: 'horizontal',

    // Data Source
    crosstabMode: false,

    // Main plot
    barSizeMax: 20,

    // Second plot
    plot2: true,
    plot2Series: ['Paris', 'London'],
    plot2DotsVisible:  true,
    plot2LinesVisible: false,
    plot2Dot_shape: 'bar',
    plot2Dot_shapeSize: function() {
        // Need to provide a default for when bar series are hidden
        var diameter = this.chart.plotPanels.bar.barWidth ||
                       this.chart.options.barSizeMax;

        // "finished(.)" prevents the size of
        // the target lines from increasing, when hovered.
        return this.finished(diameter);
    },
    plot2Dot_shapeAngle: function() {
        return this.chart.isOrientationHorizontal() ? 0 : Math.PI/2;
    },

    // Cartesian axes
    orthoAxisOffset: 0.01,

    // Panels
    legend: true,
    // Not being inherited from plot2Dot?
    legend2Dot_shapeAngle: function() {
        return this.chart.isOrientationHorizontal() ? 0 : Math.PI/2;
    },

    // Chart/Interaction
    animate:    true,
    selectable: true,
    hoverable:  true
})
.setData(relational_01)
.render();
