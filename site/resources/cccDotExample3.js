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
new pvc.DotChart({
    canvas:  'cccDotExample3',
    width:   600,
    height:  400,
    margins: {right: '2%'},
    orientation: 'vertical',

    // Data source
    crosstabMode: false,
    timeSeriesFormat: '%Y-%m-%d',

    // Data
    timeSeries: true,

    // Main plot
    valuesVisible: true,
    valuesFont: 'lighter 11px "Open Sans"',
    plot_fillStyle: '#F7F8F9',
    dot_shape: 'cross',
    dot_shapeRadius: 3,

    // Cartesian plots
    axisLabel_font: 'normal 9px "Open Sans"',
    baseAxisLabel_textAngle:    -Math.PI/6,
    baseAxisLabel_textAlign:    'right',
    baseAxisLabel_textBaseline: 'top',

    // Panels
    title:     "A Time Series Dot Chart",
    titleFont: 'lighter 20px "Open Sans"',
    titlePosition: 'left',
    titleSize:     {height: '100%'},
    titleMargins:  '0 10 60 0',

    legend:      true,
    legendAlign: 'left',
    legendFont: 'normal 11px "Open Sans"',

    // Chart/Interaction
    animate:    false,
    selectable: true,

    // Color axes
    colors: ['#005CA7', '#FFC20F']
})
.setData(relational_012)
.render();
