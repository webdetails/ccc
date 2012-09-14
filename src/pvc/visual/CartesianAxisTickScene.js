
/**
 * Initializes an axis tick scene.
 * 
 * @name pvc.visual.CartesianAxisTickScene
 * 
 * @extends pvc.visual.Scene
 * 
 * @constructor
 * @param {pvc.visual.CartesianAxisRootScene} [parent] The parent scene, if any.
 * @param {object} [keyArgs] Keyword arguments.
 * See {@link pvc.visual.Scene} for supported keyword arguments.
 */
def
.type('pvc.visual.CartesianAxisTickScene', pvc.visual.Scene)
.init(function(parent, keyArgs){
    
    this.base(parent, keyArgs);
    
    this.vars.tick = new pvc.visual.ValueLabelVar(
            def.get(keyArgs, 'tick'),
            def.get(keyArgs, 'tickLabel'),
            def.get(keyArgs, 'tickRaw'));
});