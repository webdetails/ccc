define([
    'ccc/cdo',
    'test/utils',
    'test/data-1'
], function(cdo, utils, datas) {

    describe('Categorical linear interpolation', function() {

        it('should work over visible and invisible categories', function() {
            var dataSpec = [
                {
                    resultset: [
                        // Make sure the order of CA, CB, CC is well defined, by placing non-nulls before
                        ["S2", "CA",  1], // hidden
                        ["S2", "CB",  1], // hidden
                        ["S2", "CC",  1], // hidden

                        ["S1", "CA", 20],
                        //["S1", "CB", 45],  <-- should interpolate this
                        ["S1", "CC", 70]
                    ],
                    metadata: [
                        {colType: "String",  colName: "Series"  },
                        {colType: "String",  colName: "Category"},
                        {colType: "Numeric", colName: "Value"   }
                    ]
                },
                {
                    crosstabMode: false,
                    readers:      "series, category, value"
                }
            ];

            var result = utils.categoricalDataAndVisualRoles(dataSpec);

            var baseData = result.data;
            var catRole  = result.visualRoles.category;
            var serRole  = result.visualRoles.series;
            var valRole  = result.visualRoles.value;

            // All data is of the same data part
            var partData = baseData;

            // Hide datums of series S2
            baseData.datums([{series: 'S2'}]).each(function(d) {
                d.setVisible(false);
            });

            // Changing visible invalidates it all...
            baseData.disposeChildren();

            // The datum we expect to be the result of interpolation
            // must not be present before.
            expect(baseData.datums([{series: 'S1', category: 'CB'}]).count())
                .toBe(0);

            // Filter only visible data.
            var visibleData = partData.groupBy([
                catRole.flattenedGrouping(),
                serRole.flattenedGrouping()
            ], {
                visible: true,
                // false or null - depends on the chart's ignoreNulls option
                // which is is true by default.
                // The dataset has no nulls, so it's kind of irrelevant.
                // Just in case, we set to false, because we don't want to
                // test nulls here.
                isNull:  false
            });

            // Should have 2 visible datums
            expect(visibleData.childCount()).toBe(2);

            new cdo.LinearInterpolationOper(
                baseData,
                partData,
                visibleData,
                catRole,
                serRole,
                valRole.grouping.singleDimensionName,
                /*stretchEnds*/true)
            .interpolate();

            var datums = baseData.datums([{series: 'S1', category: 'CB'}]).array();
            expect(datums.length).toBe(1);
            expect(datums[0].atoms.value.value).toBe((70 + 20) / 2);
        });

        it('should work over null and non-null categories', function() {
            var dataSpec = [
                {
                    resultset: [
                        ["S1", "CA",   20],
                        ["S1", "CB", null], // <-- should interpolate this
                        ["S1", "CC",   70]
                    ],
                    metadata: [
                        {colType: "String",  colName: "Series"},
                        {colType: "String",  colName: "Category"},
                        {colType: "Numeric", colName: "Value"}
                    ]
                },
                {
                    crosstabMode: false,
                    readers:      "series, category, value"
                }
            ];

            var result = utils.categoricalDataAndVisualRoles(dataSpec);

            var baseData = result.data;
            var catRole  = result.visualRoles.category;
            var serRole  = result.visualRoles.series;
            var valRole  = result.visualRoles.value;

            // All data is of the same data part
            var partData = baseData;

            expect(baseData.datums([{series: 'S1', category: 'CB'}]).count())
                .toBe(1);

            // Filter only visible data.
            var visibleData = partData.groupBy([
                catRole.flattenedGrouping(),
                serRole.flattenedGrouping()
            ], {
                visible: true,
                // false or null - depends on the chart's ignoreNulls option
                // which is is true by default.
                // Let the existing null datum pass-through.
                isNull:  null
            });

            // Should have 3 visible datums
            expect(visibleData.childCount()).toBe(3);

            new cdo.LinearInterpolationOper(
                baseData,
                partData,
                visibleData,
                catRole,
                serRole,
                valRole.grouping.singleDimensionName,
                /*stretchEnds*/true)
            .interpolate();

            // The interpolated one should exist and have value 45.
            var datums = baseData
                .datums([{series: 'S1', category: 'CB'}])
                .where(function(d) { return d.isInterpolated; })
                .array();

            expect(datums.length).toBe(1);

            expect(datums[0].atoms.value.value).toBe((70 + 20) / 2);
        });

        it('should work over categories from every data part', function() {
            var dataSpec = [
                {
                    resultset: [
                        ["P2", "S2", "CA", 2],
                        ["P2", "S2", "CB", 2],
                        ["P2", "S2", "CC", 2],

                        ["P1", "S1", "CA",   20],
                        //["P1", "S1", "CB", null], // <-- should interpolate this
                        ["P1", "S1", "CC",   70]
                    ],
                    metadata: [
                        {colType: "String",  colName: "DataPart"},
                        {colType: "String",  colName: "Series"},
                        {colType: "String",  colName: "Category"},
                        {colType: "Numeric", colName: "Value"}
                    ]
                },
                {
                    crosstabMode: false,
                    readers:      "dataPart, series, category, value"
                }
            ];

            var result = utils.categoricalDataAndVisualRoles(dataSpec);

            var baseData = result.data;
            var catRole  = result.visualRoles.category;
            var serRole  = result.visualRoles.series;
            var valRole  = result.visualRoles.value;

            // Select data from part P1
            var partData = baseData.where(null, {where: function(d) {
                return d.atoms.dataPart.value === 'P1';
            }});

            expect(baseData.datums([{series: 'S1', category: 'CB'}]).count())
                .toBe(0);

            // Select visible data.
            var visibleData = partData.groupBy([
                catRole.flattenedGrouping(),
                serRole.flattenedGrouping()
            ], {
                visible: true,
                // false or null - depends on the chart's ignoreNulls option
                // which is true by default.
                // Don't wanna test nulls here.
                isNull:  false
            });

            // Should have 2 P1-visible datums
            expect(visibleData.childCount()).toBe(2);

            new cdo.LinearInterpolationOper(
                baseData,
                partData,
                visibleData,
                catRole,
                serRole,
                valRole.grouping.singleDimensionName,
                /*stretchEnds*/true)
            .interpolate();

            // The interpolated datum should exist and have value 45.
            var datums = baseData
                .datums([{series: 'S1', category: 'CB'}])
                .array();

            expect(datums.length).toBe(1);

            expect(datums[0].atoms.value.value).toBe((70 + 20) / 2);
        });

        it('should also work over null, invisible and from different data part categories, even if ignoring nulls', function() {
            var dataSpec = [
                {
                    resultset: [
                        ["P2", "S2", "CA", null],
                        ["P2", "S2", "CB", null], // hidden
                        ["P2", "S2", "CC", 2],

                        ["P1", "S1", "CA",   20],
                        //["P1", "S1", "CB", null], // <-- should interpolate this
                        ["P1", "S1", "CC",   70]
                    ],
                    metadata: [
                        {colType: "String",  colName: "DataPart"},
                        {colType: "String",  colName: "Series"},
                        {colType: "String",  colName: "Category"},
                        {colType: "Numeric", colName: "Value"}
                    ]
                },
                {
                    crosstabMode: false,
                    readers:      "dataPart, series, category, value"
                }
            ];

            var result = utils.categoricalDataAndVisualRoles(dataSpec);

            var baseData = result.data;
            var catRole  = result.visualRoles.category;
            var serRole  = result.visualRoles.series;
            var valRole  = result.visualRoles.value;

            // Select data from part P1
            var partData = baseData.where(null, {where: function(d) {
                return d.atoms.dataPart.value === 'P1';
            }});

            expect(baseData.datums([{series: 'S1', category: 'CB'}]).count())
                .toBe(0);

            // Hide datum of series S2 and category CB
            baseData.datums([{series: 'S2', category: 'CB'}]).each(function(d) {
                d.setVisible(false);
            });

            // Select visible data.
            var visibleData = partData.groupBy([
                catRole.flattenedGrouping(),
                serRole.flattenedGrouping()
            ], {
                visible: true,
                // false or null - depends on the chart's ignoreNulls option
                // which is true by default.
                isNull:  false
            });

            new cdo.LinearInterpolationOper(
                baseData,
                partData,
                visibleData,
                catRole,
                serRole,
                valRole.grouping.singleDimensionName,
                /*stretchEnds*/true)
            .interpolate();

            // The interpolated datum should exist and have value 45.
            var datums = baseData
                .datums([{series: 'S1', category: 'CB'}])
                .array();

            expect(datums.length).toBe(1);

            expect(datums[0].atoms.value.value).toBe((70 + 20) / 2);
        });

    });
});
