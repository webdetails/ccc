
var pvc = {

  debug: false

}

/**
 *
 *  Utility function for logging messages to the console
 *
 */

pvc.log = function(m){

    if (typeof console != "undefined" && pvc.debug){
        console.log("[pvChart]: " + m);
    }
};

/**
 *
 * Evaluates x if it's a function or returns the value otherwise
 *
 */

pvc.ev = function(x){
    return typeof x == "function"?x():x;
};

pvc.sumOrSet = function(v1,v2){
    return typeof v1 == "undefined"?v2:v1+v2;
};

pvc.nonEmpty = function(d){
    return typeof d != "undefined" && d !== null;
};

pvc.padMatrixWithZeros = function(d){
    return d.map(function(v){
        return v.map(function(a){
            return typeof a == "undefined"?0:a;
        });
    });
};

pvc.cloneMatrix = function(m){
    return m.map(function(d){
        return d.slice();
    });
};

    /**
     *ex.: arrayStartsWith(['EMEA','UK','London'], ['EMEA']) -> true
     *     arrayStartsWith(a, a) -> true
     **/
pvc.arrayStartsWith = function(array, base)
{
    if(array.length < base.length) { return false; }
    
    for(var i=0; i<base.length;i++){
        if(base[i] != array[i]) {
            return false;
        }
    }
    return true;
};

/**
 * Equals for two arrays
 * func - needed if not flat array of comparables
 **/
pvc.arrayEquals = function(array1, array2, func)
{
  if(array1 == null){return array2 == null;}
  
  var useFunc = typeof(func) == 'function';
  
  for(var i=0;i<array1.length;i++)
  {
    if(useFunc){
        if(!func(array1[i],array2[i])){
            return false;
        }
    }
    else if(array1[i]!=array2[i]){
        return false;   
    }
  }
  return true;
};

/**
 *
 * Implements filter property if not implemented yet
 *
 */
if (!Array.prototype.filter)
{
    Array.prototype.filter = function(fun, thisp)
    {
        var len = this.length >>> 0;
        if (typeof fun != "function")
            throw new TypeError();

        var res = [];
        var thisp = arguments[1];
        for (var i = 0; i < len; i++)
        {
            if (i in this)
            {
                var val = this[i]; // in case fun mutates this
                if (fun.call(thisp, val, i, this))
                    res.push(val);
            }
        }

        return res;
    };
}


/**
 *
 * Implements support for svg detection
 *
 **/
(function($){
    $.support.svg = $.support.svg || document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1");
})(jQuery);
