
/**
 * @name pvc.data.MatrixTranslationOper
 * @class Represents one translation operation, 
 * from a source matrix in some format to 
 * an enumerable of atom arrays.
 * 
 * @extends pvc.data.TranslationOper
 * @abstract
 * 
 * @constructor
 * @param {pvc.data.ComplexType} complexType The complex type that will represent the translated data.
 * @param {pvc.data.Data} data The data object which will be loaded with the translation result.
 * @param {object} source The source matrix, in some format, to be translated.
 * The source is not modified.
 * @param {object} [metadata] A metadata object describing the source.
 * @param {object} [options] An object with translation options.
 * 
 * @param {boolean} [options.seriesInRows=false]
 * Indicates that series are to be switched with categories.
 *
 * @param {Number[]} [options.secondAxisSeriesIndexes] (former secondAxisIdx)
 * Array of series indexes in {@link #source} that are second axis' series.
 * Any non-null value is converted to an array.
 * Each value of the array is also converted to a number.
 * A negative value is counted from the end
 * of the series values (-1 is the series last value, ...).
 * <p>
 * Note that the option 'seriesInRows'
 * affects what are considered to be series values.
 *
 * Having determined where series are stored,
 * the order of occurrence of a series value in {@link #source}
 * determines its index.
 * </p>
 */
def.type('pvc.data.MatrixTranslationOper', pvc.data.TranslationOper)
.add(/** @lends pvc.data.MatrixTranslationOper# */{
    
    _logSource: function(){
        pvc.log("ROWS");
        if(this.source){
            this.source.forEach(function(row, index){
                pvc.log("row " + index + ": " + JSON.stringify(row));
            });
        }

        pvc.log("COLS");
        if(this.metadata){
            this.metadata.forEach(function(col){
                pvc.log("column {" +
                    "index: " + col.colIndex +
                    ", name: "  + col.colName +
                    ", label: "  + col.colLabel +
                    ", type: "  + col.colType + "}"
                );
            });
        }
    },
    
    /**
     * Creates the set of second axis series keys
     * corresponding to the specified
     * secondAxisSeriesIndexes and seriesAtoms arrays (protected).
     *
     * Validates that the specified series indexes are valid
     * indexes of seriesAtoms array.
     *
     * @param {Array} secondAxisSeriesIndexes Array of indexes of the second axis series values.
     * @param {Array} seriesKeys Array of the data source's series atom keys.
     *
     * @returns {Object} A set of series keys.
     *
     * @private
     * @protected
     */
    _createSecondAxisSeriesKeySet: function(secondAxisSeriesIndexes, seriesKeys){
        var secondAxisSeriesKeySet = {},
            seriesCount = seriesKeys.length;

        def.query(secondAxisSeriesIndexes).each(function(indexText){
            
            // Validate
            var seriesIndex = +indexText; // + -> convert to number
            if(isNaN(seriesIndex)){
                throw def.error.argumentInvalid('secondAxisSeriesIndexes', "Element is not a number '{0}'.", [indexText]);
            }

            if(seriesIndex < 0){
                if(seriesIndex <= -seriesCount){
                    throw def.error.argumentInvalid('secondAxisSeriesIndexes', "Index is out of range '{0}'.", [seriesIndex]);
                }

                seriesIndex = seriesCount + seriesIndex;
            } else if(seriesIndex >= seriesCount){
                throw def.error.argumentInvalid('secondAxisSeriesIndexes', "Index is out of range '{0}'.", [seriesIndex]);
            }

            // Set
            secondAxisSeriesKeySet[seriesKeys[seriesIndex]] = true;
        });

        return secondAxisSeriesKeySet;
    },
    
    // TODO: docs
    _value1AndValue2Get: function(calcAxis2SeriesKeySet, seriesReader, valueProp) {
        
        var me = this,
            value1Name = pvc.data.DimensionType.dimensionGroupLevelName('value', 0),
            value2Name = pvc.data.DimensionType.dimensionGroupLevelName('value', 1);
        
        this._ensureDimensionType(value1Name);
        this._ensureDimensionType(value2Name);
        
        var value1Dimension, value2Dimension, axis2SeriesKeySet;
        
        function value1And2Get(item) {
            /* 
             * First time initialization.
             * Done here because *data* isn't available before. 
             */
            if(!value1Dimension) {
                axis2SeriesKeySet = calcAxis2SeriesKeySet();
                value1Dimension = me.data.dimensions(value1Name);
                value2Dimension = me.data.dimensions(value2Name);
            }
            
            var rawValue = item[valueProp],
                seriesAtom = seriesReader(item),
                isAxis2Series = def.hasOwn(axis2SeriesKeySet, seriesAtom.key);
            
            return [
                value1Dimension.intern(isAxis2Series ? null     : rawValue, item),
                value2Dimension.intern(isAxis2Series ? rawValue : null,     item)
            ];
        }
        
        return value1And2Get;
    }
});