/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/
new pvc.BarChart({
    canvas: 'cccBarExample9',
    width:  600,
    height: 400,

    // Data source
    crosstabMode: false,

    // Main plot
    stacked: true,

    // Second plot
    plot2: true,
    plot2Series: ['Paris'],
    plot2OrthoAxis: 2,
    plot2NullInterpolationMode: 'linear',
    plot2Line_lineWidth: 2,
    plot2Dot_shapeSize:  7,

    // Trend plot
    trendType: 'moving-average',
    trendAreasVisible: true,
    trendColorAxis: 3,
    trendLine_interpolate: 'cardinal',
    trendArea_interpolate: 'cardinal',

    // Cartesian axes
    axisGrid: true,
    axisGrid_strokeStyle: '#F7F8F9',
    axisLabel_font: 'normal 9px "Open Sans"',
    orthoAxisOffset: 0.1,
    continuousAxisTicks_strokeStyle: '#999999',

    // Color axes
    colors: ['#005CA7', '#333333'],
    color2AxisColors: ['#FFC20F'],
    color3AxisTransform: function(c) { return c.darker(); },

    // Panels
    title: "All-in-one Bar Chart",
    titleFont: 'lighter 20px "Open Sans"',

    legend: true,
    legendFont: 'normal 11px "Open Sans"',

    // Chart/Interaction
    animate:    true,
    selectable: true,
    hoverable:  true
})
.setData(relational_01_neg)
.render();