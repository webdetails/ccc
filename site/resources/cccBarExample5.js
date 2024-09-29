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
    canvas: 'cccBarExample5',
    width:  600,
    height: 400,

    // Data source
    crosstabMode: false,

    // Main plot
    stacked: true,
    valuesVisible: false,

    // Cartesian axes
    axisGrid: true,
    axisGrid_strokeStyle: '#F7F8F9',
    axisLabel_font: 'normal 10px "Open Sans"',
    orthoAxisLabelSpacingMin: 2.5,

    // Panels
    title:     "Negative Values Stacked Bar Chart",
    titleFont: 'lighter 20px "Open Sans"',
    titleSize:     {width: '70%', height: '30%'},
    titleMargins:  10,
    titlePaddings: {all: '15%', top: 10, bottom: 10},

    legend: true,
    legendFont: 'normal 11px "Open Sans"',

    // Chart/Interaction
    animate:    true,
    selectable: true,
    hoverable:  true,

    // Color axes
    colors: [
        '#005CA7', '#FFC20F', '#333333'
    ]
})
.setData(relational_01_neg)
.render();