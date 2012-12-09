
pv.Text.measure = (function(){
    
    var _fontInfoCache, _fontInfoElem;
    
    function getFontInfo(font){
        if(!_fontInfoCache){
            _fontInfoCache = {};
        }
        
        var fontInfo = _fontInfoCache[font];
        if(!fontInfo){
            fontInfo = (_fontInfoCache[font] = getFontInfoCore(font));
        }
        
        return fontInfo;
    }
    
    function getFontInfoCore(font){
        var sty = getFontInfoElem().style;
        sty.setProperty('font', font);

        // Below, the uses of: 
        //   '' + sty.getProperty(...)
        //  convert the results to real strings
        //  and not String objects (this later caused bugs in Java code)
    
        var family = '' + sty.getProperty('font-family');
        if(!family){
            family = 'sans-serif';
        } else if(family.length > 2){
            var quote = family.charAt(0);
            if(quote === '"' || quote === "'"){
                family = family.substr(1, family.length - 2);
            }
        }
        
        return {
            family: family,
            size:   '' + sty.getProperty('font-size'),
            style:  '' + sty.getProperty('font-style'),
            weight: '' + sty.getProperty('font-weight')
        };
    }
    
    function getFontInfoElem(){
        /*global document:true*/
        return _fontInfoElem || 
               (_fontInfoElem = document.createElementNS('http://www.w3.org/2000/svg', 'text'));
    }
    
    return function(text, font){
        var fontInfo = getFontInfo(font);
        
        // NOTE: the global functions 'getTextLenCGG' and 'getTextHeightCGG' must be
        // defined by the CGG loading environment
        
        /*global getTextLenCGG:true */
        /*global getTextHeightCGG:true */
        return {
            width:  getTextLenCGG   (text, fontInfo.family, fontInfo.size, fontInfo.style, fontInfo.weight),
            height: getTextHeightCGG(text, fontInfo.family, fontInfo.size, fontInfo.style, fontInfo.weight)
        };
    };
}());
