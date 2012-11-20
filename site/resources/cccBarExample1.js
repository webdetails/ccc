new pvc.BarChart({
    canvas: "cccBarExample1",
    width:  400,
    height: 300,
    orientation: 'horizontal',
    animate:    false,
    selectable: true,
    hoverable:  true,
    valuesVisible: false,
    extensionPoints: {
        bar_fillStyle: 
            'linear-gradient(90deg, green, blue)'
    //  'linear-gradient(to bottom left, 
    //           red, yellow 20%, green, blue)'
    //  'radial-gradient(red, yellow 40%, red)'
    //  'linear-gradient(red, rgb(0,0,255))'
    }
})
.setData(relational_03, { crosstabMode: false })
.render();