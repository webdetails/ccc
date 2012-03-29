
/**
 * HeatGridChart is the main class for generating... heatGrid charts.
 *  A heatGrid visualizes a matrix of values by a grid (matrix) of *
 *  bars, where the color of the bar represents the actual value.
 *  By default the colors are a range of green values, where
 *  light green represents low values and dark green high values.
 *  A heatGrid contains:
 *     - two categorical axis (both on x and y-axis)
 *     - no legend as series become rows on the perpendicular axis 
 *  Please contact CvK if there are issues with HeatGrid at cde@vinzi.nl.
 */
pvc.HeatGridChart = pvc.CategoricalAbstract.extend({

    heatGridChartPanel : null,

    constructor: function(options){

        this.base(options);

        var defaultOptions = {
            colorValIdx: 0,
            sizeValIdx: 0,
            defaultValIdx: 0,
            measuresIndexes: [2],

            //multi-dimensional clickable label
            useCompositeAxis:false,
            showValues: true,
            axisOffset: 0,
            
            orientation: "vertical",
            // use a categorical here based on series labels
            scalingType: "linear",    // "normal" (distribution) or "linear"
            normPerBaseCategory: true,
            numSD: 2,                 // width (only for normal distribution)
            nullShape: undefined,
            shape: undefined,
            useShapes: false,
            colorRange: ['red', 'yellow','green'],
            colorRangeInterval:  undefined,
            minColor: undefined, //"white",
            maxColor: undefined, //"darkgreen",
            nullColor:  "#efc5ad"  // white with a shade of orange
        };

        // Apply options
        pvc.mergeDefaults(this.options, defaultOptions, options);

        // enforce some options  for the HeatGridChart
        this.options.orthoAxisOrdinal = true;
        this.options.legend = false;
        this.options.orginIsZero = true;
        if(this.options.useCompositeAxis){//force array support
            this.options.isMultiValued = true;
        }
    },

    /* @override */
    createCategoricalPanel: function(){
        pvc.log("Prerendering in heatGridChart");

        var options = this.options;
        this.heatGridChartPanel = new pvc.HeatGridChartPanel(this, {
            heatGridSizeRatio:  options.heatGridSizeRatio,
            maxHeatGridSize:    options.maxHeatGridSize,
            showValues:         options.showValues,
            orientation:        options.orientation
        });

        return this.heatGridChartPanel;
    }
});

/*
 * HeatGrid chart panel. Generates a heatGrid chart. Specific options are:
 * <i>orientation</i> - horizontal or vertical. Default: vertical
 * <i>showValues</i> - Show or hide heatGrid value. Default: false
 * <i>heatGridSizeRatio</i> - In multiple series, percentage of inner
 * band occupied by heatGrids. Default: 0.5 (50%)
 * <i>maxHeatGridSize</i> - Maximum size of a heatGrid in pixels. Default: 2000
 *
 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>heatGrid_</i> - for the actual heatGrid
 * <i>heatGridPanel_</i> - for the panel where the heatGrids sit
 * <i>heatGridLabel_</i> - for the main heatGrid label
 */
pvc.HeatGridChartPanel = pvc.CategoricalAbstractPanel.extend({

    pvHeatGrid: null,
    pvHeatGridLabel: null,
    data: null,

    heatGridSizeRatio: 0.5,
    maxHeatGridSize: 200,

    showValues: true,
    orientation: "vertical",

    colorValIdx:   0,
    sizeValIdx:    0,
    defaultValIdx: 0,
    shape: "square",
    nullShape: "cross",

    defaultBorder: 1,
    nullBorder: 2,
    selectedBorder: 2,
    
    selectNullValues: false,

    valuesToText: function(vals){
        if(vals != null && vals[0] !== undefined){
            return vals.join(', ');
        }
        else return vals;
    },

    /**
     * @override
     */
    createCore: function(){

        var myself = this,
            options = this.chart.options,
            dataEngine = this.chart.dataEngine;
        
        this.colorValIdx = options.colorValIdx;
        this.sizeValIdx  = options.sizeValIdx;
        
        switch(options.colorValIdx){
            case 0:
                this.colorDimName = 'value';
                break;
            case 1:
                this.colorDimName = 'value2';
                break;
            default:
                this.colorDimName = null;
        }
        
        switch(options.sizeValIdx){
            case 0:
                this.sizeDimName = 'value';
                break;
            case 1:
                this.sizeDimName = 'value2';
                break;
            default:
                this.sizeDimName = null;
        }
        
        var sizeDimName = this.sizeDimName;
        var colorDimName = this.colorDimName;
        
        this.selectNullValues = options.nullShape != null;
        
        // colors
        options.nullColor = pv.color(options.nullColor);
        
        if(options.minColor != null) options.minColor = pv.color(options.minColor);
        if(options.maxColor != null) options.maxColor = pv.color(options.maxColor);
        
        if(options.shape != null) {
            this.shape = options.shape;
        }
        
        var anchor = this.isOrientationVertical() ? "bottom" : "left";

        // reuse existings scales
        var xScale = this.chart.xAxisPanel.scale;
        var yScale = this.chart.yAxisPanel.scale;

        /* Determine cell dimensions. */
        var w = (xScale.max - xScale.min) / xScale.domain().length;
        var h = (yScale.max - yScale.min) / yScale.domain().length;

        if (anchor !== "bottom") {
            var tmp = w;
            w = h;
            h = tmp;
        }
        
        this._cellWidth  = w;
        this._cellHeight = h;
        
        /* Column and Row datas  */
        var colDimNames = dataEngine.type.groupDimensionsNames('category');
        var rowDimNames = dataEngine.type.groupDimensionsNames('series'  );
        
        var keyArgs = {visible: true};
        
        // One multi-dimensional, two-levels data grouping
        var data = this.chart.dataEngine.groupBy(
                        colDimNames.join('|') + ',' + 
                        rowDimNames.join('|'), 
                        keyArgs);
        
        // Two multi-dimension single-level data groupings
        var colRootData = dataEngine.groupBy(colDimNames.join('|'), keyArgs);
        var rowRootData = dataEngine.groupBy(rowDimNames.join('|'), keyArgs);
        
        /* Tooltip and Value Label*/
        function getLabel(){
            return this.datum().atoms.value.label;
        }
        
        /* Color scale */
        var fillColorScaleByColKey;
        if(colorDimName){
            fillColorScaleByColKey = this.getColorScale(colRootData);
        }
        
        function getFillColor(detectSelection){
            var color;
            
            var colorValue = this.colorValue();
            if(colorValue != null) {
                color = fillColorScaleByColKey[this.group().parent.absKey](colorValue);
            } else {
                color = options.nullColor;
            }
            
            if(detectSelection && 
               dataEngine.owner.selectedCount() > 0 && 
               !this.datum().isSelected){
                 color = pvc.toGrayScale(color);
            }
            
            return color;
        }
        
        /* DATUM */
        function getDatum(rowData1, colData1){
            var colData = this.parent.group();
            if(colData) {
                var rowData = colData._childrenByKey[rowData1.absKey];
                if(rowData) {
                    var datum = rowData._datums[0];
                    if(datum) {
                        return datum;
                    }
                }
            }
            
            // Create a null datum with col and row coordinate atoms
            var atoms = def.array.append(
                            def.own(rowData1.atoms),
                            def.own(colData1.atoms));
            
            return new pvc.data.Datum(data.owner, atoms);
        }
        
        /* PV Panels */
        var pvColPanel = this.pvPanel.add(pv.Panel)
            .data(colRootData._children)
            .localProperty('group', Object)
            .group(function(colData1){
                return data._childrenByKey[colData1.absKey]; // must exist
            })
            [pvc.BasePanel.relativeAnchor[anchor]](function(){ //ex: datum.left(i=1 * w=15)
                return this.index * w;
             })
            [pvc.BasePanel.parallelLength[anchor]](w)
            ;
        
        var pvHeatGrid = this.pvHeatGrid = pvColPanel.add(pv.Panel)
            .data(rowRootData._children)
            .localProperty('group', Object)
            .datum(getDatum)
            .group(function(rowData1){
                return this.parent.group()._childrenByKey[rowData1.absKey];
            })
            .localProperty('colorValue', Number)
            .colorValue(function(){
                return colorDimName && this.datum().atoms[colorDimName].value;
            })
            .localProperty('sizeValue',  Number)
            .sizeValue(function(){
                return sizeDimName && this.datum().atoms[sizeDimName].value;
            })
            ;
            
        pvHeatGrid
            [anchor](function(){ return this.index * h; })
            [pvc.BasePanel.orthogonalLength[anchor]](h)
            .antialias(false)
            .strokeStyle(null)
            .lineWidth(0)
            ;
            // THIS caused HUGE memory consumption and speed reduction (at least in use Shapes mode)
            //.overflow('hidden'); //overflow important if showValues=true
        
         
        if(options.useShapes){
            this.shapes = this.createHeatMap(w, h, getFillColor);
        } else {
            this.shapes = pvHeatGrid;
        }

        this.shapes
            .text(getLabel)
            .fillStyle(function(){
                return getFillColor.call(pvHeatGrid, true);
            })
            ;
        
        if(this.showValues){
            this.pvHeatGridLabel = pvHeatGrid.anchor("center").add(pv.Label)
                .bottom(0)
                .text(getLabel)
                ;
        }
        
        if(this._shouldHandleClick()){
            this._addPropClick(this.shapes);
        }

        if(options.doubleClickAction){
            this._addPropDoubleClick(this.shapes);
        }
        
        if(options.showTooltips){
            this.shapes
                .localProperty("tooltip", String) // localProperty: see pvc.js
                .tooltip(function(){
                    var tooltip = this.tooltip();
                    if(!tooltip){
                        var datum = this.datum(),
                            atoms = datum.atoms;

                        if(options.customTooltip){
                            var s = atoms.series.rawValue,
                                c = atoms.category.rawValue,
                                v = atoms.value.value;
                            
                            tooltip = options.customTooltip(s, c, v, datum);
                        } else {
                            var labels = [];
                            if(colorDimName) {
                                labels.push(atoms[colorDimName].label);
                            }
                            
                            if(sizeDimName && sizeDimName !== colorDimName) {
                                labels.push(atoms[sizeDimName].label);
                            }
                            
                            tooltip = labels.join(", ");
                        }
                    }
                    
                    return tooltip;
                })
                .title(function(){
                    return ''; //prevent browser tooltip
                })
                .event("mouseover", pv.Behavior.tipsy(options.tipsySettings))
                ;
        }
    },

    /**
     * @override
     */
    applyExtensions: function(){

        this.base();

        if(this.pvHeatGridLabel){
            this.extend(this.pvHeatGridLabel, "heatGridLabel_");
        }

        // Extend heatGrid and heatGridPanel
        this.extend(this.pvHeatGrid,"heatGridPanel_");
        this.extend(this.pvHeatGrid,"heatGrid_");
    },

    createHeatMap: function(w, h, getFillColor){
        var myself = this,
            options = this.chart.options,
            dataEngine = this.chart.dataEngine,
            sizeDimName  = this.sizeDimName,
            nullShapeType = options.nullShape,
            shapeType = this.shape;
        
        /* SIZE RANGE */
        var maxRadius = Math.min(w, h) / 2;
        if(this.shape === 'diamond'){
            // Protovis draws diamonds inscribed on
            // a square with half-side radius*Math.SQRT2
            // (so that diamonds just look like a rotated square)
            // For the height of the dimanod not to exceed the cell size
            // we compensate that factor here.
            maxRadius /= Math.SQRT2;
        }

        // Small margin
        maxRadius -= 2;
        
        var maxArea  = maxRadius * maxRadius, // apparently treats as square area even if circle, triangle is different
            minArea  = 4,
            areaSpan = maxArea - minArea;

        if(areaSpan <= 1){
            // Very little space
            // Rescue Mode - show *something*
            maxArea = Math.max(maxArea, 2);
            minArea = 1;
            areaSpan = maxArea - minArea;
            
            pvc.log("Using rescue mode dot area calculation due to insufficient space.");
        }
        
        var sizeValueToArea;
        if(sizeDimName){
            /* SIZE DOMAIN */
            def.scope(function(){
                var sizeValRange = dataEngine.dimensions(sizeDimName).range({visible: true}),
                    sizeValMin   = sizeValRange.min.value,
                    sizeValMax   = sizeValRange.max.value,
                    sizeValSpan  = Math.abs(sizeValMax - sizeValMin); // may be zero
                
                if(isFinite(sizeValSpan) && sizeValSpan > 0.001) {
                    // Linear mapping
                    // TODO: a linear scale object??
                    var sizeSlope = areaSpan / sizeValSpan;
                    
                    sizeValueToArea = function(sizeVal){
                        return minArea + sizeSlope * (sizeVal == null ? 0 : (sizeVal - sizeValMin));
                    };
                }
            });
        }
        
        if(!sizeValueToArea) {
            sizeValueToArea = pv.functor(maxArea);
        }
        
        /* BORDER WIDTH & COLOR */
        var notNullSelectedBorder = (this.selectedBorder == null || this.selectedBorder == 0) ? 
                                    this.defaultBorder : 
                                    this.selectedBorder;
        
        var nullSelectedBorder = (this.selectedBorder == null || this.selectedBorder == 0) ? 
                                  this.nullBorder : 
                                  this.selectedBorder;
        
        var nullDeselectedBorder = this.defaultBorder > 0 ? this.defaultBorder : this.nullBorder;
        
        function getBorderWidth(){
            if(sizeDimName == null || !myself._isNullShapeLineOnly() || this.parent.sizeValue() != null){
                return this.selected() ? notNullSelectedBorder : myself.defaultBorder;
            }

            // is null
            return this.selected() ? nullSelectedBorder : nullDeselectedBorder;
        }
        
        function getBorderColor(){
            var lineWidth = this.lineWidth();
            if(!(lineWidth > 0)){ //null|<0
                return null; // no style
            }
            
            // has width
            
            if(this.parent.sizeValue() == null) {
                return this.fillStyle();
            }
            
            var color = getFillColor.call(this.parent, false);
            return (dataEngine.owner.selectedCount() === 0 || this.selected()) ? 
                    color.darker() : 
                    color;
        }
        
        /* SHAPE TYPE & SIZE */
        var getShapeType;
        if(sizeDimName == null) {
            getShapeType = def.constant(shapeType);
        } else {
            getShapeType = function(){
                return this.parent.sizeValue() != null ? shapeType : nullShapeType;
            };
        }
        
        var getShapeSize;
        if(sizeDimName == null){
            getShapeSize = function(){
                return (nullShapeType == null && this.parent.colorValue() == null) ? 0 : maxArea;
            };
        } else {
            getShapeSize = function(){
                var sizeValue = this.parent.sizeValue();
                return (sizeValue == null && nullShapeType == null) ? 0 : sizeValueToArea(sizeValue);
            };
        }
        
        // Panel
        return this.pvHeatGrid.add(pv.Dot)
            .localProperty("selected", Boolean)
            .selected(function(){ return this.datum().isSelected; })
            .shape(getShapeType)
            .shapeSize(getShapeSize)
            .lock('shapeAngle') // rotation of shapes may cause them to not fit the calculated cell. Would have to improve the radius calculation code.
            .fillStyle(function(){ return getFillColor.call(this.parent); })
            .lineWidth(getBorderWidth)
            .strokeStyle(getBorderColor)
            ;
    },

    _isNullShapeLineOnly: function(){
        return this.nullShape == 'cross';  
    },

    /**
     * Returns an array of marks whose instances are associated to a datum, or null.
     * @override
     */
    _getSignums: function(){
        return [this.shapes];
    },
    
    /**
     * Renders the heat grid panel.
     * @override
     */
    _renderSignums: function(){
        this.pvPanel.render();
    },

    /***********
     * compute an array of fill-functions. Each column out of "colAbsValues" 
     * gets it's own scale function assigned to compute the color
     * for a value. Currently supported scales are:
     *    -  linear (from min to max
     *    -  normal distributed from   -numSD*sd to  numSD*sd 
     *         (where sd is the standard deviation)
     ********/
    getColorScale: function(colRootData) {
        switch (this.chart.options.scalingType) {
            case "normal": // TODO: implement other color scale modes
                throw def.error.notImplemented();
                return this.getNormalColorScale(data, colAbsValues, this.colorDimName, this.origData);//TODO:
          
            case "linear":
                return this.getLinearColorScale(colRootData);
        
            case "discrete":
                throw def.error.notImplemented();
                return this.getDiscreteColorScale(data, colAbsValues, this.colorDimName);
                
            default:
                throw "Invalid option " + this.scaleType + " in HeatGrid";
        }
    },
  
    getColorRangeArgs: function(){
        var options = this.chart.options;
        var rangeArgs = options.colorRange;
    
        if(options.minColor != null && options.maxColor != null){
            rangeArgs = [options.minColor,options.maxColor];
        } else if (options.minColor != null){
            rangeArgs.splice(0,1,options.minColor);
        } else if (options.maxColor != null){
            rangeArgs.splice(rangeArgs.length - 1, 1, options.maxColor);
        }
    
        return rangeArgs;
    },
  
  getColorDomainArgs: function(data, colAbsValues, options, rangeArgs, colorDimName){
    var domainArgs = options.colorRangeInterval;
    
    if(domainArgs != null && domainArgs.length > rangeArgs.length){
        domainArgs = domainArgs.slice(0, rangeArgs.length);
    }
    
    if(domainArgs == null){
        domainArgs = [];
    }
    
    if(domainArgs.length < rangeArgs.length){
        var myself = this;
        
        var min = pv.dict(colAbsValues, function(cat){
          return pv.min(data, function(d){
            var val = myself.getValue(d[cat], colorDimName);
            if(val!= null) return val;
            else return Number.POSITIVE_INFINITY;//ignore nulls
          });
        });
        
        var max = pv.dict(colAbsValues, function(cat){
          return pv.max(data, function(d){
            var val = myself.getValue(d[cat], colorDimName);
            if(val!= null) return val;
            else return Number.NEGATIVE_INFINITY;//ignore nulls
          });
        });
        
        if(options.normPerBaseCategory){
            return pv.dict(colAbsValues, function(category){
                return myself.padColorDomainArgs(rangeArgs, [], min[category], max[category]);  
            });
        }
            
        var theMin = min[colAbsValues[0]];
        for (var i=1; i<colAbsValues.length; i++) {
          if (min[colAbsValues[i]] < theMin) theMin = min[colAbsValues[i]];
        }
        
        var theMax = max[colAbsValues[0]];
        for (var i=1; i<colAbsValues.length; i++){
          if (max[colAbsValues[i]] > theMax) theMax = max[colAbsValues[i]];
        }
        
        if(theMax == theMin)
        {
            if(theMax >=1){
                theMin = theMax -1;
            } else {
                theMax = theMin +1;
            }
        }
        
        return this.padColorDomainArgs(rangeArgs, domainArgs, theMin, theMax);
    }
    
    return domainArgs;
  },
  
  padColorDomainArgs: function(rangeArgs, domainArgs, min, max){
    //use supplied numbers
    var toPad =
          domainArgs == null ?
          rangeArgs.length +1 :
          rangeArgs.length +1 - domainArgs.length;
    switch(toPad){
      case 1:
          //TODO: should adapt to represent middle?
          domainArgs.push(max);
          break;
      case 2:
          domainArgs = [min].concat(domainArgs).concat(max);
          break;
      default://build domain from range
          var step = (max - min)/(rangeArgs.length -1);
          domainArgs = pv.range(min, max +step , step);
    }
    return domainArgs;
  },
  
  getDiscreteColorScale: function(data, colAbsValues, colorDimName){
      var options = this.chart.options;
      var colorRange = this.getColorRangeArgs();
      var domain = this.getColorDomainArgs(data, colAbsValues, options, colorRange, colorDimName);

    //d0--cR0--d1--cR1--d2
    var getColorVal = function(val, domain, colorRange){
        if(val == null) return options.nullColor;
        if(val <= domain[0]) return pv.color(colorRange[0]);
        for(var i=0; i<domain.length-1;i++){
             if(val > domain[i] && val < domain[i+1]){
                return pv.color(colorRange[i]);
             }
        }
        return pv.color(colorRange[colorRange.length-1]);
    };
    
    if(options.normPerBaseCategory){
        return pv.dict(colAbsValues, function (category){
            var dom = domain[category];
            return function(val){
                return getColorVal(val, dom, colorRange);
            }
        });
    }
    
    return pv.dict(colAbsValues, function(col){
        return function(val){
            return getColorVal(val, domain, colorRange);
        };
    });
  },

    getLinearColorScale: function(colRootData){
        var scales = {};
        var options = this.chart.options;
        var rangeArgs = this.getColorRangeArgs();
        
        var domainArgs = options.colorRangeInterval;
        if(domainArgs != null && domainArgs.length > rangeArgs.length){
            domainArgs = domainArgs.slice(0, rangeArgs.length);
        }
        
        if(domainArgs == null){
            domainArgs = [];
        }
        
        // compute a scale-function for each column
        if(options.normPerBaseCategory){
            colRootData.children().each(function(colData){
                var range = colData.dimensions(this.colorDimName).range({visible: true});
                var min = range.min.value,
                    max = range.max.value;
                
                if(max == min){
                    if(max >=1){
                        min = max - 1;
                    } else {
                        max = min + 1;    
                    }
                }
                
                var step = (max - min) / (rangeArgs.length - 1),
                    scale = pv.Scale.linear();
                
                scale.domain.apply(scale, pv.range(min, max + step, step));
                scale.range.apply(scale,  rangeArgs);
                
                scales[colData.absKey] = scale;
            }, this);
            
            return scales;
        }
        
        if(domainArgs.length < rangeArgs.length){
            var range = colRootData.dimensions(this.colorDimName).range({visible: true}),
                min = range.min.value,
                max = range.max.value;
            
            if(max == min){
                if(max >= 1){
                    min = max - 1;
                } else {
                    max = min + 1;    
                }
            }
        
            //use supplied numbers
            var toPad = domainArgs == null ? rangeArgs.length : (rangeArgs.length - domainArgs.length);
            
            switch(toPad){
                case 1:
                    // TODO: should adapt to represent middle?
                    domainArgs.push(max);
                    break;
                    
                case 2:
                    domainArgs = [min].concat(domainArgs).concat(max);
                    break;
                    
                default:
                    var step = (max - min)/ (rangeArgs.length - 1);
                    domainArgs = pv.range(min, max + step, step);
          }
        }
    
        var scale = pv.Scale.linear();
        scale.domain.apply(scale, domainArgs);
        scale.range.apply(scale, rangeArgs);
        
        colRootData.children().each(function(colData){
            scales[colData.absKey] = scale;
        });
        
        return scales;
    },

  getNormalColorScale: function (data, colAbsValues, origData){
    var fillColorScaleByColKey;
    var options = this.chart.options;
    if (options.normPerBaseCategory) {
      // compute the mean and standard-deviation for each column
      var myself = this;
      
      var mean = pv.dict(colAbsValues, function(f){
        return pv.mean(data, function(d){
          return myself.getValue(d[f]);
        })
      });
      
      var sd = pv.dict(colAbsValues, function(f){
        return pv.deviation(data, function(d){
          myself.getValue(d[f]);
        })
      });
      
      //  compute a scale-function for each column (each key)
      fillColorScaleByColKey = pv.dict(colAbsValues, function(f){
        return pv.Scale.linear()
          .domain(-options.numSD * sd[f] + mean[f],
                  options.numSD * sd[f] + mean[f])
          .range(options.minColor, options.maxColor);
      });
      
    } else {   // normalize over the whole array
      
      var mean = 0.0, sd = 0.0, count = 0;
      for (var i=0; i<origData.length; i++)
        for(var j=0; j<origData[i].length; j++)
          if (origData[i][j] != null){
            mean += origData[i][j];
            count++;
          }
      mean /= count;
      for (var i=0; i<origData.length; i++){
        for(var j=0; j<origData[i].length; j++){
          if (origData[i][j] != null){
            var variance = origData[i][j] - mean;
            sd += variance*variance;
          }
        }
      }
      
      sd /= count;
      sd = Math.sqrt(sd);
      
      var scale = pv.Scale.linear()
        .domain(-options.numSD * sd + mean,
                options.numSD * sd + mean)
        .range(options.minColor, options.maxColor);
      
      fillColorScaleByColKey = pv.dict(colAbsValues, function(f){
        return scale;
      });
    }

    return fillColorScaleByColKey;  // run an array of values to compute the colors per column
}

});//end: HeatGridChartPanel
