var pvc_Size = def.type('pvc.Size')
    .init(function(width, height) {
        if(arguments.length === 1) {
            if(width  != null) this.setSize(width);
        } else {
            if(width  != null) this.width  = width;
            if(height != null) this.height = height;
        }
    })
    .add({
        describe: function(out, remLevels, keyArgs) {
            return def.describeRecursive(out, def.copyOwn(this), remLevels, keyArgs);
        },

        setSize: function(size, keyArgs) {
            if(typeof size === 'string') {
                var comps = size.split(/\s+/).map(function(comp) {
                    return pvc_PercentValue.parse(comp);
                });

                switch(comps.length) {
                    case 1:
                        this.set(def.get(keyArgs, 'singleProp', 'all'), comps[0]);
                        return this;

                    case 2:
                        this.set('width',  comps[0]);
                        this.set('height', comps[1]);
                        return this;

                    case 0:
                        return this;
                }
            } else if(typeof size === 'number') {
                this.set(def.get(keyArgs, 'singleProp', 'all'), size);
                return this;
            } else if(typeof size === 'object') {
                if(size instanceof pvc_PercentValue) {
                    this.set(def.get(keyArgs, 'singleProp', 'all'), size);
                } else {
                    this.set('all', size.all);
                    for(var p in size) if(p !== 'all') this.set(p, size[p]);
                }
                return this;
            }

            if(def.debug) def.log("Invalid 'size' value: " + def.describe(size));

            return this;
        },

        set: function(prop, value) {
            if(value != null && (prop === 'all' || def.hasOwn(pvc_Size.namesSet, prop))) {
                value = pvc_PercentValue.parse(value);
                if(value != null) {
                    if(prop === 'all')
                        pvc_Size.names.forEach(function(p) { this[p] = value; }, this);
                    else
                        this[prop] = value;
                }
            }
            return this;
        },

        clone: function() {
            return new pvc_Size(this.width, this.height);
        },

        intersect: function(size) {
            return new pvc_Size(
                Math.min(this.width,  size.width),
                Math.min(this.height, size.height));
        },

        resolve: function(refSize) {
            var size = {};

            pvc_Size.names.forEach(function(length) {
                var lengthValue = this[length];
                if(lengthValue != null) {
                    if(typeof(lengthValue) === 'number') {
                        size[length] = lengthValue;
                    } else if(refSize) {
                        var refLength = refSize[length];
                        if(refLength != null) size[length] = lengthValue.resolve(refLength);
                    }
                }
            }, this);

            return size;
        }
    });

pvc_Size.names = ['width', 'height'];
pvc_Size.namesSet = pv.dict(pvc_Size.names, def.retTrue);

pvc_Size.toOrtho = function(value, anchor) {
    if(value != null) {
        // Single size (a number or a string with only one number)
        // should be interpreted as meaning the orthogonal length.
        var a_ol;
        if(anchor) a_ol = pvc.BasePanel.orthogonalLength[anchor];

        value = pvc_Size.to(value, {singleProp: a_ol});

        if(anchor) delete value[pvc.BasePanel.oppositeLength[a_ol]];
    }

    return value;
};

pvc_Size.to = function(v, keyArgs) {
    if(v != null && !(v instanceof pvc_Size)) v = new pvc_Size().setSize(v, keyArgs);
    return v;
};

pvc_Size.applyMax = function(size, sizeMax) {
    var v, vMax;
    if((vMax = sizeMax.width ) != null && (v = size.width ) != null && v > vMax) size.width  = vMax;
    if((vMax = sizeMax.height) != null && (v = size.height) != null && v > vMax) size.height = vMax;
    return size;
};

pvc_Size.applyMin = function(size, sizeMin) {
    var v, vMin;
    if((vMin = sizeMin.width ) != null && (v = size.width ) != null && v < vMin) size.width  = vMin;
    if((vMin = sizeMin.height) != null && (v = size.height) != null && v < vMin) size.height = vMin;
    return size;
};

pvc_Size.applyMinMax = function(size, sizeMin, sizeMax) {
    var v, vLim;
    if((v = size.width) != null) {
        // assert sizeMin.width <= sizeMax.width
        if((vLim = sizeMin.width) != null && v < vLim) size.width = vLim;
        else
        if((vLim = sizeMax.width) != null && v > vLim) size.width = vLim;
    }
    if((v = size.height) != null) {
        // assert sizeMin.height <= sizeMax.height
        if((vLim = sizeMin.height) != null && v < vLim) size.height = vLim;
        else
        if((vLim = sizeMax.height) != null && v > vLim) size.height = vLim;
    }
    return size;
};

pvc_Size.deflate = function(size, byWidth, byHeight) {
    var v;
    return {
        width:  (v = size.width ) != null ? Math.max(v - byWidth,  0) : null,
        height: (v = size.height) != null ? Math.max(v - byHeight, 0) : null
    };
};

pvc_Size.inflate = function(size, byWidth, byHeight) {
    var v;
    return {
        width:  (v = size.width ) != null ? (v + byWidth ) : null,
        height: (v = size.height) != null ? (v + byHeight) : null
    };
};

pvc_Size.clone = function(size) {
    return {width: size.width, height: size.height};
};