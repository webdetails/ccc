var pvc_Offset =
    def
        .type('pvc.Offset')
        .init(function(x, y) {
            if(arguments.length === 1) {
                if(x != null) this.setOffset(x);
            } else {
                if(x != null) this.x = x;
                if(y != null) this.y = y;
            }
        })
        .add({
            stringify: function(out, remLevels, keyArgs) {
                return pvc.stringifyRecursive(out, def.copyOwn(this), remLevels, keyArgs);
            },

            setOffset: function(offset, keyArgs) {
                if(typeof offset === 'string') {
                    var comps = offset.split(/\s+/).map(function(comp) {
                        return pvc_PercentValue.parse(comp);
                    });

                    switch(comps.length) {
                        case 1:
                            this.set(def.get(keyArgs, 'singleProp', 'all'), comps[0]);
                            return this;

                        case 2:
                            this.set('x', comps[0]);
                            this.set('y', comps[1]);
                            return this;

                        case 0:
                            return this;
                    }
                } else if(typeof offset === 'number') {
                    this.set(def.get(keyArgs, 'singleProp', 'all'), offset);
                    return this;
                } else if(typeof offset === 'object') {
                    this.set('all', offset.all);
                    for(var p in offset) if(p !== 'all') this.set(p, offset[p]);
                    return this;
                }
                if(pvc.debug) pvc.log("Invalid 'offset' value: " + pvc.stringify(offset));
                return this;
            },

            set: function(prop, value) {
                if(value != null && def.hasOwn(pvc_Offset.namesSet, prop)) {
                    value = pvc_PercentValue.parse(value);
                    if(value != null) {
                        if(prop === 'all')
                            pvc_Offset.names.forEach(function(p) {
                                this[p] = value;
                            }, this);
                        else
                            this[prop] = value;
                    }
                }
            },

            resolve: function(refSize) {
                var offset = {};

                pvc_Size.names.forEach(function(length) {
                    var offsetProp  = pvc_Offset.namesSizeToOffset[length],
                        offsetValue = this[offsetProp];
                    if(offsetValue != null) {
                        if(typeof(offsetValue) === 'number') {
                            offset[offsetProp] = offsetValue;
                        } else if(refSize) {
                            var refLength = refSize[length];
                            if(refLength != null) offset[offsetProp] = offsetValue.resolve(refLength);
                        }
                    }
                }, this);

                return offset;
            }
        });

pvc_Offset
    .addStatic({ names: ['x', 'y'] })
    .addStatic({
        namesSet:           pv.dict(pvc_Offset.names, def.retTrue),
        namesSizeToOffset:  {width: 'x', height: 'y'},
        namesSidesToOffset: {left: 'x', right: 'x', top: 'y', bottom: 'y'},
        as: function(v) {
            if(v != null && !(v instanceof pvc_Offset)) v = new pvc_Offset().setOffset(v);
            return v;
        }
    });