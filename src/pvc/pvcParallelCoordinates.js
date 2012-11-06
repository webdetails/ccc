
/**
 * Parallel coordinates offer a way to visualize data and make (sub-)selections
 * on this dataset.
 * This code has been based on a protovis example:
 *    http://vis.stanford.edu/protovis/ex/cars.html
 */
def
.type('pvc.ParallelCoordinates', pvc.BaseChart)
.init(function(options){

    // Force the value dimension not to be a number
    options = options || {};
    options.dimensions = options.dimensions || {};
    if(!options.dimensions.value) {
        options.dimensions.value = {valueType: null};
    }
  
    this.base(options);
})
.add({

    parCoordPanel : null,
    
    _preRenderContent: function(contentOptions){
        this.parCoordPanel = new pvc.ParCoordPanel(this, this.basePanel, def.create(contentOptions, {
            topRuleOffset : this.options.topRuleOffset,
            botRuleOffset : this.options.botRuleOffset,
            leftRuleOffset : this.options.leftRuleOffset,
            rightRuleOffset : this.options.rightRuleOffset,
            sortCategorical : this.options.sortCategorical,
            mapAllDimensions : this.options.mapAllDimensions,
            numDigits : this.options.numDigits
        }));
    },
  
    defaults: def.create(pvc.BaseChart.prototype.defaults, {
        compatVersion: 1,
      
        topRuleOffset: 30,
        botRuleOffset: 30,
        leftRuleOffset: 60,
        rightRuleOffset: 60,
        // sort the categorical (non-numerical dimensions)
        sortCategorical: true,
        // map numerical dimension too (uniform (possible non-linear)
        // distribution of the observed values)
        mapAllDimensions: true,
        // number of digits after decimal point.
        numDigits: 0
    })
});

/*
 * ParCoord chart panel. Generates a serie of Parallel Coordinate axis 
 * and allows you too make selections on these parallel coordinates.
 * The selection will be stored in java-script variables and can be
 * used as part of a where-clause in a parameterized SQL statement.
 * Specific options are:
 *   << to be filled in >>

 * Has the following protovis extension points:
 *
 * <i>chart_</i> - for the main chart Panel
 * <i>parCoord_</i> - for the parallel coordinates
 *    << to be completed >>
 */
def
.type('pvc.ParCoordPanel', pvc.BasePanel)
.add({
    anchor: 'fill',
    pvParCoord: null,

    dimensions: null, 
    dimensionDescr: null,

    data: null,

    /*****
     * retrieve the data from database and transform it to maps.
     *    - this.dimensions: all dimensions
     *    - this.dimensionDescr: description of dimensions
     *    - this.data: array with hashmap per data-point
     *****/
    retrieveData: function () {
        var data = this.chart.data;
        var numDigit = this.chart.options.numDigits;

        this.dimensions = data.getVisibleCategories();
        var values = data.getValues();

        var dataRowIndex = data.getVisibleSeriesIndexes();
        var pCoordIndex = data.getVisibleCategoriesIndexes();

        var pCoordKeys = data.getCategories();

        /******
         *  Generate a Coordinate mapping. 
         *  This mapping is required for categorical dimensions and
         *  optional for the numerical dimensions (in 4 steps)
         ********/
        // 1: generate an array of coorMapping-functions
        // BEWARE: Only the first row (index 0) is used to test whether 
        // a dimension is categorical or numerical!
        var pCoordMapping = this.chart.options.mapAllDimensions ?
            pCoordIndex.map(function(d) {
                return isNaN(values[d][0]) ? 
                    {categorical: true,  len: 0, map: [] } : 
                    {categorical: false, len: 0, map: [], displayValue: [] }; 
            }) : 
            pCoordIndex.map(function(d) {
                return isNaN(values[d][0]) ? 
                    {categorical: true, len: 0, map: [] } : 
                    null; 
            })
            ;
  
        // 2: and generate a helper-function to update the mapping
        // For non-categorical value the original-value is store in displayValue
        var coordMapUpdate = function(i, val) {
            var cMap = pCoordMapping[i];
            var k = null; // define in outer scope.
            if (!cMap.categorical) {
                var keyVal = val.toFixed(numDigit);   // force the number to be a string
                k = cMap.map[keyVal];
                if (k == null) {
                    k = cMap.len;
                    cMap.len++;
                    cMap.map[keyVal] = k;
                    cMap.displayValue[keyVal] = val;
                }
            } else {
                k = cMap.map[val];
                if (k == null) {
                    k = cMap.len;
                    cMap.len++;
                    cMap.map[val] = k;
                }
            }
            return k;
        };

        // 3. determine the value to be displayed
        //   for the categorical dimensions map == displayValue
        for(var d in pCoordMapping){
            if (pCoordMapping.hasOwnProperty(d) && 
                pCoordMapping[d] && 
                pCoordMapping[d].categorical) {
                pCoordMapping[d].displayValue = pCoordMapping[d].map;
            }
        }
    
        var i, item, k;
    
        // 4. apply the sorting of the dimension
        if (this.chart.options.sortCategorical || 
            this.chart.options.mapAllDimensions) {
            // prefill the coordMapping in order to get it in sorted order.
            // sorting is required if all dimensions are mapped!!
            for (i=0; i<pCoordMapping.length; i++) {
                if (pCoordMapping[i]) {
                    // add all data
                    for (var col=0; col<values[i].length; col++) {
                        coordMapUpdate(i, values[i][col]);
                    }
           
                    // create a sorted array
                    var cMap = pCoordMapping[i].map;
                    var sorted = [];
                    for(item in cMap){
                        if(cMap.hasOwnProperty(item)){
                            sorted.push(item);
                        }
                    }
                    sorted.sort();
                    // and assign a new index to all items
                    if (pCoordMapping[i].categorical){
                        for(k=0; k<sorted.length; k++){
                            cMap[sorted[k]] = k;
                        }
                    } else {
                        for(k=0; k<sorted.length; k++) {
                            cMap[sorted[k]].index = k;
                        }
                    }
                }      
            }
        }

        /*************
         *  Generate the full dataset (using the coordinate mapping).
         *  (in 2 steps)
         ******/
        //   1. generate helper-function to transform a data-row to a hashMap
        //   (key-value pairs). 
        //   closure uses pCoordKeys and values
        var generateHashMap = function(col) {
            var record = {};
            for(var j in pCoordIndex) {
                if(pCoordIndex.hasOwnProperty(j)){
                    record[pCoordKeys[j]] = (pCoordMapping[j]) ?
                            coordMapUpdate(j, values[j][col]) :
                                values[j][col];
                }
            }
            return record;
        };
    
        // 2. generate array with a hashmap per data-point
        this.data = dataRowIndex.map(function(col) { return generateHashMap (col); });
    
        /*************
         *  Generate an array of descriptors for the dimensions (in 3 steps).
         ******/
        // 1. find the dimensions
        var descrVals = this.dimensions.map(function(cat){
            var item2 = {};
            // the part after "__" is assumed to be the units
            var elements = cat.split("__");
            item2.id = cat;
            item2.name = elements[0];
            item2.unit = (elements.length >1)? elements[1] : "";
            return item2;
        });

        // 2. compute the min, max and step(-size) per dimension)
        for(i=0; i<descrVals.length; i++) {
            item = descrVals[i];
            var index = pCoordIndex[i];
            // orgRowIndex is the index in the original dataset
            // some indices might be (non-existent/invisible)
            item.orgRowIndex = index;

            // determine min, max and estimate step-size
            var len = values[index].length;
            var theMin, theMax, theMin2, theMax2;
            var v;
      
            // two version of the same code (one with mapping and one without)
            if (pCoordMapping[index]) {
                theMin = theMax = theMin2 = theMax2 =
                pCoordMapping[index].displayValue[ values[index][0] ];

                for(k=1; k<len; k++) {
                    v = pCoordMapping[index].displayValue[ values[index][k] ] ;
                    if (v < theMin){
                        theMin2 = theMin;
                        theMin = v;
                    }
                    
                    if (v > theMax) {
                        theMax2 = theMax;
                        theMax = v;
                    }
                }
            } else {  // no coordinate mapping applied
                theMin = theMax = theMin2 = theMax2 = values[index][0];

                for(k=1; k<len; k++) {
                    v = values[index][k];
                    if (v < theMin) {
                        theMin2 = theMin;
                        theMin = v;
                    }
                    
                    if (v > theMax) {
                        theMax2 = theMax;
                        theMax = v;
                    }
                }
            }   // end else:  coordinate mapping applied

            var theStep = ((theMax - theMax2) + (theMin2-theMin))/2;
            item.min = theMin;
            item.max = theMax;
            item.step = theStep;

            // 3. and include the mapping (and reverse mapping) 
            item.categorical = false; 
            if (pCoordMapping[index]) {
                item.map = pCoordMapping[index].map;
                item.mapLength = pCoordMapping[index].len;
                item.categorical = pCoordMapping[index].categorical; 

                // create the reverse-mapping from key to original value
                if (!item.categorical) {
                    item.orgValue = [];
                    var theMap =  pCoordMapping[index].map;
                    for (var key in theMap){
                        if(theMap.hasOwnProperty(key)){
                            item.orgValue[ theMap[key] ] = 0.0+key;
                        }
                    }
                }
            }
        }

        // generate a object using the given set of keys and values
        //  (map from keys[i] to vals[i])
        var genKeyVal = function (keys, vals) {
            var record = {};
            for (var i = 0; i<keys.length; i++){
                record[keys[i]] = vals[i];
            }
            return record;
        };
        this.dimensionDescr = genKeyVal(this.dimensions, descrVals);
    },

    _createCore: function(){

        var myself = this;

        this.retrieveData();

        // used in the different closures
        var height = this.height,
            numDigits = this.chart.options.numDigits,
            topRuleOffs = this.chart.options.topRuleOffset,
            botRuleOffs = this.chart.options.botRuleOffset,
            leftRuleOffs = this.chart.options.leftRuleOffset,
            rightRulePos = this.width - this.chart.options.rightRuleOffset,
            topRulePos = this.height- topRuleOffs,
            ruleHeight = topRulePos - botRuleOffs,
            labelTopOffs = topRuleOffs - 12,
            // use dims to get the elements of dimDescr in the appropriate order!!
            dims = this.dimensions,
            dimDescr = this.dimensionDescr;

        /*****
         *   Generate the scales x, y and color
         *******/
        // getDimSc is the basis for getDimensionScale and getDimColorScale
        var getDimSc = function(t, addMargin) {
            var theMin = dimDescr[t].min;
            var theMax = dimDescr[t].max;
            var theStep = dimDescr[t].step;
            // add some margin at top and bottom (based on step)
            if (addMargin) {
                theMin -= theStep;
                theMax += theStep;
            }
            
            return pv.Scale.linear(theMin, theMax)
                .range(botRuleOffs, topRulePos);
        };
        
        var getDimensionScale = function(t) {
            var scale = getDimSc(t, true)
                .range(botRuleOffs, topRulePos);
            var dd = dimDescr[t];
            if (dd.orgValue && !dd.categorical) {
                // map the value to the original value
                var func = function(x) { 
                    var res = scale( dd.orgValue[x]);
                    return res; 
                };
        
                // wire domain() and invert() to the original scale
                func.domain  = function() { return scale.domain();  };
                func.invert = function(d) { return scale.invert(d); };
                return func;
            }
      
            return scale;
        };
        
        var getDimColorScale = function(t) {
            var scale = getDimSc(t, false)
                .range("steelblue", "brown");
            return scale;
        }; 

        var x = pv.Scale.ordinal(dims).splitFlush(leftRuleOffs, rightRulePos);
        var y = pv.dict(dims, getDimensionScale);
        var colors = pv.dict(dims, getDimColorScale);

        /*****
         *   Generate tools for computing selections.
         *******/
        // Interaction state. 
        var filter = pv.dict(dims, function(t) {
            return {min: y[t].domain()[0], max: y[t].domain()[1]};  });
        
        var active = dims[0];   // choose the active dimension 

        var selectVisible = this.chart.options.mapAllDimensions ?
            function(d) { 
                return dims.every(  
                   // all dimension are handled via a mapping.
                    function(t) {
                        var dd = dimDescr[t];
                        var val = (dd.orgValue && !dd.categorical) ?
                                  dd.orgValue[d[t]] : 
                                  d[t];
                        return (val >= filter[t].min) && (val <= filter[t].max); 
                    });
             } : 
             function(d) { 
                 return dims.every(function(t) {
                     // TO DO: check whether this operates correctly for
                     // categorical dimensions  (when mapAllDimensions == false
                     return (d[t] >= filter[t].min) && (d[t] <= filter[t].max); 
                 });
             }
             ;
 
        /*****
         *   generateLinePattern produces a line pattern based on
         *          1. the current dataset.
         *          2. the current filter settings.
         *          3. the provided colorMethod.
         *  The result is an array where each element contains at least
         *            {x1, y1, x2, y2, color}
         *  Two auxiliary fields are 
         *  Furthermore auxiliary functions are provided
         *     - colorFuncFreq
         *     - colorFuncActive
         *******/
         var auxData = null;
      
         /*****
          *   Draw the chart and its annotations (except dynamic content)
          *  ******/
         // Draw the data to the parallel dimensions 
         // (the light grey dataset is a fixed background)
         this.pvParCoord = this.pvPanel.add(pv.Panel)
             .data(myself.data)
             .visible(selectVisible)
             .add(pv.Line)
             .data(dims)
             .left(function(t, d) { return x(t); } )
             .bottom(function(t, d) { 
                 var res = y[t] (d[t]);
                 return res; 
             })
             .strokeStyle("#ddd")
             .lineWidth(1)
             .antialias(false)
             ;

         // Rule per dimension.
         var rule = this.pvPanel.add(pv.Rule)
             .data(dims)
             .left(x)
             .top(topRuleOffs)
             .bottom(botRuleOffs)
             ;

         // Dimension label
         rule.anchor("top").add(pv.Label)
             .top(labelTopOffs)
             .font("bold 10px sans-serif")
             .text(function(d) { return dimDescr[d].name; })
             ;

         // add labels on the categorical dimension
         //  compute the array of labels
         var labels = [];
         var labelXoffs = 6,
         labelYoffs = 3;
         for(var d in dimDescr) {
             if(dimDescr.hasOwnProperty(d)){
                 var dim = dimDescr[d];
                 if (dim.categorical) {
                     var  xVal = x(dim.id) + labelXoffs;
                     for (var l in dim.map){
                         if(dim.map.hasOwnProperty(l)){
                             labels[labels.length] = {
                                     x:  xVal,
                                     y:  y[dim.id](dim.map[l]) + labelYoffs,
                                     label: l
                             };
                         }
                     }
                 }
             }
         }
         
         var dimLabels = this.pvPanel.add(pv.Panel)
             .data(labels)
             .add(pv.Label)
             .left(function(d) {return d.x;})
             .bottom(function(d) { return d.y;})
             .text(function(d) { return d.label;})
             .textAlign("left")
             ;
    
      
         /*****
          *   Add an additional panel over the top for the dynamic content
          *    (and draw the (full) dataset)
          *******/
         // Draw the selected (changeable) data on a new panel on top
         var change = this.pvPanel.add(pv.Panel);
         var line = change.add(pv.Panel)
             .data(myself.data)
             .visible(selectVisible)
             .add(pv.Line)
             .data(dims)
             .left(function(t, d) { return x(t);})
             .bottom(function(t, d) { return y[t](d[t]); })
             .strokeStyle(function(t, d) { 
                 var dd = dimDescr[active];
                 var val = (dd.orgValue && !dd.categorical) ?
                           dd.orgValue[ d[active] ] :
                           d[active]
                           ;
                 return colors[active](val);
             })
             .lineWidth(1)
             ;

         /*****
          *   Add the user-interaction (mouse-interface)
          *   and the (dynamic) labels of the selection.
          *******/

         // Updater for slider and resizer.
         function update(d) {
             var t = d.dim;
             filter[t].min = Math.max(y[t].domain()[0], y[t].invert(height - d.y - d.dy));
             filter[t].max = Math.min(y[t].domain()[1], y[t].invert(height - d.y));
             active = t;
             change.render();
             return false;
         }

         // Updater for slider and resizer.
         function selectAll(d) {
             if (d.dy < 3) {  // 
                 var t = d.dim;
                 filter[t].min = Math.max(y[t].domain()[0], y[t].invert(0));
                 filter[t].max = Math.min(y[t].domain()[1], y[t].invert(height));
                 d.y = botRuleOffs; d.dy = ruleHeight;
                 active = t;
                 change.render();
             }
             return false;
         }
       
         // Handle select and drag 
         var handle = change.add(pv.Panel)
             .data(dims.map(function(dim) { return {y:botRuleOffs, dy:ruleHeight, dim:dim}; }))
             .left(function(t) { return x(t.dim) - 30; })
             .width(60)
             .fillStyle("rgba(0,0,0,.001)")
             .cursor("crosshair")
             .event("mousedown", pv.Behavior.select())
             .event("select", update)
             .event("selectend", selectAll)
             .add(pv.Bar)
             .left(25)
             .top(function(d) {return d.y;})
             .width(10)
             .height(function(d) { return d.dy;})
             .fillStyle(function(t) { 
                 return (t.dim == active) ? 
                        colors[t.dim]((filter[t.dim].max + filter[t.dim].min) / 2) : 
                        "hsla(0,0,50%,.5)";
             })
             .strokeStyle("white")
             .cursor("move")
             .event("mousedown", pv.Behavior.drag())
             .event("dragstart", update)
             .event("drag", update)
             ;

         handle.anchor("bottom").add(pv.Label)
             .textBaseline("top")
             .text(function(d) { 
                 return (dimDescr[d.dim].categorical) ?
                        "" :
                        filter[d.dim].min.toFixed(numDigits) + dimDescr[d.dim].unit
                        ;
             })
             ;

         handle.anchor("top").add(pv.Label)
             .textBaseline("bottom")
             .text(function(d) {
                 return (dimDescr[d.dim].categorical) ?
                        "" :
                        filter[d.dim].max.toFixed(numDigits) + dimDescr[d.dim].unit;
             })
             ;


         /*****
          *  add the extension points
          *******/

         // Extend ParallelCoordinates
         this.extend(this.pvParCoord,"parCoord");
         // the parCoord panel is the base-panel (not the colored dynamic overlay)

         // Extend body
         this.extend(this.pvPanel,"chart");
    }
});