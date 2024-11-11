/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/
define([
    "ccc/def",
    "ccc/pvc",
    "test/utils",
    "test/data-1"
], function(def, pvc, utils, datas) {

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
                baseAxisFont: "14px sans-serif",
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
            var li = chart.contentPanel.getLayout();
            expect(li instanceof Object).toBe(true);

            // optional label overflow that exceeds the axis offset paddings and grid child margins
            // is translated into dockingGrid panel paddings
            expect(li.paddings.right).toBe(0);
            expect(li.paddings.left).toBe(0);
        });
    });
});