pvc.BaseChart
.add({
    /**
     * An array of colors, represented as names, codes or {@link pv.Color} objects
     * that is associated to each distinct value of the "color" visual role.
     * 
     * <p>
     * The legend panel associates each distinct dimension value to a color of {@link #colors},
     * following the dimension's natural order.
     * </p>
     * <p>
     * The default dimension is the 'series' dimension.
     * </p>
     * 
     * @type (string|pv.Color)[]
     */
    colors: null,

    /**
     * A map of {@link pvc.visual.Axis} by axis id.
     */
    axes: null,
    axesList: null,
    axesByType: null,

    _axisClassByType: {
        'color': pvc.visual.ColorAxis,
        'size':  pvc.visual.SizeAxis,
        'base':  pvc.visual.CartesianAxis,
        'ortho': pvc.visual.CartesianAxis
    },
    
    // 1 = root, 2 = leaf, 1|2=3 = everywhere
    _axisCreateWhere: {
        'color': 1,
        'size':  2,
        'base':  3,
        'ortho': 3
    },
    
    _axisCreationOrder: ['color', 'size', 'base', 'ortho'],
    
    _initAxes: function(hasMultiRole){
        this.axes = {};
        this.axesList = [];
        this.axesByType = {};
        
        // Clear any previous global color scales
        delete this._rolesColorScale;
        
        // type -> index -> [datacell array]
        // Used by sub classes.
        var dataCellsByAxisTypeThenIndex;
        if(!this.parent){
            dataCellsByAxisTypeThenIndex = {};
            
            this.plotList.forEach(function(plot){
                this._collectPlotAxesDataCells(plot, dataCellsByAxisTypeThenIndex);
            }, this);
            
            this._fixTrendsLabel(dataCellsByAxisTypeThenIndex);
        } else {
            dataCellsByAxisTypeThenIndex = this.root._dataCellsByAxisTypeThenIndex;
        }
        
        // Used later in _bindAxes as well.
        this._dataCellsByAxisTypeThenIndex = dataCellsByAxisTypeThenIndex;
        
        /* NOTE: Cartesian axes are created even when hasMultiRole && !parent
         * because it is needed to read axis options in the root chart.
         * Also binding occurs to be able to know its scale type. 
         * Yet, their scales are not setup at the root level.
         */
        
        // 1 = root, 2 = leaf, 1 | 2 = 3 = everywhere
        var here = 0;
        // Root?
        if(!this.parent){
            here |= 1;
        }
        // Leaf?
        if(this.parent || !hasMultiRole){
            here |= 2;
        }
        
        // Used later in _bindAxes as well.
        this._axisCreateHere = here;
        
        this._axisCreationOrder.forEach(function(type){
            // Create **here** ?
            if((this._axisCreateWhere[type] & here) !== 0){
                
                var dataCellsByAxisIndex = dataCellsByAxisTypeThenIndex[type];
                if(dataCellsByAxisIndex){
                    
                    var AxisClass = this._axisClassByType[type];
                    if(AxisClass){
                        dataCellsByAxisIndex.forEach(function(dataCells, axisIndex){
                            
                            new AxisClass(this, type, axisIndex);
                            
                        }, this);
                    }
                }
            }
        }, this);
        
        if(this.parent){
            // Copy axes that exist in root and not here
            this.root.axesList.forEach(function(axis){
                if(!def.hasOwn(this.axes, axis.id)){
                    this._addAxis(axis);
                }
            }, this);
        }
    },
    
    _fixTrendsLabel: function(dataCellsByAxisTypeThenIndex){
        // Pre-register the label of the first trend type 
        // in the "trend" data part atom, cause in multi-charts
        // an empty label would be registered first...
        // We end up using this to 
        // allow to specify an alternate label for the trend.
        var dataPartDimName = this._getDataPartDimName();
        if(dataPartDimName){
            // Find the first data cell with a trend type
            var firstDataCell = def
                .query(def.ownKeys(dataCellsByAxisTypeThenIndex))
                .selectMany(function(axisType){
                    return dataCellsByAxisTypeThenIndex[axisType];
                })
                .selectMany()
                .first (function(dataCell){ return !!dataCell.trend; })
                ;
            
            if(firstDataCell){
                var trendInfo = pvc.trends.get(firstDataCell.trend.type);
                var dataPartAtom = trendInfo.dataPartAtom;
                var trendLabel = firstDataCell.trend.label;
                if(trendLabel === undefined){
                    trendLabel = dataPartAtom.f;
                }
                
                this._firstTrendAtomProto = {
                    v: dataPartAtom.v,
                    f: trendLabel
                };
            } else {
                delete this._firstTrendAtomProto;
            }
        }
    },
    
    /**
     * Adds an axis to the chart.
     * 
     * @param {pvc.visual.Axis} axis The axis.
     *
     * @type pvc.visual.Axis
     */
    _addAxis: function(axis){
        
        this.axes[axis.id] = axis;
        if(axis.chart === this){
            axis.axisIndex = this.axesList.length;
        }
        
        this.axesList.push(axis);
        
        var typeAxes  = def.array.lazy(this.axesByType, axis.type);
        var typeIndex = typeAxes.count || 0;
        axis.typeIndex = typeIndex;
        typeAxes[axis.index] = axis;
        if(!typeIndex){
            typeAxes.first = axis;
        }
        typeAxes.count = typeIndex + 1;
        
        // For child charts, that simply copy color axes
        if(axis.type === 'color' && axis.isBound()){
            this._onColorAxisScaleSet(axis);
        }
        
        return this;
    },
    
    getAxis: function(type, index){
        var typeAxes = this.axesByType[type];
        if(typeAxes){
            return typeAxes[index];
        }
    },
    
    _bindAxes: function(hasMultiRole){
        // Bind all axes with dataCells registered in #_dataCellsByAxisTypeThenIndex
        // and which were created **here**
        
        var here = this._axisCreateHere;
        
        def
        .eachOwn(
            this._dataCellsByAxisTypeThenIndex, 
            function(dataCellsByAxisIndex, type){
                // Created **here** ?
                if((this._axisCreateWhere[type] & here) !== 0){
                    
                    dataCellsByAxisIndex.forEach(function(dataCells, index){
                        
                        var axisId = pvc.buildIndexedId(type, index);
                        var axis = this.axes[axisId];
                        if(!axis.isBound()){
                            axis.bind(dataCells);
                        }
                        
                    }, this);
                }
            }, 
            this);
    },
    
    _setAxesScales: function(isMulti){
        if(!this.parent){
            var colorAxes = this.axesByType.color;
            if(colorAxes){
                colorAxes.forEach(function(axis){
                    if(axis.isBound()){
                        axis.calculateScale();
                        this._onColorAxisScaleSet(axis);
                    }
                }, this);
            }
        }
    },
    
    _onColorAxisScaleSet: function(axis){
        switch(axis.index){
            case 0:
                this.colors = axis.scheme();
                break;
            
            case 1:
                if(this._allowV1SecondAxis){
                    this.secondAxisColor = axis.scheme();
                }
                break;
        }
    },
    
    /**
     * Obtains an unified color scale, 
     * of all the color axes with specified colors.
     * 
     * This color scale is used to satisfy axes
     * with non-specified colors.
     * 
     * Each color-role has a different unified color-scale,
     * in order that the color keys are of the same types.
     */
    _getRoleColorScale: function(roleName){
        return def.lazy(
            def.lazy(this, '_rolesColorScale'),
            roleName,
            this._createRoleColorScale, this);
    },
    
    _createRoleColorScale: function(roleName){
        var firstScale, scale;
        var valueToColorMap = {};
        
        this.axesByType.color.forEach(function(axis){
            // Only use color axes with specified Colors
            var axisRole = axis.role;
            var isRoleCompatible = 
                (axisRole.name === roleName) ||
                (axisRole.sourceRole && axisRole.sourceRole.name === roleName);
            
            if(isRoleCompatible &&
               axis.scale &&
               (axis.index === 0 || 
               axis.option.isSpecified('Colors') || 
               axis.option.isSpecified('Map'))){
                
                scale = axis.scale;
                if(!firstScale){ firstScale = scale; }
                
                axis.domainValues.forEach(addDomainValue);
            }
        }, this);
        
        function addDomainValue(value){
            // First color wins
            var key = '' + value;
            if(!def.hasOwnProp.call(valueToColorMap, key)){
                valueToColorMap[key] = scale(value);
            }
        }
        
        if(!firstScale){
            return pvc.createColorScheme()();
        }
        
        scale = function(value){
            var key = '' + value;
            if(def.hasOwnProp.call(valueToColorMap, key)){
                return valueToColorMap[key];
            }
            
            // creates a new entry...
            var color = firstScale(value);
            valueToColorMap[key] = color;
            return color;
        };
        
        def.copy(scale, firstScale); // TODO: domain() and range() should be overriden...
        
        return scale;
    },
    
    _onLaidOut: function(){
        // NOOP
    }
});

