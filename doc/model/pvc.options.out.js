
/**
 * The global CCC namespace. 
 * 
 * @namespace
 */
pvc = {};

/**
 * The CCC options namespace.
 * <p>
 * All types of this namespace,
 * as well of the namespaces below this one, 
 * are 
 * <b>documentation</b> types -
 * they do not exist, in code, 
 * and serve only to document the structure of the options objects 
 * that each chart type accepts in its constructor.
 * 
 * <p>
 * The following code shows how to 
 * create and configure a very simple CCC Bar chart:
 * 
 * <pre>// Options are placed in a plain JS object
 * var options = {
 *     title:  "A CCC Bar chart",
 *     legend: true,
 *     crosstabMode: false
 * };
 * 
 * var data = {
 *     metadata: [
 *         {colIndex: 0, colType: "String", colName: "Series"}, 
 *         {colIndex: 1, colType: "String", colName: "Category"}, 
 *         {colIndex: 2, colType: "String", colName: "Value"}
 *     ],
 *     resultset: [
 *         ["London", "2010-01-02", 1],
 *         ["London", "2010-01-03", 2],
 *         ["London", "2010-01-04", 3],
 *         ["London", "2010-01-05", 2],
 *         ["Paris",  "2010-01-01", 3],
 *         ["Paris",  "2010-01-02", 6],
 *         ["Paris",  "2010-01-04", 1],
 *         ["Paris",  "2010-01-05", 7],
 *         ["Lisbon", "2010-01-01", 3],
 *         ["Lisbon", "2010-01-02", 2],
 *         ["Lisbon", "2010-01-03", 1],
 *         ["Lisbon", "2010-01-04", 5]
 *     ]
 * };
 * 
 * new pvc.BarChart(options)
 * .setData(data)
 * .render();
 * </pre>
 * Note that the options object is a plain JavaScript object,
 * and not a {@link pvc.options.BarChartOptions}
 * 
 * <p>
 * 
 * @namespace
 */
pvc.options = {};

/**
 * The namespace of various options-related helper types. 
 * 
 * @namespace
 */
pvc.options.varia = {};

/**
 * The namespace of CCC chart extension point classes. 
 * 
 * @namespace
 */
pvc.options.ext = {};

/**
 * The namespace of CCC visual roles option classes. 
 * 
 * @namespace
 */
pvc.options.roles = {};

/**
 * The namespace of CCC panels options classes. 
 * 
 * @namespace
 */
pvc.options.panels = {};

/**
 * The namespace of the options of 
 * extension points of 
 * <i>protovis</i> marks. 
 * 
 * @namespace
 */
pvc.options.marks = {};

/**
 * The common options documentation class of all charts.
 * 
 * @class
 */
pvc.options.ChartCommonOptions = function(){};
        
        
        
        
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
pvc.options.ChartCommonOptions.prototype.clickAction = function(){};
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
pvc.options.ChartCommonOptions.prototype.doubleClickAction = function(){};
/**
 * A callback function that is called
 * before the chart is rendered,
 * but after if has been pre-rendered.
 * <p>
 * You can use this action to:
 * 
 * <ul>
 * 
 * <li>use the 
 * <i>mark events</i> API on time-series categorical charts</li>
 * 
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
pvc.options.ChartCommonOptions.prototype.renderCallback = function(){};
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
pvc.options.ChartCommonOptions.prototype.selectionChangedAction = function(){};
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
pvc.options.ChartCommonOptions.prototype.userSelectionAction = function(){};
/**
 * The CCC version that the chart should run in.
 * <p>
 * The value 
 * <tt>1</tt> emulates version 1 of CCC.
 * 
 * @type number
 * @default Infinity
 * @category Behavior
 */
pvc.options.ChartCommonOptions.prototype.compatVersion = undefined;
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
 * @type map(string : pvc.options.varia.DimensionTypeOptions)
 * @category Data
 */
pvc.options.ChartCommonOptions.prototype.dimensionGroups = undefined;
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
 * @type map(string : pvc.options.varia.DimensionTypeOptions)
 * @category Data
 */
pvc.options.ChartCommonOptions.prototype.dimensions = undefined;
/**
 * The separator used to join the labels of the values of 
 * a multi-dimensional visual role.
 * <p>
 * For example, if a visual role, 
 * has the dimensions "Territory" and "ProductType",
 * a compound value could be shown as "EMEA ~ Classic Cars". 
 * 
 * @type string
 * @default ' ~ '
 * @category Data
 */
pvc.options.ChartCommonOptions.prototype.groupedLabelSep = undefined;
/**
 * Indicates if datums
 * whose value of all measure dimensions is null 
 * should be ignored.
 * <p>
 * A dimension is considered a measure dimension if 
 * there is at least one measure role currently bound to it.
 * 
 * @type boolean
 * @default true
 * @category Data
 */
pvc.options.ChartCommonOptions.prototype.ignoreNulls = undefined;
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
pvc.options.ChartCommonOptions.prototype.percentValueFormat = function(){};
/**
 * Indicates whether selected series should be plotted against 
 * a secondary orthogonal axis.
 * <p>
 * TODO: Only supported on Bar and Line.
 * 
 * @type boolean
 * @default false
 * @category Data
 */
pvc.options.ChartCommonOptions.prototype.secondAxis = undefined;
/**
 * 
 * The indexes of the series to show in the second axis.
 * 
 * @deprecated Use {@link #secondAxisSeriesIndexes} instead.
 * @type number|string|list(number|string)
 * @category Data
 */
pvc.options.ChartCommonOptions.prototype.secondAxisIdx = undefined;
/**
 * Indicates whether the secondary axis should be 
 * shown and with an independent range.
 * <p>
 * TODO: Only supported on Bar and Line.
 * 
 * @type boolean
 * @default false
 * @category Data
 */
pvc.options.ChartCommonOptions.prototype.secondAxisIndependentScale = undefined;
/**
 * The zero-based indexes of the series, 
 * in 
 * <i>the order of appearance in the data source</i>, 
 * that are to be shown in the second axis, 
 * on chart types that support it.
 * <p>
 * A negative index designates an index from the last series.
 * So 
 * <tt>-1</tt> is the last series, 
 * 
 * <tt>-2</tt> is the next-to-last series, 
 * etc.
 * <p>
 * This option is only relevant when the property
 * {@link #secondAxis} has the value 
 * <tt>true</tt>.
 * 
 * @type number|string|list(number|string)
 * @default -1
 * @category Data
 */
pvc.options.ChartCommonOptions.prototype.secondAxisSeriesIndexes = undefined;
/**
 * Indicates that dimensions of the "category" group 
 * (i.e. named 
 * <tt>category</tt>, 
 * <tt>category2</tt>, ...)
 * have a 
 * <tt>Date</tt> value type,
 * by default.
 * <p>
 * This option has no effect on other dimensions,
 * even if bound to a "category" visual role.
 * In those cases,
 * explicitly define the dimension with
 * the 
 * <tt>Date</tt> value type.
 * <p>
 * Dimensions are considered continuous, by default,
 * when they have a continuous value type.
 * However, 
 * not all visual roles support continuous dimensions.
 * In those cases, 
 * the dimension is treated as a discrete dimension,
 * event though it has a continuous value type.
 * 
 * @type boolean
 * @default false
 * @category Data
 */
pvc.options.ChartCommonOptions.prototype.timeSeries = undefined;
/**
 * The format string used by default to 
 * <i>parse</i>
 * dimensions of the 
 * <tt>Date</tt> value type.
 * <p>
 * The syntax of the format string is that of 
 * 
 * <i>protovis</i>' date formats.
 * <p>
 * This property changes the default of the 
 * {@link pvc.options.varia.DimensionTypeOptions#rawFormat}
 * <p>
 * property,
 * for dimensions with a 
 * <tt>Date</tt> value type.  
 * 
 * @type string
 * @default '%Y-%m-%d'
 * @category Data
 */
pvc.options.ChartCommonOptions.prototype.timeSeriesFormat = undefined;
/**
 * A function that formats the
 * non-null 
 * <i>numeric</i> values
 * of the dimensions named 
 * <tt>value</tt>, 
 * <tt>value2</tt>, etc.
 * <p>
 * This property is used to default the property 
 * {@link pvc.options.varia.DimensionTypeOptions#formatter}
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
pvc.options.ChartCommonOptions.prototype.valueFormat = function(){};
/**
 * The options of visual roles that are common to all chart types.
 * 
 * @type pvc.options.roles.ChartCommonVisualRoles
 * @category Data Binding
 */
pvc.options.ChartCommonOptions.prototype.visualRoles = undefined;
/**
 * Indicates if the data source is in 
 * <i>crosstab</i> format.
 * 
 * @type boolean
 * @default true
 * @category Data Translation
 */
pvc.options.ChartCommonOptions.prototype.crosstabMode = undefined;
/**
 * Indicates if the data source has 
 * multiple value dimensions.
 * 
 * @type boolean
 * @default false
 * @category Data Translation
 */
pvc.options.ChartCommonOptions.prototype.isMultiValued = undefined;
/**
 * The indexes of the data source's 
 * <i>virtual item</i> columns
 * that are to feed the 
 * default 
 * 
 * <tt>value</tt>, 
 * 
 * <tt>value2</tt>, ... 
 * dimensions.
 * <p>
 * This option only applies to data sources in 
 * relational format with multiple values, 
 * i.e., 
 * when 
 * 
 * <tt>crosstabMode=false</tt> and 
 * 
 * <tt>isMultiValued=true</tt>.
 * 
 * @type number|string|list(number|string)
 * @default true
 * @category Data Translation
 */
pvc.options.ChartCommonOptions.prototype.measuresIndexes = undefined;
/**
 * The indexes of the data source's 
 * <i>virtual item</i> columns
 * that are to feed the 
 * default 
 * 
 * <tt>multiChart</tt>, 
 * 
 * <tt>multiChart2</tt>, ... 
 * dimensions.
 * 
 * @type number|string
 * @default true
 * @category Data Translation
 */
pvc.options.ChartCommonOptions.prototype.multiChartIndexes = undefined;
/**
 * An array of dimensions readers.
 * <p>
 * Can be specified to customize the 
 * translation process of the data source. 
 * 
 * @type list(pvc.options.varia.DimensionsReaderOptions)
 * @category Data Translation
 */
pvc.options.ChartCommonOptions.prototype.readers = undefined;
/**
 * Indicates if, 
 * in the data source, 
 * the "series" data is in the rows, 
 * instead of, as is more usual, in the columns.
 * <p>
 * The name of this option is inspired in 
 * the 
 * <i>crosstab</i> format, 
 * where the "series" values are placed in the first row,
 * and "category" values are placed in the first column
 * (corner cell is empty).
 * <p>
 * When this option is 
 * <tt>true</tt>, in the 
 * <i>crosstab</i> format,
 * the result is equivalent to transposing the data table,
 * which results in "series" data being placed in the first column,
 * i.e. 
 * <i>in the rows</i>, 
 * and the "category" data being placed in the first row.
 * <p>
 * In the 
 * <i>relational</i> data source format, 
 * this option effects a conceptually equivalent operation,
 * by switching the "series" and "category" columns.
 * 
 * @type boolean
 * @default false
 * @category Data Translation
 */
pvc.options.ChartCommonOptions.prototype.seriesInRows = undefined;
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
 * @type string|object
 * @category General
 */
pvc.options.ChartCommonOptions.prototype.canvas = undefined;
/**
 * Indicates if a chart should show an entry animation, 
 * every time it is rendered.
 * Most charts perform some sort of entry animation 
 * of its main visual elements.
 * 
 * @type boolean
 * @default true
 * @category Interaction
 */
pvc.options.ChartCommonOptions.prototype.animate = undefined;
/**
 * <p>
 * Controls if and how the selection can be cleared by the user.
 * 
 * @type pvc.options.varia.ClearSelectionMode
 * @default 'emptySpaceClick'
 * @category Interaction
 */
pvc.options.ChartCommonOptions.prototype.clearSelectionMode = undefined;
/**
 * Indicates if the chart is clickable by the user.
 * <p>
 * If this option is 
 * <tt>false</tt>, 
 * any click-related actions will not be executed 
 * (ex: 
 * {@link #clickAction},
 * {@link #doubleClickAction}, or
 * {@link pvc.options.varia.DiscreteAxisOptions#clickAction}).
 * 
 * @type boolean
 * @default false
 * @category Interaction
 */
pvc.options.ChartCommonOptions.prototype.clickable = undefined;
/**
 * When 
 * <tt>true</tt>, 
 * indicates that a selection made by the user 
 * replaces the current selection, if any.
 * <p>
 * For the selection to be additive, 
 * the 
 * <tt>CTRL</tt> key must be pressed, 
 * by the end of the operation.
 * <p>
 * When 
 * <tt>false</tt>,
 * indicates that any selection made by the user is additive.
 * The 
 * <tt>CTRL</tt> key has no effect.
 * 
 * @type boolean
 * @default true
 * @category Interaction
 */
pvc.options.ChartCommonOptions.prototype.ctrlSelectMode = undefined;
/**
 * The maximum number of milliseconds,
 * between two consecutive clicks,
 * for them to be considered a double-click.
 * 
 * @type number
 * @default 300
 * @category Interaction
 */
pvc.options.ChartCommonOptions.prototype.doubleClickMaxDelay = undefined;
/**
 * Indicates if the chart's visual elements
 * are automatically highlighted 
 * when the user hovers over them with the mouse.
 * 
 * @type boolean
 * @default false
 * @category Interaction
 */
pvc.options.ChartCommonOptions.prototype.hoverable = undefined;
/**
 * Indicates if the chart's visual elements
 * can be selected by the user, 
 * by clicking on them 
 * or using the rubber-band.
 * 
 * @type boolean
 * @default false
 * @category Interaction
 */
pvc.options.ChartCommonOptions.prototype.selectable = undefined;
/**
 * Indicates if tooltips are shown
 * when the user hovers over visual elements with the mouse.
 * 
 * @type boolean
 * @default true
 * @category Interaction
 */
pvc.options.ChartCommonOptions.prototype.showTooltips = undefined;
/**
 * Contains tooltip presentation options.
 * 
 * @type TooltipOptions
 * @category Interaction
 */
pvc.options.ChartCommonOptions.prototype.tipsySettings = undefined;
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
pvc.options.ChartCommonOptions.prototype.tooltipFormat = function(){};
/**
 * The margins of the 
 * <i>root</i> content panel.
 * <p>
 * In a 
 * <i>small multiples</i> chart, 
 * the margins of the 
 * <i>content panel</i> of a 
 * <i>small</i> chart 
 * can be set with the property {@link #smallContentMargins}.
 * <p>
 * See {@link pvc.options.varia.Sides} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Sides
 * @default 0
 * @category Layout
 */
pvc.options.ChartCommonOptions.prototype.contentMargins = undefined;
/**
 * The paddings of the 
 * <i>root</i> content panel.
 * <p>
 * In a 
 * <i>small multiples</i> chart, 
 * the paddings of the 
 * <i>content panel</i> of a 
 * <i>small</i> chart 
 * can be set with the property {@link #smallContentPaddings}.
 * <p>
 * See {@link pvc.options.varia.Sides} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Sides
 * @default 0
 * @category Layout
 */
pvc.options.ChartCommonOptions.prototype.contentPaddings = undefined;
/**
 * The height of the 
 * <i>root</i> chart, in pixels.
 * 
 * @type number
 * @default 300
 * @category Layout
 */
pvc.options.ChartCommonOptions.prototype.height = undefined;
/**
 * The margins of the 
 * <i>root</i> chart.
 * <p>
 * In a 
 * <i>small multiples</i> chart, 
 * the margins of the 
 * <i>small</i> charts can be set
 * with the property {@link #smallMargins}.
 * <p>
 * See {@link pvc.options.varia.Sides} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Sides
 * @default 0
 * @category Layout
 */
pvc.options.ChartCommonOptions.prototype.margins = undefined;
/**
 * The chart orientation indicates if 
 * its main direction is vertical or horizontal.
 * <p>
 * This property is supported by most chart types. 
 * 
 * @type pvc.options.varia.Orientation
 * @default 'vertical'
 * @category Layout
 */
pvc.options.ChartCommonOptions.prototype.orientation = undefined;
/**
 * The paddings of 
 * <i>root</i> chart.
 * <p>
 * In a 
 * <i>small multiples</i> chart, 
 * the paddings of a 
 * <i>small</i> chart can be set
 * with the property {@link #smallPaddings}.
 * <p>
 * See {@link pvc.options.varia.Sides} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Sides
 * @default 0
 * @category Layout
 */
pvc.options.ChartCommonOptions.prototype.paddings = undefined;
/**
 * The width of the 
 * <i>root</i> chart, in pixels.
 * 
 * @type number
 * @default 400
 * @category Layout
 */
pvc.options.ChartCommonOptions.prototype.width = undefined;
/**
 * The maximum number of 
 * <i>small</i> charts that should
 * be displayed in a row.
 * <p>
 * This property can receive a value of 
 * <tt>Infinity</tt>
 * to indicate that all charts should be laid out in a single row.
 * 
 * @type number
 * @default 3
 * @category Multi-Chart - Layout
 */
pvc.options.ChartCommonOptions.prototype.multiChartColumnsMax = undefined;
/**
 * The maximum number of 
 * <i>small</i> charts that should
 * be displayed.
 * <p>
 * The first 
 * <i>small</i> charts are chosen.
 * 
 * @type number
 * @default Infinity
 * @category Multi-Chart - Layout
 */
pvc.options.ChartCommonOptions.prototype.multiChartMax = undefined;
/**
 * Indicates that, 
 * when the layout results in a single column
 * and the value of {@link #smallHeight}
 * is still to be determined, 
 * it should be set to all the initially available content height,
 * instead of determining the height from the 
 * {@link #smallAspectRatio} and the {@link #smallWidth}.
 * 
 * @type boolean
 * @default true
 * @category Multi-Chart - Layout
 */
pvc.options.ChartCommonOptions.prototype.multiChartSingleColFillsHeight = undefined;
/**
 * Indicates that, 
 * when the layout results in a single row
 * and the value of {@link #smallHeight}
 * is still to be determined, 
 * it should be set to all the initially available content height,
 * instead of determining the height from the 
 * {@link #smallAspectRatio} and the {@link #smallWidth}.
 * 
 * @type boolean
 * @default true
 * @category Multi-Chart - Layout
 */
pvc.options.ChartCommonOptions.prototype.multiChartSingleRowFillsHeight = undefined;
/**
 * The ratio of the width over the height of a 
 * <i>small</i> chart.
 * <p>
 * It is used when the set of properties
 * {@link #smallWidth},
 * {@link #smallHeight},
 * {@link #multiChartColumnsMax},
 * {@link #multiChartSingleRowFillsHeight} and
 * {@link #multiChartSingleColFillsHeight},
 * is under-specified and 
 * is not enough to determine the value of both
 * {@link #smallWidth} and
 * {@link #smallHeight}.
 * <p>
 * The default value of the aspect ratio depends on the chart type,
 * but is something around 
 * <tt>4/3</tt>.
 * 
 * @type number
 * @category Multi-Chart - Layout
 */
pvc.options.ChartCommonOptions.prototype.smallAspectRatio = undefined;
/**
 * The margins of the 
 * <i>content panel</i> of a 
 * <i>small</i> chart. 
 * <p>
 * See {@link pvc.options.varia.Sides} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Sides
 * @default 0
 * @category Multi-Chart - Layout
 */
pvc.options.ChartCommonOptions.prototype.smallContentMargins = undefined;
/**
 * The paddings of the 
 * <i>content panel</i> of a 
 * <i>small</i> chart.
 * <p>
 * See {@link pvc.options.varia.Sides} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Sides
 * @default 0
 * @category Multi-Chart - Layout
 */
pvc.options.ChartCommonOptions.prototype.smallContentPaddings = undefined;
/**
 * Fixates the height of each 
 * <i>small</i> chart.
 * <p>
 * A value of type 
 * <tt>number</tt>, 
 * or of type 
 * <tt>string</tt>, but with numeric content, 
 * is interpreted as being in pixel units.
 * <p>
 * A value of type 
 * <tt>string</tt>, 
 * with numeric content that is suffixed by a "%" character,
 * is interpreted as a percentage of the initially available content height.
 * <p>
 * This property may cause the 
 * <i>small multiples</i> chart 
 * to take up a greater width than the one specified in {@link #height}.
 * <p>
 * When this property is unspecified, 
 * its value depends on the evaluation of the
 * {@link #smallWidth} property, 
 * which may impose it a value. 
 * If after the evaluation of {@link #smallWidth} 
 * this property remains unspecified, 
 * it is determined as follows.
 * <p>
 * If the layout will have a single column 
 * and the property {@link #multiChartSingleColFillsHeight}
 * is 
 * <tt>true</tt> (it is by default)
 * then the height will be the initially available content height.
 * <p>
 * If the layout will have a single row 
 * and the property {@link #multiChartSingleRowFillsHeight}
 * is 
 * <tt>true</tt> (it is by default)
 * then the height will be the initially available content height.
 * <p>
 * Otherwise, the property {@link #smallAspectRatio} is 
 * used to determine the height of the small chart from its determined width.
 * <p>
 * The aspect ratio is defaulted to a value that depends on the chart type,
 * but is something around 
 * <tt>4/3</tt>.
 * 
 * @type number|string
 * @category Multi-Chart - Layout
 */
pvc.options.ChartCommonOptions.prototype.smallHeight = undefined;
/**
 * The margins of a 
 * <i>small</i> chart.
 * <p>
 * See {@link pvc.options.varia.Sides} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Sides
 * @default '2%'
 * @category Multi-Chart - Layout
 */
pvc.options.ChartCommonOptions.prototype.smallMargins = undefined;
/**
 * The paddings of a 
 * <i>small</i> chart.
 * <p>
 * See {@link pvc.options.varia.Sides} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Sides
 * @default 0
 * @category Multi-Chart - Layout
 */
pvc.options.ChartCommonOptions.prototype.smallPaddings = undefined;
/**
 * Fixates the width of each 
 * <i>small</i> chart.
 * <p>
 * A value of type 
 * <tt>number</tt>, 
 * or of type 
 * <tt>string</tt>, but with numeric content, 
 * is interpreted as being in pixel units.
 * <p>
 * A value of type 
 * <tt>string</tt>, 
 * with numeric content that is suffixed by a "%" character,
 * is interpreted as a percentage of the initially available content width.
 * <p>
 * This property may cause the 
 * <i>small multiples</i> chart 
 * to take up a greater width than the one specified in {@link #width}.
 * <p>
 * When this property is unspecified,
 * a specified finite value, or a defaulted value, of the property {@link #multiChartColumnsMax} is
 * used to determine it: 
 * by dividing the initially available content width 
 * by the maximum number of charts in a row that 
 * <i>actually</i> occur
 * (so that if there are less small charts than 
 * the maximum that can be placed in a row, 
 * these, nevertheless, take up the whole width).
 * <p>
 * When an infinite value was specified for 
 * {@link #multiChartColumnsMax}, the small charts
 * will be laid out in a single row, and so the width is 
 * calculated from the height {@link #smallHeight}, 
 * using the aspect ratio {@link #smallAspectRatio}.
 * The height is defaulted to the initially available content height.
 * The aspect ratio is defaulted to a value that depends on the chart type,
 * but is something around 
 * <tt>4/3</tt>.
 * The width is then calculated.
 * 
 * @type number|string
 * @category Multi-Chart - Layout
 */
pvc.options.ChartCommonOptions.prototype.smallWidth = undefined;
/**
 * The legend panel of the root chart.
 * <p>
 * When a value of type 
 * <tt>boolean</tt> is specified,
 * it indicates the visibility of the legend.
 * The default is 
 * <tt>false</tt>.
 * 
 * @type boolean|pvc.options.panels.LegendPanelOptions
 * @category Panels
 */
pvc.options.ChartCommonOptions.prototype.legend = undefined;
/**
 * The title panel of the 
 * <i>small</i> chart.
 * <p>
 * The text of the title of small charts is the 
 * compound label of the data bound to the 
 * <tt>multiChart</tt> visual role.
 * 
 * @type pvc.options.panels.ChartTitlePanelOptions
 * @category Panels
 */
pvc.options.ChartCommonOptions.prototype.smallTitle = undefined;
/**
 * The title panel of the root chart.
 * <p>
 * When a value of type 
 * <tt>string</tt> is specified, 
 * it is the title text.
 * 
 * @type string|pvc.options.panels.ChartTitlePanelOptions
 * @category Panels
 */
pvc.options.ChartCommonOptions.prototype.title = undefined;
/**
 * The color scheme to use to 
 * distinguish visual elements of the same series, or, 
 * in some cases, category.
 * 
 * @type list(pvc.options.varia.ColorString)
 * @category Style
 */
pvc.options.ChartCommonOptions.prototype.colors = undefined;
/**
 * The extension points object 
 * contains style definitions for 
 * various visual elements of the chart.
 * 
 * @type pvc.options.ext.ChartCommonExtensionPoints
 * @category Style
 */
pvc.options.ChartCommonOptions.prototype.extensionPoints = undefined;
/**
 * The array of colors to use to 
 * distinguish visual elements of the same series,
 * when they are shown on the second axis.
 * <p>
 * This option is only relevant when the property
 * {@link #secondAxisOwnColors} has the value 
 * <tt>true</tt>.
 * 
 * @type list(pvc.options.varia.ColorString)
 * @category Style
 */
pvc.options.ChartCommonOptions.prototype.secondAxisColor = undefined;
/**
 * Indicates that the series shown in the second axis should
 * use a separate color scheme, 
 * as specified in {@link #secondAxisColor}.
 * 
 * @type boolean
 * @default false
 * @category Style
 */
pvc.options.ChartCommonOptions.prototype.secondAxisOwnColors = undefined;
/**
 * The common options documentation class for the 
 * <b>Cartesian</b> charts.
 * 
 * @class
 * @extends pvc.options.ChartCommonOptions
 */
pvc.options.CartesianChartCommonOptions = function(){};
        
        
        
        
/**
 * The options of visual roles that are common to (almost) all cartesian chart types.
 * 
 * @type pvc.options.roles.CartesianCommonVisualRoles
 * @category Data Binding
 */
pvc.options.CartesianChartCommonOptions.prototype.visualRoles = undefined;
/**
 * The extension points object 
 * contains style definitions for 
 * various visual elements of the cartesian charts.
 * 
 * @type pvc.options.ext.CartesianChartCommonExtensionPoints
 * @category Style
 */
pvc.options.CartesianChartCommonOptions.prototype.extensionPoints = undefined;
/**
 * The common options documentation class for the 
 * <b>Categorical</b> charts. 
 * 
 * @class
 * @extends pvc.options.CartesianChartCommonOptions
 */
pvc.options.CategoricalChartCommonOptions = function(){};
        
        
        
        
/**
 * The options of visual roles that are common to all categorical chart types.
 * 
 * @type pvc.options.roles.CategoricalCommonVisualRoles
 * @category Data Binding
 */
pvc.options.CategoricalChartCommonOptions.prototype.visualRoles = undefined;
/**
 * The common options documentation class of the 
 * <b>Bar family</b> charts.
 * 
 * @class
 * @extends pvc.options.CategoricalChartCommonOptions
 */
pvc.options.BarChartCommonOptions = function(){};
        
        
        
        
/**
 * Percentage of occupied space over total space 
 * in a discrete axis band.
 * <p>
 * The remaining space will be of 
 * margins between bands.
 * 
 * @type number
 * @default 0.9
 * @category Layout
 */
pvc.options.BarChartCommonOptions.prototype.panelSizeRatio = undefined;
/**
 * The options documentation class of the 
 * <b>Bar</b> chart class: {@link pvc.BarChart}.
 * 
 * @class
 * @extends pvc.options.BarChartCommonOptions
 */
pvc.options.BarChartOptions = function(){};
        
        
        
        
/**
 * The options documentation class of the 
 * <b>Normalized Bar</b> chart class: {@link pvc.NormalizedBarChart}.
 * 
 * @class
 * @extends pvc.options.BarChartCommonOptions
 */
pvc.options.NormalizedBarChartOptions = function(){};
        
        
        
        
/**
 * The options documentation class of the 
 * <b>Waterfall</b> chart class: {@link pvc.WaterfallChart}.
 * 
 * @class
 * @extends pvc.options.BarChartCommonOptions
 */
pvc.options.WaterfallChartOptions = function(){};
        
        
        
        
/**
 * The options documentation class of the 
 * <b>Box plot</b> chart class: {@link pvc.BoxplotChart}.
 * 
 * @class
 * @extends pvc.options.BarChartCommonOptions
 */
pvc.options.BoxplotChartOptions = function(){};
        
        
        
        
/**
 * The options documentation class of the 
 * <b>Heat grid</b> chart class: {@link pvc.HeatGridChart}.
 * 
 * @class
 * @extends pvc.options.CategoricalChartCommonOptions
 */
pvc.options.HeatGridChartOptions = function(){};
        
        
        
        
/**
 * The common options documentation class for the 
 * <b>Line/Dot/Area family</b> charts.
 * 
 * @class
 * @extends pvc.options.CategoricalChartCommonOptions
 */
pvc.options.LineDotAreaChartCommonOptions = function(){};
        
        
        
        
/**
 * The options documentation class of the 
 * <b>Line</b> chart class: {@link pvc.LineChart}.
 * 
 * @class
 * @extends pvc.options.LineDotAreaChartCommonOptions
 */
pvc.options.LineChartOptions = function(){};
        
        
        
        
/**
 * The options documentation class of the 
 * <b>Dot</b> chart class: {@link pvc.DotChart}.
 * 
 * @class
 * @extends pvc.options.LineDotAreaChartCommonOptions
 */
pvc.options.DotChartOptions = function(){};
        
        
        
        
/**
 * The options documentation class of the 
 * <b>Area</b> chart class: {@link pvc.AreaChart}.
 * 
 * @class
 * @extends pvc.options.LineDotAreaChartCommonOptions
 */
pvc.options.AreaChartOptions = function(){};
        
        
        
        
/**
 * The options documentation class of the 
 * <b>Stacked Line</b> chart class: {@link pvc.StackedLineChart}.
 * 
 * @class
 * @extends pvc.options.LineDotAreaChartCommonOptions
 */
pvc.options.StackedLineChartOptions = function(){};
        
        
        
        
/**
 * The options documentation class of the 
 * <b>Stacked Area</b> chart class: {@link pvc.StackedAreaChart}.
 * 
 * @class
 * @extends pvc.options.LineDotAreaChartCommonOptions
 */
pvc.options.StackedAreaChartOptions = function(){};
        
        
        
        
/**
 * The common options documentation class for the 
 * <b>Metric Line/Dot family</b> charts.
 * 
 * @class
 * @extends pvc.options.CartesianChartCommonOptions
 */
pvc.options.MetricLineDotChartCommonOptions = function(){};
        
        
        
        
/**
 * The options documentation class of the 
 * <b>Metric Line</b> chart class: {@link pvc.MetricLineChart}.
 * 
 * @class
 * @extends pvc.options.MetricLineDotChartCommonOptions
 */
pvc.options.MetricLineChartOptions = function(){};
        
        
        
        
/**
 * The options documentation class of the 
 * <b>Metric Dot (XY Scatter)</b> chart class: {@link pvc.MetricDotChart}.
 * 
 * @class
 * @extends pvc.options.MetricLineDotChartCommonOptions
 */
pvc.options.MetricDotChartOptions = function(){};
        
        
        
        
/**
 * The options documentation class of the 
 * <b>Bullet</b> chart class: {@link pvc.BulletChart}.
 * 
 * @class
 * @extends pvc.options.ChartCommonOptions
 */
pvc.options.BulletChart = function(){};
        
        
        
        
/**
 * The common options documentation class of the CCC panels.
 * 
 * @class
 */
pvc.options.panels.CommonPanelOptions = function(){};
        
        
        
        
/**
 * The common options documentation class of CCC docked panels.
 * 
 * @class
 * @extends pvc.options.panels.CommonPanelOptions
 */
pvc.options.panels.CommonDockedPanelOptions = function(){};
        
        
        
        
/**
 * The alignment side of the panel (the source)
 * that will align to a side of the parent panel (the target).
 * <p>
 * The alignment side must be 
 * orthogonal to the docking side.
 * <p>
 * The default value is 
 * <tt>'middle'</tt>,
 * if {@link pvc.options.panels.CommonDockedPanelOptions#position}
 * is an horizontal side, 
 * and 
 * <tt>'center'</tt>, otherwise.
 * 
 * @type pvc.options.varia.AlignmentSource
 * @category Layout
 */
pvc.options.panels.CommonDockedPanelOptions.prototype.align = undefined;
/**
 * The alignment side or position 
 * of the parent panel (the target)
 * that will align with the alignment side of this panel,
 * the source.
 * <p>
 * The default value is the value of 
 * {@link pvc.options.panels.CommonDockedPanelOptions#align}.
 * <p>
 * See {@link pvc.options.varia.AlignmentTarget}
 * for information on supported data types.
 * 
 * @type number|string|pvc.options.varia.AlignmentTarget
 * @category Layout
 */
pvc.options.panels.CommonDockedPanelOptions.prototype.alignTo = undefined;
/**
 * Indicates if the layout should try that the
 * panel be kept inside its parent,
 * by changing its position.
 * 
 * @type boolean
 * @default false
 * @category Layout
 */
pvc.options.panels.CommonDockedPanelOptions.prototype.keepInBounds = undefined;
/**
 * The margins of the panel.
 * <p>
 * See {@link pvc.options.varia.Sides} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Sides
 * @default 0
 * @category Layout
 */
pvc.options.panels.CommonDockedPanelOptions.prototype.margins = undefined;
/**
 * The paddings of the panel.
 * <p>
 * See {@link pvc.options.varia.Sides} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Sides
 * @default 0
 * @category Layout
 */
pvc.options.panels.CommonDockedPanelOptions.prototype.paddings = undefined;
/**
 * The docking position of the panel.
 * 
 * @type pvc.options.varia.DockPosition
 * @category Layout
 */
pvc.options.panels.CommonDockedPanelOptions.prototype.position = undefined;
/**
 * The fixed size of the panel.
 * <p>
 * See {@link pvc.options.varia.Size} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Size
 * @category Layout
 */
pvc.options.panels.CommonDockedPanelOptions.prototype.size = undefined;
/**
 * The maximum size of the panel.
 * <p>
 * See {@link pvc.options.varia.Size} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Size
 * @category Layout
 */
pvc.options.panels.CommonDockedPanelOptions.prototype.sizeMax = undefined;
/**
 * The font of the panel.
 * <p>
 * See the supported font format in 
 * {@link http://www.w3.org/TR/CSS2/fonts.html#font-shorthand}
 * 
 * @type string
 * @category Style
 */
pvc.options.panels.CommonDockedPanelOptions.prototype.font = undefined;
/**
 * The options documentation class of the CCC title panel.
 * <p>
 * The default 
 * {@link pvc.options.panels.CommonDockedPanelOptions#position}
 * is 
 * <tt>'top'</tt>.
 * <p>
 * The default 
 * {@link pvc.options.panels.CommonDockedPanelOptions#font}
 * is 
 * <tt>'14px sans-serif'</tt>.
 * 
 * @class
 * @extends pvc.options.panels.CommonDockedPanelOptions
 */
pvc.options.panels.ChartTitlePanelOptions = function(){};
        
        
        
        
/**
 * The extension points provided by the chart title panel.
 * 
 * @type pvc.options.ext.ChartTitlePanelExtensionPoints
 * @category Style
 */
pvc.options.panels.ChartTitlePanelOptions.prototype.extensionPoints = undefined;
/**
 * The options documentation class of the CCC legend panel.
 * <p>
 * The default 
 * {@link pvc.options.panels.CommonDockedPanelOptions#position}
 * is 
 * <tt>'bottom'</tt>.
 * <p>
 * The default 
 * {@link pvc.options.panels.CommonDockedPanelOptions#font}
 * is 
 * <tt>'10px sans-serif'</tt>.
 * <p>
 * The default
 * {@link pvc.options.panels.CommonDockedPanelOptions#paddings}
 * is 
 * <tt>5</tt> pixels.
 * 
 * @class
 * @extends pvc.options.panels.CommonDockedPanelOptions
 */
pvc.options.panels.LegendPanelOptions = function(){};
        
        
        
        
/**
 * Half the space between legend items, in pixel units.
 * 
 * @type number
 * @default 2.5
 * @category Layout
 */
pvc.options.panels.LegendPanelOptions.prototype.itemPadding = undefined;
/**
 * The width and height of the marker panel.
 * <p>
 * The marker itself will be slightly smaller.
 * 
 * @type number
 * @default 15
 * @category Layout
 */
pvc.options.panels.LegendPanelOptions.prototype.markerSize = undefined;
/**
 * The space between the marker and the associated label, in pixel units.
 * 
 * @type number
 * @default 6
 * @category Layout
 */
pvc.options.panels.LegendPanelOptions.prototype.textMargin = undefined;
/**
 * What happens when the user clicks a legend item. 
 * 
 * @type pvc.options.varia.LegendClickMode
 * @default 'toggleVisible'
 * @category Style
 */
pvc.options.panels.LegendPanelOptions.prototype.clickMode = undefined;
/**
 * Forces a rule to be shown or not in the marker zone.
 * <p>
 * The default value depends on the chart type.
 * 
 * @type boolean
 * @category Style
 */
pvc.options.panels.LegendPanelOptions.prototype.drawLine = undefined;
/**
 * Forces a shape to be shown or not in the marker zone.
 * <p>
 * The default value depends on the chart type.
 * 
 * @type boolean
 * @category Style
 */
pvc.options.panels.LegendPanelOptions.prototype.drawMarker = undefined;
/**
 * The extension points provided by the legend panel.
 * 
 * @type pvc.options.ext.LegendPanelExtensionPoints
 * @category Style
 */
pvc.options.panels.LegendPanelOptions.prototype.extensionPoints = undefined;
/**
 * Forces a given shape to be used in the marker zone.
 * <p>
 * The default value depends on the chart type.
 * 
 * @type pvc.options.varia.ShapeType
 * @category Style
 */
pvc.options.panels.LegendPanelOptions.prototype.shape = undefined;
/**
 * The options documentation class of the tooltip. TODO
 * 
 * @class
 */
pvc.options.varia.TooltipOptions = function(){};
        
        
        
        
/**
 * The options documentation class of a dimension type.
 * 
 * @class
 */
pvc.options.varia.DimensionTypeOptions = function(){};
        
        
        
        
/**
 * A function that compares two different and non-null values of the dimension's 
 * {@link pvc.options.varia.DimensionTypeOptions#valueType}.
 * <p>
 * When unspecified, 
 * and the dimension type is not {@link #isDiscrete},
 * a default natural order comparer function
 * is applied to the continuous value types:
 * {@link pvc.options.varia.DimensionValueType#Number} and
 * {@link pvc.options.varia.DimensionValueType#Date}.
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
pvc.options.varia.DimensionTypeOptions.prototype.comparer = function(){};
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
 * {@link pvc.options.varia.DimensionValueType#Any}.
 * <p>
 * When unspecified and 
 * the value type is {@link pvc.options.varia.DimensionValueType#Date},
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
 * it is the value of its 
 * <tt>v</tt>
 * property that is passed to this argument.
 * 
 * @category Data
 */
pvc.options.varia.DimensionTypeOptions.prototype.converter = function(){};
/**
 * Indicates if a dimension type should be considered discrete
 * or continuous.
 * <p>
 * Only dimension types whose {@link #valueType} 
 * is one of 
 * {@link pvc.options.varia.DimensionValueType#Number} or
 * {@link pvc.options.varia.DimensionValueType#Date}
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
 * If it can be continuous, then the default value is 
 * <tt>false</tt>.
 * If it cannot, the default value is 
 * <tt>true</tt>.
 * 
 * @type boolean
 * @category Data
 */
pvc.options.varia.DimensionTypeOptions.prototype.isDiscrete = undefined;
/**
 * A function that converts a non-null value of the dimension's 
 * {@link pvc.options.varia.DimensionTypeOptions#valueType}
 * into a string that (uniquely) identifies
 * the value in the dimension.
 * <p>
 * The default key function is 
 * the standard JavaScript 
 * <tt>String</tt> function,
 * and is suitable for most value types.
 * <p>
 * If the dimension's value type is one of 
 * {@link pvc.options.varia.DimensionValueType#Any} or
 * {@link pvc.options.varia.DimensionValueType#Object}
 * the 
 * <tt>String</tt> function may not be suitable to 
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
pvc.options.varia.DimensionTypeOptions.prototype.key = function(){};
/**
 * A protovis format string that is to parse the raw value.
 * <p>
 * Currently, this option is ignored unless the 
 * option {@link #converter} is unspecified
 * and the value type is 
 * {@link pvc.options.varia.DimensionValueType#Date}.
 * <p>
 * When the chart option 
 * {@link pvc.options.ChartCommonOptions#timeSeriesFormat},
 * is specified,
 * and the value type is 
 * {@link pvc.options.varia.DimensionValueType#Date},
 * it is taken as the 
 * <i>default value</i> of this option.
 * <p>
 * A converter function is created to parse
 * raw values with the specified format string.
 * 
 * @type string
 * @category Data
 */
pvc.options.varia.DimensionTypeOptions.prototype.rawFormat = undefined;
/**
 * The type of value that dimensions of this type will hold.
 * 
 * @type pvc.options.varia.DimensionValueType
 * @default null
 * @category Data
 */
pvc.options.varia.DimensionTypeOptions.prototype.valueType = undefined;
/**
 * A protovis format string that is to format a value of 
 * the dimension's 
 * {@link pvc.options.varia.DimensionTypeOptions#valueType}.
 * <p>
 * Currently, this option is ignored unless the 
 * option {@link #formatter} is unspecified
 * and the value type is 
 * {@link pvc.options.varia.DimensionValueType#Date}.
 * <p>
 * When unspecified, 
 * but the option {@link #rawFormat} is specified,
 * a format string is created from the later 
 * (simply by replacing "-" with "/").
 * <p>
 * A formatter function is created to format
 * values with the specified or implied format string.
 * 
 * @type string
 * @category Presentation
 */
pvc.options.varia.DimensionTypeOptions.prototype.format = undefined;
/**
 * A function that formats a value, 
 * possibly null, 
 * of the dimension's 
 * {@link pvc.options.varia.DimensionTypeOptions#valueType}.
 * <p>
 * Note that, the chart option 
 * {@link pvc.options.ChartCommonOptions#valueFormat},
 * is used to build a default formatter function 
 * for numeric dimensions of the "value" dimension group.
 * <p>
 * When unspecified and 
 * the value type is {@link pvc.options.varia.DimensionValueType#Number},
 * a default formatter is created that formats numbers with two decimal places.
 * <p>
 * When unspecified and 
 * the value type is {@link pvc.options.varia.DimensionValueType#Date},
 * and the option {@link #format} is specified (or implied)
 * a default formatter is created for it.
 * <p>
 * Otherwise a value is formatted by calling 
 * the standard JavaScript 
 * <tt>String</tt> function on it.
 * 
 * @returns {string}
 * The string that is the formatted value.
 * Only the 
 * <tt>null</tt> value can have the empty string
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
 * or 
 * <tt>undefined</tt>, otherwise.
 * <p>
 * In the case where the raw value is 
 * a Google-table-like cell, 
 * it is the value of its 
 * <tt>v</tt>
 * property that is passed to this argument.
 * 
 * @category Presentation
 */
pvc.options.varia.DimensionTypeOptions.prototype.formatter = function(){};
/**
 * Indicates if values of this dimension type 
 * should be hidden from the user.
 * <p>
 * This option is useful to hide auxiliar dimensions that are used to:
 * 
 * <ul> 
 * 
 * <li>hold extra data, required for drill-down purposes</li>
 * 
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
 * set the dimension type's 
 * <tt>isHidden</tt> option to 
 * <tt>true</tt>.
 * 
 * @type boolean
 * @default false
 * @category Presentation
 */
pvc.options.varia.DimensionTypeOptions.prototype.isHidden = undefined;
/**
 * The name of the dimension type as it is shown to the user.
 * <p>
 * The label 
 * <i>should</i> be unique.
 * <p>
 * The default value is built from the dimension name,
 * by converting the first character to upper case.
 * 
 * @type string
 * @category Presentation
 */
pvc.options.varia.DimensionTypeOptions.prototype.label = undefined;
/**
 * The options documentation class of a data dimensions reader.
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
 * 
 * <dl>
 * 
 * <dt>specify 
 * <tt>names</tt> but not 
 * <tt>reader</tt></dt>
 * 
 * <dd>
 * names are paired with any specified indexes, from left to right;
 * excess indexes feed dimensions whose name starts with the last specified name (a dimension group);
 * excess names are fed with the 
 * <i>non reserved</i>indexes 
 * that follow the last specified index (or 0, if none);
 * indexes explicitly specified in dimensions readers are all
 * reserved beforehand
 * </dd>
 * 
 * <dt>specify 
 * <tt>indexes</tt> but not 
 * <tt>names</tt> and 
 * <tt>reader</tt></dt>
 * 
 * <dd>
 * the specified indexes become reserved but are not read,
 * and so are effectively ignored 
 * </dd>
 * 
 * <dt>specify both 
 * <tt>reader</tt> and 
 * <tt>names</tt></dt>
 * 
 * <dd>
 * any specified indexes are reserved, 
 * and no pairing is performed between these and the specified names;
 * the reader function may 
 * read any cell from the virtual item and 
 * return atoms from any of the dimensions specified in 
 * <tt>names</tt>;
 * atoms of stated dimensions, that are not returned, 
 * result in a 
 * <i>null</i> value 
 * </dd>
 * </dl>
 * 
 * @class
 */
pvc.options.varia.DimensionsReaderOptions = function(){};
        
        
        
        
/**
 * The index or indexes, of each virtual item, 
 * that are to be read.
 * <p>
 * Only one dimensions reader can state that it reads a given index
 * (although a dimensions reader function may read any cells,
 * stated or not).
 * 
 * @type number|string|list(number|string)
 * @category General
 */
pvc.options.varia.DimensionsReaderOptions.prototype.indexes = undefined;
/**
 * The name or names of the dimensions that the reader reads
 * from each virtual item.
 * <p>
 * When the argument is a string, it can be a list of names, 
 * separated by the character ",".
 * <p>
 * Only one dimensions reader can read a given dimension.
 * 
 * @type string|list(string)
 * @category General
 */
pvc.options.varia.DimensionsReaderOptions.prototype.names = undefined;
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
 * 
 * <ul>
 * 
 * <li>
 * combine values from two or more cells into a single dimension,
 * </li>
 * 
 * <li>
 * split the value of one cell into more than one dimension,
 * </li>
 * 
 * <li>
 * feed a dimension with correlated data read from an external data source.
 * </li>
 * </ul>
 * <p>
 * Dimensions reader functions need not be specifed to perform
 * conversion or formatting operations of a single cell.
 * For those cases, the dimension type's 
 * {@link pvc.options.varia.DimensionTypeOptions#converter}
 * and 
 * {@link pvc.options.varia.DimensionTypeOptions#formatter}
 * should be used instead.
 * <p>
 * The function may read cells whose indexes were not
 * "reserved" in 
 * <tt>indexes</tt>. 
 * Those cells might be read by other readers,
 * possibly default ones created by the translator.
 * 
 * @returns {pvc.data.Atom|list(pvc.data.Atom)}
 * An atom or array of atoms read from the virtual item, 
 * or 
 * <tt>null</tt> or 
 * <tt>undefined</tt>, 
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
pvc.options.varia.DimensionsReaderOptions.prototype.reader = function(){};
/**
 * The options documentation class of a visual role.
 * <p>
 * Where a visual role argument is expected, 
 * a 
 * <tt>string</tt> value is also accepted,
 * with the content of what would be specified in
 * the property {@link #dimensions}.
 * 
 * @class
 */
pvc.options.varia.VisualRoleOptions = function(){};
        
        
        
        
/**
 * A list of dimension names and respective 
 * sort orders.
 * <p>
 * A dimensions string is similar to an SQL 'order by' clause,
 * like the following examples show:
 * 
 * <dl>
 * 
 * <dt>
 * 
 * <tt>"productType"</tt>
 * </dt>
 * 
 * <dd>
 * the visual role is bound to the single dimension named 
 * <tt>"productType"</tt>,
 * and data will be sorted in ascending order
 * </dd>
 * </dl>
 * 
 * <dl>
 * 
 * <dt>
 * 
 * <tt>"sales"</tt>
 * </dt>
 * 
 * <dd>
 * the visual role is bound to the single dimension named 
 * <tt>"sales"</tt>,
 * and data will be sorted in ascending order
 * </dd>
 * </dl>
 * 
 * <dl>
 * 
 * <dt>
 * 
 * <tt>"country, productType"</tt>
 * </dt>
 * 
 * <dd>
 * the visual role is bound to the dimensions 
 * named 
 * <tt>"country"</tt> and 
 * <tt>"productType"</tt>,
 * and data will be sorted first by
 * 
 * <tt>"country"</tt>, in ascending order,
 * and then by 
 * 
 * <tt>"productType"</tt>, in ascending order
 * </dd>
 * </dl>
 * 
 * <dl>
 * 
 * <dt>
 * 
 * <tt>"country desc, productType asc"</tt>
 * </dt>
 * 
 * <dd>
 * the visual role is bound to the dimensions 
 * named 
 * <tt>"country"</tt> and 
 * <tt>"productType"</tt>,
 * and data will be sorted first by
 * 
 * <tt>"country"</tt>, in descending order,
 * and then by 
 * 
 * <tt>"productType"</tt>, in ascending order
 * </dd>
 * </dl>
 * 
 * @type string
 */
pvc.options.varia.VisualRoleOptions.prototype.dimensions = undefined;
/**
 * Indicates that the visual role's data 
 * should be ordered in reverse order
 * in relation to the sort orders specified in
 * {@link #dimensions}.
 * <p>
 * This option provides a quick way to reverse the order
 * of the whole visual role, without changing any partial
 * sort orders assigned to each dimension of the visual role.
 * <p>
 * This option can be used to reverse the order of 
 * the data that is shown in an axis.
 * 
 * @type boolean
 * @default false
 */
pvc.options.varia.VisualRoleOptions.prototype.isReversed = undefined;
/**
 * Describes the distances from 
 * each of the four planar sides:
 * "left", "right", "top" and "bottom".
 * <p>
 * It is used to describe the margins and the paddings of panels.
 * <p>
 * It is possible to specify any combination of the side properties.
 * <p>
 * All side properties support values in absolute or relative units:
 * 
 * <dl>
 * 
 * <dt>absolute</dt>
 * 
 * <dd>
 * if it is a 
 * <tt>number</tt> or a numeric 
 * <tt>string</tt>,
 * the measure is in pixel units
 * </dd>
 * 
 * <dt>relative</dt>
 * 
 * <dd>
 * if it is a numeric 
 * <tt>string</tt> with a "%" suffix,
 * the measure is a percentage of some reference size;
 * usually, the reference size is 
 * the size of the corresponding container panel side
 * ("width" if side is "left" or "right", or "height" otherwise) 
 * </dd>
 * </dl>
 * <p>
 * The special property, 
 * <tt>all</tt>, affects all unspecified properties at once. 
 * 
 * <p>
 * The following is an example of a 
 * <i>sides</i>-structured object,
 * the hypothetical margins of a legend panel:
 * 
 * <pre>
 *                 var legendMargins = {left: 10, right: '20', all: '15%'};
 *                 
 * </pre> 
 * It says that 
 * the left margin has 10 pixels, 
 * the right margin has 20 pixels, and 
 * the top and bottom margins have each 
 * the size of 15 percent of the legend panel's height.
 * 
 * <p>
 * 
 * <h3>Single number or numeric string interpretation</h3>
 * All chart options of type {@link pvc.options.varia.Sides} 
 * allow specifying
 * a 
 * <tt>number</tt> or 
 * a 
 * <tt>string</tt> of a single number, possibly followed by a "%" sign, 
 * instead of the JSON form,
 * as meaning 
 * <i>all</i> properties.
 * 
 * 
 * <h3>String syntax</h3>
 * All chart options of type {@link pvc.options.varia.Sides} 
 * also allow specifying a CSS2-like margins string, 
 * {@link http://www.w3.org/TR/CSS21/box.html#propdef-margin}.
 * 
 * <p>
 * The following shows the equivalence between the string and JSON syntax:
 * 
 * <pre>
 *                 var margins1 = '1';       // {all: '1'}
 *                 var margins2 = '1 2';     // {top: '1', bottom: '1', right: '2', left: '2'}
 *                 var margins3 = '1 2 3';   // {top: '1', bottom: '3', right: '2', left: '2'}
 *                 var margins4 = '1 2 3 4'; // {top: '1', bottom: '3', right: '2', left: '4'}
 *                 
 * </pre>
 * 
 * <p>
 * 
 * @class
 */
pvc.options.varia.Sides = function(){};
        
        
        
        
/**
 * @type number|string
 */
pvc.options.varia.Sides.prototype.all = undefined;
/**
 * @type number|string
 */
pvc.options.varia.Sides.prototype.bottom = undefined;
/**
 * @type number|string
 */
pvc.options.varia.Sides.prototype.left = undefined;
/**
 * @type number|string
 */
pvc.options.varia.Sides.prototype.right = undefined;
/**
 * @type number|string
 */
pvc.options.varia.Sides.prototype.top = undefined;
/**
 * Describes the size 
 * of the horizontal and vertical dimensions
 * of an axis aligned box.
 * It is used to describe the margins and the paddings of panels.
 * <p>
 * It is possible to specify any combination of the size properties.
 * <p>
 * All size properties support values in absolute or relative units:
 * 
 * <dl>
 * 
 * <dt>absolute</dt>
 * 
 * <dd>
 * if it is a 
 * <tt>number</tt> or a numeric 
 * <tt>string</tt>,
 * the measure is in pixel units
 * </dd>
 * 
 * <dt>relative</dt>
 * 
 * <dd>
 * if it is a numeric 
 * <tt>string</tt> with a "%" suffix,
 * the measure is a percentage of some reference size;
 * usually, 
 * the reference size is 
 * the container panel's corresponding size
 * </dd>
 * </dl>
 * <p>
 * The special property, 
 * <tt>all</tt>, affects all unspecified properties at once. 
 * 
 * <p>
 * The following is an example of a 
 * <i>size</i>-structured object,
 * the hypothetical size of a title panel:
 * 
 * <pre>
 *                 var titleSize = {width: '80%', all: 100};
 *                 
 * </pre> 
 * It says that 
 * the height has 100 pixels, 
 * and that the width is 80 percent of the base panel's width.
 * 
 * <p>
 * 
 * <h3>Single number or numeric string interpretation</h3>
 * All chart options of type {@link pvc.options.varia.Size} 
 * allow specifying
 * a 
 * <tt>number</tt> or 
 * a 
 * <tt>string</tt> of a single number, possibly followed by a "%" sign, 
 * instead of the JSON form.
 * //as meaning 
 * <i>all</i> properties.
 * <p>
 * The interpretation of what the number or percentage stand 
 * for depends on the specific option. 
 * In the legend and title panels, for example, 
 * it is the size of the dimension orthogonal to the anchored to side.
 * So if a legend is anchored to the 
 * <tt>'left'</tt> side,
 * the number or percentage is the legend's width.  
 * 
 * <h3>String syntax</h3>
 * All chart options of type {@link pvc.options.varia.Size} 
 * also allow specifying a string with a fixed structure.
 * 
 * <p>
 * The following shows the equivalence between the string and JSON syntax:
 * 
 * <pre>
 *                 var size1 = '1';   // {all: '1'}
 *                 var size2 = '1 2'; // {width: '1', height: '2'}
 *                 
 * </pre>
 * 
 * <p>
 * 
 * @class
 */
pvc.options.varia.Size = function(){};
        
        
        
        
/**
 * @type number|string
 */
pvc.options.varia.Size.prototype.all = undefined;
/**
 * @type number|string
 */
pvc.options.varia.Size.prototype.height = undefined;
/**
 * @type number|string
 */
pvc.options.varia.Size.prototype.width = undefined;
/**
 * The visual roles common to all chart types.
 * 
 * @class
 */
pvc.options.roles.ChartCommonVisualRoles = function(){};
        
        
        
        
/**
 * The 
 * <tt>multiChart</tt> visual role
 * allows turning a chart in a small multiples chart
 * {@link http://en.wikipedia.org/wiki/Small_multiple}.
 * <p>
 * All main chart types support being shown
 * as a small multiples chart.
 * The exceptions are the charts: 
 * 
 * <i>Heat Grid</i>, 
 * 
 * <i>Bullet</i>, 
 * 
 * <i>Data Tree</i> and
 * 
 * <i>Parallel Coordinates</i>.
 * <p>
 * The 
 * <tt>multiChart</tt> visual role
 * can be bound to any number of dimensions,
 * that are, or will be turned into, discrete.
 * <p>
 * The 
 * <tt>multiChart</tt> visual role automatically binds to 
 * every dimension whose name has the 
 * <tt>multiChart</tt> prefix.
 * <p>
 * One 
 * <i>small</i> chart is generated per
 * unique combination of the values of the bound dimensions
 * that is present in the source data.
 * Each small chart then receives as its data
 * the partition of the source data that shares its 
 * unique combination of values.
 * <p>
 * See {@link pvc.options.varia.VisualRoleOptions}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.varia.VisualRoleOptions
 */
pvc.options.roles.ChartCommonVisualRoles.prototype.multiChart = undefined;
/**
 * The visual roles common to (almost) all cartesian chart types.
 * 
 * @class
 * @extends pvc.options.roles.ChartCommonVisualRoles
 */
pvc.options.roles.CartesianCommonVisualRoles = function(){};
        
        
        
        
/**
 * The 
 * <tt>series</tt> visual role represents a 
 * 
 * <i>series</i> of connected data points.
 * <p>
 * Most cartesian charts show the connectedness
 * of data points of a given series in some way, 
 * by connecting points with a line,
 * by giving them all the same color,
 * or, simply, 
 * by the order in which they are drawn,
 * and when overlapped, some stay on top of others.
 * <p>
 * The 
 * <tt>series</tt> visual role automatically binds to 
 * every dimension whose name has the 
 * <tt>series</tt> prefix.
 * <p>
 * The visual role itself is optional,
 * yet, when unbound, 
 * a dimension with a "series" prefix
 * is automatically created for it,
 * and all datums will have the value 
 * <tt>null</tt>
 * in that dimension.
 * <p>
 * The only cartesian chart type that 
 * does not support the 
 * <tt>series</tt> visual role is 
 * the 
 * <i>Box Plot</i>.
 * <p>
 * See {@link pvc.options.varia.VisualRoleOptions}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.varia.VisualRoleOptions
 */
pvc.options.roles.CartesianCommonVisualRoles.prototype.series = undefined;
/**
 * The visual roles common to all categorical chart types.
 * 
 * @class
 * @extends pvc.options.roles.CartesianCommonVisualRoles
 */
pvc.options.roles.CategoricalCommonVisualRoles = function(){};
        
        
        
        
/**
 * The 
 * <tt>category</tt> visual role 
 * represents a certain 
 * <i>logical grouping</i> of the data points.
 * <p>
 * Category data may be discrete or continuous.
 * The relevant characteristic is that 
 * data with equal category values is grouped and 
 * summarized in some way.
 * <p>
 * So,
 * if more that one data point exists for a given 
 * series and category values combination,
 * nevertheless, 
 * only one visual element is generated for the whole group.
 * <p>
 * Some chart types support 
 * showing continuous category types, in a continuous scale. 
 * Others, 
 * turn continuous dimension types bound to the 
 * <tt>category</tt>
 * visual role into discrete dimension types, 
 * and then show the continuous categories in a discrete scale.
 * <p>
 * The 
 * <tt>category</tt> visual role automatically binds to 
 * every dimension whose name has the 
 * <tt>category</tt> prefix.
 * <p>
 * The visual role itself is optional,
 * yet, when unbound, 
 * a dimension with a "category" prefix
 * is automatically created for it,
 * and all datums will have the value 
 * <tt>null</tt>
 * in that dimension.
 * <p>
 * See {@link pvc.options.varia.VisualRoleOptions}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.varia.VisualRoleOptions
 */
pvc.options.roles.CategoricalCommonVisualRoles.prototype.category = undefined;
/**
 * The extension points common to all chart types.
 * <p>
 * To use an extension point you must find its full name: 
 * join the prefix property name, 
 * like {@link #base},
 * with one of the properties of the type of the extension point,
 * like {@link pvc.options.marks.PanelExtensionPoint#overflow},
 * with an "_" character in between,
 * and obtain the name 
 * <tt>base_overflow</tt>.
 * 
 * @class
 */
pvc.options.ext.ChartCommonExtensionPoints = function(){};
        
        
        
        
/**
 * The extension point of the base (root) panel of the 
 * <i>root</i> chart.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.ChartCommonExtensionPoints.prototype.base = undefined;
/**
 * 
 * The extension point of the plot panel of the charts.
 * <p>
 * The plot panel is a child of the content panel.
 * 
 * @deprecated 
 * Please use the extension point {@link #plot} instead. 
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.ChartCommonExtensionPoints.prototype.chart = undefined;
/**
 * The extension point of the content panel of the 
 * <i>root</i> chart.
 * <p>
 * The content panel is a child of the base panel.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.ChartCommonExtensionPoints.prototype.content = undefined;
/**
 * The extension point of the plot panel of the charts.
 * <p>
 * The plot panel is a child of the content panel.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.ChartCommonExtensionPoints.prototype.plot = undefined;
/**
 * The extension point of the base (root) panel of the 
 * <i>small</i> charts.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.ChartCommonExtensionPoints.prototype.smallBase = undefined;
/**
 * The extension point of the content panel of the 
 * <i>small</i> charts.
 * <p>
 * The content panel is a child of the base panel.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.ChartCommonExtensionPoints.prototype.smallContent = undefined;
/**
 * The extension points common to all cartesian chart types.
 * 
 * @class
 * @extends pvc.options.ext.ChartCommonExtensionPoints
 */
pvc.options.ext.CartesianChartCommonExtensionPoints = function(){};
        
        
        
        
/**
 * The extension point of the grid line rules that are drawn 
 * one per major tick of the 
 * <ii>XX</ii> axis 
 * (an horizontal axis has vertical grid line rules).
 * 
 * @type pvc.options.marks.RuleExtensionPoint
 */
pvc.options.ext.CartesianChartCommonExtensionPoints.prototype.xAxisGrid = undefined;
/**
 * The extension point of the zero line rule that is drawn 
 * on the 0-valued tick, when there is one 
 * (an horizontal axis has a vertical zero line rule).
 * 
 * @type pvc.options.marks.RuleExtensionPoint
 */
pvc.options.ext.CartesianChartCommonExtensionPoints.prototype.xAxisZeroLine = undefined;
/**
 * The extension point of the grid line rules that are drawn 
 * one per major tick of the 
 * <ii>YY</ii> axis 
 * (a vertical axis has horizontal grid line rules).
 * 
 * @type pvc.options.marks.RuleExtensionPoint
 */
pvc.options.ext.CartesianChartCommonExtensionPoints.prototype.yAxisGrid = undefined;
/**
 * The extension point of the zero line rule that is drawn 
 * on the 0-valued tick, when there is one 
 * (a vertical axis has an horizontal zero line rule).
 * 
 * @type pvc.options.marks.RuleExtensionPoint
 */
pvc.options.ext.CartesianChartCommonExtensionPoints.prototype.yAxisZeroLine = undefined;
/**
 * The extension points of the chart title panel.
 * <p>
 * To use an extension point you must find its full name: 
 * join the prefix property name, 
 * like {@link #title},
 * with one of the properties of the type of the extension point,
 * like {@link pvc.options.marks.PanelExtensionPoint#fillStyle},
 * with an "_" character in between,
 * and obtain the name 
 * <tt>title_fillStyle</tt>.
 * 
 * @class
 */
pvc.options.ext.ChartTitlePanelExtensionPoints = function(){};
        
        
        
        
/**
 * The extension point of the main panel of a 
 * <i>small</i> chart.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.ChartTitlePanelExtensionPoints.prototype.smallTitle = undefined;
/**
 * The extension point of the label that holds the title text itself,
 * when the title panel belongs to a 
 * <i>small</i> chart.
 * 
 * @type pvc.options.marks.LabelExtensionPoint
 */
pvc.options.ext.ChartTitlePanelExtensionPoints.prototype.smallTitleLabel = undefined;
/**
 * The extension point of the top panel of 
 * the title panel of the 
 * <i>root</i> chart.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.ChartTitlePanelExtensionPoints.prototype.title = undefined;
/**
 * The extension point of the label that holds the title text itself,
 * when the title panel belongs to the 
 * <i>root</i> chart.
 * 
 * @type pvc.options.marks.LabelExtensionPoint
 */
pvc.options.ext.ChartTitlePanelExtensionPoints.prototype.titleLabel = undefined;
/**
 * The extension points of the legend panel.
 * <p>
 * To use an extension point you must find its full name: 
 * join the prefix property name, 
 * like {@link #legendArea},
 * with one of the properties of the type of the extension point,
 * like {@link pvc.options.marks.PanelExtensionPoint#strokeStyle},
 * with an "_" character in between,
 * and obtain the name 
 * <tt>legendArea_strokeStyle</tt>.
 * 
 * @class
 */
pvc.options.ext.LegendPanelExtensionPoints = function(){};
        
        
        
        
/**
 * The extension point of the top panel of the legend panel.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.LegendPanelExtensionPoints.prototype.legendArea = undefined;
/**
 * The extension point of the dot (the marker's shape) of a legend item.
 * 
 * @type pvc.options.marks.DotExtensionPoint
 */
pvc.options.ext.LegendPanelExtensionPoints.prototype.legendDot = undefined;
/**
 * The extension point of the label of a legend item.
 * 
 * @type pvc.options.marks.LabelExtensionPoint
 */
pvc.options.ext.LegendPanelExtensionPoints.prototype.legendLabel = undefined;
/**
 * The extension point of legend item panels.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.LegendPanelExtensionPoints.prototype.legendPanel = undefined;
/**
 * The extension point of the rule (the marker's line) of a legend item.
 * 
 * @type pvc.options.marks.RuleExtensionPoint
 */
pvc.options.ext.LegendPanelExtensionPoints.prototype.legendRule = undefined;
/**
 * The base class of protovis extension points.
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Mark.html}.
 * 
 * @class
 */
pvc.options.marks.MarkExtensionPoint = function(){};
        
        
        
        
/**
 * Use this extension point to add 
 * a new protovis mark to another mark.
 * <p>
 * If the extension point refers to a panel mark,
 * the parent of the new mark will be that panel.
 * Otherwise, its parent will
 * be the parent panel of the mark of the extension point.
 * 
 * <p>
 * The following example shows how to add an image to 
 * an axis tick:
 * 
 * <pre>
 *                 function yAxisTick(){
 *                     return new pv.Image()
 *                             .url('res/images/arrowYy.png')
 *                             .lineWidth(0)
 *                             .height(7)
 *                             .width(5);
 *                 }
 *                 
 * </pre>
 * 
 * <p>
 * 
 * @type function
 */
pvc.options.marks.MarkExtensionPoint.prototype.add = undefined;
/**
 * Indicates the distance between 
 * this mark's bottom side and 
 * its parent's bottom side.
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Mark.html#bottom}.
 * 
 * @type number
 */
pvc.options.marks.MarkExtensionPoint.prototype.bottom = undefined;
/**
 * The mouse cursor to show when the mouse is over.
 * The value is a CSS2 cursor: {@link http://www.w3.org/TR/CSS2/ui.html#propdef-cursor}.
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Mark.html#cursor}.
 * 
 * @type string
 */
pvc.options.marks.MarkExtensionPoint.prototype.cursor = undefined;
/**
 * The mouse events that the mark can receive.
 * <p>
 * The possible values are: 
 * 
 * <tt>'none'</tt>, 
 * <tt>'painted'</tt> and 
 * <tt>'all'</tt>.
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Mark.html#events}.
 * 
 * @type string
 */
pvc.options.marks.MarkExtensionPoint.prototype.events = undefined;
/**
 * Indicates the distance between 
 * this mark's left side and 
 * its parent's left side.
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Mark.html#left}.
 * 
 * @type number
 */
pvc.options.marks.MarkExtensionPoint.prototype.left = undefined;
/**
 * Indicates the distance between 
 * this mark's right side and 
 * its parent's right side.
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Mark.html#right}.
 * 
 * @type number
 */
pvc.options.marks.MarkExtensionPoint.prototype.right = undefined;
/**
 * Indicates the distance between 
 * this mark's top side and 
 * its parent's top side.
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Mark.html#top}.
 * 
 * @type number
 */
pvc.options.marks.MarkExtensionPoint.prototype.top = undefined;
/**
 * Indicates if a mark is visible.
 * <p>
 * When a mark is not visible, 
 * all its other properties are not evaluated.
 * <p>
 * When a mark is not visible, 
 * its children are not evaluated.
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Mark.html#visible}.
 * 
 * @type boolean
 */
pvc.options.marks.MarkExtensionPoint.prototype.visible = undefined;
/**
 * The class of protovis Bar extension points.
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Bar.html}.
 * 
 * @class
 * @extends pvc.options.marks.MarkExtensionPoint
 */
pvc.options.marks.BarExtensionPoint = function(){};
        
        
        
        
/**
 * The fill color of the bar.
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Bar.html#fillStyle}.
 * 
 * @type pvc.options.varia.ColorString
 */
pvc.options.marks.BarExtensionPoint.prototype.fillStyle = undefined;
/**
 * The height of the bar. 
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Bar.html#height}.
 * 
 * @type number
 */
pvc.options.marks.BarExtensionPoint.prototype.height = undefined;
/**
 * The width of the border of the bar. 
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Bar.html#lineWidth}.
 * 
 * @type number
 */
pvc.options.marks.BarExtensionPoint.prototype.lineWidth = undefined;
/**
 * The border stroke color of the bar. 
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Bar.html#strokeStyle}.
 * 
 * @type pvc.options.varia.ColorString
 */
pvc.options.marks.BarExtensionPoint.prototype.strokeStyle = undefined;
/**
 * The width of the bar. 
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Bar.html#width}.
 * 
 * @type number
 */
pvc.options.marks.BarExtensionPoint.prototype.width = undefined;
/**
 * The class of protovis Panel extension points.
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Panel.html}.
 * 
 * @class
 * @extends pvc.options.marks.BarExtensionPoint
 */
pvc.options.marks.PanelExtensionPoint = function(){};
        
        
        
        
/**
 * Specifies if child marks are clipped if 
 * they are laid outside of the panel's bounds.
 * <p>
 * The most used values are 
 * <tt>'visible'</tt>, 
 * <tt>'hidden'</tt>.
 * See all possible values in in {@link http://www.w3.org/TR/CSS2/visufx.html#overflow}.
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Panel.html#overflow}.
 * 
 * @type string
 */
pvc.options.marks.PanelExtensionPoint.prototype.overflow = undefined;
/**
 * The class of protovis Rule extension points.
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Rule.html}.
 * 
 * @class
 * @extends pvc.options.marks.MarkExtensionPoint
 */
pvc.options.marks.RuleExtensionPoint = function(){};
        
        
        
        
/**
 * The height of the rule, when it is vertical. 
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Rule.html#height}.
 * 
 * @type number
 */
pvc.options.marks.RuleExtensionPoint.prototype.height = undefined;
/**
 * The line width of the rule.
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Rule.html#lineWidth}.
 * 
 * @type number
 */
pvc.options.marks.RuleExtensionPoint.prototype.lineWidth = undefined;
/**
 * The stroke color of the rule. 
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Rule.html#strokeStyle}.
 * 
 * @type pvc.options.varia.ColorString
 */
pvc.options.marks.RuleExtensionPoint.prototype.strokeStyle = undefined;
/**
 * The width of the rule, when it is horizontal.
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Rule.html#width}.
 * 
 * @type number
 */
pvc.options.marks.RuleExtensionPoint.prototype.width = undefined;
/**
 * This class is a documentation class and 
 * really just documents the format of color strings.
 * <p>
 * Colors can be specified as a string that follows one of the following formats:
 * 
 * <ul>
 * 
 * <li>
 * an RGB or HSL color, as defined in {@link http://www.w3.org/TR/css3-color/}:
 * 
 * <ul>
 * 
 * <li>
 * 
 * <tt>'#AE7'</tt>
 * </li>
 * 
 * <li>
 * 
 * <tt>'#A0E070'</tt>
 * </li>
 * 
 * <li>
 * 
 * <tt>rgb(255, 0, 0)</tt>
 * </li>
 * 
 * <li>
 * 
 * <tt>rgba(100%, 0, 0, 0.5)</tt>
 * </li>
 * 
 * <li>
 * 
 * <tt>hsl(100, 50%, 20%)</tt>
 * </li>
 * 
 * <li>
 * 
 * <tt>hsla(100, 50%, 20%, 0.5)</tt>
 * </li>
 * </ul>
 * </li>
 * 
 * <li>
 * an SVG named color, as defined in {@link http://www.w3.org/TR/SVG/types.html#ColorKeywords}:
 * 
 * <ul>
 * 
 * <li>
 * <tt>'aliceblue'</tt></li>
 * 
 * <li>
 * <tt>'aquamarine'</tt></li>
 * </ul>
 * </li>
 * 
 * <li>
 * a subset of the CSS3 gradients format,
 * as defined in {@link http://www.w3.org/TR/css3-images/#gradients}:
 * 
 * <ul>
 * 
 * <li>
 * <tt>'linear-gradient(90deg, green, blue)'</tt></li>
 * 
 * <li>
 * <tt>'linear-gradient(to bottom left, red, yellow 20%, green, blue)'</tt></li>
 * 
 * <li>
 * <tt>'linear-gradient(red, rgb(0,0,255))'</tt></li>
 * 
 * <li>
 * <tt>'radial-gradient(red, yellow 40%, red)'</tt></li>
 * </ul>
 * </li>
 * 
 * <li>
 * 
 * <tt>'transparent'</tt> for a transparent background
 * </li>
 * </ul>
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.html#.color}.
 * 
 * @class
 * @extends string
 */
pvc.options.varia.ColorString = function(){};
        
        
        
        
/**
 * Control the beahvior of the legend
 * when the user clicks a legend item.
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.LegendClickMode = function(){};
        
        
        
        
/**
 * Nothing happens.
 * 
 * @value 'none'
 */
pvc.options.varia.LegendClickMode.prototype.None = 'none';
/**
 * The corresponding datums' selected state is toggled. 
 * 
 * @value 'toggleSelected'
 */
pvc.options.varia.LegendClickMode.prototype.ToggleSelected = 'toggleSelected';
/**
 * The corresponding datums' visible state is toggled.
 * 
 * @value 'toggleVisible'
 */
pvc.options.varia.LegendClickMode.prototype.ToggleVisible = 'toggleVisible';
/**
 * The sides of a child panel, the source, 
 * that can be aligned with 
 * a target side of a parent panel.
 * <p>
 * The alignment side must be 
 * orthogonal to the side of 
 * the {@link pvc.options.varia.DockPosition}.
 * <p>
 * By combininig the alignment source
 * with the {@link pvc.options.varia.AlignmentTarget},
 * different alignment combinations can be achieved.
 * <p>
 * The alignment target side must be 
 * parallel to the side of source alignment.
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.AlignmentSource = function(){};
        
        
        
        
/**
 * The bottom side of the child panel 
 * is placed at the same position as the
 * target side of the parent panel. 
 * 
 * @value 'bottom'
 */
pvc.options.varia.AlignmentSource.prototype.Bottom = 'bottom';
/**
 * The horizontal center position of the child panel 
 * is placed at the same position as the
 * target side of the parent panel. 
 * 
 * @value 'center'
 */
pvc.options.varia.AlignmentSource.prototype.Center = 'center';
/**
 * The left side of the child panel 
 * is placed at the same position as the
 * target side of the parent panel.
 * 
 * @value 'left'
 */
pvc.options.varia.AlignmentSource.prototype.Left = 'left';
/**
 * The vertical center position of the child panel 
 * is placed at the same position as the
 * target side of the parent panel. 
 * 
 * @value 'middle'
 */
pvc.options.varia.AlignmentSource.prototype.Middle = 'middle';
/**
 * The right side of the child panel 
 * is placed at the same position as the
 * target side of the parent panel.
 * 
 * @value 'right'
 */
pvc.options.varia.AlignmentSource.prototype.Right = 'right';
/**
 * The top side of the child panel 
 * is placed at the same position as the
 * target side of the parent panel.
 * 
 * @value 'top'
 */
pvc.options.varia.AlignmentSource.prototype.Top = 'top';
/**
 * The sides of a parent panel, the target, 
 * with which the alignment side of a source child panel 
 * can be aligned to.
 * <p>
 * The alignment target side must be 
 * parallel to the side of source alignment.
 * <p>
 * Wherever an alignment target argument is found,
 * a value of type 
 * <tt>number</tt>,
 * a numeric 
 * <tt>string</tt> or 
 * a numeric percentage 
 * <tt>string</tt>, 
 * may also be specified.
 * <p>
 * In this case, 
 * these specify the position of alignment, 
 * from the left or top sides,
 * whichever is parallel to the alignment source side.
 * <p>
 * For example, if the source alignment side is 
 * <tt>'right'</tt>
 * and the target alignment specifies 
 * <tt>'10%'</tt>,
 * then the right side of the child panel would be
 * placed at a position of 
 * 10% of the parent panel's client width
 * from the parent's left side.
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.AlignmentTarget = function(){};
        
        
        
        
/**
 * The source side of the child panel
 * is placed at the same position as the
 * bottom side of the parent panel.
 * 
 * @value 'bottom'
 */
pvc.options.varia.AlignmentTarget.prototype.Bottom = 'bottom';
/**
 * The source side of the child panel
 * is placed at the same position as the
 * horizontal center position of the parent panel.
 * 
 * @value 'center'
 */
pvc.options.varia.AlignmentTarget.prototype.Center = 'center';
/**
 * The source side of the child panel
 * is placed at the same position as the
 * left side of the parent panel.
 * 
 * @value 'left'
 */
pvc.options.varia.AlignmentTarget.prototype.Left = 'left';
/**
 * The source side of the child panel
 * is placed at the same position as the
 * vertical center position of the parent panel.
 * 
 * @value 'middle'
 */
pvc.options.varia.AlignmentTarget.prototype.Middle = 'middle';
/**
 * The source side of the child panel
 * is placed at the same position as the
 * vertical center position of the 
 * 
 * <i>page</i> height of the parent panel.
 * <p>
 * The page height differs from the chart height
 * in that the 
 * page height is by definition 
 * the value initially specified in 
 * {@link pvc.options.ChartCommonOptions#height},
 * and the chart height 
 * can grow if layout so requires it,
 * like it does in 
 * <i>small multiples</i> charts.
 * <p>
 * The page middle alignment allows, 
 * for example, 
 * placing the legend panel in 
 * the middle of the screen height,
 * even though the height of the chart
 * may have become much larger.
 * 
 * @value 'page-middle'
 */
pvc.options.varia.AlignmentTarget.prototype.PageMiddle = 'page-middle';
/**
 * The source side of the child panel
 * is placed at the same position as the
 * right side of the parent panel.
 * 
 * @value 'right'
 */
pvc.options.varia.AlignmentTarget.prototype.Right = 'right';
/**
 * The source side of the child panel
 * is placed at the same position as the
 * top side of the parent panel.
 * 
 * @value 'top'
 */
pvc.options.varia.AlignmentTarget.prototype.Top = 'top';
/**
 * The sides of a parent panel to 
 * which a child panel may be docked to.
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.DockPosition = function(){};
        
        
        
        
/**
 * The bottom side of the child panel 
 * is placed at the same position as the
 * bottom side of the parent panel. 
 * 
 * @value 'bottom'
 */
pvc.options.varia.DockPosition.prototype.Bottom = 'bottom';
/**
 * The left side of the child panel 
 * is placed at the same position as the
 * left side of the parent panel. 
 * 
 * @value 'left'
 */
pvc.options.varia.DockPosition.prototype.Left = 'left';
/**
 * The right side of the child panel 
 * is placed at the same position as the
 * right side of the parent panel. 
 * 
 * @value 'right'
 */
pvc.options.varia.DockPosition.prototype.Right = 'right';
/**
 * The top side of the child panel 
 * is placed at the same position as the
 * top side of the parent panel. 
 * 
 * @value 'top'
 */
pvc.options.varia.DockPosition.prototype.Top = 'top';
/**
 * Controls if and how the selection can be cleared by the user.
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.ClearSelectionMode = function(){};
        
        
        
        
/**
 * The user can click on any 
 * <i>empty area</i>
 * 
 * <i>inside</i> the chart to clear the selection.
 * 
 * @value 'emptySpaceClick'
 */
pvc.options.varia.ClearSelectionMode.prototype.EmptySpaceClick = 'emptySpaceClick';
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
pvc.options.varia.ClearSelectionMode.prototype.Manual = 'manual';
/**
 * The main direction of drawing.
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.Orientation = function(){};
        
        
        
        
/**
 * Horizontal direction.
 * 
 * @value 'horizontal'
 */
pvc.options.varia.Orientation.prototype.Horizontal = 'horizontal';
/**
 * Vertical direction.
 * 
 * @value 'vertical'
 */
pvc.options.varia.Orientation.prototype.Vertical = 'vertical';
/**
 * The shapes that are available in protovis Dot marks.
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.ShapeType = function(){};
        
        
        
        
/**
 * @value 'bar'
 */
pvc.options.varia.ShapeType.prototype.Bar = 'bar';
/**
 * @value 'circle'
 */
pvc.options.varia.ShapeType.prototype.Circle = 'circle';
/**
 * @value 'cross'
 */
pvc.options.varia.ShapeType.prototype.Cross = 'cross';
/**
 * @value 'diamond'
 */
pvc.options.varia.ShapeType.prototype.Diamond = 'diamond';
/**
 * @value 'square'
 */
pvc.options.varia.ShapeType.prototype.Square = 'square';
/**
 * @value 'tick'
 */
pvc.options.varia.ShapeType.prototype.Tick = 'tick';
/**
 * @value 'triangle'
 */
pvc.options.varia.ShapeType.prototype.Triangle = 'triangle';
/**
 * The types of values that a dimension can hold.
 * <p>
 * Note that, 
 * whatever the value type of a dimension type,
 * 
 * <tt>null</tt> is always a supported value.
 * 
 * @class
 * @enum
 * @extends function
 */
pvc.options.varia.DimensionValueType = function(){};
        
        
        
        
/**
 * The "any" value type, 
 * specified as 
 * <tt>null</tt>, 
 * means that a dimension can hold any type of data.
 * <p>
 * Values of this type are 
 * <i>not</i> cast.
 * <p>
 * Each value may have a different type.
 * <p>
 * Dimension types of this value type
 * are discrete.
 * 
 * @value null
 */
pvc.options.varia.DimensionValueType.prototype.Any = null;
/**
 * The dimension holds 
 * <i>boolean</i> values.
 * <p>
 * Values of this type are cast by using the standard 
 * JavaScript 
 * <tt>Boolean</tt> function.
 * <p>
 * Dimension types of this value type
 * are discrete.
 * 
 * @value Boolean
 */
pvc.options.varia.DimensionValueType.prototype.Boolean = Boolean;
/**
 * The dimension holds 
 * <i>date</i> values.
 * <p>
 * Values of this type are cast by using the standard 
 * JavaScript 
 * <tt>Date</tt> constructor.
 * <p>
 * Dimension types of this value type
 * can be continuous or discrete.
 * 
 * @value Date
 */
pvc.options.varia.DimensionValueType.prototype.Date = Date;
/**
 * The dimension holds 
 * <i>number</i> values.
 * <p>
 * Values of this type are cast by using the standard 
 * JavaScript 
 * <tt>Number</tt> function;
 * additionally, 
 * resulting 
 * <tt>NaN</tt> values 
 * are converted to 
 * <tt>null</tt>. 
 * <p>
 * Dimension types of this value type
 * can be continuous or discrete.
 * 
 * @value Number
 */
pvc.options.varia.DimensionValueType.prototype.Number = Number;
/**
 * The dimension holds 
 * <i>object</i> values.
 * <p>
 * Values of this type are cast by using the standard 
 * JavaScript 
 * <tt>Object</tt> function.
 * <p>
 * Dimension types of this value type
 * are discrete.
 * 
 * @value Object
 */
pvc.options.varia.DimensionValueType.prototype.Object = Object;
/**
 * The dimension holds 
 * <i>string</i> values.
 * <p>
 * Values of this type are cast by using the standard 
 * JavaScript 
 * <tt>String</tt> function.
 * <p>
 * Dimension types of this value type
 * are discrete.
 * <p>
 * The empty string value is 
 * always converted to the null value.
 * 
 * @value String
 */
pvc.options.varia.DimensionValueType.prototype.String = String;