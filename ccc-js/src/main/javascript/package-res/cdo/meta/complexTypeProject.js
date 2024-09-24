/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a complex type project.
 * 
 * @name cdo.ComplexType
 * 
 * @class A complex type project is a work in progress set of dimension specifications.
 */
def
.type('cdo.ComplexTypeProject')
.init(function(dimGroupSpecs) {
    this._dims = {};
    this._dimList = [];
    this._dimGroupsDims = {};
    this._dimGroupSpecs = dimGroupSpecs || {};
    
    this._calcList = [];
})
.add(/** @lends cdo.ComplexTypeProject# */{
    _ensureDim: function(name, spec) {
        /*jshint expr:true*/
        name || def.fail.argumentInvalid('name', "Invalid dimension name '{0}'.", [name]);
        
        var info = def.getOwn(this._dims, name);
        if(!info) {
            info = this._dims[name] = this._createDim(name, spec);
            
            this._dimList.push(info);
            
            var groupDimsNames = def.array.lazy(this._dimGroupsDims, info.groupName);
            // TODO: this sorting is lexicographic but should be numeric
            def.array.insert(groupDimsNames, name, def.compare);
        } else if(spec) {
            def.setUDefaults(info.spec, spec);
        }
        
        return info;
    },
    
    hasDim: function(name) { return def.hasOwn(this._dims, name); },
    
    setDim: function(name, spec) {
        var _ = this._ensureDim(name).spec;
        if(spec) def.copy(_, spec);
        return this;
    },
    
    setDimDefaults: function(name, spec) {
        def.setUDefaults(this._ensureDim(name).spec, spec);
        return this;
    },
    
    _createDim: function(name, spec) {
        var dimGroupName = cdo.DimensionType.dimensionGroupName(name),
            dimGroupSpec = this._dimGroupSpecs[dimGroupName];
        if(dimGroupSpec) spec = def.create(dimGroupSpec, spec /* Can be null */);
        return {
            name: name,
            groupName: dimGroupName,
            spec: spec || {}
        };
    },
    
    readDim: function(name, spec) {
        var info = this._ensureDim(name, spec);
        if(info.isRead) throw def.error.operationInvalid("Dimension '{0}' already is the target of a reader.", [name]);
        if(info.isCalc) throw def.error.operationInvalid("Dimension '{0}' is being calculated, so it cannot be the target of a reader.", [name]);
        
        info.isRead = true;
    },
    
    calcDim: function(name, spec) {
        var info = this._ensureDim(name, spec);
        if(info.isCalc) throw def.error.operationInvalid("Dimension '{0}' already is being calculated.", [name]);
        if(info.isRead) throw def.error.operationInvalid("Dimension '{0}' is the target of a reader, so it cannot be calculated.", [name]);
        
        info.isCalc = true;
    },
    
    isReadOrCalc: function(name) {
        if(name) {
            var info = def.getOwn(this._dims, name);
            if(info) return info.isRead || info.isCalc;
        }
        return false;
    },
    
    groupDimensionsNames: function(groupDimName) { return this._dimGroupsDims[groupDimName]; },
    
    setCalc: function(calcSpec) {
        /*jshint expr:true */
        calcSpec || def.fail.argumentRequired('calculations[i]');
        calcSpec.calculation || def.fail.argumentRequired('calculations[i].calculation');
        
        var dimNames = calcSpec.names;
        dimNames = def.string.is(dimNames)
            ? dimNames.split(/\s*\,\s*/)
            : def.array.as(dimNames);
        
        if(dimNames && dimNames.length) dimNames.forEach(this.calcDim, this);
        
        this._calcList.push(calcSpec);
    },
    
    configureComplexType: function(complexType, dimsOptions) {
        //var keyArgs = {assertExists: false};
        
        this._dimList.forEach(function(dimInfo) {
            var dimName = dimInfo.name,
            //if(!complexType.dimensions(dimName, keyArgs)) {
                spec = dimInfo.spec;
            
            spec = this._extendSpec(dimName, spec, dimsOptions);
            
            complexType.addDimension(dimName, spec);
            //} // TODO: else assert has not changed?
        }, this);
        
        this._calcList.forEach(function(calcSpec) { complexType.addCalculation(calcSpec); });
    },



    /**
     * Extends a dimension type specification with defaults based on
     * specified options.
     *
     * @param {string} dimName The name of the dimension.
     * @param {object} dimSpec The dimension specification.
     * @param {object} [keyArgs] Keyword arguments.
     * @param {function} [keyArgs.isCategoryTimeSeries=false] Indicates if category dimensions are to be considered time series.
     * @param {string} [keyArgs.timeSeriesFormat] The parsing format to use to parse a Date dimension when the converter and rawFormat options are not specified.
     * @param {cdo.FormatProvider} [keyArgs.formatProto] The format provider to be the prototype of the dimension's own format provider.
     * 
     *
     *  @returns {object} The extended dimension type specification.
     */

    _extendSpec: function(dimName, dimSpec, keyArgs) {
    
        var dimGroup = cdo.DimensionType.dimensionGroupName(dimName);
        
        if(!dimSpec) dimSpec = {};
        
        switch(dimGroup) {
            case 'category':
                var isCategoryTimeSeries = def.get(keyArgs, 'isCategoryTimeSeries', false);
                if(isCategoryTimeSeries && dimSpec.valueType === undefined) dimSpec.valueType = Date;
                break;
            
            case 'value':
                if(dimSpec.valueType === undefined) dimSpec.valueType = Number;
                break;
        }

        if(dimSpec.converter === undefined &&
           dimSpec.valueType === Date &&
           !dimSpec.rawFormat) {
            dimSpec.rawFormat = def.get(keyArgs, 'timeSeriesFormat');
        }

        dimSpec.formatProto = def.get(keyArgs, 'formatProto');

        return dimSpec;
    }

});

