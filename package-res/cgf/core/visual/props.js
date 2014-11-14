
function cgf_createParseUnit(unitTranslTable) {

    function cgf_parseUnit(v, dv) {
        switch(typeof v) {
            case 'number':
                if(isNaN(v)) break;
                return v;

            case 'string':
                var m = v.match(/^(.+?)([\a-zA-Z%]*)$/);
                if(m) {
                    var p = def.number.to(m[1]);
                    if(p != null) {
                        // p === 0
                        if(!p) return p;

                        var unit = m[2] || '';
                        if(unitTranslTable && def.hasOwn(unitTranslTable, unit))
                            unit = unitTranslTable[unit];

                        // Absolute.
                        if(!unit || unit === 'px') return p;

                        // Defer evaluation of special unit.
                        return function() { return this.evalUnit(p, unit); };
                    }
                }
                break;
        }

        // TODO: log invalid value

        return dv;
    }

    return cgf_parseUnit;
}

var cgf_parseUnitH = cgf_createParseUnit({'%': '%w'}),
    cgf_parseUnitV = cgf_createParseUnit({'%': '%h'});

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
    left: cgf.dom.property("left", cgf_parseUnitH),

    /**
     * The size of a top margin or padding,
     * or distance of the top side of a child
     * to the top side of a parent.
     *
     * DOC ME
     *
     * @type cgf.dom.Property
     */
    top: cgf.dom.property("top", cgf_parseUnitV),

    /**
     * The size of a right margin or padding,
     * or distance of the right side of a child
     * to the right side of a parent.
     *
     * DOC ME
     *
     * @type cgf.dom.Property
     */
    right: cgf.dom.property("right",  cgf_parseUnitH),

    /**
     * The size of a bottom margin or padding,
     * or distance of the bottom side of a child
     * to the bottom side of a parent.
     *
     * DOC ME
     *
     * @type cgf.dom.Property
     */
    bottom: cgf.dom.property("bottom", cgf_parseUnitV),

    // TODO: width and height should not accept negative values...

    /**
     * The size of a horizontal dimension.
     *
     * DOC ME
     *
     * @type cgf.dom.Property
     */
    width: cgf.dom.property("width",  cgf_parseUnitH),

    /**
     * The size of a vertical dimension.
     *
     * DOC ME
     *
     * @type cgf.dom.Property
     */
    height: cgf.dom.property("height", cgf_parseUnitV)
};