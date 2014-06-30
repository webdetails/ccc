
// 0 - off
// 1 - errors
// 2 - errors, warnings
// 3 - errors, warnings, info
// 4 - verbose
// 5 - trash
// ...
pvc.debug = 0;

// Check URL debug and debugLevel
(function() {
    /*global window:true*/
    if((typeof window !== 'undefined')  && window.location) {
        var urlIfHasDebug = function(url) { return url && (/\bdebug=true\b/).test(url) ? url : null;},
            url = urlIfHasDebug(window.location.href);

        if(!url) try { url = urlIfHasDebug(window.top.location.href); } catch(e) { /*XSS*/ }
        if(url) {
            var m = /\bdebugLevel=(\d+)/.exec(url);
            pvc.debug = m ? (+m[1]) : 3;
        }
    }
}());

pvc.logSeparator = "------------------------------------------";

pvc.setDebug = function(level) {
    level = +level;
    pvc.debug = isNaN(level) ? 0 : level;

    pvc_syncLog();
    pvc_syncTipsyLog();

    return pvc.debug;
};

/*global console:true*/

function pvc_syncLog() {
    if(pvc.debug > 0 && typeof console !== "undefined") {
        ['log', 'info', ['trace', 'debug'], 'error', 'warn', ['group', 'groupCollapsed'], 'groupEnd']
            .forEach(function(ps) {
                ps = ps instanceof Array ? ps : [ps, ps];

                pvc_installLog(pvc, ps[0],  ps[1],  '[pvChart]');
            });
    } else {
        if(pvc.debug > 1) pvc.debug = 1;

        ['log', 'info', 'trace', 'warn', 'group', 'groupEnd']
            .forEach(function(p) { pvc[p] = def.noop; });

        var _errorPrefix = "[pvChart ERROR]: ";

        pvc.error = function(e) {
            if(e && typeof e === 'object' && e.message) e = e.message;

            e = '' + def.nullyTo(e, '');
            if(e.indexOf(_errorPrefix) < 0) e = _errorPrefix + e;

            throw new Error(e);
        };
    }

    pvc.logError = pvc.error;

    // Redirect protovis error handler
    pv.error = pvc.error;
}

function pvc_syncTipsyLog() {
    var tip = pv.Behavior.tipsy;
    if(tip && tip.setDebug) {
        tip.setDebug(pvc.debug);
        tip.log = pvc.log;
    }
}

function pvc_installLog(o, pto, pfrom, prompt) {
    if(!pfrom) pfrom = pto;
    var c = console;
    var m = c[pfrom] || c.log;
    var fun;
    if(m) {
        var mask = prompt + ": %s";
        if(!def.fun.is(m)) {
            // For IE these are not functions...but simply objects
            // Bind is not available or may be a polyfill that won't work...

            var apply = Function.prototype.apply;
            fun = function() {
                apply.call(m, c, def.array.append([mask], arguments));
            };
        } else {
            // Calls to fun are like direct calls to m...
            // and capture file and line numbers correctly!
            fun = m.bind(c, mask);
        }
    }

    o[pto] = fun;
}

pvc.setDebug(pvc.debug);
