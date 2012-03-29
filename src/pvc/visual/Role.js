/**
 * Initializes a visual role instance.
 * 
 * @name pvc.visual.Role
 * 
 * @class Represents a role that is somehow played by 
 * visualization and its connection to the data that satisfies it.  
 * @property {string} name The name of the role.
 * @property {pvc.data.GroupingSpec} grouping The grouping specification of the visual role.
 * 
 * @constructor
 * @param {string} name The name of the role.
 * @property {pvc.data.GroupingSpec} groupingSpec The grouping specification of the visual role.
 */
def.type('pvc.visual.Role')
.init(function(name, groupingSpec){
    if(groupingSpec.hasCompositeLevels) {
        throw def.error.argumentInvalid(def.format('roles.{0}', [name]), "Role has composite levels which is invalid.");
    }
    
    this.name = name;
    this.grouping = groupingSpec;
});