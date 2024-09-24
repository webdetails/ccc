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

def.space('pvc.visual').discreteBandsLayout = discreteBandsLayout;

function discreteBandsLayout(N, B, Bmin, Bmax, E, Emin, Emax, R) {

    if(!N) return null;

    // BandMode is SplitBandedCenter
    var m;

    // 1. Coerce Max with Min, and Fixed with Max and Min
    if(Bmax == null) Bmax = Infinity;
    if(Emax == null) Emax = Infinity;

    if(Bmin == null) Bmin = 0;
    if(Emin == null) Emin = 0;

    if(Bmin > Bmax) Bmax = Bmin;
    if(Emin > Emax) Emax = Emin;

    if(B != null) {
        if(B < Bmin) B = Bmin;
        else
        if(B > Bmax) B = Bmax;
    } else if(pv.floatEqual(Bmin, Bmax)) {
        B = Bmin;
    }

    if(E != null) {
        if(E < Emin) E = Emin;
        else
        if(E > Emax) E = Emax;
    } else if(pv.floatEqual(Emin, Emax)) {
        E = Emin;
    }

    // NOTE: For scenarios like multi-charting,
    // where the layout doesn't currently
    // support min, fixed or max constraints,
    // an appropriate band size ratio, R, is needed.

    // 2. Fixed or Partially Fixed ?
    var hasB = B != null, hasE = E != null;
    if(hasB || hasE) {
        // 2.ii.
        if(hasB && hasE) {
            // Fixed

            // 2.ii.a. Degenerate case - both zero?
            if(pv.floatZero(B) && pv.floatZero(E))
                return discreteBandsLayout(N, /*B*/null, 0, Infinity, /*E*/null, 0, Infinity, R);

            // 2.ii.b.
            R = B / (B + E);
            return {
                mode: 'abs', ratio: R,
                value: N * (B + E),
                band: B, space: E
            };
        }

        // Partial - hasB xor hasE
        // Smin <- (B, Emin) or (Bmin, E)
        // Smax <- (B, Emax) or (Bmax, E)
        var Smin, Smax;
        if(hasB) {
            Smin = B + Emin;
            Smax = B + Emax;

            R = pv.floatZero(B) ? 0 : (B / Smin); // B = 0 => R = 0
        } else {
            // hasE
            Smin = Bmin + E;
            Smax = Bmax + E;

            R =  pv.floatZero(E) ? 1 : (Bmin / Smin);
        }

        return {
            mode: 'abs', ratio: R,
            min:   N * Smin,
            max:   N * Smax,
            band:  hasB ? B : undefined,
            space: hasE ? E : undefined
        };
    }

    // 3. Variable
    // B == null && E == null
    // Bmax - Bmin > 0
    // Emax - Emin > 0

    var hasBmin = Bmin > 0,
        hasEmin = Emin > 0,
        hasBmax = isFinite(Bmax) && Bmax > 0,
        hasEmax = isFinite(Emax) && Emax > 0,
        hasMin  = hasBmin && hasEmin,
        hasMax  = hasBmax && hasEmax;

    // 3.iii. At least one of the points min or max is (fully) specified
    if(hasMin || hasMax) {
        if(hasMin) {
            // R uses only min, so that it goes through zero.
            R = Bmin / (Bmin + Emin);

            if(hasMax) {
                // 3.iii.e. The line between min and max
                // m = (Emax - Emin) / (Bmax - Bmin);

                return {
                    mode:  'abs',
                    ratio: R,
                    min:   N * (Bmin + Emin),
                    max:   N * (Bmax + Emax),

                    // Assume min will be chosen
                    band:  Bmin,
                    space: Emin
                };
            }

            // 3.iii.c. The line between <0,0> and min
            m = Emin / Bmin;

            if(hasBmax) Emax = m * Bmax;
            else
            if(hasEmax) Bmax = Emax / m;
        } else { // hasMax
            // 3.iii.d. The line between <0,0> and max
            m = Emax / Bmax;
            R = Bmax / (Bmax + Emax);

            if(hasBmin) Emin = m * Bmin;
            else
            if(hasEmin) Bmin = Emin / m;
        }
    } else {
        // 3.iv. The points min and max are both not (fully) specified
        // !hasMin && !hasMax
        // !hasMin = !hasBmin || !hasEmin
        // !hasMax = !hasBmax || !hasEmax
        // R is used.
        if(!hasBmin && !hasBmax && !hasEmin && !hasEmax)
            // 3.iv.g Free — the points min and max are strictly not specified
            return {
                mode: 'rel',
                ratio: R,
                min:   0,
                max:   Infinity
            };

        m = 1 / R - 1;

        if(hasEmin) {
            Bmin = Emin / m;

            // 3.iv.j.d. Crossed - The B and E ranges are partially specified - I
            // Restart the algorithm, specifying the just calculated Bmin
            if(hasBmax && Bmin >= Bmax) return discreteBandsLayout(N, B, Bmin, Bmax, E, Emin, Emax, R);

        } else if(hasBmin) {
            Emin = m * Bmin;

            // 3.iv.j.e. Crossed - The B and E ranges are partially specified - II
            // Restart the algorithm, specifying the just calculated Emin
            if(hasEmax && Emin >= Emax) return discreteBandsLayout(N, B, Bmin, Bmax, E, Emin, Emax, R);
        }

        if(hasBmax) Emax = m * Bmax;
        else
        if(hasEmax) Bmax = Emax / m;
    }

    return {
        mode:  'rel',
        ratio: R,
        min:   N * (Bmin + Emin),
        max:   N * (Bmax + Emax)
    };
}
