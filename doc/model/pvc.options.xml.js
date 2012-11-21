
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
 * as well as of the namespaces below this one, 
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
 * and not a {@link pvc.options.charts.BarChart}
 * 
 * <p>
 * 
 * @namespace
 */
pvc.options = {};

/**
 * The namespace of CCC chart extension point classes. 
 * 
 * @namespace
 */
pvc.options.ext = {};

/**
 * The namespace of chart options classes. 
 * 
 * @namespace
 */
pvc.options.charts = {};

/**
 * The common options documentation class of all charts.
 * 
 * @class
 * @abstract
 */
pvc.options.charts.Chart = function(){};
        
        
        
        
/**
 * A callback function that is called
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
pvc.options.charts.Chart.prototype.clickAction = function(){};
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
pvc.options.charts.Chart.prototype.renderCallback = function(){};
/**
 * An array of dimensions calculations.
 * <p>
 * Can be specified to calculate the values of certain dimensions.
 * 
 * @type list(pvc.options.DimensionsCalculation)
 * @category Data
 */
pvc.options.charts.Chart.prototype.calculations = undefined;
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
 * @type map(string : pvc.options.DimensionType)
 * @category Data
 */
pvc.options.charts.Chart.prototype.dimensionGroups = undefined;
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
 * @type map(string : pvc.options.DimensionType)
 * @category Data
 */
pvc.options.charts.Chart.prototype.dimensions = undefined;
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
pvc.options.charts.Chart.prototype.groupedLabelSep = undefined;
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
pvc.options.charts.Chart.prototype.ignoreNulls = undefined;
/**
 * A function that formats the
 * non-null 
 * <i>numeric</i> values
 * of the dimensions named 
 * <tt>value</tt>, 
 * <tt>value2</tt>, etc.
 * <p>
 * This property is used to default the property 
 * {@link pvc.options.DimensionType#formatter}
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
pvc.options.charts.Chart.prototype.valueFormat = function(){};
/**
 * Indicates if the data source is in 
 * <i>crosstab</i> format.
 * 
 * @type boolean
 * @default true
 * @category Data Translation
 */
pvc.options.charts.Chart.prototype.crosstabMode = undefined;
/**
 * Indicates if the data source has 
 * multiple value dimensions.
 * 
 * @type boolean
 * @default false
 * @category Data Translation
 */
pvc.options.charts.Chart.prototype.isMultiValued = undefined;
/**
 * The indexes of the data source's 
 * <i>virtual item</i> columns
 * that are to feed the 
 * default dimensions 
 * 
 * <tt>value</tt>, 
 * 
 * <tt>value2</tt>, etc.
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
pvc.options.charts.Chart.prototype.measuresIndexes = undefined;
/**
 * An array of dimensions readers.
 * <p>
 * Can be specified to customize the 
 * translation process of the data source. 
 * 
 * @type list(pvc.options.DimensionsReader)
 * @category Data Translation
 */
pvc.options.charts.Chart.prototype.readers = undefined;
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
pvc.options.charts.Chart.prototype.seriesInRows = undefined;
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
pvc.options.charts.Chart.prototype.canvas = undefined;
/**
 * The CCC version that the chart should run in.
 * <p>
 * The value 
 * <tt>1</tt> emulates version 1 of CCC.
 * 
 * @type number
 * @default Infinity
 * @category General
 */
pvc.options.charts.Chart.prototype.compatVersion = undefined;
/**
 * Indicates if the chart is clickable by the user.
 * <p>
 * If this option is 
 * <tt>false</tt>, 
 * any click-related actions will not be executed 
 * (ex: 
 * {@link #clickAction},
 * {@link #doubleClickAction}, or
 * {@link pvc.options.axes.DiscreteCartesianAxis#clickAction}).
 * 
 * @type boolean
 * @default false
 * @category Interaction
 */
pvc.options.charts.Chart.prototype.clickable = undefined;
/**
 * 
 * Indicates if tooltips are enabled 
 * and contains additional tooltip presentation options.
 * 
 * @deprecated Use {@link #tooltip} instead.
 * @type boolean
 * @category Interaction
 */
pvc.options.charts.Chart.prototype.showTooltips = undefined;
/**
 * 
 * Contains additional tooltip presentation options.
 * 
 * @deprecated Use {@link #tooltip} instead.
 * @type pvc.options.Tooltip
 * @category Interaction
 */
pvc.options.charts.Chart.prototype.tipsySettings = undefined;
/**
 * Indicates if tooltips are enabled 
 * and contains additional tooltip presentation options.
 * 
 * @type pvc.options.Tooltip
 * @category Interaction
 */
pvc.options.charts.Chart.prototype.tooltip = undefined;
/**
 * The margins of the 
 * <i>root</i> content panel.
 * <p>
 * In a 
 * <i>small multiples</i> chart, 
 * the margins of the 
 * <i>content panel</i> of a 
 * <i>small</i> chart 
 * can be set with the property 
 * <tt>smallContentMargins</tt>.
 * <p>
 * See {@link pvc.options.varia.Sides} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Sides
 * @default 0
 * @category Layout
 */
pvc.options.charts.Chart.prototype.contentMargins = undefined;
/**
 * The paddings of the 
 * <i>root</i> content panel.
 * <p>
 * In a 
 * <i>small multiples</i> chart, 
 * the paddings of the 
 * <i>content panel</i> of a 
 * <i>small</i> chart 
 * can be set with the property 
 * <tt>smallContentPaddings</tt>.
 * <p>
 * See {@link pvc.options.varia.Sides} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Sides
 * @default 0
 * @category Layout
 */
pvc.options.charts.Chart.prototype.contentPaddings = undefined;
/**
 * The height of the 
 * <i>root</i> chart, in pixels.
 * 
 * @type number
 * @default 300
 * @category Layout
 */
pvc.options.charts.Chart.prototype.height = undefined;
/**
 * The margins of the 
 * <i>root</i> chart.
 * <p>
 * In a 
 * <i>small multiples</i> chart, 
 * the margins of the 
 * <i>small</i> charts can be set
 * with the property 
 * <tt>smallMargins</tt>.
 * <p>
 * See {@link pvc.options.varia.Sides} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Sides
 * @default 3
 * @category Layout
 */
pvc.options.charts.Chart.prototype.margins = undefined;
/**
 * The chart orientation indicates if 
 * its main direction is vertical or horizontal.
 * <p>
 * This property is supported by most chart types. 
 * 
 * @type pvc.options.varia.ChartOrientation
 * @default 'vertical'
 * @category Layout
 */
pvc.options.charts.Chart.prototype.orientation = undefined;
/**
 * The paddings of the 
 * <i>root</i> chart.
 * <p>
 * In a 
 * <i>small multiples</i> chart, 
 * the paddings of a 
 * <i>small</i> chart can be set
 * with the property 
 * <tt>smallPaddings</tt>.
 * <p>
 * See {@link pvc.options.varia.Sides} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Sides
 * @default 0
 * @category Layout
 */
pvc.options.charts.Chart.prototype.paddings = undefined;
/**
 * The width of the 
 * <i>root</i> chart, in pixels.
 * 
 * @type number
 * @default 400
 * @category Layout
 */
pvc.options.charts.Chart.prototype.width = undefined;
/**
 * The title panel of the root chart.
 * <p>
 * When a value of type 
 * <tt>string</tt> is specified, 
 * it is the title text.
 * 
 * @type string|pvc.options.panels.ChartTitlePanel
 * @category Panels
 */
pvc.options.charts.Chart.prototype.title = undefined;
/**
 * The chart's visual roles.
 * <p>
 * Besides the existing visual role properties
 * - named after the visual role's name followed by the word 
 * <tt>Role</tt> -
 * the visual roles map can be used, in code,
 * as an alternative to specify the visual role's information.
 * The visual role name is the map's key, 
 * and the value, its options. 
 * 
 * @type map(string : pvc.options.VisualRole)
 * @category Visual roles
 */
pvc.options.charts.Chart.prototype.visualRoles = undefined;
/**
 * A callback function that is called
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
pvc.options.charts.Chart.prototype.doubleClickAction = function(){};
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
pvc.options.charts.Chart.prototype.selectionChangedAction = function(){};
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
pvc.options.charts.Chart.prototype.userSelectionAction = function(){};
/**
 * The first color axis options.
 * <p>
 * This axis can also be accessed by the property name 
 * <tt>color</tt>.
 * <p>
 * See {@link pvc.options.axes.ColorAxis}
 * for more information on the way that 
 * the color axes' properties may be accessed. 
 * 
 * @type pvc.options.axes.ColorAxis
 * @category Axes
 */
pvc.options.charts.Chart.prototype.color = undefined;
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
pvc.options.charts.Chart.prototype.percentValueFormat = function(){};
/**
 * Indicates that dimensions whose 
 * name is "category1", "category2", etc, 
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
pvc.options.charts.Chart.prototype.timeSeries = undefined;
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
 * {@link pvc.options.DimensionType#rawFormat}
 * <p>
 * property,
 * for dimensions with a 
 * <tt>Date</tt> value type.  
 * 
 * @type string
 * @default '%Y-%m-%d'
 * @category Data
 */
pvc.options.charts.Chart.prototype.timeSeriesFormat = undefined;
/**
 * Indicates if a chart should show an entry animation, 
 * every time it is fully rendered.
 * Most charts perform some sort of entry animation 
 * of its main visual elements.
 * <p>
 * When a chart is rendered explicitly, 
 * through its 
 * <tt>render</tt> method,
 * it is possible to control whether the entry animation 
 * is performed or not.
 * 
 * @type boolean
 * @default true
 * @category Interaction
 */
pvc.options.charts.Chart.prototype.animate = undefined;
/**
 * Controls if and how the selection can be cleared by the user.
 * 
 * @type pvc.options.varia.ChartClearSelectionMode
 * @default 'emptySpaceClick'
 * @category Interaction
 */
pvc.options.charts.Chart.prototype.clearSelectionMode = undefined;
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
pvc.options.charts.Chart.prototype.ctrlSelectMode = undefined;
/**
 * The maximum number of milliseconds,
 * between two consecutive clicks,
 * for them to be considered a double-click.
 * 
 * @type number
 * @default 300
 * @category Interaction
 */
pvc.options.charts.Chart.prototype.doubleClickMaxDelay = undefined;
/**
 * Indicates if the chart's visual elements
 * are automatically highlighted 
 * when the user hovers over them with the mouse.
 * 
 * @type boolean
 * @default false
 * @category Interaction
 */
pvc.options.charts.Chart.prototype.hoverable = undefined;
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
pvc.options.charts.Chart.prototype.selectable = undefined;
/**
 * The legend panel of the root chart.
 * <p>
 * When a value of type 
 * <tt>boolean</tt> is specified,
 * it indicates the visibility of the legend.
 * The default is 
 * <tt>false</tt>.
 * 
 * @type boolean|pvc.options.panels.LegendPanel
 * @category Panels
 */
pvc.options.charts.Chart.prototype.legend = undefined;
/**
 * The extension points object contains style definitions for 
 * the marks of the chart.
 * 
 * @type pvc.options.ext.ChartExtensionPoints
 * @category Style
 */
pvc.options.charts.Chart.prototype.extensionPoints = undefined;
/**
 * The extension points common to all chart types.
 * <p>
 * To use an extension point you must find its full name, by joining:
 * 
 * <ol>
 * 
 * <li>extension property (ex: 
 * <tt>base</tt>)</li>
 * 
 * <li>the "_" character</li>
 * 
 * <li>extension sub-property (ex: 
 * <tt>strokeStyle</tt>)</li>
 * </ol>
 * and obtaining, for the examples, the camel-cased name: 
 * <tt>base_strokeStyle</tt>
 * (see {@link http://en.wikipedia.org/wiki/CamelCase}).
 * 
 * @class
 */
pvc.options.ext.ChartExtensionPoints = function(){};
        
        
        
        
/**
 * The extension point of the base (root) panel of the 
 * <i>root</i> chart.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.ChartExtensionPoints.prototype.base = undefined;
/**
 * 
 * The extension point of the plot panel of the charts.
 * <p>
 * The plot panel is a child of the content panel.
 * 
 * @deprecated Use the extension point {@link #plot} instead.
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.ChartExtensionPoints.prototype.chart = undefined;
/**
 * The extension point of the content panel of the 
 * <i>root</i> chart.
 * <p>
 * The content panel is a child of the base panel.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.ChartExtensionPoints.prototype.content = undefined;
/**
 * The extension point of the plot panel of the charts.
 * <p>
 * The plot panel is a child of the content panel.
 * <p>
 * The root of a small multiples chart does not have a plot panel.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.ChartExtensionPoints.prototype.plot = undefined;
/**
 * The extension point of the selection rubber-band.
 * 
 * @type pvc.options.marks.BarExtensionPoint
 */
pvc.options.ext.ChartExtensionPoints.prototype.rubberBand = undefined;
/**
 * The options documentation class of the tooltip.
 * 
 * @class
 */
pvc.options.Tooltip = function(){};
        
        
        
        
/**
 * Indicates if the tooltip shows an arrow 
 * pointing to the 
 * visual element's anchor point.
 * 
 * @type boolean
 * @default true
 */
pvc.options.Tooltip.prototype.arrowVisible = undefined;
/**
 * The delay for the tooltip to show, in milliseconds.
 * 
 * @type number
 * @default 200
 */
pvc.options.Tooltip.prototype.delayIn = undefined;
/**
 * The delay for the tooltip to hide, in milliseconds.
 * 
 * @type number
 * @default 80
 */
pvc.options.Tooltip.prototype.delayOut = undefined;
/**
 * Indicates if the tooltip is enabled.
 * 
 * @type boolean
 * @default true
 */
pvc.options.Tooltip.prototype.enabled = undefined;
/**
 * Indicates if the tooltip fades in and out,
 * after the corresponding delay has expired.
 * 
 * @type boolean
 * @default false
 */
pvc.options.Tooltip.prototype.fade = undefined;
/**
 * Indicates if the 
 * visual element's anchor point
 * should be the current mouse position.
 * 
 * @type boolean
 * @default false
 */
pvc.options.Tooltip.prototype.followMouse = undefined;
/**
 * A callback function that is called,
 * to build the tooltip of a visual element.
 * <p>
 * If {@link #format} is 
 * <tt>true</tt>,
 * the resulting text is in HTML format,
 * otherwise, it is plain text.
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
 */
pvc.options.Tooltip.prototype.format = function(){};
/**
 * The preferred tooltip gravity.
 * 
 * @type pvc.options.varia.TooltipGravity
 * @default 's'
 */
pvc.options.Tooltip.prototype.gravity = undefined;
/**
 * Indicates if the tooltip text 
 * that the function {@link #format} builds 
 * is in HTML format.
 * 
 * @type boolean
 * @default true
 */
pvc.options.Tooltip.prototype.html = undefined;
/**
 * The distance of the closest tooltip edge or corner 
 * to the visual element's tooltip anchor point.
 * <p>
 * The default value depends on the chart type. 
 * 
 * @type number
 * @default 2
 */
pvc.options.Tooltip.prototype.offset = undefined;
/**
 * The distance of the closest tooltip edge or corner 
 * to the visual element's tooltip anchor point.
 * <p>
 * The default value depends on the chart type. 
 * 
 * @type number
 * @default 0.9
 */
pvc.options.Tooltip.prototype.opacity = undefined;
/**
 * Indicates if the tooltip gravities should be 
 * aligned with corners.
 * 
 * @type boolean
 * @default false
 */
pvc.options.Tooltip.prototype.useCorners = undefined;
/**
 * The options documentation class of a dimension type.
 * 
 * @class
 */
pvc.options.DimensionType = function(){};
        
        
        
        
/**
 * A function that compares two different and non-null values of the dimension's 
 * {@link pvc.options.DimensionType#valueType}.
 * <p>
 * When unspecified, 
 * a default natural order comparer function
 * is applied to the continuous value types:
 * {@link pvc.options.varia.DimensionValueType#Number} and
 * {@link pvc.options.varia.DimensionValueType#Date}.
 * <p>
 * Dimension types that do not have a comparer 
 * function "compare" their values by "input order" 
 * - order of first appearance, in the data source.
 * 
 * @returns {number}
 * The number 0 if the two values have the same order, 
 * a negative number if 
 * <tt>a</tt> is before 
 * <tt>b</tt>, and
 * a positive number if 
 * <tt>a</tt> is after 
 * <tt>b</tt>.
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
pvc.options.DimensionType.prototype.comparer = function(){};
/**
 * Converts a non-null raw value, 
 * as read from the data source,
 * into a value of the dimension's {@link #valueType}.
 * <p>
 * The returned value 
 * need not have the type of the dimension's value type.
 * Yet, 
 * it must be such that 
 * the associated value type's cast function can 
 * convert it to the dimension's value type.
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
pvc.options.DimensionType.prototype.converter = function(){};
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
pvc.options.DimensionType.prototype.isDiscrete = undefined;
/**
 * A function that converts a non-null value of the dimension's 
 * {@link pvc.options.DimensionType#valueType}
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
pvc.options.DimensionType.prototype.key = function(){};
/**
 * A protovis format string that is to parse the raw value.
 * <p>
 * Currently, this option is ignored unless the 
 * option {@link #converter} is unspecified
 * and the value type is 
 * {@link pvc.options.varia.DimensionValueType#Date}.
 * <p>
 * When the chart option 
 * {@link pvc.options.charts.Chart#timeSeriesFormat},
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
pvc.options.DimensionType.prototype.rawFormat = undefined;
/**
 * The type of value that dimensions of this type will hold.
 * 
 * @type pvc.options.varia.DimensionValueType
 * @default null
 * @category Data
 */
pvc.options.DimensionType.prototype.valueType = undefined;
/**
 * A protovis format string that is to format a value of 
 * the dimension's 
 * {@link pvc.options.DimensionType#valueType}.
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
pvc.options.DimensionType.prototype.format = undefined;
/**
 * A function that formats a value, 
 * possibly null, 
 * of the dimension's 
 * {@link pvc.options.DimensionType#valueType}.
 * <p>
 * Note that, the chart option 
 * {@link pvc.options.charts.Chart#valueFormat},
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
pvc.options.DimensionType.prototype.formatter = function(){};
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
pvc.options.DimensionType.prototype.isHidden = undefined;
/**
 * The name of the dimension type as it is shown to the user.
 * <p>
 * The label 
 * <i>should</i> be unique.
 * <p>
 * The default value is built from the dimension name,
 * by converting the first character to upper case.
 * 
 * 
 * @type string
 * @category Presentation
 */
pvc.options.DimensionType.prototype.label = undefined;
/**
 * A dimensions calculation allows the values of a dimension
 * to be calculated from the typed values of 
 * the other non-calculated dimensions.
 * <p>
 * While a dimensions reader could achieve the same result, 
 * it works by reading values from the virtual item,
 * accessing it by index.
 * That would require the knowledge of the indexes 
 * in which the desired dimensions were, 
 * which is many times not true, 
 * specially when the mapping between 
 * dimensions and virtual item indexes is determined automatically
 * by the data translator.
 * 
 * @class
 */
pvc.options.DimensionsCalculation = function(){};
        
        
        
        
/**
 * A dimensions calculation function.
 * 
 * @returns {undefined}
 * @method
 * @this null
 * @param {pvc.data.Complex} datum
 * The complex (Datum or Data) instance 
 * whose dimensions are being calculated.
 * 
 * @param {object} outAtoms
 * An object that should be filled with read raw or typed values, 
 * each placed in a property with the name
 * of the corresponding dimension.
 * <p>
 * It is also possible that the values be the atoms themselves, 
 * a technique that can be used to achieve greater performance,
 * when a dimension only has two or three possible values. 
 * 
 * @category General
 */
pvc.options.DimensionsCalculation.prototype.calculation = function(){};
/**
 * The name or names of the dimensions that 
 * are calculated by the calculation.
 * <p>
 * When the argument is a string, it can be a list of names, 
 * separated by the character ",".
 * <p>
 * Only one dimensions calculation or dimensions reader
 * can calculate or read a given dimension.
 * 
 * @type string|list(string)
 * @category General
 */
pvc.options.DimensionsCalculation.prototype.names = undefined;
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
 * <i>null</i> value;
 * this form allows, for example,
 * splitting a value in the virtual item into two dimensions.
 * </dd>
 * </dl>
 * 
 * @class
 */
pvc.options.DimensionsReader = function(){};
        
        
        
        
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
pvc.options.DimensionsReader.prototype.indexes = undefined;
/**
 * The name or names of the dimensions that the reader reads
 * from each virtual item.
 * <p>
 * When the argument is a string, it can be a list of names, 
 * separated by the character ",".
 * <p>
 * Only one dimensions reader or dimensions calculation can 
 * read or calculate a given dimension.
 * 
 * @type string|list(string)
 * @category General
 */
pvc.options.DimensionsReader.prototype.names = undefined;
/**
 * A dimensions reader function, 
 * reads values mapped to dimensions 
 * from a virtual item row.
 * <p>
 * When unspecified, 
 * one is created that performs a simple 
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
 * {@link pvc.options.DimensionType#converter}
 * and 
 * {@link pvc.options.DimensionType#formatter}
 * are more appropriate.
 * <p>
 * Also, when the value of a dimension 
 * is calculated from the value of other dimensions, 
 * a dimensions calculation may be more appropriate:
 * see {@link pvc.options.DimensionsCalculation}.
 * <p>
 * The function may read cells whose indexes were not
 * "reserved" in 
 * <tt>indexes</tt>. 
 * Those cells might be read by other readers,
 * possibly default ones created by the translator.
 * 
 * @returns {undefined}
 * @method
 * @this pvc.data.Data
 * @param {list(any)} virtualItem
 * The virtual item array.
 * 
 * @param {object} outAtoms
 * An object that should be filled with read raw values, 
 * each placed in a property with the name
 * of the corresponding dimension.
 * <p>
 * It is also possible that the values be the atoms themselves, 
 * a technique that can be used to achieve greater performance,
 * when a dimension only has two or three possible values. 
 * 
 * @category General
 */
pvc.options.DimensionsReader.prototype.reader = function(){};
/**
 * The common options documentation class of all plots.
 * 
 * @class
 * @abstract
 */
pvc.options.plots.Plot = function(){};
        
        
        
        
/**
 * The index of the color axis to use for the plot.
 * <p>
 * The possible values are 
 * <tt>1</tt>, 
 * <tt>2</tt> and 
 * <tt>3</tt>.
 * <p>
 * The default value depends on the plot.
 * The main plot of a chart always uses the axis 
 * <tt>1</tt>.
 * The 
 * <tt>plot2</tt> plot uses the axis 
 * <tt>2</tt>, by default.
 * The 
 * <tt>trend</tt> plot uses the axis 
 * <tt>3</tt>, by default.
 * 
 * @type number
 * @category Axes
 */
pvc.options.plots.Plot.prototype.colorAxis = undefined;
/**
 * 
 * Indicates if value labels are shown next to the visual elements.
 * 
 * @deprecated Use {@link #valuesVisible} instead.
 * @type boolean
 * @default false
 * @category Style
 */
pvc.options.plots.Plot.prototype.showValues = undefined;
/**
 * The alignment of a value label 
 * relative to its corresponding visual element position.
 * <p>
 * The possible values and the default value actually depend on the chart type
 * so be sure to access this property's documentation through the 
 * concrete class' documentation.
 * 
 * @type function|pvc.options.varia.MarkAnchor|pvc.options.varia.WedgeAnchor
 * @category Style
 */
pvc.options.plots.Plot.prototype.valuesAnchor = undefined;
/**
 * The font of a value label.
 * <p>
 * This property can also be specified 
 * through the "label" extension point of a plot.
 * <p>
 * In some charts the value label font is 
 * taken into account for layout purposes.
 * 
 * @type string
 * @category Style
 */
pvc.options.plots.Plot.prototype.valuesFont = undefined;
/**
 * Indicates if value labels are shown next to the visual elements.
 * <p>
 * Most charts have some form of showing labels
 * with the 
 * <i>main</i> value next to the visual element.
 * <p>
 * The default value really varies with the chart type,
 * so be sure to confirm it in the most specific plot class.
 * 
 * @type boolean
 * @default false
 * @category Style
 */
pvc.options.plots.Plot.prototype.valuesVisible = undefined;
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
pvc.options.VisualRole = function(){};
        
        
        
        
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
pvc.options.VisualRole.prototype.dimensions = undefined;
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
 * the data that is shown in a discrete axis.
 * 
 * @type boolean
 * @default false
 */
pvc.options.VisualRole.prototype.isReversed = undefined;
/**
 * The options documentation class of the 
 * <b>Pie</b> chart.
 * 
 * @class
 * @extends pvc.options.charts.Chart
 */
pvc.options.charts.PieChart = function(){};
        
        
        
        
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
 * @type number|string|list(number|string)
 * @category Data Translation
 */
pvc.options.charts.PieChart.prototype.multiChartIndexes = undefined;
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
 * @category Multi-Chart > Layout
 */
pvc.options.charts.PieChart.prototype.multiChartColumnsMax = undefined;
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
 * @category Multi-Chart > Layout
 */
pvc.options.charts.PieChart.prototype.multiChartMax = undefined;
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
 * @category Multi-Chart > Layout
 */
pvc.options.charts.PieChart.prototype.multiChartSingleColFillsHeight = undefined;
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
 * @category Multi-Chart > Layout
 */
pvc.options.charts.PieChart.prototype.multiChartSingleRowFillsHeight = undefined;
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
 * @category Multi-Chart > Layout
 */
pvc.options.charts.PieChart.prototype.smallAspectRatio = undefined;
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
 * @category Multi-Chart > Layout
 */
pvc.options.charts.PieChart.prototype.smallContentMargins = undefined;
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
 * @category Multi-Chart > Layout
 */
pvc.options.charts.PieChart.prototype.smallContentPaddings = undefined;
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
 * @category Multi-Chart > Layout
 */
pvc.options.charts.PieChart.prototype.smallHeight = undefined;
/**
 * The margins of a 
 * <i>small</i> chart.
 * <p>
 * See {@link pvc.options.varia.Sides} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Sides
 * @default '2%'
 * @category Multi-Chart > Layout
 */
pvc.options.charts.PieChart.prototype.smallMargins = undefined;
/**
 * The paddings of a 
 * <i>small</i> chart.
 * <p>
 * See {@link pvc.options.varia.Sides} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Sides
 * @default 0
 * @category Multi-Chart > Layout
 */
pvc.options.charts.PieChart.prototype.smallPaddings = undefined;
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
 * When an infinite value is specified for 
 * {@link #multiChartColumnsMax}, 
 * the small charts are laid out in a single row, 
 * and so the width is calculated from the height {@link #smallHeight}, 
 * using the aspect ratio {@link #smallAspectRatio}.
 * The height is defaulted to the initially available content height.
 * The aspect ratio is defaulted to a value that depends on the chart type,
 * but is something around 
 * <tt>4/3</tt>.
 * The width is then calculated.
 * 
 * @type number|string
 * @category Multi-Chart > Layout
 */
pvc.options.charts.PieChart.prototype.smallWidth = undefined;
/**
 * The title panel of the 
 * <i>small</i> chart.
 * <p>
 * The text of the title of small charts is the 
 * compound label of the data bound to the 
 * <tt>multiChart</tt> visual role.
 * 
 * @type pvc.options.panels.ChartTitlePanel
 * @category Multi-Chart > Panels
 */
pvc.options.charts.PieChart.prototype.smallTitle = undefined;
/**
 * The 
 * <tt>multiChart</tt> visual role
 * allows turning a chart in a 
 * <i>small multiples</i> chart
 * {@link http://en.wikipedia.org/wiki/Small_multiple}.
 * <p>
 * Almost all main chart types support being shown
 * as a small multiples chart.
 * Currently, the exceptions are the charts: 
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
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.PieChart.prototype.multiChartRole = undefined;
/**
 * The first color axis options.
 * <p>
 * This axis can also be accessed by the property name 
 * <tt>color</tt>.
 * <p>
 * See {@link pvc.options.axes.ColorAxis}
 * for more information on the way that 
 * the color axes' properties may be accessed. 
 * 
 * @type pvc.options.axes.DiscreteColorAxis
 * @category Axes
 */
pvc.options.charts.PieChart.prototype.color = undefined;
/**
 * 
 * The percentage size of the plot area that is 
 * occupied by the pie.
 * <p>
 * An equivalent content paddings may be specified as: 
 * ((1 - innerGap) * 100 / 2 ) + "%";
 * 
 * @deprecated 
 * Use {@link pvc.options.charts.Chart#contentPaddings} instead.
 * 
 * @type number
 * @category Layout
 */
pvc.options.charts.PieChart.prototype.innerGap = undefined;
/**
 * The pie plot is the 
 * <b>main plot</b> of the pie chart,
 * which means that 
 * its properties may be used 
 * <i>without</i> the "pie" property suffix.
 * 
 * @type pvc.options.plots.PiePlot
 * @category Plots
 */
pvc.options.charts.PieChart.prototype.pie = undefined;
/**
 * The extension points object contains style definitions for 
 * the marks of the plot.
 * 
 * @type pvc.options.ext.PieChartExtensionPoints
 * @category Style
 */
pvc.options.charts.PieChart.prototype.extensionPoints = undefined;
/**
 * The 
 * <tt>category</tt> visual role represents a slice of the pie.
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
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.PieChart.prototype.categoryRole = undefined;
/**
 * The 
 * <tt>color</tt> visual role controls the color of pie slices.
 * <p>
 * The 
 * <tt>color</tt> visual role automatically binds to 
 * every dimension whose name has the 
 * <tt>color</tt> prefix
 * or, if none exists, 
 * the dimensions of the "category" role.
 * <p>
 * The 
 * <tt>color</tt> visual role is discrete.
 * <p>
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.PieChart.prototype.colorRole = undefined;
/**
 * The 
 * <tt>value</tt> visual role controls the 
 * relative angle span of each pie slice.
 * <p>
 * The 
 * <tt>value</tt> visual role automatically binds to 
 * a single dimension whose name has the 
 * <tt>value</tt> prefix.
 * <p>
 * The 
 * <tt>value</tt> visual role is required.
 * <p>
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.PieChart.prototype.valueRole = undefined;
/**
 * The extension points of the pie chart type.
 * <p>
 * To use an extension point you must find its full name, by joining:
 * 
 * <ol>
 * 
 * <li>extension property (ex: 
 * <tt>smallBase</tt>)</li>
 * 
 * <li>the "_" character</li>
 * 
 * <li>extension sub-property (ex: 
 * <tt>strokeStyle</tt>)</li>
 * </ol>
 * and obtaining, for the examples, the camel-cased name: 
 * <tt>smallBase_strokeStyle</tt>
 * (see {@link http://en.wikipedia.org/wiki/CamelCase}).
 * 
 * @class
 */
pvc.options.ext.PieChartExtensionPoints = function(){};
        
        
        
        
/**
 * The extension point of the base (root) panel of the 
 * <i>small</i> charts.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 * @category Multi-Chart
 */
pvc.options.ext.PieChartExtensionPoints.prototype.smallBase = undefined;
/**
 * The extension point of the content panel of the 
 * <i>small</i> charts.
 * <p>
 * The content panel is a child of the base panel.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 * @category Multi-Chart
 */
pvc.options.ext.PieChartExtensionPoints.prototype.smallContent = undefined;
/**
 * The options documentation class of the 
 * <b>Pie</b> plot.
 * 
 * @class
 * @extends pvc.options.plots.Plot
 */
pvc.options.plots.PiePlot = function(){};
        
        
        
        
/**
 * Increment radius of an 
 * <i>active</i> slice, 
 * in pixel units or as a percentage.
 * <p>
 * When the value is a string, 
 * and if it is suffixed with "%", 
 * it represents a percentage of the 
 * biggest radius that can fit in the client area of the plot.
 * <p>
 * This property is only relevant if 
 * {@link pvc.options.charts.Chart#hoverable} is 
 * <tt>true</tt>.
 * <p>
 * The 
 * <i>normal</i> radius is 
 * the biggest radius that can fit in the client area of the plot
 * minus the space occupied by linked labels,
 * minus the resolved active radius and 
 * minus the resolved exploded radius.
 * <p>
 * See {@link #explodedSliceRadius}.
 * 
 * @type number|string
 * @default '5%'
 * @category Layout
 */
pvc.options.plots.PiePlot.prototype.activeSliceRadius = undefined;
/**
 * The index of the exploded slice,
 * or 
 * <tt>null</tt>, 
 * for all slices to be exploded.
 * <p>
 * The exploded slice or slices 
 * are shown exploded 
 * only when {@link #explodedSliceRadius} 
 * is greater than 
 * <tt>0</tt>.
 * 
 * @type number
 * @default null
 * @category Layout
 */
pvc.options.plots.PiePlot.prototype.explodedSliceIndex = undefined;
/**
 * Increment radius of an 
 * <i>exploded</i> slice, 
 * in pixel units or as a percentage.
 * <p>
 * When the value is a string,
 * and if it is suffixed with "%",
 * it represents a percentage of the 
 * biggest radius that can fit in the client area of the plot.
 * <p>
 * The 
 * <i>normal</i> radius is 
 * the biggest radius that can fit in the client area of the plot
 * minus the space occupied by linked labels,
 * minus the resolved active radius and 
 * minus the resolved exploded radius.
 * <p>
 * See {@link #activeSliceRadius} and {@link #explodedSliceIndex}.
 * 
 * @type number|string
 * @default 0
 * @category Layout
 */
pvc.options.plots.PiePlot.prototype.explodedSliceRadius = undefined;
/**
 * The style used to place value labels.
 * 
 * @type pvc.options.varia.PieValuesLabelStyle
 * @default 'linked'
 * @category Layout
 */
pvc.options.plots.PiePlot.prototype.valuesLabelStyle = undefined;
/**
 * The values mask used to build the text of value labels.
 * <p>
 * The mask may contain scene variable names and/or scene atom names,
 * like in the examples:
 * 
 * <ul>
 * 
 * <li>scene variables: 
 * <tt>{category}: {value} EUR</tt>, could yield 
 * <tt>Drinks: 3.45 EUR</tt></li>
 * 
 * <li>atom variables:  
 * <tt>{#family} - {#product}</tt>, could yield 
 * <tt>Plains - Boeing 747</tt></li>
 * </ul> 
 * <p>
 * The default value depends on the label style:
 * 
 * <ul>
 * 
 * <li>
 * <tt>inside</tt> - 
 * <tt>{value}</tt></li>
 * 
 * <li>
 * <tt>linked</tt> - 
 * <tt>{value} ({value.percent})</tt></li>
 * </ul>
 * <p>
 * The 
 * <tt>percent</tt> variable is a 
 * sub-variable of the 
 * <tt>value</tt> scene variable.
 * 
 * @type string
 * @category Layout
 */
pvc.options.plots.PiePlot.prototype.valuesMask = undefined;
/**
 * The width of the link line handle width, in 
 * <i>em</i> units.
 * <p>
 * The 
 * <i>handle</i> is 
 * the last segment of the link line,
 * an horizontal line segment just before the label. 
 * 
 * @type number
 * @default 0.5
 * @category Layout > Linked Labels
 */
pvc.options.plots.PiePlot.prototype.linkHandleWidth = undefined;
/**
 * The length of the link line segment that is 
 * inset into a slice,
 * in pixel units, or as a percentage.
 * <p>
 * When the value is a string,
 * and if it is suffixed with "%",
 * it represents a percentage of the 
 * biggest radius that can fit in the client area of the plot.
 * 
 * @type number|string
 * @default '5%'
 * @category Layout > Linked Labels
 */
pvc.options.plots.PiePlot.prototype.linkInsetRadius = undefined;
/**
 * The width of the columns reserved, 
 * on each side of the pie,
 * for laying out the linked label marks.
 * <p>
 * When the value is a string,
 * and if it is suffixed with "%",
 * it represents a percentage of the 
 * 
 * <i>client width</i> of the plot.
 * 
 * @type number|string
 * @default '15%'
 * @category Layout > Linked Labels
 */
pvc.options.plots.PiePlot.prototype.linkLabelSize = undefined;
/**
 * The minimum vertical space between consecutive link labels, 
 * in 
 * <i>em</i> units.
 * 
 * @type number
 * @default 0.5
 * @category Layout > Linked Labels
 */
pvc.options.plots.PiePlot.prototype.linkLabelSpacingMin = undefined;
/**
 * The width of the space 
 * that separates the label from 
 * the end of the line segment that starts in the link elbow,
 * in pixel units, or as a percentage.
 * <p>
 * The value of this property includes 
 * the size of the link line handle.
 * <p>
 * When the value is a string,
 * and if it is suffixed with "%",
 * it represents a percentage of the 
 * 
 * <i>client width</i> of the plot.
 * 
 * @type number|string
 * @default '2.5%'
 * @category Layout > Linked Labels
 */
pvc.options.plots.PiePlot.prototype.linkMargin = undefined;
/**
 * The length of the link line segment that 
 * extends outwards from the slice, 
 * until it reaches the link line "elbow",
 * in pixel units, or as a percentage.
 * <p>
 * When the value is a string,
 * and if it is suffixed with "%",
 * it represents a percentage of the 
 * biggest radius that can fit in the client area of the plot.
 * 
 * @type number|string
 * @default '2.5%'
 * @category Layout > Linked Labels
 */
pvc.options.plots.PiePlot.prototype.linkOutsetRadius = undefined;
/**
 * The extension points object 
 * contains style definitions for 
 * various visual elements of the chart.
 * 
 * @type pvc.options.ext.PiePlotExtensionPoints
 * @category Style
 */
pvc.options.plots.PiePlot.prototype.extensionPoints = undefined;
/**
 * The alignment of a non-linked value label
 * relative to its corresponding visual element position.
 * 
 * @type function|pvc.options.varia.WedgeAnchor
 * @default 'outer'
 * @category Style
 */
pvc.options.plots.PiePlot.prototype.valuesAnchor = undefined;
/**
 * Indicates if value labels are shown per visual element.
 * 
 * @type boolean
 * @default true
 * @category Style
 */
pvc.options.plots.PiePlot.prototype.valuesVisible = undefined;
/**
 * The extension points of the pie plot type.
 * <p>
 * To use an extension point you must find its full name, by joining:
 * 
 * <ol>
 * 
 * <li>plot property name (ex: 
 * <tt>pie</tt>)</li>
 * 
 * <li>extension property (ex: 
 * <tt>slice</tt>)</li>
 * 
 * <li>the "_" character</li>
 * 
 * <li>extension sub-property (ex: 
 * <tt>strokeStyle</tt>)</li>
 * </ol>
 * and obtaining, for the examples, the camel-cased name: 
 * <tt>pieSlice_strokeStyle</tt>
 * (see {@link http://en.wikipedia.org/wiki/CamelCase}).
 * <p>
 * The extension points of the 
 * <i>main plot</i> of a chart
 * may be used without the plot property name prefix.
 * In the example, when the 
 * <tt>pie</tt> plot is the main plot, 
 * the extension point can be written as 
 * <tt>slice_strokeStyle</tt>.
 * 
 * @class
 */
pvc.options.ext.PiePlotExtensionPoints = function(){};
        
        
        
        
/**
 * The extension point of the value label mark.
 * 
 * @type pvc.options.marks.LabelExtensionPoint
 */
pvc.options.ext.PiePlotExtensionPoints.prototype.label = undefined;
/**
 * The extension point of the line mark that links the 
 * pie slices and the linked labels.
 * 
 * @type pvc.options.marks.LineExtensionPoint
 */
pvc.options.ext.PiePlotExtensionPoints.prototype.linkLine = undefined;
/**
 * The extension point of the pie slice - the wedge mark.
 * 
 * @type pvc.options.marks.PieChartWedgeExtensionPoint
 */
pvc.options.ext.PiePlotExtensionPoints.prototype.slice = undefined;
/**
 * The class of the Pie chart's protovis Wedge extension points.
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Wedge.html}.
 * 
 * @class
 * @extends pvc.options.marks.WedgeExtensionPoint
 */
pvc.options.marks.PieChartWedgeExtensionPoint = function(){};
        
        
        
        
/**
 * The inner radius of each slice, in 
 * <i>pixel</i> units or as 
 * a percentage of the outer radius.
 * <p>
 * This extension point is only defined in 
 * the 
 * <i>pie</i> chart's wedge mark.
 * 
 * @type number|string
 */
pvc.options.marks.PieChartWedgeExtensionPoint.prototype.innerRadiusEx = undefined;
/**
 * The options documentation class of the 
 * <b>Bullet</b> chart.
 * <p>
 * This chart type was only partially updated, 
 * to support some of the new CCC v.2 features.
 * <p>
 * The bullet chart's data translator 
 * accepts data of the following form 
 * without requiring any further configuration:
 * 
 * <table>
 * 
 * <thead>
 * 
 * <tr>
 * 
 * <th>
 * Number of columns
 * </th>
 * 
 * <th>
 * Structure
 * </th>
 * </tr>
 * </thead>
 * 
 * <tbody>
 * 
 * <tr>
 * 
 * <td>1</td>
 * <td>Value</td>
 * </tr>
 * 
 * <tr>
 * 
 * <td>2</td>
 * <td>Title | Value</td>
 * </tr>
 * 
 * <tr>
 * 
 * <td>3</td>
 * <td>Title | Value | Marker</td>
 * </tr>
 * 
 * <tr>
 * 
 * <td> >= 4 </td>
 * <td>Title | Subtitle | Value | Marker | Ranges</td>
 * </tr>
 * </tbody>
 * </table>
 * <p>
 * To use the bullet chart's visual roles in its most general form,
 * it is required to manually configure the data translator,
 * by using {@link #readers}. 
 * 
 * @class
 */
pvc.options.charts.BulletChart = function(){};
        
        
        
        
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
pvc.options.charts.BulletChart.prototype.renderCallback = function(){};
/**
 * An array of dimensions calculations.
 * <p>
 * Can be specified to calculate the values of certain dimensions.
 * 
 * @type list(pvc.options.DimensionsCalculation)
 * @category Data
 */
pvc.options.charts.BulletChart.prototype.calculations = undefined;
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
 * @type map(string : pvc.options.DimensionType)
 * @category Data
 */
pvc.options.charts.BulletChart.prototype.dimensionGroups = undefined;
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
 * @type map(string : pvc.options.DimensionType)
 * @category Data
 */
pvc.options.charts.BulletChart.prototype.dimensions = undefined;
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
pvc.options.charts.BulletChart.prototype.groupedLabelSep = undefined;
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
pvc.options.charts.BulletChart.prototype.ignoreNulls = undefined;
/**
 * A function that formats the
 * non-null 
 * <i>numeric</i> values
 * of the dimensions named 
 * <tt>value</tt>, 
 * <tt>value2</tt>, etc.
 * <p>
 * This property is used to default the property 
 * {@link pvc.options.DimensionType#formatter}
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
pvc.options.charts.BulletChart.prototype.valueFormat = function(){};
/**
 * Indicates if the data source is in 
 * <i>crosstab</i> format.
 * 
 * @type boolean
 * @default true
 * @category Data Translation
 */
pvc.options.charts.BulletChart.prototype.crosstabMode = undefined;
/**
 * Indicates if the data source has 
 * multiple value dimensions.
 * 
 * @type boolean
 * @default false
 * @category Data Translation
 */
pvc.options.charts.BulletChart.prototype.isMultiValued = undefined;
/**
 * The indexes of the data source's 
 * <i>virtual item</i> columns
 * that are to feed the 
 * default dimensions 
 * 
 * <tt>value</tt>, 
 * 
 * <tt>value2</tt>, etc.
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
pvc.options.charts.BulletChart.prototype.measuresIndexes = undefined;
/**
 * An array of dimensions readers.
 * <p>
 * Can be specified to customize the 
 * translation process of the data source. 
 * 
 * @type list(pvc.options.DimensionsReader)
 * @category Data Translation
 */
pvc.options.charts.BulletChart.prototype.readers = undefined;
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
pvc.options.charts.BulletChart.prototype.seriesInRows = undefined;
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
pvc.options.charts.BulletChart.prototype.canvas = undefined;
/**
 * The CCC version that the chart should run in.
 * <p>
 * The value 
 * <tt>1</tt> emulates version 1 of CCC.
 * 
 * @type number
 * @default Infinity
 * @category General
 */
pvc.options.charts.BulletChart.prototype.compatVersion = undefined;
/**
 * Indicates if the chart is clickable by the user.
 * <p>
 * If this option is 
 * <tt>false</tt>, 
 * any click-related actions will not be executed 
 * (ex: 
 * {@link #clickAction},
 * {@link #doubleClickAction}, or
 * {@link pvc.options.axes.DiscreteCartesianAxis#clickAction}).
 * 
 * @type boolean
 * @default false
 * @category Interaction
 */
pvc.options.charts.BulletChart.prototype.clickable = undefined;
/**
 * 
 * Indicates if tooltips are enabled 
 * and contains additional tooltip presentation options.
 * 
 * @deprecated Use {@link #tooltip} instead.
 * @type boolean
 * @category Interaction
 */
pvc.options.charts.BulletChart.prototype.showTooltips = undefined;
/**
 * 
 * Contains additional tooltip presentation options.
 * 
 * @deprecated Use {@link #tooltip} instead.
 * @type pvc.options.Tooltip
 * @category Interaction
 */
pvc.options.charts.BulletChart.prototype.tipsySettings = undefined;
/**
 * Indicates if tooltips are enabled 
 * and contains additional tooltip presentation options.
 * 
 * @type pvc.options.Tooltip
 * @category Interaction
 */
pvc.options.charts.BulletChart.prototype.tooltip = undefined;
/**
 * The margins of the 
 * <i>root</i> content panel.
 * <p>
 * In a 
 * <i>small multiples</i> chart, 
 * the margins of the 
 * <i>content panel</i> of a 
 * <i>small</i> chart 
 * can be set with the property 
 * <tt>smallContentMargins</tt>.
 * <p>
 * See {@link pvc.options.varia.Sides} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Sides
 * @default 0
 * @category Layout
 */
pvc.options.charts.BulletChart.prototype.contentMargins = undefined;
/**
 * The paddings of the 
 * <i>root</i> content panel.
 * <p>
 * In a 
 * <i>small multiples</i> chart, 
 * the paddings of the 
 * <i>content panel</i> of a 
 * <i>small</i> chart 
 * can be set with the property 
 * <tt>smallContentPaddings</tt>.
 * <p>
 * See {@link pvc.options.varia.Sides} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Sides
 * @default 0
 * @category Layout
 */
pvc.options.charts.BulletChart.prototype.contentPaddings = undefined;
/**
 * The height of the 
 * <i>root</i> chart, in pixels.
 * 
 * @type number
 * @default 300
 * @category Layout
 */
pvc.options.charts.BulletChart.prototype.height = undefined;
/**
 * The margins of the 
 * <i>root</i> chart.
 * <p>
 * In a 
 * <i>small multiples</i> chart, 
 * the margins of the 
 * <i>small</i> charts can be set
 * with the property 
 * <tt>smallMargins</tt>.
 * <p>
 * See {@link pvc.options.varia.Sides} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Sides
 * @default 3
 * @category Layout
 */
pvc.options.charts.BulletChart.prototype.margins = undefined;
/**
 * The chart orientation indicates if 
 * its main direction is vertical or horizontal.
 * <p>
 * This property is supported by most chart types. 
 * 
 * @type pvc.options.varia.ChartOrientation
 * @default 'vertical'
 * @category Layout
 */
pvc.options.charts.BulletChart.prototype.orientation = undefined;
/**
 * The paddings of the 
 * <i>root</i> chart.
 * <p>
 * In a 
 * <i>small multiples</i> chart, 
 * the paddings of a 
 * <i>small</i> chart can be set
 * with the property 
 * <tt>smallPaddings</tt>.
 * <p>
 * See {@link pvc.options.varia.Sides} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Sides
 * @default 0
 * @category Layout
 */
pvc.options.charts.BulletChart.prototype.paddings = undefined;
/**
 * The width of the 
 * <i>root</i> chart, in pixels.
 * 
 * @type number
 * @default 400
 * @category Layout
 */
pvc.options.charts.BulletChart.prototype.width = undefined;
/**
 * The title panel of the root chart.
 * <p>
 * When a value of type 
 * <tt>string</tt> is specified, 
 * it is the title text.
 * 
 * @type string|pvc.options.panels.ChartTitlePanel
 * @category Panels
 */
pvc.options.charts.BulletChart.prototype.title = undefined;
/**
 * The chart's visual roles.
 * <p>
 * Besides the existing visual role properties
 * - named after the visual role's name followed by the word 
 * <tt>Role</tt> -
 * the visual roles map can be used, in code,
 * as an alternative to specify the visual role's information.
 * The visual role name is the map's key, 
 * and the value, its options. 
 * 
 * @type map(string : pvc.options.VisualRole)
 * @category Visual roles
 */
pvc.options.charts.BulletChart.prototype.visualRoles = undefined;
/**
 * A callback function that is called
 * when the user double-clicks on a bullet's title or sub-title.
 * 
 * @returns {undefined}
 * @method
 * @param {object} datum
 * An object describing the data of the double-clicked bullet.
 * The object has the following properties:
 * 
 * <ul>
 * 
 * <li>title</li>
 * 
 * <li>formattedTitle</li>
 * 
 * <li>subtitle</li>
 * 
 * <li>formattedSubtitle</li>
 * 
 * <li>ranges</li>
 * 
 * <li>formattedRanges</li>
 * 
 * <li>measures</li>
 * 
 * <li>formattedMeasures</li>
 * 
 * <li>markers</li>
 * 
 * <li>formattedMarkers</li>
 * </ul>
 * 
 * @param {HTMLDOMEvent} ev
 * The HTML DOM event object
 * 
 * @category Actions
 */
pvc.options.charts.BulletChart.prototype.axisDoubleClickAction = function(){};
/**
 * A callback function that is called
 * when the user clicks on a bullet.
 * 
 * @returns {undefined}
 * @method
 * @param {string} title
 * The title.
 * 
 * @param {string} subtitle
 * The sub-title.
 * 
 * @param {list(string)} measures
 * The array of measures.
 * 
 * @param {HTMLDOMEvent} ev
 * The HTML DOM event object
 * 
 * @category Actions
 */
pvc.options.charts.BulletChart.prototype.clickAction = function(){};
/**
 * The bullet plot.
 * 
 * @type pvc.options.plots.BulletPlot
 * @category Plots
 */
pvc.options.charts.BulletChart.prototype.bullet = undefined;
/**
 * The extension points object contains style definitions for 
 * the marks of the chart.
 * 
 * @type pvc.options.ext.BulletChartExtensionPoints
 * @category Style
 */
pvc.options.charts.BulletChart.prototype.extensionPoints = undefined;
/**
 * The 
 * <tt>marker</tt> visual role 
 * represents a set of reference or target values for a given
 * title and sub-title categories.
 * <p>
 * The 
 * <tt>marker</tt> is represented by markers/dots
 * placed at the positions corresponding to the marker values.
 * Negative values are considered 
 * <tt>0</tt>.
 * <p>
 * Each dimension that is bound to the 
 * <tt>marker</tt> role
 * is represented by a different marker.
 * <p>
 * The 
 * <tt>marker</tt> visual role automatically binds to 
 * all numeric dimensions whose name has the 
 * <tt>marker</tt> prefix.
 * <p>
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.BulletChart.prototype.markerRole = undefined;
/**
 * The 
 * <tt>range</tt> visual role 
 * represents a classification of the values of the
 * 
 * <tt>value</tt> visual role.
 * <p>
 * The 
 * <tt>value</tt> domain
 * is split into several parts (or classes) at
 * the given points.
 * <p>
 * Each dimension that is bound to the 
 * <tt>range</tt> role
 * splits the 
 * <tt>value</tt> domain at a certain point.
 * <p>
 * By default, each part is painted with a successively brighter gray color.
 * <p>
 * The 
 * <tt>range</tt> visual role automatically binds to 
 * all numeric dimensions whose name has the 
 * <tt>range</tt> prefix.
 * <p>
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.BulletChart.prototype.rangeRole = undefined;
/**
 * The 
 * <tt>subTitle</tt> visual role represents a 
 * the sub-title of each bullet.
 * <p>
 * The 
 * <tt>subTitle</tt> visual role automatically binds to 
 * all dimensions whose name has the 
 * <tt>subTitle</tt> prefix.
 * <p>
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.BulletChart.prototype.subTitleRole = undefined;
/**
 * The 
 * <tt>title</tt> visual role represents a 
 * the title of each bullet.
 * <p>
 * The 
 * <tt>title</tt> visual role automatically binds to 
 * all dimensions whose name has the 
 * <tt>title</tt> prefix.
 * <p>
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.BulletChart.prototype.titleRole = undefined;
/**
 * The 
 * <tt>value</tt> visual role 
 * represents current values for a given
 * title and sub-title categories.
 * <p>
 * The values, one for each dimension bound to the 
 * <tt>value</tt> role,
 * are represented by overlapping bars, 
 * each painted with a successively brighter blue color.
 * The length of each bar is proportional to the corresponding value.
 * Negative values are considered 
 * <tt>0</tt>.
 * <p>
 * The 
 * <tt>value</tt> visual role automatically binds to 
 * all numeric dimensions whose name has the 
 * <tt>value</tt> prefix.
 * <p>
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.BulletChart.prototype.valueRole = undefined;
/**
 * The extension points of the 
 * <b>bullet</b> chart types.
 * <p>
 * This 
 * <b>bullet</b> chart type was only partially updated, 
 * to support some of the new CCC v.2 features.
 * <p>
 * To use an extension point you must find its full name, by joining:
 * 
 * <ol>
 * 
 * <li>extension property (ex: 
 * <tt>base</tt>)</li>
 * 
 * <li>the "_" character</li>
 * 
 * <li>extension sub-property (ex: 
 * <tt>strokeStyle</tt>)</li>
 * </ol>
 * and obtaining, for the examples, the camel-cased name: 
 * <tt>base_strokeStyle</tt>
 * (see {@link http://en.wikipedia.org/wiki/CamelCase}).
 * 
 * @class
 */
pvc.options.ext.BulletChartExtensionPoints = function(){};
        
        
        
        
/**
 * The extension point of the base (root) panel of the 
 * <i>root</i> chart.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.BulletChartExtensionPoints.prototype.base = undefined;
/**
 * 
 * The extension point of the plot panel of the charts.
 * <p>
 * The plot panel is a child of the content panel.
 * 
 * @deprecated Use the extension point {@link #plot} instead.
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.BulletChartExtensionPoints.prototype.chart = undefined;
/**
 * The extension point of the content panel of the 
 * <i>root</i> chart.
 * <p>
 * The content panel is a child of the base panel.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.BulletChartExtensionPoints.prototype.content = undefined;
/**
 * The extension point of the plot panel of the charts.
 * <p>
 * The plot panel is a child of the content panel.
 * <p>
 * The root of a small multiples chart does not have a plot panel.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.BulletChartExtensionPoints.prototype.plot = undefined;
/**
 * The options documentation class of the 
 * <b>Bullet</b> plot.
 * <p>
 * This 
 * <b>bullet</b> chart type was only partially updated, 
 * to support some of the new CCC v.2 features.
 * 
 * @class
 */
pvc.options.plots.BulletPlot = function(){};
        
        
        
        
/**
 * The default bullet markers.
 * <p>
 * Used when no data is supplied or 
 * when the 
 * <tt>marker</tt> role is unbound.
 * 
 * @type string|list(string)
 * @category Data
 */
pvc.options.plots.BulletPlot.prototype.markers = undefined;
/**
 * The default bullet measures.
 * <p>
 * Used when no data is supplied or 
 * when the 
 * <tt>value</tt> role is unbound.
 * 
 * @type string|list(string)
 * @category Data
 */
pvc.options.plots.BulletPlot.prototype.measures = undefined;
/**
 * The default bullet ranges.
 * <p>
 * Used when no data is supplied or 
 * when the 
 * <tt>range</tt> role is unbound.
 * 
 * @type string|list(string)
 * @category Data
 */
pvc.options.plots.BulletPlot.prototype.ranges = undefined;
/**
 * The default bullet sub-title.
 * <p>
 * Used when no data is supplied or 
 * when the 
 * <tt>subTitle</tt> role is unbound.
 * 
 * @type string
 * @category Data
 */
pvc.options.plots.BulletPlot.prototype.subtitle = undefined;
/**
 * The default bullet title.
 * <p>
 * Used when no data is supplied or 
 * when the 
 * <tt>title</tt> role is unbound.
 * 
 * @type string
 * @default 'Bullet'
 * @category Data
 */
pvc.options.plots.BulletPlot.prototype.title = undefined;
/**
 * The side of the bullet 
 * where the title and sub-title are placed.
 * 
 * @type pvc.options.varia.RectangleSide
 * @default 'left'
 * @category Layout
 */
pvc.options.plots.BulletPlot.prototype.titlePosition = undefined;
/**
 * The extension points object contains style definitions for 
 * the marks of the plot.
 * 
 * @type pvc.options.ext.BulletPlotExtensionPoints
 * @category Style
 */
pvc.options.plots.BulletPlot.prototype.extensionPoints = undefined;
/**
 * The top margin, for vertical orientation, 
 * or left margin, for horizontal orientation,
 * in 
 * <i>pixel</i> units. 
 * 
 * @type number
 * @default 100
 * @category Style
 */
pvc.options.plots.BulletPlot.prototype.margin = undefined;
/**
 * The orthogonal size of each bullet, in 
 * <i>pixel</i> units.
 * 
 * @type number
 * @default 30
 * @category Style
 */
pvc.options.plots.BulletPlot.prototype.size = undefined;
/**
 * The space between bullets, in 
 * <i>pixel</i> units.
 * 
 * @type number
 * @default 50
 * @category Style
 */
pvc.options.plots.BulletPlot.prototype.spacing = undefined;
/**
 * The extension points of the bullet plot type.
 * <p>
 * This 
 * <b>bullet</b> chart type was only partially updated, 
 * to support some of the new CCC v.2 features.
 * <p>
 * To use an extension point you must find its full name, by joining:
 * 
 * <ol>
 * 
 * <li>plot property name (ex: 
 * <tt>bullet</tt>)</li>
 * 
 * <li>extension property (ex: 
 * <tt>panel</tt>)</li>
 * 
 * <li>the "_" character</li>
 * 
 * <li>extension sub-property (ex: 
 * <tt>strokeStyle</tt>)</li>
 * </ol>
 * and obtaining, for the examples, the camel-cased name: 
 * <tt>bulletPanel_strokeStyle</tt>
 * (see {@link http://en.wikipedia.org/wiki/CamelCase}).
 * 
 * @class
 */
pvc.options.ext.BulletPlotExtensionPoints = function(){};
        
        
        
        
/**
 * The extension point of the bullets panel mark, 
 * must be used 
 * <b>without</b> the 
 * <tt>bullet</tt> prefix.
 * <p>
 * One instance of this panel is generated per datum.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.BulletPlotExtensionPoints.prototype.bulletsPanel = undefined;
/**
 * The extension point of the bullet markers dot mark.
 * 
 * @type pvc.options.marks.DotExtensionPoint
 */
pvc.options.ext.BulletPlotExtensionPoints.prototype.marker = undefined;
/**
 * The extension point of the bullet measures bar mark.
 * 
 * @type pvc.options.marks.BarExtensionPoint
 */
pvc.options.ext.BulletPlotExtensionPoints.prototype.measure = undefined;
/**
 * The extension point of the bullet panel mark.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.BulletPlotExtensionPoints.prototype.panel = undefined;
/**
 * The extension point of the bullet ranges bar mark.
 * 
 * @type pvc.options.marks.BarExtensionPoint
 */
pvc.options.ext.BulletPlotExtensionPoints.prototype.range = undefined;
/**
 * The extension point of the bullet axis ticks rule mark.
 * 
 * @type pvc.options.marks.RuleExtensionPoint
 */
pvc.options.ext.BulletPlotExtensionPoints.prototype.rule = undefined;
/**
 * The extension point of the bullet axis ticks label mark.
 * 
 * @type pvc.options.marks.LabelExtensionPoint
 */
pvc.options.ext.BulletPlotExtensionPoints.prototype.ruleLabel = undefined;
/**
 * The extension point of the bullet sub-title label mark.
 * 
 * @type pvc.options.marks.LabelExtensionPoint
 */
pvc.options.ext.BulletPlotExtensionPoints.prototype.subtitle = undefined;
/**
 * The extension point of the bullet title label mark.
 * 
 * @type pvc.options.marks.LabelExtensionPoint
 */
pvc.options.ext.BulletPlotExtensionPoints.prototype.title = undefined;
/**
 * The common options documentation class for the 
 * <b>Cartesian</b> charts.
 * 
 * @class
 * @extends pvc.options.charts.Chart
 * @abstract
 */
pvc.options.charts.CartesianChart = function(){};
        
        
        
        
/**
 * The base cartesian axis panel options.
 * <p>
 * When the chart {@link pvc.options.charts.Chart#orientation}
 * is 
 * <tt>vertical</tt> the base axis is laid out horizontally.
 * <p>
 * See {@link pvc.options.axes.CartesianAxis}
 * to know the additional names by which a cartesian axis can be referred to.
 * 
 * @type pvc.options.axes.CartesianAxis
 * @category Axes
 */
pvc.options.charts.CartesianChart.prototype.baseAxis = undefined;
/**
 * The orthogonal cartesian axis panel options.
 * <p>
 * When the chart {@link pvc.options.charts.Chart#orientation}
 * is 
 * <tt>vertical</tt> the orthogonal axis is laid out vertically.
 * <p>
 * See {@link pvc.options.axes.CartesianAxis}
 * to know the additional names by which a cartesian axis can be referred to.
 * 
 * @type pvc.options.axes.CartesianAxis
 * @category Axes
 */
pvc.options.charts.CartesianChart.prototype.orthoAxis = undefined;
/**
 * 
 * Indicates whether the 
 * <tt>x</tt> axis panel is shown.
 * 
 * @deprecated 
 * Use {@link pvc.options.axes.CartesianAxis#visible}, 
 * of the 
 * <tt>x</tt> axis, instead.
 * 
 * @type boolean
 * @default true
 * @category Axes
 */
pvc.options.charts.CartesianChart.prototype.showXScale = undefined;
/**
 * 
 * Indicates whether the 
 * <tt>y</tt> axis panel is shown.
 * 
 * @deprecated 
 * Use {@link pvc.options.axes.CartesianAxis#visible}, 
 * of the 
 * <tt>y</tt> axis, instead.
 * 
 * @type boolean
 * @default true
 * @category Axes
 */
pvc.options.charts.CartesianChart.prototype.showYScale = undefined;
/**
 * The extension points object contains style definitions for 
 * the marks of the chart.
 * 
 * @type pvc.options.ext.CartesianChartExtensionPoints
 * @category Style
 */
pvc.options.charts.CartesianChart.prototype.extensionPoints = undefined;
/**
 * Indicates whether the plot frame is drawn
 * in leaf charts.
 * <p>
 * The plot frame covers the plot panel but stays
 * aligned with and below the axes' rules.
 * <p>
 * The root of a small multiples chart does not have a plot frame.
 * 
 * @type boolean
 * @default true
 * @category Style
 */
pvc.options.charts.CartesianChart.prototype.plotFrameVisible = undefined;
/**
 * The 
 * <tt>color</tt> visual role controls the color of visual elements.
 * <p>
 * The 
 * <tt>color</tt> visual role automatically binds to 
 * every dimension whose name has the 
 * <tt>color</tt> prefix
 * or, if none exists, 
 * the dimensions of the "series" role.
 * <p>
 * The 
 * <tt>color</tt> visual role is discrete.
 * <p>
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.CartesianChart.prototype.colorRole = undefined;
/**
 * The 
 * <tt>series</tt> visual role represents a 
 * 
 * <i>series</i> of connected data points.
 * <p>
 * Most cartesian charts represent graphically 
 * the connectedness of data points of a given series in some way, 
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
 * 
 * <i>ignores</i> the 
 * <tt>series</tt> visual role is the 
 * <i>Box plot</i>.
 * <p>
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.CartesianChart.prototype.seriesRole = undefined;
/**
 * The extension points common to all cartesian chart types.
 * 
 * @class
 * @extends pvc.options.ext.ChartExtensionPoints
 */
pvc.options.ext.CartesianChartExtensionPoints = function(){};
        
        
        
        
/**
 * The extension point of the plot frame of the charts.
 * <p>
 * The plot frame covers the plot panel but stays
 * aligned with and below the axes' rules.
 * <p>
 * The root of a small multiples chart does not have a plot frame.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.CartesianChartExtensionPoints.prototype.plotFrame = undefined;
/**
 * The common options documentation class of 
 * <b>Categorical</b> charts. 
 * 
 * @class
 * @extends pvc.options.charts.CartesianChart
 * @abstract
 */
pvc.options.charts.CategoricalChart = function(){};
        
        
        
        
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
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.CategoricalChart.prototype.categoryRole = undefined;
/**
 * The common options documentation class of 
 * <b>Categorical</b> charts with a 
 * <i>continuous-numeric orthogonal axis</i>. 
 * 
 * @class
 * @extends pvc.options.charts.CategoricalChart
 * @abstract
 */
pvc.options.charts.CategoricalNumericChart = function(){};
        
        
        
        
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
 * @type number|string|list(number|string)
 * @category Data Translation
 */
pvc.options.charts.CategoricalNumericChart.prototype.multiChartIndexes = undefined;
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
 * @category Multi-Chart > Layout
 */
pvc.options.charts.CategoricalNumericChart.prototype.multiChartColumnsMax = undefined;
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
 * @category Multi-Chart > Layout
 */
pvc.options.charts.CategoricalNumericChart.prototype.multiChartMax = undefined;
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
 * @category Multi-Chart > Layout
 */
pvc.options.charts.CategoricalNumericChart.prototype.multiChartSingleColFillsHeight = undefined;
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
 * @category Multi-Chart > Layout
 */
pvc.options.charts.CategoricalNumericChart.prototype.multiChartSingleRowFillsHeight = undefined;
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
 * @category Multi-Chart > Layout
 */
pvc.options.charts.CategoricalNumericChart.prototype.smallAspectRatio = undefined;
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
 * @category Multi-Chart > Layout
 */
pvc.options.charts.CategoricalNumericChart.prototype.smallContentMargins = undefined;
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
 * @category Multi-Chart > Layout
 */
pvc.options.charts.CategoricalNumericChart.prototype.smallContentPaddings = undefined;
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
 * @category Multi-Chart > Layout
 */
pvc.options.charts.CategoricalNumericChart.prototype.smallHeight = undefined;
/**
 * The margins of a 
 * <i>small</i> chart.
 * <p>
 * See {@link pvc.options.varia.Sides} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Sides
 * @default '2%'
 * @category Multi-Chart > Layout
 */
pvc.options.charts.CategoricalNumericChart.prototype.smallMargins = undefined;
/**
 * The paddings of a 
 * <i>small</i> chart.
 * <p>
 * See {@link pvc.options.varia.Sides} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Sides
 * @default 0
 * @category Multi-Chart > Layout
 */
pvc.options.charts.CategoricalNumericChart.prototype.smallPaddings = undefined;
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
 * When an infinite value is specified for 
 * {@link #multiChartColumnsMax}, 
 * the small charts are laid out in a single row, 
 * and so the width is calculated from the height {@link #smallHeight}, 
 * using the aspect ratio {@link #smallAspectRatio}.
 * The height is defaulted to the initially available content height.
 * The aspect ratio is defaulted to a value that depends on the chart type,
 * but is something around 
 * <tt>4/3</tt>.
 * The width is then calculated.
 * 
 * @type number|string
 * @category Multi-Chart > Layout
 */
pvc.options.charts.CategoricalNumericChart.prototype.smallWidth = undefined;
/**
 * The title panel of the 
 * <i>small</i> chart.
 * <p>
 * The text of the title of small charts is the 
 * compound label of the data bound to the 
 * <tt>multiChart</tt> visual role.
 * 
 * @type pvc.options.panels.ChartTitlePanel
 * @category Multi-Chart > Panels
 */
pvc.options.charts.CategoricalNumericChart.prototype.smallTitle = undefined;
/**
 * The 
 * <tt>multiChart</tt> visual role
 * allows turning a chart in a 
 * <i>small multiples</i> chart
 * {@link http://en.wikipedia.org/wiki/Small_multiple}.
 * <p>
 * Almost all main chart types support being shown
 * as a small multiples chart.
 * Currently, the exceptions are the charts: 
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
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.CategoricalNumericChart.prototype.multiChartRole = undefined;
/**
 * The first color axis options.
 * <p>
 * This axis can also be accessed by the property name 
 * <tt>color</tt>.
 * <p>
 * See {@link pvc.options.axes.ColorAxis}
 * for more information on the way that 
 * the color axes' properties may be accessed. 
 * 
 * @type pvc.options.axes.DiscreteColorAxis
 * @category Axes
 */
pvc.options.charts.CategoricalNumericChart.prototype.color = undefined;
/**
 * The orthogonal cartesian axis panel options.
 * <p>
 * When the chart {@link pvc.options.charts.Chart#orientation}
 * is 
 * <tt>vertical</tt> the orthogonal axis is laid out vertically.
 * <p>
 * See {@link pvc.options.axes.CartesianAxis}
 * to know the additional names by which a cartesian axis can be referred to.
 * 
 * @type pvc.options.axes.NumericCartesianAxis
 * @category Axes
 */
pvc.options.charts.CategoricalNumericChart.prototype.orthoAxis = undefined;
/**
 * The extension points object contains style definitions for 
 * the marks of the chart.
 * 
 * @type pvc.options.ext.CategoricalNumericChartExtensionPoints
 * @category Style
 */
pvc.options.charts.CategoricalNumericChart.prototype.extensionPoints = undefined;
/**
 * The extension points of the 
 * <b>categorical</b> chart types with a 
 * <i>continuous-numeric orthogonal axis</i>.
 * <p>
 * To use an extension point you must find its full name, by joining:
 * 
 * <ol>
 * 
 * <li>extension property (ex: 
 * <tt>smallBase</tt>)</li>
 * 
 * <li>the "_" character</li>
 * 
 * <li>extension sub-property (ex: 
 * <tt>strokeStyle</tt>)</li>
 * </ol>
 * and obtaining, for the examples, the camel-cased name: 
 * <tt>smallBase_strokeStyle</tt>
 * (see {@link http://en.wikipedia.org/wiki/CamelCase}).
 * 
 * @class
 */
pvc.options.ext.CategoricalNumericChartExtensionPoints = function(){};
        
        
        
        
/**
 * The extension point of the base (root) panel of the 
 * <i>small</i> charts.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 * @category Multi-Chart
 */
pvc.options.ext.CategoricalNumericChartExtensionPoints.prototype.smallBase = undefined;
/**
 * The extension point of the content panel of the 
 * <i>small</i> charts.
 * <p>
 * The content panel is a child of the base panel.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 * @category Multi-Chart
 */
pvc.options.ext.CategoricalNumericChartExtensionPoints.prototype.smallContent = undefined;
/**
 * The common options documentation class of 
 * <b>categorical</b> plot types with a 
 * <i>continuous-numeric orthogonal axis</i>.
 * 
 * @class
 * @extends pvc.options.plots.Plot
 * @abstract
 */
pvc.options.plots.CategoricalNumericPlot = function(){};
        
        
        
        
/**
 * The index of the orthogonal cartesian axis to use for the plot.
 * <p>
 * The possible values are 
 * <tt>1</tt>, 
 * <tt>2</tt> and 
 * <tt>3</tt>.
 * <p>
 * The main plot of a chart always uses the axis 
 * <tt>1</tt>.
 * 
 * @type number
 * @default 1
 * @category Axes
 */
pvc.options.plots.CategoricalNumericPlot.prototype.orthoAxis = undefined;
/**
 * The interpolation mode used to 
 * fill-in null or missing values.
 * <p>
 * The interpolation is applied to
 * the measure roles of the plot that 
 * are represented in the orthogonal cartesian axis.
 * <p>
 * With the exception of the box plot, 
 * this role is the 
 * <tt>value</tt> role.
 * All of the box plot measure roles:
 * 
 * <tt>median</tt>, 
 * <tt>lowerQuartil</tt>, 
 * <tt>upperQuartil</tt>, 
 * <tt>minimum</tt>, and 
 * <tt>maximum</tt>,
 * are interpolated using the specified mode.
 * 
 * @type pvc.options.varia.NullInterpolationMode
 * @default 'none'
 * @category Data
 */
pvc.options.plots.CategoricalNumericPlot.prototype.nullInterpolationMode = undefined;
/**
 * Indicates that visual elements having 
 * identical category, but different series,
 * should be displayed on top of each other, 
 * along the plot's orthogonal direction, 
 * instead of side-by-side, 
 * along the base direction.
 * 
 * @type boolean
 * @default false
 * @category Style
 */
pvc.options.plots.CategoricalNumericPlot.prototype.stacked = undefined;
/**
 * The options documentation class of the 
 * <b>Box plot</b> chart.
 * 
 * @class
 * @extends pvc.options.charts.CategoricalNumericChart
 */
pvc.options.charts.BoxplotChart = function(){};
        
        
        
        
/**
 * The base cartesian axis panel options.
 * <p>
 * When the chart {@link pvc.options.charts.Chart#orientation}
 * is 
 * <tt>vertical</tt> the base axis is laid out horizontally.
 * <p>
 * See {@link pvc.options.axes.CartesianAxis}
 * to know the additional names by which a cartesian axis can be referred to.
 * 
 * @type pvc.options.axes.FlattenedDiscreteCartesianAxis
 * @category Axes
 */
pvc.options.charts.BoxplotChart.prototype.baseAxis = undefined;
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
pvc.options.charts.BoxplotChart.prototype.panelSizeRatio = undefined;
/**
 * The box plot is the 
 * <b>main plot</b> of the box plot chart,
 * which means that 
 * its properties may be used 
 * <i>without</i> the "box" property suffix.
 * 
 * @type pvc.options.plots.BoxplotPlot
 * @category Plots
 */
pvc.options.charts.BoxplotChart.prototype.box = undefined;
/**
 * The 
 * <tt>lowerQuartil</tt> visual role 
 * controls the bottom position of the box visual element,
 * along the orthogonal axis.
 * <p>
 * The 
 * <tt>lowerQuartil</tt> visual role automatically binds to 
 * a single numeric dimension whose name has the 
 * <tt>lowerQuartil</tt> prefix.
 * <p>
 * The 
 * <tt>lowerQuartil</tt> visual role is optional.
 * <p>
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.BoxplotChart.prototype.lowerQuartilRole = undefined;
/**
 * The 
 * <tt>maximum</tt> visual role 
 * controls the position of the rule that crosses 
 * the bottom whisker of the box visual element,
 * along the orthogonal axis.
 * <p>
 * The 
 * <tt>maximum</tt> visual role automatically binds to 
 * a single numeric dimension whose name has the 
 * <tt>maximum</tt> prefix.
 * <p>
 * The 
 * <tt>maximum</tt> visual role is optional.
 * <p>
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.BoxplotChart.prototype.maximumRole = undefined;
/**
 * The 
 * <tt>median</tt> visual role 
 * controls the position of the middle rule of the box visual element,
 * along the orthogonal axis.
 * <p>
 * The 
 * <tt>median</tt> visual role automatically binds to 
 * a single numeric dimension whose name has the 
 * <tt>median</tt> prefix.
 * <p>
 * The 
 * <tt>median</tt> visual role is required.
 * <p>
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.BoxplotChart.prototype.medianRole = undefined;
/**
 * The 
 * <tt>minimum</tt> visual role 
 * controls the position of the rule that crosses 
 * the top whisker of the box visual element,
 * along the orthogonal axis.
 * <p>
 * The 
 * <tt>minimum</tt> visual role automatically binds to 
 * a single numeric dimension whose name has the 
 * <tt>minimum</tt> prefix.
 * <p>
 * The 
 * <tt>minimum</tt> visual role is optional.
 * <p>
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.BoxplotChart.prototype.minimumRole = undefined;
/**
 * The 
 * <tt>series</tt> visual role represents a 
 * 
 * <i>series</i> of connected data points. 
 * In this chart type, although supported, 
 * data bound to is not represented in its visual elements.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 * @constant
 */
pvc.options.charts.BoxplotChart.prototype.seriesRole = null;
/**
 * The 
 * <tt>upperQuartil</tt> visual role 
 * controls the top position of the box visual element,
 * along the orthogonal axis.
 * <p>
 * The 
 * <tt>upperQuartil</tt> visual role automatically binds to 
 * a single numeric dimension whose name has the 
 * <tt>upperQuartil</tt> prefix.
 * <p>
 * The 
 * <tt>upperQuartil</tt> visual role is optional.
 * <p>
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.BoxplotChart.prototype.upperQuartilRole = undefined;
/**
 * The options documentation class of the 
 * <b>Box</b> plot.
 * 
 * @class
 * @extends pvc.options.plots.CategoricalNumericPlot
 */
pvc.options.plots.BoxplotPlot = function(){};
        
        
        
        
/**
 * The box plot only shows a single series of data
 * and, as such, this property is meaningless.
 * 
 * @type boolean
 * @constant
 */
pvc.options.plots.BoxplotPlot.prototype.stacked = false;
/**
 * The maximum width of a box plot bar, in pixel units.
 * <p>
 * A number not less than 
 * <tt>1</tt>, possibly infinity.
 * 
 * @type number
 * @default Infinity
 * @category Style
 */
pvc.options.plots.BoxplotPlot.prototype.boxSizeMax = undefined;
/**
 * The percentage of space of each band that is occupied by the box bar.
 * <p>
 * The bar of a box is centered in each band. 
 * Bands may have space between them, 
 * depending on {@link pvc.options.charts.BoxplotChart#panelSizeRatio}.
 * <p>
 * A number between 
 * <tt>0.05</tt> and 
 * <tt>1</tt>.
 * <p>
 * The default value is the result of 
 * <tt>1/3</tt>.
 * 
 * @type number
 * @default 0.333
 * @category Style
 */
pvc.options.plots.BoxplotPlot.prototype.boxSizeRatio = undefined;
/**
 * The extension points object contains style definitions for 
 * the marks of the plot.
 * 
 * @type pvc.options.ext.BoxplotPlotExtensionPoints
 * @category Style
 */
pvc.options.plots.BoxplotPlot.prototype.extensionPoints = undefined;
/**
 * 
 * The maximum width of a box plot bar, in pixel units.
 * 
 * @deprecated Use {@link #boxSizeMax} instead.
 * @type number
 * @default Infinity
 * @category Style
 */
pvc.options.plots.BoxplotPlot.prototype.maxBoxSize = undefined;
/**
 * The extension points of the box plot type.
 * <p>
 * To use an extension point you must find its full name, by joining:
 * 
 * <ol>
 * 
 * <li>plot property name (ex: 
 * <tt>box</tt>)</li>
 * 
 * <li>extension property (ex: 
 * <tt>panel</tt>)</li>
 * 
 * <li>the "_" character</li>
 * 
 * <li>extension sub-property (ex: 
 * <tt>strokeStyle</tt>)</li>
 * </ol>
 * and obtaining, for the examples, the camel-cased name: 
 * <tt>boxPanel_strokeStyle</tt>
 * (see {@link http://en.wikipedia.org/wiki/CamelCase}).
 * <p>
 * The extension points of the 
 * <i>main plot</i> of a chart
 * may be used without the plot property name prefix.
 * In the example, when the 
 * <tt>box</tt> plot is the main plot, 
 * the extension point can be written as 
 * <tt>panel_strokeStyle</tt>.
 * 
 * @class
 */
pvc.options.ext.BoxplotPlotExtensionPoints = function(){};
        
        
        
        
/**
 * The extension point of the box mark.
 * <p>
 * The box mark is a bar that extends from the 
 * orthogonal position of the 
 * 
 * <tt>lowerQuartil</tt> to the position of the 
 * <tt>upperQuartil</tt>.
 * 
 * @type pvc.options.marks.BarExtensionPoint
 */
pvc.options.ext.BoxplotPlotExtensionPoints.prototype.bar = undefined;
/**
 * The extension point of the category panel of the box plot.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.BoxplotPlotExtensionPoints.prototype.panel = undefined;
/**
 * The extension point of the rule that crosses the 
 * top whisker of the box plot visual element.
 * 
 * @type pvc.options.marks.RuleExtensionPoint
 */
pvc.options.ext.BoxplotPlotExtensionPoints.prototype.ruleMax = undefined;
/**
 * The extension point of the rule that 
 * cuts in two the box bar of the box plot visual element.
 * 
 * @type pvc.options.marks.RuleExtensionPoint
 */
pvc.options.ext.BoxplotPlotExtensionPoints.prototype.ruleMedian = undefined;
/**
 * The extension point of the rule that crosses the 
 * bottom whisker of the box plot visual element.
 * 
 * @type pvc.options.marks.RuleExtensionPoint
 */
pvc.options.ext.BoxplotPlotExtensionPoints.prototype.ruleMin = undefined;
/**
 * The extension point of the top and bottom whiskers of 
 * the box plot visual element.
 * 
 * @type pvc.options.marks.RuleExtensionPoint
 */
pvc.options.ext.BoxplotPlotExtensionPoints.prototype.ruleWhisker = undefined;
/**
 * The options documentation class of the 
 * <b>Heat grid</b> chart.
 * 
 * @class
 * @extends pvc.options.charts.CategoricalChart
 */
pvc.options.charts.HeatGridChart = function(){};
        
        
        
        
/**
 * The base cartesian axis panel options.
 * <p>
 * When the chart {@link pvc.options.charts.Chart#orientation}
 * is 
 * <tt>vertical</tt> the base axis is laid out horizontally.
 * <p>
 * See {@link pvc.options.axes.CartesianAxis}
 * to know the additional names by which a cartesian axis can be referred to.
 * 
 * @type pvc.options.axes.AnyDiscreteCartesianAxis
 * @category Axes
 */
pvc.options.charts.HeatGridChart.prototype.baseAxis = undefined;
/**
 * The first color axis options.
 * <p>
 * This axis can also be accessed by the property name 
 * <tt>color</tt>.
 * <p>
 * See {@link pvc.options.axes.ColorAxis}
 * for more information on the way that 
 * the color axes' properties may be accessed. 
 * 
 * @type pvc.options.axes.HeatGridColorAxis
 * @category Axes
 */
pvc.options.charts.HeatGridChart.prototype.color = undefined;
/**
 * The orthogonal cartesian axis panel options.
 * <p>
 * When the chart {@link pvc.options.charts.Chart#orientation}
 * is 
 * <tt>vertical</tt> the orthogonal axis is laid out vertically.
 * <p>
 * See {@link pvc.options.axes.CartesianAxis}
 * to know the additional names by which a cartesian axis can be referred to.
 * 
 * @type pvc.options.axes.AnyDiscreteCartesianAxis
 * @category Axes
 */
pvc.options.charts.HeatGridChart.prototype.orthoAxis = undefined;
/**
 * The size axis options.
 * 
 * @type pvc.options.axes.SizeAxis
 * @category Axes
 */
pvc.options.charts.HeatGridChart.prototype.sizeAxis = undefined;
/**
 * 
 * Indicates if the cartesian axes are shown
 * in a composite/hierarchical form.
 * 
 * @deprecated Use {@link pvc.options.axes.AnyDiscreteCartesianAxis#composite} instead.
 * @type boolean
 * @default false
 * @category Axes
 */
pvc.options.charts.HeatGridChart.prototype.useCompositeAxis = undefined;
/**
 * The heat grid plot is the 
 * <b>main plot</b> of the heat grid chart,
 * which means that 
 * its properties may be used 
 * <i>without</i> the "heatGrid" property suffix.
 * 
 * @type pvc.options.plots.HeatGridPlot
 * @category Plots
 */
pvc.options.charts.HeatGridChart.prototype.heatGrid = undefined;
/**
 * The 
 * <tt>category</tt> visual role 
 * of the heat grid chart organizes visual elements
 * along the discrete base axis, 
 * and is restricted to be discrete.
 * <p>
 * For additional information, 
 * see the base version of this property:
 * {@link pvc.options.charts.CategoricalChart#categoryRole}.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.HeatGridChart.prototype.categoryRole = undefined;
/**
 * The 
 * <tt>color</tt> visual role controls the color of 
 * the visual elements.
 * <p>
 * The 
 * <tt>color</tt> visual role automatically binds to 
 * a single numeric dimension, 
 * whose name is 
 * <tt>value</tt>.
 * <p>
 * The 
 * <tt>color</tt> visual role is optional and numeric.
 * <p>
 * When unbound, the visual elements all show the same color.
 * <p>
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.HeatGridChart.prototype.colorRole = undefined;
/**
 * The 
 * <tt>series</tt> visual role 
 * of the heat grid chart organizes visual elements
 * along the discrete orthogonal axis.
 * <p>
 * For additional information, 
 * see the base version of this property:
 * {@link pvc.options.charts.CartesianChart#seriesRole}.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.HeatGridChart.prototype.seriesRole = undefined;
/**
 * The 
 * <tt>size</tt> visual role controls the size of 
 * the dot visual elements, when in "shapes" mode".
 * <p>
 * The 
 * <tt>size</tt> visual role automatically binds to 
 * a single numeric dimension whose name is 
 * <tt>value2</tt>.
 * <p>
 * The 
 * <tt>size</tt> visual role is optional and numeric.
 * <p>
 * When unbound, all the dot visual elements are 
 * sized to the grid cell size.
 * <p>
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.HeatGridChart.prototype.sizeRole = undefined;
/**
 * The options documentation class of the 
 * <b>Heat grid</b> plot.
 * 
 * @class
 * @extends pvc.options.plots.Plot
 */
pvc.options.plots.HeatGridPlot = function(){};
        
        
        
        
/**
 * The extension points object contains style definitions for 
 * the marks of the plot.
 * 
 * @type pvc.options.ext.HeatGridPlotExtensionPoints
 * @category Style
 */
pvc.options.plots.HeatGridPlot.prototype.extensionPoints = undefined;
/**
 * The shape to use when the value of the 
 * <i>size</i> role is 
 * <tt>null</tt>.
 * <p>
 * See {@link #useShapes}.
 * 
 * @type pvc.options.varia.DotShapeType
 * @default 'cross'
 * @category Style
 */
pvc.options.plots.HeatGridPlot.prototype.nullShape = undefined;
/**
 * The shape to use in the dot mark (applies when using shapes).
 * <p>
 * See {@link #useShapes}.
 * 
 * @type pvc.options.varia.DotShapeType
 * @default 'square'
 * @category Style
 */
pvc.options.plots.HeatGridPlot.prototype.shape = undefined;
/**
 * Indicates if the heat-grid uses as visual elements 
 * dot-shapes, within each grid cell.
 * <p>
 * When 
 * <tt>false</tt> the visual elements are the grid cells
 * themselves.
 * <p>
 * When shapes are used the 
 * {@link pvc.options.charts.HeatGridChart#sizeRole} 
 * visual role can be used.
 * 
 * @type boolean
 * @default false
 * @category Style
 */
pvc.options.plots.HeatGridPlot.prototype.useShapes = undefined;
/**
 * Indicates if value labels are shown next to the visual elements.
 * <p>
 * The heat-grid shows as values 
 * the color role value, if bound, 
 * or, otherwise, 
 * the size role value, if bound.
 * 
 * @type boolean
 * @default true
 * @category Style
 */
pvc.options.plots.HeatGridPlot.prototype.valuesVisible = undefined;
/**
 * The extension points of the 
 * <i>Heat grid</i> plot types.
 * <p>
 * To use an extension point you must find its full name, by joining:
 * 
 * <ol>
 * 
 * <li>plot property name (ex: 
 * <tt>heatGrid</tt>)</li>
 * 
 * <li>extension property (ex: 
 * <tt>panel</tt>)</li>
 * 
 * <li>the "_" character</li>
 * 
 * <li>extension sub-property (ex: 
 * <tt>strokeStyle</tt>)</li>
 * </ol>
 * and obtaining, for the examples, the camel-cased name: 
 * <tt>heatGridPanel_strokeStyle</tt>
 * (see {@link http://en.wikipedia.org/wiki/CamelCase}).
 * <p>
 * The extension points of the 
 * <i>main plot</i> of a chart
 * may be used without the plot property name prefix.
 * In the example, when the 
 * <tt>heatGrid</tt> plot is the main plot, 
 * the extension point can be written as 
 * <tt>panel_strokeStyle</tt>.
 * 
 * @class
 */
pvc.options.ext.HeatGridPlotExtensionPoints = function(){};
        
        
        
        
/**
 * The extension point of the dot mark, 
 * existent in the "shapes" mode.
 * 
 * @type pvc.options.marks.BarExtensionPoint
 */
pvc.options.ext.HeatGridPlotExtensionPoints.prototype.dot = undefined;
/**
 * The extension point of the value label mark.
 * 
 * @type pvc.options.marks.LabelExtensionPoint
 */
pvc.options.ext.HeatGridPlotExtensionPoints.prototype.label = undefined;
/**
 * The extension point of the "cell" panel of the heat grid plot.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.HeatGridPlotExtensionPoints.prototype.panel = undefined;
/**
 * The common options documentation class of the 
 * <b>Bar family</b> charts.
 * 
 * @class
 * @extends pvc.options.charts.CategoricalNumericChart
 * @abstract
 */
pvc.options.charts.BarChartCommon = function(){};
        
        
        
        
/**
 * The base cartesian axis panel options.
 * <p>
 * When the chart {@link pvc.options.charts.Chart#orientation}
 * is 
 * <tt>vertical</tt> the base axis is laid out horizontally.
 * <p>
 * See {@link pvc.options.axes.CartesianAxis}
 * to know the additional names by which a cartesian axis can be referred to.
 * 
 * @type pvc.options.axes.FlattenedDiscreteCartesianAxis
 * @category Axes
 */
pvc.options.charts.BarChartCommon.prototype.baseAxis = undefined;
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
pvc.options.charts.BarChartCommon.prototype.panelSizeRatio = undefined;
/**
 * The 
 * <tt>category</tt> visual role 
 * of the bar family charts is restricted to be discrete.
 * <p>
 * For additional information, 
 * see the base version of this property:
 * {@link pvc.options.charts.CategoricalChart#categoryRole}.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.BarChartCommon.prototype.categoryRole = undefined;
/**
 * The 
 * <tt>value</tt> visual role 
 * controls the height of bars.
 * <p>
 * The 
 * <tt>value</tt> visual role automatically binds to 
 * a single numeric dimension whose name has the 
 * <tt>value</tt> prefix.
 * <p>
 * The 
 * <tt>value</tt> visual role is required.
 * <p>
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.BarChartCommon.prototype.valueRole = undefined;
/**
 * The common options documentation class of the 
 * <b>Bar family</b> plots.
 * 
 * @class
 * @extends pvc.options.plots.CategoricalNumericPlot
 * @abstract
 */
pvc.options.plots.BarPlotCommon = function(){};
        
        
        
        
/**
 * The maximum width of a bar, in pixel units.
 * <p>
 * A number not less than 
 * <tt>1</tt>, possibly infinity.
 * 
 * @type number
 * @default 2000
 * @category Style
 */
pvc.options.plots.BarPlotCommon.prototype.barSizeMax = undefined;
/**
 * The percentage of the grouped bar width 
 * versus the space between grouped bars (does not apply to stacked bars).
 * <p>
 * A number between 
 * <tt>0.05</tt> and 
 * <tt>1</tt>.
 * 
 * @type number
 * @default 0.9
 * @category Style
 */
pvc.options.plots.BarPlotCommon.prototype.barSizeRatio = undefined;
/**
 * The space between bars of a given stack, in pixel units 
 * (applies to stacked bars).
 * <p>
 * A non-negative number.
 * 
 * @type number
 * @default 0
 * @category Style
 */
pvc.options.plots.BarPlotCommon.prototype.barStackedMargin = undefined;
/**
 * The extension points object contains style definitions for 
 * the marks of the plot.
 * 
 * @type pvc.options.ext.BarPlotCommonExtensionPoints
 * @category Style
 */
pvc.options.plots.BarPlotCommon.prototype.extensionPoints = undefined;
/**
 * 
 * The maximum width of a bar, in pixel units.
 * 
 * @deprecated Use {@link #barSizeMax} instead.
 * @type number
 * @default 2000
 * @category Style
 */
pvc.options.plots.BarPlotCommon.prototype.maxBarSize = undefined;
/**
 * Indicates if overflow and underflow markers are shown 
 * when the bars are drawn off the plot area.
 * <p>
 * Bars can be drawn off the plot area by use of the 
 * continuous axis properties 
 * <tt>fixedMin</tt> and 
 * <tt>fixedMax</tt>. 
 * 
 * @type boolean
 * @default true
 * @category Style
 */
pvc.options.plots.BarPlotCommon.prototype.overflowMarkersVisible = undefined;
/**
 * The alignment of a value label 
 * relative to its corresponding visual element position.
 * 
 * @type function|pvc.options.varia.MarkAnchor
 * @default 'center'
 * @category Style
 */
pvc.options.plots.BarPlotCommon.prototype.valuesAnchor = undefined;
/**
 * The extension points of the 
 * <i>bar family</i> plot types.
 * <p>
 * To use an extension point you must find its full name, by joining:
 * 
 * <ol>
 * 
 * <li>plot property name (ex: 
 * <tt>bar</tt>)</li>
 * 
 * <li>extension property (ex: 
 * <tt>panel</tt>)</li>
 * 
 * <li>the "_" character</li>
 * 
 * <li>extension sub-property (ex: 
 * <tt>strokeStyle</tt>)</li>
 * </ol>
 * and obtaining, for the examples, the camel-cased name: 
 * <tt>barPanel_strokeStyle</tt>
 * (see {@link http://en.wikipedia.org/wiki/CamelCase}).
 * <p>
 * The extension points of the 
 * <i>main plot</i> of a chart
 * may be used without the plot property name prefix.
 * In the example, when the 
 * <tt>bar</tt> plot is the main plot, 
 * the extension point can be written as 
 * <tt>panel_strokeStyle</tt>.
 * 
 * @class
 */
pvc.options.ext.BarPlotCommonExtensionPoints = function(){};
        
        
        
        
/**
 * The extension point of the bar mark.
 * <p>
 * This extension point can only be used by prefixing it 
 * with the property name of the plot.
 * <p>
 * So, supposing this plot is under a property named 
 * <tt>bar</tt>,
 * and it is desired to access the 
 * <tt>strokeStyle</tt> property of the bar mark,
 * the full name of the extension property 
 * would be 
 * <tt>bar_strokeStyle</tt>.
 * 
 * @type pvc.options.marks.BarExtensionPoint
 */
pvc.options.ext.BarPlotCommonExtensionPoints.prototype._ = undefined;
/**
 * The extension point of the value label mark.
 * 
 * @type pvc.options.marks.LabelExtensionPoint
 */
pvc.options.ext.BarPlotCommonExtensionPoints.prototype.label = undefined;
/**
 * The extension point of the overflow marker.
 * 
 * @type pvc.options.marks.DotExtensionPoint
 */
pvc.options.ext.BarPlotCommonExtensionPoints.prototype.overflowMarker = undefined;
/**
 * The extension point of the series panel of the bar plot.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.BarPlotCommonExtensionPoints.prototype.panel = undefined;
/**
 * The extension point of the underflow marker.
 * 
 * @type pvc.options.marks.DotExtensionPoint
 */
pvc.options.ext.BarPlotCommonExtensionPoints.prototype.underflowMarker = undefined;
/**
 * The options documentation class of the 
 * <b>Bar</b> chart.
 * 
 * @class
 * @extends pvc.options.charts.BarChartCommon
 */
pvc.options.charts.BarChart = function(){};
        
        
        
        
/**
 * Activates the second plot.
 * <p>
 * The series identified in {@link #plot2Series}
 * are plotted in the second plot.
 * <p>
 * The second plot is a 
 * <i>generic</i> point plot, 
 * which means that 
 * its properties 
 * {@link pvc.options.plots.CategoricalNumericPlot#stacked},
 * {@link pvc.options.plots.PointPlot#linesVisible},
 * {@link pvc.options.plots.PointPlot#dotsVisible}, 
 * and
 * {@link pvc.options.plots.PointPlot#areasVisible}
 * can be set freely.
 * <p>
 * By default, the second plot shows lines and dots/markers.
 * 
 * @type boolean|pvc.options.plots.PointPlot
 * @default false
 * @category Plots
 */
pvc.options.charts.BarChart.prototype.plot2 = undefined;
/**
 * The 
 * <i>key values</i> of the series visual role, 
 * that are to be shown in the second plot.
 * <p>
 * If the series visual role has more than one dimension, 
 * the specified keys should be 
 * the result of joining the key of each dimension with a "~" character.
 * <p>
 * This option is only relevant when the property
 * {@link #plot2} has the value 
 * <tt>true</tt>.
 * 
 * @type string|list(string)
 * @category Plots > Plot2 > Data
 */
pvc.options.charts.BarChart.prototype.plot2Series = undefined;
/**
 * The trend plot is activated when 
 * the 
 * <i>other</i> chart plots indicate that their 
 * data should be trended.
 * <p>
 * To activate trending for a plot specify 
 * its 
 * <tt>trend type</tt> option.
 * <p>
 * The trend plot shows lines, by default.
 * 
 * @type pvc.options.plots.PointPlot
 * @category Plots
 */
pvc.options.charts.BarChart.prototype.trend = undefined;
/**
 * 
 * Indicates whether the secondary axis should be 
 * shown and with an independent range.
 * 
 * @deprecated 
 * Use
 * {@link pvc.options.plots.CategoricalNumericPlot#orthoAxis}
 * of the 
 * <tt>plot2</tt> plot, instead, 
 * to specify an alternate orthogonal axis.
 * @type boolean
 * @default false
 * @category Axes
 */
pvc.options.charts.BarChart.prototype.secondAxisIndependentScale = undefined;
/**
 * 
 * Indicates whether the second orthogonal axis panel is shown.
 * 
 * @deprecated 
 * Use {@link pvc.options.axes.CartesianAxis#visible}, 
 * of the 
 * <tt>ortho2</tt> axis, instead.
 * 
 * @type boolean
 * @default true
 * @category Axes
 */
pvc.options.charts.BarChart.prototype.showSecondScale = undefined;
/**
 * 
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
 * 
 * @deprecated Use {@link #plot2Series} instead.
 * @type number|string|list(number|string)
 * @category Data Translation
 */
pvc.options.charts.BarChart.prototype.secondAxisIdx = undefined;
/**
 * 
 * Indicates whether selected series  
 * are plotted in a separate plot.
 * 
 * @deprecated Use {@link #plot2} instead.
 * @type boolean
 * @default false
 * @category Plots
 */
pvc.options.charts.BarChart.prototype.secondAxis = undefined;
/**
 * 
 * The discrete colors scheme to use to distinguish visual elements
 * that are colored using the 
 * <i>second</i> color axis. 
 * 
 * @deprecated Use {@link pvc.options.axes.ColorAxis#colors} of the 
 * <tt>color2Axis</tt> instead.
 * @type list(pvc.options.varia.ColorString)
 * @category Style
 */
pvc.options.charts.BarChart.prototype.secondAxisColor = undefined;
/**
 * The 
 * <tt>dataPart</tt> visual role
 * allows fine grained partitioning
 * of the data  that shows in the main plot
 * and in the second plot.
 * <p>
 * By default, 
 * data is partitioned into two data parts
 * according to the chart's 
 * 
 * <tt>plot2Series</tt> option
 * (depending on the chart,
 * {@link pvc.options.charts.BarChart#plot2Series}, or
 * {@link pvc.options.charts.PointChart#plot2Series}).
 * <p>
 * The 
 * <tt>dataPart</tt> visual role
 * can be bound to a single dimension
 * that is, or is turned into, discrete.
 * <p>
 * The 
 * <tt>dataPart</tt> visual role automatically binds to 
 * a dimension whose name has the 
 * <tt>dataPart</tt> prefix.
 * <p>
 * The datums with the fixed data part value 
 * <tt>0</tt> 
 * are shown in the chart's main plot.
 * The datums with the fixed data part value 
 * <tt>1</tt> 
 * are shown in the chart's second plot.
 * <p>
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.   
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.BarChart.prototype.dataPartRole = undefined;
/**
 * The bar plot is the 
 * <b>main plot</b> of the bar chart,
 * which means that 
 * its properties may be used 
 * <i>without</i> the "bar" property suffix.
 * 
 * @type pvc.options.plots.BarPlot
 * @category Plots
 */
pvc.options.charts.BarChart.prototype.bar = undefined;
/**
 * The options documentation class of the 
 * <b>Bar</b> plot.
 * 
 * @class
 * @extends pvc.options.plots.BarPlotCommon
 */
pvc.options.plots.BarPlot = function(){};
        
        
        
        
/**
 * Contains the plot's trending options.
 * <p>
 * Besides the property concatenation way of specifying this
 * property and its sub-properties, 
 * this option may also be specified as a plain JSON object.
 * 
 * @type pvc.options.varia.PlotTrending
 */
pvc.options.plots.BarPlot.prototype.trend = undefined;
/**
 * The options documentation class of the 
 * <b>Normalized Bar</b> chart.
 * 
 * @class
 * @extends pvc.options.charts.BarChartCommon
 */
pvc.options.charts.NormalizedBarChart = function(){};
        
        
        
        
/**
 * The normalized bar plot is the 
 * <b>main plot</b> of the normalized area chart,
 * which means that 
 * its properties may be used 
 * <i>without</i> the "normBar" property suffix.
 * 
 * @type pvc.options.plots.NormalizedBarPlot
 * @category Plots
 */
pvc.options.charts.NormalizedBarChart.prototype.bar = undefined;
/**
 * The options documentation class of the 
 * <b>Normalized Bar</b> plot.
 * 
 * @class
 * @extends pvc.options.plots.BarPlotCommon
 */
pvc.options.plots.NormalizedBarPlot = function(){};
        
        
        
        
/**
 * This plot type is necessarily stacked.
 * 
 * @type boolean
 * @constant
 */
pvc.options.plots.NormalizedBarPlot.prototype.stacked = true;
/**
 * The options documentation class of the 
 * <b>Waterfall</b> chart.
 * 
 * @class
 * @extends pvc.options.charts.BarChartCommon
 */
pvc.options.charts.WaterfallChart = function(){};
        
        
        
        
/**
 * The waterfall plot is the 
 * <b>main plot</b> of the waterfall chart,
 * which means that 
 * its properties may be used 
 * <i>without</i> the "water" property suffix.
 * 
 * @type pvc.options.plots.WaterfallPlot
 * @category Plots
 */
pvc.options.charts.WaterfallChart.prototype.water = undefined;
/**
 * The options documentation class of the 
 * <b>Bar</b> plot.
 * 
 * @class
 * @extends pvc.options.plots.BarPlotCommon
 */
pvc.options.plots.WaterfallPlot = function(){};
        
        
        
        
/**
 * This plot type is necessarily stacked.
 * 
 * @type boolean
 * @constant
 */
pvc.options.plots.WaterfallPlot.prototype.stacked = true;
/**
 * The description of the fictitious root category 
 * that aggregates all other categories.
 * 
 * @type string
 * @default 'All'
 * @category Style
 */
pvc.options.plots.WaterfallPlot.prototype.allCategoryLabel = undefined;
/**
 * Indicates if areas are shown surrounding the bars of each 
 * category group.
 * 
 * @type boolean
 * @default true
 * @category Style
 */
pvc.options.plots.WaterfallPlot.prototype.areasVisible = undefined;
/**
 * The direction of the waterfall.
 * 
 * @type pvc.options.varia.WaterDirection
 * @default 'down'
 * @category Style
 */
pvc.options.plots.WaterfallPlot.prototype.direction = undefined;
/**
 * The extension points object contains style definitions for 
 * the marks of the plot.
 * 
 * @type pvc.options.ext.WaterfallPlotExtensionPoints
 * @category Style
 */
pvc.options.plots.WaterfallPlot.prototype.extensionPoints = undefined;
/**
 * The description of the legend item of
 * the water line.
 * 
 * @type string
 * @default 'Accumulated'
 * @category Style
 */
pvc.options.plots.WaterfallPlot.prototype.waterLineLabel = undefined;
/**
 * Indicates if value labels are shown above or below
 * the water line showing the accumulated value.
 * <p>
 * The default value is 
 * the value of the property
 * {@link pvc.options.plots.Plot#valuesVisible}. 
 * 
 * @type boolean
 * @category Style
 */
pvc.options.plots.WaterfallPlot.prototype.waterValuesVisible = undefined;
/**
 * The extension points of the waterfall plot type.
 * <p>
 * To use an extension point you must find its full name, by joining:
 * 
 * <ol>
 * 
 * <li>plot property name (ex: 
 * <tt>water</tt>)</li>
 * 
 * <li>extension property (ex: 
 * <tt>line</tt>)</li>
 * 
 * <li>the "_" character</li>
 * 
 * <li>extension sub-property (ex: 
 * <tt>strokeStyle</tt>)</li>
 * </ol>
 * and obtaining, for the examples, the camel-cased name: 
 * <tt>waterLine_strokeStyle</tt>
 * (see {@link http://en.wikipedia.org/wiki/CamelCase}).
 * <p>
 * The extension points of the 
 * <i>main plot</i> of a chart
 * may be used without the plot property name prefix.
 * In the example, when the 
 * <tt>water</tt> plot is the main plot, 
 * the extension point can be written as 
 * <tt>line_strokeStyle</tt>.
 * 
 * @class
 * @extends pvc.options.ext.BarPlotCommonExtensionPoints
 */
pvc.options.ext.WaterfallPlotExtensionPoints = function(){};
        
        
        
        
/**
 * The extension point of the group panel mark.
 * <p>
 * The group panel visually contains all bars that 
 * belong to the same group.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.WaterfallPlotExtensionPoints.prototype.group = undefined;
/**
 * The extension point of the top water line mark.
 * 
 * @type pvc.options.marks.LineExtensionPoint
 */
pvc.options.ext.WaterfallPlotExtensionPoints.prototype.line = undefined;
/**
 * The extension point of the category total label mark, 
 * that is placed near the water line.
 * 
 * @type pvc.options.marks.LabelExtensionPoint
 */
pvc.options.ext.WaterfallPlotExtensionPoints.prototype.lineLabel = undefined;
/**
 * The common options documentation class for the 
 * <b>Line/Dot/Area family</b> charts.
 * 
 * @class
 * @extends pvc.options.charts.CategoricalNumericChart
 * @abstract
 */
pvc.options.charts.PointChart = function(){};
        
        
        
        
/**
 * Activates the second plot.
 * <p>
 * The series identified in {@link #plot2Series}
 * are plotted in the second plot.
 * <p>
 * The second plot is a 
 * <i>generic</i> point plot, 
 * which means that 
 * its properties 
 * {@link pvc.options.plots.CategoricalNumericPlot#stacked},
 * {@link pvc.options.plots.PointPlot#linesVisible},
 * {@link pvc.options.plots.PointPlot#dotsVisible}, 
 * and
 * {@link pvc.options.plots.PointPlot#areasVisible}
 * can be set freely.
 * <p>
 * By default, the second plot shows lines and dots/markers.
 * 
 * @type boolean|pvc.options.plots.PointPlot
 * @default false
 * @category Plots
 */
pvc.options.charts.PointChart.prototype.plot2 = undefined;
/**
 * The 
 * <i>key values</i> of the series visual role, 
 * that are to be shown in the second plot.
 * <p>
 * If the series visual role has more than one dimension, 
 * the specified keys should be 
 * the result of joining the key of each dimension with a "~" character.
 * <p>
 * This option is only relevant when the property
 * {@link #plot2} has the value 
 * <tt>true</tt>.
 * 
 * @type string|list(string)
 * @category Plots > Plot2 > Data
 */
pvc.options.charts.PointChart.prototype.plot2Series = undefined;
/**
 * The trend plot is activated when 
 * the 
 * <i>other</i> chart plots indicate that their 
 * data should be trended.
 * <p>
 * To activate trending for a plot specify 
 * its 
 * <tt>trend type</tt> option.
 * <p>
 * The trend plot shows lines, by default.
 * 
 * @type pvc.options.plots.PointPlot
 * @category Plots
 */
pvc.options.charts.PointChart.prototype.trend = undefined;
/**
 * The 
 * <tt>dataPart</tt> visual role
 * allows fine grained partitioning
 * of the data  that shows in the main plot
 * and in the second plot.
 * <p>
 * By default, 
 * data is partitioned into two data parts
 * according to the chart's 
 * 
 * <tt>plot2Series</tt> option
 * (depending on the chart,
 * {@link pvc.options.charts.BarChart#plot2Series}, or
 * {@link pvc.options.charts.PointChart#plot2Series}).
 * <p>
 * The 
 * <tt>dataPart</tt> visual role
 * can be bound to a single dimension
 * that is, or is turned into, discrete.
 * <p>
 * The 
 * <tt>dataPart</tt> visual role automatically binds to 
 * a dimension whose name has the 
 * <tt>dataPart</tt> prefix.
 * <p>
 * The datums with the fixed data part value 
 * <tt>0</tt> 
 * are shown in the chart's main plot.
 * The datums with the fixed data part value 
 * <tt>1</tt> 
 * are shown in the chart's second plot.
 * <p>
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.   
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.PointChart.prototype.dataPartRole = undefined;
/**
 * The base cartesian axis panel options.
 * <p>
 * When the chart {@link pvc.options.charts.Chart#orientation}
 * is 
 * <tt>vertical</tt> the base axis is laid out horizontally.
 * <p>
 * See {@link pvc.options.axes.CartesianAxis}
 * to know the additional names by which a cartesian axis can be referred to.
 * 
 * @type pvc.options.axes.AnyNonHierarchicalCartesianAxis
 * @category Axes
 */
pvc.options.charts.PointChart.prototype.baseAxis = undefined;
/**
 * The 
 * <tt>value</tt> visual role 
 * controls the orthogonal position of points.
 * <p>
 * The 
 * <tt>value</tt> visual role automatically binds to 
 * a single numeric dimension whose name has the 
 * <tt>value</tt> prefix.
 * <p>
 * The 
 * <tt>value</tt> visual role is required.
 * <p>
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.PointChart.prototype.valueRole = undefined;
/**
 * The common options documentation class of the 
 * <b>point</b> plots.
 * 
 * @class
 * @extends pvc.options.plots.CategoricalNumericPlot
 */
pvc.options.plots.PointPlot = function(){};
        
        
        
        
/**
 * Indicates if the visual elements show dots/markers
 * in each point's position.
 * 
 * @type boolean
 * @default false
 * @category Style
 */
pvc.options.plots.PointPlot.prototype.dotsVisible = undefined;
/**
 * Indicates if the visual elements are connected
 * with lines.
 * 
 * @type boolean
 * @default false
 * @category Style
 */
pvc.options.plots.PointPlot.prototype.linesVisible = undefined;
/**
 * 
 * Indicates if the visual elements show dots/markers
 * in each point's position.
 * 
 * @deprecated Use {@link #dotsVisible} instead.
 * @type boolean
 * @category Style
 */
pvc.options.plots.PointPlot.prototype.showDots = undefined;
/**
 * 
 * Indicates if the visual elements are connected
 * with lines.
 * 
 * @deprecated Use {@link #linesVisible} instead.
 * @type boolean
 * @category Style
 */
pvc.options.plots.PointPlot.prototype.showLines = undefined;
/**
 * Contains the plot's trending options.
 * <p>
 * Besides the property concatenation way of specifying this
 * property and its sub-properties, 
 * this option may also be specified as a plain JSON object.
 * 
 * @type pvc.options.varia.PlotTrending
 */
pvc.options.plots.PointPlot.prototype.trend = undefined;
/**
 * Indicates if the visual elements are 
 * connected with shaded areas extending
 * from the visual elements to the zero line.
 * 
 * @type boolean
 * @default false
 * @category Style
 */
pvc.options.plots.PointPlot.prototype.areasVisible = undefined;
/**
 * The extension points object contains style definitions for 
 * the marks of the plot.
 * 
 * @type pvc.options.ext.PointPlotExtensionPoints
 * @category Style
 */
pvc.options.plots.PointPlot.prototype.extensionPoints = undefined;
/**
 * 
 * Indicates if the visual elements are 
 * connected with shaded areas extending
 * from the visual elements to the zero line.
 * 
 * @deprecated Use {@link #areasVisible} instead.
 * @type boolean
 * @category Style
 */
pvc.options.plots.PointPlot.prototype.showAreas = undefined;
/**
 * The alignment of a value label 
 * relative to its corresponding visual element position.
 * 
 * @type function|pvc.options.varia.MarkAnchor
 * @default 'right'
 * @category Style
 */
pvc.options.plots.PointPlot.prototype.valuesAnchor = undefined;
/**
 * The extension points common to the 
 * <b>point</b> plot types.
 * <p>
 * To use an extension point you must find its full name, by joining:
 * 
 * <ol>
 * 
 * <li>plot property name (ex: 
 * <tt>point</tt>)</li>
 * 
 * <li>extension property (ex: 
 * <tt>area</tt>)</li>
 * 
 * <li>the "_" character</li>
 * 
 * <li>extension sub-property (ex: 
 * <tt>fillStyle</tt>)</li>
 * </ol>
 * and obtaining, for the examples, the camel-cased name: 
 * <tt>pointArea_fillStyle</tt>
 * (see {@link http://en.wikipedia.org/wiki/CamelCase}).
 * <p>
 * The extension points of the 
 * <i>main plot</i> of a chart
 * may be used without the plot property name prefix.
 * In the example, when the 
 * <tt>point</tt> plot is the main plot, 
 * the extension point can be written as 
 * <tt>area_fillStyle</tt>.
 * 
 * @class
 */
pvc.options.ext.PointPlotExtensionPoints = function(){};
        
        
        
        
/**
 * The extension point of the area mark.
 * 
 * @type pvc.options.marks.AreaExtensionPoint
 */
pvc.options.ext.PointPlotExtensionPoints.prototype.area = undefined;
/**
 * The extension point of the dot mark.
 * 
 * @type pvc.options.marks.DotExtensionPoint
 */
pvc.options.ext.PointPlotExtensionPoints.prototype.dot = undefined;
/**
 * The extension point of the value label mark.
 * 
 * @type pvc.options.marks.LabelExtensionPoint
 */
pvc.options.ext.PointPlotExtensionPoints.prototype.label = undefined;
/**
 * The extension point of the line mark.
 * 
 * @type pvc.options.marks.LineExtensionPoint
 */
pvc.options.ext.PointPlotExtensionPoints.prototype.line = undefined;
/**
 * The extension point of the series panel mark.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.PointPlotExtensionPoints.prototype.panel = undefined;
/**
 * The options documentation class of the 
 * <b>Line</b> chart.
 * 
 * @class
 * @extends pvc.options.charts.PointChart
 */
pvc.options.charts.LineChart = function(){};
        
        
        
        
/**
 * The point plot is the 
 * <b>main plot</b> of the line chart,
 * which means that 
 * its properties may be used 
 * <i>without</i> the "point" property suffix.
 * 
 * @type pvc.options.plots.LinePlot
 * @category Plots
 */
pvc.options.charts.LineChart.prototype.point = undefined;
/**
 * The options documentation class of the 
 * <b>line</b> plot.
 * 
 * @class
 * @extends pvc.options.plots.PointPlot
 */
pvc.options.plots.LinePlot = function(){};
        
        
        
        
/**
 * This plot type necessarily shows lines connecting
 * visual elements.
 * 
 * @type boolean
 * @constant
 */
pvc.options.plots.LinePlot.prototype.linesVisible = true;
/**
 * The options documentation class of the 
 * <b>Stacked Line</b> chart.
 * 
 * @class
 * @extends pvc.options.charts.PointChart
 */
pvc.options.charts.StackedLineChart = function(){};
        
        
        
        
/**
 * The point plot is the 
 * <b>main plot</b> of the stacked line chart,
 * which means that 
 * its properties may be used 
 * <i>without</i> the "point" property suffix.
 * 
 * @type pvc.options.plots.StackedLinePlot
 * @category Plots
 */
pvc.options.charts.StackedLineChart.prototype.point = undefined;
/**
 * The options documentation class of the 
 * <b>stacked line</b> plot.
 * 
 * @class
 * @extends pvc.options.plots.PointPlot
 */
pvc.options.plots.StackedLinePlot = function(){};
        
        
        
        
/**
 * This plot type necessarily shows lines connecting
 * visual elements.
 * 
 * @type boolean
 * @constant
 */
pvc.options.plots.StackedLinePlot.prototype.linesVisible = true;
/**
 * This plot type is necessarily stacked.
 * 
 * @type boolean
 * @constant
 */
pvc.options.plots.StackedLinePlot.prototype.stacked = true;
/**
 * The options documentation class of the 
 * <b>Dot</b> chart.
 * 
 * @class
 * @extends pvc.options.charts.PointChart
 */
pvc.options.charts.DotChart = function(){};
        
        
        
        
/**
 * The point plot is the 
 * <b>main plot</b> of the dot chart,
 * which means that 
 * its properties may be used 
 * <i>without</i> the "point" property suffix.
 * 
 * @type pvc.options.plots.DotPlot
 * @category Plots
 */
pvc.options.charts.DotChart.prototype.point = undefined;
/**
 * The options documentation class of the 
 * <b>dot</b> plot.
 * 
 * @class
 * @extends pvc.options.plots.PointPlot
 */
pvc.options.plots.DotPlot = function(){};
        
        
        
        
/**
 * This plot type necessarily shows dots/markers.
 * 
 * @type boolean
 * @constant
 */
pvc.options.plots.DotPlot.prototype.dotsVisible = true;
/**
 * The options documentation class of the 
 * <b>Stacked Dot</b> chart.
 * 
 * @class
 * @extends pvc.options.charts.PointChart
 */
pvc.options.charts.StackedDotChart = function(){};
        
        
        
        
/**
 * The point plot is the 
 * <b>main plot</b> of the stacked dot chart,
 * which means that 
 * its properties may be used 
 * <i>without</i> the "point" property suffix.
 * 
 * @type pvc.options.plots.StackedDotPlot
 * @category Plots
 */
pvc.options.charts.StackedDotChart.prototype.point = undefined;
/**
 * The options documentation class of the 
 * <b>stacked dot</b> plot.
 * 
 * @class
 * @extends pvc.options.plots.PointPlot
 */
pvc.options.plots.StackedDotPlot = function(){};
        
        
        
        
/**
 * This plot type necessarily shows dots/markers.
 * 
 * @type boolean
 * @constant
 */
pvc.options.plots.StackedDotPlot.prototype.dotsVisible = true;
/**
 * This plot type is necessarily stacked.
 * 
 * @type boolean
 * @constant
 */
pvc.options.plots.StackedDotPlot.prototype.stacked = true;
/**
 * The options documentation class of the 
 * <b>Area</b> chart.
 * 
 * @class
 * @extends pvc.options.charts.PointChart
 */
pvc.options.charts.AreaChart = function(){};
        
        
        
        
/**
 * The point plot is the 
 * <b>main plot</b> of the area chart,
 * which means that 
 * its properties may be used 
 * <i>without</i> the "point" property suffix.
 * 
 * @type pvc.options.plots.AreaPlot
 * @category Plots
 */
pvc.options.charts.AreaChart.prototype.point = undefined;
/**
 * The options documentation class of the 
 * <b>area</b> plot.
 * 
 * @class
 * @extends pvc.options.plots.PointPlot
 */
pvc.options.plots.AreaPlot = function(){};
        
        
        
        
/**
 * This plot type necessarily shows 
 * shaded areas connecting visual elements.
 * 
 * @type boolean
 * @constant
 */
pvc.options.plots.AreaPlot.prototype.areasVisible = true;
/**
 * The options documentation class of the 
 * <b>Stacked Area</b> chart.
 * 
 * @class
 * @extends pvc.options.charts.PointChart
 */
pvc.options.charts.StackedAreaChart = function(){};
        
        
        
        
/**
 * The point plot is the 
 * <b>main plot</b> of the stacked area chart,
 * which means that 
 * its properties may be used 
 * <i>without</i> the "point" property suffix.
 * 
 * @type pvc.options.plots.StackedAreaPlot
 * @category Plots
 */
pvc.options.charts.StackedAreaChart.prototype.point = undefined;
/**
 * The options documentation class of the 
 * <b>stacked area</b> plot.
 * 
 * @class
 * @extends pvc.options.plots.PointPlot
 */
pvc.options.plots.StackedAreaPlot = function(){};
        
        
        
        
/**
 * This plot type necessarily shows 
 * shaded areas connecting visual elements.
 * 
 * @type boolean
 * @constant
 */
pvc.options.plots.StackedAreaPlot.prototype.areasVisible = true;
/**
 * This plot type is necessarily stacked.
 * 
 * @type boolean
 * @constant
 */
pvc.options.plots.StackedAreaPlot.prototype.stacked = true;
/**
 * The common options documentation class for the 
 * <b>Metric Line/Dot family</b> charts.
 * 
 * @class
 * @extends pvc.options.charts.CartesianChart
 * @abstract
 */
pvc.options.charts.MetricPointChart = function(){};
        
        
        
        
/**
 * The trend plot is activated when 
 * the 
 * <i>other</i> chart plots indicate that their 
 * data should be trended.
 * <p>
 * To activate trending for a plot specify 
 * its 
 * <tt>trend type</tt> option.
 * <p>
 * Depending on the chart type
 * <p>
 * The trend plot shows lines, by default.
 * 
 * @type pvc.options.plots.MetricPointPlot
 * @category Plots
 */
pvc.options.charts.MetricPointChart.prototype.trend = undefined;
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
 * @type number|string|list(number|string)
 * @category Data Translation
 */
pvc.options.charts.MetricPointChart.prototype.multiChartIndexes = undefined;
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
 * @category Multi-Chart > Layout
 */
pvc.options.charts.MetricPointChart.prototype.multiChartColumnsMax = undefined;
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
 * @category Multi-Chart > Layout
 */
pvc.options.charts.MetricPointChart.prototype.multiChartMax = undefined;
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
 * @category Multi-Chart > Layout
 */
pvc.options.charts.MetricPointChart.prototype.multiChartSingleColFillsHeight = undefined;
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
 * @category Multi-Chart > Layout
 */
pvc.options.charts.MetricPointChart.prototype.multiChartSingleRowFillsHeight = undefined;
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
 * @category Multi-Chart > Layout
 */
pvc.options.charts.MetricPointChart.prototype.smallAspectRatio = undefined;
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
 * @category Multi-Chart > Layout
 */
pvc.options.charts.MetricPointChart.prototype.smallContentMargins = undefined;
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
 * @category Multi-Chart > Layout
 */
pvc.options.charts.MetricPointChart.prototype.smallContentPaddings = undefined;
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
 * @category Multi-Chart > Layout
 */
pvc.options.charts.MetricPointChart.prototype.smallHeight = undefined;
/**
 * The margins of a 
 * <i>small</i> chart.
 * <p>
 * See {@link pvc.options.varia.Sides} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Sides
 * @default '2%'
 * @category Multi-Chart > Layout
 */
pvc.options.charts.MetricPointChart.prototype.smallMargins = undefined;
/**
 * The paddings of a 
 * <i>small</i> chart.
 * <p>
 * See {@link pvc.options.varia.Sides} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Sides
 * @default 0
 * @category Multi-Chart > Layout
 */
pvc.options.charts.MetricPointChart.prototype.smallPaddings = undefined;
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
 * When an infinite value is specified for 
 * {@link #multiChartColumnsMax}, 
 * the small charts are laid out in a single row, 
 * and so the width is calculated from the height {@link #smallHeight}, 
 * using the aspect ratio {@link #smallAspectRatio}.
 * The height is defaulted to the initially available content height.
 * The aspect ratio is defaulted to a value that depends on the chart type,
 * but is something around 
 * <tt>4/3</tt>.
 * The width is then calculated.
 * 
 * @type number|string
 * @category Multi-Chart > Layout
 */
pvc.options.charts.MetricPointChart.prototype.smallWidth = undefined;
/**
 * The title panel of the 
 * <i>small</i> chart.
 * <p>
 * The text of the title of small charts is the 
 * compound label of the data bound to the 
 * <tt>multiChart</tt> visual role.
 * 
 * @type pvc.options.panels.ChartTitlePanel
 * @category Multi-Chart > Panels
 */
pvc.options.charts.MetricPointChart.prototype.smallTitle = undefined;
/**
 * The 
 * <tt>multiChart</tt> visual role
 * allows turning a chart in a 
 * <i>small multiples</i> chart
 * {@link http://en.wikipedia.org/wiki/Small_multiple}.
 * <p>
 * Almost all main chart types support being shown
 * as a small multiples chart.
 * Currently, the exceptions are the charts: 
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
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.MetricPointChart.prototype.multiChartRole = undefined;
/**
 * The base cartesian axis panel options.
 * <p>
 * When the chart {@link pvc.options.charts.Chart#orientation}
 * is 
 * <tt>vertical</tt> the base axis is laid out horizontally.
 * <p>
 * See {@link pvc.options.axes.CartesianAxis}
 * to know the additional names by which a cartesian axis can be referred to.
 * 
 * @type pvc.options.axes.AnyContinuousCartesianAxis
 * @category Axes
 */
pvc.options.charts.MetricPointChart.prototype.baseAxis = undefined;
/**
 * The first color axis options.
 * <p>
 * This axis can also be accessed by the property name 
 * <tt>color</tt>.
 * <p>
 * See {@link pvc.options.axes.ColorAxis}
 * for more information on the way that 
 * the color axes' properties may be accessed. 
 * 
 * @type pvc.options.axes.AnyColorAxis
 * @category Axes
 */
pvc.options.charts.MetricPointChart.prototype.color = undefined;
/**
 * The orthogonal cartesian axis panel options.
 * <p>
 * When the chart {@link pvc.options.charts.Chart#orientation}
 * is 
 * <tt>vertical</tt> the orthogonal axis is laid out vertically.
 * <p>
 * See {@link pvc.options.axes.CartesianAxis}
 * to know the additional names by which a cartesian axis can be referred to.
 * 
 * @type pvc.options.axes.AnyContinuousCartesianAxis
 * @category Axes
 */
pvc.options.charts.MetricPointChart.prototype.orthoAxis = undefined;
/**
 * The size axis options.
 * 
 * @type pvc.options.axes.SizeAxis
 * @category Axes
 */
pvc.options.charts.MetricPointChart.prototype.sizeAxis = undefined;
/**
 * The extension points object contains style definitions for 
 * the marks of the chart.
 * 
 * @type pvc.options.ext.MetricPointChartExtensionPoints
 * @category Style
 */
pvc.options.charts.MetricPointChart.prototype.extensionPoints = undefined;
/**
 * The 
 * <tt>color</tt> visual role controls the color of the
 * dots and lines of the visual elements.
 * <p>
 * The 
 * <tt>color</tt> visual role automatically binds to 
 * every discrete dimension, or a single continuous dimension, 
 * whose name has the 
 * <tt>color</tt> prefix
 * or, if none exists, 
 * the dimensions of the "series" role.
 * <p>
 * The 
 * <tt>color</tt> visual role is discrete or continuous.
 * <p>
 * The default value type of dimensions bound to it is 
 * <tt>Number</tt>.
 * <p>
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.MetricPointChart.prototype.colorRole = undefined;
/**
 * The 
 * <tt>size</tt> visual role controls the size of 
 * the dots of the visual elements,
 * and, as such, it is only represented if dots are visible.
 * <p>
 * The 
 * <tt>size</tt> visual role automatically binds to 
 * every dimension whose name has the 
 * <tt>size</tt> prefix.
 * <p>
 * The 
 * <tt>size</tt> visual role is continuous and optional.
 * <p>
 * The default value type of the dimension bound to it is 
 * <tt>Number</tt>.
 * <p>
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.MetricPointChart.prototype.sizeRole = undefined;
/**
 * The 
 * <tt>x</tt> visual role controls the base position
 * of the "point" visual element.
 * <p>
 * The 
 * <tt>x</tt> visual role automatically binds to 
 * a single dimension whose name has the 
 * <tt>x</tt> prefix.
 * <p>
 * The 
 * <tt>x</tt> visual role is continuous and required.
 * <p>
 * The default value type of the dimension bound to it 
 * depends on the value of the chart option 
 * {@link pvc.options.charts.Chart#timeSeries}.
 * If it is 
 * <tt>true</tt>
 * it is 
 * <tt>Date</tt>, otherwise, 
 * it is 
 * <tt>Number</tt>.
 * <p>
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.MetricPointChart.prototype.xRole = undefined;
/**
 * The 
 * <tt>y</tt> visual role controls the orthogonal position
 * of the "point" visual element.
 * <p>
 * The 
 * <tt>y</tt> visual role automatically binds to 
 * a single dimension whose name has the 
 * <tt>y</tt> prefix.
 * <p>
 * The 
 * <tt>y</tt> visual role is continuous and required.
 * <p>
 * The default value type of the dimension bound to it is 
 * <tt>Number</tt>.
 * <p>
 * See {@link pvc.options.VisualRole}
 * for more information on supported data types.
 * 
 * @type string|pvc.options.VisualRole
 * @category Visual roles
 */
pvc.options.charts.MetricPointChart.prototype.yRole = undefined;
/**
 * The extension points of the 
 * <i>metric line/dot/area family</i> chart types.
 * <p>
 * To use an extension point you must find its full name, by joining:
 * 
 * <ol>
 * 
 * <li>extension property (ex: 
 * <tt>smallBase</tt>)</li>
 * 
 * <li>the "_" character</li>
 * 
 * <li>extension sub-property (ex: 
 * <tt>strokeStyle</tt>)</li>
 * </ol>
 * and obtaining, for the examples, the camel-cased name: 
 * <tt>smallBase_strokeStyle</tt>
 * (see {@link http://en.wikipedia.org/wiki/CamelCase}).
 * 
 * @class
 */
pvc.options.ext.MetricPointChartExtensionPoints = function(){};
        
        
        
        
/**
 * The extension point of the base (root) panel of the 
 * <i>small</i> charts.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 * @category Multi-Chart
 */
pvc.options.ext.MetricPointChartExtensionPoints.prototype.smallBase = undefined;
/**
 * The extension point of the content panel of the 
 * <i>small</i> charts.
 * <p>
 * The content panel is a child of the base panel.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 * @category Multi-Chart
 */
pvc.options.ext.MetricPointChartExtensionPoints.prototype.smallContent = undefined;
/**
 * The extension points common to the 
 * <b>metric point</b> plot types.
 * <p>
 * To use an extension point you must find its full name, by joining:
 * 
 * <ol>
 * 
 * <li>plot property name (ex: 
 * <tt>point</tt>)</li>
 * 
 * <li>extension property (ex: 
 * <tt>line</tt>)</li>
 * 
 * <li>the "_" character</li>
 * 
 * <li>extension sub-property (ex: 
 * <tt>strokeStyle</tt>)</li>
 * </ol>
 * and obtaining, for the examples, the camel-cased name: 
 * <tt>pointLine_strokeStyle</tt>
 * (see {@link http://en.wikipedia.org/wiki/CamelCase}).
 * <p>
 * The extension points of the 
 * <i>main plot</i> of a chart
 * may be used without the plot property name prefix.
 * In the example, when the 
 * <tt>point</tt> plot is the main plot, 
 * the extension point can be written as 
 * <tt>line_strokeStyle</tt>.
 * 
 * @class
 */
pvc.options.ext.MetricPointPlotExtensionPoints = function(){};
        
        
        
        
/**
 * The extension point of the dot mark.
 * 
 * @type pvc.options.marks.DotExtensionPoint
 */
pvc.options.ext.MetricPointPlotExtensionPoints.prototype.dot = undefined;
/**
 * The extension point of the value label mark.
 * 
 * @type pvc.options.marks.LabelExtensionPoint
 */
pvc.options.ext.MetricPointPlotExtensionPoints.prototype.label = undefined;
/**
 * The extension point of the line mark.
 * 
 * @type pvc.options.marks.LineExtensionPoint
 */
pvc.options.ext.MetricPointPlotExtensionPoints.prototype.line = undefined;
/**
 * The extension point of the series panel mark.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.MetricPointPlotExtensionPoints.prototype.panel = undefined;
/**
 * The common options documentation class of the 
 * <b>metric point</b> plots.
 * 
 * @class
 * @extends pvc.options.plots.Plot
 */
pvc.options.plots.MetricPointPlot = function(){};
        
        
        
        
/**
 * Indicates if the visual elements show dots/markers
 * in each point's position.
 * 
 * @type boolean
 * @default false
 * @category Style
 */
pvc.options.plots.MetricPointPlot.prototype.dotsVisible = undefined;
/**
 * Indicates if the visual elements are connected
 * with lines.
 * 
 * @type boolean
 * @default false
 * @category Style
 */
pvc.options.plots.MetricPointPlot.prototype.linesVisible = undefined;
/**
 * 
 * Indicates if the visual elements show dots/markers
 * in each point's position.
 * 
 * @deprecated Use {@link #dotsVisible} instead.
 * @type boolean
 * @category Style
 */
pvc.options.plots.MetricPointPlot.prototype.showDots = undefined;
/**
 * 
 * Indicates if the visual elements are connected
 * with lines.
 * 
 * @deprecated Use {@link #linesVisible} instead.
 * @type boolean
 * @category Style
 */
pvc.options.plots.MetricPointPlot.prototype.showLines = undefined;
/**
 * Contains the plot's trending options.
 * <p>
 * Besides the property concatenation way of specifying this
 * property and its sub-properties, 
 * this option may also be specified as a plain JSON object.
 * 
 * @type pvc.options.varia.PlotTrending
 */
pvc.options.plots.MetricPointPlot.prototype.trend = undefined;
/**
 * The extension points object contains style definitions for 
 * the marks of the plot.
 * 
 * @type pvc.options.ext.MetricPointPlotExtensionPoints
 * @category Style
 */
pvc.options.plots.MetricPointPlot.prototype.extensionPoints = undefined;
/**
 * Forces a given shape to be used in the dot mark.
 * 
 * @type pvc.options.varia.DotShapeType
 * @default 'circle'
 * @category Style
 */
pvc.options.plots.MetricPointPlot.prototype.shape = undefined;
/**
 * The alignment of a value label 
 * relative to its corresponding visual element position.
 * 
 * @type function|pvc.options.varia.MarkAnchor
 * @default 'right'
 * @category Style
 */
pvc.options.plots.MetricPointPlot.prototype.valuesAnchor = undefined;
/**
 * The options documentation class of the 
 * <b>Metric Line</b> chart.
 * 
 * @class
 * @extends pvc.options.charts.MetricPointChart
 */
pvc.options.charts.MetricLineChart = function(){};
        
        
        
        
/**
 * The metric point plot is the 
 * <b>main plot</b> of the metric line chart,
 * which means that 
 * its properties may be used 
 * <i>without</i> the "scatter" property suffix.
 * 
 * @type pvc.options.plots.MetricLinePlot
 * @category Plots
 */
pvc.options.charts.MetricLineChart.prototype.scatter = undefined;
/**
 * The options documentation class of the 
 * <b>metric line</b> plot.
 * 
 * @class
 * @extends pvc.options.plots.MetricPointPlot
 */
pvc.options.plots.MetricLinePlot = function(){};
        
        
        
        
/**
 * This plot type necessarily shows lines connecting
 * visual elements.
 * 
 * @type boolean
 * @constant
 */
pvc.options.plots.MetricLinePlot.prototype.linesVisible = true;
/**
 * The options documentation class of the 
 * <b>Metric Dot (XY Scatter)</b> chart.
 * 
 * @class
 * @extends pvc.options.charts.MetricPointChart
 */
pvc.options.charts.MetricDotChart = function(){};
        
        
        
        
/**
 * The metric point plot is the 
 * <b>main plot</b> of the metric dot chart,
 * which means that 
 * its properties may be used 
 * <i>without</i> the "scatter" property suffix.
 * 
 * @type pvc.options.plots.MetricDotPlot
 * @category Plots
 */
pvc.options.charts.MetricDotChart.prototype.scatter = undefined;
/**
 * The options documentation class of the 
 * <b>metric dot</b> plot.
 * 
 * @class
 * @extends pvc.options.plots.MetricPointPlot
 */
pvc.options.plots.MetricDotPlot = function(){};
        
        
        
        
/**
 * This plot type necessarily shows dots/markers.
 * 
 * @type boolean
 * @constant
 */
pvc.options.plots.MetricDotPlot.prototype.dotsVisible = true;
/**
 * The namespace of the options of 
 * extension points of 
 * <i>protovis</i> marks. 
 * 
 * @namespace
 */
pvc.options.marks = {};

/**
 * The base class of protovis extension points.
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Mark.html}.
 * 
 * @class
 * @abstract
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
 * The class of protovis Area extension points.
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Area.html}.
 * 
 * @class
 * @extends pvc.options.marks.MarkExtensionPoint
 */
pvc.options.marks.AreaExtensionPoint = function(){};
        
        
        
        
/**
 * The possible ways to draw the ends of a line or line pattern.
 * 
 * @type pvc.options.varia.StrokeLineCap
 * @default 'butt'
 */
pvc.options.marks.AreaExtensionPoint.prototype.lineCap = undefined;
/**
 * The line width.
 * 
 * @type number
 */
pvc.options.marks.AreaExtensionPoint.prototype.lineWidth = undefined;
/**
 * The possible stroke patterns.
 * 
 * @type pvc.options.varia.StrokeDasharray
 * @default 'butt'
 */
pvc.options.marks.AreaExtensionPoint.prototype.strokeDasharray = undefined;
/**
 * The line color.
 * 
 * @type pvc.options.varia.ColorString
 */
pvc.options.marks.AreaExtensionPoint.prototype.strokeStyle = undefined;
/**
 * The fill color.
 * 
 * @type pvc.options.varia.ColorString
 */
pvc.options.marks.AreaExtensionPoint.prototype.fillStyle = undefined;
/**
 * The possible ways to join the segments of a line.
 * <p>
 * Use in combination with the property {@link #strokeMiterLimit}.
 * 
 * @type pvc.options.varia.StrokeLineJoin
 * @default 'miter'
 */
pvc.options.marks.AreaExtensionPoint.prototype.lineJoin = undefined;
/**
 * The maximum ratio of 
 * the miter-join length to the line width.
 * <p>
 * When {@link #lineJoin} is 
 * <tt>miter</tt>,
 * and the angle between consecutive segments
 * becomes small, 
 * the sharp angle corner — the miter — becomes long.
 * <p>
 * When a miter join exceeds the miter limit, 
 * it is automatically converted to a bevel join.
 * 
 * @type number
 * @default 8
 */
pvc.options.marks.AreaExtensionPoint.prototype.strokeMiterLimit = undefined;
/**
 * How to interpolate the area between values. 
 * 
 * @type pvc.options.varia.LineAreaInterpolation
 */
pvc.options.marks.AreaExtensionPoint.prototype.interpolate = undefined;
/**
 * The tension of cardinal splines.
 * 
 * @type number
 */
pvc.options.marks.AreaExtensionPoint.prototype.tension = undefined;
/**
 * The height of the area (use for vertical orientation). 
 * 
 * @type number
 */
pvc.options.marks.AreaExtensionPoint.prototype.height = undefined;
/**
 * The width of the area (use for horizontal orientation).
 * 
 * @type number
 */
pvc.options.marks.AreaExtensionPoint.prototype.width = undefined;
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
 * The possible ways to draw the ends of a line or line pattern.
 * 
 * @type pvc.options.varia.StrokeLineCap
 * @default 'butt'
 */
pvc.options.marks.BarExtensionPoint.prototype.lineCap = undefined;
/**
 * The line width.
 * 
 * @type number
 */
pvc.options.marks.BarExtensionPoint.prototype.lineWidth = undefined;
/**
 * The possible stroke patterns.
 * 
 * @type pvc.options.varia.StrokeDasharray
 * @default 'butt'
 */
pvc.options.marks.BarExtensionPoint.prototype.strokeDasharray = undefined;
/**
 * The line color.
 * 
 * @type pvc.options.varia.ColorString
 */
pvc.options.marks.BarExtensionPoint.prototype.strokeStyle = undefined;
/**
 * The fill color.
 * 
 * @type pvc.options.varia.ColorString
 */
pvc.options.marks.BarExtensionPoint.prototype.fillStyle = undefined;
/**
 * The height of the bar.
 * 
 * @type number
 */
pvc.options.marks.BarExtensionPoint.prototype.height = undefined;
/**
 * The width of the bar.
 * 
 * @type number
 */
pvc.options.marks.BarExtensionPoint.prototype.width = undefined;
/**
 * The class of protovis Dot extension points.
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Dot.html}.
 * 
 * @class
 * @extends pvc.options.marks.MarkExtensionPoint
 */
pvc.options.marks.DotExtensionPoint = function(){};
        
        
        
        
/**
 * The possible ways to draw the ends of a line or line pattern.
 * 
 * @type pvc.options.varia.StrokeLineCap
 * @default 'butt'
 */
pvc.options.marks.DotExtensionPoint.prototype.lineCap = undefined;
/**
 * The line width.
 * 
 * @type number
 */
pvc.options.marks.DotExtensionPoint.prototype.lineWidth = undefined;
/**
 * The possible stroke patterns.
 * 
 * @type pvc.options.varia.StrokeDasharray
 * @default 'butt'
 */
pvc.options.marks.DotExtensionPoint.prototype.strokeDasharray = undefined;
/**
 * The line color.
 * 
 * @type pvc.options.varia.ColorString
 */
pvc.options.marks.DotExtensionPoint.prototype.strokeStyle = undefined;
/**
 * The fill color.
 * 
 * @type pvc.options.varia.ColorString
 */
pvc.options.marks.DotExtensionPoint.prototype.fillStyle = undefined;
/**
 * The name of the shape that the dot assumes.
 * 
 * @type pvc.options.varia.DotShapeType
 */
pvc.options.marks.DotExtensionPoint.prototype.shape = undefined;
/**
 * The rotation angle, in 
 * <i>radian</i> units.
 * <p>
 * Some shapes, 
 * like the {@link pvc.options.varia.DotShapeType#Cross}
 * are sensitive to rotation.
 * 
 * @type number
 * @default 0
 */
pvc.options.marks.DotExtensionPoint.prototype.shapeAngle = undefined;
/**
 * The radius of the dot, in 
 * <i>pixel</i> units.
 * 
 * @type number
 */
pvc.options.marks.DotExtensionPoint.prototype.shapeRadius = undefined;
/**
 * The size of the dot, in 
 * <i>square pixel</i> units.
 * <p>
 * The size is proportional to the area of the shape
 * and is better suited than the {@link #shapeRadius} 
 * for representing measures.
 * <p>
 * For the record: 
 * <tt>size = radius * radius</tt>.
 * 
 * @type number
 */
pvc.options.marks.DotExtensionPoint.prototype.shapeSize = undefined;
/**
 * The class of protovis Label extension points.
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Label.html}.
 * 
 * @class
 * @extends pvc.options.marks.MarkExtensionPoint
 */
pvc.options.marks.LabelExtensionPoint = function(){};
        
        
        
        
/**
 * The font used by the label.
 * <p>
 * See the supported font format in 
 * {@link http://www.w3.org/TR/CSS2/fonts.html#font-shorthand}
 * 
 * @type string
 */
pvc.options.marks.LabelExtensionPoint.prototype.font = undefined;
/**
 * The text to show in the label.
 * 
 * @type string
 */
pvc.options.marks.LabelExtensionPoint.prototype.text = undefined;
/**
 * The horizontal text alignment.
 * 
 * @type pvc.options.varia.TextAlignment
 */
pvc.options.marks.LabelExtensionPoint.prototype.textAlign = undefined;
/**
 * The angle of the text, in 
 * <i>radian</i> units.
 * <p>
 * The text angle is 0 at horizontal direction 
 * and grows clock-wise. 
 * 
 * @type number
 * @default 0
 */
pvc.options.marks.LabelExtensionPoint.prototype.textAngle = undefined;
/**
 * The vertical text alignment.
 * 
 * @type pvc.options.varia.TextBaseline
 */
pvc.options.marks.LabelExtensionPoint.prototype.textBaseline = undefined;
/**
 * A CSS3 text decoration.
 * <p>
 * See the syntax of this string at:
 * {@link http://www.w3.org/TR/2012/WD-css-text-decor-3-20121113/#text-decoration}.
 * 
 * @type string
 */
pvc.options.marks.LabelExtensionPoint.prototype.textDecoration = undefined;
/**
 * A CSS3 text shadow.
 * <p>
 * See the syntax of this string at:
 * {@link http://www.w3.org/TR/2012/WD-css-text-decor-3-20121113/#text-shadow-property}.
 * 
 * @type string
 */
pvc.options.marks.LabelExtensionPoint.prototype.textShadow = undefined;
/**
 * The text color.
 * 
 * @type pvc.options.varia.ColorString
 */
pvc.options.marks.LabelExtensionPoint.prototype.textStyle = undefined;
/**
 * The class of protovis Line extension points.
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Line.html}.
 * 
 * @class
 * @extends pvc.options.marks.MarkExtensionPoint
 */
pvc.options.marks.LineExtensionPoint = function(){};
        
        
        
        
/**
 * The possible ways to draw the ends of a line or line pattern.
 * 
 * @type pvc.options.varia.StrokeLineCap
 * @default 'butt'
 */
pvc.options.marks.LineExtensionPoint.prototype.lineCap = undefined;
/**
 * The line width.
 * 
 * @type number
 */
pvc.options.marks.LineExtensionPoint.prototype.lineWidth = undefined;
/**
 * The possible stroke patterns.
 * 
 * @type pvc.options.varia.StrokeDasharray
 * @default 'butt'
 */
pvc.options.marks.LineExtensionPoint.prototype.strokeDasharray = undefined;
/**
 * The line color.
 * 
 * @type pvc.options.varia.ColorString
 */
pvc.options.marks.LineExtensionPoint.prototype.strokeStyle = undefined;
/**
 * The fill color.
 * 
 * @type pvc.options.varia.ColorString
 */
pvc.options.marks.LineExtensionPoint.prototype.fillStyle = undefined;
/**
 * The possible ways to join the segments of a line.
 * <p>
 * Use in combination with the property {@link #strokeMiterLimit}.
 * 
 * @type pvc.options.varia.StrokeLineJoin
 * @default 'miter'
 */
pvc.options.marks.LineExtensionPoint.prototype.lineJoin = undefined;
/**
 * The maximum ratio of 
 * the miter-join length to the line width.
 * <p>
 * When {@link #lineJoin} is 
 * <tt>miter</tt>,
 * and the angle between consecutive segments
 * becomes small, 
 * the sharp angle corner — the miter — becomes long.
 * <p>
 * When a miter join exceeds the miter limit, 
 * it is automatically converted to a bevel join.
 * 
 * @type number
 * @default 8
 */
pvc.options.marks.LineExtensionPoint.prototype.strokeMiterLimit = undefined;
/**
 * How to interpolate the area between values. 
 * 
 * @type pvc.options.varia.LineAreaInterpolation
 */
pvc.options.marks.LineExtensionPoint.prototype.interpolate = undefined;
/**
 * The tension of cardinal splines.
 * 
 * @type number
 */
pvc.options.marks.LineExtensionPoint.prototype.tension = undefined;
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
 * The possible ways to draw the ends of a line or line pattern.
 * 
 * @type pvc.options.varia.StrokeLineCap
 * @default 'butt'
 */
pvc.options.marks.RuleExtensionPoint.prototype.lineCap = undefined;
/**
 * The line width.
 * 
 * @type number
 */
pvc.options.marks.RuleExtensionPoint.prototype.lineWidth = undefined;
/**
 * The possible stroke patterns.
 * 
 * @type pvc.options.varia.StrokeDasharray
 * @default 'butt'
 */
pvc.options.marks.RuleExtensionPoint.prototype.strokeDasharray = undefined;
/**
 * The line color.
 * 
 * @type pvc.options.varia.ColorString
 */
pvc.options.marks.RuleExtensionPoint.prototype.strokeStyle = undefined;
/**
 * The height of the rule, when it is vertical.
 * 
 * @type number
 */
pvc.options.marks.RuleExtensionPoint.prototype.height = undefined;
/**
 * The width of the rule, when it is horizontal.
 * 
 * @type number
 */
pvc.options.marks.RuleExtensionPoint.prototype.width = undefined;
/**
 * The class of protovis Wedge extension points.
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Wedge.html}.
 * 
 * @class
 * @extends pvc.options.marks.MarkExtensionPoint
 */
pvc.options.marks.WedgeExtensionPoint = function(){};
        
        
        
        
/**
 * The possible ways to draw the ends of a line or line pattern.
 * 
 * @type pvc.options.varia.StrokeLineCap
 * @default 'butt'
 */
pvc.options.marks.WedgeExtensionPoint.prototype.lineCap = undefined;
/**
 * The line width.
 * 
 * @type number
 */
pvc.options.marks.WedgeExtensionPoint.prototype.lineWidth = undefined;
/**
 * The possible stroke patterns.
 * 
 * @type pvc.options.varia.StrokeDasharray
 * @default 'butt'
 */
pvc.options.marks.WedgeExtensionPoint.prototype.strokeDasharray = undefined;
/**
 * The line color.
 * 
 * @type pvc.options.varia.ColorString
 */
pvc.options.marks.WedgeExtensionPoint.prototype.strokeStyle = undefined;
/**
 * The fill color.
 * 
 * @type pvc.options.varia.ColorString
 */
pvc.options.marks.WedgeExtensionPoint.prototype.fillStyle = undefined;
/**
 * The angular span of each slice, in 
 * <i>radian</i> units.
 * 
 * @type number
 * @default 0
 */
pvc.options.marks.WedgeExtensionPoint.prototype.angle = undefined;
/**
 * The end angle of each slice, in 
 * <i>radian</i> units.
 * <p>
 * When unspecified, 
 * the end angle is the start angle plus the angular span.
 * 
 * @type number
 * @default 0
 */
pvc.options.marks.WedgeExtensionPoint.prototype.endAngle = undefined;
/**
 * The inner radius of each slice, in 
 * <i>pixel</i> units.
 * 
 * @type number
 */
pvc.options.marks.WedgeExtensionPoint.prototype.innerRadius = undefined;
/**
 * The outer radius of each slice, in 
 * <i>pixel</i> units.
 * 
 * @type number
 */
pvc.options.marks.WedgeExtensionPoint.prototype.outerRadius = undefined;
/**
 * The start angle of each slice, in 
 * <i>radian</i> units.
 * <p>
 * When unspecified, 
 * the start angle assumes the end angle of the previous slice.
 * 
 * @type number
 * @default 0
 */
pvc.options.marks.WedgeExtensionPoint.prototype.startAngle = undefined;
/**
 * The namespace of CCC axes options classes. 
 * 
 * @namespace
 */
pvc.options.axes = {};

/**
 * The options documentation class of the color axis.
 * <p>
 * A color axis panel and its properties 
 * can be referred to in several ways,
 * in order of precedence:
 * 
 * <dl>
 * 
 * <dt>By 
 * <b>full id</b></dt>
 * 
 * <dd>
 * the id of the axis is the word 
 * <tt>color</tt>, 
 * followed by it's index (when >= 2),
 * and terminated by the word 
 * <tt>Axis</tt>.
 * </dd>
 * 
 * <dd>(ex: 
 * <tt>colorAxis</tt>, 
 * <tt>color2Axis</tt>, 
 * <tt>color3Axis</tt>, ...)</dd>
 * 
 * <dt>By the single word 
 * <tt>color</tt>, when it is the first one</dt>
 * 
 * <dd>
 * to make it easier to specify the properties of 
 * the most used color axis - the first one - 
 * it can be referred to without the suffix 
 * <tt>Axis</tt>,
 * resulting in the name 
 * <tt>color</tt>.
 * </dd>
 * 
 * <dt>Without id, when it is the first one, for legend properties and the 
 * <tt>colors</tt> property</dt>
 * 
 * <dd>
 * Legend related properties of the first axis
 * can be referred to directly, without the axis id.
 * The same applies to the property 
 * <tt>colors</tt>.
 * <p>
 * As an example, 
 * the name of the property 
 * <tt>legendDrawLine</tt> 
 * can be used directly, instead of its full name:
 * 
 * <tt>colorLegendDrawLine</tt>.
 * <p>
 * For color axes other than the first, 
 * the legend properties still need to be referred to 
 * with its full name, like in:
 * 
 * <tt>color2AxisLegendDrawLine</tt>.
 * </dd>
 * </dl>
 * <p>
 * The domain of color axes 
 * is evaluated at the root chart level. 
 * When in a 
 * <i>small multiples</i> chart, 
 * colors are shared among 
 * <i>small</i> charts.
 * <p>
 * With a few exceptions, 
 * color axes map values of the "color" visual role.
 * <p>
 * For more information on options
 * that are specific to only certain color axis types,
 * please see one of the following concrete sub-classes:
 * 
 * <ul>
 * 
 * <li>
 * Numeric or discrete domain color axes: {@link pvc.options.axes.AnyColorAxis}
 * </li>
 * 
 * <li>
 * Discrete domain color axes: {@link pvc.options.axes.DiscreteColorAxis}
 * </li>
 * 
 * <li>
 * Heat-grid - numeric domain color axis: {@link pvc.options.axes.HeatGridColorAxis}
 * </li>
 * </ul>
 * 
 * @class
 * @abstract
 */
pvc.options.axes.ColorAxis = function(){};
        
        
        
        
/**
 * The colors of a color axis.
 * <p>
 * It can be a single color as documented in 
 * {@link pvc.options.varia.ColorString} or 
 * a single 
 * <i>protovis</i> color object 
 * (like: 
 * <tt>pv.color('red')</tt> or 
 * <tt>pv.Color.names.blueviolet</tt>).
 * <p>
 * Additionally, an array of color strings or 
 * 
 * <i>protovis</i> colors can be specified.
 * <p>
 * If a function is specified, it can be:
 * 
 * <ul>
 * 
 * <li>
 * 
 * <b>a protovis scale</b>,
 * like the one obtained by:
 * 
 * <tt>pv.colors('red', 'blueviolet')</tt>
 * </li>
 * 
 * <li>
 * 
 * <b>a scale factory</b> - a function that 
 * given the domain values as arguments
 * return a protovis color scale
 * </li>
 * </ul>
 * <p>
 * The default color scheme depends on the 
 * axis domain being discrete or numeric.
 * <p>
 * For 
 * <b>discrete domains</b>, the default value is the 
 * <i>protovis</i>
 * 
 * <tt>category10</tt> color scheme:
 * 
 * <ol style='font-weight:bold'>
 * 
 * <li style='color:#1f77b4'>value</li> 
 * 
 * <li style='color:#ff7f0e'>value</li>
 * 
 * <li style='color:#2ca02c'>value</li>
 * 
 * <li style='color:#d62728'>value</li>
 * 
 * <li style='color:#9467bd'>value</li>
 * 
 * <li style='color:#8c564b'>value</li>
 * 
 * <li style='color:#e377c2'>value</li>
 * 
 * <li style='color:#7f7f7f'>value</li>
 * 
 * <li style='color:#bcbd22'>value</li>
 * 
 * <li style='color:#17becf'>value</li>
 * </ol>
 * <p>
 * For 
 * <b>numeric domains</b>, the default value is the
 * color scheme:
 * 
 * <ol style='font-weight:bold'>
 * 
 * <li style='color:red'>value</li> 
 * 
 * <li style='color:yellow'>value</li>
 * 
 * <li style='color:green'>value</li>
 * </ol>
 * 
 * @type pvc.options.varia.ColorString|pv.Color|list(pvc.options.varia.ColorString|pv.Color)|function
 * @category Scale
 */
pvc.options.axes.ColorAxis.prototype.colors = undefined;
/**
 * The color transform function.
 * <p>
 * Allows applying an effect to the colors that an axis outputs.
 * <p>
 * The default value is 
 * <tt>null</tt> 
 * except for color axes that are used only by one of
 * the 
 * <tt>trend</tt> or 
 * <tt>plot2</tt> plots,
 * and whose 
 * <tt>colors</tt> property was not specified.
 * In these cases, the default value is
 * 
 * <tt>pvc.brighterColorTransform</tt>.
 * 
 * @returns {pv.Color}
 * The transformed color.
 * 
 * @method
 * @this null
 * @param {pv.Color} color
 * The color to transform.
 * 
 * @category Scale
 */
pvc.options.axes.ColorAxis.prototype.transform = function(){};
/**
 * The options documentation class of a color axis
 * that can have either a discrete or numeric domain.
 * <p>
 * See {@link pvc.options.axes.ColorAxis}
 * for additional information.
 * 
 * @class
 * @extends pvc.options.axes.ColorAxis
 */
pvc.options.axes.AnyColorAxis = function(){};
        
        
        
        
/**
 * What happens when the user clicks a legend item
 * (applies to discrete domain axes).
 * <p>
 * Note that when 
 * {@link pvc.options.charts.Chart#hoverable}
 * is 
 * <tt>true</tt>, 
 * the legend item marker will be hoverable.
 * <p>
 * When {@link pvc.options.charts.Chart#selectable}
 * is 
 * <tt>true</tt>, 
 * the legend item marker will be selectable,
 * whatever the value of this property is.
 * In that case, only the label part of the legend marker,
 * will respect this property.
 * 
 * @type pvc.options.varia.LegendClickMode
 * @default 'toggleVisible'
 * @category Discrete > Style
 */
pvc.options.axes.AnyColorAxis.prototype.legendClickMode = undefined;
/**
 * Forces a rule to be shown or not in the marker zone
 * (applies to discrete domain axes).
 * <p>
 * The default value depends on the chart type.
 * 
 * @type boolean
 * @category Discrete > Style
 */
pvc.options.axes.AnyColorAxis.prototype.legendDrawLine = undefined;
/**
 * Forces a shape to be shown or not in the marker zone
 * (applies to discrete domain axes).
 * <p>
 * The default value depends on the chart type.
 * 
 * @type boolean
 * @category Discrete > Style
 */
pvc.options.axes.AnyColorAxis.prototype.legendDrawMarker = undefined;
/**
 * Forces a given shape to be used in the marker zone
 * (applies to discrete domain axes).
 * <p>
 * The default value depends on the chart type.
 * 
 * @type pvc.options.varia.DotShapeType
 * @category Discrete > Style
 */
pvc.options.axes.AnyColorAxis.prototype.legendShape = undefined;
/**
 * Indicates if the legend items of this color axis
 * should be visible
 * (applies to discrete domain axes).
 * 
 * @type boolean
 * @default true
 * @category Discrete > Style
 */
pvc.options.axes.AnyColorAxis.prototype.legendVisible = undefined;
/**
 * The domain values
 * (applies to numeric domain axes).
 * 
 * @type list(pvc.options.varia.ColorString)
 * @category Numeric > Scale
 */
pvc.options.axes.AnyColorAxis.prototype.domain = undefined;
/**
 * The maximum color
 * (applies to numeric domain axes).
 * 
 * @type pvc.options.varia.ColorString|pv.Color
 * @category Numeric > Scale
 */
pvc.options.axes.AnyColorAxis.prototype.max = undefined;
/**
 * The minimum color
 * (applies to numeric domain axes).
 * 
 * @type pvc.options.varia.ColorString|pv.Color
 * @category Numeric > Scale
 */
pvc.options.axes.AnyColorAxis.prototype.min = undefined;
/**
 * The color used for a null domain value
 * (applies to numeric domain axes).
 * <p>
 * The default value is 
 * 
 * <span style='color:#efc5ad;font-weight:bold'>this color</span>.
 * 
 * @type pvc.options.varia.ColorString|pv.Color
 * @default '#efc5ad'
 * @category Numeric > Scale
 */
pvc.options.axes.AnyColorAxis.prototype.missing = undefined;
/**
 * The type of scale to use, 
 * in what concerns the range of the scale
 * (applies to numeric domain axes).
 * 
 * @type pvc.options.varia.ColorScaleType
 * @default 'linear'
 * @category Numeric > Scale
 */
pvc.options.axes.AnyColorAxis.prototype.scaleType = undefined;
/**
 * Indicates if the axis scale is 
 * applied over the absolute value of the domain values
 * (applies to numeric domain axes).
 * 
 * @type boolean
 * @default false
 * @category Numeric > Scale
 */
pvc.options.axes.AnyColorAxis.prototype.useAbs = undefined;
/**
 * The options documentation class of a discrete domain color axis.
 * <p>
 * See {@link pvc.options.axes.ColorAxis}
 * for additional information.
 * 
 * @class
 * @extends pvc.options.axes.ColorAxis
 */
pvc.options.axes.DiscreteColorAxis = function(){};
        
        
        
        
/**
 * What happens when the user clicks a legend item
 * (applies to discrete domain axes).
 * <p>
 * Note that when 
 * {@link pvc.options.charts.Chart#hoverable}
 * is 
 * <tt>true</tt>, 
 * the legend item marker will be hoverable.
 * <p>
 * When {@link pvc.options.charts.Chart#selectable}
 * is 
 * <tt>true</tt>, 
 * the legend item marker will be selectable,
 * whatever the value of this property is.
 * In that case, only the label part of the legend marker,
 * will respect this property.
 * 
 * @type pvc.options.varia.LegendClickMode
 * @default 'toggleVisible'
 * @category Discrete > Style
 */
pvc.options.axes.DiscreteColorAxis.prototype.legendClickMode = undefined;
/**
 * Forces a rule to be shown or not in the marker zone
 * (applies to discrete domain axes).
 * <p>
 * The default value depends on the chart type.
 * 
 * @type boolean
 * @category Discrete > Style
 */
pvc.options.axes.DiscreteColorAxis.prototype.legendDrawLine = undefined;
/**
 * Forces a shape to be shown or not in the marker zone
 * (applies to discrete domain axes).
 * <p>
 * The default value depends on the chart type.
 * 
 * @type boolean
 * @category Discrete > Style
 */
pvc.options.axes.DiscreteColorAxis.prototype.legendDrawMarker = undefined;
/**
 * Forces a given shape to be used in the marker zone
 * (applies to discrete domain axes).
 * <p>
 * The default value depends on the chart type.
 * 
 * @type pvc.options.varia.DotShapeType
 * @category Discrete > Style
 */
pvc.options.axes.DiscreteColorAxis.prototype.legendShape = undefined;
/**
 * Indicates if the legend items of this color axis
 * should be visible
 * (applies to discrete domain axes).
 * 
 * @type boolean
 * @default true
 * @category Discrete > Style
 */
pvc.options.axes.DiscreteColorAxis.prototype.legendVisible = undefined;
/**
 * The options documentation class of the 
 * HeatGrid numeric color axis.
 * <p>
 * See {@link pvc.options.axes.ColorAxis}
 * for additional information.
 * 
 * @class
 * @extends pvc.options.axes.ColorAxis
 */
pvc.options.axes.HeatGridColorAxis = function(){};
        
        
        
        
/**
 * What happens when the user clicks a legend item
 * (applies to discrete domain axes).
 * <p>
 * Note that when 
 * {@link pvc.options.charts.Chart#hoverable}
 * is 
 * <tt>true</tt>, 
 * the legend item marker will be hoverable.
 * <p>
 * When {@link pvc.options.charts.Chart#selectable}
 * is 
 * <tt>true</tt>, 
 * the legend item marker will be selectable,
 * whatever the value of this property is.
 * In that case, only the label part of the legend marker,
 * will respect this property.
 * 
 * @type pvc.options.varia.LegendClickMode
 * @default 'toggleVisible'
 * @category Discrete > Style
 */
pvc.options.axes.HeatGridColorAxis.prototype.legendClickMode = undefined;
/**
 * Forces a rule to be shown or not in the marker zone
 * (applies to discrete domain axes).
 * <p>
 * The default value depends on the chart type.
 * 
 * @type boolean
 * @category Discrete > Style
 */
pvc.options.axes.HeatGridColorAxis.prototype.legendDrawLine = undefined;
/**
 * Forces a shape to be shown or not in the marker zone
 * (applies to discrete domain axes).
 * <p>
 * The default value depends on the chart type.
 * 
 * @type boolean
 * @category Discrete > Style
 */
pvc.options.axes.HeatGridColorAxis.prototype.legendDrawMarker = undefined;
/**
 * Forces a given shape to be used in the marker zone
 * (applies to discrete domain axes).
 * <p>
 * The default value depends on the chart type.
 * 
 * @type pvc.options.varia.DotShapeType
 * @category Discrete > Style
 */
pvc.options.axes.HeatGridColorAxis.prototype.legendShape = undefined;
/**
 * Indicates if the legend items of this color axis
 * should be visible
 * (applies to discrete domain axes).
 * 
 * @type boolean
 * @default true
 * @category Discrete > Style
 */
pvc.options.axes.HeatGridColorAxis.prototype.legendVisible = undefined;
/**
 * The domain values
 * (applies to numeric domain axes).
 * 
 * @type list(pvc.options.varia.ColorString)
 * @category Numeric > Scale
 */
pvc.options.axes.HeatGridColorAxis.prototype.domain = undefined;
/**
 * The maximum color
 * (applies to numeric domain axes).
 * 
 * @type pvc.options.varia.ColorString|pv.Color
 * @category Numeric > Scale
 */
pvc.options.axes.HeatGridColorAxis.prototype.max = undefined;
/**
 * The minimum color
 * (applies to numeric domain axes).
 * 
 * @type pvc.options.varia.ColorString|pv.Color
 * @category Numeric > Scale
 */
pvc.options.axes.HeatGridColorAxis.prototype.min = undefined;
/**
 * The color used for a null domain value
 * (applies to numeric domain axes).
 * <p>
 * The default value is 
 * 
 * <span style='color:#efc5ad;font-weight:bold'>this color</span>.
 * 
 * @type pvc.options.varia.ColorString|pv.Color
 * @default '#efc5ad'
 * @category Numeric > Scale
 */
pvc.options.axes.HeatGridColorAxis.prototype.missing = undefined;
/**
 * The type of scale to use, 
 * in what concerns the range of the scale
 * (applies to numeric domain axes).
 * 
 * @type pvc.options.varia.ColorScaleType
 * @default 'linear'
 * @category Numeric > Scale
 */
pvc.options.axes.HeatGridColorAxis.prototype.scaleType = undefined;
/**
 * Indicates if the axis scale is 
 * applied over the absolute value of the domain values
 * (applies to numeric domain axes).
 * 
 * @type boolean
 * @default false
 * @category Numeric > Scale
 */
pvc.options.axes.HeatGridColorAxis.prototype.useAbs = undefined;
/**
 * A separate scale is used for each category.
 * <p>
 * This property is currently only supported 
 * by the {@link pvc.options.charts.HeatGridChart}.
 * 
 * @type boolean
 * @category Numeric > Scale
 */
pvc.options.axes.HeatGridColorAxis.prototype.normByCategory = undefined;
/**
 * The options documentation class of the size axis.
 * <p>
 * A size axis panel and its properties 
 * can be referred to by using its 
 * <b>full id</b>,
 * which is the word 
 * <tt>size</tt>, 
 * followed by it's index (when >= 2),
 * and terminated by the word 
 * <tt>Axis</tt>
 * (ex: 
 * <tt>sizeAxis</tt>, 
 * <tt>size2Axis</tt>, 
 * <tt>size3Axis</tt>, ...).
 * <p>
 * The domain of size axes 
 * is evaluated at the leaf chart level. 
 * When in a 
 * <i>small multiples</i> chart, 
 * sizes are local to each 
 * <i>small</i> chart.
 * <p>
 * Currently, size axes only support 
 * <i>numeric</i> domain values.
 * 
 * @class
 */
pvc.options.axes.SizeAxis = function(){};
        
        
        
        
/**
 * The fixed maximum domain value that the axis will show (applies to numeric axes).
 * <p>
 * A string value is converted to a number.
 * <p>
 * The value may be bigger or smaller than the actual
 * maximum value of the data.
 * <p>
 * This property takes precedence over the property 
 * <tt>originIsZero</tt>. 
 * 
 * @type number|string
 * @category Numeric > Scale
 */
pvc.options.axes.SizeAxis.prototype.fixedMax = undefined;
/**
 * The fixed minimum domain value that the axis will show
 * (applies to numeric axes).
 * <p>
 * A string value is converted to a number.
 * <p>
 * The value may be bigger or smaller than the actual
 * minimum value of the data.
 * This property takes precedence over the property 
 * <tt>originIsZero</tt>. 
 * 
 * @type number|string
 * @category Numeric > Scale
 */
pvc.options.axes.SizeAxis.prototype.fixedMin = undefined;
/**
 * Indicates if it should be ensured that zero domain value is shown (applies to continuous axes).
 * <p>
 * The properties 
 * 
 * <tt>fixedMin</tt> and 
 * 
 * <tt>fixedMax</tt> have precedence over this one.
 * If this property is 
 * <tt>true</tt>
 * and respecting it would require changing 
 * the minimum value, 
 * but the option 
 * <tt>fixedMin</tt> is also specified,
 * then this property is ignored.
 * The same would apply if 
 * it were required to change 
 * the maximum value,
 * but the property 
 * <tt>fixedMax</tt> was also specified.  
 * 
 * @type boolean
 * @category Numeric > Scale
 */
pvc.options.axes.SizeAxis.prototype.originIsZero = undefined;
/**
 * Indicates if the axis scale is 
 * applied over the absolute value of the domain values
 * (applies to numeric domain axes).
 * 
 * @type boolean
 * @default false
 * @category Numeric > Scale
 */
pvc.options.axes.SizeAxis.prototype.useAbs = undefined;
/**
 * The options documentation class of 
 * the cartesian axis 
 * and cartesian axis panel.
 * <p>
 * A cartesian axis (and its panel) can be referred to in several ways,
 * in order of precedence:
 * 
 * <dl>
 * 
 * <dt>By 
 * <b>id</b></dt>
 * 
 * <dd>the id of the axis is its type followed by it's index (when >= 2)</dd>
 * 
 * <dd>(ex: 
 * <tt>base</tt>, 
 * <tt>ortho</tt>, 
 * <tt>base2</tt>, 
 * <tt>ortho2</tt>, ...)</dd>
 * 
 * <dt>By 
 * <b>oriented id</b></dt>
 * 
 * <dd>the oriented id of the axis is its orientation followed by it's index (when >= 2)</dd>
 * 
 * <dd>(ex: 
 * <tt>x</tt>, 
 * <tt>y</tt>, 
 * <tt>x2</tt>, 
 * <tt>y2</tt>, ...)</dd>
 * 
 * <dt>By 
 * <b>legacy name</b></dt>
 * 
 * <dd>
 * for the special case of the bar chart, 
 * the second axes:
 * 
 * <ul>
 * 
 * <li>
 * 
 * <b>normal properties</b> —
 * may be referred to by the name 
 * <tt>second</tt> 
 * </li>
 * 
 * <li>
 * 
 * <b>extension points</b> —
 * may be referred to by the names 
 * <tt>secondX</tt> and 
 * <tt>secondY</tt>
 * </li>
 * </ul>
 * <p>
 * In any case, those names are now deprecated.
 * </dd>
 * 
 * <dt>By 
 * <b>scale type</b></dt>
 * 
 * <dd>
 * the scale type can be 
 * <tt>discrete</tt> or 
 * <tt>continuous</tt> and, 
 * in the later case, with lower precedence, 
 * 
 * <tt>numeric</tt> and 
 * <tt>timeSeries</tt> are also possible
 * </dd>
 * 
 * <dt>By 
 * <b>catch all name</b></dt>
 * 
 * <dd>the name 
 * <tt>axis</tt> matches any cartesian axis</dd>
 * </dl>
 * <p>
 * These names apply equally to the prefixes used to 
 * build extension point names.
 * <p>
 * Which of the names is used depends on 
 * which better selects the axes for the properties being specified.
 * If a property should only be applied to vertical axes, 
 * independently of the chart's orientation, the 
 * <i>oriented id</i>
 * should be used. 
 * If, otherwise, a property should only be applied to the base axis,
 * whether or not it is horizontally aligned, 
 * then the normal 
 * <i>id</i> should be used.
 * If, a property should only apply to continuous axes,
 * the 
 * <i>scale type</i> should be used.
 * <p>
 * For more information on options
 * that are specific to only certain axis types,
 * please see one of the following concrete sub-classes:
 * 
 * <ul>
 * 
 * <li>
 * Numeric-only axes: {@link pvc.options.axes.NumericCartesianAxis}
 * </li>
 * 
 * <li>
 * Normal discrete: {@link pvc.options.axes.FlattenedDiscreteCartesianAxis}
 * </li>
 * 
 * <li>
 * Numeric or time-series: {@link pvc.options.axes.AnyContinuousCartesianAxis}
 * </li>
 * 
 * <li>
 * Normal or hierarchical discrete:: {@link pvc.options.axes.AnyDiscreteCartesianAxis}
 * </li>
 * 
 * <li>
 * Numeric, time-series or normal discrete: {@link pvc.options.axes.AnyNonHierarchicalCartesianAxis}
 * </li>
 * </ul>
 * 
 * @class
 * @extends pvc.options.panels.Panel
 * @abstract
 */
pvc.options.axes.CartesianAxis = function(){};
        
        
        
        
/**
 * The percentage padding, 
 * on each of the sides of the plot panel
 * that are orthogonal to the axis orientation.
 * <p>
 * The percentage is a number 
 * greater than or equal to 
 * <tt>0</tt> and less than 
 * <tt>1</tt>. 
 * It is relative to length of the plot's side that 
 * has the same direction as the axis.
 * <p>
 * The padded area is useful to leave enough free space 
 * between the plot's visual elements and the axes panels.
 * <p>
 * If an axis is horizontal, 
 * the padding affects the left and right sides,
 * and if it is vertical, 
 * affects the top and bottom sides.
 * <p>
 * If more than one axis of a given orientation specifies an offset, 
 * the maximum specified offset is used.
 * 
 * @type number
 * @default 0
 * @category Layout
 */
pvc.options.axes.CartesianAxis.prototype.offset = undefined;
/**
 * The position of the axis panel.
 * <p>
 * The default value depends on the orientation and index
 * of the axis. 
 * For an horizontal axis, it is 
 * <tt>bottom</tt>.
 * For an vertical axis, it is 
 * <tt>left</tt>.
 * For axes other than the first, 
 * the default side is the opposite of that of the first axis: 
 * 
 * <tt>top</tt> for the horizontal axes and 
 * 
 * <tt>right</tt> for the vertical axes.
 * 
 * @type pvc.options.varia.PanelPosition
 * @category Layout
 */
pvc.options.axes.CartesianAxis.prototype.position = undefined;
/**
 * The fixed size of the panel's orthogonal dimension.
 * <p>
 * If a size object is specified, 
 * only the component orthogonal to the axis orientation is considered.
 * <p>
 * See {@link pvc.options.varia.Size} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Size
 * @category Layout
 */
pvc.options.axes.CartesianAxis.prototype.size = undefined;
/**
 * The maximum size of the panel's orthogonal dimension.
 * <p>
 * If a size object is specified, 
 * only the component orthogonal to the axis orientation is considered.
 * <p>
 * See {@link pvc.options.varia.Size} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Size
 * @category Layout
 */
pvc.options.axes.CartesianAxis.prototype.sizeMax = undefined;
/**
 * Indicates if the axis panel is shown.
 * <p>
 * This property replaces the following 
 * (now deprecated) chart properties:
 * 
 * <ul>
 * 
 * <li>
 * <tt>showXScale</tt></li>
 * 
 * <li>
 * <tt>showYScale</tt></li>
 * 
 * <li>
 * <tt>showSecondScale</tt></li>
 * </ul>
 * 
 * @type boolean
 * @default true
 * @category Layout
 */
pvc.options.axes.CartesianAxis.prototype.visible = undefined;
/**
 * The extension points object contains style definitions for 
 * the marks of the panel.
 * 
 * @type pvc.options.ext.CartesianAxisExtensionPoints
 * @category Style
 */
pvc.options.axes.CartesianAxis.prototype.extensionPoints = undefined;
/**
 * 
 * Indicates if grid rules are drawn.
 * 
 * @deprecated Use {@link #grid} instead.
 * @type boolean
 * @default false
 * @category Style
 */
pvc.options.axes.CartesianAxis.prototype.fullGrid = undefined;
/**
 * Indicates if grid rules are drawn 
 * separating discrete values or
 * at each major continuous tick.
 * 
 * @type boolean
 * @default false
 * @category Style
 */
pvc.options.axes.CartesianAxis.prototype.grid = undefined;
/**
 * The axis title and title options.
 * 
 * @type string|pvc.options.panels.CartesianAxisTitlePanel
 * @category Style
 */
pvc.options.axes.CartesianAxis.prototype.title = undefined;
/**
 * The extension points of the cartesian axis panel.
 * <p>
 * To use an extension point you must find its full name, by joining:
 * 
 * <ol>
 * 
 * <li>panel property name (ex: 
 * <tt>xAxis</tt>)</li>
 * 
 * <li>extension property (ex: 
 * <tt>label</tt>)</li>
 * 
 * <li>the "_" character</li>
 * 
 * <li>extension sub-property (ex: 
 * <tt>textStyle</tt>)</li>
 * </ol>
 * and obtaining, for the examples, the camel-cased name: 
 * <tt>xAxisLabel_textStyle</tt>
 * (see {@link http://en.wikipedia.org/wiki/CamelCase}).
 * 
 * @class
 */
pvc.options.ext.CartesianAxisExtensionPoints = function(){};
        
        
        
        
/**
 * The extension point of the grid line rules.
 * 
 * @type pvc.options.marks.RuleExtensionPoint
 * @category Style
 */
pvc.options.ext.CartesianAxisExtensionPoints.prototype.grid = undefined;
/**
 * The extension point of the tick label mark.
 * 
 * @type pvc.options.marks.LabelExtensionPoint
 * @category Style
 */
pvc.options.ext.CartesianAxisExtensionPoints.prototype.label = undefined;
/**
 * The options documentation class of the cartesian axis panel
 * that cannot be discrete-hierarchical.
 * 
 * @class
 * @extends pvc.options.axes.CartesianAxis
 */
pvc.options.axes.AnyNonHierarchicalCartesianAxis = function(){};
        
        
        
        
/**
 * A callback function that is called
 * when the user clicks on a tick label
 * (applies to discrete axes).
 * 
 * @returns {undefined}
 * @method
 * @this pvc.visual.Context
 * @param {pvc.visual.Scene} scene
 * The scene associated with the visual item.
 * 
 * @category Discrete > Actions
 */
pvc.options.axes.AnyNonHierarchicalCartesianAxis.prototype.clickAction = function(){};
/**
 * A callback function that is called
 * when the user double-clicks on a tick label
 * (applies to discrete axes).
 * 
 * @returns {undefined}
 * @method
 * @this pvc.visual.Context
 * @param {pvc.visual.Scene} scene
 * The scene associated with the visual item.
 * 
 * @category Discrete > Actions
 */
pvc.options.axes.AnyNonHierarchicalCartesianAxis.prototype.doubleClickAction = function(){};
/**
 * Controls the type of scale domain coordination
 * that should be performed 
 * amongst the axes of the same id of each 
 * <i>small chart</i> (applies to continuous axes).
 * <p>
 * The value {@link pvc.options.varia.AxisDomainScope#Row}
 * can only be specified if the axis has vertical orientation.
 * Conversely, 
 * the value {@link pvc.options.varia.AxisDomainScope#Column}
 * can only be specified if the axis has horizontal orientation.
 * 
 * @type pvc.options.varia.AxisDomainScope
 * @category Continuous > Scale
 */
pvc.options.axes.AnyNonHierarchicalCartesianAxis.prototype.domainScope = undefined;
/**
 * The fixed maximum domain value that the axis will show (applies to continuous axes).
 * <p>
 * The value should be convertible to the scale type of the axis.
 * A string value is converted to a number.
 * If a numeric value is obtained and 
 * the scale type is time series,
 * then the number is interpreted as being the result of 
 * the JavaScript's 
 * <tt>Date.getTime()</tt> method.
 * <p>
 * The value may be bigger or smaller than the actual
 * maximum value of the data.
 * <p>
 * When this property is specified, 
 * clipping is activated in the plot panel. 
 * Elements that are drawn beyond its area are clipped.
 * <p>
 * This property takes precedence over the property 
 * <tt>originIsZero</tt>. 
 * 
 * @type number|string|Date
 * @category Continuous > Scale
 */
pvc.options.axes.AnyNonHierarchicalCartesianAxis.prototype.fixedMax = undefined;
/**
 * The fixed minimum domain value that the axis will show (applies to continuous axes).
 * <p>
 * The value should be convertible to the scale type of the axis.
 * A string value is converted to a number.
 * If a numeric value is obtained and 
 * the scale type is time series,
 * then the number is interpreted as being the result of 
 * the JavaScript's 
 * <tt>Date.getTime()</tt> method.
 * <p>
 * The value may be bigger or smaller than the actual
 * minimum value of the data.
 * <p>
 * When this property is specified, 
 * clipping is activated in the plot panel. 
 * Elements that are drawn beyond its area are clipped.
 * <p>
 * This property takes precedence over the property 
 * <tt>originIsZero</tt>. 
 * 
 * @type number|string|Date
 * @category Continuous > Scale
 */
pvc.options.axes.AnyNonHierarchicalCartesianAxis.prototype.fixedMin = undefined;
/**
 * Indicates if it should be ensured that zero domain value is shown (applies to continuous axes).
 * <p>
 * The properties 
 * 
 * <tt>fixedMin</tt> and 
 * 
 * <tt>fixedMax</tt> have precedence over this one.
 * If this property is 
 * <tt>true</tt>
 * and respecting it would require changing 
 * the minimum value, 
 * but the option 
 * <tt>fixedMin</tt> is also specified,
 * then this property is ignored.
 * The same would apply if 
 * it were required to change 
 * the maximum value,
 * but the property 
 * <tt>fixedMax</tt> was also specified.  
 * 
 * @type boolean
 * @category Continuous > Scale
 */
pvc.options.axes.AnyNonHierarchicalCartesianAxis.prototype.originIsZero = undefined;
/**
 * Indicates if minor ticks are shown between major ticks (applies to continuous axes). 
 * 
 * @type boolean
 * @default true
 * @category Continuous > Style
 */
pvc.options.axes.AnyNonHierarchicalCartesianAxis.prototype.minorTicks = undefined;
/**
 * A tick formatter function (applies to continuous axes).
 * 
 * @returns {string}
 * The string that is the formatted value.
 * 
 * @method
 * @this null
 * @param {number|Date} value
 * The value to format.
 * 
 * @param {number} precision
 * The precision in which value should be formatted.
 * <p>
 * When the axis has a 
 * <tt>timeSeries</tt> scale type,
 * the argument is the chosen 
 * number of milliseconds between tick values.
 * The standard precisions are:
 * 
 * <dl>
 * 
 * <dt>
 * <tt>31536e6</tt></dt>
 * <dd>1 year</dd>
 * 
 * <dt>
 * <tt>2592e6</tt></dt>
 * <dd>30 days</dd>
 * 
 * <dt>
 * <tt>6048e5</tt></dt>
 * <dd>7 days</dd>
 * 
 * <dt>
 * <tt>864e5</tt></dt>
 * <dd>1 day</dd>
 * 
 * <dt>
 * <tt>36e5</tt></dt>
 * <dd>1 hour</dd>
 * 
 * <dt>
 * <tt>6e4</tt></dt>
 * <dd>1 minute</dd>
 * 
 * <dt>
 * <tt>1e3</tt></dt>
 * <dd>1 second</dd>
 * 
 * <dt>
 * <tt>1</tt></dt>
 * <dd>1 millisecond</dd>
 * </dl>
 * <p>
 * When the axis has a 
 * <tt>numeric</tt> scale type,
 * the argument is the number of decimal places of the 
 * chosen step value. 
 * 
 * @category Continuous > Style
 */
pvc.options.axes.AnyNonHierarchicalCartesianAxis.prototype.tickFormatter = function(){};
/**
 * The 
 * <i>desired</i> number of major ticks (applies to continuous-numeric axes).
 * <p>
 * When specified the tick calculation algorithm chooses, 
 * amongst possible tick steps, 
 * the one that results in a number of ticks
 * that is closest to the specified value.
 * <p>
 * When unspecified, 
 * an 
 * <i>optimum</i> number of ticks is 
 * determined by taking 
 * the 
 * available space,
 * label font size,
 * minimum label spacing and
 * into account.
 * 
 * @type number
 * @category Continuous-Numeric > Style
 */
pvc.options.axes.AnyNonHierarchicalCartesianAxis.prototype.desiredTickCount = undefined;
/**
 * The axis' domain rounding mode (applies to continuous-numeric axes).
 * 
 * @type pvc.options.varia.AxisDomainRoundingMode
 * @default 'tick'
 * @category Continuous-Numeric > Style
 */
pvc.options.axes.AnyNonHierarchicalCartesianAxis.prototype.domainRoundMode = undefined;
/**
 * The maximum exponent of 
 * <tt>10</tt> that is used to generate ticks (applies to continuous-numeric axes).
 * <p>
 * The generated ticks are separated by a 
 * <i>step</i> value.
 * A step value is a certain power of 
 * <tt>10</tt>,
 * possibly multiplied by 
 * <tt>2</tt> or 
 * <tt>5</tt>.
 * <p>
 * For example, 
 * for a chosen exponent of 
 * <tt>4</tt>,
 * the corresponding power of 
 * <tt>10</tt> is 
 * <tt>10^4=10000</tt> and
 * the generated ticks could be:
 * 
 * <tt>0</tt>, 
 * <tt>10000</tt>, 
 * <tt>20000</tt>, ...
 * <p>
 * If the multiplier 
 * <tt>5</tt> was chosen, 
 * those ticks would instead be:
 * 
 * <tt>0</tt>, 
 * <tt>50000</tt>, 
 * <tt>100000</tt>, ...
 * <p>
 * Setting this property allows imposing a limit on 
 * the size of numbers chosen to separate ticks,
 * which may be seen as imposing a minimum granularity 
 * on the generated tick values.
 * 
 * @type number
 * @category Continuous-Numeric > Style
 */
pvc.options.axes.AnyNonHierarchicalCartesianAxis.prototype.tickExponentMax = undefined;
/**
 * The minimum exponent of 
 * <tt>10</tt> that is used to generate ticks (applies to continuous-numeric axes).
 * <p>
 * The generated ticks are separated by a 
 * <i>step</i> value.
 * A step value is a certain power of 
 * <tt>10</tt>,
 * possibly multiplied by 
 * <tt>2</tt> or 
 * <tt>5</tt>.
 * <p>
 * For example, 
 * for a chosen exponent of 
 * <tt>2</tt>,
 * the corresponding power of 
 * <tt>10</tt> is 
 * <tt>10^2=100</tt> and
 * the generated ticks could be:
 * 
 * <tt>0</tt>, 
 * <tt>100</tt>, 
 * <tt>200</tt>, ...
 * <p>
 * If the multiplier 
 * <tt>2</tt> was chosen, 
 * those ticks would instead be:
 * 
 * <tt>0</tt>, 
 * <tt>200</tt>, 
 * <tt>400</tt>, ...
 * <p>
 * Setting this property to 
 * <tt>2</tt> would ensure 
 * that generated ticks would be separated by the step values
 * 
 * <tt>100</tt>, 
 * <tt>200</tt> or 
 * <tt>500</tt>,
 * or by steps whose corresponding exponent is 
 * bigger than 
 * <tt>2</tt>, 
 * like: 
 * <tt>1000</tt>, 
 * <tt>2000</tt> or 
 * <tt>5000</tt>.
 * <p>
 * A more typical use case is ensuring that generated ticks are integers.
 * A value of 
 * <tt>tickExponentMin</tt> of 
 * <tt>0</tt> would accomplish that.
 * <p>
 * Generally, 
 * to impose a maximum number of decimal places on the generated ticks, 
 * a negative number can be specified.
 * For example, the value 
 * <tt>-1</tt> could generate the ticks:
 * 
 * <tt>0.1</tt>, 
 * <tt>0.2</tt>, 
 * <tt>0.3</tt>, ...
 * If the multiplier 
 * <tt>5</tt> was chosen, 
 * those ticks would instead be:
 * 
 * <tt>0.5</tt>, 
 * <tt>1.0</tt>, 
 * <tt>1.5</tt>, ...
 * It could not generate ticks 
 * with more that one decimal place.
 * 
 * @type number
 * @category Continuous-Numeric > Style
 */
pvc.options.axes.AnyNonHierarchicalCartesianAxis.prototype.tickExponentMin = undefined;
/**
 * Indicates if the zero line rule is drawn, 
 * on the position of the 0-valued tick, 
 * when there is one (applies to continuous-numeric axes).
 * <p>
 * An horizontal axis has a vertical zero line rule,
 * while a a vertical axis has an horizontal zero line rule.
 * 
 * @type boolean
 * @default true
 * @category Continuous-Numeric > Style
 */
pvc.options.axes.AnyNonHierarchicalCartesianAxis.prototype.zeroLine = undefined;
/**
 * The minimum spacing between tick labels, in 
 * <i>em</i> units 
 * (does not apply to discrete-hierarchical axes).
 * 
 * @type number
 * @category Non-Hierarchical > Layout
 */
pvc.options.axes.AnyNonHierarchicalCartesianAxis.prototype.labelSpacingMin = undefined;
/**
 * Controls how labels are laid out when they overlap 
 * (does not apply to discrete-hierarchical axes).
 * 
 * @type pvc.options.varia.AxisOverlappedLabelsMode
 * @default 'hide'
 * @category Non-Hierarchical > Layout
 */
pvc.options.axes.AnyNonHierarchicalCartesianAxis.prototype.overlappedLabelsMode = undefined;
/**
 * Indicates if ticks are shown for each tick value 
 * (does not apply to discrete-hierarchical axes).
 * 
 * @type boolean
 * @default true
 * @category Non-Hierarchical > Style
 */
pvc.options.axes.AnyNonHierarchicalCartesianAxis.prototype.ticks = undefined;
/**
 * The extension points object contains style definitions for 
 * the marks of the panel.
 * 
 * @type pvc.options.ext.AnyNonHierarchicalCartesianAxisExtensionPoints
 * @category Style
 */
pvc.options.axes.AnyNonHierarchicalCartesianAxis.prototype.extensionPoints = undefined;
/**
 * The extension points of the cartesian axis panel 
 * that cannot be discrete-hierarchical.
 * <p>
 * To use an extension point you must find its full name, by joining:
 * 
 * <ol>
 * 
 * <li>panel property name (ex: 
 * <tt>xAxis</tt>)</li>
 * 
 * <li>extension property (ex: 
 * <tt>zeroLine</tt>)</li>
 * 
 * <li>the "_" character</li>
 * 
 * <li>extension sub-property (ex: 
 * <tt>lineWidth</tt>)</li>
 * </ol>
 * and obtaining, for the examples, the camel-cased name: 
 * <tt>xAxisZeroLine_lineWidth</tt>
 * (see {@link http://en.wikipedia.org/wiki/CamelCase}).
 * 
 * @class
 * @extends pvc.options.ext.CartesianAxisExtensionPoints
 */
pvc.options.ext.AnyNonHierarchicalCartesianAxisExtensionPoints = function(){};
        
        
        
        
/**
 * The extension point of a 
 * <i>minor</i> tick rule mark (applies to continuous axes).
 * 
 * @type pvc.options.marks.RuleExtensionPoint
 * @category Continuous > Style
 */
pvc.options.ext.AnyNonHierarchicalCartesianAxisExtensionPoints.prototype.minorTicks = undefined;
/**
 * The extension point of the zero line rule (applies to continuous-numeric axes).
 * 
 * @type pvc.options.marks.RuleExtensionPoint
 * @category Continuous-Numeric > Style
 */
pvc.options.ext.AnyNonHierarchicalCartesianAxisExtensionPoints.prototype.zeroLine = undefined;
/**
 * The extension point of a discrete,
 * or continuous 
 * <i>major</i>,
 * tick rule mark (does not apply to discrete-hierarchical axes).
 * 
 * @type pvc.options.marks.RuleExtensionPoint
 * @category Non-Hierarchical > Style
 */
pvc.options.ext.AnyNonHierarchicalCartesianAxisExtensionPoints.prototype.ticks = undefined;
/**
 * The extension point of the tick panel 
 * (does not apply to discrete-hierarchical axes).
 * <p>
 * One tick panel contains one tick rule and one label.
 * It can be used to conveniently hide all the elements 
 * of a tick simultaneously.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 * @category Non-Hierarchical > Style
 */
pvc.options.ext.AnyNonHierarchicalCartesianAxisExtensionPoints.prototype.ticksPanel = undefined;
/**
 * The options documentation class of the cartesian axis panel
 * for discrete scale type.
 * <p>
 * For additional information, please see {@link pvc.options.axes.CartesianAxis}.
 * 
 * @class
 * @extends pvc.options.axes.CartesianAxis
 * @abstract
 */
pvc.options.axes.DiscreteCartesianAxis = function(){};
        
        
        
        
/**
 * A callback function that is called
 * when the user clicks on a tick label
 * (applies to discrete axes).
 * 
 * @returns {undefined}
 * @method
 * @this pvc.visual.Context
 * @param {pvc.visual.Scene} scene
 * The scene associated with the visual item.
 * 
 * @category Discrete > Actions
 */
pvc.options.axes.DiscreteCartesianAxis.prototype.clickAction = function(){};
/**
 * A callback function that is called
 * when the user double-clicks on a tick label
 * (applies to discrete axes).
 * 
 * @returns {undefined}
 * @method
 * @this pvc.visual.Context
 * @param {pvc.visual.Scene} scene
 * The scene associated with the visual item.
 * 
 * @category Discrete > Actions
 */
pvc.options.axes.DiscreteCartesianAxis.prototype.doubleClickAction = function(){};
/**
 * The options documentation class of the cartesian axis panel
 * for flattened and discrete scale type.
 * <p>
 * For additional information, please see {@link pvc.options.axes.CartesianAxis}.
 * 
 * @class
 * @extends pvc.options.axes.DiscreteCartesianAxis
 */
pvc.options.axes.FlattenedDiscreteCartesianAxis = function(){};
        
        
        
        
/**
 * The minimum spacing between tick labels, in 
 * <i>em</i> units 
 * (does not apply to discrete-hierarchical axes).
 * 
 * @type number
 * @category Non-Hierarchical > Layout
 */
pvc.options.axes.FlattenedDiscreteCartesianAxis.prototype.labelSpacingMin = undefined;
/**
 * Controls how labels are laid out when they overlap 
 * (does not apply to discrete-hierarchical axes).
 * 
 * @type pvc.options.varia.AxisOverlappedLabelsMode
 * @default 'hide'
 * @category Non-Hierarchical > Layout
 */
pvc.options.axes.FlattenedDiscreteCartesianAxis.prototype.overlappedLabelsMode = undefined;
/**
 * Indicates if ticks are shown for each tick value 
 * (does not apply to discrete-hierarchical axes).
 * 
 * @type boolean
 * @default true
 * @category Non-Hierarchical > Style
 */
pvc.options.axes.FlattenedDiscreteCartesianAxis.prototype.ticks = undefined;
/**
 * The options documentation class of the cartesian axis panel
 * for discrete scale type.
 * <p>
 * For additional information, please see {@link pvc.options.axes.CartesianAxis}.
 * 
 * @class
 * @extends pvc.options.axes.DiscreteCartesianAxis
 */
pvc.options.axes.AnyDiscreteCartesianAxis = function(){};
        
        
        
        
/**
 * The minimum spacing between tick labels, in 
 * <i>em</i> units 
 * (does not apply to discrete-hierarchical axes).
 * 
 * @type number
 * @category Non-Hierarchical > Layout
 */
pvc.options.axes.AnyDiscreteCartesianAxis.prototype.labelSpacingMin = undefined;
/**
 * Controls how labels are laid out when they overlap 
 * (does not apply to discrete-hierarchical axes).
 * 
 * @type pvc.options.varia.AxisOverlappedLabelsMode
 * @default 'hide'
 * @category Non-Hierarchical > Layout
 */
pvc.options.axes.AnyDiscreteCartesianAxis.prototype.overlappedLabelsMode = undefined;
/**
 * Indicates if ticks are shown for each tick value 
 * (does not apply to discrete-hierarchical axes).
 * 
 * @type boolean
 * @default true
 * @category Non-Hierarchical > Style
 */
pvc.options.axes.AnyDiscreteCartesianAxis.prototype.ticks = undefined;
/**
 * Indicates if the axis should show 
 * discrete multi-dimensional data in 
 * a hierarchical form, when 
 * <tt>true</tt>,
 * or a flattened form, when 
 * <tt>false</tt>
 * (applies to discrete axes).
 * <p>
 * Flattened axes, present multi-dimensional roles
 * by joining the multiple values with a separator character.
 * 
 * @type boolean
 * @default false
 * @category Discrete > General
 */
pvc.options.axes.AnyDiscreteCartesianAxis.prototype.composite = undefined;
/**
 * The options documentation class of the cartesian axis panel
 * for continuous scale types.
 * <p>
 * For additional information, please see {@link pvc.options.axes.CartesianAxis}.
 * 
 * @class
 * @extends pvc.options.axes.CartesianAxis
 */
pvc.options.axes.AnyContinuousCartesianAxis = function(){};
        
        
        
        
/**
 * Controls the type of scale domain coordination
 * that should be performed 
 * amongst the axes of the same id of each 
 * <i>small chart</i> (applies to continuous axes).
 * <p>
 * The value {@link pvc.options.varia.AxisDomainScope#Row}
 * can only be specified if the axis has vertical orientation.
 * Conversely, 
 * the value {@link pvc.options.varia.AxisDomainScope#Column}
 * can only be specified if the axis has horizontal orientation.
 * 
 * @type pvc.options.varia.AxisDomainScope
 * @category Continuous > Scale
 */
pvc.options.axes.AnyContinuousCartesianAxis.prototype.domainScope = undefined;
/**
 * The fixed maximum domain value that the axis will show (applies to continuous axes).
 * <p>
 * The value should be convertible to the scale type of the axis.
 * A string value is converted to a number.
 * If a numeric value is obtained and 
 * the scale type is time series,
 * then the number is interpreted as being the result of 
 * the JavaScript's 
 * <tt>Date.getTime()</tt> method.
 * <p>
 * The value may be bigger or smaller than the actual
 * maximum value of the data.
 * <p>
 * When this property is specified, 
 * clipping is activated in the plot panel. 
 * Elements that are drawn beyond its area are clipped.
 * <p>
 * This property takes precedence over the property 
 * <tt>originIsZero</tt>. 
 * 
 * @type number|string|Date
 * @category Continuous > Scale
 */
pvc.options.axes.AnyContinuousCartesianAxis.prototype.fixedMax = undefined;
/**
 * The fixed minimum domain value that the axis will show (applies to continuous axes).
 * <p>
 * The value should be convertible to the scale type of the axis.
 * A string value is converted to a number.
 * If a numeric value is obtained and 
 * the scale type is time series,
 * then the number is interpreted as being the result of 
 * the JavaScript's 
 * <tt>Date.getTime()</tt> method.
 * <p>
 * The value may be bigger or smaller than the actual
 * minimum value of the data.
 * <p>
 * When this property is specified, 
 * clipping is activated in the plot panel. 
 * Elements that are drawn beyond its area are clipped.
 * <p>
 * This property takes precedence over the property 
 * <tt>originIsZero</tt>. 
 * 
 * @type number|string|Date
 * @category Continuous > Scale
 */
pvc.options.axes.AnyContinuousCartesianAxis.prototype.fixedMin = undefined;
/**
 * Indicates if it should be ensured that zero domain value is shown (applies to continuous axes).
 * <p>
 * The properties 
 * 
 * <tt>fixedMin</tt> and 
 * 
 * <tt>fixedMax</tt> have precedence over this one.
 * If this property is 
 * <tt>true</tt>
 * and respecting it would require changing 
 * the minimum value, 
 * but the option 
 * <tt>fixedMin</tt> is also specified,
 * then this property is ignored.
 * The same would apply if 
 * it were required to change 
 * the maximum value,
 * but the property 
 * <tt>fixedMax</tt> was also specified.  
 * 
 * @type boolean
 * @category Continuous > Scale
 */
pvc.options.axes.AnyContinuousCartesianAxis.prototype.originIsZero = undefined;
/**
 * Indicates if minor ticks are shown between major ticks (applies to continuous axes). 
 * 
 * @type boolean
 * @default true
 * @category Continuous > Style
 */
pvc.options.axes.AnyContinuousCartesianAxis.prototype.minorTicks = undefined;
/**
 * A tick formatter function (applies to continuous axes).
 * 
 * @returns {string}
 * The string that is the formatted value.
 * 
 * @method
 * @this null
 * @param {number|Date} value
 * The value to format.
 * 
 * @param {number} precision
 * The precision in which value should be formatted.
 * <p>
 * When the axis has a 
 * <tt>timeSeries</tt> scale type,
 * the argument is the chosen 
 * number of milliseconds between tick values.
 * The standard precisions are:
 * 
 * <dl>
 * 
 * <dt>
 * <tt>31536e6</tt></dt>
 * <dd>1 year</dd>
 * 
 * <dt>
 * <tt>2592e6</tt></dt>
 * <dd>30 days</dd>
 * 
 * <dt>
 * <tt>6048e5</tt></dt>
 * <dd>7 days</dd>
 * 
 * <dt>
 * <tt>864e5</tt></dt>
 * <dd>1 day</dd>
 * 
 * <dt>
 * <tt>36e5</tt></dt>
 * <dd>1 hour</dd>
 * 
 * <dt>
 * <tt>6e4</tt></dt>
 * <dd>1 minute</dd>
 * 
 * <dt>
 * <tt>1e3</tt></dt>
 * <dd>1 second</dd>
 * 
 * <dt>
 * <tt>1</tt></dt>
 * <dd>1 millisecond</dd>
 * </dl>
 * <p>
 * When the axis has a 
 * <tt>numeric</tt> scale type,
 * the argument is the number of decimal places of the 
 * chosen step value. 
 * 
 * @category Continuous > Style
 */
pvc.options.axes.AnyContinuousCartesianAxis.prototype.tickFormatter = function(){};
/**
 * The 
 * <i>desired</i> number of major ticks (applies to continuous-numeric axes).
 * <p>
 * When specified the tick calculation algorithm chooses, 
 * amongst possible tick steps, 
 * the one that results in a number of ticks
 * that is closest to the specified value.
 * <p>
 * When unspecified, 
 * an 
 * <i>optimum</i> number of ticks is 
 * determined by taking 
 * the 
 * available space,
 * label font size,
 * minimum label spacing and
 * into account.
 * 
 * @type number
 * @category Continuous-Numeric > Style
 */
pvc.options.axes.AnyContinuousCartesianAxis.prototype.desiredTickCount = undefined;
/**
 * The axis' domain rounding mode (applies to continuous-numeric axes).
 * 
 * @type pvc.options.varia.AxisDomainRoundingMode
 * @default 'tick'
 * @category Continuous-Numeric > Style
 */
pvc.options.axes.AnyContinuousCartesianAxis.prototype.domainRoundMode = undefined;
/**
 * The maximum exponent of 
 * <tt>10</tt> that is used to generate ticks (applies to continuous-numeric axes).
 * <p>
 * The generated ticks are separated by a 
 * <i>step</i> value.
 * A step value is a certain power of 
 * <tt>10</tt>,
 * possibly multiplied by 
 * <tt>2</tt> or 
 * <tt>5</tt>.
 * <p>
 * For example, 
 * for a chosen exponent of 
 * <tt>4</tt>,
 * the corresponding power of 
 * <tt>10</tt> is 
 * <tt>10^4=10000</tt> and
 * the generated ticks could be:
 * 
 * <tt>0</tt>, 
 * <tt>10000</tt>, 
 * <tt>20000</tt>, ...
 * <p>
 * If the multiplier 
 * <tt>5</tt> was chosen, 
 * those ticks would instead be:
 * 
 * <tt>0</tt>, 
 * <tt>50000</tt>, 
 * <tt>100000</tt>, ...
 * <p>
 * Setting this property allows imposing a limit on 
 * the size of numbers chosen to separate ticks,
 * which may be seen as imposing a minimum granularity 
 * on the generated tick values.
 * 
 * @type number
 * @category Continuous-Numeric > Style
 */
pvc.options.axes.AnyContinuousCartesianAxis.prototype.tickExponentMax = undefined;
/**
 * The minimum exponent of 
 * <tt>10</tt> that is used to generate ticks (applies to continuous-numeric axes).
 * <p>
 * The generated ticks are separated by a 
 * <i>step</i> value.
 * A step value is a certain power of 
 * <tt>10</tt>,
 * possibly multiplied by 
 * <tt>2</tt> or 
 * <tt>5</tt>.
 * <p>
 * For example, 
 * for a chosen exponent of 
 * <tt>2</tt>,
 * the corresponding power of 
 * <tt>10</tt> is 
 * <tt>10^2=100</tt> and
 * the generated ticks could be:
 * 
 * <tt>0</tt>, 
 * <tt>100</tt>, 
 * <tt>200</tt>, ...
 * <p>
 * If the multiplier 
 * <tt>2</tt> was chosen, 
 * those ticks would instead be:
 * 
 * <tt>0</tt>, 
 * <tt>200</tt>, 
 * <tt>400</tt>, ...
 * <p>
 * Setting this property to 
 * <tt>2</tt> would ensure 
 * that generated ticks would be separated by the step values
 * 
 * <tt>100</tt>, 
 * <tt>200</tt> or 
 * <tt>500</tt>,
 * or by steps whose corresponding exponent is 
 * bigger than 
 * <tt>2</tt>, 
 * like: 
 * <tt>1000</tt>, 
 * <tt>2000</tt> or 
 * <tt>5000</tt>.
 * <p>
 * A more typical use case is ensuring that generated ticks are integers.
 * A value of 
 * <tt>tickExponentMin</tt> of 
 * <tt>0</tt> would accomplish that.
 * <p>
 * Generally, 
 * to impose a maximum number of decimal places on the generated ticks, 
 * a negative number can be specified.
 * For example, the value 
 * <tt>-1</tt> could generate the ticks:
 * 
 * <tt>0.1</tt>, 
 * <tt>0.2</tt>, 
 * <tt>0.3</tt>, ...
 * If the multiplier 
 * <tt>5</tt> was chosen, 
 * those ticks would instead be:
 * 
 * <tt>0.5</tt>, 
 * <tt>1.0</tt>, 
 * <tt>1.5</tt>, ...
 * It could not generate ticks 
 * with more that one decimal place.
 * 
 * @type number
 * @category Continuous-Numeric > Style
 */
pvc.options.axes.AnyContinuousCartesianAxis.prototype.tickExponentMin = undefined;
/**
 * Indicates if the zero line rule is drawn, 
 * on the position of the 0-valued tick, 
 * when there is one (applies to continuous-numeric axes).
 * <p>
 * An horizontal axis has a vertical zero line rule,
 * while a a vertical axis has an horizontal zero line rule.
 * 
 * @type boolean
 * @default true
 * @category Continuous-Numeric > Style
 */
pvc.options.axes.AnyContinuousCartesianAxis.prototype.zeroLine = undefined;
/**
 * The minimum spacing between tick labels, in 
 * <i>em</i> units 
 * (does not apply to discrete-hierarchical axes).
 * 
 * @type number
 * @category Non-Hierarchical > Layout
 */
pvc.options.axes.AnyContinuousCartesianAxis.prototype.labelSpacingMin = undefined;
/**
 * Controls how labels are laid out when they overlap 
 * (does not apply to discrete-hierarchical axes).
 * 
 * @type pvc.options.varia.AxisOverlappedLabelsMode
 * @default 'hide'
 * @category Non-Hierarchical > Layout
 */
pvc.options.axes.AnyContinuousCartesianAxis.prototype.overlappedLabelsMode = undefined;
/**
 * Indicates if ticks are shown for each tick value 
 * (does not apply to discrete-hierarchical axes).
 * 
 * @type boolean
 * @default true
 * @category Non-Hierarchical > Style
 */
pvc.options.axes.AnyContinuousCartesianAxis.prototype.ticks = undefined;
/**
 * The extension points object contains style definitions for 
 * the marks of the panel.
 * 
 * @type pvc.options.ext.AnyContinuousCartesianAxisExtensionPoints
 * @category Style
 */
pvc.options.axes.AnyContinuousCartesianAxis.prototype.extensionPoints = undefined;
/**
 * The extension points of the cartesian axis panel for continuous scale types.
 * <p>
 * To use an extension point you must find its full name, by joining:
 * 
 * <ol>
 * 
 * <li>panel property name (ex: 
 * <tt>xAxis</tt>)</li>
 * 
 * <li>extension property (ex: 
 * <tt>zeroLine</tt>)</li>
 * 
 * <li>the "_" character</li>
 * 
 * <li>extension sub-property (ex: 
 * <tt>lineWidth</tt>)</li>
 * </ol>
 * and obtaining, for the examples, the camel-cased name: 
 * <tt>xAxisZeroLine_lineWidth</tt>
 * (see {@link http://en.wikipedia.org/wiki/CamelCase}).
 * 
 * @class
 * @extends pvc.options.ext.CartesianAxisExtensionPoints
 */
pvc.options.ext.AnyContinuousCartesianAxisExtensionPoints = function(){};
        
        
        
        
/**
 * The extension point of a 
 * <i>minor</i> tick rule mark (applies to continuous axes).
 * 
 * @type pvc.options.marks.RuleExtensionPoint
 * @category Continuous > Style
 */
pvc.options.ext.AnyContinuousCartesianAxisExtensionPoints.prototype.minorTicks = undefined;
/**
 * The extension point of the zero line rule (applies to continuous-numeric axes).
 * 
 * @type pvc.options.marks.RuleExtensionPoint
 * @category Continuous-Numeric > Style
 */
pvc.options.ext.AnyContinuousCartesianAxisExtensionPoints.prototype.zeroLine = undefined;
/**
 * The extension point of a discrete,
 * or continuous 
 * <i>major</i>,
 * tick rule mark (does not apply to discrete-hierarchical axes).
 * 
 * @type pvc.options.marks.RuleExtensionPoint
 * @category Non-Hierarchical > Style
 */
pvc.options.ext.AnyContinuousCartesianAxisExtensionPoints.prototype.ticks = undefined;
/**
 * The extension point of the tick panel 
 * (does not apply to discrete-hierarchical axes).
 * <p>
 * One tick panel contains one tick rule and one label.
 * It can be used to conveniently hide all the elements 
 * of a tick simultaneously.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 * @category Non-Hierarchical > Style
 */
pvc.options.ext.AnyContinuousCartesianAxisExtensionPoints.prototype.ticksPanel = undefined;
/**
 * The options documentation class of the cartesian axis panel
 * for continuous scale types.
 * <p>
 * For additional information, please see {@link pvc.options.axes.CartesianAxis}.
 * 
 * @class
 * @extends pvc.options.axes.CartesianAxis
 */
pvc.options.axes.NumericCartesianAxis = function(){};
        
        
        
        
/**
 * Controls the type of scale domain coordination
 * that should be performed 
 * amongst the axes of the same id of each 
 * <i>small chart</i> (applies to continuous axes).
 * <p>
 * The value {@link pvc.options.varia.AxisDomainScope#Row}
 * can only be specified if the axis has vertical orientation.
 * Conversely, 
 * the value {@link pvc.options.varia.AxisDomainScope#Column}
 * can only be specified if the axis has horizontal orientation.
 * 
 * @type pvc.options.varia.AxisDomainScope
 * @category Continuous > Scale
 */
pvc.options.axes.NumericCartesianAxis.prototype.domainScope = undefined;
/**
 * The fixed maximum domain value that the axis will show (applies to continuous axes).
 * <p>
 * The value should be convertible to the scale type of the axis.
 * A string value is converted to a number.
 * If a numeric value is obtained and 
 * the scale type is time series,
 * then the number is interpreted as being the result of 
 * the JavaScript's 
 * <tt>Date.getTime()</tt> method.
 * <p>
 * The value may be bigger or smaller than the actual
 * maximum value of the data.
 * <p>
 * When this property is specified, 
 * clipping is activated in the plot panel. 
 * Elements that are drawn beyond its area are clipped.
 * <p>
 * This property takes precedence over the property 
 * <tt>originIsZero</tt>. 
 * 
 * @type number|string|Date
 * @category Continuous > Scale
 */
pvc.options.axes.NumericCartesianAxis.prototype.fixedMax = undefined;
/**
 * The fixed minimum domain value that the axis will show (applies to continuous axes).
 * <p>
 * The value should be convertible to the scale type of the axis.
 * A string value is converted to a number.
 * If a numeric value is obtained and 
 * the scale type is time series,
 * then the number is interpreted as being the result of 
 * the JavaScript's 
 * <tt>Date.getTime()</tt> method.
 * <p>
 * The value may be bigger or smaller than the actual
 * minimum value of the data.
 * <p>
 * When this property is specified, 
 * clipping is activated in the plot panel. 
 * Elements that are drawn beyond its area are clipped.
 * <p>
 * This property takes precedence over the property 
 * <tt>originIsZero</tt>. 
 * 
 * @type number|string|Date
 * @category Continuous > Scale
 */
pvc.options.axes.NumericCartesianAxis.prototype.fixedMin = undefined;
/**
 * Indicates if it should be ensured that zero domain value is shown (applies to continuous axes).
 * <p>
 * The properties 
 * 
 * <tt>fixedMin</tt> and 
 * 
 * <tt>fixedMax</tt> have precedence over this one.
 * If this property is 
 * <tt>true</tt>
 * and respecting it would require changing 
 * the minimum value, 
 * but the option 
 * <tt>fixedMin</tt> is also specified,
 * then this property is ignored.
 * The same would apply if 
 * it were required to change 
 * the maximum value,
 * but the property 
 * <tt>fixedMax</tt> was also specified.  
 * 
 * @type boolean
 * @category Continuous > Scale
 */
pvc.options.axes.NumericCartesianAxis.prototype.originIsZero = undefined;
/**
 * Indicates if minor ticks are shown between major ticks (applies to continuous axes). 
 * 
 * @type boolean
 * @default true
 * @category Continuous > Style
 */
pvc.options.axes.NumericCartesianAxis.prototype.minorTicks = undefined;
/**
 * A tick formatter function (applies to continuous axes).
 * 
 * @returns {string}
 * The string that is the formatted value.
 * 
 * @method
 * @this null
 * @param {number|Date} value
 * The value to format.
 * 
 * @param {number} precision
 * The precision in which value should be formatted.
 * <p>
 * When the axis has a 
 * <tt>timeSeries</tt> scale type,
 * the argument is the chosen 
 * number of milliseconds between tick values.
 * The standard precisions are:
 * 
 * <dl>
 * 
 * <dt>
 * <tt>31536e6</tt></dt>
 * <dd>1 year</dd>
 * 
 * <dt>
 * <tt>2592e6</tt></dt>
 * <dd>30 days</dd>
 * 
 * <dt>
 * <tt>6048e5</tt></dt>
 * <dd>7 days</dd>
 * 
 * <dt>
 * <tt>864e5</tt></dt>
 * <dd>1 day</dd>
 * 
 * <dt>
 * <tt>36e5</tt></dt>
 * <dd>1 hour</dd>
 * 
 * <dt>
 * <tt>6e4</tt></dt>
 * <dd>1 minute</dd>
 * 
 * <dt>
 * <tt>1e3</tt></dt>
 * <dd>1 second</dd>
 * 
 * <dt>
 * <tt>1</tt></dt>
 * <dd>1 millisecond</dd>
 * </dl>
 * <p>
 * When the axis has a 
 * <tt>numeric</tt> scale type,
 * the argument is the number of decimal places of the 
 * chosen step value. 
 * 
 * @category Continuous > Style
 */
pvc.options.axes.NumericCartesianAxis.prototype.tickFormatter = function(){};
/**
 * The 
 * <i>desired</i> number of major ticks (applies to continuous-numeric axes).
 * <p>
 * When specified the tick calculation algorithm chooses, 
 * amongst possible tick steps, 
 * the one that results in a number of ticks
 * that is closest to the specified value.
 * <p>
 * When unspecified, 
 * an 
 * <i>optimum</i> number of ticks is 
 * determined by taking 
 * the 
 * available space,
 * label font size,
 * minimum label spacing and
 * into account.
 * 
 * @type number
 * @category Continuous-Numeric > Style
 */
pvc.options.axes.NumericCartesianAxis.prototype.desiredTickCount = undefined;
/**
 * The axis' domain rounding mode (applies to continuous-numeric axes).
 * 
 * @type pvc.options.varia.AxisDomainRoundingMode
 * @default 'tick'
 * @category Continuous-Numeric > Style
 */
pvc.options.axes.NumericCartesianAxis.prototype.domainRoundMode = undefined;
/**
 * The maximum exponent of 
 * <tt>10</tt> that is used to generate ticks (applies to continuous-numeric axes).
 * <p>
 * The generated ticks are separated by a 
 * <i>step</i> value.
 * A step value is a certain power of 
 * <tt>10</tt>,
 * possibly multiplied by 
 * <tt>2</tt> or 
 * <tt>5</tt>.
 * <p>
 * For example, 
 * for a chosen exponent of 
 * <tt>4</tt>,
 * the corresponding power of 
 * <tt>10</tt> is 
 * <tt>10^4=10000</tt> and
 * the generated ticks could be:
 * 
 * <tt>0</tt>, 
 * <tt>10000</tt>, 
 * <tt>20000</tt>, ...
 * <p>
 * If the multiplier 
 * <tt>5</tt> was chosen, 
 * those ticks would instead be:
 * 
 * <tt>0</tt>, 
 * <tt>50000</tt>, 
 * <tt>100000</tt>, ...
 * <p>
 * Setting this property allows imposing a limit on 
 * the size of numbers chosen to separate ticks,
 * which may be seen as imposing a minimum granularity 
 * on the generated tick values.
 * 
 * @type number
 * @category Continuous-Numeric > Style
 */
pvc.options.axes.NumericCartesianAxis.prototype.tickExponentMax = undefined;
/**
 * The minimum exponent of 
 * <tt>10</tt> that is used to generate ticks (applies to continuous-numeric axes).
 * <p>
 * The generated ticks are separated by a 
 * <i>step</i> value.
 * A step value is a certain power of 
 * <tt>10</tt>,
 * possibly multiplied by 
 * <tt>2</tt> or 
 * <tt>5</tt>.
 * <p>
 * For example, 
 * for a chosen exponent of 
 * <tt>2</tt>,
 * the corresponding power of 
 * <tt>10</tt> is 
 * <tt>10^2=100</tt> and
 * the generated ticks could be:
 * 
 * <tt>0</tt>, 
 * <tt>100</tt>, 
 * <tt>200</tt>, ...
 * <p>
 * If the multiplier 
 * <tt>2</tt> was chosen, 
 * those ticks would instead be:
 * 
 * <tt>0</tt>, 
 * <tt>200</tt>, 
 * <tt>400</tt>, ...
 * <p>
 * Setting this property to 
 * <tt>2</tt> would ensure 
 * that generated ticks would be separated by the step values
 * 
 * <tt>100</tt>, 
 * <tt>200</tt> or 
 * <tt>500</tt>,
 * or by steps whose corresponding exponent is 
 * bigger than 
 * <tt>2</tt>, 
 * like: 
 * <tt>1000</tt>, 
 * <tt>2000</tt> or 
 * <tt>5000</tt>.
 * <p>
 * A more typical use case is ensuring that generated ticks are integers.
 * A value of 
 * <tt>tickExponentMin</tt> of 
 * <tt>0</tt> would accomplish that.
 * <p>
 * Generally, 
 * to impose a maximum number of decimal places on the generated ticks, 
 * a negative number can be specified.
 * For example, the value 
 * <tt>-1</tt> could generate the ticks:
 * 
 * <tt>0.1</tt>, 
 * <tt>0.2</tt>, 
 * <tt>0.3</tt>, ...
 * If the multiplier 
 * <tt>5</tt> was chosen, 
 * those ticks would instead be:
 * 
 * <tt>0.5</tt>, 
 * <tt>1.0</tt>, 
 * <tt>1.5</tt>, ...
 * It could not generate ticks 
 * with more that one decimal place.
 * 
 * @type number
 * @category Continuous-Numeric > Style
 */
pvc.options.axes.NumericCartesianAxis.prototype.tickExponentMin = undefined;
/**
 * Indicates if the zero line rule is drawn, 
 * on the position of the 0-valued tick, 
 * when there is one (applies to continuous-numeric axes).
 * <p>
 * An horizontal axis has a vertical zero line rule,
 * while a a vertical axis has an horizontal zero line rule.
 * 
 * @type boolean
 * @default true
 * @category Continuous-Numeric > Style
 */
pvc.options.axes.NumericCartesianAxis.prototype.zeroLine = undefined;
/**
 * The minimum spacing between tick labels, in 
 * <i>em</i> units 
 * (does not apply to discrete-hierarchical axes).
 * 
 * @type number
 * @category Non-Hierarchical > Layout
 */
pvc.options.axes.NumericCartesianAxis.prototype.labelSpacingMin = undefined;
/**
 * Controls how labels are laid out when they overlap 
 * (does not apply to discrete-hierarchical axes).
 * 
 * @type pvc.options.varia.AxisOverlappedLabelsMode
 * @default 'hide'
 * @category Non-Hierarchical > Layout
 */
pvc.options.axes.NumericCartesianAxis.prototype.overlappedLabelsMode = undefined;
/**
 * Indicates if ticks are shown for each tick value 
 * (does not apply to discrete-hierarchical axes).
 * 
 * @type boolean
 * @default true
 * @category Non-Hierarchical > Style
 */
pvc.options.axes.NumericCartesianAxis.prototype.ticks = undefined;
/**
 * The extension points object contains style definitions for 
 * the marks of the panel.
 * 
 * @type pvc.options.ext.NumericCartesianAxisExtensionPoints
 * @category Style
 */
pvc.options.axes.NumericCartesianAxis.prototype.extensionPoints = undefined;
/**
 * The extension points of the cartesian axis panel for continuous scale types.
 * <p>
 * To use an extension point you must find its full name, by joining:
 * 
 * <ol>
 * 
 * <li>panel property name (ex: 
 * <tt>xAxis</tt>)</li>
 * 
 * <li>extension property (ex: 
 * <tt>zeroLine</tt>)</li>
 * 
 * <li>the "_" character</li>
 * 
 * <li>extension sub-property (ex: 
 * <tt>lineWidth</tt>)</li>
 * </ol>
 * and obtaining, for the examples, the camel-cased name: 
 * <tt>xAxisZeroLine_lineWidth</tt>
 * (see {@link http://en.wikipedia.org/wiki/CamelCase}).
 * 
 * @class
 * @extends pvc.options.ext.CartesianAxisExtensionPoints
 */
pvc.options.ext.NumericCartesianAxisExtensionPoints = function(){};
        
        
        
        
/**
 * The extension point of a 
 * <i>minor</i> tick rule mark (applies to continuous axes).
 * 
 * @type pvc.options.marks.RuleExtensionPoint
 * @category Continuous > Style
 */
pvc.options.ext.NumericCartesianAxisExtensionPoints.prototype.minorTicks = undefined;
/**
 * The extension point of the zero line rule (applies to continuous-numeric axes).
 * 
 * @type pvc.options.marks.RuleExtensionPoint
 * @category Continuous-Numeric > Style
 */
pvc.options.ext.NumericCartesianAxisExtensionPoints.prototype.zeroLine = undefined;
/**
 * The extension point of a discrete,
 * or continuous 
 * <i>major</i>,
 * tick rule mark (does not apply to discrete-hierarchical axes).
 * 
 * @type pvc.options.marks.RuleExtensionPoint
 * @category Non-Hierarchical > Style
 */
pvc.options.ext.NumericCartesianAxisExtensionPoints.prototype.ticks = undefined;
/**
 * The extension point of the tick panel 
 * (does not apply to discrete-hierarchical axes).
 * <p>
 * One tick panel contains one tick rule and one label.
 * It can be used to conveniently hide all the elements 
 * of a tick simultaneously.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 * @category Non-Hierarchical > Style
 */
pvc.options.ext.NumericCartesianAxisExtensionPoints.prototype.ticksPanel = undefined;
/**
 * The namespace of CCC panels options classes. 
 * 
 * @namespace
 */
pvc.options.panels = {};

/**
 * The common options documentation class of the CCC panels.
 * 
 * @class
 * @abstract
 */
pvc.options.panels.Panel = function(){};
        
        
        
        
/**
 * The fixed size of the panel.
 * <p>
 * See {@link pvc.options.varia.Size} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Size
 * @category Layout
 */
pvc.options.panels.Panel.prototype.size = undefined;
/**
 * The maximum size of the panel.
 * <p>
 * See {@link pvc.options.varia.Size} for information about 
 * the different supported data types.
 * 
 * @type number|string|pvc.options.varia.Size
 * @category Layout
 */
pvc.options.panels.Panel.prototype.sizeMax = undefined;
/**
 * The common options documentation class of CCC docked panels.
 * 
 * @class
 * @extends pvc.options.panels.Panel
 * @abstract
 */
pvc.options.panels.DockedPanel = function(){};
        
        
        
        
/**
 * The alignment side of the panel (the source)
 * that will align to a side of the parent panel (the target).
 * <p>
 * The alignment side must be 
 * orthogonal to the docking side.
 * <p>
 * The default value is 
 * <tt>'middle'</tt>,
 * if {@link pvc.options.panels.DockedPanel#position}
 * is an horizontal side, 
 * and 
 * <tt>'center'</tt>, otherwise.
 * 
 * @type pvc.options.varia.PanelAlignmentSource
 * @category Layout
 */
pvc.options.panels.DockedPanel.prototype.align = undefined;
/**
 * The alignment side or position 
 * of the parent panel (the target)
 * that will align with the alignment side of this panel,
 * the source.
 * <p>
 * The default value is the value of 
 * {@link pvc.options.panels.DockedPanel#align}.
 * <p>
 * See {@link pvc.options.varia.PanelAlignmentTarget}
 * for information on supported data types.
 * 
 * @type number|string|pvc.options.varia.PanelAlignmentTarget
 * @category Layout
 */
pvc.options.panels.DockedPanel.prototype.alignTo = undefined;
/**
 * Indicates if the layout should try that the
 * panel be kept inside its parent,
 * by changing its position.
 * 
 * @type boolean
 * @default false
 * @category Layout
 */
pvc.options.panels.DockedPanel.prototype.keepInBounds = undefined;
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
pvc.options.panels.DockedPanel.prototype.margins = undefined;
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
pvc.options.panels.DockedPanel.prototype.paddings = undefined;
/**
 * The docking position of the panel.
 * 
 * @type pvc.options.varia.PanelPosition
 * @category Layout
 */
pvc.options.panels.DockedPanel.prototype.position = undefined;
/**
 * The font of the panel.
 * <p>
 * See the supported font format in 
 * {@link http://www.w3.org/TR/CSS2/fonts.html#font-shorthand}
 * 
 * @type string
 * @category Style
 */
pvc.options.panels.DockedPanel.prototype.font = undefined;
/**
 * The options documentation class of the legend panel.
 * <p>
 * The default 
 * {@link pvc.options.panels.DockedPanel#position}
 * is 
 * <tt>'bottom'</tt>.
 * <p>
 * The default 
 * {@link pvc.options.panels.DockedPanel#font}
 * is 
 * <tt>'10px sans-serif'</tt>.
 * <p>
 * The default
 * {@link pvc.options.panels.DockedPanel#paddings}
 * is 
 * <tt>5</tt> pixels.
 * 
 * @class
 * @extends pvc.options.panels.DockedPanel
 */
pvc.options.panels.LegendPanel = function(){};
        
        
        
        
/**
 * Half the space between legend items, in pixel units.
 * 
 * @type number
 * @default 2.5
 * @category Layout
 */
pvc.options.panels.LegendPanel.prototype.itemPadding = undefined;
/**
 * The width and height of the marker panel.
 * <p>
 * The marker itself will be slightly smaller.
 * 
 * @type number
 * @default 15
 * @category Layout
 */
pvc.options.panels.LegendPanel.prototype.markerSize = undefined;
/**
 * The space between the marker and the associated label, in pixel units.
 * 
 * @type number
 * @default 6
 * @category Layout
 */
pvc.options.panels.LegendPanel.prototype.textMargin = undefined;
/**
 * The extension points provided by the legend panel.
 * 
 * @type pvc.options.ext.LegendPanelExtensionPoints
 * @category Style
 */
pvc.options.panels.LegendPanel.prototype.extensionPoints = undefined;
/**
 * The font of the panel.
 * <p>
 * See the supported font format in 
 * {@link http://www.w3.org/TR/CSS2/fonts.html#font-shorthand}
 * 
 * @type string
 * @default '9px sans-serif'
 * @category Style
 */
pvc.options.panels.LegendPanel.prototype.font = undefined;
/**
 * The extension points of the legend panel.
 * <p>
 * To use an extension point you must find its full name, by joining:
 * 
 * <ol>
 * 
 * <li>panel property name (ex: 
 * <tt>legend</tt>)</li>
 * 
 * <li>extension property (ex: 
 * <tt>label</tt>)</li>
 * 
 * <li>the "_" character</li>
 * 
 * <li>extension sub-property (ex: 
 * <tt>textStyle</tt>)</li>
 * </ol>
 * and obtaining, for the examples, the camel-cased name: 
 * <tt>legendLabel_textStyle</tt>
 * (see {@link http://en.wikipedia.org/wiki/CamelCase}).
 * 
 * @class
 */
pvc.options.ext.LegendPanelExtensionPoints = function(){};
        
        
        
        
/**
 * The extension point of the top-most panel mark of the legend panel.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.LegendPanelExtensionPoints.prototype.area = undefined;
/**
 * The extension point of the dot mark (the marker's shape) of a legend item.
 * 
 * @type pvc.options.marks.DotExtensionPoint
 */
pvc.options.ext.LegendPanelExtensionPoints.prototype.dot = undefined;
/**
 * The extension point of the label mark of a legend item.
 * 
 * @type pvc.options.marks.LabelExtensionPoint
 */
pvc.options.ext.LegendPanelExtensionPoints.prototype.label = undefined;
/**
 * The extension point of legend item panel mark.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.LegendPanelExtensionPoints.prototype.panel = undefined;
/**
 * The extension point of the rule mark (the marker's line) of a legend item.
 * 
 * @type pvc.options.marks.RuleExtensionPoint
 */
pvc.options.ext.LegendPanelExtensionPoints.prototype.rule = undefined;
/**
 * The options documentation class of the chart title panel.
 * 
 * @class
 * @extends pvc.options.panels.TitlePanel
 */
pvc.options.panels.ChartTitlePanel = function(){};
        
        
        
        
/**
 * The docking position of the panel.
 * 
 * @type pvc.options.varia.PanelPosition
 * @default 'top'
 * @category Layout
 */
pvc.options.panels.ChartTitlePanel.prototype.position = undefined;
/**
 * The font of the panel.
 * <p>
 * See the supported font format in 
 * {@link http://www.w3.org/TR/CSS2/fonts.html#font-shorthand}
 * 
 * @type string
 * @default '14px sans-serif'
 * @category Style
 */
pvc.options.panels.ChartTitlePanel.prototype.font = undefined;
/**
 * The options documentation class of the cartesian axes title panel.
 * <p>
 * The default 
 * {@link pvc.options.panels.DockedPanel#font}
 * is 
 * <tt>'14px sans-serif'</tt>.
 * 
 * @class
 * @extends pvc.options.panels.TitlePanel
 */
pvc.options.panels.CartesianAxisTitlePanel = function(){};
        
        
        
        
/**
 * The paddings of the panel. Not supported.
 * 
 * @type string
 * @category Layout
 * @constant
 */
pvc.options.panels.CartesianAxisTitlePanel.prototype.paddings = null;
/**
 * The position of the title panel is the same 
 * as that of its cartesian axis.
 * 
 * @type pvc.options.varia.PanelPosition
 * @category Layout
 * @constant
 */
pvc.options.panels.CartesianAxisTitlePanel.prototype.position = null;
/**
 * The font of the panel.
 * <p>
 * See the supported font format in 
 * {@link http://www.w3.org/TR/CSS2/fonts.html#font-shorthand}
 * 
 * @type string
 * @default '12px sans-serif'
 * @category Style
 */
pvc.options.panels.CartesianAxisTitlePanel.prototype.font = undefined;
/**
 * The options documentation class of the title panel.
 * 
 * @class
 * @extends pvc.options.panels.DockedPanel
 * @abstract
 */
pvc.options.panels.TitlePanel = function(){};
        
        
        
        
/**
 * The extension points of the title panel.
 * 
 * @type pvc.options.ext.TitlePanelExtensionPoints
 * @category Style
 */
pvc.options.panels.TitlePanel.prototype.extensionPoints = undefined;
/**
 * The extension points of the title panel.
 * <p>
 * To use an extension point you must find its full name. 
 * If it is the chart's title panel, by joining:
 * 
 * <ol>
 * 
 * <li>chart title panel property name: 
 * <tt>title</tt></li>
 * 
 * <li>extension property (ex: 
 * <tt>label</tt>)</li>
 * 
 * <li>the "_" character</li>
 * 
 * <li>extension sub-property (ex: 
 * <tt>textStyle</tt>)</li>
 * </ol>
 * and obtaining, for the examples, the camel-cased name: 
 * <tt>titleLabel_textStyle</tt>
 * (see {@link http://en.wikipedia.org/wiki/CamelCase}).
 * <p>
 * If it is the title panel of an axis, by joining:
 * 
 * <ol>
 * 
 * <li>chart axis panel property name (ex: 
 * <tt>xAxis</tt>)</li>
 * 
 * <li>axis panel title property name: 
 * <tt>title</tt></li>
 * 
 * <li>extension property (ex: 
 * <tt>label</tt>)</li>
 * 
 * <li>the "_" character</li>
 * 
 * <li>extension sub-property (ex: 
 * <tt>textStyle</tt>)</li>
 * </ol>
 * and obtaining, for the examples, the camel-cased name: 
 * <tt>xAxisTitleLabel_textStyle</tt>
 * (see {@link http://en.wikipedia.org/wiki/CamelCase}).
 * 
 * @class
 */
pvc.options.ext.TitlePanelExtensionPoints = function(){};
        
        
        
        
/**
 * The extension point of the top-level panel mark.
 * <p>
 * This extension point, having no own name, 
 * coincides with the property name of the panel.
 * For example, for the chart's title panel: 
 * 
 * <tt>title_fillStyle</tt>.
 * 
 * @type pvc.options.marks.PanelExtensionPoint
 */
pvc.options.ext.TitlePanelExtensionPoints.prototype._ = undefined;
/**
 * The extension point of the title label mark.
 * 
 * @type pvc.options.marks.LabelExtensionPoint
 */
pvc.options.ext.TitlePanelExtensionPoints.prototype.label = undefined;
/**
 * The namespace of plot options classes. 
 * 
 * @namespace
 */
pvc.options.plots = {};

/**
 * The options documentation class for 
 * specifying trending options for a plot.
 * <p>
 * Each trend type may define additional options.
 * <p>
 * Trending is performed after null interpolation,
 * so that it takes the interpolated datums into account. 
 * 
 * @class
 */
pvc.options.varia.PlotTrending = function(){};
        
        
        
        
/**
 * A description to show next to the trended data.
 * <p>
 * The description shows next to legend items and 
 * in auto-generated tooltips.
 * <p>
 * The default value is the description of the associated trend type.  
 * 
 * @type string
 */
pvc.options.varia.PlotTrending.prototype.label = undefined;
/**
 * The type of trend to perform on the data of the associated plot.
 * <p>
 * The specified trend type must have been 
 * previously defined in the CCC library, 
 * through the 
 * <tt>pvc.trends.define</tt> method.
 * <p>
 * Some trend types come with the CCC library. 
 * Currently these are:
 * 
 * <dl>
 * 
 * <dt>'linear'</dt>
 * 
 * <dd>
 * performs a 
 * <bb>simple linear regression</bb>
 * (see {@link http://en.wikipedia.org/wiki/Simple_linear_regression})
 * </dd>
 * 
 * <dt>'moving-average'</dt>
 * 
 * <dd>
 * performs a simple moving average
 * (see {@link http://en.wikipedia.org/wiki/Moving_average});
 * the additional option 
 * <tt>periods</tt> may be specified to 
 * control the number of data points of the average window. 
 * </dd>
 * 
 * <dt>'weighted-moving-average'</dt>
 * 
 * <dd>
 * performs a weighted moving average
 * (see {@link http://en.wikipedia.org/wiki/Moving_average});
 * the additional option 
 * <tt>periods</tt> may be specified to 
 * control the number of data points of the average window
 * </dd>
 * </dl> 
 * 
 * @type string
 */
pvc.options.varia.PlotTrending.prototype.type = undefined;
/**
 * The namespace of various options-related helper types. 
 * 
 * @namespace
 */
pvc.options.varia = {};

/**
 * Controls if and how the selection can be cleared by the user.
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.ChartClearSelectionMode = function(){};
        
        
        
        
/**
 * The user can click on any 
 * <i>empty area</i>
 * 
 * <i>inside</i> the chart to clear the selection.
 * 
 * @value 'emptySpaceClick'
 */
pvc.options.varia.ChartClearSelectionMode.prototype.EmptySpaceClick = 'emptySpaceClick';
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
pvc.options.varia.ChartClearSelectionMode.prototype.Manual = 'manual';
/**
 * The main direction of drawing.
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.ChartOrientation = function(){};
        
        
        
        
/**
 * Horizontal direction.
 * 
 * @value 'horizontal'
 */
pvc.options.varia.ChartOrientation.prototype.Horizontal = 'horizontal';
/**
 * Vertical direction.
 * 
 * @value 'vertical'
 */
pvc.options.varia.ChartOrientation.prototype.Vertical = 'vertical';
/**
 * The sides of a child panel, the source, 
 * that can be aligned with 
 * a target side of a parent panel.
 * <p>
 * The alignment side must be 
 * orthogonal to the side of 
 * the {@link pvc.options.varia.PanelPosition}.
 * <p>
 * By combining the alignment source
 * with the {@link pvc.options.varia.PanelAlignmentTarget},
 * different alignment combinations can be achieved.
 * <p>
 * The alignment target side must be 
 * parallel to the side of source alignment.
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.PanelAlignmentSource = function(){};
        
        
        
        
/**
 * The bottom side of the child panel 
 * is placed at the same position as the
 * target side of the parent panel. 
 * 
 * @value 'bottom'
 */
pvc.options.varia.PanelAlignmentSource.prototype.Bottom = 'bottom';
/**
 * The horizontal center position of the child panel 
 * is placed at the same position as the
 * target side of the parent panel. 
 * 
 * @value 'center'
 */
pvc.options.varia.PanelAlignmentSource.prototype.Center = 'center';
/**
 * The left side of the child panel 
 * is placed at the same position as the
 * target side of the parent panel.
 * 
 * @value 'left'
 */
pvc.options.varia.PanelAlignmentSource.prototype.Left = 'left';
/**
 * The vertical center position of the child panel 
 * is placed at the same position as the
 * target side of the parent panel. 
 * 
 * @value 'middle'
 */
pvc.options.varia.PanelAlignmentSource.prototype.Middle = 'middle';
/**
 * The right side of the child panel 
 * is placed at the same position as the
 * target side of the parent panel.
 * 
 * @value 'right'
 */
pvc.options.varia.PanelAlignmentSource.prototype.Right = 'right';
/**
 * The top side of the child panel 
 * is placed at the same position as the
 * target side of the parent panel.
 * 
 * @value 'top'
 */
pvc.options.varia.PanelAlignmentSource.prototype.Top = 'top';
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
pvc.options.varia.PanelAlignmentTarget = function(){};
        
        
        
        
/**
 * The source side of the child panel
 * is placed at the same position as the
 * bottom side of the parent panel.
 * 
 * @value 'bottom'
 */
pvc.options.varia.PanelAlignmentTarget.prototype.Bottom = 'bottom';
/**
 * The source side of the child panel
 * is placed at the same position as the
 * horizontal center position of the parent panel.
 * 
 * @value 'center'
 */
pvc.options.varia.PanelAlignmentTarget.prototype.Center = 'center';
/**
 * The source side of the child panel
 * is placed at the same position as the
 * left side of the parent panel.
 * 
 * @value 'left'
 */
pvc.options.varia.PanelAlignmentTarget.prototype.Left = 'left';
/**
 * The source side of the child panel
 * is placed at the same position as the
 * vertical center position of the parent panel.
 * 
 * @value 'middle'
 */
pvc.options.varia.PanelAlignmentTarget.prototype.Middle = 'middle';
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
 * {@link pvc.options.charts.Chart#height},
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
pvc.options.varia.PanelAlignmentTarget.prototype.PageMiddle = 'page-middle';
/**
 * The source side of the child panel
 * is placed at the same position as the
 * right side of the parent panel.
 * 
 * @value 'right'
 */
pvc.options.varia.PanelAlignmentTarget.prototype.Right = 'right';
/**
 * The source side of the child panel
 * is placed at the same position as the
 * top side of the parent panel.
 * 
 * @value 'top'
 */
pvc.options.varia.PanelAlignmentTarget.prototype.Top = 'top';
/**
 * The sides of a parent panel to 
 * which a child panel may be docked to.
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.PanelPosition = function(){};
        
        
        
        
/**
 * The bottom side of the child panel 
 * is placed at the same position as the
 * bottom side of the parent panel. 
 * 
 * @value 'bottom'
 */
pvc.options.varia.PanelPosition.prototype.Bottom = 'bottom';
/**
 * The left side of the child panel 
 * is placed at the same position as the
 * left side of the parent panel. 
 * 
 * @value 'left'
 */
pvc.options.varia.PanelPosition.prototype.Left = 'left';
/**
 * The right side of the child panel 
 * is placed at the same position as the
 * right side of the parent panel. 
 * 
 * @value 'right'
 */
pvc.options.varia.PanelPosition.prototype.Right = 'right';
/**
 * The top side of the child panel 
 * is placed at the same position as the
 * top side of the parent panel. 
 * 
 * @value 'top'
 */
pvc.options.varia.PanelPosition.prototype.Top = 'top';
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
 * The shapes that are available in protovis Dot marks.
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.DotShapeType = function(){};
        
        
        
        
/**
 * @value 'bar'
 */
pvc.options.varia.DotShapeType.prototype.Bar = 'bar';
/**
 * @value 'circle'
 */
pvc.options.varia.DotShapeType.prototype.Circle = 'circle';
/**
 * @value 'cross'
 */
pvc.options.varia.DotShapeType.prototype.Cross = 'cross';
/**
 * @value 'diamond'
 */
pvc.options.varia.DotShapeType.prototype.Diamond = 'diamond';
/**
 * @value 'square'
 */
pvc.options.varia.DotShapeType.prototype.Square = 'square';
/**
 * @value 'tick'
 */
pvc.options.varia.DotShapeType.prototype.Tick = 'tick';
/**
 * @value 'triangle'
 */
pvc.options.varia.DotShapeType.prototype.Triangle = 'triangle';
/**
 * The anchors that are available to all protovis marks,
 * with the exception of the Wedge mark 
 * (see {@link pvc.options.varia.WedgeAnchor}).
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.MarkAnchor = function(){};
        
        
        
        
/**
 * @value 'bottom'
 */
pvc.options.varia.MarkAnchor.prototype.Bottom = 'bottom';
/**
 * @value 'center'
 */
pvc.options.varia.MarkAnchor.prototype.Center = 'center';
/**
 * @value 'left'
 */
pvc.options.varia.MarkAnchor.prototype.Left = 'left';
/**
 * @value 'right'
 */
pvc.options.varia.MarkAnchor.prototype.Right = 'right';
/**
 * @value 'top'
 */
pvc.options.varia.MarkAnchor.prototype.Top = 'top';
/**
 * The anchors that are available to the protovis Wedge mark.
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.WedgeAnchor = function(){};
        
        
        
        
/**
 * @value 'center'
 */
pvc.options.varia.WedgeAnchor.prototype.Center = 'center';
/**
 * @value 'end'
 */
pvc.options.varia.WedgeAnchor.prototype.End = 'end';
/**
 * @value 'inner'
 */
pvc.options.varia.WedgeAnchor.prototype.Inner = 'inner';
/**
 * @value 'outer'
 */
pvc.options.varia.WedgeAnchor.prototype.Outer = 'outer';
/**
 * @value 'start'
 */
pvc.options.varia.WedgeAnchor.prototype.Start = 'start';
/**
 * The mode of interpolation for filling null or missing measure values.
 * <p>
 * Some chart types 
 * show visual elements corresponding to 
 * interpolated data points with a different visual style.
 * The automatically generated visual element tooltips 
 * indicate that the associated data point 
 * is the result of interpolation.
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.NullInterpolationMode = function(){};
        
        
        
        
/**
 * Data is linearly interpolated to 
 * fill-in null values or missing datums.
 * 
 * @value 'linear'
 */
pvc.options.varia.NullInterpolationMode.prototype.Linear = 'linear';
/**
 * Null values or missing datums are shown as a visual 
 * <i>gap</i>.
 * 
 * @value 'none'
 */
pvc.options.varia.NullInterpolationMode.prototype.None = 'none';
/**
 * Data is interpolated using the constant value 
 * <tt>0</tt> 
 * to fill-in null values or missing datums.
 * 
 * @value 'zero'
 */
pvc.options.varia.NullInterpolationMode.prototype.Zero = 'zero';
/**
 * The type of scale domain coordination 
 * amongst axes of the same id of 
 * 
 * <i>small charts</i>.
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.AxisDomainScope = function(){};
        
        
        
        
/**
 * No scale domain coordination.
 * 
 * @value 'cell'
 */
pvc.options.varia.AxisDomainScope.prototype.Cell = 'cell';
/**
 * The axes of same id of 
 * 
 * <i>small charts</i> of each column
 * will use the same scale domain.
 * 
 * @value 'column'
 */
pvc.options.varia.AxisDomainScope.prototype.Column = 'column';
/**
 * The axes of same id of 
 * all the 
 * <i>small charts</i>
 * use the same scale domain.  
 * 
 * @value 'global'
 */
pvc.options.varia.AxisDomainScope.prototype.Global = 'global';
/**
 * The axes of same id of 
 * 
 * <i>small charts</i> of each row
 * will use the same scale domain.  
 * 
 * @value 'row'
 */
pvc.options.varia.AxisDomainScope.prototype.Row = 'row';
/**
 * The axes of same id of 
 * 
 * <i>small charts</i> of each row or column
 * will use the same scale domain.
 * <p>
 * The determination of whether 
 * <tt>section</tt> 
 * applies to 
 * rows or columns
 * is performed according to a reference orientation.
 * <p>
 * In the case of cartesian axes, 
 * the reference orientation
 * is the axis' orientation.
 * <p>
 * If the reference orientation is horizontal, 
 * then 
 * <tt>section </tt> applies to columns.
 * Otherwise it applies to rows.
 * 
 * @value 'section'
 */
pvc.options.varia.AxisDomainScope.prototype.Section = 'section';
/**
 * The rounding mode applied to a numeric axis' scale domain.
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.AxisDomainRoundingMode = function(){};
        
        
        
        
/**
 * The scale domain is made "nice" by 
 * ensuring that its bounds are "nice" numbers,
 * extending the domain, if necessary.
 * 
 * @value 'nice'
 */
pvc.options.varia.AxisDomainRoundingMode.prototype.Nice = 'nice';
/**
 * The scale domain is exactly the domain of the data.
 * 
 * @value 'none'
 */
pvc.options.varia.AxisDomainRoundingMode.prototype.None = 'none';
/**
 * The scale domain is extended in order to 
 * coincide with the calculated ticks.
 * <p>
 * Ticks naturally are nice numbers, 
 * yet, additionally, 
 * this mode ensures that ticks coincide with 
 * the end of the axis' scale,
 * as long as the axis'
 * {@link pvc.options.axes.CartesianAxis#offset}
 * is zero.
 * 
 * @value 'tick'
 */
pvc.options.varia.AxisDomainRoundingMode.prototype.Tick = 'tick';
/**
 * The layout modes that handle the situation where 
 * labels of axes ticks overlap.
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.AxisOverlappedLabelsMode = function(){};
        
        
        
        
/**
 * Hide labels that overlap.
 * <p>
 * Between two labels, as many as required are hidden
 * until the minimum specified spacing is respected.
 * <p>
 * In the place of the hidden labels,
 * a dot is placed that, 
 * when hovering over, 
 * indicates the value of the hidden labels.
 * 
 * @value 'hide'
 */
pvc.options.varia.AxisOverlappedLabelsMode.prototype.Hide = 'hide';
/**
 * Let labels overlap.
 * 
 * @value 'leave'
 */
pvc.options.varia.AxisOverlappedLabelsMode.prototype.Leave = 'leave';
/**
 * The possible value label styles of pie charts
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.PieValuesLabelStyle = function(){};
        
        
        
        
/**
 * Value labels are placed inside 
 * their corresponding pie slice.
 * 
 * @value 'inside'
 */
pvc.options.varia.PieValuesLabelStyle.prototype.Inside = 'inside';
/**
 * Value labels are placed outside 
 * their corresponding pie slice,
 * linked to it by a line.
 * 
 * @value 'linked'
 */
pvc.options.varia.PieValuesLabelStyle.prototype.Linked = 'linked';
/**
 * The direction of the waterfall.
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.WaterDirection = function(){};
        
        
        
        
/**
 * The water of the waterfall falls,
 * from left to right.
 * 
 * @value 'down'
 */
pvc.options.varia.WaterDirection.prototype.Down = 'down';
/**
 * The water of the waterfall falls,
 * from right to left,
 * (or climbs, from left to right).
 * 
 * @value 'up'
 */
pvc.options.varia.WaterDirection.prototype.Up = 'up';
/**
 * The type of color scale for continuous color axes.
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.ColorScaleType = function(){};
        
        
        
        
/**
 * A discrete scale is used.
 * <p>
 * The numeric domain is quantized and 
 * then mapped to a discrete number of colors.
 * 
 * @value 'discrete'
 */
pvc.options.varia.ColorScaleType.prototype.Discrete = 'discrete';
/**
 * A linear scale is used to map 
 * a numeric domain into 
 * a color range.
 * 
 * @value 'linear'
 */
pvc.options.varia.ColorScaleType.prototype.Linear = 'linear';
/**
 * A normal distribution scale is used.
 * <p>
 * This scale type is 
 * <i>currently</i> unsupported.
 * 
 * @value 'normal'
 */
pvc.options.varia.ColorScaleType.prototype.Normal = 'normal';
/**
 * The gravity of the tooltip controls 
 * where the tooltip is place relative to the
 * visual element's anchor point.
 * <p>
 * The gravity is the 
 * tooltip's corner or side
 * that is placed at the visual element's anchor point.
 * <p>
 * Said in yet another way: 
 * «Gravity is the direction of the tooltip arrow.
 * The arrow points to the target element.»
 * 
 * <p>
 * The following diagram illustrates the
 * tooltip arrow anchor points.
 * <p>
 * When {@link pvc.options.Tooltip#useCorners}
 * is 
 * <tt>true</tt>,
 * the "crossed" gravities are really at
 * the tooltip box corners.
 * 
 * <pre>
 *                nw    n    ne
 *               +-o----o----o-+
 *               |             |
 *             w o   Tooltip   o e
 *               |             |
 *               +-o----o----o-+
 *                sw    s    se
 *                 
 * </pre>
 * 
 * <p>
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.TooltipGravity = function(){};
        
        
        
        
/**
 * Right tooltip side is placed at the 
 * visual element's anchor point,
 * resulting in the tooltip being at its left.
 * 
 * @value 'e'
 */
pvc.options.varia.TooltipGravity.prototype.East = 'e';
/**
 * Top tooltip side is placed at the 
 * visual element's anchor point,
 * resulting in the tooltip being below it. 
 * 
 * @value 'n'
 */
pvc.options.varia.TooltipGravity.prototype.North = 'n';
/**
 * Upper-right tooltip corner is placed at the 
 * visual element's anchor point,
 * resulting in the tooltip being below it and at its left.
 * 
 * @value 'ne'
 */
pvc.options.varia.TooltipGravity.prototype.NorthEast = 'ne';
/**
 * Upper-left tooltip corner is placed at the 
 * visual element's anchor point,
 * resulting in the tooltip being below it and at its right.
 * 
 * @value 'nw'
 */
pvc.options.varia.TooltipGravity.prototype.NorthWest = 'nw';
/**
 * Bottom tooltip side is placed at the 
 * visual element's anchor point,
 * resulting in the tooltip being above it.  
 * 
 * @value 's'
 */
pvc.options.varia.TooltipGravity.prototype.South = 's';
/**
 * Lower-right tooltip corner is placed at the 
 * visual element's anchor point,
 * resulting in the tooltip being above it and at its left.
 * 
 * @value 'se'
 */
pvc.options.varia.TooltipGravity.prototype.SouthEast = 'se';
/**
 * Lower-left tooltip corner is placed at the 
 * visual element's anchor point,
 * resulting in the tooltip being above it and at its right.
 * 
 * @value 'sw'
 */
pvc.options.varia.TooltipGravity.prototype.SouthWest = 'sw';
/**
 * Left tooltip side is placed at the 
 * visual element's anchor point,
 * resulting in the tooltip being at its right.
 * 
 * @value 'w'
 */
pvc.options.varia.TooltipGravity.prototype.West = 'w';
/**
 * How to interpolate the line or area between values.
 * <p>
 * See the associated protovis documentation at
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Line.html#interpolate}
 * and
 * {@link http://mbostock.github.com/protovis/jsdoc/symbols/pv.Area.html#interpolate}.
 * <p>
 * Protovis supports other interpolation values, 
 * but these do not work well with the CCC point charts. 
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.LineAreaInterpolation = function(){};
        
        
        
        
/**
 * Produces an open uniform 
 * <b>b</b>-spline.
 * 
 * @value 'basis'
 */
pvc.options.varia.LineAreaInterpolation.prototype.Basis = 'basis';
/**
 * Produces cardinal splines.
 * 
 * @value 'cardinal'
 */
pvc.options.varia.LineAreaInterpolation.prototype.Cardinal = 'cardinal';
/**
 * Produces a straight line between points.
 * 
 * @value 'linear'
 */
pvc.options.varia.LineAreaInterpolation.prototype.Linear = 'linear';
/**
 * Produces a Fritsch-Carlson 
 * monotone cubic hermite interpolation.
 * 
 * @value 'monotone'
 */
pvc.options.varia.LineAreaInterpolation.prototype.Monotone = 'monotone';
/**
 * The possible ways to join the segments of a line.
 * <p>
 * See {@link http://www.w3.org/TR/SVG/painting.html#StrokeProperties}
 * for more information on stroke properties.
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.StrokeLineJoin = function(){};
        
        
        
        
/**
 * Join segments with cut-off corners.
 * 
 * @value 'bevel'
 */
pvc.options.varia.StrokeLineJoin.prototype.Bevel = 'bevel';
/**
 * Join segments with sharp angle corners. 
 * 
 * @value 'miter'
 */
pvc.options.varia.StrokeLineJoin.prototype.Miter = 'miter';
/**
 * Join segments with rounded corners.
 * 
 * @value 'round'
 */
pvc.options.varia.StrokeLineJoin.prototype.Round = 'round';
/**
 * The possible ways to draw the ends of a line or line pattern.
 * <p>
 * See {@link http://www.w3.org/TR/SVG/painting.html#StrokeProperties}
 * for more information on stroke properties.
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.StrokeLineCap = function(){};
        
        
        
        
/**
 * The end is straight, at the end position. 
 * 
 * @value 'butt'
 */
pvc.options.varia.StrokeLineCap.prototype.Butt = 'butt';
/**
 * The end is a semi-circle,
 * whose radius is half the line width
 * and whose center is at the end position.
 * 
 * @value 'round'
 */
pvc.options.varia.StrokeLineCap.prototype.Round = 'round';
/**
 * The end is a square,
 * whith a side length equal to the line width
 * and whose center is at the end position.
 * 
 * @value 'square'
 */
pvc.options.varia.StrokeLineCap.prototype.Square = 'square';
/**
 * The possible stroke patterns.
 * <p>
 * The actual length of stroke patterns' dashes and spaces is 
 * proportional to the line width. 
 * <p>
 * The pattern dashes are sensitive to 
 * the line cap property. 
 * The use of {@link pvc.options.varia.StrokeLineCap#Round}
 * generates circle-ended dashes.
 * The line caps {@link pvc.options.varia.StrokeLineCap#Butt}
 * and {@link pvc.options.varia.StrokeLineCap#Square}
 * yield the same result: 
 * square-ended dashes, of equal length.
 * <p>
 * See {@link http://www.w3.org/TR/SVG/painting.html#StrokeProperties}
 * for more information on stroke properties.
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.StrokeDasharray = function(){};
        
        
        
        
/**
 * A pattern.
 * Can also be specified as 
 * <tt>"- "</tt>
 * 
 * @value 'dash'
 */
pvc.options.varia.StrokeDasharray.prototype.Dash = 'dash';
/**
 * A pattern.
 * Can also be specified as 
 * <tt>"- ."</tt>
 * 
 * @value 'dashdot'
 */
pvc.options.varia.StrokeDasharray.prototype.DashDot = 'dashdot';
/**
 * A pattern.
 * Can also be specified as 
 * <tt>". "</tt>
 * 
 * @value 'dot'
 */
pvc.options.varia.StrokeDasharray.prototype.Dot = 'dot';
/**
 * A pattern.
 * Can also be specified as 
 * <tt>"--"</tt>
 * 
 * @value 'longdash'
 */
pvc.options.varia.StrokeDasharray.prototype.LongDash = 'longdash';
/**
 * A pattern.
 * Can also be specified as 
 * <tt>"--."</tt>
 * 
 * @value 'longdashdot'
 */
pvc.options.varia.StrokeDasharray.prototype.LongDashDot = 'longdashdot';
/**
 * A pattern.
 * Can also be specified as 
 * <tt>"--.."</tt>
 * 
 * @value 'longdashdotdot'
 */
pvc.options.varia.StrokeDasharray.prototype.LongDashDotDot = 'longdashdotdot';
/**
 * A pattern.
 * Can also be specified as 
 * <tt>"."</tt>
 * 
 * @value 'shortdash'
 */
pvc.options.varia.StrokeDasharray.prototype.ShortDash = 'shortdash';
/**
 * A pattern.
 * Can also be specified as 
 * <tt>"-."</tt>
 * 
 * @value 'shortdashdot'
 */
pvc.options.varia.StrokeDasharray.prototype.ShortDashDot = 'shortdashdot';
/**
 * A pattern.
 * Can also be specified as 
 * <tt>"-.."</tt>
 * 
 * @value 'shortdashdotdot'
 */
pvc.options.varia.StrokeDasharray.prototype.ShortDashDotDot = 'shortdashdotdot';
/**
 * The horizontal alignment of text. 
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.TextAlignment = function(){};
        
        
        
        
/**
 * @value 'center'
 */
pvc.options.varia.TextAlignment.prototype.Center = 'center';
/**
 * @value 'left'
 */
pvc.options.varia.TextAlignment.prototype.Left = 'left';
/**
 * @value 'right'
 */
pvc.options.varia.TextAlignment.prototype.Right = 'right';
/**
 * The vertical alignment of text. 
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.TextBaseline = function(){};
        
        
        
        
/**
 * @value 'bottom'
 */
pvc.options.varia.TextBaseline.prototype.Bottom = 'bottom';
/**
 * @value 'middle'
 */
pvc.options.varia.TextBaseline.prototype.Middle = 'middle';
/**
 * @value 'top'
 */
pvc.options.varia.TextBaseline.prototype.Top = 'top';
/**
 * The names of the four sides of a rectangle.
 * 
 * @class
 * @enum
 * @extends string
 */
pvc.options.varia.RectangleSide = function(){};
        
        
        
        
/**
 * @value 'bottom'
 */
pvc.options.varia.RectangleSide.prototype.Bottom = 'bottom';
/**
 * @value 'left'
 */
pvc.options.varia.RectangleSide.prototype.Left = 'left';
/**
 * @value 'right'
 */
pvc.options.varia.RectangleSide.prototype.Right = 'right';
/**
 * @value 'top'
 */
pvc.options.varia.RectangleSide.prototype.Top = 'top';
/**
 * This type is a documentation type and 
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
 * @enum
 * @extends string
 */
pvc.options.varia.ColorString = function(){};
        
        
        
        
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