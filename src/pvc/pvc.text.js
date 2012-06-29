
// Text measurement utility
def.scope(function(){
    
    // --------------------------
    // exported
    function getTextLength(text, font){
        switch(pv.renderer()){
            case 'vml':
                return getTextLenVML(text, font);

            case 'batik':
                font = splitFontCGG(font);

                // NOTE: the global function 'getTextLenCGG' must be
                // defined by the CGG loading environment
                /*global getTextLenCGG:true */
                return getTextLenCGG(text, font.fontFamily, font.fontSize, font.fontStyle, font.fontWeight);

            //case 'svg':
        }

        return getTextLenSVG(text, font);
    }

    function getTextHeight(text, font){
        switch(pv.renderer()){
            case 'vml':
                return getTextHeightVML(text, font);

            case 'batik':
                font = splitFontCGG(font);

                // NOTE: the global function 'getTextHeightCGG' must be
                // defined by the CGG loading environment
                /*global getTextHeightCGG:true */
                return getTextHeightCGG(text, font.fontFamily, font.fontSize, font.fontStyle, font.fontWeight);

            //case 'svg':
        }

        return getTextHeightSVG(text, font);
    }

    //TODO: if not in px?..
    function getFontSize(font){
        if(pv.renderer() == 'batik'){
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
    
    function getLabelSize(textWidth, textHeight, align, baseline, angle, margin){
        var width  = margin + Math.abs(textWidth * Math.cos(-angle));
        var height = margin + Math.abs(textWidth * Math.sin(-angle));
        return {
            width:  width,
            height: height
        };
    }
    
    /* Returns a label's BBox relative to its anchor point */
    function getLabelBBox(textWidth, textHeight, align, baseline, angle, margin){
        /* text-baseline, text-align */
        
        // From protovis' SvgLabel.js
        
        // In text line coordinates. y points downwards
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
        
        var bottomLeft  = pv.vector(x, y);
        var bottomRight = bottomLeft.plus(textWidth, 0);
        var topRight    = bottomRight.plus(0, -textHeight);
        var topLeft     = bottomLeft .plus(0, -textHeight);
        
        var min, max;
        
        var corners = [bottomLeft, bottomRight, topLeft, topRight];
        
        if(angle === 0){
            min = topLeft;
            max = bottomRight;
        } else {
            // Bounding box:
            
            corners.forEach(function(corner, index){
                corner = corners[index] = corner.rotate(angle);
                if(min == null){
                    min = pv.vector(corner.x, corner.y);
                } else {
                    if(corner.x < min.x){
                        min.x = corner.x;
                    }
                    
                    if(corner.y < min.y){
                        min.y = corner.y;
                    }
                }
                
                if(max == null){
                    max = pv.vector(corner.x, corner.y);
                } else {
                    if(corner.x > max.x){
                        max.x = corner.x;
                    }
                    
                    if(corner.y > max.y){
                        max.y = corner.y;
                    }
                }
            });
        }
        
        var bbox = new pvc.Rect(min.x, min.y, max.x - min.x, max.y - min.y);
        
        bbox.sourceCorners   = corners;
        bbox.sourceAngle     = angle;
        bbox.sourceAlign     = align;
        bbox.sourceTextWidth = textWidth;
        
        return bbox;
    }
    
    // --------------------------
    // private
    var $textSizePlaceholder = null,
        $textSizePvLabel = null,
        textSizePvLabelFont = null,
        textSizePlaceholderId = 'cccTextSizeTest_' + new Date().getTime();

    function getTextSizePlaceholder(){
        if(!$textSizePlaceholder || !$textSizePlaceholder.parent().length){
            
            $textSizePlaceholder = $(textSizePlaceholderId);

            if(!$textSizePlaceholder.length){
                $textSizePlaceholder = $('<div>')
                    .attr('id', textSizePlaceholderId)
                    .css('position', 'absolute')
                    .css('visibility', 'hidden')
                    .css('width', 'auto')
                    .css('height', 'auto');

                $('body').append($textSizePlaceholder);
            }
        }

        return $textSizePlaceholder;
    }

    // TODO: the following method fails on empty text...
    function getTextSizePvLabel(text, font){
        if(text === ""){
            text = "m";
        }

        if(!$textSizePvLabel || textSizePvLabelFont != font){
            var holder   = getTextSizePlaceholder();
            var holderId = holder.attr('id');

            var panel = new pv.Panel();
            panel.canvas(holderId);
            var lbl = panel.add(pv.Label).text(text);
            if(font){
                lbl.font(font);
            }
            panel.render();

            $textSizePvLabel   = $('#' + holderId + ' text');
            textSizePvLabelFont = font;
        } else {
            $textSizePvLabel.text(text);
        }

        return $textSizePvLabel[0];
    }

    function splitFontCGG(font){
        var el = document.createElementNS('http://www.w3.org/2000/svg','text');
        var sty = el.style;
        sty.setProperty('font',font);

        var result = {};
        
        // Below, the use of: 
        //   '' + sty.getProperty(...)
        //  converts the results to real strings
        //  and not String objects (this later caused bugs in Java code)
        
        var fontFamily = result.fontFamily = '' + sty.getProperty('font-family');
        if(!fontFamily){
            result.fontFamily = 'sans-serif';
        } else if(fontFamily.length > 2){
            // Did not work at the server
            //var reQuoted = /^(["']?)(.*?)(\1)$/;
            //fontFamily = fontFamily.replace(reQuoted, "$2");
            var quote = fontFamily.charAt(0);
            if(quote === '"' || quote === "'"){
                fontFamily = fontFamily.substr(1, fontFamily.length - 2);
            }
            
            result.fontFamily = fontFamily;
        }
        
        result.fontSize   = '' + sty.getProperty('font-size');
        result.fontStyle  = '' + sty.getProperty('font-style');
        result.fontWeight = '' + sty.getProperty('font-weight');
        
        return result;
    }

    function getTextLenSVG(text, font){
        var lbl = getTextSizePvLabel(text, font);
        var box = lbl.getBBox();
        return box.width;
    }

    function getTextHeightSVG(text, font){
        var lbl = getTextSizePvLabel(text, font);
        var box = lbl.getBBox();
        return box.height;
    }

    function getTextLenVML(text, font){
        return pv.Vml.text_dims(text, font).width;
    }

    function getTextHeightVML(text, font){
        return pv.Vml.text_dims(text, font).height;
    }

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
    
    pvc.text = {
        getTextLength: getTextLength,
        getFontSize:   getFontSize,
        getTextHeight: getTextHeight,
        getFitInfo:    getFitInfo,
        trimToWidth:   trimToWidth,
        trimToWidthB:  trimToWidthB,
        justify:       justifyText,
        getLabelSize:  getLabelSize,
        getLabelBBox:  getLabelBBox
        
    };
});