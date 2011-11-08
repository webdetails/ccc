/**
 * The main component
 */


pvc.Base = Base.extend({

    options: {},
    isPreRendered: false,
    isAnimating: false,

    // data
    dataEngine: null,
    resultset:[],
    metadata: [],

    // panels
    basePanel: null,
    titlePanel: null,
    legendPanel: null,

    legendSource: "series",
    colors: null,

    // renderCallback
    renderCallback: undefined,

    constructor: function(options){
        var myself = this;
        var _defaults = {
            canvas: null,
            width: 400,
            height: 300,
            originalWidth: 400,
            originalHeight: 300,
            crosstabMode: true,
            seriesInRows: false,
            animate: true,

            title: null,
            titlePosition: "top", // options: bottom || left || right
            titleAlign: "center", // left / right / center
            legend: false,
            legendPosition: "bottom",
            colors: null,

            tooltipFormat: function(s,c,v){
                return s+", "+c+":  " + myself.options.valueFormat(v) ;
            },

            valueFormat: function(d){
                return pv.Format.number().fractionDigits(0, 2).format(pv.Format.number().fractionDigits(0, 10).parse(d));
            },
            clickable: false,
            clickAction: function(s, c, v){
                pvc.log("You clicked on series " + s + ", category " + c + ", value " + v);
            }

        };
    
        this.options = {},

        // Apply options
        $.extend(this.options, _defaults);

        // Create DataEngine
        this.dataEngine = new pvc.DataEngine(this);

    },


    /**
     *
     * Building the visualization has 2 stages: First the preRender prepares and
     * build every object that will be used; Later
     *
     */

    preRender: function(){

        pvc.log("Prerendering in pvc");
        // Now's as good a time as any to completely clear out all tipsy tooltips
        try {
            $('.tipsy').remove();
        } catch(e) {
            // Do nothing
        }
        // If we don't have data, we just need to set a "no data" message
        // and go on with life.
        if (!this.allowNoData && this.resultset.length === 0) {
            throw new NoDataException();
        }

        // Disable animation if browser doesn't support it
        if(!$.support.svg){
            this.options.animate = false;
        }

        // Getting data engine and initialize the translator
        this.dataEngine.clearDataCache();
        this.dataEngine.setData(this.metadata,this.resultset);
        this.dataEngine.setCrosstabMode(this.options.crosstabMode);
        this.dataEngine.setSeriesInRows(this.options.seriesInRows);
        this.dataEngine.createTranslator();

        pvc.log(this.dataEngine.getInfo());
        // Create the color info
        if (typeof this.options.colors == 'undefined' || this.options.colors == null || this.options.colors.length == 0){
            this.colors = pv.Colors.category10;
        }
        else{
            this.colors = function() {
                var scale = pv.colors(this.options.colors);
                scale.domain.apply(scale, arguments);
                return scale;
            };
        }


        // create the basePanel. Since we don't have a parent panel we need to
        // manually create the points

        this.basePanel = new pvc.BasePanel(this); // Base panel, no parent
        this.basePanel.setSize(this.options.width, this.options.height);
        this.basePanel.create();
        this.basePanel.getPvPanel().canvas(this.options.canvas);

        // Title
        if (this.options.title != null && this.options.title.lengh != ""){
            this.titlePanel = new pvc.TitlePanel(this, {
                title: this.options.title,
                anchor: this.options.titlePosition,
                titleSize: this.options.titleSize,
                titleAlign: this.options.titleAlign
            });

            this.titlePanel.appendTo(this.basePanel); // Add it

        }


        // Legend
        if (this.options.legend){
            this.legendPanel = new pvc.LegendPanel(this, {
                anchor: this.options.legendPosition,
                legendSize: this.options.legendSize,
                align: this.options.legendAlign,
                minMarginX: this.options.legendMinMarginX,
                minMarginY: this.options.legendMinMarginY,
                textMargin: this.options.legendTextMargin,
                padding: this.options.legendPadding,
                textAdjust: this.options.legendTextAdjust,
                shape: this.options.legendShape,
                markerSize: this.options.legendMarkerSize,
                drawLine: this.options.legendDrawLine,
                drawMarker: this.options.legendDrawMarker
            });

            this.legendPanel.appendTo(this.basePanel); // Add it

        }

        this.isPreRendered = true;

    },

    /**
     *
     * Render the visualization. If not prerendered, do it now
     *
     */

    render: function(bypassAnimation){
        try {
            if(!this.isPreRendered){
                this.preRender();
            }

            if( typeof this.options.renderCallback !== "undefined" ){
                this.options.renderCallback.call(this);
            }
        
            this.basePanel.getPvPanel().render();
    
            if(this.options.animate == true && !bypassAnimation){
                this.isAnimating = true;
                this.basePanel.getPvPanel().transition()
                .duration( 2000)
                .ease("cubic-in-out")
                .start();
            }
        } catch (e) {
            if(e instanceof NoDataException) {

                if (!this.basePanel) {
                    pvc.log("No panel");
                    this.basePanel = new pvc.BasePanel(this); // Base panel, no parent
                    this.basePanel.setSize(this.options.width, this.options.height);
                    this.basePanel.create();
                    this.basePanel.getPvPanel().canvas(this.options.canvas);
                }
                pvc.log("creating message");
                var message = this.basePanel.getPvPanel().anchor("center").add(pv.Label);
                message.text("No data found");
                this.basePanel.extend(message,"noDataMessage_");
                this.basePanel.getPvPanel().render();
            } else {
                // We don't know how to handle this
                throw e;
            }
        }


    },


    /**
     * Method to set the data to the chart. Expected object is the same as what
     * comes from the CDA: {metadata: [], resultset: []}
     */

    setData: function(data, options){
        this.setResultset(data.resultset);
        this.setMetadata(data.metadata);

        $.extend(this.options,options);
    },


    /**
     * Sets the resultset that will be used to build the chart
     */

    setResultset: function(resultset){

        this.resultset = resultset;
        if (resultset.length == 0){
            pvc.log("Warning: Resultset is empty")
        }

    },


    /**
     * Sets the metadata that, optionally, will give more information for building
     * the chart
     */

    setMetadata: function(metadata){

        this.metadata = metadata;
        if (metadata.length == 0){
            pvc.log("Warning: Metadata is empty")
        }

    },

    /*
     * Animation
     */

    animate: function(start, end){

        if (this.options.animate == false || this.isAnimating == true){
            return end;
        }
        else{
            return start
        }

    }



});


/**
 *
 * Base panel. A lot of them will exist here, with some common properties.
 * Each class that extends pvc.base will be responsible to know how to use it
 *
 */
pvc.BasePanel = Base.extend({

    chart: null,
    _parent: null,
    type: pv.Panel, // default one
    height: null,
    width: null,
    anchor: "top",
    pvPanel: null,
    fillColor: "red",
    margins: null,

    constructor: function(chart,options){

        this.chart = chart;
        $.extend(this,options);

        this.margins = {
            top:0,
            right: 0,
            bottom: 0,
            left: 0
        }

    },


    create: function(){

        if(this._parent == null){
            // Should be created for the vis panel only
            this.pvPanel = new pv.Panel();
            this.extend(this.pvPanel,"base_");
        }
        else{
            this.pvPanel = this._parent.pvPanel.add(this.type);
        }

        this.pvPanel
        .width(this.width)
        .height(this.height);

    },


    /*
     *  Create the panel, appending it to the previous one using a specified anchor.
     *
     *  Will:
     *  1) create the panel.
     *  2) subtract it's size from the previous panel's size
     *  3) append it to the previous one in the correct position
     *
     */

    appendTo: function(_parent){

        this._parent = _parent;
        this.create();

        // Reduce size and update margins
        var a = this.anchor;
        if(a == "top" || a == "bottom"){
            this._parent.height -= this.height;
        }
        else{
            this._parent.width -= this.width;
        }


    
        // See where to attach it.
        this.pvPanel[a](this._parent.margins[a]);
        this.pvPanel[pvc.BasePanel.relativeAnchor[a]](this._parent.margins[pvc.BasePanel.relativeAnchor[a]]);

        // update margins
        if(a == "top" || a == "bottom"){
            this._parent.margins[this.anchor] += this.height;
        }
        else{
            this._parent.margins[a] += this.width;
        }

    },


    /**
     *
     * This is the method to be used for the extension points for the specific
     * contents of the chart.
     *already ge a pie chart!
     * Goes through the list of options and, if it matches the prefix, execute that
     * method on the mark. WARNING: It's user's reponsability to make sure some
     * unexisting method won't blow this
     *
     */

    extend: function(mark, prefix){

        for (p in this.chart.options.extensionPoints){
            if (p.indexOf(prefix) == 0){
                var m = p.substring(prefix.length);
                // Distinguish between mark methods and properties
                if (typeof mark[m] === "function") {
                    mark[m](this.chart.options.extensionPoints[p]);
                } else {
                    mark[m] = this.chart.options.extensionPoints[p];
                }
            }

        }

    },

    /*
     * Sets the size for the panel, when he parent panel is undefined
     */

    setSize: function(w,h){
        this.width = w;
        this.height = h;

    },

    /*
     * returns the width of the Panel
     */
    getWidth: function(){
        return this.width
    },

    /*
     * returns the height of the Panel
     */
    getHeight: function(){
        return this.height
    },

    /*
     * Returns the underlying protovis Panel
     */
    getPvPanel: function(){
        return this.pvPanel
    }


},{
    // determine what is the associated method to call to position the labels
    // correctly

    relativeAnchor: {
        top: "left",
        bottom: "left",
        left: "bottom",
        right: "bottom"
    },

    relativeAnchorMirror: {
        top: "right",
        bottom: "right",
        left: "top",
        right: "top"
    },

    oppositeAnchor:{
        top: "bottom",
        bottom: "top",
        left: "right",
        right: "left"
    },

    paralelLength:{
        top: "width",
        bottom: "width",
        right: "height",
        left: "height"
    },

    orthogonalLength:{
        top: "height",
        bottom: "height",
        right: "width",
        left: "width"
    }

})


/*
 * Title panel. Generates the title. Specific options are:
 * <i>title</i> - text. Default: null
 * <i>titlePosition</i> - top / bottom / left / right. Default: top
 * <i>titleSize</i> - The size of the title in pixels. Default: 25
 *
 * Has the following protovis extension points:
 *
 * <i>title_</i> - for the title Panel
 * <i>titleLabel_</i> - for the title Label
 */
pvc.TitlePanel = pvc.BasePanel.extend({
  
    _parent: null,
    pvLabel: null,
    anchor: "top",
    titlePanel: null,
    title: null,
    titleSize: 25,
    titleAlign: "center",
    font: "14px sans-serif",



    constructor: function(chart, options){

        this.base(chart,options);

    },

    create: function(){

        // Size will depend on positioning and font size mainly
    
        if (this.anchor == "top" || this.anchor == "bottom"){
            this.width = this._parent.width;
            this.height = this.titleSize;
        }
        else{
            this.height = this._parent.height;
            this.width = this.titleSize;
        }


        this.pvPanel = this._parent.getPvPanel().add(this.type)
        .width(this.width)
        .height(this.height)

        // Extend title
        this.extend(this.pvPanel,"title_");

        var rotation = {
            top: 0,
            right: Math.PI/2,
            bottom: 0,
            left: -Math.PI/2
        };

        // label
        this.pvLabel = this.pvPanel.add(pv.Label)
        .text(this.title)
        .font(this.font)
        .textAlign("center")
        .textBaseline("middle")
        .bottom(this.height/2)
        .left(this.width/2)
        .textAngle(rotation[this.anchor]);

        // Cases:
        if(this.titleAlign == "center"){
            this.pvLabel
            .bottom(this.height/2)
            .left(this.width/2)
        }
        else{

            this.pvLabel.textAlign(this.titleAlign);

            if ( this.anchor == "top" || this.anchor == "bottom"){

                this.pvLabel.bottom(null).left(null); // reset
                this.pvLabel[this.titleAlign](0)
                .bottom(this.height/2)

            }
            else if (this.anchor == "right"){
                this.titleAlign=="left"?this.pvLabel.bottom(null).top(0):this.pvLabel.bottom(0);
            }
            else if (this.anchor == "left"){
                this.titleAlign=="right"?this.pvLabel.bottom(null).top(0):this.pvLabel.bottom(0);
            }
        }


        // Extend title label
        this.extend(this.pvLabel,"titleLabel_");

    }


});
