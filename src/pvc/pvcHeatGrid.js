/**
 * HeatGridChart is the main class for generating... heatGrid charts.
 *  A heatGrid visualizes a matrix of values by a grid (matrix) of *
 *  bars, where the color of the bar represents the actual value.
 *  By default the colors are a range of green values, where
 *  light green represents low values and dark green high values.
 *  A heatGrid contains:
 *     - two categorical axis (both on x and y-axis)
 *     - no legend as series become rows on the perpendicular axis 
 *  Please contact CvK if there are issues with HeatGrid at cde@vinzi.nl.
 */

pvc.HeatGridChart = pvc.CategoricalAbstract.extend({

    heatGridChartPanel : null,

    constructor: function(o){

        this.base(o);

	// enforce some defaults for the HeatGridChart
        this.options.legend = false;
        this.options.orthoAxisOrdinal = true;
        this.options.orginIsZero = true;

        var self = this;
        var _defaults = {
            colorValIdx: 0,
            sizeValIdx: 0,
            defaultValIdx:0,
            measuresIndexes: [2],
            //multi-dimensional clickable label
            useCompositeAxis:false,
            showValues: true,
            //originIsZero: true,
            axisOffset: 0,
            showTooltips: true,
            orientation: "vertical",
            // use a categorical here based on series labels
            scalingType: "linear",    // "normal" (distribution) or "linear"
            normPerBaseCategory: true,
            orthoAxisOrdinal: true,
            numSD: 2,                 // width (only for normal distribution)
            minColor: "white",
            maxColor: "darkgreen",
            nullColor:  "#efc5ad",  // white with a shade of orange
            xAxisClickAction: function(d){
                //self.heatGridChartPanel.selectXValue(d);
                self.heatGridChartPanel.selectAxisValue('x', d);
                self.heatGridChartPanel.pvPanel.render();
                self.heatGridChartPanel.triggerSelectionChange();
            },
            yAxisClickAction: function(d){ //TODO: move elsewhere
                //self.heatGridChartPanel.selectYValue(d);
                self.heatGridChartPanel.selectAxisValue('y', d);
                self.heatGridChartPanel.pvPanel.render();
                self.heatGridChartPanel.triggerSelectionChange();
            }
        };
        
        // Apply options
        $.extend(this.options,_defaults, o);

	// enforce some defaults for the HeatGridChart
        this.options.orthoAxisOrdinal = true;
        this.options.legend = false;
        this.options.orginIsZero = true;

    },

    preRender: function(){

        this.base();

        pvc.log("Prerendering in heatGridChart");

        this.heatGridChartPanel = new pvc.HeatGridChartPanel(this, {
            stacked: this.options.stacked,
            panelSizeRatio: this.options.panelSizeRatio,
            heatGridSizeRatio: this.options.heatGridSizeRatio,
            maxHeatGridSize: this.options.maxHeatGridSize,
            showValues: this.options.showValues,
            showTooltips: this.options.showTooltips,
            orientation: this.options.orientation
        });

        this.heatGridChartPanel.appendTo(this.basePanel); // Add it

    }

}
);


/*
 * HeatGrid chart panel. Generates a heatGrid chart. Specific options are:
 * <i>orientation</i> - horizontal or vertical. Default: vertical
 * <i>showValues</i> - Show or hide heatGrid value. Default: false
 * <i>stacked</i> -  Stacked? Default: false
 * <i>panelSizeRatio</i> - Ratio of the band occupied by the pane;. Default: 0.5 (50%)
 * <i>heatGridSizeRatio</i> - In multiple series, percentage of inner
 * band occupied by heatGrids. Default: 0.5 (50%)
 * <i>maxHeatGridSize</i> - Maximum size of a heatGrid in pixels. Default: 2000
 *
 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>heatGrid_</i> - for the actual heatGrid
 * <i>heatGridPanel_</i> - for the panel where the heatGrids sit
 * <i>heatGridLabel_</i> - for the main heatGrid label
 */


pvc.HeatGridChartPanel = pvc.BasePanel.extend({

    _parent: null,
    pvHeatGrid: null,
    pvHeatGridLabel: null,
    data: null,

    stacked: false,
    panelSizeRatio: 1,
    heatGridSizeRatio: 0.5,
    showTooltips: true,
    maxHeatGridSize: 200,
    showValues: true,
    orientation: "vertical",

    //TODO:
    colorValIdx: 0,
    sizeValIdx: 0,
    defaultValIdx:0,
    shape: "square",
    nullShape: "cross",
    defaultBorder: 0,
    nullBorder: 2,
    selectedBorder: 3,
    //function to be invoked when a selection occurs
    // (shape click-select, row/column click and lasso finished)
    onSelectionChange: null,
    
    selections: {},
    
    //measuresIndexes: [2],

    constructor: function(chart, options){

        this.base(chart,options);

    },

    getValue: function(d, i){
        if($.isArray(d)) {
            if(i != null) return d[i];
            else return d[0];
        }
        else return d;
    },
    
    getColorValue: function(d){
        return this.getValue(d, this.colorValIdx);
    },


    valuesToText: function(vals){
        if($.isArray(vals)){
            return vals.join(', ');
        }
        else return vals;
    },
//TODO: support no sizeValIdx, no color, and neither

    create: function(){

        var myself = this;
        var opts = this.chart.options;
        this.width = this._parent.width;
        this.height = this._parent.height;
        
        this.colorValIdx = opts.colorValIdx;
        this.sizeValIdx = opts.sizeValIdx;
        
        //TODO:
        if(opts.shape != null) {this.shape = opts.shape;}
        
        //event triggering
        this.onSelectionChange = opts.onSelectionChange;

        this.pvPanel = this._parent.getPvPanel().add(this.type)
            .width(this.width)
            .height(this.height);

        var anchor = this.orientation == "vertical"?"bottom":"left";

        // reuse the existings scales
        var xScale = this.chart.xAxisPanel.scale;
        var yScale = this.chart.yAxisPanel.scale;
        
        var cols =  (anchor == "bottom") ? xScale.domain() : yScale.domain();

        var origData = this.chart.dataEngine.getVisibleTransposedValues();
        // create a mapping of the data that shows the columns (rows)
        data = origData.map(function(d){
            return pv.dict(cols, function(){
                return  d[this.index];
            });
        });
        //data.reverse();  // the colums are build from top to bottom --> nope, bottom to top, left to right now

        // get an array of scaling functions (one per column)
        var fill = this.getColorScale(data, cols);

        /* The cell dimensions. */
        var w = (xScale.max - xScale.min)/xScale.domain().length;
        var h = (yScale.max - yScale.min)/yScale.domain().length;

        if (anchor != "bottom") {
            var tmp = w;
            w = h;
            h = tmp;
        }
        
        //reset selections
        this.initSelections(false);

        this.pvHeatGrid = this.pvPanel.add(pv.Panel)
            .data(cols)
            [pvc.BasePanel.relativeAnchor[anchor]](function(){ //ex: datum.left(i=1 * w=15)
                return this.index * w;
                })
            [pvc.BasePanel.parallelLength[anchor]](w)
            .add(pv.Panel)
            .data(data)
            //[pvc.BasePanel.oppositeAnchor[anchor]]
            [anchor]
            (function(){
                return this.index * h;
            })
            [pvc.BasePanel.orthogonalLength[anchor]](h)
            .antialias(false)
            .strokeStyle("white")
            .overflow('hidden'); //overflow important if showValues=true
        
        
        //tooltip text
         this.pvHeatGrid.text(function(d,f){
              return myself.getValue(d[f]);
         });
         
        //set coloring and shape / sizes if enabled
       if(opts.useShapes){
            //total max in data
            var maxVal = pv.max(data, function(datum){// {col:value ..}
                return pv.max( pv.values(datum).map(
                    function(d){ return myself.getValue(d, myself.sizeValIdx);})) ;
            });

            var maxRadius = Math.min(w,h) / 2 -1;//-2
            var maxArea = maxRadius * maxRadius ;//not *4, apparently treats as circle area even if square
            
            var valueToRadius = function(value){
                return value != null ? value/maxVal * maxRadius : Math.min(maxRadius,5) ;//TODO:hcoded
            };
            
            var valueToArea =  function(value){//
                return value != null ? value/maxVal * maxArea : Math.max(4,maxArea/16);//TODO:hcoded
            }
            
            var valueToColor = function(value, i){
                return  (value != null) ? fill[i](value) : opts.nullColor;
            };
            //this.pvPanel.def("selectCount", myself.getSelections().length);//TODO: remove selectCount
            
            this.shapes =
                this.pvHeatGrid
                    .add(pv.Dot)
                    .def("selected", function(){
                        var s = myself.chart.dataEngine.getSeries()[this.parent.index];
                        var c = myself.chart.dataEngine.getCategories()[this.parent.parent.index];
                        return myself.isSelected(s,c);
                    })
                    .shape( function(r, ra ,i){
                        if(myself.sizeValIdx == null){
                            return myself.shape;
                        }
                        return myself.getValue(r[i]) != null ? myself.shape : myself.nullShape;
                    })
                    .shapeSize(function(r,ra, i) {
                        if(myself.sizeValIdx == null){
                            return maxArea;
                        }
                        return valueToArea(myself.getValue(r[i], myself.sizeValIdx));
                    })
                    .fillStyle(function(r, ra, i){
                        //return valueToColor(r[i], i);
                        var color = opts.nullColor;
                        if(myself.colorValIdx != null ){
                            if(myself.getColorValue(r[i]) == null) return opts.nullColor;
                            color =  fill[i](myself.getColorValue(r[i]));
                            var s = myself.chart.dataEngine.getSeries()[this.parent.index];
                            var c = myself.chart.dataEngine.getCategories()[this.parent.parent.index]; 
                            if(myself.getSelectCount() > 0 && !this.selected()){// !myself.isSelected(s,c)){ 
                                //var gScale = color.r + color.g + color.b;
                                //gScale = Math.floor(gScale / 3);
                                //return new pv.rgb(gScale, gScale, gScale, 0.5);
                                return color.alpha(0.5);
                            }
                        }
                        return color;
                    })
                    .cursor("pointer") //TODO:
                    .lineWidth(function(r, ra, i)
                    {
                        return this.selected()? myself.selectedBorder :
                                                ( (myself.sizeValIdx == null ||
                                                   myself.getValue(r[i], myself.sizeValIdx) != null )?
                                                        myself.defaultBorder :
                                                        myself.nullBorder);
                    })
                    .strokeStyle(function(r, ra, i){
                        return (this.selected() ||
                                myself.sizeValIdx == null ||
                                myself.getValue(r[i], myself.sizeValIdx) != null )?
                                         "black" :
                                         (myself.colorValIdx != null)?
                                            (myself.getColorValue(r[i]))?
                                                fill[i](myself.getColorValue(r[i])) :
                                                opts.nullColor :
                                            opts.nullColor;
                    })
                    .text(function(r,ra,i){
                        return myself.valuesToText(r[i]);
                    })
                    .event("click", function(r,ra,i) {
                        //this.selected(!this.selected());
                        //myself.pvPanel.selectCount( myself.pvPanel.selectCount() + (this.selected() ? 1 : -1) );
                        var s = myself.chart.dataEngine.getSeries()[this.parent.index];
                        var c = myself.chart.dataEngine.getCategories()[this.parent.parent.index];
                        var d = r[i];
                        myself.toggleSelection(s,c);
                        myself.triggerSelectionChange();
                        //classic clickAction
                        if($.isArray(d)) d= d[0];
                        if(typeof(myself.chart.options.clickAction) == 'function'){
                            myself.chart.options.clickAction(s,c,d);
                        }
                        myself.pvPanel.render();
                    });
       }
       else
       {//no shapes, apply color map to panel iself
        this.pvHeatGrid.fillStyle(function(dat, col){
             return  (dat[col] != null) ? fill[col](dat[col]) : opts.nullColor;
         });
       }

        // NO SUPPORT for overflow and underflow on HeatGrids

        // NO SUPPORT for SecondAxis on HeatGrids (does not make sense)

        // Labels:

        if(this.showTooltips){
            this.pvHeatGrid
            .event("mouseover", pv.Behavior.tipsy({
                gravity: "s",
                fade: true
            }));
        }

        if (opts.clickable){
            this.pvHeatGrid
            .cursor("pointer")
            .event("click",function(row, rowCol){
                var s = myself.chart.dataEngine.getSeries()[myself.stacked?this.parent.index:this.index]
                var c = myself.chart.dataEngine.getCategories()[myself.stacked?this.index:this.parent.index]
                var d = row[rowCol];
                return myself.chart.options.clickAction(s,c,d);
            });
        }

        if(this.showValues)
        {
            var myself = this;
            var getValue = function(row, rowAgain, rowCol){
                return row[rowCol];
            };
            this.pvHeatGridLabel = this.pvHeatGrid
            .anchor("center")
            .add(pv.Label)
            .bottom(0)
            .text(getValue);
            // Extend heatGridLabel
            this.extend(this.pvHeatGridLabel,"heatGridLabel_");
        }

        // Extend heatGrid and heatGridPanel
        this.extend(this.pvHeatGrid,"heatGridPanel_");
        this.extend(this.pvHeatGrid,"heatGrid_");

        // Extend body
        this.extend(this.pvPanel,"chart_");
    },
    
    
    /*
     *selections - testing (start)
     *TODO: transient, will have to change selection storage
     */
    
    initSelections:function(defaultValue){
      this.selections = {};
      var series = this.chart.dataEngine.getSeries();
      var cats = this.chart.dataEngine.getCategories();
        for(var i = 0; i < series.length; i++ ){
            this.selections[series[i]] = {};
            for(var j = 0; j < cats.length; j++ ){
                this.selections[series[i]][cats[j]] = defaultValue;
            }
      }
    },
    
    isSelected: function(s,c){
      return this.selections[s] ?
        this.selections[s][c] :
        false;
    },
    
    addSelection: function(s,c){
      if(!this.selections[s]) this.selections[s] = {};
      this.selections[s][c] = true;
    },
    
    removeSelection: function(s,c){
      if(this.selections[s]){
        this.selections[s][c] = false;
      }
    },
    
    toggleSelection: function(s,c){
        if(this.isSelected(s,c)) this.removeSelection(s,c);
        else this.addSelection(s,c);
    },
    
    getSelections: function(){
        return pv.flatten(this.selections).key("series").key("category").key("selected")
            .array().filter(function(d) { return d.selected; });
    },
    
    setSelections: function(selections){
        this.selections = {};
        for(var i=0;i<selections.length;i++){
            this.addSelection(selections[i].series, selections[i].category);
        }
    },
    
    selectSeries: function(s){
        var cats = this.chart.dataEngine.getCategories();
        for(var i = 0; i < cats.length; i++ ){
            this.selections[s][cats[i]] = true;
        }
    },
    
    selectCategories: function(c){
        var series = this.chart.dataEngine.getSeries();
        for(var i = 0; i < series.length; i++ ){
            //this.selections[series[i]][c] = true;
            this.addSelection(series[i],c);
        }
    },
    
    selectAxisValue: function(axis, axisValue)
    {
        var type = (this.orientation == 'horizontal')?
            ((axis == 'x')? 's' : 'c') :
            ((axis == 'x')? 'c' : 's')
            
        if(this.chart.options.useCompositeAxis)
        {
            if(type =='c'){ this.toggleCategoriesHierarchy(axisValue); }
            else { this.toggleSeriesHierarchy(axisValue); }
        }
        else
        {
            if(type =='c'){ this.toggleCategories(axisValue); }
            else { this.toggleSeries(axisValue); }
        }
    },
    
    //ex.: arrayStartsWith(['EMEA','UK','London'], ['EMEA']) -> true
    arrayStartsWith: function(array, base)
    {
        if(array.length < base.length) { return false; }
        
        for(var i=0; i<base.length;i++){
            if(base[i] != array[i]) {
                return false;
            }
        }
        return true;
    },
    
    toggleCategoriesHierarchy: function(cbase){
        if(this.selectCategoriesHierarchy(cbase)){
            this.deselectCategoriesHierarchy(cbase);
        }
    },
    
    toggleSeriesHierarchy: function(sbase){
        if(this.selectSeriesHierarchy(sbase)){
            this.deselectSeriesHierarchy(sbase);
        }
    },
    
    //returns bool wereAllSelected
    selectCategoriesHierarchy: function(cbase){
        var categories = this.chart.dataEngine.getCategories();
        var selected = true;
        for(var i =0; i< categories.length ; i++){
            var c = categories[i];
            if( this.arrayStartsWith(c, cbase) ){
                selected &= this.selectCategory(c);
            }
        }
        return selected;
    },
    
    selectSeriesHierarchy: function(sbase){
        var series = this.chart.dataEngine.getSeries();
        var selected = true;
        for(var i =0; i< series.length ; i++){
            var s = series[i];
            if( this.arrayStartsWith(s, sbase) ){
                selected &= this.selectSeries(s);
            }
        }
        return selected;
    },
    
    deselectCategoriesHierarchy: function(cbase){
        var categories = this.chart.dataEngine.getCategories();
        for(var i =0; i< categories.length ; i++){
            var c = categories[i];
            if( this.arrayStartsWith(c, cbase) ){
                this.deselectCategory(c);
            }
        }
    },
    
    deselectSeriesHierarchy: function(sbase){
        var series = this.chart.dataEngine.getSeries();
        for(var i =0; i< series.length ; i++){
            var s = series[i];
            if( this.arrayStartsWith(s, sbase) ){
                this.deselectSeries(s);
            }
        }
    },
    
    //returns bool wereAllSelected
    selectCategory: function(c){
        var series = this.chart.dataEngine.getSeries();
        var wereAllSelected = true;
        for(var i = 0; i < series.length; i++ ){
            var s = series[i];
            wereAllSelected &= this.isSelected(s,c);
            this.addSelection(s,c);
        }
        return wereAllSelected;
    },
    
    selectSeries: function(s){
        var categories = this.chart.dataEngine.getCategories();
        var wereAllSelected = true;
        for(var i = 0; i < categories.length; i++ ){
            var c = categories[i];
            wereAllSelected &= this.isSelected(s,c);
            this.addSelection(s,c);
        }
        return wereAllSelected;
    },
    
    deselectCategory: function(c){
        var series = this.chart.dataEngine.getSeries();
        for(var i = 0; i < series.length; i++ ){
            this.removeSelection(series[i],c);
        }
    },

    deselectSeries: function(s){
        var categories = this.chart.dataEngine.getCategories();
        for(var i = 0; i < categories.length; i++ ){
            this.removeSelection(s, categories[i]);
        }
    },
    
    //pseudo-toggle elements with category c:
    // deselect all if all selected, otherwise select all
    toggleCategories: function(c){
        var series = this.chart.dataEngine.getSeries();
        var selected = this.selectCategory(c);
        if(selected){
            this.deselectCategory(c);
        }
    },
    
    //pseudo-toggle elements with series s:
    // deselect all if all selected, otherwise select all
    toggleSeries: function(s){
        var categories = this.chart.dataEngine.getCategories();
        var selected = this.selectSeries(s);
        if(selected){
            this.deselectSeries(s);
        }
    },
    
    getSelectCount: function(){
        return this.getSelections().length;
    },
    
    triggerSelectionChange: function(){
        if(typeof(this.onSelectionChange) == 'function'){
            var selections = this.getSelections();
            this.onSelectionChange(selections);
        }
    },
    
    /*
     *selections - testing (end)
     */
    
    /**
     * Get label color that will contrast with given bg color
     */
    getLabelColor: function(r, g, b){
        var brightness = (r*299 + g*587 + b*114) / 1000;
        if (brightness > 125) {
            return '#000000';
        } else {
            return '#ffffff';
        }
    },
    
    
    //mergeMeasureValues: function(rows, measureIndexes){
    //    var newRows = [];
    //    for(var i=0; i< rows.length; i++){
    //        var row = rows[i];
    //        var newRow = [];
    //        var measures = [];
    //        for(var col=0; col < row.length; col++){
    //            //TODO: improve
    //            if(measureIndexes.indexOf(col) < 0){
    //                newRow.push(row[col]);
    //            }
    //            else measures.push(row[col]);
    //        }
    //        newRow.push(measures);
    //        newRows.push(newRow);
    //    }
    //    return newRows;
    //},
    
  
  /***********
   * compute an array of fill-functions. Each column out of "cols" 
   * gets it's own scale function assigned to compute the color
   * for a value. Currently supported scales are:
   *    -  linear (from min to max
   *    -  normal distributed from   -numSD*sd to  numSD*sd 
   *         (where sd is the standards deviation)
   ********/
  getColorScale: function(data, cols) {
      switch (this.chart.options.scalingType) {
      case "normal": return this.getNormalColorScale(data, cols, this.colorValIdx);//TODO:
      case "linear": return this.getLinearColorScale(data, cols, this.colorValIdx);
      default:
        throw "Invalid option " + this.scaleType + " in HeatGrid";
    }
  },

  getLinearColorScale: function (data, cols, colorIdx){
    var fill;
    var opts = this.chart.options;
    // compute the mean and standard-deviation for each column
    var myself = this;
    var min = pv.dict(cols, function(f){
      return pv.min(data, function(d){
        return myself.getValue(d[f],colorIdx);
      });
    });
    var max = pv.dict(cols, function(f){
      return pv.max(data, function(d){
        return myself.getValue(d[f], colorIdx);
      });
    });

    if (opts.normPerBaseCategory)  //  compute a scale-function for each column (each key
      fill = pv.dict(cols, function(f){
        return pv.Scale.linear()
          .domain(min[f], max[f])
          .range(opts.minColor, opts.maxColor);
      });
    else {   // normalize over the whole array
      var theMin = min[cols[0]];
      for (var i=1; i<cols.length; i++) {
        if (min[cols[i]] < theMin) theMin = min[cols[i]];
      }
      var theMax = max[cols[0]];
      for (var i=1; i<cols.length; i++){
        if (max[cols[i]] > theMax) theMax = max[cols[i]];
      }
      var scale = pv.Scale.linear()
        .domain(theMin, theMax)
        .range(opts.minColor, opts.maxColor);
      fill = pv.dict(cols, function(f){
        return scale;
      });
    }

    return fill;  // run an array of values to compute the colors per column
  },

  getNormalColorScale: function (data, cols){
    var fill;
    var opts = this.chart.options;
    if (opts.normPerBaseCategory) {
      // compute the mean and standard-deviation for each column
      var myself = this;
      var mean = pv.dict(cols, function(f){
        return pv.mean(data, function(d){
          return myself.getValue(d[f]);
        })
      });
      var sd = pv.dict(cols, function(f){
        return pv.deviation(data, function(d){
          myself.getValue(d[f]);
        })
      });
      //  compute a scale-function for each column (each key)
      fill = pv.dict(cols, function(f){
        return pv.Scale.linear()
          .domain(-opts.numSD * sd[f] + mean[f],
                  opts.numSD * sd[f] + mean[f])
          .range(opts.minColor, opts.maxColor);
      });
    } else {   // normalize over the whole array
      var mean = 0.0, sd = 0.0, count = 0;
      for (var i=0; i<origData.length; i++)
        for(var j=0; j<origData[i].length; j++)
          if (origData[i][j] != null){
            mean += origData[i][j];
            count++;
          }
      mean /= count;
      for (var i=0; i<origData.length; i++){
        for(var j=0; j<origData[i].length; j++){
          if (origData[i][j] != null){
            var variance = origData[i][j] - mean;
            sd += variance*variance;
          }
        }
      }
      sd /= count;
      sd = Math.sqrt(sd);
      
      var scale = pv.Scale.linear()
        .domain(-opts.numSD * sd + mean,
                opts.numSD * sd + mean)
        .range(opts.minColor, opts.maxColor);
      fill = pv.dict(cols, function(f){
        return scale;
      });
    }

    return fill;  // run an array of values to compute the colors per column
}


});
