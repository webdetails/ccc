/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/
def('OrderedMap', def.Object.extend({
    init: function(baseMap) {
        if(baseMap instanceof def.OrderedMap) {
            this._list = baseMap._list.slice();
            this._map  = def.copy(baseMap._map);
        } else {
            this._list = [];
            this._map  = {};
        }
    },
    methods: /** @lends def.OrderedMap# */{
        has: function(key) { return O_hasOwn.call(this._map, key); },

        count: function() { return this._list.length; },

        get: function(key) {
            var map = this._map;
            return O_hasOwn.call(map, key) ? map[key].value : undefined;
        },

        at: function(index) {
            var bucket = this._list[index];
            return bucket ? bucket.value : undefined;
        },

        add: function(key, v, index) {
            var map = this._map;
            var bucket = O_hasOwn.call(map, key) && map[key];
            if(!bucket) {
                bucket = map[key] = {
                    key:   key,
                    value: v
                };

                if(index == null)
                    this._list.push(bucket);
                else
                    def.array.insertAt(this._list, index, bucket);
            } else if(bucket.value !== v) {
                bucket.value = v;
            }

            return this;
        },

        rem: function(key) {
            var map = this._map;
            var bucket = O_hasOwn.call(map, key) && map[key];
            if(bucket) {
                // Find it
                var index = this._list.indexOf(bucket);
                this._list.splice(index, 1);
                delete this._map[key];
            }
            return this;
        },

        clear: function() {
            if(this._list.length) {
                this._map = {};
                this._list.length = 0;
            }
            return this;
        },

        keys: function() { return def.ownKeys(this._map); },

        forEach: function(fun, ctx) {
            return this._list.forEach(function(bucket) {
                fun.call(ctx, bucket.value, bucket.key);
            });
        }
    }
}));