/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var DEFAULT_BG_COLOR = pv.Color.names.white;

def
.type('pvc.visual.ValueLabel', pvc.visual.Label)
.init(function(panel, anchorMark, keyArgs) {
    
    this.valuesFont = def.get(keyArgs, 'valuesFont') || panel.valuesFont;
    this.valuesMask = def.get(keyArgs, 'valuesMask') || panel.valuesMask;
    this.valuesOptimizeLegibility = def.get(keyArgs, 'valuesOptimizeLegibility', panel.valuesOptimizeLegibility);
    this.valuesOverflow = def.get(keyArgs, 'valuesOverflow', panel.valuesOverflow);

    // Cached
    this.hideOverflowed = this.valuesOverflow === 'hide';
    this.trimOverflowed = !this.hideOverflowed && this.valuesOverflow === 'trim';
    this.hideOrTrimOverflowed = this.hideOverflowed || this.trimOverflowed;

    var protoMark = def.get(keyArgs, 'noAnchor', false)
        ? anchorMark
        : anchorMark.anchor(panel.valuesAnchor);

    if(keyArgs && keyArgs.extensionId == null) keyArgs.extensionId = 'label';

    this.base(panel, protoMark, keyArgs);

    this.pvMark.font(this.valuesFont);

    this._bindProperty('text', 'text')
        ._bindProperty('textStyle', 'textColor', 'color')
        .intercept('visible', this.visible);
})
.prototype
.property('text')
.property('textStyle')
.constructor
.addStatic({
    maybeCreate: function(panel, anchorMark, keyArgs) {
        return panel.valuesVisible && panel.valuesMask
            ? new pvc.visual.ValueLabel(panel, anchorMark, keyArgs)
            : null;
    },

    isNeeded: function(panel) { return panel.valuesVisible && panel.valuesMask; }
})
.add({
    _addInteractive: function(keyArgs) {
        // TODO: Until the problem of tooltips being stolen
        // from the target element, its better to not process events.
        keyArgs = def.setDefaults(keyArgs,
            'showsInteraction', true,
            'noSelect',      true,  //false,
            'noTooltip',     true,  //false,
            'noClick',       true,  //false,
            'noDoubleClick', true,  //false,
            'noHover',       true); //false
        
        this.base(keyArgs);
    },
    
    visible: function(scene) {
        // If the anchored to mark is not visible, hide ourselves.
        var anchoredToMark = this.getAnchoredToMark();
        if(anchoredToMark && !anchoredToMark.visible()) return false;

        if(!this.hideOrTrimOverflowed) return this.delegate(true);

        // -----------

        // Ask the user.
        var visible;
        if(this.hasDelegate(pvc.extensionTag)) {
            // Explicit user extension point override? Respect that.
            // Because the user may decide to show a label even if our hide/show rules
            // would hide it, it means that we might need to trim the text even 
            // if its height wouldn't fit... Thus, textFitInfo should have information
            // for twMax, whenever possible, even when hide is also true.
            visible = this.delegateExtension();
            if(visible != null) return visible;
        }

        // If some base class or proto says we should hide, 
        // respect that (ex: treemap).
        visible = this.delegateNotExtension();
        if(visible === false) return false;

        // Otherwise apply our own logic.

        // When being hovered, show all the text, 
        // so the user can see what's normally hidden/trimmed.
        if(scene.isActive && this.showsActivity()) return true;

        var fitInfo = this.textFitInfo(scene);
        return !(fitInfo && fitInfo.hide);
    },

    // Obtains the text fit info for a given scene,
    // if the scene's label placement is supported, or null, otherwise.
    textFitInfo: function(scene) {
        var state = scene.renderState,
            fitInfo = state.textFitInfo;
        return fitInfo !== undefined
            ? fitInfo
            // Cannot use pvLabel.text() here, cause trimming would affect measurements.
            : (state.textFitInfo = this.calcTextFitInfo(scene, this._evalBaseText()) || null);
    },

    // Determines the text overflow info for a given scene.
    // If the scene's label placement is not supported, return nully.
    // The default implementation returns null.
    calcTextFitInfo: function(scene, text) {
        return null;
    },

    // -----------

    _evalBaseText: function() {
        // This evaluates #baseText with the same context 
        // that exists when #text is evaluated (by calling pvLabel.text()).
        var pvLabel = this.pvMark,
            // pdelegate is #defaultText or the user specified extension point property.
            pdelegate = pvLabel.binds.properties.text.proto;

        return pvLabel.evalInPropertyContext(this.baseText.bind(this), pdelegate);
    },

    // Cache in renderState
    baseText: function(scene) {
        var state = scene.renderState,
            text  = state.baseText;
        return text !== undefined ? text : this.base(scene);
    },

    defaultText: function(scene) {
        return scene.format(this.valuesMask);
    },

    normalText: function(scene, text) {
        var fitInfo;
        return (this.trimOverflowed && (fitInfo = this.textFitInfo(scene)))
            ? this.trimText(scene, text, fitInfo)
            : text; 
    },
    
    interactiveText: function(scene, text) {
        var fitInfo;
        return (!this.trimOverflowed || 
                (scene.isActive && this.showsActivity()) ||
                !(fitInfo = this.textFitInfo(scene)))
            ? text
            : this.trimText(scene, text, fitInfo);
    },

    trimText: function(scene, text, fitInfo) { 
        var twMax = fitInfo && fitInfo.widthMax;
        return twMax != null
            ? pvc.text.trimToWidthB(twMax, text, this.pvMark.font(), "..")
            : text;
    },

    // ---------------

    textColor: function(scene) { return this.color(scene, 'text'); },
    
    // TODO: For the backgroundColor method to be implemented as a protovis
    // property, lazy properties would need to exist.
    backgroundColor: function(scene, type) {
        var state = this.instanceState();
        if(!state) return this.calcBackgroundColor(scene, type);

        var cache = def.lazy(state, 'cccBgColorCache');
        return def.getOwn(cache, type) ||
            (cache[type] = this.calcBackgroundColor(scene, type));
    },

    calcBackgroundColor: function(scene, type) {
        var anchoredToMark = this.getAnchoredToMark();
        if(anchoredToMark) {
            var fillColor = anchoredToMark.fillStyle();
            if(fillColor && fillColor !== DEFAULT_BG_COLOR && this.isAnchoredInside(scene, anchoredToMark))
                return fillColor;
        }
        return DEFAULT_BG_COLOR;
    },

    getAnchoredToMark: function() {
        return this.pvMark.target || this.pvMark.parent;
    },

    isAnchoredInside: function(scene, anchoredToMark) {
        if(!anchoredToMark && !(anchoredToMark  = this.getAnchoredToMark())) return false;

        // NOTE: the reason we're not using the label's getShape method directly
        // is that the later reads properties directly from the instance,
        // and so may read unevaluated values, when called at arbitrary times.
        // Here we're forcing evaluation by calling each property's accessor.

        var pvLabel = this.pvMark,
            text = pvLabel.text(), // Assuming text already evaluated/evaluatable.
            m    = pv.Text.measure(text, pvLabel.font()),
            
            // The polygon is relative to the label's coordinate system,
            // so we add the coordinates of the label relative to the panel.
            l    = pvLabel.left(),
            t    = pvLabel.top(),
            p;

        // Unfortunately, buildImplied only runs after all props are evaluated, 
        //  so, in some cases, we'll obtain a null top or left.
        if(l == null) {
            p = pvLabel.parent;
            l = p.width() - (pvLabel.right() || 0);
        }
        if(t == null) {
            if(!p) p = pvLabel.parent;
            t = p.height() - (pvLabel.bottom() || 0);
        }

        var labelCenter = pv.Label.getPolygon(
            m.width, m.height,
            pvLabel.textAlign(),
            pvLabel.textBaseline(),
            pvLabel.textAngle(),
            pvLabel.textMargin())
            .center()
            .plus(l, t);
        
        var anchoredToShape = anchoredToMark.getShape(anchoredToMark.scene, pvLabel.index);

        return anchoredToShape.containsPoint(labelCenter);
    },

    maybeOptimizeColorLegibility: function(scene, color, type) {
        if(this.valuesOptimizeLegibility) {
            // Calls cached version
            var bgColor = this.backgroundColor(scene, type);
            return bgColor && 
                   bgColor !== DEFAULT_BG_COLOR && 
                   bgColor.isDark() === color.isDark() 
                ? color.complementary().alpha(0.9) 
                : color;
        }
        return color;
    },
    
    normalColor: function(scene, color, type) { 
        return this.maybeOptimizeColorLegibility(scene, color, type); 
    },
    
    interactiveColor: function(scene, color, type) {
        return !this.mayShowActive(scene) && this.mayShowNotAmongSelected(scene)
            ? this.dimColor(color, type)
            : this.maybeOptimizeColorLegibility(scene, color, type);
    }
});