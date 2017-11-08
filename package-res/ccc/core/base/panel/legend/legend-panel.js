/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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
.init(function(chart, parent, options) {

    this.base(chart, parent, options);

    if(options.font === undefined) {
        var extFont = this._getConstantExtension('label', 'font');
        if(extFont) this.font = extFont;
    }

    // Undo base Clickable handling.
    // It doesn't matter if the chart's clickable is false.
    // Legend clickable depends on each legend scene's clickMode.
    var I = pvc.visual.Interactive;
    //noinspection JSBitwiseOperatorUsage
    if(this._ibits & I.Interactive) this._ibits |= I.Clickable;
})
.add({
    pvRule: null,
    pvDot: null,
    pvLabel: null,

    anchor: 'bottom',

    pvLegendPanel: null,

    textMargin:  6,    // The space *between* the marker and the text, in pixels.
    itemPadding: 2.5,  // Half the space *between* legend items, in pixels.
    itemSize:    null, // Item size, including padding. When unspecified, item size is dependent on each items text.
    markerSize:  15,   // *diameter* of marker *zone* (the marker itself may be a little smaller)
    font:  '10px sans-serif',

    /**
     * @override
     */
    _calcLayout: function(layoutInfo) {
        return this._getRootScene().layout(layoutInfo);
    },

    /**
     * @override
     */
    _createCore: function(layoutInfo) {
      var clientSize = layoutInfo.clientSize,
          rootScene = this._getRootScene(),
          itemPadding = rootScene.vars.itemPadding,
          contentSize = rootScene.vars.contentSize,

          // Names are for horizontal layout (anchor = top or bottom)
          isHorizontal = this.isAnchorTopOrBottom(),
          a_top    = isHorizontal ? 'top' : 'left',
          a_bottom = this.anchorOpposite(a_top),    // bottom or right
          a_width  = this.anchorLength(a_top),      // width or height
          a_height = this.anchorOrthoLength(a_top), // height or width
          a_center = isHorizontal ? 'center' : 'middle',
          a_left   = isHorizontal ? 'left'   : 'top',
          a_right  = this.anchorOpposite(a_left);   // right or bottom

      // When V1 compat or size is fixed to less/more than content needs,
      // it is still needed to align content inside

      // Rows are aligned left (or top), using the length of the widest row.
      // So "center" is a kind of centered-left align?

      var leftOffset = 0;
      switch(this.align) {
          case a_right : leftOffset =  clientSize[a_width] - contentSize[a_width];      break;
          case a_center: leftOffset = (clientSize[a_width] - contentSize[a_width]) / 2; break;
      }

      this.pvPanel.borderPanel.overflow("hidden");

      // SECTION - A panel instance per section
      var pvLegendSectionPanel = this.pvPanel.add(pv.Panel)
          .data(rootScene.vars.sections) // <=== NOTE: sections are "lists" of item scenes
          [a_left  ](leftOffset)
          [a_top   ](function() {
              var prevSection = this.sibling();
              return prevSection ? (prevSection[a_top] + prevSection[a_height] + itemPadding[a_height]) : 0;
          })
          [a_width ](function(section) { return section.size[a_width ]; })
          [a_height](function(section) { return section.size[a_height]; });

      var wrapper;
      if(this.compatVersion() <= 1) {
          wrapper = function(v1f) {
              return function(itemScene) { return v1f.call(this, itemScene.vars.value.rawValue); };
          };
      }

      // SECTION > ITEM - A pvLegendPanel instance per item in a section
      var pvLegendItemPanel = this.pvLegendPanel = new pvc.visual.Panel(this, pvLegendSectionPanel, {
              extensionId:   'panel',
              wrapper:       wrapper,
              noSelect:      false,
              noHover:       true,
              noClick:       false, // see also #_onClick below and constructor change of Clickable
              noClickSelect: true   // just rubber-band (the click is for other behaviors)
          })
          .pvMark
          .lock('data', function(section) { return section.items; }) // each section has a list of item scenes
          [a_right](null)
          [a_bottom](null)
          [a_left](function(clientScene) {
              var index = this.index, prevItem;

              // First previous visible sibling.
              // TODO: This is less than optimal cause no reflow from following sections is made
              // to make up for freed space.
              // For simple cases, that only have one section, it's a nice feature, though.
              while(index > 0 && !(prevItem = this.scene[--index]).visible);

              return prevItem && prevItem.visible
                  ? (prevItem[a_left] + prevItem[a_width] + clientScene.vars.itemPadding[a_width])
                  : 0;
          })
          [a_top](isHorizontal
            ? // Center items in row's height, that may be taller than the item
              function(itemScene) {
                  var vars = itemScene.vars;
                  return vars.section.size.height / 2 - vars.itemClientSize.height / 2;
              }
            : // Left align items of a same column
              0)
          ['height'](function(itemScene) { return itemScene.vars.itemClientSize.height; })
          ['width'](isHorizontal ?
              function(itemScene) { return itemScene.vars.itemClientSize.width; } :

               // The biggest child width of the column
              function(/*itemScene*/) { return this.parent.width(); });

      // See Chart#_maybeCreateLegendGroupScene for a diagram of the structure of these panels.

      // SECTION > ITEM > MARKER
      var pvLegendMarkerPanel = new pvc.visual.Panel(this, pvLegendItemPanel, {
              extensionId: 'markerPanel'
          })
          .pvMark
          .left(0)
          .top (0)
          .right (null)
          .bottom(null)
          .width (function(itemScene) { return itemScene.vars.markerSize; })
          .height(function(itemScene) { return itemScene.vars.itemClientSize.height; });

      if(def.debug >= 20) {
          pvLegendSectionPanel.strokeStyle('red'  ).lineWidth(0.5).strokeDasharray('.');
          pvLegendItemPanel   .strokeStyle('green').lineWidth(0.5).strokeDasharray('.');
          pvLegendMarkerPanel .strokeStyle('blue' ).lineWidth(0.5).strokeDasharray('.');
      }

      /* RULE/MARKER */
      // For each group scene (each color axis), a distinct panel mark is created
      // to hold
      rootScene.childNodes.forEach(function(groupScene) {

          // The marks: pvPanel, pvLegendSectionPanel and pvLegendItemPanel follow a
          // layout hierarchy: rootScene.vars.sections and then section.items.
          // This is not the actual parent/children hierarchy with which these scenes were built,
          // which is actually root -> group -> item.
          //
          // So, child marks of pvLegendMarkerPanel get an itemScene, whose parent is a groupScene.
          // Each of the following panel marks will show a single instance when the
          // inherited item's group is groupScene.
          var pvGroupPanel = new pvc.visual.Panel(this, pvLegendMarkerPanel)
                  .pvMark
                  .visible(function(itemScene) {
                      return itemScene.parent === groupScene;
                  });

          // Now let this group scene's renderer to add its own marks to the group panel.
          groupScene.renderer()(this, pvGroupPanel, wrapper);
      }, this);

      /* LABEL */
      this.pvLabel = new pvc.visual.Label(this, pvLegendMarkerPanel.anchor('right'), {
              extensionId: 'label',
              noTooltip:   false, // see #_getTooltipFormatter
              noClick:     false,
              wrapper:     wrapper
          })
          .intercept('textStyle', function(itemScene) {
              this._finished = false;

              var baseTextStyle = this.delegateExtension() || "black";

              return this._finished || itemScene.isOn()
                  ? baseTextStyle
                  : pvc.toGrayScale(baseTextStyle, null, undefined, 150);
          })
          .pvMark
          .textAlign('left') // panel type anchors don't adjust textAlign this way
          .text(function(itemScene) {
              var text = itemScene.labelText(),
                vars = itemScene.vars;
            if(vars.textSize.width > vars.labelWidthMax)
                text = pvc.text.trimToWidthB(vars.labelWidthMax, text, vars.font, "..", false);
            return text;
          })
          .textMargin(function(itemScene) { return itemScene.vars.textMargin; })
          .font(function(itemScene) { return itemScene.vars.font; })
          .textDecoration(function(itemScene) { return itemScene.isOn() ? "" : "line-through"; })
          .cursor(function(itemScene) { return itemScene.executable() ? "pointer" : "default"});

      if(def.debug >= 16) {
          pvLegendMarkerPanel.anchor("right")
              // Single-point panel (w=h=0)
              .add(pv.Panel)
                  [this.anchorLength()](0)
                  [this.anchorOrthoLength()](0)
                  .fillStyle(null)
                  .strokeStyle(null)
                  .lineWidth(0)
               .add(pv.Line)
                  .data(function(scene) {
                      var vars = scene.vars,
                          labelBBox  = pvc.text.getLabelBBox(
                              Math.min(vars.labelWidthMax, vars.textSize.width),
                              vars.textSize.height * 2/3,
                              'left',
                              'middle',
                              0,
                              vars.textMargin),
                          corners = labelBBox.source.points();

                      // Close the path
                      // not changing corners on purpose
                      if(corners.length > 1) corners = corners.concat(corners[0]);

                      return corners;
                  })
                  .left(function(p) { return p.x; })
                  .top (function(p) { return p.y; })
                  .strokeStyle('red')
                  .lineWidth(0.5)
                  .strokeDasharray('-');
      }
    },

    _onClick: function(context) {
        var scene = context.scene;
        if(def.fun.is(scene.execute) && scene.executable()) scene.execute();
    },

    _getExtensionPrefix: function() { return 'legend'; },
    _getExtensionId:     function() { return 'area';   },

    // Catches both the marker and the label.
    // Also, if selection changes, renderInteractive re-renders these.
    _getSelectableMarks: function() { return [this.pvLegendPanel.parent]; },

    _getRootScene: function() {
        var rootScene = this._rootScene;
        if(!rootScene)
            this._rootScene = rootScene = new pvc.visual.legend.LegendRootScene(null, {
                panel:        this,
                source:       this.chart.data, // The legend root scene contains all datums of its chart
                horizontal:   this.isAnchorTopOrBottom(),
                font:         this.font,
                markerSize:   this.markerSize,
                textMargin:   this.textMargin,
                itemPadding:  this.itemPadding,
                itemSize:     this.itemSize,
                itemCountMax: this.itemCountMax,
                overflow:     this.overflow
            });

        return rootScene;
    },

    _getTooltipFormatter: function(tipOptions) {
        tipOptions.isLazy = false;
        return function(context) {
          // Only return tooltip text if the text is trimmed (!=).
          var valueVar = context.scene.vars.value,
              valueText = valueVar.absLabel || valueVar.label,
              itemText  = context.pvMark.text();

          return valueText !== itemText ? valueText : "";
        };
    }
});
