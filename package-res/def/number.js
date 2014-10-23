def.number = {
    is: function(v) { return typeof v === 'number'; },

    as: function(d, dv) {
        var v = parseFloat(d);
        return isNaN(v) ? (dv || 0) : v;
    },

    to: function(d, dv) {
        var v = parseFloat(d);
        return isNaN(v) ? (dv || 0) : v;
    }
};
