
var pvc = {}

/**
 *
 *  Utility function for logging messages to the console
 *
 */

pvc.log = function(m){

  if (typeof console != "undefined"){
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
}

