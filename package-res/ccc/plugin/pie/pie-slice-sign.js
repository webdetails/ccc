/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Custom protovis mark inherited from pv.Wedge
pv.PieSlice = function() {
    pv.Wedge.call(this);
};

pv.PieSlice.prototype = pv.extend(pv.Wedge)
    // How much radius to offset the slice from the Pie center.
    // Must be a value between 0 and the Pie's:
    // ActiveSliceRadius + ExplodedSliceRadius
    .property('offsetRadius'/*, NumberOrString*/);

// There's already a Wedge#midAngle method
// but it doesn't work well when end-angle isn't explicitly set,
// so we override the method.
pv.PieSlice.prototype.midAngle = function() {
    var instance = this.instance();
    return instance.startAngle + (instance.angle / 2);
};

pv.PieSlice.prototype.defaults = new pv.PieSlice()
    .extend(pv.Wedge.prototype.defaults)
    .offsetRadius(0);

// -----------

def.type('pvc.visual.PieSlice', pvc.visual.Sign)
.init(function(panel, protoMark, keyArgs) {

    var pvMark = protoMark.add(pv.PieSlice);

    keyArgs = def.setDefaults(keyArgs, 'freeColor', false);

    this.base(panel, pvMark, keyArgs);

    this._activeOffsetRadius = def.get(keyArgs, 'activeOffsetRadius', 0);
    this._maxOffsetRadius = def.get(keyArgs, 'maxOffsetRadius', 0);
    this._resolvePctRadius = def.get(keyArgs, 'resolvePctRadius');
    this._center = def.get(keyArgs, 'center');

    // Colors
    this.optional('lineWidth',  0.6)
        // Ensures that it is evaluated before x and y
        ._bindProperty('angle', 'angle')
        ._bindProperty('offsetRadius', 'offsetRadius')
        ._lockDynamic('bottom', 'y')
        ._lockDynamic('left',   'x')
        .lock('top',   null)
        .lock('right', null);
})
.prototype
.property('offsetRadius')
.constructor
.add({
    angle: def.fun.constant(0),

    x: function() { return this._center.x + this._offsetSlice('cos'); },
    y: function() { return this._center.y - this._offsetSlice('sin'); },

    _offsetSlice: function(fun) {
        var offset = this.pvMark.offsetRadius() || 0;
        if(offset) offset *= Math[fun](this.pvMark.midAngle());
        return offset;
    },

    /* COLOR */

    // @override
    defaultColor: function(scene, type) { return type === 'stroke' ? null : this.base(scene, type); },

    // @override
    interactiveColor: function(scene, color, type) {
        if(this.mayShowActive(scene, /*noSeries*/true)) {
            switch(type) {
                // Like the bar chart
                case 'fill':   return color.brighter(0.2).alpha(0.8);
                case 'stroke': return color.brighter(1.3).alpha(0.7);
            }
        } else if(this.mayShowNotAmongSelected(scene)) {
            //case 'stroke': // ANALYZER requirements, so until there's no way to configure it...
            if(type === 'fill') return this.dimColor(color, type);
        }

        return this.base(scene, color, type);
    },

    /* OffsetRadius */
    offsetRadius: function(scene) {
        var offsetRadius = this.base(scene);
        return Math.min(Math.max(0, offsetRadius), this._maxOffsetRadius);
    },

    baseOffsetRadius: function(scene) {
        var offsetRadius = this.base(scene) || 0;
        return this._resolvePctRadius(pvc_PercentValue.parse(offsetRadius));
    },

    interactiveOffsetRadius: function(scene, offsetRadius) {
        return offsetRadius +
            (this.mayShowActive(scene, /*noSeries*/true) ? this._activeOffsetRadius : 0);
    }
});
