
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
    pvRule: null,
    pvDot: null,
    pvLabel: null,
    
    anchor:     "bottom",
    align:      "left",
    pvLegendPanel: null,
    legend:     null,
    legendSize: null,
    minMarginX: 8,
    minMarginY: 20,
    textMargin: 6,
    padding:    24,
    shape:      null, //"square",
    markerSize: 15,
    drawLine:   false,
    drawMarker: true,
    font:       '10px sans-serif',

    constructor: function(chart, parent, options){
        this.base(chart, parent, options);

        if(!this.shape && (!options || options.shape === undefined)){
            var isV1Compat = (this.chart.options.compatVersion <= 1);
            if(isV1Compat){
                this.shape = 'square';
            }
        }
    },

    /**
     * @override
     */
    _calcLayout: function(availableSize, layoutInfo){
        var myself = this,
            rootScene = this._buildScene(),
            x,
            y;
        
        var legendRoleName = this.chart.legendSource,
            leafCount      = rootScene.childNodes.length;
        
        // Determine the size of the biggest cell
        var maxLabelLen = rootScene.acts[legendRoleName].maxLabelTextLen;
        
        var cellSize = this.markerSize + this.textMargin + maxLabelLen; // ignoring textAdjust

        if(!leafCount){
            this.setWidth(1);
            this.setHeight(1);
        } else {
            var realWidth, realHeight;

            if (this.anchor === "top" || this.anchor === "bottom"){
                this.setWidth(availableSize.width);

                var maxPerLine = leafCount,
                    paddedCellSize = cellSize + this.padding;

                // If the legend is bigger than the available size, multi-line and left align
                var margin = this.minMarginX - this.padding;

                realWidth = maxPerLine * paddedCellSize + margin;

                if(realWidth > this.width){
                    this.align = "left";
                    maxPerLine = Math.floor((this.width - margin) / paddedCellSize);
                    realWidth = maxPerLine * paddedCellSize + margin;
                }

                realHeight = this.padding * Math.ceil(leafCount / maxPerLine);

                if(this.height == null){ // ??
                    this.setHeight(Math.min(availableSize.height, realHeight));
                }

                // Changing margins if the alignment is not "left"
                if(this.align === "right"){
                    this.minMarginX = this.width - realWidth;
                } else if (this.align === "center"){
                    this.minMarginX = (this.width - realWidth) / 2;
                }

                x = function(){
                    return (this.index % maxPerLine) * paddedCellSize + myself.minMarginX;
                };

                this.minMarginY = (this.height - realHeight) / 2;

                y = function(){
                    var n = Math.floor(this.index / maxPerLine);
                    return myself.height  - n * myself.padding - myself.minMarginY - myself.padding / 2;
                };

        } else {

            this.setHeight(availableSize.height);

            realWidth = cellSize + this.minMarginX;
            realHeight = this.padding * leafCount;

            if(this.width == null){ // ??
                this.setWidth(Math.min(availableSize.width, realWidth));
            }

            if(this.align === "middle"){
                this.minMarginY = (this.height - realHeight + this.padding) / 2  ;
            } else if (this.align === "bottom"){
                this.minMarginY = this.height - realHeight;
            }

            x = this.minMarginX;
            y = function(){
                return myself.height - this.index * myself.padding - myself.minMarginY;
            };
        }
      }
      
      /** Other exports */
      def.copy(layoutInfo, {
          x: x,
          y: y,
          rootScene: rootScene
      });
    },
    
    /**
     * @override
     */
    _createCore: function(layoutInfo) {
      var myself = this,
          legendRoleName = this.chart.legendSource,
          rootScene = layoutInfo.rootScene,
          sceneColorProp = function(scene){
              return scene.acts[legendRoleName].color;
          };
      
      this.pvLegendPanel = this.pvPanel.add(pv.Panel)
          .data(rootScene.childNodes)
          .localProperty('hasVisibleDatums', Boolean)
          .hasVisibleDatums(function(scene){
              return scene.group.datums(null, {visible: true}).any();
          })
          .def("hidden", "false")
          .left(layoutInfo.x)
          .bottom(layoutInfo.y)
          .height(this.markerSize)
          .cursor("pointer")
          .fillStyle(function(){
              return this.hidden() == "true"
                 ? "rgba(200,200,200,1)"
                 : "rgba(200,200,200,0.0001)";
          })
          .localProperty('itemColor')
          .event("click", function(scene){
              return myself._toggleVisible(scene);
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
                  if(myself.shape){
                      return myself.shape;
                  }
                  var dataPartValue = scene.acts.dataPart.value;
                  return !dataPartValue || dataPartValue === '0' ? 'square' : 'bar';
              })
             .lineWidth(0)
             .fillStyle(sceneColorProp)
             ;

          pvLegendProto = this.pvDot;
          
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
                  if(myself.shape){
                      return myself.shape;
                  }
                  var dataPartValue = scene.acts.dataPart.value;
                  return !dataPartValue || dataPartValue === '0' ? 'square' : 'bar';
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
              // TODO: trim to width - the above algorithm does not update the cellSize...
              return scene.acts[legendRoleName].label;
          })
          .font(this.font)
          .textMargin(this.textMargin)
          .textDecoration(function(){ return this.parent.hasVisibleDatums() ? ""      : "line-through"; })
          .textStyle     (function(){ return this.parent.hasVisibleDatums() ? "black" : "#ccc";         });
    },

    applyExtensions: function(){
        this.extend(this.pvPanel,      "legendArea_");
        this.extend(this.pvLegendPanel,"legendPanel_");
        this.extend(this.pvRule,       "legendRule_");
        this.extend(this.pvDot,        "legendDot_");
        this.extend(this.pvLabel,      "legendLabel_");
    },
    
    _toggleVisible: function(scene){
        pvc.data.Data.toggleVisible(scene.group.datums());
        
        // Forcing removal of tipsy legends
        pvc.removeTipsyLegends();

        // Re-render chart
        this.chart.render(true, true, false);
    
        return this.pvLabel; // re-render label
    },

    _buildScene: function(){
        var chart = this.chart,
            partValues = chart._partValues() || [null],
            maxLabelTextLen = 0,

            /* A root scene that contains all datums */
            rootScene  = new pvc.visual.Scene(null, {panel: this, group: chart.data});

        partValues.forEach(function(partValue){
                createPartScenes.call(this, chart._legendData(partValue));
            },
            this);

        rootScene.acts[chart.legendSource] = {
            maxLabelTextLen: maxLabelTextLen
        };
        
        return rootScene;

        function createPartScenes(partData){
            var partValue = partData.value,
                partColorScale = chart._legendColorScale(partValue);

            var dataPartAct = {
                value: partValue,
                label: partData.label
            };

            partData
                .children()
                .each(function(leafData){
                    /* Create leaf scene */
                    var scene = new pvc.visual.Scene(rootScene, {group: leafData});

                    scene.acts.dataPart = dataPartAct;

                    var legendValue  = leafData.value,
                        legendLabel  = leafData.label,
                        labelTextLen = pvc.text.getTextLength(legendLabel, chart.font);

                    if(maxLabelTextLen < labelTextLen) {
                        maxLabelTextLen = labelTextLen;
                    }
                    
                    scene.acts[chart.legendSource] = {
                        value: legendValue,
                        label: leafData.label,
                        color: partColorScale(legendValue),
                        labelTextLength: labelTextLen
                    };
                }, this);
        }
    }
});