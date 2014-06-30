/*
 * requirejs configuration file used to build the def.js file
 */

({
    appDir: "../../package-res/def",
    baseUrl: ".",
    optimize: "uglify2",
    dir: "../module-scripts",

    throwWhen: {
        //If there is an error calling the minifier for some JavaScript,
        //instead of just skipping that file throw an error.
        optimize: true
    },
    
    paths: {
        def: "def"
    },

    //default files, this is externally configured
    wrap: {
        startFile: "../build/def.begin.js",
        endFile: "../build/def.end.js"
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

    preserveLicenseComments: true,

    modules: [
        {
            name: "def",
            create: false
        }
    ],

    skipModuleInsertion: true
})
