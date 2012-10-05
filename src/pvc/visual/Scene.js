
/**
 * Initializes a scene.
 * 
 * @name pvc.visual.Scene
 * @class Scenes guide the rendering of protovis marks;
 * they are supplied to {@link pv.Mark} <tt>data</tt> property.
 * <p>
 * A scene may feed several marks and so is not specific to a given mark 
 * (contrast with protovis' instances/scenes).
 * </p>
 * <p>
 * Scenes provide a well defined interface to pvc's 
 * extension point functions.
 * </p>
 * <p>
 * Scenes hold precomputed data, that does not change with interaction,
 * and that is thus not recalculated in every protovis render caused by interaction.
 * </p>
 * <p>
 * Scenes bridge the gap between data and visual roles. 
 * Data can be accessed by one or the other view.
 * </p>
 * 
 * @borrows pv.Dom.Node#visitBefore as #visitBefore
 * @borrows pv.Dom.Node#visitAfter as #visitAfter
 * 
 * @borrows pv.Dom.Node#nodes as #nodes
 * @borrows pv.Dom.Node#firstChild as #firstChild
 * @borrows pv.Dom.Node#lastChild as #lastChild
 * @borrows pv.Dom.Node#previousSibling as #previousSibling
 * @borrows pv.Dom.Node#nextSibling as #nextSibling
 * 
 * 
 * @property {pvc.data.Data}  group The data group that's present in the scene, or <tt>null</tt>, if none.
 * @property {pvc.data.Datum} datum The datum that's present in the scene, or <tt>null</tt>, if none.
 * @property {object} atoms The map of atoms, by dimension name, that's present in the scene, or <tt>null</tt>, if none.
 * <p>
 * When there is a group, these are its atoms, 
 * otherwise, 
 * if there is a datum, 
 * these are its atoms.
 * </p>
 * <p>
 * Do <b>NOT</b> modify this object.
 * </p>
 * 
 * @constructor
 * @param {pvc.visual.Scene} [parent=null] The parent scene.
 * @param {object} [keyArgs] Keyword arguments.
 * @property {pvc.data.Data}  [keyArgs.group=null] The data group that's present in the scene.
 * Specify only one of the arguments <tt>group</tt> or <tt>datum</tt>.
 * @property {pvc.data.Datum} [keyArgs.datum=null] The single datum that's present in the scene.
 * Specify only one of the arguments <tt>group</tt> or <tt>datum</tt>.
 */
def.type('pvc.visual.Scene')
.init(function(parent, keyArgs){
    if(pvc.debug >= 4){
        this.id = def.nextId('scene');
    }
    
    this._renderId   = 0;
    this.renderState = {};
    
    pv.Dom.Node.call(this, /* nodeValue */null);
    
    this.parent = parent || null;
    this.root   = this;
    if(parent){
        // parent -> ((pv.Dom.Node#)this).parentNode
        // this   -> ((pv.Dom.Node#)parent).childNodes
        // ...
        var index = def.get(keyArgs, 'index', null);
        parent.insertAt(this, index);
        this.root = parent.root;
    } else {
        /* root scene */
        this._active = null;
        this._panel = def.get(keyArgs, 'panel') || 
            def.fail.argumentRequired('panel', "Argument is required on root scene.");
    }
    
    /* DATA */
    var group = def.get(keyArgs, 'group', null),
        datum;
    if(group){
        datum = group._datums[0]; // null on empty datas (just try hiding all series with the legend)
    } else {
        datum = def.get(keyArgs, 'datum');
    }
    
    this.datum = datum || null;
    this.group = group;

    var source = (datum || group);
    this.atoms = source ? source.atoms : null;
    
    /* VARS */
    this.vars = parent ? Object.create(parent.vars) : {};
})
.add(pv.Dom.Node)

.add(/** @lends pvc.visual.Scene# */{
    /**
     * Obtains an enumerable of the datums present in the scene.
     *
     * @type def.Query
     */
    datums: function(){
        return this.group ?
                    this.group.datums() :
                    (this.datum ? def.query(this.datum) : def.query());
    },
    
    /*
     * {value} -> <=> this.vars.value.label
     * {value.value} -> <=> this.vars.value.value
     * {#sales} -> <=> this.atoms.sales.label
     */
    format: function(mask){
        return def.format(mask, this._formatScope, this);
    },
    
    _formatScope: function(prop){
        if(prop.charAt(0) === '#'){
            // An atom name
            prop = prop.substr(1).split('.');
            if(prop.length > 2){
                throw def.error.operationInvalid("Scene format mask is invalid.");
            }
            
            var atom = this.atoms[prop[0]];
            if(atom){
                if(prop.length > 1) {
                    switch(prop[1]){
                        case 'value': return atom.value;
                        case 'label': break;
                        default:      throw def.error.operationInvalid("Scene format mask is invalid.");
                    }
                }
                
                // atom.toString() ends up returning atom.label
                return atom;
            }
            
            return null; // Atom does not exist --> ""
        }
        
        // A scene var name
        return def.getPath(this.vars, prop); // Scene vars' toString may end up being called
    },
    
    isRoot: function(){
        return this.root === this;   
    },
    
    panel: function(){
        return this.root._panel;
    },
    
    chart: function(){
        return this.root._panel.chart;
    },
    
    compatVersion: function(){
        return this.root._panel.compatVersion();
    },
    
    /**
     * Obtains an enumerable of the child scenes.
     * 
     * @type def.Query
     */
    children: function(){
        if(!this.childNodes) {
            return def.query();
        }
        
        return def.query(this.childNodes);
    },
    
    leafs: function(){
        function getFirstLeafFrom(leaf){
            // Find first leaf from current
            while(leaf.childNodes.length){
                leaf = leaf.childNodes[0];
            }
            
            return leaf;
        }
        
        var root = this;
        return def.query(function(nextIndex){
            if(!nextIndex){
                // Initialize
                var item = getFirstLeafFrom(root);
                if(item === root){
                    return 0;
                }
                
                this.item = item;
                return 1; // has next
            }
            
            // Has a next sibling?
            var next = this.item.nextSibling;
            if(next){
                this.item = next;
                return 1; // has next
            }
            
            // Go to closest ancestor that has a sibling
            var current = this.item;
            while((current !== root) && (current = current.parentNode)){
                if((next = current.nextSibling)){
                    // Take the first leaf from there
                    this.item = getFirstLeafFrom(next);
                    return 1;
                }
            }
            
            return 0;
        });
    },
    
    /* INTERACTION */
    anyInteraction: function(){
        return (!!this.root._active || this.anySelected());
    },

    /* ACTIVITY */
    isActive: false,
    
    setActive: function(isActive){
        isActive = !!isActive; // normalize
        if(this.isActive !== isActive){
            rootScene_setActive.call(this.root, this.isActive ? null : this);
        }
    },
    
    clearActive: function(){
        return rootScene_setActive.call(this.root, null);
    },
    
    anyActive: function(){
        return !!this.root._active;
    },
    
    active: function(){
        return this.root._active;
    },
    
    activeSeries: function(){
        var active = this.active();
        var seriesVar;
        return active && (seriesVar = active.vars.series) && seriesVar.value;
    },
    
    isActiveSeries: function(){
        if(this.isActive){
            return true;
        }
        
        var activeSeries;
        return (activeSeries = this.activeSeries()) != null &&
               (activeSeries === this.vars.series.value);
    },
    
    /* SELECTION */
    isSelected: function(){
        return this._selectedData().is;
    },
    
    anySelected: function(){
        return this._selectedData().any;
    },
    
    _selectedData: function(){
        return this.renderState._selectedData || 
               (this.renderState._selectedData = this._createSelectedData());
    },
    
    _createSelectedData: function(){
        var any = this.panel().chart.data.owner.selectedCount() > 0,
            isSelected = any && 
                         this.datums()
                             .any(function(datum){ return datum.isSelected; });
        
        return {
            any: any,
            is:  isSelected
        };
    }
});

/** 
 * Called on each sign's pvc.visual.Sign#buildInstance 
 * to ensure cached data per-render is cleared.
 * 
 *  @param {number} renderId The current render id.
 */
function scene_renderId(renderId){
    if(this._renderId !== renderId){
        if(pvc.debug >= 20){
            pvc.log({sceneId: this.id, oldRenderId: this._renderId, newRenderId: renderId});
        }
        
        this._renderId   = renderId;
        this.renderState = {};
    }
}

function rootScene_setActive(scene){
    var ownerScene;
    if(scene && (ownerScene = scene.ownerScene)){
        scene = ownerScene;
    }
    
    if(this._active !== scene){
        if(this._active){
            scene_setActive.call(this._active, false);
        }
        
        this._active = scene || null;
        
        if(this._active){
            scene_setActive.call(this._active, true);
        }
        return true;
    }
    return false;
}

function scene_setActive(isActive){
    isActive = !!isActive; // normalize
    if(this.isActive !== isActive){
        if(!isActive){
            delete this.isActive;
        } else {
            this.isActive = true;
        }
    }
}