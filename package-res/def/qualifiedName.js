
def.qualName = function(name, base) {
    if(base) {
        base = def.qualName.as(base);
        return name ? base.compose(name) : base;
    }
    return def.qualName.as(name);
};

def.qualName.as = function(name) {
    return (name instanceof def_QualifiedName) ? name : new def_QualifiedName(name);
};

def.QualifiedName = def_QualifiedName;

// TODO: improve this code with indexOf
function def_QualifiedName(full) {
    var parts;
    if(full) {
        if(full instanceof Array) {
            parts = full;
            full  = parts.join('.');
        } else {
            parts = full.split('.');
        }
    }

    if(parts && parts.length > 1) {
        this.name      = parts.pop();
        this.namespace = parts.join('.');
    } else {
        this.name = full || null;
        this.namespace = null;
    }
}

def_QualifiedName.prototype.compose = function(name) {
    if(!name) return this;
    return new def_QualifiedName(def.string.join('.', this, name));
};

def_QualifiedName.prototype.toString = function() {
    return def.string.join('.', this.namespace, this.name);
};

def.qualNameOf = function(o, n) {
    var qn;
    if(arguments.length > 1) {
        o['__qname__'] = qn = def.qualName(n);
        if(def.fun.is(o)) o.displayName = '' + qn;
        return o;
    }
    return o['__qname__'];
};
