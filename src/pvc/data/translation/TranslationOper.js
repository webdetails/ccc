
/**
 * Initializes a translation operation.
 * 
 * @name pvc.data.TranslationOper
 * @class Represents one translation operation 
 * from some data source format to the list of atoms format.
 * 
 * @property {pvc.data.ComplexType} complexType The complex type that represents the translated data.
 * @property {pvc.data.Data} data The data object which will be loaded with the translation result.
 * @property {object} source The source object, of some format, being translated.
 * @property {object} metadata A metadata object describing the source.
 * @property {object} options  An object with translation options.
 * 
 * @constructor
 * @param {pvc.data.ComplexType} complexType The complex type that will represent the translated data.
 * @param {object} source The source object, of some format, to be translated.
 * The source is not modified.
 * @param {object} [metadata] A metadata object describing the source.
 * @param {object} [options] An object with translation options.
 * Options are translator specific.
 * TODO: missing common options here
 */
def.type('pvc.data.TranslationOper')
.init(function(complexType, source, metadata, options){
    this.complexType = complexType;
    this.source   = source;
    this.metadata = metadata || {};
    this.options  = options  || {};
    
    if(pvc.debug >= 3){
        this._logSource();
    }

    this._initType();
})
.add(/** @lends pvc.data.TranslationOper# */{
    
    /**
     * Logs the contents of the source and metadata properties.
     */
    _logSource: def.method({isAbstract: true}),

    /**
     * Obtains the number of fields of the virtual item.
     * <p>
     * The default implementation returns the length of the metadata.
     * </p>
     * 
     * @type number
     * @virtual
     */
    virtualItemSize: function(){
        return this.metadata.length;
    },

    freeVirtualItemSize: function(){
        return this.virtualItemSize() - this._userUsedIndexesCount;
    },

    /**
     * Defines a dimension reader.
     *
     * @param {object} dimReaderSpec A dimensions reader specification.
     *
     * @type undefined
     */
    defReader: function(dimReaderSpec){
        dimReaderSpec || def.fail.argumentRequired('readerSpec');

        var dimNames =  dimReaderSpec.names;
        if(typeof dimNames === 'string'){
            dimNames = dimNames.split(/\s*\,\s*/);
        } else {
            dimNames =  def.array(dimNames);
        }
        
        (dimNames && dimNames.length) || def.fail.argumentRequired('readers.names');

        dimNames.forEach(function(name){
            name || def.fail.argumentRequired('readers[i].names');

            name = name.replace(/^\s*(.+?)\s*$/, "$1"); // trim

            !def.hasOwn(this._userUsedDims, name) || def.fail.argumentInvalid('readers[i].names', "Dimension name '{0}' is already being read.", [name]);
            this._userUsedDims[name] = true;
            this.ensureDimensionType(name);
        }, this);

        // Consumed/Reserved virtual item indexes
        var indexes = def.array(dimReaderSpec.indexes);
        if(indexes) {
            indexes.forEach(this._userUseIndex, this);
        }

        var reader = dimReaderSpec.reader;
        if(!reader) {
            this._userCreateReaders(dimNames, indexes);
        } else {
            this._userRead(this._wrapReader(reader, dimNames), dimNames);
        }
    },

    /**
     * Called once, before {@link #execute},
     * for the translation to configure the complex type (abstract).
     *
     * <p>
     *    If this method is called more than once,
     *    the consequences are undefined.
     * </p>
     *
     * @name pvc.data.TranslationOper#configureType
     * @function
     * @type undefined
     * @virtual
     */
    configureType: def.method({isAbstract: true}),
    
    _initType: function(){
        this._userDimsReaders = [];
        this._userDimsReadersByDim = {};
        this._userItem = [];
        this._userDefDims = {};
        this._userUsedDims = {};
        this._userUsedIndexes = {};
        this._userUsedIndexesCount = 0;
        
        // -------------
        
        var userDimsSpec = this.options.dimensions;
        for(var dimName in userDimsSpec) { // userDimsSpec can be null
            this._userDefDimension(dimName, userDimsSpec[dimName]);
        }
        
        // -------------
        
        var userDimReaders = this.options.readers;
        if(userDimReaders) {
            userDimReaders.forEach(this.defReader, this);
        }

        var multiChartColIndexes = this.options.multiChartColumnIndexes;
        if(multiChartColIndexes != null) {
            this.defReader({names: 'multiChartColumn', indexes: multiChartColIndexes });
        }

        var multiChartRowIndexes = this.options.multiChartRowIndexes;
        if(multiChartRowIndexes != null) {
            this.defReader({names: 'multiChartRow', indexes: multiChartRowIndexes });
        }
    },

    _userDefDimension: function(name, userDimSpec){
        name || def.fail.argumentInvalid('dimensions[i]', "Invalid dimension name.");
        !def.hasOwn(this._userDefDims, name) ||
            def.fail.argumentInvalid('dimensions[i]', "A dimension with name '{0}' is already defined.", [name]);

        this._userDefDims[name] = true;
        this.ensureDimensionType(name, userDimSpec);
    },

    _userUseIndex: function(index){
        index = +index; // to number

        (index >= 0) ||
            def.fail.argumentInvalid('index', "Invalid reader index: '{0}'.", [index]);

        !def.hasOwn(this._userUsedIndexes, index) ||
            def.fail.argumentInvalid('index', "Virtual item index '{0}' is already assigned.", [index]);

        this._userUsedIndexes[index] = true;
        this._userUsedIndexesCount++;
        this._userItem[index] = true;
    },

    _userCreateReaders: function(dimNames, indexes){
        if(!indexes){
            indexes = [];
        }

        // Distribute indexes to names, from left to right
        // Excess indexes go to the last *group* name
        // Missing indexes are padded from available indexes starting from the last provided index
        var I = indexes.length,
            N = dimNames.length,
            dimName;

        if(N > I) {
            // Pad indexes
            var nextIndex = I > 0 ? (indexes[I - 1] + 1) : 0;
            do{
                nextIndex = this._nextAvailableItemIndex(nextIndex);
                indexes[I] = nextIndex;
                this._userUseIndex(nextIndex);

                I++;
            }while(N > I);
        }

        // If they match, it's one-one name <-- index
        var L = (I === N) ? N : (N - 1);

        // The first N-1 names get the first N-1 indexes
        for(var n = 0 ; n < L ; n++) {
            dimName = dimNames[n];
            this._userRead(this._propGet(dimName, indexes[n]), dimName);
        }

        // The last name is the dimension group name that gets all remaining indexes
        if(L < N) {
            // TODO: make a single reader that reads all atoms??
            // Last is a *group* START name
            var splitGroupName = pvc.data.DimensionType.splitDimensionGroupName(dimNames[N - 1]),
                groupName = splitGroupName[0],
                level     = def.nullyTo(splitGroupName[1], 0);

            for(var i = L ; i < I ; i++, level++) {
                dimName = pvc.data.DimensionType.dimensionGroupLevelName(groupName, level);
                if(i > L){ // first name was already registered
                    !def.hasOwn(this._userUsedDims, dimName) ||
                        def.fail.argumentInvalid('readers[i].names', "Dimension name '{0}' of last dimension group name is already being read.", [dimName]);
                    this._userUsedDims[dimName] = true;
                    // propGet ensures dim exists
                }

                this._userRead(this._propGet(dimName, indexes[i]), dimName);
            }
        }
    },

    _userRead: function(reader, dimNames){
        def.isFun(reader) ||
            def.fail.argumentInvalid('reader', "Reader must be a function.");
        
        if(def.isArray(dimNames)){
            dimNames.forEach(function(name){
                this._userDimsReadersByDim[name] = reader;
            }, this);
        } else {
            this._userDimsReadersByDim[dimNames] = reader;
        }

        this._userDimsReaders.push(reader);
    },

    //  TODO: docs
    _wrapReader: function(reader, dimNames){
        var me = this,
            dimensions;
        
        function createDimensions() {
            dimensions = dimNames.map(function(dimName){ return me.data.dimensions(dimName); });
            dimensions.unshift(null); // item argument
            return dimensions;
        }
        
        function read(item) {
            (dimensions || createDimensions())[0] = item;
            
            return reader.apply(null, dimensions);
        }
        
        return read;
    },
    
    /**
     * Builds a dimensions reader that 
     * filters the atoms returned by a given dimensions reader
     * and returns the first one that is of a specified dimension.
     * 
     * <p>
     * If the given reader returns no atoms of the desired dimension,
     * then the built reader returns <tt>undefined</tt>.
     * </p>
     * 
     * @param {function} reader A dimensions reader to filter.
     * @param {function} dimName The name of the filtered dimension.
     * 
     * @type function
     */
    _filterDimensionReader: function(reader, dimName){
        
        function extractDimensionReader(item) {
            var atoms = reader(item);
            if(atoms instanceof Array) {
                return def.query(seriesAtom)
                    .first(function(atom){
                        return atom.dimension.name === dimName;
                    });
            }
            
            if(atoms.dimension.name === dimName) {
                return atoms;
            }
            
            //return undefined;
        }
        
        return extractDimensionReader;
    },
    
    /**
     * Performs the translation operation for a data instance.
     * 
     * <p>
     *    The returned atoms are interned in 
     *    the dimensions of the specified data instance.
     * </p>
     * 
     * <p>
     *    If this method is called more than once,
     *    the consequences are undefined.
     * </p>
     * 
     * @param {pvc.data.Data} data The data object in whose dimensions returned atoms are interned.
     * 
     * @returns {def.Query} An enumerable of {@link pvc.data.Atom[]}
     */
    execute: function(data){
        this.data = data;
        
        return this._executeCore();
    },
    
    /**
     * Obtains an enumerable of translated atoms (virtual).
     * 
     * <p>
     *    The default implementation applies 
     *    every dimensions reader returned by {@link #_getDimensionsReaders} 
     *    to every item returned by  {@link #_getItems}.
     *   
     *    Depending on the underlying data source format 
     *    this may or may not be a good translation strategy.
     *    Override to apply a different one.
     * </p>
     * 
     * @returns {def.Query} An enumerable of {@link pvc.data.Atom[]}
     * @virtual
     */
    _executeCore: function(){
        var dimsReaders = this._getDimensionsReaders();
        
        return def.query(this._getItems())
                  .select(function(item){
                      return this._readItem(null, item, dimsReaders);
                  }, this);
    },
    
    /**
     * Obtains an enumerable of items to translate (virtual).
     * 
     * <p>
     * The default implementation assumes that {@link #source}
     * is directly the desired enumerable of items. 
     * </p>
     * 
     * @type def.Query
     */
    _getItems: function(){
        return this.source;
    },
    
    /**
     * Obtains the dimensions readers array (virtual).
     * 
     * <p>
     * Each dimensions reader function reads one or more dimensions
     * from a source item.
     * It has the following signature:
     * </p>
     * <pre>
     * function(item : any) : pvc.data.Atom[] | pvc.data.Atom
     * </pre>
     * 
     * <p>
     * The default implementation simply returns the {@link #_userDimsReaders} field. 
     * </p>
     * 
     * @name _getDimensionsReaders
     * @type function[]
     * @virtual
     */
    _getDimensionsReaders: function(){
        return this._userDimsReaders;
    },
    
    /**
     * Applies all the specified dimensions reader functions to an item 
     * and sets the resulting atoms in a specified array (virtual).
     * 
     * @param {Array} [atoms] An array where to add resulting atoms.
     * @param {any} item The item to read.
     * @param {function[]} dimsReaders An array of dimensions reader functions.
     * @returns {pvc.data.Atom[]} The specified atoms array or a new one if one was not specified.
     * @virtual
     */
    _readItem: function(atoms, item, dimsReaders) {
        atoms = atoms || [];
        
        // This function is performance critical and so does not use forEach
        // or array helpers, avoiding function calls, closures, etc.
        
        if(pvc.debug >= 4) {
            pvc.log('readItem: ' + JSON.stringify(item));
        }
        
        var r = 0, 
            R = dimsReaders.length, 
            a = 0;
        
        while(r < R) {
            
            var result = dimsReaders[r++](item);
            if(result != null){
                if(result instanceof Array) {
                    var j = 0, J = result.length;
                    while(j < J) {
                        if(result.value != null) { // no null atoms
                            atoms[a++] = result[j];
                        }

                        j++;
                    }

                } else if(result.value != null){
                    atoms[a++] = result;
                }
            }
        }
        
        atoms.length = a;
        
        if(pvc.debug >= 4) {
            var atomsMap = def.query(atoms).object({
                name:  function(atom){ return atom.dimension.name; },
                value: function(atom){ 
                    return { id: atom.id, v: atom.value, f: atom.label };
                }
            });
            
            pvc.log('\t-> atoms: ' + JSON.stringify(atomsMap));
        }
        
        return atoms;
    },
    
    /**
     * Given a dimension name and a property name,
     * creates a dimensions reader that obtains that property from a given source item 
     * and returns the corresponding atom (protected).
     * 
     * @param {string} dimName The name of the dimension on which to intern read values.
     * @param {string} prop The property name to read from each item.
     * @param {object} [keyArgs] Keyword arguments. 
     * @param {boolean} [keyArgs.ensureDim=true] Creates a dimension with the specified name, with default options, if one does not yet exist. 
     * 
     * @type function
     */
    _propGet: function(dimName, prop, keyArgs) {
        var me = this,
            dimension;
        
        if(def.get(keyArgs, 'ensureDim', true)) {
            this.ensureDimensionType(dimName);
        }
        
        function propGet(item) {
            return (dimension || (dimension = me.data.dimensions(dimName)))
                   .intern(item[prop], item);
        }
        
        return propGet;
    },
    
    /**
     * Given a dimension name and a raw value of that dimension,
     * creates a dimensions reader that returns the corresponding atom,
     * regardless of the source item supplied to it (protected).
     * 
     * @param {string} dimName The name of the dimension on which to intern <i>constRawValue</i>.
     * @param {string} constRawValue The raw value.
     * 
     * @param {object} [keyArgs] Keyword arguments. 
     * @param {boolean} [keyArgs.ensureDim=true] Creates a dimension with the specified name, with default options, if one does not yet exist.
     * 
     * @type function
     */
    _constGet: function(dimName, constRawValue, keyArgs) {
        var me = this,
            constAtom;
        
        if(def.get(keyArgs, 'ensureDim', true)) {
            this.ensureDimensionType(dimName);
        }
        
        function constGet(/* item */) {
            return constAtom || 
                   (constAtom = me.data.dimensions(dimName).intern(constRawValue));
        }

        return constGet;
    },
    
    // TODO: docs
    _nextAvailableItemIndex: function(index, L){
        if(index == null) {
            index = 0;
        }
        if(L == null){
            L = Infinity;
        }

        while(index < L && def.hasOwn(this._userItem, index)) {
            index++;
        }
        
        return index < L ? index : -1;
    },
    
    // TODO: docs
    ensureDimensionType: function(dimName, dimSpec){
        var dimType = this.complexType.dimensions(dimName, {assertExists: false});
        if(!dimType) {
            this.defDimensionType(dimName, dimSpec);
        }
    },

    defDimensionType: function(dimName, dimSpec){
        /** Passing options: isCategoryTimeSeries, timeSeriesFormat and dimensionGroups */
        dimSpec = pvc.data.DimensionType.extendSpec(dimName, dimSpec, this.options);
        return this.complexType.addDimension(dimName, dimSpec);
    }
});