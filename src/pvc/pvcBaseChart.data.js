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
        var parent = this.parent;
        if(parent) {
            this.dataEngine =
            this.data = options.data ||
                        def.fail.argumentRequired('options.data');            
        }
    },
    
    _checkNoDataI: function(){
        // Child charts are created to consume *existing* data
        if (!this.parent) {
            
            // If we don't have data, we just need to set a "no data" message
            // and go on with life.
            if(!this.allowNoData && this.resultset.length === 0) {
                /*global NoDataException:true */
                throw new NoDataException();
            }
        }
    },
    
    _checkNoDataII: function(){
        // Child charts are created to consume *existing* data
        if (!this.parent) {
            
            // If we don't have data, we just need to set a "no data" message
            // and go on with life.
            if(!this.allowNoData && (!this.data || !this.data.count())) {
                /*global NoDataException:true */
                throw new NoDataException();
            }
        }
    },
    
    /**
     * Initializes the data engine and roles
     */
    _initData: function(keyArgs) {
        if(!this.parent) {
            var data = this.data;
            if(!data || def.get(keyArgs, 'reloadData', true)) {
               this._onLoadData();
            } else {
                data.clearVirtuals();
                data.disposeChildren();
            }
        }

        delete this._partData;
        
        if(pvc.debug >= 3){
            this._log(this.data.getInfo());
        }
    },

    _onLoadData: function(){
        var data = this.data;
        var options = this.options;
        var dataPartDimName = this._getDataPartDimName();
        var complexTypeProj = this._complexTypeProj;
        var translOptions   = this._createTranslationOptions(dataPartDimName);
        var translation     = this._createTranslation(translOptions);
        
        if(pvc.debug >= 3){
            translation.logSource();
        }
        
        if(!data){
            // Now the translation can also configure the type
            translation.configureType();
            
            // If the the dataPart dimension isn't being read or calculated
            // its value must be defaulted to 0.
            if(dataPartDimName && !complexTypeProj.isReadOrCalc(dataPartDimName)){
                this._addDefaultDataPartCalculation(dataPartDimName);
            }
        }
        
        // ----------
        // Roles are bound before actually loading data.
        // i) roles add default properties to dimensions bound to them
        // ii) in order to be able to filter datums
        //     whose "every dimension in a measure role is null".
        //
        // TODO: check why PRE is done only on createVersion 1 and this one 
        // is done on every create version
        this._bindVisualRolesPostI();
        
        // Setup the complex type from complexTypeProj;
        var complexType;
        if(!data){
            complexType = new pvc.data.ComplexType();
            complexTypeProj.configureComplexType(complexType, translOptions);
        } else {
            complexType = data.type;
        }

        this._bindVisualRolesPostII(complexType);
        
        if(pvc.debug >= 10){
            this._log(complexType.describe());
        }
        
        if(pvc.debug >= 3){
            this._logVisualRoles();
        }

        // ----------

        if(!data) {
            data =
                this.dataEngine = // V1 property
                this.data = new pvc.data.Data({
                    type:     complexType,
                    labelSep: options.groupedLabelSep
                });
        } // else TODO: assert complexType has not changed...
        
        // ----------

        var loadKeyArgs = {
            where:  this._getLoadFilter(),
            isNull: this._getIsNullDatum()
        };
        
        var resultQuery = translation.execute(data);
        
        data.load(resultQuery, loadKeyArgs);
    },
    
    _createComplexTypeProject: function(){
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
        if(dataPartDimName){
            complexTypeProj.setDim(dataPartDimName);
            
            this._addPlot2SeriesDataPartCalculation(complexTypeProj, dataPartDimName);
        }
        
        // Add specified calculations
        var calcSpecs = options.calculations;
        if(calcSpecs){
            calcSpecs.forEach(function(calcSpec){
                complexTypeProj.setCalc(calcSpec);
            });
        }
        
        return complexTypeProj;
    },
    
    _getLoadFilter: function(){
        if(this.options.ignoreNulls) {
            var me = this;
            return function(datum){
                var isNull = datum.isNull;
                
                if(isNull && pvc.debug >= 4){
                    me._info("Datum excluded.");
                }
                
                return !isNull;
            };
        }
    },
    
    _getIsNullDatum: function(){
        var measureDimNames = this.measureDimensionsNames(),
            M = measureDimNames.length;
        if(M) {
            // Must have at least one measure role dimension not-null
            return function(datum){
                var atoms = datum.atoms;
                for(var i = 0 ; i < M ; i++){
                    if(atoms[measureDimNames[i]].value != null){
                        return false;
                    }
                }

                return true;
            };
        }
    },
    
    _createTranslation: function(translOptions){
        var TranslationClass = this._getTranslationClass(translOptions);
        
        return new TranslationClass(this, this._complexTypeProj, this.resultset, this.metadata, translOptions);
    },
    
    _getTranslationClass: function(translOptions){
        return translOptions.crosstabMode ? 
                pvc.data.CrosstabTranslationOper : 
                pvc.data.RelationalTranslationOper;
    },
    
    _createTranslationOptions: function(dataPartDimName){
        var options = this.options;
        
        var dataOptions = options.dataOptions || {};
        
        var dataSeparator = options.dataSeparator;
        if(dataSeparator === undefined){
            dataSeparator = dataOptions.separator;
        }
        
        var dataMeasuresInColumns = options.dataMeasuresInColumns;
        if(dataMeasuresInColumns === undefined){
            dataMeasuresInColumns = dataOptions.measuresInColumns;
        }
        
        var dataCategoriesCount = options.dataCategoriesCount;
        if(dataCategoriesCount === undefined){
            dataCategoriesCount = dataOptions.categoriesCount;
        }
        
        var plot2 = options.plot2;
        
        var valueFormat = options.valueFormat,
            valueFormatter;
        if(valueFormat && valueFormat !== this.defaults.valueFormat){
            valueFormatter = function(v) {
                return v != null ? valueFormat(v) : "";
            };
        }
        
        var secondAxisIdx;
        if(plot2 && this._allowV1SecondAxis && (this.compatVersion() <= 1)){
            secondAxisIdx = pvc.parseDistinctIndexArray(options.secondAxisIdx) || -1;
        }
        
        return {
            compatVersion:     this.compatVersion(),
            plot2SeriesIndexes: secondAxisIdx,
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
            valueNumberFormatter: valueFormatter
        };
    },
    
    _addPlot2SeriesDataPartCalculation: function(complexTypeProj, dataPartDimName){
        if(this.compatVersion() <= 1){
            return;
        }
        
        var options = this.options;
        var serRole = this._serRole;
        
        var plot2Series = (serRole != null) && 
                          options.plot2 && 
                          options.plot2Series && 
                          def.array.as(options.plot2Series);
        if(!plot2Series || !plot2Series.length){
            return;
        }
        
        var inited = false;
        var plot2SeriesSet = def.query(plot2Series).uniqueIndex();
        var dimNames, dataPartDim, part1Atom, part2Atom;
        
        complexTypeProj.setCalc({
            names: dataPartDimName,
            
            calculation: function(datum, atoms){
                if(!inited){
                    // LAZY init
                    if(serRole.isBound()){
                        dimNames    = serRole.grouping.dimensionNames();
                        dataPartDim = datum.owner.dimensions(dataPartDimName);
                    }
                    inited = true;
                }
                
                if(dataPartDim){
                    var seriesKey = pvc.data.Complex.values(datum, dimNames).join(',');
                    
                    atoms[dataPartDimName] = 
                        def.hasOwnProp.call(plot2SeriesSet, seriesKey) ?
                           (part2Atom || (part2Atom = dataPartDim.intern("1"))) :
                           (part1Atom || (part1Atom = dataPartDim.intern("0")));
                }
            }
        });
    },
    
    _addDefaultDataPartCalculation: function(dataPartDimName){
        var dataPartDim, part1Atom;
        
        this._complexTypeProj.setCalc({
            names: dataPartDimName,
            
            calculation: function(datum, atoms){
                if(!dataPartDim){
                    dataPartDim = datum.owner.dimensions(dataPartDimName);
                }
                
                atoms[dataPartDimName] = part1Atom || 
                    (part1Atom = dataPartDim.intern("0"));
            }
        });
    },
    
    partData: function(dataPartValues){
        if(!this._partData){
            if(!this._dataPartRole || !this._dataPartRole.grouping){
                /* Undefined or unbound */
                return this._partData = this.data;
            }
            
            // Visible and not
            this._partData = this.data.flattenBy(this._dataPartRole);
        }
        
        if(!dataPartValues || !this._dataPartRole || !this._dataPartRole.grouping){
            return this._partData;
        }
        
        var dataPartDimName = this._dataPartRole.firstDimensionName();
        
        if(def.array.is(dataPartValues)){
            if(dataPartValues.length > 1){
                return this._partData.where([
                             def.set({}, dataPartDimName, dataPartValues)
                         ]);
            }
            
            dataPartValues = dataPartValues[0];
        }
        
        // TODO: should, at least, call some static method of Atom to build a global key
        var child = this._partData._childrenByKey[/*dataPartDimName + ':' +*/ dataPartValues + ''];
        if(!child){
            // NOTE: 
            // This helps, at least, the ColorAxis.dataCells setting
            // the .data property, in a time where there aren't yet any datums of
            // the 'trend' data part value.
            // So we create a dummy empty place-holder child here,
            // so that when the trend datums are added they end up here,
            // and not in another new Data...
            var dataPartCell = {
                v: dataPartValues
            };
            
            // TODO: HACK: To make trend label fixing work in multi-chart scenarios... 
            if(dataPartValues === 'trend'){
                var firstTrendAtom = this._firstTrendAtomProto;
                if(firstTrendAtom){
                    dataPartCell.f = firstTrendAtom.f;
                }
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
    
    _generateTrends: function(){
        if(this._dataPartRole){
            
            def
            .query(def.own(this.axes))
            .selectMany(function(axis){ return axis.dataCells; })
            .where(function(dataCell){ return !!dataCell.trend; })
             .distinct(function(dataCell){
                 return dataCell.role.name  + '|' +
                       (dataCell.dataPartValue || '');
             })
             .each(this._generateTrendsDataCell, this);
        }
    },
    
    _interpolate: function(){
        def
        .query(def.own(this.axes))
        .selectMany(function(axis){ return axis.dataCells; })
        .where(function(dataCell){
            var nim = dataCell.nullInterpolationMode;
            return !!nim && nim !== 'none'; 
         })
         .distinct(function(dataCell){
             return dataCell.role.name  + '|' +
                   (dataCell.dataPartValue || '');
         })
         .each(this._interpolateDataCell, this);
    },
    
    _interpolateDataCell: function(dataCell){
    },
    
    _generateTrendsDataCell: function(dataCell){
    },
    
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

