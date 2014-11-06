
cgf_ValueTemplate.Element
/**
 * Creates a value template instance given its _real_ parent element.
 *
 * @name cgf.ValueTemplate.Element
 *
 * @constructor
 * @param {cgf.EntityElement} realParent The _real_ parent element of this value element.
 *
 * @class The element class of value templates.
 *
 * @extends cgf.Template.Element
 *
 * @abstract
 */
.init(function(realParent) {
    if(!realParent) throw def.error.argumentRequired('realParent');
    if(DEBUG && !(realParent instanceof cgf_EntityTemplate.Element))
        throw def.error.argumentInvalid('realParent', "Must be an entity element.");

    this.base(realParent);

    /**
     * Gets this element's real parent.
     *
     * The real parent of a value element is
     * the element to which this element is a property of.
     *
     * The parent is the parent of the real parent.
     *
     * @return {cgf.Element} The element's real parent.
     * @memberOf cgf.ValueTemplate.Element#
     * @override
     */
    this.realParent = realParent;
})
.methods(/** @lends cgf.ValueTemplate.Element# */{
    /**
     * Gets this element's **effective** parent.
     *
     * @type {cgf.Element}
     * @override
     */
    get parent() { return this.realParent.parent; },

    /**
     * Gets the scene that contains source data for this element,
     * or `null` when none.
     *
     * This implementation returns the same scene as that of
     * this element's real parent element.
     *
     * @type {any}
     * @override
     */
    get scene() { return this.realParent.scene; },

    /**
     * Gets the element's 0-based _scene_ index.
     *
     * The scene index is always that of its real parent's scene.
     *
     * @type {number}
     * @override
     */
    get index() { return this.realParent.index; }
});