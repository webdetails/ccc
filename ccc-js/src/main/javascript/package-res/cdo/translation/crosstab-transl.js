/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @name cdo.CrosstabTranslationOper
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
 * TODO: document crosstab options
 */
def.type('cdo.CrosstabTranslationOper', cdo.MatrixTranslationOper)
.add(/** @lends cdo.CrosstabTranslationOper# */{
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
     * R  = number of row      components
     * C  = number of column   components
     * M  = number of measure  components
     *
     * ----
     * Instances / groups / members
     *
     * <RG> = <r1, ..., rR> = R-tuple of row     values
     * <CG> = <s1, ..., sS> = C-tuple of column  values
     * <MG> = <m1, ..., mM> = M-tuple of measure values
     *
     * r = index of row     group component
     * c = index of column  group component
     * m = index of measure group component
     *
     * ----
     * Extent of spaces
     *
     * RG = number of (distinct) row    groups
     * CG = number of (distinct) column groups
     * MG = RG * CG
     *
     * rg = index of row    group
     * cg = index of column group
     *
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
     *                   X      | <~CG~>     |     | <~CG~>     |
     *                          +------------+     +------------+
     *
     *      0 o    +------------+------------+ ... +------------+    <-- this.source
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
     * Logical Row Structure
     * ----------------------
     * A relational view of the cross groups
     *
     *    [<...CG...>, <...RG...>, <...MG...>]
     *
     * This order is chosen to match that of the relational translation.
     *
     * Logical Row to Dimensions mapping
     * ----------------------------------
     *
     * A mapping from a logical row to a list of atoms (of distinct dimensions)
     *
     * logical-row --> atom[]
     *
     * A set of dimensions readers are called and
     * each returns one or more atoms of distinct dimensions.
     *
     *  * Each dimension has exactly one dimensions reader that reads its atoms.
     *  * One dimensions reader may read more than one dimension.
     *  * A dimensions reader always reads the same set of dimensions.
     *
     *  * A dimension consumes data from zero or more logical row components.
     *  * A logical row component is consumed by zero or more dimensions.
     *  * A dimension may vary in which logical row components it consumes, from atom to atom.
     *
     *  logical-row-component * <-> * dimension + <-> 1 dimensions reader
     */

    _translType: "Crosstab",

    /**
     * Obtains the number of columns of the logical row.
     * @type number
     * @override
     */
    logicalColumnCount: function() { return this.R + this.C + this.M; },

    /**
     * Performs the translation operation (override).
     * @returns {def.Query} An enumerable of {@link map(string any)}
     * @override
     */
    _executeCore: function() {
        if(!this.metadata.length) return def.query();

        var dimsReaders = this._getDimensionsReaders(),
            // Logical Row
            logRow = new Array(this.logicalColumnCount()),
            logicalRowCrossGroupIndex = this._logicalRowCrossGroupIndex,
            me = this;

        // Updates Logical Row
        // . <- source = line[0..R]
        // . <- source = colGroup[0..C]
        function updateLogicalRowCrossGroup(crossGroupId, source) {
            // Start index of cross group in logRow
            var logColIndex = logicalRowCrossGroupIndex[crossGroupId],
                sourceIndex = 0,
                depth       = me[crossGroupId];

            while((depth--) > 0) logRow[logColIndex++] = source[sourceIndex++];
        }

        // . <-  line[colGroupIndexes[0..M]]
        function updateLogicalRowMeasure(line, cg) {
            // Start index of cross group in logRow
            var logColIndex = logicalRowCrossGroupIndex.M,
                cgIndexes   = me._colGroupsIndexes[cg],
                depth       = me.M;

            for(var i = 0 ; i < depth ; i++) {
                var lineIndex = cgIndexes[i];
                logRow[logColIndex++] = lineIndex != null ? line[lineIndex] : null;
            }
        }

        // ----------------
        var q = def.query(this.source);
        if(this._colGroups && this._colGroups.length) {
            var expandLine = function(line/*, i*/) {
                updateLogicalRowCrossGroup('R', line);

                return def.query(this._colGroups)
                    .select(function(colGroup, cg) {
                        // Update ROW
                        updateLogicalRowCrossGroup('C', colGroup);
                        updateLogicalRowMeasure(line, cg);

                        // Naive approach...
                        // Call all readers every time
                        // Dimensions that consume rows and/or columns may be evaluated many times.
                        // So, it's very important that cdo.Dimension#intern is as fast as possible
                        //  detecting already interned values.
                        return this._readLogicalRow(logRow, dimsReaders);
                    }, this);
            };
            return q.selectMany(expandLine, this);
        }

        // C = 0, M = 0
        return q.select(function(line) {
            updateLogicalRowCrossGroup('R', line);
            return this._readLogicalRow(logRow, dimsReaders);
        }, this);
    },

    _processMetadata: function() {

        this.base();

        this._separator = this.options.separator || '~';

        /* Determine R, C and M */

        // Default values
        var R = this.R = 1;
        this.C = 1;
        this.M = 1;

        this.measuresDirection = null;
        var seriesInRows = this.options.seriesInRows,
            metadata = this.metadata,
            isV1Compat = this.options.compatVersion <= 1,
            colNames = (function() {
                    var f =
                        seriesInRows ? function(d) { return d.colName;      } :
                        isV1Compat   ? function(d) { return {v: d.colName}; } :

                        // Use the column label, if any, as the "column" value's format.
                        function(d) { return {v: d.colName, f: d.colLabel}; };

                    return metadata.map(f);
                }()),
            // For each cross group,
            // an array with the logRow info of each of its columns
            // {
            //   'C': [ {name: , type: , label: } ],
            //   'R': [],
            //   'M': []
            // }
            logicalRowCrossGroupInfos = this._logicalRowCrossGroupInfos = {};

        // --------------
        // * isMultiValued
        // * measuresInColumns
        // * measuresIndex, [measuresCount=1]
        // * [categoriesCount = 1]

        // ~~~~ R*

        if(!this.options.isMultiValued) {
            //    | C
            // ---|---
            // R* | M

            R = this.R = this._getCategoriesCount();

            // C = 1
            // M = 1

            this._colGroups = colNames.slice(R);
            this._colGroupsIndexes = new Array(this._colGroups.length);

            // To Array
            this._colGroups.forEach(function(colGroup, cg) {
                this._colGroups[cg] = [colGroup];
                this._colGroupsIndexes[cg] = [R + cg]; // all the same
            }, this);

            // R cross group is set below

            // Assume series are discrete (there's no metadata about them)
            // No name or label info.
            logicalRowCrossGroupInfos.C = [{type: 0}];

            // The column labels are series labels. Only colType is relevant.
            logicalRowCrossGroupInfos.M = [{type: this._columnTypes[R]}];
        } else {
            /* MULTI-VALUED */

            var measuresInColumns = def.get(this.options, 'measuresInColumns', true);
            if(measuresInColumns || this.options.measuresIndex == null) {

                R = this.R = this._getCategoriesCount();

                // First R columns are from row space
                var encodedColGroups = colNames.slice(R),

                    // Remaining are column and measure types
                    L = encodedColGroups.length;

                // Any results in column direction...
                if(L > 0) {
                    if(!measuresInColumns) {
                        // ~~~~ C*  M

                        //    | C*
                        // ---|----
                        // R* | M

                        this._colGroups = encodedColGroups;
                        this._colGroupsIndexes = [];

                        // Split encoded column groups
                        this._colGroups.forEach(function(colGroup, cg) {
                            this._colGroups[cg] = this._splitEncodedColGroupCell(colGroup);
                            this._colGroupsIndexes[cg] = [this.R + cg]; // all the same
                        }, this);

                        logicalRowCrossGroupInfos.M = [this._buildLogicalColumnInfoFromMetadata(R)];
                    } else {
                        // ~~~~ C* M*

                        //    | C*~M*
                        // ---|------
                        // R* | M*

                        this.measuresDirection = 'columns';

                        // Updates:
                        //   _colGroups,
                        //   _colGroupsIndexes and
                        //   M
                        //  logicalRowCrossGroupInfos.M
                        this._processEncodedColGroups(encodedColGroups);
                    }

                    this.C = this._colGroups[0].length; // may be 0!

                    // C discrete columns
                    logicalRowCrossGroupInfos.C =
                        def.range(0, this.C).select(function() { return {type: 0}; }).array();

                } else {
                    this.C = this.M = 0;
                    logicalRowCrossGroupInfos.M = [];
                    logicalRowCrossGroupInfos.C = [];
                }

            } else {
                // TODO: complete this
                // TODO: logicalRowCrossGroupInfos

                /* MEASURES IN ROWS */

                this.measuresDirection = 'rows';

                // C = 1 (could also be more if an option to make ~ on existed)
                // R = 1 (could be more...)
                // M >= 1

                // The column index at which measure values (of each series) start
                // is the number of row components
                this.R = +this.options.measuresIndex;

                var measuresCount = this.options.measuresCount;
                if(measuresCount == null) measuresCount = 1;

                // TODO: >= 1 check
                this.M = measuresCount;

                // First R columns are from row space
                // Next follows a non-relevant Measure title column
                this._colGroups = colNames.slice(this.R + 1);

                // To Array of Cells
                this._colGroups.forEach(function(colGroup, cg) {
                    this._colGroups[cg] = [colGroup];
                }, this);
            }
        }

        // First R columns are from row space
        logicalRowCrossGroupInfos.R =
            def.range(0, this.R).select(this._buildLogicalColumnInfoFromMetadata, this).array();

        // ----------------
        // The index at which the first component of
        // each cross group is placed in **logical row**

        var logicalRowCrossGroupIndex = this._logicalRowCrossGroupIndex = {
            'C': !seriesInRows ? 0      : this.R,
            'R': !seriesInRows ? this.C : 0,
            'M': this.C + this.R
        };

        var logicalRowInfos = this._logicalRowInfos = new Array(this.logicalColumnCount()); // R + C + M

        def.eachOwn(logicalRowCrossGroupIndex, function(groupStartIndex, crossGroup) {
            logicalRowCrossGroupInfos[crossGroup]
            .forEach(function(info, groupIndex) {
                logicalRowInfos[groupStartIndex + groupIndex] = info;
            });
        });

        // Logical view

        this._logicalRowPhysicalGroupsLength = {
            'series':   seriesInRows ? this.R : this.C,
            'category': seriesInRows ? this.C : this.R,
            'value':    this.M
        };

        this._logicalRowPhysicalGroupIndex = {
            'series':   0,
            'category': this._logicalRowPhysicalGroupsLength.series,
            'value':    this.C + this.R
        };
    },

    logLogicalRow: function() {
        return this._logLogicalRow(['C', 'R', 'M'], {C: this.C, R: this.R, M: this.M});
    },

    _getCategoriesCount: function() {
        var R = this.options.categoriesCount;
        if(R != null && (!isFinite(R) || R < 0)) R = null;

        if(R == null) {
            // Number of consecutive discrete columns, from left
            R = def
                .query(this._columnTypes)
                .whayl(function(type) { return type === 0; }) // 0 = discrete
                .count();
            if(!R) {
                // Having no R causes problems
                // when categories are continuous
                // (in MetricDots for example).
                R = 1;
            }
        }

        return R;
    },

    _splitEncodedColGroupCell: function(colGroup) {
        var values = colGroup.v,
            labels;

        if(values == null) {
            values = [];
        } else {
            values = values.split(this._separator);
            labels = colGroup.f;
            if(labels) labels = labels.split(this._separator);
        }

        return values.map(function(value, index) {
            return {
                v: value,
                f: labels && labels[index]
            };
        });
    },

    /**
     * Analyzes the array of encoded column groups.
     * <p>
     * Creates an array of column groups;
     * where each element of the array is
     * an array of the column values of the group (C values).
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
     * This order is then used to place values in the logical row.
     * </p>
     */
    _processEncodedColGroups: function(encodedColGroups) {
        var L = encodedColGroups.length || def.assert("Must have columns"),
            R = this.R,
            colGroups = [],
            currColGroup,
            /*
             * measureName -> {
             *     groupIndex: 0, // Global order of measures within a column group
             *     index: 0       // Index (i, below) of measure's first appearance
             * }
             *
             */
            measuresInfo  = {},
            measuresInfoList = [];

        for(var i = 0 ; i < L ; i++) {
            var colGroupCell = encodedColGroups[i],
                encColGroupValues = colGroupCell.v,
                encColGroupLabels = colGroupCell.f,
                sepIndex = encColGroupValues.lastIndexOf(this._separator),
                meaName, meaLabel, colGroupValues, colGroupLabels;

            // MeasureName has precedence,
            // so we may end up with no column group value (and C = 0).
            if(sepIndex < 0) {
                // C = 0
                meaName  = encColGroupValues;
                meaLabel = encColGroupLabels;
                encColGroupValues = '';
                colGroupValues = [];
            } else {
                meaName = encColGroupValues.substring(sepIndex + 1);
                encColGroupValues = encColGroupValues.substring(0, sepIndex);
                colGroupValues = encColGroupValues.split(this._separator);

                if(encColGroupLabels != null) {
                    colGroupLabels = encColGroupLabels.split(this._separator);
                    meaLabel = colGroupLabels.pop(); // measure label
                }

                /*jshint loopfunc:true */
                colGroupValues.forEach(function(value, index) {
                    var label = colGroupLabels && colGroupLabels[index];
                    colGroupValues[index] = {v: value, f: label};
                });
            }

            // New column group?
            if(!currColGroup || currColGroup.encValues !== encColGroupValues) {
                currColGroup = {
                    startIndex:   i,
                    encValues:    encColGroupValues,
                    values:       colGroupValues,
                    measureNames: [meaName]
                };

                colGroups.push(currColGroup);
            } else {
                currColGroup.measureNames.push(meaName);
            }

            // Check the measure
            var currMeaIndex = (i - currColGroup.startIndex),
                meaInfo = def.getOwn(measuresInfo, meaName);
            if(!meaInfo) {
                measuresInfo[meaName] = meaInfo = {
                    name:  meaName,
                    label: meaLabel,
                    type:  this._columnTypes[R + i], // Trust the type of the first column where the measure appears

                    // More than needed info for CGInfo, but it's ok
                    groupIndex: currMeaIndex,
                    index: i
                };
                measuresInfoList.push(meaInfo);
            } else if(currMeaIndex > meaInfo.groupIndex) {
                meaInfo.groupIndex = currMeaIndex;
            }
        }

        // Sort measures
        measuresInfoList.sort(function(meaInfoA, meaInfoB) {
            return def.compare(meaInfoA.groupIndex, meaInfoB.groupIndex) ||
                   def.compare(meaInfoA.index, meaInfoB.index);
        });

        // Reassign measure group indexes
        measuresInfoList.forEach(function(meaInfoA, index) { meaInfoA.groupIndex = index; });

        // Publish colgroups and colgroupIndexes, keeping only relevant information
        var CG = colGroups.length,
            colGroupsValues  = new Array(CG),
            colGroupsIndexes = new Array(CG),
            M = measuresInfoList.length;

        colGroups.map(function(colGroup, cg) {
            colGroupsValues[cg] = colGroup.values;

            var colGroupStartIndex = colGroup.startIndex,
                // The index in source *line* where each of the M measures can be read
                meaIndexes = colGroupsIndexes[cg] = new Array(M);

            colGroup.measureNames.forEach(function(meaName2, localMeaIndex) {
                // The measure index in logical row
                var meaIndex = measuresInfo[meaName2].groupIndex;

                // Where to read the measure in *line*?
                meaIndexes[meaIndex] = R + colGroupStartIndex + localMeaIndex;
            });
        });

        this._colGroups        = colGroupsValues;
        this._colGroupsIndexes = colGroupsIndexes;
        this._logicalRowCrossGroupInfos.M = measuresInfoList;
        this.M = M;
    },

    /**
     * Called once, before {@link #execute},
     * for the translation to configure the complex type.
     *
     * @type undefined
     * @override
     */
    configureType: function() {
        // Map: Dimension Group -> logical row cross-groups indexes
        if(this.measuresDirection === 'rows') throw def.error.notImplemented();

        /* plot2DataSeriesIndexes only implemented for single-series */
        var dataPartDimName = this.options.dataPartDimName;
        if(dataPartDimName && this.C === 1 && !this.complexTypeProj.isReadOrCalc(dataPartDimName)) {
            // The null test is required because plot2DataSeriesIndexes can be a number, a string...
            var plot2DataSeriesIndexes = this.options.plot2DataSeriesIndexes;
            if(plot2DataSeriesIndexes != null) {
                var seriesKeys = this._colGroups.map(function(colGroup) { return '' + colGroup[0].v; });
                this._plot2SeriesKeySet = this._createPlot2SeriesKeySet(plot2DataSeriesIndexes, seriesKeys);
            }
        }

        this.base();

        if(this._plot2SeriesKeySet) {
            var seriesReader = this._userDimsReadersByDim.series;
            if(seriesReader) {
                var calcAxis2SeriesKeySet = def.fun.constant(this._plot2SeriesKeySet);
                this._dataPartGet(calcAxis2SeriesKeySet);
            }
        }
    }
});
