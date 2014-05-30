/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

pvc.BaseChart
.add({

    /**
     * The data that the chart is to show.
     * @type pvc.data.Data
     * @deprecated
     */
    dataEngine: null,

    /**
     * The data that the chart is to show.
     * @type pvc.data.Data
     */
    data: null,

    _partsDataCache: null,
    _visibleDataCache: null,

    /**
     * The data source of the chart.
     * <p>
     * The {@link #data} of a root chart
     * is loaded with the data in this array.
     * </p>
     * @type any[]
     */
    resultset: [],

    /**
     * The meta-data that describes each
     * of the data components of {@link #resultset}.
     * @type any[]
     */
    metadata: [],

    _trendable: false,
    _interpolatable: false,

    _constructData: function(options) {
        if(this.parent) {
            //noinspection JSDeprecatedSymbols
            this.dataEngine = this.data = options.data || def.fail.argumentRequired('options.data');
        }
    },

    _checkNoDataI: function() {
        // Child charts are created to consume *existing* data
        // If we don't have data, we just need to set a "no data" message and go on with life.
        if (!this.allowNoData && !this.resultset.length) {
            /*global NoDataException:true */
            throw new NoDataException();
        }
    },

    _checkNoDataII: function() {
        // Child charts are created to consume *existing* data
        // If we don't have data, we just need to set a "no data" message and go on with life.
        if (!this.allowNoData && (!this.data || !this.data.count())) {

            this.data = null;

            /*global NoDataException:true */
            throw new NoDataException();
        }
    },

    /**
     * Initializes the data engine and roles.
     */
    _initData: function(ka) {
        // Root chart
        if(!this.parent) {
            var data = this.data;
            if(!data) {
                this._onLoadData();
            } else if(def.get(ka, 'reloadData', true)) {
                // This **replaces** existing data (datums also existing in the new data are kept)
                this._onReloadData();
            } else {
                // Existing data is kept.
                // This is used for re-layouting only.
                // Yet...

                // Dispose all data children and linked children (recreated as well)
                // And clears caches as well.
                data.disposeChildren();

                // Remove virtual datums (they are regenerated each time)
                data.clearVirtuals();
            }
        }

        // Cached data stuff
        delete this._partsDataCache;
        delete this._visibleDataCache;

        if(pvc.debug >= 3) { this._log(this.data.getInfo()); }
    },

    _onLoadData: function() {
        /*jshint expr:true*/
        var data = this.data;
        var translation = this._translation;

        (!data && !translation) || def.assert("Invalid state.");

        var options  = this.options;

        var dataPartDimName = this._getDataPartDimName();
        var complexTypeProj = this._complexTypeProj || def.assert("Invalid state.");
        var translOptions   = this._createTranslationOptions(dataPartDimName);
        translation = this._translation = this._createTranslation(translOptions);

        if(pvc.debug >= 3) {
            this._log(translation.logSource());
            this._log(translation.logTranslatorType());
        }

        // Now the translation can also configure the type
        translation.configureType();

        // If the the dataPart dimension isn't being read or calculated
        // its value must be defaulted to 0.
        if(dataPartDimName && !complexTypeProj.isReadOrCalc(dataPartDimName)) {
            this._addDefaultDataPartCalculation(dataPartDimName);
        }

        if(pvc.debug >= 3) {
            this._log(translation.logVItem());
        }

        // ----------
        // Roles are bound before actually loading data.
        // i) roles add default properties to dimensions bound to them
        // ii) in order to be able to filter datums
        //     whose "every dimension in a measure role is null".
        this._bindVisualRolesPostI();

        // Setup the complex type from complexTypeProj;
        var complexType = new pvc.data.ComplexType();
        complexTypeProj.configureComplexType(complexType, translOptions);

        this._bindVisualRolesPostII(complexType);

        if(pvc.debug >= 10) { this._log(complexType.describe()); }
        if(pvc.debug >= 3 ) { this._logVisualRoles(); }

        data =
            this.dataEngine = // V1 property
            this.data = new pvc.data.Data({
                type:     complexType,
                labelSep: options.groupedLabelSep,
                keySep:   translOptions.separator
            });

        // ----------

        var loadKeyArgs = {where: this._getLoadFilter(), isNull: this._getIsNullDatum()};

        var resultQuery = translation.execute(data);

        data.load(resultQuery, loadKeyArgs);
    },

    _onReloadData: function() {
        /*jshint expr:true*/

        var data = this.data;
        var translation = this._translation;

        (data && translation) || def.assert("Invalid state.");

        // pass new resultset to the translation (metadata is maintained!).
        translation.setSource(this.resultset);

        if(pvc.debug >= 3) { this._log(translation.logSource()); }

        var loadKeyArgs = {where: this._getLoadFilter(), isNull: this._getIsNullDatum()};

        var resultQuery = translation.execute(data);

        data.load(resultQuery, loadKeyArgs);
    },

    _createComplexTypeProject: function() {
        var options = this.options;
        var complexTypeProj = new pvc.data.ComplexTypeProject(options.dimensionGroups);

        // Add specified dimensions
        var userDimsSpec = options.dimensions;
        for(var dimName in userDimsSpec) { // userDimsSpec can be null; 'for' accepts null!
            complexTypeProj.setDim(dimName, userDimsSpec[dimName]);
        }

        // Add data part dimension and
        // dataPart calculation from series values
        var dataPartDimName = this._getDataPartDimName();
        if(dataPartDimName) {
            complexTypeProj.setDim(dataPartDimName);

            this._addPlot2SeriesDataPartCalculation(complexTypeProj, dataPartDimName);
        }

        // Add specified calculations
        var calcSpecs = options.calculations;
        if(calcSpecs) {
            calcSpecs.forEach(function(calcSpec) { complexTypeProj.setCalc(calcSpec); });
        }

        return complexTypeProj;
    },

    _getLoadFilter: function() {
        // Null datums are being excluded in a special way 
        // from within the grouping operations.
        // if(this.options.ignoreNulls) {
        //     var me = this;
        //     return function(datum) {
        //         var isNull = datum.isNull;
        //         if(isNull && pvc.debug >= 4) { me._info("Datum excluded."); }
        //         return !isNull;
        //     };
        // }
    },

    _getIsNullDatum: function() {
        var measureDimNames = this.measureDimensionsNames(),
            M = measureDimNames.length;
        if(M) {
            // Must have all measure role dimensions = null
            return function(datum) {
                var atoms = datum.atoms;
                for(var i = 0 ; i < M ; i++) {
                    if(atoms[measureDimNames[i]].value != null) { return false; }
                }

                return true;
            };
        }
    },

    _createTranslation: function(translOptions){
        var TranslationClass = this._getTranslationClass(translOptions);

        return new TranslationClass(this, this._complexTypeProj, this.resultset, this.metadata, translOptions);
    },

    _getTranslationClass: function(translOptions) {
        return translOptions.crosstabMode ?
               pvc.data.CrosstabTranslationOper :
               pvc.data.RelationalTranslationOper;
    },

    _createTranslationOptions: function(dataPartDimName) {
        var options = this.options;

        var dataOptions = options.dataOptions || {};

        var dataSeparator = options.dataSeparator;
        if(dataSeparator === undefined) { dataSeparator = dataOptions.separator; }
        if(!dataSeparator) { dataSeparator = '~'; }

        var dataMeasuresInColumns = options.dataMeasuresInColumns;
        if(dataMeasuresInColumns === undefined) { dataMeasuresInColumns = dataOptions.measuresInColumns; }

        var dataCategoriesCount = options.dataCategoriesCount;
        if(dataCategoriesCount === undefined) { dataCategoriesCount = dataOptions.categoriesCount; }

        var dataIgnoreMetadataLabels = options.dataIgnoreMetadataLabels;
        if(dataIgnoreMetadataLabels === undefined) { dataIgnoreMetadataLabels = dataOptions.ignoreMetadataLabels; }

        var plot2Series, plot2DataSeriesIndexes;
        var plot2 = options.plot2;
        if(plot2) {
            if(this._allowV1SecondAxis && (this.compatVersion() <= 1)) {
                plot2DataSeriesIndexes = options.secondAxisIdx;
            } else {
                plot2Series = (this._serRole != null) &&
                              options.plot2Series &&
                              def.array.as(options.plot2Series);

                // TODO: temporary implementation based on V1s secondAxisIdx's implementation
                // until a real "series visual role" based implementation exists.
                if(!plot2Series || !plot2Series.length) {
                    plot2Series = null;
                    plot2DataSeriesIndexes = options.plot2SeriesIndexes;
                }
            }

            if(!plot2Series) {
                plot2DataSeriesIndexes = pvc.parseDistinctIndexArray(plot2DataSeriesIndexes, -Infinity) || -1;
            }
        }

        return {
            compatVersion:     this.compatVersion(),
            plot2DataSeriesIndexes: plot2DataSeriesIndexes,
            seriesInRows:      options.seriesInRows,
            crosstabMode:      options.crosstabMode,
            isMultiValued:     options.isMultiValued,
            dataPartDimName:   dataPartDimName,
            dimensionGroups:   options.dimensionGroups,
            dimensions:        options.dimensions,
            readers:           options.readers,

            measuresIndexes:   options.measuresIndexes, // relational multi-valued

            multiChartIndexes: options.multiChartIndexes,

            // crosstab
            separator:         dataSeparator,
            measuresInColumns: dataMeasuresInColumns,
            categoriesCount:   dataCategoriesCount,

            // TODO: currently measuresInRows is not implemented...
            measuresIndex:     dataOptions.measuresIndex || dataOptions.measuresIdx, // measuresInRows
            measuresCount:     dataOptions.measuresCount || dataOptions.numMeasures, // measuresInRows

            // Timeseries *parse* format
            isCategoryTimeSeries: options.timeSeries,
            formatProto:          this.format,
            timeSeriesFormat:     options.timeSeriesFormat,
            ignoreMetadataLabels: dataIgnoreMetadataLabels
        };
    },

    _addPlot2SeriesDataPartCalculation: function(complexTypeProj, dataPartDimName) {
        if(this.compatVersion() <= 1) { return; }

        var options = this.options;
        var serRole = this._serRole;
        var plot2Series = (serRole != null) &&
                          options.plot2 &&
                          options.plot2Series &&
                          def.array.as(options.plot2Series);

        if(!plot2Series || !plot2Series.length) { return; }

        var inited = false;
        var plot2SeriesSet = def.query(plot2Series).uniqueIndex();
        var dimNames, dataPartDim, part1Atom, part2Atom;

        complexTypeProj.setCalc({
            names: dataPartDimName,
            calculation: function(datum, atoms) {
                if(!inited){
                    // LAZY init
                    if(serRole.isBound()) {
                        dimNames    = serRole.grouping.dimensionNames();
                        dataPartDim = datum.owner.dimensions(dataPartDimName);
                    }
                    inited = true;
                }

                if(dataPartDim) {
                    var seriesKey = pvc.data.Complex.compositeKey(datum, dimNames);
                    atoms[dataPartDimName] =
                        def.hasOwnProp.call(plot2SeriesSet, seriesKey) ?
                           (part2Atom || (part2Atom = dataPartDim.intern('1'))) :
                           (part1Atom || (part1Atom = dataPartDim.intern('0')));
                }
            }
        });
    },

    _addDefaultDataPartCalculation: function(dataPartDimName){
        var dataPartDim, part1Atom;

        this._complexTypeProj.setCalc({
            names: dataPartDimName,
            calculation: function(datum, atoms) {
                if(!dataPartDim) { dataPartDim = datum.owner.dimensions(dataPartDimName); }

                atoms[dataPartDimName] = part1Atom || (part1Atom = dataPartDim.intern('0'));
            }
        });
    },

    partData: function(dataPartValues, baseData) {
        if(!baseData) baseData = this.data;
        if(dataPartValues == null) { return baseData; }

        if(this.parent) { return this.root.partData(dataPartValues, baseData); }

        // Is the visual role undefined or unbound?
        var partRole = this._dataPartRole;
        if(!partRole || !partRole.isBound()) {
            // Ignore dataPartValues. It should be empty, but in some cases it comes with ['0'], due to shared code.
            return baseData;
        }

        // Try get from cache.
        var cacheKey = '\0' + baseData.id + ':' + def.nullyTo(dataPartValues, ''); // Counting on Array.toString() implementation, when an array.
        var partitionedDataCache = def.lazy(this, '_partsDataCache');
        var partData = partitionedDataCache[cacheKey];
        if(!partData) {
            // Not in cache. Create the partData result.
            partData = this._createPartData(baseData, partRole, dataPartValues);
            partitionedDataCache[cacheKey] = partData;
        }
        
        return partData;
    },

    _createPartData: function(baseData, partRole, dataPartValues) {
        // NOTE: It is not possible to use a normal whereSpec query.
        // Under the hood it uses groupBy to filter the results,
        //  and that ends changing the order of datums, to follow
        //  the group operation.
        // Changing order at this level is not acceptable.
        var dataPartDimName = partRole.firstDimensionName();
        var dataPartAtoms   = baseData.dimensions(dataPartDimName)
            .getDistinctAtoms(def.array.to(dataPartValues));

        var where = data_whereSpecPredicate([def.set({}, dataPartDimName, dataPartAtoms)]);

        return baseData.where(null, {where: where});
    },

    // --------------------

    /*
     * Obtains the chart's visible data
     * grouped according to the charts "main grouping".
     *
     * @param {string|string[]} [dataPartValue=null] The desired data part value or values.
     * @param {object} [ka=null] Optional keyword arguments object.
     * @param {boolean} [ka.ignoreNulls=true] Indicates that null datums should be ignored.
     * Only takes effect if the global option {@link pvc.options.charts.Chart#ignoreNulls} is false.
     * @param {boolean} [ka.inverted=false] Indicates that the inverted data grouping is desired.
     * @param {pvc.data.Data} [baseData] The base data to use. By default the chart's {@link #data} is used.
     *
     * @type pvc.data.Data
     */
    visibleData: function(dataPartValue, ka) {
        var baseData = def.get(ka, 'baseData') || this.data;

        if(this.parent) { 
            ka = ka ? Object.create(ka) : {};
            ka.baseData = baseData;
            return this.root.visibleData(dataPartValue, ka);
        }

        // Normalize values for the cache key.
        var inverted    = !!def.get(ka, 'inverted', false);
        var ignoreNulls = !!(this.options.ignoreNulls || def.get(ka, 'ignoreNulls', true));

        // dataPartValue: relying on Array#toString, when an array
        var key = '\0' + baseData.id + '|' + inverted + '|' + ignoreNulls + '|' + 
            (dataPartValue != null ? dataPartValue : null);

        var cache = def.lazy(this, '_visibleDataCache');
        var data  = cache[key];
        if(!data) {
            var partData = this.partData(dataPartValue, baseData);

            ka = ka ? Object.create(ka) : {};
            ka.visible = true;
            ka.isNull  = ignoreNulls ? false : null;
            data = cache[key] = this._createVisibleData(partData, ka);
        }
        return data;
    },

    /*
     * Creates the chart's visible data
     * grouped according to the charts "main grouping".
     *
     * <p>
     * The default implementation groups data by series visual role.
     * </p>
     *
     * @param {pvc.data.Data} [baseData=null] The base data.
     *
     * @type pvc.data.Data
     * @protected
     * @virtual
     */
    _createVisibleData: function(baseData, ka) {
        var serRole = this._serRole;
        return serRole && serRole.isBound() 
            ? serRole.flatten(baseData, ka) 
            : baseData.where(null, ka); // Used?
    },

    // --------------------

    _initMultiCharts: function() {
        var chart = this;

        // Options objects
        chart.multiOptions = new pvc.visual.MultiChart(chart);
        chart.smallOptions = new pvc.visual.SmallChart(chart);

        var multiOption = chart.multiOptions.option;
        
        var data = chart.visualRoles.multiChart
            .flatten(chart.data, {visible: true, isNull: null});
        
        var smallDatas = data.childNodes;
        
        /* I - Determine how many small charts to create */
        var colCount, rowCount, multiChartMax, colsMax;

        if(chart._isMultiChartOverflowClipRetry) {
            rowCount = chart._clippedMultiChartRowsMax;
            colCount = chart._clippedMultiChartColsMax;
            colsMax = colCount;
            multiChartMax = rowCount * colCount;
        } else {
            multiChartMax = multiOption('Max'); // Can be Infinity.
        }
        
        var count = Math.min(smallDatas.length, multiChartMax);
        if(count === 0) {
            // Shows no message to the user.
            // An empty chart, like when all series are hidden through the legend.
            colCount = rowCount = colsMax = 0;
        } else if(!chart._isMultiChartOverflowClipRetry) {
            /* II - Determine basic layout (row and col count) */
            colsMax = multiOption('ColumnsMax'); // Can be Infinity.
            colCount = Math.min(count, colsMax);
            
            // <Debug>
            /*jshint expr:true */
            colCount >= 1 && isFinite(colCount) || def.assert("Must be at least 1 and finite");
            // </Debug>

            rowCount = Math.ceil(count / colCount);
            // <Debug>
            /*jshint expr:true */
            rowCount >= 1 || def.assert("Must be at least 1");
            // </Debug>
        }

        chart._multiInfo = {
          data:       data,
          smallDatas: smallDatas,
          count:      count,
          rowCount:   rowCount,
          colCount:   colCount,
          colsMax:    colsMax
        };
    },

    // --------------------

    _interpolate: function(hasMultiRole) {
        if(!this._interpolatable) return;

        var dataCells = def
            .query(this.axesList)
            .selectMany(def.propGet('dataCells'))
            .where(function(dataCell) {
                var nim = dataCell.nullInterpolationMode;
                return !!nim && nim !== 'none';
             })
             .distinct(function(dataCell) {
                 return dataCell.role.name  + '|' + (dataCell.dataPartValue || '');
             })
             .array();

        this._eachLeafDatasAndDataCells(hasMultiRole, dataCells, this._interpolateDataCell, this);
    },

    _generateTrends: function(hasMultiRole) {
        var dataPartDimName = this._getDataPartDimName();
        if(!this._trendable || !dataPartDimName) return;
        
        var dataCells = def.query(this.axesList)
            .selectMany(def.propGet('dataCells'))
            .where(def.propGet('trend'))
            .distinct(function(dataCell) {
                 return dataCell.role.name  + '|' + (dataCell.dataPartValue || '');
            })
            .array();

        var newDatums = [];
        
        this._eachLeafDatasAndDataCells(hasMultiRole, dataCells, function(dataCell, data) {
            this._generateTrendsDataCell(newDatums, dataCell, data);
        }, this);
        
        newDatums.length && this.data.owner.add(newDatums);
    },

    _eachLeafDatasAndDataCells: function(hasMultiRole, dataCells, f, x) {
        var C = dataCells.length;
        if(!C) return;
        
        var leafDatas, D;
        if(hasMultiRole) {
            leafDatas = this._multiInfo.smallDatas;
            D = this._multiInfo.count;
        } else {
            leafDatas = [this.data];
            D = 1;
        }

        for(var d = 0; d < D; d++) {
            var leafData = leafDatas[d];
            for(var c = 0; c < C; c++)
                f.call(x, dataCells[c], leafData, c, d);
        }
    },

    _interpolateDataCell: function(/*dataCell, baseData*/) {},

    _generateTrendsDataCell: function(/*dataCell, baseData*/) {},

    _getTrendDataPartAtom: function() {
        var dataPartDimName = this._getDataPartDimName();
        if(dataPartDimName) {
            return this.data.owner.dimensions(dataPartDimName).intern('trend');
        }
    },

    // ---------------

    /**
     * Method to set the data to the chart.
     * Expected object is the same as what comes from the CDA:
     * {metadata: [], resultset: []}
     */
    setData: function(data, options) {
        this.setResultset(data && data.resultset);
        this.setMetadata (data && data.metadata);

        // TODO: Danger!
        $.extend(this.options, options);

        return this;
    },

    /**
     * Sets the resultset that will be used to build the chart.
     */
    setResultset: function(resultset) {
        /*jshint expr:true */
        !this.parent || def.fail.operationInvalid("Can only set resultset on root chart.");

        this.resultset = resultset || [];
        if (!this.resultset.length) {
            this._warn("Resultset is empty");
        }

        return this;
    },

    /**
     * Sets the metadata that, optionally,
     * will give more information for building the chart.
     */
    setMetadata: function(metadata) {
        /*jshint expr:true */
        !this.parent || def.fail.operationInvalid("Can only set metadata on root chart.");

        this.metadata = metadata || [];
        if (!this.metadata.length) {
            this._warn("Metadata is empty");
        }

        return this;
    }
});

