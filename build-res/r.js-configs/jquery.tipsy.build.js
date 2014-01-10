/*
 * requirejs configuration file used to build the tipsy.js file
 */

({
    appDir: "../../package-res/lib",
    baseUrl: ".",
    optimize: "uglify2",
    dir: "../module-scripts",

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
            name: "jquery.tipsy",
            create: false
        }
    ],

    skipModuleInsertion: true,

    skipDirOptimize: true,
    optimizeCss: "none"
})