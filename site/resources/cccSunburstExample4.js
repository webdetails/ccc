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
new pvc.SunburstChart({
    canvas: 'cccSunburstExample4',
    width:  600,
    height: 400,

    // Data source
    crosstabMode: false,
    multiChartIndexes: 0,

    // Main plot
    valuesFont: 'lighter 11px "Open Sans"',

    // Color axes
    colors: [
        '#005CA7', '#0086F4', '#FFC20F', '#FFE085',
        '#39A74A', '#63CA73', '#333333', '#777777'
    ],

    // Chart/Interaction
    selectable: true,
    hoverable:  true
})
.setData(buildDataset(flare))
.render();
