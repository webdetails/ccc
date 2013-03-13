
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
    _configureTypeCore: function() {
        var autoDimNames = [];
        
        // VItem Indexes of continuous columns not yet being read
        var freeMeaIndexes = [];
        
        // Idem, but for discrete columns
        var freeDisIndexes = [];
        
        this.collectFreeDiscreteAndConstinuousIndexes(freeDisIndexes, freeMeaIndexes);
        
        var D = freeDisIndexes.length;
        var M = freeMeaIndexes.length;
        
        if(D) { this._getUnboundRoleDefaultDimNames('category', D, autoDimNames); }
        if(M) {
            def.query(['size', 'color']).take(M).each(function(roleName) {
                this._getUnboundRoleDefaultDimNames(roleName, 1, autoDimNames);
            }, this);
        }
        
        if(autoDimNames.length) { this.defReader({names: autoDimNames}); }
    }
});