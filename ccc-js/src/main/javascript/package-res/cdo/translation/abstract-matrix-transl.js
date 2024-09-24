/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global def:true, cdo:true*/

/**
 * @name cdo.MatrixTranslationOper
 * @class Represents one translation operation,
 * from a source matrix in some format to
 * an enumerable of atom arrays.
 *
 * @extends cdo.TranslationOper
 * @abstract
 *
 * @constructor
 * @param {cdo.ComplexTypeProject} complexTypeProj The complex type project that represents the translated metadata.
 * @param {object} source The source matrix, in some format, to be translated. The source is not modified.
 * @param {object} [metadata] A metadata object describing the source.
 * @param {object} [options] An object with translation options.
 *
 * See additional available options in {@link cdo.TranslationOper}.
 *
 * @param {boolean} [options.seriesInRows=false]
 * Indicates that series are to be switched with categories.
 *
 * @param {Number[]} [options.plot2DataSeriesIndexes]
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
def.type('cdo.MatrixTranslationOper', cdo.TranslationOper)
.add(/** @lends cdo.MatrixTranslationOper# */{

    _initType: function() {
        this.J = this.metadata.length;
        this.I = this.source.length; // repeated in setSource

        this._processMetadata();

        this.base();
    },

    setSource: function(source) {
        this.base(source);

        this.I = this.source.length;
    },

    _knownContinuousColTypes: {'numeric': 1, 'number': 1, 'integer': 1},

    _processMetadata: function() {
        // Confirm metadata column types.

        // ColumnType
        // 1 - continuous (number, date)
        // 0 - discrete   (anything else)

        // TypeCheckingMode
        // none      - no type checking.
        // [minimum] - in string columns check if first non-null row is a number.
        // extended  - in string columns check if first non-null row is a number or a numeric string.
        var typeCheckingMode = this.options.typeCheckingMode,
            knownContinColTypes = this._knownContinuousColTypes,
            columnTypes;

        if(typeCheckingMode === "none") {
            columnTypes = def.query(this.metadata)
                // Fix indexes of colDefs
                .select(function(colDef, colIndex) {
                    // Ensure colIndex is trustable
                    colDef.colIndex = colIndex;

                    var colType = colDef.colType;
                    return (!colType || knownContinColTypes[colType.toLowerCase()] !== 1) ? 0 : 1;
                 })
                .array();
        } else {
            // Get the indexes of columns which are not stated as continuous (numeric..)
            // In these, we can't trust their stated data type
            // cause when nulls exist on the first row,
            // they frequently come stated as "string"...

            // Only checking on the first non-null row, anyway. Not very aggressive...
            var checkNumericString = typeCheckingMode === 'extended',
                columns = def.query(this.metadata)
                    // Fix indexes of colDefs
                    .select(function(colDef, colIndex) {
                        // Ensure colIndex is trustable
                        colDef.colIndex = colIndex;
                        return colDef;
                     })
                    .where(function(colDef) {
                        var colType = colDef.colType;
                        return !colType || knownContinColTypes[colType.toLowerCase()] !== 1;
                    })
                    .select(function(colDef) { return colDef.colIndex; })
                    .array(),

                // Number of rows in source
                I = this.I,
                source = this.source,

                // Number of columns remaining to confirm data type
                J = columns.length;

            // Assume all are continuous
            columnTypes = def.array.create(this.J, 1);

            for(var i = 0 ; i < I && J > 0 ; i++) {
                var row = source[i], m = 0;
                while(m < J) {
                    var j = columns[m], value = row[j];
                    if(value != null) {
                        columnTypes[j] = this._getSourceValueType(value, checkNumericString);
                        columns.splice(m, 1);
                        J--;
                    } else {
                        m++;
                    }
                }
            }
        }

        this._columnTypes = columnTypes;
    },

    _buildLogicalColumnInfoFromMetadata: function(index) {
        var meta = this.metadata[index];
        return {
            type:  this._columnTypes[index],
            name:  meta.colName,
            label: meta.colLabel
        };
    },

    // 1 - continuous (number, date)
    // 0 - discrete   (anything else)
    /** @static */
    _getSourceValueType: function(value, checkNumericString) {
        switch(typeof value) {
            case 'number': return 1;
            case 'string': return (checkNumericString && value !== "" && !isNaN(+value)) ? 1 : 0;
            case 'object': return (value instanceof Date) ? 1 : 0;
        }
        return 0; // discrete
    },

    logSource: function() {
        var R = cdo.previewRowsMax,
            C = cdo.previewColsMax,
            md = this.metadata,
            L = md.length,
            prepend = def.array.prepend;

        if(L > C) {
            md = md.slice(0, C);
            md.push({colName: "(" + C + "/" + L + ")", colType: "..."});
        }

        var table = def.textTable(md.length + 1)
                .rowSep()
                .row.apply(table, prepend(md.map(function(col) { return col.colName; }), ["Name"]))
                .rowSep()
                .row.apply(table, prepend(md.map(function(col) { return col.colLabel ? ('"' + col.colLabel + '"') : ""; }),["Label"]))
                .rowSep()
                .row.apply(table, prepend(md.map(function(col) { return col.colType; }), ["Type" ]))
                .rowSep();

        def.query(this.source)
            .take(R)
            .each(function(row, index) {
                if(L > C) row = row.slice(0, C);
                table.row.apply(table, prepend(row.map(function(v) { return def.describe(v); }), [index + 1]));
            });

        table
            .rowSep()
            .row("(" + Math.min(R, this.I) + "/" + this.I + ")")
            .rowSep(true);

        return "DATA SOURCE SUMMARY\n" + table() + "\n";
    },

    _logLogicalRow: function(kindList, kindScope) {
        var table = def.textTable(6)
            .rowSep()
            .row("Index", "Kind", "Type", "Name", "Label", "Dimension")
            .rowSep();

        var index = 0;
        kindList.forEach(function(kind) {
            for(var i = 0, L = kindScope[kind] ; i < L ; i++) {
                var info = this._logicalRowInfos[index];
                table.row(
                    index,
                    kind,
                    (info.type ? 'number' : 'string'),
                    info.name  || "",
                    info.label || "",
                    this._userIndexesToSingleDim[index] || "");
                index++;
            }
        }, this);

        table.rowSep(true);

        return "LOGICAL TABLE\n" + table() + "\n";
    },

    /**
     * Creates the set of second axis series keys
     * corresponding to the specified
     * plot2DataSeriesIndexes and seriesAtoms arrays (protected).
     *
     * Validates that the specified series indexes are valid
     * indexes of seriesAtoms array.
     *
     * @param {Array} plot2DataSeriesIndexes Array of indexes of the second axis series values.
     * @param {Array} seriesKeys Array of the data source's series atom keys.
     *
     * @returns {Object} A set of second axis series values or null if none.
     *
     * @private
     * @protected
     */
    _createPlot2SeriesKeySet: function(plot2DataSeriesIndexes, seriesKeys) {
        var plot2SeriesKeySet = null,
            seriesCount = seriesKeys.length;
        def.query(plot2DataSeriesIndexes).each(function(indexText) {
            // Validate
            var seriesIndex = +indexText; // + -> convert to number
            if(isNaN(seriesIndex))
                throw def.error.argumentInvalid('plot2SeriesIndexes', "Element is not a number '{0}'.", [indexText]);

            if(seriesIndex < 0) {
                if(seriesIndex <= -seriesCount)
                    throw def.error.argumentInvalid('plot2SeriesIndexes', "Index is out of range '{0}'.", [seriesIndex]);

                seriesIndex = seriesCount + seriesIndex;
            } else if(seriesIndex >= seriesCount) {
                throw def.error.argumentInvalid('plot2SeriesIndexes', "Index is out of range '{0}'.", [seriesIndex]);
            }

            // Set
            if(!plot2SeriesKeySet) plot2SeriesKeySet = {};

            plot2SeriesKeySet[seriesKeys[seriesIndex]] = true;
        });

        return plot2SeriesKeySet;
    },

    // TODO: docs
    _dataPartGet: function(calcAxis2SeriesKeySet) {

        var me = this,
            dataPartDimName = this.options.dataPartDimName,
            dataPartDimension,
            plot2SeriesKeySet,
            part1Atom,
            part2Atom;

        function calcDataPart(series, outAtoms) {
            outAtoms[dataPartDimName] = def.hasOwn(plot2SeriesKeySet, series)
                ? (part2Atom || (part2Atom = dataPartDimension.intern("1")))
                : (part1Atom || (part1Atom = dataPartDimension.intern("0")));
        }

        /*
         * First time initialization.
         * Done here because *data* isn't available before.
         */
        var init = function() {
            plot2SeriesKeySet = calcAxis2SeriesKeySet();
            dataPartDimension = me.data.dimensions(dataPartDimName);

            if(def.debug >=3 && plot2SeriesKeySet)
                def.log("Second axis series values: " + def.describe(def.keys(plot2SeriesKeySet)));
            init = null;
        };

        // Also create a calculation, so that new Datums later added from interpolation
        // can have its dataPart calculated.
        this.complexTypeProj.setCalc({
            names: dataPartDimName,
            calculation: function(datum, outAtoms) {
                init && init();

                calcDataPart(datum.atoms.series.value, outAtoms);
            }
        });
    },

    /**
     * Implements the default mapping from logical row columns to dimension groups.
     * The default mapping is based on the physical group translator concept.
     *
     * @override
     */
    _configureTypeCore: function() {
        ['series', 'category', 'value']
        .forEach(function(physicalGroupName) {
            this._configureTypeByPhysicalGroup(physicalGroupName);
        }, this);
    }
});

cdo.previewRowsMax = 15;
cdo.previewColsMax =  6;
