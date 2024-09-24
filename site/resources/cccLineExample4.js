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
            dot_shapeSize:  7,
            line_lineWidth: 2
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
            layoutMode: 'overlapped',
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
    axisGrid_strokeStyle: '#F7F8F9',
    axisLabel_font: 'normal 9px "Open Sans"',

    // Color axes
    colors: [
        '#005CA7', '#FFC20F', '#333333'
    ],
    color2AxisTransform: function(c) { return c.brighter(0.5); },
    color2AxisLegendVisible: false,

    // Panels
    legend: true,
    legendFont: 'normal 11px "Open Sans"',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(relational_01c, {crosstabMode: false})
.render();
