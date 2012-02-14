
/**
 * Base panel. 
 * A lot of them will exist here, with some common properties. 
 * Each class that extends pvc.base will be 
 * responsible to know how to use it.
 */
pvc.BasePanel = pvc.Abstract.extend({

    chart: null,
    _parent: null,
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
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
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
            .width(this.width)
            .height(this.height);
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

        this._parent = parent;
        this.create();
        this.applyExtensions();

        // Reduce size and update margins
        var a = this.anchor,
            ao = this.anchorOrtho(),
            isTopOrBottom = this.isAnchorTopOrBottom(),
            margins = this._parent.margins;

        if (isTopOrBottom) {
            this._parent.height -= this.height;
        } else {
            this._parent.width -= this.width;
        }

        // See where to attach it.
        this.pvPanel[a ](margins[a ]);
        this.pvPanel[ao](margins[ao]);

        // update margins
        if (isTopOrBottom) {
            margins[a] += this.height;
        } else {
            margins[a] += this.width;
        }
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
     * Sets the size for the panel, 
     * for when the parent panel is undefined
     */
    setSize: function(w, h) {
        this.width = w;
        this.height = h;
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

/*
 * Title panel. Generates the title. Specific options are: <i>title</i> - text.
 * Default: null <i>titlePosition</i> - top / bottom / left / right. Default:
 * top <i>titleSize</i> - The size of the title in pixels. Default: 25
 * 
 * Has the following protovis extension points:
 * 
 * <i>title_</i> - for the title Panel <i>titleLabel_</i> - for the title
 * Label
 */
pvc.TitlePanel = pvc.BasePanel.extend({

    pvLabel: null,
    anchor: "top",
    titlePanel: null,
    title: null,
    titleSize: 25,
    titleAlign: "center",
    font: "14px sans-serif",

//    constructor: function(chart, options) {
//        this.base(chart, options);
//    },

    create: function() {
        // Size will depend on positioning and font size mainly
        var isTopOrBottom = this.isAnchorTopOrBottom();
        if (isTopOrBottom) {
            this.width = this._parent.width;
            this.height = this.titleSize;
        } else {
            this.height = this._parent.height;
            this.width = this.titleSize;
        }

        this.pvPanel = this._parent.getPvPanel().add(this.type).width(
                this.width).height(this.height);

        // Extend title
        this.extend(this.pvPanel, "title_");

        // Label
        var rotationByAnchor = {
            top: 0,
            right: Math.PI / 2,
            bottom: 0,
            left: -Math.PI / 2
        };

        this.pvLabel = this.pvPanel.add(pv.Label).text(this.title).font(
                this.font).textAlign("center").textBaseline("middle").bottom(
                this.height / 2).left(this.width / 2).textAngle(
                rotationByAnchor[this.anchor]);

        // Cases:
        if (this.titleAlign == "center") {
            this.pvLabel.bottom(this.height / 2).left(this.width / 2);
        } else {

            this.pvLabel.textAlign(this.titleAlign);

            if (isTopOrBottom) {
                this.pvLabel.bottom(null).left(null) // reset
                [this.titleAlign](0).bottom(this.height / 2);

            } else if (this.anchor == "right") {
                if (this.titleAlign == "left") {
                    this.pvLabel.bottom(null).top(0);
                } else {
                    this.pvLabel.bottom(0);
                }
            } else if (this.anchor == "left") {
                if (this.titleAlign == "right") {
                    this.pvLabel.bottom(null).top(0);
                } else {
                    this.pvLabel.bottom(0);
                }
            }
        }

        // Extend title label
        this.extend(this.pvLabel, "titleLabel_");
    }
});
