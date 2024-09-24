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
    canvas: 'cccBarExample6',
    width:  600,
    height: 400,
    orientation: 'horizontal',

    // Data source
    crosstabMode: false,

    // Main plot
    stacked: true,
    valuesVisible: true,
    valuesMask: '{series}',
    valuesFont: 'normal 11px "Open Sans"',
    valuesOverflow: 'trim',
    valuesOptimizeLegibility: true,

    // Cartesian axes
    axisLabel_font: 'normal 10px "Open Sans"',
    orthoAxisLabelSpacingMin: 6,

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true,
    tooltipClassName: 'light',
    tooltipOpacity: 1,

    // Color axes
    colors: [
        '#005CA7', '#FFC20F', '#333333'
    ]
})
.setData(relational_01)
.render();