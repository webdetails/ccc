def.type('Query')
.add({
    index: -1,
    item: undefined,
    next: function() {
        var me = this, index = me.index;

        // already was finished
        if(index === -2) return false;

        index++;
        if(!me._next(index)) {
            me._finish();
            return false;
        }

        me.index = index;
        return true;
    },

    /**
     * @name _next
     * @function
     * @param {number} nextIndex The index of the next item, if one exists.
     * @member def.Query#
     * @returns {boolean} truthy if there is a next item, falsy otherwise.
     */
    _next: def.abstractMethod,

    _finish: function() {
        var me = this;
        if(me.index > -2) {
            me.next  = def.retFalse;
            me.index = -2;
            delete me.item;
        }
    },

    // ------------

    each: function(f, x) {
        var me = this;
        while(me.next()) if(f.call(x, me.item, me.index) === false) return true;
        return false;
    },

    array: function(to) {
        var array = to || [], me = this;
        while(me.next()) array.push(me.item);
        return array;
    },

    sort: function(compare, by) {
        if(!compare) compare = def.compare;

        if(by) {
            var keyCompare = compare;
            compare = function(a, b) { return keyCompare(by(a), by(b)); };
        }

        var sorted = this.array().sort(compare);

        return new def.ArrayLikeQuery(sorted);
    },

    /**
     * Consumes the query and fills an object
     * with its items.
     * <p>
     * A property is created per item in the query.
     * The default name of each property is the string value of the item.
     * The default value of the property is the item itself.
     * </p>
     * <p>
     * In the case where two items have the same key,
     * the last one overwrites the first.
     * </p>
     *
     * @param {object}   [keyArgs] Keyword arguments.
     * @param {function} [keyArgs.value] A function that computes the value of each property.
     * @param {function} [keyArgs.name]  A function that computes the name of each property.
     * @param {object}   [keyArgs.context] The context object on which <tt>keyArgs.name</tt> and <tt>keyArgs.value</tt>
     * are called.
     * @param {object}   [keyArgs.target] The object that is to receive the properties,
     * instead of a new one being creating.
     *
     * @returns {object} A newly created object, or the specified <tt>keyArgs.target</tt> object,
     * filled with properties.
     */
    object: function(keyArgs) {
        var target   = def.get(keyArgs, 'target') || {},
            nameFun  = def.get(keyArgs, 'name' ),
            valueFun = def.get(keyArgs, 'value'),
            ctx      = def.get(keyArgs, 'context');

        while(this.next()) {
            var name = '' + (nameFun ? nameFun.call(ctx, this.item, this.index) : this.item);
            target[name] = valueFun ? valueFun.call(ctx, this.item, this.index) : this.item;
        }

        return target;
    },

    reduce: function(accumulator/*, [initialValue]*/) {
        var i = 0, result;

        if(arguments.length < 2) {
            if(!this.next()) throw new TypeError("Length is 0 and no second argument");
            result = this.item;
        } else {
            result = arguments[1];
        }

        while(this.next()) {
            result = accumulator(result, this.item, this.index);
            ++i;
        }

        return result;
    },

    /**
     * Consumes the query and obtains the number of items.
     *
     * @type number
     */
    count: function() {
        var count = 0;
        while(this.next()) count++;
        return count;
    },

    /**
     * Returns the first item that satisfies a specified predicate.
     * <p>
     * If no predicate is specified, the first item is returned.
     * </p>
     *
     * @param {function} [pred] A predicate to apply to every item.
     * @param {any} [ctx] The context object on which to call <tt>pred</tt>.
     * @param {any} [dv=undefined] The value returned in case no item exists or satisfies the predicate.
     *
     * @type any
     */
    first: function(pred, ctx, dv) {
        while(this.next()) {
            if(!pred || pred.call(ctx, this.item, this.index)) {
                var item = this.item;
                this._finish();
                return item;
            }
        }
        return dv;
    },

    /**
     * Returns the last item that satisfies a specified predicate.
     * <p>
     * If no predicate is specified, the last item is returned.
     * </p>
     *
     * @param {function} [pred] A predicate to apply to every item.
     * @param {any} [ctx] The context object on which to call <tt>pred</tt>.
     * @param {any} [dv=undefined] The value returned in case no item exists or satisfies the predicate.
     *
     * @type any
     */
    last: function(pred, ctx, dv) {
        var theItem = dv;
        while(this.next()) {
            if(!pred || pred.call(ctx, this.item, this.index)) theItem = this.item;
        }
        return theItem;
    },

    /**
     * Returns <tt>true</tt> if there is at least one item satisfying a specified predicate.
     * <p>
     * If no predicate is specified, returns <tt>true</tt> if there is at least one item.
     * </p>
     *
     * @param {function} [pred] A predicate to apply to every item.
     * @param {any} [ctx] The context object on which to call <tt>pred</tt>.
     *
     * @type boolean
     */
    any: function(pred, ctx) {
        while(this.next()) if(!pred || pred.call(ctx, this.item, this.index)) return this._finish(), true;
        return false;
    },

    /**
     * Returns <tt>true</tt> if all the query items satisfy the specified predicate.
     * @param {function} pred A predicate to apply to every item.
     * @param {any} [ctx] The context object on which to call <tt>pred</tt>.
     *
     * @type boolean
     */
    all: function(pred, ctx) {
        while(this.next()) if(!pred.call(ctx, this.item, this.index)) return this._finish(), false;
        return true;
    },

    min: function() {
        var min = null;
        while(this.next()) if(min === null || this.item < min) min = this.item;
        return min;
    },

    max: function() {
        var max = null;
        while(this.next()) if(max === null || this.item > max) max = this.item;
        return max;
    },

    range: function() {
        var min = null, max = null;

        while(this.next()) {
            var item = this.item;
            if(min === null) {
                min = max = item;
            } else {
                if(item < min) min = item;
                if(item > max) max = item;
            }
        }

        return min != null ? {min: min, max: max} : null;
    },

    multipleIndex: function(keyFun, ctx) {
        var keyIndex = {};
        this.each(function(item) {
            var key = keyFun ? keyFun.call(ctx, item) : item;
            if(key != null) {
                var sameKeyItems = def.getOwn(keyIndex, key) || (keyIndex[key] = []);
                sameKeyItems.push(item);
            }
        });
        return keyIndex;
    },

    uniqueIndex: function(keyFun, ctx) {
        var keyIndex = {};
        this.each(function(item) {
            var key = keyFun ? keyFun.call(ctx, item) : item;
            if(key != null && !O_hasOwn.call(keyIndex, key)) keyIndex[key] = item;
        });
        return keyIndex;
    },

    // ---------------
    // Query -> Query

    // deferred map
    select: function(fun, ctx) { return new def.SelectQuery(this, fun, ctx); },

    prop: function(p) {
        return new def.SelectQuery(this, function(item) { if(item) return item[p]; });
    },

    selectMany: function(fun, ctx) { return new def.SelectManyQuery(this, fun, ctx); },

    union: function(/*others*/) {
        var queries = def.array.append([this], arguments);
        return new def.SelectManyQuery(new def.ArrayLikeQuery(queries));
    },

    // deferred filter
    where: function(fun, ctx) { return fun ? new def.WhereQuery(this, fun, ctx) : this; },

    distinct: function(fun, ctx) { return fun ? new def.DistinctQuery(this, fun, ctx) : this; },

    skip: function(n) { return new def.SkipQuery(this, n); },

    take: function(n) {
        if(n <= 0) return new def.NullQuery();
        if(!isFinite(n)) return this; // all
        return new def.TakeQuery(this, n);
    },

    whayl: function(pred, ctx) { return new def.WhileQuery(this, pred, ctx); },

    reverse: function() { return new def.ReverseQuery(this); }
});

def.type('NullQuery', def.Query)
.add({ next: def.retFalse });

def.type('AdhocQuery', def.Query)
.init(function(next) {
    this._next = next;
});

def.type('ArrayLikeQuery', def.Query)
.init(function(list) {
    var me = this;

    if(!def.array.isLike(list)) { list = [list]; }

    me._list  = list;
    me._count = list.length;

    var i  = -1, I = list.length;
    me.next = arraLike_next;

    function arraLike_next() {
        while(++i < I) if(O_hasOwn.call(list, i)) {
            me.index = i;
            me.item  = list[i];
            return true;
        }

        me._finish();
        return false;
    }
})
.add({
    /**
     * Obtains the number of items of a query.
     *
     * This is a more efficient implementation for the array-like class.
     * @type number
     */
    count: function() {
        // Count counts remaining items
        var remaining = this._count;
        if(this.index >= 0) remaining -= (this.index + 1);
        // Count consumes all remaining items
        this._finish();
        return remaining;
    }
});

def.type('RangeQuery', def.Query)
.init(function(start, count, step) {
    this._index = start;
    this._count = count; // may be infinte
    this._step  = step == null ? 1 : step;
})
.add({
    _next: function(nextIndex) {
        if(nextIndex < this._count) {
            this.item = this._index;
            this._index += this._step;
            return true;
        }
    },

    /**
     * Obtains the number of items of a query.
     * This is a more efficient implementation.
     * @type number
     */
    count: function() {
        // Count counts remaining items
        var remaining = this._count;
        if(this.index >= 0) remaining -= (this.index + 1);
        // Count consumes all remaining items
        this._finish();
        return remaining;
    }
});

def.type('WhereQuery', def.Query)
.init(function(source, p, x) {
    var me = this, i = -1;

    me.next = where_next;

    function where_next() {
        while(source.next()) {
            var e = source.item;
            if(p.call(x, e, source.index)) {
                me.item  = e;
                me.index = ++i;
                return true;
            }
        }
        me._finish();
        return false;
    }
});

def.type('WhileQuery', def.Query)
.init(function(s, p, x) {
    var me = this, i = -1;

    me.next = while_next;

    function while_next() {
        if(s.next()) {
            var e = s.item;
            if(p.call(x, e, s.index)) {
                me.item  = e;
                me.index = ++i;
                return true;
            }
        }
        me._finish();
        return false;
    }
});

def.type('SelectQuery', def.Query)
.init(function(s, f, x) {
    var me = this, i = -1;

    me.next = select_next;

    function select_next() {
        if(s.next()) {
            me.item  = f.call(x, s.item, s.index);
            me.index = ++i;
            return true;
        }
        me._finish();
        return false;
    }
});

def.type('SelectManyQuery', def.Query)
.init(function(source, selectMany, ctx) {
    this._selectMany = selectMany;
    this._ctx    = ctx;
    this._source = source;
    this._manySource = null;
})
.add({
    _next: function(nextIndex) {
        while(true) {
            // Consume all of existing manySource
            if(this._manySource) {
                if(this._manySource.next()) {
                    this.item = this._manySource.item;
                    return true;
                }
                this._manySource = null;
            }
            if(!query_nextMany.call(this)) break;
        }
    }
});

function query_nextMany() {
    while(this._source.next()) {
        var manySource = this._selectMany
            ? this._selectMany.call(this._ctx, this._source.item, this._source.index)
            : this._source.item;
        if(manySource != null) {
            this._manySource = def.query(manySource);
            return true;
        }
    }
}

def.type('DistinctQuery', def.Query)
.init(function(s, k, x) {
    var me = this,
        i  = -1,
        ks = {};

    me.next = distinct_next;

    function distinct_next() {
        while(s.next()) {
            // null key items are ignored!
            var e = s.item,
                v = k ? k.call(x, e, s.index) : e;
            if(v != null && !O_hasOwn.call(ks, v)) {
                me.item  = e;
                me.index = ++i;
                return (ks[v] = true);
            }
        }
        me._finish();
        return false;
    }
});

def.type('SkipQuery', def.Query)
.init(function(source, skip) {
    this._source = source;
    this._skip = skip;
})
.add({
    _next: function(nextIndex) {
        while(this._source.next()) {
            if(this._skip > 0) {
                this._skip--;
            } else {
                this.item = this._source.item;
                return true;
            }
        }
    }
});

def.type('TakeQuery', def.Query)
.init(function(source, take) {
    this._source = source;
    this._take = take;
})
.add({
    _next: function(nextIndex) {
        if(this._take > 0 && this._source.next()) {
            this._take--;
            this.item = this._source.item;
            return true;
        }
    }
});

def.type('ReverseQuery', def.Query)
.init(function(source) {
    this._source = source;
})
.add({
    _next: function(nextIndex) {
        if(!nextIndex) {
            if(this._source instanceof def.Query) {
                this._source = (this._source instanceof def.ArrayLikeQuery)
                    ? this._source._list
                    : this._source.array();
            } // else assume array-like
            this._count  = this._source.length;
        }

        var count = this._count;
        if(nextIndex < count) {
            var index = count - nextIndex - 1,
                source = this._source;

            while(!O_hasOwn.call(source, index)) {
                if(--index < 0) return false;
                this._count--;
            }
            this.item = source[index];
            return true;
        }
    }
});


// -------------------

def.query = function(q) {
    if(q === undefined)        return new def.NullQuery();
    if(q instanceof def.Query) return q;
    if(def.fun.is(q))          return new def.AdhocQuery(q);
    return new def.ArrayLikeQuery(q);
};

def.range = function(start, count, step) { return new def.RangeQuery(start, count, step); };
