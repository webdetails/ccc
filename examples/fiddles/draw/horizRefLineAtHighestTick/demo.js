new pvc.LineChart({
    canvas: "cccExample",
    width:  700,
    height: 400,

    // Data source
    crosstabMode: false,

    // Cartesian axes
    plotFrameVisible: false,
    axisGrid: true,
    axisOffset: 0,
    orthoAxisTicks: false,
    orthoAxisTicks_width: 1, // affects layout, although ticks are hidden
    orthoAxisRule_visible: false,

    // Show only the label of the highest tick
    orthoAxisLabel_textMargin:   3,
    orthoAxisLabel_textAlign:    'left',
    orthoAxisLabel_textBaseline: 'top',
    orthoAxisLabel_visible: function() {
        return this.index === this.scene.parent.childNodes.length - 1;
    },

    // The top gridline corresponds to the highest tick.
    orthoAxisGrid_strokeStyle: function() {
        return this.index === this.scene.parent.childNodes.length - 1
            ? 'black'
            : this.delegate();
    }
})
.setData(relational_04)
.render();
