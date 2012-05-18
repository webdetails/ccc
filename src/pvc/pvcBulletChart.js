
/**
 * Bullet chart generation
 */
pvc.BulletChart = pvc.BaseChart.extend({

  bulletChartPanel : null,
  allowNoData: true,

  constructor: function(options){

    this.base(options);

    // Apply options
    pvc.mergeDefaults(this.options, pvc.BulletChart.defaultOptions, options);
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
}, {
  defaultOptions: {
      showValues: true,
      orientation: "horizontal",
      showTooltips: true,
      legend: false,

      bulletSize:     30,  // Bullet size
      bulletSpacing:  50,  // Spacing between bullets
      bulletMargin:  100,  // Left margin

      // Defaults
      bulletMarkers:  null,     // Array of markers to appear
      bulletMeasures: null,     // Array of measures
      bulletRanges:   null,     // Ranges
      bulletTitle:    "Bullet", // Title
      bulletSubtitle: "",       // Subtitle
      bulletTitlePosition: "left", // Position of bullet title relative to bullet



      axisDoubleClickAction: null,
      
      crosstabMode: true,
      seriesInRows: true,

      tipsySettings: {
        gravity: "s",
        fade: true
      }
    }
});



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
  onSelectionChange: null,
  showTooltips: true,
  showValues: true,
  tipsySettings: {
    gravity: "s",
    fade: true
  },

//  constructor: function(chart, options){
//    this.base(chart,options);
//  },

  create: function(){

    var myself  = this;

    this.consumeFreeClientSize();
    
    var data = this.buildData();

    this.base();
    
    var anchor = myself.chart.options.orientation=="horizontal"?"left":"bottom";
    var size, angle, align, titleLeftOffset, titleTopOffset, ruleAnchor, leftPos, topPos, titleSpace;
    
    if(myself.chart.options.orientation=="horizontal"){
      size = this.width - this.chart.options.bulletMargin - 20;
      angle=0;
      switch (myself.chart.options.bulletTitlePosition) {
        case 'top':
          leftPos = this.chart.options.bulletMargin;
          titleLeftOffset = 0;
          align = 'left';
          titleTopOffset = -12;
          titleSpace = parseInt(myself.chart.options.titleSize/2);
          break;
        case 'bottom':
          leftPos = this.chart.options.bulletMargin;
          titleLeftOffset = 0;
          align = 'left';
          titleTopOffset = myself.chart.options.bulletSize + 32;
          titleSpace = 0;
          break;
        case 'right':
          leftPos = 5;
          titleLeftOffset = size + 5;
          align = 'left';
          titleTopOffset = parseInt(myself.chart.options.bulletSize/2);
          titleSpace = 0;
          break;
        case 'left':
        default:
          leftPos = this.chart.options.bulletMargin;
          titleLeftOffset = 0;
          titleTopOffset = parseInt(myself.chart.options.bulletSize/2);
          align = 'right';
          titleSpace = 0;
      }
      ruleAnchor = "bottom";
      topPos = function(){
        //TODO: 10
        return (this.index * (myself.chart.options.bulletSize + myself.chart.options.bulletSpacing)) + titleSpace;
      };
    }
    else
    {
      size = this.height - this.chart.options.bulletMargin - 20;
      switch (myself.chart.options.bulletTitlePosition) {
        case 'top':
          leftPos = this.chart.options.bulletMargin;
          titleLeftOffset = 0;
          align = 'left';
          titleTopOffset = -20;
          angle = 0;
          topPos = undefined;
          break;
        case 'bottom':
          leftPos = this.chart.options.bulletMargin;
          titleLeftOffset = 0;
          align = 'left';
          titleTopOffset = size + 20;
          angle = 0;
          topPos = 20;
          break;
        case 'right':
          leftPos = 5;
          titleLeftOffset = this.chart.options.bulletSize + 40;
          align = 'left';
          titleTopOffset = size;
          angle = -Math.PI/2;
          topPos = undefined;
          break;
        case 'left':
        default:
          leftPos = this.chart.options.bulletMargin;
          titleLeftOffset = -12;
          titleTopOffset = this.height - this.chart.options.bulletMargin - 20;
          align = 'left';
          angle = -Math.PI/2;
          topPos = undefined;
      }
      ruleAnchor = "right";
      leftPos = function(){
        return myself.chart.options.bulletMargin + this.index * (myself.chart.options.bulletSize + myself.chart.options.bulletSpacing);
      };

    }

    this.pvBullets = this.pvPanel.add(pv.Panel)
    .data(data)
    [pvc.BasePanel.orthogonalLength[anchor]](size)
    [pvc.BasePanel.parallelLength[anchor]](this.chart.options.bulletSize)
    .margin(20)
    .left(leftPos)
    .top(topPos);
    

    this.pvBullet = this.pvBullets.add(pv.Layout.Bullet)
    .orient(anchor)
    .ranges(function(d){
      return d.ranges;
    })
    .measures(function(d){
      return d.measures;
    })
    .markers(function(d){
      return d.markers;
    });
    
    
    if (myself.chart.options.clickable){
      this.pvBullet
      .cursor("pointer")
      .event("click",function(d){
        var s = d.title;
        var c = d.subtitle;
        var ev = pv.event;
        return myself.chart.options.clickAction(s,c, d.measures, ev);
      });
    }
    
    

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

    this.pvBulletRule = this.pvBullet.tick.add(pv.Rule);

    this.pvBulletRuleLabel = this.pvBulletRule.anchor(ruleAnchor).add(pv.Label)
    .text(this.pvBullet.x.tickFormat);

    this.pvBulletTitle = this.pvBullet.anchor(anchor).add(pv.Label)
    .font("bold 12px sans-serif")
    .textAngle(angle)
    .left(-10)
    .textAlign(align)
    .textBaseline("bottom")
    .left(titleLeftOffset)
    .top(titleTopOffset)
    .text(function(d){
      return d.formattedTitle;
    });

    this.pvBulletSubtitle = this.pvBullet.anchor(anchor).add(pv.Label)
    .textStyle("#666")
    .textAngle(angle)
    .textAlign(align)
    .textBaseline("top")
    .left(titleLeftOffset)
    .top(titleTopOffset)
    .text(function(d){
      return d.formattedSubtitle;
    });

    var doubleClickAction = (typeof(myself.chart.options.axisDoubleClickAction) == 'function') ?
    function(d, e) {
            //ignoreClicks = 2;
            myself.chart.options.axisDoubleClickAction(d, e);

    }: null;
    
    if (doubleClickAction) {
    	this.pvBulletTitle.events('all')  //labels don't have events by default
            .event("dblclick", function(d){
                    doubleClickAction(d, arguments[arguments.length-1]);
                });

    	this.pvBulletSubtitle.events('all')  //labels don't have events by default
            .event("dblclick", function(d){
                    doubleClickAction(d, arguments[arguments.length-1]);
                });

    }

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
      title:     this.chart.options.bulletTitle,
      subtitle:  this.chart.options.bulletSubtitle,
      ranges:    this.chart.options.bulletRanges   || [],
      measures:  this.chart.options.bulletMeasures || [],
      markers:   this.chart.options.bulletMarkers  || []
    };
    
    var data = [],
        options = this.chart.options,
        getSeriesLabel   = options.getSeriesLabel || pv.identity,
        getCategoryLabel = options.getCategoryLabel || pv.identity;

    if(this.chart.dataEngine.getSeriesSize() == 0 ) {
      // No data
      data.push($.extend({}, defaultData));
    }
    else {
      // We have data. Iterate through the series.
      var indices = this.chart.dataEngine.getVisibleSeriesIndexes();
      for(var i in indices) if (indices.hasOwnProperty(i))
      {
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
            d.markers = [v[1]];
            // NO break!
          case 1:
            // name and value
            d.title = s;
            d.formattedTitle = getCategoryLabel(s);
            d.measures = [v[0]];
            break;

          default:
            // greater or equal 4
            d.title = s;
            d.subtitle = v[0];
            d.formattedTitle = getCategoryLabel(s);
            d.formattedSubtitle = getSeriesLabel(v[0])
            d.measures = [v[1]];
            d.markers = [v[2]];
            if (v.length >= 3){
              d.ranges = v.slice(3);
            }
        }
        data.push(d);
      }
    }
   
    return data;
  }
});
