/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var visualRole_flatten_select_keyArgs = [
    'extensionDataSetsMap', 'reverse', 'visible', 'selected', 'isNull', 'where', 'whereKey'
];

/**
 * Initializes a visual role.
 *
 * @name pvc.visual.Role
 *
 * @class Represents a role that is somehow played by a visualization.
 *
 * @property {string} name The name of the role.
 * @property {pvc.visual.Plot} plot The owner plot of the visual role, when there is one.
 * @property {string} label
 * The label of this role.
 * The label <i>should</i> be unique on a visualization.
 *
 * @property {cdo.GroupingSpec} grouping The grouping specification currently bound to the visual role.
 *
 * @property {boolean} isRequired Indicates that the role is required and must be satisfied.
 *
 * @property {boolean} requireSingleDimension Indicates that the role can only be satisfied by a single dimension.
 * A {@link pvc.visual.Role} of this type must have an associated {@link cdo.GroupingSpec}
 * that has {@link cdo.GroupingSpec#isSingleDimension} equal to <tt>true</tt>.
 *
 * @property {boolean} valueType When not nully,
 * restricts the allowed value type of the single dimension of the
 * associated {@link cdo.GroupingSpec} to this type.
 *
 * @property {boolean|null} requireIsDiscrete
 * Indicates if
 * only discrete, when <tt>true</tt>,
 * continuous, when <tt>false</tt>,
 * or any, when <tt>null</tt>,
 * groupings are accepted.
 *
 * @property {string} defaultDimensionName The default dimension name.
 *
 * @property {boolean} autoCreateDimension Indicates if a dimension with the default name (the first level of, when a group name),
 * should be created when the role has not been read by a translator (required or not).
 *
 * @constructor
 * @param {string} name The local name of the role.
 * @param {object} [keyArgs] Keyword arguments.
 * @param {string} [keyArgs.plot] The owner plot of the visual role, when there is one.
 * @param {string} [keyArgs.label] The label of this role.
 *
 * @param {boolean} [keyArgs.isRequired=false] Indicates a required role.
 *
 * @param {boolean} [keyArgs.requireSingleDimension] Indicates that the role
 * can only be satisfied by a single dimension.
 * Defaults to <tt>true</tt> when <i>requireIsDiscrete</i> is <tt>false</tt> (continuous dimension),
 * and to <tt>false</tt>, otherwise.
 *
 * @param {boolean} [keyArgs.isMeasure=false] Indicates that <b>datums</b> that do not
 * contain a non-null atom in any of the dimensions bound to measure roles should be readily excluded.
 *
 * @param {boolean} [keyArgs.valueType] Restricts the allowed value type of dimensions.
 *
 * @param {boolean|null} [keyArgs.requireIsDiscrete=null] Indicates if the grouping should be discrete, continuous or any.
 *
 * @param {string} [keyArgs.defaultDimensionName] The default dimension name.
 * @param {boolean} [keyArgs.autoCreateDimension=false]
 * Indicates if a dimension with the default name (the first level of, when a group name),
 * should be created when the role is required and it has not been read by a translator.
 *
 * @param {cdo.FlatteningMode} [keyArgs.flatteningMode=cdo.FlatteningMode.SingleLevel]
 * Indicates the type of data set flattening that the role performs.
 */
def
.type('pvc.visual.Role')
.init(function(chart, name, keyArgs) {

    this.uid = "r" + def.nextId("visual-role");

    this.chart = chart;
    this.name  = name;

    this.label = def.get(keyArgs, 'label') || def.titleFromName(name);
    this.index = def.get(keyArgs, 'index') || 0;
    this.plot  = def.get(keyArgs, 'plot') || null;

    this._legend = {visible: true};
    this.dimensionDefaults = def.get(keyArgs, 'dimensionDefaults') || {};

    this._isReversed = false;

    this.isRequired = !!def.get(keyArgs, 'isRequired', false);
    this.autoCreateDimension = !!def.get(keyArgs, 'autoCreateDimension', false);

    var defaultSourceRoleName = def.get(keyArgs, 'defaultSourceRole');
    if(defaultSourceRoleName) {
        this.defaultSourceRoleName = this.plot
            ? this.plot.ensureAbsRoleRef(defaultSourceRoleName)
            : defaultSourceRoleName;
    }

    var defaultDimensionName = def.get(keyArgs, 'defaultDimension');
    if(defaultDimensionName) {
        this.defaultDimensionName = defaultDimensionName;

        var match = defaultDimensionName.match(/^(.*?)(\*)?$/);
        this.defaultDimensionGroup  =   match[1];
        this.defaultDimensionGreedy = !!match[2];
    }

    this.rootLabel = def.get(keyArgs, 'rootLabel');

    this.flatteningModes = def.get(keyArgs, 'flatteningModes');
    this.flatteningMode = def.get(keyArgs, 'flatteningMode');

    if(!defaultDimensionName && this.autoCreateDimension) {
        throw def.error.argumentRequired('defaultDimension');
    }

    var requireSingleDimension = def.get(keyArgs, 'requireSingleDimension'),
        requireIsDiscrete      = def.get(keyArgs, 'requireIsDiscrete'), // isSingleDiscrete
        requireContinuous      = requireIsDiscrete != null && !requireIsDiscrete;

    // If only continuous dimensions are accepted,
    // then *default* requireSingleDimension to true.
    // Otherwise, default to false.
    if(requireSingleDimension == null) {
        requireSingleDimension = requireContinuous;
    }

    if(!requireIsDiscrete) {
        if(def.get(keyArgs, 'isMeasure')) {
            this.isMeasure = true;
            var isNormalized = def.get(keyArgs, 'isNormalized');

            if(isNormalized || def.get(keyArgs, 'isPercent')) this.isPercent = true;
            if(isNormalized) this.isNormalized = true;
        }
    }

    // Complex types are shared by all visual roles with the same local name.
    // Also, the same name is used in the extensionAtoms, whatever the plot (if any) of the visual role.
    // @see pvc.visual.Role.parseDataSetName
    // e.g. `valueRole`
    this.boundDimensionsDataSetName = this.isMeasure ? (name + 'Role') : null;

    this.discriminatorDimensionFullName = this.isMeasure ? (this.boundDimensionsDataSetName + '.dim') : null;

    var valueType = def.get(keyArgs, 'valueType', null);
    if(valueType !== this.valueType) {
        this.valueType =
        this.dimensionDefaults.valueType = valueType;
    }

    if(requireSingleDimension !== this.requireSingleDimension)
        this.requireSingleDimension = requireSingleDimension;

    if(requireIsDiscrete != null) {
        this.requireIsDiscrete =
        this.dimensionDefaults.isDiscrete = !!requireIsDiscrete;
    }

    this._sourceRole = null;
    this.grouping = null;
})
.add(/** @lends pvc.visual.Role# */{
    requireSingleDimension: false,
    valueType: null,
    requireIsDiscrete: null,
    isMeasure: false,
    isNormalized: false,
    isPercent: false,
    defaultSourceRoleName: null,
    defaultDimensionName:  null,
    defaultDimensionGroup: null,
    defaultDimensionGreedy: null,
    label: null,
    _rootSourceRole: undefined,
    _legend: null,

    prettyId: function() {
        return (this.plot ? (this.plot.prettyId + ".") : "") + this.name;
    },

    /**
     * Configures the legend options of the visual role.
     *
     * Not every visual role supports legend options.
     *
     * @param {object|boolean} [_] The legend options.
     * @return {pvc.visual.Role|object} <tt>this</tt> or the current legend options.
     * Do NOT modify the returned object.
     */
    legend: function(_) {
        if(arguments.length) {
            if(_ != null) {
                switch(typeof _) {
                    case 'boolean':
                        this._legend.visible = !!_;
                        break;
                    case 'object':
                        def.each(_, function(v, p) {
                            if(v !== undefined) {
                                if(p === 'visible') v = !!v;
                                this[p] = v;
                            }
                        }, this._legend);
                        break;
                }
            }
            return this;
        }

        return this._legend;
    },

    // region Dimensions Information
    /**
     * Obtains the first dimension type that is bound to the role.
     * @type cdo.DimensionType
     * @deprecated When bound,
     * use this.grouping.firstDimension.dimensionType or this.grouping.singleDimensionType
     */
    firstDimensionType: function() {
        var g = this.grouping;
        return g && g.firstDimensionType();
    },

    /**
     * Obtains the name of the first dimension type that is bound to the role.
     * @type string
     *
     * @deprecated When bound, use this.grouping.firstDimension.name or this.grouping.singleDimensionName
     */
    firstDimensionName: function() {
        var g = this.grouping;
        return g && g.firstDimensionName();
    },

    /**
     * Obtains the value type of the first dimension type that is bound to the role.
     * @type function
     *
     * @deprecated When bound,
     * use this.grouping.firstDimension.dimensionType.valueType or this.grouping.singleContinuousValueType
     */
    firstDimensionValueType: function() {
        var g = this.grouping;
        return g && g.firstDimensionValueType();
    },

    /**
     * Obtains the last dimension type that is bound to the role.
     * @type cdo.DimensionType
     *
     * @deprecated When bound,
     * use this.grouping.lastDimension.dimensionType or this.grouping.singleDimensionType
     */
    lastDimensionType: function() {
        var g = this.grouping;
        return g && g.lastDimensionType();
    },

    /**
     * Obtains the name of the last dimension type that is bound to the role.
     * @type string
     *
     * @deprecated When bound, use this.grouping.lastDimension.name or this.grouping.singleDimensionName
     */
    lastDimensionName: function() {
        var g = this.grouping;
        return g && g.lastDimensionName();
    },

    /**
     * Obtains the value type of the last dimension type that is bound to the role.
     * @type function
     *
     * @deprecated When bound,
     * use this.grouping.lastDimension.dimensionType.valueType or this.grouping.singleContinuousValueType
     */
    lastDimensionValueType: function() {
        var g = this.grouping;
        return g && g.lastDimensionValueType();
    },
    // endregion

    // TODO: Currently, all uses of isMeasure visual roles are of a
    // numeric type, and the code assumes that this is the case throughout.
    /**
     * Indicates that the visual role is a measure, is bound and is not discrete.
     *
     * @type {?boolean}
     * @readOnly
     */
    get isMeasureEffective() {
        if(!this.isMeasure) return false;
        if(this.isBound()) return !this.isDiscrete();
        return null;
    },

    /**
     * Gets a value that indicates if the visual role is considered discrete.
     *
     * A visual role is discrete if it is bound to a grouping which is discrete.
     *
     * @return {?boolean} `true` if the visual role is discrete;
     *   `false` if the visual role is not discrete;
     *   `null` if the visual role is unbound.
     */
    isDiscrete: function() {
        var g = this.grouping;
        return g && g.isDiscrete();
    },

    /**
     * Gets or sets the visual role that is the source of this one.
     *
     * @type {pvc.visual.Role}
     */
    get sourceRole() {
        return this._sourceRole;
    },

    set sourceRole(value) {
        this._sourceRole = value || null;
        this._rootSourceRole = undefined;
    },

    /**
     * Gets the visual role that is the root source of this one, if any, or `null`, if none.
     *
     * @type {pvc.visual.Role}
     */
    get rootSourceRole() {
        var r = this._rootSourceRole, r2;
        if(r === undefined) {
            r = this.sourceRole;
            if(r !== null) {
                while((r2 = r.sourceRole) !== null) {
                    r = r2;
                }
            }
            this._rootSourceRole = r;
        }
        return r;
    },

    get isReversed() {
        return this._isReversed;
    },

    set isReserved(value) {
        this._isReversed = !!value;
    },

    _flatteningModes: cdo.FlatteningMode.AllMask,

    get flatteningModes() {
        return this._flatteningModes;
    },

    set flatteningModes(value) {

        value = def.nullyTo(value, cdo.FlatteningMode.AllMask);

        // Ensure we go into a subset of the previous value.
        if(this._flatteningModes !== value) {

            value = this._flatteningModes & value;
            if(!value) {
                throw def.error.argumentInvalid("flatteningModes", "Cannot become empty.");
            }

            this._flatteningModes = value;

            // If the current flattening mode is not valid,
            // choose the first one (least-significant bit one).
            var flatMode = this.flatteningMode & value;
            if(!flatMode) {
                flatMode = value & (-value);
                this.flatteningMode = flatMode;
            }
        }
    },

    _flatteningMode: cdo.FlatteningMode.SingleLevel,

    get flatteningMode() {
        return this._flatteningMode;
    },

    set flatteningMode(value) {

        if(value != null && value !== this._flatteningMode) {

            if(!(value & this.flatteningModes)) {
                throw def.error.argumentInvalid("flatteningMode", "Value is not currently valid.");
            }

            this._flatteningMode = value;
        }
    },

    get rootLabel() {
        return this._rootLabel;
    },

    set rootLabel(value) {

        if(!value) {
            value = "";
        }

        if(value !== this._rootLabel) {

            this._rootLabel = value;

            if(this.grouping) {
                this._setGrouping(this.grouping);
            }
        }
    },

    // region Operations
    /**
     * Gets a data set that is the result of grouping the
     * given data set according to this visual role's flattened grouping specification.
     *
     * @param {!cdo.Data} data - The data on which to apply the operation.
     *
     * @param {object} [keyArgs] - Keyword arguments.
     *
     * @param {Object.<string, !cdo.Data>} [keyArgs.extensionDataSetsMap] - A data sets map containing a data set for
     * each of the visual role's grouping specification's required extension complex types:
     * {@link cdo.GroupingSpec#extensionComplexTypeNames}.
     *
     * @param {boolean} [keyArgs.reverse = false] Reverses the sorting order of the groupings' dimensions.
     * @param {boolean} [keyArgs.isNull = null] - Only considers datums with the specified isNull attribute.
     * @param {boolean} [keyArgs.visible = null] - Only considers datums that have the specified visible state.
     * @param {boolean} [keyArgs.selected = null] - Only considers datums that have the specified selected state.
     * @param {function} [keyArgs.where] - A datum predicate.
     * @param {string} [keyArgs.whereKey] - A key for the specified datum predicate.
     * If <tt>keyArgs.where</tt> is specified and this argument is not, the results will not be cached.
     *
     * @return {cdo.Data} A linked data.
     *
     * @see pvc.visual.Role#flattenedGrouping
     * @see cdo.Data#groupBy
     * @see pvc.visual.Axis#domainGroupOperator
     */
    flatten: function(data, keyArgs) {

        keyArgs = def.whiteList(keyArgs, visualRole_flatten_select_keyArgs) || {};

        if(!keyArgs.extensionDataSetsMap) {
            keyArgs.extensionDataSetsMap = (this.plot || this.chart).boundDimensionsDataSetsMap;
        }

        return data.groupBy(this.flattenedGrouping(keyArgs), keyArgs);
    },

    /**
     * Gets a flattened version of this visual role's grouping specification.
     *
     * @return {!cdo.GroupingSpec} A grouping specification.
     */
    flattenedGrouping: function() {

        var grouping = this.grouping || def.fail.operationInvalid("Role is unbound.");

        grouping = grouping.ensure({flatteningMode: this.flatteningMode});

        return grouping;
    },

    /**
     * Gets a data set that is the result of grouping the
     * given data set according to this visual role's grouping specification.
     *
     * Note that the visual role's {@link #flatteningMode} is not considered.
     * It is only applied when calling {@link #flatten}.
     *
     * @param {!cdo.Data} data - The data on which to apply the operation.
     *
     * @param {object} [keyArgs] - Keyword arguments.
     *
     * @param {Object.<string, !cdo.Data>} [keyArgs.extensionDataSetsMap] - A data sets map containing a data set for
     * each of the visual role's grouping specification's required extension complex types:
     * {@link cdo.GroupingSpec#extensionComplexTypeNames}.
     *
     * @param {boolean} [keyArgs.reverse = false] Reverses the sorting order of the groupings' dimensions.
     * @param {boolean} [keyArgs.isNull = null] - Only considers datums with the specified isNull attribute.
     * @param {boolean} [keyArgs.visible = null] - Only considers datums that have the specified visible state.
     * @param {boolean} [keyArgs.selected = null] - Only considers datums that have the specified selected state.
     * @param {function} [keyArgs.where] - A datum predicate.
     * @param {string} [keyArgs.whereKey] - A key for the specified datum predicate.
     * If <tt>keyArgs.where</tt> is specified and this argument is not, the results will not be cached.
     *
     * @return {cdo.Data} A linked data.
     *
     * @see cdo.Data#groupBy
     * @see pvc.visual.Axis#domainGroupOperator
     * @see pvc.visual.Role#flatten
     */
    select: function(data, keyArgs) {

        var grouping = this.grouping || def.fail.operationInvalid("Role is unbound.");

        keyArgs = def.whiteList(keyArgs, visualRole_flatten_select_keyArgs);

        if(!keyArgs.extensionDataSetsMap) {
            keyArgs.extensionDataSetsMap = (this.plot || this.chart).boundDimensionsDataSetsMap;
        }

        return data.groupBy(grouping, keyArgs);
    },

    view: function(complex) {
        var grouping = this.grouping;
        if(grouping) return grouping.view(complex);
    },
    // endregion

    // region Bind
    /**
     * Pre-binds a grouping specification to playing this role.
     *
     * @param {cdo.GroupingSpec} groupingSpec The grouping specification of the visual role.
     */
    preBind: function(groupingSpec) {
        this.__grouping = groupingSpec;
        return this;
    },

    isPreBound: function() {
        return !!this.__grouping;
    },

    preBoundGrouping: function() {
        return this.__grouping;
    },

    isBound: function() {
        return !!this.grouping;
    },

    // region Bound Dimensions Data Set
    /**
     * Gets the data set of bound dimensions of a measure visual role.
     *
     * This data set contains one datum per dimension that is bound to this visual role.
     *
     * While the visual role is not bound, the returned data-set will not contain any datums.
     *
     * @return {!cdo.Data} The bound dimensions data set.
     *
     * @throws {Error} When the visual role is not an `isMeasure` visual role.
     */
    get boundDimensionsDataSet() {
        var data = this._boundDimsData;
        if(!data) {
            var baseData = this.chart.getBoundDimensionsDataSetOf(this);

            // Linked data based on a _where_ predicate
            this._boundDimsData = data = baseData.where(null, {
                where: this._isBoundDimensionDatum.bind(this)
            });
        }

        return data;
    },

    _isBoundDimensionDatum: function(datum) {
        var grouping = this.grouping;
        if(grouping) {
            var boundDimName = datum.atoms.dim.value;
            return grouping.dimensionNames().indexOf(boundDimName) >= 0;
        }
        return false;
    },

    /**
     * Loads the base data set of bound dimensions with one datum per dimension of the current grouping.
     *
     * @private
     */
    _loadDimensionsDataSet: function() {

        var data = this.boundDimensionsDataSet;

        var owner = data.owner;
        var mainComplexType = this.grouping.complexType;

        var datums = this.grouping.dimensionNames().map(function(mainDimName) {

            var mainDimType = mainComplexType.dimensions(mainDimName);

            return new cdo.Datum(owner, {
                "dim": {v: mainDimName, f: mainDimType.label}
            });
        });

        // Add datums to the *owner* data set, which then are added to linked children through filtering,
        // as assumed to have been setup in `data` (see `boundDimensionsDataSet`).
        owner.add(datums);
    },
    // endregion

    /**
     * Finalizes a binding initiated with {@link #preBind}.
     *
     * @param {cdo.ComplexType} complexType The complex type with which
     *   to bind the pre-bound grouping and then validate the
     *   grouping and role binding.
     *
     * @param {Object.<string, cdo.ComplexType>} [extensionComplexTypesMap] A map of extension complex types by name.
     */
    postBind: function(complexType, extensionComplexTypesMap) {
        var grouping = this.__grouping;
        if(grouping) {
            if(!grouping.isNull) {

                // May throw if binding is not valid.
                grouping.bind(complexType, extensionComplexTypesMap);

                // May throw if binding is not valid.
                this.bind(grouping);
            } else {

            }

            // Only stop being pre-bound if no error occurs.
            delete this.__grouping;
        }

        return this;
    },

    /**
     * Binds a grouping specification to playing this role.
     *
     * The specified grouping specification must be bound and non-null.
     * Also, it must also conform to this visual role's specific requirements,
     * such as {@link #requireSingleDimension} and {@link #requireIsDiscrete}.
     *
     * @param {!cdo.GroupingSpec} groupingSpec The grouping specification of the visual role.
     *
     * @throws {Error} When the visual role is already bound.
     * @throws {Error} When the grouping is not compatible with this visual role.
     */
    bind: function(groupingSpec) {

        if(!groupingSpec) throw def.error.argumentRequired("groupingSpec");
        if(this.grouping) throw def.error.operationInvalid("Visual role is already bound");

        this._coerceGrouping(groupingSpec);

        this._setGrouping(groupingSpec);

        if(this.isMeasureEffective) {
            this._loadDimensionsDataSet();
            this._setupGetBoundDimensionName();
        }

        return this;
    },

    _coerceGrouping: function(groupingSpec) {

        if(!groupingSpec.isBound) throw def.error.operationInvalid("Cannot bind to an unbound grouping.");

        if(groupingSpec.isNull) throw def.error.operationInvalid("Cannot bind to a null grouping.");

        // Validate grouping spec according to role

        if(this.requireSingleDimension && !groupingSpec.isSingleDimension)
            throw def.error.operationInvalid(
                    "Role '{0}' only accepts a single dimension.",
                    [this.name]);

        var valueType = this.valueType;
        var requireIsDiscrete = this.requireIsDiscrete;

        groupingSpec.dimensions().each(function(dimSpec) {
            var dimType = dimSpec.dimensionType;
            if(valueType && dimType.valueType !== valueType)
                throw def.error.operationInvalid(
                        "Role '{0}' cannot be bound to dimension '{1}'. \nIt only accepts dimensions of type '{2}' and not of type '{3}'.",
                        [this.name, dimType.name, cdo.DimensionType.valueTypeName(valueType), dimType.valueTypeName]);

            if(requireIsDiscrete != null && dimType.isDiscrete !== requireIsDiscrete) {
                if(!requireIsDiscrete)
                    throw def.error.operationInvalid(
                        "Role '{0}' cannot be bound to dimension '{1}'.\nIt only accepts continuous dimensions.",
                        [this.name, dimType.name]);

                // A continuous dimension can be "coerced" to behave as discrete
                dimType._toDiscrete();
            }
        }, this);
    },

    canHaveSource: function(source) {
        var valueType = this.valueType;
        return valueType == null || valueType === source.valueType;
    },

    // Called when groupingSpec is set or when rootLabel is changed.
    _setGrouping: function(groupingSpec) {

        // flatteningMode is only reflected on a derived grouping when calling flatten,
        // but not when calling select.
        groupingSpec = groupingSpec.ensure({rootLabel: this.rootLabel});

        if(this.isReversed) {
            groupingSpec = groupingSpec.reverse();
        }

        this.grouping = groupingSpec;
    },

    _setupGetBoundDimensionName: function() {
        var roleDiscrimDimName = this.discriminatorDimensionFullName;
        var roleBoundDimsDataSet = this.boundDimensionsDataSet;
        var singleDimensionName = this.grouping.isSingleDimension ? this.grouping.singleDimensionName : null;

        this.getBoundDimensionName = function(groupData, isOptional) {
            var dimName;
            var discrimAtom = groupData.atoms[roleDiscrimDimName];
            if(discrimAtom === undefined || (dimName = discrimAtom.value) === null) {
                if(singleDimensionName !== null) {
                    // Fast path.
                    return singleDimensionName;
                }

                if(isOptional) return null;
                throw this._errorMustBindDiscrimDimension();
            }

            // Is the value dimension one of the visual role's bound dimensions?
            // If multi-chart is bound to the discriminator dimensions and multiple plots with different value role bindings are used,
            // it can happen.
            if(!roleBoundDimsDataSet.datumByKey(dimName)) {
                if(isOptional) return null;
                throw this._errorMustBindDiscrimDimension();
            }

            return dimName;
        };
    },

    _errorMustBindDiscrimDimension: function() {
        return new def.error.operationInvalid("Must bind the measure discriminator dimension '" + this.discriminatorDimensionFullName + "'.");
    },

    getBoundDimensionName: function(groupData, isOptional) {
        throw def.error.operationInvalid("Not a bound measure visual role.");
    },

    isBoundDimensionName: function(childData, dimName) {
        return this.getBoundDimensionName(childData, /* isOptional: */true) === dimName;
    },

    isBoundDimensionCompatible: function(groupData) {
        var roleDiscrimDimName = this.discriminatorDimensionFullName;
        var roleBoundDimsDataSet = this.boundDimensionsDataSet;

        var discrimAtom = groupData.atoms[roleDiscrimDimName];
        if(discrimAtom === undefined || discrimAtom.value === null) {
            return true;
        }

        var dimName = discrimAtom.value;
        return !!roleBoundDimsDataSet.datumByKey(dimName);
    },

    getCompatibleBoundDimensionNames: function(groupData) {
        var roleDiscrimDimName = this.discriminatorDimensionFullName;
        var roleBoundDimsDataSet = this.boundDimensionsDataSet;

        var discrimAtom = groupData.atoms[roleDiscrimDimName];
        if(discrimAtom === undefined || discrimAtom.value === null) {
            return this.grouping.dimensionNames();
        }

        var dimName = discrimAtom.value;
        return roleBoundDimsDataSet.datumByKey(dimName) !== null ? [dimName] : [];
    },

    numberValueOf: function(data, keyArgs) {

        if(this.grouping.isSingleDimension) {
            // Better cache reuse using this method.
            return data.dimensionNumberValue(this.grouping.singleDimensionName, keyArgs);
        }

        keyArgs = this._getDimensionOperKeyArgs(keyArgs);

        return data.dimensionNumberValue(this.getBoundDimensionName.bind(this), keyArgs);
    },

    percentOf: function(childData, keyArgs) {

        if(this.grouping.isSingleDimension) {
            return childData.dimensionPercentValue(this.grouping.singleDimensionName, keyArgs);
        }

        keyArgs = this._getDimensionOperKeyArgs(keyArgs);

        return childData.dimensionPercentValue(this.getBoundDimensionName.bind(this), keyArgs);
    },

    _getDimensionOperKeyArgs: function(keyArgs) {

        keyArgs = keyArgs ? Object.create(keyArgs) : {};

        keyArgs.discrimKey = this.uid;

        // The discriminator dimension can not be set in two cases:
        // * hierarchical scenes, in which the discrim is only set in a deeper data set.
        // * the discriminator dimension was not bound to any visual role...
        // Providing this argument enables the summing the value of all dimensions,
        // when a discriminator dimension is not set.
        keyArgs.discrimPossibleDims = this.grouping.allDimensionNames;

        return keyArgs;
    }
    // endregion
})
.type()
.add(/** @lends pvc.visual.Role */{
    /**
     * Processes a visual role configuration and returns a processed version of it.
     * Used by {@link pvc.visual.rolesBinder}.
     *
     * @private
     */
    readConfig: function(config, name, lookup) {
        // Process the visual role configuration.
        // * a string with the grouping dimensions, or
        // * {dimensions: "product", isReversed:true, from: "series", legend: null}
        var parsed = {isReversed: false, source: null, grouping: null, legend: null},
            groupSpec;

        if(def.object.is(config)) {
            if(config.isReversed) parsed.isReversed = true;
            parsed.legend = config.legend;

            var sourceName = config.from;
            if(sourceName) {
                if(sourceName === name) throw def.error.operationInvalid("Invalid source role.");

                parsed.source = lookup(sourceName) ||
                    def.fail.operationInvalid("Source visual role '{0}' is not defined.", [sourceName]);
            } else {
                groupSpec = config.dimensions;
            }
        } else if(config === null || def.string.is(config)) {
            // null or "" groupings are relevant.
            groupSpec = config;
        }

        // null or "" groupings are relevant.
        if(groupSpec !== undefined) {
            parsed.grouping = cdo.GroupingSpec.parse(groupSpec);
        }

        return parsed;
    },

    parseDataSetName: function(dataSetName) {
        var m = /^(.+?)Role$/.exec(dataSetName);
        return m && m[1];
    }
});

