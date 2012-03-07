
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
    
//    constructor: function(chart, options){
//        this.base(chart,options);
//    },

    getValue: function(d, i){
        if(d != null && d[0] !== undefined){
            if(i != null && d[i] !== undefined){
                return d[i];
            }
            
            return d[0];
        }
        
        return d;
    },
    
    getColorValue: function(d){
        return this.getValue(d, this.colorValIdx);
    },

    valuesToText: function(vals){
        if(vals != null && vals[0] !== undefined){// $.isArray(vals)){
            return vals.join(', ');
        }
        else return vals;
    },

    /**
     * @override
     */
    createCore: function(){

        var myself = this,
            options = this.chart.options;
        
        this.colorValIdx = options.colorValIdx;
        this.sizeValIdx = options.sizeValIdx;
        this.selectNullValues = options.nullShape != null;
        
        // colors
        options.nullColor = pv.color(options.nullColor);
        if(options.minColor != null) options.minColor = pv.color(options.minColor);
        if(options.maxColor != null) options.maxColor = pv.color(options.maxColor);
        
        if(options.shape != null) {this.shape = options.shape;}
        
        var anchor = this.isOrientationVertical() ? "bottom" : "left";

        // reuse the existings scales
        var xScale = this.chart.xAxisPanel.scale;
        var yScale = this.chart.yAxisPanel.scale;
        
        var cols = (anchor === "bottom") ? xScale.domain() : yScale.domain();

        // NOTE: used in .getNormalColorScale()
        var origData = this.origData = this.chart.dataEngine.getVisibleTransposedValues();
        
        // create a mapping of the data that shows the columns (rows)
        var data = origData.map(function(d){
            return pv.dict(cols, function(){
                return d[this.index];
            });
        });

        // get an array of scaling functions (one per column)
        var fill = this.getColorScale(data, cols);

        /* The cell dimensions. */
        var w = (xScale.max - xScale.min) / xScale.domain().length;
        var h = (yScale.max - yScale.min) / yScale.domain().length;

        if (anchor !== "bottom") {
            var tmp = w;
            w = h;
            h = tmp;
        }
        
        this._cellWidth = w;
        this._cellHeight = h;
        
        this.pvHeatGrid = this.pvPanel.add(pv.Panel)
            .data(cols)
            [pvc.BasePanel.relativeAnchor[anchor]](function(){ //ex: datum.left(i=1 * w=15)
                return this.index * w;
                })
            [pvc.BasePanel.parallelLength[anchor]](w)
            .add(pv.Panel)
            .data(data)
            .datum(function(){
                return myself._getRenderingDatum();
            })
            [anchor]
            (function(){
                return this.index * h;
            })
            [pvc.BasePanel.orthogonalLength[anchor]](h)
            .antialias(false)
            .strokeStyle(null)
            .lineWidth(0)
            .overflow('hidden'); //overflow important if showValues=true
        
        // tooltip text
        this.pvHeatGrid.text(function(d,f){
            return myself.getValue(d[f]);
        });
         
        // set coloring and shape / sizes if enabled
        if(options.useShapes){
            this.createHeatMap(data, w, h, options, fill);
        } else {
            // no shapes, apply color map to panel itself
            this.pvHeatGrid.fillStyle(function(dat, col){
                return (dat[col] != null) ? fill[col](dat[col]) : options.nullColor;
            });

            // Tooltip
            if(options.showTooltips){
                this.pvHeatGrid
                    .event("mouseover", pv.Behavior.tipsy(options.tipsySettings));
            }
        }

        // clickAction
        if (this._shouldHandleClick()){
            this._addPropClick(this.pvHeatGrid);
        }
        
        //showValues
        if(this.showValues){
            var getValue = function(row, rowAgain, rowCol){
                return row[rowCol];
            };

            this.pvHeatGridLabel = this.pvHeatGrid
                .anchor("center")
                .add(pv.Label)
                .bottom(0)
                .text(getValue);
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

    /**
     * Returns the datum associated with the
     * current rendering indexes of this.pvHeatGrid.
     *
     * @override
     */
    _getRenderingDatum: function(mark){
        if(!mark){
            mark = this.pvHeatGrid;
        }

        var index = mark.index;
        if(index < 0){
            return null;
        }

        var visibleSerIndex = index,
            visibleCatIndex = mark.parent.index;

        return this._getRenderingDatumByIndexes(visibleSerIndex, visibleCatIndex);
    },
    
    // heatgrid with resizable shapes instead of panels
    createHeatMap: function(data, w, h, options, fill){
        var myself = this,
            dataEngine = this.chart.dataEngine;
        
        //total max in data
        var maxSizeVal = pv.max(data, function(datum){// {col:value ..}
            return pv.max( pv.values(datum).map(
                function(d){ return myself.getValue(d, myself.sizeValIdx); })) ;
        });

        var minSizeVal = pv.min(data, function(datum){// {col:value ..}
            return pv.min( pv.values(datum).map(
                function(d){ return myself.getValue(d, myself.sizeValIdx); })) ;
        });

        var maxSizeSpan = Math.abs(maxSizeVal - minSizeVal);

        var maxRadius = Math.min(w,h) / 2;
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

        var maxArea = maxRadius * maxRadius;// apparently treats as square area even if circle, triangle is different
     
        var sizeValueToArea = function(value){
            return 1 + (maxArea - 1) *
                       (value == null ? 0 : (Math.abs(value - minSizeVal) / maxSizeSpan));
        };
        
        var getLineWidth = function(value, isSelected){
            if(myself.sizeValIdx == null ||
               !myself.isNullShapeLineOnly() ||
               myself.getValue(value, myself.sizeValIdx) != null)
            {
                return isSelected ? myself.selectedBorder : myself.defaultBorder;
            } 
            
            // is null and needs border to show up
            if(isSelected){
                return (myself.selectedBorder == null || myself.selectedBorder == 0) ?
                       myself.nullBorder :
                       myself.selectedBorder;
            }

            return (myself.defaultBorder > 0) ? myself.defaultBorder : myself.nullBorder;
        };
        
        var getBorderColor = function(value, i, selected){
            // return getFillColor(value,i,selected).darker();
            var bcolor = getFillColor(value, i, true);
            return (dataEngine.getSelectedCount() == 0 || selected) ? bcolor.darker() : bcolor;
        };
        
        var getFillColor = function(value, i, isSelected){
           var color = options.nullColor;
           if(myself.colorValIdx != null && myself.getColorValue(value) != null){
               color =  fill[i](myself.getColorValue(value));
           }
           
           if(dataEngine.getSelectedCount() > 0 && !isSelected){
                //non-selected items
                //return color.alpha(0.5);
                return pvc.toGrayScale(color);
           }
           
           return color;
        };
        
        // chart generation
        this.shapes = this.pvHeatGrid
            .add(pv.Dot)
            .localProperty("selected", Boolean) // localProperty: see pvc.js
            .selected(function(){ return this.datum().isSelected(); })
            .shape( function(r, ra ,i){
                if(options.sizeValIdx == null){
                    return myself.shape;
                }
                return myself.getValue(r[i], options.sizeValIdx) != null ? myself.shape : options.nullShape;
            })
            .shapeSize(function(r,ra, i) {
                if(myself.sizeValIdx == null){
                    if(options.nullShape == null &&
                       myself.getValue(r[i], myself.colorValIdx) == null){
                        return 0;
                    }
                    
                    return maxArea;
                }
                
                var val = myself.getValue(r[i], myself.sizeValIdx);
                return (val == null && options.nullShape == null) ?
                        0 : sizeValueToArea(myself.getValue(r[i], myself.sizeValIdx));
            })
            .lock('shapeAngle') // rotation of shapes may cause them to not fit the calculated cell. Would have to improve the radius calculation code.
            .fillStyle(function(r, ra, i){
                return getFillColor(r[i], i, this.selected());
            })
            .lineWidth(function(r, ra, i){
                return getLineWidth(r[i], this.selected());
            })
            .strokeStyle(function(r, ra, i){
                if( !(getLineWidth(r[i], this.selected()) > 0) ){ //null|<0
                    return null;//no style
                }

                //has width
                return (myself.getValue(r[i], myself.sizeValIdx) != null) ?
                            getBorderColor(r[i], i, this.selected()) :
                            getFillColor(r[i], i, this.selected());
            })
            .text(function(r, ra, i){
                return myself.valuesToText(r[i]);
            });

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
                            v = datum.value;

                        if(options.customTooltip){
                            var s = datum.elem.series.rawValue,
                                c = datum.elem.category.rawValue;
                            tooltip = options.customTooltip(s, c, v, datum);
                        } else {
                            tooltip = myself.valuesToText(v);
                        }
                    }
                    
                    return tooltip;
                })
                .title(function(){
                    return ''; //prevent browser tooltip
                })
                .event("mouseover", pv.Behavior.tipsy(options.tipsySettings));
        }
    },

    /**
     * Prevent creation of selection overlay if not 'isMultiValued'.
     * @override
     */
    _createSelectionOverlay: function(){
        var options = this.chart.options;
        if(options.useShapes && options.isMultiValued){
            this.base();
        }
    },
    
    isNullShapeLineOnly: function(){
      return this.nullShape == 'cross';  
    },

// TODO:
//    isValueNull: function(s,c){
//      var sIdx = this.chart.dataEngine.getSeries().indexOf(s);
//      var cIdx = this.chart.dataEngine.getCategories().indexOf(c);
//      var val = this.chart.dataEngine.getValues()[cIdx][sIdx];
//
//      return val == null || val[0] == null;
//    },

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

    /*
     *selections (end)
     **********************/
    
//    /**
//     * TODO: Get label color that will contrast with given bg color
//     */
//    getLabelColor: function(r, g, b){
//        var brightness = (r*299 + g*587 + b*114) / 1000;
//        if (brightness > 125) {
//            return '#000000';
//        } else {
//            return '#ffffff';
//        }
//    },
    
  /***********
   * compute an array of fill-functions. Each column out of "cols" 
   * gets it's own scale function assigned to compute the color
   * for a value. Currently supported scales are:
   *    -  linear (from min to max
   *    -  normal distributed from   -numSD*sd to  numSD*sd 
   *         (where sd is the standards deviation)
   ********/
  getColorScale: function(data, cols) {
      switch (this.chart.options.scalingType) {
        case "normal":
          return this.getNormalColorScale(data, cols, this.colorValIdx, this.origData);//TODO:
        case "linear":
          return this.getLinearColorScale(data, cols, this.colorValIdx);
        case "discrete":
            return this.getDiscreteColorScale(data, cols, this.chart.options, this.colorValIdx);
        default:
          throw "Invalid option " + this.scaleType + " in HeatGrid";
    }
  },
  
  getColorRangeArgs: function(options){
    var rangeArgs = options.colorRange;
    if(options.minColor != null && options.maxColor != null){
        rangeArgs = [options.minColor,options.maxColor];
    }
    else if (options.minColor != null){
        rangeArgs.splice(0,1,options.minColor);
    }
    else if (options.maxColor != null){
        rangeArgs.splice(rangeArgs.length-1,1,options.maxColor);
    }
    return rangeArgs;
  },
  
  getColorDomainArgs: function(data, cols, options, rangeArgs, colorIdx){
    var domainArgs = options.colorRangeInterval;
    if(domainArgs != null && domainArgs.length > rangeArgs.length){
        domainArgs = domainArgs.slice(0, rangeArgs.length);
    }
    if(domainArgs == null){
        domainArgs = [];
    }
    
    if(domainArgs.length < rangeArgs.length){
        var myself = this;
        var min = pv.dict(cols, function(cat){
          return pv.min(data, function(d){
            var val = myself.getValue(d[cat], colorIdx);
            if(val!= null) return val;
            else return Number.POSITIVE_INFINITY;//ignore nulls
          });
        });
        var max = pv.dict(cols, function(cat){
          return pv.max(data, function(d){
            var val = myself.getValue(d[cat], colorIdx);
            if(val!= null) return val;
            else return Number.NEGATIVE_INFINITY;//ignore nulls
          });
        });
        
        if(options.normPerBaseCategory){
            return pv.dict(cols, function(category){
              return myself.padColorDomainArgs(rangeArgs, [], min[category], max[category]);  
            });
        }
        else {
            var theMin = min[cols[0]];
            for (var i=1; i<cols.length; i++) {
              if (min[cols[i]] < theMin) theMin = min[cols[i]];
            }
            var theMax = max[cols[0]];
            for (var i=1; i<cols.length; i++){
              if (max[cols[i]] > theMax) theMax = max[cols[i]];
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
  
  getDiscreteColorScale: function(data, cols, options, colorIdx){
    var colorRange = this.getColorRangeArgs(options);
    var domain = this.getColorDomainArgs(data, cols, options, colorRange, colorIdx);

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
        return pv.dict(cols, function (category){
            var dom = domain[category];
            return function(val){
                return getColorVal(val, dom, colorRange);
            }
        });
        
    }
    else {
        return pv.dict(cols, function(col){
            return function(val){
                return getColorVal(val, domain, colorRange);
            };
           
        });
    }
    
  },

  getLinearColorScale: function(data, cols, colorIdx){

    var options = this.chart.options;
    var myself = this;

    var rangeArgs = this.getColorRangeArgs(options);
    
    var domainArgs = options.colorRangeInterval;
    if(domainArgs != null && domainArgs.length > rangeArgs.length){
        domainArgs = domainArgs.slice(0, rangeArgs.length);
    }
    if(domainArgs == null){
        domainArgs = [];
    }
    
    if(domainArgs.length < rangeArgs.length || options.normPerBaseCategory){
        
        var min = pv.dict(cols, function(cat){
          return pv.min(data, function(d){
            var val = myself.getValue(d[cat], colorIdx);
            if(val!= null) return val;
            else return Number.POSITIVE_INFINITY;//ignore nulls
          });
        });
        var max = pv.dict(cols, function(cat){
          return pv.max(data, function(d){
            var val = myself.getValue(d[cat], colorIdx);
            if(val!= null) return val;
            else return Number.NEGATIVE_INFINITY;//ignore nulls
          });
        });
        
        if (options.normPerBaseCategory){  //  compute a scale-function for each column (each key
          //overrides colorRangeIntervals
            return pv.dict(cols, function(f){
                var fMin = min[f],
                    fMax = max[f];
                if(fMax == fMin)
                {
                    if(fMax >=1){
                        fMin = fMax -1;
                    } else {
                        fMax = fMin +1;    
                    }
                }
                var step = (fMax - fMin)/( rangeArgs.length -1);
                var scale = pv.Scale.linear();
                scale.domain.apply(scale, pv.range(fMin,fMax + step, step));
                scale.range.apply(scale,rangeArgs);
                return scale;
            });
        }
        else {   // normalize over the whole array
            var theMin = min[cols[0]];
            for (var i=1; i<cols.length; i++) {
              if (min[cols[i]] < theMin) theMin = min[cols[i]];
            }
            var theMax = max[cols[0]];
            for (var i=1; i<cols.length; i++){
              if (max[cols[i]] > theMax) theMax = max[cols[i]];
            }
            if(theMax == theMin)
            {
                if(theMax >=1){
                    theMin = theMax -1;
                } else {
                    theMax = theMin +1;
                }
            } 
          //use supplied numbers
          var toPad =
                domainArgs == null ?
                rangeArgs.length :
                rangeArgs.length - domainArgs.length;
          switch(toPad){
            case 1:
                //TODO: should adapt to represent middle?
                domainArgs.push(theMax);
                break;
            case 2:
                domainArgs = [theMin].concat(domainArgs).concat(theMax);
                break;
            default:
                var step = (theMax - theMin)/(rangeArgs.length -1);
                domainArgs = pv.range(theMin, theMax + step, step);
          }
        }
    }
    var scale = pv.Scale.linear();
    scale.domain.apply(scale,domainArgs);
    scale.range.apply(scale,rangeArgs);
    return pv.dict(cols,function(f){ return scale;});
  },

  getNormalColorScale: function (data, cols, origData){
    var fill;
    var options = this.chart.options;
    if (options.normPerBaseCategory) {
      // compute the mean and standard-deviation for each column
      var myself = this;
      var mean = pv.dict(cols, function(f){
        return pv.mean(data, function(d){
          return myself.getValue(d[f]);
        })
      });
      var sd = pv.dict(cols, function(f){
        return pv.deviation(data, function(d){
          myself.getValue(d[f]);
        })
      });
      //  compute a scale-function for each column (each key)
      fill = pv.dict(cols, function(f){
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
      fill = pv.dict(cols, function(f){
        return scale;
      });
    }

    return fill;  // run an array of values to compute the colors per column
}


});//end: HeatGridChartPanel
