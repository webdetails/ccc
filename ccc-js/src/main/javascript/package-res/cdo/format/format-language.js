var _languages = {},
    _currentProvider = (_languages[_defaultLangCode] = formProvider.defaults);

/**
 * Configure a new or existing format provider
 *
 * @param lang   language code
 * @param config configuration for specified language
 * @returns {cdo.FormatProvider}
 * @private
 */
function configLanguage(lang, config) {

    lang = normalizeLanguageCode(lang);

    var langStyle = def.getOwn(_languages, lang);
    if(!langStyle) {
        langStyle = _languages[lang] = formProvider(config);
        langStyle.languageCode = lang;
    } else {
        def.configure(langStyle, config);
    }
    return langStyle;
}

/**
 * Parse the language code into the format 'xx-xx'
 *
 * @param langCode
 * @returns {object} The parsed language code
 */
function parseLanguageCode(langCode) {
    var re = /^([a-z]{2,8})(?:[-_]([a-z]{2}|\d{3}))?$/i,
        m = re.exec(langCode);

    if(!m) return null;

    var primary = m[1] ? m[1].toLowerCase() : "",
        region  = m[2] ? m[2].toLowerCase() : "";

    return {
        code:    primary + (region ? ("-" + region) : ""),
        primary: primary,
        region:  region
    };
}

/**
 * Normalize the language code by setting it to lower case
 *
 * @param langCode
 * @returns {string}
 */
function normalizeLanguageCode(langCode) {
    return langCode ? langCode.toLowerCase() : "";
}

/**
 * Function that will return the format provider associated with
 * the specified language. If nothing is found and the fallback
 * flag is active it will try to find a similar language or
 * fallback to the default one if nothing is found again.
 *
 * @param langCode Language code
 * @param fallback Use fallback strategy if true, otherwise doesn't use
 * @returns {cdo.FormatProvider}
 */
function getLanguage(langCode, fallback) {

    langCode = normalizeLanguageCode(langCode);

    //Always try the normalized language code, as an escape for those we don't know how to parse.
    var lang = def.getOwn(_languages, langCode);
    if(lang) return lang;
    if(!fallback) return null;

    // norm = {code: "pt-pt", primary: "pt", region: "pt"}
    var norm = parseLanguageCode(langCode);

    if(norm) {
        //pt-pt
        if(norm.code !== langCode && (lang = def.getOwn(_languages, norm.code))) return lang;
        // "pt" - primary tag is required
        if(norm.region && (lang = def.getOwn(_languages, norm.primary))) return lang;
    }
    // Return the default language or, if all goes wrong, null.
    return def.getOwn(_languages, _defaultLangCode, null);
}

/**
 *  Gets, sets or <i>configures</i> new or existing providers.
 *
 *  The default language is <tt>"en-us"</tt>
 *
 *  @function
 *  @param {string|object} [style]
 *  @param {object|cdo.FormatProvider|cdo.NumberFormat|cdo.CustomFormat} [config]
 *
 *  When no arguments are specified it will get the current format provider being used.
 *
 *  When one argument is specified:
 *  <ul>
 *    <li>And it's a string, it will get the format provider correspondent to specified language.</li>
 *    <li>And it's an object, it will iterate through it to create and configure the different
 *      pairs of language code and configuration.</li>
 *    <li>And it's a {@link cdo.FormatProvider} it will replace the current provider being used.</li>
 *  </ul>
 *
 *  When two arguments are specified, it will create and/or configure the format provider
 *  correspondent to the specified language code with the given configuration object.
 *
 *  @return {cdo.FormatProvider}
 */
var langProvider = cdo.format.language = function(style, config) {
  var L = arguments.length;

  if(!L) return _currentProvider;

  if(L == 1) {
      if(style === undefined) throw def.error.operationInvalid("Undefined 'style' value.");

      if(style === null || style === '') {
          style = _defaultLangCode;
      } else {
          if(def.is(style, formProvider)) {
              return (_currentProvider = style);
          }

          if(typeof style === 'object') {
              for(var key in style) {
                  configLanguage(key, def.getOwn(style, key));
              }
              return cdo.format;
          }
      }

      return getLanguage(style, true);
  }

  if(L == 2) {
      return configLanguage(style, config);
  }

  throw def.error.operationInvalid("Wrong number of arguments");
};

langProvider({
    'en-gb': {
        number: {
            mask:              '#,0.##',
            style: {
                integerPad:    '0',
                fractionPad:   '0',
                decimal:       '.',
                group:         ',',
                groupSizes:    [3],
                abbreviations: ['k', 'm', 'b', 't'],
                negativeSign:  '-',
                currency:      '£'
            }
        },
        date: {
            mask:              '%d/%m/%Y'
        }
    },

    'pt-pt': {
        number: {
            mask:              '#,0.##',
            style: {
                integerPad:    '0',
                fractionPad:   '0',
                decimal:       ',',
                group:         ' ',
                groupSizes:    [3],
                abbreviations: ['k','m', 'b', 't'],
                negativeSign:  '-',
                currency:      '€'
            }
        },
      date: {
          mask:                '%d/%m/%Y'
      }
    }
});
