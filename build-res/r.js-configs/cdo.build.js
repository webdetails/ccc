/*
 * requirejs configuration file used to build the pvc.js file
 */

({
    baseUrl:  "../../package-res",
    out:      "../module-scripts/cdo.js",

    name: "cdo",
    create: false,

    optimize: "uglify2",
    removeCombined: true,
    preserveLicenseComments: true,
    skipModuleInsertion: true,

    paths: {
        'cdo': 'cdo'
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

    include: [
        'cdo/_data',
        'cdo/meta/dimensionType',
        'cdo/meta/complexType',
        'cdo/meta/complexTypeProject',
        'cdo/atom',
        'cdo/complex',
        'cdo/complexView',
        'cdo/datum',
        'cdo/dimension',
        'cdo/data/data',
        'cdo/data/data.selected',
        'cdo/data/data.operations',
        'cdo/data/data-filtered',
        'cdo/data/data-grouped',
        'cdo/data/data.compat',
        'cdo/oper/abstract-oper',
        'cdo/oper/grouping-oper',
        'cdo/oper/groupingSpec',
        'cdo/oper/linear-interp-oper',
        'cdo/oper/linear-interp-seriesState',
        'cdo/oper/zero-interp-oper',
        'cdo/oper/zero-interp-seriesState',
        'cdo/translation/abstract-transl',
        'cdo/translation/abstract-matrix-transl',
        'cdo/translation/crosstab-transl',
        'cdo/translation/relational-transl',
        'cdo/format/number-formatStyle',
        'cdo/format/number-format',
        'cdo/format/date-format',
        'cdo/format/custom-format',
        'cdo/format/formatProvider',
        'cdo/format/format-language'
    ]
})
