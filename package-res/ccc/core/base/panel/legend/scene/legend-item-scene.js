/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_ValueLabelVar:true */

/**
 * Initializes a legend item scene.
 * 
 * @name pvc.visual.legend.LegendItemScene
 * @extends pvc.visual.legend.Scene
 * @constructor
 */
def
.type('pvc.visual.legend.LegendItemScene', pvc.visual.Scene)
.add(/** @lends pvc.visual.legend.LegendItemScene# */{
    _ibits: null,

    // Lazy initializes _ibits so that
    // they are evaluated after all sibling item scenes
    // are added to the parent group scene.
    // The visibility executable property depends on this.
    ibits: function() {
        var ibits = this._ibits;
        if(ibits == null) {
            if(!this.executable()) {
                // Don't allow default click action
                var I = pvc.visual.Interactive;
                ibits = I.Interactive |
                    I.ShowsInteraction |
                    I.Hoverable | I.SelectableAny;
            } else {
                ibits = -1; // all ones
            }

            this._ibits = ibits;
        }
        return ibits;
    },

    /**
     * Called during legend render (full or interactive) 
     * to determine if the item is in the "on" state.
     * <p>
     * An item in the "off" state is shown with brighter struck-through text, by default.
     * </p>
     * 
     * <p>
     * The default implementation returns <c>true</c>.
     * </p>
     * 
     * @type boolean
     */
    isOn: def.fun.constant(true),
    
    /**
     * Returns true if the item may be executed. 
     * May be called during construction.
     * @type boolean
     */
    executable: def.fun.constant(false),
    
    /**
     * Called when the user executes the legend item.
     * <p>
     * The default implementation does nothing.
     * </p>
     */
    execute: def.fun.constant(),
    
    /**
     * Obtains the item label's text.
     * The default implementation uses the 'label' property of the 'value' variable.
     * @type object
     */
    labelText: function() { return this.value().label; },

    /**
     * Measures the item label's text and returns an object
     * with 'width' and 'height' properties, in pixels.
     * @type object
     */
    labelTextSize: function() {
        return pv.Text.measure(this.labelText(), this.vars.font);
    },
    
    // Value variable
    // Assumes _value_ variable has not yet been defined, by using "variable".
    // Declaring these methods prevents default _valueEval and _valueEvalCore
    // implementations to be defined.
    _valueEval: function() {
        var valueVar = this._valueEvalCore();
        if(!(valueVar instanceof pvc_ValueLabelVar)) valueVar = new pvc_ValueLabelVar(valueVar, valueVar);
        return valueVar;
    },
    
    _valueEvalCore: function() {
        var value, rawValue, label, absLabel, trendSuffix,
            source = this.group || this.datum;
        if(source) {
            value    = source.value;
            rawValue = source.rawValue;
            trendSuffix = this._getTrendLineSuffix(source);
            label    = source.ensureLabel() + trendSuffix;
            absLabel = source.absLabel ? (source.absLabel + trendSuffix) : label;
        }
        
        return new pvc_ValueLabelVar(value || null, label || "", rawValue, absLabel);
    },
    
    _getTrendLineSuffix: function(source) {
        var datum, trendOptions;
        return ((datum = source.firstDatum()) && (trendOptions = datum.trend))
            ? " (" + trendOptions.label + ")"
            : "";
    }
})
.prototype
.variable('value');
