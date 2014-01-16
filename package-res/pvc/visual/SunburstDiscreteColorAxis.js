/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_Size:true, pvc_Axis:true */

// TODO: This way of injecting derived colors doesn't yet feel right.
// In particular, it implies deriving the ColorAxis class, which
// might complicate in future multi-plot scenarios.

// The hoverable effect needs colors assigned to parents,
// in the middle of the hierarchy,
// whose color possibly does not show in normal mode,
// cause they have no leaf child (or degenerate child)
// The headers also need colors assigned to the non-leaf-parent nodes. 

def
.type('pvc.visual.SunburstDiscreteColorAxis', pvc.visual.ColorAxis)
.add(/** @lends pvc.visual.SunburstDiscreteColorAxis# */{
    /** @override */
    domainItemValueProp: function() {
        return !!this.role && this.role.grouping.isSingleDimension ? 'value' : 'absKey';
    },
    
    /** @override */
    domainGroupOperator: function() { return 'select'; },

    // Select all items that will take base scheme colors
    /** @override */
    _selectDomainItems: function(domainData) {
        var candidates = def.query(domainData.nodes());
        
        var isNotDegenerate = function(data) { return data.value != null; };
        
        return candidates
            .where(function(itemData) {
                if(!itemData.parent) {
                    return false;
                }

                // Is a non-degenerate node having at least one child.
                return isNotDegenerate(itemData) && !itemData.parent.parent;
            });
    }
});
