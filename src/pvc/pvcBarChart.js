
/**
 * BarChart is the main class for generating... bar charts (another surprise!).
 */
pvc.BarChart = pvc.BarAbstract.extend({

    constructor: function(options){

        this.base(options);

        // Apply options
        pvc.mergeDefaults(this.options, pvc.BarChart.defaultOptions, options);
    },
    
    _processOptionsCore: function(options){
        
        this.base(options);
        
        if(options.secondAxis && !options.showLines && !options.showDots && !options.showAreas){
            options.showLines = true;
        }
    },
    
    _hasDataPartRole: function(){
        return true;
    },

    _getAxisDataParts: function(axis){
        if(this.options.secondAxis && axis.type === 'ortho'){
            if(this.options.secondAxisIndependentScale){
                // Separate scales =>
                // axis ortho 0 represents data 0
                // axis ortho 1 represents data 1
                return (''+axis.index);
            }

            // Common scale => axis ortho 0 represents both data parts
            return ['0', '1'];
        }

        // The base axis represents categories of all data parts
        return null;
    },
    
    _isDataCellStacked: function(role, dataPartValue){
        return !dataPartValue || (dataPartValue === '0') ? this.options.stacked : false;
    },

    /**
     * @override 
     */
    _createMainContentPanel: function(parentPanel){
        if(pvc.debug >= 3){
            pvc.log("Prerendering in barChart");
        }
        
        var options = this.options;
        var barPanel = new pvc.BarPanel(this, parentPanel, {
            dataPartValue:  options.secondAxis ? '0' : null,
            barSizeRatio: options.barSizeRatio,
            maxBarSize:   options.maxBarSize,
            showValues:   options.showValues,
            valuesAnchor: options.valuesAnchor,
            orientation:  options.orientation
        });

        if(options.secondAxis){
            if(pvc.debug >= 3){
                pvc.log("Creating LineDotArea panel.");
            }
            
            var linePanel = new pvc.LineDotAreaPanel(this, parentPanel, {
                dataPartValue:  '1',
                stacked:        false,
                showValues:     !(options.compatVersion <= 1) && options.showValues,
                valuesAnchor:   options.valuesAnchor != 'center' ? options.valuesAnchor : 'right',
                showLines:      options.showLines,
                showDots:       options.showDots,
                showAreas:      options.showAreas,
                orientation:    options.orientation,
                nullInterpolationMode: options.nullInterpolationMode
            });

            this._linePanel = linePanel;
            
            barPanel._linePanel = linePanel;
        }
        
        return barPanel;
    }
}, {
    defaultOptions: {
        showDots: true,
        showLines: true,
        showAreas: false,
        nullInterpolationMode: 'none'
    }
});
