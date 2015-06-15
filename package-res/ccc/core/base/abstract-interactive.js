/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def.scope(function() {

    var I = def.makeEnum([
        'Interactive',
        'ShowsActivity',
        'ShowsSelection',
        'ShowsTooltip',
        'Selectable',
        'Unselectable',
        'Hoverable',
        'Clickable',
        'DoubleClickable',
        'SelectableByClick',       // => Selectable && !SelectableByFocusWindow
        'SelectableByRubberband',  // => Selectable && !SelectableByFocusWindow
        'SelectableByFocusWindow', // => Selectable && !SelectableByRubberband
        'Animatable'
    ]);

    // Combinations
    //noinspection JSHint
    I.ShowsInteraction  = I.ShowsActivity    | I.ShowsSelection;
    I.Actionable        = /*I.Selectable | */ I.Hoverable | I.Clickable | I.DoubleClickable | I.SelectableByClick;
    I.HandlesEvents     = I.Actionable       | I.ShowsTooltip;
    I.HandlesClickEvent = I.Clickable        | I.SelectableByClick;
    //I.Interactive       = -1, // any bit

    function parseBitsCore(ibits) {
        ibits = Math.floor(ibits);
        return isNaN(ibits)                       ? null :
               (ibits < -1  || !isFinite(ibits))  ? -1   :
               ibits;
    }

    def('pvc.visual.Interactive', def.Object.extend({
        "type.methods": [
            I,
            {
                ShowsAny:      I.ShowsInteraction | I.ShowsTooltip,
                SelectableAny: I.Selectable | I.SelectableByClick | I.SelectableByRubberband | I.SelectableByFocusWindow,

                parseBits: function(value) {
                    if(value == null) return null;
                    if(typeof value === "number") return parseBitsCore(value);

                    if(typeof value !== "string")
                        value = String(value);

                    var ibits = parseBitsCore(+value);
                    if(ibits !== null) return ibits;

                    // ibits === null;

                    value.split(/\s*\|\s*/).forEach(function(sbit) {
                        var ibit = def.getOwn(I, sbit);
                        if(ibit != null) {
                            if(ibits === null) ibits = ibit;
                            else ibits |= ibit;
                        }
                    });

                    return ibits;
                }
            }
        ],
        methods: [
            {
                _ibits: -1, // all ones instance field
                ibits: function() { return this._ibits; }
            },
            // methods showsActivity, showsSelection, ...
            def.query(def.ownKeys(I))
               .object({
                    name:  def.firstLowerCase,
                    value: function(p) {
                        var mask = I[p];
                        return function() { return !!(this.ibits() & mask); };
                    }
               })
        ]
    }));
});
