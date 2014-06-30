/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_Size:true */

def
.type('pvc.TitlePanelAbstract', pvc.BasePanel)
.init(function(chart, parent, options) {

    if(!options) options = {};

    var anchor = options.anchor || this.anchor;

    // titleSize
    if(options.size == null) {
        var size = options.titleSize;
        if(size != null) {
            // Single size (a number or a string with only one number)
            // should be interpreted as meaning the orthogonal length.
            options.size = new pvc_Size().setSize(size, {
                singleProp: this.anchorOrthoLength(anchor)
            });
        }
    }

    // titleSizeMax
    if(options.sizeMax == null) {
        var sizeMax = options.titleSizeMax;
        if(sizeMax != null) {
            // Single size (a number or a string with only one number)
            // should be interpreted as meaning the orthogonal length.
            options.sizeMax = new pvc_Size().setSize(sizeMax, {
                singleProp: this.anchorOrthoLength(anchor)
            });
        }
    }

    if(options.paddings == null) options.paddings = this.defaultPaddings;

    this.base(chart, parent, options);

    if(options.font === undefined) {
        var extensionFont = this._getExtension('label', 'font');
        if(typeof extensionFont === 'string') this.font = extensionFont;
    }
})
.add({
    pvLabel: null,
    anchor: 'top',

    title: null,
    titleSize: undefined,
    font: "12px sans-serif",

    defaultPaddings: 2,
    
    _extensionPrefix: 'title',
    
    /** @override */
    _calcLayout: function(layoutInfo) {
        // TODO: take textAngle, textMargin and textBaseline into account

        var requestSize = new pvc_Size(),
            // Naming is for anchor = top
            a = this.anchor,
            a_width = this.anchorLength(a),
            a_height = this.anchorOrthoLength(a),

            // 2 - Small factor to avoid cropping text on either side
            textWidth    = pv.Text.measureWidth(this.title, this.font) + 2,
            clientWidth  = layoutInfo.clientSize[a_width],
            desiredWidth = layoutInfo.desiredClientSize[a_width];

        if(desiredWidth == null)
            desiredWidth = textWidth > clientWidth ? clientWidth : textWidth;
        else if(desiredWidth > clientWidth)
            desiredWidth = clientWidth;

        var title = this.title,
            lines = !title ? [] :
                    (textWidth > desiredWidth) ? pvc.text.justify(title, desiredWidth, this.font) :
                    [title],

            lineHeight = pv.Text.fontHeight(this.font),
            realHeight = lines.length * lineHeight,
            availableHeight = layoutInfo.clientSize[a_height],
            desiredHeight   = layoutInfo.desiredClientSize[a_height];

        if(desiredHeight == null)
            desiredHeight = realHeight;
        else if(desiredHeight > availableHeight)
            desiredHeight = availableHeight;

        if(realHeight > desiredHeight) {
            // Don't show partial lines unless it is the only one left
            var maxLineCount = Math.max(1, Math.floor(desiredHeight / lineHeight));
            if(lines.length > maxLineCount) {
                var firstCroppedLine = lines[maxLineCount];

                lines.length = maxLineCount;

                realHeight = desiredHeight = maxLineCount * lineHeight;

                var lastLine = lines[maxLineCount - 1] + " " + firstCroppedLine;

                lines[maxLineCount - 1] = pvc.text.trimToWidthB(desiredWidth, lastLine, this.font, "..");
            }
        }

        layoutInfo.lines = lines;
        layoutInfo.topOffset = (desiredHeight - realHeight) / 2;
        layoutInfo.lineSize = {width: desiredWidth, height: lineHeight};
        layoutInfo.a_width = a_width;
        layoutInfo.a_height = a_height;

        requestSize[a_width] = desiredWidth;
        requestSize[a_height] = desiredHeight;

        return requestSize;
    },

    /** @override */
    _createCore: function(layoutInfo) {
        var rootScene = this._buildScene(layoutInfo),
            // Label
            rotationByAnchor = {
                top:    0,
                right:  Math.PI / 2,
                bottom: 0,
                left:   -Math.PI / 2
            },
            textAlign = pvc.BasePanel.horizontalAlign[this.align],
            textAnchor = pvc.BasePanel.leftTopAnchor[this.anchor],
            wrapper;

        if(this.compatVersion() <= 1) wrapper = function(v1f) {
            return function(itemScene) { return v1f.call(this); };
        };

        this.pvLabel = new pvc.visual.Label(this, this.pvPanel, {
                extensionId: 'label',
                wrapper:     wrapper
            })
            .lock('data', rootScene.lineScenes)
            .pvMark
            [textAnchor](function(lineScene) {
                return layoutInfo.topOffset + 
                       lineScene.vars.size.height / 2 +
                       this.index * lineScene.vars.size.height;
            })
            .textAlign(textAlign)
            [this.anchorOrtho(textAnchor)](function(lineScene) {
                switch(this.textAlign()) {
                    case 'center': return lineScene.vars.size.width / 2;
                    case 'left':   return 0;
                    case 'right':  return lineScene.vars.size.width;
                }
            })
            .text(function(lineScene) { return lineScene.vars.textLines[this.index]; })
            .font(this.font)
            .textBaseline('middle') // layout code does not support changing this
            .textAngle(rotationByAnchor[this.anchor]);
    },
    
    _buildScene: function(layoutInfo) {
        var rootScene = new pvc.visual.Scene(null, {panel: this, source: this.chart.data}),
            textLines = layoutInfo.lines;
        
        rootScene.vars.size  = layoutInfo.lineSize;
        rootScene.vars.textLines = textLines;
        rootScene.lineScenes = def.array.create(textLines.length, rootScene);
        
        return rootScene;
    },
    
    _getExtensionId: def.fun.constant('')
});
