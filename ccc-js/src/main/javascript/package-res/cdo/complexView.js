/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a complex view instance.
 * 
 * @name cdo.ComplexView
 * 
 * @class Represents a view of certain dimensions over a given source complex instance.
 * @extends cdo.Complex
 * 
 * @property {cdo.Complex} source The source complex instance.
 * @property {string} label The composite label of the own atoms in the view.
 * @constructor
 * @param {cdo.Complex} source The source complex instance.
 * @param {string[]} viewDimNames The dimensions that should be revealed by the view.
 */
def.type('cdo.ComplexView', cdo.Complex)
.init(function(source, viewDimNames) {

    this.source = source;
    
    this.viewDimNames = viewDimNames;

    // Call base constructor
    this.base(source, source.atoms, viewDimNames, source.owner.atoms, /* wantLabel */ true);
})
.add({
    values: function() {
        return cdo.Complex.values(this, this.viewDimNames);
    },
    labels: function() {
        return cdo.Complex.labels(this, this.viewDimNames);
    }
});