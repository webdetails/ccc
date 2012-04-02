
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
    shape:      "square",
    markerSize: 15,
    drawLine:   false,
    drawMarker: true,
    font:       '10px sans-serif',

    create: function(){
        var myself = this,
            c1 = this.chart.colors(),
            c2 = this.chart.secondAxisColor(),
            x,
            y;
    
        var value2Role     = this.chart.options.secondAxis ? 
                             this.chart.visualRoles('value2', {assertExists: false}) : 
                             null,
            value2DimName  = value2Role ? value2Role.grouping.dimensions().first().name : null,
            legendRoleName = this.chart.legendSource,
            data = this.chart.visualRoleData(legendRoleName, {singleLevelGrouping: true}),
            leafCount      = data._leafs.length;
        
        function hasDatumValue2(datum) {
            // 2nd axis?
            if(value2DimName) {
                valueAtom = datum.atoms[value2DimName];
                if(valueAtom && valueAtom.value != null) {
                    return true;
                }
            }
            
            return false;
        }
    
        // Determine the size of the biggest cell
        var maxLabelLen = 0,
            value1Index = 0,
            value2Index = 0,
            leafInfos = data.leafs().object({
                name:  function(leaf){ return leaf.id; },
                value: function(leaf){
                    var label = leaf.absLabel,
                        labelLen = pvc.text.getTextLength(label, this.font),
                        isValue2 = leaf.datums(null, {visible: true}).any(hasDatumValue2);
                    
                    if(maxLabelLen < labelLen) {
                        maxLabelLen = labelLen;
                    }
                    
                    return {
                        label:    label,
                        length:   labelLen,
                        isValue2: isValue2,
                        index:    isValue2 ? value2Index++ : value1Index++
                    };
                },
                context: this}
            );
        
        var cellSize = this.markerSize + this.textMargin + maxLabelLen; // ignoring textAdjust
            
        this.setAnchoredSize(this.legendSize); // may be nully

        var realWidth,
            realHeight;
        if (this.anchor === "top" || this.anchor === "bottom"){
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
            
            if(this.height == null){
                this.setHeight(realHeight);
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
          realWidth = cellSize + this.minMarginX;
          realHeight = this.padding * leafCount;
          
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

      if(this.width == null){
          this.setWidth(realWidth);
      }
      
      this.base();

      //********** Markers and Lines ***************************

      this.pvLegendPanel = this.pvPanel.add(pv.Panel)
          .data(data._leafs)
          .localProperty('hasVisibleDatums', Boolean)
          .hasVisibleDatums(function(leaf){
              return leaf.datums(null, {visible: true}).any();
          })
          .localProperty('isValue2', Boolean)
          .isValue2(function(leaf){ return leafInfos[leaf.id].isValue2; })
          .def("hidden", "false")
          .left(x)
          .bottom(y)
          .height(this.markerSize)
          .cursor("pointer")
          .fillStyle(function(){
              return this.hidden() == "true"
                 ? "rgba(200,200,200,1)"
                 : "rgba(200,200,200,0.0001)";
          })
          .localProperty('itemColor')
          .itemColor(function(leaf){
              var leafInfo = leafInfos[leaf.id];
              return (leafInfo.isValue2 ? c2 : c1)(leafInfo.index);
          })
          .event("click", function(leaf){
              return myself._toggleVisible(leaf);
          });
      
      var pvLegendProto;
      
      if(this.drawLine && this.drawMarker){
          
          this.pvRule = this.pvLegendPanel.add(pv.Rule)
              .left(0)
              .width(this.markerSize)
              .lineWidth(1)
              .strokeStyle(function(){
                  return c1(this.index); // DCL: always 0 ?? // TODO: what to do here??
              });

          this.pvDot = this.pvRule.anchor("center").add(pv.Dot)
              .shapeSize(this.markerSize)
              .shape(function(){
                  return myself.shape ? 
                         myself.shape :
                         (this.parent.isValue2()  ? 'bar' : 'square');
              })
             .lineWidth(0)
             .fillStyle(function(){ return this.parent.itemColor(); })
             ;

          pvLegendProto = this.pvDot;
          
      } else if(this.drawLine) {
      
          this.pvRule = this.pvLegendPanel.add(pv.Rule)
              .left(0)
              .width(this.markerSize)
              .lineWidth(1)
              .strokeStyle(function(){ return this.parent.itemColor(); })
              ;

          pvLegendProto = this.pvRule;
          
      } else if(this.drawMarker) {
          this.pvDot = this.pvLegendPanel.add(pv.Dot)
              .left(this.markerSize / 2)
              .shapeSize(this.markerSize)
              .shape(function(){
                  return myself.shape ? 
                         myself.shape :
                         (this.parent.isValue2()  ? 'bar' : 'square');
              })
              .angle(Math.PI/2)
              .lineWidth(2)
              .strokeStyle(function(){ return this.parent.itemColor(); })
              .fillStyle  (function(){ return this.parent.itemColor(); })
              ;

          pvLegendProto = this.pvDot;
      }
    
      this.pvLabel = pvLegendProto.anchor("right").add(pv.Label)
          .text(function(leaf){
              // TODO: trim to width - the above algorithm does not update the cellSize...
              //leafInfos[leaf.id];
              return leaf.absLabel;
          })
          .font(this.font)
          .textMargin(this.textMargin)
          .textDecoration(function(){ return this.parent.hasVisibleDatums() ? ""      : "line-through"; })
          .textStyle     (function(){ return this.parent.hasVisibleDatums() ? "black" : "#ccc";         });

      // Extend legend
      this.extend(this.pvPanel,      "legendArea_");
      this.extend(this.pvLegendPanel,"legendPanel_");
      this.extend(this.pvRule,       "legendRule_");
      this.extend(this.pvDot,        "legendDot_");
      this.extend(this.pvLabel,      "legendLabel_");
    },

    _toggleVisible: function(leaf){
        pvc.data.Data.toggleVisible(leaf.datums());
        
        // Forcing removal of tipsy legends
        pvc.removeTipsyLegends();

        // Re-render chart
        this.chart.render(true, true);
    
        return this.pvLabel; // re-render label
    }
});