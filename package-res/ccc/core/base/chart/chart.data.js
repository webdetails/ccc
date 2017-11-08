/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

pvc.BaseChart
.add({

    /**
     * The data that the chart is to show.
     * @type cdo.Data
     * @deprecated
     */
    dataEngine: null,

    /**
     * The data that the chart is to show.
     * @type cdo.Data
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

    _constructData: function(options) {
        if(this.parent) {
            this.dataEngine = this.data = options.data || def.fail.argumentRequired('options.data');

            this.slidingWindow = this.parent.slidingWindow;

            if(def.debug >= 3) this.log(this.data.getInfo());
        }
    },

    _createComplexTypeAndBindVisualRoles: function() {

        var options = this.options;
        var commonDimOptions = this._createCommonDimensionsOptions(options);

        // Create and configure the complex type project.
        var complexTypeProj = this._createNewComplexTypeProject();

        // Create, configure and begin the visual roles binder.
        var binder = pvc.visual.rolesBinder()
            .logger (this._createNewLogger())
            .context(this._createNewVisualRolesContext())
            .complexTypeProject(complexTypeProj);

        // Do initial VR bindings. These guide translation somewhat.
        binder.init();

        // The chart-level `dataPart` visual role may have been explicitly bound
        // to a dimension whose name is not "dataPart".
        //
        // By now, the actual name of the dimension playing the `dataPart` role is already known.
        // Check if data part dimension is actually needed:
        // a) calculated by series values to satisfy plot2,
        // b) for trending.
        var dataPartDimName = this._getDataPartDimName(/* useDefault: */true);

        if(!this._maybeAddPlot2SeriesDataPartCalc(complexTypeProj, dataPartDimName)) {
            if(!this.visualRoles.dataPart.isPreBound() && this.plots.trend) {
                complexTypeProj.setDim(dataPartDimName);
            }
        }

        // If there are any columns in the supplied data.
        if(this.metadata.length) {
            // TODO: the complexTypeProj instance remains alive in the persisted translation object,
            // although probably it is not needed anymore, even for reloads...

            this._createTranslation(complexTypeProj, commonDimOptions, dataPartDimName);

            // Configure complexTypeProj.
            this._translation.configureType();

            if(def.debug >= 3) this.log(this._translation.logLogicalRow());
        }

        // If the the dataPart dimension is defined, but is not being read or calculated,
        // then default its value to '0'.
        if(complexTypeProj.hasDim(dataPartDimName) && !complexTypeProj.isReadOrCalc(dataPartDimName)) {
            this._addDefaultDataPartCalculation(complexTypeProj, dataPartDimName);
        }

        // All dimensions are now defined. Finish VR pre-binding.
        binder.dimensionsFinished();

        // ----

        // Create the complex type.
        var complexType = new cdo.ComplexType(null, {
            formatProto: this._format
        });

        // Configure it from complexTypeProj.
        complexTypeProj.configureComplexType(complexType, commonDimOptions);

        // ----

        this._willBindVisualRoles(complexType);

        // ----

        // Complex type is finished.
        if(def.debug >= 3) this.log(complexType.describe());

        // ----

        // Finally, bind pre-bound visual roles to the actual complexType. Logs visual roles.
        binder.bind(complexType);

        this._dataType = complexType;
    },

    /**
     * Allows changing certain properties of the complex type before visual roles are finally bound to it.
     *
     * @param {!cdo.ComplexType} complexType - The complex type to which visual roles will be bound.
     * @protected
     * @overridable
     */
    _willBindVisualRoles: function(complexType) {

        // Sliding window configures some dimension options of complexType.
        this._createSlidingWindow(complexType);
    },

    _getPreBoundTrendedDimensionNames: function() {
        return def.query(this.plotList)
            .selectMany(def.propGet('dataCellList'))
            .where(def.propGet('trend'))
            .selectMany(function(dataCell) {
                if(dataCell.role.isPreBound()) {
                    return dataCell.role.preBoundGrouping().dimensionNames();
                }
            })
            .distinct()
            .array();
    },

    _createSlidingWindow: function(complexType) {

        var slidingWindow = null;

        if(this.options.slidingWindow) {
            slidingWindow = new pvc.visual.SlidingWindow(this);
            if(!slidingWindow.length) {
                slidingWindow = null;
            } else {
                slidingWindow.setDimensionsOptions(complexType);
                slidingWindow.setLayoutPreservation(this);
            }
        }

        this.slidingWindow = slidingWindow;
    },

    /**
     * Creates and loads, or reloads the chart's main dataset.
     * Root-only.
     */
    _initData: function(ka) {
        var data = this.data;
        if(!data) {
            this._createAndLoadData();
        } else if(def.get(ka, 'reloadData', true)) {
            // This replaces existing data.
            // Existing datums that are also present in the new data are kept,
            // preserving their interactive state.
            this._reloadData(/*isAdditive: */false);
        } else {
            // Existing _read_ data is kept.
            // Interpolations and trends are recreated (virtual datums).

            // However, because the whole chart structure (charts, panels, etc.) will be re-created,
            // it's best to also recreate children and linked data to match the new requirements.

            // Dispose all data children and linked children (recreated as well)
            // Clears data-local caches.
            data.disposeChildren();

            // Remove virtual datums (they are regenerated each time).
            data.clearVirtuals();

            if(def.get(ka, 'addData', false)) {
                // Add new data, without necessarily removing the previous.
                this._reloadData(/*isAdditive: */true);
            }
        }

        // Cached datas.
        delete this._partsDataCache;
        delete this._visibleDataCache;

        if(def.debug >= 3) this.log(this.data.getInfo());
    },

    _createAndLoadData: function() {

        // assert this._dataType

        // Create the chart's main dataset.
        var data = new cdo.Data({
            type:     this._dataType,
            labelSep: this.options.groupedLabelSep,
            keySep:   this.options.dataOptions.separator
        });

        this.data = data;
        this.dataEngine = data; // Legacy V1 property

        // Hook the sliding window to the data.
        if(this.slidingWindow) {
            // Needs this.axes and this.data to be setup...
            this.slidingWindow.initFromOptions();

            this.slidingWindow.setDataFilter(data);
        }

        // Is null when metadata has no columns...
        if(this._translation) {
            this._loadDataCore(/*isAdditive:*/false);
        }
    },

    _reloadData: function(isAdditive) {

        // Is null when metadata has no columns...
        if(this._translation) {

            // Pass new resultset to the translation (metadata is maintained!).
            this._translation.setSource(this.resultset);

            this._loadDataCore(isAdditive);
        }
    },

    _loadDataCore: function(isAdditive) {

        if(def.debug >= 3) {
            this.log(this._translation.logSource());
        }

        var readQuery = this._translation.execute(this.data);

        var loadKeyArgs = {
            isAdditive: isAdditive,
            where: this.options.dataOptions.where,
            isNull: this._getIsNullDatum()
        };

        this.data.load(readQuery, loadKeyArgs);
    },

    _createNewVisualRolesContext: function() {
        var chart    = this,
            options  = this.options,
            chartRolesOptions = options.visualRoles,
            roles    = this.visualRoles,
            roleList = this.visualRoleList,
            context  = function(rn) { return def.getOwn(roles, rn); };

        context.query = function() {
            return def.query(roleList);
        };

        // Accept visual roles directly in the options as <roleName>Role,
        // for chart roles or for the main plot roles.
        context.getOptions = function(r) {
            var plot = r.plot, name = r.name;

            // NOTE: a `null` config value means "create a null grouping"!
            // So care was taken no to use def.get, which tests option presence using `value != null`.
            var v, opts, U /*=undefined*/;
            if(!plot || plot.isMain) {
                if((v = options[name + 'Role']) !== U) return v;
                if(chartRolesOptions && (v = chartRolesOptions[name]) !== U) return v;
            }
            if(plot && (opts = plot._visualRolesOptions)) return opts[name];
        };

        context.getExtensionComplexTypesMap = function() {
            return chart.boundDimensionsComplexTypesMap;
        };

        return context;
    },

    _createNewLogger: function() {
        var me = this;

        function logger() {
            me.log.apply(me, arguments);
        }

        logger.level = function() { return def.debug; };

        return logger;
    },

    /**
     * Creates a complex type project and
     * configures it with the chart options
     * `dimensions`, `dimensionsGroups` and `calculations`.
     *
     * Must be called after pre-binding visual roles with
     * dimension names specified in visual roles' options.
     */
    _createNewComplexTypeProject: function() {
        var options = this.options;

        var complexTypeProj = new cdo.ComplexTypeProject(options.dimensionGroups);

        // `userDimsSpec` can be null.
        var userDimsSpec = options.dimensions;
        for(var dimName in userDimsSpec) {
            complexTypeProj.setDim(dimName, userDimsSpec[dimName]);
        }

        var calcSpecs = options.calculations;
        if(calcSpecs) {
            calcSpecs.forEach(complexTypeProj.setCalc, complexTypeProj);
        }

        return complexTypeProj;
    },

    _getIsNullDatum: function() {
        var me = this, measureDimNames, M;
        // Could test the potential value isMeasure of all visual roles,
        // but what's the probability of there not existing a measure visual role.

        // Must defer initialization of measureDimNames cause at this time
        // visual roles have not been bound yet (only some pre-bound),
        // so there's not certainty of a visual role being "measure" or not.

        // A null datum has all measure role dimensions = null.
        return function(datum) {
            if(!measureDimNames) {
                measureDimNames = me.measureDimensionsNames();
                M = measureDimNames.length;
            }
            if(!M) return false;
            var atoms = datum.atoms;
            for(var i = 0 ; i < M ; i++) if(atoms[measureDimNames[i]].value != null) return false;
            return true;
        };
    },

    _createTranslation: function(complexTypeProj, dimsOptions, dataPartDimName) {

        var translOptions = this._createTranslationOptions(dimsOptions, dataPartDimName);
        var TranslationClass = this._getTranslationClass(translOptions);
        var translation = new TranslationClass(complexTypeProj, this.resultset, this.metadata, translOptions);

        if(def.debug >= 3) this.log(translation.logTranslatorType());

        this._translation = translation;
    },

    /** @virtual */
    _getTranslationClass: function(translOptions) {
        return translOptions.crosstabMode
            ? cdo.CrosstabTranslationOper
            : cdo.RelationalTranslationOper;
    },

    // Creates the arguments required for cdo.DimensionType.extendSpec
    _createCommonDimensionsOptions: function(options) {
        return {
            isCategoryTimeSeries: options.timeSeries,
            formatProto:          this._format,
            timeSeriesFormat:     options.timeSeriesFormat
        };
    },

    _createTranslationOptions: function(dimsOptions, dataPartDimName) {
        var options = this.options,
            dataOptions = options.dataOptions;

        return def.create(dimsOptions, {
            compatVersion:     this.compatVersion(),
            plot2DataSeriesIndexes: options.plot2SeriesIndexes,
            seriesInRows:      options.seriesInRows,
            crosstabMode:      options.crosstabMode,
            isMultiValued:     options.isMultiValued,
            dataPartDimName:   dataPartDimName,
            readers:           options.readers,
            measuresIndexes:   options.measuresIndexes, // relational multi-valued
            multiChartIndexes: options.multiChartIndexes,
            ignoreMetadataLabels: dataOptions.ignoreMetadataLabels,
            typeCheckingMode:  pvc.parseDataTypeCheckingMode(dataOptions.typeCheckingMode),

            // crosstab
            separator:         dataOptions.separator,
            measuresInColumns: dataOptions.measuresInColumns,
            categoriesCount:   dataOptions.categoriesCount,

            // TODO: currently measuresInRows is not implemented...
            measuresIndex:     dataOptions.measuresIndex,
            measuresCount:     dataOptions.measuresCount
        });
    },

    _maybeAddPlot2SeriesDataPartCalc: function(complexTypeProj, dataPartDimName) {
        if(this.compatVersion() <= 1) return false;

        // The visual role series must exist in the main plot, or in the chart.
        // It may not become bound though.
        var options = this.options,
            serRole = this.visualRoles.series,
            plot2Series = serRole ? options.plot2Series : null;

        if(!plot2Series) return false;

        var plot2SeriesSet = def.query(plot2Series).uniqueIndex(),
            hasOwnProp = def.hasOwnProp,
            mainSeriesDimNames, dataPartDim, part1Atom, part2Atom, buildSeriesKey,
            init = function(datum) {
                // LAZY init
                if(serRole.isBound()) {

                    // NOTE: that `plot2Series` only works as expected when the series visual role does
                    // *not* contain a measure discriminator dimension.
                    //
                    // Passing plot2Series = ["Cars~Quantity", "Places~Quantity"]
                    // with seriesRole = ["ProductLine", "valueRole.dim"]
                    //
                    // will not work because discriminator dimensions are not part of datums themselves
                    // and are only defined in the data groups that are the result of groupings of plot visual roles...

                    mainSeriesDimNames = serRole.grouping.dimensionNames();
                    dataPartDim = datum.owner.dimensions(dataPartDimName);
                    if(mainSeriesDimNames.length > 1) {
                        buildSeriesKey = cdo.Complex.compositeKey;
                    } else {
                        mainSeriesDimNames = mainSeriesDimNames[0];
                        buildSeriesKey = function(dat, mainSeriesDimName) { return dat.atoms[mainSeriesDimName].key; };
                    }
                }
                init = null;
            };

        complexTypeProj.setCalc({
            names: dataPartDimName,
            calculation: function(datum, atoms) {
                init && init(datum);
                if(dataPartDim) { // when serRole is unbound
                    var seriesKey = buildSeriesKey(datum, mainSeriesDimNames);
                    atoms[dataPartDimName] =
                        hasOwnProp.call(plot2SeriesSet, seriesKey)
                            ? (part2Atom || (part2Atom = dataPartDim.intern('1')))
                            : (part1Atom || (part1Atom = dataPartDim.intern('0')));
                }
            }
        });

        return true;
    },

    /**
     * Adds a calculation to the complex type project,
     * for the specified data part dimension name,
     * that always evaluates to '0'.
     *
     * This is used to initialize the data part dimension
     * (the one to which the `dataPart` visual role is bound)
     * when there is no "by series" partitioning configuration,
     * or a user defined calculation for it.
     *
     * @param {cdo.ComplexTypeProject} complexTypeProject The complex type project to configure.
     * @param {string} dataPartDimName The dimension to which the `dataPart` visual role is bound.
     */
    _addDefaultDataPartCalculation: function(complexTypeProj, dataPartDimName) {
        var dataPartDim, part1Atom;

        complexTypeProj.setCalc({
            names: dataPartDimName,
            calculation: function(datum, atoms) {
                if(!dataPartDim) dataPartDim = datum.owner.dimensions(dataPartDimName);

                atoms[dataPartDimName] = part1Atom || (part1Atom = dataPartDim.intern('0'));
            }
        });
    },

    partData: function(dataPartValues, baseData) {
        if(!baseData) baseData = this.data;
        if(dataPartValues == null) return baseData;

        var rootChart = this.root;

        // Is the visual role undefined or unbound?
        // If so, ignore dataPartValues. It should be empty, but in some cases it comes with ['0'], due to shared code.
        var partRole = rootChart.visualRoles.dataPart;
        if(!partRole || !partRole.isBound()) return baseData;

        // Try get from cache.
        var cacheKey = '\0' + baseData.id + ':' + def.nullyTo(dataPartValues, ''), // Counting on Array.toString() implementation, when an array.
            partitionedDataCache = def.lazy(rootChart, '_partsDataCache'),
            partData = partitionedDataCache[cacheKey];
        if(!partData) {
            // Not in cache. Create the partData result.
            partData = rootChart._createPartData(baseData, partRole, dataPartValues);
            partitionedDataCache[cacheKey] = partData;
        }

        return partData;
    },

    _createPartData: function(baseData, partRole, dataPartValues) {
        // NOTE: It is not possible to use a normal querySpec query.
        // Under the hood it uses groupBy to filter the results,
        //  and that ends changing the order of datums, to follow
        //  the group operation.
        // Changing order at this level is not acceptable.
        var dataPartDimName = partRole.grouping.singleDimensionName,
            dataPartAtoms   = baseData.dimensions(dataPartDimName).getDistinctAtoms(def.array.to(dataPartValues)),
            where = cdo.querySpecPredicate([def.set({}, dataPartDimName, dataPartAtoms)]);

        return baseData.where(null, {where: where});
    },

    // --------------------

    /**
     * Gets the visible data set of the chart.
     *
     * The chart's data set is that of its main plot.
     *
     * @param {Object} [ka] - Optional keyword arguments object.
     * @param {boolean} [ka.ignoreNulls = true] - Indicates that null datums should be ignored.
     *   Only takes effect if the global option {@link pvc.options.charts.Chart#ignoreNulls} is false.
     * @param {boolean} [ka.inverted = false] - Indicates that an inverted data grouping should be used.
     * @param {cdo.Data} [ka.baseData] - The base data to use. By default the chart's {@link #data} is used.
     *
     * @return {!cdo.Data} The visible data set.
     */
    visibleData: function(ka) {

        var mainPlot = this.plots.main || def.fail.operationInvalid("There is no main plot defined.");

        return this.visiblePlotData(mainPlot, ka);
    },

    /**
     * Gets the visible data set for a given plot, having this chart's `data` as base data.
     *
     * @param {!pvc.visual.Plot} plot - The plot whose visible data is requested.
     *
     * @param {Object} [ka] - Optional keyword arguments object.
     * @param {boolean} [ka.ignoreNulls=true] - Indicates that null datums should be ignored.
     *   Only takes effect if the global option {@link pvc.options.charts.Chart#ignoreNulls} is false.
     * @param {boolean} [ka.inverted=false] - Indicates that an inverted data grouping should be used.
     * @param {cdo.Data} [ka.baseData] - The base data to use. By default the chart's {@link #data} is used.
     *
     * @return {!cdo.Data} The visible data set.
     */
    visiblePlotData: function(plot, ka) {

        var rootChart = this.root;

        var baseData = def.get(ka, 'baseData') || this.data;

        // Read and normalize values (for the cache key).
        var inverted = !!def.get(ka, 'inverted', false);
        var ignoreNulls = !!(rootChart.options.ignoreNulls || def.get(ka, 'ignoreNulls', true));

        var cacheKey = [plot.id, baseData.id, inverted, ignoreNulls].join("|");
        var cache = def.lazy(rootChart, '_visibleDataCache');

        var data = cache[cacheKey];
        if(!data) {
            var partData = rootChart.partData(plot.dataPartValue, baseData);

            var ka2 = {
                visible: true,
                inverted: inverted,
                isNull: ignoreNulls ? false : null
            };

            data = cache[cacheKey] = plot.createData(partData, ka2);
        }

        return data;
    },

    // --------------------

    _initMultiCharts: function() {
        var chart = this;

        // Options objects
        chart.multiOptions = new pvc.visual.MultiChart(chart);
        chart.smallOptions = new pvc.visual.SmallChart(chart);

        var multiOption = chart.multiOptions.option,
            data = chart.visualRoles.multiChart.flatten(chart.data, {visible: true, isNull: null}),
            smallDatas = data.childNodes,
            colCount, rowCount, multiChartMax, colsMax;

        // I - Determine how many small charts to create
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
            // II - Determine basic layout (row and col count)
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

    interpolatable: function() {
        var plotList = this.plotList;
        return !!plotList && plotList.some(function(p) { return p.interpolatable(); });
    },

    _interpolate: function(hasMultiRole) {
        if(!this.interpolatable()) return;

        var dataCells = def
            .query(this.axesList)
            .selectMany(def.propGet('dataCells'))
            .where(function(dataCell) {
                var nim = dataCell.nullInterpolationMode;
                return !!nim && nim !== 'none';
             })
             .distinct(function(dataCell) {
                 return [
                     dataCell.nullInterpolationMode,
                     dataCell.role.grouping.key,
                     dataCell.dataPartValue || ''
                 ].join();
             })
             .array();

        this._eachLeafDatasAndDataCells(hasMultiRole, dataCells, function(dataCell, baseData) {
            dataCell.plot.interpolateDataCell(dataCell, baseData);
        });
    },

    _generateTrends: function(hasMultiRole) {
        var dataPartDimName = this._getDataPartDimName();
        if(!dataPartDimName || !this.plots.trend) return;

        var dataCells = def.query(this.axesList)
                .selectMany(def.propGet('dataCells'))
                .where(def.propGet('trend'))
                .distinct(function(dataCell) {
                     return dataCell.role.prettyId()  + '|' + (dataCell.dataPartValue || '');
                })
                .array();

        var newDatums = [];

        this._eachLeafDatasAndDataCells(hasMultiRole, dataCells, function(dataCell, baseData) {
            dataCell.plot.generateTrendsDataCell(newDatums, dataCell, baseData);
        });

        if(newDatums.length > 0) {
            this.data.owner.add(newDatums);
        }
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
            for(var c = 0; c < C; c++) f.call(x, dataCells[c], leafData, c, d);
        }
    },

    _getTrendDataPartAtom: function() {
        var dataPartDimName = this._getDataPartDimName();
        if(dataPartDimName) return this.data.owner.dimensions(dataPartDimName).intern('trend');
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
        if(!this.resultset.length) this.log.warn("Resultset is empty");

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
        if(!this.metadata.length) this.log.warn("Metadata is empty");

        return this;
    }

});

