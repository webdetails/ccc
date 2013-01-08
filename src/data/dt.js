
var datTreeTestStructure_01 = {
    "resultset": [
        ["A1", "Profit", "winst", "sum", "B1 B2"],
        ["B1", "Contribution-margin", "bijdrage", "sum", ""],
        ["B2 ", "Cost", "kosten", "sum", ""]
    ],
    "metadata": [{
            "colIndex": 0,
            "colType": "String",
            "colName": "box_id"
        }, {
            "colIndex": 1,
            "colType": "String",
            "colName": "label"
        }, {
            "colIndex": 2,
            "colType": "String",
            "colName": "selector"
        }, {
            "colIndex": 3,
            "colType": "String",
            "colName": "aggregation"
        }, {
            "colIndex": 4,
            "colType": "String",
            "colName": "children"
        }
    ]
    };

var datTreeTestData_01 = {
    "resultset": [
        ["winst", "_p5", 10],
        ["winst", "_p25", 30],
        ["winst", "_p50", 35],
        ["winst", "_p75", 40],
        ["winst", "_p95", 50],
        ["winst", "team A", 45],
        ["winst", "team B", 17],

        ["bijdrage", "_p5", 10],
        ["bijdrage", "_p25", 30],
        ["bijdrage", "_p50", 60],
        ["bijdrage", "_p75", 80],
        ["bijdrage", "_p95", 95],
        ["bijdrage", "team A", 55],
        ["bijdrage", "team B", 77],

        ["kosten", "_p5", 3],
        ["kosten", "_p25", 20],
        ["kosten", "_p50", 50],
        ["kosten", "_p75", 60],
        ["kosten", "_p95", 80],
        ["kosten", "team A", 10],
        ["kosten", "team B", 60]
    ],
    "metadata": [{
            "colIndex": 0,
            "colType": "String",
            "colName": "selector"
        }, {
            "colIndex": 1,
            "colType": "String",
            "colName": "category"
        }, {
            "colIndex": 2,
            "colType": "Numeric",
            "colName": "value"
        }
    ]
    };

var datTreeTestStructure_02 = {
    "resultset": [
        ["A1", "Winst", "winst", "sum", "B1 B2", 100, 70],
        ["B1", "Bijdrage", "bijdrage", "sum", "", 300, 100],
        ["B2 ", "Kosten", "kosten", "sum", "", 20, 200]
    ],
    "metadata": [{
            "colIndex": 0,
            "colType": "String",
            "colName": "box_id"
        }, {
            "colIndex": 1,
            "colType": "String",
            "colName": "label"
        }, {
            "colIndex": 2,
            "colType": "String",
            "colName": "selector"
        }, {
            "colIndex": 3,
            "colType": "String",
            "colName": "aggregation"
        }, {
            "colIndex": 4,
            "colType": "String",
            "colName": "children"
        }, {
            "colIndex": 5,
            "colType": "Integer",
            "colName": "bottom"
        }, {
            "colIndex": 6,
            "colType": "Integer",
            "colName": "height"
        }
    ]
    };

