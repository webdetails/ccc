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
new pvc.DotChart({
    canvas: 'cccDotExample1',
    width:  600,
    height: 400,
    orientation: 'horizontal',

    // Data source
    crosstabMode: false,

    // Main plot
    valuesVisible: true,
    valuesFont: 'lighter 10px "Open Sans"',
    axisLabel_font: 'normal 9px "Open Sans"',

    // Panels
    title:  "Simple Dot Chart",
    titleFont: 'lighter 20px "Open Sans"',
    titlePosition: 'bottom',
    titleMargins: '10 0',

    // Chart/Interaction
    animate:    false,
    selectable: true,

    // Color axes
    colors: ['#005CA7']
})
.setData(relational_03)
.render();