/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def
.space('pvc.data')
.FlatteningMode =
    def.set(
        def.makeEnum([
            'DfsPre', // Same grouping levels and dimensions, but all nodes are output at level 1
            'DfsPost' // Idem, but in Dfs-Post order
        ]),
        // Add None with value 0
        'None', 0);

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
 * @property {pvc.data.FlatteningMode} flatteningMode The flattening mode.
 * @property {string} rootLabel The label of the resulting root node.
 *
 * @constructor
 * @param {def.Query} levelSpecs An enumerable of {@link pvc.data.GroupingLevelSpec}.
 * @param {pvc.data.ComplexType} [type] A complex type.
 * @param {object} [ka] Keyword arguments.
 * @param {pvc.data.FlatteningMode} [ka.flatteningMode=pvc.data.FlatteningMode.None] The flattening mode.
 * @param {string} [ka.rootLabel=''] The label of the root node.
 */
def.type('pvc.data.GroupingSpec')
.init(function(levelSpecs, type, ka){
    this.type = type || null;

    var ids = [];

    this.hasCompositeLevels = false;

    var dimNames = []; // accumulated dimension names

    this.levels = def.query(levelSpecs || undefined) // -> null query
        .where(function(levelSpec){ return levelSpec.dimensions.length > 0; })
        .select(function(levelSpec){
            ids.push(levelSpec.id);

            def.array.append(dimNames, levelSpec.dimensionNames());

            if(!this.hasCompositeLevels && levelSpec.dimensions.length > 1) {
                this.hasCompositeLevels = true;
            }

            levelSpec._setAccDimNames(dimNames.slice(0));

            return levelSpec;
        }, this)
        .array();

    this._dimNames = dimNames;

    // The null grouping has zero levels
    this.depth             = this.levels.length;
    this.isSingleLevel     = this.depth === 1;
    this.isSingleDimension = this.isSingleLevel && !this.hasCompositeLevels;
    this.firstDimension    = this.depth > 0 ? this.levels[0].dimensions[0] : null;

    this.rootLabel = def.get(ka, 'rootLabel') || "";
    this.flatteningMode = def.get(ka, 'flatteningMode') || pvc.data.FlatteningMode.None;

    this._cacheKey = this._calcCacheKey();
    this.id = this._cacheKey + "##" + ids.join('||');
})
.add(/** @lends pvc.data.GroupingSpec# */{

    _calcCacheKey: function(ka) {
        return [def.get(ka, 'flatteningMode') || this.flatteningMode,
                def.get(ka, 'reverse'       ) || 'false',
                def.get(ka, 'isSingleLevel' ) || this.isSingleLevel,
                def.get(ka, 'rootLabel'     ) || this.rootLabel]
               .join('#');
    },

    /**
     * Late binds a grouping specification to a complex type.
     * @param {pvc.data.ComplexType} type A complex type.
     */
    bind: function(type){
        this.type = type || def.fail.argumentRequired('type');
        this.levels.forEach(function(levelSpec) { levelSpec.bind(type); });
    },

    /**
     * Obtains an enumerable of the contained dimension specifications.
     * @type {def.Query}
     */
    dimensions: function() { return def.query(this.levels).prop('dimensions').selectMany(); },

    dimensionNames: function() { return this._dimNames; },

    view: function(complex) { return complex.view(this.dimensionNames()); },

    /**
     * Indicates if the data resulting from the grouping is discrete or continuous.
     * @type {boolean}
     */
    isDiscrete: function() {
        var d;
        return !this.isSingleDimension ||
               (!!(d = this.firstDimension) && d.type.isDiscrete);
    },

    /**
     * Obtains the dimension type of the first dimension spec., if any.
     * @type {pvc.visual.DimensionType}
     */
    firstDimensionType: function() {
        var d = this.firstDimension;
        return d && d.type;
    },

    /**
     * Obtains the dimension name of the first dimension spec., if any.
     * @type {string}
     */
    firstDimensionName: function() {
        var dt = this.firstDimensionType();
        return dt && dt.name;
    },

    /**
     * Obtains the dimension value type of the first dimension spec., if any.
     * @type {string}
     */
    firstDimensionValueType: function() {
        var dt = this.firstDimensionType();
        return dt && dt.valueType;
    },

    /**
     * Indicates if the grouping has no levels.
     * @type {boolean}
     */
    isNull: function() { return !this.levels.length; },

    /**
     * Obtains a version of this grouping specification
     * that conforms to the specified arguments.
     *
     * @param {string}  [ka.flatteningMode] The desired flattening mode.
     * @param {boolean} [ka.isSingleLevel=false] Indicates that the grouping should have only a single level.
     * If that is not the case, all grouping levels are collapsed into a single level containing all dimensions.
     *
     * @param {boolean} [ka.reverse=false] Indicates that each dimension's order should be reversed.
     * @param {string}  [ka.rootLabel] The label of the resulting root node.
     *
     * @type {pvc.data.GroupingSpec}
     */
    ensure: function(ka) {
        var result;
        if(ka) {
            var cacheKey = this._calcCacheKey(ka);
            if(cacheKey !== this._cacheKey) {
                var cache = def.lazy(this, '_groupingCache');
                result = def.getOwn(cache, cacheKey);
                if(!result) { result = cache[cacheKey] = this._ensure(ka); }
            }
        }

        return result || this;
    },

    _ensure: function(ka) {
        var me = this;

        if(def.get(ka, 'isSingleLevel') && !me.isSingleLevel) { return me._singleLevelGrouping(ka); }
        if(def.get(ka, 'reverse')) { return me._reverse(ka); }

        var flatteningMode = def.get(ka, 'flatteningMode') || me.flatteningMode;
        var rootLabel      = def.get(ka, 'rootLabel') || me.rootLabel;
        if(flatteningMode !== me.flatteningMode || rootLabel !== me.rootLabel) {
            return new pvc.data.GroupingSpec(me.levels, me.type, { // Share Levels
                flatteningMode: flatteningMode,
                rootLabel:      rootLabel
            });
        }

        return me;
    },

    /**
     * Obtains a single-level version of this grouping specification.
     *
     * @param {object} [ka] Keyword arguments
     * @param {boolean} [ka.reverse=false] Indicates that each dimension's order should be reversed.
     * @param {string} [ka.rootLabel] The label of the resulting root node.
     * @type {pvc.data.GroupingSpec}
     */
    _singleLevelGrouping: function(ka) {
        var reverse = !!def.get(ka, 'reverse');
        var dimSpecs =
            this
            .dimensions()
            .select(function(dimSpec) {
                return reverse ?
                       new pvc.data.GroupingDimensionSpec(dimSpec.name, !dimSpec.reverse, dimSpec.type.complexType) :
                       dimSpec;
            });

        var levelSpec = new pvc.data.GroupingLevelSpec(dimSpecs, this.type);

        return new pvc.data.GroupingSpec([levelSpec], this.type, {
            flatteningMode: null, // turns into singleLevel
            rootLabel:      def.get(ka, 'rootLabel') || this.rootLabel
        });
    },

    /**
     * Obtains a reversed version of this grouping specification.
     * @param {object} [ka] Keyword arguments
     * @param {string} [ka.rootLabel] The label of the resulting root node.
     * @type {pvc.data.GroupingSpec}
     */
    _reverse: function(ka) {
        var levelSpecs =
            def
            .query(this.levels)
            .select(function(levelSpec) {
                var dimSpecs =
                    def
                    .query(levelSpec.dimensions)
                    .select(function(dimSpec) {
                        return new pvc.data.GroupingDimensionSpec(dimSpec.name, !dimSpec.reverse, dimSpec.type.complexType);
                    });

                return new pvc.data.GroupingLevelSpec(dimSpecs, this.type);
            });

        return new pvc.data.GroupingSpec(levelSpecs, this.type, {
            flatteningMode: def.get(ka, 'flatteningMode') || this.flatteningMode,
            rootLabel:      def.get(ka, 'rootLabel'     ) || this.rootLabel
        });
    },

    toString: function(){
        return def.query(this.levels)
                .select(function(level){ return '' + level; })
                .array()
                .join(', ');
    }
});

def.type('pvc.data.GroupingLevelSpec')
.init(function(dimSpecs, type){
    var ids = [];
    var dimNames = [];

    this.dimensions = def.query(dimSpecs)
       .select(function(dimSpec){
           ids.push(dimSpec.id);
           dimNames.push(dimSpec.name);
           return dimSpec;
       })
       .array();

    this._dimNames = dimNames;

    this.dimensionsInDefOrder = this.dimensions.slice(0);
    if(type) { this._sortDimensions(type); }

    this.id = ids.join(',');
    this.depth = this.dimensions.length;

    var me = this;
    this.comparer = function(a, b) { return me.compare(a, b); };
})
.add( /** @lends pvc.data.GroupingLevelSpec */{
    _sortDimensions: function(type) {
        type.sortDimensionNames(
            this.dimensionsInDefOrder,
            function(d) { return d.name; });
    },

    _setAccDimNames: function(accDimNames) { this._accDimNames = accDimNames; },

    accDimensionNames: function() { return this._accDimNames; },

    dimensionNames: function() { return this._dimNames; },

    bind: function(type) {
        this._sortDimensions(type);

        this.dimensions.forEach(function(dimSpec) { dimSpec.bind(type); });
    },

    compare: function(a, b) {
        for(var i = 0, D = this.depth ; i < D ; i++) {
            var result = this.dimensions[i].compareDatums(a, b);
            if(result !== 0) { return result; }
        }

        return 0;
    },

    key: function(datum) {
        var key      = '';
        var atoms    = {};
        var datoms   = datum.atoms;
        var dimNames = this._dimNames;
        var keySep   = datum.owner.keySep;

        // This builds a key compatible with that of pvc.data.Complex#key
        // See also pvc.data.Complex.compositeKey
        for(var i = 0, D = this.depth ; i < D ; i++) {
            var dimName = dimNames[i];
            var atom = datoms[dimName];
            atoms[dimName] = atom;
            if(!i) { key = atom.key; }
            else   { key += keySep + atom.key; }
        }

        return {key: key, atoms: atoms, dimNames: dimNames};
    },

    toString: function() {
        return def.query(this.dimensions)
                .select(function(dimSpec) { return '' + dimSpec; })
                .array()
                .join('|');
    }
});

def.type('pvc.data.GroupingDimensionSpec')
.init(function(name, reverse, type) {
    this.name     = name;
    this.reverse  = !!reverse;
    this.id = this.name + ":" + (this.reverse ? '0' : '1');
    if(type) { this.bind(type); }
})
.add( /** @lends pvc.data.GroupingDimensionSpec */ {
    type: null,
    comparer: null,

    /**
     * Late binds a dimension specification to a complex type.
     * @param {pvc.data.ComplexType} type A complex type.
     */
    bind: function(type) {
        /*jshint expr:true */
        type || def.fail.argumentRequired('type');

        this.type     = type.dimensions(this.name);
        this.comparer = this.type.atomComparer(this.reverse);
    },

    compareDatums: function(a, b) {
        //if(this.type.isComparable) {
            return this.comparer(a.atoms[this.name], b.atoms[this.name]);
        //}

        // Use datum source order
        //return this.reverse ? (b.id - a.id) : (a.id - b.id);
    },

    toString: function() { return this.name + (this.reverse ? ' desc' : ''); }
});

/**
 * Parses a grouping specification string.
 *
 * @param {string|Array.<string>} [specText] The grouping specification text,
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
 * @type {pvc.data.GroupingSpec}
 */
pvc.data.GroupingSpec.parse = function(specText, type) {
    if(!specText) { return new pvc.data.GroupingSpec(null, type); }

    var levels;
    if(def.array.is(specText)) {
        levels = specText;
    } else if(def.string.is(specText)) {
        levels = specText.split(/\s*,\s*/);
    }

    var levelSpecs =
        def
        .query(levels)
        .select(function(levelText){
            var dimSpecs = groupSpec_parseGroupingLevel(levelText, type);
            return new pvc.data.GroupingLevelSpec(dimSpecs, type);
        });

    return new pvc.data.GroupingSpec(levelSpecs, type);
};

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
       .select(function(dimSpecText) {
            var match   = groupSpec_matchDimSpec.exec(dimSpecText) ||
                            def.fail.argumentInvalid('groupLevelText', "Invalid grouping level syntax '{0}'.", [dimSpecText]),
                name    = match[1],
                order   = (match[2] || '').toLowerCase(),
                reverse = order === 'desc';

            return new pvc.data.GroupingDimensionSpec(name, reverse, type);
        });
}
