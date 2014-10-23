def.copyOwn(def, /** @lends def */{
    between: function(v, min, max) { return Math.max(min, Math.min(v, max)); },

    // Predicates ----------------

    // === null || === undefined
    nully: function(v) { return v == null; },

    // !== null && !== undefined
    notNully: function(v) { return v != null; },

    // !== undefined
    notUndef: function(v) { return v !== undefined; },

    empty: function(v) { return v == null || v === ''; },

    notEmpty: function(v) { return v != null && v !== ''; },

    /**
     * The truthy function.
     * @field
     * @type function
     */
    truthy: function(x) { return !!x; },

    /**
     * The falsy function.
     * @field
     * @type function
     */
    falsy: function(x) { return !x; }
});
