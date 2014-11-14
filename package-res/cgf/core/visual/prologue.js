
/**
 * The namespace of visual elements and templates.
 * @name cgf.visual
 * @namespace
 */
var cgf_visual = cgf.visual = {};

var ε = 1e-6;

function areSameSize(a, b) {
    return def.delta(a.width,  b.width ) < ε &&
        def.delta(a.height, b.height) < ε;
}

// Assuming sizes cannot have -Infinity ...
function isInfiniteSize(a) {
    return !isFinite(a.width) && !isFinite(a.height);
}

function isValidActualSizeDimension(v) {
    return !isNaN(v) && isFinite(v) && v >= 0;
}

function isValidActualSize(s) {
    return !!s && isValidActualSizeDimension(s.width) && isValidActualSizeDimension(s.height);
}

// ---------------------------

function cgf_getAll() {
    return this.all;
}

// ---------------------------

var elem_borderBoxWidth  = function(elem) { return elem.size.width;  };
var elem_borderBoxHeight = function(elem) { return elem.size.height; };

var elem_fill   = function(elem) { return elem.fillStyle; };
var elem_stroke = function(elem) { return elem.strokeStyle; };
var elem_strokeWidth  = function(elem) { return elem.strokeWidth; };

var svg_translate = function(left, top) {
    if(left || top) return "translate(" + (left||0)  + ", " + (top||0) + ")";
};
