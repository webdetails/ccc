
pvc.BaseChart
.add({
    /**
     * A map of {@link pvc.visual.Role} by name.
     * 
     * @type object
     */
    _visualRoles: null,
    
    _serRole: null,
    _dataPartRole: null,
    
    /**
     * An array of the {@link pvc.visual.Role} that are measures.
     * 
     * @type pvc.visual.Role[]
     */
    _measureVisualRoles: null,
    
    /**
     * The name of the visual role that
     * the legend panel will be associated to.
     * 
     * <p>
     * The legend panel displays each distinct role value
     * with a marker and a label.
     * 
     * The marker's color is obtained from the parts color scales,
     * given the role's value.
     * </p>
     * <p>
     * The default dimension is the 'series' dimension.
     * </p>
     * 
     * @type string
     */
    legendSource: "series",
    
    _constructVisualRoles: function(options) {
        var parent = this.parent;
        if(parent) {
            this._visualRoles = parent._visualRoles;
            this._measureVisualRoles = parent._measureVisualRoles;
            
            if(parent._serRole) {
                this._serRole = parent._serRole;
            }

            if(parent._dataPartRole) {
                this._dataPartRole = parent._dataPartRole;
            }
        } else {
            this._visualRoles = {};
            this._measureVisualRoles = [];
        }
    },
    
    _addVisualRoles: function(roles){
        def.eachOwn(roles, function(keyArgs, name){
            var visualRole = new pvc.visual.Role(name, keyArgs);
            this._visualRoles[name] = visualRole;
            if(visualRole.isMeasure){
                this._measureVisualRoles.push(visualRole);
            }
        }, this);
    },
    
    /**
     * Initializes each chart's specific roles.
     * @virtual
     */
    _initVisualRoles: function(){
        this._addVisualRoles({
            multiChart: {
                defaultDimensionName: 'multiChart*', 
                requireIsDiscrete: true
            }
        });

        if(this._hasDataPartRole()){
            this._addVisualRoles({
                dataPart: {
                    defaultDimensionName: 'dataPart',
                    requireSingleDimension: true,
                    requireIsDiscrete: true
                }
            });

            // Cached
            this._dataPartRole = this.visualRoles('dataPart');
        }

        var serRoleSpec = this._getSeriesRoleSpec();
        if(serRoleSpec){
            this._addVisualRoles({series: serRoleSpec});

            // Cached
            this._serRole = this.visualRoles('series');
        }
    },

    /**
     * Binds visual roles to grouping specifications
     * that have not yet been bound to and validated against a complex type.
     *
     * This allows inferring proper defaults to
     * dimensions bound to roles, by taking them from the roles requirements.
     */
    _bindVisualRolesPre: function(){
        
        def.eachOwn(this._visualRoles, function(visualRole){
            visualRole.setIsReversed(false);
        });
        
        /* Process user specified bindings */
        var boundDimNames = {};
        def.each(this.options.visualRoles, function(roleSpec, name){
            var visualRole = this._visualRoles[name] ||
                def.fail.operationInvalid("Role '{0}' is not supported by the chart type.", [name]);
            
            var groupingSpec;
            if(roleSpec && typeof roleSpec === 'object'){
                if(def.get(roleSpec, 'isReversed', false)){
                    visualRole.setIsReversed(true);
                }
                
                groupingSpec = roleSpec.dimensions;
            } else {
                groupingSpec = roleSpec;
            }
            
            // !groupingSpec results in a null grouping being preBound
            // A pre bound null grouping is later discarded in the post bind
            if(groupingSpec !== undefined){
                var grouping = pvc.data.GroupingSpec.parse(groupingSpec);

                visualRole.preBind(grouping);

                /* Collect dimension names bound to a *single* role */
                grouping.dimensions().each(function(dimSpec){
                    if(def.hasOwn(boundDimNames, dimSpec.name)){
                        // two roles => no defaults at all
                        delete boundDimNames[dimSpec.name];
                    } else {
                        boundDimNames[dimSpec.name] = visualRole;
                    }
                });
            }
        }, this);

        /* Provide defaults to dimensions bound to a single role */
        var dimsSpec = (this.options.dimensions || (this.options.dimensions = {}));
        def.eachOwn(boundDimNames, function(role, name){
            var dimSpec = dimsSpec[name] || (dimsSpec[name] = {});
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
    },

    _hasDataPartRole: function(){
        return false;
    },

    _getSeriesRoleSpec: function(){
        return null;
    },

    _bindVisualRoles: function(type){
        
        var boundDimTypes = {};

        function bind(role, dimNames){
            role.bind(pvc.data.GroupingSpec.parse(dimNames, type));
            def.array.as(dimNames).forEach(function(dimName){
                boundDimTypes[dimName] = true;
            });
        }
        
        /* Process role pre binding */
        def.eachOwn(this._visualRoles, function(visualRole, name){
            if(visualRole.isPreBound()){
                visualRole.postBind(type);
                // Null groupings are discarded
                if(visualRole.grouping){
                    visualRole
                        .grouping
                        .dimensions().each(function(dimSpec){
                            boundDimTypes[dimSpec.name] = true;
                        });
                }
            }
        }, this);
        
        /*
         * (Try to) Automatically bind unbound roles.
         * Validate role required'ness.
         */
        def.eachOwn(this._visualRoles, function(role, name){
            if(!role.grouping){

                /* Try to bind automatically, to defaultDimensionName */
                var dimName = role.defaultDimensionName;
                if(dimName) {
                    /* An asterisk at the end of the name indicates
                     * that any dimension of that group is allowed.
                     * If the role allows multiple dimensions,
                     * then the meaning is greedy - use them all.
                     * Otherwise, use only one.
                     */
                    var match = dimName.match(/^(.*?)(\*)?$/) ||
                            def.fail.argumentInvalid('defaultDimensionName');
                    
                    var anyLevel = !!match[2];
                    if(anyLevel) {
                        // TODO: does not respect any index explicitly specified
                        // before the *. Could mean >=...
                        var groupDimNames = type.groupDimensionsNames(match[1], {assertExists: false});
                        if(groupDimNames){
                            var freeGroupDimNames = 
                                    def.query(groupDimNames)
                                        .where(function(dimName2){ return !def.hasOwn(boundDimTypes, dimName2); });

                            if(role.requireSingleDimension){
                                var freeDimName = freeGroupDimNames.first();
                                if(freeDimName){
                                    bind(role, freeDimName);
                                    return;
                                }
                            } else {
                                freeGroupDimNames = freeGroupDimNames.array();
                                if(freeGroupDimNames.length){
                                    bind(role, freeGroupDimNames);
                                    return;
                                }
                            }
                        }
                    } else if(!def.hasOwn(boundDimTypes, dimName) &&
                              type.dimensions(dimName, {assertExists: false})){
                        bind(role, dimName);
                        return;
                    }

                    if(role.autoCreateDimension){
                        /* Create a hidden dimension and bind the role and the dimension */
                        var defaultName = match[1];
                        type.addDimension(defaultName,
                            pvc.data.DimensionType.extendSpec(defaultName, {isHidden: true}));
                        bind(role, defaultName);
                        return;
                    }
                }

                if(role.isRequired) {
                    throw def.error.operationInvalid("Chart type requires unassigned role '{0}'.", [name]);
                }
                
                // Unbind role from any previous binding
                role.bind(null);
            }
        }, this);
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

