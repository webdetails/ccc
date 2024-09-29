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
new pvc.HeatGridChart({
    canvas: 'cccHGExample3',
    width:  600,
    height: 350,
    orientation: 'horizontal',

    // Color axes
    colors: ['#005CA7', '#FFFFFF', '#FFC20F'],
    colorMissing: '#333333',

    // Panels
    title: "Horizontal Colors By Column Heat-grid",
    titleFont: 'lighter 20px "Open Sans"',
    titleMargins: '0 0 5 0',
    
    // Main Plot
    valuesFont: 'lighter 11px "Open Sans"',
    valuesOptimizeLegibility: true,
    
    // Cartesian axes
    axisLabel_font: 'normal 10px "Open Sans"',
    axisRule_strokeStyle: '#FFFFFF'
})
.setData(testHeatGrid)
.render();