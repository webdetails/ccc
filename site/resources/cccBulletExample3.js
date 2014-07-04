new pvc.BulletChart({
    canvas:  'cccBulletExample3',
    width:   600,
    height:  250,
    orientation: 'horizontal',

    // Main plot
    bulletSize:    25,
    bulletSpacing: 60,
    bulletMargin:  100,
    bulletTitlePosition: 'bottom',
    
    bulletSubtitle: "fixed sub-title",
    bulletRanges:   [200, 500, 1000]
})
.setData(bullet_NameValue)
.render();