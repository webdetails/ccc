pvc.BaseChart
.add({
    /**
     * An array of colors, represented as names, codes or {@link pv.Color} objects
     * that is associated to each distinct value of the {@link #legendSource} dimension.
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
    secondAxisColor: null,
    
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
    
    // 1 = root, 2 = leaf, 1 | 2 = 3 = everywhere
    _axisCreateWhere: {
        'color': 1,
        'size':  2,
        'base':  3,
        'ortho': 3
    },
    
    _axisCreationOrder: ['color', 'size', 'base', 'ortho'],
    
    _initAxes: function(hasMultiRole){
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
        def.array.lazy(this.axesByType, axis.type)[axis.index] = axis;
        
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
                this.colors = axis.option('TransformedColors');
                break;
            
            case 1:
                this.secondAxisColor = axis.option('TransformedColors');
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
            if(axis.role.name === roleName &&
              (axis.index === 0 || axis.option.isSpecified('Colors'))){
                
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
    }
});

