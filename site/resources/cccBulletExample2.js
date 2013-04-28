new pvc.BulletChart({
    canvas:  'cccBulletExample2',
    width:   600,
    height:  200,
    animate: false,
    orientation:   'horizontal',
    title:         "Value only",
    titlePosition: 'top',
    titleSize:     40,
    
    bulletSize:    25,
    bulletSpacing: 50,
    bulletMargin: 100,
    bulletTitlePosition: 'top',
    
    bulletTitle:    "Fixed Title",
    bulletSubtitle: "fixed sub-title",
    bulletRanges:   [30, 80, 100]
})
.setData(bullet_valueOnly)
.render();