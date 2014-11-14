
cgf_dom_ValueTemplate.Element
/**
 * Creates a value template instance given its _real_ parent element.
 *
 * @name cgf.dom.ValueTemplate.Element
 *
 * @constructor
 * @param {cgf.EntityElement} realParent The _real_ parent element of this value element.
 *
 * @class The element class of value templates.
 *
 * @extends cgf.dom.Template.Element
 *
 * @abstract
 */
.init(function(realParent) {
    if(!realParent) throw def.error.argumentRequired('realParent');
    if(DEBUG && !(realParent instanceof cgf_dom_EntityTemplate.Element))
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
     * @return {cgf.dom.Element} The element's real parent.
     * @memberOf cgf.dom.ValueTemplate.Element#
     * @override
     */
    this.realParent = realParent;
})
.methods(/** @lends cgf.dom.ValueTemplate.Element# */{
    /**
     * Gets this element's **effective** parent.
     *
     * @type {cgf.dom.Element}
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
    get index() { return this.realParent.index; },

    /**
     * Determines the absolute value of a number in a given unit.
     *
     * This implementation delegates the evaluation to the real parent element.
     *
     * @param {number} num The number to evaluate, expressed in unit _unit_.
     * @param {number} unit The unit in which _num_ is expressed.
     *
     * @return {number} The absolute value, or `NaN`, when the unit is not defined,
     * or it cannot be evaluated in the current state.
     *
     * @override
     */
    evalUnit: function(num, unit) {
        return this.realParent.evalUnit(num, unit);
    }
});