def.makeEnum = function(a, ka) {
    var i = 1, all = 0, e = {}, allItem = def.get(ka, 'all');
    a.forEach(function(p) {
        e[p] = i;
        if(allItem) all |= i;
        i = i << 1;
    });
    if(allItem) e[allItem] = all;
    return e;
};