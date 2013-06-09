/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_Size:true */

/**
 * BarAbstract is the base class for generating charts of the bar family.
 */
def
.type('pvc.BarAbstract', pvc.CategoricalAbstract)
.add({
    // NOTE
    // Timeseries category with bar charts are supported differently in V2 than in V1
    // They worked in v1 if the data set brought all
    // categories, according to chosen timeseries scale date unit
    // Then, bars were drawn with a category scale,
    // whose positions ended up coinciding with the ticks in a linear axis...
    // To mimic v1 behavior the category dimensions are "coerced" to isDiscrete
    // The axis will be categoric, the parsing will work,
    // and the formatting will be the desired one

    _processOptionsCore: function(options) {
        this.base(options);

        // One implies the other
        if(options.percentageNormalized) { options.stacked = true; }
    },

    /**
     * Initializes each chart's specific roles.
     * @override
     */
    _initVisualRoles: function() {

        this.base();

        this._addVisualRole('value', {
            isMeasure: true,
            isRequired: true,
            isPercent: this.options.stacked,
            requireSingleDimension: true,
            requireIsDiscrete: false,
            valueType: Number,
            defaultDimension: 'value'
        });
    },

    _getCategoryRoleSpec: function(){
        var catRoleSpec = this.base();

        // Force dimension to be discrete!
        catRoleSpec.requireIsDiscrete = true;

        return catRoleSpec;
    },

    /**
     * @override
     */
    _getContinuousVisibleExtentConstrained: function(axis, min, max) {
        // ortho1 is percentageNormalized.
        if(axis.id === 'ortho' && this.options.percentageNormalized) {
            /*
             * Forces showing 0-100 in the axis.
             * Note that the bars are stretched automatically by the band layout,
             * so this scale ends up being ignored by the bars.
             * Note also that each category would have a different scale,
             * so it isn't possible to provide a single correct scale,
             * that would satisfy all the bars...
             */
            return {min: 0, max: 100, minLocked: true, maxLocked: true};
        }

        return this.base(axis, min, max);
    },

    defaults: {
        // forces stacked=true
        percentageNormalized: false
    }
});