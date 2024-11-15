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
var pie = new pvc.PieChart({
    canvas:  'cccPieExample5',
    width:   600,
    height:  400,

    // Data source
    isMultiValued: true,
    dataMeasuresInColumns: true,

    // Visual roles
    visualRoles: {multiChart: 'category3', category: 'category2'},

    // Main Plot
    slice_strokeStyle: 'white',
    valuesFont: 'lighter 11px "Open Sans"',

    // Panels
    titleFont: 'lighter 20px "Open Sans"',
    smallTitleFont: 'normal 14px "Open Sans"',

    legend: true,
    legendPosition: 'right',
    legendFont: 'normal 11px "Open Sans"',

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true,

    // Color axes
    colors: [
        '#333333', '#FFC20F', '#005CA7'
    ]
})
.setData(steelWheels02)
.render();