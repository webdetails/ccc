def
.type('pvc.visual.RoleVarHelper')
.init(function(rootScene, role, keyArgs){
    var g;
    var hasPercentSubVar = def.get(keyArgs, 'hasPercentSubVar', false);

    if(!def.get(keyArgs, 'forceUnbound', false)){
        g = this.grouping = role.grouping;
        if(g){
            this.role = role;
            this.sourceRoleName = role.sourceRole && role.sourceRole.name;
            if(!g.isDiscrete()){
                var panel = rootScene.panel();
                this.rootContDim = panel.data.owner.dimensions(g.firstDimensionName());
                if(hasPercentSubVar){
                    this.percentFormatter = panel.chart.options.percentValueFormat;
                }
            }
        }
    }
    
    if(!g){
        // Unbound role
        // Place a null variable in the root scene
        var roleVar = rootScene.vars[role.name] = new pvc.visual.ValueLabelVar(null, "");
        if(hasPercentSubVar){
            roleVar.percent = new pvc.visual.ValueLabelVar(null, "");
        }
    }

    rootScene['is' + def.firstUpperCase(role.name) + 'Bound'] = !!g;
})
.add({
    isBound: function(){
        return !!this.grouping;
    },

    onNewScene: function(scene, isLeaf){
        if(!this.grouping){
            return;
        }
        
        var roleName = this.role.name;
        if(scene.vars[roleName]){
            return;
        }
        
        var sourceName = this.sourceRoleName;
        if(sourceName){
            var sourceVar = def.getOwn(scene.vars, sourceName);
            if(sourceVar){
                scene.vars[roleName] = sourceVar.clone();
                return;
            }
        }

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
                var group = scene.group;
                var singleDatum = group ? group.singleDatum() : scene.datum;
                if(singleDatum){
                    if(!singleDatum.isNull){
                        roleVar = pvc.visual.ValueLabelVar.fromAtom(singleDatum.atoms[rootContDim.name]);
                    }
                } else if(group){
                    var valueDim = group.dimensions(rootContDim.name);
                    var value    = valueDim.sum({visible: true, zeroIfNone: false});
                    var label    = rootContDim.format(value);
                    
                    roleVar = new pvc.visual.ValueLabelVar(value, label, value);
                    if(this.percentFormatter){
                        if(value == null){
                            roleVar.percent = new pvc.visual.ValueLabelVar(value, label);
                        } else {
                            var valuePct = valueDim.percentOverParent({visible: true});

                            roleVar.percent = new pvc.visual.ValueLabelVar(
                                                    valuePct,
                                                    this.percentFormatter.call(null, valuePct));
                        }
                    }
                }
            }

            scene.vars[roleName] = roleVar ||
                                   new pvc.visual.ValueLabelVar(null, "");
        }
    }
});
