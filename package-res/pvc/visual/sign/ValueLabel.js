/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def
.type('pvc.visual.ValueLabel', pvc.visual.Label)
.init(function(panel, anchorMark, keyArgs) {
    
    this.valuesFont   = def.get(keyArgs, 'valuesFont') || panel.valuesFont;
    this.valuesMask   = def.get(keyArgs, 'valuesMask') || panel.valuesMask;
    this.valuesOptimizeLegibility = def.get(keyArgs, 'valuesOptimizeLegibility', panel.valuesOptimizeLegibility); 

    var protoMark;
    if(!def.get(keyArgs, 'noAnchor', false)) {
        protoMark = anchorMark.anchor(panel.valuesAnchor);
    } else {
        protoMark = anchorMark;
    }
    
    if(keyArgs && keyArgs.extensionId == null) { keyArgs.extensionId = 'label'; }

    this.base(panel, protoMark, keyArgs);

    this.pvMark.font(this.valuesFont);

    this._bindProperty('text', 'text')
        ._bindProperty('textStyle', 'textColor', 'color');
})
.prototype
.property('text')
.property('textStyle')
.constructor
.addStatic({
    maybeCreate: function(panel, anchorMark, keyArgs) {
        return panel.valuesVisible && panel.valuesMask ?
               new pvc.visual.ValueLabel(panel, anchorMark, keyArgs) :
               null;
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
    
    defaultText: function(scene) {
        var state = scene.renderState;
        var text  = state.defaultText;
        return text != null ? 
            text : 
            (state.defaultText = scene.format(this.valuesMask));
    },
    
    normalText: function(scene, text) { return this.trimText(scene, text); },
    
    interactiveText: function(scene, text) {
        return this.showsActivity() && scene.isActive ? text : this.trimText(scene, text); 
    },
    
    trimText: function(scene, text) { return text; },
    
    textColor: function(scene) { return this.color(scene, 'text'); },
    
    backgroundColor: function(scene, type) {
        var state = this.instanceState();
        if(!state) { return this.calcBackgroundColor(scene, type); }
        var cache = def.lazy(state, 'cccBgColorCache');
        var color = def.getOwn(cache, type);
        if(!color) { color = cache[type] = this.calcBackgroundColor(scene, type); }
        return color;
    },
    
    calcBackgroundColor: def.fun.constant(pv.Color.names.white), // TODO: ??
    
    optimizeLegibilityColor: function(scene, color, type) {
        if(this.valuesOptimizeLegibility) {
            var bgColor = this.backgroundColor(scene, type);
            return bgColor && bgColor.isDark() === color.isDark() ? color.complementary().alpha(0.9) : color;
        }
        return color;
    },
    
    normalColor: function(scene, color, type) { return this.optimizeLegibilityColor(scene, color, type); },
    
    interactiveColor: function(scene, color, type) {
        if(!this.mayShowActive(scene) && this.mayShowNotAmongSelected(scene)) {
            return this.dimColor(color, type);
        }
        
        return this.optimizeLegibilityColor(scene, color, type);
    }
});