/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def.type('pvc.visual.Label', pvc.visual.Sign)
.init(function(panel, protoMark, keyArgs) {

    var pvMark = protoMark.add(pv.Label);

    this.base(panel, pvMark, keyArgs);
})
.add({
    _addInteractive: function(keyArgs) {
        var t = true;
        keyArgs = def.setDefaults(keyArgs,
                        'noSelect',         t,
                        'noHover',          t,
                        'noTooltip',        t,
                        'noClick',          t,
                        'noDoubleClick',    t,
                        'showsInteraction', false);

        this.base(keyArgs);
    },
    
    defaultColor: def.fun.constant(pv.Color.names.black)
});