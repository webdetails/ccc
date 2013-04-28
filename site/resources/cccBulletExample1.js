new pvc.BulletChart({
    canvas:  'cccBulletExample1',
    width:   600,
    height:  400,
    animate: false,
    orientation: 'vertical',
    
    bulletSize:    25,
    bulletSpacing: 150,
    bulletMargin:  30,
    bulletTitlePosition: 'left',
    
    bulletTitle:    "Fixed Title",
    bulletSubtitle: "fixed sub-title",
    
    bulletMeasures: [50],
    bulletMarkers:  [90],
    bulletRanges:   [30, 80, 100],
    
    extensionPoints: {
        bulletMarker_shape:    'dot',
        bulletTitle_textStyle: 'green'
    }
})
.render();