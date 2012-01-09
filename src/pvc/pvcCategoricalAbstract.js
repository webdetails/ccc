/**
 * CategoricalAbstract is the base class for all categorical or timeseries
 */

pvc.CategoricalAbstract = pvc.TimeseriesAbstract.extend({

    yAxisPanel : null,
    xAxisPanel : null,
    secondXAxisPanel: null,
    secondYAxisPanel: null,
    
    categoricalPanel: null, // This will act as a holder for the specific panel

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
            
            panelSizeRatio: 1,
            axisLabelFont: '10px sans-serif',
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
                useCompositeAxis: this.options.useCompositeAxis, 
                font: this.options.axisLabelFont,
                
                doubleClickAction: this.options.xAxisDoubleClickAction,
                clickDelay: this.options.axisClickDelay,
                getLabel: this.options.xAxisGetLabel
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
                useCompositeAxis: this.options.useCompositeAxis, 
                font: this.options.axisLabelFont,
                doubleClickAction: this.options.yAxisDoubleClickAction,
                clickDelay: this.options.axisClickDelay,
                getLabel: this.options.yAxisGetLabel
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
            this.secondXAxisPanel = new pvc.SecondXAxisPanel(this, {
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

            this.secondYAxisPanel = new pvc.SecondYAxisPanel(this, {
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
            this.getTimeseriesScale(false,true)     :
            this.getOrdinalScale();
        } else {
            scale =  (this.options.orthoAxisOrdinal) ?
            this.getPerpOrdinalScale("x")    :
            this.getLinearScale(false,true);
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
    getLinearScale: function(bypassAxis,bypassOffset){

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
        {
            min = this.options.orthoFixedMin;
        }
        if(   ('orthoFixedMax' in this.options)
            && (this.options.orthoFixedMax != null)
            && !(isNaN(Number(this.options.orthoFixedMax))))
        {
            max = this.options.orthoFixedMax;
        }


        // Adding a small offset to the scale:
        var offset = (max - min) * this.options.axisOffset;
        offset = bypassOffset?0:offset;
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
    getTimeseriesScale: function(bypassAxis,bypassOffset){

        var yAxisSize = bypassAxis?0:this.options.yAxisSize;
        var xAxisSize = bypassAxis?0:this.options.xAxisSize;

        var secondXAxisSize = 0, secondYAxisSize = 0;
        
        if( this.options.orientation == "vertical"){
            secondYAxisSize = bypassAxis?0:this.options.secondAxisSize;
        }
        else{
            secondXAxisSize = bypassAxis?0:this.options.secondAxisSize;
        }

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
        offset = bypassOffset?0:offset;

        var scale = new pv.Scale.linear(new Date(min.getTime() - offset),new Date(max.getTime() + offset));

        if(this.options.orientation=="vertical" && this.options.yAxisPosition == "left"){
            scale.min = yAxisSize;
            scale.max = size - secondYAxisSize;
            
        }
        else if(this.options.orientation=="vertical" && this.options.yAxisPosition == "right"){
            scale.min = secondYAxisSize;
            scale.max = size - yAxisSize;
        }
        else{
            scale.min = 0;
            scale.max = size - xAxisSize - secondXAxisSize;
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

    },
    
    markEventDefaults: {
        strokeStyle: "#5BCBF5",  /* Line Color */
        lineWidth: "0.5",  /* Line Width */
        textStyle: "#5BCBF5", /* Text Color */
        verticalOffset: 10, /* Distance between vertical anchor and label */
        verticalAnchor: "bottom", /* Vertical anchor: top or bottom */
        horizontalAnchor: "right", /* Horizontal anchor: left or right */
        forceHorizontalAnchor: false, /* Horizontal anchor position will be respected if true */
        horizontalAnchorSwapLimit: 80 /* Horizontal anchor will switch if less than this space available */
    },
    
    
    markEvent: function(dateString, label, options){

        if( this.options.timeSeries !== true){
            
            pvc.log("Attempting to mark an event on a non timeSeries chart");
            return;
        }

        var o = $.extend({},this.markEventDefaults,options);
        var scale = this.getTimeseriesScale(true,true);

        // Are we outside the allowed scale? 
        var d = pv.Format.date(this.options.timeSeriesFormat).parse(dateString);
        var dpos = scale( d );
        
        if( dpos < scale.range()[0] || dpos > scale.range()[1]){
            pvc.log("Event outside the allowed range, returning");
            return;
        }

        // Add the line

        var panel = this.categoricalPanel.pvPanel;
        var h = this.yScale.range()[1];

        // Detect where to place the horizontalAnchor
        var anchor = o.horizontalAnchor;
        if( !o.forceHorizontalAnchor )
        {
            var availableSize = o.horizontalAnchor == "right"?scale.range()[1]-dpos:dpos;
            
            // TODO: Replace this availableSize condition with a check for the text size
            if (availableSize < o.horizontalAnchorSwapLimit ){
                o.horizontalAnchor = o.horizontalAnchor == "right"?"left":"right";
            }
            
        }

        var line = panel.add(pv.Line)
            .data([0,h])
            .strokeStyle(o.strokeStyle)
            .lineWidth(o.lineWidth)
            .bottom(function(d){
                return d;
            })
            .left(dpos)

        var pvLabel = line
            .anchor(o.horizontalAnchor)
            .top( o.verticalAnchor == "top" ? o.verticalOffset : (h - o.verticalOffset))
            .add(pv.Label)
            .text(label)
            .textStyle(o.textStyle)
            .visible(function(d){
                return this.index==0;
            });
    }

});


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
        .strokeStyle('black')
        [pvc.BasePanel.oppositeAnchor[this.anchor]](0)
        [pvc.BasePanel.relativeAnchor[this.anchor]](min)
        [pvc.BasePanel.parallelLength[this.anchor]](max - min)

        if (this.ordinal == true){
            if(this.useCompositeAxis == true){
                  this.renderCompositeOrdinalAxis();
            }
            else {
                this.renderOrdinalAxis();
            }
        }
        else{
            this.renderLinearAxis();
        }
    
    },
    
    /////////////////////////////////////////////////
    //begin: composite axis
    
    getElementsTree: function(elements){
        var tree = {};
       for(var i =0; i<elements.length; i++){
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
        }
    },
    
    getLayoutSingleCluster: function(tree, orientation, maxDepth){
        
        myself = this;

        var depthLength = this.axisSize;
        //displace to take out bogus-root
        var baseDisplacement = (1.0/++maxDepth)* depthLength;
        var margin = (1.0/12.0) * depthLength;//heuristic compensation
        baseDisplacement -= margin;
        
        var scaleFactor = maxDepth*1.0/ (maxDepth -1);
        var orthogonalLength = pvc.BasePanel.orthogonalLength[orientation];
        //var dlen = (orthogonalLength == 'width')? 'dx' : 'dy';
        
        var displacement = (orthogonalLength == 'width')?
                ((orientation == 'left')? [-baseDisplacement, 0] : [baseDisplacement, 0]) :
                ((orientation == 'top')?  [0, -baseDisplacement] : [0, baseDisplacement]);

        //store without compensation for lasso handling   
        this.axisDisplacement = displacement.slice(0);
        for(var i=0;i<this.axisDisplacement.length;i++){
            if(this.axisDisplacement[i] < 0 ){ this.axisDisplacement[i] -= margin ;}
            else if(this.axisDisplacement[i] > 0 ){ this.axisDisplacement[i] = 0 ;}
            this.axisDisplacement[i] *= scaleFactor;
        }
        
        this.pvRule.lineWidth(0).strokeStyle(null);
        var panel = this.pvRule
                        .add(pv.Panel)[orthogonalLength](depthLength)//.overflow('hidden')
                            .strokeStyle(null).lineWidth(0) //cropping panel
                        .add(pv.Panel)[orthogonalLength](depthLength * scaleFactor ).strokeStyle(null).lineWidth(0);// panel resized and shifted to make bogus root disappear
        panel.transform(pv.Transform.identity.translate(displacement[0], displacement[1]));
        
        //set full path and label
        var nodes = pv.dom(tree).root('').nodes().map(function(node){
            //path
            var path = [];
            path.push(node.nodeName);
            for(var pnode = node.parentNode; pnode != null; pnode = pnode.parentNode){
              path.push(pnode.nodeName);
            }
            node.nodePath = path.reverse().slice(1);
            //label
            if(typeof(myself.getLabel) == 'function' ){
                node.nodeLabel = myself.getLabel(node.nodeName);
            }
            else {
                node.nodeLabel = node.nodeName;
            }
            if(node.nodeLabel == undefined){
                node.nodeLabel = '';
            }
            
            return node;
        });
        
        //create with bogus-root;pv.Hierarchy must always have exactly one root and at least one element besides the root
        var layout = panel.add(pv.Layout.Cluster.Fill)
            .nodes(nodes)
            .orient(orientation)
            ;
            
        //keep node references for lasso selection
        this.storedNodes = nodes;
        
        return layout;
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
    
    getAreaSelections: function(x,y,dx,dy,mode){
        
        var selections = [];
        
        if(!this.useCompositeAxis){
            return selections;
        }
        
        x-= this.axisDisplacement[0];
        y-= this.axisDisplacement[1];
        
        this.storedNodes[0].visitBefore(function(node, i){
           if(i==0) {return;}
           var nodeX = node.x + node.dx /2;
           var nodeY = node.y + node.dy /2;
            
            if(nodeX > x && nodeX < x + dx &&
               nodeY > y && nodeY < y + dy){
                selections.push(node.nodePath);
            }
        });
        
        var lastSelection = null;
        var compressedSelections = [];
        for(var i=0; i<selections.length;i++){
            var selection = selections[i];
            if(lastSelection==null ||
               !this.arrayStartsWith(selection, lastSelection)){
                lastSelection = selection;
                compressedSelections.push(selection);
            }
        }
        return compressedSelections;
    },
    
    
    arrayStartsWith: function(array, base)
    {
        if(array.length < base.length) { return false; }
        
        for(var i=0; i<base.length;i++){
            if(base[i] != array[i]) {
                return false;
            }
        }
        return true;
    },
    
    renderCompositeOrdinalAxis: function(){
        var myself = this;

        var align = (this.anchor == "bottom" || this.anchor == "top") ?
        "center" : 
        (this.anchor == "left")  ?
        "right" :
        "left";
        
        var axisDirection = (this.anchor == 'bottom' || this.anchor == 'top')?
            'h':
            'v';

        var elements = this.ordinalElements.slice(0);
        //TODO: extend this to work with chart.orientation?
        if(this.anchor == 'bottom' || this.anchor == 'left') {elements.reverse();}
        
        var isHierarchy = true;
        
        //build tree with elements
        var tree = {};
        var sectionNames = [];
        var xlen = elements.length;
        for(var i =0; i<elements.length; i++){
            if(typeof(elements[i]) == 'string'){
                isHierarchy = false;
                tree[elements[i]] = 0;
                sectionNames.push(elements[i]);
                continue;
            }
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
        
        var tipsyGravity = 's';
        switch(this.anchor){
            case 'bottom':
                tipsyGravity = 's';
                break;
            case 'top':
                tipsyGravity = 'n';
                break;
            case 'left':
                tipsyGravity = 'w';
                break;
            case 'right':
                tipsyGravity = 'e';
                break;
        }
        
        var maxDepth =isHierarchy? pv.max(elements, function(col){
            //return $.isArray(col) ? col.length : 1;
            return (col != null && col[0] !== undefined) ? col.length : 1;
        }) : 1;
        
        var layout = this.getLayoutSingleCluster(tree, this.anchor, maxDepth);
    
        var diagDepthCutoff = 2; //depth in [-1/(n+1), 1]
        var vertDepthCutoff = 2;
        //see what will fit so we get consistent rotation
        layout.node
            .def("fitInfo", null)
            .height(function(d,e,f){//just iterate and get cutoff
                var fitInfo = myself.getFitInfo(d.dx, d.dy, d.nodeLabel, myself.font, diagMargin);
                if(!fitInfo.h){
                    
                    if(axisDirection == 'v' && fitInfo.v ){//prefer vertical
                        vertDepthCutoff = Math.min(diagDepthCutoff, d.depth);
                    }
                    else {
                        diagDepthCutoff = Math.min(diagDepthCutoff, d.depth);
                    }
                }
                this.fitInfo( fitInfo );
                return d.dy;
            }) ;
        
        //click / double click interaction
        var ignoreClicks = 0;
        var DBL_CLICK_MAX_DELAY = (this.clickDelay)? this.clickDelay : 300; //ms
        var clickAction = (typeof(this.clickAction) == 'function')?
            function(d, e){
                if(ignoreClicks) { ignoreClicks--; }
                else {
                    myself.clickAction(d, e);
                }
            } :
            null;
            
        var doubleClickAction = (typeof(this.doubleClickAction) == 'function')?
            function(d, e){
                ignoreClicks = 2;
                myself.doubleClickAction(d, e);
            } :
            null;
        
        //label space (left transparent)
        var lblBar = layout.node.add(pv.Bar)
            .fillStyle('rgba(127,127,127,.001)')
            .strokeStyle( function(d){
                if(d.maxDepth == 1 || d.maxDepth ==0 ) {return null;}
                else {return "rgba(127,127,127,0.3)";} //non-terminal items, so grouping is visible
            })
            .lineWidth( function(d){
                if(d.maxDepth == 1 || d.maxDepth ==0 ) { return 0; }
                else {return 0.5;} //non-terminal items, so grouping is visible
            })
            .text(function(d){
                return d.nodeLabel;
            });
        
        //cutoffs -> snap to vertical/horizontal
        var H_CUTOFF_ANG = 0.30;
        var V_CUTOFF_ANG = 1.27;
        var V_CUTOFF_RATIO = 0.8;
        var diagMargin = this.getFontSize(this.font) / 2;
        
        
        //draw labels and make them fit
        this.pvLabel = layout.label.add(pv.Label)
            .def('lblDirection','h')
            .textAngle(function(d)
            {
                var fitInfo = this.fitInfo();
                
                if(d.depth >= vertDepthCutoff && d.depth < diagDepthCutoff){
                        this.lblDirection('v');
                        return -Math.PI/2;
                }
                if(d.depth >= diagDepthCutoff)
                {
                    
                    var tan = d.dy/d.dx;
                    var angle = Math.atan(tan);
                    var hip = Math.sqrt(d.dy*d.dy + d.dx*d.dx);
                    
                    if(angle > V_CUTOFF_ANG)
                    {
                        this.lblDirection('v');
                        return -Math.PI/2;
                    }
                    else if(angle > H_CUTOFF_ANG) {
                        this.lblDirection('d');
                        return -angle;
                    }
                }
                this.lblDirection('h');
                return 0;//horizontal
            })
            .font(myself.font)
            //.title(function(d){
            //    return d.nodeLabel;
            //})
            .text(function(d){
                var fitInfo = this.fitInfo();
                switch(this.lblDirection()){
                    case 'h':
                        if(!fitInfo.h){//TODO: fallback option for no svg
                            return myself.trimToWidth(d.dx, d.nodeLabel, myself.font, '..');
                        }
                        break;
                    case 'v':
                        if(!fitInfo.v){
                            return myself.trimToWidth(d.dy, d.nodeLabel, myself.font, '..');
                        }
                        break;
                    case 'd':
                       if(!fitInfo.d){
                          var ang = Math.atan(d.dy/d.dx);
                          var diagonalLength = Math.sqrt(d.dy*d.dy + d.dx*d.dx) ;
                          return myself.trimToWidth(diagonalLength-diagMargin,d.nodeLabel, myself.font,'..');
                        }
                        break;
                }
                return d.nodeLabel ;
            })
            .cursor( myself.clickAction? 'pointer' : 'default')
            .events('all')//labels don't have events by default
            .event('click', function(d){
                var e = arguments[arguments.length-1];
                if(clickAction){
                    if(doubleClickAction){
                        //arg has to be passed in closure in order to work with ie
                        window.setTimeout(function(){clickAction(d.nodePath, e)}, DBL_CLICK_MAX_DELAY);
                       // window.setTimeout(clickAction, DBL_CLICK_MAX_DELAY, d.nodePath);
                    }
                    else { clickAction(d.nodePath, e); }
                }
            });

            //tooltip
            this.pvLabel
                //.def('tooltip', '')
                .title(function(d){
                    this.instance()['tooltip'] = d.nodeLabel;
                    return '';
                })
                .event("mouseover", pv.Behavior.tipsy({//Tooltip
                    gravity: tipsyGravity,
                    fade: true,
                    offset: diagMargin * 2,
                    opacity:1
                }));

           // double click label //TODO: need doubleclick axis action + single click prevention..
            if(doubleClickAction)
            {
                this.pvLabel.event("dblclick", function(d){
                    doubleClickAction(d.nodePath, arguments[arguments.length-1]);
                });
            }

    },
    
    getTextSizePlaceholder : function()
    {
        var TEXT_SIZE_PHOLDER_APPEND='_textSizeHtmlObj';
        if(!this.textSizeTestHolder || this.textSizeTestHolder.parent().length == 0)
        {
            var chartHolder = $('#' + this.chart.options.canvas);
            var textSizeTestHolderId = chartHolder.attr('id') + TEXT_SIZE_PHOLDER_APPEND;
            this.textSizeTestHolder = $('#' + this.chart.options.canvas + ' #' + textSizeTestHolderId);
            if(this.textSizeTestHolder.length == 0)
            {
                this.textSizeTestHolder = $('<div>')
                    .attr('id', textSizeTestHolderId)
                    .css('position', 'absolute')
                    .css('visibility', 'hidden')
                    .css('width', 'auto')
                    .css('height', 'auto');
                chartHolder.append(this.textSizeTestHolder);
            }
        }
        return this.textSizeTestHolder;
    },

    getTextSizePvLabel: function(text, font)
    {
        if(!this.textSizePvLabel || this.textSizeLabelFont != font){
            var holder = this.getTextSizePlaceholder();
            var holderId = holder.attr('id');
            var panel = new pv.Panel();
            panel.canvas(holderId);
            var lbl = panel.add(pv.Label).text(text);
            if(font){
                lbl.font(font);
            }
            panel.render();
            this.textSizePvLabel = $('#' + holderId + ' text');
            this.textSizeLabelFont = font;
        }
        else {
            this.textSizePvLabel.text(text);
        }
        
        return this.textSizePvLabel[0];
    },
    
    getTextLength: function(text, font){
        
        switch(pv.renderer()){
            case 'vml':
                return this.getTextLenVML(text, font);
            case 'batik':
                return getTextLenCGG(text, font);
            case 'svg':
            default:
                return this.getTextLenSVG(text, font);
        }
      //  
      //return (pv.renderer() != 'vml')?//TODO: support svgweb? defaulting to svg
      //  this.getTextLenSVG(text, font) :
      //  this.getTextLenVML(text, font) ;
    },
    
    getTextLenSVG: function(text, font){
        var lbl = this.getTextSizePvLabel(text, font);
        var box = lbl.getBBox();
        return box.width;
    },
    
    getTextLenVML: function(text, font){
        return pv.Vml.text_dims(text, font).width;
    },
    
    //TODO: if not in px?..
    getFontSize: function(font){
        if(pv.renderer() == 'batik'){
            var sty = document.createElementNS('http://www.w3.org/2000/svg','text').style;
            sty.setProperty('font',font);
            return parseInt(sty.getProperty('font-size'));
        }
        else {
            var holder = this.getTextSizePlaceholder();
            holder.css('font', font);
            return parseInt(holder.css('font-size'));//.slice(0,-2);
        }
    },
    
    getFitInfo: function(w, h, text, font, diagMargin)
    {    
        if(text == '') return {h:true, v:true, d:true};
        var len = this.getTextLength(text, font);
        
        var fitInfo =
        {
            h: len <= w,
            v: len <= h,
            d: len <= Math.sqrt(w*w + h*h) - diagMargin
        };
        return fitInfo;
    },
    
    trimToWidth: function(len,text,font,trimTerminator){
      if(text == '') return text;
      var textLen = this.getTextLength(text, font);
      
      if(textLen <= len){
        return text;
      }
      
      if(textLen > len * 1.5){//cutoff for using other algorithm
        return this.trimToWidthBin(len,text,font,trimTerminator);
      }
      
      while(textLen > len){
        text = text.slice(0,text.length -1);
        textLen = this.getTextLength(text, font);
      }
      return text + trimTerminator;
    },
    
    trimToWidthBin :function(len,text,font,trimTerminator){
        
        var high = text.length-2;
        var low = 0;
        var mid;
        var fits=false;
        var textLen;
        
        while(low <= high && high > 0){
            
            mid = Math.ceil((low + high)/2);
            //text = text.slice(0,mid);
            textLen = this.getTextLength(text.slice(0,mid), font);
            
            if(textLen > len){
                high = mid-1;
            }
            else {
                if( this.getTextLength(text.slice(0,mid+1), font) < len ){
                    low = mid+1;
                }
                else return text.slice(0,mid) + trimTerminator;
            }
            
        }
        
        return text.slice(0,high) + trimTerminator; 
    },
    
    //TODO: use for IE if non-svg option kept
    doesTextSizeFit: function(length, text, font){
        var MARGIN = 4;//TODO: hcoded
        var holder = this.getTextSizePlaceholder();
        holder.text(text);
        return holder.width() - MARGIN <= length;
    },
    

    
    // end: composite axis
    /////////////////////////////////////////////////

    renderOrdinalAxis: function(){

        var myself = this;

        var align =  (this.anchor == "bottom" || this.anchor == "top") ?
                    "center" : 
                    (this.anchor == "left")  ?
                        "right" :
                        "left";
       
        this.pvTicks = this.pvRule.add(pv.Rule)
        .data(this.ordinalElements)
        [pvc.BasePanel.parallelLength[this.anchor]](null)
        [pvc.BasePanel.oppositeAnchor[this.anchor]](0)
        [pvc.BasePanel.relativeAnchor[this.anchor]](function(d){
            return myself.scale(d) + myself.scale.range().band/2;
        })
        [pvc.BasePanel.orthogonalLength[this.anchor]](5)
        .strokeStyle("rgba(0,0,0,0)");//TODO:ok?

        this.pvLabel = this.pvTicks.anchor(this.anchor)
        .add(pv.Label)
        .textAlign(align)
        //.textBaseline("middle")
        //.text(pv.identity)
        .font("9px sans-serif");

    },


    renderLinearAxis: function(){

        var myself = this;
    
        var scale = this.scale;
        
        this.pvTicks = this.pvRule.add(pv.Rule)
        .data(scale.ticks())
        [pvc.BasePanel.parallelLength[this.anchor]](null)
        [pvc.BasePanel.oppositeAnchor[this.anchor]](0)
        [pvc.BasePanel.relativeAnchor[this.anchor]](this.scale)
        [pvc.BasePanel.orthogonalLength[this.anchor]](function(d){
            return myself.tickLength/(this.index%2 + 1)
        })
        .strokeStyle('black');

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
            [pvc.BasePanel.parallelLength[this.anchor]](null)
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
 * SecondXAxisPanel panel.
 *
 *
 */
pvc.SecondXAxisPanel = pvc.XAxisPanel.extend({

    panelName: "secondXAxis",

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

/*
 * SecondYAxisPanel panel.
 *
 *
 */
pvc.SecondYAxisPanel = pvc.YAxisPanel.extend({

    panelName: "secondYAxis",

    constructor: function(chart, options){

        this.base(chart,options);

    }

});
