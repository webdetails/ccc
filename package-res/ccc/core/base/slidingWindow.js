/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global axis_optionsDef:true*/
  
def('pvc.visual.SlidingWindow', pvc.visual.OptionsBase.extend({

    init: function(chart) {
        this.base(chart, 'slidingWindow', 0, {byNaked: false});
        this.length = this.option('Length');
    },

    methods: /** @lends pvc.visual.slidingWindow# */{
            
        length: null,
        dimension: null,
        select: slidingWindow_defaultSelect,

        initFromOptions: function() {
            var o = this.option;
            if(this.length){
                this.dimension =  o('Dimension');
                this.override('select', o('Select'))
            }
        },

        setDataFilter: function(data) {
            var sw = this;
            data.select = sw.select.bind(sw);
        },

        setDimensionGroupOptions: function(complexType) {

        /* complexType._dims maps names to dimensionType (cdo.dimensionType) and not dimension (cdo.dimension)
           * dimensions : map of dimensionType by name
           * dimNames : list of dimensionType's names
        */
            var me         = this,
                chart      = me.chart,
                dimNames   = complexType._dimsNames;
                dimensions = complexType._dims;

                setComparerIfBound = function(dimension) { 
                    /* dimension is the name of the dimensionType to evaluate*/
                    var dimOpts       = chart.options.dimensions,
                        dimGroupOpts  = chart.options.dimensionGroups,
                        dimGroup      = cdo.DimensionType.dimensionGroupName(dimension),
                        dimSpecs      = dimOpts      ? dimOpts[dimension]     : undefined,
                        dimGroupSpecs = dimGroupOpts ? dimGroupOpts[dimGroup] : undefined;

                    // if a comparer is already specified don't override it
                    if((dimSpecs && dimSpecs.comparer) || (dimGroupSpecs && dimGroupSpecs.comparer)) return; 

                    // Get a list of all chart dimensions bound to (any) visual role
                    /*  Example:
                        visualRoleList:         [ { ..., 
                                                    grouping: { ..., 
                                                                _dimNames:['series','category'], 
                                                                ... },   
                                                    ... },  
                                                  { ..., 
                                                    grouping: null, 
                                                    ... },  
                                                  { ..., 
                                                    grouping: { ..., 
                                                                _dimNames:['series'], 
                                                                ... }, 
                                                    ... }  
                                                ]
                        -- get dimensions:      [ ['series','category' ] , [] , [ 'series'] ] 
                        -- concatenate inside:  [ 'series','category', series'] 
                        -- remove duplicates:   [ 'series','category' ]     

                        dimensionsBound:        [ 'series','category' ]

                    */
                    var dimensionsBound = chart.visualRoleList
                            .map(function(role) { return role.grouping ? role.grouping._dimNames : []; });  
                            dimensionsBound=dimensionsBound.reduce(function(a, b) { return a.concat(b); }, []);                      
                           // dimensionsBound=dimensionsBound.reduce(function(a, b) { if(a.indexOf(b)<0) return a.push(b); else return a; }, []);                 

                    var roleIndex = dimensionsBound.indexOf(dimension);

                    // dimension is unbound
                    if(!(roleIndex >= 0)) return;

                    // dimension is bound:
                    // apply comparer if dimension is bound to a visual role
                    // and re-bound the grouping so the new comparer is set in the grouping levels
                    var type = dimensions[dimension];
                    if(type.isDiscrete) type.setComparer(def.ascending); 

                    //def.eachOwn(chart.visualRoles, function(role){ if(role.grouping!=null && role.grouping._dimNames.indexOf(dimension)>=0) role.grouping.bind(complexType); });
            };

            
            dimNames.forEach(setComparerIfBound);

            // after setting new comparers, re-bind the roles' grouping to the changed complexType
            // only re-bind associated visualRoles ? 
            def.eachOwn(chart.visualRoles, function(role){ if(role.grouping!=null) role.grouping.bind(complexType); });

        },

        setLayoutPreservation: function(chart) {
            chart.options.preserveLayout = true; 
        },

        setAxisDefaults: function(chart) {

            var me = this,
                axesWindow,

                isSlidingWindowAxis  = function(axis) { return axis.role.grouping.firstDimension.name == me.dimension; },

                preserveAxisColorMap = function(axis) { axis.setPreserveColorMap(); },    

                setComparable = function(axis) {axis.role.grouping._dimNames.forEach(function(dim){chart.data._dimensions[dim].type.isComparable=true;})},

                setFixedRatio = function(axis) {
                    var optSpecified       = axis.option.isSpecified,
                        optDefined         = axis.option.isDefined,
                        optSpecify         = axis.option.specify,
                        windowOptSpecified = me.option.isSpecified;

                    //only axes that have a meaningfull length can have a ratio
                    if(optDefined('FixedLength') && optDefined('PreserveRatio')) { 

                        if(windowOptSpecified('Length')){
                            axis.setInitialLength(me.length);    //review
                        } 

                        if(!(optSpecified('Ratio') || optSpecified('PreserveRatio'))) {
                            optSpecify({'PreserveRatio': true});
                        }
                    }
                };


            axesWindow = chart.axesList.filter(isSlidingWindowAxis);

            axesWindow.forEach(setFixedRatio);

            chart.axesList.forEach(setComparable);

            if(chart.axesByType.color)
                chart.axesByType.color.forEach(preserveAxisColorMap);
      
        }

    },


  options: {

        Dimension:   {
            resolve: '_resolveFull',
            cast: function(name) {
                return pvc.parseDimensionName(name, this.chart);
            },
            getDefault: slidingWindow_defaultDimensionName
        },

        Length: {
            resolve: '_resolveFull',
            cast: function(interval) {
                return pv.parseDatePrecision(interval, null);
            },
        },

        Select: {
            resolve: '_resolveFull',
            cast: def.fun.as,
            getDefault: function() { return slidingWindow_defaultSelect.bind(this); }
        }

    }

}));


function slidingWindow_defaultDimensionName() {
    // Cartesian charts always have (at least) a base and ortho axis
    var baseAxes = this.chart.axes.base;
    return baseAxes
        ? baseAxes.role.grouping.lastDimensionName() 
        : this.chart.data.type.dimensionsNames()[0];
}

function slidingWindow_defaultSelect(allData) {
                       
    var i, dim  = this.chart.data.dimensions(this.dimension),
        maxAtom = dim.max(), 
        mostRecent = maxAtom.value;
        toRemove = [];

    for(i = 0; i < allData.length; i++) {
        var datum      = allData[i],
            datumScore = datum.atoms[this.dimension].value,
            scoreAtom  = dim.read(datumScore);

        if(datumScore == null) {
            toRemove.push(datum);
        } else if(scoreAtom == null || (typeof(datumScore) !== typeof(scoreAtom.value))){
            // the score has to be of the same type has the dimension valueType
            // the typeof comparison is needed when score is string and the valueType is Date
            if(def.debug >= 2) 
                def.log("[Warning] The specified scoring function has an invalid return value");
            toRemove = [];
            break;
        } else {
            // Using the scoring funtion on both atoms guarantees that even if 
            // the scoring function is overriden, result is still valid
            datumScore = scoreAtom.value;
            var result = (+mostRecent) - (+datumScore); 
            if(result && result > this.length) 
                toRemove.push(datum);
        }     
    }

    return toRemove;

}