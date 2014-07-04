/**
 * Configures the chart and plots' visual roles
 * with the user specified options.
 *
 * This includes explicitly binding a visual role to
 * certain dimensions, given their names.
 * This is called "pre-binding" the visual role to groupings
 * having the specified dimension names.
 *
 * Note that in this phase, there is not complex type yet.
 * The created groupings refer only to dimension names
 * and lack a later binding to an actual complex type.
 *
 * In the course of configuration two additional tasks are performed:
 * <ul>
 *     <li>a list of all visual roles that have a source visual role is built</li>
 *     <li>
 *         a map of dimension names that have a single visual role bound to it is built;
 *         the importance of this relation is that the
 *         properties of dimensions having a single role bound to it
 *         can be defaulted from the properties of the visual role.
 *     </li>
 * </ul>
 *
 * To force an optional visual role to not automatically bind to
 * its default dimension, or to not create that dimension automatically and bind to it,
 * its groupingSpec can be set to null, or "".
 *
 * This results in a "null grouping" being pre-bound to the visual role.
 * A pre-bound null grouping is later discarded in the post phase,
 * but, in between, this prevents translators from
 * trying to satisfy the visual role.
 */


pvc.visual.rolesBinder = function() {
    // 1. explicit final binding of role to a source role (`from` attribute)
    //
    // 2. explicit final binding of role to one or more dimensions (`dimensions` attribute)
    //
    // 3. explicit final null binding of role to no dimensions (`dimensions` attribute to null or '')
    //
    // 4. implicit non-final binding of a role to its default source role, if it exists (role.defaultSourceRoleName)
    //
    // 5. implicit binding of a sourced role with no defaultDimensionName
    //        to the pre-bound source role's dimensions.
    //
    // 6. implicit binding of role to one or more dimension(s) from the same
    //        dimension group of the role (defaultDimensionName).
    //
    var state = 0,// 0 - not started, 1 - beginning, 2 - began, 3 - ending, 4 - ended
        context,
        complexTypeProj,
        dimsOptions,
        logger,
        doLog;

    /**
     * List of visual roles that have another as source.
     * @type pvc.visual.Role[]
     */
    var unboundSourcedRoles = [];

    /**
     * Map from dimension name to the single role that is explicitly bound to it.
     * @type Object.<string, pvc.visual.Role>
     */
    var singleRoleByDimName = {};

    // Marks if at least one role was previously found to be bound to a dimension.
    var dimsBoundTo = {};

    return {
        /**
         * Gets or sets the logger to use.
         *
         * This logger is a function that receives one or more arguments and logs them unconditionally.
         * Used this way, the logged information is assumed to be of the "information" level.
         * It has a method `level` that returns the current log level
         * (0-off; 1-error; 2-warning; 3-info; 4-debug; ...).
         *
         * Can only be set before calling {@link pvc.visual.RolesBinder#begin}.
         *
         * @param {def.Logger} [_] The logger object.
         * @return {pvc.visual.RolesBinder|def.Logger} <tt>this</tt> or the current logger object.
         */
        logger: function(_) {
            if(arguments.length) {
                visualRolesBinder_assertState(state, 0);
                logger = _;
                return this;
            }
            return logger;
        },

        /**
         * Gets or sets the options used to configure the complex type.
         *
         * This object is the second argument passed to method
         * {@link cdo.ComplexTypeProject#configureComplexType}.
         *
         * Can only be set before calling {@link pvc.visual.RolesBinder#begin}.
         *
         * @param {object} [_] The dimensions' options.
         * @return {pvc.visual.RolesBinder|options} <tt>this</tt> or the current dimensions' options.
         */
        dimensionsOptions: function(_) {
            if(arguments.length) {
                visualRolesBinder_assertState(state, 0);
                dimsOptions = _;
                return this;
            }
            return dimsOptions;
        },

        /**
         * Gets or sets the visual roles context.
         *
         * Can only be set before calling {@link pvc.visual.RolesBinder#begin}.
         *
         * The visual roles context is  function that given a visual role name or alias
         * returns a visual role instance, if one exists, of <tt>null</tt> is not.
         *
         * Additionally, the function contains a method named `query` that
         * return a {@link def.Query} object of all visual roles in the context,
         * in definition order.
         *
         * Also, it contains a `getOptions` method that
         * returns a visual role's options object for a given visual role, if any,
         * or <tt>null</tt> if none.
         *
         * @param {function} [_] The visual roles context.
         * @return {pvc.visual.RolesBinder|function} <tt>this</tt> or the current visual roles context.
         */
        context: function(_) {
            if(arguments.length) {
                visualRolesBinder_assertState(state, 0);
                context = _;
                return this;
            }
            return context;
        },

        /**
         * Gets or sets the complex type project instance.
         *
         * Can only be set before calling {@link pvc.visual.RolesBinder#begin}.
         *
         * This instance can be provided already partially configured.
         *
         * The binder will use it to obtain information about existing dimensions
         * and also to apply default properties to dimensions that are bounds to visual roles.
         *
         * The binder may also create new dimensions, if needed,
         * to satisfy unbound visual roles configured with a default dimension name and
         * indication of automatic creation.
         *
         * @param {cdo.ComplexTypeProject} [_] The complex type project.
         * @return {pvc.visual.RolesBinder|cdo.ComplexTypeProject} <tt>this</tt> or
         * the current complex type project.
         */
        complexTypeProject: function(_) {
            if(arguments.length) {
                visualRolesBinder_assertState(state, 0);
                complexTypeProj = _;
                return this;
            }
            return complexTypeProj;
        },

        begin: begin,
        end:   end
    };

    // --------------

    function begin() {
        visualRolesBinder_assertState(state, 0);
        if(!context) throw def.error.argumentRequired('context');
        if(!complexTypeProj) throw def.error.argumentRequired('complexTypeProject');

        state = 1; // beginning
        doLog = !!logger && logger.level() >= 3;

        // Process the visual roles with options.
        // It is important to process them in visual role definition order
        // cause the binding process depends on the processing order.
        // A chart definition must behave the same
        // in every environment, independently of the order in which
        // object properties are enumerated.
        context.query().each(function(r) {
            var opts = context.getOptions(r);
            // `null` means "pre-bind to a null grouping"
            if(opts === undefined || !configure(r, opts))
                trySourceIfSecondaryRole(r);
        });

        // -----------------------

        // 2nd round.
        unboundSourcedRoles.forEach(function(r) {
            tryPreBindSourcedRole(r);
        }, this);

        // Some may now be bound, so reset. This is rebuilt on the `end` phase.
        unboundSourcedRoles = [];

        // -----------------------

        applySingleRoleDefaults();

        state = 2; // began
        return this;
    }

    /**
     * Configures a visual role,
     * on its reversed property,
     * on being sourced by another visual role,
     * or on being bound to dimensions.
     *
     * @param {pvc.visual.Role} r The visual role.
     * @param {object} opts The visual role options.
     * @see pvc.visual.Role.parse
     */
    function configure(r, opts) {
        var parsed = pvc.visual.Role.parse(context, r.name, opts),
            grouping;

        if(parsed.isReversed) r.setIsReversed(true);
        if(parsed.legend != null) r.legend(parsed.legend);

        if(parsed.source) {
            r.setSourceRole(parsed.source);
            return addUnboundSourced(r), 1;
        }

        if((grouping = parsed.grouping))
            return preBindToGrouping(r, grouping), 1;

        return 0;
    }

    function addUnboundSourced(r) {
        unboundSourcedRoles.push(r);
    }

    function preBindToGrouping(r, grouping) {
        // assert !end-phase || !grouping.isNull()

        r.preBind(grouping);

        if(grouping.isNull()) {
            visRoleBinder_assertUnboundRoleIsOptional(r); // throws if required
        } else {
            //r.setSourceRole(null); // if any
            registerBindings(r, grouping.dimensionNames());
        }
    }

    function registerBindings(r, ns) {
        ns.forEach(function(n) { registerBinding(r, n); });
    }

    function registerBinding(r, n) {
        if(!dimsBoundTo[n]) {
            dimsBoundTo[n] = true;
            singleRoleByDimName[n] = r;
            complexTypeProj.setDim(n);
        } else {
            // Two or more roles.
            delete singleRoleByDimName[n];
        }
    }

    function trySourceIfSecondaryRole(r) {
        // No options, or none that explicitly source or bind the role.
        // Check if it is a main or secondary role.
        // Secondary roles have the same name as the main role,
        //  but are not returned by `context`.
        var mainRole = context(r.name);
        if(mainRole && mainRole !== r && r.canHaveSource(mainRole)) {
            // It's a secondary role and can be source by mainRole.
            r.setSourceRole(mainRole);
            addUnboundSourced(r);
        }
    }

    // Pre-bind sourced roles whose source role is pre-bound.
    //
    // This function follows sourced roles until a non-sourced role is found,
    // detecting loops along the way (A -source-> B -source-> C -dims-> abcd).
    function tryPreBindSourcedRole(r, visited) {
        var id = r.prettyId();
        if(!visited) visited = {};
        else if(def.hasOwn(visited, id)) throw def.error.argumentInvalid("visualRoles", "Cyclic source role definition.");
        visited[id] = true;

        if(r.isPreBound()) return r.preBoundGrouping();

        var source = r.sourceRole;
        if(!source)
            // Reached the end of the string.
            // If this r is preBound, then we can preBind all sourced roles on the stack.
            // Otherwise, all remain unbound.
            return r.isPreBound() ? r.preBoundGrouping() : null;

        var sourcePreGrouping = tryPreBindSourcedRole(source, visited);
        if(sourcePreGrouping) {
            // toggle sourced role isReversed.
            if(source.isReversed) r.setIsReversed(!r.isReversed);

            r.preBind(sourcePreGrouping);

        }
        return sourcePreGrouping;
    }

    // Provide default properties to dimensions that have a single role bound to it,
    // by using the role's properties.
    // The order of application is not relevant.
    // TODO: this is being repeated for !pre-bound! dimensions
    function applySingleRoleDefaults() {
        def.eachOwn(singleRoleByDimName, function(r, n) {
            complexTypeProj.setDimDefaults(n, r.dimensionDefaults);
        }, this);
    }

    // ---------------------

    // We assume that, since the `begin` phase,
    // the binding of visual roles to dimensions (or source roles) has not changed.
    //
    // However, the translation has now had a chance to configure the complex type project,
    // defining new dimensions or just configuring existing ones (with valueType, label, etc),
    // and, in any case, marking those as being read or calculated.
    //
    // For what the binding of visual roles to dimensions is concerned,
    // now is the time to check whether the default dimensions of still unbound visual roles exist.
    // Also, because all other possible contributors (just the translation, really) to defining
    // new dimensions have already done so, default dimensions of roles having autoCreateDimension to true,
    // are now created as a last resort.
    //
    // Roles are bound before actually loading data.
    // One of the reasons is for being possible to filter datums
    // whose "every dimension in a measure role is null".
    function end() {
        visualRolesBinder_assertState(state, 2); // began
        state = 3; // ending

        context.query().each(function(r) {
            if(!r.isPreBound()) autoPrebindUnbound(r);
        });

        // By now, any not sourced, unbound required role already caused throwing a required role error.

        // Try to pre-bind sourced roles that are still unbound.
        unboundSourcedRoles.forEach(function(r) {
            if(!tryPreBindSourcedRole(r)) roleIsUnbound(r);
        });

        // -------

        applySingleRoleDefaults();

        // -------

        // Setup the complex type from complexTypeProj;
        var complexType = new cdo.ComplexType();

        complexTypeProj.configureComplexType(complexType, dimsOptions);

        if(doLog) logger(complexType.describe());

        // Commits and validates the grouping specification.
        // Null groupings are discarded.
        // Sourced roles that were also pre-bound are here normally bound.
        context.query().each(function(r) {
            if(r.isPreBound()) r.postBind(complexType);
        });

        if(doLog) logVisualRoles();

        state = 4; // ended

        return complexType;
    }

    function autoPrebindUnbound(r) {
        if(r.sourceRole) return addUnboundSourced(r);

        // --------------

        // Try to bind automatically to defaultDimensionName.
        var dimName = r.defaultDimensionName;
        if(dimName) {
            // An asterisk at the end of the name indicates
            // that any dimension of that group is allowed.
            // If the role allows multiple dimensions,
            // then the meaning is greedy - use them all.
            // Otherwise, use only one.
            // Ex:  "product*"
            var match = dimName.match(/^(.*?)(\*)?$/) || def.fail.argumentInvalid('defaultDimensionName'),
                defaultName = match[1],
                greedy      = match[2];
            if(greedy) {
                // TODO: does not respect any index explicitly specified before the *. It could mean >=...
                var groupDimNames = complexTypeProj.groupDimensionsNames(defaultName);
                if(groupDimNames) return preBindToDims(r, groupDimNames);

                // Continue to auto create dimension

            } else if(complexTypeProj.hasDim(defaultName)) { // defaultName === dimName
                return preBindToDims(r, defaultName);
            }

            if(r.autoCreateDimension) {
                // Create a hidden dimension and bind the role and the dimension.
                // Dimension will receive only null data.
                complexTypeProj.setDim(defaultName, {isHidden: true});

                return preBindToDims(r, defaultName);
            }
        }

        // --------------

        if(r.defaultSourceRoleName) {
            var source = context(r.defaultSourceRoleName);
            if(source) {
                r.setSourceRole(source);
                return addUnboundSourced(r);
            }
        }

        // --------------

        roleIsUnbound(r);
    }

    function preBindToDims(r, ns) {
        var grouping = cdo.GroupingSpec.parse(ns);

        preBindToGrouping(r, grouping);
    }

    function roleIsUnbound(r) {
        // Throws if role is required
        visRoleBinder_assertUnboundRoleIsOptional(r); // throws if required

        // Unbind role from any previous binding
        r.bind(null);
        r.setSourceRole(null); // if any
    }

    function logVisualRoles() {
        var table = def.textTable(3)
            .rowSep()
            .row("Visual Role", "Source/From", "Bound to Dimension(s)")
            .rowSep();

        context.query().each(function(r) {
            table.row(
                r.prettyId(),
                r.sourceRole ? r.sourceRole.prettyId() : "-",
                String(r.grouping || "-"));
        });

        table.rowSep(true);

        logger("VISUAL ROLES MAP SUMMARY\n" + table() + "\n");
    }
}

function visRoleBinder_assertUnboundRoleIsOptional(r) {
    if(r.isRequired) throw def.error.operationInvalid("The required visual role '{0}' is unbound.", [r.name]);
}

function visualRolesBinder_assertState(state, desiredState) {
    if(state !== desiredState) throw def.error.operationInvalid("Invalid state.");
}