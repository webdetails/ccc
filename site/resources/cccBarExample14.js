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
new pvc.BarChart({
    canvas: "cccBarExample14",
    width:  600,
    height: 500,

    // Data Source
    readers: ["region", "brand", "otherGains", "sales"],
    crosstabMode: false,

    // Plots
    plots: [
        // Main plot - bars
        {
            name: 'main',
            stacked: true,
            visualRoles: {
                category: "brand",
                series: "valueRole.dim",
                value: "sales, otherGains"
            }
        }
    ],

    // Color axes
    colors: [
        '#005CA7', '#FFC20F', '#333333'
    ],

    // Panels
    legend: true,
    legendFont: 'normal 11px "Open Sans"',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(relational_04d)
.render();
