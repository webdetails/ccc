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
        'cgf/core/prologue',
        'cgf/core/interface/IBoundedNumber',
        'cgf/core/dom/prologue',
        'cgf/core/dom/property',
        'cgf/core/dom/Element',
        'cgf/core/dom/GenericElement',
        'cgf/core/dom/Template.Element',
        'cgf/core/dom/Template.MetaType',
        'cgf/core/dom/Template.MetaType.property',
        'cgf/core/dom/props',
        'cgf/core/dom/Template',
        'cgf/core/dom/PartTemplate',
        'cgf/core/dom/PartTemplate.Element',
        'cgf/core/dom/EntityTemplate',
        'cgf/core/dom/EntityTemplate.Element',
        'cgf/core/visual/prologue',
        'cgf/core/visual/unit',
        'cgf/core/visual/props',
        'cgf/core/visual/Visual',
        'cgf/core/visual/Visual.Element',
        'cgf/core/visual/part/SidesPart',
        'cgf/core/visual/part/SizePart',
        'cgf/core/visual/VisualContent',
        'cgf/core/visual/VisualContent.Element',
        'cgf/core/visual/mixin/VisualSized',
        'cgf/core/visual/mixin/VisualSized.Element',
        'cgf/core/visual/mixin/VisualParent',
        'cgf/core/visual/mixin/VisualParent.Element',
        'cgf/core/visual/render',
        'cgf/core/visual/Panel',
        'cgf/core/visual/Panel.Element',
        'cgf/core/visual/Canvas',
        'cgf/core/visual/Canvas.Element'
    ]
})
