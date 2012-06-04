/**
 * Namespace with data related classes.
 * @name pvc.data
 * @namespace
 */

/**
 * @name NoDataException
 * @class An error thrown when a chart has no data.
 */
def.global.NoDataException = function(){};


/**
 * Disposes a list of child objects.
 * 
 * @name pvc.data._disposeChildList
 * 
 * @param {Array} list The list with children to dispose.
 * @param {string} [parentProp] The child's parent property to reset.
 * 
 * @static
 * @private
 */
function data_disposeChildList(list, parentProp) {
    if(list){
        list.forEach(function(child){
            if(parentProp) {
                child[parentProp] = null; // HACK: to avoid child removing itself from its parent (this)
            }
            
            child.dispose(); 
        });
        
        list.length = 0;
    }
}

/**
 * Adds a child object.
 * 
 * @name pvc.data._addColChild
 * 
 * @param {object} parent The parent.
 * @param {string} childrenProp A parent's children array property.
 * @param {object} child The child to add.
 * @param {string} parentProp The child's parent property to set.
 * 
 * @static
 * @private
 */
function data_addColChild(parent, childrenProp, child, parentProp) {
    // <Debug>
    /*jshint expr:true */
    (child && !child[parentProp]) || def.assert("Must not have a '" + parentProp + "'.");
    // </Debug>
    
    child[parentProp] = parent;
    
    (parent[childrenProp] || (parent[childrenProp] = [])).push(child);
}

/**
 * Removes a child object.
 * 
 * @name pvc.data._removeColChild
 * 
 * @param {object} parent The parent.
 * @param {string} childrenProp A parent's children array property.
 * @param {object} child The child to remove.
 * @param {string} parentProp The child's parent property to reset.
 * 
 * @static
 * @private
 */
function data_removeColChild(parent, childrenProp, child, parentProp) {
    // <Debug>
    /*jshint expr:true */
    (child && (!child[parentProp] || child[parentProp] === parent)) || def.assert("Not a child");
    // </Debug>
    
    var children = parent[childrenProp];
    if(children) {
        var index = children.indexOf(child);
        if(index >= 0){
            def.array.removeAt(children, index);
        }
    }
    
    child[parentProp] = null;
}