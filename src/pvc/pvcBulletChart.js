
/**
 * Bullet chart generation
 */
pvc.BulletChart = pvc.BaseChart.extend({

  bulletChartPanel : null,
  allowNoData: true,

  constructor: function(options){
      options = options || {};
      
      options.readers = [
          {names: 'value', indexes: [0,1,2,3,4,5,6,7,8]} 
      ];
     
      // Force values not to be numbers
      if(!options.dimensionGroups) {
         options.dimensionGroups = {};
      }
     
      if(!options.dimensionGroups.value) {
         options.dimensionGroups.value = {valueType: null};
      }
    
      options.legend = false;
      options.selectable = false; // not supported yet
     
      this.base(options);

      // Apply options
      pvc.mergeDefaults(this.options, pvc.BulletChart.defaultOptions, options);
  },

  _preRenderCore: function(){

    pvc.log("Prerendering in bulletChart");

    this.bulletChartPanel = new pvc.BulletChartPanel(this, this.basePanel, {
        showValues:   this.options.showValues,
        showTooltips: this.options.showTooltips,
        orientation:  this.options.orientation
    });
  }
}, {
  defaultOptions: {
      showValues: true,
      orientation: "horizontal",
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

      axisDoubleClickAction: null,
      
      crosstabMode:    false,
      seriesInRows:    false
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
  anchor: 'fill',
  pvBullets: null,
  pvBullet: null,
  data: null,
  onSelectionChange: null,
  showValues: true,

  /**
   * @override
   */
  _createCore: function() {
    var myself = this;
    var data = this.buildData();
    
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
        //TODO: 10
        return (this.index * (myself.chart.options.bulletSize + myself.chart.options.bulletSpacing));
      };
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
      };
      topPos = undefined;

    }

    this.pvBullets = this.pvPanel.add(pv.Panel)
    .data(data)
    [pvc.BasePanel.orthogonalLength[anchor]](size)
    [pvc.BasePanel.parallelLength[anchor]](this.chart.options.bulletSize)
    .margin(20)
    .left(leftPos) // titles will be on left always
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
      this.pvBulletMeasure.event("mouseover", pv.Behavior.tipsy(this.chart.options.tipsySettings));
      this.pvBulletMarker.event("mouseover", pv.Behavior.tipsy(this.chart.options.tipsySettings));
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
    .left(titleOffset)
    .text(function(d){
      return d.formattedTitle;
    });

    this.pvBulletSubtitle = this.pvBullet.anchor(anchor).add(pv.Label)
    .textStyle("#666")
    .textAngle(angle)
    .textAlign(align)
    .textBaseline("top")
    .left(titleOffset)
    .text(function(d){
      return d.formattedSubtitle;
    });

    var doubleClickAction = (typeof(myself.chart.options.axisDoubleClickAction) == 'function') ?
    function(d, e) {
            //ignoreClicks = 2;
            myself.chart.options.axisDoubleClickAction(d, e);

    }: null;
    
    if (doubleClickAction) {
    	this.pvBulletTitle
    	    .cursor("pointer")
    	    .events('all')  //labels don't have events by default
            .event("dblclick", function(d){
                    doubleClickAction(d, arguments[arguments.length-1]);
                });

    	this.pvBulletSubtitle
    	    .cursor("pointer")
    	    .events('all')  //labels don't have events by default
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

        var data,
            de = this.chart.dataEngine,
            options = this.chart.options,
            seriesFormatter   = de.dimensions('series').type.formatter()   || def.identity,
            categoryFormatter = de.dimensions('category').type.formatter() || def.identity;
        
        var defaultData = {
            title:      options.bulletTitle,
            subtitle:   options.bulletSubtitle,
            ranges:     options.bulletRanges   || [],
            measures:   options.bulletMeasures || [],
            markers:    options.bulletMarkers  || []
        };
    
        defaultData.formattedTitle = categoryFormatter(defaultData.title);
        defaultData.formattedSubtitle = seriesFormatter(defaultData.subtitle);
        
        // Check how many dimensions are effectively supplied
        var dimsByName = de.dimensions(),
            dimNames   = de.type.groupDimensionsNames('value'),
            rangeDimNames,
            dimCount = 0;
    
        for(var i = 0, L = dimNames.length ; i < L ; i++) {
            if(dimsByName[dimNames[i]].count() === 0) {
                break;
            }
            dimCount++;
        }
    
        if(dimCount === 0 ) {
            // No data
            data = [def.copy(defaultData)];
        } else {
            if(dimCount > 4) {
                rangeDimNames = dimNames.slice(4, dimCount);
            }
            
            data = de.datums()
                .select(function(datum){
                    var d = def.copy(defaultData),
                        atoms = datum.atoms;
                    
                    switch(dimCount) {
                        case 1:
                            // Value only
                            d.measures = [atoms.value.value];
                            break;
                            
                        case 3:
                            // Name, value and markers
                            d.markers = [atoms.value3.value];
                            // NO break!
                        case 2:
                            // name and value
                            d.title = atoms.value.value;
                            d.formattedTitle = categoryFormatter(d.title);
                            d.measures = [atoms.value2.value];
                            break;
                            
                        default:
                            // greater or equal 4
                            d.title = atoms.value.value;
                            d.subtitle = atoms.value2.value;
                            d.formattedTitle = categoryFormatter(d.title);
                            d.formattedSubtitle = seriesFormatter( d.subtitle)
                            
                            d.measures = [atoms.value3.value];
                            d.markers  = [atoms.value4.value];
                            
                            if (rangeDimNames){
                                d.ranges = rangeDimNames.map(function(dimName){
                                    return atoms[dimName].value;
                                });
                            }
                    }
                    
                    return d;
                }, this)
                .array();
    }
   
    return data;
  }
});