/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/
new pvc.BoxplotChart({
    canvas: 'cccBoxExample1',
    width:  600,
    height: 400,

    // Panels
    title: "Minimal Boxplot Chart",
    titleFont: 'lighter 20px "Open Sans"',
    
    // Cartesian axes
    axisLabel_font: 'normal 10px "Open Sans"',

    // Color axes
    colors: ['#005CA7']
})
.setData(boxplotData_01)
.render();