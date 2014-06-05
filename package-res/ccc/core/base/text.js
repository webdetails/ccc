/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

pvc.text = {
    getFitInfo: function(w, h, text, font, diagMargin) {
        if(text === '') return {h: true, v: true, d: true};
        
        var len = pv.Text.measureWidth(text, font);
        return {
            h: len <= w,
            v: len <= h,
            d: len <= Math.sqrt(w*w + h*h) - diagMargin
        };
    },

    trimToWidthB: function(len, text, font, trimTerminator, before) {
        var terminLen = pv.Text.measureWidth(trimTerminator, font),
            clipLen   = 3/2 * terminLen;
        return pvc.text.trimToWidth(len, text, font, trimTerminator, before, clipLen);
    },
    
    trimToWidth: function(len, text, font, trimTerminator, before, clipLen) {
        if(text === '') return text;
  
        var textLen = pv.Text.measureWidth(text, font);
        if(textLen <= len) return text;
        
        // ----------------
        // Trim needed
        if(textLen > len * 1.5) // threshold for using other algorithm
            return pvc.text.trimToWidthBin(len, text, font, trimTerminator, before, clipLen);
        
        len -= pv.Text.measureWidth(trimTerminator, font);

        while(textLen > len) {
            text = before ? text.slice(1) : text.slice(0, text.length -1);
            textLen = pv.Text.measureWidth(text, font);
        }

        // "A.."" -> ""
        // "AB.." -> "AB.."
        // "ABC.." -> "AB.."
        if(clipLen && textLen <= clipLen) return "";

        return before ? (trimTerminator + text) : (text + trimTerminator);
    },
    
    trimToWidthBin: function(len, text, font, trimTerminator, before, clipLen) {

        len -= pv.Text.measureWidth(trimTerminator, font);

        var ilen = text.length,
            high = ilen - 2,
            low = 0,
            mid,
            textLen;

        while(low <= high && high > 0) {

            mid = Math.ceil((low + high)/2);
            
            var textMid = before ? text.slice(ilen - mid) : text.slice(0, mid);
            textLen = pv.Text.measureWidth(textMid, font);
            if(textLen > len) {
                high = mid - 1;
            } else if(pv.Text.measureWidth(before ? text.slice(ilen - mid - 1) : text.slice(0, mid + 1), font) < len) {
                low = mid + 1;
            } else {
                if(clipLen && textLen <= clipLen) return "";
                return before ? (trimTerminator + textMid) : (textMid + trimTerminator);
            }
        }

        text = before ? text.slice(ilen - high) : text.slice(0, high);
        textLen = text.length;
        if(clipLen && textLen <= clipLen) return "";
        return before ? (trimTerminator + text) : (text + trimTerminator);
    },
    
    justify: function(text, lineWidth, font) {
        var lines = [];

        // Not even one letter fits...
        if(lineWidth < pv.Text.measureWidth('a', font)) return lines;
        
        var words = (text || '').split(/\s+/);
        
        var line = "";
        while(words.length) {
            var word = words.shift();
            if(word) {
                var nextLine = line ? (line + " " + word) : word;
                if(pv.Text.measureWidth(nextLine, font) > lineWidth) {
                    // The word by itself may overflow the line width
                    
                    // Start new line
                    if(line) lines.push(line);
                    
                    line = word;
                } else {
                    line = nextLine; 
                }
            }
        }
        
        if(line) lines.push(line);
        
        return lines;
    },
    
    /* Returns a label's BBox relative to its anchor point */
    getLabelBBox: function(textWidth, textHeight, align, baseline, angle, margin) {
            
        var polygon = pv.Label.getPolygon(textWidth, textHeight, align, baseline, angle, margin);
        
        var bbox             = polygon.bbox();
        bbox.source          = polygon;
        bbox.sourceAngle     = angle;
        bbox.sourceAlign     = align;
        bbox.sourceTextWidth = textWidth;
        
        return bbox;
    }
};
