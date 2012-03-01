
/*
 * Legend panel. Generates the legend. Specific options are:
 * <i>legend</i> - text. Default: false
 * <i>legendPosition</i> - top / bottom / left / right. Default: bottom
 * <i>legendSize</i> - The size of the legend in pixels. Default: 25
 *
 * Has the following protovis extension points:
 *
 * <i>legend_</i> - for the legend Panel
 * <i>legendRule_</i> - for the legend line (when applicable)
 * <i>legendDot_</i> - for the legend marker (when applicable)
 * <i>legendLabel_</i> - for the legend label
 * 
 */
pvc.LegendPanel = pvc.BasePanel.extend({

  _parent: null,
  pvRule: null,
  pvDot: null,
  pvLabel: null,

  anchor: "bottom",
  align: "left",
  pvLegendPanel: null,
  legend: null,
  legendSize: null,
  minMarginX: 8,
  minMarginY: 20,
  textMargin: 6,
  padding: 24,
  textAdjust: 7,
  shape: "square",
  markerSize: 15,
  drawLine: false,
  drawMarker: true,

  constructor: function(chart, options){
    this.base(chart,options);
  },

  create: function(){
    var myself = this,
      c, cLen,
      c1 = this.chart.colors(),
      c2 = this.chart.secondAxisColor(),
      x,y;

    //pvc.log("Debug PMartins");
    
    var data = this.chart.legendSource == "series"
               ? this.chart.dataEngine.getSeries()
               : this.chart.dataEngine.getCategories();
    
    cLen = data.length;

    if (this.chart.options.secondAxis) {
        var args = this.chart.dataEngine.getSecondAxisSeries();
        data = data.concat(args);
    }
    
    c = function(arg){
        return arg < cLen
               ? c1.apply(this, arguments)
               : c2.call(this, arg - cLen);
    };
    
    // Determine the size of the biggest cell
    // Size will depend on positioning and font size mainly
    var maxTextLen = 0;
    for (var i in data){
        if(maxTextLen < data[i].length){
            maxTextLen = data[i].length;
        }
    }
    
    var cellsize = this.markerSize + maxTextLen * this.textAdjust;

    this.setAnchoredSize(this.legendSize);

    var realxsize, realysize;
    if (this.anchor == "top" || this.anchor == "bottom"){
      var maxperline = data.length;

      //if the legend is bigger than the available size, multi-line and left align
      if(maxperline*(cellsize + this.padding) - this.padding + myself.minMarginX > this.width){
        this.align = "left";
        maxperline = Math.floor((this.width + this.padding - myself.minMarginX)/(cellsize + this.padding));
      }
      realxsize = maxperline*(cellsize + this.padding) + myself.minMarginX - this.padding;
      realysize = myself.padding*(Math.ceil(data.length/maxperline));

      if(this.height == null){
          this.setHeight(realysize);
      }

      //changing margins if the alignment is not "left"
      if(this.align == "right"){
        myself.minMarginX = this.width - realxsize;
      }
      else if (this.align == "center"){
        myself.minMarginX = (this.width - realxsize)/2;
      }

      x = function(){
        return (this.index % maxperline) * (cellsize + myself.padding) + 
                myself.minMarginX;
      };
      
      myself.minMarginY = (myself.height - realysize) / 2;
      
      y = function(){
        var n = Math.floor(this.index/maxperline); 
        return myself.height  - n * myself.padding - myself.minMarginY - myself.padding/2;
      };
      
    } else {
      realxsize = cellsize + this.minMarginX;
      realysize = myself.padding*data.length;
      if(this.align == "middle"){
        myself.minMarginY = (myself.height - realysize + myself.padding)/2  ;
      } else if (this.align == "bottom"){
        myself.minMarginY = myself.height - realysize;
      }
      x = myself.minMarginX;
      y = function(){
        return myself.height - this.index*myself.padding - myself.minMarginY;
      };
    }

    if(this.width == null){
      this.setWidth(realxsize);
    }

    this.base();

    //********** Markers and Lines ***************************

    this.pvLegendPanel = this.pvPanel.add(pv.Panel)
        .data(data)
        .def("hidden","false")
        .left(x)
        .bottom(y)
        .height(this.markerSize)
        .cursor("pointer")
        .fillStyle(function(){
          return this.hidden()=="true"
                 ? "rgba(200,200,200,1)"
                 : "rgba(200,200,200,0.0001)";
        })
        .event("click",function(e){
          return myself.toggleVisibility(this.index);
        });

    // defined font function
    var computeDecoration = function(idx){
      if(myself.chart.dataEngine.isDimensionVisible(myself.chart.legendSource, idx)){
        return "";
      }
      else{
        return "line-through"
      }
    };
    
    var computeTextStyle = function(idx){
      if(myself.chart.dataEngine.isDimensionVisible(myself.chart.legendSource, idx)){
        return "black"
      }
      else{
        return "#ccc"
      }
    };

    if(this.drawLine == true && this.drawMarker == true){
      
      this.pvRule = this.pvLegendPanel.add(pv.Rule)
      .left(0)
      .width(this.markerSize)
      .lineWidth(1)
      .strokeStyle(function(){
        return c(this.index);
      })

      this.pvDot = this.pvRule.anchor("center").add(pv.Dot)
      .shapeSize(this.markerSize)
      .shape(function(){
        return myself.shape ? myself.shape :
          this.parent.index < cLen  ? 'square':
           'bar';
      })
      .lineWidth(0)
      .fillStyle(function(){
        return c(this.parent.index);
      })

      this.pvLabel = this.pvDot.anchor("right").add(pv.Label)
      .textMargin(myself.textMargin)
    }
    else if(this.drawLine == true){
      
      this.pvRule = this.pvLegendPanel.add(pv.Rule)
      .left(0)
      .width(this.markerSize)
      .lineWidth(1)
      .strokeStyle(function(){
        return c(this.parent.index);
      })

      this.pvLabel = this.pvRule.anchor("right").add(pv.Label)
      .textMargin(myself.textMargin)

    }
    else if(this.drawMarker == true){

      this.pvDot = this.pvLegendPanel.add(pv.Dot)
      .left(this.markerSize/2)
      .shapeSize(this.markerSize)
      .shape(function(){
        return myself.shape ? myself.shape :
          this.parent.index < cLen  ? 'square':
           'bar';
      })
      .angle(1.57)
      .lineWidth(2)
      .strokeStyle(function(){
        return c(this.parent.index);
      })
      .fillStyle(function(){
        return c(this.parent.index);
      })


      this.pvLabel = this.pvDot.anchor("right").add(pv.Label)
      .textMargin(myself.textMargin)
    
    }

    this.pvLabel
    .textDecoration(function(){
      return computeDecoration(this.parent.index)
    })
    .textStyle(function(){
      return computeTextStyle(this.parent.index)
    })

    // Extend legend
    this.extend(this.pvPanel,"legendArea_");
    this.extend(this.pvLegendPanel,"legendPanel_");
    this.extend(this.pvRule,"legendRule_");
    this.extend(this.pvDot,"legendDot_");
    this.extend(this.pvLabel,"legendLabel_");
  },

  toggleVisibility: function(idx){
    
    pvc.log("Worked. Toggling visibility of index " + idx);
    this.chart.dataEngine.toggleDimensionVisible(this.chart.legendSource, idx);

    // Forcing removal of tipsy legends
    pvc.removeTipsyLegends();

    // Rerender chart
    this.chart.render(true, true);
    
    return this.pvLabel;
  }
});