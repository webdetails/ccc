function selectedCategory() {
    return document.getElementById("selCat").value;
}

function updateChart() {
    myChart.render(/*bypassAnimation:*/true);
}

var myChart = new pvc.BarChart({
    canvas: "cccExample",
    width:  700,
    height: 400,

    // Data source
    crosstabMode: false,

    // Main plot
	plot_call: function() {
        this.add(pv.Panel)
            .left(function() {
                var cccContext = this.getContext();
                var baseScale  = cccContext.chart.axes.base.scale;
                var fixedCat   = selectedCategory();

                // The base scale returns the middle position of the band.
                return baseScale(fixedCat) - baseScale.range().step / 2;
            })
            .width(function() {
                var cccContext = this.getContext();
                var baseScale = cccContext.chart.axes.base.scale;

                // The width of each band,
                // including the space between bands.
                return baseScale.range().step;
            })
            .fillStyle('rgba(0,0,250, 0.3)');
    },

    // Cartesian axes
    axisGrid: true
})
.setData(relational_04)
.render();
