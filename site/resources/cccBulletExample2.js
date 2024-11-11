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
    canvas: 'cccBulletExample2',
    width:  600,
    height: 230,
    orientation: 'horizontal',

    // Main plot
    bulletSize:    25,
    bulletSpacing: 50,
    bulletMargin: 100,
    bulletTitlePosition: 'top',
    bulletTitle_textStyle: '#333333',
    bulletTitle_font: 'normal 15px "Open Sans"',
    bulletMeasure_fillStyle: '#005CA7',
    bulletRuleLabel_font: 'normal 10px "Open Sans"',
    
    bulletTitle:    "Fixed Title",
    bulletSubtitle: "Fixed Sub-title",
    bulletSubtitle_font: 'normal 10px "Open Sans"',
    bulletRanges:   [30, 80, 100],

    // Panels
    title:         "Value only",
    titleFont: 'lighter 20px "Open Sans"',
    titleMargins: '0 0 15 0',
    titlePosition: 'top',
    titleSize:     40
})
.setData(bullet_valueOnly)
.render();