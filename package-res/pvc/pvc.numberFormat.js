pvc.numberFormat = function(mask) {
  var mask;

  // Number Format Style
  var padiSym    = "0", // default integer pad
      padfSym    = "0", // default fraction pad
      decimalSym = ".", // default decimal separator
      groupSym   = ",", // default group separator
      negSym     = "-", //\u2212", // default negative symbol
      currencySym = "$"; // default currency symbol

  var posFormat, negFormat, zeroFormat, nullFormat;

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
  format.mask = function(_) {
    if(arguments.length) {
      mask = _;
      var sections = parseMask(_), L, section, posSection;
      sections.forEach(compileSection);

      L = sections.length;
      posFormat = nullFormat = negFormat = zeroFormat = null;
      if(L) {
        posFormat = buildPosNegFormat((posSection = sections[0]));
        if(L > 1) {
          section = sections[1];
          negFormat = buildPosNegFormat(section.empty ? posSection : section);
          if(L > 2) {
            section = sections[2];
            zeroFormat = buildZeroFormat(section.empty ? posSection : section);
            if(L > 3) {
              section = sections[3];
              nullFormat = buildNullFormat(section.empty ? posSection : section);
              if(L > 4) throw new Error("Invalid mask. More than 4 sections.");
            }
          }
        }
      }
      return this;
    }

    return mask;
  };

  /*
   *  Mask -> Sections : [ Section,... ]
   *    
   *  Section := {
   *      is:     [Token,... ],  - Integer tokens (converted to integer steps when compiled)
   *      fs:     [Token,... ],  - Fractional tokens (converted to fractional steps when compiled)
   *      scale:   1,            - Scale applied to number before formatting 
   *      groupOn: false,        - Whether grouping of integer part is on
   *      icount:  0             - Number of integer positions found (0 and #)
   *      fcount:  0             - Number of fractional positions found (0 and #)
   *  }
   *    
   *  Token := {
   *     type: TokenType,
   *     text: ""                - For token of type 0 - literal text
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
          empty = 1,
          dcount;

      // sections: [ {is: integerTokens, fs: fractionTokens, scale: 1}, ... ]
      var beforeDecimal = 1, // in the integer part
          hasInteger;    // if 0 or # has been found in the integer part
          
      var addToken0 = function(token) {
        empty = 0;
        section[beforeDecimal ? 'is' : 'fs'].push(token);
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
        if(!hasInteger) addToken0({type: 2});
        section.icount = dcount;
        dcount = 0;
        beforeDecimal = 0;
      };

      var endSection = function() {
        if(!empty && section) {
          if(beforeDecimal) endInteger();
          
          section.fcount = dcount;
          sections.push(section);          
        }

        empty  = beforeDecimal = 1; 
        dcount = hasInteger = 0;
        section = {empty: false, is: [], fs: [], scale: 1, icount: 0, fcount: 0};
      };

      endSection();

      while(++i < L) {
        c = mask[i];

        if(c === '0') {
          addToken({type: 1});
          hasInteger = true;
          dcount++;
        } else if(c === '#') {
          addToken({type: 2});
          hasInteger = true;
          dcount++;
        } else if(c === ',') {
          if(beforeDecimal) addtoken({type: 3});
        } else if(c === '.') {
          if(beforeDecimal) endInteger();
        } else if(c === '$') {
          addToken({type: 4});
        } else if(c === ';') {
          endSection();

          // A second, third, or fourth empty section
          // should be = to the first section.
          if(i + 1 >= L || mask[i + 1] === ';') {
            // Add empty section
            i++;
            sections.push({empty: true});
          }
        } else if(c === '\\') {
          // Ignore \
          i++;

          // Output next character, if any, whatever it is.
          if(i < L) addTextFrag(mask[i]);
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

  function compileSection(section) {
    if(!section.empty) {
      compileSectionInteger(section);
      compileSectionFractional(section);
    }
  }

  function compileSectionInteger(section) {
    var tokens = section.is,
        idigit = section.icount - 1, // index of first/next integer digit to be read
        steps  = (section.is = []), 
        i = -1, L = tokens.length, 
        hasInteger = 0, hasZero = 0, hasIntegerAhead = 0,
        j, token, type, type2;

    section.groupOn = false;

    // -> ###0000
    // steps are ordered from most to least significant ( -->. )
    while(++i < L) {
      token = tokens[i];
      switch((type = token.type)) {
        // literal text
        case 0: steps.push(rt_constant(token.text)); break;

        case 1: // 0
        case 2: // #
          // After the first found zero, from the left, all #s are considered 0s.
          if(hasZero && type === 2) type = 1;
          steps.push(rt_readIntegerOr(/*index*/idigit, /*zero*/type === 1, /*all*/!hasInteger));
          idigit--;
          hasInteger = 1;
          if(!hasZero && type === 1) hasZero = 1;
          break;

        case 3: // ,
          // Group separator or Scaling
          
          // 1) Scaling:
          //    If, until the end of the integer tokens, 
          //    no 0 or # are found,
          //    then each found comma divides by thousand.
          // 2) Else, if 0 or # were found before,
          //    as we already know one was found ahead,
          //    then the comma activates the group separator.
          // 3) Else, ignore the comma.
          //
          // In any case, commas are not output by a dedicated function step.
          // For groups, they are output by normal 0 or # functions, when active.
          // For scaling, they affect the scale variable, that is specially handled
          // before any formatting occurs.

          // look ahead
          j = i;
          hasIntegerAhead = 0;
          while(++j < L) {
            type2 = tokens[j].type;
            if(type2 === 1 || type2 === 2) {
              hasIntegerAhead = 1;
              break;
            }
          }

          if(!hasIntegerAhead) {
            section.scale /= 1000;
          } else if(hasInteger) {
            section.groupOn = true;
          }
          break; // case 3

        // $
        case 4: steps.push(rt_readCurrencySymbol); break;
      }
    } // end while
  }

  function compileSectionFractional(section) {
    // .0000##  <--- parse from right to left
    // steps are ordered from most to least significant (. -->)
    var tokens = section.fs,
        fdigit = section.fcount - 1, // index of first/next fractional digit to be read
        steps  = (section.fs = []),
        i = tokens.length,
        hasZero = 0,
        token, type;

    while(i--) {
      token = tokens[i];
      switch((type = token.type)) {
        // Literal text
        case 0: steps.unshift(rt_constant(token.text)); break;

        case 1: // 0
        case 2: // #
          // After the first found zero, from the right, all #s are considered 0s.
          if(hasZero && type === 2) type = 1;
          steps.unshift(rt_readFractionalOr(/*digit*/fdigit, /*zero*/type === 1));
          fdigit--;
          if(!hasZero && type === 1) hasZero = 1;
          break;

        // $
        case 4: steps.unshift(rt_readCurrencySymbol); break;
      }
    } // end while

    if(section.fcount) steps.unshift(rt_readDecimalSymbol(hasZero));
  }

  // ----------------

  function buildZeroFormat(section) {
    return function() {
      return rt_formatSection(section, /*value*/0, /*negativeMode*/false);
    };
  }

  function buildNullFormat(section) {
    return function() {
      return rt_formatSection(section, /*value*/"", /*negativeMode*/false);
    };
  }
  
  function buildPosNegFormat(section) {
    return function(value, zeroFormat, negativeMode) {
      var value0 = value;

      // 1) scale
      value *= section.scale;

      // 2) round fractional part
      value = round10(value, section.fcount);

      // 3) if 0 and zeroFormat, fall back to zeroFormat
      return (!value && zeroFormat) 
        ? zeroFormat(value0)
        : rt_formatSection(section, value, negativeMode);
    };
  }

  function rt_formatSection(section, value, negativeMode) {
    var svalue = "" + value,
        idot   = svalue.indexOf("."),
        itext  = idot < 0 ? svalue : svalue.substr(0, idot)
        ftext  = idot < 0 ? ""     : svalue.substr(idot + 1);
    
    // Don't show a single integer "0". It's not significant.
    if(itext === "0") itext = "";

    var out = [];
    if(negativeMode) out.push(negSym);
    section.is.forEach(function(f) { out.push(f(itext)); });
    section.fs.forEach(function(f) { out.push(f(ftext)); });
    return out.join("");
  }

  function rt_constant(v) {
    return function() { return v; };
  }

  // idigit -> from the decimal point to the left, the integer digit index
  // zero   -> 0 or #
  // all    -> one or all still available digits from idigit to the left
  function rt_readIntegerOr(idigit, zero, all) {
    // itext -> integer part text
    return function(itext) {
      var L = itext.length;
      if(idigit < L) {
        var i = L - 1 - idigit;
        return all ? itext.substr(0, i + 1) : itext.charAt(i);
      }

      return zero ? padiSym : "";
    };
  }

  // fdigit -> from the decimal point to the right, the fractional digit index
  // zero   -> 0 or #
  function rt_readFractionalOr(fdigit, zero) {
    // ftext -> fractional part text, already rounded
    return function(ftext, i) {
      return fdigit < ftext.length ? ftext.charAt(fdigit) : 
             zero  ? padiSym : "";
    };
  }

  function rt_readDecimalSymbol(hasZero) {
    // When the mask has no fractional 0s, 
    // only output the decimal symbol if 
    // there's at least one significant fractional digit
    // in the actual value.
    // ex: ".#"
    return hasZero 
      ? function(     ) { return decimalSym; }
      : function(ftext) { return ftext ? decimalSym : ""; };
  }

  function rt_readCurrencySymbol() {
    return currencySym;
  }

  function format(value) {
    // 1) if null
    //    use null format or use ""
    if(value == null) return nullFormat ? nullFormat() : "";
    
    // 2) convert to number using +
    value = +value;

    // 3) if NaN, or Infinity or -Infinity
    //    Intl symbols? or backwards compatible "" ?
    if(isNaN(value) || !isFinite(value)) return ""; // TODO

    if(!posFormat) return "" + value;

    // 5) if === 0, use zero format (or positive format, if none).
    if(value === 0) return zeroFormat ? zeroFormat() : posFormat(value, /*zf*/null, /*isNegative*/false);

    // 6) if  >  0, use positive format (falling back to zeroFormat, if is 0 after scale and round)
    if(value  >  0) return posFormat(value, zeroFormat, /*isNegative*/false);

    // 7) if  <  0, use negative format (or positive format in negative mode) (falling back to zeroFormat, if is 0 after scale and round)
    // if(value < 0)
    return negFormat ? negFormat(-value, zeroFormat || posFormat) : posFormat(-value, zeroFormat, /*isNegative*/true);
  }

  // Adapted from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
  function round10(value, places) {
    if(!places) return Math.round(value);

    value = +value;

    // If the value is not a number or the exp is not an integer...
    if(isNaN(value) || !(typeof places === 'number' && places % 1 === 0)) return NaN;
    
    // Shift
    value = value.toString().split('e');
    value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + places) : places)));
    
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] - places) : -places));
  }


  return format.mask(mask);
};