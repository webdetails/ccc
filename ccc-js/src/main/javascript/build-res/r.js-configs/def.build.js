/*
 * requirejs configuration file used to build the def.js file
 */
module.exports =
({
    baseUrl: 'ccc-js/src/main/javascript/package-res',

    name: 'def',
    create: false,

    preserveLicenseComments: true,
    skipModuleInsertion: true,
    optimize: 'uglify2',

    throwWhen: {
        //If there is an error calling the minifier for some JavaScript,
        //instead of just skipping that file throw an error.
        optimize: true
    },
    
    paths: {
        def: 'def'
    },

    //default files, this is externally configured
    wrap: {
        startFile: '../build/def.begin.js',
        endFile:   '../build/def.end.js'
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

    include: 
    [
    'def/shim',
    'def/prologue',
    'def/object',
    'def/info',
    'def/bit',
    'def/fun',
    'def/number',
    'def/array',
    'def/string',
    'def/conversion',
    'def/predicate',
    'def/error',
    'def/log',
    'def/private',
    'def/varia',
    'def/qualifiedName',
    'def/namespace',
    'def/describe',
    'def/mixin',
    'def/create',
    'def/attached',
    'def/configure',
    'def/type/inherit',
    'def/type/overrides',
    'def/type/methods',
    'def/type/MetaType',
    'def/type/Object',
    'def/type/type',
    'def/type/enum',
    'def/type/classify',
    'def/type/fields',
    'def/id',
    'def/collection/Set',
    'def/collection/Map',
    'def/collection/OrderedMap',
    'def/EventSource',
    'def/html',
    'def/css',
    'def/query',
    'def/textTable',
    'def/math',
    'def/epilogue'
    ]
});
