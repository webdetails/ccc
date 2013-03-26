/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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
 * @param {string} extensionPrefix The extension prefix to be used to build extension keys, without underscore.
 * @param {function} [wrapper] extension wrapper function to apply to created marks.
 * 
 * @type undefined 
 */