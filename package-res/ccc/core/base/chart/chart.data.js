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
        if(this.parent)
            //noinspection JSDeprecatedSymbols
            this.dataEngine = this.data = options.data || def.fail.argumentRequired('options.data');
    },

    _checkNoDataI: function() {
        // Child charts are created to consume *existing* data
        // If we don't have data, we just need to set a "no data" message and go on with life.
        if(!this.allowNoData && !this.resultset.length)
            /*global NoDataException:true */
            throw new NoDataException();
    },

    _checkNoDataII: function() {
        // Child charts are created to consume *existing* data
        // If we don't have data, we just need to set a "no data" message and go on with life.
        if(!this.allowNoData && (!this.data || !this.data.count())) {

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
                this._loadData();
            } else if(def.get(ka, 'reloadData', true)) {
                // This **replaces** existing data (datums also existing in the new data are kept)
                this._reloadData();
            } else if(def.get(ka, 'addData', false)) {
                // Dispose all data children and linked children (recreated as well)
                // And clears caches as well.
                data.disposeChildren();

                // Remove virtual datums (they are regenerated each time)
                data.clearVirtuals();

                // CDF603 
                // This adds data new data without necessarily removing the previous
                this._addData();
            } else {
                // Existing data is kept.
                // This is used for re-layouting only.
                // Yet...
                
                // Dispose all data children and linked children (recreated as well)
                // And clears caches as well.
                data.disposeChildren();

                // Remove virtual datums (they are regenerated each time)
                data.clearVirtuals();
                
                // CDF603
                this._initRolesAxes();
            }
        }else this._initRolesAxes(); // CDF603

        // CDF603
        // can only be done after axes creation
        if(this.slidingWindow) {
            this.slidingWindow.setAxisDefaults(); 
        } 

        // Cached data stuff
        delete this._partsDataCache;
        delete this._visibleDataCache;

        if(def.debug >= 3) this.log(this.data.getInfo());
    },
 

    // CDF603
    // Auxiliar function to initialize axes prior to the datums distribution
    _initRolesAxes: function(){

        hasMultiRole = this.visualRoles.multiChart.isBound();
        this._initAxes(hasMultiRole);

    },

    // CDF603
    // @virtual
   _createScoringOptions: function(options) {
         this._createSlidingWindow();
         if(this.slidingWindow){
            var sw = this.slidingWindow;
            //override default scoring functions
            this.data.score = function(datum) { sw.score.call( sw , datum ); }
            this.data.select = function(allData, remove) { sw.select.call( sw , allData, remove ); }
            return this;
        }
    },

    // CDF603
    // @virtual
    _createSlidingWindow: function() {

        var sw = this.options.slidingWindow;

        if(this.slidingWindow){ this.slidingWindow.delete; }

        if(sw) {

            sw = new pvc.visual.SlidingWindow(this);
            this.slidingWindow = sw;
            sw._initFromOptions();

        } 
        return this;
    },

    _loadData: function() {
        /*jshint expr:true*/
        if(DEBUG) (!this.data && !this._translation) || def.assert("Invalid state.");

        var options = this.options,
            dimsOptions = this._createDimensionsOptions(options),

            // Create and configure the complex type project
            ctp = this._createComplexTypeProject(),

            // Create, configure and begin the visual roles binder.
            binder = pvc.visual.rolesBinder()
                .dimensionsOptions(dimsOptions)
                .logger (this._createLogger())
                .context(this._createVisualRolesContext())
                .complexTypeProject(ctp)
                .begin(),

            // The chart-level `dataPart` visual role may have been explicitly bound
            // to a dimension whose name is not "dataPart".
            //
            // By now, the actual name of the dimension playing the `dataPart` role is already known.
            // Check if data part dimension is actually needed:
            // a) calculated by series values to satisfy plot2,
            // b) for trending.
            dataPartDimName = this._getDataPartDimName(/*useDefault*/true),

            complexType, data, translation;

        if(!this._maybeAddPlot2SeriesDataPartCalc(ctp, dataPartDimName)) {
            if(!this.visualRoles.dataPart.isPreBound() && this.plots.trend)
                ctp.setDim(dataPartDimName);
        }

        // If there are any columns in the supplied data.
        // TODO: the complexTypeProj instance remains alive in the persisted translation object,
        // although probably it is not needed anymore, even for reloads...
        if(this.metadata.length)
            translation = this._translation =
                this._createTranslation(ctp, dimsOptions, dataPartDimName);

        // If the the dataPart dimension is defined, but is not being read or calculated,
        // then default its value to '0'.
        if(ctp.hasDim(dataPartDimName) && !ctp.isReadOrCalc(dataPartDimName))
            this._addDefaultDataPartCalculation(ctp, dataPartDimName);

        complexType = binder.end();

        data =
            this.dataEngine = // Legacy V1 property
            this.data = new cdo.Data({
                type:     complexType,
                labelSep: options.groupedLabelSep,
                keySep:   options.dataOptions.separator
            });

        var isMultiChartOverflowRetry = this._isMultiChartOverflowClipRetry;
        
        // CDF603
        this._initRolesAxes();
        this._createScoringOptions( this.options );

        // ----------

        if(translation) this._loadDataCore(data, translation);
    },

    _reloadData: function() {
        /*jshint expr:true*/

        var data = this.data, translation = this._translation;

        (data && translation) || def.assert("Invalid state.");

        // Pass new resultset to the translation (metadata is maintained!).
        translation.setSource(this.resultset);

        if(def.debug >= 3) this.log(translation.logSource());

        var isMultiChartOverflowRetry = this._isMultiChartOverflowClipRetry;

        // CDF603
        this._initRolesAxes();
        this._loadDataCore(data, translation);
    },

    // CDF603
    // incremental load: uses isAdditive option
    _addData: function() {
        /*jshint expr:true*/

        var data = this.data, translation = this._translation;

        (data && translation) || def.assert("Invalid state.");

        // Pass new resultset to the translation (metadata is maintained!).
        translation.setSource(this.resultset);

        if(def.debug >= 3) this.log(translation.logSource());

        var isMultiChartOverflowRetry = this._isMultiChartOverflowClipRetry;
        
        this._initRolesAxes();
        this._loadDataCore(data, translation, { isAdditive : true });  
    },

    // CDF603
    // ka - arguments
    _loadDataCore: function(data, translation, ka) {
        var loadKeyArgs = $.extend({}, ka, {where: this.options.dataOptions.where, isNull: this._getIsNullDatum()});
        var readQuery = translation.execute(data);

        data.load(readQuery, loadKeyArgs);

    },

    _createVisualRolesContext: function() {
        var options  = this.options,
            chartRolesOptions = options.visualRoles,
            roles    = this.visualRoles,
            roleList = this.visualRoleList,
            context  = function(rn) { return def.getOwn(roles, rn); };

        context.query = function() { return def.query(roleList); };

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

        return context;
    },

    _createLogger: function() {
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
    _createComplexTypeProject: function() {
        var options = this.options,
            complexTypeProj = new cdo.ComplexTypeProject(options.dimensionGroups),
            userDimsSpec = options.dimensions;

        // `userDimsSpec` can be null.
        for(var dimName in userDimsSpec) complexTypeProj.setDim(dimName, userDimsSpec[dimName]);

        var calcSpecs = options.calculations;
        if(calcSpecs) calcSpecs.forEach(complexTypeProj.setCalc, complexTypeProj);

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
        var translOptions    = this._createTranslationOptions(dimsOptions, dataPartDimName),
            TranslationClass = this._getTranslationClass(translOptions),
            translation      =
                new TranslationClass(complexTypeProj, this.resultset, this.metadata, translOptions);

        if(def.debug >= 3) this.log(translation.logSource()), this.log(translation.logTranslatorType());

        translation.configureType();

        if(def.debug >= 3) this.log(translation.logLogicalRow());

        return translation;
    },

    _getTranslationClass: function(translOptions) {
        return translOptions.crosstabMode
            ? cdo.CrosstabTranslationOper
            : cdo.RelationalTranslationOper;
    },

    // Creates the arguments required for cdo.DimensionType.extendSpec
    _createDimensionsOptions: function(options) {
        return {
            isCategoryTimeSeries: options.timeSeries,
            formatProto:          this._format,
            timeSeriesFormat:     options.timeSeriesFormat,
            dimensionGroups:      options.dimensionGroups
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
            seriesDimNames, dataPartDim, part1Atom, part2Atom, buildSeriesKey,
            init = function(datum) {
                // LAZY init
                if(serRole.isBound()) {
                    seriesDimNames = serRole.grouping.dimensionNames();
                    dataPartDim    = datum.owner.dimensions(dataPartDimName);
                    if(seriesDimNames.length > 1) {
                        buildSeriesKey = cdo.Complex.compositeKey;
                    } else {
                        seriesDimNames = seriesDimNames[0];
                        buildSeriesKey = function(dat, serDimName) { return dat.atoms[serDimName].key; };
                    }
                }
                init = null;
            };

        complexTypeProj.setCalc({
            names: dataPartDimName,
            calculation: function(datum, atoms) {
                init && init(datum);
                if(dataPartDim) { // when serRole is unbound
                    var seriesKey = buildSeriesKey(datum, seriesDimNames);
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

        if(this.parent) return this.root.partData(dataPartValues, baseData);

        // Is the visual role undefined or unbound?
        // If so, ignore dataPartValues. It should be empty, but in some cases it comes with ['0'], due to shared code.
        var partRole = this.visualRoles.dataPart;
        if(!partRole || !partRole.isBound()) return baseData;

        // Try get from cache.
        var cacheKey = '\0' + baseData.id + ':' + def.nullyTo(dataPartValues, ''), // Counting on Array.toString() implementation, when an array.
            partitionedDataCache = def.lazy(this, '_partsDataCache'),
            partData = partitionedDataCache[cacheKey];
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
        var dataPartDimName = partRole.lastDimensionName(),
            dataPartAtoms   = baseData.dimensions(dataPartDimName).getDistinctAtoms(def.array.to(dataPartValues)),
            where = cdo.whereSpecPredicate([def.set({}, dataPartDimName, dataPartAtoms)]);

        return baseData.where(null, {where: where});
    },

    // --------------------

    /*
     * Obtains the chart's visible data
     * grouped according to the charts "main grouping".
     *
     * The chart's main grouping is that of its main plot.
     *
     * @param {string|string[]} [dataPartValue=null] The desired data part value or values.
     * @param {object} [ka=null] Optional keyword arguments object.
     * @param {boolean} [ka.ignoreNulls=true] Indicates that null datums should be ignored.
     * Only takes effect if the global option {@link pvc.options.charts.Chart#ignoreNulls} is false.
     * @param {boolean} [ka.inverted=false] Indicates that the inverted data grouping is desired.
     * @param {cdo.Data} [baseData] The base data to use. By default the chart's {@link #data} is used.
     *
     * @type cdo.Data
     */
    visibleData: function(dataPartValue, ka) {
        var mainPlot = this.plots.main ||
            def.fail.operationInvalid("There is no main plot defined.");

        return this.visiblePlotData(mainPlot, dataPartValue, ka);
    },

    visiblePlotData: function(plot, dataPartValue, ka) {
        var baseData = def.get(ka, 'baseData') || this.data;
        if(this.parent) {
            // Caching is done at the root chart.
            ka = ka ? Object.create(ka) : {};
            ka.baseData = baseData;
            return this.root.visiblePlotData(plot, dataPartValue, ka);
        }

        // Normalize values for the cache key.
        var inverted    = !!def.get(ka, 'inverted', false),
            ignoreNulls = !!(this.options.ignoreNulls || def.get(ka, 'ignoreNulls', true)),

            // dataPartValue: relying on Array#toString, when an array
            key = [plot.id, baseData.id, inverted, ignoreNulls, dataPartValue != null ? dataPartValue : null]
                    .join("|"),
            cache = def.lazy(this, '_visibleDataCache'),
            data  = cache[key];

        if(!data) {
            var partData = this.partData(dataPartValue, baseData);

            ka = ka ? Object.create(ka) : {};
            ka.visible = true;
            ka.isNull  = ignoreNulls ? false : null;
            data = cache[key] = plot.createVisibleData(partData, ka);
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
                     dataCell.role.grouping.id,
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
                 return dataCell.role.name  + '|' + (dataCell.dataPartValue || '');
            })
            .array();

        var newDatums = [];

        this._eachLeafDatasAndDataCells(hasMultiRole, dataCells, function(dataCell, baseData) {
            dataCell.plot.generateTrendsDataCell(newDatums, dataCell, baseData);
        });

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
    },

});

