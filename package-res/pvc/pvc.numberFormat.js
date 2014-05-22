/**
 * Returns a number format for a given mask, or a default one.
 *
 * @class Represents a number format, converting between a <tt>number</tt> and a <tt>string</tt>.
 * This class allows numbers to be formatted by using a formatting mask, 
 * mostly compatible with VB's format() function mask syntax.
 * See {@link http://apostate.com/programming/vb-format-syntax.html} for more information.
 * 
 * @returns {pvc.numberFormat} a number format.
 */
pvc.numberFormat = function(mask) {
    var mask, dirty = 1;

    // Number Format Style
    var padiSym     = "0", // Default integer pad.
        padfSym     = "0", // Default fraction pad.
        decimalSym  = ".", // Default decimal separator.
        groupSym    = ",", // Default group separator.
        groupSizes = [3],  // Default group sizes. The last group is repeated indefinitely.
        negSym      = "-", // Default negative symbol.
        currencySym = "$"; // Default currency symbol.

    var posFormat, negFormat, zeroFormat, nullFormat;


    /** @private */
    function format(value) {

        if(dirty) compileMask();

        // 1) if null, use null format or use ""
        if(value == null) return nullFormat ? nullFormat() : "";

        // 2) convert to number using +
        value = +value;

        // 3) if NaN, or Infinity or -Infinity
        //    TODO: Intl symbols? or backwards compatible "" ?
        if(isNaN(value) || !isFinite(value)) return ""; // TODO

        // 4) Empty mask?
        if(!posFormat) return String(value);

        // 5) if === 0, use zero format (or positive format, if none).
        if(value === 0) return zeroFormat ? zeroFormat() : posFormat(value, /*zf*/null, /*isNegative*/false);

        // 6) if  >  0, use positive format (falling back to zeroFormat, if is 0 after scale and round)
        if(value  >  0) return posFormat(value, zeroFormat, /*isNegative*/false);

        // 7) if  <  0, use negative format (or positive format in negative mode) (falling back to zeroFormat, if is 0 after scale and round)
        return negFormat ? negFormat(-value, zeroFormat || posFormat) : posFormat(-value, zeroFormat, /*isNegative*/true);
    }

    /**
     * @function
     * @name pvc.numberFormat.prototype.format
     * @param {number} value The value to format.
     * @returns {string}
     */
    format.format = format;

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
     * Configures the format with the properties in a configuration object.
     *
     * @param {object} [config] A configuration object.
     *
     * @return <tt>this</tt>.
     */
    format.configure = function(config) {
        var n, v, m;
        for(n in config) {
            if(n !== 'configure' && 
               (v = config[n]) !== undefined && 
               typeof (m = format[n]) === 'function' && 
               m.length >= 1) {

                m(v);
            }
        }
        return this;
    };

    /**
     * Gets or sets the formatting mask.
     * 
     * The default formatting mask is empty,
     * which corresponds to formatting values just like the <i>toString</i> method.
     *
     * @param {string} [_] The formatting mask.
     *
     * @return <tt>this</tt> or the current formatting mask.
     */
    format.mask = function(_) {
        if(arguments.length) {
            mask  = _;
            dirty = 1;
            return this;
        }
        return mask;
    };

    /**
     * Gets or sets the character to use in place of the `.` mask character.
     * The decimal point separates the integer and fraction parts of the number.
     * The default is ".".
     * 
     * @param {string} [_] The new decimal separator.
     * @return <tt>this</tt> or the current decimal separator.
     */
    format.decimal = function(_) {
        if(arguments.length) {
            if(!_) throw def.error.argumentRequired("decimal");
            decimalSym = String(_);
            return this;
        }
        return decimalSym;
    };

    /**
     * Gets or sets the character to use in place of the `,` mask character.
     * The group separator groups integer digits according to the sizes in <tt>groupSizes</tt>.
     * The default group separator is ",".
     * Grouping can be disabled, independently of the mask, by specifying "".
     *
     * @param {string} [_] The new group separator.
     * @return <tt>this</tt> or the current group separator.
     */
    format.group = function(_) {
        if(arguments.length) {
            groupSym = String(_);
            return this;
        }
        return groupSym;
    };

    /**
     * Gets or sets the array of group sizes.
     *
     * @param {number[]} [_] The new array of group sizes.
     * @return <tt>this</tt> or the current array of group sizes.
     */
    format.groupSizes = function(_) {
        if(arguments.length) {
            if(!_|| !_.length) throw def.error.argumentRequired("groupSizes");
            groupSizes = _;
            return this;
        }
        return groupSizes;
    };

    /**
     * Gets or sets the negative sign character.
     * 
     * @param {string} [_] The new negative sign character.
     * @return <tt>this</tt> or the current negative sign character.
     */
    format.negativeSign = function(_) {
        if(arguments.length) {
            if(!_) throw def.error.argumentRequired("negativeSign");
            negSym = String(_);
            return this;
        }
        return negSym;
    };

    /**
     * Gets or sets the currency symbol to use in place of the `$` mask character.
     * 
     * @param {string} [_] The new currency symbol.
     * @return <tt>this</tt> or the current currency symbol.
     */
    format.currency = function(_) {
        if(arguments.length) {
            if(!_) throw def.error.argumentRequired("currency");
            currencySym = String(_);
            return this;
        }
        return currencySym;
    };

    /**
     * Gets or sets the character to use in place of a `0` mask character in the integer part.
     * The default pad character is "0" (zero).
     *
     * @param {string} [_] the new integer pad character.
     * @returns <tt>this</tt> or the current integer pad character.
     */
    format.integerPad = function(_) {
        if(arguments.length) {
            if(!_) throw def.error.argumentRequired("integerPad");
            padiSym = String(_);
            return this;
        }
        return padiSym;
    };

    /**
     * Sets or gets the character to use in place of a `0` mask character in the fractional part.
     * The default pad character is "0" (zero).
     *
     * @param {string} [_] the new fractional pad character.
     * @returns <tt>this</tt> or the current fractional pad character.
     */
    format.fractionPad = function(_) {
        if(arguments.length) {
            if(!_) throw def.error.argumentRequired("fractionPad");
            padfSym = String(_);
            return this;
        }
        return padfSym;
    };

    // ----------------

    function compileMask() {
        var sections = parseMask(mask), L, section, posSection;
        
        sections.forEach(compileSection);

        L = sections.length;
        posFormat = nullFormat = negFormat = zeroFormat = null;
        if(L) {
            posFormat = buildFormatSectionPosNeg((posSection = sections[0]));
            if(L > 1) {
                section = sections[1];
                negFormat = buildFormatSectionPosNeg(section.empty ? posSection : section);
                if(L > 2) {
                    section = sections[2];
                    zeroFormat = buildFormatSectionZero(section.empty ? posSection : section);
                    if(L > 3) {
                        section = sections[3];
                        nullFormat = buildFormatSectionNull(section.empty ? posSection : section);
                        if(L > 4) throw new Error("Invalid mask. More than 4 sections.");
                    }
                }
            }
        }

        dirty = 0;
    }

    // (mask) -> parsed-section[]

    /*
     *  Mask -> Sections : [ Section,... ]
     *    
     *  Section := {
     *      integer:    Part,   : Integer part
     *      fractional: Part,   : Fractional part
     *      scale:      1,      : Scale applied to number before formatting
     *      groupOn:    false,  : Whether grouping of integer part is on
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
     *    0 - Literal text
     *    1 - 0
     *    2 - #  
     *    3 - ,
     *    4 - $ (and USD?)
     *
     */
    function parseMask(mask) {
        var sections = [], L;
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
                    scale:   1, 
                    groupOn: 0,
                    integer:    {list: [], digits: 0}, 
                    fractional: {list: [], digits: 0}
                };
                part = section.integer;
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
                } else if(c === '$') {
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
                } else {
                    if(c === "%") { // Per cent
                        section.scale *= 100;
                    } else if(c === '\u2030') { // Per mille
                        section.scale *= 1000;
                    } else if(c === '\u2031') { // Per 10-mille
                        section.scale *= 10000;
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

    function compileSection(section) {
        if(!section.empty) {
            compileSectionPart(section, /*beforeDecimal*/true );
            compileSectionPart(section, /*beforeDecimal*/false);
        }
    }

    function compileSectionPart(section, beforeDecimal) {
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
                case 0: addStep(buildLiteral(token.text)); break;

                case 1: // 0
                case 2: // #
                    // After the first found zero, from the "edge", all #s are considered 0s.
                    if(hasZero && type === 2) type = 1;
                    addStep(buildReadDigit(
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
                    if(!hasIntegerAhead(tokens, i, L)) {
                        section.scale /= 1000;
                    } else if(hasInteger) {
                        section.groupOn = 1;
                    }
                    break; // case 3

                // $
                case 4: addStep(rt_currencySymbol); break;
            }
        } // end while

        if(!beforeDecimal && part.digits) steps.unshift(buildReadDecimalSymbol(hasZero));
    }

    function hasIntegerAhead(tokens, i, L) {
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

    function buildFormatSectionZero(section) {

        function rt_formatSectionZero() {
            return rt_formatSection(section, /*value*/0, /*negativeMode*/false);
        }

        return rt_formatSectionZero;
    }

    function buildFormatSectionNull(section) {

        function rt_formatSectionNull() {
            return rt_formatSection(section, /*value*/"", /*negativeMode*/false);
        }

        return rt_formatSectionNull;
    }

    function buildFormatSectionPosNeg(section) {

        function rt_formatSectionPosNeg(value, zeroFormat, negativeMode) {
            var value0 = value;

            // 1) scale
            value *= section.scale;

            // 2) round fractional part
            value = pvc.round10(value, section.fractional.digits);

            // 3) if 0 and zeroFormat, fall back to zeroFormat
            return (!value && zeroFormat) 
                ? zeroFormat(value0)
                : rt_formatSection(section, value, negativeMode);
        }

        return rt_formatSectionPosNeg;
    }

    // Helper section formatting function.
    function rt_formatSection(section, value, negativeMode) {
        var svalue = "" + value,
            idot   = svalue.indexOf("."),
            itext  = idot < 0 ? svalue : svalue.substr(0, idot),
            ftext  = idot < 0 ? ""     : svalue.substr(idot + 1);

        // Don't show a single integer "0". It's not significant.
        if(itext === "0") itext = "";

        var out = [];
        if(negativeMode) out.push(negSym);

        itext = itext.split("");
        ftext = ftext.split("");

        if(groupSym && section.groupOn) rt_addGroupSeparators(itext);

        section.integer   .list.forEach(function(f) { out.push(f(itext)); });
        section.fractional.list.forEach(function(f) { out.push(f(ftext)); });
        return out.join("");
    }

    /**
     * Adds group separators to a specified integer digits array.
     * @param {string[]} itext The integer digits array.
     * @private
     */
    function rt_addGroupSeparators(itext) {
        var separate = function() { itext[D - d - 1] += groupSym; },
            D  = itext.length,
            gs = groupSizes,
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
    // token-read-function : (itext or ftext: string[]) -> string

    function buildLiteral(s) {

        function rt_literal() { return s; }

        return rt_literal;
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
    function buildReadDigit(beforeDecimal, digit, zero, edge) {

        var pad = zero ? (beforeDecimal ? padiSym : padfSym) : "";
        
        // text : integer part text digits array
        function rt_readInteger(text) {
            var L = text.length;
            if(digit < L) {
                var i = L - 1 - digit;
                return edge ? text.slice(0, i + 1).join("") : text[i];
            }
            return pad;
        }

        // text : fractional part text digits array, already rounded
        function rt_readFractional(text) {
            return digit < text.length ? text[digit] : pad;
        }

        return beforeDecimal ? rt_readInteger : rt_readFractional;
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
    function buildReadDecimalSymbol(hasZero) {
        return hasZero ? rt_decimalSymbol : rt_decimalSymbolUnlessInt;
    }

    // token-read-function
    function rt_decimalSymbol() { 
        return decimalSym; 
    }

    // token-read-function
    function rt_decimalSymbolUnlessInt(ftext) { 
        return ftext.length ? decimalSym : ""; 
    }

    // token-read-function
    function rt_currencySymbol() {
        return currencySym;
    }

    return format.mask(mask);
};