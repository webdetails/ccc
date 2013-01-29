
/**
 * Initializes a waterfall legend bullet group scene.
 * 
 * @name pvc.visual.legend.WaterfallBulletGroupScene

 * @extends pvc.visual.Scene
 * 
 * @constructor
 * @param {pvc.visual.legend.BulletRootScene} parent The parent bullet root scene.
 * @param {object} [keyArgs] Keyword arguments.
 * See {@link pvc.visual.Scene} for additional keyword arguments.
 * @param {pv.visual.legend.renderer} [keyArgs.renderer] Keyword arguments.
 */
def
.type('pvc.visual.legend.WaterfallBulletGroupScene', pvc.visual.Scene)
.init(function(rootScene, keyArgs){
    
    this.base(rootScene, keyArgs);
    
    this.extensionPrefix =  def.get(keyArgs, 'extensionPrefix') || '';
    
    var item = this.createItem({
        value:    null,
        rawValue: null,
        label:    def.get(keyArgs, 'label')
    });
    
    item.color = def.get(keyArgs, 'color');
})
.add(/** @lends pvc.visual.legend.WaterfallBulletGroupScene# */{
    hasRenderer: function(){
        return this._renderer;
    },
    
    renderer: function(renderer){
        if(renderer != null){
            this._renderer = renderer;
        }
        
        return this._renderer;
    },
    
    itemSceneType: function(){
        var ItemType = this._itemSceneType;
        if(!ItemType){
            ItemType = def.type(pvc.visual.legend.BulletItemScene);
            
            // Apply legend item scene extensions
            this.panel()._extendSceneType('item', ItemType, ['isOn', 'isClickable', 'click']);
            
            this._itemSceneType = ItemType;
        }
        
        return ItemType;
    },
    
    createItem: function(keyArgs){
        var ItemType = this.itemSceneType();
        return new ItemType(this, keyArgs);
    }
});