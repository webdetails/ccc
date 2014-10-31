def.number = {
    is: function(v) { return typeof v === 'number'; },

    as: function(v, dv) {
        return typeof v === 'number' ? v : dv;
    },

    to: function(v, dv) {
        if(v == null) return dv;

        var v2 = +v;
        return isNaN(v2) ? dv : v2;
    },

    toPositive: function(v, dv) {
        v = def.number.to(v);
        return (v != null && !(v > 0)) ? dv : v;
    },

    toNonNegative: function(v) {
        v = def.number.to(v);
        return (v != null && v < 0) ? dv : v;
    }
};
