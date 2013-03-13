
pvc.BaseChart
.add({
    /**
     * A map of {@link pvc.visual.Role} by name.
     * 
     * @type object
     */
    visualRoles: null,
    visualRoleList: null,
    
    _serRole: null,
    _dataPartRole: null,
    
    /**
     * An array of the {@link pvc.visual.Role} that are measures.
     * 
     * @type pvc.visual.Role[]
     */
    _measureVisualRoles: null,
    
    /**
     * Obtains an existing visual role given its name.
     * An error is thrown if a role with the specified name is not defined.
     * 
     * @param {string} roleName The role name.
     * @type pvc.data.VisualRole 
     */
    visualRole: function(roleName) {
        var role = def.getOwn(this.visualRoles, roleName);
        if(!role) { 
            throw def.error.operationInvalid('roleName', "There is no visual role with name '{0}'.", [roleName]);
        }
        return role;
    },

    measureVisualRoles: function() { return this._measureVisualRoles; },

    measureDimensionsNames: function() {
        return def.query(this._measureVisualRoles)
           .select(function(role) { return role.firstDimensionName(); })
           .where(def.notNully)
           .array();
    },
    
    _constructVisualRoles: function(/*options*/) {
        var parent = this.parent;
        if(parent) {
            this.visualRoles = parent.visualRoles;
            this.visualRoleList = parent.visualRoleList;
            this._measureVisualRoles = parent._measureVisualRoles;
            
            ['_multiChartRole', '_serRole', '_colorRole', '_dataPartRole']
            .forEach(function(p) {
                var parentRole = parent[p];
                if(parentRole) { this[p] = parentRole; }
            }, this);
            
        } else {
            this.visualRoles = {};
            this.visualRoleList = [];
            this._measureVisualRoles = [];
        }
    },
    
    _hasDataPartRole:   def.fun.constant(false),
    _getSeriesRoleSpec: def.fun.constant(null),
    _getColorRoleSpec:  def.fun.constant(null),
    
    _addVisualRole: function(name, keyArgs) {
        keyArgs = def.set(keyArgs, 'index', this.visualRoleList.length);
        
        var role = new pvc.visual.Role(name, keyArgs);
        
        this.visualRoleList.push(role);
        this.visualRoles[name] = role;
        if(role.isMeasure) { this._measureVisualRoles.push(role); }
        return role;
    },
    
    /**
     * Initializes each chart's specific roles.
     * @virtual
     */
    _initVisualRoles: function() {
        this._multiChartRole = this._addVisualRole(
            'multiChart', 
            {defaultDimension: 'multiChart*', requireIsDiscrete: true});

        if(this._hasDataPartRole()) {
            this._dataPartRole = this._addVisualRole(
                'dataPart', 
                {
                    defaultDimension: 'dataPart',
                    requireSingleDimension: true,
                    requireIsDiscrete: true,
                    dimensionDefaults: {isHidden: true, comparer: def.compare}
                });
        }

        var serRoleSpec = this._getSeriesRoleSpec();
        if(serRoleSpec  ) { this._serRole = this._addVisualRole('series', serRoleSpec); }
        
        var colorRoleSpec = this._getColorRoleSpec();
        if(colorRoleSpec) { this._colorRole = this._addVisualRole('color', colorRoleSpec); }
    },

    _assertUnboundRoleIsOptional: function(role) {
        if(role.isRequired) {
            throw def.error.operationInvalid("Chart type requires unassigned role '{0}'.", [role.name]);
        }
    },
        
    /**
     * Binds visual roles to grouping specifications
     * that have not yet been bound to and validated against a complex type.
     *
     * This allows inferring proper defaults to
     * dimensions bound to roles, 
     * by taking them from the roles requirements.
     */
    _bindVisualRolesPreI: function() {
        // Clear reversed status of visual roles
        def.eachOwn(this.visualRoles, function(role) { role.setIsReversed(false); });
        
        var sourcedRoles = [];
        
        // Process the visual roles with options
        // It is important to process them in visual role definition order
        // cause the processing that is done generally 
        // depends on the processing order;
        // A chart definition must behave the same 
        // in every environment, independently of the order in which
        // object properties are enumerated.
        var options = this.options;
        var roleOptions = options.visualRoles;
        
        // Accept visual roles directly in the options
        // as <roleName>Role: 
        this.visualRoleList.forEach(function(role) {
            var name = role.name;
            var roleSpec = options[name + 'Role'];
            if(roleSpec !== undefined) {
                if(!roleOptions) { roleOptions = options.visualRoles = {}; }
                
                if(roleOptions[name] === undefined) { roleOptions[name] = roleSpec; }
            }
        });
        
        var dimsBoundToSingleRole;
        if(roleOptions) {
            dimsBoundToSingleRole = {};
            
            // Decode role names and validate their existence
            var rolesWithOptions = 
                def.query(def.keys(roleOptions)).select(this.visualRole, this).array();
            
            rolesWithOptions.sort(function(a, b) { return a.index - b.index; });
                
            /* Process options.visualRoles */
            rolesWithOptions.forEach(function(role) {
                var name     = role.name;
                var roleSpec = roleOptions[name];
                
                // Process the visual role specification
                // * a string with the grouping dimensions, or
                // * {dimensions: "product", isReversed:true, from: "series" }
                var groupingSpec, sourceRoleName;
                if(def.object.is(roleSpec)) {
                    if(def.nullyTo(roleSpec.isReversed, false)) { role.setIsReversed(true); }
                    
                    sourceRoleName = roleSpec.from;
                    if(sourceRoleName && (sourceRoleName !== name)) {
                        var sourceRole = this.visualRoles[sourceRoleName] ||
                            def.fail.operationInvalid("Source role '{0}' is not supported by the chart type.", [sourceRoleName]);
                        
                        role.setSourceRole(sourceRole);
                        sourcedRoles.push(role);
                    } else {
                        groupingSpec = roleSpec.dimensions;
                    }
                } else {
                    // Assumed to be a string (or null, undefined)
                    groupingSpec = roleSpec;
                }
                
                // !groupingSpec (null or "") results in a null grouping being preBound
                // A pre-bound null grouping is later discarded in the post bind,
                // but, in between, prevents translators from 
                // reading to dimensions that would bind into those roles...
                if(groupingSpec !== undefined) {
                    if(!groupingSpec) { this._assertUnboundRoleIsOptional(role); } // throws if required
                    
                    var grouping = pvc.data.GroupingSpec.parse(groupingSpec);
    
                    role.preBind(grouping);
    
                    /* Collect dimension names bound to a *single* role */
                    grouping.dimensions().each(function(groupDimSpec) {
                        if(def.hasOwn(dimsBoundToSingleRole, groupDimSpec.name)) {
                            // two roles => no defaults at all
                            delete dimsBoundToSingleRole[groupDimSpec.name];
                        } else {
                            dimsBoundToSingleRole[groupDimSpec.name] = role;
                        }
                    });
                }
            }, this);
    
        }

        this._sourcedRoles = sourcedRoles;
        this._dimsBoundToSingleRole = dimsBoundToSingleRole;
    },
    
    _bindVisualRolesPreII: function() {
        // Provide defaults to dimensions bound to a single role
        // by using the role's requirements 
        var dimsBoundToSingleRole = this._dimsBoundToSingleRole;
        if(dimsBoundToSingleRole) {
            delete this._dimsBoundToSingleRole; // free memory
            
            def.eachOwn(dimsBoundToSingleRole, this._setRoleBoundDimensionDefaults, this);
        }
        
        var sourcedRoles = this._sourcedRoles;
        delete this._sourcedRoles; // free memory
        
        /* Apply defaultSourceRole to roles not pre-bound */
        def
        .query(this.visualRoleList)
        .where(function(role) { 
            return role.defaultSourceRoleName && !role.sourceRole && !role.isPreBound(); 
         })
        .each (function(role) {
            var sourceRole = this.visualRoles[role.defaultSourceRoleName];
            if(sourceRole) {
                role.setSourceRole(sourceRole, /*isDefault*/true);
                sourcedRoles.push(role);
            }
        }, this);
        
        /* Pre-bind sourced roles whose source role is itself pre-bound */
        // Only if the role has no default dimension, cause otherwise, 
        // it would prevent binding to it, if it comes to exist.
        // In those cases, sourcing only effectively happens in the post phase.
        sourcedRoles.forEach(function(role) {
            var sourceRole = role.sourceRole;
            if(sourceRole.isReversed) { role.setIsReversed(!role.isReversed); }
            
            if(!role.defaultDimensionName && sourceRole.isPreBound()) {
                role.preBind(sourceRole.preBoundGrouping());
            }
        });
    },
    
    _setRoleBoundDimensionDefaults: function(role, dimName) {
        this._complexTypeProj.setDimDefaults(dimName, role.dimensionDefaults);
    },
    
    _bindVisualRolesPostI: function(){
        var me = this;
        
        var complexTypeProj = me._complexTypeProj;
        
        // Dimension names to roles bound to it
        var boundDimTypes = {};
        
        var unboundSourcedRoles = [];
        
        def
        .query(me.visualRoleList)
        .where(function(role) { return role.isPreBound(); })
        .each (markPreBoundRoleDims);
        
        /* (Try to) Automatically bind **unbound** roles:
         * -> to their default dimensions, if they exist and are not yet bound to
         * -> if the default dimension does not exist and the 
         *    role allows auto dimension creation, 
         *    creates 1 *hidden* dimension (that will receive only null data)
         * 
         * Validates role required'ness.
         */
        def
        .query(me.visualRoleList)
        .where(function(role) { return !role.isPreBound(); })
        .each (autoBindUnboundRole);
        
        // Sourced roles that could not be normally bound are now finally sourced 
        unboundSourcedRoles.forEach(tryPreBindSourcedRole);
        
        // Apply defaults to single-bound-to dimensions
        // TODO: this is being repeated for !pre-bound! dimensions
        def
        .query(def.ownKeys(boundDimTypes))
        .where(function(dimName) { return boundDimTypes[dimName].length === 1; })
        .each (function(dimName) {
            var singleRole = boundDimTypes[dimName][0];
            me._setRoleBoundDimensionDefaults(singleRole, dimName);
        });

        // ----------------
        
        function markDimBoundTo(dimName, role) { def.array.lazy(boundDimTypes, dimName).push(role); }
        
        function dimIsDefined(dimName) { return complexTypeProj.hasDim(dimName); }
        
        function preBindRoleTo(role, dimNames) {
            if(def.array.is(dimNames)) {
                dimNames.forEach(function(dimName) { markDimBoundTo(dimName, role); });
            } else {
                markDimBoundTo(dimNames, role);
            }
            
            role.setSourceRole(null); // if any
            role.preBind(pvc.data.GroupingSpec.parse(dimNames));
        }
        
        function preBindRoleToGroupDims(role, groupDimNames) {
            if(groupDimNames.length) {
                if(role.requireSingleDimension) { preBindRoleTo(role, groupDimNames[0]); } 
                else                            { preBindRoleTo(role, groupDimNames);    }
            }
        }
        
        function preBindRoleToNewDim(role, dimName) {
            // Create a hidden dimension and bind the role and the dimension
            complexTypeProj.setDim(dimName, {isHidden: true});
            
            preBindRoleTo(role, dimName);
        }
        
        function roleIsUnbound(role) {
            me._assertUnboundRoleIsOptional(role); // throws if required
            
            // Unbind role from any previous binding
            role.bind(null);
            role.setSourceRole(null); // if any
        }
        
        function markPreBoundRoleDims(role) {
            role.preBoundGrouping().dimensionNames().forEach(markDimBoundTo);
        }
        
        function autoBindUnboundRole(role) {
            // !role.isPreBound()
            
            if(role.sourceRole && !role.isDefaultSourceRole) {
                unboundSourcedRoles.push(role);
                return;
            }
            
            // Try to bind automatically, to defaultDimensionName
            var dimName = role.defaultDimensionName;
            if(!dimName) {
                if(role.sourceRole) { unboundSourcedRoles.push(role); } 
                else                { roleIsUnbound(role);            }
                return;
            }
                
            /* An asterisk at the end of the name indicates
             * that any dimension of that group is allowed.
             * If the role allows multiple dimensions,
             * then the meaning is greedy - use them all.
             * Otherwise, use only one.
             * 
             *   "product*"
             */
            var match = dimName.match(/^(.*?)(\*)?$/) ||
                        def.fail.argumentInvalid('defaultDimensionName');
            
            var defaultName =  match[1];
            var greedy = /*!!*/match[2];
            if(greedy) {
                // TODO: does not respect any index explicitly specified
                // before the *. Could mean >=...
                var groupDimNames = complexTypeProj.groupDimensionsNames(defaultName);
                if(groupDimNames) {
                    // Default dimension(s) is defined
                    preBindRoleToGroupDims(role, groupDimNames);
                    return;
                }
                
                // Follow to auto create dimension
                
            } else if(dimIsDefined(defaultName)) { // defaultName === dimName
                preBindRoleTo(role, defaultName);
                return;
            }

            if(role.autoCreateDimension) {
                preBindRoleToNewDim(role, defaultName);
                return;
            }
            
            if(role.sourceRole) { unboundSourcedRoles.push(role); } 
            else                { roleIsUnbound(role);            }
        }
    
        function tryPreBindSourcedRole(role) {
            var sourceRole = role.sourceRole;
            if(sourceRole.isPreBound()) { role.preBind(sourceRole.preBoundGrouping()); } 
            else                        { roleIsUnbound(role);                         }
        }
    },
    
    _bindVisualRolesPostII: function(complexType) {
        // Commits and validates the grouping specification.
        // Null groupings are discarded.
        // Sourced roles that were also pre-bound are here normally bound.
        def
        .query(this.visualRoleList)
        .where(function(role) { return role.isPreBound();   })
        .each (function(role) { role.postBind(complexType); });
    },

    _logVisualRoles: function() {
        var out = ["VISUAL ROLES MAP SUMMARY", pvc.logSeparator, "  VisualRole         <-- Dimensions", pvc.logSeparator];
        
        def.eachOwn(this.visualRoles, function(role, name) {
            out.push("  " + name + def.array.create(18 - name.length, " ").join("") +
                    (role.grouping ? (" <-- " + role.grouping) : ''));
        });

        this._log(out.join("\n"));
    },
    
    _getDataPartDimName: function() {
        var role = this._dataPartRole;
        if(role) {
            if(role.isBound()) { return role.firstDimensionName(); } 
            
            var preGrouping = role.preBoundGrouping();
            if(preGrouping) { return preGrouping.firstDimensionName(); }
            
            return role.defaultDimensionName;
        }
    }
});

