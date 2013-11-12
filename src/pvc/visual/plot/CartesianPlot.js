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
.add({
    collectDataCells: function(dataCells) {
        
        this.base(dataCells);

        // Configure Base Axis Data Cell
        dataCells.push(new pvc.visual.DataCell(
            this,
            /*axisType*/'base',
            this.option('BaseAxis') - 1, 
            this.option('BaseRole'), // Single role
            this.option('DataPart')));
        
        // Configure Ortho Axis Data Cell
        var orthoRoleNames = def.array.to(this.option('OrthoRole'));
        var dataPartValue  = this.option('DataPart' );
        var orthoAxisIndex = this.option('OrthoAxis') - 1;
        
        var isStacked = this.option.isDefined('Stacked') ?
            this.option('Stacked') :
            undefined;
        var nullInterpolationMode = this.option('NullInterpolationMode');
        var trend = this.option('Trend');

        orthoRoleNames.forEach(function(orthoRoleName) {
             dataCells.push(new pvc.visual.CartesianOrthoDataCell(
                this,
                /*axisType*/'ortho',
                orthoAxisIndex, 
                orthoRoleName,
                dataPartValue,
                isStacked,
                nullInterpolationMode,
                trend));
        }, this);
    },

    _getOptionsDefinition: function() {
        return pvc.visual.CartesianPlot.optionsDef;
    }
});

function pvc_castTrend(trend) {
    // The trend plot itself does not have trends...
    if(this.name === 'trend') { return null; }
    
    var type = this.option('TrendType');
    if(!type && trend) { type = trend.type; }
    
    if(!type || type === 'none') { return null; }
    
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
        
        BaseRole: {
            resolve: '_resolveFixed',
            cast:    String
        },
        
        OrthoAxis: {
            resolve: function(optionInfo) {
                if(this.globalIndex === 0) {
                    // plot0 must use ortho axis 0!
                    // This also ensures that the ortho axis 0 is created...
                    optionInfo.specify(1);
                    return true;
                }
                
                return this._resolveFull(optionInfo);
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
        
        OrthoRole: {
            resolve: pvc.options.resolvers([
                  '_resolveFixed',
                  '_resolveDefault'
                ])
            // String or string array
        },
        
        Trend: {
            resolve: '_resolveFull',
            data: {
                resolveDefault: function(optionInfo) {
                    var type = this.option('TrendType');
                    if(type) {
                        // Cast handles the rest
                        optionInfo.defaultValue({
                            type: type
                        });
                        return true;
                    }
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