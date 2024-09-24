/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*global pvc_ValueLabelVar:true*/

/**
 * Initializes an axis tick scene.
 * 
 * @name pvc.visual.CartesianAxisTickScene
 * 
 * @extends pvc.visual.Scene
 * 
 * @constructor
 * @param {pvc.visual.CartesianAxisRootScene} [parent] The parent scene, if any.
 * @param {object} [keyArgs] Keyword arguments.
 * See {@link pvc.visual.Scene} for supported keyword arguments.
 */
def
.type('pvc.visual.CartesianAxisTickScene', pvc.visual.Scene)
.init(function(parent, keyArgs) {
    
    this.base(parent, keyArgs);
    
    this.vars.tick = new pvc_ValueLabelVar(
            def.get(keyArgs, 'tick'),
            def.get(keyArgs, 'tickLabel'),
            def.get(keyArgs, 'tickRaw'));
    
    if(def.get(keyArgs, 'isHidden')) this.isHidden = true;
})
.add({
    // True when the scene contains excluded data(s)
    // due to overlappedLabelsMode:hide exclusion
    isHidden: false
});