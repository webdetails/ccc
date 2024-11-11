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
    canvas:  'cccBoxExample2',
    width:   600,
    height:  400,
    orientation: 'horizontal',

    // Main plot
    boxSizeMax: 15,
    boxBar_fillStyle: '#FFC20F',
    boxRuleMedian_lineWidth: 3,
    boxRuleMin_strokeStyle: '#005CA7',
    boxRuleMax_strokeStyle: '#005CA7',
    boxRuleWhisker_strokeDasharray: '- ',

    // Cartesian axes
    baseAxisGrid: true,
    axisGrid_strokeStyle: '#F7F8F9',
    panelSizeRatio: 0.8,
    axisLabel_font: 'normal 10px "Open Sans"',

    // Chart/Interaction
    selectable: true,
    hoverable:  true
})
.setData(boxplotData_01)
.render();