
/**
 * Initializes a scene variable.
 * 
 * @name pvc.visual.ValueLabelVar
 * @class A scene variable holds the concrete value that 
 * a {@link pvc.visual.Role} or other relevant piece of information 
 * has in a {@link pvc.visual.Scene}.
 * Usually, it also contains a label that describes it.
 * 
 * @constructor
 * @param {any} value The value of the variable.
 * @param {any} label The label of the variable.
 * @param {any} [rawValue] The raw value of the variable.
 */
pvc.visual.ValueLabelVar = function(value, label, rawValue){
    this.value = value;
    this.label = label;
    
    if(rawValue !== undefined){
        this.rawValue = rawValue;
    }
};

def.set(
    pvc.visual.ValueLabelVar.prototype,
    'rawValue', undefined,
    'clone',    function(){
        return new pvc.visual.ValueLabelVar(this.value, this.label, this.rawValue);
    },
    'toString', function(){
        var label = this.label || this.value;
        return typeof label !== 'string' ? ('' + label) : label;
    });

pvc.visual.ValueLabelVar.fromComplex = function(complex){
    return complex ?
           new pvc.visual.ValueLabelVar(complex.value, complex.label, complex.rawValue) :
           new pvc.visual.ValueLabelVar(null, "", null)
           ;
};

def
.type('pvc.visual.RoleVarHelper')
.init(function(rootScene, role, keyArgs){
    var g;
    var hasPercentSubVar = def.get(keyArgs, 'hasPercentSubVar', false);

    if(!def.get(keyArgs, 'forceUnbound', false)){
        this.role = role;
        this.sourceRoleName = role.sourceRole && role.sourceRole.name;

        g = this.grouping = role.grouping;
        if(g && !g.isDiscrete()){
            var panel = rootScene.panel();
            this.rootContDim = panel.data.owner.dimensions(g.firstDimensionName());
            if(hasPercentSubVar){
                this.percentFormatter = panel.chart.options.percentValueFormat;
            }
        }
    }
    
    if(!g){
        // Unbound role
        // Simply place a null variable in the root scene
        var roleVar = rootScene.vars[role.name] = new pvc.visual.ValueLabelVar(null, "");
        if(hasPercentSubVar){
            roleVar.percent = new pvc.visual.ValueLabelVar(null, "");
        }
    }
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
                    roleVar = new pvc.visual.ValueLabelVar(
                        view.value,
                        view.label,
                        view.rawValue);
                }
            } else {
                var group = scene.group;
                var singleDatum = group ? group.singleDatum() : scene.datum;
                if(singleDatum){
                    if(!singleDatum.isNull){
                        // Simpy inherit from the atom, to save memory
                        // The Atom is compatible with the "Var" interface
                        roleVar = Object.create(singleDatum.atoms[rootContDim.name]);
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
