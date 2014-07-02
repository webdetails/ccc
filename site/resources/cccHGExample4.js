new pvc.HeatGridChart({
    canvas: 'cccHGExample4',
    width:    600,
    height:   400,

    // Main plot
    valuesVisible: false,

    // Color axes
    colorMin: '#FEDFE1',
    colorMax: '#F11929',

    // Panels
    title: "Interactive Heat-grid",

    // Chart/Interaction
    selectable:  true,
    hoverable:   true,

    clickable:   true,
    clickAction: function(scene){
        alert('series = "'   + scene.getSeries() +
            '", category = ' + scene.getCategory() +
            '", color = '    + scene.getColor());
    },

    plotFrameVisible: true,
    plotFrame_strokeStyle: 'black'
})
.setData(testHeatGrid)
.render();