
var datTreeTestStructure_01 = {
  "resultset":[
  ["A1",  "Winst",   "winst", "sum", "B1 B2"],
  [" B1",  "Bijdrage", "bijdrage", "sum", ""],
  ["B2 ",  "Kosten", "kosten", "sum", ""]
  ],
  "metadata":[{
    "colIndex":0,
    "colType":"String",
    "colName":"box_id"
  },{
    "colIndex":1,
    "colType":"String",
    "colName":"label"
  },{
    "colIndex":2,
    "colType":"String",
    "colName":"selector"
  },{
    "colIndex":3,
    "colType":"String",
    "colName":"aggregation"
  },{
    "colIndex":4,
    "colType":"String",
    "colName":"children"
  }
  ]
};

var datTreeTestData_01 = {
  "resultset":[
  ["winst", "_five", 10],
  ["winst", "_twentyfive", 30],
  ["winst", "_fifty", 35],
  ["winst", "_seventyfive", 40],
  ["winst", "_ninetyfive", 50],
  ["winst", "team A", 45],
  ["winst", "team B", 12],

  ["bijdrage", "_five", 1],
  ["bijdrage", "_twentyfive", 2],
  ["bijdrage", "_fifty", 3],
  ["bijdrage", "_seventyfive", 4],
  ["bijdrage", "_ninetyfive", 5],
  ["bijdrage", "team A", 4],
  ["bijdrage", "team B", 1],

  ["kosten", "_five", 5],
  ["kosten", "_twentyfive", 25],
  ["kosten", "_fifty", 50],
  ["kosten", "_seventyfive", 75],
  ["kosten", "_ninetyfive", 95],
  ["kosten", "team A", 45],
  ["kosten", "team B", 12]
  ],
  "metadata":[{
    "colIndex":0,
    "colType":"String",
    "colName":"selector"
  },{
    "colIndex":1,
    "colType":"String",
    "colName":"category"
  },{
    "colIndex":2,
    "colType":"Numeric",
    "colName":"value"
  }
  ]
};


