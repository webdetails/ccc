def('Set', def.Object.extend({
    init: function(source, count) {
        this.source = source || {};
        this.count  = source ? (count != null ? count : def.ownKeys(source).length) : 0;
    },
    methods: /** @lends def.Set# */{
        has: function(p) {
            return O_hasOwn.call(this.source, p);
        },

        add: function(p) {
            var source = this.source;
            if(!O_hasOwn.call(source, p)) {
                this.count++;
                source[p] = true;
            }

            return this;
        },

        rem: function(p) {
            if(O_hasOwn.call(this.source, p)) {
                delete this.source[p];
                this.count--;
            }

            return this;
        },

        clear: function() {
            if(this.count) {
                this.source = {};
                this.count  = 0;
            }
            return this;
        },

        members: function() {
            return def.ownKeys(this.source);
        }
    }
}));

