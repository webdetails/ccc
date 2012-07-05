
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
    legendSizeMax: null,
    
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
        
        var anchor = options.anchor || this.anchor;
        
        var isV1Compat = chart.options.compatVersion <= 1;
        var isVertical = anchor !== 'top' && anchor !== 'bottom';
        
        if(isVertical && options.align === undefined){
            options.align = 'top';
        }
        
        // legendSize
        if(options.size == null){
            var size = options.legendSize;
            if(size != null){
                // Single size (a number or a string with only one number)
                // should be interpreted as meaning the orthogonal length.
                options.size = new pvc.Size()
                                 .setSize(size, {singleProp: this.anchorOrthoLength(anchor)});
            }
        }
        
        // legendSizeMax
        if(options.sizeMax == null){
            var sizeMax = options.legendSizeMax;
            if(sizeMax != null){
                // Single size (a number or a string with only one number)
                // should be interpreted as meaning the orthogonal length.
                options.sizeMax = new pvc.Size()
                                    .setSize(sizeMax, {singleProp: this.anchorOrthoLength(anchor)});
            }
        }
        
        if(isV1Compat){
            if(options.padding === undefined){
                // Default value changed (and the meaning of the property also)
                options.padding = 24;
            }
            
            if(options.shape === undefined){
                options.shape = 'square';
            }
            
            // V1 minMarginX/Y were included in the size of the legend,
            // so these correspond to padding
            var minMarginX = Math.max(def.get(options, 'minMarginX', 8), 0);
            
            // V1 only implemented minMarginY for vertical and align = 'top'
            var minMarginY;
            if(isVertical && (options.align !== 'middle' && options.align !== 'bottom')){
                minMarginY = Math.max(def.get(options, 'minMarginY', 20) - 20, 0);
            } else {
                minMarginY = 0;
            }
            
            options.paddings = { left: minMarginX, top: minMarginY };
        } else {
            // Set default margins
            if(options.margins === undefined){
                options.margins = def.set({}, this.anchorOpposite(anchor), 10);
            }
        }
        
        this.base(chart, parent, options);
    },

    /**
     * @override
     */
    _calcLayout: function(layoutInfo){
        var positionProps = {
            left: null, 
            top:  null
        };
        var clientSize     = layoutInfo.clientSize;
        var requiredSize   = new pvc.Size(1,1);
        var paddedCellSize = new pvc.Size(1,1);
        var rootScene = this._buildScene();
        var leafCount = rootScene.childNodes.length;
        var overflowed = true;
        var clipPartialContent = false;
        
        function finish(){
            /** Other exports */
            def.copy(layoutInfo, {
                rootScene:  rootScene,
                leftProp:   positionProps.left,
                topProp:    positionProps.top,
                cellSize:   paddedCellSize,
                overflowed: overflowed
            });
            
            return requiredSize;
        }
        
        if(!leafCount){
            overflowed = false;
            return finish();
        }
        
        if(!(clientSize.width > 0 && clientSize.height > 0)){
            return finish();
        }
        
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
        if(!maxCellsPerRow){
            if(clipPartialContent){
                return finish();
            }
            maxCellsPerRow = 1;
        }
        
        var cellsPerRow = Math.min(leafCount, maxCellsPerRow);
        var rowWidth    = cellsPerRow * paddedCellSize[a_width];
        var rowCount    = Math.ceil(leafCount / cellsPerRow);
        var tableHeight = rowCount * paddedCellSize[a_height];
        
        if(tableHeight > clientSize[a_height]){
            tableHeight = clientSize[a_height];
            if(clipPartialContent){
                // reduce row count
                rowCount = ~~(tableHeight / paddedCellSize[a_height]);
                
                if(!rowCount){
                    // Nothing fits entirely
                    return finish();
                }
                
                var maxLeafCount = cellsPerRow * rowCount;
                while(leafCount > maxLeafCount){
                    rootScene.removeAt(leafCount--);
                }
            }
        }
        
        // ----------------------
        
        overflowed = false;
        
        // Request used width / all available width (V1)
        requiredSize[a_width ] = !isV1Compat ? rowWidth : clientSize[a_width];
        requiredSize[a_height] = tableHeight;
        
        // NOTE: V1 behavior requires keeping alignment code here
        // even if it is also being performed in the layout...
        
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
        
        return finish();
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
      
      this.pvPanel.overflow("hidden");
          
      this.pvLegendPanel = this.pvPanel.add(pv.Panel)
          .data(rootScene.childNodes)
          .localProperty('isOn', Boolean)
          .isOn(function(scene){ return scene.acts.legendItem.isOn(); })
          .def("hidden", "false")
          .left(layoutInfo.leftProp)
          .top(layoutInfo.topProp)
          .height(layoutInfo.cellSize.height)
          .width(layoutInfo.cellSize.width)
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
          .textDecoration(function(){ return this.parent.isOn() ? "" : "line-through"; })
          .intercept(
                'textStyle',
                labelTextStyleInterceptor,
                this._getExtension('legendLabel', 'textStyle'));
          
      function labelTextStyleInterceptor(getTextStyle, args) {
          var baseTextStyle = getTextStyle ? getTextStyle.apply(this, args) : "black";
          return this.parent.isOn() ? 
                      baseTextStyle : 
                      pvc.toGrayScale(baseTextStyle, null, undefined, 150);
      }
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