new pvc.BarChart({
    canvas: "cccExample",
    width:  700,
    height: 400,

    // Data source
    crosstabMode: false,

    // Cartesian axes
    axisGrid: true,
    axisBandSizeRatio: 0.6,
	baseAxisGrid_call: function() {
        this.add(pv.Panel)
            .zOrder(-15) // Send behind gridlines
            .visible(function(scene) {
                // Always hide the last scene cause it is
                // really fictitious.
                if(this.index === scene.parent.childNodes.length)
                    return false;

                return !(this.index % 2);
            })
            .width(function() {
                var cccContext = this.getContext();
                var baseScale = cccContext.chart.axes.base.scale;
                return baseScale.range().step;
            })
            .fillStyle('rgba(120,120,120, 0.3)');
    },

    // Chart/Interaction
    animate:    false,
    clickable:  true,
    selectable: true,
    hoverable:  true
})
.setData(relational_04)
.render();
