new pvc.BulletChart({
    canvas:  'cccBulletExample4',
    width:   400,
    height:  250,
    animate: false,
    orientation: 'horizontal',
    
    bulletSize:    25,
    bulletSpacing: 50,
    bulletMargin:  100,
    
    bulletSubtitle: "fixed sub-title",
    bulletRanges:   [200, 500, 1000]
})
.setData(bullet_NameValueMarker)
.render();