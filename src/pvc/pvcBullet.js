/**
 * Bullet chart generation
 */

pvc.BulletChart = pvc.Base.extend({

  bulletChartPanel : null,
  allowNoData: true,

  constructor: function(o){

    this.base(o);

    var _defaults = {
      showValues: true,
      orientation: "horizontal",
      showTooltips: true,
      legend: false,

      bulletSize: 30,        // Bullet size
      bulletSpacing: 50,     // Spacing between bullets
      bulletMargin: 100,     // Left margin

      // Defaults
      bulletMarkers: [],     // Array of markers to appear
      bulletMeasures: [],    // Array of measures
      bulletRanges: [],      // Ranges
      bulletTitle: "Bullet", // Title
      bulletSubtitle: "",    // Subtitle

      crosstabMode: true,
      seriesInRows: true,

      tipsySettings: {
        gravity: "s",
        fade: true
      }

    };


    // Apply options
    $.extend(this.options,_defaults, o);


  },

  preRender: function(){

    this.base();

    pvc.log("Prerendering in bulletChart");


    this.bulletChartPanel = new pvc.BulletChartPanel(this, {
      showValues: this.options.showValues,
      showTooltips: this.options.showTooltips,
      orientation: this.options.orientation
    });

    this.bulletChartPanel.appendTo(this.basePanel); // Add it

  }

}
);



/*
 * Bullet chart panel. Generates a bar chart. Specific options are:
 * <i>orientation</i> - horizontal or vertical. Default: vertical
 * <i>showValues</i> - Show or hide bar value. Default: false
 *
 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>bulletsPanel_</i> - for the bullets panel
 * <i>bulletPanel_</i> - for the bullets pv.Layout.Bullet
 * <i>bulletRange_</i> - for the bullet range
 * <i>bulletMeasure_</i> - for the bullet measure
 * <i>bulletMarker_</i> - for the marker
 * <i>bulletRule_</i> - for the axis rule
 * <i>bulletRuleLabel_</i> - for the axis rule label
 * <i>bulletTitle_</i> - for the bullet title
 * <i>bulletSubtitle_</i> - for the main bar label
 */


pvc.BulletChartPanel = pvc.BasePanel.extend({

  _parent: null,
  pvBullets: null,
  pvBullet: null,
  data: null,

  showTooltips: true,
  showValues: true,
  tipsySettings: {
    gravity: "s",
    fade: true
  },

  constructor: function(chart, options){

    this.base(chart,options);

  },

  create: function(){

    var myself = this;
    this.width = this._parent.width;
    this.height = this._parent.height;

    var data = this.buildData();

    this.pvPanel = this._parent.getPvPanel().add(pv.Panel)
    .width(this.width)
    .height(this.height);

    var anchor = myself.chart.options.orientation=="horizontal"?"left":"bottom";
    var size, angle, align, titleOffset, ruleAnchor, leftPos, topPos;
    
    if(myself.chart.options.orientation=="horizontal"){
      size = this.width - this.chart.options.bulletMargin - 20;
      angle=0;
      align = "right";
      titleOffset = 0;
      ruleAnchor = "bottom";
      leftPos = this.chart.options.bulletMargin;
      topPos = function(){
        return this.index * (myself.chart.options.bulletSize + myself.chart.options.bulletSpacing);
      }
    }
    else
    {
      size = this.height - this.chart.options.bulletMargin - 20;
      angle = -Math.PI/2;
      align = "left";
      titleOffset = -12;
      ruleAnchor = "right";
      leftPos = function(){
        return myself.chart.options.bulletMargin + this.index * (myself.chart.options.bulletSize + myself.chart.options.bulletSpacing);
      }
      topPos = undefined;

    }

    this.pvBullets = this.pvPanel.add(pv.Panel)
    .data(data)
    [pvc.BasePanel.orthogonalLength[anchor]](size)
    [pvc.BasePanel.paralelLength[anchor]](this.chart.options.bulletSize)
    .margin(20)
    .left(leftPos) // titles will be on left always
    .top(topPos);
    

    this.pvBullet = this.pvBullets.add(pv.Layout.Bullet)
    .orient(anchor)
    .ranges(function(d){
      return d.ranges
    })
    .measures(function(d){
      return d.measures
    })
    .markers(function(d){
      return d.markers
    });

    this.pvBulletRange = this.pvBullet.range.add(pv.Bar);
    this.pvBulletMeasure = this.pvBullet.measure.add(pv.Bar)
    .text(function(d){
      return myself.chart.options.valueFormat(d);
    });


    this.pvBulletMarker = this.pvBullet.marker.add(pv.Dot)
    .shape("square")
    .fillStyle("white")
    .text(function(d){
      return myself.chart.options.valueFormat(d);
    });


    if(this.showTooltips){
      // Extend default
      this.extend(this.tipsySettings,"tooltip_");
      this.pvBulletMeasure.event("mouseover", pv.Behavior.tipsy(this.tipsySettings));
      this.pvBulletMarker.event("mouseover", pv.Behavior.tipsy(this.tipsySettings));
    }

    this.pvBulletRule = this.pvBullet.tick.add(pv.Rule)

    this.pvBulletRuleLabel = this.pvBulletRule.anchor(ruleAnchor).add(pv.Label)
    .text(this.pvBullet.x.tickFormat);

    this.pvBulletTitle = this.pvBullet.anchor(anchor).add(pv.Label)
    .font("bold 12px sans-serif")
    .textAngle(angle)
    .left(-10)
    .textAlign(align)
    .textBaseline("bottom")
    .left(titleOffset)
    .text(function(d){
      return d.title
    });

    this.pvBulletSubtitle = this.pvBullet.anchor(anchor).add(pv.Label)
    .textStyle("#666")
    .textAngle(angle)
    .textAlign(align)
    .textBaseline("top")
    .left(titleOffset)
    .text(function(d){
      return d.subtitle
    });

    // Extension points
    this.extend(this.pvBullets,"bulletsPanel_");
    this.extend(this.pvBullet,"bulletPanel_");
    this.extend(this.pvBulletRange,"bulletRange_");
    this.extend(this.pvBulletMeasure,"bulletMeasure_");
    this.extend(this.pvBulletMarker,"bulletMarker_");
    this.extend(this.pvBulletRule,"bulletRule_");
    this.extend(this.pvBulletRuleLabel,"bulletRuleLabel_");
    this.extend(this.pvBulletTitle,"bulletTitle_");
    this.extend(this.pvBulletSubtitle,"bulletSubtitle_");

    // Extend body
    this.extend(this.pvPanel,"chart_");

  },

  /*
   * Data array to back up bullet charts; Case 1:
   *
   * <i>1) No data is passed</i> - In this case, we'll grab all the value from the options
   * and generate only one bullet
   *
   */

  buildData: function(){

    pvc.log("In buildData: " + this.chart.dataEngine.getInfo() );


    var defaultData = {
      title: this.chart.options.bulletTitle,
      subtitle: this.chart.options.bulletSubtitle,
      ranges:this.chart.options.bulletRanges,
      measures: this.chart.options.bulletMeasures,
      markers: this.chart.options.bulletMarkers
    };
    
    var data = [];

    if(this.chart.dataEngine.getSeriesSize() == 0 ){
      // No data
      data.push($.extend({},defaultData));

    }
    else{

      // We have data. Iterate through the series.
      var indices = this.chart.dataEngine.getVisibleSeriesIndexes()
      for(var i in indices) if (indices.hasOwnProperty(i)){
        var s = this.chart.dataEngine.getSerieByIndex(i);
        var v = this.chart.dataEngine.getVisibleValuesForSeriesIndex(i);
        var d = $.extend({},defaultData);

        switch(v.length){
          case 0:
            // Value only
            d.measures = [s];
            break;
          case 2:
            // Name, value and markers
            d.markers = [v[1]]
          case 1:
            // name and value
            d.title = s;
            d.measures = [v[0]];
            break;
          default:
            // greater or equal 4
            d.title = s;
            d.subtitle = v[0];
            d.measures = [v[1]];
            d.markers = [v[2]]
            d.ranges = v.slice(3);
        }


        data.push(d);
      }

    }
   
    return data;
  }

});
