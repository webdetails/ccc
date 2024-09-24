/*
 * requirejs configuration file used to build the protovis.js file
 */
module.exports =
({
    baseUrl: 'ccc-js/src/main/javascript/package-res/lib',

    name: 'protovis',
    create: false,

    optimize: 'uglify2',
    removeCombined: true,
    preserveLicenseComments: true,
    skipModuleInsertion: true,
    skipDirOptimize: true,

    throwWhen: {
        //If there is an error calling the minifier for some JavaScript,
        //instead of just skipping that file throw an error.
        optimize: true
    },
    
    paths: {
        'protovis': 'protovis'
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
    }
})