
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
