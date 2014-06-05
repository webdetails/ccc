/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def
.type('pvc.CategoricalAbstractPanel', pvc.CartesianAbstractPanel)
.init(function(chart, parent, plot, options) {
    
    this.base(chart, parent, plot, options);
    
    this.stacked = plot.option('Stacked');
});