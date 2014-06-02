
/*
 * 0.  Decimal point
 * 0.1 Is the leftmost `.`
 * 0.2 Any additional (unescaped) `.` is ignored.
 *     (##.##.## <=> ##.####)
 * 0.3 If there is no (unescaped) `.`, it is as if one is implicit at the end of the mask.
 *
 * 1.  Integer part
 * 1.1 The digit position of the leftmost 0,
 *     counting from the decimal point, is the value of `mini`.
 *
 * 1.2 Any # to the left of the leftmost 0 is only relevant for
 *     placing further digits in-between text content (ex: ##-##-00).
 *
 * 1.3 If no # or 0 exists at the left of the decimal point (or implied decimal point)
 *     it is as if a # was placed to the left of the decimal point.
 *     (ex:        . <=>       #.
 *           ------. <=> ------#. )
 *
 * 1.4 Any # to the right of the leftmost 0 is read as if it were 0.
 *     (ex: ##-0# <=> ##-00 )
 *
 * 1.5 The leftmost 0, or # (possibly implied by 1.3), outputs all significant digits
 *     non-consumed by 0s or #s to its right.
 *
 * 1.6 The leftmost sequence of consecutive #, or of 0, is thus equivalent to a single #, or 0.
 *     (ex:  ---##-##  <=> ---#-##      or   ---0#-##  <=> ---0-00)
 *
 * 1.7 An unescaped `,` between two explicit # or 0 characters indicates that the group
 *     separators should be added to the output. The group separator is placed
 *     to the right of the corresponding position digit (1000 ->  1, 000).
 *     The number of ','s that satisfies this condition is not relevant.
 *     All are removed from the output.
 *     (ex:  #,0,#  <=>  #,00)
 *
 * 1.7 A sequence of, at least one, consecutive `,`, which has, at its right, no 0s or #s,
 *     divides the number by 10^(3 * number of commas).
 *
 * 2.  Decimal part
 * 2.1 Any # to the left of the rightmost 0 is as if it were 0.
 *     (ex: ##.#0 <=> ##.00)
 * 2.2 The digit position of the rightmost 0,
 *     counting from the decimal point, is the value of `minf`.
 * 2.3 The digit position of the # that is to the right of the rightmost 0,
 *     counting from the decimal point, is the value of `maxf`.
 *     (ex: #.00##)
 *
 */

/**
 * @class pvc.NumberFormat
 * @classdesc Represents a number format, converting between a <tt>number</tt> and a <tt>string</tt>.
 * This class allows numbers to be formatted by using a formatting mask,
 * mostly compatible with VB's format() function mask syntax.
 * See {@link http://apostate.com/programming/vb-format-syntax.html}
 * for more information on the mask syntax (only the number related subset is relevant).
 *
 * @variant class
 */

/**
 * Creates a new number format object.
 *
 * @name pvc.numberFormat
 * @function
 * @variant factory
 * @param {string|object|pvc.NumberFormat} [config] A configuration value.
 * Can be a format mask string, or a number format object (or alike) to copy from.
 * @param {pvc.NumberFormat} [proto] The prototype number format from which default
 * property values are taken.
 * Defaults to {@link pvc.numberFormat.defaults}.
 *
 * @return {pvc.NumberFormat} A new number format object.
 */
var numForm = pvc.numberFormat = function() {
    var fields, formatter;

    function numFormat(value) {
        if(!formatter) formatter = numForm_cachedFormatter(fields.mask);
        return formatter(value, numForm_sharedProp(fields.style));
    }

    /**
     * @function
     * @name pvc.NumberFormat.prototype.format
     * @param {number} value The value to format.
     * @returns {string}
     */
    numFormat.format = numFormat;

    numFormat.tryConfigure = numForm_tryConfigure;

    fields = def.instance(numFormat, numForm, numForm_sharedProp, arguments, /** @lends  pvc.NumberFormat# */{
        /**
         * Gets or sets the formatting mask.
         *
         * The default formatting mask is empty,
         * which corresponds to formatting values just like the <i>Number#toString()</i> method.
         *
         * @function
         * @param {string} [_] The formatting mask.
         * @return {pvc.NumberFormat} <tt>this</tt> or the current formatting mask.
         */
        mask: {
            cast:   String,
            change: function() { formatter = null; }
        },

        /**
         * Gets, sets or <i>configures</i> the number format style.
         *
         * @function
         * @param {object|pvc.NumberFormatStyle} [_] The new value.
         * When a number format style object, it replaces the current style.
         * When an object is specified, it configures the <i>current</i> format object.
         *
         * @return {pvc.NumberFormat|pvc.NumberFormatStyle} <tt>this</tt> or the number format style.
         */
        style: {cast: def.createAs(NumFormStyle), factory: numFormStyle}
    });

    return numFormat;
};

/**
 * Tries to configure this object, given a value.
 * @alias tryConfigure
 * @memberOf pvc.NumberFormat#
 * @param {any} other A value, not identical to this, to configure from.
 * @return {boolean|undefined}
 * <tt>true</tt> if the specified value is a string or a number format,
 * <tt>undefined</tt> otherwise.
 */
function numForm_tryConfigure(other) {
    if(def.string.is(other))   return !!this.mask(other);
    if(def.is(other, numForm)) return !!this.mask(other.mask()).style(other.style());
}

// ----------------

/**
 * The default prototype number format.
 * @alias defaults
 * @memberOf pvc.numberFormat
 * @type pvc.NumberFormat
 */
numForm.defaults = numForm().style(numFormStyle());

// ----------------

/**
 * The maximum number of cached number formatters.
 * @name pvc.numberFormat.cacheLimit
 * @type number
 */
numForm.cacheLimit = 20;

var numForm_cache = {}, numForm_cacheCount = 0;

function numForm_cachedFormatter(mask) {
    if(!mask) mask = "";
    var key = '_' + mask;
    var f = numForm_cache[key];
    if(!f) {
        if(numForm_cacheCount === numForm.cacheLimit) {
            numForm_cache = {};
            numForm_cacheCount = 0;
        }
        numForm_cache[key] = f = numberFormatter(mask);
        numForm_cacheCount++;
    }
    return f;
}

// ----------------

function numberFormatter(mask) {
    var posFormat, negFormat, zeroFormat, nullFormat;

    function formatter(value, style) {
        // 1) if null, use null format or use ""
        if(value == null) return nullFormat ? nullFormat(style) : "";

        // 2) convert to number using +
        value = +value;

        // 3) if NaN, or Infinity or -Infinity
        //    TODO: Intl symbols? or backwards compatible "" ?
        if(isNaN(value) || !isFinite(value)) return ""; // TODO

        // 4) Empty mask?
        if(!posFormat) return String(value);

        // 5) if === 0, use zero format (or positive format, if none).
        if(value === 0) return zeroFormat
            ? zeroFormat(style)
            : posFormat(style, value, /*zf*/null, /*isNegative*/false);

        // 6) if  >  0, use positive format (falling back to zeroFormat, if is 0 after scale and round)
        if(value  >  0) return posFormat(style, value, zeroFormat, /*isNegative*/false);

        // 7) if  <  0, use negative format (or positive format in negative mode) (falling back to zeroFormat, if is 0 after scale and round)
        return negFormat
            ? negFormat(style, -value, zeroFormat || posFormat)
            : posFormat(style, -value, zeroFormat, /*isNegative*/true);
    }

    function compileMask() {
        var sections = numForm_parseMask(mask), L, section, posSection;

        sections.forEach(numForm_compileSection);

        L = sections.length;
        posFormat = nullFormat = negFormat = zeroFormat = null;
        if(L) {
            posFormat = numForm_buildFormatSectionPosNeg((posSection = sections[0]));
            if(L > 1) {
                section = sections[1];
                negFormat = numForm_buildFormatSectionPosNeg(section.empty ? posSection : section);
                if(L > 2) {
                    section = sections[2];
                    zeroFormat = numForm_buildFormatSectionZero(section.empty ? posSection : section);
                    if(L > 3) {
                        section = sections[3];
                        nullFormat = numForm_buildFormatSectionNull(section.empty ? posSection : section);
                        if(L > 4) throw new Error("Invalid mask. More than 4 sections.");
                    }
                }
            }
        }
    }

    compileMask();

    return formatter;
}

// (mask) -> parsed-section[]

/*
 *  Mask -> Sections : [ Section,... ]
 *
 *  Section := {
 *      integer:    Part,   : Integer part
 *      fractional: Part,   : Fractional part
 *      scale:      0,      : Scale base 10 exponent, applied to number before formatting
 *      groupOn:    false,  : Whether grouping of integer part is on
 *      scientific: false   : Whether scientific mode should be used (See tokenType: 5)
 *  }
 *
 *  Part := {
 *      list:   [Token,... ],  : Token list (replaced by a list of steps when compiled)
 *      digits: 0              : Number of digits (0 and #)
 *  }
 *
 *  Token := {
 *      type: TokenType,
 *      text: ""          : For token of type 0 - literal text
 *  }
 *
 *  TokenType :=
 *    0 - Literal text  {text: ''}
 *    1 - 0
 *    2 - #
 *    3 - ,
 *    4 - currency sign \u00a4 (and USD?)
 *    5 - e Exponential  {text: 'e' or 'E', digits: >=1, positive: false}
 */
function numForm_parseMask(mask) {
    var sections = [];
    if(mask) {
        var i = -1,
            L = mask.length,
            c,
            textFrag = "",
            section,
            part,
            empty = 1,
            dcount,
            beforeDecimal = 1, // In the integer or fractional part.
            hasInteger = 0,    // If 0 or # has been found in the integer part.
            hasDot = 0;        // If a decimal point has been found.

        var addToken0 = function(token) {
            empty = 0;
            part.list.push(token);
        };

        var addTextFrag = function(t) {
            empty = 0;
            textFrag += t;
        };

        var endTextFrag = function() {
            if(textFrag) {
                addToken0({type: 0, text: textFrag});
                textFrag = "";
            }
        };

        var addToken = function(token) {
            endTextFrag();
            addToken0(token);
        };

        var endInteger = function() {
            endTextFrag();

            // Add implicit #
            if(!hasInteger && hasDot) addToken0({type: 2});
            part.digits = dcount;
            dcount = 0;
            beforeDecimal = 0;
            part = section.fractional;
        };

        var endSection = function() {
            // The first time that endSection is called, section is undefined,
            //  and it serves only to initialize variables.
            //
            // The first (positive section) should be defaulted to an implicit #
            // The other sections, however, should be left empty, cause they default to the positive section.
            if(section && (!empty || !sections.length)) {
                if(beforeDecimal) endInteger();
                else endTextFrag();

                part.digits = dcount;
                sections.push(section);
            }

            empty   = beforeDecimal = 1;
            hasDot  = dcount = hasInteger = 0;
            section = {
                empty:   0,
                scale:   0,
                groupOn: 0,
                scientific: 0,
                integer:    {list: [], digits: 0},
                fractional: {list: [], digits: 0}
            };
            part = section.integer;
        };

        var tryParseExponent = function() {
            // (e|E) [-|+] 0+
            var k = i + 1, c2, positive = false, digits = 0;
            if(k < L) {
                c2 = mask.charAt(k);
                if(c2 === '-' || c2 === '+') {
                    positive = c2 === '+';
                    if(++k < L) c2 = mask.charAt(k);
                    else return 0; // still missing required digits > 0, so fail
                }

                // Count number of `0` digits. Stop if anything else is found.
                // Below, (++digits) and (c2 = mask.charAt(k)) always return truthy.
                // So, read it as:
                // condition1 && sideEffect1 && condition2 && sideEffect2
                //noinspection StatementWithEmptyBodyJS
                while(c2 === '0' && (++digits) && (++k < L) && (c2 = mask.charAt(k)));

                if(digits) {
                    // k is at the next unconsumed position, or the eos.
                    // The next i needs to be = k, but i is incremented in while, so:
                    i = k - 1;
                    addToken({type: 5, text: c, digits: digits, positive: positive});
                    section.scientific = 1;
                    return 1;
                }
            }
            return 0;
        };

        endSection();

        while(++i < L) {
            c = mask.charAt(i);

            if(c === '0') {
                addToken({type: 1});
                hasInteger = 1;
                dcount++;
            } else if(c === '#') {
                addToken({type: 2});
                hasInteger = 1;
                dcount++;
            } else if(c === ',') {
                if(beforeDecimal) addToken({type: 3});
            } else if(c === '.') {
                if(beforeDecimal) {
                    hasDot = 1;
                    endInteger();
                }
            } else if(c === '\u00a4') {
                addToken({type: 4});
            } else if(c === ';') {
                endSection();

                // A second, third, or fourth empty section
                // should be = to the first section.
                if(i + 1 >= L || mask.charAt(i + 1) === ';') {
                    // Add empty section
                    i++;
                    sections.push({empty: 1});
                }
            } else if(c === '\\') {
                // Ignore \
                i++;

                // Output next character, if any, whatever it is.
                if(i < L) addTextFrag(mask.charAt(i));
            } else if(c === '"') {
                // String literal
                // Ignore ".
                // No escape character is supported within the string.
                i++;
                var j = mask.indexOf(c, i);
                if(j < 0) j = L; // Unterminated string constant?
                addTextFrag(mask.substring(i, j)); // Exclusive end.
                i = j;
            } else if((c === 'e' || c === 'E') && tryParseExponent()) {
                // noop
            } else {
                if(c === "%") { // Per cent
                    section.scale += 2;
                } else if(c === '\u2030') { // Per mille
                    section.scale += 3;
                } else if(c === '\u2031') { // Per 10-mille
                    section.scale += 4;
                }

                // Add to the current text fragment part
                addTextFrag(c);
            }
        } // end while

        endSection();
    } // end if mask

    return sections;
}

// ----------------

// (parsed-section) -> compiled-section

function numForm_compileSection(section) {
    if(!section.empty) {
        numForm_compileSectionPart(section, /*beforeDecimal*/true );
        numForm_compileSectionPart(section, /*beforeDecimal*/false);
    }
}

function numForm_compileSectionPart(section, beforeDecimal) {
    var stepMethName = beforeDecimal ? 'push' : 'unshift',
        part         = section[beforeDecimal ? 'integer' : 'fractional'],
        tokens       = part.list,
        steps        = (part.list = []), // Replace tokens array with steps array
        digit        = part.digits - 1,  // Index of first/next digit to be read
        hasInteger   = 0, // 0 or #
        hasZero      = 0, // 0

        /* beforeDecimal = true
         *  --> ###0000
         *
         * beforeDecimal = false
         *  .0000###  <--
         */
        L = tokens.length,
        i = beforeDecimal ? 0 : L,
        nextToken = beforeDecimal
            ? function() { return i < L ? tokens[i++] : null; }
            : function() { return i > 0 ? tokens[--i] : null; },
        token, type;

    // Steps are ordered from most to least significant ( -->.--> )
    // Compensating for the token traversal order being reversed, when fractional part.
    function addStep(step) {
        steps[stepMethName](step);
    }

    while((token = nextToken())) {
        switch((type = token.type)) {
            // Literal text
            case 0: addStep(numForm_buildLiteral(token.text)); break;

            case 1: // 0
            case 2: // #
                // After the first found zero, from the "edge", all #s are considered 0s.
                if(hasZero && type === 2) type = 1;
                addStep(numForm_buildReadDigit(
                    beforeDecimal, digit, /*zero*/type === 1, /*edge*/!hasInteger));
                digit--;
                hasInteger = 1;
                if(!hasZero && type === 1) hasZero = 1;
                break;

            case 3: // ,
                // assert beforeDecimal

                /*
                 * Group separator or Scaling
                 * 1) Scaling:
                 *    If, until the end of the integer tokens,
                 *    no 0 or # are found,
                 *    then each found comma divides by thousand.
                 * 2) Else, if 0 or # were found before,
                 *    as we already know one was found ahead,
                 *    then the comma activates the group separator.
                 * 3) Else, ignore the comma.
                 *
                 * In any case, commas are not output by a dedicated function step.
                 * For groups, they are output by normal 0 or # functions, when active.
                 * For scaling, they affect the scale variable, that is specially handled
                 * before any formatting occurs.
                 */
                 // NOTE: i is already the next index.
                if(!numForm_hasIntegerAhead(tokens, i, L)) {
                    section.scale -= 3;
                } else if(hasInteger) {
                    section.groupOn = 1;
                }
                break; // case 3

            // \u00A4 (currency sign)
            case 4: addStep(numFormRt_currencySymbol); break;

            // exponent
            case 5: addStep(numForm_buildExponent(section, token)); break;
        }
    } // end while

    if(!beforeDecimal && part.digits) steps.unshift(numForm_buildReadDecimalSymbol(hasZero));
}

function numForm_hasIntegerAhead(tokens, i, L) {
    while(i < L) {
        var type = tokens[i++].type;
        // 0 or #
        if(type === 1 || type === 2) return 1;
    }
    return 0;
}

// ----------------

// (compiled-section) -> section-format-function
//
// section-format-function : (value, zeroFormat, negativeMode) -> string

function numForm_buildFormatSectionZero(section) {

    function numFormRt_formatSectionZero(style) {
        return numFormRt_formatSection(section, style, /*value*/0, /*negativeMode*/false);
    }

    return numFormRt_formatSectionZero;
}

function numForm_buildFormatSectionNull(section) {

    function numFormRt_formatSectionNull(style) {
        return numFormRt_formatSection(section, style, /*value*/"", /*negativeMode*/false);
    }

    return numFormRt_formatSectionNull;
}

function numForm_buildFormatSectionPosNeg(section) {

    function numFormRt_formatSectionPosNeg(style, value, zeroFormat, negativeMode) {
        var value0 = value, exponent = 0, sdigits;

        // 1) scale (0 when none)
        var scale = section.scale;

        // 2) exponent scaling
        if(section.scientific) {
            // How many places we would have to shift to the right (> 0),
            //  or to the left (< 0), so that a single non-zero digit lies in the integer part.
            sdigits = Math.floor(Math.log(value) / Math.LN10);

            // To align sdigits with the number of integer digits in the mask,
            // we apply an additional exponent scale.
            exponent = scale + sdigits - section.integer.digits + 1;

            scale -= exponent;
        }

        if(scale) value = pvc.mult10(value, scale);

        // 3) round fractional part
        value = pvc.round10(value, section.fractional.digits);

        // 4) if 0 and zeroFormat, fall back to zeroFormat
        return (!value && zeroFormat)
            ? zeroFormat(style, value0)
            : numFormRt_formatSection(section, style, value, negativeMode, exponent);
    }

    return numFormRt_formatSectionPosNeg;
}

// Helper section formatting function.
function numFormRt_formatSection(section, style, value, negativeMode, exponent) {
    var svalue = "" + value,
        idot   = svalue.indexOf("."),
        itext  = idot < 0 ? svalue : svalue.substr(0, idot),
        ftext  = idot < 0 ? ""     : svalue.substr(idot + 1);

    // Don't show a single integer "0". It's not significant.
    if(itext === "0") itext = "";
    if(!exponent) exponent = 0;

    var out = [];
    if(negativeMode) out.push(style.negativeSign);

    itext = itext.split("");
    ftext = ftext.split("");

    if(style.group && section.groupOn) numFormRt_addGroupSeparators(style, itext);

    section.integer   .list.forEach(function(f) { out.push(f(style, itext, exponent)); });
    section.fractional.list.forEach(function(f) { out.push(f(style, ftext, exponent)); });
    return out.join("");
}

/**
 * Adds group separators to a specified integer digits array.
 * @param {object} style A number style object.
 * @param {string[]} itext The integer digits array.
 * @private
 */
function numFormRt_addGroupSeparators(style, itext) {
    var gsym = style.group,
        separate = function() { itext[D - d - 1] += gsym; },
        D  = itext.length,
        gs = style.groupSizes,
        G  = gs.length,
        d  = 0,
        g  = -1,
        S;

    // assert G > 0;

    while(++g < G) {
        d += (S = gs[g]);

        // assert S > 0;

        // Went beyond the text?
        if(d < D) separate(); else return;
    }

    // Not enough groups to fill all the text.
    // Use the last group repeatedly.
    while((d += S) < D) separate();
}

// ----------------

// (arbitrary-arguments) -> token-read-function
//
// token-read-function : (style: object, itext or ftext: string[], exponent: number) -> string

function numForm_buildLiteral(s) {

    function numFormRt_literal() { return s; }

    return numFormRt_literal;
}

/**
 * Builds a function that reads a specified digit from
 * the integer or fractional parts of a number.
 *
 * @param {boolean} beforeDecimal Indicates if the digit is
 *     from the integer, <tt>true</tt>, or fractional part, <tt>false</tt>.
 * @param {number} digit For an integer part, it's the the integer digit index,
 *     counting from the decimal point to the left. For a fractional part,
 *     it's the the fractional digit index, counting from the decimal point to the right.
 * @param {boolean} zero Indicates a `0` or `#` digit.
 * @param {boolean} edge Indicates if the digit is the leftmost, of an integer part,
 *     or the rightmost, of a fractional part.
 *     In an integer part, it's used to know wether to output only the specified digit,
 *     or all yet unconsumed digits, from the specified digit to the left.
 *
 * @return {function} A digit reader function.
 *     Its signature is (text: string) -> string.
 *     It receives the integer or fractional text of a number and
 *     returns the corresponding digit.
 * @private
 */
function numForm_buildReadDigit(beforeDecimal, digit, zero, edge) {

    var pad = zero ? numFormRt_stylePadding : null;

    function numFormRt_stylePadding(style) {
        return style[beforeDecimal ? 'integerPad' : 'fractionPad'];
    }

    // text : integer part text digits array
    function numFormRt_readInteger(style, text) {
        var L = text.length;
        if(digit < L) {
            var i = L - 1 - digit;
            return edge ? text.slice(0, i + 1).join("") : text[i];
        }
        return pad ? pad(style) : "";
    }

    // text : fractional part text digits array, already rounded
    function numFormRt_readFractional(style, text) {
        return digit < text.length ? text[digit] : pad ? pad(style) : "";
    }

    return beforeDecimal ? numFormRt_readInteger : numFormRt_readFractional;
}

/**
 * Builds a function that conditionally outputs a decimal separator symbol.
 *
 * When the fractional part of a mask has no `0` digits,
 * the decimal symbol is only output if the actual value being formatted
 * has at least one significant fractional digit.
 *
 * @param {boolean} hasZero Indicates if the fractional part of the mask has any `0` digit type.
 *
 * @return {function} A function that returns a string.
 * @private
 */
function numForm_buildReadDecimalSymbol(hasZero) {
    return hasZero ? numFormRt_decimalSymbol : numFormRt_decimalSymbolUnlessInt;
}

/**
 * Builds a functioin that outputs the scientific notation exponent part.
 * @param {object} section The section being compiled.
 * @param {object} token The expoennt token, being compiled.
 *
 * @return {function} A function that returns an exponent string.
 * @private
 */
function numForm_buildExponent(section, token) {

    function numFormRt_exponent(style, text, exponent) {
        var sign =
            exponent < 0   ? style.negativeSign :
            token.positive ? "+" :
            "";

        // Left pad the exponent with 0s
        var exp = "" + Math.abs(exponent),
            P = token.digits - exp.length;

        if(P > 0) exp = (new Array(P + 1)).join("0") + exp;

        return token.text + sign + exp;
    }

    return numFormRt_exponent;
}

// token-read-function
function numFormRt_decimalSymbol(style) {
    return style.decimal;
}

// token-read-function
function numFormRt_decimalSymbolUnlessInt(style, ftext) {
    return ftext.length ? style.decimal : "";
}

// token-read-function
function numFormRt_currencySymbol(style) {
    return style.currency;
}
