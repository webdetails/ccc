/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/
new pvc.BulletChart({
    canvas:  'cccBulletExample3',
    width:   600,
    height:  280,
    orientation: 'horizontal',

    // Main plot
    bulletSize:    25,
    bulletSpacing: 60,
    bulletMargin:  100,
    bulletTitlePosition: 'bottom',
    bulletTitle_textStyle: '#333333',
    bulletTitle_font: 'normal 15px "Open Sans"',
    bulletMeasure_fillStyle: '#005CA7',
    bulletRuleLabel_font: 'normal 10px "Open Sans"',

    bulletSubtitle: "Fixed Sub-title",
    bulletSubtitle_font: 'normal 10px "Open Sans"',
    bulletRanges:   [200, 500, 1000]
})
.setData(bullet_NameValue)
.render();