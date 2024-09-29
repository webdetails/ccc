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
new pvc.StackedAreaChart({
    canvas: 'cccStackedAreaExample3',
    width:  600,
    height: 250,

    // Data
    timeSeries: true,

    // Cartesian axes
    axisGrid: true,
    axisGrid_strokeStyle: 'lightgray',

    // Panels
    title: "Huge Dataset Stacked Area Chart",
    legend: true
})  
.setData(crosstab_01)
.render();