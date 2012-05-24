
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
        this.extend(this.xZeroLine,  "xAxisZeroLine_");
        this.extend(this.yZeroLine,  "yAxisZeroLine_");
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
            if(axes.x.option('EndLine')) {
                // Frame lines parallel to x axis
                this.xFrameRule = this._createFrameRule(axes.x);
            }

            if(axes.y.option('EndLine')) {
                // Frame lines parallel to y axis
                this.yFrameRule = this._createFrameRule(axes.y);
            }

            if(axes.x.option('ZeroLine')) {
                this.xZeroLine = this._createZeroLine(axes.x);
            }

            if(axes.y.option('ZeroLine')) {
                this.yZeroLine = this._createZeroLine(axes.y);
            }
        }
    },

    _createZeroLine: function(axis){
        var scale  = axis.scale,
            domain = scale.domain();

        // Domain crosses zero?
        if(domain[0] * domain[1] <= 0){
            var a = axis.orientation === 'x' ? 'bottom' : 'left',
                ao = this.anchorOrtho(a),
                orthoAxis = this._getOrthoAxis(axis.type),
                orthoScale = orthoAxis.scale,
                orthoFullGridCrossesMargin = orthoAxis.option('FullGridCrossesMargin'),
                contentPanel = this.chart._mainContentPanel,
                zeroPosition = contentPanel.position[ao] + scale(0),
                position = contentPanel.position[a] + 
                            (orthoFullGridCrossesMargin ?
                                0 :
                                orthoScale.offset),

                length   = orthoFullGridCrossesMargin ?
                                    orthoScale.size :
                                    orthoScale.offsetSize;
            
            this.pvZeroLine = this.pvPanel.add(pv.Rule)
                /* zOrder
                 *
                 * TOP
                 * -------------------
                 * Axis Rules:     0
                 * Frame/EndLine: -5
                 * Line/Dot/Area Content: -7
                 * ZeroLine:      -9   <<------
                 * Content:       -10 (default)
                 * FullGrid:      -12
                 * -------------------
                 * BOT
                 */
                .zOrder(-9)
                .strokeStyle("#808285")
                [a](position)
                [this.anchorOrthoLength(a)](length)
                [this.anchorLength(a)](null)
                [ao](zeroPosition)
                //.svg(null)
                ;
        }
    },

    _createFrameRule: function(axis){
        var a = axis.option('Position'),
            scale = axis.scale,
            orthoAxis = this._getOrthoAxis(axis.type),
            orthoScale = orthoAxis.scale,
            fullGridCrossesMargin = axis.option('FullGridCrossesMargin'),
            orthoFullGridCrossesMargin = orthoAxis.option('FullGridCrossesMargin')
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
