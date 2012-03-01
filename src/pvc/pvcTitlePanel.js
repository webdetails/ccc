
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
        this.setAnchoredSize(this.titleSize);
        
        this.base();

        // Extend title
        this.extend(this.pvPanel, "title_");

        // Label
        var rotationByAnchor = {
            top: 0,
            right: Math.PI / 2,
            bottom: 0,
            left: -Math.PI / 2
        };

        this.pvLabel = this.pvPanel.add(pv.Label)
            .text(this.title)
            .font(this.font)
            .textAlign("center")
            .textBaseline("middle")
            .bottom(this.height / 2)
            .left(this.width / 2)
            .textAngle(rotationByAnchor[this.anchor]);

        // Cases:
        if (this.titleAlign == "center") {
            this.pvLabel.bottom(this.height / 2).left(this.width / 2);
        } else {
            this.pvLabel.textAlign(this.titleAlign);

            if (this.isAnchorTopOrBottom()) {
                this.pvLabel
                    .bottom(null)
                    .left(null) // reset
                    [this.titleAlign](0)
                    .bottom(this.height / 2);

            } else if (this.anchor == "right") {
                if (this.titleAlign == "left") {
                    this.pvLabel
                        .bottom(null)
                        .top(0);
                } else {
                    this.pvLabel
                        .bottom(0);
                }
            } else if (this.anchor == "left") {
                if (this.titleAlign == "right") {
                    this.pvLabel
                        .bottom(null)
                        .top(0);
                } else {
                    this.pvLabel
                        .bottom(0);
                }
            }
        }

        // Extend title label
        this.extend(this.pvLabel, "titleLabel_");
    }
});
