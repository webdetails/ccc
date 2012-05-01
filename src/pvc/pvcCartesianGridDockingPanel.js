
pvc.CartesianGridDockingPanel = pvc.GridDockingPanel.extend({
    /**
     * @override
     */
    applyExtensions: function(){
        this.base();

        // Extend body
        this.extend(this.pvPanel,    "content_");
        this.extend(this.xFrameRule, "xAxisEndLine_");
        this.extend(this.yFrameRule, "yAxisEndLine_");
    },

    /**
     * Initializes the content's frame layer panel.
     * @override
     */
    initLayerPanel: function(pvPanel, layer){
        if(layer === 'frame'){
            // Below axis, at zOrder 30, and above content, at zOrder 0/-10
            pvPanel.zOrder(20);
        }
    },

    /**
     * @override
     */
    _createCore: function(layoutInfo){

        this.base(layoutInfo);

        var chart = this.chart,
            contentPanel = chart._mainContentPanel;
        if(contentPanel) {
            var axes = chart.axes;
            if(axes.x.options('EndLine')) {
                // Frame lines parallel to x axis
                this.xFrameRule = this._createFrameRule(axes.x.options('Position'));
            }

            if(axes.y.options('EndLine')) {
                // Frame lines parallel to y axis
                this.yFrameRule = this._createFrameRule(axes.y.options('Position'));
            }
        }
    },

    _createFrameRule: function(a){
        var contentPanel = this.chart._mainContentPanel;
        switch(a) {
            case 'right':
                a = 'left';
                break;

            case 'top':
                a = 'bottom';
                break;
        }

        // Frame lines parallel to x axis
        var ao  = this.anchorOrtho(a);
            aol = this.anchorOrthoLength(a);
            al  = this.anchorLength(a),
            rulePos1     = contentPanel.position[a],
            rulePos2     = rulePos1 + contentPanel[aol],
            rulePosOrtho = contentPanel.position[ao],
            ruleLength   = contentPanel[al];

        var frameRule = this.pvPanel.add(pv.Rule)
            .data([rulePos1, rulePos2])
            .zOrder(-5)
            .strokeStyle("#f0f0f0")
            [a ](function(pos){ return pos; })
            [ao](rulePosOrtho)
            [al](ruleLength)
            [aol](null)
            ;

        return frameRule;
    }
});
