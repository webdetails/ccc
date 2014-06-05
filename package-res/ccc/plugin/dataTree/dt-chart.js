/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * DataTree visualises a data-tree (also called driver tree).
 * It uses a data-sources to obtain the definition of data tree.
 * Each node of the tree can have it's own datasource to visualize the
 * node. 
 */
def
.type('pvc.DataTree', pvc.BaseChart)
.init(function(options) {
    // Force the value dimension not to be a number
    options = options || {};
    options.dimensionGroups = options.dimensionGroups || {};
    if(!options.dimensionGroups.value) {
        options.dimensionGroups.value = {valueType: null};
    }
    
    this.base(options);
})
.add({

    // the structure of the dataTree is provided by a separate datasource
    structEngine:   null,
    structMetadata: null,
    structDataset:  null,

    DataTreePanel : null,

    /** @override */
    _getColorRoleSpec: function() {
        return { isRequired: true, defaultSourceRole: 'category', requireIsDiscrete: true };
    },
    
    setStructData: function(data) {
        this.structDataset = data.resultset;
        if(!this.structDataset.length) {
            this._log("Warning: Structure-dataset is empty");
        }

        this.structMetadata = data.metadata;
        if(!this.structMetadata.length) {
            this._log("Warning: Structure-Metadata is empty");
        }
    },
  
    _createContent: function(parentPanel, contentOptions) {
        // Create DataEngine
        var structEngine  = this.structEngine;
        var structType    = structEngine ? structEngine.type : new cdo.ComplexType();
        // Force the value dimension not to be a number
        structType.addDimension('value', {});
        
        var translOptions = {
            seriesInRows: true,
            crosstabMode: true
        };
        
        var translation = new cdo.CrosstabTranslationOper(structType, this.structDataset, this.structMetadata, translOptions);
        translation.configureType();
        if(!structEngine) {
            structEngine = this.structEngine = new cdo.Data({type: structType});
        }
        
        structEngine.load(translation.execute(structEngine));

        if(pvc.debug >= 3) {
            this._log(this.structEngine.getInfo());
        }

        // ------------------
        
        this.dataTreePanel = new pvc.DataTreePanel(this, parentPanel, def.create(contentOptions, {
            topRuleOffset : this.options.topRuleOffset,
            botRuleOffset : this.options.botRuleOffset,
            leftRuleOffset : this.options.leftRuleOffset,
            rightRuleOffset : this.options.rightRuleOffset,
            boxplotColor:  this.options.boxplotColor,
            valueFontsize: this.options.valueFontsize,
            headerFontsize: this.options.headerFontsize,
            border: this.options.border,
            perpConnector: this.options.perpConnector,
            numDigits: this.options.numDigits,
            minVerticalSpace: this.options.minVerticalSpace,
            connectorSpace: this.options.connectorSpace,
            minAspectRatio: this.options.minAspectRatio
        }));
    },
    
    defaults: {
        compatVersion: 1,
        
     // margins around the full tree
        topRuleOffset: 30,
        botRuleOffset: 30,
        leftRuleOffset: 60,
        rightRuleOffset: 60,
        // box related parameters
        boxplotColor: "grey",
        headerFontsize: 16,
        valueFontsize: 20,
        border:  2,     // bordersize in pixels
        // use perpendicular connector lines  between boxes.
        perpConnector: false,
        // number of digits (after dot for labels)
        numDigits: 0,
        // the space for the connectors is 15% of the width of a grid cell
        connectorSpace: 0.15,
        // the vertical space between gridcells is at least 5%
        minVerticalSpace: 0.05,
        // aspect ratio = width/height  (used to limit AR of the boxes)
        minAspectRatio: 2.0

        //selectParam: undefined
    }
});

/*
 * DataTree chart panel. 
 *   << to be filled out >>
 *
 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 *    << to be filled out >>
 */
def
.type('pvc.DataTreePanel', pvc.PlotPanel)
.add({
  
  pvDataTree: null,

  treeElements: null, 

  structMap: null,
  structArr: null,

  hRules: null,
  vRules: null,
  rules: null,

  // generating Perpendicular connectors 
  // (only using horizontal and vertical rules)
  // leftLength gives the distance from the left box to the
  // splitting point of the connector
  generatePerpConnectors: function(leftLength) {

    this.hRules = [];
    this.vRules = [];
    this.rules  = [];  // also initialize this rule-set

    for(var e in this.structMap) {
      var elem = this.structMap[e];
      if(elem.children != null) {
        var min = +10000, max = -10000;
        var theLeft = elem.left + elem.width;
        this.hRules.push({"left": theLeft,
                    "width": leftLength,
                    "bottom": elem.bottom + elem.height/2});
        theLeft += leftLength;
        for(var i in elem.children) {
          var child = this.structMap[ elem.children[i] ];
          var theBottom = child.bottom + child.height/2;
          if(theBottom > max) { max = theBottom; }
          if(theBottom < min) { min = theBottom; }
          this.hRules.push({"left": theLeft,
                      "width": child.left - theLeft,
                      "bottom": theBottom});
        }

        // a vertical rule is only added when needed
        if(max > min) {
          this.vRules.push({"left": theLeft,
                      "bottom": min,
                      "height": max - min});
        }
      }
    }
  },

  // generate a line segment and add it to rules
  generateLineSegment: function(x1, y1, x2, y2) {
    var line = [];
    line.push({"x":  x1,
               "y":  y1});
    line.push({"x":  x2,
               "y":  y2});
    this.rules.push(line);
  },

  // leftLength gives the distance from the left box to the
  // splitting point of the connector
  generateConnectors: function(leftLength) {

    this.hRules = [];
    this.vRules = [];

    if(this.chart.options.perpConnector) {
      this.generatePerpConnectors(leftLength);
      return;
    }

    // this time were using diagonal rules
    this.rules = [];

    for(var e in this.structMap) {
      var elem = this.structMap[e];
      if(elem.children != null) {
        var theCenter, child, i;
        
        // compute the mid-point
        var min = +10000, max = -10000;
        for(i in elem.children) {
          child = this.structMap[ elem.children[i] ];
          theCenter = child.bottom + child.height/2;
          if(theCenter > max) { max = theCenter; }
          if(theCenter < min) { min = theCenter; }
        }
        var mid = (max + min)/2;

        var theLeft1 = elem.left + elem.width;
        var theLeft2 = theLeft1 + leftLength;

        // outbound line of the left-hand box
        this.generateLineSegment(theLeft1, elem.bottom + elem.height/2,
                                theLeft2, mid);

        // incoming lines of the right-hand boxes
        for(i in elem.children) {
          child = this.structMap[ elem.children[i] ];
          theCenter = child.bottom + child.height/2;

          this.generateLineSegment(theLeft2, mid,
                                   child.left, theCenter);
        }
      }
    }
  },

  retrieveStructure: function() {
    var data = this.chart.structEngine;
    var options = this.chart.options;

    var colLabels = data.getVisibleCategories();
    this.treeElements = data.getVisibleSeries();
    var values = data.getValues();

    // if a fifth column is added, then
    //  bottom and height are provided in the dataset.
    var bottomHeightSpecified = (colLabels.length > 4);
    
    var e;
    
    // trim al element labels (to allow for matching without spaces)
    for(e in this.treeElements) { 
      this.treeElements[e] = $.trim(this.treeElements[e]);
    }

    // get the bounds (minimal and maximum column and row indices)
    // first a bounds object with two helper-functions is introduced
    var bounds = [];
    bounds.getElement = function(label) {
      // create the element if it does not exist
      if(bounds[label] == null) {
        bounds[label] = {"min": +10000, "max": -10000};
      }
      return bounds[label];
    };
    
    bounds.addValue = function(label, value) {
      var bnd = bounds.getElement(label);
      if(value < bnd.min) {
        bnd.min = value;
      }
      if(value > bnd.max) {
        bnd.max = value;
      }
      return bnd;
    };
    
    var col, colnr, elem, row;
    for(e in this.treeElements) {
      elem = this.treeElements[e];
      col = elem[0];
      colnr = col.charCodeAt(0);
      row = parseInt(elem.slice(1), 10);
      bounds.addValue("__cols", colnr);
      bounds.addValue(col,row);
    }

    // determine parameters to find column-bounds    
    var bnds = bounds.getElement("__cols");
    var gridWidth  = this.innerWidth/(bnds.max - bnds.min + 1); // integer
    var connectorWidth = options.connectorSpace * gridWidth;
    var cellWidth = gridWidth - connectorWidth;
    var maxCellHeight = cellWidth/options.minAspectRatio;
    var colBase = bnds.min;
    delete bounds.__cols;

    // compute additional values for each column
    for(e in bounds) {
      bnds = bounds[e];
      
      if(typeof bnds == "function") {
        continue;
      }
      var numRows = bnds.max - bnds.min + 1;

      bnds.gridHeight = this.innerHeight/numRows;
      bnds.cellHeight = bnds.gridHeight*(1.0 - options.minVerticalSpace);
      if(bnds.cellHeight > maxCellHeight) {
        bnds.cellHeight = maxCellHeight;
      }
      bnds.relBottom = (bnds.gridHeight - bnds.cellHeight)/2;
      bnds.numRows = numRows;
    }

    // generate the elements
    var whitespaceQuote = new RegExp ('[\\s\"\']+',"g"); 
    this.structMap = {};
    for(e in this.treeElements) {
      var box = {};
      elem = this.treeElements[e];
      box.box_id = elem;
      this.structMap[elem] = box;

      col = elem[0];
      colnr = col.charCodeAt(0);
      row = parseInt(elem.slice(1), 10);
      bnds = bounds.getElement(col);

      box.colIndex = colnr - colBase;
      box.rowIndex = bnds.numRows - (row - bnds.min) - 1;

      box.left = this.leftOffs + box.colIndex * gridWidth;
      box.width = cellWidth;
      if(bottomHeightSpecified) {
          box.bottom = values[4][e];
          box.height = values[5][e];
      } else {
          box.bottom = this.botOffs + box.rowIndex * bnds.gridHeight + bnds.relBottom;
          box.height = bnds.cellHeight;
      }
      
      box.label = values[0][e];
      box.selector = values[1][e];
      box.aggregation = values[2][e];
      
      var children = (values[3][e] || '').replace(whitespaceQuote, " ");
      
      box.children = (children === " " || children ===  "") ?
         null : children.split(" ");
    }

    this.generateConnectors((gridWidth - cellWidth)/2);

    // translate the map to an array (needed by protovis)
    this.structArr = [];
    for(e in this.structMap) {
      elem = this.structMap[e];
      this.structArr.push(elem);
    }
  },

  findDataValue: function(key, data) {
    for(var i=0; i < data[0].length; i++) {
      if(data[0][ i ] == key) {
        return data[1][ i ];
      }
    }
    
    this._log("Error: value with key : "+key+" not found.");
  },

  generateBoxPlots: function() {
    var options = this.chart.options;

    for(var e in this.structArr) {
      var elem = this.structArr[e];
      if(!elem.values.length) {
        continue;
      }
      
      elem.subplot = {};
      var sp = elem.subplot;

      // order the data elements from 5% bound to 95% bound
      // and determine the horizontal scale
      var dat = [];
      var margin = 15;
      var rlMargin = elem.width/6;

      // generate empty rule sets (existing sets are overwritten !)
      sp.hRules = [];
      sp.vRules = [];
      sp.marks = [];
      sp.labels = [];

      dat.push(this.findDataValue("_p5", elem.values));
      dat.push(this.findDataValue("_p25", elem.values));
      dat.push(this.findDataValue("_p50", elem.values));
      dat.push(this.findDataValue("_p75", elem.values));
      dat.push(this.findDataValue("_p95", elem.values));

      var noBox = false;

	if(typeof(dat[2]) != "undefined") {
        // switch order (assume computational artifact)
        if(dat[4] < dat[0]) {
          dat = dat.reverse();
          this._log(" dataset "+ elem.box_id +
                  " repaired (_p95 was smaller than _p5)");
          }
        if(dat[4] > dat[0]) {
          sp.hScale = pv.Scale.linear( dat[0], dat[4]);
        } else {
          noBox = true;
          // generate a fake scale centered around dat[0] (== dat[4])
          sp.hScale = pv.Scale.linear( dat[0] - 1e-10, dat[0] + 1e-10);
        }
        sp.hScale.range(elem.left + rlMargin, elem.left + elem.width - rlMargin);
        var avLabel = "" + dat[2];   // prepare the label
        
        var i;
        
        for(i=0; i< dat.length; i++) {
            dat[i] = sp.hScale( dat[i]);
        }

        sp.bot = elem.bottom + elem.height / 3;
        sp.top = elem.bottom + 2 * elem.height / 3;
        sp.mid = (sp.top + sp.bot) / 2;   // 2/3 of height
        sp.textBottom = elem.bottom + margin;
        sp.textBottom = sp.bot - options.valueFontsize - 1;

        // and add the new set of rules for a box-plot.
        var lwa = 3;   // constant for "lineWidth Average"
        if(noBox) {
            sp.vRules.push({"left": dat[0],
                          "bottom": sp.bot,
                          "lWidth": lwa,
                          "height": sp.top - sp.bot});
        } else {
          sp.hRules.push({"left": dat[0],
                        "width":  dat[1] - dat[0],
                        "lWidth": 1,
                        "bottom": sp.mid});
          sp.hRules.push({"left": dat[1],
                        "width":  dat[3] - dat[1],
                        "lWidth": 1,
                        "bottom": sp.bot});
          sp.hRules.push({"left": dat[1],
                        "width":  dat[3] - dat[1],
                        "lWidth": 1,
                        "bottom": sp.top});
          sp.hRules.push({"left": dat[3],
                        "width":  dat[4] - dat[3],
                        "lWidth": 1,
                        "bottom": sp.mid});
          for(i=0; i<dat.length; i++) {
            sp.vRules.push({"left": dat[i],
                          "bottom": sp.bot,
                          "lWidth": (i == 2) ? lwa : 1,
                          "height": sp.top - sp.bot});
          }
        }

        sp.labels.push({left: dat[2],
                      bottom: sp.textBottom,
                      text: this.labelFixedDigits(avLabel),
                      size: options.smValueFont,
                      color: options.boxplotColor});
    }
    }
  } ,

  labelFixedDigits: function(value) {
    if(typeof value == "string") {
        value = parseFloat(value);
    }

    if(typeof value == "number") {
      var nd = this.chart.options.numDigits;

      value = value.toFixed(nd);
    }

    // translate to a string again
    return "" + value;
  } ,

  addDataPoint: function(key) {
    var options = this.chart.options;

    for(var e in this.structArr) {
      var elem = this.structArr[e];

      if(!elem.values.length) {
        continue;
      }
      
      var value = this.findDataValue(key, elem.values);
      if(typeof value == "undefined") {
        continue;
      }
      
      var sp = elem.subplot;
      var theLeft = sp.hScale(value); 

      var theColor = "green";
      sp.marks.push( {
        left: theLeft,
        bottom: sp.mid,
        color: theColor });
      
      sp.labels.push({left: theLeft,
                      bottom: sp.textBottom,
                      text: this.labelFixedDigits(value),
                      size: options.valueFont,
                      color: theColor});
    }
  }, 

  retrieveData: function() {
    var data = this.chart.data;
    var options = this.chart.options;

    //var colLabels = data.getVisibleCategories();
    var selectors = data.getVisibleSeries();
    var values = data.getValues();
    var selMap = {};
    var i;
    
    // create empty datasets and selMap
    var numCols = values.length;
    for(var e in this.structArr) {
      var elem = this.structArr[e];
      elem.values = [];
      for(i=0; i<numCols; i++) {
          elem.values.push([]);
      }
      selMap[ elem.selector ] = elem; 
    }

    // distribute the dataset over the elements based on the selector
    var boxNotFound = {};
    for(i in selectors) {
      var box = selMap[ selectors[ i ] ];
      if(typeof(box) != "undefined") {
        for(var j in values) {
            box.values[j].push(values[ j ][ i ]);
        }
      } else {
        boxNotFound[ selectors[i] ] = true;
      }
    }

    for(var sel in boxNotFound) {
        this._log("Could'nt find box for selector: "+ sel);
    }
    
    this.generateBoxPlots();

    var whitespaceQuote = new RegExp ('[\\s\"\']+',"g");
    if(options.selectParam) {
        var selPar = options.selectParam.replace(whitespaceQuote, '');
        /*global window:true*/
        if((selPar != "undefined") &&
            (selPar.length > 0) &&
            (typeof window[selPar] != "undefined")) {
            selPar = window[selPar];
            this.addDataPoint(selPar);
        }
    }
  } ,

  /**
   * @override
   */
  _createCore: function() {
      
    var myself  = this;

    var options = this.chart.options;
    options.smValueFontsize = Math.round(0.6 * options.valueFontsize);
    options.smValueFont = "" + options.smValueFontsize + "px sans-serif";
    options.valueFont = "" + options.valueFontsize + "px sans-serif";

    // used in the different closures
    var topRuleOffs = options.topRuleOffset,
        botRuleOffs = options.botRuleOffset,
        leftRuleOffs = options.leftRuleOffset;

    // set a few parameters which will be used during data-retrieval
    this.innerWidth = this.width - leftRuleOffs - options.rightRuleOffset;
    this.innerHeight = this.height - topRuleOffs - botRuleOffs;
    this.botOffs = botRuleOffs;
    this.leftOffs = leftRuleOffs;

    // retrieve the data and transform it to the internal representation.
    this.retrieveStructure();

    this.retrieveData();

    /*****
     *   Generate the scales x, y and color
     *******/

/*
pv_Mark.prototype.property("testAdd");
    pv_Mark.prototype.testAdd = function(x) { 
return pv.Label(x);
                      }
*/
    var topMargin = options.headerFontsize + 3;

    // draw the connectors first (rest has to drawn over the top)
    var rules = this.rules;
    var i;
    
    for(i = 0; i < rules.length; i++) {
      /*jshint loopfunc:true */
      this.pvPanel.add(pv.Line)
        .data(rules[ i ])
        .left(function(d) { return d.x; })
        .bottom(function(d) { return d.y; })
        .lineWidth(1)
        .strokeStyle("black");
    }
    
    // draw the data containers with decorations
    this.pvDataTree = this.pvPanel.add(pv.Bar)
      .data(myself.structArr)
      .left(function(d) { return d.left; })
      .bottom(function(d) { return d.bottom; })
      .height(function(d) { return d.height; })
      .width(function(d) { return d.width; })
      .fillStyle("green")
//;  this.pvDataTree
    .add(pv.Bar)
//      .data(function(d) {return d; })
      .left(function(d) { return d.left + options.border; })
      .bottom(function(d) { return d.bottom + options.border; })
      .height(function(d) { return d.height - options.border - topMargin; })
      .width(function(d) { return d.width - 2 * options.border; })
      .fillStyle("white")
    .add(pv.Label)
      .text(function(d) { return d.label; })
      .textAlign("center")
      .left(function(d) {return  d.left + d.width/2; })
      .bottom(function(d) {
          return d.bottom + d.height - options.headerFontsize - 5 + options.headerFontsize/5;
})
      .font("" + options.headerFontsize + "px sans-serif")
      .textStyle("white")
      .fillStyle("blue");

    // add the box-plots
    for(i=0; i<this.structArr.length; i++) {
      var box = this.structArr[i];
      this.pvPanel.add(pv.Rule)
        .data(box.subplot.hRules)
        .left(function(d) { return d.left; })
        .width( function(d) { return d.width; })
        .bottom( function(d) { return d.bottom; })
        .lineWidth( function(d) { return d.lWidth; })
        .strokeStyle(myself.chart.options.boxplotColor);

      this.pvPanel.add(pv.Rule)
        .data(box.subplot.vRules)
        .left(function(d) { return d.left; })
        .height( function(d) { return d.height; })
        .bottom( function(d) { return d.bottom; })
        .lineWidth( function(d) { return d.lWidth; })
        .strokeStyle(myself.chart.options.boxplotColor);

      this.pvPanel.add(pv.Dot)
        .data(box.subplot.marks)
        .left(function(d) { return d.left; })
        .bottom(function(d) { return d.bottom; })
        .fillStyle(function(d) {return d.color; });


      this.pvPanel.add(pv.Label)
        .data(box.subplot.labels)
        .left(function(d) { return d.left; })
        .bottom(function(d) { return d.bottom; })
        .font(function(d) { return d.size; })
        .text(function(d) { return d.text; })
        .textAlign("center")
        .textStyle(function(d) {return d.color; });

    }

    // add the connecting rules (perpendicular rules)
    if(options.perpConnector) {
      this.pvPanel.add(pv.Rule)
        .data(myself.vRules)
        .left(function(d) { return d.left; })
        .bottom(function(d) { return d.bottom; })
        .height(function(d) { return d.height; })
        .strokeStyle("black");
      this.pvPanel.add(pv.Rule)
        .data(myself.hRules)
        .left(function(d) { return d.left; })
        .bottom(function(d) { return d.bottom; })
        .width(function(d) { return d.width; })
        .strokeStyle("black");
    }

    /*****
     *   draw the data-tree
     *******/
   },
  
   applyExtensions: function() {
      // Extend the dataTree
      this.extend(this.pvDataTree,"dataTree");
   }
});