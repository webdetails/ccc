new pvc.SunburstChart({
    canvas: 'cccSunburstExample2',
    width:  600,
    height: 400,

    // Data source
    crosstabMode: false,

    // Visual roles
    sizeRole: null,

    // Main plot
    valuesFont: 'lighter 11px "Open Sans"',
    emptySlicesVisible: true,
    emptySlicesLabel: "NA",

    // Color axes
    colors: [
        '#005CA7', '#39A74A', '#FFC20F', '#777777'
    ],

    // Chart/Interaction
    selectable: true,
    hoverable:  true
})
.setData(testSunburstThreeLevel)
.render();
