/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @name cdo.RelationalTranslationOper
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
 * @extends cdo.MatrixTranslationOper
 *
 * @constructor
 * @param {cdo.ComplexTypeProject} complexTypeProj The complex type project that represents the translated metadata.
 * @param {object} source The source matrix, in some format, to be translated. The source is not modified.
 * @param {object} [metadata] A metadata object describing the source.
 * @param {object} [options] An object with translation options.
 *
 * See additional available options in {@link cdo.MatrixTranslationOper}.
 *
 * @param {(number|string)[]|number|string} [options.measuresIndexes]
 * An array of indexes of columns of the source matrix
 * that contain value dimensions.
 * <p>
 * Multiple 'value' dimensions ('value', 'value2', 'value3', ...)
 * are bound in order to the specified indexes.
 * </p>
 * <p>
 * The option 'plot2DataSeriesIndexes'
 * is incompatible with and
 * takes precedence over
 * this one.
 * </p>
 * <p>
 * The indexes can be numbers or strings that represent numbers.
 * It is also possible to specify a single index instead of an array.
 * </p>
 */
def
.type('cdo.RelationalTranslationOper', cdo.MatrixTranslationOper)
.add(/** @lends cdo.RelationalTranslationOper# */{
    M: 0, // number of measures
    C: 0, // number of categories
    S: 0, // number of series

    _translType: "Relational",

    _processMetadata: function() {

        this.base();

        var metadata = this.metadata,
            J = this.J, // metadata.length

            // Split between series and categories
            C = this.options.categoriesCount,
            S, valuesColIndexes, M,
            D; // discrete count = D = S + C

        // +-Infinity or < 0 is invalid, so set to 0.
        if(C != null && (!isFinite(C) || C < 0)) C = 0;

        // Assuming duplicate valuesColIndexes is not valid
        // (v1 did not make this assumption)

        if(this.options.isMultiValued) {
            valuesColIndexes = def.parseDistinctIndexArray(this.options.measuresIndexes, 0, J - 1);
            M = valuesColIndexes ? valuesColIndexes.length : 0;
        }

        if(M == null) {
            if(J > 0 && J <= 3 && (C == null || C === 1)) {
                // V1 Stability requirement
                // Measure columns with all values = null,
                // would be detected as type string,
                // and not be chosen as measures.
                M = 1;
                valuesColIndexes = [J - 1];
                C = J >= 2 ? 1 : 0;
                S = J >= 3 ? 1 : 0;
                D = C + S;

            } else if(C != null &&  C >= J) {
                D = C = J;
                S = M = 0;
            } else {
                // J - C >= 1
                // specified C wins over M, and by last S
                var Mmax = C != null ? (J - C) : Infinity; // >= 1

                // Take as many numeric column indexes as Mmax.

                // colIndex has already been fixed on _processMetadata
                // 0 = discrete
                valuesColIndexes = def
                    .query(metadata)
                    .where(function(colDef, index) { return this._columnTypes[index] !== 0; }, this)
                    .select(function(colDef) { return colDef.colIndex; })
                    .take(Mmax)
                    .array();

                M = valuesColIndexes.length; // Surely <= J
            }
        }

        // M != null && M <= J

        if(D == null) {
            // M wins over C
            D = J - M; // D >= 0
            if(D === 0) {
                S = C = 0;
            } else if(C != null) {
                if(C > D) {
                    C = D;
                    S = 0;
                } else {
                    S = D - C;
                }
            } else {
                // "Distribute" between categories and series.
                // Categories have precedence. At most one series.
                S = D > 1 ? 1 : 0;
                C = D - S;
            }
        }

        var seriesInRows  = this.options.seriesInRows,
            colGroupSpecs = [];
        if(D) {
            if(S && !seriesInRows) colGroupSpecs.push({name: 'S', count: S});
            if(C                 ) colGroupSpecs.push({name: 'C', count: C});
            if(S &&  seriesInRows) colGroupSpecs.push({name: 'S', count: S});
        }

        if(M) colGroupSpecs.push({name: 'M', count: M});

        var availableInputIndexes = def.range(0, J).array();

        // If valuesColIndexes != null, these are reserved for values
        // Remove these indexes from available indexes
        if(valuesColIndexes)
            valuesColIndexes.slice().sort(def.descending).forEach(function(inputIndex) {
                availableInputIndexes.splice(inputIndex, 1);
            });

        // Set the fields with actual number of columns of each group
        // Assign the input indexes of each group (Layout)
        var specsByName = {};
        colGroupSpecs.forEach(function(groupSpec) {
            var count = groupSpec.count,
                name  = groupSpec.name;

            // Index group by name
            specsByName[name] = groupSpec;

            groupSpec.indexes = valuesColIndexes && name === 'M'
                ? valuesColIndexes
                : availableInputIndexes.splice(0, count);
        });

        this.M = M;
        this.S = S;
        this.C = C;

        // Compose the total permutation array
        // that transforms the input into the logical row:
        // S* C* M*
        var logicalRowPerm = [];
        ['S', 'C', 'M'].forEach(function(name) {
            var groupSpec = specsByName[name];
            if(groupSpec) def.array.append(logicalRowPerm, groupSpec.indexes);
        });

        this._logicalRowInfos = logicalRowPerm.map(this._buildLogicalColumnInfoFromMetadata, this);
        this._logicalRowPerm  = logicalRowPerm;

        // Logical view
        this._logicalRowPhysicalGroupsLength = {
            'series':   this.S,
            'category': this.C,
            'value':    this.M
        };

        this._logicalRowPhysicalGroupIndex = {
            'series':   0,
            'category': this._logicalRowPhysicalGroupsLength.series,
            'value':    this.S + this.C
        };
    },

    logLogicalRow: function() {
        return this._logLogicalRow(['S', 'C', 'M'], {S: this.S, C: this.C, M: this.M});
    },

    configureType: function() {

        this.base();

        var dataPartDimName = this.options.dataPartDimName;
        if(dataPartDimName && !this.complexTypeProj.isReadOrCalc(dataPartDimName)) {
            // The null test is required because plot2DataSeriesIndexes can be a number, a string...
            var plot2DataSeriesIndexes = this.options.plot2DataSeriesIndexes;
            if(plot2DataSeriesIndexes != null) {
                var seriesReader = this._userDimsReadersByDim.series;
                if(seriesReader) relTransl_dataPartGet.call(this, plot2DataSeriesIndexes, seriesReader);
            }
        }
    },

    // Permutes the input rows
    _executeCore: function() {
        var dimsReaders = this._getDimensionsReaders(),
            permIndexes = this._logicalRowPerm;

        return def.query(this._getLogicalRows())
                  .select(function(row) {
                      row = pv.permute(row, permIndexes);
                      return this._readLogicalRow(row, dimsReaders);
                  }, this);
    }
});

/**
 * Obtains the dimension reader for dimension 'dataPart'.
 *
 * @name cdo.RelationalTranslationOper#_dataPartGet
 * @function
 * @param {Array} plot2DataSeriesIndexes The indexes of series that are to be shown on the second axis.
 * @param {function} seriesReader Dimension series atom getter.
 */
function relTransl_dataPartGet(plot2DataSeriesIndexes, seriesReader) {
    var me = this;

    // TODO: Almost sure we should be applying the permutation here, as in _executeCore.
    // Maybe, even, _getLogicalRows should already be returning permutated rows...
    // Try the change later. In this commit there's already enough risk involved.

    // Defer calculation of plot2SeriesKeySet because *data* isn't yet available.
    function calcAxis2SeriesKeySet() {
        var atoms = {},
            seriesKeys = def.query(me.source)
                .select(function(row) {
                    seriesReader(row, atoms);
                    var value = atoms.series;
                    if(value != null && value.v != null) value = value.v;
                    return value || null;
                })
                // distinct excludes null keys
                .distinct()
                .array();

        return me._createPlot2SeriesKeySet(plot2DataSeriesIndexes, seriesKeys);
    }

    this._dataPartGet(calcAxis2SeriesKeySet);
}
