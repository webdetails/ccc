def.qualName = function(full) {
    return (full instanceof def_QualifiedName) ? full : new def_QualifiedName(full);
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

def_QualifiedName.prototype.toString = function() {
    return def.string.join('.', this.namespace, this.name);
};

def.qualNameOf = function(o, n) {
    if(arguments.length > 1) {
        o['__qname__'] = def.qualName(n);
        return o;
    }
    return o['__qname__'];
};