
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
    pvRule:  null,
    pvDot:   null,
    pvLabel: null,
    
    anchor:     "bottom",
    align:      "left",
    pvLegendPanel: null,
    legend:     null,
    legendSize: null,
    
    textMargin: 6,   // The space between the marker and the text, in pixels.
    padding:    5,   // The space around a legend item in pixels (in all directions, half for each side).
    
    shape:      null, // "square",
    markerSize: 15,   // *diameter* of marker *zone* (the marker(s) itself is a little smaller)
    drawLine:   false,
    drawMarker: true,
    
    font:       '10px sans-serif',
    
    constructor: function(chart, parent, options){
        // Default value of align depends on anchor
        if(!options){
            options = {};
        }
        
        var isV1Compat = chart.options.compatVersion <= 1;
        var isVertical = options.anchor !== "top" && options.anchor !== "bottom";
        
        if(isVertical && options.align === undefined){
            options.align = 'top';
        }
        
        if(isV1Compat){
            if(options.padding === undefined){
                // Default value changed (and the meaning of the property also)
                options.padding = 24;
            }
            
            if(options.shape === undefined){
                options.shape = 'square';
            }
            
            var minMarginX = def.get(options, 'minMarginX',  8);
            var minMarginY = def.get(options, 'minMarginY', 20);
            options.margins = {
                left: minMarginX,
                // V1 only implemented minMarginY for vertical and  align = 'top'
                top:  isVertical && (options.align !== 'middle' && options.align !== 'bottom') ? (minMarginY - 20) : null
            };
        } else {
            // Set default margins
            if(options.margins === undefined){
                var anchor = options.anchor || this.anchor;
                
                options.margins = def.set({}, this.anchorOpposite(anchor), new pvc.PercentValue(0.03));
            }
        }
        
        this.base(chart, parent, options);
    },

    /**
     * @override
     */
    _calcLayout: function(clientSize, layoutInfo, referenceSize){
        var positionProps = {
            left: null, 
            top:  null
        };
        var requiredSize   = new pvc.Size(1,1);
        var paddedCellSize = new pvc.Size(1,1);
        var rootScene = this._buildScene();
        var leafCount = rootScene.childNodes.length;
        if(leafCount){
            if(clientSize.width > 0 && clientSize.height > 0){
                var isV1Compat = (this.chart.options.compatVersion <= 1);
                
                // The size of the biggest cell
                var maxLabelLen = rootScene.acts.legendItem.maxLabelTextLen;
                var cellWidth = this.markerSize + this.textMargin + maxLabelLen; // ignoring textAdjust
                var cellHeight;
                if(isV1Compat){
                    // Previously, the cellHeight was the padding.
                    // As we now add the padding below, we put 0 here.
                    cellHeight = 0;
                } else {
                    cellHeight = Math.max(pvc.text.getTextHeight("M", this.font), this.markerSize);
                }
                
                paddedCellSize.width  = cellWidth  + this.padding;
                paddedCellSize.height = cellHeight + this.padding;
                
                // Names are for horizontal layout (anchor = top or bottom)
                var isHorizontal = this.anchor === 'top' || this.anchor === 'bottom';
                var a_top    = isHorizontal ? 'top' : 'left';
                var a_bottom = this.anchorOpposite(a_top);    // top or bottom
                var a_width  = this.anchorLength(a_top);      // width or height
                var a_height = this.anchorOrthoLength(a_top); // height or width
                var a_center = isHorizontal ? 'center' : 'middle';
                var a_left   = isHorizontal ? 'left' : 'top';
                var a_right  = this.anchorOpposite(a_left);   // left or right
                
                var maxCellsPerRow = ~~(clientSize[a_width] / paddedCellSize[a_width]); // ~~ <=> Math.floor
                if(maxCellsPerRow > 0){
                    var cellsPerRow    = Math.min(leafCount, maxCellsPerRow);
                    var rowCount       = Math.ceil(leafCount / cellsPerRow);
                    var rowWidth       = cellsPerRow * paddedCellSize[a_width];
                    
                    // If the legend is bigger than the available size, multi-line and left align
                    if(rowCount > 1){
                        this.align = a_left; // Why??
                    }
                    
                    // NOTE: V1 behavior requires keeping alignment code here
                    // even if it is also being performed in the layout...
                    
                    // Request used width / all available width (V1)
                    requiredSize[a_width] = !isV1Compat ? rowWidth : clientSize[a_width];
                    
                    var tableHeight = rowCount * paddedCellSize[a_height];
                    requiredSize[a_height] = Math.min(clientSize[a_height], tableHeight);
                    
                    // -----------------
                    
                    var leftOffset = 0;
                    switch(this.align){
                        case a_right:
                            leftOffset = requiredSize[a_width] - rowWidth;
                            break;
                            
                        case a_center:
                            leftOffset = (requiredSize[a_width] - rowWidth) / 2;
                            break;
                    }
                    
                    positionProps[a_left] = function(){
                        var col = this.index % cellsPerRow;
                        return leftOffset + col * paddedCellSize[a_width];
                    };
                    
                    // -----------------
                    
                    var topOffset = 0;
                    positionProps[a_top] = function(){
                        var row = ~~(this.index / cellsPerRow);  // ~~ <=> Math.floor
                        return topOffset + row * paddedCellSize[a_height];
                    };
                }
            }
        }
        
        /** Other exports */
        def.copy(layoutInfo, {
            rootScene: rootScene,
            leftProp:  positionProps.left,
            topProp:   positionProps.top,
            cellSize:  paddedCellSize
        });
        
        return requiredSize;
    },
    
    /**
     * @override
     */
    _createCore: function(layoutInfo) {
      var myself = this,
          rootScene = layoutInfo.rootScene,
          sceneColorProp = function(scene){
              return scene.acts.legendItem.color;
          };
      
      this.pvLegendPanel = this.pvPanel.add(pv.Panel)
          .data(rootScene.childNodes)
          .localProperty('isOn', Boolean)
          .isOn(function(scene){ return scene.acts.legendItem.isOn(); })
          .def("hidden", "false")
          .left(layoutInfo.leftProp)
          .top(layoutInfo.topProp)
          .height(layoutInfo.cellSize.height)
          .cursor(function(scene){
              return scene.acts.legendItem.click ? "pointer" : null;
          })
          .fillStyle(function(){
              return this.hidden() == "true" ? 
                     "rgba(200,200,200,1)" : 
                     "rgba(200,200,200,0.0001)";
          })
          .event("click", function(scene){
              var legendItem = scene.acts.legendItem;
              if(legendItem.click){
                  return legendItem.click();
              }
          });
      
      var pvLegendProto;
      
      if(this.drawLine && this.drawMarker){
          
          this.pvRule = this.pvLegendPanel.add(pv.Rule)
              .left(0)
              .width(this.markerSize)
              .lineWidth(1)
              .strokeStyle(sceneColorProp);

          this.pvDot = this.pvRule.anchor("center").add(pv.Dot)
              .shapeSize(this.markerSize)
              .shape(function(scene){
                  return myself.shape || scene.acts.legendItem.shape;
              })
             .lineWidth(0)
             .fillStyle(sceneColorProp)
             ;

          pvLegendProto = this.pvRule; // Rule is wider, so text would be over the rule with text margin 0
          
      } else if(this.drawLine) {
      
          this.pvRule = this.pvLegendPanel.add(pv.Rule)
              .left(0)
              .width(this.markerSize)
              .lineWidth(1)
              .strokeStyle(sceneColorProp)
              ;

          pvLegendProto = this.pvRule;
          
      } else { // => if(this.drawMarker) {
          this.pvDot = this.pvLegendPanel.add(pv.Dot)
              .left(this.markerSize / 2)
              .shapeSize(this.markerSize)
              .shape(function(scene){
                  return myself.shape || scene.acts.legendItem.shape;
              })
              .angle(Math.PI/2)
              .lineWidth(2)
              .strokeStyle(sceneColorProp)
              .fillStyle  (sceneColorProp)
              ;

          pvLegendProto = this.pvDot;
      }
    
      this.pvLabel = pvLegendProto.anchor("right").add(pv.Label)
          .text(function(scene){
              // TODO: trim to width - the above algorithm does not update the cellWidth...
              return scene.acts.legendItem.label;
          })
          .font(this.font)
          .textMargin(this.textMargin)
          .textDecoration(function(){ return this.parent.isOn() ? ""      : "line-through"; })
          .textStyle     (function(){ return this.parent.isOn() ? "black" : "#ccc";         });
    },

    applyExtensions: function(){
        this.extend(this.pvPanel,      "legendArea_");
        this.extend(this.pvLegendPanel,"legendPanel_");
        this.extend(this.pvRule,       "legendRule_");
        this.extend(this.pvDot,        "legendDot_");
        this.extend(this.pvLabel,      "legendLabel_");
    },
    
    _buildScene: function(){
        var chart = this.chart,
            maxLabelTextLen = 0,

            /* A root scene that contains all datums */
            rootScene  = new pvc.visual.Scene(null, {panel: this, group: chart.data});

        chart.legendGroupsList.forEach(function(legendGroup){
                createLegendGroupScenes.call(this, legendGroup);
            },
            this);

        rootScene.acts.legendItem = {
            maxLabelTextLen: maxLabelTextLen
        };
        
        return rootScene;

        function createLegendGroupScenes(legendGroup){
            var dataPartAct = ('partValue' in legendGroup) ? {
                                value: legendGroup.partValue,
                                label: legendGroup.partLabel
                              } :
                              null;

            legendGroup.items.forEach(function(legendItem){
                /* Create leaf scene */
                var scene = new pvc.visual.Scene(rootScene, {group: legendItem.group});

                if(dataPartAct){
                    scene.acts.dataPart = dataPartAct;
                }

                var labelTextLen = pvc.text.getTextLength(legendItem.label, this.font);
                if(labelTextLen > maxLabelTextLen) {
                    maxLabelTextLen = labelTextLen;
                }

                legendItem.labelTextLength = labelTextLen;

                /* legendItem special role? */
                scene.acts.legendItem = legendItem;
            }, this);
        }
    }
});