new pvc.BulletChart({
    canvas: 'cccBulletExample2',
    width:  600,
    height: 200,
    orientation: 'horizontal',

    // Main plot
    bulletSize:    25,
    bulletSpacing: 50,
    bulletMargin: 100,
    bulletTitlePosition: 'top',
    
    bulletTitle:    "Fixed Title",
    bulletSubtitle: "fixed sub-title",
    bulletRanges:   [30, 80, 100],

    // Panels
    title:         "Value only",
    titlePosition: 'top',
    titleSize:     40
})
.setData(bullet_valueOnly)
.render();