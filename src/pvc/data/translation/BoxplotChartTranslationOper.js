
/**
 * @name pvc.data.BoxplotChartTranslationOper
 * 
 * @class The translation operation of the box plot chart.
 * 
 * <p>
 * The default box plot format is:
 * </p>
 * <pre>
 * +----------+----------+-------------+-------------+------------+-------------+
 * | 0        | 1        | 2           | 3           | 4          | 5           |
 * +----------+----------+-------------+-------------+------------+-------------+
 * | category | median   | percentil25 | percentil75 | percentil5 | percentil95 |
 * +----------+----------+-------------+-------------+------------+-------------+
 * | any      | number   | number      | number      | number     | number      |
 * +----------+----------+-------------+-------------+------------+-------------+
 * </pre>
 * 
 * @extends pvc.data.MatrixTranslationOper
 *  
 * @constructor
 * @param {pvc.BoxplotChart} chart The associated box plot chart.
 * @param {pvc.data.ComplexType} complexType The complex type that will represent the translated data.
 * @param {object} source The matrix-format array to be translated.
 * The source is not modified.
 * @param {object} [metadata] A metadata object describing the source.
 * 
 * @param {object} [options] An object with translation options.
 * See additional available options in {@link pvc.data.MatrixTranslationOper}.
 */
def.type('pvc.data.BoxplotChartTranslationOper', pvc.data.MatrixTranslationOper)
.init(function(chart, complexType, source, metadata, options){
    this._chart = chart;

    this.base(complexType, source, metadata, options);
})
.add(/** @lends pvc.data.BoxplotChartTranslationOper# */{
    
    /**
     * @override
     */
    configureType: function(){
        var autoDimsReaders = [];

        function addRole(name, count){
            var visualRole = this._chart.visualRoles(name);
            if(!visualRole.isPreBound()){
                if(count == null) {
                    count = 1;
                }

                var dimGroupName = visualRole.defaultDimensionName.match(/^(.*?)(\*)?$/)[1],
                    level = 0;

                while(level < count){
                    var dimName = pvc.data.DimensionType.dimensionGroupLevelName(dimGroupName, level++);
                    if(!this.complexType.dimensions(dimName, {assertExists: false})){
                        autoDimsReaders.push(dimName);
                    }
                }
            }
        }
        
        var catCount = def.get(this.options, 'categoriesCount', 1);
        if(!(catCount >= 1)){
            catCount = 1;
        }

        addRole.call(this, 'category', catCount);
        pvc.BoxplotChart.measureRolesNames.forEach(function(dimName){
            addRole.call(this, dimName);
        }, this);

        autoDimsReaders.slice(0, this.freeVirtualItemSize());
        if(autoDimsReaders.length){
            this.defReader({names: autoDimsReaders});
        }
    },

    defDimensionType: function(dimName, dimSpec){
        var dimGroup = pvc.data.DimensionType.dimensionGroupName(dimName);
        switch(dimGroup){
            case 'median':
                dimSpec = def.setUDefaults(dimSpec, 'valueType', Number);
                break;
                
            case 'percentil':
                dimSpec = def.setUDefaults(dimSpec, 
                                'valueType', Number,
                                'label',    "{0}% Percentil"); // replaced by dim group level + 1);
                break;
        }
        
        return this.base(dimName, dimSpec);
    }
});