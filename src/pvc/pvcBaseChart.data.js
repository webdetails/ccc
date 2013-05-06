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
    
    /**
     * The resulting data of 
     * grouping {@link #data} by the data part role, 
     * when bound.
     * 
     * @type pvc.data.Data
     */
    _partData: null,


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
        }
    },
    
    _checkNoDataI: function() {
        // Child charts are created to consume *existing* data
        // If we don't have data, we just need to set a "no data" message and go on with life.
        if (!this.parent && !this.allowNoData && this.resultset.length === 0) {
            /*global NoDataException:true */
            throw new NoDataException();
        }
    },
    
    _checkNoDataII: function() {
        // Child charts are created to consume *existing* data
        // If we don't have data, we just need to set a "no data" message and go on with life.
        if (!this.parent && !this.allowNoData && (!this.data || !this.data.count())) {
            
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
                
                // Remove virtual datums (they are regenerated each time)
                data.clearVirtuals();
                
                // Dispose all data children and linked children (recreated as well)
                data.disposeChildren();
            }
        }
        
        // Cached data stuff
        delete this._partData;
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
        
        var options  = this.options;
        
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
        if(this.options.ignoreNulls) {
            var me = this;
            return function(datum) {
                var isNull = datum.isNull;
                if(isNull && pvc.debug >= 4) { me._info("Datum excluded."); }
                return !isNull;
            };
        }
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
        
        var plot2 = options.plot2;
        
        var valueFormat = options.valueFormat,
            valueFormatter;
        if(valueFormat && valueFormat !== this.defaults.valueFormat) {
            valueFormatter = function(v) { return v != null ? valueFormat(v) : ""; };
        }
        
        var plot2Series, plot2DataSeriesIndexes;
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

            timeSeriesFormat:     options.timeSeriesFormat,
            valueNumberFormatter: valueFormatter,
            ignoreMetadataLabels:  dataIgnoreMetadataLabels
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
    
    partData: function(dataPartValues) {
        var partRole = this._dataPartRole;
        
        if(!this._partData) {
            // Undefined or unbound 
            if(!partRole || !partRole.grouping) { return this._partData = this.data; }
            
            // Visible and not
            this._partData = partRole.flatten(this.data);
        }
        
        if(!dataPartValues || !partRole || !partRole.grouping) { return this._partData; }
        
        var dataPartDimName = partRole.firstDimensionName();
        
        if(def.array.is(dataPartValues)) {
            if(dataPartValues.length > 1) {
                return this._partData.where([def.set({}, dataPartDimName, dataPartValues)]);
            }
            
            dataPartValues = dataPartValues[0];
        }
        
        // TODO: should, at least, call some static method of Atom to build a global key
        var child = this._partData._childrenByKey[/*dataPartDimName + ':' +*/ dataPartValues + ''];
        if(!child) {
            // NOTE: 
            // This helps, at least, the ColorAxis.dataCells setting
            // the .data property, in a time where there aren't yet any datums of
            // the 'trend' data part value.
            // So we create a dummy empty place-holder child here,
            // so that when the trend datums are added they end up here,
            // and not in another new Data...
            var dataPartCell = {v: dataPartValues};
            
            // TODO: HACK: To make trend label fixing work in multi-chart scenarios... 
            if(dataPartValues === 'trend') {
                var firstTrendAtom = this._firstTrendAtomProto;
                if(firstTrendAtom) { dataPartCell.f = firstTrendAtom.f; }
            }
            
            child = new pvc.data.Data({
                parent:   this._partData,
                atoms:    def.set({}, dataPartDimName, dataPartCell), 
                dimNames: [dataPartDimName],
                datums:   []
                // TODO: index
            });
        }
        return child;
    },

    // --------------------
    
    /*
     * Obtains the chart's visible data
     * grouped according to the charts "main grouping".
     * 
     * @param {string|string[]} [dataPartValue=null] The desired data part value or values.
     * @param {object} [ka=null] Optional keyword arguments object.
     * @param {boolean} [ka.ignoreNulls=true] Indicates that null datums should be ignored.
     * @param {boolean} [ka.inverted=false] Indicates that the inverted data grouping is desired.
     * 
     * @type pvc.data.Data
     */
    visibleData: function(dataPartValue, ka) {
        var ignoreNulls = def.get(ka, 'ignoreNulls', true);
        var inverted    = def.get(ka, 'inverted', false);
        
        // If already globally ignoring nulls, there's no need to do it explicitly anywhere
        if(ignoreNulls && this.options.ignoreNulls) { ignoreNulls = false; }
        
        var cache = def.lazy(this, '_visibleDataCache');
        var key   = inverted + '|' + ignoreNulls + '|' + dataPartValue; // relying on Array#toString, when an array
        var data  = cache[key];
        if(!data) {
            ka = ka ? Object.create(ka) : {};
            ka.ignoreNulls = ignoreNulls;
            data = cache[key] = this._createVisibleData(dataPartValue, ka);
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
     * @param {string|string[]} [dataPartValue=null] The desired data part value or values.
     * 
     * @type pvc.data.Data
     * @protected
     * @virtual
     */
    _createVisibleData: function(dataPartValue, ka) {
        var partData = this.partData(dataPartValue);
        if(!partData) { return null; }
        
        // TODO: isn't this buggy? When no series role, all datums are returned, visible or not 
        
        var ignoreNulls = def.get(ka, 'ignoreNulls');
        var serRole = this._serRole;
        return serRole && serRole.grouping ?
               serRole.flatten(partData, {visible: true, isNull: ignoreNulls ? false : null}) :
               partData;
    },
    
    // --------------------
    
    _generateTrends: function() {
        if(this._dataPartRole) {
            def
            .query(def.own(this.axes))
            .selectMany(def.propGet('dataCells'))
            .where(def.propGet('trend'))
            .distinct(function(dataCell) {
                 return dataCell.role.name  + '|' + (dataCell.dataPartValue || '');
            })
            .each(this._generateTrendsDataCell, this);
        }
    },
    
    _interpolate: function() {
        // TODO: add some switch to activate interpolation
        // Many charts do not support it and we're traversing for nothing
        def
        .query(def.own(this.axes))
        .selectMany(def.propGet('dataCells'))
        .where(function(dataCell) {
            var nim = dataCell.nullInterpolationMode;
            return !!nim && nim !== 'none'; 
         })
         .distinct(function(dataCell) {
             return dataCell.role.name  + '|' + (dataCell.dataPartValue || '');
         })
         .each(this._interpolateDataCell, this);
    },
    
    _interpolateDataCell:    function(/*dataCell*/) {},
    _generateTrendsDataCell: function(/*dataCell*/) {},
    
    // ---------------
        
    /**
     * Method to set the data to the chart.
     * Expected object is the same as what comes from the CDA: 
     * {metadata: [], resultset: []}
     */
    setData: function(data, options) {
        this.setResultset(data.resultset);
        this.setMetadata(data.metadata);

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
        
        this.resultset = resultset;
        if (!resultset.length) {
            this._log("Warning: Resultset is empty");
        }
        
        return this;
    },

    /**
     * Sets the metadata that, optionally, 
     * will give more information for building the chart.
     */
    setMetadata: function(metadata) {
        /*jshint expr:true */
        !this.parent || def.fail.operationInvalid("Can only set resultset on root chart.");
        
        this.metadata = metadata;
        if (!metadata.length) {
            this._log("Warning: Metadata is empty");
        }
        
        return this;
    }
});

