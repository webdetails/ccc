
// TODO: consider using a private property for this.
def.attached = function(o, n, v) {
    var at = o.__attached__; // undefined when missing
    if(arguments.length > 2) {
        if(v !== undefined) {
            if(!at) def.setNonEnum(o, '__attached__', (at = {}));
            at[n] = v;
        }
        return o;
    }
    return at && at[n];
};

def.attached.is = function(n) {
    return !(!n || n.indexOf('$') < 0);
};
