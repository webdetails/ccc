/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Bar Panel.
 */
def
.type('pvc.BarPanel', pvc.BarAbstractPanel)
.add({
    plotType: 'bar',
    _ibits: -1 // reset
});

pvc.PlotPanel.registerClass(pvc.BarPanel);