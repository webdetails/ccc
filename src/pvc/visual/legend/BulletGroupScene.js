
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
    
    this.extensionPrefix =  def.get(keyArgs, 'extensionPrefix') || '';
    this._renderer = def.get(keyArgs, 'renderer');
    
    this.colorAxis = def.get(keyArgs, 'colorAxis');
    this.clickMode = def.get(keyArgs, 'clickMode');
    
    if(this.colorAxis && !this.clickMode){
        this.clickMode = this.colorAxis.option('LegendClickMode');
    }
})
.add(/** @lends pvc.visual.legend.BulletGroupScene# */{
    hasRenderer: function(){
        return this._renderer;
    },
    
    renderer: function(renderer){
        if(renderer != null){
            this._renderer = renderer;
        } else {
            renderer = this._renderer;
            if(!renderer){
                var keyArgs;
                var colorAxis = this.colorAxis;
                if(colorAxis){
                    keyArgs = {
                        drawRule:    colorAxis.option('LegendDrawLine'  ),
                        drawMarker:  colorAxis.option('LegendDrawMarker'),
                        markerShape: colorAxis.option('LegendShape')
                    };
                }
                
                renderer = new pvc.visual.legend.BulletItemDefaultRenderer(keyArgs);
                this._renderer = renderer;
            }
        }
        
        return renderer;
    },
    
    itemSceneType: function(){
        var ItemType = this._itemSceneType;
        if(!ItemType){
            ItemType = def.type(pvc.visual.legend.BulletItemScene);
            
            // Mixin behavior depending on click mode
            var clickMode = this.clickMode;
            switch(clickMode){
                case 'toggleSelected':
                    ItemType.add(pvc.visual.legend.BulletItemSceneSelection);
                    break;
                
                case 'toggleVisible':
                    ItemType.add(pvc.visual.legend.BulletItemSceneVisibility);
                    break;
            }
            
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