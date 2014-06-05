/*
 * requirejs configuration file used to build the tipsy.js file
 */

({
    appDir: "../../package-res/lib",
    baseUrl: ".",
    optimize: "uglify2",
    dir: "../module-scripts",

    throwWhen: {
        //If there is an error calling the minifier for some JavaScript,
        //instead of just skipping that file throw an error.
        optimize: true
    },
    
    //default wrap files, this is externally configured
    wrap: {
        startFile: "..",
        endFile: ".."
    },

    uglify2: {
        output: {
            beautify: true,
            max_line_len: 1000
        },
        compress: {
            sequences: false,
            global_defs: {
                DEBUG: false
            }
        },
        warnings: true,
        mangle: false
    },

    removeCombined: true,

    preserveLicenseComments: true,

    modules: [
        {
            name: "tipsy",
            create: false
        }
    ],

    skipModuleInsertion: true,

    skipDirOptimize: true,
    optimizeCss: "none"
})