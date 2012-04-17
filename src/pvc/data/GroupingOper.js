
/**
 * Initializes a grouping operation.
 * 
 * @name pvc.data.GroupingOper
 * 
 * @class Performs one grouping operation according to a grouping specification.
 * 
 * @property {string} key Set on construction with a value that identifies the operation.
 * 
 * @constructor
 *
 * @param {pvc.data.Data} linkParent The link parent data.
 * 
 * @param {string|string[]} groupingSpecText A grouping specification string.
 * 
 * @param {object} [keyArgs] Keyword arguments.
 * 
 * @param {boolean} [keyArgs.visible=null]
 *      Only considers datums that have the specified visible state.
 *      
 * @param {boolean} [keyArgs.selected=null]
 *      Only considers datums that have the specified selected state.
 */
def.type('pvc.data.GroupingOper')
.init(function(linkParent, groupingSpecText, keyArgs){
    
    if(groupingSpecText instanceof pvc.data.GroupingSpec) {
        this._groupingSpec = groupingSpecText;
        if(this._groupingSpec.type !== linkParent.type) {
            throw def.error.argumentInvalid('groupingSpecText', "Invalid associated complex type.");
        }
    } else {
        this._groupingSpec = pvc.data.GroupingSpec.parse(groupingSpecText, linkParent.type);
    }
    
    this._linkParent = linkParent;
    
    this._visible  = def.get(keyArgs, 'visible');
    this._selected = def.get(keyArgs, 'selected');
    
    this.key = this._groupingSpec.id + // grouping spec id is a semantic key...
               "||visible:"  + this._visible +
               "||selected:" + this._selected;
}).
add(/** @lends pvc.data.GroupingOper */{
    
    /**
     * Performs the grouping operation.
     * 
     * @returns {pvc.data.Data} The resulting root data.
     */
    execute: function(){
        var levelSpecs = this._groupingSpec.levels,
            D = levelSpecs.length,
            visible = this._visible,
            selected = this._selected;
        
        // Create a linked root data
        this._root = new pvc.data.Data({linkParent: this._linkParent, datums: []});
        this._root.treeHeight = D;
        
        var leafs = this._root._leafs;
        
        function groupRecursive(parent, datums){
            // Leaf data?
            var depth = parent.depth;
            if(depth >= D){
                parent.leafIndex = leafs.length;
                leafs.push(parent);
                return;
            }
            
            var levelSpec   = levelSpecs[depth],
                firstDatums = [],
                groupInfos  = [],
                datumsByKey = {};
            
            // Group datums on level's dimension
            def.query(datums).each(function(datum){
                if((visible  == null || datum.isVisible  === visible) && 
                   (selected == null || datum.isSelected === selected)) {
                    
                    var groupInfo = levelSpec.key(datum);
                    if(groupInfo != null){
                        var key = groupInfo.key,
                            keyDatums = datumsByKey[key];
                        
                        if(keyDatums){
                            keyDatums.push(datum);
                        } else {
                            keyDatums = datumsByKey[key] = [datum];
                            
                            groupInfo.datums = keyDatums;
                            
                            var datumIndex = def.array.insert(firstDatums, datum, levelSpec.comparer);
                            def.array.insertAt(groupInfos, ~datumIndex, groupInfo);
                        }
                    }
                }
            }, this);

            // Create child data instances, in same order as groupInfos
            var lastLevel = depth === D - 1;
            groupInfos.forEach(function(groupInfo){
                var child = new pvc.data.Data({
                        parent: parent,
                        atoms:  groupInfo.atoms,
                        datums: lastLevel ? groupInfo.datums : []
                    });
                
                groupRecursive.call(this, child, groupInfo.datums);
            }, this);
            
            // TODO: find a less intrusive way, on pvc.data.Data, to perform the following steps
            
            // Set parent._datums to be the union of child group datums
            // This accounts for possibly excluded datums,
            // in any of the below levels (due to null and invisible atoms).
            // TODO: Does this method respect the initial order? If not, should it?
            parent._children.forEach(function(child){
                def.array.append(parent._datums, child._datums);
            });
            
            // Update datums related state 
            data_syncDatumsState.call(parent);
            
            // TODO: Really ugly....
            // This is to support single-dimension grouping specifications used by "where" operation.
            // see #data_whereDatumFilter
            parent._childrenKeyDimName = levelSpec.dimensions[0].name;
        }
        
        groupRecursive.call(this, this._root, this._linkParent._datums);
        
        return this._root;
    }
});
