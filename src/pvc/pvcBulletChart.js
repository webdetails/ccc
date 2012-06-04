
/**
 * Bullet chart generation
 */
pvc.BulletChart = pvc.BaseChart.extend({

    bulletChartPanel : null,
    allowNoData: true,

    constructor: function(options){
        options = options || {};

        // Add range and marker dimension group defaults
        // This only helps in default bindings...
        var dimGroups = options.dimensionGroups || (options.dimensionGroups = {});
        var rangeDimGroup = dimGroups.range  || (dimGroups.range  = {});
        if(rangeDimGroup.valueType === undefined){
            rangeDimGroup.valueType = Number;
        }

        var markerDimGroup = dimGroups.marker || (dimGroups.marker = {});
        if(markerDimGroup.valueType === undefined){
            markerDimGroup.valueType = Number;
        }

        options.legend = false;
        options.selectable = false; // not supported yet

        // TODO
        //if(options.compatVersion <= 1 && options.tooltipFormat === undefined){
            // Backwards compatible tooltip format
            options.tooltipFormat = function(s, c, v) {
                return this.chart.options.valueFormat(v);
            };
        //}

        this.base(options);

        // Apply options
        pvc.mergeDefaults(this.options, pvc.BulletChart.defaultOptions, options);
    },

    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function(){

        this.base();

        this._addVisualRoles({
            title:    { defaultDimensionName: 'title*'    },
            subTitle: { defaultDimensionName: 'subTitle*' },
            value: {
                isMeasure:  true,
                requireSingleDimension: true,
                requireIsDiscrete: false,
                valueType: Number,
                defaultDimensionName: 'value*'
            },
            marker: {
                isMeasure:  true,
                requireSingleDimension: true,
                requireIsDiscrete: false,
                valueType: Number,
                defaultDimensionName: 'marker*'
            },
            range: {
                isMeasure:  true,
                requireIsDiscrete: false,
                valueType: Number,
                defaultDimensionName: 'range*'
            }
        });
    },

    _createTranslation: function(complexType, translOptions){
        var translation = this.base(complexType, translOptions),
            /*
             * By now the translation has already been initialized
             * and its virtualItemSize is determined.
             */
            size = translation.virtualItemSize()
            ;

        /* Configure the translation with default dimensions.
         *  1       Value
         *  2       Title | Value
         *  3       Title | Value | Marker
         *  >= 4    Title | Subtitle | Value | Marker | Ranges
         */
        // TODO: respect user reader definitions (names and indexes)
        if(size){
            switch(size){
                case 1:
                    translation.defReader({names: 'value'});
                    break;

                case 2:
                    translation.defReader({names: ['title', 'value']});
                    break;

                case 3:
                    translation.defReader({names: ['title', 'value', 'marker']});
                    break;

                default:
                    translation.defReader({names: ['title', 'subTitle', 'value', 'marker']});
                    if(size > 4){
                        // 4, 5, 6, ...
                        translation.defReader({names: 'range', indexes: pv.range(4, size)});
                    }
                    break;
            }
        }

        return translation;
    },
    
  _preRenderCore: function(){
    if(pvc.debug >= 3){
      pvc.log("Prerendering in bulletChart");
    }
    
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
      bulletTitlePosition: "left", // Position of bullet title relative to bullet

      axisDoubleClickAction: null,

      crosstabMode: false,
      seriesInRows: false
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
    var chart  = this.chart,
        options = chart.options,
        data = this.buildData();
    
    var anchor = options.orientation=="horizontal"?"left":"bottom";
    var size, angle, align, titleLeftOffset, titleTopOffset, ruleAnchor, leftPos, topPos, titleSpace;
    
    if(options.orientation=="horizontal"){
      size = this.width - this.chart.options.bulletMargin - 20;
      angle=0;
      switch (options.bulletTitlePosition) {
        case 'top':
          leftPos = this.chart.options.bulletMargin;
          titleLeftOffset = 0;
          align = 'left';
          titleTopOffset = -12;
          titleSpace = parseInt(options.titleSize/2, 10);
          break;
        case 'bottom':
          leftPos = this.chart.options.bulletMargin;
          titleLeftOffset = 0;
          align = 'left';
          titleTopOffset = options.bulletSize + 32;
          titleSpace = 0;
          break;
        case 'right':
          leftPos = 5;
          titleLeftOffset = size + 5;
          align = 'left';
          titleTopOffset = parseInt(options.bulletSize/2, 10);
          titleSpace = 0;
          break;
        case 'left':
        default:
          leftPos = this.chart.options.bulletMargin;
          titleLeftOffset = 0;
          titleTopOffset = parseInt(options.bulletSize/2, 10);
          align = 'right';
          titleSpace = 0;
      }
      ruleAnchor = "bottom";
      topPos = function(){
        //TODO: 10
        return (this.index * (options.bulletSize + options.bulletSpacing)) + titleSpace;
      };
    }
    else
    {
      size = this.height - this.chart.options.bulletMargin - 20;
      switch (options.bulletTitlePosition) {
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
        return options.bulletMargin + this.index * (options.bulletSize + options.bulletSpacing);
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
    
    
    if (options.clickable){
      this.pvBullet
      .cursor("pointer")
      .event("click",function(d){
        var s = d.title;
        var c = d.subtitle;
        var ev = pv.event;
        return options.clickAction(s,c, d.measures, ev);
      });
    }
    
    this.pvBulletRange = this.pvBullet.range.add(pv.Bar);
    this.pvBulletMeasure = this.pvBullet.measure.add(pv.Bar)
    .text(function(d){
      return options.valueFormat(d);
    });

    this.pvBulletMarker = this.pvBullet.marker.add(pv.Dot)
    .shape("square")
    .fillStyle("white")
    .text(function(d){
      return options.valueFormat(d);
    });


    if(this.showTooltips){
      // Extend default
      // TODO: how to deal with different measures in tooltips depending on mark
      
//      this._addPropTooltip(this.pvBulletMeasure);
//      this._addPropTooltip(this.pvBulletMarker);
        var myself = this;
        this.pvBulletMeasure
            .localProperty('tooltip')
            .tooltip(function(v, d){
                var s = d.title;
                var c = d.subtitle;
                return chart.options.tooltipFormat.call(myself,s,c,v);
            })
            ;

        this.pvBulletMarker
            .localProperty('tooltip')
            .tooltip(function(v, d){
                var s = d.title;
                var c = d.subtitle;
                return chart.options.tooltipFormat.call(myself,s,c,v);
            })
            ;
      
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

    var doubleClickAction = (typeof(options.axisDoubleClickAction) == 'function') ?
    function(d, e) {
            //ignoreClicks = 2;
            options.axisDoubleClickAction(d, e);

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
     * Data array to back up bullet charts.
     */
    buildData: function(){
        if(pvc.debug >= 3){
            pvc.log("In buildData: " + this.chart.data.getInfo() );
        }

        var data,
            chart = this.chart,
            options = chart.options,
            titleRole = chart.visualRoles('title'),
            titleGrouping = titleRole.grouping,
            subTitleRole = chart.visualRoles('subTitle'),
            subTitleGrouping = subTitleRole.grouping,
            valueRole = chart.visualRoles('value'),
            valueDimName = valueRole.grouping && valueRole.firstDimensionName(),
            markerRole = chart.visualRoles('marker'),
            markerDimName = markerRole.grouping && markerRole.firstDimensionName(),
            rangeRole = chart.visualRoles('range'),
            rangeGrouping = rangeRole.grouping;
        
        var defaultData = {
            title: options.bulletTitle,
            formattedTitle: def.scope(function(){
                var formatter = titleGrouping && titleRole.firstDimension().formatter();
                if(formatter){
                    return formatter(options.bulletTitle);
                }
                return options.bulletTitle;
            }),
            subtitle: options.bulletSubtitle,
            formattedSubtitle: def.scope(function(){
                var formatter = subTitleGrouping && subTitleRole.firstDimension().formatter();
                if(formatter){
                    return formatter(options.bulletSubtitle);
                }
                return options.bulletSubtitle;
            }),
            ranges:   options.bulletRanges   || [],
            measures: options.bulletMeasures || [],
            markers:  options.bulletMarkers  || []
        };

        if(!valueRole.grouping &&
           !titleGrouping &&
           !markerRole.grouping &&
           !subTitleGrouping &&
           !rangeGrouping){

            data = [defaultData];
       } else {
            data = chart.data.datums().select(function(datum){
                var d = Object.create(defaultData),
                    atoms = datum.atoms,
                    view;

                if(valueDimName){
                    d.measures = [atoms[valueDimName].value];
                }

                if(titleGrouping){
                    view = titleGrouping.view(datum);
                    d.title = view.value;
                    d.formattedTitle = view.label;
                }

                if(subTitleGrouping){
                    view = subTitleGrouping.view(datum);
                    d.subtitle = view.value;
                    d.formattedSubtitle = view.label;
                }

                if(markerDimName){
                    d.markers = [atoms[markerDimName].value];
                }

                if(rangeGrouping){
                    d.ranges = rangeGrouping.view(datum).values();
                }

                return d;
            }, this)
            .array();
        }
        
        return data;
    }
});
