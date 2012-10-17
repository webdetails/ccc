
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
    
    _bindAxes: function(hasMultiRole){
    
        var options = this.options;
        
        var trend = options.trendType;
        if(trend === 'none'){
            trend = null;
        }
        
        if(options.secondAxis){
            var axes = this.axes;
            var isStacked = !!options.stacked;
            var nullInterpolationMode = options.nullInterpolationMode;
            var valueRole = this.visualRoles('value');
            var orthoDataCells;
            if(options.secondAxisIndependentScale){
                // Separate scales =>
                // axis ortho 0 represents data part 0 + trend (if any)
                // axis ortho 1 represents data part 1
                orthoDataCells = [{
                    role: valueRole,
                    dataPartValue: '0',
                    isStacked: isStacked,
                    trendType: trend
                }];
                
                if(trend){
                    // The scale must be big enough for the trend data
                    orthoDataCells.push({
                        role: valueRole,
                        dataPartValue: 'trend'
                    });
                }
                
                axes.ortho.bind(orthoDataCells);
                
                // Regression is not applied to the lines 
                axes.ortho2
                    .bind({
                        role: valueRole,
                        dataPartValue: '1',
                        nullInterpolationMode: nullInterpolationMode
                    });
                
            } else {
                // Common scale => 
                // axis ortho 0 represents both data parts
                orthoDataCells = [{
                        role: valueRole,
                        dataPartValue: '0',
                        isStacked: isStacked,
                        trendType: trend
                    },
                    {
                        role: valueRole,
                        dataPartValue: '1',
                        nullInterpolationMode: nullInterpolationMode
                    }
                ];
                
                if(trend){
                    // The scale must be big enough for the trend data
                    orthoDataCells.push({
                        role: valueRole,
                        dataPartValue: 'trend'
                    });
                }
                
                axes.ortho.bind(orthoDataCells);
                
                // TODO: Is it really needed to setScale on ortho2???
                // We set this here also so that we can set a scale later.
                // This is not used though, cause the scale
                // will be that calculated by 'ortho'...
                axes.ortho2.bind(orthoDataCells);
            }
        }
        
        this.base(hasMultiRole);
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
            orientation:        options.orientation,
            showOverflowMarkers: options.showOverflowMarkers
        }));

        // legacy field
        this.barChartPanel = barPanel;
        
        if(options.secondAxis){
            if(pvc.debug >= 3){
                pvc.log("Creating LineDotArea panel.");
            }
            
            var linePanel = new pvc.LineDotAreaPanel(this, parentPanel, def.create(baseOptions, {
                extensionPrefix: 'second',
                colorAxis:      this.axes.color2,
                dataPartValue:  '1',
                stacked:        false,
                showValues:     (this.compatVersion() > 1) && options.showValues,
                valuesAnchor:   options.valuesAnchor != 'center' ? options.valuesAnchor : 'right',
                showLines:      options.showLines,
                showDots:       options.showDots,
                showAreas:      options.showAreas,
                orientation:    options.orientation
            }));

            this._linePanel = linePanel;
            
            // Legacy fields
            barPanel.pvSecondLine = linePanel.pvLine;
            barPanel.pvSecondDot  = linePanel.pvDot ;
            
            barPanel._linePanel = linePanel;
        }
        
        var trend = options.trendType;
        if(trend && trend !== 'none'){
            if(pvc.debug >= 3){
                pvc.log("Creating Trends LineDotArea panel.");
            }
            
            var trendLinePanel = new pvc.LineDotAreaPanel(this, parentPanel, def.create(baseOptions, {
                extensionPrefix: 'trend',
                colorAxis:       this.axes.color2, // TODO TRENDS
                dataPartValue:   'trend',
                stacked:         false,
                showValues:      options.trendShowValues,
                valuesAnchor:    options.trendValuesAnchor,
                showLines:       options.trendShowLines,
                showDots:        options.trendShowDots,
                showAreas:       options.trendShowAreas,
                orientation:     options.orientation
            }));
        }
        
        return barPanel;
    },
    
    defaults: def.create(pvc.BarAbstract.prototype.defaults, {
        showDots:  true,
        showLines: true,
        showAreas: false
    })
});
