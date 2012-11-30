new pvc.BulletChart({
    canvas:  'cccBulletExample3',
    width:   400,
    height:  300,
    animate: false,
    orientation: 'horizontal',
    
    bulletSize:    25,
    bulletSpacing: 60,
    bulletMargin:  100,
    bulletTitlePosition: 'bottom',
    
    bulletSubtitle: "fixed sub-title",
    bulletRanges:   [200, 500, 1000]
})
.setData(bullet_NameValue)
.render();