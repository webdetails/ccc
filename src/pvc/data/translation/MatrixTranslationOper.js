
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
 * @param {pvc.BaseChart} chart The associated chart.
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
 * @param {Number[]} [options.plot2SeriesIndexes]
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
    
    _initType: function(){
        this.J = this.metadata.length;
        this.I = this.source.length;
        
        this._processMetadata();
        
        this.base();
    },
    
    _knownContinuousColTypes: {'numeric': 1, 'number': 1, 'integer': 1},
    
    _processMetadata: function(){
        // Get the indexes of columns which are 
        // not stated as continuous (numeric..)
        // In these, 
        // we can't trust their stated data type
        // cause when nulls exist on the first row, 
        // they frequently come stated as "string"...
        var knownContinColTypes = this._knownContinuousColTypes;
        var columns = 
            def
            .query(this.metadata)
            // Fix indexes of colDefs
            .select(function(colDef, colIndex){
                // Ensure colIndex is trustable
                colDef.colIndex = colIndex;
                return colDef; 
             })
            .where(function(colDef){
                var colType = colDef.colType;
                return !colType ||
                       knownContinColTypes[colType.toLowerCase()] !== 1;
            })
            .select(function(colDef){ return colDef.colIndex; })
            .array();
        
        // 1 - continuous (number, date)
        // 0 - discrete   (anything else)
        // Assume all are continuous
        var columnTypes = def.array.create(this.J, 1);
        
        // Number of rows in source
        var I = this.I;
        var source = this.source;
        
        // Number of columns remaining to confirm data type
        var J = columns.length;
        
        for(var i = 0 ; i < I && J > 0 ; i++){
            var row = source[i];
            var m = 0;
            while(m < J){
                var j = columns[m];
                var value = row[j];
                if(value != null){
                    columnTypes[j] = this._getSourceValueType(value);
                    
                    columns.splice(m, 1);
                    J--;
                } else {
                    m++;
                }
            }
        }
        
        this._columnTypes = columnTypes;
    },

    // 1 - continuous (number, date)
    // 0 - discrete   (anything else)
    /** @static */
    _getSourceValueType: function(value){
        switch(typeof value){
            case 'number': return 1;
            case 'object':
                if(value instanceof Date){
                    return 1;
                }
        }
        
        return 0; // discrete
    },
    
    logSource: function(){
        var out = [
            "DATA SOURCE SUMMARY",
            pvc.logSeparator,
            "ROWS (" + Math.min(10, this.I) + "/" + this.I + ")"
        ];
        
        def
        .query(this.source)
        .take(10)
        .each(function(row, index){
            out.push("  [" + index + "] " + pvc.stringify(row));
        });
        
        if(this.I > 10){
            out.push('  ...');
        }
        
        out.push("COLS (" + this.J + ")");
        
        var colTypes = this._columnTypes;
        this
        .metadata
        .forEach(function(col, j){
            out.push(
                "  [" + j + "] " + 
                "'" + col.colName + "' (" +
                "type: "      + col.colType + ", " + 
                "inspected: " + (colTypes[j] ? 'continuous' : 'discrete') +
                 (col.colLabel ? (", label: '" + col.colLabel + "'") : "")  + 
                ")");
        });
        
        //out.push(pvc.logSeparator);
        pvc.log(out.join('\n'));
    },
    
    /**
     * Creates the set of second axis series keys
     * corresponding to the specified
     * plot2SeriesIndexes and seriesAtoms arrays (protected).
     *
     * Validates that the specified series indexes are valid
     * indexes of seriesAtoms array.
     *
     * @param {Array} plot2SeriesIndexes Array of indexes of the second axis series values.
     * @param {Array} seriesKeys Array of the data source's series atom keys.
     *
     * @returns {Object} A set of second axis series values or null if none.
     *
     * @private
     * @protected
     */
    _createPlot2SeriesKeySet: function(plot2SeriesIndexes, seriesKeys){
        var plot2SeriesKeySet = null,
            seriesCount = seriesKeys.length;
        def.query(plot2SeriesIndexes).each(function(indexText){
            // Validate
            var seriesIndex = +indexText; // + -> convert to number
            if(isNaN(seriesIndex)){
                throw def.error.argumentInvalid('plot2SeriesIndexes', "Element is not a number '{0}'.", [indexText]);
            }

            if(seriesIndex < 0){
                if(seriesIndex <= -seriesCount){
                    throw def.error.argumentInvalid('plot2SeriesIndexes', "Index is out of range '{0}'.", [seriesIndex]);
                }

                seriesIndex = seriesCount + seriesIndex;
            } else if(seriesIndex >= seriesCount){
                throw def.error.argumentInvalid('plot2SeriesIndexes', "Index is out of range '{0}'.", [seriesIndex]);
            }

            // Set
            if(!plot2SeriesKeySet){
                plot2SeriesKeySet = {};
            }
            
            plot2SeriesKeySet[seriesKeys[seriesIndex]] = true;
        });

        return plot2SeriesKeySet;
    },

    // TODO: docs
    _dataPartGet: function(calcAxis2SeriesKeySet, seriesReader) {

        var me = this;
        
        var dataPartDimName = this.options.dataPartDimName;

        var dataPartDimension,
            plot2SeriesKeySet,
            part1Atom,
            part2Atom,
            outAtomsSeries = {};

        function dataPartGet(item, outAtoms) {
            /*
             * First time initialization.
             * Done here because *data* isn't available before.
             */
            if(!dataPartDimension) {
                plot2SeriesKeySet = calcAxis2SeriesKeySet();
                dataPartDimension = me.data.dimensions(dataPartDimName);

                if(pvc.debug >=3 && plot2SeriesKeySet){
                    pvc.log("Second axis series values: " +
                        pvc.stringify(def.keys(plot2SeriesKeySet)));
                }
            }

            var partAtom;
            seriesReader(item, outAtomsSeries);
            var series = outAtomsSeries.series;
            if(series != null && series.v != null){
                series = series.v;
            }
            
            if(def.hasOwn(plot2SeriesKeySet, series)){
                partAtom = part2Atom || (part2Atom = dataPartDimension.intern("1"));
            } else {
                partAtom = part1Atom || (part1Atom = dataPartDimension.intern("0"));
            }
            
            outAtoms[dataPartDimName] = partAtom;
        }

        return dataPartGet;
    }
});