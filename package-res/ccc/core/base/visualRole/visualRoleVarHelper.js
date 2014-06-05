/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_ValueLabelVar:true */

def
.type('pvc.visual.RoleVarHelper')
.init(function(rootScene, roleName, role, keyArgs) {
    var hasPercentSubVar = def.get(keyArgs, 'hasPercentSubVar', false),
        g = this.grouping = role && role.grouping,
        panel;
    if(g) {
        this.role = role;
        this.sourceRoleName = role.sourceRole && role.sourceRole.name;
        panel = rootScene.panel();
        this.panel = panel;
        
        if(!g.isDiscrete()) {
            this.rootContDim = panel.data.owner.dimensions(g.lastDimensionName());
            if(hasPercentSubVar) this.percentFormatter = panel.chart.options.percentValueFormat;
        }
    }
    
    if(!roleName) {
        if(!role) throw def.error.operationInvalid("Role is not defined, so the roleName argument is required.");

        roleName = role.name;
    }
    
    if(!g) {
        // Unbound role
        // Place a null variable in the root scene
        var roleVar = rootScene.vars[roleName] = new pvc_ValueLabelVar(null, "");
        if(hasPercentSubVar) roleVar.percent = new pvc_ValueLabelVar(null, "");
    }
    
    this.roleName = roleName;
    
    rootScene['is' + def.firstUpperCase(roleName) + 'Bound'] = !!g;
    
    if(def.get(keyArgs, 'allowNestedVars')) this.allowNestedVars = true;
})
.add({
    allowNestedVars: false,
    
    isBound: function() {
        return !!this.grouping;
    },

    onNewScene: function(scene, isLeaf) {
        if(!this.grouping) return;
        
        var roleName = this.roleName;
        if(this.allowNestedVars ? 
           def.hasOwnProp.call(scene.vars, roleName) :
           scene.vars[roleName])
            return;
        
        var sourceName = this.sourceRoleName, sourceVar;
        if(sourceName && (sourceVar = def.getOwn(scene.vars, sourceName))) {
            scene.vars[roleName] = sourceVar.clone();
            return;
        }
        
        // TODO: gotta improve this spaghetti somehow
        
        if(isLeaf) {
            // Not grouped, so there's no guarantee that
            // there's a single value for all the datums of the group.
            var roleVar,
                rootContDim = this.rootContDim;
            if(!rootContDim) {
                // Discrete
                
                // We choose the value of the first datum of the group...
                var firstDatum = scene.datum;
                if(firstDatum && !firstDatum.isNull) {
                    var view = this.grouping.view(firstDatum);
                    roleVar = pvc_ValueLabelVar.fromComplex(view);
                }
            } else {
                var valuePct, valueDim,
                    group = scene.group,
                    singleDatum = group ? group.singleDatum() : scene.datum;
                if(singleDatum) {
                    if(!singleDatum.isNull) {
                        roleVar = pvc_ValueLabelVar.fromAtom(singleDatum.atoms[rootContDim.name]);
                        if(roleVar.value != null && this.percentFormatter) {
                            if(group) {
                                valueDim = group.dimensions(rootContDim.name);
                                valuePct = valueDim.valuePercent({visible: true});
                            } else {
                                // TODO: Shouldn't {visible:true} be added here as well?
                                // Compare with the code in BasePanel _summaryTooltipFormatter.
                                // Is all data visible at this point?
                                valuePct = scene.data().dimensions(rootContDim.name).percent(roleVar.value);
                            }
                        }
                    }
                } else if(group) {
                    valueDim = group.dimensions(rootContDim.name);
                    var value = valueDim.value({visible: true, zeroIfNone: false});
                    if(value != null) {
                        var label = rootContDim.format(value);
                        roleVar = new pvc_ValueLabelVar(value, label, value);
                        if(this.percentFormatter) valuePct = valueDim.valuePercent({visible: true});
                    }
                }
                
                if(roleVar && this.percentFormatter) {
                    if(roleVar.value == null)
                        roleVar.percent = new pvc_ValueLabelVar(null, "");
                    else
                        roleVar.percent = new pvc_ValueLabelVar(
                                          valuePct,
                                          this.percentFormatter.call(null, valuePct));
                }
            }
            
            if(!roleVar) {
                roleVar = new pvc_ValueLabelVar(null, "");
                if(this.percentFormatter) roleVar.percent = new pvc_ValueLabelVar(null, "");
            }
            
            scene.vars[roleName] = roleVar;
        }
    }
});
