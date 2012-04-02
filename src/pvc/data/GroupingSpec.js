
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
 * @param {string|string[]} specText The grouping specification text,
 * or array of grouping specification level text.
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
        def.isString(levelText) || def.fail.argumentInvalid('specText', "Invalid grouping specification.");
        
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
    /**
     * Obtains an enumerable of the contained dimension specifications.
     * @type def.Query
     */
    dimensions: function(){
        return def.query(this.levels)
                  .selectMany(function(level){ return level.dimensions; });
    },
    
    /**
     * Obtains a single-level version of this grouping specification.
     * 
     * <p>
     * If this grouping specification is itself single-level, 
     * then it is returned.
     * </p> 
     * 
     * @param {object} [keyArgs] Keyword arguments
     * @param {boolean} [keyArgs.reverse=false] Indicates that each dimension's order should be reversed.
     * @type pvc.data.GroupingSpec 
     */
    singleLevelGrouping: function(keyArgs){
        var reverse = !!def.get(keyArgs, 'reverse', false);
        if(this.isSingleLevel && !reverse) {
            return this;
        }
        
        this._singleLevelGrouping || (this._singleLevelGrouping = {});
        
        var singleLevel = this._singleLevelGrouping[reverse];
        if(!singleLevel) {
            // TODO: make this the right way - don't parse things again...
            /**
             * rev1 rev2  result
             *  1    1      asc
             *  1    0      desc
             *  0    1      desc
             *  0    0      asc
             */
            var groupingText = this.dimensions()
                                   .select(function(dimSpec){
                                       return dimSpec.name + ' ' + ((dimSpec.reverse === reverse) ? 'asc' : 'desc'); 
                                    })
                                   .array()
                                   .join('|');
            
            singleLevel = new pvc.data.GroupingSpec(groupingText, this.data);
            
            this._singleLevelGrouping[reverse] = singleLevel;
        }
        
        return singleLevel;
    },
    
    /**
     * Obtains a reversed version of this grouping specification.
     * 
     * @type pvc.data.GroupingSpec 
     */
    reversed: function(){
        var reverseGrouping = this._reverseGrouping;
        if(!reverseGrouping) {
            // TODO: make this the right way - don't parse things again...
            var groupingText = def.query(this.levels)
                                   .select(function(levelSpec){
                                       return levelSpec.dimensions.map(function(dimSpec){
                                                   return dimSpec.name + ' ' + (dimSpec.reverse ? 'asc' : 'desc');
                                               })
                                               .join('|');
                                   })
                                   .array()
                                   .join(',');

            reverseGrouping = new pvc.data.GroupingSpec(groupingText, this.data);
            
            this._reverseGrouping = reverseGrouping;
        }
        
        return reverseGrouping;
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
        
        keyer: function(datum){
            var keys  = [],
                atoms = [];
            
            for(var i = 0 ; i < D ; i++) {
                var dimName = dimSpecs[i].name,
                    atom = datum.atoms[dimName];
                if(atom.value == null) {
                    // Signals to ignore datum
                    return null;
                }
                
                atoms.push(atom);
                keys.push(dimName + ":" + atom.key);
            }
            
            return {
                key:   keys.join(','),
                atoms: atoms
            };
        }
    };
}