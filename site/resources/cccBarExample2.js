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
    canvas: 'cccBarExample2',
    width:  600,
    height: 400,
    orientation: 'horizontal',

    // Cartesian axes
    axisGrid: true,
    axisGrid_strokeStyle: '#F7F8F9',
    axisLabel_font: 'normal 10px "Open Sans"',

    // Panels
    title:         "Rich Bar chart",
    titlePosition: 'left',
    titleSize:     {height: '100%'},
    titleMargins:  10,
    titleFont: 'lighter 20px "Open Sans"',

    legend: true,
    legendPosition: 'right',
    legendFont: 'normal 11px "Open Sans"',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true,

    // Color axes
    colors: [
        '#005CA7', '#FFC20F', '#333333'
    ]
})
.setData(relational_01, {crosstabMode: false})
.render();