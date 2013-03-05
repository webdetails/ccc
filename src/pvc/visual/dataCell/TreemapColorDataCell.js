
def
.type('pvc.visual.TreemapColorDataCell', pvc.visual.DataCell)
.init(function(){
    
    this.base.apply(this, arguments);
    
    this._valueProp = this.role.grouping.isSingleDimension ? 'value' : 'absKey';
})
.add({
    domainItemDatas: function() {
        var domainData = this.domainData();
        var candidates = def.query((domainData || undefined) && domainData.nodes());
        
        if(this.plot.option('ColorMode') === 'by-parent') {
            return candidates
                .where(function(itemData) {
                    // The root or a parent that has...
                    return !itemData.parent ||
                           // ... at least one non-degenerate child (value != null)
                           // 
                           // The hoverable effect needs colors assigned to parents,
                           // in the middle of the hierarchy,
                           // whose color possibly does not show in normal mode,
                           // cause they have no leaf child (or degenerate child)
                           (itemData.value != null && 
                            itemData.children().any(function(child){
                               return child.value != null;
                            }));
                 });
        }
        
        return candidates.where(function(itemData) {
            // Is the single node (root and leaf) Or
            // Is a non-degenerate leaf node Or 
            // Is the last non-degenerate node, from the root, along a branch
            
            // Leaf node
            if(!itemData.childCount()) {
                // Single (root) || non-degenerate
                return !itemData.parent || itemData.value != null;
            }
            
            return itemData.value != null && 
                   !itemData.children().prop('value').any(def.notNully);
        });
    },
    
    domainItemDataValue: function(itemData) { 
        return def.nullyTo(itemData[this._valueProp], '');
    },
    
    _resolveDomainData: function() {
        var role = this.role;
        if(role && role.isBound()) {
            var partData = this.plot.chart.partData(this.dataPartValue);
            if(partData){
                return role.select(partData);
            }
        }
        
        return null;
    }
});
