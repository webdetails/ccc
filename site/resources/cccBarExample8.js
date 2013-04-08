new pvc.BarChart({
    canvas: "cccBarExample8",
    width:  400,
    height: 300,
    title:  "Paired Bar and Line measures",
    titleFont: 'bold 14px sans-serif',
    
    // Data translation
    crosstabMode: true,
    dataCategoriesCount: 2,
    
    // map virtual item columns -> dimensions
    readers: ['measure, series, category, value'],
    
    // Data
    dimensions: {
        // Explicitly define the "measure" dimension
        // (change the defaults that would 
        //  otherwise take effect)
        measure: {
            // If you want to hide the special 
            // "measure" dimension from the tooltip:
            isHidden: true,
            
            // Fine tune the labels
            formatter: function(v) {
                switch(v) {
                    case 'Count':
                        return "Count";
                    case 'AvgLatency': 
                        return "Avg. Latency";
                }
                return v + '';
            }
        }
    },
    
    calculations: [{
        // Split rows into != data parts, 
        // depending on the "measure" dimension's value.
        names: 'dataPart', 
        calculation: function(datum, atoms) {
            atoms.dataPart = 
                datum.atoms.measure == 'Count' ? 
                '0' :  // main plot:   bars
                '1' ;  // second plot: lines
        }
    }],
    
    // Plot2 - Lines
    plot2: true,
    plot2OrthoAxis: 2,
    
    // If you have nulls on the AvgLatency, 
    // this might look interesting
    plot2NullInterpolationMode: 'linear',
    
    // Cartesian axes
    orthoAxisTitle:  "Count",
    orthoAxisOffset: 0.03,
    orthoAxisGrid:   true,
    ortho2AxisTitle: "Avg. Latency",
    
    // Interaction
    animate:       true,
    clickable:     true,
    selectable:    true,
    hoverable:     true,
    
    // Extend legend item scenes
    legend: {
        scenes: {
           item: {
                value: function() {
                    var v = this.base();
                    // Add the measure label to the
                    // "value" variable's label
                    v.label += " / " +
                        this.firstAtoms.measure;
                    return v;
                }
            }
        }
    },
    extensionPoints: {
        axisGrid_strokeStyle: 'lightgray'
    }
})
.setData(testMeasureDiscrim)
.render();