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
            xAxisClickAction: function(item, event){//TODO: selectMode
                //self.heatGridChartPanel.selectXValue(d);
                self.heatGridChartPanel.selectAxisValue('x', item, event.ctrlKey);
                self.heatGridChartPanel.pvPanel.render();
                self.heatGridChartPanel.triggerSelectionChange();
            },
            yAxisClickAction: function(item, event){ //TODO: move elsewhere?
                //self.heatGridChartPanel.selectYValue(d);
                self.heatGridChartPanel.selectAxisValue('y', item, event.ctrlKey);
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

        //make selectable
        

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
    selectedBorder: 2,
    //function to be invoked when a selection occurs
    // (shape click-select, row/column click and lasso finished)
    onSelectionChange: null,
    selectNullValues: false,
    
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

    create: function(){

        var myself = this;
        var opts = this.chart.options;
        this.width = this._parent.width;
        this.height = this._parent.height;
        
        this.colorValIdx = opts.colorValIdx;
        this.sizeValIdx = opts.sizeValIdx;
        this.selectNullValues = opts.nullShape != null;
        
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

        if (anchor != "bottom") {//TODO: remove and change composite axis labels!
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
            
            .strokeStyle(null)//TODO: issue with categorical axis default label
            .lineWidth(0)
            .overflow('hidden'); //overflow important if showValues=true
        
        //tooltip text
         this.pvHeatGrid.text(function(d,f){
              return myself.getValue(d[f]);
         });
         
        //set coloring and shape / sizes if enabled
       if(opts.useShapes)
       {
            this.createHeatMap(w,h, opts, fill);
       }
       else
       {//no shapes, apply color map to panel iself
        this.pvHeatGrid.fillStyle(function(dat, col){
             return  (dat[col] != null) ? fill[col](dat[col]) : opts.nullColor;
         });
       }

        //Tooltip
        if(this.showTooltips){
            this.pvHeatGrid
            .event("mouseover", pv.Behavior.tipsy({
                gravity: "s",
                fade: true
            }));
        }

        //clickAction
        if (opts.clickable) {//custom clickAction
            this.pvHeatGrid
            .cursor("pointer")
            .event("click",function(row, rowCol){//TODO: mouse event?
                var s = myself.chart.dataEngine.getSeries()[myself.stacked?this.parent.index:this.index]
                var c = myself.chart.dataEngine.getCategories()[myself.stacked?this.index:this.parent.index]
                var d = row[rowCol];
                return myself.chart.options.clickAction(s,c,d);
            });
        }

        //showValues
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
    
    inRubberBandSelection: function(x,y){
        if(!this.rubberBand) { return false; }
        
        var r = this.rubberBand;
        return  x > r.x && x < r.x + r.dx &&
                y > r.y && y < r.y + r.dy ;
        
    },
    
    /**
     * Add rubberband functionality to main panel (includes axis)
     **/
    createSelectOverlay : function(w,h)
    {
        //TODO: flip support: parallelLength etc..
        var opts = this.chart.options;
        this.rubberBand = {x:0, y:0, dx:4, dy:4};
        var myself = this;
        
        var dMin= Math.min(w,h) /2;
        
        var isSelecting = false;
        var checkSelections = false;
        var selectFill = 'rgba(255, 127, 0, 0.15)';
        var selectStroke = 'rgb(255,127,0)';
        var invisibleFill = 'rgba(127,127,127,0.01)';
        
        
        var dispatchRubberBandSelection = function(rb, ev)
        {//do the rubber band
            var xAxis = myself.chart.xAxisPanel;
            var yAxis = myself.chart.yAxisPanel;
            
            var opts = myself.chart.options;
            
            var positions = ['top','left', 'bottom', 'right'];
            var setPositions = function(position, len){
              var obj ={};
              for(var i=0; i< positions.length;i++){
                if(positions[i] == position){
                    obj[positions[i]] = len;
                }
                else {
                    obj[positions[i]] = 0;
                }
              }
              return obj;
            };
            
            //get offsets
            var titleOffset;
            if(opts.title){
                titleOffset = setPositions(opts.titlePosition, myself.chart.titlePanel.titleSize);
            }
            else {
                titleOffset = setPositions();
            }
            var xAxisOffset = setPositions(opts.xAxisPosition, myself.chart.xAxisPanel.height);
            var yAxisOffset = setPositions(opts.yAxisPosition, myself.chart.yAxisPanel.width);
            
            var y = 0, x=0;   
            //1) x axis
            var xSelections = []
            if(opts.useCompositeAxis){
                y = rb.y - titleOffset['top'] ;
                if(opts.xAxisPosition == 'bottom'){//chart
                    y -= myself.height;
                }
                x = rb.x - titleOffset['left'] - yAxisOffset['left'];
                xSelections =  myself.chart.xAxisPanel.getAreaSelections(x, y, rb.dx, rb.dy);
            }
                        
            //2) y axis
            var ySelections = [];
            if(opts.useCompositeAxis){
                y = rb.y - titleOffset['top'] - xAxisOffset['top'];//- xAxisOffset['top'];
                x = rb.x - titleOffset['left'];
                if(opts.yAxisPosition == 'right'){//chart
                    x -= myself.width;
                }
                ySelections = myself.chart.yAxisPanel.getAreaSelections(x, y, rb.dx, rb.dy);
            }
            
            if(!ev.ctrlKey){
                myself.clearSelections();
            }
            
            if( ySelections.length > 0 && xSelections.length > 0 )
            {//intersection
                var series = myself.chart.dataEngine.getSeries();
                var categories = myself.chart.dataEngine.getCategories();
                var selectedSeries = [], selectedCategories = [],
                    sSelections, cSelections;
                if(this.orientation == 'horizontal'){
                    sSelections = xSelections;
                    cSelections = ySelections;
                }
                else {
                    sSelections = ySelections;
                    cSelections = xSelections;                    
                }
                //expand selections
                for(var i=0;i<sSelections.length;i++)
                {
                    var s = sSelections[i];
                    for(var j=0;j<series.length; j++){
                        if( myself.arrayStartsWith(series[j], s)){
                            selectedSeries.push(series[j]);
                        }
                    }
                }
                for(var i=0;i<cSelections.length;i++)
                {
                    var c = cSelections[i];
                    for(var j=0;j<categories.length; j++){
                        if( myself.arrayStartsWith(categories[j], c)){
                            selectedCategories.push(categories[j]);
                        }
                    }
                }
                //intersection
                for(var i=0;i<selectedSeries.length;i++)
                {
                    var s = selectedSeries[i];
                    for(var j=0; j<selectedCategories.length; j++)
                    {
                        var c = selectedCategories[j];
                        myself.addSelection(s,c);
                    }
                }
            }
            else if(ySelections.length == 0 && xSelections.length == 0)
            {//if there are label selections, they already include any chart selections
                //3) Chart: translate coordinates (drawn bottom-up)
                //first get offsets
                y = rb.y -titleOffset['top'] - xAxisOffset['top'];
                x = rb.x - titleOffset['left'] - yAxisOffset['left'];
                //top->bottom
                y = myself.height -y -rb.dy;
                myself.rubberBand.x = x;
                myself.rubberBand.y = y;

                myself.setRubberbandSelections(myself.rubberBand,w,h);            
            }
            else
            {
                for(var i=0; i<xSelections.length; i++){
                    myself.chart.heatGridChartPanel.selectAxisValue('x', xSelections[i]);
                }
                for(var i=0; i<ySelections.length; i++){
                    myself.chart.heatGridChartPanel.selectAxisValue('y', ySelections[i]);
                }
            }

            myself.shapes.render();
            myself.chart.heatGridChartPanel.triggerSelectionChange();
            
        };
        
        //rubber band display
        this.selectBar = this.pvPanel.root//TODO
           .add(pv.Bar)
                .visible(function() {return isSelecting;} )
                .left(function(d) { return d.x; })
                .top(function(d) { return d.y;})
                .width(function(d) { return d.dx;})
                .height(function(d) { return d.dy;})
                .fillStyle(selectFill)
                .strokeStyle(selectStroke);
                
        //rubber band selection behavior definition
        if(!opts.extensionPoints ||
           !opts.extensionPoints.base_fillStyle)
        {
            this.pvPanel.root.fillStyle(invisibleFill);
        }
        
        this.pvPanel.root//TODO
            .data([this.rubberBand])
           //.fillStyle(invisibleFill)
            .event("click", function(d, e) {
                if(!e.ctrlKey){
                    myself.clearSelections();
                    myself.shapes.render();
                }
            })
            .event('mousedown', pv.Behavior.selector(false))
            .event('selectstart', function(d){
                isSelecting = true;
               // myself.selectBar.render();
            })
            .event('select', function(rb){
                
                myself.rubberBand = rb;
                if(isSelecting && (rb.dx > dMin || rb.dy > dMin)){
                    checkSelections  =true;
                    myself.selectBar.render();
                }
            })
            .event('selectend', function(rb, mouseEvent){
                if(isSelecting){
                    isSelecting = false;
                    //translate top to bottom
                    if(checkSelections){
                        checkSelections = false;
                        myself.selectBar.render();//TODO: update coordinates
                        dispatchRubberBandSelection(rb, mouseEvent);
                    }
                }
            });
    },
    
    setRubberbandSelections: function(rb,w,h)
    {
        var series = this.chart.dataEngine.getSeries();
        var categories = this.chart.dataEngine.getCategories();
        
        var sSel = [];
        var cSel = [];
        
        //find included series/categories
        for(var i=0; i< series.length; i++){
            var y = i*h + h/2;
            if(y > rb.y && y < rb.y + rb.dy){
                sSel.push(series[i]);
            }
        }
        for(var i=0; i< categories.length; i++){
            var x = i*w + w/2;
            if(x > rb.x && x < rb.x + rb.dx){
                cSel.push(categories[i]);
            }
        }
        
        //select shapes in intersection
        for(var i=0; i< sSel.length; i++){
            var s = sSel[i];
            for(var j=0; j<cSel.length; j++){
                var c = cSel[j];
                //if(this.chart.options.nullShape != null || //TODO: select or not null values
                //   )
                this.addSelection(s,c);
            }
        }
    },
    
    //createSelectOverlay2: function(){
    //  var opts = this.chart.options;
    //  
    //  this.rubberBand = null;
    //  var myself = this;
    //  function update(d, t) {
    //    myself.rubberBand = d;
    //     //this.render();
    //     // myself.pvPanel.render();
    //    //this.render();
    //    myself.selectionBar.render();
    //    //myself.shapes.render();
    //  };
    //  
    //  var underSelection = false;
    //  //this.pvPanel.reverse(true);
    //  
    //  this.selectOverlay = this.pvPanel//.add(pv.Panel)
    //    .data([{x:0, y:0, dx:50, dy:50}]) //dimensions that will be updated by pv.Behavior
    //    //.cursor('default')
    //    //.width(this.width)
    //    //.height(this.height)
    //    .fillStyle("rgba(127,127,0,.15)")
    //    .event('mousedown', pv.Behavior.selector(false))
    //    .event('selectstart', function(d){
    //       rubberBand = null;
    //    })
    //    .event('select', update)
    //    .event('selectend', function(d){
    //        myself.rubberBand = null;
    //        myself.selectionBar.render();
    //    });
    //    
    //   this.selectionBar = this.selectOverlay
    //    .add(pv.Bar)
    //        .visible(function(d, k, t) {
    //          return myself.rubberBand != null;
    //        })
    //        .left(function(d) d.x)
    //        .top(function(d) d.y)
    //        .width(function(d) d.dx)
    //        .height(function(d) d.dy)
    //        .fillStyle("rgba(255,127,0,.15)")
    //        .strokeStyle("orange")
    //  ;
    // // this.selectOverlay.render();
    //  
    //},
    
    //creates new version
    createHeatMap: function(w, h, opts, fill)
    {
        var myself = this;
        //total max in data
        var maxVal = pv.max(data, function(datum){// {col:value ..}
            return pv.max( pv.values(datum).map(
                function(d){ return myself.getValue(d, myself.sizeValIdx);})) ;
        });
    
        var maxRadius = Math.min(w,h) / 2 -2;
        var maxArea = maxRadius * maxRadius ;// apparently treats as square area even if circle, triangle is different
        
        var valueToRadius = function(value){
            return value != null ? value/maxVal * maxRadius : Math.min(maxRadius,5) ;//TODO:hcoded
        };
        
        var valueToArea =  function(value){//
            return value != null ? value/maxVal * maxArea :  Math.max(4,maxArea/16);//TODO:hcoded
        }
        
        var valueToColor = function(value, i){
            return  (value != null) ? fill[i](value) : opts.nullColor;
        };
        
        this.shapes =
            this.pvHeatGrid
                .add(pv.Dot)
                .def("selected", function(){
                    var s = myself.chart.dataEngine.getSeries()[this.parent.index];
                    var c = myself.chart.dataEngine.getCategories()[this.parent.parent.index];
                    return  myself.isSelected(s,c);
                })
                .shape( function(r, ra ,i){
                    if(opts.sizeValIdx == null){
                        return myself.shape;
                    }
                    return myself.getValue(r[i]) != null ? myself.shape : opts.nullShape;
                })
                .shapeSize(function(r,ra, i) {
                    if(myself.sizeValIdx == null){
                        return maxArea;
                    }
                    var val = myself.getValue(r[i], myself.sizeValIdx);
                    return (val == null && opts.nullShape == null)?
                        0 :
                        valueToArea(myself.getValue(r[i], myself.sizeValIdx));
                })
                .fillStyle(function(r, ra, i){
                    //return valueToColor(r[i], i);
                    var color = opts.nullColor;
                    if(myself.colorValIdx != null ){
                        if(myself.getColorValue(r[i]) == null) return opts.nullColor;
                        color =  fill[i](myself.getColorValue(r[i]));
                        var s = myself.chart.dataEngine.getSeries()[this.parent.index];
                        var c = myself.chart.dataEngine.getCategories()[this.parent.parent.index]; 
                        if(myself.getSelectCount() > 0 && !this.selected()){
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
                                                    myself.defaultBorder : //0 hcoded?
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
                .event("click", function(r,ra,i,n1,n2,e) {
                    var s = myself.chart.dataEngine.getSeries()[this.parent.index];
                    var c = myself.chart.dataEngine.getCategories()[this.parent.parent.index];
                    var d = r[i];
                    if(e.ctrlKey){
                        myself.toggleSelection(s,c);
                    } else {//hard select
                        myself.clearSelections();
                        myself.addSelection(s,c);
                    }
                    myself.triggerSelectionChange();
                    //classic clickAction
                    if(typeof(myself.chart.options.clickAction) == 'function'){
                        if($.isArray(d)) d= d[0];
                        myself.chart.options.clickAction(s,c,d);
                    }
                    myself.pvPanel.render();
                   // myself.shapes.render();
                })
                ;
                this.createSelectOverlay(w,h);
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
    
    //makes none selected
    clearSelections: function(){
        this.selections = {};
        this.selectCount = null;
    },
    
    isSelected: function(s,c){
      return this.selections[s] ?
        this.selections[s][c] :
        false;
    },
    
    isValueNull: function(s,c){
      var sIdx = this.chart.dataEngine.getSeries().indexOf(s);
      var cIdx = this.chart.dataEngine.getCategories().indexOf(c);
      var val = this.chart.dataEngine.getValues()[cIdx][sIdx];
      return val == null || val[0] == null;
      //if(this.chart.options.sizeValIdx != null){
      //  
      //}
      //else if (this.chart.options.colorValIdx != null){
      //  
      //}
    },
    
    addSelection: function(s,c){
      if(!this.selectNullValues)
      {//check if null
        if(this.isValueNull(s,c)){ return; }
      }
    
      if(!this.selections[s]) this.selections[s] = {};
      this.selections[s][c] = true;
      this.selectCount = null;
    },
    
    removeSelection: function(s,c){
      if(this.selections[s]){
        this.selections[s][c] = false;
      }
      this.selectCount = null;
    },
    
    toggleSelection: function(s,c){
        if(this.isSelected(s,c)) {
            this.removeSelection(s,c);
        }
        else {
            this.addSelection(s,c);
        }
    },
    //toggleSelection: function(s,c,keepOthers){
    //    var isSelected = this.isSelected(s,c);
    //    
    //    if(keepOthers){
    //        if(isSelected) {
    //            this.removeSelection(s,c);
    //        }
    //        else {
    //            this.addSelection(s,c);
    //        }
    //    }
    //    else {
    //        this.clearSelections();
    //        if(!isSelected){
    //            this.addSelection(s,c);
    //        }
    //    }
    //},
    
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
    
    selectAxisValue: function(axis, axisValue, toggle)
    {
        var type = (this.orientation == 'horizontal')?
            ((axis == 'x')? 's' : 'c') :
            ((axis == 'x')? 'c' : 's')
            
        if(this.chart.options.useCompositeAxis)
        {
            if(!toggle){
                this.clearSelections();
            }
            if(type =='c'){
                if(!toggle){
                    this.selectCategoriesHierarchy(axisValue);
                }
                else {
                    this.toggleCategoriesHierarchy(axisValue);
                }
            }
            else {
                if(!toggle){
                    this.selectSeriesHierarchy(axisValue);
                }
                else{
                    this.toggleSeriesHierarchy(axisValue);
                }
            }
        }
        else
        {//??
            if(type =='c'){ this.toggleCategories(axisValue); }
            else { this.toggleSeries(axisValue); }
        }
    },
    
    //ex.: arrayStartsWith(['EMEA','UK','London'], ['EMEA']) -> true
    //     arrayStartsWith(a, a) -> true
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
        if(this.selectCount == null){
          this.selectCount = this.getSelections().length;
        }
        return this.selectCount;
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


});//end: HeatGridChartPanel


/**
 * Equal to pv.Behavior.select but doesn't necessarily
 * force redraw of component it's in on mousemove, and sends event info
 * (default behavior matches pv.Behavior.select())
 * @param {boolean} autoRefresh refresh parent mark automatically
 * @param {pv.Mark} mark
 * @return {function mousedown
 **/
pv.Behavior.selector = function(autoRefresh, mark) {
  var scene, // scene context
      index, // scene context
      r, // region being selected
      m1, // initial mouse position
      redrawThis = (arguments.length > 0)?
                    autoRefresh : true; //redraw mark - default: same as pv.Behavior.select
    
  /** @private */
  function mousedown(d, e) {
    if(mark == null){
        index = this.index;
        scene = this.scene;
    }
    else {
        index = mark.index;
        scene = mark.scene;
    }
    m1 = this.mouse();
    
    r = d;
    r.x = m1.x;
    r.y = m1.y;
    r.dx = r.dy = 0;
    pv.Mark.dispatch("selectstart", scene, index, e);
  }

  /** @private */
  function mousemove(e) {
    if (!scene) return;
    scene.mark.context(scene, index, function() {
        var m2 = this.mouse();
        r.x = Math.max(0, Math.min(m1.x, m2.x));
        r.y = Math.max(0, Math.min(m1.y, m2.y));
        r.dx = Math.min(this.width(), Math.max(m2.x, m1.x)) - r.x;
        r.dy = Math.min(this.height(), Math.max(m2.y, m1.y)) - r.y;
        if(redrawThis){
            this.render();
        }
      });
    pv.Mark.dispatch("select", scene, index, e);
  }

  /** @private */
  function mouseup(e) {
    if (!scene) return;
    pv.Mark.dispatch("selectend", scene, index, e);
    scene = null;
  }

  pv.listen(window, "mousemove", mousemove);
  pv.listen(window, "mouseup", mouseup);
  return mousedown;
};
