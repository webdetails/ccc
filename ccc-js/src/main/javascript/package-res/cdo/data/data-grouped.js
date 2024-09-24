/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def.type('cdo.GroupingData', cdo.Data)
.init(function(keyArgs) {

    if(keyArgs == null) throw def.error.argumentRequired('keyArgs');

    this.base(keyArgs);

    /**
     * The grouping operation that created this data.
     *
     * @type {!cdo.GroupingOper}
     * @private
     */
    this.groupingOper = keyArgs.groupingOper || def.fail.argumentRequired('keyArgs.groupingOper');

    // The main reason for only parents having the groupingSpec and groupingLevel is
    // that a data set which is at the border between two groupingSpecs is both a leaf of a previous grouping
    // and a root of the following grouping.
    // Not wanting/needing to have properties for both, we chose those where the data set plays the parent role.

    /**
     * The grouping specification that was used to group the child data sets of this data set.
     *
     * Only set on parent data sets.
     *
     * @type {cdo.GroupingSpec}
     * @private
     */
    this.groupingSpec = keyArgs.groupingSpec || null;

    /**
     * The grouping level specification used to group the child data sets of this data set.
     *
     * Only set on parent data sets.
     *
     * @type {cdo.GroupingLevelSpec}
     * @private
     */
    this.groupingLevelSpec = keyArgs.groupingLevelSpec || null;
});

def.type('cdo.GroupingRootData', cdo.GroupingData)
.init(function(keyArgs) {

    // Always a root, linked data.
    if(keyArgs == null || keyArgs.parent != null || keyArgs.linkParent == null) {
        throw def.error.argumentRequired('keyArgs.linkParent');
    }

    var groupSpec = keyArgs.groupingSpec;
    if(groupSpec == null) {
        throw def.error.argumentRequired('keyArgs.groupingSpec');
    }

    // Let the base class validate requiredness of groupingOper.
    var groupOper = keyArgs.groupingOper;

    if(groupOper && groupSpec.hasExtensionComplexTypes) {

        // Ensure that, at a minimum, a null atom exists in Data#atoms,
        // for each extension dimension of the grouping specification.
        // This ensures that, for example, `cdo.Complex.view(complex, grouping.allDimensionNames)`
        // can be used to create a ComplexView with the dimensions of the grouping that generated the data.
        // In the worst case, the discriminator dimension is only defined in the leaf grouping data sets,
        // and this protects the levels before.

        keyArgs = Object.create(keyArgs);

        var atomsBase = keyArgs.atomsBase = Object.create(keyArgs.linkParent.atoms);

        var extensionDataSetsMap = groupOper._extensionDataSetsMap;

        groupSpec.extensionDimensions().each(function(dimSpec) {
            if(atomsBase[dimSpec.fullName] === undefined) {
                // The null atom.
                atomsBase[dimSpec.fullName] = extensionDataSetsMap[dimSpec.dataSetName].owner.atoms[dimSpec.name];
            }
        });
    }

    this.base(keyArgs);
})
.add(/** @lends cdo.GroupingRootData# */{

    _addDatumsSimple: function(newDatums) {

        // This data gets its datums, possibly filtered (groupingOper.executeAdd calls _addDatumsLocal).
        // Children get their new datums.
        // Linked children of children get their new datums.
        newDatums = this.groupingOper.executeAdd(this, newDatums);

        this._onDatumsAdded(newDatums);
    }
});

def.type('cdo.GroupData', cdo.GroupingData)
.init(function(keyArgs) {

    // Always a non-root data.
    if(keyArgs == null || keyArgs.parent == null) {
        throw def.error.argumentRequired('keyArgs.parent');
    }

    this.base(keyArgs);
});
