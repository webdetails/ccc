new pvc.BarChart({
    canvas: "cccBarExample9",
    width:  600,
    height: 400,

    // Data source
    crosstabMode: false,

    //  map virtual item columns -> dimensions
    readers: ['city, period, count, avgLatency'],

    // Data
    dimensions: {
        count:      {format: "#,0"  },
        avgLatency: {format: "#,0.0"}
    },

    // Plots
    plots: [
        {
            name: 'main',
            visualRoles: {
                value:    'count',
                series:   'city',
                category: 'period'
            }
        },
        {
            type: 'point',
            linesVisible: true,
            dotsVisible:  true,
            orthoAxis: 2,
            colorAxis: 2,
            nullInterpolationMode: 'linear',
            visualRoles: {
                value: 'avgLatency',
                color: {legend: {visible: false}}
            }
        }
    ],

    // Cartesian axes
    axisGrid_strokeStyle: 'lightgray',

    baseAxisTooltipAutoContent: 'summary',
    panelSizeRatio: 0.6,

    orthoAxisTitle:  "Count",
    orthoAxisOffset: 0.02,
    orthoAxisGrid:   true,

    ortho2AxisTitle: "Avg. Latency",

    // Color axes
    color2AxisTransform: function(c) { return c.brighter(0.7); },

    // Panels
    legend: true,

    // Chart/Interaction
    animate:    true,
    selectable: true,
    hoverable:  true,
    tooltipClassName: 'light',
    tooltipOpacity: 1
})
.setData(testMeasureDiscrim)
.render();