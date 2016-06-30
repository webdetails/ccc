define([
    "ccc/pvc",
    "test/utils",
    "test/data-1"
], function(pvc, utils, datas) {

    describe("pvc.GridDockingPanel", function() {

        // CDF-912
        it("should detect that the axis offset paddings cover the X labels overflow", function() {
            var dataSpec = datas['relational, category=date|value=qty, 4 categories, constant positive value'];
            var chartOptions = {
                width:  200,
                height: 300,
                margins:  0,
                paddings: 0,
                contentMargins:  0,
                baseAxisFont:    "14px sans-serif",
                baseAxisOffset:  0.3,
                baseAxisOverlappedLabelsMode: 'leave',
                plotFrameVisible: false,
                orthoAxisOffset: 0,
                animate:     false,
                interactive: false
            };

            var chart = utils.createChart(pvc.BarChart, chartOptions, dataSpec);
            chart.basePanel._create({});

            // layout has been performed.
            var li = chart._gridDockPanel._layoutInfo;
            expect(li instanceof Object).toBe(true);

            // label overflow paddings that exceed the axis offset paddings and grid child margins
            // are translated into dockingGrid panel paddings
            expect(li.paddings.right).toBe(0);
            expect(li.paddings.left).toBe(0);
        });
    });
});