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
    canvas: 'cccBarExample1',
    width:  600,
    height: 400,
    orientation: 'horizontal',

    // Data source
    crosstabMode: false,

    // Main plot
    valuesVisible: false,
    axisLabel_font: 'normal 10px "Open Sans"',

    bar_fillStyle: '#005CA7',
    // 'linear-gradient(90deg, green, blue)'
    // 'linear-gradient(to bottom left, red, yellow 20%, green, blue)'
    // 'radial-gradient(red, yellow 40%, red)'
    // 'linear-gradient(red, rgb(0,0,255))'

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(relational_03)
.render();