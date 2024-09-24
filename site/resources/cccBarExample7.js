new pvc.BarChart({
  canvas: 'cccBarExample7',
  width:  600,
  height: 400,

  // Data source
  crosstabMode: false,

  // Main plot
  stacked: true,
  valuesNormalized: true,
  barStackedMargin: 3,
  valuesVisible: true,
  valuesOptimizeLegibility: true,
  valuesFont: 'lighter 11px "Open Sans"',
  plotFrameVisible: false,

  // Cartesian axes
  axisGrid:   true,
  axisOffset: 0,
  axisGrid_strokeStyle: '#F7F8F9',
  axisLabel_font: 'normal 10px "Open Sans"',
  orthoAxisFixedMax: 130,
  baseAxisTicks: true,
  baseAxisTooltipAutoContent: 'summary',
  axisRule_strokeStyle: '#DDDDDD',

  // Panels
  legend: true,
  legendFont: 'normal 11px "Open Sans"',

  // Rubber-band
  rubberBand_strokeStyle: 'rgb(0,0,240)',
  rubberBand_fillStyle:   'rgba(0,0,255, 0.5)',
  rubberBand_lineWidth:   2.5,

  // Chart/Interaction
  animate:    false,
  selectable: true,
  hoverable:  true,

  // Color axes
  colors: [
    '#005CA7', '#FFC20F', '#333333'
  ]
})
.setData(relational_01)
.render();
