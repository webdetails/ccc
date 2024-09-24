/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

pvc.BaseChart
.add({
    /**
     * A map of {@link pvc.visual.Role} by name.
     * Do NOT modify the returned object.
     * @type Object<string,pvc.visual.Role>
     */
    visualRoles: null,

    /**
     * The array of all {@link pvc.visual.Role} instances used by the chart.
     * Do NOT modify the returned array.
     * @type pvc.visual.Role[]
     */
    visualRoleList: null,

    /**
     * The array of all {@link pvc.visual.Role} instances used by the chart
     * that are considered measures.
     * @type pvc.visual.Role[]
     * @private
     */
    _measureVisualRoles: null,

    _constructVisualRoles: function(/*options*/) {
        var parent = this.parent;
        if(parent) {
            this.visualRoles = parent.visualRoles;
            this.visualRoleList = parent.visualRoleList;
        }
    },

    // region initVisualRoles
    _initVisualRoles: function() {
        var parent = this.parent;
        if(!parent) {
            this.visualRoles = {};
            this.visualRoleList = [];

            this._createChartVisualRoles();
        }
    },

    _addVisualRole: function(name, keyArgs) {
        keyArgs = def.set(keyArgs, 'index', this.visualRoleList.length);
        var role = new pvc.visual.Role(this, name, keyArgs),
            names = [name];

        // There's a way to refer to chart visual roles without danger
        // of matching the main plot's visual roles.
        if(!role.plot) names.push("$." + name);

        return this._addVisualRoleCore(role, names);
    },

    _addVisualRoleCore: function(role, names) {
        if(!names) names = role.name;

        this.visualRoleList.push(role);
        if(def.array.is(names))
            names.forEach(function(name) { this.visualRoles[name] = role; }, this);
        else
            this.visualRoles[names] = role;
        return role;
    },

    /**
     * Creates the chart-level visual roles.
     * @virtual
     */
    _createChartVisualRoles: function() {
        this._addVisualRole('multiChart', {
            defaultDimension: 'multiChart*',
            requireIsDiscrete: true
        });

        this._addVisualRole('dataPart', {
            defaultDimension: 'dataPart',
            requireIsDiscrete: true,
            requireSingleDimension: true,
            dimensionDefaults: {isHidden: true, comparer: def.compare}
        });
    },
    // endregion

    /**
     * Obtains an existing visual role given its name.
     * An error is thrown if a role with the specified name is not defined.
     *
     * The specified name may be:
     * <ul>
     *     <li>the name of a chart visual role, </li>
     *     <li>the local name of a visual role of the chart's main plot, or</li>
     *     <li>the fully qualified name of a plot's visual role: "<plot name or id>.<local role name>".</li>
     * </ul>
     *
     * @param {string} roleName The visual role name.
     * @type pvc.visual.Role
     */
    visualRole: function(roleName) {
        var role = def.getOwn(this.visualRoles, roleName);
        if(!role) throw def.error.operationInvalid('roleName', "There is no visual role with name '{0}'.", [roleName]);
        return role;
    },

    /**
     * Obtains the array of all {@link pvc.visual.Role} instances used by the chart
     * that are considered measures and that are bound.
     *
     * This is made lazily because the effective "measure" status
     * depends on the binding of the visual role, and
     * of it becoming discrete or continuous.
     *
     * Do NOT modify the returned array.
     *
     * @return {pvc.visual.Role[]} The array of measure visual roles.
     */
    measureVisualRoles: function() {
        if(this.parent) return this.parent.measureVisualRoles();

        return this._measureVisualRoles || (this._measureVisualRoles =
            this.visualRoleList.filter(function(role) { return role.isMeasureEffective; }));
    },

    measureDimensionsNames: function() {
        return def.query(this.measureVisualRoles())
            .selectMany(function(role) { return role.grouping.dimensionNames(); })
            .distinct()
            .array();
    },

    /**
     * Obtains the chart-level visual roles, in definition order,
     * that are played by a main dimension, given its name.
     *
     * Optionally, plot-level visual roles can be included as well.
     *
     * Do NOT modify the returned array.
     *
     * @param {string} mainDimName - The name of the main dimension.
     * @param {boolean} [includePlotLevel=false] Indicates that plot-level visual roles should also be included.
     * @return {pvc.visual.Role[]} The array of visual roles or <tt>null</tt>, if none.
     */
    visualRolesOf: function(mainDimName, includePlotLevel) {
        var visualRolesByDim = this._visRolesByDim;
        if(!visualRolesByDim) {
            visualRolesByDim = {};

            // Unfortunately, the sliding window needs to call this method
            // while visual roles' pre-bindings are not yet committed.

            var isAfterVisualRoleBinding = !!this._dataType;
            if(isAfterVisualRoleBinding) {
                // Cache results.
                this._visRolesByDim = visualRolesByDim;
            }

            this.visualRoleList.forEach(function(role) {
                if(includePlotLevel || !role.plot) {
                    var grouping = role.grouping || role.preBoundGrouping();
                    if(grouping) grouping.dimensionNames().forEach(function (dimName) {
                        def.array.lazy(visualRolesByDim, dimName).push(role);
                    });
                }
            });
        }

        return def.getOwn(visualRolesByDim, mainDimName, null);
    },

    _getDataPartDimName: function(useDefault) {
        var role = this.visualRoles.dataPart, preGrouping;
        return role.isBound()                          ? role.grouping.singleDimensionName :
               (preGrouping = role.preBoundGrouping()) ? (preGrouping.firstDimension && preGrouping.firstDimension.name) :
               useDefault                              ? role.defaultDimensionGroup :
               null;
    },

    /**
     * Processes a view specification.
     *
     * An error is thrown if the specified view specification does
     * not have at least one of the properties <i>role</i> or <i>dims</i>.
     *
     * @param {Object} viewSpec The view specification.
     * @param {string} [viewSpec.role] The name of a visual role.
     * @param {string|string[]} [viewSpec.dims] The name or names of the view's dimensions.
     */
    _processViewSpec: function(viewSpec) {
        // If not yet processed
        if(!viewSpec.dimsKeys) {
            if(viewSpec.role) {
                var role = this.visualRoles[viewSpec.role],
                    grouping = role && role.grouping;
                if(grouping) {
                    viewSpec.dimNames = grouping.allDimensionNames.slice().sort();
                    viewSpec.dimsKey  = viewSpec.dimNames.join(",");
                }
            } else if(viewSpec.dims) {
                viewSpec.dimNames = viewSpec_normalizeDims(viewSpec.dims);
                viewSpec.dimsKey  = String(viewSpec.dimNames);
            } else {
                throw def.error.argumentInvalid(
                    "viewSpec",
                    "Invalid view spec. No 'role' or 'dims' property.");
            }
        }
    },

    // region Bound Dimensions Data Sets and Complex Types
    /**
     * Gets the base data set of bound dimensions of a given measure visual role.
     *
     * This data set is initially empty and is filled with data when the visual roles having a
     * same {@link pvc.visual.Role#dataSetName} become bound.
     *
     * @param {!pvc.visual.Role} visualRole - The measure visual role.
     *
     * @return {!cdo.Data} The base bound dimensions data set.
     *
     * @throws {Error} When the visual role is not an `isMeasure` visual role.
     *
     * @see pvc.visual.Role#boundDimensionsDataSet
     */
    getBoundDimensionsDataSetOf: function(visualRole) {

        if(!visualRole.isMeasure) throw new Error("Visual role is not isMeasure.");

        var boundDimsDataSetMap = def.lazy(this.root, "_boundDimsDataSetsMap");

        var data = boundDimsDataSetMap[visualRole.boundDimensionsDataSetName];
        if(!data) {
            // Create the complex type.
            var complexType = new cdo.ComplexType({
                "dim": {
                    isKey:     true,
                    valueType: String,
                    isHidden:  true
                }
            });

            // Create the data set. Initially empty.
            // Specific visual roles will load this once bound.
            data = new cdo.Data({type: complexType});

            boundDimsDataSetMap[visualRole.boundDimensionsDataSetName] = data;
        }

        return data;
    },

    /**
     * Gets the complex type of bound dimensions' data sets of a given measure visual role.
     *
     * @param {!pvc.visual.Role} visualRole - The measure visual role.
     *
     * @return {!cdo.ComplexType} The complex type.
     *
     * @throws {Error} When the visual role is not an `isMeasure` visual role.
     *
     * @see pvc.BaseChart#getBoundDimensionsDataSetOf
     */
    getBoundDimensionsComplexTypeOf: function(visualRole) {
        return this.getBoundDimensionsDataSetOf(visualRole).type;
    },

    /**
     * The bound dimensions data set map.
     *
     * Lazily created by {@link #getBoundDimensionsDataSetOf}.
     *
     * @type {Object.<string,cdo.Data>}
     * @private
     */
    _boundDimsDataSetsMap: null,

    /**
     * Gets the chart-level map of bound dimensions data sets, indexed by data set name,
     * or `null`, if none.
     *
     * @type {Object.<string,cdo.Data>}
     * @readOnly
     */
    get boundDimensionsDataSetsMap() {
        return this.root._boundDimsDataSetsMap || null;
    },

    /**
     * Gets a map of bound dimensions complex types that can be referenced by chart visual roles,
     * (or by plot visual roles in an axis context)
     * or `null`, if none.
     *
     * @type {Object.<string, cdo.ComplexType}
     * @readOnly
     */
    get boundDimensionsComplexTypesMap() {
        var complexTypesMap = null;
        var boundDimsDataSets = this.boundDimensionsDataSetsMap;

        if(boundDimsDataSets) def.eachOwn(boundDimsDataSets, function(dataSet, dataSetName) {
            if(!complexTypesMap) complexTypesMap = Object.create(null);
            complexTypesMap[dataSetName] = dataSet.type;
        });

        return complexTypesMap;
    }
    // endregion
});

// TODO: expand dim*
function viewSpec_normalizeDims(dims) {
    // Assume already normalized
    if(def.string.is(dims))
        dims = dims.split(",");
    else if(!def.array.is(dims))
        throw def.error.argumentInvalid('dims', "Must be a string or an array of strings.");

    return def.query(dims).distinct().sort().array();
}
