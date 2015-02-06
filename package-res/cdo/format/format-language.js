var _languages = {'neutral': formProvider.defaults},
    _currentProvider = _languages.neutral;

/**
 * Configure a new or existing format provider
 *
 * @param lang   language code
 * @param config configuration for specified language
 * @returns {cdo.FormatProvider}
 * @private
 */
function configLanguage(lang, config) {
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
 * Normalize the language code in the format 'xx-XX'
 *
 * @param langCode
 * @returns {string} The normalized language code
 */
function normalizeLanguageCode(lang) {
    return lang = lang.replace('_', '-')
        .replace(/([a-z]{2,3}-)/i, function(s) {return s.toLowerCase()})
        .replace(/-[a-z]{2,3}/i, function(s) {return s.toUpperCase()});
}

/**
 *  Gets, sets or <i>configures</i> new or existing providers.
 *
 *  The default language is <tt>"neutral"</tt>
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
      if(def.is(style, formProvider)) {
          return (_currentProvider = style);
      }

      if(typeof style === 'object') {
          for(var key in style) {
            configLanguage(key, def.getOwn(style, key));
          }
          return cdo.format;
      }

      style = (style == '') ? 'neutral' : style;
      return def.getOwn(_languages, normalizeLanguageCode(style));
  }

  if(L == 2) { //config specified lang
      return configLanguage(normalizeLanguageCode(style), config);
  }

  throw def.error.operationInvalid("Wrong number of arguments");
};

langProvider({
    'en-GB': {
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

    'en-US': {
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
                currency:      '$'
            }
        },
        date: {
            mask:              '%Y/%m/%d'
        }
    },

    'pt-PT': {
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
