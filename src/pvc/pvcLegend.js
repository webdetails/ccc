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
    var myself = this;
    var c = this.chart.colors();
    var x,y;


    //pvc.log("Debug PMartins");

    var data = this.chart.legendSource=="series"?
    this.chart.dataEngine.getSeries():
    this.chart.dataEngine.getCategories();



    //determine the size of the biggest cell
    //Size will depend on positioning and font size mainly
    var maxtext = 0;
    for (i in data){
      maxtext = maxtext < data[i].length?data[i].length:maxtext;
    }
    var cellsize = this.markerSize + maxtext*this.textAdjust;

    var realxsize, realysize;


    if (this.anchor == "top" || this.anchor == "bottom"){
      this.width = this._parent.width;
      this.height = this.legendSize;
      var maxperline = data.length;

      //if the legend is bigger than the available size, multi-line and left align
      if(maxperline*(cellsize + this.padding) - this.padding + myself.minMarginX > this.width){
        this.align = "left";
        maxperline = Math.floor((this.width + this.padding - myself.minMarginX)/(cellsize + this.padding));
      }
      realxsize = maxperline*(cellsize + this.padding) + myself.minMarginX - this.padding;
      realysize = myself.padding*(Math.ceil(data.length/maxperline));

      if(this.heigth == null){
        this.height = realysize;
      }

      //changing margins if the alignment is not "left"
      if(this.align == "right"){
        myself.minMarginX = this.width - realxsize;
      }
      else if (this.align == "center"){
        myself.minMarginX = (this.width - realxsize)/2;
      }

      x = function(){
        var n = Math.ceil(this.index/maxperline);
        return (this.index%maxperline)*(cellsize + myself.padding) + myself.minMarginX;
      }
      myself.minMarginY = (myself.height - realysize)/2;
      y = function(){
        var n = Math.floor(this.index/maxperline); 
        return myself.height  - n*myself.padding - myself.minMarginY - myself.padding/2;
      }

    }
    else{
      this.height = this._parent.height;
      this.width = this.legendSize;
      realxsize = cellsize + this.minMarginX;
      realysize = myself.padding*data.length;
      if(this.align == "middle"){
        myself.minMarginY = (myself.height - realysize + myself.padding)/2  ;
      }
      else if (this.align == "bottom"){
        myself.minMarginY = myself.height - realysize;
      }
      x = myself.minMarginX;
      y = function(){
        return myself.height - this.index*myself.padding - myself.minMarginY;
      }
    }

    if(this.width == null){
      this.width = realxsize;
    }

    this.pvPanel = this._parent.getPvPanel().add(this.type)
    .width(this.width)
    .height(this.height)    



    //********** Markers and Lines ***************************

    this.pvLegendPanel = this.pvPanel.add(pv.Panel)
    .data(data)
    .def("hidden","false")
    .left(x)
    .bottom(y)
    .height(this.markerSize)
    .cursor("pointer")
    .fillStyle(function(){
      return this.hidden()=="true"?"rgba(200,200,200,1)":"rgba(200,200,200,0.0001)";
    })
    .event("click",function(e){

      return myself.toggleVisibility(this.index);

    });

    // defined font function
    var computeDecoration = function(idx){
      if(myself.chart.dataEngine.isVisible(myself.chart.legendSource,idx)){
        return "";
      }
      else{
        return "line-through"
      }
    }
    var computeTextStyle = function(idx){
      if(myself.chart.dataEngine.isVisible(myself.chart.legendSource,idx)){
        return "black"
      }
      else{
        return "#ccc"
      }
    }

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
      .shape(this.shape)
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
      .shape(this.shape)
      .lineWidth(0)
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
    this.chart.dataEngine.toggleVisibility(this.chart.legendSource,idx);

    // Forcing removal of tipsy legends
    try{
      $(".tipsy").remove();
    }catch(e){
      // Do nothing
    }

    // Rerender chart
    this.chart.preRender();
    this.chart.render(true);
    
    return this.pvLabel;
  }


});

