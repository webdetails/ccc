
/**
 * @name pvc.data.CrosstabTranslationOper
 * @class A translation from a matrix in crosstab format.
 * <p>
 *    The default <i>matrix-crosstab</i> format is:
 * </p>
 * <pre>
 * +----------+----------+----------+
 * | -        | S1       | S2       | ... (taken from metadataItem.colName)
 * +==========+==========+==========+
 * | C1       | 12       | 45       |
 * | C2       | 11       | 99       |
 * | C3       | null     |  3       |
 * +----------+----------+----------+
 * </pre>
 * <p>Legend:</p>
 * <ul>
 *   <li>C<sub>i</sub> &mdash; Category value <i>i</i></li>
 *   <li>S<sub>j</sub> &mdash; Series value <i>j</i></li>
 * </ul>
 * 
 * TODO: document crosstab options
 * 
 * @extends pvc.data.MatrixTranslationOper
 */
def.type('pvc.data.CrosstabTranslationOper', pvc.data.MatrixTranslationOper)
.add(/** @lends pvc.data.CrosstabTranslationOper# */{
    /* LEGEND
     * ======
     * 
     * Matrix Algebra
     * --------------
     * 
     *      j
     *    +---+
     * i  | v |
     *    +---+
     * 
     * i - index of matrix line
     * j - index of matrix column
     * 
     * v - value at indexes i,j
     * 
     * ----
     * 
     * line  = matrix[i]
     * value = line[j]
     * 
     * 
     * Crosstab Algebra
     * ----------------
     * 
     *      CC
     *    +----+
     * RR | MM |
     *    +----+
     * 
     * RR = row     space
     * CC = column  space
     * MM = measure space
     * 
     * ----
     * As a function
     * 
     * cross-table: RR X CC -> MM
     * 
     * ----
     * Dimension of spaces (called "depth" in the code to not confuse with Dimension)
     * 
     * R  = number of row     components
     * C  = number of column  components
     * M  = number of measure components
     * 
     * ----
     * Instances / groups / members
     * 
     * <RG> = <r1, ..., rR> = R-tuple of row     values 
     * <CG> = <c1, ..., cC> = C-tuple of column  values 
     * <MG> = <m1, ..., mM> = M-tuple of measure values
     * 
     * r = index of row group component
     * c = index of column group component
     * m = index of measure component
     * 
     * ----
     * Extent of spaces
     * 
     * RG = number of (distinct) row groups
     * CG = number of (distinct) column groups
     * MG = RG * CG
     * 
     * rg = index of row group
     * cg = index of column group
     * 
     * 
     * Crosstab in a Matrix
     * --------------------
     * 
     * Expand components into own columns:
     * | <...RG...> | <=> | r1 | r2 | r3 | ... | rR |
     * 
     * All component values joined with a separator character, ~,
     * occupying only one column:
     * | <~CG~>     | <=> | "c1~c2~c3~...~cC" |
     * 
     * ----
     * 
     * Format: "Measures in columns"
     * 
     *             0            R           R+M    R+M*(CG-1)   R+M*CG
     *             o------------+------------+ ... +------------o (j - matrix column)
     *         
     *                          0            1     CG-1         CG
     *                          o------------+ ... +------------o (cg - column group index)
     *        
     *                          +------------+ ... +------------+    <-- this._colGroups
     *                          | <~CG~>     |     | <~CG~>     | 
     *                          +------------+     +------------+
     *        
     *      0 o    +------------+------------+ ... +------------+    <-- this._lines
     *        |    | <...RG...> | <...MG...> |     | <...MG...> |
     *        |    |            | <...MG...> |     | <...MG...> |
     *      1 +    +------------+------------+     +------------+
     *                          ^
     *        .                 |
     *        .               m = cg % M
     *        .
     *        
     *        |
     *     RG o
     *       (i - matrix line)
     *       (rg - row group)
     *       
     * i = rg
     * j = R + M*cg
     * 
     * 
     * Virtual Item Structure
     * ----------------------
     * A relational view of the cross groups
     *  
     *    [<...RG...>, <...CG...>, <...MG...>]
     * 
     * 
     * Virtual Item to Dimensions mapping
     * ----------------------------------
     * 
     * A mapping from a virtual item to a list of atoms (of distinct dimensions)
     * 
     * virtual-item --> atom[]
     * 
     * A set of dimensions readers are called and 
     * each returns one or more atoms of distinct dimensions.
     * 
     *  * Each dimension has exactly one dimensions reader that reads its atoms.
     *  * One dimensions reader may read more than one dimension.
     *  * A dimensions reader always reads the same set of dimensions.
     *  
     *  * A dimension consumes data from zero or more virtual item components.
     *  * A virtual item component is consumed by zero or more dimensions.
     *  * A dimension may vary in which virtual item components it consumes, from atom to atom.
     *   
     *  virtual-item-component * <-> * dimension + <-> 1 dimensions reader
     */
    
    /**
     * Performs the translation operation (override).
     * @returns {def.Query} An enumerable of {@link pvc.data.Atom[]}
     * @override
     */
    _executeCore: function(){
        if(this.metadata.length < 2){
            pvc.log("[Warning] Crosstab data sources should have two or more columns.");
            return def.query(); 
        }
        
        var dimsReaders = this._getDimensionsReaders();
        
        // ----------------
        // Virtual item
        
        var item  = new Array(this.R + this.C + this.M);
        
        var itemCrossGroupIndex = this._itemCrossGroupIndex,
            crossGroupDepth     = this; // Quick and dirty (this.R, this.C, this.M)
        
        function updateItemCrossGroup(crossGroupId, source) {
            // Start index of cross group in item
            var itemIndex   = itemCrossGroupIndex[crossGroupId],
                sourceIndex = 0,
                depth       = crossGroupDepth[crossGroupId];
            
            while((depth--) > 0) {
                item[itemIndex++] = source[sourceIndex++];
            }
        }
        
        // ----------------

        function expandLine(line, i){
            updateItemCrossGroup('R', line);
            
            // Every this.M is a new measureGroup/colGroup
            var meaGroups = [];
            for(var j = this.R, J = line.length ; j < J; j += this.M) {
                // TODO: avoid instanciating so many arrays...
                meaGroups.push(  line.slice(j, j + this.M)  );
            }
            
            return def.query(meaGroups).select(function(meaGroup, cg){
                  
                  // Update ITEM
                  updateItemCrossGroup('C', this._colGroups[cg]);
                  updateItemCrossGroup('M', meaGroup);
                  
                  // Naive approach...
                  // Call all readers every time
                  // Dimensions that consume rows and/or columns may be evaluated many times.
                  // So, it's very important that pvc.data.Dimension#intern is as fast as possible
                  //  detecting already interned values.
                  return this._readItem(null, item, dimsReaders);
               }, this);
        }
        
        return def.query(this._lines)
                  .selectMany(expandLine, this);
    },
    
    /**
     * Called once, before {@link #execute}, 
     * for the translation to configure the complex type.
     * 
     * @type undefined
     * @override
     */
    configureType: function(){
        
        // Call base method
        def.base.call(this);
        
        if(this.metadata.length < 2) {
            return;
        }
        
        /* Don't change source */
        var lines = pvc.cloneMatrix(this.source);
        
        this._lines = lines;
        
        /* Initialize Space and Formatting Options */
        
        // Space depth / number of components
        // Default values
        this.R = 1;
        this.C = 1;
        
        // Single measure
        this.M = 1;
        this.measuresDirection = null;
        
        var colNames = this.metadata.map(function(d){ return d.colName; });
        if(this.options.seriesInRows){
            lines.unshift(colNames);
            pv.transpose(lines); // Transposes, in-place
            colNames = lines.shift();
        }
        
        // Legacy options
        // --------------
        // * crosstabMode = true;
        // * isMultiValued (Some space is multi...)
        // * measuresInColumns
        // * measuresIndex, [measuresCount=1]
        // * [categoriesCount = 1]
        
        if(!this.options.isMultiValued) {
            this._colGroups = colNames.slice(this.R);
            
            // To Array
            this._colGroups.forEach(function(colGroup, cg){
                this._colGroups[cg] = [colGroup];
            }, this);
            
        } else {
            if(this.options.measuresInColumns || this.options.measuresIndex == null) {
                
                var categoriesCount = this.options.categoriesCount;
                if(categoriesCount == null) {
                    categoriesCount = 1;
                }
                
                // TODO: >= 1 check
                // TODO: Multiples consume row space?
                this.R = categoriesCount;
                
                // First R columns are from row space
                var encodedColGroups = colNames.slice(this.R),
                    L = encodedColGroups.length;
                
                // Any results in column direction...
                if(L > 0) {
                    if(this.options.measuresInColumns) {
                        this.measuresDirection = 'columns';
                        
                        this._colGroups = this._processEncodedColGroups(encodedColGroups);
                        
                        var CG = this._colGroups.length;
                        
                        CG > 0 || def.assert("CG must be greater that 0.");
                        
                        this.M = Math.floor(L / CG); // should not be needed, but J.I.C.
                        
                    } else {
                        // M = 1
                        this._colGroups = encodedColGroups;
                        
                        // Split encoded column groups
                        this._colGroups.forEach(function(colGroup, cg){
                            this._colGroups[cg] = colGroup.split('~');
                        }, this);
                    }
                    
                    this.C = this._colGroups[0].length;
                }
                
            } else {
                this.measuresDirection = 'rows';
                
                // C = 1 (could also be more if an option to make ~ on existed)
                // R = 1 (could be more...)
                // M >= 1
                
                // The column index at which measure values (of each series) start
                // is the number of row components
                this.R = +this.options.measuresIndex;
                
                var measuresCount = this.options.measuresCount;
                if (measuresCount == null) {
                    measuresCount = 1; 
                }
                
                // TODO: >= 1 check
                this.M = measuresCount;
                
                // First R columns are from row space
                // Next follows a non-relevant Measure title column
                this._colGroups = colNames.slice(this.R + 1);
                
                // To Array
                this._colGroups.forEach(function(colGroup, cg){
                    this._colGroups[cg] = [colGroup];
                }, this);
            }
            
            /* secondAxisSeriesIndexes only implemented for single-series */
            if(this.C === 1) {
                // The null test is required because secondAxisSeriesIndexes can be a number, a string...
                var axis2SeriesIndexes = this.options.secondAxisSeriesIndexes;
                if(axis2SeriesIndexes != null){
                    var seriesKeys = this._colGroups.map(function(colGroup){ return '' + colGroup[0]; });
                    this._axis2SeriesKeySet = this._createSecondAxisSeriesKeySet(axis2SeriesIndexes, seriesKeys);
                }
            }
        }
        
        // ----------------
        // The index at which the first component of 
        // each cross group starts in item
        this._itemCrossGroupIndex = {
                'R': 0,
                'C': this.R,
                'M': this.R + this.C
            };
        
        // ----------------
        
        this._computeDimensionsReaders();
    },
    
    // TODO: docs
    _processEncodedColGroups: function(encodedColGroups){
        var L = encodedColGroups.length,
            colGroups = [];
        
        var prevEncodedColGroup = null;
        for(var i = 0 ; i < L ; i++){
            var encodedColGroup = encodedColGroups[i],
                sepIndex = encodedColGroup.lastIndexOf("~");
            
            // Remove MeasureTitle name from the end of encoded column group
            // MeasureTitle has precedence, so we may end up with dummy '' column group value. (and C = 1)
            encodedColGroup = (sepIndex < 0) ? '' : encodedColGroup.slice(0, sepIndex);
            
            if(encodedColGroup !== prevEncodedColGroup) {
                // Split encoded column groups
                colGroups.push(encodedColGroup.split('~'));
                prevEncodedColGroup = encodedColGroup;
            }
        }
        
        return colGroups; 
    },
    
    /**
     * Computes the dimensions readers array.
     * 
     * @type undefined
     */
    _computeDimensionsReaders: function(){
        // Map: Dimension Group -> Item cross-groups indexes

        if(this.measuresDirection === 'rows') {
            throw def.error.notImplemented();
        }
        
        var me = this,
            index = 0,
            multiChartColIndexes = def.array(this.options.multiChartColumnIndexes),
            multiChartRowIndexes = def.array(this.options.multiChartRowIndexes);
        
        if(multiChartColIndexes) {
            this._addGroupReaders('multiChartColumn', multiChartColIndexes);
        }
        
        if(multiChartRowIndexes) {
            this._addGroupReaders('multiChartRow', multiChartRowIndexes);
        }
        
        function add(dimGroupName, crossGroup, level, count) {
            var crossEndIndex = me._itemCrossGroupIndex[crossGroup] + count; // exclusive
            
            while(count > 0) {
                var dimName = pvc.data.DimensionType.dimensionGroupLevelName(dimGroupName, level);
                if(!me._userUsedDims[dimName]) { // Skip name if occupied and continue with next name
                    
                    // use first available slot for auto dims readers as long as within crossIndex and crossIndex + count
                    index = me._nextAvailableItemIndex(index);
                    if(index >= crossEndIndex) {
                        // this group has no more slots available
                        return;
                    }
                    
                    // Consume the index
                    me._userItem[index] = true;
                    
                    var dimGet = me._propGet(dimName, index);
                    
                    me._userDimsReaders.push(dimGet);
                    
                    // <Debug>
                    !def.hasOwn(me._userDimsReadersByDim, dimName) || def.assert("Dimension already being read.");
                    // </Debug>
                    
                    me._userDimsReadersByDim[dimName] = dimGet;
                    
                    count--;
                }
                
                level++;
            }
        }
        
        add('category', 'R', 0, this.R);
        add('series',   'C', 0, this.C);
        
        if(!this._userUsedDims.value) {
            // The null test is required because secondAxisSeriesIndexes can be a number, a string...
            var axis2SeriesIndexes = this.options.secondAxisSeriesIndexes;
            if(axis2SeriesIndexes != null){
                // Has 'value' and 'value2' dimensions, fed in a special way 
                
                if(!this._userUsedDims.value2) {
                    var seriesDimReader = this._userDimsReadersByDim['series'];
                    if(seriesDimReader) {
                        index = this._nextAvailableItemIndex(index);
                        
                        this._userItem[index] = true;
                        
                        dimReaders.push(this._value1AndValue2Get(this._axis2SeriesKeySet, seriesDimReader, index));
                        
                        // Add more M-1 measures, starting at 2 (~> 'value3', ...)
                        add('value', 'V', 2, this.M - 1);
                    }
                }
                
            } else {
                add('value', 'V', 0, this.M);
            }
        }
    }
});