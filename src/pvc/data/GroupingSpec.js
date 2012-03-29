
/**
 * Initializes a grouping specification.
 * 
 * <p>
 * A grouping specification contains information similar to that of an SQL 'order by' clause.
 * </p>
 * 
 * <p>
 * A grouping specification supports the grouping operation.
 * </p>
 * 
 * <p>
 * Referred dimension names are resolved against a specific data instance.
 * </p>
 * @see pvc.data.GroupingOper
 * 
 * @name pvc.data.GroupingSpec
 * 
 * @class Contains information about a grouping operation.
 * 
 * @property {string} key A semantic identifier of this grouping specification.
 * @property {boolean} isSingleDimension Indicates that there is only one level and dimension.
 * @property {boolean} isSingleLevel Indicates that there is only one level.
 * @property {boolean} hasCompositeLevels Indicates that there is at least one level with more than one dimension.
 * @property {pvc.data.Data} data The data instance against which dimension names were resolved.
 * @property {object[]} levels The array of level specifications.
 * Each level specification is an object containing the following properties:
 * <ul>
 * <li>key - A semantic grouping level key</li>
 * <li>comparer - A datum comparer</li>
 * <li>keyer - A datum key function</li>
 * <li> dimensions - An array of the dimension specifications of the level:
 *    <ul>
 *      <li>name - The name of the dimension</li>
 *      <li>dimension - The dimension instance</li>
 *      <li>reverse - Indicates if the order is descending</li>
 *      <li>comparer - An atom comparer function that respects 'reverse'</li>
 *    </ul>
 * </li>
 * </ul>
 * 
 * @constructor
 *
 * @param {string|string[]|pvc.data.GroupingOperSpec} specText The grouping specification text,
 * or array of grouping specification level text, 
 * or specification object.
 * <p>
 * An example:
 * </p>
 * <pre>
 * "series1 asc, series2 desc, category"
 * </pre>
 * <p>
 * The following will group all the 'series' in one level and the 'category' in another: 
 * </p>
 * <pre>
 * "series1 asc|series2 desc, category"
 * </pre>
 * 
 * @param {pvc.data.Data} data A data instance against which to resolve dimension names.
 */
def.type('pvc.data.GroupingSpec')
.init(function(specText, data){
    specText || def.fail.argumentRequired('groupingSpecText');
    data || def.fail.argumentRequired('data');
    
    this.data = data;
    
    var levels;
    
    if(def.isArray(specText)) {
        levels = specText;
    } else if(def.isString(specText)) {
        levels = specText.split(/\s*,\s*/); 
    }
    
    this.levels = [];

    var levelIds = [];
    
    this.hasCompositeLevels = false;
    
    levels.forEach(function(levelText){
        def.isString(levelText) || def.fail.argumentInvalid('groupingSpecText', "Invalid grouping specification.");
        
        var levelSpec = groupSpec_parseGroupingLevel(levelText, data);
        if(levelSpec) {
            if(!this.hasCompositeLevels && levelSpec.dimensions.length > 1) {
                this.hasCompositeLevels = true;
            }
            
            this.levels.push(levelSpec);
            levelIds.push(levelSpec.key);
        }
    }, this);
    
    this.isSingleLevel     = this.levels.length === 1;
    this.isSingleDimension = this.isSingleLevel && !this.hasCompositeLevels;
    
    this.key = levelIds.join('||');
})
.add(/** @lends pvc.data.GroupingSpec# */{
    dimensions: function(){
        return def.query(this.levels)
                  .selectMany(function(level){ return level.dimensions; })
    }
});

/**
 * @private
 */
function groupSpec_parseGroupingLevel(groupLevelText, data) {
    var dimSpecs = [],
        ids = [];
    
    groupLevelText
        .split(/\s*\|\s*/)
        .forEach(function(dimSpecText){
            if(dimSpecText) {
                var re = /^\s*(.+?)(?:\s+(asc|desc))?\s*$/i,
                    match     = re.exec(dimSpecText) || def.fail.argumentInvalid('groupLevelText', "Invalid grouping level syntax '{0}'.", [dimSpecText]),
                    name      = match[1],
                    dimension = data.dimensions(name),
                    order     = (match[2] || '').toLowerCase(),
                    reverse   = order === 'desc';
               
                ids.push(name + ":" + (reverse ? '0' : '1'));
                
                var dimType = dimension.type;
                
                dimSpecs.push({
                    name:      name,
                    dimension: dimension,
                    reverse:   reverse,
                    comparer:  dimType.atomComparer(reverse)
                });
            }
        });
    
    if(!dimSpecs.length) {
        return null;
    }
    
    var D = dimSpecs.length;
    return {
        key: ids.join(','),
        
        dimensions: dimSpecs,
        
        comparer: function(a, b){
            for(var i = 0 ; i < D ; i++) {  
                var dimSpec = dimSpecs[i],
                    dimName = dimSpec.name,
                    result  = dimSpecs[i].comparer(a.atoms[dimName], b.atoms[dimName]);
                if(result !== 0) {
                    return result;
                }
            }
            
            return 0;
        },
        
        keyer: function(datum, visible){
            var keys  = [],
                atoms = [];
            
            for(var i = 0 ; i < D ; i++) {
                var dimName = dimSpecs[i].name,
                    atom = datum.atoms[dimName];
                if(atom.value == null || (visible != null && atom.isVisible !== visible)) {
                    // Signals to ignore datum
                    return null;
                }
                
                atoms.push(atom);
                keys.push(dimName + ":" + atom.key);
            }
            
            return {
                key:   keys.join(','),
                atoms: atoms
            }
        }
    }
}