
pvc.TitlePanelAbstract = pvc.BasePanel.extend({

    pvLabel: null,
    anchor: 'top',
    align:  'center',
    title: null,
    titleSize: undefined,
    font: "12px sans-serif",
    
    defaultPaddings: 2,
    
    constructor: function(chart, parent, options){
        
        if(!options){
            options = {};
        }
        
        var anchor = options.anchor || this.anchor;
        var isVertical = anchor === 'top' || anchor === 'bottom';
        
        // Default value of align depends on anchor
        if(options.align === undefined){
            options.align = isVertical ? 'center' : 'middle';
        }
        
        // titleSize
        if(options.size == null){
            var size = options.titleSize;
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
            options.paddings = this.defaultPaddings;
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
        
        var desiredWidth = layoutInfo.desiredClientSize[a_width];
        if(desiredWidth == null){
            desiredWidth = pvc.text.getTextLength(this.title, this.font) + 2; // Small factor to avoid cropping text on either side
        }
        
        var lines;
        var clientWidth = layoutInfo.clientSize[a_width];
        if(desiredWidth > clientWidth){
            desiredWidth = clientWidth;
            lines = pvc.text.justify(this.title, desiredWidth, this.font);
        } else {
            lines = this.title ? [this.title] : [];
        }
        
        // -------------
        
        var lineHeight = pvc.text.getTextHeight("m", this.font);
        var realHeight = lines.length * lineHeight;
        
        var desiredHeight = layoutInfo.desiredClientSize[a_height];
        if(desiredHeight == null){
            desiredHeight = realHeight;
        }
        
        var availableHeight = layoutInfo.clientSize[a_height];
        if(desiredHeight > availableHeight){
            // Don't show partial lines unless it is the only one left
            var maxLineCount = Math.max(1, Math.floor(availableHeight / lineHeight));
            if(lines.length > maxLineCount){
                var firstCroppedLine = lines[maxLineCount];  
                
                lines.length = maxLineCount;
                
                realHeight = desiredHeight = maxLineCount * lineHeight;
                
                var lastLine = lines[maxLineCount - 1] + " " + firstCroppedLine;
                
                lines[maxLineCount - 1] = pvc.text.trimToWidthB(desiredWidth, lastLine, this.font, "..");
            }
        }
        
        layoutInfo.lines = lines;
        layoutInfo.topOffset = (desiredHeight - realHeight) / 2;
        layoutInfo.lineSize = {
           width:  desiredWidth,
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
        
        var linePanel = this.pvPanel.add(pv.Panel)
            .data(layoutInfo.lines)
            [pvc.BasePanel.leftTopAnchor[this.anchor]](function(){
                return layoutInfo.topOffset + this.index * layoutInfo.lineSize.height;
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