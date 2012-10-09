
/**
 * The chart options <i>applicable</i>
 * to all charts.
 * 
 * @class
 */
pvc.options.BaseChartOptions = function(){};
        
        
        
        
/**
 * A callback function that is called,
 * when the user clicks on a visual element.
 * 
 * @returns {undefined}
 * @method
 * @this pvc.visual.Context
 * @param {pvc.visual.Scene} scene
 * The scene associated with the visual item.
 * 
 * @category Actions
 */
pvc.options.BaseChartOptions.prototype.clickAction = function(){};
/**
 * A callback function that is called,
 * when the user double-clicks on a visual element.
 * 
 * @returns {undefined}
 * @method
 * @this pvc.visual.Context
 * @param {pvc.visual.Scene} scene
 * The scene associated with the visual item.
 * 
 * @category Actions
 */
pvc.options.BaseChartOptions.prototype.doubleClickAction = function(){};
/**
 * A callback function that is called
 * before the chart is rendered,
 * but after if has been pre-rendered.
 * <p>
 * You can use this action to:
 * <ul>
 * <li>use the <i>mark events</i> API on time-series categorical charts</li>
 * <li>extend in special ways the already created protovis marks.</li>
 * </ul>
 * 
 * @returns {undefined}
 * @method
 * @this pvc.visual.Context
 * @param {pvc.visual.Scene} scene
 * The scene associated with the visual item.
 * 
 * @category Actions
 */
pvc.options.BaseChartOptions.prototype.renderCallback = function(){};
/**
 * A callback function that is called
 * when, after selection has changed,
 * the chart is updated to reflect the change.
 * 
 * @returns {undefined}
 * @method
 * @this pvc.visual.Context
 * @param {list(pvc.data.Datum)} selectedDatums
 * An array with the resulting selected datums.
 * 
 * @category Actions
 */
pvc.options.BaseChartOptions.prototype.selectionChangedAction = function(){};
/**
 * A callback function that is called
 * when the user performs a selection,
 * but before the corresponding datums' selected state are actually changed.
 * <p>
 * This function is usefull to restrict, amplify, or normalize the selection.
 * 
 * @returns {list(pvc.data.Datum)}
 * The datums that should be actually selected.
 * 
 * @method
 * @this pvc.visual.Context
 * @param {list(pvc.data.Datum)} selectingDatums
 * An array with the datums that will be selected by the current operation.
 * 
 * @category Actions
 */
pvc.options.BaseChartOptions.prototype.userSelectionAction = function(){};
/**
 * The CCC version that the chart should run in.
 * <p>
 * The value <tt>1</tt> emulates version 1 of CCC.
 * 
 * @returns {number}
 * @default Infinity
 * @category Behavior
 */
pvc.options.BaseChartOptions.prototype.compatVersion = undefined;
/**
 * A map whose keys are 
 * the dimension type group names and whose values are 
 * the default dimension type group options.
 * <p>
 * A dimension type group is 
 * a group of dimension types
 * that have a common non-numeric prefix in its name.
 * <p>
 * This property does not define any dimension types, per si,
 * but allows specifying default values
 * for dimension types of a group, 
 * that apply in case they are effectively used.
 * 
 * @returns {map(string : pvc.options.DimensionTypeOptions)}
 * @category Data
 */
pvc.options.BaseChartOptions.prototype.dimensionGroups = undefined;
/**
 * A map whose keys are 
 * the dimension type names and whose values are 
 * the dimension type options. 
 * <p>
 * You don't need to define dimensions 
 * unless you want to change their name or properties.
 * Charts automatically define default dimensions
 * to satisfy their visual roles' requirements.
 * <p>
 * Dimension options can be partial, 
 * so that it is possible to override only certain options.
 * 
 * @returns {map(string : pvc.options.DimensionTypeOptions)}
 * @category Data
 */
pvc.options.BaseChartOptions.prototype.dimensions = undefined;
/**
 * The separator used to join the labels of the values of 
 * a multi-dimensional visual role.
 * <p>
 * For example, if a visual role, 
 * has the dimensions "Territory" and "ProductType",
 * a compound value could be shown as "EMEA ~ Classic Cars". 
 * 
 * @returns {string}
 * @default ' ~ '
 * @category Data
 */
pvc.options.BaseChartOptions.prototype.groupedLabelSep = undefined;
/**
 * Indicates if datums
 * whose value of all measure dimensions is null 
 * should be ignored.
 * <p>
 * A dimension is considered a measure dimension if 
 * there is at least one measure role currently bound to it.
 * 
 * @returns {boolean}
 * @default true
 * @category Data
 */
pvc.options.BaseChartOptions.prototype.ignoreNulls = undefined;
/**
 * A function used to format non-null numeric values
 * as percentages.
 * <p>
 * The numeric value has still to be multiplied by 100.
 * <p>
 * This function is used whenever a chart needs to 
 * show percentages of a numeric dimension, 
 * like is the case for the tooltips of a stacked chart or
 * the percentages shown in a Pie chart.
 * <p>
 * The default value of this option is a function that 
 * formats percentages with one decimal place and 
 * a "%" character suffix.
 * 
 * @returns {string!}
 * The number formatted as a non-empty string.
 * 
 * @method
 * @this null
 * @param {number!} value
 * The non-null number to format.
 * 
 * @category Data
 */
pvc.options.BaseChartOptions.prototype.percentValueFormat = function(){};
/**
 * Indicates that dimensions of the "category" group 
 * (i.e. named <tt>category</tt>, <tt>category2</tt>, ...)
 * have a <tt>Date</tt> value type,
 * by default.
 * <p>
 * This option has no effect on other dimensions,
 * even if bound to a "category" visual role.
 * In those cases,
 * explicitly define the dimension with
 * the <tt>Date</tt> value type.
 * <p>
 * Dimensions are considered continuous, by default,
 * when they have a continuous value type.
 * However, 
 * not all visual roles support continuous dimensions.
 * In those cases, 
 * the dimension is treated as a discrete dimension,
 * event though it has a continuous value type.
 * 
 * @returns {boolean}
 * @default false
 * @category Data
 */
pvc.options.BaseChartOptions.prototype.timeSeries = undefined;
/**
 * The format string used by default to <i>parse</i>
 * dimensions of the <tt>Date</tt> value type.
 * <p>
 * The syntax of the format string is that of 
 * <i>protovis</i>' date formats.
 * <p>
 * This property changes the default of the 
 * {@link pvc.options.DimensionTypeOptions#rawFormat}
 * <p>
 * property,
 * for dimensions with a <tt>Date</tt> value type.  
 * 
 * @returns {string}
 * @default '%Y-%m-%d'
 * @category Data
 */
pvc.options.BaseChartOptions.prototype.timeSeriesFormat = undefined;
/**
 * A function that formats the
 * non-null <i>numeric</i> values
 * of the dimensions named <tt>value</tt>, <tt>value2</tt>, etc.
 * <p>
 * This property is used to default the property 
 * {@link pvc.options.DimensionTypeOptions#formatter}
 * of the mentioned dimensions.
 * <p>
 * The default value of this option is a function that 
 * formats numbers with two decimal places.
 * 
 * @returns {string!}
 * The number formatted as a non-empty string.
 * 
 * @method
 * @this null
 * @param {number!} value
 * The non-null number to format.
 * 
 * @category Data
 */
pvc.options.BaseChartOptions.prototype.valueFormat = function(){};
/**
 * Indicates if the data source is in <i>crosstab</i> format.
 * 
 * @returns {boolean}
 * @default true
 * @category Data Translation
 */
pvc.options.BaseChartOptions.prototype.crosstabMode = undefined;
/**
 * Indicates if the data source has 
 * multiple value dimensions.
 * 
 * @returns {boolean}
 * @default false
 * @category Data Translation
 */
pvc.options.BaseChartOptions.prototype.isMultiValued = undefined;
/**
 * The indexes of the data source's <i>virtual item</i> columns
 * that are to feed the 
 * default 
 * <tt>value</tt>, 
 * <tt>value2</tt>, ... 
 * dimensions.
 * <p>
 * This option only applies to data sources in 
 * relational format with multiple values, 
 * i.e., 
 * when 
 * <tt>crosstabMode=false</tt> and 
 * <tt>isMultiValued=true</tt>.
 * 
 * @returns {number|string|list(number|string)}
 * @default true
 * @category Data Translation
 */
pvc.options.BaseChartOptions.prototype.measuresIndexes = undefined;
/**
 * The indexes of the data source's <i>virtual item</i> columns
 * that are to feed the 
 * default 
 * <tt>multiChart</tt>, 
 * <tt>multiChart2</tt>, ... 
 * dimensions.
 * 
 * @returns {number|string}
 * @default true
 * @category Data Translation
 */
pvc.options.BaseChartOptions.prototype.multiChartIndexes = undefined;
/**
 * An array of dimensions readers.
 * <p>
 * Can be specified to customize the 
 * translation process of the data source. 
 * 
 * @returns {list(pvc.options.DimensionsReaderOptions)}
 * @category Data Translation
 */
pvc.options.BaseChartOptions.prototype.readers = undefined;
/**
 * Indicates if, 
 * in the data source, 
 * the "series" data is in the rows, 
 * instead of, as is more usual, in the columns.
 * <p>
 * The name of this option is inspired in 
 * the <i>crosstab</i> format, 
 * where the "series" values are placed in the first row,
 * and "category" values are placed in the first column
 * (corner cell is empty).
 * <p>
 * When this option is <tt>true</tt>, in the <i>crosstab</i> format,
 * the result is equivalent to transposing the data table,
 * which results in "series" data being placed in the first column,
 * i.e. <i>in the rows</i>, 
 * and the "category" data being placed in the first row.
 * <p>
 * In the <i>relational</i> data source format, 
 * this option effects a conceptually equivalent operation,
 * by switching the "series" and "category" columns.
 * 
 * @returns {boolean}
 * @default false
 * @category Data Translation
 */
pvc.options.BaseChartOptions.prototype.seriesInRows = undefined;
/**
 * The identifier of the HTML element, 
 * or the element itself,
 * where the chart is to be created in.
 * <p>
 * The chart element will be a child of
 * the canvas element.
 * <p>
 * When unspecified, the chart
 * element will be added as the 
 * last child of the HTML document body.
 * 
 * @returns {string|object}
 * @category General
 */
pvc.options.BaseChartOptions.prototype.canvas = undefined;
/**
 * Indicates if a chart should show an entry animation, 
 * every time it is rendered.
 * Most charts perform some sort of entry animation 
 * of its main visual elements.
 * 
 * @returns {boolean}
 * @default true
 * @category Interaction
 */
pvc.options.BaseChartOptions.prototype.animate = undefined;
/**
 * <p>
 * Controls if and how the selection can be cleared by the user.
 * 
 * @returns {pvc.options.ClearSelectionMode}
 * @default 'emptySpaceClick'
 * @category Interaction
 */
pvc.options.BaseChartOptions.prototype.clearSelectionMode = undefined;
/**
 * Indicates if the chart is clickable by the user.
 * <p>
 * If this option is <tt>false</tt>, 
 * any click-related actions will not be executed 
 * (ex: 
 * {@link #clickAction},
 * {@link #doubleClickAction}, or
 * {@link pvc.options.DiscreteAxisOptions#clickAction}).
 * 
 * @returns {boolean}
 * @default false
 * @category Interaction
 */
pvc.options.BaseChartOptions.prototype.clickable = undefined;
/**
 * When <tt>true</tt>, 
 * indicates that a selection made by the user 
 * replaces the current selection, if any.
 * <p>
 * For the selection to be additive, 
 * the <tt>CTRL</tt> key must be pressed, 
 * by the end of the operation.
 * <p>
 * When <tt>false</tt>,
 * indicates that any selection made by the user is additive.
 * The <tt>CTRL</tt> key has no effect.
 * 
 * @returns {boolean}
 * @default true
 * @category Interaction
 */
pvc.options.BaseChartOptions.prototype.ctrlSelectMode = undefined;
/**
 * The maximum number of milliseconds,
 * between two consecutive clicks,
 * for them to be considered a double-click.
 * 
 * @returns {number}
 * @default 300
 * @category Interaction
 */
pvc.options.BaseChartOptions.prototype.doubleClickMaxDelay = undefined;
/**
 * Indicates if the chart's visual elements
 * are automatically highlighted 
 * when the user hovers over them with the mouse.
 * 
 * @returns {boolean}
 * @default false
 * @category Interaction
 */
pvc.options.BaseChartOptions.prototype.hoverable = undefined;
/**
 * Indicates if the chart's visual elements
 * can be selected by the user, 
 * by clicking on them 
 * or using the rubber-band.
 * 
 * @returns {boolean}
 * @default false
 * @category Interaction
 */
pvc.options.BaseChartOptions.prototype.selectable = undefined;
/**
 * Indicates if tooltips are shown
 * when the user hovers over visual elements with the mouse.
 * 
 * @returns {boolean}
 * @default true
 * @category Interaction
 */
pvc.options.BaseChartOptions.prototype.showTooltips = undefined;
/**
 * Contains tooltip presentation options.
 * 
 * @returns {TooltipOptions}
 * @category Interaction
 */
pvc.options.BaseChartOptions.prototype.tipsySettings = undefined;
/**
 * A callback function that is called,
 * to build the tooltip of a visual element.
 * <p>
 * Whether the tooltip format is HTML or plain text must 
 * be known by the formatter.
 * 
 * @returns {string}
 * The tooltip text.
 * 
 * @method
 * @this pvc.visual.Context
 * @param {pvc.visual.Scene} scene
 * The scene whose tooltip is to be built.
 * <p>
 * Use the data contained in the scene object to 
 * build the tooltip.
 * 
 * @category Interaction
 */
pvc.options.BaseChartOptions.prototype.tooltipFormat = function(){};
/**
 * The height of the chart, in pixels.
 * 
 * @returns {number}
 * @default 300
 * @category Layout
 */
pvc.options.BaseChartOptions.prototype.height = undefined;
/**
 * The chart orientation indicates if 
 * its main direction should be laid out
 * vertically or horizontally.
 * This property is supported by most chart types. 
 * 
 * @returns {string}
 * @default 'vertical'
 * @category Layout
 */
pvc.options.BaseChartOptions.prototype.orientation = undefined;
/**
 * The width of the chart, in pixels.
 * 
 * @returns {number}
 * @default 400
 * @category Layout
 */
pvc.options.BaseChartOptions.prototype.width = undefined;
/**
 * The base options type for the cartesian charts.
 * 
 * @class
 * @extends pvc.options.BaseChartOptions
 */
pvc.options.CartesianChartOptions = function(){};
        
        
        
        
/**
 * The base options type for the cartesian charts.
 * 
 * @class
 * @extends pvc.options.BaseChartOptions
 */
pvc.options.CategoricalChartOptions = function(){};
        
        
        
        
/**
 * The base options type for the Bar family charts.
 * 
 * @class
 * @extends pvc.options.CategoricalChartOptions
 */
pvc.options.BarAbstractChartOptions = function(){};
        
        
        
        
/**
 * Percentage of occupied space over total space 
 * in a discrete axis band.
 * <p>
 * The remaining space will be of 
 * margins between bands.
 * 
 * @returns {number}
 * @default 0.9
 * @category Layout
 */
pvc.options.BarAbstractChartOptions.prototype.panelSizeRatio = undefined;
/**
 * The base options type for the Line/Dot/Area family charts.
 * 
 * @class
 * @extends pvc.options.CategoricalChartOptions
 */
pvc.options.LineDotAreaAbstractChartOptions = function(){};
        
        
        
        
/**
 * Options related to the tooltip presentation.
 * 
 * @class
 */
pvc.options.TooltipOptions = function(){};
        
        
        
        
/**
 * Options to define a data dimension type.
 * 
 * @class
 */
pvc.options.DimensionTypeOptions = function(){};
        
        
        
        
/**
 * A function that compares two different and non-null values of the dimension's 
 * {@link pvc.options.DimensionTypeOptions#valueType}.
 * <p>
 * When unspecified, 
 * and the dimension type is not {@link #isDiscrete},
 * a default natural order comparer function
 * is applied to the continuous value types:
 * {@link pvc.options.DimensionValueType#Number} and
 * {@link pvc.options.DimensionValueType#Date}.
 * <p>
 * Dimension types that do not have a comparer 
 * function "compare" their values by "input order" 
 * - order of first appearence, in the data source.
 * 
 * @returns {number}
 * The number 0 if the two values have the same order, 
 * a negative number if {@link a} is before {@link b}, and
 * a positive number if {@link a} is after {@link b}.
 * 
 * @method
 * @this null
 * @param {any} a
 * The first value to compare.
 * 
 * @param {any} b
 * The second value to compare.
 * 
 * @category Data
 */
pvc.options.DimensionTypeOptions.prototype.comparer = function(){};
/**
 * Converts a non-null raw value, 
 * as read from the data source,
 * into a value of the dimension's {@link #valueType}.
 * <p>
 * The returned value 
 * need not have the type of the dimension's value type.
 * But it t must be such that the 
 * specific value type cast function
 * is able to convert it to the dimension's value type.
 * In this way, 
 * only "non-standard" conversions
 * need to be handled with a converter function.
 * <p>
 * Values that are not convertible by the dimension's value type 
 * cast function become null.
 * <p>
 * Also, note that the only value type that 
 * does not have a cast function is the  
 * {@link pvc.options.DimensionValueType#Any}.
 * <p>
 * When unspecified and 
 * the value type is {@link pvc.options.DimensionValueType#Date},
 * and the option {@link #rawFormat} is specified
 * a default converter is created for it. 
 * 
 * @returns {any}
 * The converted value.
 * 
 * @method
 * @this null
 * @param {any} sourceValue
 * The non-null source value to convert.
 * <p>
 * In the case where the raw value to convert is 
 * a Google-table-like cell, 
 * it is the value of its <tt>v</tt>
 * property that is passed to this argument.
 * 
 * @category Data
 */
pvc.options.DimensionTypeOptions.prototype.converter = function(){};
/**
 * Indicates if a dimension type should be considered discrete
 * or continuous.
 * <p>
 * Only dimension types whose {@link #valueType} 
 * is one of 
 * {@link pvc.options.DimensionValueType#Number} or
 * {@link pvc.options.DimensionValueType#Date}
 * can be continuous.
 * <p>
 * Some chart types support binding 
 * a continuous or a discrete dimension to a visual role,
 * yielding different visual results.
 * An example is the "color" visual role of the Metric Line/Dot charts.
 * Another example is the Line/Dot/Area chart that supports
 * both a continuous or a discrete dimension in its "category" visual role.  
 * <p>
 * The default value dependends on the value of {@link #valueType}.
 * If it can be continuous, then the default value is <tt>false</tt>.
 * If it cannot, the default value is <tt>true</tt>.
 * 
 * @returns {boolean}
 * @category Data
 */
pvc.options.DimensionTypeOptions.prototype.isDiscrete = undefined;
/**
 * A function that converts a non-null value of the dimension's 
 * {@link pvc.options.DimensionTypeOptions#valueType}
 * into a string that (uniquely) identifies
 * the value in the dimension.
 * <p>
 * The default key function is 
 * the standard JavaScript <tt>String</tt> function,
 * and is suitable for most value types.
 * <p>
 * If the dimension's value type is one of 
 * {@link pvc.options.DimensionValueType#Any} or
 * {@link pvc.options.DimensionValueType#Object}
 * the <tt>String</tt> function may not be suitable to 
 * identify the values.
 * <p>
 * If more than one value has a given key,
 * only the first one will be stored in the dimension.
 * 
 * @returns {string}
 * The corresponding key.
 * 
 * @method
 * @this null
 * @param {any} value
 * The non-null value to convert.
 * 
 * @category Data
 */
pvc.options.DimensionTypeOptions.prototype.key = function(){};
/**
 * A protovis format string that is to parse the raw value.
 * <p>
 * Currently, this option is ignored unless the 
 * option {@link #converter} is unspecified
 * and the value type is 
 * {@link pvc.options.DimensionValueType#Date}.
 * <p>
 * When the chart option 
 * {@link pvc.options.BaseChartOptions#timeSeriesFormat},
 * is specified,
 * and the value type is 
 * {@link pvc.options.DimensionValueType#Date},
 * it is taken as the <i>default value</i> of this option.
 * <p>
 * A converter function is created to parse
 * raw values with the specified format string.
 * 
 * @returns {string}
 * @category Data
 */
pvc.options.DimensionTypeOptions.prototype.rawFormat = undefined;
/**
 * The type of value that dimensions of this type will hold.
 * 
 * @returns {pvc.options.DimensionValueType}
 * @default null
 * @category Data
 */
pvc.options.DimensionTypeOptions.prototype.valueType = undefined;
/**
 * A protovis format string that is to format a value of 
 * the dimension's 
 * {@link pvc.options.DimensionTypeOptions#valueType}.
 * <p>
 * Currently, this option is ignored unless the 
 * option {@link #formatter} is unspecified
 * and the value type is 
 * {@link pvc.options.DimensionValueType#Date}.
 * <p>
 * When unspecified, 
 * but the option {@link #rawFormat} is specified,
 * a format string is created from the later 
 * (simply by replacing "-" with "/").
 * <p>
 * A formatter function is created to format
 * values with the specified or implied format string.
 * 
 * @returns {string}
 * @category Presentation
 */
pvc.options.DimensionTypeOptions.prototype.format = undefined;
/**
 * A function that formats a value, 
 * possibly null, 
 * of the dimension's 
 * {@link pvc.options.DimensionTypeOptions#valueType}.
 * <p>
 * Note that, the chart option 
 * {@link pvc.options.BaseChartOptions#valueFormat},
 * is used to build a default formatter function 
 * for numeric dimensions of the "value" dimension group.
 * <p>
 * When unspecified and 
 * the value type is {@link pvc.options.DimensionValueType#Number},
 * a default formatter is created that formats numbers with two decimal places.
 * <p>
 * When unspecified and 
 * the value type is {@link pvc.options.DimensionValueType#Date},
 * and the option {@link #format} is specified (or implied)
 * a default formatter is created for it.
 * <p>
 * Otherwise a value is formatted by calling 
 * the standard JavaScript <tt>String</tt> function on it.
 * 
 * @returns {string}
 * The string that is the formatted value.
 * Only the <tt>null</tt> value can have the empty string
 * as the formatted value.
 * 
 * @method
 * @this null
 * @param {any} value
 * The value to format.
 * 
 * @param {any} [sourceValue]
 * The raw value, 
 * when the value was read from a data source,
 * or <tt>undefined</tt>, otherwise.
 * <p>
 * In the case where the raw value is 
 * a Google-table-like cell, 
 * it is the value of its <tt>v</tt>
 * property that is passed to this argument.
 * 
 * @category Presentation
 */
pvc.options.DimensionTypeOptions.prototype.formatter = function(){};
/**
 * Indicates if values of this dimension type 
 * should be hidden from the user.
 * <p>
 * This option is useful to hide auxiliar dimensions that are used to:
 * <ul> 
 * <li>hold extra data, required for drill-down purposes</li>
 * <li>
 * complete the minimal working information a chart needs to work, 
 * like, for example, 
 * a "series" dimension created automatically by a chart if 
 * its required "series" visual role was not unbound
 * </li>
 * </ul>
 * <p>
 * The only place where the values of a dimension that is not bound to a visual role
 * are shown to the user is the tooltip, as it is formatted by default.
 * To prevent this, 
 * set the dimension type's <tt>isHidden</tt> option to <tt>true</tt>.
 * 
 * @returns {boolean}
 * @default false
 * @category Presentation
 */
pvc.options.DimensionTypeOptions.prototype.isHidden = undefined;
/**
 * The name of the dimension type as it is shown to the user.
 * <p>
 * The label <i>should</i> be unique.
 * <p>
 * The default value is built from the dimension name,
 * by converting the first character to upper case.
 * 
 * @returns {string}
 * @category Presentation
 */
pvc.options.DimensionTypeOptions.prototype.label = undefined;
/**
 * The options that configure a dimensions reader.
 * <p>
 * A dimensions reader is executed for each row of a 
 * data source to convert values of one or more columns
 * into one or more atoms of certain dimensions.
 * <p>
 * Together, a set of dimensions readers, 
 * are executed to fully convert 
 * each data source row into atoms of the defined dimension types. 
 * The atoms of each row are used to construct a datum.
 * <p>
 * The mentioned data source row is called the "virtual item".
 * Depending on the data source format the actual rows 
 * carry different informaton. 
 * The virtual item is a normalized view of each row of the data source,
 * independent of its format.
 * <p>
 * A dimensions reader can be configured in the following ways:
 * <dl>
 * <dt>specify <tt>names</tt> but not <tt>reader</tt></dt>
 * <dd>
 * names are paired with any specified indexes, from left to right;
 * excess indexes feed dimensions whose name starts with the last specified name (a dimension group);
 * excess names are fed with the <i>non reserved</i>indexes 
 * that follow the last specified index (or 0, if none);
 * indexes explicitly specified in dimensions readers are all
 * reserved beforehand
 * </dd>
 * <dt>specify <tt>indexes</tt> but not <tt>names</tt> and <tt>reader</tt></dt>
 * <dd>
 * the specified indexes become reserved but are not read,
 * and so are effectively ignored 
 * </dd>
 * <dt>specify both <tt>reader</tt> and <tt>names</tt></dt>
 * <dd>
 * any specified indexes are reserved, 
 * and no pairing is performed between these and the specified names;
 * the reader function may 
 * read any cell from the virtual item and 
 * return atoms from any of the dimensions specified in <tt>names</tt>;
 * atoms of stated dimensions, that are not returned, 
 * result in a <i>null</i> value 
 * </dd>
 * </dl>
 * 
 * @class
 */
pvc.options.DimensionsReaderOptions = function(){};
        
        
        
        
/**
 * The index or indexes, of each virtual item, 
 * that are to be read.
 * <p>
 * Only one dimensions reader can state that it reads a given index
 * (although a dimensions reader function may read any cells,
 * stated or not).
 * 
 * @returns {number|string|list(number|string)}
 * @category General
 */
pvc.options.DimensionsReaderOptions.prototype.indexes = undefined;
/**
 * The name or names of the dimensions that the reader reads
 * from each virtual item.
 * <p>
 * When the argument is a string, it can be a list of names, 
 * separated by the character ",".
 * <p>
 * Only one dimensions reader can read a given dimension.
 * 
 * @returns {string|list(string)}
 * @category General
 */
pvc.options.DimensionsReaderOptions.prototype.names = undefined;
/**
 * A dimensions reader function, 
 * reads atoms from a virtual item row.
 * <p>
 * When unspecified, one is created that performs a simple 
 * mapping between the specified names and indexes.
 * <p>
 * A dimensions reader function can be specified 
 * to perform non-simple operations over the read cells, 
 * like the following:
 * <ul>
 * <li>
 * combine values from two or more cells into a single dimension,
 * </li>
 * <li>
 * split the value of one cell into more than one dimension,
 * </li>
 * <li>
 * feed a dimension with correlated data read from an external data source.
 * </li>
 * </ul>
 * <p>
 * Dimensions reader functions need not be specifed to perform
 * conversion or formatting operations of a single cell.
 * For those cases, the dimension type's 
 * {@link pvc.options.DimensionTypeOptions#converter}
 * and 
 * {@link pvc.options.DimensionTypeOptions#formatter}
 * should be used instead.
 * <p>
 * The function may read cells whose indexes were not
 * "reserved" in <tt>indexes</tt>. 
 * Those cells might be read by other readers,
 * possibly default ones created by the translator.
 * 
 * @returns {pvc.data.Atom|list(pvc.data.Atom)}
 * An atom or array of atoms read from the virtual item, 
 * or <tt>null</tt> or <tt>undefined</tt>, 
 * if nothing was read. 
 * 
 * @method
 * @this pvc.data.Data
 * @param {list(any)} virtualItem
 * The virtual item array.
 * 
 * @param {pvc.data.Dimension} dimension...
 * The data dimensions,
 * corresponding to the dimension names specified in the 
 * dimensions reader options, 
 * in which read values are to be interned.
 * 
 * @category General
 */
pvc.options.DimensionsReaderOptions.prototype.reader = function(){};
/**
 * Controls if and how the selection can be cleared by the user.
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.ClearSelectionMode = function(){};
        
        
        
        
/**
 * The user can click on any <i>empty area</i>
 * <i>inside</i> the chart to clear the selection.
 * 
 * @value 'emptySpaceClick'
 */
pvc.options.ClearSelectionMode.prototype.EmptySpaceClick = 'emptySpaceClick';
/**
 * The user has no way to explicitly fully clear the selection.
 * <p>
 * It is still possible to clear the selection,
 * if the selection behavior performs a toggling operation.
 * <p>
 * Selection can always be cleared by code.
 * 
 * @value 'manual'
 */
pvc.options.ClearSelectionMode.prototype.Manual = 'manual';
/**
 * The types of values that a dimension can hold.
 * <p>
 * Note that, 
 * whatever the value type of a dimension type,
 * <tt>null</tt> is always a supported value.
 * 
 * @class
 * @enum
 * @extends function
 */
pvc.options.DimensionValueType = function(){};
        
        
        
        
/**
 * The "any" value type, 
 * specified as <tt>null</tt>, 
 * means that a dimension can hold any type of data.
 * <p>
 * Values of this type are <i>not</i> cast.
 * <p>
 * Each value may have a different type.
 * <p>
 * Dimension types of this value type
 * are discrete.
 * 
 * @value null
 */
pvc.options.DimensionValueType.prototype.Any = null;
/**
 * The dimension holds <i>boolean</i> values.
 * <p>
 * Values of this type are cast by using the standard 
 * JavaScript <tt>Boolean</tt> function.
 * <p>
 * Dimension types of this value type
 * are discrete.
 * 
 * @value Boolean
 */
pvc.options.DimensionValueType.prototype.Boolean = Boolean;
/**
 * The dimension holds <i>date</i> values.
 * <p>
 * Values of this type are cast by using the standard 
 * JavaScript <tt>Date</tt> constructor.
 * <p>
 * Dimension types of this value type
 * can be continuous or discrete.
 * 
 * @value Date
 */
pvc.options.DimensionValueType.prototype.Date = Date;
/**
 * The dimension holds <i>number</i> values.
 * <p>
 * Values of this type are cast by using the standard 
 * JavaScript <tt>Number</tt> function;
 * additionally, 
 * resulting <tt>NaN</tt> values 
 * are converted to <tt>null</tt>. 
 * <p>
 * Dimension types of this value type
 * can be continuous or discrete.
 * 
 * @value Number
 */
pvc.options.DimensionValueType.prototype.Number = Number;
/**
 * The dimension holds <i>object</i> values.
 * <p>
 * Values of this type are cast by using the standard 
 * JavaScript <tt>Object</tt> function.
 * <p>
 * Dimension types of this value type
 * are discrete.
 * 
 * @value Object
 */
pvc.options.DimensionValueType.prototype.Object = Object;
/**
 * The dimension holds <i>string</i> values.
 * <p>
 * Values of this type are cast by using the standard 
 * JavaScript <tt>String</tt> function.
 * <p>
 * Dimension types of this value type
 * are discrete.
 * <p>
 * The empty string value is 
 * always converted to the null value.
 * 
 * @value String
 */
pvc.options.DimensionValueType.prototype.String = String;