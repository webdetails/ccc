
/**
 * Parallel coordinates offer a way to visualize data and make (sub-)selections
 * on this dataset.
 * Enhanced version of protovis example 
 *    http://vis.stanford.edu/protovis/ex/cars.html
 */


pvc.ParallelCoordinates = pvc.Base.extend({

  parCoordPanel : null,
  legendSource: "categories",
  tipsySettings: {
    gravity: "s",
    fade: true
  },

  constructor: function(o){

    this.base(o);

    var _defaults = {
      topRuleOffset: 30,
      botRuleOffset: 30,
      leftRuleOffset: 60,
      rightRuleOffset: 60
    };


    // Apply options
    $.extend(this.options,_defaults, o);

    return;
  },

  preRender: function(){

    this.base();

    pvc.log("Prerendering in parallelCoordinates");


    this.parCoordPanel = new pvc.ParCoordPanel(this, {
      topRuleOffset : this.options.topRuleOffset,
      botRuleOffset : this.options.botRuleOffset,
      leftRuleOffset : this.options.leftRuleOffset,
      rightRuleOffset : this.options.rightRuleOffset
    });

    this.parCoordPanel.appendTo(this.basePanel); // Add it

    return;
  }

}
);


/*
 * ParCoord chart panel. Generates a serie of Parallel Coordinate axis 
 * and allows you too make selections on these parallel coordinates.
 * The selection will be stored in java-script variables and can be
 * used as part of a where-clause in a parameterized SQL statement.
 * Specific options are:
 *   << to be filled in >>

 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>parCoord_</i> - for the main pie wedge
 *    << to be completed >>
 */


pvc.ParCoordPanel = pvc.BasePanel.extend({

  _parent: null,
  pvParCoord: null,

  dimensions: null, 
  data: null,

  dimensionDescr: null,

  constructor: function(chart, options){

    this.base(chart,options);

  },

  retrieveData: function () {
    var de = this.chart.dataEngine;

    this.dimensions = de.getVisibleCategories();
    var values = de.getValues();

    var dataRowIndex = de.getVisibleSeriesIndexes();
    var pCoordIndex = de.getVisibleCategoriesIndexes();

    var pCoordKeys = de.getCategories();

    // generate an array with an empty array for each non-numeric
    // dimension  (tests based on first data-row only!)
    // and a function to update the mapping
    var pCoordMapping = pCoordIndex.map(
      function(d) {return (isNaN(values[d][0])) ? 
            {len: 0, map: new Array() } : null; });
    var coordMapping = function(i, val) {

      var cMap = pCoordMapping[i];
      var k = cMap.map[val];
      if (k == null) {
        k = cMap.len;
        cMap.len++;
//pCoordMapping[i][val] = k;
        cMap.map[val] = k;
      }
/*
      for(k=0; k<cMap.length; k++)
        if (cMap[k] == val)
          return k;
      // val is not found in the map, so add it at the end of the array
      cMap[k] = val;
      */
      return k;
    };

    //   local function to transform a data-row to a hashMap
    //   (key-value pairs) 
    //   closure uses pCoordKeys and values
    var generateHashMap = function(row) {
      var record = new Object();
      for(var i in pCoordIndex) {
         record[pCoordKeys[i]] = (pCoordMapping[i]) ?
          coordMapping(i, values[i][row]) :
          values[i][row];
      }
      return record;
    }

    // generate array with a hashmap per data-row
    this.data = dataRowIndex.map(function(row) { return generateHashMap (row)})

    
    //generate a description of the parallel-coordinates
    var descrVals = this.dimensions.map(function(cat)
           {
             var item = new Object();
             // the part after "__" is assumed to be the units
             var elements = cat.split("__");
             item["name"] = elements[0];
             item["unit"] = (elements.length >1)? elements[1] : "";
             return item;
           });
    // extend the record with min, max and step
    for(var i=0; i<descrVals.length; i++) {
      var item = descrVals[i];
      var index = pCoordIndex[i];
      item["orgRowIndex"] = index;

      // determine min, max and estimate step-size
      var theMin = theMax = theMin2 = theMax2 = (pCoordMapping[index]) ?
          pCoordMapping[index].map[ values[index][0] ] :
          values[index][0];

      var len = values[index].length;
      for(var k=1; k<len; k++) {
        var v =  (pCoordMapping[index]) ?
          pCoordMapping[index].map[ values[index][k] ] :
          values[index][k];
        if (v < theMin)
        {
          theMin2 = theMin;
          theMin = v;
        }
        if (v > theMax) {
          theMax2 = theMax;
          theMax = v;
        }
      }
      var theStep = ((theMax - theMax2) + (theMin2-theMin))/2;
      item["min"] = theMin;
      item["max"] = theMax;
      item["step"] = theStep;

      // include the mapping in the 
      if (pCoordMapping[index]) {
        item["map"] = pCoordMapping[index].map;
        item["mapLength"] = pCoordMapping[index].len;
      }
    }

    // generate a object using the given set of keys and values
    //  (map from keys[i] to vals[i])
    var genKeyVal = function (keys, vals) {
       var record = new Object();
      for (var i = 0; i<keys.length; i++)
         record[keys[i]] = vals[i];
      return record;
    }
    this.dimensionDescr = genKeyVal(this.dimensions, descrVals);
    
    return;
  } ,

  create: function(){

    var myself = this;
    this.width = this._parent.width;
    this.height = this._parent.height;

    // used in the closures
    var height = this.height,
    width = this.width, 
    topRuleOffs = this.chart.options.topRuleOffset,
    botRuleOffs = this.chart.options.botRuleOffset,
    leftRuleOffs = this.chart.options.leftRuleOffset,
    rightRulePos = width - this.chart.options.rightRuleOffset,
    ruleHeight = height - topRuleOffs - botRuleOffs,
    labelTopOffs = topRuleOffs -12;

    this.pvPanel = this._parent.getPvPanel().add(this.type)
    .width(this.width)
    .height(this.height)

    this.retrieveData();

    var dims = this.dimensions;

    // getDimSc is the basis for getDimensionScale and getDimColorScale
    var getDimSc = function(t) {
      var theMin = myself.dimensionDescr[t].min;
      var theMax = myself.dimensionDescr[t].max;
      var theStep = myself.dimensionDescr[t].step;
      // add some margin at top and bottom (based on step)
      theMin -= theStep;
      theMax += theStep;
      return pv.Scale.linear(theMin, theMax)
              .range(botRuleOffs, height-topRuleOffs);
    }; 
    var getDimensionScale = function(t) {
      return getDimSc(t)
              .range(botRuleOffs, height-topRuleOffs);
    }; 
    var getDimColorScale = function(t) {
      return getDimSc(t)
              .range("steelblue", "brown");
    }; 

    var x = pv.Scale.ordinal(dims).splitFlush(leftRuleOffs, rightRulePos);
    var y = pv.dict(dims, getDimensionScale);
    var colors = pv.dict(dims, getDimColorScale);

    // Interaction state. 
    var filter = pv.dict(dims, function(t) {
      return {min: y[t].domain()[0], max: y[t].domain()[1]};  });
    var active = dims[0];   // choose the active dimension 

    var selectVisible = function(d) { return dims.every(  
            function(t) {return (d[t] >= filter[t].min) && (d[t] <= filter[t].max) }
        )};
    // set margins of the base-panel

    // The parallel coordinates display.
    this.pvPanel.add(pv.Panel)
      .data(myself.data)
      .visible(selectVisible)
      .add(pv.Line)
      .data(dims)
      .left(function(t, d) { return x(t)})
      .bottom(function(t, d) { return y[t] (d[t]);})
      .strokeStyle("#ddd")
      .lineWidth(1)
      .antialias(false);

    // Rule per dimension.
    rule = this.pvPanel.add(pv.Rule)
      .data(dims)
      .left(x)
      .top(topRuleOffs)
      .bottom(botRuleOffs);

    // Dimension label
    rule.anchor("top").add(pv.Label)
      .top(labelTopOffs)
      .font("bold 10px sans-serif")
      .text(function(d) { return myself.dimensionDescr[d].name; });

    // The parallel coordinates display.
    var change = this.pvPanel.add(pv.Panel);

    var line = change.add(pv.Panel)
      .data(myself.data)
      .visible(selectVisible)
      .add(pv.Line)
      .data(dims)
      .left(function(t, d) { return x(t);})
      .bottom(function(t, d) { return y[t](d[t]); })
      .strokeStyle(function(t, d) { return colors[active](d[active]);})
      .lineWidth(1);

    // Updater for slider and resizer.
    function update(d) {
      var t = d.dim;
      filter[t].min = Math.max(y[t].domain()[0], y[t].invert(height - d.y - d.dy));
      filter[t].max = Math.min(y[t].domain()[1], y[t].invert(height - d.y));
      active = t;
      change.render();
      return false;
    }

    // Updater for slider and resizer.
    function selectAll(d) {
      if (d.dy < 3) {  // 
        var t = d.dim;
        filter[t].min = Math.max(y[t].domain()[0], y[t].invert(0));
        filter[t].max = Math.min(y[t].domain()[1], y[t].invert(height));
        d.y = botRuleOffs; d.dy = ruleHeight;
        active = t;
        change.render();
      }
      return false;
    }

    // Handle select and drag 
    var handle = change.add(pv.Panel)
      .data(dims.map(function(dim) { return {y:botRuleOffs, dy:ruleHeight, dim:dim}; }))
      .left(function(t) { return x(t.dim) - 30; })
      .width(60)
      .fillStyle("rgba(0,0,0,.001)")
      .cursor("crosshair")
      .event("mousedown", pv.Behavior.select())
      .event("select", update)
      .event("selectend", selectAll)
      .add(pv.Bar)
      .left(25)
      .top(function(d) {return d.y;})
      .width(10)
      .height(function(d) { return d.dy;})
      .fillStyle(function(t) { return  (t.dim == active)
        ? colors[t.dim]((filter[t.dim].max + filter[t.dim].min) / 2)
        : "hsla(0,0,50%,.5)"})
      .strokeStyle("white")
      .cursor("move")
      .event("mousedown", pv.Behavior.drag())
      .event("dragstart", update)
      .event("drag", update);

    handle.anchor("bottom").add(pv.Label)
      .textBaseline("top")
      .text(function(d) { return filter[d.dim].min.toFixed(0) + myself.dimensionDescr[d.dim].unit});

    handle.anchor("top").add(pv.Label)
      .textBaseline("bottom")
      .text(function(d) {return filter[d.dim].max.toFixed(0) + myself.dimensionDescr[d.dim].unit});


    // Extend ParallelCoordinates
    this.extend(this.pvParCoord,"parCoord_");

    // Extend body
    this.extend(this.pvPanel,"chart_");


  }


});

