/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/
def('Map', def.Object.extend({
    init: function(source, count) {
        this.source = source || {};
        this.count  = source ? (count != null ? count : def.ownKeys(source).length) : 0;
    },
    methods: /** @lends def.Map# */{
        has: function(p) { return O_hasOwn.call(this.source, p); },

        get: function(p) {
            return O_hasOwn.call(this.source, p) ?
                this.source[p] :
                undefined;
        },

        set: function(p, v) {
            var source = this.source;
            if(!O_hasOwn.call(source, p)) this.count++;

            source[p] = v;
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

        copy: function(other) {
            // Add other to this one
            def.eachOwn(other.source, function(value, p) {
                this.set(p, value);
            }, this);
        },

        values: function() { return def.own(this.source); },

        keys: function() { return def.ownKeys(this.source); },

        clone: function() { return new def.Map(def.copy(this.source), this.count); },

        /**
         * The union of the current map with the specified
         * map minus their intersection.
         *
         * (A U B) \ (A /\ B)
         * (A \ B) U (B \ A)
         * @param {def.Map} other The map with which to perform the operation.
         * @type {def.Map}
         */
        symmetricDifference: function(other) {
            if(!this .count) return other.clone();
            if(!other.count) return this.clone();

            var result = {},
                count  = 0,
                as = this.source,
                bs = other.source;

            def.eachOwn(as, function(a, p) {
                if(!O_hasOwn.call(bs, p)) {
                    result[p] = a;
                    count++;
                }
            });

            def.eachOwn(bs, function(b, p) {
                if(!O_hasOwn.call(as, p)) {
                    result[p] = b;
                    count++;
                }
            });

            return new def.Map(result, count);
        },

        intersect: function(other, result) {
            if(!result) result = new def.Map();
            def.eachOwn(this.source, function(value, p) {
                if(other.has(p)) result.set(p, value);
            });
            return result;
        }
    }
}));
