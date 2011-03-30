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
      orientation: "left",
      showTooltips: true,
      legend: false,
      bulletHeight: 30,
      bulletSpacing: 50,

      // Defaults
      bulletMarkers: [30],
      bulletMeasures: [45],
      bulletRanges: [30,60,90],
      bulletName: "My Test",
      bulletDescription: "description"

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
 * <i>bullet_</i> - for the actual bar
 * <i>bulletPanel_</i> - for the panel where the bars sit
 * <i>bulletLabel_</i> - for the main bar label
 */


pvc.BulletChartPanel = pvc.BasePanel.extend({

  _parent: null,
  pvBullets: null,
  pvBullet: null,
  data: null,

  showTooltips: true,
  showValues: true,
  orientation: "left",
  tipsySettings: {
    gravity: "s",
    fade: true
  },

  constructor: function(chart, options){

    this.base(chart,options);

  },

  create: function(){


    var bullets = [
    {
      title: "Revenue",
      subtitle: "US$, in thousands",
      ranges: [150, 225, 300],
      measures: [270],
      markers: [250]
    },
    {
      title: "Profit",
      subtitle: "%",
      ranges: [20, 25, 30],
      measures: [23],
      markers: [26]
    },
    {
      title: "Order Size",
      subtitle: "US$, average",
      ranges: [400,600,800],
      measures: [320],
      markers: [550]
    },
    {
      title: "New Customers",
      subtitle: "count",
      ranges: [1400, 2000, 2500],
      measures: [1650],
      markers: [2100]
    },
    {
      title: "Satisfaction",
      subtitle: "out of 5",
      ranges: [3.5, 4.25, 5],
      measures: [1,3.4],
      markers: [4.4,3]
    }
    ];


    var format = pv.Format.number();

    var myself = this;
    this.width = this._parent.width;
    this.height = this._parent.height;

    var data = this.buildData();

    var n = 4, size=160;

    this.pvPanel = this._parent.getPvPanel().add(pv.Panel)
    .width(this.width)
    .height(this.height)

    this.pvBullets = this.pvPanel.add(pv.Panel)
    .data(data)
    .width(this.width)
    .height(this.chart.options.bulletHeight)
    .margin(20)
    .left(100)
    .top(function(){
      //pvc.log("Bullets index: " + this.index);
      return this.index * (myself.chart.options.bulletHeight + myself.chart.options.bulletSpacing);
    });

    this.pvBullet = this.pvBullets.add(pv.Layout.Bullet)
    .orient("left")
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
    this.pvBulletMeasure = this.pvBullet.measure.add(pv.Bar);

    this.pvBulletMarker = this.pvBullet.marker.add(pv.Dot)
    .shape("triangle")
    .fillStyle("white");

    this.pvBulletRule = this.pvBullet.tick.add(pv.Rule)

    this.pvBulletRuleLabel = this.pvBulletRule.anchor("bottom").add(pv.Label)
    .text(this.pvBullet.x.tickFormat);

    this.pvBulletTitle = this.pvBullet.anchor("left").add(pv.Label)
    .font("bold 12px sans-serif")
    .textAlign("right")
    .textBaseline("bottom")
    .text(function(d){
      return d.title
    });

    this.pvBulletSubTitle = this.pvBullet.anchor("left").add(pv.Label)
    .textStyle("#666")
    .textAlign("right")
    .textBaseline("top")
    .text(function(d){
      return d.subtitle
    });
     
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
      subtitle: this.chart.options.bulletSubTitle,
      ranges:this.chart.options.bulletRanges,
      measures: this.chart.options.bulletMeasures,
      markers: this.chart.options.bulletMarkers
    };
    
    var data = [];

    if(this.chart.dataEngine.getCategoriesSize() == 0 ){
      // No data
      data.push($.extend({},defaultData));

      return data;
    };

    // Series size:
    /*
    var series = this.chart.dataEngine.getVisibleSeries();
    var categories = this.chart.dataEngine.getVisibleCategories();

    pvc.log("Series: " + series + "; Categories: " + categories);
    */
   
    return data;
  }

});
