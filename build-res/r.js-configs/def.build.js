/*
 * requirejs configuration file used to build the def.js file
 */

({
    appDir:  "../../package-res",
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
            create: false,
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
    'def/private',
    'def/varia',
    'def/qualifiedName',
    'def/namespace',
    'def/mixin',
    'def/create',
    'def/attached',
    'def/configure',
    'def/type/inherits',
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
    'def/html',
    'def/css',
    'def/query',
    'def/textTable',
    'def/math',
    'def/epilogue'
]
        }
    ],

    skipModuleInsertion: true
})
