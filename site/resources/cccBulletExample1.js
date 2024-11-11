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
    canvas:  'cccBulletExample1',
    width:   600,
    height:  400,
    orientation: 'vertical',

    // Main plot
    bulletSize:    25,
    bulletSpacing: 150,
    bulletMargin:  30,
    
    bulletMeasure_fillStyle: '#005CA7',

    bulletTitle:    "Fixed Title",
    bulletTitlePosition: 'left',
    bulletTitle_textStyle: '#333333',
    bulletTitle_font: 'lighter 16px "Open Sans"',

    bulletSubtitle: "Fixed Sub-title",
    bulletSubtitle_font: 'normal 10px "Open Sans"',

    bulletMeasures: [50],
    bulletRuleLabel_font: 'normal 10px "Open Sans"',

    bulletMarkers:  [90],
    bulletMarker_shape: 'circle',

    bulletRanges:   [30, 80, 100]
})
.render();