
/**
 * @name pvc.visual.legend.BulletItemSceneVisibility
 * 
 * @class A visibility behavior mixin for a legend bullet item scene. 
 * Represents and controls the visible state of its datums.
 * 
 * @extends pvc.visual.legend.BulletItemScene
 */
def
.type('pvc.visual.legend.BulletItemSceneVisibility')
.add(/** @lends pvc.visual.legend.BulletItemSceneVisibility# */{
    /**
     * Returns <c>true</c> if at least one non-null datum of the scene's {@link #datums} is visible.
     * @type boolean
     */
    isOn: function(){
        return this.datums().any(function(datum){ 
                   return !datum.isNull && datum.isVisible; 
               });
    },
    
    /**
     * Returns <c>true</c>.
     * @type boolean
     */
    isClickable: function(){
        return true;
    },
    
    /**
     * Toggles the visible state of the datums present in this scene
     * and forces a re-render of the chart (without reloading data).
     */
    click: function(){
        if(pvc.data.Data.toggleVisible(this.datums())){
            // Re-render chart
            this.chart().render(true, true, false);
        }
    }
});
