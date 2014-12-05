
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

var elem_borderBoxWidth  = function(elem) { return elem.size.width;  };
var elem_borderBoxHeight = function(elem) { return elem.size.height; };

var elem_fillColor   = function(elem) { return elem.fill.color;   };
var elem_strokeColor = function(elem) { return elem.stroke.color; };
var elem_strokeWidth = function(elem) { return elem.stroke.width; };

var svg_translate = function(left, top) {
    return (left || top)
        ? "translate(" + (left||0)  + ", " + (top||0) + ")"
        : null;
};
