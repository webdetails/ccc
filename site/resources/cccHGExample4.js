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
new pvc.HeatGridChart({
    canvas: 'cccHGExample4',
    width:    600,
    height:   400,

    // Main plot
    valuesVisible: false,

    // Color axes
    colors: ['#005CA7', '#FFFFFF', '#FFC20F'],
    colorMissing: '#333333',

    // Panels
    title: "Interactive Heat-grid",
    titleFont: 'lighter 20px "Open Sans"',
    titleMargins: '0 0 5 0',
    
    // Cartesian axes
    axisLabel_font: 'normal 10px "Open Sans"',
    axisRule_strokeStyle: '#FFFFFF',

    // Chart/Interaction
    selectable:  true,
    hoverable:   true,

    clickable:   true,
    clickAction: function(scene){
        alert('series = "'   + scene.getSeries() +
            '", category = ' + scene.getCategory() +
            '", color = '    + scene.getColor());
    }
})
.setData(testHeatGrid)
.render();