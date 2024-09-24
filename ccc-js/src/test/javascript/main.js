
// @see http://karma-runner.github.io/0.10/plus/requirejs.html

(function() {
    var karma = window.__karma__;
    var baseUrl = '/base';

    var tests = [];
    for(var file in karma.files)
        if(/\-spec\.js$/.test(file))
            // Load the file as an AMD module, or relative module ids won't work.
            tests.push(
                file.replace(
                    new RegExp("^" + baseUrl + "/(.*?)\\.js$", "i"),
                    "$1"));

    requirejs.config({
        // Karma serves files from '/base'
        baseUrl: baseUrl,
        paths: {
            'ccc':    'target/module-scripts/amd',
            'jquery': 'package-res/lib/jquery',
            'test':   'ccc-js/src/test/javascript'
        },
        shim: {
            'jquery': {exports: 'jQuery'}
        }
    });

    // A dummy css plugin
    define('css', [], {
        load: function(cssId, req, load) {
            load(null);
        }
    });

    // Ask Require.js to load all test files and start test run
    require(tests, karma.start);

} ());