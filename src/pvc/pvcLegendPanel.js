
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
def
.type('pvc.LegendPanel', pvc.BasePanel)
.add({
    pvRule: null,
    pvDot: null,
    pvLabel: null,
    
    anchor: 'bottom',
    
    pvLegendPanel: null,
    
    textMargin: 6,    // The space *between* the marker and the text, in pixels.
    itemPadding:    2.5,  // Half the space *between* legend items, in pixels.
    markerSize: 15,   // *diameter* of marker *zone* (the marker itself may be a little smaller)
    font:  '10px sans-serif',

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
      var clientSize = layoutInfo.clientSize,
          rootScene = this._getBulletRootScene(),
          itemPadding   = rootScene.vars.itemPadding,
          contentSize = rootScene.vars.size;
      
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
              return prevRow ? (prevRow[a_top] + prevRow[a_height] + itemPadding[a_height]) : 0;
          })
          [a_width ](function(row){ return row.size.width;  })
          [a_height](function(row){ return row.size.height; })
          ;
      
      var wrapper;
      if(this.compatVersion() <= 1){
          wrapper = function(v1f){
              return function(itemScene){
                  return v1f.call(this, itemScene.vars.value.rawValue);
              };
          };
      }
      
      // ROW > ITEM - A pvLegendPanel instance per bullet item in a row
      this.pvLegendPanel = new pvc.visual.Panel(this, pvLegendRowPanel, {
              extensionId: 'panel',
              wrapper:     wrapper,
              noSelect:    false,
              noClickSelect: true // just rubber-band (the click is for other behaviors)
          })
          .lockMark('data', function(row){ return row.items; }) // each row has a list of bullet item scenes
          .lock(a_right,  null)
          .lock(a_bottom, null)
          .lockMark(a_left, function(clientScene){
              var itemPadding  = clientScene.vars.itemPadding;
              var prevItem = this.sibling();
              return prevItem ? 
                      (prevItem[a_left] + prevItem[a_width] + itemPadding[a_width]) : 
                      0;
          })
          .lockMark('height', function(itemScene){ return itemScene.vars.clientSize.height; })
          .lockMark(a_top,
                  isHorizontal ?
                  // Center items in row's height, that may be higher
                  function(itemScene){
                      var vars = itemScene.vars;
                      return vars.row.size.height / 2 - vars.clientSize.height / 2;
                  } :
                  // Left align items of a same column
                  0)
          .lockMark('width',  
                  isHorizontal ?
                  function(itemScene){ return itemScene.vars.clientSize.width; } :
                  
                   // The biggest child width of the column
                  function(/*itemScene*/){ return this.parent.width(); })
          .pvMark
          .def("hidden", "false")
          .fillStyle(function(){ // TODO: ??
              return this.hidden() == "true" ? 
                     "rgba(200,200,200,1)" : 
                     "rgba(200,200,200,0.0001)";
          })
          .cursor(function(itemScene){
              return itemScene.isClickable() ? "pointer" : null;
          })
          .event("click", function(itemScene){
              if(itemScene.isClickable()){
                  return itemScene.click();
              }
          })
          ;
      
      // ROW > ITEM > MARKER
      var pvLegendMarkerPanel = new pvc.visual.Panel(this, this.pvLegendPanel)
          .pvMark
          .left(0)
          .top (0)
          .right (null)
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
          var pvGroupPanel = new pvc.visual.Panel(this, pvLegendMarkerPanel)
                  .pvMark
                  .visible(function(itemScene){
                      return itemScene.parent === groupScene; 
                  });
          
          groupScene.renderer().create(this, pvGroupPanel, groupScene.extensionPrefix, wrapper);
      }, this);

      /* LABEL */
      this.pvLabel = new pvc.visual.Label(this, pvLegendMarkerPanel.anchor("right"), {
              extensionId: 'label',
              wrapper: wrapper
          })
          .intercept('textStyle', function(itemScene) {
              var baseTextStyle = this.delegateExtension() || "black";
              return itemScene.isOn() ? 
                          baseTextStyle : 
                          pvc.toGrayScale(baseTextStyle, null, undefined, 150);
          })
          .pvMark
          .textAlign('left') // panel type anchors don't adjust textAlign this way
          .text(function(itemScene){ return itemScene.vars.value.label; })
          // -4 is to compensate for now the label being anchored to the panel instead of the rule or the dot...
          .lock('textMargin', function(itemScene){ return itemScene.vars.textMargin - 4; })
          .font(function(itemScene){ return itemScene.vars.font; }) // TODO: lock?
          .textDecoration(function(itemScene){ return itemScene.isOn() ? "" : "line-through"; })
          ;
    },

    _getExtensionId: function(){
        return 'area'; 
    },
    
    _getExtensionPrefix: function(){
        return 'legend'; 
    },
    
    _getSelectableMarks: function(){
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
                itemPadding:    this.itemPadding
            });
            
            this._rootScene = rootScene;
        }
        
        return rootScene;
    }
});