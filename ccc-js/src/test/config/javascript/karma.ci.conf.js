// Karma configuration
// Generated on Fri Nov 15 2013 00:09:22 GMT+0000 (GMT Standard Time)

module.exports = function(config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '../../../../../',


    // frameworks to use
    frameworks: ['jasmine', 'requirejs'],


    // list of files / patterns to load in the browser
    files: [
      'ccc-js/src/main/javascript/package-res/lib/jquery.js',
      'ccc-js/src/test/javascript/main.ci.js',
      {pattern: 'ccc-js/src/test/javascript/utils.js', included: false},
      {pattern: 'ccc-js/src/test/javascript/data-*.js', included: false},
      {pattern: 'target/module-scripts/amd/*.js', included: false},
      {pattern: 'ccc-js/src/test/javascript/**/*-spec.js', included: false}
    ],


    // list of files to exclude
    exclude: [
    ],


    preprocessors: {
        "target/module-scripts/ccc/amd/pvc.js" : 'coverage'
    },
    
    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress', 'junit', 'html', 'coverage'],

    coverageReporter: {
      reporters: [
        {
          type: "html",
          dir:  "target/coverage-reports/jscoverage/html/"
        },
        {
          type: "cobertura",
          dir:  "target/coverage-reports/cobertura/xml/"
        }
      ]
    },

    junitReporter: {
      outputFile: 'target/js-reports/ccc-results.xml',
      suite: 'unit'    
    },

    // the default configuration
    htmlReporter: {
      outputDir:    'target/coverage-reports/ccc-javascript',
      templatePath: 'node_modules/karma-html-reporter/jasmine_template.html'
    },

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_ERROR,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera (has to be installed with `npm install karma-opera-launcher`)
    // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
    // - PhantomJS
    // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
    browsers: ['PhantomJS'],//, 'Firefox', 'IE', 'PhantomJS'],


    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true
  });
};
