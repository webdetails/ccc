/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global axis_optionsDef:true*/

def('pvc.visual.SlidingWindow', pvc.visual.OptionsBase.extend({

    init: function(chart) {
        this.base(chart, 'slidingWindow', 0, {byNaked: false});
        this.length = this.option('Length');
    },

    methods: /** @lends pvc.visual.slidingWindow# */{
        length:    null,
        dimension: null,
        select:    slidingWindow_defaultSelect,

        // Requires axes to be initialized!
        initFromOptions: function() {
            if(this.length) {
                this.dimension = this.option('Dimension');

                this.override('select', this.option('Select'));
            }
        },

        setDataFilter: function(data) {
            data.select = this.select.bind(this);
        },

        /**
         * Sets an ascending comparer in every discrete dimension
         * that does not have an explicitly configured comparer and
         * to which at least one visual role is bound.
         *
         * @param {cdo.ComplexType} complexType - The complex type of the chart's main data.
         */
        setDimensionsOptions: function(complexType) {
            var chart = this.chart;
            var dimOpts = chart.options.dimensions;
            var dimGroupOpts = chart.options.dimensionGroups;

            complexType.dimensionsList().forEach(function(mainDimType) {
                if(!mainDimType.isDiscrete)
                    return;

                var mainDimName = mainDimType.name;

                // If a comparer is already specified don't override it.
                var dimSpecs = dimOpts && dimOpts[mainDimName];
                if(dimSpecs && dimSpecs.comparer)
                    return;

                var dimGroup = cdo.DimensionType.dimensionGroupName(mainDimName);
                var dimGroupSpecs = dimGroupOpts && dimGroupOpts[dimGroup];
                if(dimGroupSpecs && dimGroupSpecs.comparer)
                    return;

                // Is dimension playing any visual roles?
                var visualRoles = chart.visualRolesOf(mainDimName, /*includePlotLevel:*/true);
                if(!visualRoles)
                    return;

                // Apply comparer.
                // Sets `isComparable` as well.
                mainDimType.setComparer(def.ascending);
            });
        },

        setLayoutPreservation: function(chart) {
            if(chart.options.preserveLayout == null) {
                chart.options.preserveLayout = true;
            }
        },

        // called from Chart#_initAxesEnd
        setAxesDefaults: function(chart) {
            chart.axesList.forEach(function(axis) {
                var role = axis.role;
                if(role) {
                    // Is a sliding window axis?
                    if(role.grouping.isSingleDimension && role.grouping.singleDimensionName === this.dimension)
                        this._setAxisFixedRatio(axis);

                    if(axis.type === "color")
                        axis.option.defaults({'PreserveMap': true});
                }
            }, this);
        },

        _setAxisFixedRatio: function(axis) {
            var axisOption = axis.option;

            // Only axes that have a meaningful length can have a ratio.
            if(axisOption.isDefined('FixedLength') && axisOption.isDefined('PreserveRatio')) {

                if(this.option.isSpecified('Length'))
                    axis.option.defaults({'FixedLength': this.length});

                axis.option.defaults({"PreserveRatio": true});
            }
        }
    },

    options: {
        Dimension:   {
            resolve: '_resolveFull',
            cast: function(name) {
                return pvc.parseDimensionName(name, this.chart);
            },
            getDefault: slidingWindow_defaultDimensionName
        },

        Length: {
            resolve: '_resolveFull',
            cast: function(interval) {
                return pv.parseDatePrecision(interval, null);
            }
        },

        Select: {
            resolve: '_resolveFull',
            cast: def.fun.as,
            getDefault: function() { return slidingWindow_defaultSelect.bind(this); }
        }
    }
}));


function slidingWindow_defaultDimensionName() {
    // Cartesian charts always have (at least) a base and ortho axis
    // Unfortunately, the sliding window is initialized while the visual roles' pre-bindings are not yet committed.
    var baseAxis = this.chart.axes.base;
    var baseGrouping = baseAxis && (baseAxis.role.grouping || baseAxis.role.preBoundGrouping());

    return baseGrouping ? baseGrouping.singleDimensionName : this.chart.data.type.dimensionsNames()[0];
}

function slidingWindow_defaultSelect(datums) {
    var toRemove = [];

    var L = datums.length;
    if(L > 0) {
        var dimName = this.dimension;
        var dim = this.chart.data.dimensions(dimName);

        var maxAtom = dim.max();
        var mostRecent = maxAtom ? maxAtom.value : null;
        var maxLength = this.length;

        for(var i = 0; i < L; i++) {
            var datum = datums[i];
            var value = datum.atoms[dimName].value;
            if(value == null) {
                // Remove any datum that is null on the window dimension.
                toRemove.push(datum);
            } else {
                // assert mostRecent !== null
                // If valueType is date, converting to number, allows subtracting.
                // Do not remove values equal to the maximum.
                var distance = (+mostRecent) - (+value);
                if(distance > 0 && distance > maxLength) {
                    toRemove.push(datum);
                }
            }
        }
    }

    return toRemove;

}
