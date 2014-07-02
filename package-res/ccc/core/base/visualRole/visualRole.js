/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def
.space('pvc.visual')
.TraversalMode = def.makeEnum([
    'Tree',           // No flattening.
    'FlattenLeafs',   // Flattened. Transformed to a new grouping with all dimensions in a single grouping level.
    'FlattenDfsPre',  // Flattened. Transformed to a grouping having the same grouping levels and dimensions,
                      //   but where all nodes are output, in Dfs-pre order, at level 1.
    'FlattenDfsPost'  // Flattened. Idem, but in Dfs-Post order.
], {all: 'AllMask'});

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
 * @param {pvc.visual.TraversalMode} [keyArgs.traversalMode=pvc.visual.TraversalMode.FlattenLeafs]
 * Indicates the type of data nodes traversal that the role performs.
 */
def
.type('pvc.visual.Role')
.init(function(name, keyArgs) {
    this.name  = name;
    this.label = def.get(keyArgs, 'label') || def.titleFromName(name);
    this.index = def.get(keyArgs, 'index') || 0;
    this.plot  = def.get(keyArgs, 'plot');
    this._legend = {visible: true};
    this.dimensionDefaults = def.get(keyArgs, 'dimensionDefaults') || {};
    
    if(def.get(keyArgs, 'isRequired', false)) this.isRequired = true;
    if(def.get(keyArgs, 'autoCreateDimension', false)) this.autoCreateDimension = true;
    
    var defaultSourceRoleName = def.get(keyArgs, 'defaultSourceRole');
    if(defaultSourceRoleName) {
        this.defaultSourceRoleName = this.plot
            ? this.plot.ensureAbsRoleRef(defaultSourceRoleName)
            : defaultSourceRoleName;
    }
    
    var defaultDimensionName = def.get(keyArgs, 'defaultDimension');
    if(defaultDimensionName) this.defaultDimensionName = defaultDimensionName;

    var rootLabel = def.get(keyArgs, 'rootLabel');
    if(rootLabel != null) this.rootLabel = rootLabel;

    var traversalModes = def.get(keyArgs, 'traversalModes');
    if(traversalModes) this.setTraversalModes(traversalModes);

    var traversalMode = def.get(keyArgs, 'traversalMode');
    if(traversalMode) this.setTraversalMode(traversalMode);

    if(!defaultDimensionName && this.autoCreateDimension) throw def.error.argumentRequired('defaultDimension');

    var requireSingleDimension = def.get(keyArgs, 'requireSingleDimension'),
        requireIsDiscrete      = def.get(keyArgs, 'requireIsDiscrete'), // isSingleDiscrete
        requireContinuous      = requireIsDiscrete != null && !requireIsDiscrete;

    // If only continuous dimensions are accepted,
    // then *default* requireSingleDimension to true.
    // Otherwise, default to false.
    if(requireSingleDimension == null) requireSingleDimension = requireContinuous;

    if(!requireIsDiscrete) {
        if(def.get(keyArgs, 'isMeasure')) {
            this.isMeasure = true;

            if(def.get(keyArgs, 'isPercent')) this.isPercent = true;
        }
    }

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
})
.add(/** @lends pvc.visual.Role# */{
    isRequired: false,
    requireSingleDimension: false,
    valueType: null,
    requireIsDiscrete: null,
    isMeasure: false,
    isPercent: false,
    defaultSourceRoleName: null,
    defaultDimensionName:  null,
    grouping: null,
    traversalMode:  pvc.visual.TraversalMode.FlattenLeafs,
    traversalModes: pvc.visual.TraversalMode.AllMask, // possible values
    rootLabel: '',
    autoCreateDimension: false,
    isReversed: false,
    label: null,
    sourceRole: null,
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

    /** 
     * Obtains the first dimension type that is bound to the role.
     * @type cdo.DimensionType
     */
    firstDimensionType: function() {
        var g = this.grouping;
        return g && g.firstDimensionType();
    },
    
    /** 
     * Obtains the name of the first dimension type that is bound to the role.
     * @type string 
     */
    firstDimensionName: function() {
        var g = this.grouping;
        return g && g.firstDimensionName();
    },
    
    /** 
     * Obtains the value type of the first dimension type that is bound to the role.
     * @type function
     */
    firstDimensionValueType: function() {
        var g = this.grouping;
        return g && g.firstDimensionValueType();
    },

    /** 
     * Obtains the last dimension type that is bound to the role.
     * @type cdo.DimensionType
     */
    lastDimensionType: function() {
        var g = this.grouping;
        return g && g.lastDimensionType();
    },
    
    /** 
     * Obtains the name of the last dimension type that is bound to the role.
     * @type string 
     */
    lastDimensionName: function() {
        var g = this.grouping;
        return g && g.lastDimensionName();
    },
    
    /** 
     * Obtains the value type of the last dimension type that is bound to the role.
     * @type function
     */
    lastDimensionValueType: function() {
        var g = this.grouping;
        return g && g.lastDimensionValueType();
    },

    isDiscrete: function() {
        var g = this.grouping;
        return g && g.isDiscrete();
    },

    /**
     * Sets the visual role that is the source of this one.
     * @param {pvc.visual.Role} sourceRole The source visual role.
     */
    setSourceRole: function(sourceRole) {
        this.sourceRole = sourceRole;
    },
    
    setIsReversed: function(isReversed) {
        if(!isReversed) delete this.isReversed;
        else            this.isReversed = true;
    },
    
    setTraversalMode: function(travMode) {
        var T = pvc.visual.TraversalMode;
        
        travMode = def.nullyTo(travMode, T.FlattenLeafs);
        
        if(travMode !== this.traversalMode) {
            if(!(travMode & this.traversalModes))
                throw def.error.argumentInvalid("traversalMode", "Value is not currently valid.");

            if(travMode === T.FlattenLeafs) // default value
                delete this.traversalMode;
            else
                this.traversalMode = travMode;
        }
    },

    setTraversalModes: function(travModes) {
        // Ensure we go into a subset of the previous value.
        travModes = (this.traversalModes &= travModes);

        if(!travModes) throw def.error.argumentInvalid("traversalModes", "Cannot become empty.");

        // If the current traversal mode is not valid,
        // choose the first one (least-significant bit one).
        var travMode = this.traversalMode & travModes;
        if(!travMode) {
            travMode = travModes & (-travModes);
            this.setTraversalMode(travMode);
        }
    },

    setRootLabel: function(rootLabel) {
        if(rootLabel !== this.rootLabel) {
            if(!rootLabel) delete this.rootLabel; // default value shows through
            else           this.rootLabel = rootLabel;
            
            if(this.grouping) this._updateBind(this.grouping);
        }
    },

    /**
     * Applies this role's grouping to the specified data
     * after ensuring the grouping is of a certain type.
     *
     * @param {cdo.Data} data The data on which to apply the operation.
     * @param {object} [keyArgs] Keyword arguments.
     * ...
     * 
     * @type cdo.Data
     */
    flatten: function(data, keyArgs) {
        var grouping = this.flattenedGrouping(keyArgs) || def.fail.operationInvalid("Role is unbound.");
            
        return data.groupBy(grouping, keyArgs);
    },

    flattenedGrouping: function(keyArgs) {
        var grouping = this.grouping;
        if(grouping) {
            keyArgs = keyArgs ? Object.create(keyArgs) : {};

            var flatMode = keyArgs.flatteningMode;
            if(flatMode == null) flatMode = keyArgs.flatteningMode = this._flatteningMode();
            
            if(keyArgs.isSingleLevel == null && !flatMode) keyArgs.isSingleLevel = true;
            
            return grouping.ensure(keyArgs);
        }
    },

    _flatteningMode: function() {
        var Trav = pvc.visual.TraversalMode, Flat = cdo.FlatteningMode;

        // This seems to be the only practical use of this.traversalMode
        // and its possible value Tree is never distinguished from single level...
        // It even looks like that in #flattenedGrouping(),
        // when here Flat.None is returned the default value for isSingleLevel is true,
        // not taking into account the distinction between Tree and FlattenLeafs (single level)...
        // In practice, ignoring the value Tree and taking it always to mean FlattenLeafs.

        switch(this.traversalMode) {
            case Trav.FlattenDfsPre:  return Flat.DfsPre;
            case Trav.FlattenDfsPost: return Flat.DfsPost;
        }
        return Flat.None;
    },
    
    select: function(data, keyArgs) {
        var grouping = this.grouping;
        if(grouping) {
            def.setUDefaults(keyArgs, 'flatteningMode', cdo.FlatteningMode.None);
            return data.groupBy(grouping.ensure(keyArgs), keyArgs); 
        }
    },

    view: function(complex) {
        var grouping = this.grouping;
        if(grouping) return grouping.view(complex);
    },

    /**
     * Pre-binds a grouping specification to playing this role.
     * 
     * @param {cdo.GroupingSpec} groupingSpec The grouping specification of the visual role.
     */
    preBind: function(groupingSpec) {
        this.__grouping = groupingSpec;
        return this;
    },

    isPreBound: function() { return !!this.__grouping; },
    
    preBoundGrouping: function() { return this.__grouping; },
    
    isBound: function() { return !!this.grouping; },
    
    /**
     * Finalizes a binding initiated with {@link #preBind}.
     *
     * @param {cdo.ComplexType} type The complex type with which
     * to bind the pre-bound grouping and then validate the
     * grouping and role binding.
     */
    postBind: function(type) {
        var grouping = this.__grouping;
        if(grouping) {
            delete this.__grouping;

            grouping.bind(type);

            this.bind(grouping);
        }
        
        return this;
    },

    /**
     * Binds a grouping specification to playing this role.
     * 
     * @param {cdo.GroupingSpec} groupingSpec The grouping specification of the visual role.
     */
    bind: function(groupingSpec) {
        
        groupingSpec = this._validateBind(groupingSpec);
        
        this._updateBind(groupingSpec);

        return this;
    },
    
    _validateBind: function(groupingSpec) {
        if(groupingSpec) {
            if(groupingSpec.isNull()) {
                groupingSpec = null;
           } else {
                /* Validate grouping spec according to role */

                if(this.requireSingleDimension && !groupingSpec.isSingleDimension)
                    throw def.error.operationInvalid(
                            "Role '{0}' only accepts a single dimension.",
                            [this.name]);

                var valueType = this.valueType,
                    requireIsDiscrete = this.requireIsDiscrete;
                groupingSpec.dimensions().each(function(dimSpec) {
                    var dimType = dimSpec.type;
                    if(valueType && dimType.valueType !== valueType)
                        throw def.error.operationInvalid(
                                "Role '{0}' cannot be bound to dimension '{1}'. \nIt only accepts dimensions of type '{2}' and not of type '{3}'.",
                                [this.name, dimType.name, cdo.DimensionType.valueTypeName(valueType), dimType.valueTypeName]);

                    if(requireIsDiscrete != null && dimType.isDiscrete !== requireIsDiscrete) {
                        if(!requireIsDiscrete)
                            throw def.error.operationInvalid(
                                "Role '{0}' cannot be bound to dimension '{1}'. \nIt only accepts {2} dimensions.",
                                [this.name, dimType.name, requireIsDiscrete ? 'discrete' : 'continuous']);

                        // A continuous dimension can be "coerced" to behave as discrete
                        dimType._toDiscrete();
                    }
                }, this);
            }
        }
        
        return groupingSpec;
    },

    canHaveSource: function(source) {
        var tvt = this.valueType;
        return tvt == null || tvt === source.valueType;
    },

    _updateBind: function(groupingSpec) {

        this.grouping = groupingSpec;
        
        if(this.grouping) {
            this.grouping = this.grouping.ensure({
                reverse:   this.isReversed, 
                rootLabel: this.rootLabel
            });
        }
    }
})
.addStatic(/** @lends pvc.visual.Role */{
    parse: function(lookup, name, config) {
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
            groupSpec = config;
        }

        if(groupSpec !== undefined) parsed.grouping = cdo.GroupingSpec.parse(groupSpec);

        return parsed;
    }
});

