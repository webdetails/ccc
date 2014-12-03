/**
 * @name cgf.dom.Template.Element.PropertyValueHolder
 * @class
 * @property {number} version The version of
 * the property's property group, on the element,
 * by the time that the property was last evaluated.
 *
 * Constant properties have a version value of `Infinity`.
 *
 * @see cgf.dom.Template.Element#versions
 *
 * @property {any} value The value of the property.
 * The type of value depends on whether the property is atomic, structural, or list-structural.
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
        // TODO: this doclet is outdated
        /**
         * Map from property full name to property value holder.
         *
         * For ad hoc properties, its value is stored directly in the map.
         *
         * This map has the class' {@link cgf.dom.Template.Element#_propsStaticStable}
         * as prototype, so that it inherits the values of
         * constant properties.
         *
         * @type Array.<Object.<string, any|cgf.dom.Template.Element.PropertyValueHolder>>
         * @memberOf cgf.dom.Template.Element#
         * @private
         */
        this._props = {
            "0": Object.create(this._propsStaticStable), // Stable prop values
            "1": {} // Interaction prop. values
        };

        /**
         * Map from builder name to a boolean.
         *
         * Allows detecting reentry in the builder methods.
         *
         * This will be replaced by a more performant bit array implementation.
         *
         * @name _evaluating
         * @memberOf cgf.dom.Template.Element#
         * @type Object.<string, boolean>
         * @internal
         * @private
         * @abstract
         */

        // TODO: -1 ever gets assigned to the property
        // or is always handled inside the property getters?

        /**
         * The current property value type index.
         * Can take on the values:
         * <ul>
         *     <li>`-1` — Static values,</li>
         *     <li>`0` — Stable values, and</li>
         *     <li>`1` - Interaction values</li>
         * </ul>
         *
         * Defaults to the highest value layer, `1`.
         * @name _vlayer
         * @memberOf cgf.dom.Template.Element#
         * @type number
         * @internal
         * @private
         * @abstract
         */

        /**
         * The versions map stores the version numbers
         * for relevant property groups.
         *
         * Its keys are the following:
         * <ul>
         *      <li>`0` — bits 00 - Structural &amp; Stable</li>
         *      <li>`2` — bits 10 - Atomic &amp; Stable</li>
         *      <li>`3` — bits 11 - Atomic &amp; Interaction</li>
         * </ul>
         *
         * Given two variables, `isAtomic` and `isInteraction`,
         * the key can be determined as follows:
         *
         *     isInteraction ? 3 : isAtomic ? 2 : 0
         *
         * We could also use some bitwise magic.
         *
         * The version values default to their parent's, if any, or
         * to `0`, if none.
         *
         * @name _versions
         * @memberOf cgf.dom.Template.Element#
         * @type Object.<string, number>
         * @internal
         * @private
         * @abstract
         */

        // Property invalidation hierarchy
        // +-------+-------------+--------------+------------+
        // |       |             |      Property Types       |
        // + Order + Value Layer +--------------+------------+
        // |       |             |   Structural |   Atomic   |
        // +-------+-------------+--------------+------------+
        // |   1   | Stable      |       o      |            |
        // |   2   | Stable      |              |      o     |
        // |   3   | Interaction |      ---     |      o     |
        // +-------+-------------+--------------+------------+

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
        _propsStaticStable: {},

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
                // else, values are stored directly; versioning does not apply.
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

        _evalInLayer: function(fun, vlayer) {
            var vlayerPrev = this._vlayer;

            if(vlayer === vlayerPrev) return fun.call(this);

            this._vlayer = vlayer;
            try {
                return fun.call(this);
            } finally {
                this._vlayer = vlayerPrev;
            }
        },

        _spawnStructuralProp: function(propInfo) {
            // Structural or Structural array
            var value = this.template._getStructural(propInfo);
            if(value)
                return propInfo.prop.isList
                    ? this._spawnStructuralListProp(propInfo, value)
                    : this._spawnStructuralSingleProp(propInfo, value);
        },

        _spawnStructuralSingleProp: function(propInfo, childTempl) {
            var valueHolder = this._props[STABLE_LAYER][propInfo.prop.fullName];

            return this._spawnChildGroup(
                childTempl,
                /*childGroup:*/valueHolder && valueHolder.value,
                childTempl.evalScenes(this.scene));
        },

        _spawnStructuralListProp: function(propInfo, childTempls) {
            var C = childTempls.length;
            if(C) {
                // NOTE: Assuming existing child groups won't change in number,
                // as templates cannot be removed/added.
                // Each position is occupied by the the instance(s) of one of the
                // C templates in value.
                var valueHolder = this._props[STABLE_LAYER][propInfo.prop.fullName],
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
         * Spawns a new child element or
         * invalidates it, to the (real) parent versions,
         * if it already exists.
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
                // Part elements do not have own versions.
                // Invalidate an Entity element to its
                // Entity parent's version.
                if(childTempl instanceof cgf_dom_EntityTemplate)
                    childElem._invalidateToParent();

            } else {
                childElem = childTempl.createElement(this, childScene, index);
            }

            return childElem;
        },

        dispose: function() {

        }
    });
