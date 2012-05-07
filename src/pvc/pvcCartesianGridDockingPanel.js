
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
                this.xFrameRule = this._createFrameRule(axes.x);
            }

            if(axes.y.options('EndLine')) {
                // Frame lines parallel to y axis
                this.yFrameRule = this._createFrameRule(axes.y);
            }
        }
    },

    _createFrameRule: function(axis){
        var a = axis.options('Position'),
            scale = axis.scale,
            orthoAxis = this._getOrthoAxis(axis.type),
            orthoScale = orthoAxis.scale,
            fullGridCrossesMargin = axis.options('FullGridCrossesMargin'),
            orthoFullGridCrossesMargin = orthoAxis.options('FullGridCrossesMargin')
            ;
        
        var contentPanel = this.chart._mainContentPanel;
        switch(a) {
            case 'right':
                a = 'left';
                break;

            case 'top':
                a = 'bottom';
                break;
        }

        // Frame lines *parallel* to axis rule
        // Example: a = bottom
        var ao  = this.anchorOrtho(a), // left
            aol = this.anchorOrthoLength(a), // height
            al  = this.anchorLength(a), // width

            rulePos1 = contentPanel.position[a] +
                         (orthoFullGridCrossesMargin ? 0 : orthoScale.min),

            rulePos2 = contentPanel.position[a] +
                         (orthoFullGridCrossesMargin ?
                            contentPanel[aol] :
                            orthoScale.max),

            rulePosOrtho = contentPanel.position[ao] + 
                                (fullGridCrossesMargin ? 0 : scale.min),

            ruleLength   = (fullGridCrossesMargin ? contentPanel[al] : (scale.max - scale.min));

        var frameRule = this.pvPanel.add(pv.Rule)
            .data([rulePos1, rulePos2])
            .zOrder(-5)
            .strokeStyle("#808285")
            [a ](function(pos){ return pos; })
            [ao](rulePosOrtho)
            [al](ruleLength)
            [aol](null)
            .svg({ 'stroke-linecap': 'square' })
            ;

        return frameRule;
    },

    _getOrthoAxis: function(type){
        var orthoType = type === 'base' ? 'ortho' : 'base';
        return this.chart.axes[orthoType];
    }
});
