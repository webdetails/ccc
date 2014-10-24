
var O_hasOwnProp = Object.prototype.hasOwnProperty;

var cgf_TemplatedElement = cgf.TemplatedElement = cgf_Element.extend({
    /**
     * Creates a templated element instance,
     * given its scene,
     * parent element and
     * child index.
     *
     * After initializing itself,
     * its child elements are created.
     *
     * @constructor
     * @param {cgf.Element} [parent=null] The parent element of this element.
     * @param {object} [scene=null] The scene of this element.
     * @param {number} [index=-1] The index of the scene specified in argument `scene`.
     * @alias TemplatedElement
     * @memberOf cgf
     *
     * @class A templated element whose content
     * follows the structure of an associated template instance.
     *
     * @extends cgf.Element
     *
     * @abstract
     */
    init: function(parent, scene, index) {

        this.base(parent, scene, index);

        // Spawn child templates of this element's template instance.
        this._spawnChildTempls();
    },

    methods: /** @lends cgf.TemplatedElement# */{

        /**
         * Gets the associated template instance.
         *
         * Each template instance has a corresponding
         * {@link cgf.TemplatedElement} class.
         *
         * @type cgf.Template
         */
        template: null,

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
         * Gets the base property values dictionary from which
         * instance dictionaries inherit.
         *
         * This dictionary maps property unique names to property values.
         * It is used to contain the shared values of
         * constant template properties.
         *
         * @type Object.<string,any>
         * @private
         */
        _propsBase: {},

        /**
         * Creates this instance's property values dictionary.
         *
         * Creates a dictionary that has the class'
         * custom {@link cgf.TemplatedElement#_propsBase}
         * as a prototype.
         * This dictionary is shared by all instances of each {@link cgf.TemplatedElement} sub-class and
         * holds the value of constant properties
         * (those that don't depend on the instance's scene data).
         *
         * @return {Object.<string, any>} The created property values dictionary.
         * @protected
         * @override
         */
        _createProperties: function() {
            return Object.create(this._propsBase);
        },

        /**
         * Gets the value of the specified property.
         *
         * @param {cgf.property} prop The property.
         * @return {any} The value of the property in this element, or <tt>undefined</tt>,
         * if not present.
         */
        get: function(prop) {
            // If the property has a local dedicated accessor, use it.
            // Otherwise, for any other properties, directly access the _props map.
            return O_hasOwnProp.call(this, prop.shortName)
                ? this[prop.shortName]()
                : this._props[prop.fullName];
        },

        /**
         * Sets the value of the specified property to the specified value.
         *
         * This operation is not supported if the specified property
         * is calculated in this element.
         *
         * @param {cgf.property} prop The property.
         * @param {any} value The new value.
         * An <tt>undefined</tt> value is ignored.
         * A `null` value resets the property value.
         *
         * @return {cgf.Element} This instance.
         * @throws {def.error.operationInvalid} If the property in argument `prop`
         * is being calculated in this element.
         */
        set: function(prop, value) {
            // Cannot set properties that have a local dedicated accessor,
            //  cause those are of calculated properties.

            if(O_hasOwnProp.call(this, prop.shortName))
                throw def.error.operationInvalid("The property '{0}' is calculated and cannot be set.", [prop.shortName]);

            // A free property can be set.

            if(value !== undefined) {
                // TODO: property cast is not being handled...
                this._props[prop.fullName] = value === null ? undefined : value;
            }

            return this;
        },

        /**
         * Invalidates all property values and re-spawns child elements.
         */
        refresh: function() {
            this._props = Object.create(this._propsBase);
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
                    var childGroups = this.childGroups = new Array(C),
                        scene = this.scene,
                        childTempl, childScenes, childGroup, S, si, ci, childElem;

                    // Assuming existing child groups won't change in number
                    // as templates cannot be removed/added.
                    ci = -1;
                    while(++ci < C) {
                        childTempl  = childTempls[ci];
                        childScenes = childTempl.evalScenes(scene);
                        S = childScenes.length;
                        if((childGroup = childGroups[ci]))
                            // Discard any extra child elements
                            childGroup.length = childScenes.length;
                        else
                            childGroups[ci] = childGroup = new Array(childScenes.length);

                        si = -1;
                        while(++si < S) {
                            if((childElem = childGroup[si]))
                                childElem.refresh();
                            else
                                childGroup[si] = childTempl.createElement(this, childScenes[si], si);
                        }
                    }
                }
            }
        }
    }
});
