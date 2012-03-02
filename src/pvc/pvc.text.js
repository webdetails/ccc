
// Text measurement utility
pvc.scope(function(){
    
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
                return getTextLenCGG(text, font.fontFamily, font.fontSize);

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
                return getTextHeightCGG(text, font.fontFamily, font.fontSize);

            //case 'svg':
        }

        return getTextHeightSVG(text, font);
    }

    //TODO: if not in px?..
    function getFontSize(font){
        if(pv.renderer() == 'batik'){
            var sty = document.createElementNS('http://www.w3.org/2000/svg','text').style;
            sty.setProperty('font',font);
            return parseInt(sty.getProperty('font-size'));
        }

        var holder = getTextSizePlaceholder();
        holder.css('font', font);
        return parseInt(holder.css('font-size'));
    }

    function getFitInfo(w, h, text, font, diagMargin){
        if(text == '') {
            return {h: true, v: true, d: true};
        }
        
        var len = getTextLength(text, font);
        return {
            h: len <= w,
            v: len <= h,
            d: len <= Math.sqrt(w*w + h*h) - diagMargin
        };
    }

    function trimToWidth(len, text, font, trimTerminator){
      if(text == '') {
          return text;
      }
      
      var textLen = getTextLength(text, font);
      if(textLen <= len){
        return text;
      }

      if(textLen > len * 1.5){ //cutoff for using other algorithm
        return trimToWidthBin(len,text,font,trimTerminator);
      }

      while(textLen > len){
        text = text.slice(0,text.length -1);
        textLen = getTextLength(text, font);
      }

      return text + trimTerminator;
    }
    
    // --------------------------
    // private
    var $textSizePlaceholder = null,
        $textSizePvLabel = null,
        textSizePvLabelFont = null,
        textSizePlaceholderId = 'cccTextSizeTest_' + new Date().getTime();

    function getTextSizePlaceholder(){
        if(!$textSizePlaceholder || $textSizePlaceholder.parent().length == 0){
            
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

    function getTextSizePvLabel(text, font){
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
        result.fontFamily = sty.getProperty('font-family');
        if(!result.fontFamily){
            result.fontFamily = 'sans-serif';
        }
        result.fontSize = sty.getProperty('font-size');
        result.fontStyle = sty.getProperty('font-style');

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

    function trimToWidthBin(len, text, font, trimTerminator){

        var high = text.length-2,
            low = 0,
            mid,
            textLen;

        while(low <= high && high > 0){

            mid = Math.ceil((low + high)/2);
            textLen = getTextLength(text.slice(0, mid), font);
            if(textLen > len){
                high = mid - 1;
            } else if( getTextLength(text.slice(0, mid + 1), font) < len ){
                low = mid + 1;
            } else {
                return text.slice(0, mid) + trimTerminator;
            }
        }

        return text.slice(0,high) + trimTerminator;
    }

    /*
    //TODO: use for IE if non-svg option kept
    doesTextSizeFit: function(length, text, font){
        var MARGIN = 4;//TODO: hcoded
        var holder = this.getTextSizePlaceholder();
        holder.text(text);
        return holder.width() - MARGIN <= length;
    }
    */

    pvc.text = {
        getTextLength: getTextLength,
        getFontSize:   getFontSize,
        getTextHeight: getTextHeight,
        getFitInfo:    getFitInfo,
        trimToWidth:   trimToWidth
    };
});