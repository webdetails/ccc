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
new pvc.BarChart({
    canvas: "cccBarExample11",
    width:  600,
    height: 400,

    // Data source
    crosstabMode: false,

    //  map logical table columns -> dimensions
    readers: 'city, period, count, avgLatency',

    // Data
    dimensions: {
        count:      {format: "#,0"  },
        avgLatency: {format: "#,0.0"}
    },

    // Plots
    plots: [
        {
            name: 'main',
            visualRoles: {
                value:    'count',
                series:   'city',
                category: 'period'
            }
        },
        {
            type: 'point',
            linesVisible: true,
            dotsVisible:  true,
            orthoAxis: 2,
            colorAxis: 2,
            nullInterpolationMode: 'linear',
            visualRoles: {
                value: 'avgLatency',
                color: {legend: {visible: false}}
            }
        }
    ],

    // Cartesian axes
    axisGrid_strokeStyle: '#F7F8F9',
    axisLabel_font: 'normal 10px "Open Sans"',
    axisTitleLabel_font: 'normal 12px "Open Sans"',

    baseAxisTooltipAutoContent: 'summary',
    axisBandSizeRatio: 0.6,

    orthoAxisTitle:  "Count",
    orthoAxisOffset: 0.02,
    orthoAxisGrid:   true,

    ortho2AxisTitle: "Avg. Latency",

    // Color axes
    colors: [
        '#005CA7', '#FFC20F', '#333333'
    ],
    color2AxisTransform: function(c) { return c.brighter(0.5); },

    // Panels
    legend: true,
    legendFont: 'normal 11px "Open Sans"',

    // Chart/Interaction
    animate:    true,
    selectable: true,
    hoverable:  true,
    tooltipClassName: 'light',
    tooltipOpacity: 1
})
.setData(testMeasureDiscrim)
.render();
