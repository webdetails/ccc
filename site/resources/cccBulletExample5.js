new pvc.BulletChart({
    canvas:  'cccBulletExample5',
    width:   600,
    height:  400,
    animate: false,
    orientation: 'vertical',
    
    bulletSize:    25,
    bulletSpacing: 80,
    bulletMargin:  30,
    bulletTitlePosition: 'left'
})
.setData(bullet_NameDescValueMarkerRanges)
.render();
