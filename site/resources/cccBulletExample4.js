new pvc.BulletChart({
    canvas:  'cccBulletExample4',
    width:   600,
    height:  250,
    orientation: 'horizontal',

    // Main plot
    bulletSize:    25,
    bulletSpacing: 50,
    bulletMargin:  100,
    bulletTitle_textStyle: '#333333',
    bulletTitle_font: 'normal 15px "Open Sans"',
    bulletMeasure_fillStyle: '#005CA7',
    bulletRuleLabel_font: 'normal 10px "Open Sans"',
    
    bulletSubtitle: "Fixed Sub-title",
    bulletSubtitle_font: 'normal 10px "Open Sans"',
    bulletRanges:   [200, 500, 1000]
})
.setData(bullet_NameValueMarker)
.render();