
function cgf_createParseUnit(unitTranslTable) {

    function cgf_parseUnit(v, dv) {
        switch(typeof v) {
            case 'number':
                if(isNaN(v)) break;
                return v;

            case 'string':
                var m = v.match(/^(.+?)(([\a-zA-Z]+)|%)?$/);
                if(m) {
                    var p = def.number.to(m[1]);
                    if(p != null) {
                        // p === 0
                        if(!p) return p;

                        var unit = m[2] || '';
                        if(unitTranslTable && def.hasOwn(unitTranslTable, unit))
                            unit = unitTranslTable[unit];

                        // Absolute.
                        if(!unit || unit === 'px') return p;

                        // Relative - defer evaluation.
                        //
                        // Note that a NaN may then be returned
                        // (e.g. when a % value cannot be resolved
                        // due to the parent not having a fixed content size).
                        // However, because this cast function is then evaluated again,
                        // the `NaN` ends being converted to dv (which defaults to `undefined`).
                        // A _nully_ value will become a `null` in the property.
                        return function() { return this.evalUnit(p, unit); };
                    }
                }
                break;
        }

        // TODO: log invalid value. NaN's go here.

        return dv;
    }

    return cgf_parseUnit;
}

var cgf_parseUnitH = cgf_createParseUnit({'%': '%w'}),
    cgf_parseUnitV = cgf_createParseUnit({'%': '%h'});
