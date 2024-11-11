/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/

var def_Object = new def_MetaType()
    .close()
    .Ctor
    .add({
        override: function(p, v) {
            return def_method_(this, p, v, def.protoOf(this), def_Object.prototype, /*enumerable*/true), this;
        },

        toString: function() {
            return "[object " + String(def.qualNameOf(def.classOf(this))) + "]";
        }
    }, {enumerable: false});

def('Object', def_Object); // def is current namespace
