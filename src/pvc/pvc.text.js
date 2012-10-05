
// Text measurement utility
def.scope(function(){
    /*global document:true */
    
    var _currentFontSizeCache;
    
    function createCache(){
        return new pvc.text.FontSizeCache();
    }
    
    function useCache(cache, fun, ctx){
        /*jshint expr:true */
        (cache instanceof pvc.text.FontSizeCache) || def.fail.operationInvalid("Not a valid text cache.");
        
        var prevCache = _currentFontSizeCache;
        _currentFontSizeCache = cache;
        try{
            return fun.call(ctx);
        } finally {
            _currentFontSizeCache = prevCache;
        }
    }
    
    function getTextSize(text, font){
        if(text == null){
            text = "";
        } else {
            text = "" + text;
        }
        
        var bbox = _currentFontSizeCache && _currentFontSizeCache.get(font, text);
        if(!bbox){
            bbox = getTextSizeCore(text, font);
            if(_currentFontSizeCache){
                _currentFontSizeCache.put(font, text, bbox);
            }
        }
        
        return bbox;
    }
    
    function getTextLength(text, font){
        return getTextSize(text, font).width;
    }

    function getTextHeight(text, font){
        return getTextSize(text, font).height;
    }
    
    // TODO: if not in px?..
    function getFontSize(font){
        if(pv.renderer() === 'batik'){
            var sty = document.createElementNS('http://www.w3.org/2000/svg','text').style;
            sty.setProperty('font',font);
            return parseInt(sty.getProperty('font-size'), 10);
        }

        var holder = getTextSizePlaceholder();
        holder.css('font', font);
        return parseInt(holder.css('font-size'), 10);
    }

    function getFitInfo(w, h, text, font, diagMargin){
        if(text === '') {
            return {h: true, v: true, d: true};
        }
        
        var len = getTextLength(text, font);
        return {
            h: len <= w,
            v: len <= h,
            d: len <= Math.sqrt(w*w + h*h) - diagMargin
        };
    }

    function trimToWidthB(len, text, font, trimTerminator, before){
        len += getTextLength(trimTerminator, font);
        
        return trimToWidth(len, text, font, trimTerminator, before);
    }
    
    function trimToWidth(len, text, font, trimTerminator, before){
        if(text === '') {
            return text;
        }
  
        var textLen = getTextLength(text, font);
        if(textLen <= len){
            return text;
        }
    
        if(textLen > len * 1.5){ //cutoff for using other algorithm
            return trimToWidthBin(len,text,font,trimTerminator, before);
        }
    
        while(textLen > len){
            text = before ? text.slice(1) : text.slice(0,text.length -1);
            textLen = getTextLength(text, font);
        }
    
        return before ? (trimTerminator + text) : (text + trimTerminator);
    }
    
    function justifyText(text, lineWidth, font){
        var lines = [];
        
        if(lineWidth < getTextLength('a', font)){
            // Not even one letter fits...
            return lines;
        } 
        
        var words = (text || '').split(/\s+/);
        
        var line = "";
        while(words.length){
            var word = words.shift();
            if(word){
                var nextLine = line ? (line + " " + word) : word;
                if(pvc.text.getTextLength(nextLine, font) > lineWidth){
                    // The word by itself may overflow the line width
                    
                    // Start new line
                    if(line){
                        lines.push(line);
                    }
                    
                    line = word;
                } else {
                    line = nextLine; 
                }
            }
        }
        
        if(line){
            lines.push(line);
        }
        
        return lines;
    }
    
    function getLabelPolygon(textWidth, textHeight, align, baseline, angle, margin){
        // From protovis' SvgLabel.js
        
        // x, y are the position of the left-bottom corner
        // of the text relative to its anchor point (at x=0,y=0)
        // x points right, y points down
        var x, y;
        
        switch (baseline) {
            case "middle":
                y = textHeight / 2; // estimate middle (textHeight is not em, the height of capital M)
                break;
              
            case "top":
                y = margin + textHeight;
                break;
          
            case "bottom":
                y = -margin; 
                break;
        }
        
        switch (align) {
            case "right": 
                x = -margin -textWidth; 
                break;
          
            case "center": 
                x = -textWidth / 2;
                break;
          
            case "left": 
                x = margin;
                break;
        }
        
        var bl = pv.vector(x, y);
        var br = bl.plus(textWidth, 0);
        var tr = br.plus(0, -textHeight);
        var tl = bl.plus(0, -textHeight);
        
        // Rotate
        
        if(angle !== 0){
            bl = bl.rotate(angle);
            br = br.rotate(angle);
            tl = tl.rotate(angle);
            tr = tr.rotate(angle);
        }
        
        return new pvc.Polygon([bl, br, tr, tl]);
    }
    
    /* Returns a label's BBox relative to its anchor point */
    function getLabelBBox(textWidth, textHeight, align, baseline, angle, margin){
        
        var polygon = getLabelPolygon(textWidth, textHeight, align, baseline, angle, margin);
        var corners = polygon.corners();
        var bbox;
        if(angle === 0){
            var min = corners[3]; // topLeft
            var max = corners[1]; // bottomRight
            
            bbox = new pvc.Rect(min.x, min.y, max.x - min.x, max.y - min.y);
        } else {
            bbox = polygon.bbox();
        }
        
        bbox.sourcePolygon   = polygon;
        bbox.sourceCorners   = corners;
        bbox.sourceAngle     = angle;
        bbox.sourceAlign     = align;
        bbox.sourceTextWidth = textWidth;
        
        return bbox;
    }
    
    // --------------------------
    // private
    var $textSizePlaceholder = null,
        _svgText = null,
        _svgTextFont = null,
        textSizePlaceholderId = 'cccTextSizeTest_' + new Date().getTime();
    
    function getTextSizeCore(text, font){
        if(!text){
            return {width: 0, height: 0};
        }
        
        switch(pv.renderer()){
            case 'vml':   return getTextSizeVML(text, font);
            case 'batik': return getTextSizeCGG(text, font);
        }

        return getTextSizeSVG(text, font);
    }
    
    function getTextSizeSVG(text, font){
        if(!_svgText){
            var holder  = getTextSizePlaceholder();
            var svgElem = pv.SvgScene.create('svg');
            svgElem.setAttribute('font-size', '10px');
            svgElem.setAttribute('font-family', 'sans-serif');
            
            _svgText = pv.SvgScene.create('text');
            svgElem.appendChild(_svgText);
            holder[0].appendChild(svgElem);
        }
        
        if(!font){
            font = null;
        }
        
        if(_svgTextFont !== font){
            _svgTextFont = font;
            pv.SvgScene.setStyle(_svgText, { 'font': font });
        }
        
        var textNode = _svgText.firstChild;
        if(textNode) {
            textNode.nodeValue = ''+text;
        } else {
            if (pv.renderer() === "svgweb") { 
                // SVGWeb needs an extra 'true' to create SVG text nodes properly in IE.
                _svgText.appendChild(document.createTextNode(''+text, true));
            } else {
                _svgText.appendChild(document.createTextNode(''+text));
            }
        }

        var box = _svgText.getBBox();
        return {width: box.width, height: box.height};
    }
    
    function getTextSizePlaceholder(){
        if(!$textSizePlaceholder || !$textSizePlaceholder.parent().length){
            
            $textSizePlaceholder = $(textSizePlaceholderId);

            if(!$textSizePlaceholder.length){
                $textSizePlaceholder = $('<div>')
                    .attr('id', textSizePlaceholderId)
                    .css('position', 'absolute')
                    .css('visibility', 'hidden')
                    .css('width',  'auto')
                    .css('height', 'auto');

                $('body').append($textSizePlaceholder);
            }
        }

        return $textSizePlaceholder;
    }
    
    // ---------------
    
    function getTextSizeCGG(text, font){
        var fontInfo = getFontInfoCGG(font);

        // TODO: Add cgg size method
        // NOTE: the global functions 'getTextLenCGG' and 'getTextHeightCGG' must be
        // defined by the CGG loading environment
        return {
            /*global getTextLenCGG:true */
            width:  getTextLenCGG(text, fontInfo.family, fontInfo.size, fontInfo.style, fontInfo.weight),
            /*global getTextHeightCGG:true */
            height: getTextHeightCGG(text, fontInfo.family, fontInfo.size, fontInfo.style, fontInfo.weight)
        };
    }
    
    var _cggFontCache, _cggFontTextElem;
    
    function getFontInfoCGG(font){
        var fontInfo = _cggFontCache && _cggFontCache[font];
        if(!fontInfo){
            if(!_cggFontTextElem){
                _cggFontTextElem = document.createElementNS('http://www.w3.org/2000/svg','text');
            }
            
            var sty = _cggFontTextElem.style;
            sty.setProperty('font', font);

            // Below, the use of: 
            //   '' + sty.getProperty(...)
            //  converts the results to real strings
            //  and not String objects (this later caused bugs in Java code)
        
            var family = '' + sty.getProperty('font-family');
            if(!family){
                family = 'sans-serif';
            } else if(family.length > 2){
                // Did not work at the server
                //var reQuoted = /^(["']?)(.*?)(\1)$/;
                //family = family.replace(reQuoted, "$2");
                var quote = family.charAt(0);
                if(quote === '"' || quote === "'"){
                    family = family.substr(1, family.length - 2);
                }
            }
            
            fontInfo = {
                family: family,
                size:   '' + sty.getProperty('font-size'),
                style:  '' + sty.getProperty('font-style'),
                weight: '' + sty.getProperty('font-weight')
            };
        }
        
        return fontInfo;
    }
    
    // -------------
    
    function getTextSizeVML(text, font){
        var box = pv.Vml.text_dims(text, font);
        return {width: box.width, height: box.height};
    }
    
    // -------------
    
    function trimToWidthBin(len, text, font, trimTerminator, before){

        var ilen = text.length,
            high = ilen - 2,
            low = 0,
            mid,
            textLen;

        while(low <= high && high > 0){

            mid = Math.ceil((low + high)/2);
            
            var textMid = before ? text.slice(ilen - mid) : text.slice(0, mid);
            textLen = getTextLength(textMid, font);
            if(textLen > len){
                high = mid - 1;
            } else if( getTextLength(before ? text.slice(ilen - mid - 1) : text.slice(0, mid + 1), font) < len ){
                low = mid + 1;
            } else {
                return before ? (trimTerminator + textMid) : (textMid + trimTerminator);
            }
        }

        return before ? (trimTerminator + text.slice(ilen - high)) : (text.slice(0, high) + trimTerminator);
    }

    // ----------------
    
    def
    .type('pvc.text.FontSizeCache')
    .init(function(){
        this._fontsCache = {};
    })
    .add({
        _getFont: function(font){
            return def.getOwn(this._fontsCache, font||'') || (this._fontsCache[font||''] = {});
        },
        
        get: function(font, text){
            return def.getOwn(this._getFont(font), text||'');
        },
        
        put: function(font, text, size){
            return this._getFont(font)[text||''] = size;
        }
    });
    
    // ----------------
    
    def.copyOwn(pvc.text, {
        createCache:     createCache,
        useCache:        useCache,
        getTextSize:     getTextSize,
        getTextLength:   getTextLength,
        getFontSize:     getFontSize,
        getTextHeight:   getTextHeight,
        getFitInfo:      getFitInfo,
        trimToWidth:     trimToWidth,
        trimToWidthB:    trimToWidthB,
        justify:         justifyText,
        getLabelBBox:    getLabelBBox,
        getLabelPolygon: getLabelPolygon
    });
});