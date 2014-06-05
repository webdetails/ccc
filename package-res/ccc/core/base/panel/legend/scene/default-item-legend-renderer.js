/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pv_Mark:true */

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
.type('pvc.visual.legend.BulletItemDefaultRenderer', pvc.visual.legend.BulletItemRenderer)
.init(function(keyArgs) {
    this.drawRule = def.get(keyArgs, 'drawRule', false);

    if(this.drawRule) this.rulePvProto = def.get(keyArgs, 'rulePvProto');

    this.drawMarker = !this.drawRule || def.get(keyArgs, 'drawMarker', true);
    if(this.drawMarker) {
        this.markerShape   = def.get(keyArgs, 'markerShape', 'square');
        this.markerPvProto = def.get(keyArgs, 'markerPvProto');
    }
})
.add(/** @lends pvc.visual.legend.BulletItemDefaultRenderer# */{
    drawRule: false,
    drawMarker: true,
    markerShape: null,
    rulePvProto: null,
    markerPvProto: null,

    create: function(legendPanel, pvBulletPanel, extensionPrefix, wrapper) {
        var renderInfo = {},
            drawRule = this.drawRule,
            sceneColorProp = function(scene) { return scene.color; };

        if(drawRule) {
            var rulePvBaseProto = new pv_Mark()
                    .left (0)
                    .top  (function() { return this.parent.height() / 2; })
                    .width(function() { return this.parent.width();      })
                    .lineWidth(1, pvc.extensionTag) // act as if it were a user extension
                    .strokeStyle(sceneColorProp, pvc.extensionTag), // idem
                rp = this.rulePvProto;

            if(rp) rulePvBaseProto = rp.extend(rulePvBaseProto);

            renderInfo.pvRule = new pvc.visual.Rule(legendPanel, pvBulletPanel, {
                    proto: rulePvBaseProto,
                    noSelect: false,
                    noHover:  false,
                    activeSeriesAware: false,// no guarantee that series exist in the scene
                    // extensionPrefix contains "", "2", "3", ...
                    // So the result is something like:
                    // -> "legendRule", "legend$Rule", or
                    // -> "legend2Rule", "legend$Rule", or
                    // -> ...
                    extensionId:   pvc.makeExtensionAbsId('Rule', [extensionPrefix, '$']),
                    showsInteraction: true,
                    wrapper: wrapper
                })
                .pvMark;
        }

        if(this.drawMarker) {
            var markerPvBaseProto = new pv_Mark()
                    // Center the marker in the panel
                    .left(function() { return this.parent.width () / 2; })
                    .top (function() { return this.parent.height() / 2; })
                    // If order of properties is changed, by extension,
                    // dependent properties will not work...
                    .shapeSize(function() { return this.parent.width(); }, pvc.extensionTag) // width <= height
                    .lineWidth(2, pvc.extensionTag)
                    .fillStyle(sceneColorProp, pvc.extensionTag)
                    .strokeStyle(sceneColorProp, pvc.extensionTag)
                    .shape(this.markerShape, pvc.extensionTag)
                    .angle(drawRule ? 0 : Math.PI/2, pvc.extensionTag) // So that 'bar' gets drawn vertically
                    .antialias(function() {
                        var cos = Math.abs(Math.cos(this.angle()));
                        if(cos !== 0 && cos !== 1) {
                            switch(this.shape()) { case 'square': case 'bar': return false; }
                        }
                        return true;
                    }, pvc.extensionTag),
                mp = this.markerPvProto;

            if(mp) markerPvBaseProto = mp.extend(markerPvBaseProto);

            renderInfo.pvDot = new pvc.visual.Dot(legendPanel, pvBulletPanel, {
                    proto:         markerPvBaseProto,
                    freePosition:  true,
                    activeSeriesAware: false, // no guarantee that series exist in the scene
                    noTooltip:     true,
                    noClick:       true, //otherwise the legend panel handles it and triggers the default action (visibility change)
                    // extensionPrefix contains "", "2", "3", ...
                    // So the result is something like:
                    // -> "legendDot", "legend$Dot", or
                    // -> "legend2Dot", "legend$Dot", or
                    // -> ...
                    extensionId:   pvc.makeExtensionAbsId('Dot', [extensionPrefix, '$']),
                    wrapper:       wrapper
                })
                .pvMark;
        }

        return renderInfo;
    }
});
