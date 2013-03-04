
def
.type('pvc.visual.TreemapColorDataCell', pvc.visual.DataCell)
.init(function(){
    
    this.base.apply(this, arguments);
    
    this._valueProp = this.role.grouping.isSingleDimension ? 'value' : 'absKey';
})
.add({
    domainItemDatas: function(){
        var domainData = this.domainData();
        return def.query((domainData || undefined) && domainData.nodes())
                  .where(function(itemData){ 
                      // The root or a parent
                      return !itemData.parent ||
                             // At least one non-degenerate child
                             itemData.children().any(function(child){
                                 return child.value != null;
                             });
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
