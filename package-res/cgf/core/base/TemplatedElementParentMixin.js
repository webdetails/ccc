
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
                        ci = -1;
                    while(++ci < C) {
                        childTempl = childTempls[ci];
                        this._spawnChildGroup(childTempl, ci, childGroups, childTempl.evalScenes(scene));
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
         * that group's position in `childGroups`.
         *
         * Most template uses do have a stable number
         * of scenes across renders.
         * The code is optimized to take advantage of this fact.
         * The first render is also optimized,
         * by making it traverse the shortest possible path.
         *
         * @param {cgf.Template} childTempl The child template.
         * @param {number} ci The child template index.
         * @param {Array} childGroups The child groups array.
         * @param {Array} childScenes The child scenes.
         * @private
         */
        _spawnChildGroup: function(childTempl, ci, childGroups, childScenes) {
            var childGroup = childGroups[ci],
                S0 = !childGroup ? 0 :
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
                                childGroups[ci] = childGroup = childGroup[0];
                            } else {
                                childGroups[ci] = null;
                            }
                        } else { // S0 === 1, S1 === 0
                            // TODO: Dispose the single element.

                            childGroups[ci] = null;
                        }
                    } else { // S0 > 0 && S0 < S1 => S1 > 1
                        // Increased scenes. Will be an array.
                        if(S0 > 1) {
                            // Was an array. Increase its length.
                            childGroup.length = S1;
                        } else { // S1 > 1
                            // Was a single element. Move it to an array.
                            childElem = childGroup;
                            childGroup = childGroups[ci] = new Array(S1);
                            childGroup[0] = childElem;
                        }
                    }
                // else Had no scenes before, but now have.
                } else if(S1 > 1) {
                    childGroups[ci] = childGroup = new Array(S1);
                }
            }

            var spawnElem = function(childElem, childScene, si) {
                if(childElem)
                    childElem.refresh();
                else
                    return childTempl.createElement(this, childScene, si);
            };

            if(S1) {
                if(S1 > 1) {
                    var si = 0;
                    do {
                        childElem = spawnElem(childGroup[si], childScenes[si], si);
                        if(childElem) childGroup[si] = childElem;
                    } while(++si < S1);
                } else { // S1 === 1
                    childGroup = spawnElem(childGroup, childScenes[0], 0);
                    if(childGroup) childGroups[ci] = childGroup;
                }
            }
        }
    }
});
