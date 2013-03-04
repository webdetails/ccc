
/**
 * @name pvc.data.TreemapChartTranslationOper
 * 
 * @class The translation mixin operation of the treemap chart.
 * 
 * <p>
 * The default treemap format is:
 * </p>
 * <pre>
 * +----------+----------+--------------+
 * | 0        | 1        | 2            |
 * +----------+----------+--------------+
 * | category | size     | color        |
 * +----------+----------+--------------+
 * | any      | number   | number/disc  |
 * +----------+----------+--------------+
 * </pre>
 * 
 * @extends pvc.data.MatrixTranslationOper
 */
def.type('pvc.data.TreemapChartTranslationOper')
.add(/** @lends pvc.data.TreemapChartTranslationOper# */{
    /**
     * @override
     */
    _configureTypeCore: function(){
        var autoDimNames = [];
        
        var V = this.virtualItemSize();
        var C = V - this.M;
        
        this._getUnboundRoleDefaultDimNames('category', C, autoDimNames);
        
        ['size', 'color']
        .slice(0, this.M)
        .forEach(function(roleName){
            this._getUnboundRoleDefaultDimNames(roleName, 1, autoDimNames);
        }, this);

        autoDimNames.slice(0, this.freeVirtualItemSize());
        if(autoDimNames.length){
            this.defReader({names: autoDimNames});
        }
    }
});