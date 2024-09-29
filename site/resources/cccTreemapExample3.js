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
new pvc.TreemapChart({
    canvas: 'cccTreemapExample3',
    width:  600,
    height: 400,

    // Data source
    crosstabMode: false,

    // Main plot
    rootCategoryLabel: "Earth",
    layoutMode: 'slice-and-dice',
    colorMode:  'bySelf',
    valuesFont: 'lighter 11px "Open Sans"',

    // Panels
    title:     "Slice-and-dice Layout And Self-Colored",
    titleFont: 'lighter 20px "Open Sans"',

    // Chart/Interaction
    selectable: true,
    hoverable:  true,

    // Color axes   
    colors: [
        '#005CA7', '#0086F4', '#FFC20F', '#FFE085',
        '#39A74A', '#63CA73', '#333333', '#777777' 
    ]
})
.setData(testTreemapThreeLevel)
.render();