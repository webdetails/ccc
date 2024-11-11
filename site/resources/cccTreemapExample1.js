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
new pvc.TreemapChart({
    canvas:     'cccTreemapExample1',
    width:      600,
    height:     400,

    // Data source
    crosstabMode: false,

    // Main plot
    rootCategoryLabel: "World",
    valuesFont: 'lighter 11px "Open Sans"',

    // Panels
    title:     "Single-Level",
    titleFont: 'lighter 20px "Open Sans"',

    legend: true,
    legendFont: 'normal 11px "Open Sans"',

    // Chart/Interaction
    selectable: true,
    hoverable:  true,

    // Color axes
    colors: ['#005CA7']
})
.setData(testTreemapSingleLevel)
.render();