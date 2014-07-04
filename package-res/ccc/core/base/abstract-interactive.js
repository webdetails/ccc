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
    
    def
    .type('pvc.visual.Interactive')
    .addStatic(I)
    .addStatic({
        ShowsAny:      I.ShowsInteraction | I.ShowsTooltip,
        SelectableAny: I.Selectable | I.SelectableByClick | I.SelectableByRubberband | I.SelectableByFocusWindow 
    })
    
    .add({
        _ibits: -1, // all ones instance field
        ibits: function() { return this._ibits; }
     })
    
    // methods showsActivity, showsSelection, ...
    .add(def.query(def.ownKeys(I))
            .object({
                name:  def.firstLowerCase,
                value: function(p) {
                    var mask = I[p];
                    return function() { return !!(this.ibits() & mask); };
                }
            })
    );
});