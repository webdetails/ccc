
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
            var xAxis = axes.x;
            var yAxis = axes.y;
            
            if(xAxis.option('EndLine')) {
                // Frame lines parallel to x axis
                this.xFrameRule = this._createFrameRule(xAxis);
            }

            if(yAxis.option('EndLine')) {
                // Frame lines parallel to y axis
                this.yFrameRule = this._createFrameRule(yAxis);
            }

            if(xAxis.scaleType === 'Continuous' && xAxis.option('ZeroLine')) {
                this.xZeroLine = this._createZeroLine(xAxis);
            }

            if(yAxis.scaleType === 'Continuous' && yAxis.option('ZeroLine')) {
                this.yZeroLine = this._createZeroLine(yAxis);
            }
        }
    },

    _createZeroLine: function(axis){
        var scale = axis.scale;
        if(!scale.isNull){
            var domain = scale.domain();
    
            // Domain crosses zero?
            if(domain[0] * domain[1] <= 0){
                var a   = axis.orientation === 'x' ? 'bottom' : 'left',
                    al  = this.anchorLength(a),
                    ao  = this.anchorOrtho(a),
                    aol = this.anchorOrthoLength(a),
                    orthoAxis = this._getOrthoAxis(axis.type),
                    orthoScale = orthoAxis.scale,
                    orthoFullGridCrossesMargin = orthoAxis.option('FullGridCrossesMargin'),
                    contentPanel = this.chart._mainContentPanel,
                    zeroPosition = contentPanel.position[ao] + scale(0),
                    position = contentPanel.position[a] + 
                                (orthoFullGridCrossesMargin ?
                                    0 :
                                    orthoScale.offset),
    
                    olength   = orthoFullGridCrossesMargin ?
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
                    [aol](olength)
                    [al](null)
                    [ao](zeroPosition)
                    //.svg(null)
                    ;
            }
        }
    },

    _createFrameRule: function(axis){
        var orthoAxis = this._getOrthoAxis(axis.type);
        var orthoScale = orthoAxis.scale;
        if(orthoScale.isNull){
            // Can only hide if the second axis is null as well 
            var orthoAxis2 = this.chart.axes[pvc.visual.CartesianAxis.getId(orthoAxis.type, 1)];
            if(!orthoAxis2 || orthoAxis2.scale.isNull){
                return;
            }
            
            orthoScale = orthoAxis2;
        }
        
        var a = axis.option('Position');
        var scale = axis.scale;
        if(scale.isNull){
            // Can only hide if the second axis is null as well 
            var axis2 = this.chart.axes[pvc.visual.CartesianAxis.getId(axis.type, 1)];
            if(!axis2 || axis2.scale.isNull){
                return;
            }
        }
        
        var fullGridCrossesMargin = axis.option('FullGridCrossesMargin');
        var orthoFullGridCrossesMargin = orthoAxis.option('FullGridCrossesMargin');
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
