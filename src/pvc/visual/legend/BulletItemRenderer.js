
/**
 * @name pvc.visual.legend.BulletItemRenderer
 * @class Renders bullet items' bullets, i.e. marker, rule, etc.
 */
def.type('pvc.visual.legend.BulletItemRenderer');

/**
 * Creates the marks that render appropriate bullets
 * as children of a given parent bullet panel.
 * <p>
 * The dimensions of this panel, upon each render, 
 * provide bounds for drawing each bullet.
 * </p>
 * <p>
 * The properties of marks created as children of this panel will 
 * receive a corresponding {@link pvc.visual.legend.BulletItemScene} 
 * as first argument. 
 * </p>
 * 
 * @name pvc.visual.legend.BulletItemRenderer#create
 * @function
 * @param {pvc.LegendPanel} legendPanel the legend panel
 * @param {pv.Panel} pvBulletPanel the protovis panel on which bullets are rendered.
 * 
 * @returns {object} a render information object, 
 * with custom renderer information,
 * that is subsequently passed as argument to other renderer's methods. 
 */
 
/**
 * Obtains the mark that should be the anchor for the bullet item's label.
 * If null is returned, the label is anchored to the parent bullet panel.
 * 
 * @name pvc.visual.legend.BulletItemRenderer#getLabelAnchorMark
 * @function
 * @param {pvc.LegendPanel} legendPanel the legend panel
 * @param {object} renderInfo a render information object previously returned by {@link #create}.
 * @type pv.Mark
 */
 
/**
 * Extends the bullet marks created in the render 
 * corresponding to the given render information object,
 * using extensions under the given extension prefix.
 *  
 * @name pvc.visual.legend.BulletItemRenderer#extendMarks
 * @function
 * @param {pvc.LegendPanel} legendPanel the legend panel
 * @param {object} renderInfo a render information object previously returned by {@link #create}.
 * @param {string} extensionPrefix The extension prefix to be used to build extension keys, without underscore.
 * @type undefined
 */