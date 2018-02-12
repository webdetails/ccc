/*
 * requirejs configuration file used to build the tipsy.js file
 */
module.exports =
({
    baseUrl: 'ccc-js/src/main/javascript/package-res/lib',

    name: 'tipsy',
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
});