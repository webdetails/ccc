
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
 * @property {string} flatteningMode Indicates if the grouping is
 * flattened using pre or post order depth-first search.
 * Possible values are <tt>null</tt>, <tt>'tree-pre'</tt> and <tt>'tree-post'</tt>.
 * @property {string} flattenRootLabel The label of the root node of a flattening operation.
 *
 * @constructor
 * @param {def.Query} levelSpecs An enumerable of {@link pvc.data.GroupingLevelSpec}.
 * @param {pvc.data.ComplexType} [type] A complex type.
 * @param {object} [keyArgs] Keyword arguments.
 * @param {string} [keyArgs.flatteningMode=null] The flattening mode.
 * @param {string} [keyArgs.flattenRootLabel=''] The label of the root node of a flattening operation.
 */
def.type('pvc.data.GroupingSpec')
.init(function(levelSpecs, type, keyArgs){
    this.type = type || null;
    
    var ids = [];
    
    this.hasCompositeLevels = false;
    
    this.levels = def.query(levelSpecs || undefined) // -> null query
        .where(function(levelSpec){ return levelSpec.dimensions.length > 0; })
        .select(function(levelSpec){
            ids.push(levelSpec.id);
            
            if(!this.hasCompositeLevels && levelSpec.dimensions.length > 1) {
                this.hasCompositeLevels = true;
            }
            
            return levelSpec;
        }, this)
        .array();

    // The null grouping has zero levels
    this.depth             = this.levels.length;
    this.isSingleLevel     = this.depth === 1;
    this.isSingleDimension = this.isSingleLevel && !this.hasCompositeLevels;
    this.firstDimension    = this.depth > 0 ? this.levels[0].dimensions[0] : null;
    
    this.flatteningMode   = def.get(keyArgs, 'flatteningMode'  ) || null;
    this.flattenRootLabel = def.get(keyArgs, 'flattenRootLabel') || '';
    
    this.id = (this.flatteningMode || '') + "##" +
              this.flattenRootLabel + "##" +
              ids.join('||');
})
.add(/** @lends pvc.data.GroupingSpec# */{
    /**
     * Late binds a grouping specification to a complex type.
     * @param {pvc.data.ComplexType} type A complex type.
     */
    bind: function(type){
        this.type = type || def.fail.argumentRequired('type');
        this.dimensions().each(function(dimSpec){
            dimSpec.bind(type);
        });
    },

    /**
     * Obtains an enumerable of the contained dimension specifications.
     * @type def.Query
     */
    dimensions: function(){
        return def.query(this.levels)
                  .selectMany(function(level){ return level.dimensions; });
    },

    dimensionNames: function(){
        if(!this._dimNames){
            this._dimNames = this.dimensions()
                                 .select(function(dimSpec){ return dimSpec.name; })
                                 .array();
        }
        
        return this._dimNames;
    },
    
    view: function(complex){
        return complex.view(this.dimensionNames());
    },

    /**
     * Indicates if the data resulting from the grouping is discrete or continuous.
     * @type boolean
     */
    isDiscrete: function(){
        return !this.isSingleDimension || this.firstDimension.type.isDiscrete;
    },

    /**
     * Indicates if the grouping has no levels.
     * @type boolean
     */
    isNull: function(){
        return !this.levels.length;
    },

    /**
     * Obtains a version of this grouping specification
     * that conforms to the specified arguments.
     *
     * @param {string} [keyArgs.flatteningMode] The desired flatening mode.
     * Supports the value 'singleLevel' as a way to signify the same as
     * what the method {@link #singleLevelGrouping} does.
     *
     * @param {boolean} [keyArgs.reverse=false] Indicates that each dimension's order should be reversed.
     * @type pvc.data.GroupingSpec
     */
    ensure: function(keyArgs){
        var grouping = this,
            flatteningMode = def.get(keyArgs, 'flatteningMode');

        if(flatteningMode){
            if(flatteningMode === 'singleLevel'){
                // Supports reverse
                return grouping.singleLevelGrouping(keyArgs);
            }

            var flattenRootLabel = def.get(keyArgs, 'flattenRootLabel') || '';
            if(this.flatteningMode !== flatteningMode || (this.flattenRootLabel !== flattenRootLabel)){
                grouping = new pvc.data.GroupingSpec(grouping.levels, grouping.type, {
                    flatteningMode:   flatteningMode,
                    flattenRootLabel: flattenRootLabel
                });
            }
        }

        if (def.get(keyArgs, 'reverse', false)){
            grouping = grouping.reversed();
        }

        return grouping;
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
        
        /*jshint expr:true */
        this._singleLevelGrouping || (this._singleLevelGrouping = {});
        
        var singleLevel = this._singleLevelGrouping[reverse];
        if(!singleLevel) {
            var dimSpecs = this.dimensions()
                            .select(function(dimSpec){
                                return reverse ? 
                                    new pvc.data.GroupingDimensionSpec(dimSpec.name, !dimSpec.reverse, dimSpec.type.complexType) :
                                    dimSpec;
                            });
                            
            var levelSpec = new pvc.data.GroupingLevelSpec(dimSpecs);
            
            singleLevel = new pvc.data.GroupingSpec([levelSpec], this.type, {flatteningMode: this.flatteningMode});
            
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
                                    return new pvc.data.GroupingDimensionSpec(dimSpec.name, !dimSpec.reverse, dimSpec.type.complexType);
                                });
                        
                        return new pvc.data.GroupingLevelSpec(dimSpecs);
                    });

            reverseGrouping = new pvc.data.GroupingSpec(levelSpecs, this.type, {flatteningMode: this.flatteningMode});
            
            this._reverseGrouping = reverseGrouping;
        }
        
        return reverseGrouping;
    },

    toString: function(){
        return def.query(this.levels)
                .select(function(level){ return '' + level; })
                .array()
                .join(', ');
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
            var result = this.dimensions[i].compareDatums(a, b);
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
            atoms.push(atom);
            keys.push(atom.globalKey());
        }
        
        return {
            key:   keys.join(','),
            atoms: atoms
        };
    },

    toString: function(){
        return def.query(this.dimensions)
                .select(function(dimSpec){ return '' + dimSpec; })
                .array()
                .join('|');
    }
});

def.type('pvc.data.GroupingDimensionSpec')
.init(function(name, reverse, type){
    this.name     = name;
    this.reverse  = !!reverse;
    this.id = this.name + ":" + (this.reverse ? '0' : '1');
    if(type){
        this.bind(type);
    }
})
.add( /** @lends pvc.data.GroupingDimensionSpec */ {
    type: null,
    comparer: null,

    /**
     * Late binds a dimension specification to a complex type.
     * @param {pvc.data.ComplexType} type A complex type.
     */
    bind: function(type){
        /*jshint expr:true */
        type || def.fail.argumentRequired('type');
        
        this.type     = type.dimensions(this.name);
        this.comparer = this.type.atomComparer(this.reverse);
    },

    compareDatums: function(a, b){
        //if(this.type.isComparable) {
            var result  = this.comparer(a.atoms[this.name], b.atoms[this.name]);
            if(result !== 0) {
                return result;
            }
            return 0;
        //}
        
        // Use datum source order
        //return this.reverse ? (b.id - a.id) : (a.id - b.id);
    },

    toString: function(){
        return this.name + (this.reverse ? ' desc' : '');
    }
});

/**
 * Parses a grouping specification string.
 * 
 * @param {string|string[]} [specText] The grouping specification text,
 * or array of grouping specification level text.
 * When unspecified, a null grouping is returned.
 * 
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
 * @param {pvc.data.ComplexType} [type] A complex type against which to resolve dimension names.
 * 
 * @type pvc.data.GroupingSpec
 */
pvc.data.GroupingSpec.parse = function(specText, type){
    if(!specText){
        return new pvc.data.GroupingSpec(null, type);
    }
    
    var levels;
    if(def.array.is(specText)) {
        levels = specText;
    } else if(def.string.is(specText)) {
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
 * Creates a combined grouping specification.
 *
 * <p>
 * TODO:
 * If all the specified grouping specifications have the same flattening mode
 * then each of the specified is destructured into a single grouping level.
 *
 * Otherwise, a composite grouping specification is returned.
 * </p>
 * 
 * @param {pvc.data.GroupingSpec[]} groupings An enumerable of grouping specifications.
 * @param {object} [keyArgs] Keyword arguments
 * @param {boolean} [keyArgs.reverse=false] Indicates that each dimension's order should be reversed.
 * 
 * @type pvc.data.GroupingSpec
 
pvc.data.GroupingSpec.multiple = function(groupings, keyArgs){
    var reverse = !!def.get(keyArgs, 'reverse', false);
    var type = null;
    
    // One level per specified grouping
    var levelSpecs = def.query(groupings)
           .select(function(grouping){
               var dimSpecs = grouping.dimensions().select(function(dimSpec){
                       var asc = (dimSpec.reverse === reverse);
                       if(!type) {
                           type = dimSpec.type.complexType;
                       } else if(type !== dimSpec.type.complexType) {
                           throw def.error.operationInvalid("Multiple groupings must have the same complex type.");
                       }
                       
                       return new pvc.data.GroupingDimensionSpec(dimSpec.name, !asc, dimSpec.type.complexType);
                   });
               
               return new pvc.data.GroupingLevelSpec(dimSpecs);
           })
           .array();
    
    return type ? new pvc.data.GroupingSpec(levelSpecs, type) : null;
};
*/

var groupSpec_matchDimSpec = /^\s*(.+?)(?:\s+(asc|desc))?\s*$/i;

/**
 * @private
 * @static
 */
function groupSpec_parseGroupingLevel(groupLevelText, type) {
    /*jshint expr:true */
    def.string.is(groupLevelText) || def.fail.argumentInvalid('groupLevelText', "Invalid grouping specification.");
    
    return def.query(groupLevelText.split(/\s*\|\s*/))
       .where(def.truthy)
       .select(function(dimSpecText){
            var match   = groupSpec_matchDimSpec.exec(dimSpecText) ||
                            def.fail.argumentInvalid('groupLevelText', "Invalid grouping level syntax '{0}'.", [dimSpecText]),
                name    = match[1],
                order   = (match[2] || '').toLowerCase(),
                reverse = order === 'desc';
               
            var dimSpec = new pvc.data.GroupingDimensionSpec(name, reverse, type);
            return dimSpec;
        });
}