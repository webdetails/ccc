/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_colorIsGray:true */
def
.type('pvc.visual.DotSizeColor', pvc.visual.Dot)
.init(function(panel, parentMark, keyArgs) {

    this.base(panel, parentMark, keyArgs);

    var isV1Compat = this.compatVersion() <= 1;
    
    this._bindProperty('lineWidth', 'strokeWidth')
        .intercept('visible', function(scene) {
            if(!this.canShow(scene)) return false;

            var visible = this.delegateExtension();
            return visible == null
                ? (isV1Compat || this.defaultVisible(scene))
                : visible;
        });
    
    this._initColor();
    this._initSize();
    
    if(this.isSizeBound) {
        var sizeAxis = panel.axes.size;
        if(sizeAxis.scaleUsesAbs()) {
            this.isSizeAbs = true;
            
            // Override current default scene color
            var baseSceneDefColor = this._sceneDefColor;
            this._sceneDefColor = function(scene, type) {
                return type === 'stroke' && scene.vars.size.value < 0
                    ? pv.Color.names.black
                    : baseSceneDefColor.call(this, scene, type);
            };
            
            this.pvMark
                .lineCap('round') // only used by strokeDashArray
                .strokeDasharray(function(scene) {
                    return scene.vars.size.value < 0 ? 'dash' : null; // '-'
                });
        }
    }
})
.prototype
.property('strokeWidth')
.constructor
.add({
    isColorBound: false,
    isColorDiscrete: false,
    isSizeBound:  false,
    isSizeAbs:    false,

    canShow: function(scene) { return !scene.isIntermediate; },

    defaultVisible: function(scene) {
        return !scene.isNull && 
               ((!this.isSizeBound && !this.isColorBound) ||
                (this.isSizeBound  && scene.vars.size.value  != null) ||
                (this.isColorBound && (this.isColorDiscrete || scene.vars.color.value != null)));
    },

    _initColor: function() {
        // TODO: can't most of this be incorporated in the sizeAxis code
        // or in Sign#_initDefColorScale ??
        var colorConstant,
            sceneColorScale,
            panel = this.panel,
            colorRole = panel.visualRoles.color;
        if(colorRole) {
            this.isColorDiscrete = colorRole.isDiscrete();
            
            var colorAxis = panel.axes.color;
            
            // Has at least one value? (possibly null, in discrete scales)
            if(colorRole.isBound()) { // => colorAxis
                this.isColorBound = true;
                sceneColorScale = colorAxis.sceneScale({sceneVarName: 'color'});
            } else if(colorAxis) {
                colorConstant = colorAxis.option('Unbound');
            }
        }

        this._sceneDefColor = sceneColorScale || def.fun.constant(colorConstant || pvc.defaultColor);
    },

    _initSize: function() {
        var panel = this.panel,
            plot  = panel.plot,
            shape = plot.option('Shape'),
            nullSizeShape = plot.option('NullShape'),
            sizeRole = panel.visualRoles.size,
            sceneSizeScale, sceneShapeScale;

        if(sizeRole) {
            var sizeAxis  = panel.axes.size,
                sizeScale = sizeAxis && sizeAxis.scale,
                isSizeBound = !!sizeScale && sizeRole.isBound();
            if(isSizeBound) {
                this.isSizeBound = true;
                
                var missingSize = sizeScale.min + (sizeScale.max - sizeScale.min) * 0.05; // 10% size
                this.nullSizeShapeHasStrokeOnly = (nullSizeShape === 'cross');
                
                sceneShapeScale = function(scene) {
                    return scene.vars.size.value != null ? shape : nullSizeShape;
                };
                
                sceneSizeScale = function(scene) {
                    var sizeValue = scene.vars.size.value;
                    return sizeValue != null ? sizeScale(sizeValue) :
                           nullSizeShape     ? missingSize :
                           0;
                };
            }
        }

        if(!sceneSizeScale) {
            // => !isSizeBound
            sceneShapeScale = def.fun.constant(shape);
            sceneSizeScale  = function(scene) { return this.base(scene); };
        }
        
        this._sceneDefSize  = sceneSizeScale;
        this._sceneDefShape = sceneShapeScale;
    },

    // Taken from MetricPoint.pvDot.defaultColor:
    //  When no lines are shown, dots are shown with transparency,
    //  which helps in distinguishing overlapped dots.
    //  With lines shown, it would look strange.
    //  ANALYZER requirements, so until there's no way to configure it...
    //  TODO: this probably can now be done with ColorTransform
    //  if(!me.linesVisible) {
    //     color = color.alpha(color.opacity * 0.85);
    //  }
    defaultColor: function(scene, type) { return this._sceneDefColor(scene, type); },

    normalColor: function(scene, color, type) {
        // When normal, the stroke shows a darker color
        return type === 'stroke' ? color.darker() : this.base(scene, color, type);
    },

    interactiveColor: function(scene, color, type) {
        if(this.mayShowActive(scene, /*noSeries*/true)) {
            switch(type) {
                case 'fill':   return this.isSizeBound ? color.alpha(0.75) : color;
                
                // When active, the stroke shows a darker color, as well
                case 'stroke': return color.darker();
            }
        } else if(this.showsSelection()) {
            var isSelected = scene.isSelected(),
                notAmongSelected = !isSelected && scene.anySelected();
            if(notAmongSelected) {
                if(this.mayShowActive(scene)) return color.alpha(0.8);

                switch(type) {
                    // Metric sets an alpha while HG does not
                    case 'fill':   return this.dimColor(color, type);
                    case 'stroke': return color.alpha(0.45);
                }
            }

            if(isSelected && pvc_colorIsGray(color))
                return type === 'stroke' ? color.darker(3) : color.darker(2);
        }

        // When some active that's not me, the stroke shows a darker color, as well
        if(type === 'stroke') return color.darker();
        
        // show base color
        return color;
    },

    defaultSize: function(scene) { return this._sceneDefSize(scene); },

    defaultShape: function(scene) { return this._sceneDefShape(scene); },

    interactiveSize: function(scene, size) {
        if(!this.mayShowActive(scene, /*noSeries*/true)) return size;

        // At least 1 px, no more than 10% of the radius, and no more that 3px.
        var radius    = Math.sqrt(size),
            radiusInc = Math.max(1, Math.min(1.1 * radius, 2));
        return def.sqr(radius + radiusInc);
    },

    defaultStrokeWidth: function(scene) {
        return (this.nullSizeShapeHasStrokeOnly && scene.vars.size.value == null) ? 1.8 : 1;
    },

    interactiveStrokeWidth: function(scene, width) {
        return this.mayShowActive(scene, /*noSeries*/true) ? (2 * width) :
               this.mayShowSelected(scene) ? (1.5 * width) :
               width;
    }
});
