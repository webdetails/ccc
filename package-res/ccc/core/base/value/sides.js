/**
 * Creates a margins/sides object.
 * @constructor
 * @param {string|number|object} sides May be a css-like shorthand margin string.
 *
 * <ol>
 *   <li> "1" - {all: '1'}</li>
 *   <li> "1 2" - {top: '1', left: '2', right: '2', bottom: '1'}</li>
 *   <li> "1 2 3" - {top: '1', left: '2', right: '2', bottom: '3'}</li>
 *   <li> "1 2 3 4" - {top: '1', right: '2', bottom: '3', left: '4'}</li>
 * </ol>
 */
var pvc_Sides = pvc.Sides = function(sides) {
    if(sides != null) this.setSides(sides);
};

pvc_Sides.hnames = 'left right'.split(' ');
pvc_Sides.vnames = 'top bottom'.split(' ');
pvc_Sides.names  = 'left right top bottom'.split(' ');
pvc_Sides.namesSet = pv.dict(pvc_Sides.names, def.retTrue);

pvc_Sides.as = function(v) {
    if(v != null && !(v instanceof pvc_Sides)) v = new pvc_Sides().setSides(v);
    return v;
};

pvc_Sides.to = function(v) {
    if(v == null || !(v instanceof pvc_Sides)) v = new pvc_Sides().setSides(v);
    return v;
};

pvc_Sides.prototype.describe = function(out, remLevels, keyArgs) {
    return def.describeRecursive(out, def.copyOwn(this), remLevels, keyArgs);
};

pvc_Sides.prototype.setSides = function(sides) {
    if(typeof sides === 'string') {
        var comps = sides.split(/\s+/).map(function(comp) {
            return pvc_PercentValue.parse(comp);
        });

        switch(comps.length) {
            case 1:
                this.set('all', comps[0]);
                return this;

            case 2:
                this.set('top',    comps[0]);
                this.set('left',   comps[1]);
                this.set('right',  comps[1]);
                this.set('bottom', comps[0]);
                return this;

            case 3:
                this.set('top',    comps[0]);
                this.set('left',   comps[1]);
                this.set('right',  comps[1]);
                this.set('bottom', comps[2]);
                return this;

            case 4:
                this.set('top',    comps[0]);
                this.set('right',  comps[1]);
                this.set('bottom', comps[2]);
                this.set('left',   comps[3]);
                return this;

            case 0:
                return this;
        }
    } else if(typeof sides === 'number') {
        this.set('all', sides);
        return this;
    } else if(typeof sides === 'object') {
        if(sides instanceof pvc_PercentValue) {
            this.set('all', sides);

        } else if(sides instanceof pvc_Sides) {
            pvc_Sides.names.forEach(function(p) {
                if(def.hasOwn(sides, p)) this[p] = sides[p];
            }, this);
        } else {
            this.set('all',    sides.all);
            this.set('width',  sides.width);
            this.set('height', sides.height);
            for(var p in sides) if(pvc_Sides.namesSet.hasOwnProperty(p)) this.set(p, sides[p]);
        }
        return this;
    }

    if(def.debug) def.log("Invalid 'sides' value: " + def.describe(sides));

    return this;
};

pvc_Sides.prototype.set = function(prop, value) {
    value = pvc_PercentValue.parse(value);
    if(value != null) switch(prop) {
        case 'all':    pvc_Sides.names.forEach(function(p) { this[p] = value; }, this); break;
        case 'width':  this.left = this.right  = pvc_PercentValue.divide(value, 2); break;
        case 'height': this.top  = this.bottom = pvc_PercentValue.divide(value, 2); break;
        default:       if(def.hasOwn(pvc_Sides.namesSet, prop)) this[prop] = value;
    }
};

pvc_Sides.prototype.resolve = function(width, height) {
    if(typeof width === 'object') {
        height = width.height;
        width  = width.width;
    }

    var sides = {};

    pvc_Sides.names.forEach(function(side) {
        var value  = 0,
            sideValue = this[side];
        if(sideValue != null)
            value = (typeof(sideValue) === 'number')
                ? sideValue
                : sideValue.resolve((side === 'left' || side === 'right') ? width : height);

        sides[side] = value;
    }, this);

    return pvc_Sides.updateSize(sides);
};

pvc_Sides.updateSize = function(sides) {
    sides.width  = (sides.left   || 0) + (sides.right || 0);
    sides.height = (sides.bottom || 0) + (sides.top   || 0);

    return sides;
};

pvc_Sides.resolvedMax = function(a, b) {
    var sides = {};

    pvc_Sides.names.forEach(function(side) {
        sides[side] = Math.max(a[side] || 0, b[side] || 0);
    });

    return sides;
};

pvc_Sides.inflate = function(sides, by) {
    var sidesOut = {};

    pvc_Sides.names.forEach(function(side) {
        sidesOut[side] = (sides[side] || 0) + by;
    });

    return pvc_Sides.updateSize(sidesOut);
};