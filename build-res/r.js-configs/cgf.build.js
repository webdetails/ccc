/*
 * requirejs configuration file used to build the pvc.js file
 */

({
    appDir:   "../../package-res",
    baseUrl:  ".",
    optimize: "uglify2",
    dir:      "../module-scripts",
    paths: {
        'cgf': 'cgf'
    },
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

    removeCombined: true,

    preserveLicenseComments: true,

    modules: [
        {
            name: "cgf",
            create: false,
            include: 
[
    'cgf/core/base/prologue',
    'cgf/core/base/property',
    'cgf/core/base/Element',
    'cgf/core/base/GenericElement',
    'cgf/core/base/TemplatedElement',
    'cgf/core/base/TemplatedElementParentMixin',
    'cgf/core/base/TemplatedElementSceneStorageMixin',
    'cgf/core/base/TemplateMetaType',
    'cgf/core/base/TemplateMetaType.property',
    'cgf/core/base/Template',
    'cgf/core/base/ValueTemplate',
    'cgf/core/base/AdhocTemplate',
    'cgf/core/visual/Visual',
    'cgf/core/visual/ParentVisual',
    'cgf/core/visual/render',
    'cgf/core/visual/Panel',
    'cgf/core/visual/Canvas'
]
        }
    ],

    skipModuleInsertion: true
})