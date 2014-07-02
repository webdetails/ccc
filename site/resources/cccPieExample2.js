new pvc.PieChart({
    canvas: 'cccPieExample2',
    width:  450,
    height: 350,

    // Data source
    crosstabMode: false,
    readers: ['region, brand, quantity, sales'],

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
            slice_strokeStyle: 'white',
            slice_outerRadius: function() {
                return 0.5 * this.delegate(); // 50%
            }
        }
    ],

    // Panels
    title:     "EMEA (outside) vs APAC (inside) Automobile Sales",
    titleFont: 'bold 16px sans-serif',

    legend: true,
    legendShape: 'circle',
    legendFont:  '14px sans-serif',
    legendPosition: 'right',
    legendAlign: 'middle',
    legendMarkerSize: 25,

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(relational_04b)
.render();