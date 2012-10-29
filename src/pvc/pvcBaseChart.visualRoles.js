
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
                    requireIsDiscrete: true
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
    _bindVisualRolesPre: function(){
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
        // objects properties are enumerated.
        var roleOptions = this.options.visualRoles;
        if(roleOptions){
            var dimsBoundToSingleRole = {};
            
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
                    if(sourceRoleName){
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
    
            /* Provide defaults to dimensions bound to a single role
             * by using the role's requirements 
             */
            var dimsSpec;
            def.eachOwn(dimsBoundToSingleRole, function(role, name){
                if(!dimsSpec){
                    dimsSpec = def.lazy(this.options, 'dimensions');
                }
                
                var dimSpec = def.lazy(dimsSpec, name);
                
                if(role.valueType && dimSpec.valueType === undefined){
                    dimSpec.valueType = role.valueType;
    
                    if(role.requireIsDiscrete != null && dimSpec.isDiscrete === undefined){
                        dimSpec.isDiscrete = role.requireIsDiscrete;
                    }
                }
    
                if(dimSpec.label === undefined){
                    dimSpec.label = role.label;
                }
            }, this);
        }
        
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
        sourcedRoles.forEach(function(role){
            var sourceRole = role.sourceRole;
            if(sourceRole.isReversed){
                role.setIsReversed(!role.isReversed);
            }
            
            if(sourceRole.isPreBound()){
                role.preBind(sourceRole.preBoundGrouping());
            }
        });
    },
    
    _bindVisualRolesPost: function(complexType){
        // Bound dimension names (which have at least one role bound to them)
        var boundDimTypes = {};
        
        /* Now that the complex type is known and initialized,
         * it is possible to validate the 
         * grouping specifications of the pre-bound roles:
         * whether their dimension names actually exist.
         */
        def
        .query(this._visualRoleList)
        .where(function(role) { return role.isPreBound(); })
        .each (commitRolePreBinding, this);
        
        /* (Try to) Automatically bind **unbound** roles:
         * -> to their default dimensions, if they exist and are not yet bound to
         * -> if the default dimension does not exist and the 
         *    role allows auto dimension creation, 
         *    creates 1 *hidden* dimension (that will receive only null data)
         * 
         * Validates role required'ness.
         */
        var unboundSourcedRoles = [];
        
        def
        .query(this._visualRoleList)
        .where(function(role) {
            var isSourcedRole = !!role.sourceRole;
            var isRoleUnbound = !role.isBound();
            if(isSourcedRole && isRoleUnbound){
                unboundSourcedRoles.push(role);
            }
            
            return !isSourcedRole && isRoleUnbound;
        })
        .each (autoBindUnboundRole, this);
        
        /* At last, process sourced roles. */
        if(unboundSourcedRoles.length) {
            unboundSourcedRoles
                .forEach(bindSourcedRole, this);
        }
        
        // ----------------
        
        function markDimBoundTo(dimName){
            boundDimTypes[dimName] = true;
        }
        
        function dimIsNotBoundTo(dimName){
            return !def.hasOwn(boundDimTypes, dimName); 
        }
        
        function dimIsDefined(dimName){
            return complexType.dimensions(dimName, {assertExists: false});
        }
        
        function bindRoleTo(role, dimNames){
            if(def.array.is(dimNames)){
                if(!dimNames.length){
                    return;
                }
                
                dimNames.forEach(markDimBoundTo);
            } else {
                markDimBoundTo(dimNames);
            }
            
            role.bind(pvc.data.GroupingSpec.parse(dimNames, complexType));
        }
        
        function bindRoleToGroupFreeDims(role, groupDimNames){
            var freeGroupDimNames = 
                def
                .query(groupDimNames)
                .where(dimIsNotBoundTo);

            if(role.requireSingleDimension){
                var firstFreeDimName = freeGroupDimNames.first();
                if(firstFreeDimName){
                    bindRoleTo(role, firstFreeDimName);
                }
            } else {
                // May have no elements
                bindRoleTo(role, freeGroupDimNames.array());
            }
        }
        
        function bindRoleToNewDim(role, dimName){
            /* Create a hidden dimension and bind the role and the dimension */
            complexType.addDimension(
                dimName,
                pvc.data.DimensionType.extendSpec(dimName, {isHidden: true}));
            
            bindRoleTo(role, dimName);
        }
        
        function roleIsUnbound(role){
            if(role.isRequired) {
                throw def.error.operationInvalid("Chart type requires unassigned role '{0}'.", [role.name]);
            }
            
            // Unbind role from any previous binding
            role.bind(null);
        }
        
        function commitRolePreBinding(role){
            // Commits and validates the grouping specification.
            // Null groupings are discarded.
            // Sourced roles that were also pre-bound are here normally bound.
            role.postBind(complexType);
            
            // Still bound? Wasn't a null grouping?
            if(role.isBound()){
                // Mark used dimensions
                role.grouping
                    .dimensionNames()
                    .forEach(markDimBoundTo);
            }
        }
        
        function autoBindUnboundRole(role){
            var name = role.name;
            
            /* Try to bind automatically, to defaultDimensionName */
            var dimName = role.defaultDimensionName;
            if(!dimName) {
                roleIsUnbound(role);
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
                var groupDimNames = complexType.groupDimensionsNames(defaultName, {assertExists: false});
                if(groupDimNames){
                    // Default dimension(s) is defined
                    bindRoleToGroupFreeDims(role, groupDimNames);
                    return;
                }
                // Follow to auto create dimension
                
            } else if(dimIsDefined(defaultName)){ // defaultName === dimName
                if(dimIsNotBoundTo(defaultName)){
                    bindRoleTo(role, defaultName);
                }
                return;
            }

            if(role.autoCreateDimension){
                bindRoleToNewDim(role, defaultName);
            }
        }
    
        function bindSourcedRole(role){
            var sourceRole = role.sourceRole;
            if(sourceRole.isReversed){
                role.setIsReversed(!role.isReversed);
            }
            
            if(sourceRole.isBound()){
                role.bind(sourceRole.grouping);
            } else {
                roleIsUnbound(role);
            }
        }
    },

    _logVisualRoles: function(){
        var out = ["VISUAL ROLES SUMMARY", pvc.logSeparator];
        
        def.eachOwn(this._visualRoles, function(role, name){
            out.push("  " + name + def.array.create(18 - name.length, " ").join("") +
                    (role.grouping ? (" <-- " + role.grouping) : ''));
        });
        
        out.push(pvc.logSeparator);

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

