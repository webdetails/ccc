// Adapted from
// http://www.codeproject.com/Articles/133118/Safe-Factory-Pattern-Private-instance-state-in-Jav/
//  and
// https://github.com/dcleao/private-state

def.priv = {
    key: def_priv_key
};

function def_priv_key() {
    // This variable binding is shared between the `key` function
    // and all created `safe` functions.
    // Allows them to privately exchange information!
    var _channel; // = undefined;

    // Created safe functions can be placed publicly.
    // The stored secret value is immutable and inaccessible.

    function newSafe(value) {
        function safe() { _channel = value; }
        safe.toString = def_priv_safeToString;
        return safe;
    }

    // The `key` function must be kept private.
    // It can open any `safe` created by the above `newSafe` instance
    // and read their secrets.
    function key(safe) {
        if(_channel !== undefined) throw new Error("Access denied.");

        // 1 - calling `safe` places its secret in the `_channel`.
        // 2 - read and return the value in `_channel`.
        // 3 - clear `_channel` to avoid memory leak.
        var secret = (safe(), _channel); // Do NOT remove the parenthesis!
        return (_channel = undefined), secret;
    }

    key.safe = newSafe;
    key.property = def_priv_propCreate;
    return key;
};

function def_priv_safeToString() { return "SAFE"; }

// Creates an `open` function that expects safes to be stored in
// a given property `p` of objects.
// When `p` isn't specified, a random property name is used.
function def_priv_propCreate(p, prefix) {
    if(!p) p = def_priv_random(prefix);

    var key = this;

    // Creates a safe containing the specified `secret`.
    // Stores the safe in property `p` of the specified `inst`.
    function instInit(inst, secret) {
        def.setNonEnum(inst, p, key.safe(secret));
        return secret;
    }

    // Given an instance, obtains the safe stored in
    // property `p` and opens it with the
    // original `key` function.
    function propKey(inst) { return key(inst[p]); }

    propKey.init = instInit;
    propKey.propertyName = p;

    return propKey;
}

var def_priv_random = function(prefix) {
    return '_' +
        def.nullyTo(prefix, "safe") +
        (new Date().getTime()) + '' + Math.round(1000 * Math.random());
};

var the_priv_key = def.priv.key();