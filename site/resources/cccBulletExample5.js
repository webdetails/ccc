new pvc.BulletChart({
    canvas:  'cccBulletExample5',
    width:   600,
    height:  400,
    orientation: 'vertical',

    // Main plot
    bulletSize:    25,
    bulletSpacing: 80,
    bulletMargin:  30,
    bulletTitlePosition: 'left',
    bulletTitle_textStyle: '#333333',
    bulletTitle_font: 'normal 15px "Open Sans"',
    bulletMeasure_fillStyle: '#005CA7',
    bulletRuleLabel_font: 'normal 10px "Open Sans"',
    bulletSubtitle_font: 'normal 10px "Open Sans"'
})
.setData(bullet_NameDescValueMarkerRanges)
.render();