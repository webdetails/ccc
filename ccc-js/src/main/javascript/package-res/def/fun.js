def.copyOwn(def, /** @lends def */{
    /**
     * The natural order comparator function.
     * @field
     * @type function
     */
    compare: function(a, b) {
        /* Identity is favored because, otherwise,
         * comparisons like: compare(NaN, 0) would return 0...
         * This isn't perfect either, because:
         * compare(NaN, 0) === compare(0, NaN) === -1
         * so sorting may end in an end or the other...
         */
        return (a === b) ? 0 : ((a > b) ? 1 : -1);
        //return (a < b) ? -1 : ((a > b) ? 1 : 0);
    },

    compareReverse: function(a, b) {
        return (a === b) ? 0 : ((a > b) ? -1 : 1);
    },

    methodCaller: function(p, x) {
        return x
            ? function() { return    x[p].apply(x,    arguments); }
            // floating method
            : function() { return this[p].apply(this, arguments); };
    },

    /**
     * The identity function.
     * @field
     * @type function
     */
    identity: function(x) { return x; },

    add: function(a, b) { return a + b; },

    addPreservingNull: function(a, b) {
        return a == null ? b : (b == null ? a : (a + b));
    },

    // negate?
    negate: function(f) {
        return function() { return !f.apply(this, arguments); };
    },

    sqr: function(v) { return v * v; },

    // Constant functions ----------------

    /**
     * The NO OPeration function.
     * @field
     * @type function
     */
    noop: function noop() { /* NOOP */ },

    retTrue:  function() { return true;  },
    retFalse: function() { return false; },

    fun: {
        is: function(v) { return typeof v === 'function'; },

        as: function(v) { return typeof v === 'function' ? v : null; },

        to: function(v) { return typeof v === 'function' ? v : def.fun.constant(v); },

        constant: function(v) { return function() { return v; }; },

        wraps: function(by, wrapped) {
            by.valueOf = def.fun.constant(wrapped);
            return by;
        },

        typeFactory: function(Ctor) {
            function typeFactory() {
                return def.make(Ctor, arguments);
            }

            typeFactory.of = Ctor; // see def.classify

            return typeFactory;
        }
    }
});

def.ascending  = def.compare;
def.descending = def.compareReverse;
