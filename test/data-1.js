define(function() {
    var N = null;

    return {
        'relational, category time-series positive implied nulls': [
            {
                resultset: [
                    ["London", "2011-06-05", 72],
                    ["London", "2011-06-12", 50],
                    ["London", "2011-06-19", 20],
                    ["London", "2011-06-26", 23],
                    ["London", "2011-07-03", 72],
                    ["London", "2011-07-10", 80],
                    ["London", "2011-07-26", 23],
                    ["London", "2011-07-31", 72],
                    ["London", "2011-08-07", 50],
                    ["London", "2011-08-14", 20],
                    ["London", "2011-08-28", 20],

                    ["Paris", "2011-06-05", 27],
                    ["Paris", "2011-06-26", 32],
                    ["Paris", "2011-07-03", 24],
                    ["Paris", "2011-07-10", 80],
                    ["Paris", "2011-07-17", 90],
                    ["Paris", "2011-07-24", 53],
                    ["Paris", "2011-07-31", 17],
                    ["Paris", "2011-08-07", 20],
                    ["Paris", "2011-08-21", 43],

                    ["Lisbon", "2011-06-12", 30],
                    ["Lisbon", "2011-07-03", 60],
                    ["Lisbon", "2011-07-10", 80],
                    ["Lisbon", "2011-07-17", 15]
                ],
                metadata: [
                    {colType: "String",  colName: "City"},
                    {colType: "String",  colName: "Date"},
                    {colType: "Numeric", colName: "Quantity"}
                ]
            },
            {
                crosstabMode: false,
                readers:      ["series, category, value"]
            }
        ],

        'cross-tab, category time-series positive nulls': [
            {
                resultset: [
                    ["2011-06-05", 72, 27,  N],
                    ["2011-06-12", 50,  N, 30],
                    ["2011-06-19", 20,  N,  N],
                    ["2011-06-26", 23, 32,  N],
                    ["2011-07-03", 72, 24, 60],
                    ["2011-07-10", 80, 80, 80],
                    ["2011-07-17",  N, 90, 15]
                    ["2011-07-24",  N, 53,  N],
                    ["2011-07-26", 23,  N,  N],
                    ["2011-07-31", 72, 17,  N],
                    ["2011-08-07", 50, 20,  N],
                    ["2011-08-14", 20,  N,  N],
                    ["2011-08-21",  N, 43,  N],
                    ["2011-08-28", 20,  N,  N]
                ],
                metadata: [
                    {colType: "String",  colName: "Date"  },
                    {colType: "Numeric", colName: "London"},
                    {colType: "Numeric", colName: "Paris" },
                    {colType: "Numeric", colName: "Lisbon"}
                ]
            },
            {
                crosstabMode: true,
                readers:      ["series, category, value"]
            }
        ],

        'relational, first category missing on first series': [
            {
                resultset: [
                    // London misses A
                    ["London", "B", 50],
                    ["London", "C", 72],

                    ["Lisbon", "A", 72],
                    ["Lisbon", "B", 30],
                    ["Lisbon", "C", 60]
                ],
                metadata: [
                    {colType: "String",  colName: "City"},
                    {colType: "String",  colName: "Date"},
                    {colType: "Numeric", colName: "Quantity"}
                ]
            },
            {
                crosstabMode: false,
                readers:      ["series, category, value"]
            }
        ],

        'cross-tab, category missing on first series': [
            {
                resultset: [
                    ["A",  N, 72],
                    ["B", 50, 30],
                    ["C", 72, 60],
                    ["D", -30, -5]
                ],
                metadata: [
                    {colType: "String",  colName: "Date"  },
                    {colType: "Numeric", colName: "London"},
                    {colType: "Numeric", colName: "Lisbon"}
                ]
            },
            {
                crosstabMode: true,
                readers:      ["series, category, value"]
            }
        ],

        'relational, row 1 has series X and value null, row 2 has series Y and value not null': [
            {
                resultset: [
                    // If nulls were ignored, when grouping,
                    // series X will appear after series Y.
                    ["X", "A", null],
                    ["Y", "A", 72],
                    ["X", "B", 50],
                    ["X", "C", 72],
                    ["Y", "B", 30],
                    ["Y", "C", 60]
                ],
                metadata: [
                    {colType: "String",  colName: "X/Y"   },
                    {colType: "String",  colName: "A/B/C/"},
                    {colType: "Numeric", colName: "Value" }
                ]
            },
            {
                crosstabMode: false,
                readers:      ["series, category, value"]
            }
        ],

        'relational, series=city|category=date|value=qty, square form': [
            {
                resultset: [
                    ["London", "2011-06-05", 72],
                    ["London", "2011-06-12", 50],
                    ["London", "2011-06-19", 20],

                    ["Paris", "2011-06-05",  27],
                    ["Paris", "2011-06-12",  80],
                    ["Paris", "2011-06-19",  24],

                    ["Lisbon", "2011-06-05", 30],
                    ["Lisbon", "2011-06-12", 60],
                    ["Lisbon", "2011-06-19", 15]
                ],
                metadata: [
                    {colType: "String",  colName: "City"},
                    {colType: "String",  colName: "Date"},
                    {colType: "Numeric", colName: "Quantity"}
                ]
            },
            {
                crosstabMode: false,
                readers:      ["series, category, value"]
            }
        ]
    };
});