/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def
.type('pvc.visual.TreemapColorDataCell', pvc.visual.DataCell)
.init(function(){
    
    this.base.apply(this, arguments);
    
    var g = this.role.grouping;
    this._valueProp = (!g || g.isSingleDimension) ? 'value' : 'absKey';
})
.add({
    // Select all items that will take base scheme colors
    domainItemDatas: function() {
        var domainData = this.domainData();
        var candidates = def.query((domainData || undefined) && domainData.nodes());
        
        var isNotDegenerate = function(data) { return data.value != null; };
        
        var children = function(data) { return data.children().where(isNotDegenerate); };
        
        // Has at least one (non-degenerate) child
        var hasChildren = function(data) { return children(data).any(); };
        
        // Has no children or they are all degenerate
        var isLeaf = function(data) { return !hasChildren(data); };

        if(this.plot.option('ColorMode') === 'byparent') {
            return candidates
                .where(function(itemData) {
                    if(!itemData.parent) {
                        // The root node is assigned a color only when it is a leaf node as well,
                        // or has leaf children.
                        // The root can be degenerate in this case...
                        return isLeaf(itemData) || children(itemData).any(isLeaf);
                    }

                    // Is a non-degenerate node having at least one child.
                    return isNotDegenerate(itemData) && hasChildren(itemData);
                });
        }
        
        return candidates.where(function(itemData) {
            // Leaf node &&
            // > Single (root) || non-degenerate
            return (!itemData.parent || isNotDegenerate(itemData)) && isLeaf(itemData);
        });
    },
    
    domainItemDataValue: function(itemData) { return def.nullyTo(itemData[this._valueProp], ''); },
    
    _resolveDomainData: function() {
        var role = this.role;
        if(role && role.isBound()) {
            var partData = this.plot.chart.partData(this.dataPartValue);
            if(partData) { return role.select(partData); }
        }
        return null;
    }
});
