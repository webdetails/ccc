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
def.textTable = function(C) {
    var rows = [],
        contPad = " ",
        colsMaxLen = new Array(C),
        rowSepMarkerFirst = def.array.create(C, ""),
        rowSepMarker = rowSepMarkerFirst.slice(),
        rowSepMarkerLast = rowSepMarkerFirst.slice(),
        rowSep;

    function table() {
        return rows.map(function(r) {
            switch(r) {
                case rowSepMarkerFirst: return renderRow(r, "\u2564", "\u2550", "\u2554", "\u2557");
                case rowSepMarker:      return (rowSep || (rowSep = renderRow(r, "\u253c", "\u2500", "\u255f", "\u2562")));
                case rowSepMarkerLast:  return renderRow(r, "\u2567", "\u2550", "\u255a", "\u255d");
            }
            return renderRow(r, "\u2502", " ", "\u2551", "\u2551");
        }).join("\n");
    }

    table.row = function() {
        var args = arguments, i = -1, v, s, r = new Array(C);
        while(++i < C) {
            v = args[i];
            s = r[i] = contPad + (v === undefined ? "" : String(v)) + contPad;
            colsMaxLen[i] = Math.max(colsMaxLen[i] || 0, s.length);
        }
        rows.push(r);
        return table;
    };

    table.rowSep = function(isLast) {
        rows.push(!rows.length ? rowSepMarkerFirst : isLast ? rowSepMarkerLast : rowSepMarker);
        return table;
    };

    function renderRow(r, colSep, pad, first, last) {
        return first + r.map(function(s, i) {
            return def.string.padRight(s || "", colsMaxLen[i], pad);
        }).join(colSep) + last;
    }

    return table;
};
