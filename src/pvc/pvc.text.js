
pvc.text = {
    getFitInfo: function(w, h, text, font, diagMargin){
        if(text === '') {
            return {h: true, v: true, d: true};
        }
        
        var len = pv.Text.measure(text, font).width;
        return {
            h: len <= w,
            v: len <= h,
            d: len <= Math.sqrt(w*w + h*h) - diagMargin
        };
    },

    trimToWidthB: function(len, text, font, trimTerminator, before){
        len -= pv.Text.measure(trimTerminator, font).width;
        
        return pvc.text.trimToWidth(len, text, font, trimTerminator, before);
    },
    
    trimToWidth: function(len, text, font, trimTerminator, before){
        if(text === '') {
            return text;
        }
  
        var textLen = pv.Text.measure(text, font).width;
        if(textLen <= len){
            return text;
        }
    
        if(textLen > len * 1.5){ //cutoff for using other algorithm
            return pvc.text.trimToWidthBin(len, text, font, trimTerminator, before);
        }
    
        while(textLen > len){
            text = before ? text.slice(1) : text.slice(0, text.length -1);
            textLen = pv.Text.measure(text, font).width;
        }
    
        return before ? (trimTerminator + text) : (text + trimTerminator);
    },
    
    trimToWidthBin: function(len, text, font, trimTerminator, before){

        var ilen = text.length,
            high = ilen - 2,
            low = 0,
            mid,
            textLen;

        while(low <= high && high > 0){

            mid = Math.ceil((low + high)/2);
            
            var textMid = before ? text.slice(ilen - mid) : text.slice(0, mid);
            textLen = pv.Text.measure(textMid, font).width;
            if(textLen > len){
                high = mid - 1;
            } else if(pv.Text.measure(before ? text.slice(ilen - mid - 1) : text.slice(0, mid + 1), font).width < len){
                low = mid + 1;
            } else {
                return before ? (trimTerminator + textMid) : (textMid + trimTerminator);
            }
    }
    
        return before ? (trimTerminator + text.slice(ilen - high)) : (text.slice(0, high) + trimTerminator);
    },
    
    justify: function(text, lineWidth, font){
        var lines = [];
        
        if(lineWidth < pv.Text.measure('a', font).width){
            // Not even one letter fits...
            return lines;
        } 
        
        var words = (text || '').split(/\s+/);
        
        var line = "";
        while(words.length){
            var word = words.shift();
            if(word){
                var nextLine = line ? (line + " " + word) : word;
                if(pv.Text.measure(nextLine, font).width > lineWidth){
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
    },
    
    /* Returns a label's BBox relative to its anchor point */
    getLabelBBox: function(textWidth, textHeight, align, baseline, angle, margin){
            
        var polygon = pv.Label.getPolygon(textWidth, textHeight, align, baseline, angle, margin);
        
        var bbox             = polygon.bbox();
        bbox.source          = polygon;
        bbox.sourceAngle     = angle;
        bbox.sourceAlign     = align;
        bbox.sourceTextWidth = textWidth;
        
        return bbox;
    }
};
