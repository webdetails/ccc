/*
 * requirejs configuration file used to build the pvc.js file
 */

({
    baseUrl: "../../package-res",
    out:     "../module-scripts/cgf.js",

    name: 'cgf',
    create: false,
    
    paths: {
        'cgf': 'cgf'
    },

    removeCombined: true,
    preserveLicenseComments: true,
    skipModuleInsertion: true,
    optimize: "uglify2",

    throwWhen: {
        //If there is an error calling the minifier for some JavaScript,
        //instead of just skipping that file throw an error.
        optimize: true
    },

    // default wrap files, this is externally configured
    wrap: {
        startFile: "..",
        endFile:   ".."
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
        'cgf/core/base/prologue',
        'cgf/core/base/property',
        'cgf/core/base/Element',
        'cgf/core/base/GenericElement',
        'cgf/core/base/Template.Element',
        'cgf/core/base/Template.Element.SceneStorageMixin',
        'cgf/core/base/Template.MetaType',
        'cgf/core/base/Template.MetaType.property',
        'cgf/core/base/Template',
        'cgf/core/base/ValueTemplate',
        'cgf/core/base/AdhocTemplate',
        'cgf/core/visual/Visual',
        'cgf/core/visual/ParentVisual',
        'cgf/core/visual/properties',
        'cgf/core/visual/value/Sides',
        'cgf/core/visual/render',
        'cgf/core/visual/Panel',
        'cgf/core/visual/Canvas'
    ]
})