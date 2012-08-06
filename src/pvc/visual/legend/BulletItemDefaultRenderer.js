
/**
 * Initializes a default legend bullet renderer.
 * 
 * @name pvc.visual.legend.BulletItemDefaultRenderer
 * @class The default bullet renderer.
 * @extends pvc.visual.legend.BulletItemRenderer
 * 
 * @constructor
 * @param {pvc.visual.legend.BulletGroupScene} bulletGroup The parent legend bullet group scene.
 * @param {object} [keyArgs] Optional keyword arguments.
 * @param {string} [keyArgs.drawRule=false] Whether a rule should be drawn.
 * @param {string} [keyArgs.drawMarker=true] Whether a marker should be drawn.
 * When {@link keyArgs.drawRule} is false, then this argument is ignored,
 * because a marker is necessarily drawn.
 * @param {pv.Mark} [keyArgs.markerPvProto] The marker's protovis prototype mark.
 * @param {pv.Mark} [keyArgs.rulePvProto  ] The rule's protovis prototype mark.
 */
def
.type('pvc.visual.legend.BulletItemDefaultRenderer')
.init(function(keyArgs){
    if(!!def.get(keyArgs, 'drawRule', false)){
        this.drawRule = true;
        var rulePvProto = def.get(keyArgs, 'rulePvProto');
        if(rulePvProto){
            this.rulePvProto = rulePvProto;
        }
    }
    
    if(!this.drawRule || !!def.get(keyArgs, 'drawMarker', true)){
        this.drawMarker = true;
        var markerPvProto = def.get(keyArgs, 'markerPvProto');
        if(markerPvProto){
            this.markerPvProto = markerPvProto;
        }
    }
})
.add(/** @lends pvc.visual.legend.BulletItemDefaultRenderer# */{
    drawRule: false,
    drawMarker: false,
    
    rulePvProto: null,
    markerPvProto: null,
    
    create: function(legendPanel, pvBulletPanel){
        var renderInfo = {};
        var drawRule = this.drawRule;
        var sceneColorProp = function(scene){ return scene.color; };
        
        if(drawRule){
            var rulePvBaseProto = new pv.Mark()
                .left (0)
                .top  (function(){ return this.parent.height() / 2; })
                .width(function(){ return this.parent.width();      })
                .lineWidth(1)
                .strokeStyle(sceneColorProp)
                ;
            
            if(this.rulePvProto){
                rulePvBaseProto = this.rulePvProto.extend(rulePvBaseProto);
            }
            
            renderInfo.pvRule = pvBulletPanel.add(pv.Rule).extend(rulePvBaseProto);
        }
        
        if(this.drawMarker){
            var markerPvBaseProto = new pv.Mark()
                // Center the marker in the panel
                .left(function(){ return this.parent.width () / 2; })
                .top (function(){ return this.parent.height() / 2; })
                // If order of properties is changed, by extension, 
                // dependent properties will not work...
                .shape('square')
                .shapeSize(function(){ return this.parent.width(); }) // width <= height
                .lineWidth(function(){ return drawRule && this.shape() !== 'cross' ? 0 : 2; })
                .fillStyle(sceneColorProp)
                .strokeStyle(drawRule ? null : sceneColorProp)
                .angle(drawRule ? 0 : Math.PI/2) // So that 'bar' gets drawn vertically
                .antialias( function(){
                    var cos = Math.abs(Math.cos(this.angle()));
                    if(cos !== 0 && cos !== 1){
                        switch(this.shape()){
                            case 'square':
                            case 'bar':
                                return false;
                        }
                    }
                    
                    return true;
                })
                ;
            
            if(this.markerPvProto){
                markerPvBaseProto = this.markerPvProto.extend(markerPvBaseProto);
            }
            
            renderInfo.pvDot = pvBulletPanel.add(pv.Dot).extend(markerPvBaseProto);
        }
        
        return renderInfo;
    },

    extendMarks: function(legendPanel, renderInfo, extensionPrefix){
        if(renderInfo.pvRule){
            legendPanel.extend(renderInfo.pvRule, extensionPrefix + "Rule_");
        }
        if(renderInfo.pvDot){
            legendPanel.extend(renderInfo.pvDot, extensionPrefix + "Dot_");
        }
    }
});
