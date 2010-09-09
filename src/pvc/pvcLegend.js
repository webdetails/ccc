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
  legendPanel: null,
  legend: null,
  legendSize: null,
  minMarginX: 8,
  minMarginY: 8,
  textMargin: 6,
  padding: 20,
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
    var c = pv.Colors.category20();
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
      y = function(){return myself.height - this.index*myself.padding - myself.minMarginY;}
    }

    if(this.width == null){
      this.width = realxsize;
    }

    this.pvPanel = this._parent.getPvPanel().add(this.type)
    .width(this.width)
    .height(this.height)    

    //********** Markers and Lines ***************************


    if(this.drawLine == true && this.drawMarker == true){
      
      this.pvRule = this.pvPanel.add(pv.Rule)
      .data(data)
      .width(this.markerSize)
      .lineWidth(1)
      .strokeStyle(function(){return c(this.index);})
      .left(x)
      .bottom(y)

      this.pvDot = this.pvRule.anchor("center").add(pv.Dot)
      .size(this.markerSize)
      .shape(this.shape)
      .lineWidth(0)
      .fillStyle(function(){return c(this.index);})

      this.pvLabel = this.pvDot.anchor("right").add(pv.Label)
      .textMargin(myself.textMargin)
      .font("9px sans-serif")
    }
    else if(this.drawLine == true){
      
      this.pvRule = this.pvPanel.add(pv.Rule)
      .data(data)
      .width(this.markerSize)
      .lineWidth(1)
      .strokeStyle(function(){return c(this.index);})
      .left(x)
      .bottom(y)

      this.pvLabel = this.pvRule.anchor("right").add(pv.Label)
      .textMargin(myself.textMargin)
      .font("9px sans-serif")
    }
    else if(this.drawMarker == true){
      this.pvDot = this.pvPanel.add(pv.Dot)
      .data(data)
      .size(this.markerSize)
      .shape(this.shape)
      .lineWidth(0)
      .fillStyle(function(){return c(this.index);})
      .left(x)
      .bottom(y)

      this.pvLabel = this.pvDot.anchor("right").add(pv.Label)
      .data(data)
      .textMargin(myself.textMargin)
      .font("9px sans-serif")
    }


    // Extend legend
    this.extend(this.pvPanel,"legend_");
    this.extend(this.pvRule,"legendRule_");
    this.extend(this.pvDot,"legendDot_");
    this.extend(this.pvLabel,"legendLabel_");


  }


});

