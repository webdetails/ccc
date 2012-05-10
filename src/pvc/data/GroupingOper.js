
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
 *
 * @param {function} [keyArgs.where] A datum predicate.
 * @param {string} [keyArgs.whereKey] A key for the specified datum predicate,
 * previously returned by this function.
 * <p>
 * If this argument is specified it can be used to cache results.
 * If it is not specified, and <tt>keyArgs</tt> is specified,
 * one is returned.
 * If it is not specified and <tt>keyArgs</tt> is not specified,
 * then the instance will have a null {@link #key} property value.
 * </p>
 * <p>
 * If it a key not returned by this operation is specified, 
 * then it should be prefixed by a "_" character,
 * in order to not colide with keys generated internally.
 * </p>
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
    this._where    = def.get(keyArgs, 'where');
    this._visible  = def.get(keyArgs, 'visible');
    this._selected = def.get(keyArgs, 'selected');
    
    var hasKey = true,
        whereKey = '';
    if(this._where){
        whereKey = def.get(keyArgs, 'whereKey');
        if(!whereKey){
            if(!keyArgs){
                // Force no key
                hasKey = false;
            } else {
                whereKey = '' + def.nextId('groupOperWhereKey');
                keyArgs.whereKey = whereKey;
            }
        }
    }

    if(hasKey){
        this.key = this._groupingSpec.id + // grouping spec id is a semantic key...
                "||visible:"  + this._visible +
                "||selected:" + this._selected +
                "||where:"    + whereKey;
    }
}).
add(/** @lends pvc.data.GroupingOper */{
    
    key: null,

    /**
     * Performs the grouping operation.
     * 
     * @returns {pvc.data.Data} The resulting root data.
     */
    execute: function(){
        var levelSpecs = this._groupingSpec.levels,
            D = levelSpecs.length,
            visible = this._visible,
            selected = this._selected,
            where = this._where;
        
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

        var rootDatums = def.query(this._linkParent._datums);

        if(visible != null){
            rootDatums = rootDatums.where(function(datum){ return datum.isVisible === visible; });
        }

        if(selected != null){
            rootDatums = rootDatums.where(function(datum){ return datum.isSelected === selected; });
        }

        if(where){
            rootDatums = rootDatums.where(where);
        }

        groupRecursive.call(this, this._root, rootDatums);
        
        return this._root;
    }
});
