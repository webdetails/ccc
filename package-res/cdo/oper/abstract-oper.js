/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a data operation.
 * 
 * @name cdo.DataOper
 * 
 * @class The base abstract class for a data operation.
 * Performs an initial query on the datums of the operation's link parent
 * and hands the final implementation to a derived class.
 * 
 * @property {string} key Set on construction with a value that identifies the operation.
 * 
 * @constructor
 *
 * @param {cdo.Data} linkParent The link parent data.
 * @param {object} [keyArgs] Keyword arguments.
 */
def.type('cdo.DataOper')
.init(function(linkParent, keyArgs) {
    /*jshint expr:true */
    linkParent || def.fail.argumentRequired('linkParent');
    
    this._linkParent = linkParent;
}).
add(/** @lends cdo.DataOper */{
    
    key: null,

    /**
     * Performs the data operation.
     * 
     * @returns {cdo.Data} The resulting root data.
     */
    execute: def.method({isAbstract: true})
});
