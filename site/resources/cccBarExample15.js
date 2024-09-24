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
    height: 350,

    // Data Source
    readers: ["city", "date", "costs", "sales"],
    crosstabMode: false,

    // Chart-level visual roles
    visualRoles: {
        multiChart: "valueRole.dim"
    },

    // Plots
    plots: [
        // Main plot - bars
        {
            name: "main",
            stacked: true,
            visualRoles: {
                series: "city",
                category: "date",
                value: "sales"
            }
        },

        // Second plot - lines
        {
            type: "point",
            stacked: true,
            visualRoles: {
                value: "costs"
            }
        }
    ],

    // Cartesian Axes
    orthoAxisDomainScope: "cell",

    // Color axes
    colors: [
        '#005CA7', '#FFC20F', '#333333'
    ],

    // Panels
    legend: true,
    legendPosition: "right",
    legendFont: 'normal 11px "Open Sans"',

    // Chart/General
    multiChartColumnsMax: 1,

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(relational_01_2measures_costs_sales_pos)
.render();
