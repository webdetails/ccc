new pvc.BulletChart({
    canvas:  'cccBulletExample5',
    width:   600,
    height:  400,
    orientation: 'vertical',

    // Main plot
    bulletSize:    25,
    bulletSpacing: 80,
    bulletMargin:  30,
    bulletTitlePosition: 'left'
})
.setData(bullet_NameDescValueMarkerRanges)
.render();
