
var cgf_TemplatedElementParentMixin = cgf.TemplatedElementParentMixin = def.Object.extend({
    /**
     * A mixin implementation for templated elements that can be parents.
     *
     * Children are spawned during construction.
     *
     * @constructor
     * @param {cgf.Element} [parent=null] The parent element of this element.
     * @param {object} [scene=null] The scene of this element.
     * @param {number} [index=-1] The index of the scene specified in argument `scene`.
     * @alias TemplatedElementParentMixin
     * @memberOf cgf
     *
     * @class A mixin class for templated elements that can be parents.
     *
     * @extends def.Object
     *
     * @abstract
     */
    init: function(parent, scene, index) {
        // Spawn child templates of this element's template instance.
        this._spawnChildTempls();
    },

    methods: /** @lends cgf.TemplatedElementParentMixin# */{
        /**
         * Gets the child groups array.
         *
         * This array contains one entry for each of
         * child templates of this element's {@link cgf.TemplatedElement#template template}.
         *
         * Each entry then holds an array with the child elements of this element
         * that were spawned by entry's child template.
         *
         * Do **not** directly modify the contents of this array or of
         * any of its child group arrays.
         *
         * @type Array.<Array.<cgf.TemplatedElement>>
         */
        childGroups: null,

        /**
         * Invalidates all property values and re-spawns child elements.
         * @override
         */
        refresh: function() {
            this.base();

            this._spawnChildTempls();
        },

        /**
         * Spawns child templates, if any.
         *
         * This function is a nop if the current element is not `applicable`.
         *
         * @private
         */
        _spawnChildTempls: function() {
            // Need to always evaluate `applicable` eagerly?
            // Or only when there are child templates?
            if(this.applicable) {
                // Has child templates?

                var childTempls = this.template.children,
                    C = childTempls.length;
                if(C) {
                    // Assuming existing child groups won't change in number,
                    // as templates cannot be removed/added.
                    var childGroups = this.childGroups || (this.childGroups = new Array(C)),
                        scene = this.scene,
                        childTempl,
                        ci = -1,
                        storeGroup = function(groupValue) {
                            childGroups[ci] = groupValue;
                        };
                    while(++ci < C) {
                        childTempl = childTempls[ci];
                        this._spawnChildGroup(
                            childTempl,
                            childGroups[ci],
                            storeGroup,
                            childTempl.evalScenes(scene));
                    }
                }
            }
        },

        /**
         * Spawns the child group of a child template.
         *
         * The implementation saves space,
         * in childGroups, by storing single element groups,
         * not as array of single elements,
         * but by storing the single element directly in
         * that group's storage place (abstracted by `storeGroup`).
         *
         * Most template uses have a stable number of scenes across renders.
         * The code is optimized to take advantage of this fact.
         * The first render path is also optimized,
         * by making it be the shortest possible.
         *
         * @param {cgf.Template} childTempl The child template.
         * @param {cgf.Element|Array.<cgfElement>} childGroup The child group.
         * It is either a single element, or an array of two or more elements.
         *
         * @param {function} storeGroup A function that stores the child group.
         * A child group may be stored in a dedicated element property,
         * or in a certain entry of an array,
         * when of a multiple templates property.
         *
         * @param {Array} childScenes The child scenes.
         *
         * @private
         */
        _spawnChildGroup: function(childTempl, childGroup, storeGroup, childScenes) {
            var S0 = !childGroup ? 0 :
                     (childGroup instanceof Array) ? childGroup.length : // > 1
                     1,
                S1 = childScenes.length,
                childElem;

            if(S0 !== S1) {
                // Had scenes, before?
                if(S0) {
                    if(S0 > S1) {
                        // Decreased scenes.
                        if(S0 > 1) {
                            // Was an array.
                            // TODO: Dispose any element above length S1.

                            if(S1 > 1) {
                                // Still an array. Decrease its length.
                                childGroup.length = S1;
                            } else if(S1) { // S1 === 1
                                // Not an array anymore. Move the only kept element out of the array.
                                // Take care to update childGroup variable,
                                // as below, the code counts on it having the value of the
                                // single existing element, if any.
                                storeGroup((childGroup = childGroup[0]));
                            } else {
                                storeGroup(null);
                            }
                        } else { // S0 === 1, S1 === 0
                            // TODO: Dispose the single element.

                            storeGroup(null);
                        }
                    } else { // S0 > 0 && S0 < S1 => S1 > 1
                        // Increased scenes. Will be an array.
                        if(S0 > 1) {
                            // Was an array. Increase its length.
                            childGroup.length = S1;
                        } else { // S1 > 1
                            // Was a single element. Move it to an array.
                            childElem = childGroup;
                            childGroup = new Array(S1);
                            childGroup[0] = childElem;
                            storeGroup(childGroup);
                        }
                    }
                    // else Had no scenes before, but now have.
                } else if(S1 > 1) {
                    storeGroup((childGroup = new Array(S1)));
                }
            }

            if(S1) {
                if(S1 > 1) {
                    var si = 0;
                    do {
                        childElem = this._spawnChildElem(childGroup[si], childTempl, childScenes[si], si);
                        if(childElem) childGroup[si] = childElem;
                    } while(++si < S1);
                } else { // S1 === 1
                    childGroup = this._spawnChildElem(childGroup, childTempl, childScenes[0], 0);
                    if(childGroup) storeGroup(childGroup);
                }
            }
        },

        /**
         * Spawns a new child element or refreshes it, if it already exists.
         * @param {cgf.TemplatedElement} [childElem=null] The child element, if it already exists.
         * @param {cgf.Template} childTempl The child template.
         * @param {object} childScene The child scene.
         * @param {number} index The child scene index.
         *
         * @return {cgf.TemplatedElement} The new child, when it is created,
         * or `undefined`, if it already exists.
         * @private
         */
        _spawnChildElem: function(childElem, childTempl, childScene, index) {
            if(childElem)
                childElem.refresh();
            else
                return childTempl.createElement(this, childScene, index);
        }
    }
});
