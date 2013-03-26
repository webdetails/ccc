/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def
.type('pvc.visual.ValueLabel', pvc.visual.Label)
.init(function(panel, anchorMark, keyArgs) {
    
    var protoMark;
    if(!def.get(keyArgs, 'noAnchor', false)) {
        protoMark = anchorMark.anchor(panel.valuesAnchor);
    } else {
        protoMark = anchorMark;
    }
    
    if(keyArgs && keyArgs.extensionId == null) { keyArgs.extensionId = 'label'; }

    this.base(panel, protoMark, keyArgs);

    this._bindProperty('text', 'text');
    
    this.pvMark.font(panel.valuesFont);

    this._bindProperty('textStyle', 'textColor', 'color');
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
    
    defaultText: function() { return this.scene.format(this.panel.valuesMask); },
    
    normalText: function(text) { return this.trimText(text); },
    
    interactiveText: function(text) {
        return this.showsActivity() && this.scene.isActive ? text : this.trimText(text); 
    },
    
    trimText: function(text) { return text; },
    
    textColor: function() { return this.color('text'); },
    
    backgroundColor: function(type) {
        var state = this.state;
        if(!state) { return this.calcBackgroundColor(type); }
        var cache = def.lazy(state, 'bgColorCache');
        var color = def.getOwn(cache, type);
        if(!color) { color = cache[type] = this.calcBackgroundColor(type); }
        return color;
    },
    
    calcBackgroundColor: def.fun.constant(pv.Color.names.white), // TODO: ??
    
    optimizeLegibilityColor: function(color, type) {
        if(this.panel.valuesOptimizeLegibility) {
            var bgColor = this.backgroundColor();
            return bgColor.isDark() ? color.complementary().alpha(0.9) : color;
        }
        
        return color;
    },
    
    normalColor: function(color, type) { return this.optimizeLegibilityColor(color, type); },
    
    interactiveColor: function(color, type) {
        if(!this.mayShowActive() && this.mayShowNotAmongSelected()) {
            return this.dimColor(color, type);
        }
        
        return this.optimizeLegibilityColor(color, type);
    }
});