/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def
.type('pvc.TreemapChart', pvc.BaseChart)
.add({
    _animatable: false,

    // Create color axis, even if the role is unbound
    // cause we need to check the axis options any way
    _axisCreateIfUnbound: {
        'color': true
    },
    
    _getColorRoleSpec: function() {
        return { 
            defaultSourceRole: 'category', 
            defaultDimension:  'color*'
            /*, requireIsDiscrete: true*/
        };
    },
    
    _initVisualRoles: function() {
        
        this.base();
        
        this._addVisualRole('category', { 
                isRequired: true, 
                defaultDimension: 'category*', 
                autoCreateDimension: true 
            });
            
        this._addVisualRole('size', {
                isMeasure:  true,
                isRequired: false,
                isPercent:  true,
                requireSingleDimension: true, 
                requireIsDiscrete: false,
                valueType: Number, 
                defaultDimension: 'size' 
            });
    },
    
    _getTranslationClass: function(translOptions) {
        return def.type(this.base(translOptions)).add(pvc.data.TreemapChartTranslationOper);
    },
    
    // Consider all datums to be not-null.
    // All measures are optional...
    // @override
    _getIsNullDatum: def.fun.constant(),
    
    _initPlotsCore: function(/*hasMultiRole*/) {
        var treemapPlot = new pvc.visual.TreemapPlot(this);
        
        if(this.options.legend == null) {
            // Only show the legend by default if color mode is byparent
            this.options.legend = treemapPlot.option('ColorMode') === 'byparent';
        }
        
        var rootCategoryLabel = treemapPlot.option('RootCategoryLabel');
        this.visualRoles.category.setRootLabel(rootCategoryLabel);
        this.visualRoles.color   .setRootLabel(rootCategoryLabel);
    },
    
    _initAxes: function(hasMultiRole) {
        if(this.visualRoles.color.isDiscrete()) {
            var isByParent = (this.plots.treemap.option('ColorMode') === 'byparent');

            if(isByParent) {
                // Switch to custom Treemap color-axis class
                // that handles derived colors calculation.
                // Class shared object. Take care to inherit from it before changing.
                if(!def.hasOwnProp.call(this, '_axisClassByType')) {
                    this._axisClassByType = Object.extend(this._axisClassByType);
                }
                this._axisClassByType.color = pvc.visual.TreemapDiscreteByParentColorAxis;
            } else {
                // Revert to default color axis class
                delete this._axisClassByType;
            }
        }
        
        return this.base(hasMultiRole);
    },

    _setAxesScales: function(hasMultiRole) {
        
        this.base(hasMultiRole);
        
        if(!hasMultiRole || this.parent) {
            var sizeAxis = this.axes.size;
            if(sizeAxis && sizeAxis.isBound()) {
                this._createAxisScale(sizeAxis);
                
                // This range has been determined by experimentation.
                // Some ranges result in strange proportions.
                sizeAxis.setScaleRange({min: 100, max: 1000});
            }
        }
    },
    
    _createContent: function(contentOptions) {

        this.base();
        
        var treemapPlot = this.plots.treemap;
        new pvc.TreemapPanel(this, this.basePanel, treemapPlot, contentOptions);
    },
    
    _createVisibleData: function(dataPartValue, ka) {
        var visibleData = this.base(dataPartValue, ka);
        
        // There are no null datums in this chart type (see #_getIsNullDatum) 
        return visibleData ? this.visualRoles.category.select(visibleData, {visible: true}) : null;
    },
    
    defaults: {
        legend: null  // dynamic default, when nully
    }
});
