def.copyOwn(def, /** @lends def */{
    error: function(error) { return (error instanceof Error) ? error : new Error(error); },

    fail: function(error) { throw def.error(error); },

    assert: function(msg, scope) { throw def.error.assertionFailed(msg, scope); }
});

def.eachOwn(/** @lends def.error */{
    operationInvalid: function(msg, scope) {
        return def.error(def.string.join(" ", "Invalid operation.", def.format(msg, scope)));
    },

    notImplemented: function() { return def.error("Not implemented."); },

    argumentRequired: function(name) {
        return def.error(def.format("Required argument '{0}'.", [name]));
    },

    argumentInvalid: function(name, msg, scope) {
        return def.error(
            def.string.join(" ",
                def.format("Invalid argument '{0}'.", [name]),
                def.format(msg, scope)));
    },

    assertionFailed: function(msg, scope) {
        return def.error(
            def.string.join(" ",
                "Assertion failed.",
                def.format(msg, scope)));
    }
}, function(errorFun, name) {
    def.error[name] = errorFun;

    // Create fail version of error
    def.fail[name] = function() { throw errorFun.apply(null, arguments); };
});