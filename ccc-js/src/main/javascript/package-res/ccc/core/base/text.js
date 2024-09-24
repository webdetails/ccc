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
        if(textLen > len)
            text = pvc.text.trimToWidthBin(len, text, font, trimTerminator, before, clipLen);

        return text;
    },

    trimToWidthBin: function(len, text, font, trimTerminator, before, clipLen) {
        var highLen = pv.Text.measureWidth(text, font);
        if(highLen <= len) return text;

        var lowLen = 0;

        var targetLen = Math.max(0, len - pv.Text.measureWidth(trimTerminator, font));
        var tCount = text.length;

        var high = tCount - 1;
        var low = 0;
        var mid;

        while(low < high && high > 0) {

            var targetRelativePosition = (targetLen - lowLen) / (highLen - lowLen);

            mid = Math.ceil(((low * (1 - targetRelativePosition)) + (high * targetRelativePosition)));

            var textMid = slice(text, tCount - mid, mid);
            var textLen = pv.Text.measureWidth(textMid, font);
            if(textLen > targetLen) {
                high = mid - 1;
                highLen = textLen;
            // Non-exact match: is this the maximum length bellow 'targetLen'
            } else if(pv.Text.measureWidth(slice(text, tCount - mid - 1, mid + 1), font) < targetLen) {
                low = mid + 1;
                lowLen = textLen;
            } else {
                if(clipLen && textLen <= clipLen) return "";
                return before ? (trimTerminator + textMid) : (textMid + trimTerminator);
            }

        }

        text = slice(text, tCount - high, high);
        textLen = pv.Text.measureWidth(text, font);

        if(clipLen && textLen <= clipLen) return "";
        return before ? (trimTerminator + text) : (text + trimTerminator);


        function slice(text, sBefore, sAfter) {
            return before ? text.slice(sBefore) : text.slice(0, sAfter);
        }
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
