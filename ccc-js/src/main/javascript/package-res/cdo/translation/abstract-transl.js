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
 * @property {cdo.ComplexTypeProject} complexTypeProj The complex type project that represents the translated metadata.
 * @property {object} source   The source object, of some format, being translated.
 * @property {object} metadata A metadata object describing the source.
 * @property {object} options  An object with translation options.
 *
 * @constructor
 * @param {cdo.ComplexTypeProject} complexTypeProj The complex type project that represents the translated metadata.
 * @param {object} source The source object, of some format, to be translated. The source is not modified.
 * @param {object} [metadata] A metadata object describing the source.
 * @param {object} [options] An object with translation options.
 * Options are translator specific.
 * TODO: missing common options here
 */
def.type('cdo.TranslationOper')
.init(function(complexTypeProj, source, metadata, options) {
    this.complexTypeProj = complexTypeProj || def.fail.argumentRequired('complexTypeProj');
    this.source   = source   || def.fail.argumentRequired('source'  );
    this.metadata = metadata || def.fail.argumentRequired('metadata');
    this.options  = options  || {};

    this._initType();

    if(def.debug >= 4) {
        this._logLogicalRows = true;
        this._logLogicalRowCount = 0;
    }
})
.add(/** @lends cdo.TranslationOper# */{

    _logLogicalRows: false,

    /**
     * Logs the contents of the source and metadata properties.
     */
    logSource: def.abstractMethod,

    /**
     * Logs the structure of the logical table.
     */
    logLogicalRow: def.abstractMethod,

    _translType: "Unknown",

    logTranslatorType: function() { return this._translType + " data source translator"; },

    /**
     * Obtains the number of columns of the logical table.
     * <p>
     * The default implementation returns the length of the metadata.
     * </p>
     *
     * @type number
     * @virtual
     */
    logicalColumnCount: function() { return this.metadata.length; },

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

        // Consumed/Reserved logical table indexes
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
    _configureTypeCore: def.abstractMethod,

    _initType: function() {
        this._userDimsReaders = [];
        this._userDimsReadersByDim = {};

        this._userUsedIndexes = {};

        // Indexes reserved for a single dimension or (null)
        this._userIndexesToSingleDim = [];

        // -------------

        var userDimReaders = this.options.readers;
        if(userDimReaders) def.array.each(userDimReaders, this.defReader, this);

        var multiChartIndexes = def.parseDistinctIndexArray(this.options.multiChartIndexes);
        if(multiChartIndexes)
            this._multiChartIndexes = this.defReader({names: 'multiChart', indexes: multiChartIndexes });
    },

    _userUseIndex: function(index) {
        index = +index; // to number

        if(index < 0) throw def.error.argumentInvalid('index', "Invalid reader index: '{0}'.", [index]);

        if(def.hasOwn(this._userUsedIndexes, index))
            throw def.error.argumentInvalid('index', "Column '{0}' of the logical table is already assigned.", [index]);

        this._userUsedIndexes[index] = true;

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
                nextIndex = this._getNextFreeLogicalColumnIndex(nextIndex);
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
            info = this._logicalRowInfos[index];
            if(info && !this.options.ignoreMetadataLabels) {
                var label = info.label || (info.name && def.titleFromName(info.name));
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
     * This is passed as the <tt>this</tt> context for dimensions reader functions.
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
     *    to every row returned by  {@link #_getLogicalRows}.
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

        return def.query(this._getLogicalRows())
                  .select(function(row) { return this._readLogicalRow(row, dimsReaders); }, this);
    },

    /**
     * Obtains an enumerable of logical rows to translate (virtual).
     *
     * <p>
     * The default implementation assumes that {@link #source}
     * is directly the desired enumerable of rows.
     * </p>
     *
     * @type def.Query
     */
    _getLogicalRows: function() { return this.source; },

    /**
     * Obtains the dimensions readers array
     * in a way suitable to be passed to {@link #_readLogicalRow}.
     * (virtual).
     *
     * <p>
     * Each dimensions reader function reads one or more dimensions
     * from a source logical row.
     * It has the following signature:
     * </p>
     * <pre>
     * function(logicalRow : any, atoms: Object.<string, Atom>)
     * </pre>
     *
     * <p>
     * The default implementation simply returns the {@link #_userDimsReaders} field
     * in reverse order.
     * </p>
     *
     * @name _getDimensionsReaders
     * @type function[]
     * @virtual
     */
    _getDimensionsReaders: function() {
        return this._userDimsReaders.slice().reverse();
    },

    /**
     * Applies all the specified dimensions reader functions to a logical row
     * and returns the filled map of read values (virtual method).
     *
     * @param {any} logicalRow The logical row to read.
     * @param {function[]} dimsReaders An array of dimensions reader functions in reverse order.
     * @returns {object<string,any>} A map of read raw values by dimension name.
     * @virtual
     */
    _readLogicalRow: function(logicalRow, dimsReaders) {
        // This function is performance critical and so does not use forEach
        // or array helpers, avoiding function calls, closures, etc. (except for the logging function).

        var doLog = this._logLogicalRows && this._logLogicalRowBefore(logicalRow),
            r     = dimsReaders.length,
            data  = this.data,
            atoms = {};

        while(r--) dimsReaders[r].call(data, logicalRow, atoms);

        if(doLog) this._logLogicalRowAfter(atoms);

        return atoms;
    },

    _logLogicalRowBefore: function(logicalRow) {
        if(this._logLogicalRowCount < 10)
            return def.log('logical row [' + (this._logLogicalRowCount++) + ']: ' + def.describe(logicalRow)), true;

        // Stop logging logicalRows
        def.log('...');
        return (this._logLogicalRows = false);
    },

    _logLogicalRowAfter: function(readAtoms) {
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
        def.log('-> read: ' + def.describe(logAtoms));
    },

    /**
     * Given a dimension name and a property name,
     * creates a corresponding dimensions reader (protected).
     *
     * @param {string} dimName The name of the dimension on which to intern read values.
     * @param {string} prop The property name to read from each row.
     *
     * @type function
     */
    _propGet: function(dimName, prop) {

        function propGet(logicalRow, atoms) { atoms[dimName] = logicalRow[prop]; }

        return propGet;
    },

    _getNextFreeLogicalColumnIndex: function(index, L) {
        if(index == null) index = 0;
        if(L     == null) L = Infinity;

        while(index < L && def.hasOwn(this._userUsedIndexes, index)) index++;

        return index < L ? index : -1;
    },

    _getPhysicalGroupStartIndex: function(name) {
        return def.getOwn(this._logicalRowPhysicalGroupIndex, name);
    },

    _getPhysicalGroupLength: function(name) {
        return def.getOwn(this._logicalRowPhysicalGroupsLength, name);
    },

    _configureTypeByPhysicalGroup: function(physicalGroupName, dimGroupName, dimCount, levelMax) {
        var gStartIndex = this._logicalRowPhysicalGroupIndex  [physicalGroupName],
            gLength     = this._logicalRowPhysicalGroupsLength[physicalGroupName],
            gEndIndex   = gStartIndex + gLength - 1,
            index       = gStartIndex;

        dimCount = dimCount == null ? gLength : Math.min(gLength, dimCount);

        if(dimCount && index <= gEndIndex) {
            if(!dimGroupName) dimGroupName = physicalGroupName;
            if(!levelMax) levelMax = Infinity;
            var level = 0, dimName;
            while(dimCount && level < levelMax) {
                dimName = def.indexedId(dimGroupName, level++);

                // Skip name if occupied and continue with next name
                if(!this.complexTypeProj.isReadOrCalc(dimName)) {
                    // Use first available slot for auto dims readers as long as
                    // within the logical group's slots.
                    index = this._getNextFreeLogicalColumnIndex(index); // >= 0

                    // This index is past the logical group's slots? Logical group full?
                    if(index > gEndIndex) return index;

                    this.defReader({names: dimName, indexes: index});

                    index++; // consume index and count!
                    dimCount--;
                }
            }
        }
        return index;
    },

    _configureTypeByOrgLevel: function(discreteDimGroups, continuousDimGroups) {

        // Indexes of Free Logical Table Continuous/Discrete Columns
        var freeContinuous = [], freeDiscrete = [];
        this._logicalRowInfos.forEach(function(info, index) {
            if(!this[index]) {
                var indexes = info.type === 1 ? freeContinuous : freeDiscrete;
                if(indexes) indexes.push(index);
            }
        }, this._userUsedIndexes);

        this._configureTypeByDimGroups(freeDiscrete,   this._processDimGroupSpecs(discreteDimGroups,   true,  Infinity));
        this._configureTypeByDimGroups(freeContinuous, this._processDimGroupSpecs(continuousDimGroups, false, 1       ));
    },

    _processDimGroupSpecs: function(dimGroupSpecs, defaultGreedy, defaultMaxCount) {
        return dimGroupSpecs.map(function(dimGroupSpec) {
            if(def.string.is(dimGroupSpec))
                return {
                    name:     dimGroupSpec,
                    greedy:   defaultGreedy,
                    maxCount: defaultMaxCount
                };

            return def.setDefaults(dimGroupSpec, {
                greedy:   defaultGreedy,
                maxCount: defaultMaxCount
            });
        });
    },

    _configureTypeByDimGroups: function(freeIndexes, dimGroups) {
        if(!dimGroups) return;

        // Stop when either there are no more dim groups to satisfy or
        // all free indexes have beed consumed.
        var g = -1, G = dimGroups.length, F;
        while((++g < G) && (F = freeIndexes.length)) {
            var dimGroupSpec = dimGroups[g],
                maxCount = Math.min(dimGroupSpec.maxCount, F),
                defaultDims = this._getFreeDimGroupNames(dimGroupSpec.name, maxCount, dimGroupSpec.greedy);
            if(defaultDims) {
                // !greedy =>  D in [1, F]
                //  greedy =>  D == F (all free indexes consumed)
                var D = defaultDims.length;
                this.defReader({
                    names:   defaultDims,
                    indexes: freeIndexes.splice(0, defaultDims.length)
                });
            }
        }
    },

    /**
     * Gets names of free default dimensions of a group.
     *
     * Returns the first _free_ <i>count</i> dimension names
     * of the given dimension group.
     *
     * If, for example,
     * <i>roleName</i> is <tt>"series"</tt>, and is unbound.
     * Furthermore, if
     * <i>count</i> is <tt>3</tt>,
     * <i>level</i> is <tt>1</tt> and
     * the dimensions named <tt>"series"</tt> and <tt>"series3"</tt>
     * are already being read or calculated by the user,
     * this function would return two free dimension names:
     * <tt>"series2"</tt> and <tt>"series4"</tt>.
     *
     * @param {string} dimGroupName The name of the dimension group.
     * @param {number} [dimCount=1] The number of desired dimension names.
     * @param {boolean} [greedy=false] Indicates that when a
     * dimension name is already taken, <i>dimCount</i> is not discounted.
     * Otherwise, for each taken dimension name, it's less one name that is returned.
     *
     * @return {string[]} An array with the names of free dimensions, if any, or <tt>null</tt>, if none.
     * @protected
     */
    _getFreeDimGroupNames: function(dimGroupName, dimCount, greedy) {
        if(!dimGroupName) return null;

        var dims = [], level = 0;

        if(dimCount == null) dimCount = 1;

        while(dimCount) {
            var dimName = def.indexedId(dimGroupName, level++);
            if(!this.complexTypeProj.isReadOrCalc(dimName)) {
                dims.push(dimName);
                dimCount--;
            } else if(!greedy) {
                // Unfree dimensions count if we're conservative
                // (and leave columns to other roles).
                dimCount--;
            }
        }

        return dims.length ? dims : null;
    }
});
