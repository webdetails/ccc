
/*
 * Title panel. Generates the title. Specific options are: <i>title</i> - text.
 * Default: null <i>titlePosition</i> - top / bottom / left / right. Default:
 * top <i>titleSize</i> - The size of the title in pixels. Default: 25
 * 
 * Has the following protovis extension points:
 * 
 * <i>title_</i> - for the title Panel <i>titleLabel_</i> - for the title
 * Label
 */
pvc.TitlePanel = pvc.BasePanel.extend({

    pvLabel: null,
    anchor: 'top',
    align:  'center',
    titlePanel: null,
    title: null,
    titleSize: 25,
    font: "14px sans-serif",
    
    constructor: function(chart, parent, options){
        
        if(!options){
            options = {};
        }
        
        var anchor = options.anchor || this.anchor;
        var isVertical = anchor === 'top' || anchor === 'bottom';
        var isV1Compat = chart.options.compatVersion <= 1;
        
        // Default value of align depends on anchor
        if(options.align === undefined){
            options.align = isVertical ? 'center' : 'middle';
        }
        
        // titleSize
        if(options.size == null){
            var size = options.titleSize;
            if(isV1Compat && size == null){
                size = this.titleSize; // default value
            }
            
            if(size != null){
                // Single size (a number or a string with only one number)
                // should be interpreted as meaning the orthogonal length.
                options.size = new pvc.Size()
                                      .setSize(size, {singleProp: this.anchorOrthoLength(anchor)});
            }
        }
        
        // titleSizeMax
        if(options.sizeMax == null){
            var sizeMax = options.titleSizeMax;
            if(sizeMax != null){
                // Single size (a number or a string with only one number)
                // should be interpreted as meaning the orthogonal length.
                options.sizeMax = new pvc.Size()
                                    .setSize(sizeMax, {singleProp: this.anchorOrthoLength(anchor)});
            }
        }
        
        if(options.paddings == null){
            options.paddings = 4;
        }
        
        this.base(chart, parent, options);
        
        if(options.font === undefined){
            var extensionFont = this._getFontExtension();
            if(typeof extensionFont === 'string'){
                this.font = extensionFont;
            }
        }
    },
    
    _getFontExtension: function(){
        return this._getExtension('titleLabel', 'font');
    },
    
    /**
     * @override
     */
    _calcLayout: function(layoutInfo){
        var requestSize = new pvc.Size();
        
        // TODO: take textAngle, textMargin and textBaseline into account
        
        // Naming is for anchor = top
        var a = this.anchor;
        var a_width  = this.anchorLength(a);
        var a_height = this.anchorOrthoLength(a);
        
        var lines;
        var lineWidth;
        
        var desiredWidth = layoutInfo.desiredClientSize[a_width];
        if(desiredWidth == null){
            var clientWidth = layoutInfo.clientSize[a_width];
            var textWidth = pvc.text.getTextLength(this.title, this.font) + 2; // Small factor to avoid cropping text on either side
            if(textWidth > clientWidth){
                lineWidth = clientWidth;
                lines = pvc.text.justify(this.title, clientWidth, this.font);
            } else {
                lineWidth = textWidth;
            }
            
            desiredWidth = lineWidth;
        } else {
            lineWidth = desiredWidth;
        }
        
        if(!lines){
            lines = this.title ? [this.title] : [];
        }
        
        // -------------
        
        var lineHeight = pvc.text.getTextHeight("m", this.font);
        
        var desiredHeight = layoutInfo.desiredClientSize[a_height];
        if(desiredHeight == null){
            desiredHeight = Math.min(
                        lines.length * lineHeight, 
                        layoutInfo.clientSize[a_height]);
        }
        
        layoutInfo.lines = lines;
        
        layoutInfo.lineSize = {
           width:  lineWidth,
           height: lineHeight
        };
        
        layoutInfo.a_width   = a_width;
        layoutInfo.a_height  = a_height;
        
        requestSize[a_width]  = desiredWidth;
        requestSize[a_height] = desiredHeight;
        
        return requestSize;
    },
    
    /**
     * @override
     */
    _createCore: function(layoutInfo) {
        // Label
        var rotationByAnchor = {
            top: 0,
            right: Math.PI / 2,
            bottom: 0,
            left: -Math.PI / 2
        };
        
        // Hide overflow by default
        this.pvPanel
           .overflow('hidden');
        
        var linePanel = this.pvPanel.add(pv.Panel)
            .data(layoutInfo.lines)
            [pvc.BasePanel.leftTopAnchor[this.anchor]](function(){
                return this.index * layoutInfo.lineSize.height;
            })
            [this.anchorOrtho(this.anchor)](0)
            [layoutInfo.a_height](layoutInfo.lineSize.height)
            [layoutInfo.a_width ](layoutInfo.lineSize.width );
        
        var textAlign = pvc.BasePanel.horizontalAlign[this.align];
        
        this.pvLabel = linePanel.add(pv.Label)
            .text(function(line){ return line; })
            .font(this.font)
            .textAlign(textAlign)
            .textBaseline('middle')
            .left  (function(){ return this.parent.width()  / 2; })
            .bottom(function(){ return this.parent.height() / 2; })
            .textAngle(rotationByAnchor[this.anchor]);

        // Maintained for v1 compatibility
        if (textAlign !== 'center') {
            if (this.isAnchorTopOrBottom()) {
                this.pvLabel
                    .left(null) // reset
                    [textAlign](0);

            } else if (this.anchor == "right") {
                if (textAlign == "left") {
                    this.pvLabel
                        .bottom(null)
                        .top(0);
                } else {
                    this.pvLabel
                        .bottom(0);
                }
            } else if (this.anchor == "left") {
                if (textAlign == "right") {
                    this.pvLabel
                        .bottom(null)
                        .top(0);
                } else {
                    this.pvLabel
                        .bottom(0);
                }
            }
        }
    },
    
    /**
     * @override
     */
    applyExtensions: function(){
        this.extend(this.pvPanel, 'title_');
        this.extend(this.pvLabel, 'titleLabel_');
    }
});
