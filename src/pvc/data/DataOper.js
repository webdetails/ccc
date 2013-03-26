/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a data operation.
 * 
 * @name pvc.data.DataOper
 * 
 * @class The base abstract class for a data operation.
 * Performs an initial query on the datums of the opertion's link parent
 * and hands the final implementation to a derived class.
 * 
 * @property {string} key Set on construction with a value that identifies the operation.
 * 
 * @constructor
 *
 * @param {pvc.data.Data} linkParent The link parent data.
 * @param {object} [keyArgs] Keyword arguments.
 */
def.type('pvc.data.DataOper')
.init(function(linkParent, keyArgs){
    /*jshint expr:true */
    linkParent || def.fail.argumentRequired('linkParent');
    
    this._linkParent = linkParent;
}).
add(/** @lends pvc.data.DataOper */{
    
    key: null,

    /**
     * Performs the data operation.
     * 
     * @returns {pvc.data.Data} The resulting root data.
     */
    execute: def.method({isAbstract: true})
});
