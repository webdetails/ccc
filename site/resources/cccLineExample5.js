
new pvc.LineChart({
    canvas: "cccLineExample5",
    width:  600,
    height: 500,

    // Data Source
    crosstabMode: false,
    readers: ["date", "sales", "p25s", "p75s", "p5s", "p95s"],

    // Data
    dimensions: {
        // Activate timeSeries
        date: {valueType: Date}
    },

    // Plots
    plots: [
        // Main plot - line
        {
            name: "main",
            visualRoles: {
                category: "date",
                series: "valueRole.dim",
                value: "sales"
            },
            line_lineWidth: 3
        },
        // Second plot - line
        {
            type: "point",
            visualRoles: {
                value: "p25s, p75s"
            }
        },
        // Third plot - line
        {
            type: "point",
            visualRoles: {
                value: "p5s, p95s"
            },
            line_strokeDasharray: "dash"
        }
    ],

    // Cartesian axes
    baseAxisGrid: true,
    axisGrid_strokeStyle: '#F7F8F9',
    axisLabel_font: 'normal 9px "Open Sans"',

    // Color axes
    colors: [
        '#333333', '#777777', '#FFC20F', '#FFE085',
        '#005CA7', '#0086F4', '#39A74A', '#63CA73'
    ],

    // Panels
    legend: true,
    legendPosition: 'right',
    legendFont: 'normal 11px "Open Sans"',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(relational_01d)
.render();
