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
new pvc.SunburstChart({
    canvas: 'cccSunburstExample2',
    width:  600,
    height: 400,

    // Data source
    crosstabMode: false,

    // Visual roles
    sizeRole: null,

    // Main plot
    valuesFont: 'lighter 11px "Open Sans"',
    emptySlicesVisible: true,
    emptySlicesLabel: "NA",

    // Color axes
    colors: [
        '#005CA7', '#39A74A', '#FFC20F', '#777777'
    ],

    // Chart/Interaction
    selectable: true,
    hoverable:  true
})
.setData(testSunburstThreeLevel)
.render();
