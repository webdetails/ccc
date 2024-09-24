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
new pvc.BoxplotChart({
    canvas:  "cccBoxExample4",
    width:   600,
    height:  400,

    // Visual roles
    //  Point color role to category role,
    //  instead of the default, series,
    //  just because we can...
    colorRole: {from: 'category'},

    // Main plot
    layoutMode: 'overlapped',
    boxRuleWhisker_strokeDasharray: '- ',

    // Second plot
    //  shows the median line
    plot2: true,
    plot2LinesVisible: true,
    plot2DotsVisible:  true,
    plot2AreasVisible: true,

    // Cartesian axes
    //baseAxisVisible: false, // Hide base axis!
    axisOffset: 0.03,
    axisLabel_font: 'normal 10px "Open Sans"',

    // Color axes
    //  But hide its legend cause it's identical to
    //  that of the color1Axis...
    color2AxisLegendVisible: false,

    // Panels
    title: "All-in-one Boxplot",
    titleFont: 'lighter 20px "Open Sans"',

    // Show legend (have fun showing/hiding boxes!)
    legend: true,
    legendPosition: 'right',
    legendFont: 'normal 11px "Open Sans"',

    // Chart/Interaction
    selectable: true,
    hoverable:  true,

    // Color axes
    colors: [
        '#333333', '#777777', '#FFC20F', '#FFE085',
        '#005CA7', '#0086F4', '#39A74A', '#63CA73'
    ]
})
.setData(relational_01c)
.render();