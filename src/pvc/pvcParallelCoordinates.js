
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
    };


    // Apply options
    $.extend(this.options,_defaults, o);


  },

  preRender: function(){

    this.base();

    pvc.log("Prerendering in parallelCoordinates");


    this.parCoordPanel = new pvc.ParCoordPanel(this, {
      innerGap: this.options.innerGap,
      explodedSliceRadius: this.options.explodedSliceRadius,
      explodedSliceIndex: this.options.explodedSliceIndex,
      showValues: this.options.showValues,
      showTooltips: this.options.showTooltips
    });

    this.parCoordPanel.appendTo(this.basePanel); // Add it

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
//  pvPieLabel: null,
//  data: null,


//  units : null,
/*
{
      cyl: {name: "cylinders", unit: ""},
      dsp: {name: "displacement", unit: " sq in"},
      lbs: {name: "weight", unit: " lbs"},
      hp: {name: "horsepower", unit: " hp"},
      acc: {name: "acceleration (0-60 mph)", unit: " sec"},
      mpg: {name: "mileage", unit: " mpg"},
      year: {name: "year", unit: ""}
    },
    */

  categories: null, 
  data: null,

  units: null,

  constructor: function(chart, options){

    this.base(chart,options);

  },

  retrieveData: function () {
    var de = this.chart.dataEngine;

//    this.series = de.getVisibleSeries();
    this.categories = de.getVisibleCategories();
    var data = de.getValues();

    var serieIndex = de.getVisibleSeriesIndexes();
    var catIndex = de.getVisibleCategoriesIndexes();
//    var catValues = de.getVisibleValuesForCategoryIndex(cat[0]);
    var keys = de.getCategories();

    //  possibly inline this code
    var generateHash = function(keys, data, index) {
      var record = new Object();
      for(var i in catIndex) 
        record[keys[i]] = data[i][index]

      return record;
    }

    this.data = serieIndex.map(function(si) { return generateHash (keys, data, si)})

    var genKeyVal = function (keys, values) {
       var record = new Object();
      for (var i = 0; i<keys.length; i++)
         record[keys[i]] = values[i];
      return record;
    }
    
    //generate a describtion of the units
    this.units = genKeyVal(this.categories, this.categories.map(function(cat)
           {
             var item = new Object();
             item["name"] = cat;
             item["unit"] = "";
             return item;
           }));
    


    return;
  } ,

  create: function(){

//    this.data = cars;

    var myself=this;
    this.width = this._parent.width;
    this.height = this._parent.height;

    // used in the closures
    height = this.height;
    width = this.width; 

    this.pvPanel = this._parent.getPvPanel().add(this.type)
    .width(this.width)
    .height(this.height)

    this.retrieveData();

//    var dims = pv.keys(this.categories);
    var dims = this.categories;

    var left = this.width/(this.categories.length +1);
    var right = left * this.categories.length;
    var fudge = 0.5,     // extra space over top and under bottom
//    x = pv.Scale.ordinal(dims).splitFlush(0, this.width),
    x = pv.Scale.ordinal(dims).splitFlush(left, right),
    y = pv.dict(dims, function(t) pv.Scale.linear(
      myself.data.filter(function(d) { return !isNaN(d[t]); }),
      function(d) { var res = Math.floor(d[t]) - fudge;
              return res;
           },
      function(d) { return Math.ceil(d[t]) + fudge;}
        ).range(0, height)),
    colors = pv.dict(dims, function(t) pv.Scale.linear(
      myself.data.filter(function(d) { return !isNaN(d[t]); }),
      function(d) { return Math.floor(d[t]) - fudge;},
      function(d) { return Math.ceil(d[t]) +  fudge;}
        ).range("steelblue", "brown"));

    // Interaction state. 
    var filter = pv.dict(dims, function(t) {
      return {min: y[t].domain()[0], max: y[t].domain()[1]};  });
    var active = dims[0];   // choose the active dimension 

    // set margins of the base-panel
    this.pvPanel
      .left(30)
      .right(30)
      .top(30)
      .bottom(20);

    // The parallel coordinates display.
    this.pvPanel.add(pv.Panel)
      .data(myself.data)
      .visible(function(d) { return dims.every(function(t)
        (d[t] >= filter[t].min) && (d[t] <= filter[t].max))})
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
      .left(x);

    // Dimension label
    rule.anchor("top").add(pv.Label)
      .top(-12)
      .font("bold 10px sans-serif")
      .text(function(d) { return myself.units[d].name; });

    // The parallel coordinates display.
    var change = this.pvPanel.add(pv.Panel);

    var line = change.add(pv.Panel)
      .data(myself.data)
      .visible(function(d) { return dims.every(function(t)
         (d[t] >= filter[t].min) && (d[t] <= filter[t].max))})
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
      if (d.dy < 3) {
        var t = d.dim;
        filter[t].min = Math.max(y[t].domain()[0], y[t].invert(0));
        filter[t].max = Math.min(y[t].domain()[1], y[t].invert(height));
        d.y = 0; d.dy = height;
        active = t;
        change.render();
      }
      return false;
    }

    // Handle select and drag 
    var handle = change.add(pv.Panel)
      .data(dims.map(function(dim) { return {y:0, dy:height, dim:dim}; }))
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
      .text(function(d) { return filter[d.dim].min.toFixed(0) + myself.units[d.dim].unit});

    handle.anchor("top").add(pv.Label)
      .textBaseline("bottom")
      .text(function(d) {return filter[d.dim].max.toFixed(0) + myself.units[d.dim].unit});


    // Extend pie
    this.extend(this.pvParCoord,"parCoord_");

    // Extend body
    this.extend(this.pvPanel,"chart_");


  }


});

