def
.type('pvc.visual.SunburstSlice', pvc.visual.Sign)
.init(function(panel, protoMark, keyArgs){
    var pvMark = protoMark.add(pv.Wedge);
    keyArgs = def.setDefaults(keyArgs, 'freeColor', false);
    this.base(panel, pvMark, keyArgs);
})
.add({
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
            if(type === 'fill') { return this.dimColor(color, type); }
        }

        return this.base(scene, color, type);
    }
});

// Custom protovis mark inherited from pv.Wedge
// pv.SunburstSlice = function() {
//     pv.Wedge.call(this);
// };

// pv.SunburstSlice.prototype = pv.extend(pv.Wedge);

// There's already a Wedge#midAngle method
// but it doesn't work well when end-angle isn't explicitly set,
// so we override the method.
// pv.SunburstSlice.prototype.midAngle = function() {
//     var instance = this.instance();
//     return instance.startAngle + (instance.angle / 2);
// };