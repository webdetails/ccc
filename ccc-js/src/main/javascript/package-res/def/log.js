/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/

// 0 - off
// 1 - errors
// 2 - errors, warnings
// 3 - errors, warnings, info
// 4 - verbose
// 5 - trash
// ...
def.debug = 0;

/*global console:true; window:true*/

// Check URL debug and debugLevel
(function() {
    /*global window:true*/
    if((typeof window !== 'undefined')  && window.location) {
        var urlIfHasDebug = function(url) { return url && (/\bdebug=true\b/).test(url) ? url : null;},
            url = urlIfHasDebug(window.location.href);

        if(!url) try { url = urlIfHasDebug(window.top.location.href); } catch(e) { /*XSS*/ }
        if(url) {
            var m = /\bdebugLevel=(\d+)/.exec(url);
            def.debug = m ? (+m[1]) : 3;
        }
    }
}());

def.logSeparator = "------------------------------------------";

def.setDebug = function(level) {
    level = +level;
    level = isNaN(level) ? 0 : level;
    if(level > 1 && typeof console === "undefined") level = 1;

    if(!def.log || def.debug != level) {
        def.debug = level;
        def_syncLog(level);
    }

    return def.debug;
};

function def_syncLog(level) {
    def.log = def.logger('[DEF]');

    if(def_onDebugChanged) def_onDebugChanged.forEach(function(f) { f(level); });
}

// ----------

var def_onDebugChanged = null;

def.addOnDebugChanged = function(f) {
    def_onDebugChanged || (def_onDebugChanged = []).push(f);
};


/*

 // Redirect protovis error handler
 // pv.error = def.error;

function def_syncTipsyLog() {
    var tip = pv.Behavior.tipsy;
    if(tip && tip.setDebug) {
        tip.setDebug(def.debug);
        tip.log = def.log;
    }
}

*/

var def_logNames = ['info', 'debug', 'error', 'warn', 'group', 'groupEnd'],
    def_logNamesMap = {'group': 'groupCollapsed'},
    def_disabledLogger;

def.logger = function(prompt, target, loggerProp) {
    return def.debug > 1 ? def_loggerReal(prompt, target) :
           target        ? def_loggerAutoEnableOnce(target, loggerProp, prompt) :
           (def_disabledLogger || (def_disabledLogger = def_loggerDisabled()));
};

function def_debugLevel() {
    return def.debug;
}

function def_loggerReal(prompt, target) {
    prompt = def_evalPrompt(prompt, target);

    var logger = def_createLogFn('log', prompt);
    logger.log   = logger;
    logger.level = def_debugLevel;

    def_logNames.forEach(function(name) {
        logger[name] = def_createLogFn(def_logNamesMap[name] || name, prompt);
    });

    return logger;
}

function def_evalPrompt(prompt, x) {
    return prompt && (def.fun.is(prompt) ? prompt.call(x) : prompt);
}

function def_loggerAutoEnableOnce(target, loggerProp, prompt) {
    var baseLogger = function(name) {
        if(def.debug > 1) {
            var logger = target[loggerProp || 'log'] = def_loggerReal(prompt, target);

            // Don't miss this log call...
            logger[name || 'log'].apply(logger, A_slice.call(arguments, 1));
        } else if(name === 'error') {
            // <= 1
            def_logError.apply(null, def.array.append([def_evalPrompt(prompt, target)], arguments, 1));
        }
    };

    var logger = baseLogger.bind('log');
    logger.log = logger;
    logger.level = def_debugLevel;

    def_logNames.forEach(function(name) { logger[name] = baseLogger.bind(name); });

    return logger;
}

function def_loggerDisabled() {
    function logger() {};
    logger.log = logger;
    logger.level = def_debugLevel;
    def_logNames.forEach(function(name) { logger[name] = logger; });
    return logger;
}

function def_logError(prompt, e, s) {
    if(e && typeof e === 'object' && e.message) e = e.message;

    e = (prompt ? (prompt + ': ') : '') +
        def.nullyTo(e, '') +
        (s ? (' ' + s) : '');

    throw new Error(e);
}

function def_createLogFn(name, prompt) {
    var c = console,
        m = c[name] || c.log,
        fun;
    if(m) {
        var mask = prompt ? (prompt + ": %s") : "%s";
        if(!def.fun.is(m)) {
            // For IE these are not functions...but simply objects
            // Bind is not available, or it may be a poly-fill that doesn't work...

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

    return fun;
}

def.setDebug(def.debug);
