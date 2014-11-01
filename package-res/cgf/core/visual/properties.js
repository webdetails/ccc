
// TODO: currently, cast functions cannot return evaluator functions...
// At element time, returning a function would imply evaluating it, immediately,
// to return an actual number... and would this number then be passed to the cast function again?

function cgf_createParsePercent(layoutProp) {

    function cgf_parsePercent(v, dv) {
        switch(typeof v) {
            case 'number': return v;
            case 'string':
                var m = v.match(/^(.+?)\s*(%)?$/);
                if(m) {
                    var n = def.number.to(m[1]);
                    if(n != null) {
                        // numeric string ?
                        if(!n || !m[2]) return n;

                        // percent
                        n /= 100;
                        return function() { return n * this.parent.layout[layoutProp]; };
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


def.copyOwn(cgf_props, /** @lends cgf.props */{
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
     * @type cgf.Property
     */
    left: cgf.property("left", cgf_parsePercentWidth),

    /**
     * The size of a top margin or padding,
     * or distance of the top side of a child
     * to the top side of a parent.
     *
     * DOC ME
     *
     * @type cgf.Property
     */
    top: cgf.property("top", cgf_parsePercentHeight),

    /**
     * The size of a right margin or padding,
     * or distance of the right side of a child
     * to the right side of a parent.
     *
     * DOC ME
     *
     * @type cgf.Property
     */
    right: cgf.property("right",  cgf_parsePercentWidth),

    /**
     * The size of a bottom margin or padding,
     * or distance of the bottom side of a child
     * to the bottom side of a parent.
     *
     * DOC ME
     *
     * @type cgf.Property
     */
    bottom: cgf.property("bottom", cgf_parsePercentHeight)
});