/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 - 2026 by Pentaho Canada Inc. : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2030-06-15
 ******************************************************************************/

new pvc.MetricLineChart({
    canvas: 'cccMetricDotExample1',
    width:  600,
    height: 350,

    // Panels
    legend: false,

    // Main plot
    dotsVisible: true,

    // Cartesian axes
    axisGrid: true,
    axisOriginIsZero: true,
    axisGrid_strokeStyle: '#F7F8F9',
    axisLabel_font: 'normal 8px "Open Sans"',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true,

    // Color axes
    colors: ['#005CA7']
})
.setData(testLDot)
.render();