new pvc.DotChart({
    canvas:  'cccDotExample2',
    width:   400,
    height:  300,
    title:   "A Rich Dot Chart",
    titlePosition: 'top',
    titleSize:     {width: '100%'},
    orientation:   'horizontal',
    animate:       false,
    selectable:    true,
    hoverable:     true,
    valuesVisible: true,
    
    extensionPoints: {
        chart_fillStyle: '#eee',
        title_fillStyle: 'orange',
        axisLabel_textStyle: 'darkblue',
        baseAxis_fillStyle:  '#bbb',
        orthoAxisLabel_textAlign: 'center',
        
        dot_shape:     'triangle',
        dot_fillStyle: 'orange',
        dot_shapeRadius: 3
   }
})
.setData(relational_03, {crosstabMode: false})
.render();