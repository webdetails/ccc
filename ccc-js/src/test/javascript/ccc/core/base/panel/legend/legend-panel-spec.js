define([
    'ccc/pvc',
    'ccc/def',
    'test/utils',
    'test/data-1'
], function(pvc, def, utils, datas) {

    describe("legend-panel", function() {

        describe("legendAreaVisible", function() {

            it("should not create the legend panel when legendAreaVisible = false and legend = undefined.", function() {
                var chartOptions = createOptions({legendAreaVisible: false});
                var result = createChart(chartOptions);

                expect(result.legendPanel).toBe(null);
            });

            it("should not create the legend panel when legendAreaVisible = false and legend = true.", function() {
                var chartOptions = createOptions({legendAreaVisible: false, legend: false});
                var result = createChart(chartOptions);

                expect(result.legendPanel).toBe(null);
            });

            it("should not create the legend panel when legendAreaVisible = false and legend = false.", function() {
                var chartOptions = createOptions({legendAreaVisible: false, legend: false});
                var result = createChart(chartOptions);

                expect(result.legendPanel).toBe(null);
            });

            it("should create the legend panel when legendAreaVisible = true and legend = undefined.", function() {
                var chartOptions = createOptions({legendAreaVisible: true});
                var result = createChart(chartOptions);

                expect(result.legendPanel).not.toBe(null);
            });

            it("should create the legend panel when legendAreaVisible = true and legend = true.", function() {
                var chartOptions = createOptions({legendAreaVisible: true, legend: false});
                var result = createChart(chartOptions);

                expect(result.legendPanel).not.toBe(null);
            });

            it("should create the legend panel when legendAreaVisible = true and legend = false.", function() {
                var chartOptions = createOptions({legendAreaVisible: true, legend: false});
                var result = createChart(chartOptions);

                expect(result.legendPanel).not.toBe(null);
            });

            it("should not create the legend panel when legendAreaVisible = undefined and legend = undefined.", function() {
                var chartOptions = createOptions({});
                var result = createChart(chartOptions);

                expect(result.legendPanel).toBe(null);
            });

            it("should create the legend panel when legendAreaVisible = undefined and legend = true.", function() {
                var chartOptions = createOptions({legend: true});
                var result = createChart(chartOptions);

                expect(result.legendPanel).not.toBe(null);
            });

            it("should not create the legend panel when legendAreaVisible = undefined and legend = false.", function() {
                var chartOptions = createOptions({legend: false});
                var result = createChart(chartOptions);

                expect(result.legendPanel).toBe(null);
            });

        });

        describe("'legendOverflow'", function() {
            var size;

            beforeEach(function() {
                // Size that is insufficient for the legend content.
                size = {width: 50, height: 50};
            });

            describe("Clip Mode", function() {

                it("'legendItemCountMax' shouldn't be taken into account in 'Clip Mode'.", function() {
                    var chartOptions = createOptions({legend: true, legendOverflow: 'clip', legendItemCountMax: 2});
                    var result = createChart(chartOptions);

                    expect(result.legendItemCount).toBeGreaterThan(chartOptions.legendItemCountMax);
                    expect(result.legendPanel.isVisible).toBe(true);
                });

                it("'legendSize' should set the size of the legendPanel.", function() {
                    var chartOptions = createOptions({legend: true, legendOverflow: 'clip', legendSize: size});
                    var result = createChart(chartOptions);

                    expect(result.legendPanelSize.width).toBe(chartOptions.legendSize.width);
                    expect(result.legendPanelSize.height).toBe(chartOptions.legendSize.height);
                });

                it("'legendSizeMax' should set the maximum size of the legend panel, only using what is needed by the panel.", function() {
                    // Size that is sufficient for the legend content.
                    size = {width: 150, height: 100};

                    var chartOptions = createOptions({legend: true, legendOverflow: 'clip', legendSizeMax: size});
                    var result = createChart(chartOptions);

                    expect(result.legendPanelSize.width).toBeLessThan(size.width);
                    expect(result.legendPanelSize.height).toBeLessThan(size.height);
                });

                it("should only hide the part that overflows when the items don't fit the legend panel.", function() {
                    var chartOptions = createOptions({legend: true, legendOverflow: 'clip', legendSize: size});
                    var result = createChart(chartOptions);

                    expect(result.legendItemsSizeTotal.width).toBeGreaterThan(result.legendPanelSize.width);
                    expect(result.legendItemsSizeTotal.height).toBeLessThan(result.legendPanelSize.height);
                    expect(result.legendPanel.isVisible).toBe(true);
                });

            }); // Clip Mode - End

            describe("Collapse Mode", function() {

                it("should hide the legend panel when the legend items exceed the 'legendItemCountMax' property.", function() {
                    var chartOptions = createOptions({legend: true, legendOverflow: 'collapse', legendItemCountMax: 2});
                    var result = createChart(chartOptions);

                    expect(result.legendPanel.isVisible).toBe(false);
                    expect(result.legendItemCount).toBeGreaterThan(chartOptions.legendItemCountMax);
                });

                it("'legendSize' shouldn't set the size of the legendPanel if overflow is detected.", function() {
                    var chartOptions = createOptions({legend: true, legendOverflow: 'collapse', legendSize: size});
                    var result = createChart(chartOptions);

                    expect(result.legendPanelSize.width).toBe(0);
                    expect(result.legendPanelSize.height).toBe(0);

                    expect(result.legendPanel.isVisible).toBe(false);
                });

                it("'legendSize' should set the size of the legendPanel if no overflow is detected.", function() {
                    // Size that is sufficient for the legend content.
                    size = {width: 150, height: 100};

                    var chartOptions = createOptions({legend: true, legendOverflow: 'collapse', legendSize: size});
                    var result = createChart(chartOptions);

                    expect(result.legendPanelSize.width).toBe(chartOptions.legendSize.width);
                    expect(result.legendPanelSize.height).toBe(chartOptions.legendSize.height);

                    expect(result.legendPanel.isVisible).toBe(true);
                });

                it("'legendSizeMax' shouldn't set the maximum size of the legend panel if overflow is detected.", function() {
                    var chartOptions = createOptions({legend: true, legendOverflow: 'collapse', legendSizeMax: size});
                    var result = createChart(chartOptions);

                    expect(result.legendPanelSize.width).toBe(0);
                    expect(result.legendPanelSize.height).toBe(0);
                });

                it("should hide the legend panel when 1 or more legend items don't fit the panel.", function() {
                    var chartOptions = createOptions({legend: true, legendOverflow: 'collapse', legendSizeMax: size});
                    var result = createChart(chartOptions);

                    expect(result.legendPanel.isVisible).toBe(false);
                });
            }); // Collapse Mode - End
        });
    });

    function createChart(options) {
        var chart = new pvc.BarChart(options);
        var dataSpec = datas['relational, series=city|category=date|value=qty, square form'];

        chart.setData.apply(chart, dataSpec);

        chart._create(options);
        chart.render();

        var legendPanel = chart.legendPanel;
        if(legendPanel != null) {
            return {
                legendPanel: legendPanel,
                legendPanelSize: legendPanel._layoutInfo.size,
                legendItemCount: _legendItemCount(legendPanel._rootScene),
                legendItemsSizeTotal: _itemsTotalSize(legendPanel)
            }
        }

        return {
            legendPanel: legendPanel
        };
    }

    function createOptions(options) {
        var chartOptions = {
            canvas: "pvcBar1",
            width:  400,
            height: 400,
            title:  "Bar chart",
            animate:     false,
            interactive: false,
            // Avoid being sensitive to default values that affect legend layout.
            legendPaddings: 5,
            legendMargins:  5
        };

        if('legend' in options) chartOptions.legend = options.legend;
        if('legendAreaVisible' in options) chartOptions.legendAreaVisible = options.legendAreaVisible;
        if('legendOverflow' in options) chartOptions.legendOverflow = options.legendOverflow;
        if('legendItemCountMax' in options) chartOptions.legendItemCountMax = options.legendItemCountMax;
        if('legendSize' in options) chartOptions.legendSize = options.legendSize;
        if('legendSizeMax' in options) chartOptions.legendSizeMax = options.legendSizeMax;

        return chartOptions;
    }

    function _itemsTotalSize(legendPanel) {
        var itemsTotalSize = {width: 0, height: 0};
        if(!legendPanel.pvLegendPanel) return itemsTotalSize;

        var sections = legendPanel._rootScene.vars.sections;
        for(var i = 0, L = sections.length; i < L; i++) {
            itemsTotalSize.width += sections[i].size.width;
            itemsTotalSize.height += sections[i].size.height;
        }

        return itemsTotalSize;
    }

    function _legendItemCount(rootScene) {
        var count = 0;

        rootScene.childNodes.forEach(function(scene) {
            count += scene.childNodes.length;
        });

        return count;
    }
});
