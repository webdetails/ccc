/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes an abstract cartesian plot.
 * 
 * @name pvc.visual.CartesianPlot
 * @class Represents an abstract cartesian plot.
 * @extends pvc.visual.Plot
 */
def
.type('pvc.visual.CartesianPlot', pvc.visual.Plot)
.init(function(chart, keyArgs) {

    this.base(chart, keyArgs);

    if(!(chart instanceof pvc.CartesianAbstract))
        throw def.error(def.format("Plot type '{0}' can only be used from within a cartesian chart.", [this.type]));
})
.add({
    /** @override */
    _initVisualRoles: function() {

        this.base();

        var roleSpec = this._getSeriesRoleSpec();
        if(roleSpec) this._addVisualRole('series', roleSpec);
    },

    /** @override */
    _getColorRoleSpec: function() {
        return {isRequired: true, defaultDimension: 'color*', defaultSourceRole: 'series', requireIsDiscrete: true};
    },

    _getSeriesRoleSpec: function() {
        return {isRequired: true, defaultDimension: 'series*', autoCreateDimension: true, requireIsDiscrete: true};
    },

    /** @override */
    _initDataCells: function() {

        this.base();

        var dataPartValue = this.option('DataPart'),
            baseRole   = this._getBaseRole(),
            orthoRoles = this._getOrthoRoles();

        if(baseRole)
            this._addDataCell(new pvc.visual.DataCell(
                this,
                /*axisType*/'base',
                this.option('BaseAxis') - 1,
                baseRole, // Single role
                dataPartValue));

        // Configure Ortho Axis Data Cell
        if(orthoRoles) {
            var orthoAxisIndex = this.option('OrthoAxis') - 1,
                isStacked = this.option.isDefined('Stacked') ? this.option('Stacked') : undefined,
                nullInterpolationMode = this.option('NullInterpolationMode'),
                trend = this.option('Trend');

            orthoRoles.forEach(function (orthoRole) {
                this._addDataCell(new pvc.visual.CartesianOrthoDataCell(
                    this,
                    /*axisType*/'ortho',
                    orthoAxisIndex,
                    orthoRole,
                    dataPartValue,
                    isStacked,
                    nullInterpolationMode,
                    trend));
            }, this);
        }
    },

    _getOptionsDefinition: function() {
        return pvc.visual.CartesianPlot.optionsDef;
    },

    _getOrthoRoles: function() {},

    _getBaseRole: function() {}
});

function pvc_castTrend(trend) {
    // The trend plot itself cannot have trends...
    if(this.name === 'trend') return null;
    
    var type = this.option('TrendType');
    if(!type && trend) type = trend.type;
    
    if(!type || type === 'none') return null;
    
    trend = trend ? Object.create(trend) : {};
    
    var trendInfo = pvc.trends.get(type);
    trend.info = trendInfo;
    trend.type = type;
   
    var label = this.option('TrendLabel');
    
    trend.label = label != null ? String(label) : trendInfo.dataPartAtom.f;
    
    return trend;
}

pvc.visual.CartesianPlot.optionsDef = def.create(
    pvc.visual.Plot.optionsDef, {
        BaseAxis: {
            value: 1
        },

        OrthoAxis: {
            resolve: function(optionInfo) {
                return this.globalIndex === 0
                    // plot0 must use ortho axis 0!
                    // This also ensures that the ortho axis 0 is created...
                    ? (optionInfo.specify(1), true)
                    : this._resolveFull(optionInfo);
            },
            data: {
                resolveV1: function(optionInfo) {
                    if(this.name === 'plot2' &&
                        this.chart._allowV1SecondAxis &&
                        this._chartOption('secondAxisIndependentScale')) {
                         optionInfo.specify(2);
                    }
                    return true;
                }
            },
            cast: function(value) {
                value = pvc.castNumber(value);
                return value != null ? def.between(value, 1, 10) : 1;
            },
            value: 1
        },
        
        Trend: {
            resolve: '_resolveFull',
            data: {
                resolveDefault: function(optionInfo) {
                    var type = this.option('TrendType');
                    // Cast handles the rest
                    if(type) return optionInfo.defaultValue({type: type}), true;
                }
            },
            cast: pvc_castTrend
        },
        
        TrendType: {
            resolve: '_resolveFull',
            cast:    pvc.parseTrendType
            //value:   'none'
        },
        
        TrendLabel: {
            resolve: '_resolveFull',
            cast:    String
        },
        
        NullInterpolationMode: {
            resolve: '_resolveFull',
            cast:    pvc.parseNullInterpolationMode,
            value:   'none' 
        }
    });