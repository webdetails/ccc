
function cgf_createParsePercent(layoutProp) {

    function cgf_parsePercent(v, dv) {
        switch(typeof v) {
            case 'number': return v;
            case 'string':
                var m = v.match(/^(.+?)\s*(%)?$/);
                if(m) {
                    var p = def.number.to(m[1]);
                    if(p != null) {
                        // numeric string ?
                        if(!p || !m[2]) return p;

                        // percent
                        p /= 100;
                        return function() { return p * this.parent.layout[layoutProp]; };
                    }
                }
                break;
        }

        // TODO: log invalid value

        return dv;
    }

    return cgf_parsePercent;
}

var cgf_parsePercentWidth  = cgf_createParsePercent('contentWidth' ),
    cgf_parsePercentHeight = cgf_createParsePercent('contentHeight');

function cgf_getAll() { return this.all; }

/**
 * Root namespace for standard Visual properties.
 *
 * @name cgf.visual.props
 * @namespace
 */
var cgf_visual_props = cgf.visual.props = /** @lends cgf.visual.props */{

    allSides: cgf.dom.property("all"),
    allSize:  cgf.dom.property("all"),

    /**
     * The size of a left margin or padding,
     * or distance of the left side of a child
     * to the left side of a parent.
     *
     * The size value can be a number,
     * a numeric string,
     * and a string containing a number followed by "%".
     *
     * TODO: complete this, when it is more clear what's the name of the content box...
     *
     * When a percentage,
     * it is relative to the parent element's content width.
     *
     * @type cgf.dom.Property
     */
    left: cgf.dom.property("left", cgf_parsePercentWidth),

    /**
     * The size of a top margin or padding,
     * or distance of the top side of a child
     * to the top side of a parent.
     *
     * DOC ME
     *
     * @type cgf.dom.Property
     */
    top: cgf.dom.property("top", cgf_parsePercentHeight),

    /**
     * The size of a right margin or padding,
     * or distance of the right side of a child
     * to the right side of a parent.
     *
     * DOC ME
     *
     * @type cgf.dom.Property
     */
    right: cgf.dom.property("right",  cgf_parsePercentWidth),

    /**
     * The size of a bottom margin or padding,
     * or distance of the bottom side of a child
     * to the bottom side of a parent.
     *
     * DOC ME
     *
     * @type cgf.dom.Property
     */
    bottom: cgf.dom.property("bottom", cgf_parsePercentHeight),

    /**
     * The size of a horizontal dimension.
     *
     * DOC ME
     *
     * @type cgf.dom.Property
     */
    width: cgf.dom.property("width",  cgf_parsePercentWidth),

    /**
     * The size of a vertical dimension.
     *
     * DOC ME
     *
     * @type cgf.dom.Property
     */
    height: cgf.dom.property("height", cgf_parsePercentHeight)
};