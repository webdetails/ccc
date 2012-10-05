
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
        
        if(!hasMultiRole || this.parent){
            
            var options = this.options;
            
            if(options.secondAxis){
                var axes = this.axes;
                var isStacked = !!options.stacked;
                var nullInterpolationMode = options.nullInterpolationMode;
                var valueRole = this.visualRoles('value');
                
                if(options.secondAxisIndependentScale){
                    // Separate scales =>
                    // axis ortho 0 represents data part 0
                    // axis ortho 1 represents data part 1
                    axes.ortho 
                        .bind({
                            role: valueRole,
                            dataPartValue: '0',
                            isStacked: isStacked
                        });
                    
                    axes.ortho2
                        .bind({
                            role: valueRole,
                            dataPartValue: '1',
                            nullInterpolationMode: nullInterpolationMode
                        });
                } else {
                    // Common scale => 
                    // axis ortho 0 represents both data parts
                    var orthoDataCells = [{
                            role: valueRole,
                            dataPartValue: '0',
                            isStacked: isStacked
                        },
                        {
                            role: valueRole,
                            dataPartValue: '1',
                            nullInterpolationMode: nullInterpolationMode
                        }
                    ];
                    
                    axes.ortho.bind(orthoDataCells);
                    
                    // TODO: Is it really needed to setScale on ortho2???
                    // We set this here also so that we can set a scale later.
                    // This is not used though, cause the scale
                    // will be that calculated by 'ortho'...
                    axes.ortho2.bind(orthoDataCells);
                }
                
                // ------
                
                // TODO: should not this be the default color axes binding of BaseChart??
                var colorRoleName = this.legendSource;
                if(colorRoleName){
                    var colorRole;
                    
                    ['color', 'color2'].forEach(function(axisId){
                        var colorAxis = this.axes[axisId];
                        if(colorAxis){
                            if(!colorRole){
                                colorRole = this.visualRoles(colorRoleName);
                            }
                            
                            colorAxis.bind({
                                role: colorRole,
                                dataPartValue: '' + colorAxis.index
                            });
                        }
                    }, this);
                }
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
        
        return barPanel;
    },
    
    defaults: def.create(pvc.BarAbstract.prototype.defaults, {
        showDots:  true,
        showLines: true,
        showAreas: false
    })
});
