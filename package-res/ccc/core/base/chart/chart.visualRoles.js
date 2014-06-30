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
     * that are considered measures.
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

        return this._measureVisualRoles ||
            (this._measureVisualRoles =
                this.visualRoleList.filter(function(r) {
                    return r.isBound() && !r.isDiscrete() && r.isMeasure;
                }));
    },

    measureDimensionsNames: function() {
        return def.query(this.measureVisualRoles())
            .selectMany(function(r) { return r.grouping.dimensionNames(); })
            .distinct()
            .array();
    },

    /**
     * Obtains the chart-level visual roles played by a given dimension name, in definition order.
     * Do NOT modify the returned array.
     * @param {string} dimName The name of the dimension.
     * @return {pvc.visual.Role[]} The array of visual roles or <tt>null</tt>, if none.
     */
    visualRolesOf: function(dimName) {
        var visualRolesByDim = this._visRolesByDim;
        if(!visualRolesByDim) {
            visualRolesByDim = this._visRolesByDim = {};
            this.visualRoleList.forEach(function(r) {
                if(!r.plot) {
                    var g = r.grouping;
                    if (g) g.dimensionNames().forEach(function (n) {
                        def.array.lazy(visualRolesByDim, n).push(r);
                    });
                }
            });
        }
        return def.getOwn(visualRolesByDim, dimName, null);
    },

    _constructVisualRoles: function(/*options*/) {
        var parent = this.parent;
        if(parent) {
            this.visualRoles = parent.visualRoles;
            this.visualRoleList = parent.visualRoleList;
        } else {
            this.visualRoles = {};
            this.visualRoleList = [];
        }
    },

    _addVisualRole: function(name, keyArgs) {
        keyArgs = def.set(keyArgs, 'index', this.visualRoleList.length);
        var role = new pvc.visual.Role(name, keyArgs),
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
     * Initializes the chart-level visual roles.
     * @virtual
     */
    _initChartVisualRoles: function() {
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

    _getDataPartDimName: function(useDefault) {
        var role = this.visualRoles.dataPart, preGrouping;
        return role.isBound()                          ? role.lastDimensionName()        :
               (preGrouping = role.preBoundGrouping()) ? preGrouping.lastDimensionName() :
               useDefault                              ? role.defaultDimensionName       :
               null;
    }
});

