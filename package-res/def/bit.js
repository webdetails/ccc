def.copyOwn(def, /** @lends def */{

    bit: {
        set: function(bits, set, on) { return (on || on == null) ? (bits | set) : (bits & ~set); }
    }

});
