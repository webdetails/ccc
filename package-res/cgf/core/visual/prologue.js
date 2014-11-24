
/**
 * The namespace of visual elements and templates.
 * @name cgf.visual
 * @namespace
 */
var cgf_visual = cgf.visual = {};

var ε = 1e-6;

// // ---------------------------

function cgf_getAll() {
    return this.all;
}

// ---------------------------

var elem_borderBoxWidth  = function(elem) { return elem.layout.width;  };
var elem_borderBoxHeight = function(elem) { return elem.layout.height; };

var elem_fill         = function(elem) { return elem.fillStyle;   };
var elem_stroke       = function(elem) { return elem.strokeStyle; };
var elem_strokeWidth  = function(elem) { return elem.strokeWidth; };

var svg_translate = function(left, top) {
    return (left || top)
        ? "translate(" + (left||0)  + ", " + (top||0) + ")"
        : null;
};
