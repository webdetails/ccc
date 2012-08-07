
/*
 * Legend panel. Generates the legend. Specific options are:
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
    
    anchor:  'bottom',
    
    pvLegendPanel: null,
    
    textMargin: 6,    // The space *between* the marker and the text, in pixels.
    padding:    2.5,  // Half the space *between* legend items, in pixels.
    markerSize: 15,   // *diameter* of marker *zone* (the marker itself may be a little smaller)
    clickMode:  'toggleVisible', // toggleVisible || toggleSelected
    font:  '10px sans-serif',
    
    constructor: function(chart, parent, options){
        if(!options){
            options = {};
        }
        
        var isV1Compat = chart.compatVersion() <= 1;
        if(isV1Compat){
            var anchor = options.anchor || this.anchor;
            var isVertical = anchor !== 'top' && anchor !== 'bottom';
            
            // Previously, an item had a height = to the item padding.
            // So, the item padding included padding + inner height...
            if(options.padding !== undefined){
                options.padding = Math.max(0, (options.padding - 16) / 2);
            } else {
                options.padding = 4;
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
        }
        
        this.base(chart, parent, options);
    },

    /**
     * @override
     */
    _calcLayout: function(layoutInfo){
        return this._getBulletRootScene().layout(layoutInfo);
    },
    
    /**
     * @override
     */
    _createCore: function(layoutInfo) {
      var myself = this,
          clientSize = layoutInfo.clientSize,
          rootScene = this._getBulletRootScene(),
          padding   = rootScene.vars.padding,
          contentSize = rootScene.vars.size,
          sceneColorProp = function(scene){ return scene.color; };
      
       // Names are for horizontal layout (anchor = top or bottom)
      var isHorizontal = this.isAnchorTopOrBottom();
      var a_top    = isHorizontal ? 'top' : 'left';
      var a_bottom = this.anchorOpposite(a_top);    // top or bottom
      var a_width  = this.anchorLength(a_top);      // width or height
      var a_height = this.anchorOrthoLength(a_top); // height or width
      var a_center = isHorizontal ? 'center' : 'middle';
      var a_left   = isHorizontal ? 'left' : 'top';
      var a_right  = this.anchorOpposite(a_left);   // left or right
      
      // When V1 compat or size is fixed to less/more than content needs, 
      // it is still needed to align content inside
      
      // We align all rows left (or top), using the length of the widest row.
      // So "center" is a kind of centered-left align?
      
      var leftOffset = 0;
      switch(this.align){
          case a_right:
              leftOffset = clientSize[a_width] - contentSize.width;
              break;
              
          case a_center:
              leftOffset = (clientSize[a_width] - contentSize.width) / 2;
              break;
      }
      
      this.pvPanel.overflow("hidden");
      
      // ROW - A panel instance per row
      var pvLegendRowPanel = this.pvPanel.add(pv.Panel)
          .data(rootScene.vars.rows) // rows are "lists" of bullet item scenes
          [a_left  ](leftOffset)
          [a_top   ](function(){
              var prevRow = this.sibling(); 
              return prevRow ? (prevRow[a_top] + prevRow[a_height] + padding[a_height]) : 0;
          })
          [a_width ](function(row){ return row.size.width;  })
          [a_height](function(row){ return row.size.height; })
          ;
      
      // ROW > ITEM - A pvLegendPanel instance per bullet item in a row
      this.pvLegendPanel = pvLegendRowPanel.add(pv.Panel)
          .data(function(row){ return row.items; }) // each row has a list of bullet item scenes
          .def("hidden", "false")
          
          .localProperty('group', Object)
          .group(function(itemScene){ return itemScene.group; }) // for rubber band selection support
          
          .lock(a_right,  null)
          .lock(a_bottom, null)
          .lock(a_left, function(clientScene){
              var padding = clientScene.vars.padding;
              var prevItem = this.sibling();
              return prevItem ? 
                      (prevItem[a_left] + prevItem[a_width] + padding[a_width]) : 
                      0;
          })
          .lock('height', function(itemScene){ return itemScene.vars.clientSize.height; })
          
          .lock(a_top,
                  isHorizontal ?
                  // Center items in row's height, that may be higher
                  function(itemScene){
                      var vars = itemScene.vars;
                      return vars.row.size.height / 2 - vars.clientSize.height / 2;
                  } :
                  // Left align items of a same column
                  0)
          
          .lock('width',  
                  isHorizontal ?
                  function(itemScene){ return itemScene.vars.clientSize.width; } :
                  
                   // The biggest child width of the column
                  function(itemScene){
                      return this.parent.width();
                  })
          
          .fillStyle(function(){
              return this.hidden() == "true" ? 
                     "rgba(200,200,200,1)" : 
                     "rgba(200,200,200,0.0001)";
          })
          .cursor(function(itemScene){
              return itemScene.isClickable() ? "pointer" : null;
          })
          .event("click", function(itemScene){
              return itemScene.click();
          })
          ;
      
      // ROW > ITEM > MARKER
      var pvLegendMarkerPanel = this.pvLegendPanel.add(pv.Panel)
          .left  (0)
          .top   (0)
          .right(null)
          .bottom(null)
          .width (function(itemScene){ return itemScene.vars.markerSize; })
          .height(function(itemScene){ return itemScene.vars.clientSize.height; })
          ;
      
      if(pvc.debug >= 20){
          pvLegendRowPanel.strokeStyle('red');
          this.pvLegendPanel.strokeStyle('green');
          pvLegendMarkerPanel.strokeStyle('blue');
      }
      
      /* RULE/MARKER */
      rootScene.childNodes.forEach(function(groupScene){
          var pvGroupPanel = pvLegendMarkerPanel.add(pv.Panel)
                  .visible(function(itemScene){ 
                      return itemScene.parent === groupScene; 
                  });
          
          var renderInfo = groupScene.renderer().create(this, pvGroupPanel);
          groupScene.renderInfo = renderInfo;
      }, this);

      /* LABEL */
      this.pvLabel = pvLegendMarkerPanel.anchor("right").add(pv.Label)
          .textAlign('left') // panel type anchors don't adjust textAlign this way 
          .text(function(itemScene){ return itemScene.vars.value.label; })
          .lock('textMargin', function(itemScene){ return itemScene.vars.textMargin - 4; }) // -3 is to compensate for now the label being anchored to the panel instead of the rule or the dot...
          .font(function(itemScene){ return itemScene.vars.font; }) // TODO: lock?
          .textDecoration(function(itemScene){ return itemScene.isOn() ? "" : "line-through"; })
          .intercept(
                'textStyle',
                labelTextStyleInterceptor,
                this._getExtension('legendLabel', 'textStyle'));
      
      function labelTextStyleInterceptor(getTextStyle, args) {
          var baseTextStyle = getTextStyle ? getTextStyle.apply(this, args) : "black";
          var itemScene = args[0];
          return itemScene.isOn() ? 
                      baseTextStyle : 
                      pvc.toGrayScale(baseTextStyle, null, undefined, 150);
      }
    },

    applyExtensions: function(){
        this.extend(this.pvPanel, "legendArea_");
        this.extend(this.pvLegendPanel,"legendPanel_");
        
        this._getBulletRootScene().childNodes.forEach(function(groupScene){
            groupScene.renderer().extendMarks(this, groupScene.renderInfo, groupScene.extensionPrefix);
        }, this);
        
        this.extend(this.pvLabel, "legendLabel_");
    },
    
    _getSignums: function(){
        // Catches both the marker and the label.
        // Also, if selection changes, renderInteractive re-renders these.
        return [this.pvLegendPanel];
    },
    
    _getBulletRootScene: function(){
        var rootScene = this._rootScene;
        if(!rootScene){
            /* The legend root scene contains all datums of its chart */
            rootScene = new pvc.visual.legend.BulletRootScene(null, {
                panel: this, 
                group: this.chart.data,
                horizontal: this.isAnchorTopOrBottom(),
                font:       this.font,
                markerSize: this.markerSize,
                textMargin: this.textMargin, 
                padding:    this.padding
            });
            
            this._rootScene = rootScene;
        }
        
        return rootScene;
    }
});