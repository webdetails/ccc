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
    
    _checkNoData: function(){
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
        var data = this.data,
            options = this.options,
            complexType     = data ? data.type : new pvc.data.ComplexType(),
            translOptions   = this._createTranslationOptions(),
            translation     = this._createTranslation(complexType, translOptions),
            dataPartDimName = translOptions.dataPartDimName,
            plot2Series;

        if(pvc.debug >= 3){
            translation.logSource();
        }
        
        var addDataPartDefaultCalc = false;
        if(!data){
            /* LOAD */
            
            // TODO
            // By now, the translation has not yet defined 
            // dimensions of options.dimensions
            // (which probably should be done here, anyway...)
            // So calculations may refer to dimensions in options.dimensions...
            // and these will end up being defined with very default values in addCalculation...
            
            /* REGISTER CALCULATIONS */
            // Currently translOptions has what is needed to
            // pass to pvc.data.DimensionType.extendSpec...
            var calcSpecs = options.calculations;
            if(calcSpecs){
                calcSpecs.forEach(function(calcSpec){
                    complexType.addCalculation(calcSpec, translOptions);
                });
            }
            
            // Is the role dataPart defined, 
            // and, if so, is it preBound?
            // What is the default or preBound dim name?
            if(dataPartDimName){
                if(!complexType.isCalculated(dataPartDimName)){
                    // Axis2Series works by adding a calculation to 
                    // the dataPart role (to classify in '0' or '1' dataPart),
                    // so using it requires registering the dataPart dimension
                    plot2Series = (options.plot2 || options.secondAxis) && options.plot2Series;
                    if(plot2Series){
                        // Also, doing now, 
                        // prevents readers from reading into it.
                        this._addDataPartDimension(complexType, dataPartDimName);
                    }
                }
            }
            
            // Now the translation can configure the type as well
            translation.configureType();
            
            if(!plot2Series && dataPartDimName){
                // If the user isn't explicitly reading the dimension,
                // then the dimension must be created and its value defaulted.
                
                addDataPartDefaultCalc = !complexType.dimensions(dataPartDimName, {assertExists: false});
                if(addDataPartDefaultCalc){
                    this._addDataPartDimension(complexType, dataPartDimName);
                }
            }
        }
        
        if(pvc.debug >= 3){
            this._log(complexType.describe());
        }

        // ----------
        // Roles are bound before actually loading data,
        // in order to be able to filter datums
        // whose "every dimension in a measure role is null".
        // TODO: check why PRE is done only on createVersion 1 and this one 
        // is done on every create version
        this._bindVisualRolesPost(complexType);

        if(pvc.debug >= 3){
            this._logVisualRoles();
        }

        // ----------

        if(!data) {
            if(plot2Series){
                this._addPlot2SeriesCalculation(complexType, plot2Series, dataPartDimName);
            } else if(addDataPartDefaultCalc) {
                this._addDefaultDataPartCalculation(complexType, dataPartDimName);
            }
            
            data =
                this.dataEngine =
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
        
        data.load(translation.execute(data), loadKeyArgs);
    },
    
    _addDataPartDimension: function(complexType, dataPartDimName){
        if(!complexType.dimensions(dataPartDimName, {assertExists: false})){
            var dimSpec = pvc.data.DimensionType.extendSpec(dataPartDimName);
            
            complexType.addDimension(dataPartDimName, dimSpec);
            return true;
        }
    },
    
    _getLoadFilter: function(){
        if(this.options.ignoreNulls) {
            var me = this;
            return function(datum){
                var isNull = datum.isNull;
                
                if(isNull && pvc.debug >= 4){
                    me._log("Datum excluded.");
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
    
    _createTranslation: function(complexType, translOptions){
        var TranslationClass = this._getTranslationClass(translOptions);
        
        return new TranslationClass(this, complexType, this.resultset, this.metadata, translOptions);
    },
    
    _getTranslationClass: function(translOptions){
        return translOptions.crosstabMode ? 
                pvc.data.CrosstabTranslationOper : 
                pvc.data.RelationalTranslationOper;
    },
    
    _createTranslationOptions: function(){
        var options = this.options;
        var dataOptions = options.dataOptions || {};
        var plot2 = options.plot2 || options.secondAxis;
        
        var valueFormat = options.valueFormat,
            valueFormatter;
        if(valueFormat && valueFormat !== this.defaults.valueFormat){
            valueFormatter = function(v) {
                return v != null ? valueFormat(v) : "";
            };
        }

        return {
            compatVersion:     this.compatVersion(),
            plot2SeriesIndexes: (!plot2 || options.plot2Series) ? null : options.secondAxisIdx,
            seriesInRows:      options.seriesInRows,
            crosstabMode:      options.crosstabMode,
            isMultiValued:     options.isMultiValued,
            dataPartDimName:   this._getDataPartDimName(),
            dimensionGroups:   options.dimensionGroups,
            dimensions:        options.dimensions,
            readers:           options.readers,

            measuresIndexes:   options.measuresIndexes, // relational multi-valued

            multiChartIndexes: options.multiChartIndexes,

            // crosstab
            separator:         dataOptions.separator,
            measuresInColumns: dataOptions.measuresInColumns,
            measuresIndex:     dataOptions.measuresIndex || dataOptions.measuresIdx, // measuresInRows
            measuresCount:     dataOptions.measuresCount || dataOptions.numMeasures, // measuresInRows
            categoriesCount:   dataOptions.categoriesCount,

            // Timeseries *parse* format
            isCategoryTimeSeries: options.timeSeries,

            timeSeriesFormat:     options.timeSeriesFormat,
            valueNumberFormatter: valueFormatter
        };
    },
    
    _addPlot2SeriesCalculation: function(complexType, plot2Series, dataPartDimName){
        var serRole = this._serRole;
        if(serRole && serRole.isBound()){
            
            var plot2SeriesSet = def.query(plot2Series).uniqueIndex();
            var dimNames = serRole.grouping.dimensionNames();
            var dataPartDim, part1Atom, part2Atom;
            
            complexType.addCalculation({
                names: dataPartDimName,
                
                calculation: function(datum, atoms){
                    if(!dataPartDim){
                        dataPartDim = datum.owner.dimensions(dataPartDimName);
                    }
                    
                    var seriesKey = pvc.data.Complex.values(datum, dimNames).join(',');
                    
                    atoms[dataPartDimName] = 
                        def.hasOwnProp.call(plot2SeriesSet, seriesKey) ?
                           (part2Atom || (part2Atom = dataPartDim.intern("1"))) :
                           (part1Atom || (part1Atom = dataPartDim.intern("0")));
                }
            });
        }
    },
    
    _addDefaultDataPartCalculation: function(complexType, dataPartDimName){
        var dataPartDim, part1Atom;
        
        complexType.addCalculation({
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
        var child = this._partData._childrenByKey[dataPartDimName + ':' + dataPartValues];
        if(!child){
            // NOTE: 
            // This helps, at least, the ColorAxis.dataCells setting
            // the .data property, in a time where there aren't yet any datums of
            // the 'trend' data part value.
            // So we create a dummy empty place-holder child here,
            // so that when the trend datums are added they end up here,
            // and not in another new Data...
            child = new pvc.data.Data({
                parent: this._partData,
                atoms:  def.set({}, dataPartDimName, dataPartValues), 
                datums: []
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
            .where(function(dataCell){
                var trendType = dataCell.trendType;
                return !!trendType && trendType !== 'none'; 
             })
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

