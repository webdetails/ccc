
/**
 * The default color scheme used by charts.
 * <p>
 * Charts use the color scheme specified in the chart options
 * {@link pvc.BaseChart#options.colors}
 * and
 * {@link pvc.BaseChart#options.color2AxisColorss},
 * for the main and second axis series, respectively,
 * or, when any is unspecified,
 * the default color scheme.
 * </p>
 * <p>
 * When null, the color scheme {@link pv.Colors.category10} is implied.
 * To obtain the default color scheme call {@link pvc.createColorScheme}
 * with no arguments.
 * </p>
 * <p>
 * To be generically useful,
 * a color scheme should contain at least 10 colors.
 * </p>
 * <p>
 * A color scheme is a function that creates a {@link pv.Scale} color scale function
 * each time it is called.
 * It sets as its domain the specified arguments and as range
 * the pre-spcecified colors of the color scheme.
 * </p>
 *
 * @readonly
 * @type function
 */
pvc.defaultColorScheme = null;

pvc.brighterColorTransform = function(color) {
    return (color.rgb ? color : pv.color(color)).brighter(0.6);
};

/**
 * Sets the colors of the default color scheme used by charts
 * to a specified color array.
 * <p>
 * If null is specified, the default color scheme is reset to its original value.
 * </p>
 *
 * @param {string|pv.Color|string[]|pv.Color[]|pv.Scale|function} [colors=null] Something convertible to a color scheme by {@link pvc.colorScheme}.
 * @return {null|pv.Scale} A color scale function or null.
 */
pvc.setDefaultColorScheme = function(colors) {
    return pvc.defaultColorScheme = pvc.colorScheme(colors);
};

pvc.defaultColor = pv.Colors.category10()('?');

/**
 * Creates a color scheme if the specified argument is not one already.
 *
 * <p>
 * A color scheme function is a factory of protovis color scales.
 * Given the domain values, returns a protovis color scale.
 * The arguments of the function are suitable for passing
 * to a protovis scale's <tt>domain</tt> method.
 * </p>
 *
 * @param {string|pv.Color|string[]|pv.Color[]|pv.Scale|function} [colors=null] A value convertible to a color scheme:
 * a color string,
 * a color object,
 * an array of color strings or objects,
 * a protovis color scale function,
 * a color scale factory function (i.e. a color scheme),
 * or null.
 *
 * @returns {null|function} A color scheme function or null.
 */
pvc.colorScheme = function(colors) {
    if(colors == null) return null;

    if(typeof colors === 'function') {
        // Assume already a color scheme (a color scale factory)
        if(!colors.hasOwnProperty('range')) return colors;

        // A protovis color scale
        // Obtain its range colors array and discard the scale function.
        colors = colors.range();
    } else {
        colors = def.array.as(colors);
    }

    if(!colors.length) return null;

    return function() {
        var scale = pv.colors(colors); // creates a color scale with a defined range
        scale.domain.apply(scale, arguments); // defines the domain of the color scale
        return scale;
    };
};

/**
 * Creates a color scheme based on the specified colors.
 * When no colors are specified, the default color scheme is returned.
 *
 * @see pvc.defaultColorScheme
 * @param {string|pv.Color|string[]|pv.Color[]|pv.Scale|function} [colors=null] Something convertible to a color scheme by {@link pvc.colorScheme}.
 * @type function
 */
pvc.createColorScheme = function(colors) {
    return pvc.colorScheme(colors) ||
        pvc.defaultColorScheme  ||
        pv.Colors.category10;
};

// Convert to Grayscale using YCbCr luminance conv.
pvc.toGrayScale = function(color, alpha, maxGrayLevel, minGrayLevel) {
    color = pv.color(color);

    var avg = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
    // Don't let the color get near white, or it becomes unperceptible in most monitors
    if(maxGrayLevel === undefined)
        maxGrayLevel = 200;
    else if(maxGrayLevel == null)
        maxGrayLevel = 255; // no effect

    if(minGrayLevel === undefined)
        minGrayLevel = 30;
    else if(minGrayLevel == null)
        minGrayLevel = 0; // no effect

    var delta = (maxGrayLevel - minGrayLevel);
    avg = (delta <= 0)
        ? maxGrayLevel
        // Compress
        : (minGrayLevel + (avg / 255) * delta);

    if(alpha == null)
        alpha = color.opacity;
    else if(alpha < 0)
        alpha = (-alpha) * color.opacity;

    avg = Math.round(avg);

    return pv.rgb(avg, avg, avg, alpha);
};
