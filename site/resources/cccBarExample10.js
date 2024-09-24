new pvc.BarChart({
    canvas: 'cccBarExample10',
    width:  600,
    height: 400,

    // Data source
    crosstabMode: true,
    dataCategoriesCount: 2,
    readers: 'measure, series, category, value',

    // Data
    dimensions: {
        // Explicitly define the "measure" dimension
        // (change the defaults that would otherwise take effect)
        measure: {
            // Hide "measure" from the tooltip
            isHidden: true,

            // Fine tune the labels
            formatter: function(v) {
                switch(v) {
                    case 'Count':      return "Count";
                    case 'AvgLatency': return "Avg. Latency";
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
                datum.atoms.measure.value === 'Count' ?
                '0' :  // main plot:   bars
                '1' ;  // second plot: lines
        }
    }],

    // Second plot - lines
    plot2: true,
    plot2OrthoAxis: 2,

    // If you have nulls on the AvgLatency,
    // this might look interesting
    plot2NullInterpolationMode: 'linear',

    // Cartesian axes
    axisGrid_strokeStyle: '#F7F8F9',
    axisLabel_font: 'normal 10px "Open Sans"',
    axisTitleLabel_font: 'normal 12px "Open Sans"',

    orthoAxisTitle:  "Count",
    orthoAxisOffset: 0.03,
    orthoAxisGrid:   true,
    ortho2AxisTitle: "Avg. Latency",

    // Panels
    //  Extend legend item scenes
    legend: {
        scenes: {
           item: {
                value: function() {
                    var valueVar = this.base();
                    // Add the measure label to
                    // the "value" variable's label
                    valueVar.label += " / " + this.firstAtoms.measure;
                    return valueVar;
                }
            }
        }
    },
    legendFont: 'normal 11px "Open Sans"',

    // Chart/Interaction
    animate:    true,
    selectable: true,
    hoverable:  true,

    // Color axes
    colors: [
        '#333333', '#FFC20F', '#005CA7'
    ]
})
.setData(testMeasureDiscrim)
.render();
