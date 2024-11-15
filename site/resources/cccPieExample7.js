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
new pvc.PieChart({
    canvas: 'cccPieExample7',
    width:  600,
    height: 400,

    // Data source
    readers: ["region", "brand", "quantity", "sales"],
    crosstabMode: false,

    // Chart-level visual roles
    visualRoles: {
        multiChart: "region, valueRole.dim"
    },

    // Plots
    plots: [
        // Main plot - pie
        {
            name: 'main',
            visualRoles: {
                category: "brand",
                value: "sales, quantity"
            }
        }
    ],

    // Chart/Layout
    multiChartColumnsMax: 2,

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true,

    // Color axes
    colors: [
        '#333333', '#777777', '#FFC20F', '#FFE085',
        '#005CA7', '#0086F4', '#39A74A', '#63CA73'
    ]
})
.setData(relational_04b)
.render();
