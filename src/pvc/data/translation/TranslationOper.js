
/**
 * Initializes a translation operation.
 * 
 * @name pvc.data.TranslationOper
 * @class Represents one translation operation 
 * from some data source format to the list of atoms format.
 * 
 * @property {pvc.BaseChart} chart The associated chart.
 * @property {pvc.data.ComplexType} complexType The complex type that represents the translated data.
 * @property {pvc.data.Data} data The data object which will be loaded with the translation result.
 * @property {object} source The source object, of some format, being translated.
 * @property {object} metadata A metadata object describing the source.
 * @property {object} options  An object with translation options.
 * 
 * @constructor
 * @param {pvc.BaseChart} chart The associated chart.
 * @param {pvc.data.ComplexTypeProject} complexTypeProj The complex type project that will represent the translated data.
 * @param {object} source The source object, of some format, to be translated.
 * The source is not modified.
 * @param {object} [metadata] A metadata object describing the source.
 * @param {object} [options] An object with translation options.
 * Options are translator specific.
 * TODO: missing common options here
 */
def.type('pvc.data.TranslationOper')
.init(function(chart, complexTypeProj, source, metadata, options){
    this.chart = chart;
    this.complexTypeProj = complexTypeProj;
    this.source   = source;
    this.metadata = metadata || {};
    this.options  = options  || {};

    this._initType();
    
    if(pvc.debug >= 4) {
        this._logItems = true;
        this._logItemCount = 0;
    }
})
.add(/** @lends pvc.data.TranslationOper# */{
    
    _logItems: false,
    
    /**
     * Logs the contents of the source and metadata properties.
     */
    logSource: def.method({isAbstract: true}),

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
        /*jshint expr:true */
        dimReaderSpec || def.fail.argumentRequired('readerSpec');

        var dimNames;
        if(typeof dimReaderSpec === 'string'){
            dimNames = dimReaderSpec;
        } else {
            dimNames =  dimReaderSpec.names;
        }
        
        if(typeof dimNames === 'string'){
            dimNames = dimNames.split(/\s*\,\s*/);
        } else {
            dimNames =  def.array.as(dimNames);
        }
        
        // Consumed/Reserved virtual item indexes
        var indexes = def.array.as(dimReaderSpec.indexes);
        if(indexes) {
            indexes.forEach(this._userUseIndex, this);
        }
        
        var hasDims = !!(dimNames && dimNames.length);
        var reader = dimReaderSpec.reader;
        if(!reader) {
            if(hasDims){
                return  this._userCreateReaders(dimNames, indexes); // -> indexes, possibly expanded
            } // else a reader that only serves to exclude indexes
        } else {
            hasDims || def.fail.argumentRequired('reader.names', "Required argument when a reader function is specified.");
            
            this._userRead(reader, dimNames);
        }
        
        return indexes;
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
    configureType: function(){
        this._configureTypeCore();
    },
    
    /** @abstract */
    _configureTypeCore: def.method({isAbstract: true}),
    
    _initType: function(){
        this._userDimsReaders = [];
        this._userDimsReadersByDim = {};
        
        this._userItem = [];
        
        this._userUsedIndexes = {};
        this._userUsedIndexesCount = 0;
        
        // -------------
        
        var userDimReaders = this.options.readers;
        if(userDimReaders) {
            userDimReaders.forEach(this.defReader, this);
        }

        var multiChartIndexes = pvc.parseDistinctIndexArray(this.options.multiChartIndexes);
        if(multiChartIndexes) {
            this._multiChartIndexes = this.defReader({names: 'multiChart', indexes: multiChartIndexes });
        }
    },

    _userUseIndex: function(index){
        index = +index; // to number

        /*jshint expr:true */
        (index >= 0) || def.fail.argumentInvalid('index', "Invalid reader index: '{0}'.", [index]);

        !def.hasOwn(this._userUsedIndexes, index) ||
            def.fail.argumentInvalid('index', "Virtual item index '{0}' is already assigned.", [index]);

        this._userUsedIndexes[index] = true;
        this._userUsedIndexesCount++;
        this._userItem[index] = true;
        
        return index;
    },

    _userCreateReaders: function(dimNames, indexes){
        if(!indexes){
            indexes = [];
        } else {
            // Convert indexes to number
            indexes.forEach(function(index, j){
                indexes[j] = +index;
            });
        }

        // Distribute indexes to names, from left to right
        // Excess indexes go to the last *group* name
        // Missing indexes are padded from available indexes starting from the last provided index
        // If not enough available indexes exist, those names end up reading undefined
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
            var splitGroupName = pvc.splitIndexedId(dimNames[N - 1]),
                groupName = splitGroupName[0],
                level     = def.nullyTo(splitGroupName[1], 0);

            for(var i = L ; i < I ; i++, level++) {
                dimName = pvc.buildIndexedId(groupName, level);
                this._userRead(this._propGet(dimName, indexes[i]), dimName);
            }
        }
        
        return indexes;
    },

    _userRead: function(reader, dimNames){
        /*jshint expr:true */
        def.fun.is(reader) || def.fail.argumentInvalid('reader', "Reader must be a function.");
        
        if(def.array.is(dimNames)){
            dimNames.forEach(function(name){
                this._readDim(name, reader);
            }, this);
        } else {
            this._readDim(dimNames, reader);
        }

        this._userDimsReaders.push(reader);
    },

    _readDim: function(name, reader){
        this.complexTypeProj.readDim(name);
        this._userDimsReadersByDim[name] = reader;
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
                      return this._readItem(item, dimsReaders);
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
     * @param {any} item The item to read.
     * @param {function[]} dimsReaders An array of dimensions reader functions.
     * @returns {map(string any)} A map of read raw values by dimension name.
     * @virtual
     */
    _readItem: function(item, dimsReaders) {
        // This function is performance critical and so does not use forEach
        // or array helpers, avoiding function calls, closures, etc.
        var logItem = this._logItems;
        if(logItem) {
            var logItemCount = this._logItemCount;
            if(logItemCount < 10){
                pvc.log('virtual item [' + this._logItemCount + ']: ' + pvc.stringify(item));
                this._logItemCount++;
            } else {
                pvc.log('...');
                logItem = this._logItems = false;
            }
        }
        
        var r = 0, 
            R = dimsReaders.length, 
            a = 0,
            data = this.data,
            valuesByDimName = {};
        
        while(r < R) {
            dimsReaders[r++].call(data, item, valuesByDimName);
        }
        
        if(logItem) {
            var atoms = {};
            for(var dimName in valuesByDimName){
                var atom = valuesByDimName[dimName];
                if(def.object.is(atom)){
                    atom = ('v' in atom) ? atom.v : ('value' in atom) ? atom.value : '...';
                }
                
                atoms[dimName] = atom;
            }
            
            pvc.log('-> read: ' + pvc.stringify(atoms));
        }
        
        return valuesByDimName;
    },
    
    /**
     * Given a dimension name and a property name,
     * creates a corresponding dimensions reader (protected).
     * 
     * @param {string} dimName The name of the dimension on which to intern read values.
     * @param {string} prop The property name to read from each item.
     * @param {object} [keyArgs] Keyword arguments. 
     * @param {boolean} [keyArgs.ensureDim=true] Creates a dimension with the specified name, with default options, if one does not yet exist. 
     * 
     * @type function
     */
    _propGet: function(dimName, prop) {
        
        function propGet(item, atoms){
            atoms[dimName] = item[prop];
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
        
        function constGet(item, atoms) {
            atoms[dimName] = 
                    constAtom || 
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
    
    _getUnboundRoleDefaultDimNames: function(roleName, count, dims, level){
        var role = this.chart.visualRoles(roleName, {assertExists: false});
        if(role && !role.isPreBound()){
            var dimGroupName = role.defaultDimensionName;
            if(dimGroupName){
                dimGroupName = dimGroupName.match(/^(.*?)(\*)?$/)[1];
                
                if(!dims){
                    dims = [];
                }
                
                if(level == null){
                    level = 0;
                }
                
                if(count == null) {
                    count = 1;
                }
                
                // Already bound dimensions count
                while(count--){
                    var dimName = pvc.buildIndexedId(dimGroupName, level++);
                    if(!this.complexTypeProj.isReadOrCalc(dimName)){
                        dims.push(dimName);
                    }
                }
                
                return dims.length ? dims : null;
            }
        }
    }
});