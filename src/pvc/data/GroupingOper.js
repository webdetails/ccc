
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
 * @param {pvc.data.Datum[]} [datums] A datums array to group.
 * The default value are all datums of the specified link parent.
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
.init(function(linkParent, datums, groupingSpecText, keyArgs){
    
    if(groupingSpecText instanceof pvc.data.GroupingSpec) {
        this._groupingSpec = groupingSpecText;
        if(this._groupingSpec.type !== linkParent.type) {
            throw def.error.argumentInvalid('groupingSpecText', "Invalid associated complex type.");
        }
    } else {
        this._groupingSpec = pvc.data.GroupingSpec.parse(groupingSpecText, linkParent.type);
    }
    
    this._linkParent = linkParent;
    
    this._datums   = (datums || linkParent._datums).slice();
    this._visible  = def.get(keyArgs, 'visible');
    this._selected = def.get(keyArgs, 'selected');
    
    // NOTE: datum.id is not a semantic key, yet, ids are unique per script existence
    // Ids are only put in the key when datums are supplied separately
    
    this.key = this._groupingSpec.id + // grouping spec id is a semantic key...
               "||visible:"  + this._visible +
               "||selected:" + this._selected + 
               "||" + (datums ? this._datums.map(function(datum){ return datum.id; }).join(",") : '');
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
        this._root = new pvc.data.Data({linkParent: this._linkParent, datums: this._datums});
        this._root.treeHeight = D;
        
        function groupRecursive(parent){
            // Leaf data?
            var depth = parent.depth;
            if(depth >= D){
                var leafs = this._root._leafs;
                parent.leafIndex = leafs.length;
                leafs.push(parent);
                return;
            }
            
            var levelSpec   = levelSpecs[depth],
                firstDatums = [],
                groupInfos  = [],
                datumsByKey = {},
                datums      = parent._datums;
            
            // Group datums on level's dimension
            datums.forEach(function(datum){
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
            groupInfos.forEach(function(groupInfo){
                var child = new pvc.data.Data({
                        parent: parent,
                        atoms:  groupInfo.atoms,
                        datums: groupInfo.datums
                    });
                
                groupRecursive.call(this, child);
            }, this);
            
            // Set parent._datums to be the union of child group datums
            // This accounts for possibly excluded datums,
            // in any of the below levels (due to null and invisible atoms).
            // TODO: Does this method respect the initial order? If not, should it?
            datums.length = 0;
            parent._children.forEach(function(child){
                def.array.append(datums, child._datums);
            });
            
            // TODO: Really ugly....
            // This is to support single-dimension grouping specifications used by "where" operation.
            // see #data_whereDatumFilter
            parent._childrenKeyDimName = levelSpec.dimensions[0].name;
        }
        
        groupRecursive.call(this, this._root);
        
        return this._root;
    }
});
