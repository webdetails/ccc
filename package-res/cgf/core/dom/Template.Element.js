/**
 * @name cgf.dom.Template.Element.PropertyValueHolder
 * @class
 * @property {number} version The version of the element, {@link cgf.dom.Template.Element#version},
 * when the property was last evaluated.
 * Constant properties have a version value of `Infinity`.
 *
 * @property {any} value The value of the property.
 * The type of value depends on whether the property is simple, complex, or list-complex.
 *
 * @private
 */

var cgf_dom_TemplatedElement = cgf_dom_Element.extend()
    /**
     * Creates a templated element, optionally given its parent element.
     *
     * @constructor
     * @param {cgf.dom.Element} parent The parent element.
     *
     * @name cgf.dom.Template.Element
     *
     * @class An element whose
     * content structure and property values
     * follow the configuration of an associated template instance.
     *
     * This class' constructor is the value of {@link cgf.dom.Template.Element}.
     *
     * This is the base abstract class of elements spawned by templates.
     * It provides the properties storage implementation.
     *
     * Every sub-class of {@link cgf.dom.Template} has its own
     * sub-class of {@link cgf.dom.Template.Element},
     * accessible in the static property _Element_.

     * All these element classes are abstract.
     * Finally, each template instance,
     * gets a final non-abstract element class,
     * derived from its class' element class.
     *
     * @extends cgf.dom.Element
     *
     * @abstract
     */
    .init(function(parent) {
        /**
         * Map from property full name to property value holder.
         *
         * For ad hoc properties, its value is stored directly in the map.
         *
         * This map has the class' {@link cgf.dom.Template.Element#_propsBase}
         * as prototype, so that it inherits the values of
         * constant properties.
         *
         * @type Object.<string, any|cgf.dom.Template.Element.PropertyValueHolder>
         * @memberOf cgf.dom.Template.Element#
         * @private
         */
        this._props = Object.create(this._propsBase);

        /**
         * Gets the current version of the element.
         *
         * Defaults to the parent element's version, if any, or `0`, if none.
         *
         * @memberOf cgf.dom.Template.Element#
         * @type number
         */
        this.version = +(parent && parent.version) || 0;
    })

    .add(/** @lends cgf.dom.Template.Element# */{

        /**
         * Gets the associated template instance.
         *
         * Each template instance has a corresponding {@link cgf.dom.Template.Element} class.
         *
         * This property is stored in the class' prototype object
         * and is thus shared by all of its instances.
         *
         * @type cgf.dom.Template
         */
        template: null,

        /**
         * Gets the base property values dictionary from which
         * instance dictionaries inherit.
         *
         * This dictionary maps property unique names to property value holders.
         * It is used to contain the shared values of
         * constant template properties.
         *
         * Note that this property is stored in the class' prototype object,
         * and is thus shared by all of its instances.
         *
         * @type Object.<string,cgf.dom.Template.Element.PropertyValueHolder>
         * @private
         */
        _propsBase: {},

        /**
         * Gets the scene that contains source data for this element,
         * or `null` when none.
         * @name cgf.dom.Template.Element#scene
         * @type any
         * @abstract
         */

        /**
         * Gets the element's 0-based _scene_ index,
         * or `-1` if it has no specified index.
         * @name cgf.dom.Template.Element#index
         * @type number
         * @abstract
         */

        // TODO: Test elements' direct get/set interface

        /**
         * Gets the value of the specified property.
         *
         * @param {cgf.dom.Property} prop The property.
         * @return {any} The value of the property in this element, or `undefined`,
         * if not present.
         */
        get: function(prop) {
            // If the property has a local dedicated accessor, use it.
            // Otherwise, for any other properties, directly access the _props map.
            return O_hasOwnProp.call(this, prop.shortName)
                ? this[prop.shortName] // getter
                // else, values are stored directly; versionning does not apply.
                : this._props[prop.fullName];
        },

        /**
         * Sets the value of the specified property to the specified value.
         *
         * This operation is not supported if the specified property
         * is calculated in this element.
         *
         * @param {cgf.dom.Property} prop The property.
         * @param {any} value The new value.
         * An `undefined` value is ignored.
         * A `null` value resets the property value.
         *
         * @return {cgf.dom.Element} This instance.
         * @throws {def.error.operationInvalid} If the property in argument <i>prop</i>
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
         * Invalidates all properties.
         *
         * These will be re-evaluated the next time they are read.
         *
         * @override
         */
        invalidate: function() {
            this.version = def.nextId("cgf.element");
        },

        _spawnComplexProp: function(propInfo) {
            // Complex or Complex array
            var value = this.template._getComplex(propInfo);
            if(value)
                return propInfo.prop.isList
                    ? this._spawnComplexListProp(propInfo, value)
                    : this._spawnComplexSingleProp(propInfo, value);
        },

        _spawnComplexSingleProp: function(propInfo, childTempl) {
            var valueHolder = this._props[propInfo.prop.fullName];

            return this._spawnChildGroup(
                childTempl,
                /*childGroup:*/valueHolder && valueHolder.value,
                childTempl.evalScenes(this.scene));
        },

        _spawnComplexListProp: function(propInfo, childTempls) {
            var C = childTempls.length;
            if(C) {
                // NOTE: Assuming existing child groups won't change in number,
                // as templates cannot be removed/added.
                // Each position is occupied by the the instance(s) of one of the
                // C templates in value.
                var valueHolder = this._props[propInfo.prop.fullName],
                    childGroups = (valueHolder && valueHolder.value) || new Array(C),
                    scene = this.scene,
                    childTempl,
                    ci = -1;
                while(++ci < C) {
                    childTempl = childTempls[ci];
                    childGroups[ci] = this._spawnChildGroup(
                        childTempl,
                        childGroups[ci],
                        childTempl.evalScenes(scene));
                }

                return childGroups;
            }
        },

        /**
         * Spawns the child group of a child template.
         *
         * @param {cgf.dom.Template} childTempl The child template.
         * @param {cgf.dom.Element|Array.<cgf.dom.Element>} childGroup The child group.
         * It is either a single element, or an array of two or more elements.
         *
         * @param {Array} childScenes The child scenes.
         *
         * @return {cgf.dom.Element|Array.<cgf.dom.Element>} The resulting child group.
         *
         * @private
         */
        _spawnChildGroup: function(childTempl, childGroup, childScenes) {
            if(childScenes && childScenes instanceof Array) {
                var S1 = childScenes.length, i;

                if(childGroup) {
                    var S0 = childGroup.length;
                    if(S0 > S1) for(i = S1; i < S0; i++) childGroup[i].dispose();

                    if(S0 !== S1) childGroup.length = S1;
                } else {
                    childGroup = new Array(S1);
                }

                i = -1;
                while(++i < S1)
                    childGroup[i] = this._spawnChildElem(childGroup[i], childTempl, childScenes[i], i);

            } else {
                if(childScenes == null && childGroup)
                    throw def.error.operationInvalid("Inconsistent scenes function.");

                // Single element. Note the 0 index.
                childGroup = this._spawnChildElem(childGroup, childTempl, childScenes, 0);
            }

            return childGroup;
        },

        /**
         * Spawns a new child element or updates its version, if it already exists.
         *
         * @param {cgf.dom.Template.Element} [childElem=null] The child element, if it already exists.
         * @param {cgf.dom.Template} childTempl The child template.
         * @param {object} childScene The child scene.
         * @param {number} index The child scene index.
         *
         * @return {cgf.dom.Template.Element} The child element.
         * @private
         */
        _spawnChildElem: function(childElem, childTempl, childScene, index) {
            if(childElem) {
                // Invalidate it to parent version, unless it is at a higher version.
                childElem.version = Math.max(childElem.version, this.version);
            } else {
                childElem = childTempl.createElement(this, childScene, index);
            }
            return childElem;
        },

        dispose: function() {

        }
    });
