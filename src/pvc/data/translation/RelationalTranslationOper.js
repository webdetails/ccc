
var transl_dimsDefaultValue = {
        'series':   'Series', 
        'category': 'Category'
    };

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
 * then a dummy 'series' column with the constant value "Series" is added automatically. 
 * </p>
 * 
 * @extends pvc.data.TranslationOper
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
        
        // Call base method
        def.base.call(this);
        
        var me = this,
            multiChartColIndexes = def.array(this.options.multiChartColumnIndexes),
            multiChartRowIndexes = def.array(this.options.multiChartRowIndexes);
        
        if(multiChartColIndexes) {
            this._addGroupReaders('multiChartColumn', multiChartColIndexes);
        }
        
        if(multiChartRowIndexes) {
            this._addGroupReaders('multiChartRow', multiChartRowIndexes);
        }
        
        function add(dimGet, dim) {
            me._userDimsReaders.push(dimGet);
            if(dim){
                // <Debug>
                !def.hasOwn(me._userDimsReadersByDim, dim) || def.assert("Dimension already being read.");
                // </Debug>
                
                me._userDimsReadersByDim[dim] = dimGet;
            }
        }
        
        // 1 - Determine the dimension of each column of the matrix
        // 2 - Add dimensions readers
        
        var autoColDims = [];
        
        if(!this._userUsedDims.series) {
            autoColDims.push('series');
        }
        
        if(!this._userUsedDims.category) {
            autoColDims.push('category');
        }
        
        if(autoColDims.length > 1 && this.options.seriesInRows) {
            autoColDims.reverse();
        }
        
        var autoNeededCount = autoColDims.length;
        
        // Supposing at least one value...
        if(!this._userUsedDims.value) {
            autoNeededCount += 1;
        }
        
        var index = 0;
        
        if(autoNeededCount > 0) {
            var autoAvailableCount = this.metadata.length - this._userUsedIndexesCount;
            
            while(autoNeededCount > autoAvailableCount && autoColDims.length) {
                // Not enough columns for everything (series, category and value)
                // Assume that it's the first column that's missing (series or category)
                //  and supply a dummy value for it
                var dummyDim = autoColDims.shift();
                
                add(this._constGet(dummyDim, transl_dimsDefaultValue[dummyDim]), 
                    dummyDim);
                
                autoNeededCount--;
            }
            
            /* Place autoColDims in first available indexes in _userItem */
            var dimName;
            while((dimName = autoColDims.shift())) {
                // use first available slot for auto dims readers
                index = this._nextAvailableItemIndex(index);
                // Consume the index
                this._userItem[index] = true;
                
                add(this._propGet(dimName, index), dimName);
                
                index++;
            }
        }
        
        // ----
        
        if(!this._userUsedDims.value) {
            
            // Get the index for the first value column
            var value1ColIndex = this._nextAvailableItemIndex(index);
            
            // The null test is required because secondAxisSeriesIndexes can be a number, a string...
            var axis2SeriesIndexes = this.options.secondAxisSeriesIndexes;
            if(axis2SeriesIndexes != null){
                // Has 'value' and 'value2' dimensions, fed in a special way 
                
                if(!this._userUsedDims.value2) {
                    var seriesReader = this._userDimsReadersByDim['series'];
                    if(seriesReader) {
                        this._userItem[value1ColIndex] = true;
                        
                        // The "value column" is fed to 'value' or to 'value2', 
                        // according to the the series value of each row.
                        add(relTransl_value1AndValue2Get.call(this,
                                axis2SeriesIndexes,
                                seriesReader, 
                                value1ColIndex));
                    }
                } 
                
            } else {
                // The null test is required because measuresIndexes can be a number, a string...
                var valuesColIndexes;
                if(!this.options.isMultiValued || (valuesColIndexes = this.options.measuresIndexes) == null) {
                    // Has 'value' dimension only
                    
                    this._userItem[value1ColIndex] = true;
                    
                    add(this._propGet('value', value1ColIndex));
                    
                } else if(!this._userUsedDims.value2) {
                    // Has multiple 'value' dimensions
                    // Does not validate/consume indexes on purpose.
                    def.query(valuesColIndexes)
                       .distinct()
                       .each(function(valueColIndex, level){
                            var dim = pvc.data.DimensionType.dimensionGroupLevelName('value', level);
                            if(this._userUsedDims[dim]) {
                                throw def.error.argumentInvalid('measuresIndexes', "The dimension named '{0}' is already bound.", [dim]);
                            }
                            
                            add(this._propGet(dim, +valueColIndex)); // + -> convert to number
                        }, this);
                }
            }
        }
    }
});

/**
 * Obtains the dimension reader for dimensions 'value' and 'value2'.
 * 
 * It directs a source item's property 'value'
 * to one or the other dimension,
 * according to the item's series value.
 * 
 * @name _value1AndValue2Get
 * @function
 * @param {Array} secondAxisSeriesIndexes The indexes of series that are to be shown on the second axis. 
 * @param {function} seriesReader Dimension series atom getter.
 * @param {string} valueProp The property name in a source item that contains the value property.
 * @type function
 * 
 * @memberOf pvc.data.RelationalTranslationOper#
 * @private
 */
function relTransl_value1AndValue2Get(secondAxisSeriesIndexes, seriesReader, valueProp) {
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
    
    return this._value1AndValue2Get(calcAxis2SeriesKeySet, seriesReader, valueProp);
}