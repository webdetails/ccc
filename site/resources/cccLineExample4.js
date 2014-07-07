var boxStrokeColor = pvc.finished(function(s) {
    return this.sign.scaleColor(s);
});

new pvc.LineChart({
    canvas: "cccLineExample4",
    width:  600,
    height: 500,

    // Plots
    plots: [
        // Main plot - bars
        {
            name: 'main',
            dotsVisible: true,
            line_lineWidth: 2.5
        },
        // Second plot - boxes
        {
            type: 'box',
            visualRoles: {
                // Comment the ones you don't want represented
                median:       'value',
                lowerQuartil: 'value2',
                upperQuartil: 'value3',
                minimum:      'value4',
                maximum:      'value5'
            },

            // Overlap boxes having the same category
            layout: 'overlapped',
            boxSizeMax: 9,

            // Styling boxes
            colorAxis: 2,

            boxBar_fillStyle:           'rgba(250,250,250,0.01)',
            boxBar_strokeStyle:         boxStrokeColor,
            boxRuleMax_strokeStyle:     boxStrokeColor,
            boxRuleMedian_strokeStyle:  boxStrokeColor,
            boxRuleMedian_lineWidth:    3,
            boxRuleMin_strokeStyle:     boxStrokeColor,
            boxRuleWhisker_strokeStyle: boxStrokeColor,
            boxRuleWhisker_strokeDasharray: '- '
        }
    ],

    // Cartesian axes
    baseAxisGrid: true,

    // Color axes
    color2AxisTransform: function(c) { return c.brighter(1); },
    color2AxisLegendVisible: false,

    // Panels
    legend: true,

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
    .setData(relational_01c, {crosstabMode: false})
    .render();
