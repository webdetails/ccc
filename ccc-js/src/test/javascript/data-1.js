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
                readers:      "series, category, value"
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
                    ["2011-07-17",  N, 90, 15],
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
                readers:      "series, category, value"
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
                readers:      "series, category, value"
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
                readers:      "series, category, value"
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
                readers:      "series, category, value"
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
                readers:      "series, category, value"
            }
        ],

        'relational, category=date|value=qty, 4 categories, variable positive values': [
            {
                resultset: [
                    ["2011-06-05", 10],
                    ["2011-06-12", 13],
                    ["2011-06-19", 8],
                    ["2011-06-10", 12]
                ],
                metadata: [
                    {colType: "String",  colName: "Date"},
                    {colType: "Numeric", colName: "Quantity"}
                ]
            },
            {
                crosstabMode: false,
                readers:      "category, value"
            }
        ],

        'relational, category=date|value=qty, 4 categories, variable negative values': [
            {
                resultset: [
                    ["2011-06-05", -10],
                    ["2011-06-12", -13],
                    ["2011-06-19", -8],
                    ["2011-06-10", -12]
                ],
                metadata: [
                    {colType: "String",  colName: "Date"},
                    {colType: "Numeric", colName: "Quantity"}
                ]
            },
            {
                crosstabMode: false,
                readers:      "category, value"
            }
        ],

        'relational, category=date|value=qty, 4 categories, variable positive and negative values': [
            {
                resultset: [
                    ["2011-06-05", -10],
                    ["2011-06-12", 13],
                    ["2011-06-19", -8],
                    ["2011-06-10", 12]
                ],
                metadata: [
                    {colType: "String",  colName: "Date"},
                    {colType: "Numeric", colName: "Quantity"}
                ]
            },
            {
                crosstabMode: false,
                readers:      "category, value"
            }
        ],

        'relational, category=date|value=qty, 4 categories, constant positive value': [
            {
                resultset: [
                    ["2011-06-05", 10],
                    ["2011-06-12", 10],
                    ["2011-06-19", 10],
                    ["2011-06-10", 10]
                ],
                metadata: [
                    {colType: "String",  colName: "Date"},
                    {colType: "Numeric", colName: "Quantity"}
                ]
            },
            {
                crosstabMode: false,
                readers:      "category, value"
            }
        ],

        'relational, category=date|value=qty, 4 categories, constant negative value': [
            {
                resultset: [
                    ["2011-06-05", -10],
                    ["2011-06-12", -10],
                    ["2011-06-19", -10],
                    ["2011-06-10", -10]
                ],
                metadata: [
                    {colType: "String",  colName: "Date"},
                    {colType: "Numeric", colName: "Quantity"}
                ]
            },
            {
                crosstabMode: false,
                readers:      "category, value"
            }
        ],

        'relational, category=date|value=qty, 4 categories, constant zero value': [
            {
                resultset: [
                    ["2011-06-05", 0],
                    ["2011-06-12", 0],
                    ["2011-06-19", 0],
                    ["2011-06-10", 0]
                ],
                metadata: [
                    {colType: "String",  colName: "Date"},
                    {colType: "Numeric", colName: "Quantity"}
                ]
            },
            {
                crosstabMode: false,
                readers:      "category, value"
            }
        ],

        'relational, category=big-text|value=qty': [
            {
                "resultset": [
                    ["ce of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, " +
                     "a Latin professor at Hampden-Sydney College in Virginia, looke", 72],
                    [ "lish. Many desktop publishing packages and web page editors now use Lor", 50]
                ],
                "metadata": [{
                    "colIndex": 0,
                    "colType": "String",
                    "colName": "City"
                }, {
                    "colIndex": 1,
                    "colType": "Numeric",
                    "colName": "Quantity"
                }]
            },
            {
                crosstabMode: false
            }
        ],

        'relational, category=date|value=qty, 4 categories': [
            {
                resultset: [
                    ["2011-06-05", 10],
                    ["2011-06-12",  1],
                    ["2011-06-19",  5],
                    ["2011-06-10", 19]
                ],
                metadata: [
                    {colType: "String",  colName: "Date"},
                    {colType: "Numeric", colName: "Quantity"}
                ]
            },
            {
                crosstabMode: false,
                readers:      "category, value"
            }
        ],

        'relational, category=date|value=qty|value2=sales, 4 categories, constant positive value, increasing value': [
            {
                resultset: [
                    ["2011-06-05", 10, 1],
                    ["2011-06-12", 10, 10],
                    ["2011-06-19", 10, 50],
                    ["2011-06-10", 10, 100]
                ],
                metadata: [
                    {colType: "String",  colName: "Date"},
                    {colType: "Numeric", colName: "Quantity"},
                    {colType: "Numeric", colName: "Sales"}
                ]
            },
            {
                crosstabMode: false
            }
        ],

        'relational, x=qty1|y=qty2, 4-quadrant points': [
            {
                resultset: [
                    [10,  50],
                    [-10, 10],
                    [10, -50],
                    [-10, -20]
                ],
                metadata: [
                    {colType: "Numeric", colName: "Quantity"},
                    {colType: "Numeric", colName: "Sales"}
                ]
            },
            {
                crosstabMode: false
            }
        ],

        'relational, x=qty1|y=qty2, positive quadrant points': [
            {
                resultset: [
                    [10, 50],
                    [20, 10],
                    [40, 50],
                    [10, 20]
                ],
                metadata: [
                    {colType: "Numeric", colName: "Quantity"},
                    {colType: "Numeric", colName: "Sales"}
                ]
            },
            {
                crosstabMode: false
            }
        ],

        'relational, category=Date|value=qty, 2 date categories: 1 negative and 1 positive': [
            {
                resultset: [
                    ["1969-12-20",  10],
                    ["1970-01-20",  30]
                ],
                metadata: [
                    {colType: "String",  colName: "Date"},
                    {colType: "Numeric", colName: "Quantity"}
                ]
            },
            {
                crosstabMode: false
            }
        ]
    };
});
