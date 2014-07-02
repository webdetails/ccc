new pvc.BulletChart({
    canvas:  'cccBulletExample1',
    width:   600,
    height:  400,
    orientation: 'vertical',

    // Main plot
    bulletSize:    25,
    bulletSpacing: 150,
    bulletMargin:  30,

    bulletTitle:    "Fixed Title",
    bulletTitlePosition: 'left',
    bulletTitle_textStyle: 'green',

    bulletSubtitle: "fixed sub-title",

    bulletMeasures: [50],

    bulletMarkers:  [90],
    bulletMarker_shape: 'circle',

    bulletRanges:   [30, 80, 100]
})
.render();