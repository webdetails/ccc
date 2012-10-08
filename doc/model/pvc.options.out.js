
/**
 * The chart options <i>applicable</i>
 * to all charts.
 * 
 * @class
 */
pvc.options.BaseChartOptions = function(){};
        
        
        
        
        
/**
 * Indicates if a chart should show an entry animation, 
 * every time it is rendered.
 * Most charts perform some sort of entry animation 
 * of its main visual elements.
 * 
 * @type boolean
 * @default true
 */
pvc.options.BaseChartOptions.prototype.animate = undefined;
        
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
 * @type string object
 */
pvc.options.BaseChartOptions.prototype.canvas = undefined;
        
/**
 * <p>
 * Controls if and how the selection can be cleared by the user.
 * 
 * @type ClearSelectionMode
 * @default emptySpaceClick
 */
pvc.options.BaseChartOptions.prototype.clearSelectionMode = undefined;
        
/**
 * A callback function that is called,
 * when the user clicks on a visual element.
 * <p>
 * The function signature is:
 * <tt>undefined function(pvc.visual.Context this, pvc.visual.Scene scene)</tt>.
 * 
 * @type function
 */
pvc.options.BaseChartOptions.prototype.clickAction = undefined;
        
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
 * @type boolean
 * @default false
 */
pvc.options.BaseChartOptions.prototype.clickable = undefined;
        
/**
 * The CCC version that the chart should run in.
 * <p>
 * The value <tt>1</tt> emulates version 1 of CCC.
 * 
 * @type number
 * @default Infinity
 */
pvc.options.BaseChartOptions.prototype.compatVersion = undefined;
        
/**
 * Indicates if the data source is in <i>crosstab</i> format.
 * 
 * @type boolean
 * @default true
 */
pvc.options.BaseChartOptions.prototype.crosstabMode = undefined;
        
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
 * @type boolean
 * @default true
 */
pvc.options.BaseChartOptions.prototype.ctrlSelectMode = undefined;
        
/**
 * A callback function that is called,
 * when the user double-clicks on a visual element.
 * <p>
 * The function signature is:
 * <tt>undefined function(pvc.visual.Context this, pvc.visual.Scene scene)</tt>.
 * 
 * @type function
 */
pvc.options.BaseChartOptions.prototype.doubleClickAction = undefined;
        
/**
 * The maximum number of milliseconds,
 * between two consecutive clicks,
 * for them to be considered a double-click.
 * 
 * @type number
 * @default 300
 */
pvc.options.BaseChartOptions.prototype.doubleClickMaxDelay = undefined;
        
/**
 * The height of the chart, in pixels.
 * 
 * @type number
 * @default 300
 */
pvc.options.BaseChartOptions.prototype.height = undefined;
        
/**
 * Indicates if the chart's visual elements
 * are automatically highlighted 
 * when the user hovers over them with the mouse.
 * 
 * @type boolean
 * @default false
 */
pvc.options.BaseChartOptions.prototype.hoverable = undefined;
        
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
 */
pvc.options.BaseChartOptions.prototype.ignoreNulls = undefined;
        
/**
 * Indicates if the data source has 
 * multiple value dimensions.
 * 
 * @type boolean
 * @default false
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
 * @type number string list(number string)
 * @default true
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
 * @type number string
 * @default true
 */
pvc.options.BaseChartOptions.prototype.multiChartIndexes = undefined;
        
/**
 * The chart orientation indicates if 
 * its main direction should be laid out
 * vertically or horizontally.
 * This property is supported by most chart types. 
 * 
 * @type string
 * @default vertical
 */
pvc.options.BaseChartOptions.prototype.orientation = undefined;
        
/**
 * A callback function that is called
 * before the chart is rendered,
 * but after if has been pre-rendered.
 * <p>
 * You can use this action to:
 * <ul>
 * <li>use the _mark events_ API on time-series categorical charts</li>
 * <li>extend in special ways the already created protovis marks.</li>
 * </ul>
 * <p>
 * The function signature is:
 * <tt>undefined function(pvc.visual.Context this)</tt>.
 * 
 * @type function
 */
pvc.options.BaseChartOptions.prototype.renderCallback = undefined;
        
/**
 * Indicates if the chart's visual elements
 * can be selected by the user, 
 * by clicking on them 
 * or using the rubber-band.
 * 
 * @type boolean
 * @default false
 */
pvc.options.BaseChartOptions.prototype.selectable = undefined;
        
/**
 * A callback function that is called
 * when, after selection has changed,
 * the chart is updated to reflect the change.
 * <p>
 * The function signature is:
 * <tt>undefined function(pvc.visual.Context this, pvc.data.Datum[] selectedDatums)</tt>.
 * The argument <tt>selectedDatums</tt>
 * is an array with the resulting selected datums.
 * 
 * @type function
 */
pvc.options.BaseChartOptions.prototype.selectionChangedAction = undefined;
        
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
 * @type boolean
 * @default false
 */
pvc.options.BaseChartOptions.prototype.seriesInRows = undefined;
        
/**
 * Indicates if tooltips are shown
 * when the user hovers over visual elements with the mouse.
 * 
 * @type boolean
 * @default true
 */
pvc.options.BaseChartOptions.prototype.showTooltips = undefined;
        
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
 * @type boolean
 * @default false
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
 * {@link pvc.options.DimensionOptions#rawFormat}
 * <p>
 * property,
 * for dimensions with a <tt>Date</tt> value type.  
 * 
 * @type string
 * @default %Y-%m-%d
 */
pvc.options.BaseChartOptions.prototype.timeSeriesFormat = undefined;
        
/**
 * Contains tooltip presentation options.
 * 
 * @type TooltipOptions
 */
pvc.options.BaseChartOptions.prototype.tipsySettings = undefined;
        
/**
 * A callback function that is called,
 * to build the tooltip of a visual element.
 * <p>
 * The function signature is:
 * <tt>string function(pvc.visual.Context this, pvc.visual.Scene scene)</tt>.
 * 
 * @type function
 */
pvc.options.BaseChartOptions.prototype.tooltipFormat = undefined;
        
/**
 * A callback function that is called
 * when the user performs a selection,
 * but before the corresponding datums' selected state are actually changed.
 * <p>
 * This function is usefull to restrict, amplify, or normalize the selection.
 * <p>
 * The function signature is:
 * <tt>pvc.data.Datum[] function(pvc.visual.Context this, pvc.data.Datum[] selectingDatums)</tt>.
 * <p>
 * The argument <tt>selectingDatums</tt>
 * is an array with the datums that will be selected by the current operation.
 * The function should return the datums that should be actually selected.
 * 
 * @type function
 */
pvc.options.BaseChartOptions.prototype.userSelectionAction = undefined;
        
/**
 * The width of the chart, in pixels.
 * 
 * @type number
 * @default 400
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
 * @type number
 * @default 0.9
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
        
        
        
        
        