
/**
 * Initializes a legend bullet group scene.
 * 
 * @name pvc.visual.legend.BulletGroupScene

 * @extends pvc.visual.Scene
 * 
 * @constructor
 * @param {pvc.visual.legend.BulletRootScene} parent The parent bullet root scene.
 * @param {object} [keyArgs] Keyword arguments.
 * See {@link pvc.visual.Scene} for additional keyword arguments.
 * @param {pv.visual.legend.renderer} [keyArgs.renderer] Keyword arguments.
 */
def
.type('pvc.visual.legend.BulletGroupScene', pvc.visual.Scene)
.init(function(rootScene, keyArgs){
    
    this.base(rootScene, keyArgs);
    
    this.extensionPrefix =  def.get(keyArgs, 'extensionPrefix') || 'legend';
    this.renderer = def.get(keyArgs, 'renderer') || 
                    new pvc.visual.legend.BulletItemDefaultRenderer();
});