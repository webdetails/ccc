def.array = /** @lends def.array */ {
    empty: function(v) { return !(v && v.length); },

    is: function(v) { return (v instanceof Array); },

    // TODO: def.array.like.is
    isLike: function(v) {
        return v && (v.length != null) && (typeof v !== 'string');
    },

    // TODO: this should work as other 'as' methods...
    /**
     * Converts something to an array if it is not one already,
     * and if it is not nully.
     *
     * @param thing A thing to convert to an array.
     * @returns {Array}
     */
    as: function(thing) {
        return (thing instanceof Array) ? thing : ((thing != null) ? [thing] : null);
    },

    to: function(thing) {
        return (thing instanceof Array) ? thing : ((thing != null) ? [thing] : null);
    },

    lazy: function(scope, p, f, ctx) {
        return scope[p] || (scope[p] = (f ? f.call(ctx, p) : []));
    },

    copy: function(al/*, start, end*/) {
        return A_slice.apply(al, A_slice.call(arguments, 1));
    },

    each: function(a, f, x) {
        if(a != null) {
            if(def.array.is(a))
                a.forEach(f, x);
            else
                f.call(x, a, 0);
        }
    },

    eachReverse: function(a, f, x) {
        if(a != null) {
            if(def.array.is(a)) {
                var i = a.length;
                while(i--) if(f.call(x, a[i], i) === false) return false;
            } else if(f.call(x, a, 0) === false) {
                return false;
            }
        }
        return true;
    },

    like: def.copyOwn(
        function(v) { return AL.is(v) ? v : [v]; }, {

        is: function(v) { return !!v && (v.length != null) && (typeof v !== 'string'); },

        as: function(v) { return AL.is(v) ? v : null; }
    }),

    /**
     * Creates an array of the specified length,
     * and, optionally, initializes it with the specified default value.
     */
    create: function(len, dv) {
        var a = len >= 0 ? new Array(len) : [];
        if(dv !== undefined) for(var i = 0 ; i < len ; i++) a[i] = dv;
        return a;
    },

    append: function(target, source, start) {
        if(start == null) start = 0;
        for(var i = 0, L = source.length, T = target.length ; i < L ; i++) target[T + i] = source[start + i];
        return target;
    },

    appendMany: function(target) {
        var a = arguments, S = a.length, source;
        if(S > 1) {
            for(var s = 1 ; s < S ; s++) {
                if((source = def.array.to(a[s]))) {
                    var i = 0, L = source.length;
                    while(i < L) target.push(source[i++]);
                }
            }
        }
        return target;
    },

    prepend: function(target, source, start) {
        if(start == null) start = 0;
        for(var i = 0, L = source.length ; i < L ; i++) target.unshift(source[start + i]);
        return target;
    },

    removeAt: function(array, index) { return array.splice(index, 1)[0]; },

    insertAt: function(array, index, elem) {
        array.splice(index, 0, elem);
        return array;
    },

    removeIf: function(array, p, x) {
        var i = 0, L = array.length;
        while(i < L) {
            if(p.call(x, array[i], i)) {
                L--;
                array.splice(i, 1);
            } else {
                i++;
            }
        }
        return array;
    },

    binarySearch: function(array, item, comparer, key) {
        if(!comparer) comparer = def.compare;

        var low  = 0, high = array.length - 1;
        while(low <= high) {
            var mid = (low + high) >> 1; // <=>  Math.floor((l+h) / 2)

            var result = comparer(item, key ? key(array[mid]) : array[mid]);
            if(result < 0)
                high = mid - 1;
            else if(result > 0)
                low = mid + 1;
            else
                return mid;
        }

        /* Item was not found but would be inserted at ~low */
        return ~low; // two's complement <=> -low - 1
    },

    /**
     * Inserts an item in an array,
     * previously sorted with a specified comparer,
     * if the item is not already contained in it.
     *
     * @param {Array} array A sorted array.
     * @param item An item to insert in the array.
     * @param {Function} [comparer] A comparer function.
     *
     * @returns {Number}
     * If the item is already contained in the array returns its index.
     * If the item was not contained in the array returns the two's complement
     * of the index where the item was inserted.
     */
    insert: function(array, item, comparer) {

        var index = def.array.binarySearch(array, item, comparer);
        // Insert at the two's complement of index
        if(index < 0) {
            array.splice(~index, 0, item);
        } else if(array[index] !== item) {
            // Compares equal, but is not the same item.
            // Add after the existing one.
            array.splice(index + 1, 0, item);
        }

        return index;
    },

    remove: function(array, item, comparer) {
        var index = def.array.binarySearch(array, item, comparer);
        if(index >= 0) return array.splice(index, 1)[0];
        // return undefined;
    }
};

var AL = def.array.like;
AL.to = AL;
