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
    canvas: 'pvcTreemap4',
    width:  600,
    height: 700,

    // Data source
    crosstabMode: false,

    // Visual roles
    colorRole: "multiChart, category, category2, category3",
    multiChartIndexes: 0,

    // Main plot
    rootCategoryLabel: "flare",
    valuesOverflow: 'hide',
    valuesFont: 'normal 11px "Open Sans"',

    // Panels
    title: "Flare Library Modules",
    titleFont: 'lighter 20px "Open Sans"',
    smallTitleFont: 'lighter italic 14px "Open Sans"',
    smallTitleMargins: '10 0 0 0',

    legend: false,

    // Chart/Interaction
    selectable: true,
    hoverable:  true,

    // Color axes   
    colors: [
        '#005CA7', '#0086F4', '#FFC20F', '#FFE085',
        '#39A74A', '#63CA73', '#333333', '#777777' 
    ]
})
.setData(buildDataset(flare))
.render();