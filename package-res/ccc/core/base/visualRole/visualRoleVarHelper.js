/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_ValueLabelVar:true */

function datum_notNull(d) { return !d.isNull; }

/**
 * This helper class helps in the creation of scene variables corresponding to visual roles whose grouping is not one of the groupings
 * that the plot's main data is based on.
 *
 * The plot's main data is based on the **key** visual roles (typically, "multiChart" > "dataPart" > "category" > "series").
 * Corresponding scene variables can be created directly through something like `pvc_ValueLabelVar.fromComplex(dataGroup)`.
 *
 * Some other visual roles are "dependent key" visual roles, meaning that,
 * these can only be bound to dimensions to which key visual roles are already bound (e.g. "color" of bar plot).
 * These visual roles are usually sourced, by default, to a key visual role.
 *
 * For sourced visual roles,
 * if a scene variable corresponding to the source visual role has been created before in the scene,
 * it is cloned.
 *
 * Otherwise, if not sourced or if a source variable is not (yet) available, a fresh variable is created.
 *
 * If the visual role is discrete (and whatever the data type of the bound dimensions),
 * it is assumed that, still,
 * its dimensions are covered/fixed by the grouping of the plot's main data, and that,
 * in particular, these are fixed in the scene for which the variable is created.
 * As such, the value of a scene's first (non-null, to support interpolation) datum is used, directly.
 * At worst, if the dimensions are actually not fixed,
 * this method will correspond to a "first" aggregation.
 *
 * If the visual role is not discrete,
 * it still can have a single or multiple bound dimensions, and
 * these can be numeric or dates.
 *
 * When the visual role is bound to multiple dimensions,
 * still for each scene, only one of those dimensions can be active,
 * as controlled by the corresponding discriminator dimension.
 * a scene's multiple datums are aggregated by summing (only numeric roles are supported).
 */

def
.type('pvc.visual.RoleVarHelper')
.init(function(rootScene, roleName, role, keyArgs) {

    this.role = role || null;

    var grouping = role && role.grouping;
    this.grouping = grouping;

    if(!roleName) {
        if(!role) throw def.error.operationInvalid("Role is not defined, so the roleName argument is required.");

        roleName = role.name;
    }

    this.roleName = roleName;
    this.sourceRoleName = null;
    this.panel = null;
    this.hasPercentSubVar = def.get(keyArgs, 'hasPercentSubVar', false);
    this.allowNestedVars = !!def.get(keyArgs, 'allowNestedVars');
    this.isNumericMode = false;
    this.isSingleNumberDimension = false;

    if(grouping !== null) {
        // Role is bound.

        // Unwind the source role, if any.
        var rootSourceRole = role.rootSourceRole;
        var sourceRoleName = rootSourceRole && rootSourceRole.name;
        // TODO: can this happen? wouldn't it represent a cycle if it could?
        if(sourceRoleName !== role.name) {
            this.sourceRoleName = sourceRoleName;
        }

        var panel = rootScene.panel();
        this.panel = panel;

        // All dimensions are not discrete and all have the same valueType.
        if(!grouping.isDiscrete() && grouping.singleContinuousValueType === Number) {
            this.isNumericMode = true;
            this.isSingleNumberDimension = grouping.isSingleDimension;
        }
    } else {
        // Role is unbound.

        // Place a null variable in the root scene.
        var roleVar = rootScene.vars[roleName] = this._createNullVar();
        if(this.hasPercentSubVar) {
            roleVar.percent = this._createNullVar();
        }
    }

    // e.g. rootScene.isCategoryBound
    rootScene['is' + def.firstUpperCase(roleName) + 'Bound'] = !!grouping;
})
.add({
    isBound: function() {
        return !!this.grouping;
    },

    onNewScene: function(scene, isLeaf) {
        // Unbound? Null variable already added to the root scene.
        if(!this.grouping) {
            return;
        }

        // Variable already present?
        var roleName = this.roleName;
        if(this.allowNestedVars ? def.hasOwnProp.call(scene.vars, roleName) : (roleName in scene.vars)) {
            return;
        }

        // Source role?
        var sourceVar;
        var sourceRoleName = this.sourceRoleName;
        if(sourceRoleName !== null && (sourceVar = def.getOwn(scene.vars, sourceRoleName, null)) !== null) {
            scene.vars[roleName] = sourceVar.clone();
            return;
        }

        if(isLeaf) {
            scene.vars[roleName] = this._createVar(scene);
        }
    },

    // This is a non-key visual role!
    // Possibly a dependent key visual role.
    // Can be considered discrete or continuous.
    // Can be bound to one or multiple dimensions.
    // Can have one or more datums (and a group, etc.).
    // Can have null datums, including the first one.
    // If discrete or date, only know how to "aggregate" by taking the first read value...
    // If number, sums to aggregate, and can calculate percentages.
    _createVar: function(scene) {

        var datum;

        // 1. Numeric mode.
        if(this.isNumericMode) {
            var group = scene.group;
            var singleDatum = group !== null ? group.singleDatum() : scene.datum;
            if(singleDatum !== null) {
                return this._createVarFromDatumNumber(singleDatum, scene);
            }

            if(group !== null) {
                return this._createVarFromGroupNumber(group);
            }

            return this._createVarFromDatumNumber(null, scene);
        }

        // 2. Discrete Mode (Discrete Or Date).

        // We choose the value of the first non-null datum of the group.
        var firstDatum = scene.datum;
        if(firstDatum !== null && firstDatum.isNull) {
            firstDatum = scene.datums().where(datum_notNull).first() || null;
        }

        return this._createVarFromDatumDiscrete(firstDatum);
    },

    _createNullVar: function() {
        return new pvc_ValueLabelVar(null, "");
    },

    _createVarFromDatumDiscrete: function(datum) {
        if(datum === null || datum.isNull) {
            return this._createNullVar();
        }

        if(this.grouping.isSingleDimension) {
            // A single atom.
            return pvc_ValueLabelVar.fromAtom(datum.atoms[this.grouping.singleDimensionName]);
        }

        var view = this.grouping.view(datum);
        return pvc_ValueLabelVar.fromComplex(view);
    },

    _createVarFromDatumNumber: function(datum, scene) {

        // If there is a single datum, then there is a single atom, and no summing is needed.
        // This is the most common case.

        var roleVar;
        var valuePctAtom = null;

        if(datum === null || datum.isNull) {
            roleVar = this._createNullVar();
        } else {
            // Some scenes are datum-only scenes (e.g. Scatter).
            // So, getting a data set to find a discriminator variable may require looking at the parent scene.

            var valueAtom;
            var groupData = scene.group;
            var valueDimName = this.role.getBoundDimensionName(groupData || scene.data(), /* isOptional: */ groupData != null);
            if(valueDimName !== null) {
                valueAtom = datum.atoms[valueDimName];
            } else {
                // A hierarchical scene, with a single datum, where the discriminator dimension is only settled on a deeper level.
                // E.g. sunburst with sizeRole.dim in category, as a last dimension.
                // Go through the general, slower path.
                valueAtom = this.role.numberValueOf(groupData);
            }

            roleVar = pvc_ValueLabelVar.fromAtom(valueAtom);
            roleVar.dimensionName = valueDimName;

            // Calculate the percent value.
            if(roleVar.value != null && this.hasPercentSubVar && scene.group !== null) {
                valuePctAtom = this.role.percentOf(scene.group);
            }
            // else if scene.group === null, not supported
        }

        if(this.hasPercentSubVar) {
            roleVar.percent = this._createPercentVar(valuePctAtom);
        }

        return roleVar;
    },

    _createVarFromGroupNumber: function(groupData) {

        var valueAtom = this.role.numberValueOf(groupData);

        var roleVar = pvc_ValueLabelVar.fromAtom(valueAtom);
        roleVar.dimensionName = valueAtom.dimension !== null ? valueAtom.dimension.name : null;

        if(this.hasPercentSubVar) {
            var valuePctAtom = valueAtom.value !== null ? this.role.percentOf(groupData) : null;

            roleVar.percent = this._createPercentVar(valuePctAtom);
        }

        return roleVar;
    },

    _createPercentVar: function(valuePctAtom) {
        return valuePctAtom == null
            ? this._createNullVar()
            : new pvc_ValueLabelVar(valuePctAtom.value, valuePctAtom.labelPercent);
    }
});
