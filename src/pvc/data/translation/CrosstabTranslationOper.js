
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
.init(function(complexType, source, metadata, options){
    
    this.base(complexType, source, metadata, options);

    this._separator = this.options.separator || '~';

    this._measureData();
})
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
     * Format: "Measures in columns" (uniform)
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
     * Unfortunately, not all measures have to be specified in all column groups.
     * When a measure in column group would have all rows with a null value, it can be omitted.
     * 
     * Virtual Item Structure
     * ----------------------
     * A relational view of the cross groups
     *  
     *    [<...CG...>, <...RG...>, <...MG...>]
     * 
     * This order is chosen to match that of the relational translation.
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
     * Obtains the number of fields of the virtual item.
     * @type number
     * @override
     */
    virtualItemSize: function(){
        return this.R + this.C + this.M;
    },
    
    /**
     * Performs the translation operation (override).
     * @returns {def.Query} An enumerable of {@link pvc.data.Atom[]}
     * @override
     */
    _executeCore: function(){
        if(!this.metadata.length){
            return def.query(); 
        }
        
        var dimsReaders = this._getDimensionsReaders();
        
        // ----------------
        // Virtual item
        
        var item  = new Array(this.virtualItemSize()),
            itemCrossGroupIndex = this._itemCrossGroupIndex,
            me = this
            ;
        
        function updateVItemCrossGroup(crossGroupId, source) {
            // Start index of cross group in item
            var itemIndex   = itemCrossGroupIndex[crossGroupId],
                sourceIndex = 0,
                depth       = me[crossGroupId];
            
            while((depth--) > 0) {
                item[itemIndex++] = source[sourceIndex++];
            }
        }
        
        function updateVItemMeasure(line, cg) {
            // Start index of cross group in item
            var itemIndex = itemCrossGroupIndex.M,
                cgIndexes = me._colGroupsIndexes[cg],
                depth = me.M;
            
            for(var i = 0 ; i < depth ; i++){
                var lineIndex = cgIndexes[i];
                item[itemIndex++] = lineIndex != null ? line[lineIndex] : null;
            }
        }
        
        // ----------------

        function expandLine(line/*, i*/){
            updateVItemCrossGroup('R', line);
            
            return def.query(this._colGroups).select(function(colGroup, cg){
                  
                  // Update ITEM
                  updateVItemCrossGroup('C', colGroup);
                  updateVItemMeasure(line, cg);
                  
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
    
    _measureData: function(){
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

        var colNames;
        if(this.options.seriesInRows){
            colNames = this.metadata.map(function(d){ return d.colName; });

            lines.unshift(colNames);
            pv.transpose(lines); // Transposes, in-place
            colNames = lines.shift();
            colNames.forEach(function(value, i){
                colNames[i] = {v: value}; // may be null ....
            });
            
        } else if(this.options.compatVersion <= 1){
            colNames = this.metadata.map(function(d){ return {v: d.colName}; });
        } else {
            colNames = this.metadata.map(function(d){ return {v: d.colName, f: d.colLabel }; });
        }

        // --------------
        // * crosstabMode = true;
        // * isMultiValued (Some space is multi...)
        // * measuresInColumns
        // * measuresIndex, [measuresCount=1]
        // * [categoriesCount = 1]
        var categoriesCount;
        if(!this.options.isMultiValued) {
            categoriesCount = def.get(this.options, 'categoriesCount', 1);

            // TODO: >= 0 check
            this.R = categoriesCount;

            this._colGroups = colNames.slice(this.R);
            this._colGroupsIndexes = new Array(this._colGroups.length);
            
            // To Array
            this._colGroups.forEach(function(colGroup, cg){
                this._colGroups[cg] = [colGroup];
                this._colGroupsIndexes[cg] = [this.R + cg]; // all the same
            }, this);

        } else {
            var measuresInColumns = def.get(this.options, 'measuresInColumns', true);
            if(measuresInColumns || this.options.measuresIndex == null) {

                categoriesCount = def.get(this.options, 'categoriesCount', 1);

                // TODO: >= 0 check
                // TODO: Multiples consume row space?
                this.R = categoriesCount;

                // First R columns are from row space
                var encodedColGroups = colNames.slice(this.R),
                    L = encodedColGroups.length;

                // Any results in column direction...
                if(L > 0) {
                    if(measuresInColumns) {
                        this.measuresDirection = 'columns';

                        this._processEncodedColGroups(encodedColGroups);
                        // Updates:
                        // this._colGroups
                        // this._colGroupsIndexes
                        // this.M

                    } else {
                        // M = 1
                        this._colGroups = encodedColGroups;
                        this._colGroupsIndexes = [];

                        // Split encoded column groups
                        this._colGroups.forEach(function(colGroup, cg){
                            this._colGroups[cg] = this._splitEncodedColGroupCell(colGroup);
                            this._colGroupsIndexes[cg] = [this.R + cg]; // all the same
                        }, this);
                    }

                    this.C = this._colGroups[0].length; // may be 0!
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

                // To Array of Cells
                this._colGroups.forEach(function(colGroup, cg){
                    this._colGroups[cg] = [colGroup];
                }, this);
            }

            /* secondAxisSeriesIndexes only implemented for single-series */
            if(this.C === 1 && !this._userUsedDims.dataPart) {
                // The null test is required because secondAxisSeriesIndexes can be a number, a string...
                var axis2SeriesIndexes = this.options.secondAxisSeriesIndexes;
                if(axis2SeriesIndexes != null){
                    var seriesKeys = this._colGroups.map(function(colGroup){
                        return '' + colGroup[0].v;
                    });
                    this._axis2SeriesKeySet = this._createSecondAxisSeriesKeySet(axis2SeriesIndexes, seriesKeys);
                }
            }
        }

        // ----------------
        // The index at which the first component of
        // each cross group starts in virtual item
        this._itemCrossGroupIndex = {
                'C': 0,
                'R': this.C,
                'M': this.C + this.R
            };

        // ----------------

        if(pvc.debug >= 3){
            pvc.log("Crosstab translator " + JSON.stringify({
                R: this.R,
                C: this.C,
                M: this.M
            }));
        }
    },

    _splitEncodedColGroupCell: function(colGroup){
        var values = colGroup.v,
            labels = colGroup.f;

        if(values == null){
            values = [];
            labels = undefined;
        } else {
            values = values.split(this._separator);
            labels = labels && labels.split(this._separator);
        }

        return values.map(function(value, index){
            return {
                v: value,
                f: labels && labels[index]
            };
        });
    },

    /**
     * Analyzes the array of encoded column groups.
     * <p>
     * Creates and array of column groups
     * where each element is an array of column group values.
     * </p>
     * <p>
     * In the process the number of encoded measures is determined, {@link #M}.
     * In this respect, note that not all measures need to be supplied
     * in every column group.
     * When a measure is not present, that means that the value of the measure
     * in every row is null.
     * </p>
     * <p>
     * It is assumed that the order of measures in column groups is stable.
     * So, if in one column group "measure 1" is before "measure 2",
     * then it must be also the case in every other column group.
     * This order is then used to place values in the virtual item.
     * </p>
     */
    _processEncodedColGroups: function(encodedColGroups){
        var L = encodedColGroups.length || def.assert("Must have columns"),
            colGroups = [],
            colGroup,
            /*
             * measureName -> {
             *     groupIndex: 0, // Global order of measures within a column group
             *     index: 0       // Index (i, below) of measure's first appearance
             * }
             *
             */
            measuresInfo  = {},
            measuresInfoList = []
            ;

        for(var i = 0 ; i < L ; i++){
            var colGroupCell = encodedColGroups[i],
                encColGroupValues = colGroupCell.v,
                sepIndex = colGroupCell.v.lastIndexOf(this._separator),
                meaName,
                colGroupValues;
            
            // MeasureName has precedence,
            // so we may end up with no column group value (and C = 0).
            if(sepIndex < 0){
                // C = 0
                meaName = encColGroupValues;
                encColGroupValues = '';
                colGroupValues = [];
            } else {
                meaName = encColGroupValues.substring(sepIndex + 1);
                encColGroupValues = encColGroupValues.substring(0, sepIndex);
                colGroupValues = encColGroupValues.split(this._separator);

                var colGroupLabels;
                if(colGroupCell.f != null){
                    colGroupLabels = colGroupCell.f.split(this._separator);
                    colGroupLabels.pop(); // measure label
                }
                
                /*jshint loopfunc:true */
                colGroupValues.forEach(function(value, index){
                    var label = colGroupLabels && colGroupLabels[index];
                    colGroupValues[index] = {v: value, f: label};
                });
            }

            // New column group?
            if(!colGroup || colGroup.encValues !== encColGroupValues){
                colGroup = {
                    index:        i,
                    encValues:    encColGroupValues,
                    values:       colGroupValues,
                    measureNames: [meaName]
                };

                colGroups.push(colGroup);
            } else {
                colGroup.measureNames.push(meaName);
            }

            // Check the measure
            var currMeaIndex = (i - colGroup.index),
                meaInfo = def.getOwn(measuresInfo, meaName);
            if(!meaInfo){
                measuresInfo[meaName] = meaInfo = {
                    name: meaName,
                    groupIndex: currMeaIndex,
                    index: i
                };
                measuresInfoList.push(meaInfo);
            } else if(currMeaIndex > meaInfo.groupIndex) {
                meaInfo.groupIndex = currMeaIndex;
            }
        }

        // Sort measures
        measuresInfoList.sort(function(infoa, infob){
            return def.compare(infoa.groupIndex, infob.groupIndex) ||
                   def.compare(infoa.index, infob.index)
                   ;
        });

        // Reassign measure group indexes
        measuresInfoList.forEach(function(meaInfo2, index){
            meaInfo2.groupIndex = index;
        });

        // Publish colgroups and colgroupIndexes, keeping only relevant information
        var CG = colGroups.length,
            colGroupsValues  = new Array(CG),
            colGroupsIndexes = new Array(CG),
            M = measuresInfoList.length,
            R = this.R
            ;
        
        colGroups.map(function(colGroup2, cg){
            colGroupsValues[cg] = colGroup2.values;

            // The index in source *line* where each of the M measures can be read
            var meaIndexes = colGroupsIndexes[cg] = new Array(M);
            colGroup2.measureNames.forEach(function(meaName2, index){
                meaIndexes[measuresInfo[meaName2].groupIndex] = R + colGroup2.index + index;
            });
        });

        this._colGroups        = colGroupsValues;
        this._colGroupsIndexes = colGroupsIndexes;
        this.M = M;
    },
    
    /**
     * Called once, before {@link #execute},
     * for the translation to configure the complex type.
     *
     * @type undefined
     * @override
     */
    configureType: function(){
        // Map: Dimension Group -> Item cross-groups indexes
        if(this.measuresDirection === 'rows') {
            throw def.error.notImplemented();
        }

        var me = this,
            index = 0;
        
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
                    
                    var reader = me._propGet(dimName, index);
                    
                    me._userDimsReaders.push(reader);
                    
                    // <Debug>
                    /*jshint expr:true */
                    !def.hasOwn(me._userDimsReadersByDim, dimName) || def.assert("Dimension already being read.");
                    // </Debug>
                    
                    me._userDimsReadersByDim[dimName] = reader;
                    
                    count--;
                }
                
                level++;
            }
        }
        
        if(this.C > 0){
            add('series', 'C', 0, this.C);
        }
        
        if(this.R > 0){
            add('category', 'R', 0, this.R);
        }
        
        if(!this._userUsedDims.value) {
            add('value', 'M', 0, this.M);
        }

        if(this._axis2SeriesKeySet){
            var seriesReader = this._userDimsReadersByDim.series;
            if(seriesReader) {
                var calcAxis2SeriesKeySet = def.fun.constant(this._axis2SeriesKeySet);

                /* Create a reader that surely only returns 'series' atoms */
                seriesReader = this._filterDimensionReader(seriesReader, 'series');

                this._userDimsReaders.push(
                        this._dataPartGet(calcAxis2SeriesKeySet, seriesReader));
            }
        }
    }
});