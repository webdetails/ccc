/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pv_Mark:true */

/**
 * @name pvc.visual.legend.symbolRenderer
 * @function
 * @param {object} [config] Optional configuration arguments.
 * @param {string} [config.drawLine=false] Whether a rule should be drawn.
 * @param {string} [config.drawMarker=true] Whether a marker should be drawn.
 * When <i>config.drawLine</i> is false, then this argument is ignored,
 * because a marker is necessarily drawn.
 * @param {pv.Mark} [config.markerPvProto] The marker's protovis prototype mark.
 * @param {pv.Mark} [config.rulePvProto  ] The rule's protovis prototype mark.
 * @return pvc.visual.legend.LegendSymbolRenderer
 */
def.space('pvc.visual.legend').symbolRenderer = function(config) {

    var drawLine = def.get(config, 'drawLine', false);
    var drawMarker = !drawLine || def.get(config, 'drawMarker', true);
    var rulePvProto = drawLine ? def.get(config, 'rulePvProto') : null;
    var markerShape;
    var markerPvProto;
    var extPrefix = def.array.to(def.get(config, 'extensionPrefix'));

    if(drawMarker) {
        markerShape   = def.get(config, 'markerShape', 'square');
        markerPvProto = def.get(config, 'markerPvProto');
    }

    function createExtIds(id, legacyExtPrefixes) {
        // legacyExtPrefixes contains "", "2", "3", ...
        // So, if id="dot", the result is something like:
        // -> "legendDot", "legend$Dot", or
        // -> "legend2Dot", "legend$Dot", or
        // -> ...
        // After being made absolute by the sign class.

        // NOTE: last has precedence.
        var legacyExtIds = pvc.makeExtensionAbsId(id, legacyExtPrefixes);
        return extPrefix
            ? legacyExtIds.concat(pvc.makeExtensionAbsId(id, extPrefix))
            : legacyExtIds;
    }

    /**
     * Creates the symbol marks in the provided symbol panel.
     * @param {pvc.LegendPanel} legendPanel The legend panel.
     * @param {pv.Panel} pvSymbolPanel The panel into which the symbol marks should be added.
     * <p>
     * The dimensions of this panel, upon each render,
     * provide bounds for drawing each symbol.
     * </p>
     * <p>
     * The properties of marks created as children of this panel will
     * receive a corresponding {@link pvc.visual.legend.LegendItemScene}
     * as first argument.
     * </p>
     * @param {function} [wrapper] A wrapper function suitable for
     * passing to the {@link pvc.visual.Sign} constructor.
     * @param {string} legacyLegendExtensionPrefix The extension prefix for the marks to be created.
     */
    function legendSymbolRenderer(legendPanel, pvSymbolPanel, wrapper, legacyLegendExtensionPrefix) {

        var extensionTag = pvc.extensionTag;
        var sceneColorProp = function(scene) { return scene.color; };
        var legacyExtPrefixes = ['$', legacyLegendExtensionPrefix]; // last has precedence

        if(drawLine) {
            var rulePvBaseProto = new pv_Mark()
                .left (0)
                .top  (function() { return this.parent.height() / 2; })
                .width(function() { return this.parent.width();      })
                .lineWidth(1, extensionTag) // act as if it were a user extension
                .strokeStyle(sceneColorProp, extensionTag) // idem
                .cursor(function(itemScene) { return itemScene.executable() ? "pointer" : "default"});

            if(rulePvProto) rulePvBaseProto = rulePvProto.extend(rulePvBaseProto);

            new pvc.visual.Rule(legendPanel, pvSymbolPanel, {
                proto:    rulePvBaseProto,
                noSelect: false,
                noHover:  false,
                activeSeriesAware: false,// no guarantee that series exist in the scene
                // extensionPrefix contains "", "2", "3", ...
                // So the result is something like:
                // -> "legendRule", "legend$Rule", or
                // -> "legend2Rule", "legend$Rule", or
                // -> ...
                extensionId: createExtIds('Rule', legacyExtPrefixes),
                showsInteraction: true,
                wrapper: wrapper
            });
        }

        if(drawMarker) {
            var markerPvBaseProto = new pv_Mark()
                // Center the marker in the panel
                .left(function() { return this.parent.width () / 2; })
                .top (function() { return this.parent.height() / 2; })

                // If order of properties is changed, by extension,
                // dependent properties will not work...
                .shapeSize(function() { return this.parent.width(); }, extensionTag) // width <= height
                .lineWidth  (2,              extensionTag)
                .fillStyle  (sceneColorProp, extensionTag)
                .strokeStyle(sceneColorProp, extensionTag)
                .shape      (markerShape,    extensionTag)
                .angle(drawLine ? 0 : Math.PI/2, extensionTag) // So that 'bar' gets drawn vertically
                .antialias(function() {
                    var cos = Math.abs(Math.cos(this.angle()));
                    if(cos !== 0 && cos !== 1) {
                        switch(this.shape()) { case 'square': case 'bar': return false; }
                    }
                    return true;
                }, extensionTag)
                .cursor(function(itemScene) { return itemScene.executable() ? "pointer" : "default"});

            if(markerPvProto) markerPvBaseProto = markerPvProto.extend(markerPvBaseProto);

            new pvc.visual.Dot(legendPanel, pvSymbolPanel, {
                proto:         markerPvBaseProto,
                freePosition:  true,
                activeSeriesAware: false, // no guarantee that series exist in the scene
                noTooltip:     true,
                noClick:       true, //otherwise the legend panel handles it and triggers the default action (visibility change)
                extensionId:   createExtIds('Dot', legacyExtPrefixes),
                wrapper:       wrapper
            })
            .pvMark
            .pointingRadiusMax(0);
        }
    }

    return legendSymbolRenderer;
};
