/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a complex view instance.
 *
 * @name pvc.data.ComplexView
 *
 * @class Represents a view of certain dimensions over a given source complex instance.
 * @extends pvc.data.Complex
 *
 * @property {pvc.data.Complex} source The source complex instance.
 * @property {string} label The composite label of the own atoms in the view.
 * @constructor
 * @param {pvc.data.Complex} source The source complex instance.
 * @param {Array.<string>} viewDimNames The dimensions that should be revealed by the view.
 */
def.type('pvc.data.ComplexView', pvc.data.Complex)
.init(function(source, viewDimNames){

    this.source = source;

    this.viewDimNames = viewDimNames;

    // Call base constructor
    this.base(source, source.atoms, viewDimNames, source.owner.atoms, /* wantLabel */ true);
})
.add({
    values: function(){
        return pvc.data.Complex.values(this, this.viewDimNames);
    },
    labels: function(){
        return pvc.data.Complex.labels(this, this.viewDimNames);
    }
});