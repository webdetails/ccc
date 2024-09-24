/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/
def.makeEnum = function(a, ka) {
    var i = 1,
        all = 0,
        e = {},
        allItem = def.get(ka, 'all'),
        zeroItem = def.get(ka, 'zero');

    a.forEach(function(p) {
        e[p] = i;
        if(allItem) all |= i;
        i = i << 1;
    });

    if(zeroItem) e[zeroItem] = 0;
    if(allItem) e[allItem] = all;

    return e;
};
