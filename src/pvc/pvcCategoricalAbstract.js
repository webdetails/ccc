/**
 * CategoricalAbstract is the base class for all categorical or timeseries
 */

pvc.CategoricalAbstract = pvc.TimeseriesAbstract.extend({

    yAxisPanel : null,
    xAxisPanel : null,
    secondXAxisPanel: null,
    secondYAxisPanel: null,

    yScale: null,
    xScale: null,

    prevMax: null,
    prevMin: null,


    constructor: function(o){

        this.base(o);

        var _defaults = {
            showAllTimeseries: false, // meaningless here
            showXScale: true,
            showYScale: true,
            yAxisPosition: "left",
            xAxisPosition: "bottom",
            yAxisSize: 50,
            xAxisSize: 50,
            xAxisFullGrid: false,
            yAxisFullGrid: false,

            secondAxis: false,
            secondAxisIdx: -1,
            secondAxisIndependentScale: false,
            secondAxisOriginIsZero: true,
            secondAxisOffset: 0,
            secondAxisColor: "blue",
            secondAxisSize: 0, // calculated
            
            panelSizeRatio: 1,//TODO:

            // CvK  added extra parameter for implementation of HeatGrid
            orthoAxisOrdinal: false
        // if orientation==vertical then perpendicular-axis is the y-axis
        //  else perpendicular-axis is the x-axis.
        };


        // Apply options
        $.extend(this.options,_defaults, o);
        // Sanitize some options:
        if (this.options.showYScale == false){
            this.options.yAxisSize = 0
        }
        if (this.options.showXScale == false){
            this.options.xAxisSize = 0
        }

        if(this.options.secondAxis && this.options.secondAxisIndependentScale){
            this.options.secondAxisSize = this.options.orientation=="vertical"?this.options.yAxisSize:this.options.xAxisSize;
        }
        else{
            this.options.secondAxisSize = 0;
        }

    },

    preRender: function(){

        this.base();

        pvc.log("Prerendering in CategoricalAbstract");
        
        // Sanitize some options:
        if (this.options.showYScale == false){
            this.options.yAxisSize = 0
        }
        if (this.options.showXScale == false){
            this.options.xAxisSize = 0
        }

        this.xScale = this.getXScale();
        this.yScale = this.getYScale();
        this.secondScale =  this.options.secondAxisIndependentScale?this.getSecondScale(): this.getLinearScale();


        // Generate axis

        if(this.options.secondAxis){
            this.generateSecondXAxis(); // this goes before the other because of the fullGrid
        }
        this.generateXAxis();
        if(this.options.secondAxis){
            this.generateSecondYAxis(); // this goes before the other because of the fullGrid
        }
        this.generateYAxis();

    },


    /*
     * Generates the X axis. It's in a separate function to allow overriding this value
     */

    generateXAxis: function(){

        if (this.options.showXScale){
            this.xAxisPanel = new pvc.XAxisPanel(this, {
                ordinal: this.isXAxisOrdinal(),
                showAllTimeseries: false,
                anchor: this.options.xAxisPosition,
                axisSize: this.options.xAxisSize,
                oppositeAxisSize: this.options.yAxisSize,
                fullGrid:  this.options.xAxisFullGrid,
                ordinalElements: this.getAxisOrdinalElements("x"),
                clickAction: this.options.xAxisClickAction,
                useCompositeAxis: this.options.useCompositeAxis //TODO:new
            });

            //            this.xAxisPanel.setScale(this.xScale);
            this.xAxisPanel.setScale(this.xScale);
            this.xAxisPanel.appendTo(this.basePanel); // Add it

        }

    },


    /*
     * Generates the Y axis. It's in a separate function to allow overriding this value
     */

    generateYAxis: function(){

        if (this.options.showYScale){
            this.yAxisPanel = new pvc.YAxisPanel(this, {
                ordinal: this.isYAxisOrdinal(),
                showAllTimeseries: false,
                anchor: this.options.yAxisPosition,
                axisSize: this.options.yAxisSize,
                oppositeAxisSize: this.options.xAxisSize,
                fullGrid:  this.options.yAxisFullGrid,
                ordinalElements: this.getAxisOrdinalElements("y"),
                clickAction: this.options.yAxisClickAction,
                useCompositeAxis: this.options.useCompositeAxis //TODO:new
            });

            this.yAxisPanel.setScale(this.yScale);
            this.yAxisPanel.appendTo(this.basePanel); // Add it

        }

    },


    /*
     * Generates the second axis for X, if exists and only for vertical horizontal charts
     */

    generateSecondXAxis: function(){

        if( this.options.secondAxisIndependentScale && this.options.orientation == "horizontal"){
            this.secondXAxisPanel = new pvc.XAxisPanel(this, {
                ordinal: this.isXAxisOrdinal(),
                showAllTimeseries: false,
                anchor: pvc.BasePanel.oppositeAnchor[this.options.xAxisPosition],
                axisSize: this.options.secondAxisSize,
                oppositeAxisSize: this.options.yAxisSize,
                fullGrid:  false, // not supported
                ordinalElements: this.getAxisOrdinalElements("x"),
                tickColor: this.options.secondAxisColor
            });

            this.secondXAxisPanel.setScale(this.secondScale);
            this.secondXAxisPanel.appendTo(this.basePanel); // Add it
        }
    },

    /*
     * Generates the second axis for Y, if exists and only for vertical horizontal charts
     */

    generateSecondYAxis: function(){

        if( this.options.secondAxisIndependentScale && this.options.orientation == "vertical"){

            this.secondYAxisPanel = new pvc.YAxisPanel(this, {
                ordinal: this.isYAxisOrdinal(),
                showAllTimeseries: false,
                anchor: pvc.BasePanel.oppositeAnchor[this.options.yAxisPosition],
                axisSize: this.options.secondAxisSize,
                oppositeAxisSize: this.options.xAxisSize,
                fullGrid:  false, // not supported
                ordinalElements: this.getAxisOrdinalElements("y"),
                tickColor: this.options.secondAxisColor
            });

            this.secondYAxisPanel.setScale(this.secondScale);
            this.secondYAxisPanel.appendTo(this.basePanel); // Add it

        }
    },



    /*
     * Indicates if xx is an ordinal scale
     */

    isXAxisOrdinal: function(){
        var isOrdinal = false;
        if (this.options.orientation == "vertical") 
            isOrdinal = !(this.options.timeSeries);
        else 
            isOrdinal =  this.options.orthoAxisOrdinal;
        return isOrdinal;
    },


    /*
     * Indicates if yy is an ordinal scale
     */

    isYAxisOrdinal: function(){
        var isOrdinal = false;
        if (this.options.orientation == "vertical")
            isOrdinal =  this.options.orthoAxisOrdinal;
        else
            isOrdinal = !(this.options.timeSeries);
        return isOrdinal;
    },

    /*
     *  List of elements to use in the axis ordinal
     *
     */
    getAxisOrdinalElements: function(axis){
        var onSeries = false;

        // onSeries can only be true if the perpendicular axis is ordinal
        if (this.options.orthoAxisOrdinal) {
            if (axis == "x")
                onSeries = ! (this.options.orientation == "vertical");
            else
                onSeries = this.options.orientation == "vertical";
        }
        
        return onSeries ?
        this.dataEngine.getVisibleSeries() :
        this.dataEngine.getVisibleCategories();
    },



    /*
     * xx scale for categorical charts
     */

    getXScale: function(){
        var scale = null;

        if (this.options.orientation == "vertical") {
            scale = this.options.timeSeries  ?
            this.getTimeseriesScale()     :
            this.getOrdinalScale();
        } else {
            scale =  (this.options.orthoAxisOrdinal) ?
            this.getPerpOrdinalScale("x")    :
            this.getLinearScale();
        } 

        return scale;
    },

    /*
     * yy scale for categorical charts
     */

    getYScale: function(){
        var scale = null;
        if (this.options.orientation == "vertical") {
            scale =  (this.options.orthoAxisOrdinal) ?
            this.getPerpOrdinalScale("y")    :
            this.getLinearScale();
        } else { 
            scale = this.options.timeSeries  ?
            this.getTimeseriesScale()     :
            this.getOrdinalScale();
        }
        return scale;
    },

    /*
     * Helper function to facilitate  (refactoring)
     *     - getOrdinalScale()
     *     - getPerpOrdScale()
     *   (CvK)
     */
    getOrdScale: function(bypassAxis, orthoAxis){

        var yAxisSize = bypassAxis?0:this.options.yAxisSize;
        var xAxisSize = bypassAxis?0:this.options.xAxisSize;

        var secondXAxisSize = 0, secondYAxisSize = 0;
        
        if( this.options.orientation == "vertical"){
            secondYAxisSize = bypassAxis?0:this.options.secondAxisSize;
        }
        else{
            secondXAxisSize = bypassAxis?0:this.options.secondAxisSize;
        }

        if (orthoAxis) {   // added by CvK
            var categories = this.dataEngine.getVisibleSeries();
            var scale = new pv.Scale.ordinal(categories);

            if (orthoAxis == "y") {
                scale.min = 0;
                scale.max = this.basePanel.height - xAxisSize;
            } else {   // assume orthoAxis == "x"
                scale.min = yAxisSize;
                scale.max = this.basePanel.width;
            }

        } else {   // orthoAxis == false  (so normal ordinal axis)
            var categories = this.dataEngine.getVisibleCategories();
            var scale = new pv.Scale.ordinal(categories);

            var size = this.options.orientation=="vertical"?
            this.basePanel.width:
            this.basePanel.height;

            if (   this.options.orientation=="vertical"
                && this.options.yAxisPosition == "left"){
                scale.min = yAxisSize;
                scale.max = size - secondYAxisSize;
            }
            else if (   this.options.orientation=="vertical" 
                && this.options.yAxisPosition == "right"){
                scale.min = secondYAxisSize;
                scale.max = size-yAxisSize;
            }
            else{
                scale.min = secondYAxisSize;
                scale.max = size - xAxisSize - secondXAxisSize;
            }

        }  // end else-part -- if (orthoAxis)

        scale.splitBanded( scale.min, scale.max, this.options.panelSizeRatio);
        return scale;
    },

    /*
     * Scale for the ordinal axis. xx if orientation is vertical, yy otherwise
     *
     */
    getOrdinalScale: function(bypassAxis){
        var bpa = (bypassAxis) ? bypassAxis : null;
        var orthoAxis = null;
        var scale = this.getOrdScale(bpa, orthoAxis);
        return scale;
    },
    /*
     * Scale for the perpendicular ordinal axis.
     *     yy if orientation is vertical,
     *     xx otherwise
     *   (CvK)
     */
    getPerpOrdinalScale: function(orthoAxis){
        var bypassAxis = null;
        var scale = this.getOrdScale(bypassAxis, orthoAxis);
        return scale;
    },
    /**
    **/
    getLinearScale: function(bypassAxis){

        var yAxisSize = bypassAxis?0:this.options.yAxisSize;
        var xAxisSize = bypassAxis?0:this.options.xAxisSize;

        var isVertical = this.options.orientation=="vertical"
        var size = isVertical?this.basePanel.height:this.basePanel.width;

        var max, min;

        if(this.options.stacked){
            max = this.dataEngine.getCategoriesMaxSumOfVisibleSeries();
            min = 0;
        }
        else{
            max = this.dataEngine.getVisibleSeriesAbsoluteMax();
            min = this.dataEngine.getVisibleSeriesAbsoluteMin();

        }
        
        /* If the bounds are the same, things break,
         * so we add a wee bit of variation.
         */
        if (min === max) {
            min = min !== 0 ? min * 0.99 : this.options.originIsZero ? 0 : -0.1;
            max = max !== 0 ? max * 1.01 : 0.1;
        }
        if(min * max > 0 && this.options.originIsZero){
            if(min > 0){
                min = 0;
            }else{
                max = 0;
            }
        }

        // CvK:  added to set bounds
        if(   ('orthoFixedMin' in this.options)
            && (this.options.orthoFixedMin != null)
            && !(isNaN(Number(this.options.orthoFixedMin))))
            min = this.options.orthoFixedMin;
        if(   ('orthoFixedMax' in this.options)
            && (this.options.orthoFixedMax != null)
            && !(isNaN(Number(this.options.orthoFixedMax))))
            max = this.options.orthoFixedMax;


        // Adding a small offset to the scale:
        var offset = (max - min) * this.options.axisOffset;
        var scale = new pv.Scale.linear(min - (this.options.originIsZero && min == 0 ? 0 : offset),max + (this.options.originIsZero && max == 0 ? 0 : offset));


        if( !isVertical && this.options.yAxisPosition == "left"){
            scale.min = yAxisSize;
            scale.max = size;
            
        }
        else if( !isVertical && this.options.yAxisPosition == "right"){
            scale.min = 0;
            scale.max = size - yAxisSize;
        }
        else{
            scale.min = 0;
            scale.max = size - xAxisSize;
        }

        scale.range(scale.min, scale.max);
        return scale;

    },

    /*
     * Scale for the timeseries axis. xx if orientation is vertical, yy otherwise
     *
     */
    getTimeseriesScale: function(bypassAxis){

        var yAxisSize = bypassAxis?0:this.options.yAxisSize;
        var xAxisSize = bypassAxis?0:this.options.xAxisSize;
        var secondAxisSize = bypassAxis?0:this.options.secondAxisSize;

        var size = this.options.orientation=="vertical"?
        this.basePanel.width:
        this.basePanel.height;

        var parser = pv.Format.date(this.options.timeSeriesFormat);
        var categories =  this.dataEngine.getVisibleCategories().sort(function(a,b){
            return parser.parse(a) - parser.parse(b)
        });


        // Adding a small offset to the scale:
        var max = parser.parse(categories[categories.length -1]);
        var min = parser.parse(categories[0]);
        var offset = (max.getTime() - min.getTime()) * this.options.axisOffset;

        var scale = new pv.Scale.linear(new Date(min.getTime() - offset),new Date(max.getTime() + offset));

        if(this.options.orientation=="vertical" && this.options.yAxisPosition == "left"){
            scale.min = yAxisSize;
            scale.max = size;
            
        }
        else if(this.options.orientation=="vertical" && this.options.yAxisPosition == "right"){
            scale.min = 0;
            scale.max = size - yAxisSize;
        }
        else{
            scale.min = 0;
            scale.max = size - xAxisSize;
        }

        scale.range( scale.min , scale.max);
        return scale;


    },

    /*
     * Scale for the linear axis. yy if orientation is vertical, xx otherwise
     *
     */
    getSecondScale: function(bypassAxis){

        if(!this.options.secondAxis || !this.options.secondAxisIndependentScale){
            return this.getLinearScale(bypassAxis);
        }

        var yAxisSize = bypassAxis?0:this.options.yAxisSize;
        var xAxisSize = bypassAxis?0:this.options.xAxisSize;

        var isVertical = this.options.orientation=="vertical"
        var size = isVertical?this.basePanel.height:this.basePanel.width;

        var max = this.dataEngine.getSecondAxisMax();
        var min = this.dataEngine.getSecondAxisMin();

        if(min * max > 0 && this.options.secondAxisOriginIsZero){
            if(min > 0){
                min = 0;
            }else{
                max = 0;
            }
        }

        // Adding a small offset to the scale:
        var offset = (max - min) * this.options.secondAxisOffset;
        var scale = new pv.Scale.linear(min - (this.options.secondAxisOriginIsZero && min == 0 ? 0 : offset),max + (this.options.secondAxisOriginIsZero && max == 0 ? 0 : offset));


        if( !isVertical && this.options.yAxisPosition == "left"){
            scale.min = yAxisSize;
            scale.max = size;

        }
        else if( !isVertical && this.options.yAxisPosition == "right"){
            scale.min = 0;
            scale.max = size - yAxisSize;
        }
        else{
            scale.min = 0;
            scale.max = size - xAxisSize;
        }

        scale.range(scale.min, scale.max);
        return scale;

    }

}
)


/*
 * AxisPanel panel.
 *
 * 
 */
pvc.AxisPanel = pvc.BasePanel.extend({

    _parent: null,
    pvRule: null,
    pvTicks: null,
    pvLabel: null,
    pvRuleGrid: null,
    pvScale: null,

    ordinal: false,
    anchor: "bottom",
    axisSize: 30,
    tickLength: 6,
    tickColor: "#aaa",
    oppositeAxisSize: 30,
    panelName: "axis", // override
    scale: null,
    fullGrid: false,
    ordinalElements: [], // To be used in ordinal scales
    clickAction: null,//TODO: new

    constructor: function(chart, options){

        this.base(chart,options);

    },

    create: function(){

        // Size will depend only on the existence of the labels


        if (this.anchor == "top" || this.anchor == "bottom"){
            this.width = this._parent.width;
            this.height = this.axisSize;
        }
        else{
            this.height = this._parent.height;
            this.width = this.axisSize;
        }


        this.pvPanel = this._parent.getPvPanel().add(this.type)
        .width(this.width)
        .height(this.height)



        this.renderAxis();

        // Extend panel
        this.extend(this.pvPanel, this.panelName + "_");
        this.extend(this.pvRule, this.panelName + "Rule_");
        this.extend(this.pvTicks, this.panelName + "Ticks_");
        this.extend(this.pvLabel, this.panelName + "Label_");
        this.extend(this.pvRuleGrid, this.panelName + "Grid_");


    },


    setScale: function(scale){
        this.scale = scale;
    },

    renderAxis: function(){

        var min, max,myself=this;
        myself.pvScale = this.scale;
        myself.extend(myself.pvScale, myself.panelName + "Scale_");


        if (this.ordinal) {
            min = myself.pvScale.min;
            max = myself.pvScale.max;
        } else {
            var scaleRange = myself.pvScale.range();
            min = scaleRange[0];
            max = scaleRange[1];
        }
        this.pvRule = this.pvPanel
        .add(pv.Rule)
        .strokeStyle(this.tickColor)
        [pvc.BasePanel.oppositeAnchor[this.anchor]](0)
        [pvc.BasePanel.relativeAnchor[this.anchor]](min)
        [pvc.BasePanel.paralelLength[this.anchor]](max - min)

        if (this.ordinal == true){
            if(this.useCompositeAxis == true){
                //TODO:temp, hcoded
                if(this.panelName == "xAxis"){
                  this.renderCompositeOrdinalAxisXTest();
                 //  this.renderCompositeOrdinalAxisXHC();
                }
                else {
                    this.renderCompositeOrdinalAxis();
                }
            }
            else {
                this.renderOrdinalAxis();
            }
        }
        else{
            this.renderLinearAxis();
        }
    
    },
    
    renderCompositeOrdinalAxisXHC2: function(){
    //TODO:
    },
    
    renderCompositeOrdinalAxisXHC: function(){
        var myself = this;
    
        var align = (this.anchor == "bottom" || this.anchor == "top") ?
        "center" : 
        (this.anchor == "left")  ?
        "right" :
        "left";
        
        //var bogusData = {
        //    'Products AB' : {
        //        'Product B' : 1,
        //        'Product A' : 1
        //    },
        //    'Product C' : 1,
        //    'Product D' : 1
        //};
        var bogusData = {
            'pre-preD' : {'pred':{'Product D' : 1}},
            'prec':{'Product C' : 1},
            'Products AB' : {
                'Product B' : 1,
                'Product A' : 1
            }
        };
        
        //var bogusRoots = [{name :'pre-preD', breadth:1} ,{name:'prec',breadth: 1},{name:'Products AB', breadth:2}];
        var bogusRoots = [{name:'Products AB', breadth:2},  {name:'prec',breadth: 1}, {name :'pre-preD', breadth:1}];

        //var asDom = pv.dom(bogusData);
        ////remove root
        //
        //var nodes = asDom.nodes();
        //var rootToRemove = nodes[0];
        //nodes = nodes.slice(1);
        //for(var i=0;i<nodes.length;i++)
        //{//create multiple roots (ie remove references to root)
        //    if(nodes[i].parentNode == rootToRemove ){nodes[i].parentNode = null;}
        //    else {break;}//breadth-first, done
        //}
        var width = 350;
        var left = 50;
        var totBreadth = 4.0;
        var layout = this.pvRule.add(pv.Panel)
        //new
        //.data(bogusRoots)
        //end
            .data(bogusRoots)
            .left(function(d){
                var ret = left;
                left += width *( d.breadth *1.0 / totBreadth);
                return ret;
            })
            .width(function (d){
                return width *( d.breadth *1.0 / totBreadth);
            })
            .add(pv.Layout.Cluster.Fill)
            .nodes(function(d){
                   return pv.dom(bogusData[d.name]).root(d.name).nodes();
            })
            //.order("descending")
            //.size(function(d){
            //    return d;
            //    })
            .orient("bottom")
        ;
        var rootHeight = 25;//hcoded vs 100
        
        //layout.node.transform(function(d){
        //    //if(d.depth == 0){
        //    //    d.dy = 0
        //    //    return;
        //    //}
        //    //else {
        //        d.minDepth -= 1/3.0;
        //        d.maxDepth -= 1/3.0;
        //        d.depth -= 1/3.0;
        //        d.dy += (d.maxDepth - d.minDepth) * rootHeight;
        //        d.y -= rootHeight;
        //    //}
        //});
        
        layout.node.add(pv.Bar)
            //.size( function(d){
            //    return d;
            //    }
            //)
          //  .bottom(function(d){
          ////      d.y -= rootHeight;
          //      if(d.depth ==0) return d.y;
          // //     d.y += rootHeight
          //      return d.y ;// + rootHeight;
          //  })
          //  .height(function(d){
          //     if(d.depth == 0){
          //      return 1;
          //     }
            //    //d.y = 0
            //  //  rootHeight = d.dy;
            //    d.dy = 1;
            //    return d.dy;
            //   }
            //   else{
            //    d.dy += rootHeight;
              //  d.dy += (d.maxDepth - d.minDepth) * rootHeight;
         //       return d.dy;//(d.maxDepth - d.minDepth) * (rootHeight );
            //   }
          //  })
            .fillStyle('rgba(127,127,127,.05)')
            .strokeStyle("rgb(127,127,127)")
            .lineWidth(0.5)
            
            //.top(function(d){
            //  return d.y + rootHeight;// + rootHeight * 2;
            //})
            //.visible(function(d){
            //    return d.depth != 0
            //    })
            
            
            ;
        
        layout.label.add(pv.Label)
        .textAngle(function(d){
            return 0;//Math.PI/2;
                //var tan = d.dy/d.dx;
                //return -Math.atan(tan);
            });
        
    },
    
    //////
    
    getElementsTree: function(elements){
        var tree = {};
       for(var i =0; i<elements.length; i++){
            var baseElem = elements[i][0];
            if(!tree[baseElem]){
                tree[baseElem] = elements[i].length == 1 ? 0 : {};
             //   sectionNames.push(baseElem);
            }
            var currObj = tree[baseElem];
            for(var j=1;j<elements[i].length;j++){
                var elem = elements[i][j];
                if(!currObj[elem]){
                  currObj[elem] = (j == elements[i].length-1) ? 0 : {};
                }
                currObj = currObj[elem];
            }
        }
    },
    
    getLayout: function(tree, orientation, breadthCounters, numLeaves){
        
        var sectionNames = [];
        for(var section in tree){
            if(tree.hasOwnProperty(section)){
                sectionNames.push(section);
            }
        }
        
        myself = this;
        
        var axisWidth = this.width - this.oppositeAxisSize;
        //var numLeaves = elements.length;
        var widthPerLeaf = axisWidth / numLeaves;
        var left = this.oppositeAxisSize;
        
        return this.pvRule.add(pv.Panel)
            .data(sectionNames)
             .lineWidth(1)
            .left(function(name){
                var ret = left;
                left += widthPerLeaf * breadthCounters[name];
                return ret;
            })
            .height(function(){
                return myself.axisSize;// -2;
            })
            .width(function (name){
                return widthPerLeaf * breadthCounters[name];
            })
            .add(pv.Layout.Cluster.Fill)
            .nodes(function(name){
                   return pv.dom(tree[name]).root(name).nodes();
            })
            .orient(orientation);
    },
    
    getBreadthCounters: function(elements){
       var breadthCounters = {};
       for(var i =0; i<elements.length; i++){
            var name = elements[i][0];
            if(!breadthCounters[name]){
                breadthCounters[name] = 1;
            }
            else {
                breadthCounters[name] = breadthCounters[name] + 1;
            }
        }
        return breadthCounters;
    },
    
    renderCompositeOrdinalAxisXTest: function(){
        var myself = this;

        var align = (this.anchor == "bottom" || this.anchor == "top") ?
        "center" : 
        (this.anchor == "left")  ?
        "right" :
        "left";

        var elements = this.ordinalElements.slice(0).reverse();
        
        //v2
        var tree = {};
        var sectionNames = [];
        var xlen = elements.length;
        for(var i =0; i<elements.length; i++){
            var baseElem = elements[i][0];
            if(!tree[baseElem]){
                tree[baseElem] = elements[i].length == 1 ? 0 : {};
                sectionNames.push(baseElem);
            }
            var currObj = tree[baseElem];
            for(var j=1;j<elements[i].length;j++){
                var elem = elements[i][j];
                if(!currObj[elem]){
                  currObj[elem] = (j == elements[i].length-1) ? 0 : {};
                }
                currObj = currObj[elem];
            }
        }
        var breadthCounters = this.getBreadthCounters(elements);
        //{};
        ////count breadth (leaf nodes #)
        //for(var i =0; i<elements.length; i++){
        //    var name = elements[i][0];
        //    if(!breadthCounters[name]){
        //        breadthCounters[name] = 1;
        //    }
        //    else {
        //        breadthCounters[name] = breadthCounters[name] + 1;
        //    }
        //}
        
        //var axisWidth = this.width - this.oppositeAxisSize;
        //var numLeaves = elements.length;
        //var widthPerLeaf = axisWidth / numLeaves;
        //var left = this.oppositeAxisSize;
        //////////
        
        var layout = this.getLayout(tree, "bottom", breadthCounters, elements.length);
        
        //this.pvRule.add(pv.Panel)
        //    .data(sectionNames)
        //     .lineWidth(0)
        //    .left(function(name){
        //        var ret = left;
        //        left += widthPerLeaf * breadthCounters[name];
        //        return ret;
        //    })
        //    .height(function(){
        //        return myself.axisSize;
        //    })
        //    .width(function (name){
        //        return widthPerLeaf * breadthCounters[name];
        //    })
        //    .add(pv.Layout.Cluster.Fill)
        //    .nodes(function(name){
        //           return pv.dom(tree[name]).root(name).nodes();
        //    })
        //    .orient("bottom");

            
        var diagDepthCutoff = 1.1;
            //see what will fit
        layout.node
        //.add(pv.Panel)
            .def("fitsBox",true)
            .height(function(d,e,f){//just iterate and get cutoff
                var fitsBox = myself.doesTextSizeFit(d.dx, 0, d.nodeName, null);
                if(!fitsBox){
                    this.fitsBox(fitsBox);
                    diagDepthCutoff = Math.min(diagDepthCutoff, d.depth);
                }
                return d.dy;
            });
            
            
            //fill space
            layout.node.add(pv.Bar)
            .fillStyle('rgba(127,127,127,.01)')
            .strokeStyle("rgb(127,127,127)")
            .lineWidth( function(d){
                if(d.maxDepth == 1) {return 0;}
                else {return 0.5;}
               // return 0.5;
            })
            .top(function(d){//TODO:remove this!
                return d.y ;//+ 1;
            })
            .text(function(d){
                return d.nodeName;
            })
            .event("mouseover", pv.Behavior.tipsy({//Tooltip
                gravity: "n",
                fade: true
            }));
            
            
            //var properRender = null;
            //get labels in proper places
            layout.label.add(pv.Label)
            .textAngle(function(d){
                if(d.depth >= diagDepthCutoff){
                    var tan = d.dy/d.dx;
                    //if(tan <= 0.15) {tan = 0};//will just screw the text without much gain
                    var res = -Math.atan(tan);// more vertical (ex -0.3)?..
                    if(res < 0 && res > -0.15) {return 0;}
                    else {return res ;}//- 0.3;}
                }
                else return 0;
            })
            .text(function(d){
                if(d.depth >= diagDepthCutoff){//trim if needed
                    var diagonalLength = Math.sqrt(d.dy*d.dy + d.dx*d.dx);
                    return myself.trimToWidth(diagonalLength, d.nodeName, null, '..');
                }
                return d.nodeName ;
            })
            ;
        
    },
  
    //TODO: move to subclass?
    //axis labels with multidimensional support
    renderCompositeOrdinalAxis: function(){
        
        ////TODO:remove!
        //this.renderCompositeOrdinalAxisM();
        
        var myself = this;

        var align = (this.anchor == "bottom" || this.anchor == "top") ?
        "center" : 
        (this.anchor == "left")  ?
        "right" :
        "left";

        var elements = this.ordinalElements.slice(0);
        
        //v2
        var tree = {};
        var sectionNames;
        var xlen = elements.length;
        for(var i =0; i<xlen; i++){
            var baseElem = elements[i][0];
            if(!tree[baseElem]){
                tree[baseElem] = elements[i].length == 1 ? 0 : {};
            }
            var currObj = tree[baseElem];
            for(var j=1;j<elements[i].length;j++){
                var elem = elements[i][j];
                if(!currObj[elem]){
                  currObj[elem] = (j == elements[i].length-1) ? 0 : {};
                }
                currObj = currObj[elem];
            }
            //if(elements[i].length == 1){
            //    tree[baseElem] = 1;
            //}
            //else {
            //    tree[baseElem] = {};
            //    var currObj = tree[baseElem];
            //    //var key = baseElem;
            //    for(var j=1;j<elements[i].length;j++){
            //        
            //        var elem = elements[i][j];
            //        var elemObj = {};
            //        elemObj[elem] = 1;//
            //        
            //        currObj[key] = elemObj;
            //        
            //        
            //    }
        }

        //arrange ordinal elements into drawing matrix
        
        //var ylen = pv.max(elements, function(element){ return $.isArray(element)? element.length : 1; });
        //var xlen = elements.length;
        //var fpMx = [];
        //for(var i=0;i< xlen;i++){
        //    var row = [];
        //    var xacc = 1;
        //    for(var j = 0; j < ylen; j++){
        //        var v = {
        //            xdim :1,
        //            ydim: (j == elements[i].length - 1)? ylen - j : 1,
        //            lbl: (j >= elements[i].length)?
        //                elements[i][elements[i].length - 1] :
        //                elements[i][j]
        //        }
        //        row.push(v);
        //    }
        //    fpMx.push(row);
        //}
        ////...
        //for(var y=0; y<ylen;y++)
        //{
        //    for(var x=xlen-1; x > 0;x--)
        //    {//accumulate equal labels over x
        //      if(fpMx[x][y].lbl == fpMx[x-1][y].lbl){//consecutive label
        //        fpMx[x-1][y].xdim += fpMx[x][y].xdim;
        //        fpMx[x][y].xdim = 0;
        //      }
        //    }
        //}
        
                //var ylen = pv.max(elements, function(element){ return $.isArray(element)? element.length : 1; });
        //var xlen = elements.length;

        
        this.pvLabel = this.pvRule.add(pv.Panel)
        .data(this.ordinalElements)
      // //new ini
      //  .data(fpMx)//1 per column 
      //  .add(pv.Bar)
      //  .data(function(){
      //      return fpMx[this.index];
      //      })
      ////new fim
        .def("dim", function(){
            return {fixedSize: myself.axisSize,
                    parSize: myself.scale.range().band};
        })
        [pvc.BasePanel.paralelLength[this.anchor]](function(d){
            return myself.scale.range().band;
        })
        [pvc.BasePanel.oppositeAnchor[this.anchor]](2) //border size ?
        [pvc.BasePanel.relativeAnchor[this.anchor]](function(d){
            return myself.scale(d);// - myself.scale.range().band/2;
        })
        .event("click", function(d){
            if(typeof(myself.clickAction) == "function"){
                myself.clickAction(d);    
            }
          //alert(d);  
        })
        //.event("mouseover", function() {this.fillStyle('rgba(127, 127, 127, .5)');this.render()}) 
        //.event("mouseout", function() {this.fillStyle('rgba(127, 127, 127, .001)');this.render();})   
        .lineWidth(1)
        .fillStyle('rgba(127, 127, 127, .001)')
        .cursor( 'pointer')
     //testing
        
     //gnitset
        .add(pv.Label)
        [pvc.BasePanel.relativeAnchor[this.anchor]](function(d){
            return myself.scale.range().band/2;
        })
        .textAlign("center")//.textAlign(align)
     //   .textAlign(align)
        .textAngle( function(d){
            var w = this.parent.dim().parSize;
            var h = this.parent.dim().fixedSize;
            var tan = (myself.panelName == "xAxis")? h/w : w/h;
            return -Math.atan(tan);
            } ) //pi/4 -0.7854
        .textBaseline("middle")
        //.anchor('center')
        .text(pv.identity)
      //  .font("8px sans-serif");
        ;
        this.pvLabel.event("click", function(d){
          alert(d);  
        })
    },
    
    //aux functions for renderCompositeOrdinalAxis
    
    getTextSizePlaceholder : function(){
        //TODO:move elsewhere
        var TEXT_SIZE_PHOLDER_APPEND='_textSizeHtmlObj';
        if(!this.textSizeTestHolder){
            var chartHolder = $('#' + this.chart.options.canvas);
            var textSizeTestHolderId = chartHolder.attr('id') + TEXT_SIZE_PHOLDER_APPEND;
            this.textSizeTestHolder = $('<div>')
                .attr('id', textSizeTestHolderId)
                .css('position', 'absolute')
                .css('visibility', 'hidden')
                .css('width', 'auto')
                .css('height', 'auto');
            chartHolder.append(this.textSizeTestHolder);
        }
        return this.textSizeTestHolder;
    },
    
    doesTextSizeFit: function(w, h, text, font){
        var MARGIN = 15;
        var holder = this.getTextSizePlaceholder();
        holder.text(text);
        return holder.width() - MARGIN <= w;
    },
    
    trimToWidth: function(w, text, font, trimTerminator){
        var MARGIN = 15;
        var holder = this.getTextSizePlaceholder();
        if(font){
            holder.css("font", font);
        }
        var trimmed = false;
        for(holder.text(text); holder.width() - MARGIN > w;text = text.slice(0,text.length -1)){
            holder.text(text );//+ (trimmed? trimTerminator: ''));
            trimmed = true;
            holder.hide();
            holder.show();
        }
        return text + (trimmed? trimTerminator: '');
    },

    renderOrdinalAxis: function(){

        var myself = this;

        var align =  (this.anchor == "bottom" || this.anchor == "top") ?
        "center" : 
        (this.anchor == "left")  ?
        "right" :
        "left";

        this.pvLabel = this.pvRule.add(pv.Label)
        .data(this.ordinalElements)
        [pvc.BasePanel.paralelLength[this.anchor]](null)
        [pvc.BasePanel.oppositeAnchor[this.anchor]](10)
        [pvc.BasePanel.relativeAnchor[this.anchor]](function(d){
            return myself.scale(d) + myself.scale.range().band/2;
        })
        .textAlign(align)
        .textBaseline("middle")
        .text(pv.identity)
        .font("9px sans-serif");
        
    },


    renderLinearAxis: function(){

        var myself = this;
    
        var scale = this.scale;
        
        this.pvTicks = this.pvRule.add(pv.Rule)
        .data(scale.ticks())
        [pvc.BasePanel.paralelLength[this.anchor]](null)
        [pvc.BasePanel.oppositeAnchor[this.anchor]](0)
        [pvc.BasePanel.relativeAnchor[this.anchor]](this.scale)
        [pvc.BasePanel.orthogonalLength[this.anchor]](function(d){
            return myself.tickLength/(this.index%2 + 1)
        })
        .strokeStyle(this.tickColor);

        this.pvLabel = this.pvTicks
        .anchor(this.anchor)
        .add(pv.Label)
        .text(scale.tickFormat)
        .font("9px sans-serif")
        .visible(function(d){
            // mini grids
            if (this.index % 2){
                return false;
            }
            // also, hide the first and last ones
            if( scale(d) == 0  || scale(d) == scale.range()[1] ){
                return false;
            }
            return true;
        })


        // Now do the full grids
        if(this.fullGrid){

            this.pvRuleGrid = this.pvRule.add(pv.Rule)
            .data(scale.ticks())
            .strokeStyle("#f0f0f0")
            [pvc.BasePanel.paralelLength[this.anchor]](null)
            [pvc.BasePanel.oppositeAnchor[this.anchor]](- this._parent[pvc.BasePanel.orthogonalLength[this.anchor]] +
                this[pvc.BasePanel.orthogonalLength[this.anchor]])
            [pvc.BasePanel.relativeAnchor[this.anchor]](scale)
            [pvc.BasePanel.orthogonalLength[this.anchor]](this._parent[pvc.BasePanel.orthogonalLength[this.anchor]] -
                this[pvc.BasePanel.orthogonalLength[this.anchor]])
            .visible(function(d){
                // mini grids
                if (this.index % 2){
                    return false;
                }
                // also, hide the first and last ones
                if( scale(d) == 0  || scale(d) == scale.range()[1] ){
                    return false;
                }
                return true;
            })
        }


    }



});

/*
 * XAxisPanel panel.
 *
 *
 */
pvc.XAxisPanel = pvc.AxisPanel.extend({

    anchor: "bottom",
    panelName: "xAxis",

    constructor: function(chart, options){

        this.base(chart,options);

    }

});


/*
 * YAxisPanel panel.
 *
 *
 */
pvc.YAxisPanel = pvc.AxisPanel.extend({

    anchor: "left",
    panelName: "yAxis",
    pvRule: null,

    constructor: function(chart, options){

        this.base(chart,options);

    }



});
