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

def.copyOwn(def, /** @lends def */{

    bit: {
        set: function(bits, set, on) { return (on || on == null) ? (bits | set) : (bits & ~set); }
    }

});
