def
.type('pvc.visual.RoleVarHelper')
.init(function(rootScene, role, keyArgs){
    var hasPercentSubVar = def.get(keyArgs, 'hasPercentSubVar', false);
    var roleVarName = def.get(keyArgs, 'roleVar');
    
    var g = this.grouping = role && role.grouping;
    if(g){
        this.role = role;
        this.sourceRoleName = role.sourceRole && role.sourceRole.name;
        var panel = rootScene.panel();
        this.panel = panel;
        
        if(!g.isDiscrete()){
            this.rootContDim = panel.data.owner.dimensions(g.firstDimensionName());
            if(hasPercentSubVar){
                this.percentFormatter = panel.chart.options.percentValueFormat;
            }
        }
    }
    
    if(!roleVarName){
        if(!role){
            throw def.error.operationInvalid("Role is not defined, so the roleVar argument is required.");
        }
        
        roleVarName = role.name;
    }
    
    if(!g){
        // Unbound role
        // Place a null variable in the root scene
        var roleVar = rootScene.vars[roleVarName] = new pvc.visual.ValueLabelVar(null, "");
        if(hasPercentSubVar){
            roleVar.percent = new pvc.visual.ValueLabelVar(null, "");
        }
    }
    
    this.roleVarName = roleVarName;
    
    rootScene['is' + def.firstUpperCase(roleVarName) + 'Bound'] = !!g;
    
    if(def.get(keyArgs, 'allowNestedVars')){ this.allowNestedVars = true; }
})
.add({
    allowNestedVars: false,
    
    isBound: function(){
        return !!this.grouping;
    },

    onNewScene: function(scene, isLeaf){
        if(!this.grouping){
            return;
        }
        
        var roleVarName = this.roleVarName;
        if(this.allowNestedVars ? 
            def.hasOwnProp.call(scene.vars, roleVarName) : 
            scene.vars[roleVarName]){
            return;
        }
        
        var sourceName = this.sourceRoleName;
        if(sourceName){
            var sourceVar = def.getOwn(scene.vars, sourceName);
            if(sourceVar){
                scene.vars[roleVarName] = sourceVar.clone();
                return;
            }
        }
        
        // TODO: gotta improve this spaghetti somehow
        
        if(isLeaf){
            // Not grouped, so there's no guarantee that
            // there's a single value for all the datums of the group.
        
            var roleVar;
            var rootContDim = this.rootContDim;
            if(!rootContDim){
                // Discrete
                
                // We choose the value of the first datum of the group...
                var firstDatum = scene.datum;
                if(firstDatum && !firstDatum.isNull){
                    var view = this.grouping.view(firstDatum);
                    roleVar = pvc.visual.ValueLabelVar.fromComplex(view);
                }
            } else {
                var valuePct, valueDim;
                var group = scene.group;
                var singleDatum = group ? group.singleDatum() : scene.datum;
                if(singleDatum){
                    if(!singleDatum.isNull){
                        roleVar = pvc.visual.ValueLabelVar.fromAtom(singleDatum.atoms[rootContDim.name]);
                        if(roleVar.value != null && this.percentFormatter){
                            if(group){
                                valueDim = group.dimensions(rootContDim.name);
                                valuePct = valueDim.percentOverParent({visible: true});
                            } else {
                                valuePct = scene.data().dimensions(rootContDim.name).percent(roleVar.value);
                            }
                        }
                    }
                } else if(group){
                    valueDim = group.dimensions(rootContDim.name);
                    var value = valueDim.sum({visible: true, zeroIfNone: false});
                    if(value != null){
                        var label = rootContDim.format(value);
                        roleVar = new pvc.visual.ValueLabelVar(value, label, value);
                        if(this.percentFormatter){
                            valuePct = valueDim.percentOverParent({visible: true});
                        }
                    }
                }
                
                if(roleVar && this.percentFormatter){
                    if(roleVar.value == null){
                        roleVar.percent = new pvc.visual.ValueLabelVar(null, "");
                    } else {
                        roleVar.percent = new pvc.visual.ValueLabelVar(
                                          valuePct,
                                          this.percentFormatter.call(null, valuePct));
                    }
                }
            }
            
            if(!roleVar){
                roleVar = new pvc.visual.ValueLabelVar(null, "");
                if(this.percentFormatter){
                    roleVar.percent = new pvc.visual.ValueLabelVar(null, "");
                }
            }
            
            scene.vars[roleVarName] = roleVar;
        }
    }
});
