
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
 * @param {pvc.BaseChart} chart The associated chart.
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
 * The option 'plot2SeriesIndexes' 
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
    M: 0, // number of measures
    C: 0, // number of categories
    S: 0, // number of series
    
    _processMetadata: function(){
        
        this.base();
    
        var metadata = this.metadata;
        
        var J = this.J; // metadata.length
        
        // Split between series and categories
        var C = this.options.categoriesCount;
        if(C != null && (!isFinite(C) || C < 0)){
            C = 0;
        }

        var S;
        
        // Assuming duplicate valuesColIndexes is not valid
        // (v1 did not make this assumption)
        var valuesColIndexes, M;
        if(this.options.isMultiValued){
            valuesColIndexes = pvc.parseDistinctIndexArray(this.options.measuresIndexes, J - 1);
            M = valuesColIndexes ? valuesColIndexes.length : 0;
        }
        
        var D; // discrete count = D = S + C
        if(M == null){
            if(J > 0 && J <= 3 && (C == null || C === 1) && S == null){
                // V1 Stability requirement
                // Measure columns with all values = null,
                // would be detected as type string,
                // and not be chosen as measures.
                M = 1;
                valuesColIndexes = [J - 1];
                C = J >= 2 ? 1 : 0;
                S = J >= 3 ? 1 : 0;
                D = C + S;
                
            } else if(C != null &&  C >= J){
                D = J;
                C = J;
                S = 0;
                M = 0;
            } else {
                // finite C wins over M, and by last S
                var Mmax = C != null ? (J - C) : Infinity; // >= 1
                
                // colIndex has already been fixed on _processMetadata
                valuesColIndexes = def
                    .query(metadata)
                    .where(function(colDef, index){
                        return this._columnTypes[index] !== 0; // 0 = discrete
                    }, this)
                    .select(function(colDef){ return colDef.colIndex; })
                    .take(Mmax)
                    .array()
                    ;

                M = valuesColIndexes.length;
            }
        }
        
        if(D == null){
            // M wins over C
            D = J - M;
            if(D === 0){
                S = C = 0;
            } else if(C != null){
                if(C > D){
                    C = D;
                    S = 0;
                } else {
                    S = D - C;
                }
            } else {
                // Distribute between categories and series
                S = D > 1 ? 1 : 0;
                C = D - S;
            }
        }
        
        var seriesInRows = this.options.seriesInRows;
        var colGroupSpecs = [];
        if(D){
            if(S && !seriesInRows){
                colGroupSpecs.push({name: 'S', count: S});
            }
            
            if(C){
                colGroupSpecs.push({name: 'C', count: C});
            }
            
            if(S && seriesInRows){
                colGroupSpecs.push({name: 'S', count: S});
            }
        }
        
        if(M){
            colGroupSpecs.push({name: 'M', count: M});
        }
        
        var availableInputIndexes = def.range(0, J).array();
        
        // If valuesColIndexes != null, these are reserved for values
        if(valuesColIndexes){
            // Remove these indexes from available indexes
            valuesColIndexes.forEach(function(inputIndex){
                availableInputIndexes.splice(inputIndex, 1);
            });
        }
        
        // Set the fields with actual number of columns of each group
        // Assign the input indexes of each group (Layout)
        var specsByName = {};
        colGroupSpecs.forEach(function(groupSpec){
            var count = groupSpec.count;
            var name  = groupSpec.name;
            
            // Index group by name
            specsByName[name] = groupSpec;
            
            if(valuesColIndexes && name === 'M'){
                groupSpec.indexes = valuesColIndexes;
            } else {
                groupSpec.indexes = availableInputIndexes.splice(0, count);
            }
        }, this);
        
        this.M = M;
        this.S = S;
        this.C = C;
        
        // Compose the total permutation array
        // that transforms the input into the virtual item "normal form":
        // S* C* M*
        var itemPerm = [];
        ['S', 'C', 'M'].forEach(function(name){
            var groupSpec = specsByName[name];
            if(groupSpec){
                def.array.append(itemPerm, groupSpec.indexes);
            }
        });
        
        var colTypes = this._columnTypes;
        this._itemTypes = itemPerm.map(function(index){ return colTypes[index]; });
        
        // The start indexes of each column group
        this._itemCrossGroupIndex = {
            S: 0,
            C: this.S, 
            M: this.S + this.C
        };
        
        this._itemPerm = itemPerm;
        
        if(pvc.debug >= 3){
            var out = [
                "RELATIONAL TRANSLATOR MAPPING",
                pvc.logSeparator,
                "[" + 
                    colGroupSpecs.map(function(groupSpec){
                        return def.array.create(groupSpec.count, groupSpec.name).join('');
                    })
                    .join(' ') +
                "]"
            ];

            pvc.log(out.join("\n"));
        }
    },
    
    /** 
     * Default cross tab mapping from virtual item to dimensions. 
     * @override 
     */
    _configureTypeCore: function(){
        var me = this;
        var index = 0;
        var dimsReaders = [];
        
        function add(dimGroupName, colGroupName, level, count) {
            var groupEndIndex = me._itemCrossGroupIndex[colGroupName] + count; // exclusive
            while(count > 0) {
                var dimName = pvc.buildIndexedId(dimGroupName, level);
                if(!me.complexTypeProj.isReadOrCalc(dimName)) { // Skip name if occupied and continue with next name
                    
                    // use first available slot for auto dims readers as long as within the group slots
                    index = me._nextAvailableItemIndex(index);
                    if(index >= groupEndIndex) {
                        // this group has no more slots available
                        return;
                    }
                    
                    dimsReaders.push({names: dimName, indexes: index});
                    
                    index++; // consume index
                    count--;
                }
                
                level++;
            }
        }
        
        if(this.S > 0){
            add('series', 'S', 0, this.S);
        }
        
        if(this.C > 0){
            add('category', 'C', 0, this.C);
        }
        
        if(this.M > 0) {
            add('value', 'M', 0, this.M);
        }

        if(dimsReaders) {
            dimsReaders.forEach(this.defReader, this);
        }
        
        // ----
        // The null test is required because plot2SeriesIndexes can be a number, a string...
        var plot2SeriesIndexes = this.options.plot2SeriesIndexes;
        if(plot2SeriesIndexes != null){
            var seriesReader = this._userDimsReadersByDim.series;
            if(seriesReader) {
                var dataPartDimName = this.options.dataPartDimName;
                this._userRead(relTransl_dataPartGet.call(this, plot2SeriesIndexes, seriesReader), dataPartDimName);
            }
        }
    },
    
    // Permutes the input rows
    _executeCore: function(){
        var dimsReaders = this._getDimensionsReaders();
        var permIndexes = this._itemPerm;
        
        return def.query(this._getItems())
                  .select(function(item){
                      
                      item = pv.permute(item, permIndexes);
                      
                      return this._readItem(item, dimsReaders);
                  }, this);
    }
});

/**
 * Obtains the dimension reader for dimension 'dataPart'.
 * 
 * @name pvc.data.RelationalTranslationOper#_dataPartGet
 * @function
 * @param {Array} plot2SeriesIndexes The indexes of series that are to be shown on the second axis. 
 * @param {function} seriesReader Dimension series atom getter.
 * @type function
 */
function relTransl_dataPartGet(plot2SeriesIndexes, seriesReader) {
    var me = this;
    
    /* Defer calculation of plot2SeriesKeySet because *data* isn't yet available. */
    function calcAxis2SeriesKeySet() {
        var atoms = {};
        var seriesKeys = def.query(me.source)
                                .select(function(item){
                                    seriesReader(item, atoms);
                                    var value = atoms.series;
                                    if(value != null && value.v != null){
                                        value = value.v;
                                    }
                                    
                                    return value || null;
                                })
                                /* distinct excludes null keys */
                                .distinct()
                                .array();

        return me._createPlot2SeriesKeySet(plot2SeriesIndexes, seriesKeys);
    }
    
    return this._dataPartGet(calcAxis2SeriesKeySet, seriesReader);
}