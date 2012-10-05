
/**
 * @name pvc.data.RelationalTranslationOper
 * 
 * @class Represents one translation operation, 
 * from a source matrix in relational format to 
 * an enumerable of atom arrays.
 * 
 * <p>
 * The default matrix-relational format is:
 * </p>
 * <pre>
 * ---------------------------
 *    0   |    1     |   2
 * ---------------------------
 * series | category | value
 * ---------------------------
 *    T   |     A    |   12
 *    T   |     B    |   45
 *    Q   |     A    |   11
 *    Q   |     B    |   99
 *    Z   |     B    |    3
 * </pre>
 * <p>
 * If the option <i>seriesInRows</i> is true
 * the indexes of series and categories are switched.
 * </p>
 * <p>
 * If the option <i>measuresIndexes</i> is specified,
 * additional value dimensions are created to receive the specified columns.
 * Note that these indexes may consume series and/or category indexes as well. 
 * </p>
 * <p>
 * If only two metadata columns are provided, 
 * then a dummy 'series' column, with the constant null value, is added automatically. 
 * </p>
 * 
 * @extends pvc.data.MatrixTranslationOper
 *  
 * @constructor
 * @param {pvc.data.ComplexType} complexType The complex type that will represent the translated data.
 * @param {object} source The matrix-relational array to be translated.
 * The source is not modified.
 * @param {object} [metadata] A metadata object describing the source.
 * 
 * @param {object} [options] An object with translation options.
 * See additional available options in {@link pvc.data.MatrixTranslationOper}.
 * 
 * @param {(number|string)[]|number|string} [options.measuresIndexes] 
 * An array of indexes of columns of the source matrix
 * that contain value dimensions.
 * <p>
 * Multiple 'value' dimensions ('value', 'value2', 'value3', ...) 
 * are bound in order to the specified indexes.
 * </p>
 * <p>
 * The option 'secondAxisSeriesIndexes' 
 * is incompatible with and 
 * takes precedence over 
 * this one.
 * </p>
 * <p>
 * The indexes can be numbers or strings that represent numbers.
 * It is also possible to specify a single index instead of an array.
 * </p>
 */
def.type('pvc.data.RelationalTranslationOper', pvc.data.MatrixTranslationOper)
.add(/** @lends pvc.data.RelationalTranslationOper# */{
    
    /**
     * Called once, before {@link #execute}, 
     * for the translation to configure the complex type.
     * 
     * @type undefined
     * @override
     */
    configureType: function(){
        var me = this;
        
        function add(dimGet, dim) {
            me._userDimsReaders.push(dimGet);
            if(dim){
                // <Debug>
                /*jshint expr:true */
                !def.hasOwn(me._userDimsReadersByDim, dim) || def.assert("Dimension already being read.");
                // </Debug>
                
                me._userDimsReadersByDim[dim] = dimGet;
            }
        }

        var L = this.metadata.length,
            unmappedColCount = L - this._userUsedIndexesCount;
         
        if(unmappedColCount > 0){

            /* Value dimension(s) (fixed multiple indexes) */
            var valuesColIndexes;
            if(!this._userUsedDims.value &&
               this.options.isMultiValued &&
               // The null test is required because measuresIndexes can be a number, a string...
               (valuesColIndexes = this.options.measuresIndexes) != null) {

                this.defReader({names: 'value', indexes: valuesColIndexes });
                
                unmappedColCount = L - this._userUsedIndexesCount;
            }

            if(unmappedColCount > 0){
                /* Find the dimensions that are to be read automatically */
                
                var seriesInRows = this.options.seriesInRows;
                
                var autoColDimGroups = [];
                
                if(valuesColIndexes == null){
                    autoColDimGroups
                        .push({name: 'value', count: 1, float: false});
                }
                
                if(seriesInRows){
                    autoColDimGroups
                        .push({name: 'series', count: 1});
                }
                
                var desiredCatCount = Math.max(1, def.get(this.options, 'categoriesCount', 1));
                autoColDimGroups
                    .push({name: 'category', count: desiredCatCount});
                
                if(!seriesInRows){
                    autoColDimGroups
                        .push({name: 'series', count: 1, float: false});
                }
                
                // -----
                
                var autoColDims = this._createDimsMap(autoColDimGroups, unmappedColCount);
                
                /* Assign virtual item indexes to auto dims */
                var index = 0;
                var autoIndex = 0;
                while(autoIndex < autoColDims.length) {
                    var dimName = autoColDims[autoIndex];
                    index = this._nextAvailableItemIndex(index);
                    
                    /*jshint expr:true */
                    (index < 0) && def.assert("Index must exist");
                    
                    // mark the index as mapped
                    this._userItem[index] = true;

                    add(this._propGet(dimName, index), dimName);

                    index++; // consume index
                    autoIndex++;
                }
            }
        }
        
        // ----
        // The null test is required because secondAxisSeriesIndexes can be a number, a string...
        var axis2SeriesIndexes = this.options.secondAxisSeriesIndexes;
        if(axis2SeriesIndexes != null){
            var seriesReader = this._userDimsReadersByDim.series;
            if(seriesReader) {
                add(relTransl_dataPartGet.call(this, axis2SeriesIndexes, seriesReader));
            }
        }
    },
    
    /*
     * Example orderedDimsMap =
     * [
     *    {name: 'value',    count: 1},
     *    {name: 'category', count: 3},
     *    {name: 'series',   count: 1}
     *    ...
     * ]
     * 
     * if count = 3, the result will be:
     * ['category', 'category2', 'value']
     */
    _createDimsMap: function(orderedDimsMap, count){
        var dimNames = [];
        var i = 0;
        var L = orderedDimsMap.length;
        var DT = pvc.data.DimensionType;
        
        function isDimensionNotUsed(dimName){ 
            return !def.hasOwn(this._userUsedDims, dimName); 
        }
        
        while(i < L && count > 0){
            var dimGroup = orderedDimsMap[i];
            var groupName = dimGroup.name;
            
            // There's no problem here cause each function instance is 
            // called before leaving each iteration.
            /*jshint loopfunc:true*/
            var buildLevelDimName = function(level){
                    return DT.dimensionGroupLevelName(groupName, level);
                };
                
            var groupDimNames; 
            if(dimGroup.float){
                // The group's N first free dimension levels
                groupDimNames = def.range(0, Infinity)
                    .select(buildLevelDimName)
                    .where(isDimensionNotUsed, this)
                    .take(Math.min(dimGroup.count, count)) // only as much as there are free indexes
                    .array();
            } else {
                // The group's N first dimension levels, or skip when not free
                groupDimNames = def.range(0, dimGroup.count)
                    .select(buildLevelDimName)
                    .where(isDimensionNotUsed, this)
                    .take(count) // only as much as there are free indexes
                    .array();
            }
            
            def.array.prepend(dimNames, groupDimNames);
            count -= groupDimNames.length;
            i++;
        }
        
        return dimNames;
    }
});

/**
 * Obtains the dimension reader for dimension 'dataPart'.
 * 
 * @name pvc.data.RelationalTranslationOper#_dataPartGet
 * @function
 * @param {Array} secondAxisSeriesIndexes The indexes of series that are to be shown on the second axis. 
 * @param {function} seriesReader Dimension series atom getter.
 * @type function
 */
function relTransl_dataPartGet(secondAxisSeriesIndexes, seriesReader) {
    var me = this;
    
    /* Create a reader that surely only returns 'series' atoms */
    seriesReader = this._filterDimensionReader(seriesReader, 'series');
    
    /* Defer calculation of axis2SeriesKeySet because *data* isn't yet available. */
    function calcAxis2SeriesKeySet() {
        var seriesKeys = def.query(me.source)
                                .select(function(item){
                                    var atom = seriesReader(item);
                                    return (atom && atom.key) || null;
                                })
                                /* distinct excludes null keys */
                                .distinct()
                                .array();

        return me._createSecondAxisSeriesKeySet(secondAxisSeriesIndexes, seriesKeys);
    }
    
    return this._dataPartGet(calcAxis2SeriesKeySet, seriesReader);
}