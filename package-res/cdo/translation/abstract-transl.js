/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a translation operation.
 * 
 * @name cdo.TranslationOper
 * @class Represents one translation operation 
 * from some data source format to the list of atoms format.
 * 
 * @property {pvc.BaseChart} chart The associated chart.
 * @property {cdo.ComplexType} complexType The complex type that represents the translated data.
 * @property {cdo.Data} data The data object which will be loaded with the translation result.
 * @property {object} source The source object, of some format, being translated.
 * @property {object} metadata A metadata object describing the source.
 * @property {object} options  An object with translation options.
 * 
 * @constructor
 * @param {pvc.BaseChart} chart The associated chart.
 * @param {cdo.ComplexTypeProject} complexTypeProj The complex type project that will represent
 *      the translated data.
 * @param {object} source The source object, of some format, to be translated.
 * The source is not modified.
 * @param {object} [metadata] A metadata object describing the source.
 * @param {object} [options] An object with translation options.
 * Options are translator specific.
 * TODO: missing common options here
 */
def.type('cdo.TranslationOper')
.init(function(chart, complexTypeProj, source, metadata, options) {
    this.chart = chart;
    this.complexTypeProj = complexTypeProj;
    this.source   = source   || def.fail.argumentRequired('source'  );
    this.metadata = metadata || def.fail.argumentRequired('metadata');
    this.options  = options  || {};

    this._initType();
    
    if(pvc.debug >= 4) {
        this._logItems = true;
        this._logItemCount = 0;
    }
})
.add(/** @lends cdo.TranslationOper# */{
    
    _logItems: false,
    
    /**
     * Logs the contents of the source and metadata properties.
     */
    logSource: def.method({isAbstract: true}),

    /**
     * Logs the structure of the virtual item array.
     */
    logVItem: def.method({isAbstract: true}),
    
    _translType: "Unknown",
    
    logTranslatorType: function() { return this._translType + " data source translator"; },
    
    /**
     * Obtains the number of fields of the virtual item.
     * <p>
     * The default implementation returns the length of the metadata.
     * </p>
     * 
     * @type number
     * @virtual
     */
    virtualItemSize:     function() { return this.metadata.length; },
    
    freeVirtualItemSize: function() { return this.virtualItemSize() - this._userUsedIndexesCount; },
    
    setSource: function(source) {
        if(!source) throw def.error.argumentRequired('source');
        
        this.source = source;
    },
    
    /**
     * Defines a dimension reader.
     *
     * @param {object} dimReaderSpec A dimensions reader specification.
     *
     * @type undefined
     */
    defReader: function(dimReaderSpec) {
        /*jshint expr:true */
        dimReaderSpec || def.fail.argumentRequired('readerSpec');

        var dimNames = def.string.is(dimReaderSpec)
            ? dimReaderSpec
            : dimReaderSpec.names;

        dimNames = def.string.is(dimNames)
            ? dimNames.split(/\s*\,\s*/)
            : def.array.as(dimNames);
        
        // Consumed/Reserved virtual item indexes
        var indexes = def.array.as(dimReaderSpec.indexes);
        if(indexes) indexes.forEach(this._userUseIndex, this);
        
        var hasDims = !!(dimNames && dimNames.length),
            reader = dimReaderSpec.reader;
        if(!reader) {
            // -> indexes, possibly expanded
            if(hasDims) return this._userCreateReaders(dimNames, indexes);
            // else a reader that only serves to exclude indexes
            if(indexes) {
                // Mark index as being excluded
                indexes.forEach(function(index) { this._userIndexesToSingleDim[index] = null; }, this);
            }
        } else {
            hasDims || def.fail.argumentRequired('reader.names', "Required argument when a reader function is specified.");
            
            this._userRead(reader, dimNames);
        }
        
        return indexes;
    },

    /**
     * Called once, before {@link #execute},
     * for the translation to configure the complex type project (abstract).
     *
     * <p>
     *    If this method is called more than once,
     *    the consequences are undefined.
     * </p>
     *
     * @name cdo.TranslationOper#configureType
     * @function
     * @type undefined
     * @virtual
     */
    configureType: function() { this._configureTypeCore(); },
    
    /** @abstract */
    _configureTypeCore: def.method({isAbstract: true}),
    
    _initType: function() {
        this._userDimsReaders = [];
        this._userDimsReadersByDim = {};
        
        this._userItem = [];
        
        this._userUsedIndexes = {};
        this._userUsedIndexesCount = 0;
        
        // Indexes reserved for a single dimension or (null)
        this._userIndexesToSingleDim = [];
        
        // -------------
        
        var userDimReaders = this.options.readers;
        if(userDimReaders) userDimReaders.forEach(this.defReader, this);

        var multiChartIndexes = pvc.parseDistinctIndexArray(this.options.multiChartIndexes);
        if(multiChartIndexes)
            this._multiChartIndexes = this.defReader({names: 'multiChart', indexes: multiChartIndexes });
    },

    _userUseIndex: function(index) {
        index = +index; // to number

        if(index < 0) throw def.error.argumentInvalid('index', "Invalid reader index: '{0}'.", [index]);

        if(def.hasOwn(this._userUsedIndexes, index))
            throw def.error.argumentInvalid('index', "Virtual item index '{0}' is already assigned.", [index]);
        
        this._userUsedIndexes[index] = true;
        this._userUsedIndexesCount++;
        this._userItem[index] = true;
        
        return index;
    },

    _userCreateReaders: function(dimNames, indexes) {
        if(!indexes)
            indexes = [];
        else
            // Convert indexes to number
            indexes.forEach(function(index, j) { indexes[j] = +index; });

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
            do {
                nextIndex = this._nextAvailableItemIndex(nextIndex);
                indexes[I] = nextIndex;
                this._userUseIndex(nextIndex);
                I++;
            } while(N > I);
        }

        // If they match, it's one-one name <-- index
        var L = (I === N) ? N : (N - 1),
            index;

        // The first N-1 names get the first N-1 indexes
        for(var n = 0 ; n < L ; n++) {
            dimName = dimNames[n];
            index = indexes[n];
            this._userIndexesToSingleDim[index] = dimName;
            
            this._userRead(this._propGet(dimName, index), dimName);
        }

        // The last name is the dimension group name that gets all remaining indexes
        if(L < N) {
            // TODO: make a single reader that reads all atoms??
            // Last is a *group* START name
            var splitGroupName = def.splitIndexedId(dimNames[N - 1]),
                groupName = splitGroupName[0],
                level     = def.nullyTo(splitGroupName[1], 0);

            for(var i = L ; i < I ; i++, level++) {
                dimName = def.indexedId(groupName, level);
                index = indexes[i];
                this._userIndexesToSingleDim[index] = dimName;
                this._userRead(this._propGet(dimName, index), dimName);
            }
        }
        
        return indexes;
    },

    _userRead: function(reader, dimNames) {
        /*jshint expr:true */
        def.fun.is(reader) || def.fail.argumentInvalid('reader', "Reader must be a function.");
        
        if(def.array.is(dimNames))
            dimNames.forEach(function(name) { this._readDim(name, reader); }, this);
        else
            this._readDim(dimNames, reader);

        this._userDimsReaders.push(reader);
    },

    _readDim: function(name, reader) {
        var info, spec, index = this._userIndexesToSingleDim.indexOf(name);
        if(index >= 0) {
            info = this._itemInfos[index];
            if(info && !this.options.ignoreMetadataLabels) {
                var label = info.label || info.name;
                if(label) spec = {label: label};
            }
            // Not using the type information because it conflicts
            // with defaults specified in other places.
            // (like with the MetricXYAbstract x role valueType being a Date when timeSeries=true)
            //if(info.type != null) { spec.valueType = info.type === 0 ? /*Any*/null : Number; }
        }
        
        this.complexTypeProj.readDim(name, spec);
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
     * @param {cdo.Data} data The data object in whose dimensions returned atoms are interned.
     * 
     * @returns {def.Query} An enumerable of {@link cdo.Atom[]}
     */
    execute: function(data) {
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
     * @returns {def.Query} An enumerable of {@link cdo.Atom[]}
     * @virtual
     */
    _executeCore: function() {
        var dimsReaders = this._getDimensionsReaders();
        
        return def.query(this._getItems())
                  .select(function(item) { return this._readItem(item, dimsReaders); }, this);
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
    _getItems: function() { return this.source; },
    
    /**
     * Obtains the dimensions readers array (virtual).
     * 
     * <p>
     * Each dimensions reader function reads one or more dimensions
     * from a source item.
     * It has the following signature:
     * </p>
     * <pre>
     * function(item : any) : cdo.Atom[] | cdo.Atom
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
    _getDimensionsReaders: function() { return this._userDimsReaders; },
    
    /**
     * Applies all the specified dimensions reader functions to an item 
     * and returns the filled map of read values (virtual method).
     * 
     * @param {any} item The item to read.
     * @param {function[]} dimsReaders An array of dimensions reader functions.
     * @returns {object<string,any>} A map of read raw values by dimension name.
     * @virtual
     */
    _readItem: function(item, dimsReaders) {
        // This function is performance critical and so does not use forEach
        // or array helpers, avoiding function calls, closures, etc. (except for the logging function).
                
        var logItem = this._logItems && this._logItemBefore(item),
            r = 0,
            R = dimsReaders.length, 
            data = this.data,
            atoms = {};

        while(r < R) dimsReaders[r++].call(data, item, atoms);

        if(logItem) this._logItemAfter(atoms);

        return atoms;
    },
        
    _logItemBefore: function(vitem) {
        if(this._logItemCount < 10)
            return pvc.log('virtual item [' + (this._logItemCount++) + ']: ' + pvc.stringify(vitem)), true;
        
        // Stop logging vitems
        pvc.log('...');
        return (this._logItems = false);
    },

    _logItemAfter: function(readAtoms) {
            // Log read names/values
        // Ensure we have a simple object of name -> value to log.
        // Note that cdo.Atom objects may be returned by a read function.
        var logAtoms = {};
        for(var dimName in readAtoms) {
            var atom = readAtoms[dimName];
                if(def.object.is(atom)) {
                    atom = ('v' in atom) ? atom.v : ('value' in atom) ? atom.value : '...';
                }
            logAtoms[dimName] = atom;
        }
        pvc.log('-> read: ' + pvc.stringify(logAtoms));
    },
    
    /**
     * Given a dimension name and a property name,
     * creates a corresponding dimensions reader (protected).
     * 
     * @param {string} dimName The name of the dimension on which to intern read values.
     * @param {string} prop The property name to read from each item.
     *
     * @type function
     */
    _propGet: function(dimName, prop) {
        
        function propGet(item, atoms) { atoms[dimName] = item[prop]; }
        
        return propGet;
    },

    _nextAvailableItemIndex: function(index, L) {
        if(index == null) index = 0;
        if(L     == null) L = Infinity;

        while(index < L && def.hasOwn(this._userItem, index)) index++;
        
        return index < L ? index : -1;
    },
    
    _getUnboundRoleDefaultDimNames: function(roleName, count, dims, level) {
        var role = this.chart.visualRoles[roleName];
        if(role && !role.isPreBound()) {
            var dimGroupName = role.defaultDimensionName;
            if(dimGroupName) {
                dimGroupName = dimGroupName.match(/^(.*?)(\*)?$/)[1];
                
                if(!dims        ) dims = [];
                if(level == null) level = 0;
                if(count == null) count = 1;
                
                // Already bound dimensions count
                while(count--) {
                    var dimName = def.indexedId(dimGroupName, level++);
                    if(!this.complexTypeProj.isReadOrCalc(dimName)) dims.push(dimName);
                }
                
                return dims.length ? dims : null;
            }
        }
    },
    
    collectFreeDiscreteAndConstinuousIndexes: function(freeDisIndexes, freeMeaIndexes) {
        this._itemInfos.forEach(function(info, index) {
            if(!this._userUsedIndexes[index]) {
                var indexes = info.type === 1 ? freeMeaIndexes : freeDisIndexes;
                if(indexes) indexes.push(index);
            }
        }, this);
    }
});