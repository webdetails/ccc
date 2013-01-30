
pvc.BaseChart
.add({
    /**
     * A map of {@link pvc.visual.Role} by name.
     * 
     * @type object
     */
    _visualRoles: null,
    _visualRoleList: null,
    
    _serRole: null,
    _dataPartRole: null,
    
    /**
     * An array of the {@link pvc.visual.Role} that are measures.
     * 
     * @type pvc.visual.Role[]
     */
    _measureVisualRoles: null,
    
    _constructVisualRoles: function(options) {
        var parent = this.parent;
        if(parent) {
            this._visualRoles = parent._visualRoles;
            this._visualRoleList = parent._visualRoleList;
            this._measureVisualRoles = parent._measureVisualRoles;
            
            if(parent._multiChartRole) {
                this._multiChartRole = parent._multiChartRole;
            }
            
            if(parent._serRole) {
                this._serRole = parent._serRole;
            }
            
            if(parent._colorRole) {
                this._colorRole = parent._colorRole;
            }

            if(parent._dataPartRole) {
                this._dataPartRole = parent._dataPartRole;
            }
        } else {
            this._visualRoles = {};
            this._visualRoleList = [];
            this._measureVisualRoles = [];
        }
    },

    _hasDataPartRole: function(){
        return false;
    },

    _getSeriesRoleSpec: function(){
        return null;
    },
    
    _getColorRoleSpec: function(){
        return null;
    },
    
    _addVisualRole: function(name, keyArgs){
        keyArgs = def.set(keyArgs, 'index', this._visualRoleList.length);
        
        var visualRole = new pvc.visual.Role(name, keyArgs);
        
        this._visualRoleList.push(visualRole);
        this._visualRoles[name] = visualRole;
        if(visualRole.isMeasure){
            this._measureVisualRoles.push(visualRole);
        }
        return visualRole;
    },
    
    /**
     * Initializes each chart's specific roles.
     * @virtual
     */
    _initVisualRoles: function(){
        this._multiChartRole = this._addVisualRole(
            'multiChart', 
            {
                defaultDimension: 'multiChart*', 
                requireIsDiscrete: true
            });

        if(this._hasDataPartRole()){
            this._dataPartRole = this._addVisualRole(
                'dataPart', 
                {
                    defaultDimension: 'dataPart',
                    requireSingleDimension: true,
                    requireIsDiscrete: true,
                    dimensionDefaults: {
                        isHidden: true,
                        comparer: def.compare
                    }
                });
        }

        var serRoleSpec = this._getSeriesRoleSpec();
        if(serRoleSpec){
            this._serRole = this._addVisualRole('series', serRoleSpec);
        }
        
        var colorRoleSpec = this._getColorRoleSpec();
        if(colorRoleSpec){
            this._colorRole = this._addVisualRole('color', colorRoleSpec);
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
    _bindVisualRolesPreI: function(){
        // Clear reversed status of visual roles
        def.eachOwn(this._visualRoles, function(role){
            role.setIsReversed(false);
        });
        
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
        this._visualRoleList.forEach(function(visualRole){
            var name = visualRole.name;
            var roleSpec = options[name + 'Role'];
            if(roleSpec !== undefined){
                if(!roleOptions){
                    roleOptions = options.visualRoles = {};
                }
                
                if(roleOptions[name] === undefined){
                    roleOptions[name] = roleSpec;
                }
            }
        });
        
        var dimsBoundToSingleRole;
        if(roleOptions){
            dimsBoundToSingleRole = {};
            
            var rolesWithOptions = 
                def
                .query(def.keys(roleOptions))
                .select(function(name){
                    return this._visualRoles[name] ||
                           def.fail.operationInvalid("Role '{0}' is not supported by the chart type.", [name]);
                }, this)
                .array();
            
            rolesWithOptions.sort(function(a, b){ return a.index - b.index; });
                
            /* Process options.visualRoles */
            rolesWithOptions.forEach(function(visualRole){
                var name     = visualRole.name;
                var roleSpec = roleOptions[name];
                
                // Process the visual role specification
                // * a string with the grouping dimensions, or
                // * {dimensions: "product", isReversed:true, from: "series" }
                var groupingSpec, sourceRoleName;
                if(def.object.is(roleSpec)){
                    if(def.nullyTo(roleSpec.isReversed, false)){
                        visualRole.setIsReversed(true);
                    }
                    
                    sourceRoleName = roleSpec.from;
                    if(sourceRoleName && (sourceRoleName !== name)){
                        var sourceRole = this._visualRoles[sourceRoleName] ||
                            def.fail.operationInvalid("Source role '{0}' is not supported by the chart type.", [sourceRoleName]);
                        
                        visualRole.setSourceRole(sourceRole);
                        sourcedRoles.push(visualRole);
                    } else {
                        groupingSpec = roleSpec.dimensions;
                    }
                } else {
                    // Assumed to be a string
                    groupingSpec = roleSpec;
                }
                
                // !groupingSpec (null or "") results in a null grouping being preBound
                // A pre bound null grouping is later discarded in the post bind,
                // but, in between, prevents translators from 
                // reading to dimensions that would bind into those roles...
                if(groupingSpec !== undefined){
                    var grouping = pvc.data.GroupingSpec.parse(groupingSpec);
    
                    visualRole.preBind(grouping);
    
                    /* Collect dimension names bound to a *single* role */
                    grouping.dimensions().each(function(groupDimSpec){
                        if(def.hasOwn(dimsBoundToSingleRole, groupDimSpec.name)){
                            // two roles => no defaults at all
                            delete dimsBoundToSingleRole[groupDimSpec.name];
                        } else {
                            dimsBoundToSingleRole[groupDimSpec.name] = visualRole;
                        }
                    });
                }
            }, this);
    
        }

        this._sourcedRoles = sourcedRoles;
        this._dimsBoundToSingleRole = dimsBoundToSingleRole;
    },
    
    _bindVisualRolesPreII: function(){
        /* Provide defaults to dimensions bound to a single role
         * by using the role's requirements 
         */
        var dimsBoundToSingleRole = this._dimsBoundToSingleRole;
        if(dimsBoundToSingleRole){
            delete this._dimsBoundToSingleRole; // free memory
            
            def.eachOwn(
                dimsBoundToSingleRole, 
                this._setRoleBoundDimensionDefaults, 
                this);
        }
        
        var sourcedRoles = this._sourcedRoles;
        delete this._sourcedRoles; // free memory
        
        /* Apply defaultSourceRole to roles not pre-bound */
        def
        .query(this._visualRoleList)
        .where(function(role){ return role.defaultSourceRoleName && !role.sourceRole && !role.isPreBound(); })
        .each (function(role){
            var sourceRole = this._visualRoles[role.defaultSourceRoleName];
            if(sourceRole){
                role.setSourceRole(sourceRole);
                sourcedRoles.push(role);
            }
        }, this)
        ;
        
        /* Pre-bind sourced roles whose source role is itself pre-bound */
        // Only if the role has no default dimension, cause otherwise, 
        // it would prevent binding to it, if it comes to exist.
        // In those cases, sourcing only effectively happens in the post phase.
        sourcedRoles.forEach(function(role){
            var sourceRole = role.sourceRole;
            if(sourceRole.isReversed){
                role.setIsReversed(!role.isReversed);
            }
            
            if(!role.defaultDimensionName && sourceRole.isPreBound()){
                role.preBind(sourceRole.preBoundGrouping());
            }
        });
    },
    
    _setRoleBoundDimensionDefaults: function(role, dimName){
        //var splitId = pvc.splitIndexedId(dimName);
        
        this._complexTypeProj
            .setDimDefaults(dimName, role.dimensionDefaults)
            ;
//            .setDimDefaults(dimName, {
//                label: pvc.buildIndexedId(role.label, splitId[1])
//            });
    },
    
    _bindVisualRolesPostI: function(){
        
        var complexTypeProj = this._complexTypeProj;
        
        // Dimension names to roles bound to it
        var boundDimTypes = {};
        
        var unboundSourcedRoles = [];
        
        def
        .query(this._visualRoleList)
        .where(function(role) { return role.isPreBound(); })
        .each (markPreBoundRoleDims, this);
        
        /* (Try to) Automatically bind **unbound** roles:
         * -> to their default dimensions, if they exist and are not yet bound to
         * -> if the default dimension does not exist and the 
         *    role allows auto dimension creation, 
         *    creates 1 *hidden* dimension (that will receive only null data)
         * 
         * Validates role required'ness.
         */
        def
        .query(this._visualRoleList)
        .where(function(role) { return !role.isPreBound(); })
        .each (autoBindUnboundRole, this);
        
        /* Sourced roles that could not be normally bound
         * are now finally sourced 
         */
        unboundSourcedRoles.forEach(tryPreBindSourcedRole, this);
        
        /* Apply defaults to single-bound-to dimensions
         * TODO: this is being repeated for !pre-bound! dimensions
         */
        def
        .query(def.ownKeys(boundDimTypes))
        .where(function(dimName) { return boundDimTypes[dimName].length === 1; })
        .each (function(dimName){
            var singleRole = boundDimTypes[dimName][0];
            this._setRoleBoundDimensionDefaults(singleRole, dimName);
        }, this);

        // ----------------
        
        function markDimBoundTo(dimName, role){
            def.array.lazy(boundDimTypes, dimName).push(role);
        }
        
        function dimIsDefined(dimName){
            return complexTypeProj.hasDim(dimName);
        }
        
        function preBindRoleTo(role, dimNames){
            if(def.array.is(dimNames)){
                dimNames.forEach(function(dimName){ 
                    markDimBoundTo(dimName, role);
                });
            } else {
                markDimBoundTo(dimNames, role);
            }
            
            role.setSourceRole(null); // if any
            role.preBind(pvc.data.GroupingSpec.parse(dimNames));
        }
        
        function preBindRoleToGroupDims(role, groupDimNames){
            if(groupDimNames.length){
                if(role.requireSingleDimension){
                    preBindRoleTo(role, groupDimNames[0]);
                } else {
                    preBindRoleTo(role, groupDimNames);
                }
            }
        }
        
        function preBindRoleToNewDim(role, dimName){
            /* Create a hidden dimension and bind the role and the dimension */
            complexTypeProj.setDim(dimName, {isHidden: true});
            
            preBindRoleTo(role, dimName);
        }
        
        function roleIsUnbound(role){
            if(role.isRequired) {
                throw def.error.operationInvalid("Chart type requires unassigned role '{0}'.", [role.name]);
            }
            
            // Unbind role from any previous binding
            role.bind(null);
            role.setSourceRole(null); // if any
        }
        
        function markPreBoundRoleDims(role){
            role.preBoundGrouping()
                .dimensionNames()
                .forEach(markDimBoundTo);
        }
        
        function autoBindUnboundRole(role){
            var name = role.name;
            
            // !role.isPreBound()
            
            /* Try to bind automatically, to defaultDimensionName */
            var dimName = role.defaultDimensionName;
            if(!dimName) {
                if(role.sourceRole){
                    unboundSourcedRoles.push(role);
                } else {
                    roleIsUnbound(role);
                }
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
                if(groupDimNames){
                    // Default dimension(s) is defined
                    preBindRoleToGroupDims(role, groupDimNames);
                    return;
                }
                // Follow to auto create dimension
                
            } else if(dimIsDefined(defaultName)){ // defaultName === dimName
                preBindRoleTo(role, defaultName);
                return;
            }

            if(role.autoCreateDimension){
                preBindRoleToNewDim(role, defaultName);
                return;
            }
            
            if(role.sourceRole){
                unboundSourcedRoles.push(role);
            } else {
                roleIsUnbound(role);
            }
        }
    
        function tryPreBindSourcedRole(role){
            var sourceRole = role.sourceRole;
            if(sourceRole.isPreBound()){
                role.preBind(sourceRole.preBoundGrouping());
            } else {
                roleIsUnbound(role);
            }
        }
    },
    
    _bindVisualRolesPostII: function(complexType){
        
        def
        .query(this._visualRoleList)
        .where(function(role) { return role.isPreBound(); })
        .each (commitRolePreBinding, this);

        function commitRolePreBinding(role){
            // Commits and validates the grouping specification.
            // Null groupings are discarded.
            // Sourced roles that were also pre-bound are here normally bound.
            role.postBind(complexType);
        }
    },

    _logVisualRoles: function(){
        var out = ["VISUAL ROLES MAP SUMMARY", pvc.logSeparator, "  VisualRole         <-- Dimensions", pvc.logSeparator];
        
        def.eachOwn(this._visualRoles, function(role, name){
            out.push("  " + name + def.array.create(18 - name.length, " ").join("") +
                    (role.grouping ? (" <-- " + role.grouping) : ''));
        });

        this._log(out.join("\n"));
    },

    /**
     * Obtains a roles array or a specific role, given its name.
     * 
     * @param {string} roleName The role name.
     * @param {object} keyArgs Keyword arguments.
     * @param {boolean} assertExists Indicates if an error should be thrown if the specified role name is undefined.
     * 
     * @type pvc.data.VisualRole[]|pvc.data.VisualRole 
     */
    visualRoles: function(roleName, keyArgs){
        if(roleName == null) {
            return def.own(this._visualRoles);
        }
        
        var role = def.getOwn(this._visualRoles, roleName) || null;
        if(!role && def.get(keyArgs, 'assertExists', true)) {
            throw def.error.argumentInvalid('roleName', "Undefined role name '{0}'.", [roleName]);
        }
        
        return role;
    },

    measureVisualRoles: function(){
        return this._measureVisualRoles;
    },

    measureDimensionsNames: function(){
        return def.query(this._measureVisualRoles)
                   .select(function(visualRole){ return visualRole.firstDimensionName(); })
                   .where(def.notNully)
                   .array();
    },
    
    /**
     * Indicates if a role is assigned, given its name. 
     * 
     * @param {string} roleName The role name.
     * @type boolean
     */
    _isRoleAssigned: function(roleName){
        return !!this._visualRoles[roleName].grouping;
    },
    
    _getDataPartDimName: function(){
        var role = this._dataPartRole;
        if(role){
            if(role.isBound()){
                return role.firstDimensionName();
            } 
            
            var preGrouping = role.preBoundGrouping();
            if(preGrouping) {
                return preGrouping.firstDimensionName();
            }
            
            return role.defaultDimensionName;
        }
    }
});

