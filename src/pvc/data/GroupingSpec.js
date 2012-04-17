
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
 * @see pvc.data.GroupingOper
 * 
 * @name pvc.data.GroupingSpec
 * 
 * @class Contains information about a grouping operation.
 * 
 * @property {string} id A <i>semantic</i> identifier of this grouping specification.
 * @property {boolean} isSingleDimension Indicates that there is only one level and dimension.
 * @property {boolean} isSingleLevel Indicates that there is only one level.
 * @property {boolean} hasCompositeLevels Indicates that there is at least one level with more than one dimension.
 * @property {pvc.data.ComplexType} type The complex type against which dimension names were resolved.
 * @property {pvc.data.GroupingLevelSpec} levels An array of level specifications.
 * @property {pvc.data.DimensionType} firstDimension The first dimension type, if any.
 * 
 * @constructor
 * @param {def.Query} levelSpecs An enumerable of {@link pvc.data.GroupingLevelSpec}.
 * @param {pvc.data.ComplexType} complexType A complex type.
 * 
 */
def.type('pvc.data.GroupingSpec')
.init(function(levelSpecs, complexType){
    levelSpecs  || def.fail.argumentRequired('levelSpecs');
    complexType || def.fail.argumentRequired('complexType');
    
    this.type = complexType;
    
    var ids = [];
    
    this.hasCompositeLevels = false;
    
    this.levels = def.query(levelSpecs)
        .where(function(levelSpec){ return levelSpec.dimensions.length > 0; })
        .select(function(levelSpec){
            ids.push(levelSpec.id);
            
            if(!this.hasCompositeLevels && levelSpec.dimensions.length > 1) {
                this.hasCompositeLevels = true;
            }
            
            return levelSpec;
        }, this)
        .array();
    
    this.depth = this.levels.length;
    this.isSingleLevel     = this.depth === 1;
    this.isSingleDimension = this.isSingleLevel && !this.hasCompositeLevels;
    this.firstDimension    = this.depth > 0 ? this.levels[0].dimensions[0] : null;
        
    this.id = ids.join('||');
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
            var dimSpecs = this.dimensions()
                            .select(function(dimSpec){
                                return reverse ? 
                                    new pvc.data.GroupingDimensionSpec(dimSpec.type, !dimSpec.reverse) :
                                    dimSpec;
                            });
                            
            var levelSpec = new pvc.data.GroupingLevelSpec(dimSpecs);
            
            singleLevel = new pvc.data.GroupingSpec([levelSpec], this.type);
            
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
            
            var levelSpecs = def.query(this.levels)
                    .select(function(levelSpec){
                        var dimSpecs = def.query(levelSpec.dimensions)
                                .select(function(dimSpec){
                                    return new pvc.data.GroupingDimensionSpec(dimSpec.type, !dimSpec.reverse);
                                });
                        
                        return new pvc.data.GroupingLevelSpec(dimSpecs);
                    });

            reverseGrouping = new pvc.data.GroupingSpec(levelSpecs, this.type);
            
            this._reverseGrouping = reverseGrouping;
        }
        
        return reverseGrouping;
    }
});

def.type('pvc.data.GroupingLevelSpec')
.init(function(dimSpecs){
    var ids = [];
    
    this.dimensions = def.query(dimSpecs)
       .select(function(dimSpec){
           ids.push(dimSpec.id);
           return dimSpec;
       })
       .array();
    
    this.id = ids.join(',');
    this.depth = this.dimensions.length;
    
    var me = this;
    this.comparer = function(a, b){ return me.compare(a, b); };
})
.add( /** @lends pvc.data.GroupingLevelSpec */{
    compare: function(a, b){
        for(var i = 0, D = this.depth ; i < D ; i++) {  
            var dimSpec = this.dimensions[i],
                dimName = dimSpec.name,
                result  = dimSpec.comparer(a.atoms[dimName], b.atoms[dimName]);
            if(result !== 0) {
                return result;
            }
        }
        
        return 0;
    },
    
    key: function(datum){
        var keys  = [],
            atoms = [];
        
        for(var i = 0, D = this.depth  ; i < D ; i++) {
            var dimName = this.dimensions[i].name,
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
});

def.type('pvc.data.GroupingDimensionSpec')
.init(function(dimType, reverse){
    this.name     = dimType.name;
    this.reverse  = !!reverse;
    this.type     = dimType;
    this.comparer = dimType.atomComparer(this.reverse);
    this.id = this.name + ":" + (this.reverse ? '0' : '1');
});

/**
 * Parses a grouping specification string.
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
 * @param {pvc.data.ComplexType} type A complex type against which to resolve dimension names.
 * 
 * @type pvc.data.GroupingSpec
 */
pvc.data.GroupingSpec.parse = function(specText, type){
    specText || def.fail.argumentRequired('groupingSpecText');
    type     || def.fail.argumentRequired('type');
    
    var levels;
    if(def.isArray(specText)) {
        levels = specText;
    } else if(def.isString(specText)) {
        levels = specText.split(/\s*,\s*/); 
    }

    var levelSpecs = def.query(levels)
               .select(function(levelText){
                   var dimSpecs = groupSpec_parseGroupingLevel(levelText, type);
                   return new pvc.data.GroupingLevelSpec(dimSpecs);
               });
    
    return new pvc.data.GroupingSpec(levelSpecs, type);
};

/**
 * Creates a grouping specification that is the result of 
 * flattening each specified grouping specification into its own grouping level.
 * 
 * @param {pvc.data.GroupingSpec[]} groupings An enumerable of grouping specifications.
 * @param {object} [keyArgs] Keyword arguments
 * @param {boolean} [keyArgs.reverse=false] Indicates that each dimension's order should be reversed.
 * 
 * @type pvc.data.GroupingSpec
 */
pvc.data.GroupingSpec.multiple = function(groupings, keyArgs){
    var reverse = !!def.get(keyArgs, 'reverse', false);
    var type = null;
    var levelSpecs = def.query(groupings)
           .select(function(grouping){
               var dimSpecs = grouping.dimensions().select(function(dimSpec){
                       var asc = (dimSpec.reverse === reverse);
                       if(!type) {
                           type = dimSpec.type.complexType;
                       } else if(type !== dimSpec.type.complexType) {
                           throw def.error.operationInvalid("Multiple groupings must have the same complex type.");
                       }
                       
                       return new pvc.data.GroupingDimensionSpec(dimSpec.type, !asc);
                   });
               
               return new pvc.data.GroupingLevelSpec(dimSpecs);
           })
           .array();
    
    return type ? new pvc.data.GroupingSpec(levelSpecs, type) : null;
};

var groupSpec_matchDimSpec = /^\s*(.+?)(?:\s+(asc|desc))?\s*$/i;

/**
 * @private
 * @static
 */
function groupSpec_parseGroupingLevel(groupLevelText, type) {
    def.isString(groupLevelText) || def.fail.argumentInvalid('groupLevelText', "Invalid grouping specification.");
    
    return def.query(groupLevelText.split(/\s*\|\s*/))
       .where(def.truthy)
       .select(function(dimSpecText){
            var match   = groupSpec_matchDimSpec.exec(dimSpecText) || def.fail.argumentInvalid('groupLevelText', "Invalid grouping level syntax '{0}'.", [dimSpecText]),
                name    = match[1],
                dimType = type.dimensions(name),
                order   = (match[2] || '').toLowerCase(),
                reverse = order === 'desc';
               
            return new pvc.data.GroupingDimensionSpec(dimType, reverse);
        });
}