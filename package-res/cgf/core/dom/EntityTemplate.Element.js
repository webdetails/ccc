
cgf_dom_EntityTemplate.Element
    /**
     * Creates an entity template element,
     * optionally given its
     * parent element,
     * scene and
     * scene index.
     *
     * @name cgf.dom.EntityTemplate.Element
     *
     * @class The element class of an entity template.
     *
     * This class is abstract.
     * To create an instance you should use {@link cgf.dom.EntityTemplate#createElement}.
     *
     * @extends cgf.dom.Template.Element
     *
     * @abstract
     *
     * @constructor
     * @param {cgf.dom.Element} [parent] The parent element.
     * @param {any} [scene] The scene.
     * @param {number} [index] The scene index.
     */
    .init(function(parent, scene, index) {

        this.base(parent); // <-- _props

        // NOTE: in the following, the only way I managed to make JsDocs
        // not ignore the doclets was by using @name instead of @memberOf.
        // Otherwise, the base class' abstract versions would always show...

        /**
         * Gets the element's parent element, or `null` if none.
         *
         * This property is immutable.
         *
         * @name cgf.dom.EntityTemplate.Element#parent
         * @type {cgf.dom.Element}
         * @override
         */
        this.parent = parent || null;

        /**
         * Gets the scene that contains source data for this element,
         * or `null` when none.
         *
         * @type {object}
         * @name cgf.dom.EntityTemplate.Element#scene
         * @override
         */
        this.scene = scene || null;

        /**
         * Gets the element's 0-based _scene_ index,
         * or `0` if it has no specified index.
         *
         * @type {number}
         * @name cgf.dom.EntityTemplate.Element#index
         * @override
         */
        this.index = index || 0;

        var pvs = parent && parent._versions;
        this._versions = {
            "0": pvs ? pvs[0] : 0,
            "2": pvs ? pvs[2] : 0,
            "3": pvs ? pvs[3] : 0
        };

        this._evaluating = {};
    })

    .add(/** @lends cgf.dom.EntityTemplate.Element# */{

        /**
         * Gets this element's real parent, or `null`, if none.
         *
         * This property is immutable.
         *
         * @type {cgf.dom.Element}
         * @override
         */
        get realParent() { return this.parent; },

        /**
         * Invalidates all properties.
         *
         * These will be re-evaluated the next time they are read.
         *
         * @override
         */
        invalidate: function() {
            var vs = this._versions;
            vs[0] = vs[2] = vs[3] = def.nextId("cgf-element-version");
        },

        /**
         * Invalidates the interaction properties.
         *
         * These will be re-evaluated the next time they are read.
         *
         * Note that all interaction properties are atomic.
         *
         * @override
         */
        invalidateInteraction: function() {
            this._versions[ATOMIC_INTERA_GROUP] = def.nextId("cgf-element-version");
        },

        /**
         * Updates the versions of this element,
         * to the corresponding versions in the parent element.
         *
         * Assumes that a parent element exists and it is an entity template element.
         *
         * This method is called,
         * after the property containing this element in the
         * parent element is re-spawned/re-evaluated,
         * to mark all of this element's properties as invalid.
         *
         * @see cgf.dom.Template.Element#_spawnChildElem
         *
         * @internal
         */
        _invalidateToParent: function() {
            // `parent` may be a part element, of an entity element.
            // In that case, `_versions` is directed to that of
            // the entity element owning that part, so we're ok.
            var vs  = this._versions,
                pvs = this.parent._versions;

            vs[0] = Math.max(vs[0], pvs[0]);
            vs[2] = Math.max(vs[2], pvs[2]);
            vs[3] = Math.max(vs[3], pvs[3]);
        }
    });
