new pvc.PieChart({
    canvas: 'cccPieExample2',
    width:  450,
    height: 350,

    // Data source
    crosstabMode: false,
    readers: 'region, brand, quantity, sales',

    // Data
    dimensions: {
        // Dimension bound to "dataPart" is hidden by default
        region: {isHidden: false},
        // Sort brands
        brand:  {comparer: def.ascending},
        // Notice the currency sign and the /1000 scale factor (the comma beside the dot).
        sales:  {valueType: Number, format: "¤#,0,.0K"}
    },

    // Visual Roles
    visualRoles: {
        // Chart
        dataPart: 'region',

        // Main pLot
        value:    'sales',
        category: 'brand'
    },

    // Plots
    plots: [
        {
            // Main plot (outer)
            name: 'main',
            dataPart: 'EMEA',
            valuesLabelStyle: 'inside',
            valuesOptimizeLegibility: true,
            valuesFont: 'normal 11px "Open Sans"',
            slice_innerRadiusEx: '60%',
            slice_strokeStyle:   'white'
        },
        {
            // Second plot (inner)
            name: 'inner',
            type: 'pie',
            dataPart: 'APAC',
            valuesLabelStyle: 'inside',
            valuesOptimizeLegibility: true,
            valuesFont: 'normal 11px "Open Sans"',
            slice_strokeStyle: 'white',
            slice_outerRadius: function() {
                return 0.5 * this.delegate(); // 50%
            }
        }
    ],

    // Panels
    title:     "EMEA (outside) vs APAC (inside) Automobile Sales",
    titleFont: 'lighter 20px "Open Sans"',

    legend: true,
    legendShape: 'circle',
    legendFont:  'lighter 14px "Open Sans"',
    legendPosition: 'right',
    legendAlign: 'middle',
    legendMarkerSize: 25,

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true,

    // Color axes
    colors: [
        '#333333', '#777777', '#FFC20F', '#FFE085',
        '#00325b', '#005CA7', '#0086F4', '#39A74A',
        '#63CA73'
    ]
})
.setData(relational_04b)
.render();
