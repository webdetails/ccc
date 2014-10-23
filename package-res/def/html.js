def.html = {
    // TODO: lousy multipass implementation!
    escape: function(str) {
        return def
            .string.to(str)
            .replace(/&/gm, "&amp;")
            .replace(/</gm, "&lt;")
            .replace(/>/gm, "&gt;")
            .replace(/"/gm, "&quot;");
    },

    tag: function(name, attrs) {
        if(attrs)
            attrs = def.ownKeys(attrs).map(function(n) {
                var v = attrs[n];
                return def.empty(v) ?  '' : (' ' + n + '="' + String(v) + '"');
            }).join('');
        else
            attrs = '';

        var content = arguments.length > 2
            ? A_slice.call(arguments, 2).map(function(cont) {
            if(cont != null) {
                if(def.fun.is(cont)) cont = cont();

                if(def.array.is(cont)) cont = cont.map(def.string.to).join('');
                else cont = def.string.to(cont);
            }
            return cont || '';
        }).join('')
            : '';

        return '<' + name + attrs + '>' + content + '</' + name + '>';
    },

    classes: function(prefix) {
        prefix = prefix ? (prefix + '-') : '';
        var out = [];
        A_slice.call(arguments, 1)
            .forEach(function(s, i) {
                if(!def.empty(s)) out.push(prefix + def.css.escapeClass(s));
            });
        return out.join(' ');
    }
};
