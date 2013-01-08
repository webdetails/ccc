new pvc.BulletChart({
    canvas:  'cccBulletExample5',
    width:   400,
    height:  250,
    animate: false,
    orientation: 'vertical',
    
    bulletSize:    25,
    bulletSpacing: 80,
    bulletMargin:  30,
    bulletTitlePosition: 'left'
})
.setData(bullet_NameDescValueMarkerRanges)
.render();
