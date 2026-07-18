/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 - 2026 by Pentaho Canada Inc. : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2030-06-15
 ******************************************************************************/

def.info = function def_meta(o, info) {
    var i;
    if(o && info) {
        i = o.__info__;

        if(arguments.length < 2) return i;

        if(!i) def.setNonEnum(o, '__info__', (i = {}));

        def.copyOwn(i, info);
    }

    return o;
};

def.info.get = function(o, p, dv) {
  return def.get(o && o.__info__, p, dv);
};