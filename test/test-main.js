
// @see http://karma-runner.github.io/0.10/plus/requirejs.html

var pen = {};

(function() {
    var karma = window.__karma__;

    var tests = [];
    for(var file in karma.files)
        if(/\-spec\.js$/.test(file)) tests.push(file);

    pen.define  = define;
    pen.require = require;

    requirejs.config({
        // Karma serves files from '/base'
        baseUrl: '/base/dist/test',
        shim: {
            'cdf/jquery': {exports: 'jQuery'}
        }
    });


    // Ask Require.js to load all test files and start test run
    pen.require(tests, karma.start);

} ());