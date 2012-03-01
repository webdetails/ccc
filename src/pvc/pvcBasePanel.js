
/**
 * Base panel. 
 * A lot of them will exist here, with some common properties. 
 * Each class that extends pvc.base will be 
 * responsible to know how to use it.
 */
pvc.BasePanel = pvc.Abstract.extend({

    chart: null,
    _parent: null,
    _children: null,
    type: pv.Panel, // default one
    height: null,
    width: null,
    anchor: "top",
    pvPanel: null,
    fillColor: "red",
    margins: null,

    constructor: function(chart, options) {

        this.chart = chart;

        $.extend(this, options);

        this.margins = {
            top:    0,
            right:  0,
            bottom: 0,
            left:   0
        };
    },

    create: function() {

        if (!this._parent) {
            // Should be created for the vis panel only
            this.pvPanel = new pv.Panel();
            //this.extend(this.pvPanel, "base_");
        } else {
            this.pvPanel = this._parent.pvPanel.add(this.type);
        }
        
        this.pvPanel
            .width(this._originalSize.width)
            .height(this._originalSize.height);
    },

    /**
     * Adds a panel to children array.
     */
    _addChild: function(child){
        if(child._parent){
            throw new Error("Child already has a parent.");
        }
        
        child._parent = this;
        (this._children || (this._children = [])).push(child);
    },

    /**
     * Create the panel, appending it to the previous one using
     * a specified anchor.
     *
     * Will: 
     * 1) create the panel
     * 2) subtract it's size from the previous panel's size 
     * 3) append it to the previous one in the correct position.
     */
    appendTo: function(parent) {
        if(parent){
            parent._addChild(this);
        }
        
        this.create();
        this.applyExtensions();

        // Layout child
        var a = this.anchor,
            ao = this.anchorOrtho(),
            aol = this.anchorOrthoLength(),
            margins = this._parent.margins;

        this._parent[aol] -= this[aol];

        // Place the child
        this.pvPanel[a ](margins[a ]);
        this.pvPanel[ao](margins[ao]);

        margins[a] += this[aol];
    },
    
    /**
     * Override to apply specific extensions points.
     * @virtual
     */
    applyExtensions: function(){
        if (!this._parent) {
            this.extend(this.pvPanel, "base_");
        }
    },

    /**
     * This is the method to be used for the extension points
     * for the specific contents of the chart. already ge a pie
     * chart! Goes through the list of options and, if it
     * matches the prefix, execute that method on the mark.
     * WARNING: It's the user's responsibility to make sure that
     * unexisting methods don't blow this.
     */
    extend: function(mark, prefix) {
        this.chart.extend(mark, prefix);
    },

    /**
     * Obtains the specified extension point.
     * Arguments are concatenated with '_'.
     */
    _getExtension: function(extPoint) {
        return this.chart._getExtension.apply(this.chart, arguments);
    },

    /**
     * Called when a render has ended.
     * When the render performed an animation
     * and the 'animated' argument will have the value 'true'.
     *
     * The default implementation calls each child panel's
     * #_onRenderEnd method.
     * @virtual
     */
    _onRenderEnd: function(animated){
        if(this._children){
            this._children.forEach(function(child){
                child._onRenderEnd(animated);
            });
        }
    },
    
    /**
     * Sets the size for the panel, 
     * for when the parent panel is undefined
     */
    setSize: function(w, h) {
        this.width  = w;
        this.height = h;

        this._originalSize = {
            width:  w,
            height: h
        };
    },

    setAnchoredSize: function(size){
        if (this.isAnchorTopOrBottom()) {
            this.setSize(this._parent.width, size);
        } else {
            this.setSize(size, this._parent.height);
        }
    },

    /**
     * Returns the width of the Panel
     */
    getWidth: function() {
        return this.width;
    },

    /**
     * Returns the height of the Panel
     */
    getHeight: function() {
        return this.height;
    },
    
    setWidth: function(w) {
        this.width = w;

        (this._originalSize || (this._originalSize = {})).width = w;
    },
    
    setHeight: function(h) {
        this.height = h;

        (this._originalSize || (this._originalSize = {})).height = h;
    },

    consumeFreeClientSize: function(){
        if(this._parent){
            this.setSize(this._parent.width, this._parent.height);
        }
    },

    /**
     * Sets the margins of the panel.
     * Must be called after #setSize and before any child panels are added.
     */
    setMargins: function(margins){
        var m = margins.all;
        if(m != null){
            var allEqualMargins = pv.dict(Object.keys(this.margins), function(){ return m; });
            this.setMargins(allEqualMargins);
        } else {
            for(var anchor in margins){
                if(this.margins.hasOwnProperty(anchor)){
                    m = +margins[anchor]; // -> to number
                    if(m >= 0){
                        this.margins[anchor] = m;
                        this[this.anchorOrthoLength(anchor)] -= m;
                    }
                }
            }
        }
    },

    /**
     * Returns the underlying protovis Panel.
     * If 'layer' is specified returns
     * the protovis panel for the specified layer name.
     */
    getPvPanel: function(layer) {
        if(!layer){
            return this.pvPanel;
        }

        if(!this._parent){
            throw new Error("Layers are not possible on a root panel.");
        }

        if(!this.pvPanel){
            throw new Error(
               "Cannot access layer panels without having created the main panel.");
        }

        var pvPanel = null;
        if(!this._layers){
            this._layers = {};
        } else {
            pvPanel = this._layers[layer];
        }

        if(!pvPanel){
            pvPanel = this._parent.pvPanel.add(this.type)
                            .extend(this.pvPanel);

            this.initLayerPanel(pvPanel, layer);

            this._layers[layer] = pvPanel;
        }

        return pvPanel;
    },
    
    /**
     * Initializes a new layer panel.
     * @virtual
     */
    initLayerPanel: function(pvPanel, layer){
    },

    _createPropDatumTooltip: function(){
        var myself = this,
            tooltipFormat = this.chart.options.tooltipFormat;

        return function(){
            // TODO: for the no series case... 's' assumes the value "Series"
            // added by the translator
            var tooltip = '',
                datum = this.datum();
            if(datum){
                tooltip = datum.value;
                if(tooltipFormat){
                    var s = datum.elem.series.rawValue,
                        c = datum.elem.category.rawValue;

                    tooltip = tooltipFormat.call(myself, s, c, tooltip, datum);
                }
            }

            return tooltip;
        };
    },

    /**
     * Returns true if the anchor is one of the values 'top' or
     * 'bottom'.
     */
    isAnchorTopOrBottom: function(anchor) {
        if (!anchor) {
            anchor = this.anchor;
        }
        return anchor === "top" || anchor === "bottom";
    },

    anchorOrtho: function(anchor) {
        if (!anchor) {
            anchor = this.anchor;
        }
        return pvc.BasePanel.relativeAnchor[anchor];
    },

    anchorOrthoMirror: function(anchor) {
        if (!anchor) {
            anchor = this.anchor;
        }
        return pvc.BasePanel.relativeAnchorMirror[anchor];
    },

    anchorOpposite: function(anchor) {
        if (!anchor) {
            anchor = this.anchor;
        }
        return pvc.BasePanel.oppositeAnchor[anchor];
    },

    anchorLength: function(anchor) {
        if (!anchor) {
            anchor = this.anchor;
        }
        return pvc.BasePanel.parallelLength[anchor];
    },

    anchorOrthoLength: function(anchor) {
        if (!anchor) {
            anchor = this.anchor;
        }
        return pvc.BasePanel.orthogonalLength[anchor];
    },

    isOrientationVertical: function(orientation) {
        return this.chart.isOrientationVertical(orientation);
    },

    isOrientationHorizontal: function(orientation) {
        return this.chart.isOrientationHorizontal(orientation);
    }
}, {
    // Determine what is the associated method to
    // call to position the labels correctly
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

    oppositeAnchor: {
        top: "bottom",
        bottom: "top",
        left: "right",
        right: "left"
    },

    parallelLength: {
        top: "width",
        bottom: "width",
        right: "height",
        left: "height"
    },

    orthogonalLength: {
        top: "height",
        bottom: "height",
        right: "width",
        left: "width"
    }
});
