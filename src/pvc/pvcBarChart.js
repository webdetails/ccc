
/**
 * BarChart is the main class for generating... bar charts (another surprise!).
 */
pvc.BarChart = pvc.BarAbstract.extend({

    _processOptionsCore: function(options){
        
        this.base(options);
        
        if(options.secondAxis && !options.showLines && !options.showDots && !options.showAreas){
            options.showLines = true;
        }
    },
    
    _hasDataPartRole: function(){
        return true;
    },
    
    _getAxisDataCells: function(axisType, axisIndex){
        if(this.options.secondAxis){
            var dataPartValues;
            
            if(axisType === 'ortho'){
                // Collect visual roles
                dataPartValues = this.options.secondAxisIndependentScale ?
                    // Separate scales =>
                    // axis ortho 0 represents data 0
                    // axis ortho 1 represents data 1
                    (''+axisIndex) :
                    // Common scale => axis ortho 0 represents both data parts
                    ['0', '1']
                    ;
            } else if(axisType === 'color'){
                dataPartValues = (''+axisIndex);
            }
            
            if(dataPartValues != null){
                return this._buildAxisDataCells(axisType, axisIndex, dataPartValues);
            }
        }
        
        return this.base(axisType, axisIndex);
    },
    
    _isDataCellStacked: function(role, dataPartValue){
        return (!dataPartValue || (dataPartValue === '0')) && this.options.stacked;
    },

    /**
     * @override 
     */
    _createMainContentPanel: function(parentPanel, baseOptions){
        if(pvc.debug >= 3){
            pvc.log("Prerendering in barChart");
        }
        
        var options = this.options;
        var barPanel = new pvc.BarPanel(this, parentPanel, def.create(baseOptions, {
            colorAxis:      this.axes.color,
            dataPartValue:      options.secondAxis ? '0' : null,
            barSizeRatio:       options.barSizeRatio,
            maxBarSize:         options.maxBarSize,
            showValues:         options.showValues,
            valuesAnchor:       options.valuesAnchor,
            orientation:        options.orientation
        }));

        if(options.secondAxis){
            if(pvc.debug >= 3){
                pvc.log("Creating LineDotArea panel.");
            }
            
            var linePanel = new pvc.LineDotAreaPanel(this, parentPanel, def.create(baseOptions, {
                colorAxis:      this.axes.color2,
                dataPartValue:  '1',
                stacked:        false,
                showValues:     !(options.compatVersion <= 1) && options.showValues,
                valuesAnchor:   options.valuesAnchor != 'center' ? options.valuesAnchor : 'right',
                showLines:      options.showLines,
                showDots:       options.showDots,
                showAreas:      options.showAreas,
                orientation:    options.orientation,
                nullInterpolationMode: options.nullInterpolationMode
            }));

            this._linePanel = linePanel;
            
            barPanel._linePanel = linePanel;
        }
        
        return barPanel;
    },
    
    defaults: def.create(pvc.BarAbstract.prototype.defaults, {
        showDots: true,
        showLines: true,
        showAreas: false,
        nullInterpolationMode: 'none'
    })
});
