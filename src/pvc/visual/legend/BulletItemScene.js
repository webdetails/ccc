/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_ValueLabelVar:true */

/**
 * Initializes a legend bullet item scene.
 *
 * @name pvc.visual.legend.BulletItemScene
 *
 * @extends pvc.visual.legend.Scene
 *
 * @constructor
 * @param {pvc.visual.legend.BulletGroupScene} bulletGroup The parent legend bullet group scene.
 * @param {object} [keyArgs] Keyword arguments.
 * See {@link pvc.visual.Scene} for supported keyword arguments.
 */
def
.type('pvc.visual.legend.BulletItemScene', pvc.visual.Scene)
.init(function(bulletGroup, keyArgs) {

    this.base.apply(this, arguments);

    if(!this.executable()) {
        // Don't allow default click action
        var I = pvc.visual.Interactive;
        this._ibits = I.Interactive |
                      I.ShowsInteraction |
                      I.Hoverable | I.SelectableAny;
    }
})
.add(/** @lends pvc.visual.legend.BulletItemScene.prototype */{
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
     * @type {boolean}
     */
    isOn: def.fun.constant(true),

    /**
     * Returns true if the item may be executed.
     * May be called during construction.
     * @type {boolean}
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
     * Measures the item label's text and returns an object
     * with 'width' and 'height' properties, in pixels.
     * @type {object}
     */
    labelTextSize: function() {
        return pv.Text.measure(this.value().label, this.vars.font);
    },

    // Value variable
    // Assumes _value_ variable has not yet been defined, by using "variable".
    // Declaring these methods prevents default _valueEval and _valueEvalCore
    // implementations to be defined.
    _valueEval: function() {
        var valueVar = this._valueEvalCore();
        if(!(valueVar instanceof pvc_ValueLabelVar)) {
            valueVar = new pvc_ValueLabelVar(valueVar, valueVar);
        }

        return valueVar;
    },

    _valueEvalCore: function() {
        var value, rawValue, label;
        var source = this.group || this.datum;
        if(source) {
            value    = source.value;
            rawValue = source.rawValue;
            label    = source.ensureLabel() + this._getTrendLineSuffix(source);
        }

        return new pvc_ValueLabelVar(value || null, label || "", rawValue);
    },

    _getTrendLineSuffix: function(source) {
        // TODO: This is to catch trend lines...
        // Normal data source data part values are numbers: 0, 1.
        // Trend data part value is not a number, it is: "trends".
        // Shows the custom trend label after the item's label:
        // ex: 'Lisbon (Linear trend)'
        var dataPartDim = this.chart()._getDataPartDimName();
        if(dataPartDim) {
            var dataPartAtom = source.atoms[dataPartDim];
            if(isNaN(+dataPartAtom.value)) {
                return " (" + dataPartAtom.label + ")";
            }
        }
        return "";
    }
})
.prototype
.variable('value');
