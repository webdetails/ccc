
/**
 * @name pvc.data.BoxplotChartTranslationOper
 * 
 * @class The translation mixin operation of the box plot chart.
 * 
 * <p>
 * The default box plot format is:
 * </p>
 * <pre>
 * +----------+----------+--------------+--------------+------------+-------------+
 * | 0        | 1        | 2            | 3            | 4          | 5           |
 * +----------+----------+--------------+--------------+------------+-------------+
 * | category | median   | lowerQuartil | upperQuartil | minimum    | maximum     |
 * +----------+----------+--------------+--------------+------------+-------------+
 * | any      | number   | number       | number       | number     | number      |
 * +----------+----------+--------------+--------------+------------+-------------+
 * </pre>
 * 
 * @extends pvc.data.MatrixTranslationOper
 */
def.type('pvc.data.BoxplotChartTranslationOper')
.add(/** @lends pvc.data.BoxplotChartTranslationOper# */{
    /**
     * @override
     */
    _configureTypeCore: function(){
        var autoDimNames = [];
        
        var V = this.virtualItemSize();
        var C = V - this.M;
        
        this._getUnboundRoleDefaultDimNames('category', C, autoDimNames);
        
        pvc.BoxplotChart.measureRolesNames.forEach(function(roleName){
            this._getUnboundRoleDefaultDimNames(roleName, 1, autoDimNames);
        }, this);

        autoDimNames.slice(0, this.freeVirtualItemSize());
        if(autoDimNames.length){
            this.defReader({names: autoDimNames});
        }
    }
});