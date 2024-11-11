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
    canvas: 'cccSunburstExample3',
    width:  600,
    height: 400,

    // Data source
    crosstabMode: false,

    // Main plot
    valuesFont: 'lighter 11px "Open Sans"',

    // Color axes
    colors: [
        '#005CA7', '#39A74A', '#FFC20F', '#777777'
    ],

    // Chart/Interaction
    selectable: true,
    hoverable:  true
})
.setData(testSunburstSingleLevel)
.render();
