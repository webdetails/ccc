/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/
/*
 * requirejs configuration file used to build the pvc.js file
 */
module.exports =
({
    baseUrl:  'ccc-js/src/main/javascript/package-res',

    name: 'pvc',
    create: false,

    optimize: 'uglify2',
    removeCombined: true,
    preserveLicenseComments: true,
    skipModuleInsertion: true,

    paths: {
        'ccc': 'ccc'
    },
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
    },

    include:
    [
        'ccc/core/base/shims',
        'ccc/core/base/prologue',
        'ccc/core/base/extension',
        'ccc/core/base/colorScheme',
        'ccc/core/base/time',
        'ccc/core/base/mark',
        'ccc/core/base/value/enums',
        'ccc/core/base/value/offset',
        'ccc/core/base/value/percentValue',
        'ccc/core/base/value/sides',
        'ccc/core/base/value/size',
        'ccc/core/base/abstract',
        'ccc/core/base/optionsMgr',
        'ccc/core/base/abstract-options',
        'ccc/core/base/abstract-interactive',
        'ccc/core/base/color',
        'ccc/core/base/context',
        'ccc/core/base/text',
        'ccc/core/base/trends',
        'ccc/core/base/spec',
        'ccc/core/base/slidingWindow',
        'ccc/core/base/scene/scene',
        'ccc/core/base/scene/var',
        'ccc/core/base/visualRole/visualRole',
        'ccc/core/base/visualRole/visualRolesBinder',
        'ccc/core/base/visualRole/visualRoleVarHelper',
        'ccc/core/base/dataCell/dataCell',
        'ccc/core/base/dataCell/color-dataCell',
        'ccc/core/base/axis/axis',
        'ccc/core/base/axis/color-axis',
        'ccc/core/base/axis/size-axis',
        'ccc/core/base/axis/normalized-axis',
        'ccc/core/base/panel/panel/panel',
        'ccc/core/base/panel/content-panel',
        'ccc/core/base/plot/plot',
        'ccc/core/base/plot/plot-panel',
        'ccc/core/base/plot/plotBg-panel',
        'ccc/core/base/panel/legend/legend-options',
        'ccc/core/base/panel/legend/legend-panel',
        'ccc/core/base/panel/legend/scene/legend-root-scene',
        'ccc/core/base/panel/legend/scene/legend-group-scene',
        'ccc/core/base/panel/legend/scene/legend-item-sceneSection',
        'ccc/core/base/panel/legend/scene/legend-item-scene',
        'ccc/core/base/panel/legend/scene/legend-item-scene.selection',
        'ccc/core/base/panel/legend/scene/legend-item-scene.visibility',
        'ccc/core/base/panel/legend/legendSymbolRenderer',
        'ccc/core/base/panel/title/abstract-title-panel',
        'ccc/core/base/panel/title/title-panel',
        'ccc/core/base/panel/dockingGrid-panel',
        'ccc/core/base/chart/chart',
        'ccc/core/base/chart/chart.visualRoles',
        'ccc/core/base/chart/chart.data',
        'ccc/core/base/chart/chart.plots',
        'ccc/core/base/chart/chart.axes',
        'ccc/core/base/chart/chart.panels',
        'ccc/core/base/chart/chart.selection',
        'ccc/core/base/chart/chart.extension',
        'ccc/core/base/chart/chart.activeScene',
        'ccc/core/base/multi/multiChart-options',
        'ccc/core/base/multi/multiChart-panel',
        'ccc/core/base/multi/smallChart-options',
        'ccc/core/base/sign/base-sign',
        'ccc/core/base/sign/sign',
        'ccc/core/base/sign/panel-sign',
        'ccc/core/base/sign/label-sign',
        'ccc/core/base/sign/value-label-sign',
        'ccc/core/base/sign/dot-sign',
        'ccc/core/base/sign/dotSizeColor-sign',
        'ccc/core/base/sign/line-sign',
        'ccc/core/base/sign/area-sign',
        'ccc/core/base/sign/bar-sign',
        'ccc/core/base/sign/rule-sign',
        'ccc/core/cartesian/axis/discrete-bands-layout',
        'ccc/core/cartesian/axis/cart-axis',
        'ccc/core/cartesian/axis/root-cart-axis-scene',
        'ccc/core/cartesian/axis/tick-cart-axis-scene',
        'ccc/core/cartesian/axis/abstract-cart-axis-panel',
        'ccc/core/cartesian/axis/cart-axis-title-panel',
        'ccc/core/cartesian/cart-focusWindow',
        'ccc/core/cartesian/ortho-cart-dataCell',
        'ccc/core/cartesian/cart-plot',
        'ccc/core/cartesian/cart-chart',
        'ccc/core/cartesian/cart-dockingGrid-panel',
        'ccc/core/cartesian/cart-plot-panel',
        'ccc/core/categorical/categ-plot',
        'ccc/core/categorical/categ-chart',
        'ccc/core/categorical/categ-plot-panel',
        'ccc/plugin/abstract-metricxy/abstract-metricxy-plot',
        'ccc/plugin/abstract-metricxy/abstract-metricxy-chart',
        'ccc/plugin/abstract-bar/abstract-bar-chart',
        'ccc/plugin/abstract-bar/abstract-bar-plot',
        'ccc/plugin/abstract-bar/abstract-bar-plot-panel',
        'ccc/plugin/pie/pie-slice-sign',
        'ccc/plugin/pie/pie-plot',
        'ccc/plugin/pie/pie-plot-panel',
        'ccc/plugin/pie/pie-chart',
        'ccc/plugin/bar/bar-plot',
        'ccc/plugin/bar/bar-plot-panel',
        'ccc/plugin/bar/bar-chart',
        'ccc/plugin/nbar/nbar-chart',
        'ccc/plugin/water/water-plot',
        'ccc/plugin/water/water-legend-group-scene',
        'ccc/plugin/water/water-legend-item-scene',
        'ccc/plugin/water/water-plot-panel',
        'ccc/plugin/water/water-chart',
        'ccc/plugin/point/point-plot',
        'ccc/plugin/point/point-plot-panel',
        'ccc/plugin/point/point-chart',
        'ccc/plugin/scatter/scatter-plot',
        'ccc/plugin/scatter/scatter-size-axis',
        'ccc/plugin/scatter/scatter-plot-panel',
        'ccc/plugin/scatter/scatter-chart',
        'ccc/plugin/heatGrid/hg-plot',
        'ccc/plugin/heatGrid/hg-plot-panel',
        'ccc/plugin/heatGrid/hg-chart',
        'ccc/plugin/box/box-plot',
        'ccc/plugin/box/box-plot-panel',
        'ccc/plugin/box/box-chart',
        'ccc/plugin/treemap/treemap-plot',
        'ccc/plugin/treemap/treemap-color-axis',
        'ccc/plugin/treemap/treemap-plot-panel',
        'ccc/plugin/treemap/treemap-chart',
        'ccc/plugin/sunburst/sun-plot',
        'ccc/plugin/sunburst/sun-color-axis',
        'ccc/plugin/sunburst/sun-plot-panel',
        'ccc/plugin/sunburst/sun-chart',
        'ccc/plugin/sunburst/sun-slice-sign',
        'ccc/plugin/bullet/bullet-plot',
        'ccc/plugin/bullet/bullet-chart',
        'ccc/plugin/parallel/par-chart',
        'ccc/plugin/dataTree/dt-chart'
    ]
})
