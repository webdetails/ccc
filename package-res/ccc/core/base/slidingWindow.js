/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global axis_optionsDef:true*/
  

//CDF603

def('pvc.visual.SlidingWindow', pvc.visual.OptionsBase.extend({

    init: function(chart) {
        this.base( chart, 'slidingWindow', 0, {byNaked: false} );
    },

    type: {
        methods: {
            props: ['interval','dimName','score', 'select']
        }
    },

    methods: /** @lends pvc.visual.slidingWindow# */{
        _initFromOptions: function() {
            var o = this.option;
            this.set({
                interval :  o('Interval'),
                dimName  :  o('DimName'),
                score    :  o('Score'),
                select   :  o('Select')
            });
        },

        set: function(keyArgs) {

            keyArgs = this._readArgs(keyArgs);

            if(!keyArgs) {
                if(this.interval != null && this.dimName != null && this.score != null  && this.select != null) return;
            } else {
                this.interval = pv.parseDatePrecision(keyArgs.interval, Number.MAX_VALUE);
                this.dimName = keyArgs.dimName;
                this.score = keyArgs.score ;
                this.select = keyArgs.select ;
            }

        },

        _readArgs: function(keyArgs) {
            if(keyArgs) {
                var out = {},
                    any = 0,
                    read = function(p) {
                        var v = keyArgs[p];
                        if(v != null)
                            any = true;
                        else
                            v = this[p];

                        out[p] = v;
                    };

                pvc.visual.SlidingWindow.props.forEach(read, this);

                if(any) return out;
            }
        },

        _defaultSlidingWindowScore: function(datum) { 
            return datum.atoms[this.dimName].value; 
        },

        
        _defaultSlidingWindowSelect: function(allData, remove) {
                       
            var data  = this.chart.data,
                dName = this.dimName,
                dim   = data.dimensions(dName),
                mostRecent   = dim.max().value;

            allData.forEach(function(datum) {
                var datumScore = this.score(datum),
                    result;

                if(datumScore !== undefined && datumScore != null){
                    if(!(typeof(datumScore) == 'number' || datumScore instanceof Date /*|| typeof(datumScore) == 'string'*/)){
                        if(def.debug >= 2) def.log("[Warning] The default sliding window functions are only applicable to timeseries or numeric scales. Removing nothing");
                        return;
                    }
                    datumScore=dim.read(datumScore);
                    if(datumScore!=null) datumScore=datumScore.value;
                    result = mostRecent - datumScore; 
                    if(result && result > this.interval) 
                        remove.push(datum);

                } else remove.push(datum);
                
            },this);

        },

        setAxisDefaults: function() {

            this.chart.axesByType.color.forEach(function(axis) {
                this._preserveAxisColorMap( axis );
            }, this);

            this.chart.axesList.forEach(function(axis) {
                var dims = axis.role.grouping._dimNames;
                var dimOptions = this.chart.options.dimensions;

                dims.forEach(function(dimName) {
                    var dim = this.chart.data._dimensions[dimName];
                    if (dimOptions) var dimComp = dimOptions[dimName];
                    if(!dimComp || !dimComp.comparer){
                        dim.type.setComparer(def.ascending); //???
                    }
                }, this);
                
            }, this);

            this._preserveLayout();
            this._setFixedRatio();

        },

        _preserveAxisColorMap: function(axis) { axis.setPreserveColorMap(); },

        _preserveLayout: function() { this.chart.options.preserveLayout = true; },

        _setFixedRatio: function(){

            // get axes with sliding window dimensions
            var axes = this.chart.axesList.filter(function(axis) {
                var dim = axis.role.grouping.firstDimension;
                return dim.name == this.dimName;
            },this);

            axes.forEach(function(axis) {
                if(axis.option.isDefined('FixedLength')){
                    if(this.option.isSpecified('Interval')) axis.setInitialLength(this.interval);    //review
                } 
                if((axis.option.isDefined('FixedLength')       && 
                    axis.option.isDefined('PreserveRatio'))    &&
                    this.option.isSpecified('Interval')        &&  //review
                            !(axis.option.isSpecified('Ratio')        || 
                              axis.option.isSpecified('PreserveRatio'))) {
                    axis.option.specify({ PreserveRatio : true });
                }

            },this);

        }

    },


  options: {

        Interval: {
            resolve: '_resolveFull',
            cast: slidingWindow_castInterval,
            value: Number.MAX_VALUE
        },

        DimName:   {
            resolve: '_resolveFull',
            data: {
                resolveDefault: function(optionInfo) {
                    var dv = _defaultDimensionName(this.chart);
                    optionInfo.defaultValue(dv);
                    return true;
                }
            },
            cast: slidingWindow_castDimName
        },

        Score: {
            resolve: '_resolveFull',
            data: {
                resolveDefault: function(optionInfo) {
                    optionInfo.defaultValue(this._defaultSlidingWindowScore);
                    return true;
                }
            },
        },

        Select: {
            resolve: '_resolveFull',
            data: {
                resolveDefault: function(optionInfo) {
                    optionInfo.defaultValue(this._defaultSlidingWindowSelect);
                    return true;
                }
            },
        }

    }


}));


function _defaultDimensionName(chart) {

    var dims, dimName;
    if(!! chart.axes.base) dimName = chart.axes.base.role.grouping.lastDimensionName(); //cart charts always have a base and ortho axis
    else{
        dims = _getDimensionNames(chart); 
        dimName = !!dims ? dims[0] : undefined;
    } 
    return dimName;

}

function slidingWindow_castDimName(name) {
    var chart = this.chart;
    return pvc.parseDimensionName(name, _defaultDimensionName(chart), _getDimensionNames(chart));
}


function slidingWindow_castInterval(interval) {
    return pv.parseDatePrecision(interval, Number.MAX_VALUE);
}

function _getDimensionNames(chart) {
    var dims = chart.data._dimensionsList;

    if(!dims) throw def.error("No dimensions found");

    var dimNames = dims.map(function(dim) { return dim.name; });

    return !!dimNames ? dimNames : [];
}