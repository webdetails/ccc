
var ε = 1e-6;

function areSameSize(a, b) {
    return def.delta(a.width,  b.width ) < ε &&
           def.delta(a.height, b.height) < ε;
}

// Assuming sizes cannot have -Infinity ...
function isInfiniteSize(a) {
    return !isFinite(a.width) && !isFinite(a.height);
}

function isValidActualSizeDimension(v) {
    return !isNaN(v) && isFinite(v) && v >= 0;
}

function isValidActualSize(s) {
    return !!s && isValidActualSizeDimension(s.width) && isValidActualSizeDimension(s.height);
}

var VIS_FLAGS1 = {
    measuring:     1,
    arranging:     2,

    measureDirty:  4,
    arrangeDirty:  8,
    renderDirty:  16
};

VIS_FLAGS1.arrangeDirtyImplied = VIS_FLAGS1.arrangeDirty | VIS_FLAGS1.renderDirty;
VIS_FLAGS1.measureDirtyImplied = VIS_FLAGS1.measureDirty | VIS_FLAGS1.arrangeDirtyImplied;

var cgf_Visual = cgf.Visual = cgf_Template.extend({
    /**
     * Creates a visual,
     * optionally given a configuration value.
     *
     * @constructor
     * @param {any} [config] A configuration value.
     *
     * @alias Visual
     * @memberOf cgf
     *
     * @class A visual is a template that has a visual representation.
     * Elements spawned by a visual template can be rendered, using a _d3_.
     *
     * @extend cgf.Template
     * @abstract
     */
    init: function(config) {

        this.base(config);

        this._childrenVisual = [];

        // Layout fields

        // The following two are non-null if already measured before.
        this._prefSize = null;
        this._prevAvailSize = null;

        this._flags1 = 0;

        this.render = this.render.bind(this);
    },

    properties: [
        // TODO: DOC ME
        // Plus bounding box?
        (cgf_props.visible = cgf.property("visible",   Boolean)),

        cgf_props.left,
        cgf_props.right,
        cgf_props.top,
        cgf_props.bottom,

        (cgf_props.styleClassName = cgf.property("styleClassName", String ))
    ],

    methods: /** @lends cgf.Visual# */{
        /**
         * Gets the tag name of the main DOM element rendered by this template.
         *
         * Must be a non-empty string.
         *
         * @name cgf.Visual#tagName
         * @type string
         * @abstract
         */

        /**
         * Gets the template's _main_ DOM element's style class name, if any.
         *
         * Note that this is different from the Visual element's
         * {@link cgf.props.styleClassName} property,
         * which is evaluated for each element instance.
         *
         * This getter should be overridden  to provide a class, or classes,
         * that are specific to the template class,
         * to allow styling of its elements.
         *
         * Multiple classes should be separated using spaces.
         *
         * The default implementation returns no style class name.
         *
         * @type string
         */
        get styleClassName() { return ""; },

        /**
         * Ensures that parents of visual elements are of type {@link cgf.ParentVisual}.
         *
         * @param {cgf.Template} newParent The new parent.
         *
         * @override
         * @throws {def.error.argumentInvalid} When argument <i>newParent</i> is not a parent visual.
         */
        _onParentChanging: function(newParent) {
            if(newParent && !(newParent instanceof cgf_ParentVisual))
                throw def.error.argumentInvalid("parent", "Must be a parent visual template.");
        },

        /** @override */
        _onChildAdded: function(child, propInfo) {

            this.base(child, propInfo);

            // Keep track of visual children.
            if(child instanceof cgf_Visual)
                this._childrenVisual.push({template: child, propInfo: propInfo});
        },

        /**
         * Renders the visual in the provided _d3_ update selection.
         *
         * This method can be called freely on any `this` context,
         * which makes it ideal for passing it to d3.Selection#call.
         *
         * @example <caption>Calling <i>render</i> using a d3 selection's <i>call</i> method.</caption>
         * var root = new cgf.Canvas();
         *
         * d3.select('#example')
         *   .data([1, 2])
         *   .call(root.render);
         *
         * @see cgf.render
         *
         * @method
         *
         * @param {d3.Selection} d3SelUpd The d3 update selection object.
         * @return {cgf.Visual} The `this` value.
         */
        render: def.configurable(false, function(d3SelUpd) {
            this._render(d3SelUpd);
            return this;
        }),

        /**
         * Actually renders a visual in a _d3_ update selection.
         *
         * @param {d3.Selection} d3SelUpd The d3 update selection object.
         * @protected
         * @virtual
         */
        _render: function(d3SelUpd) {
            this._renderEnter(d3SelUpd.enter());

            this._renderEnterOrUpdate(d3SelUpd);

            this._renderExit(d3SelUpd.exit());
        },

        _renderEnter: function(d3SelEnter) {
            return d3SelEnter.append(this.tagName)
                .attr("class", function(elem) {
                    return def.string.join(" ", elem.template.styleClassName, elem.styleClassName);
                });
        },

        _renderEnterOrUpdate: function(d3SelUpd) {
            return d3SelUpd;
        },

        _renderExit: function(d3SelExit) {
            d3SelExit.remove();
            return d3SelExit;
        },

        _renderContentEnter: function(d3ContentSelEnter) {
            if(d3ContentSelEnter.length) {
                var childInfos = this._childrenVisual,
                    C = childInfos.length,
                    i = -1;

                while(++i < C)
                    d3ContentSelEnter.append("g")
                        // TODO: Also need name of template class
                        .attr("class", "cgf-child-group");
            }
        },

        _renderContent: function(d3ContentSelUpd) {
            var childInfos = this._childrenVisual,
                C = childInfos.length;
            if(C) {
                var me = this;
                d3ContentSelUpd
                    .selectAll("g.cgf-child-group")
                    .each(function(parentElem, visualChildIndex) {
                        var childInfo  = childInfos[visualChildIndex],
                            propInfo   = childInfo.propInfo,
                            prop       = propInfo.prop,
                            childGroup = propInfo.isAdhoc
                                ? parentElem.get(prop)
                                : parentElem[prop.shortName];

                        me._renderChildGroup(
                            d3.select(this),
                            childInfo.template,
                            prop.isList
                                ? childGroup[childInfo.template.childIndex]
                                : childGroup);
                    });
            }
        },

        _renderChildGroup: function(d3GroupSel, childTempl, childGroup) {
            var key;
            if(childGroup) {
                var d3ChildSelUpd = d3GroupSel.selectAll(childTempl.tagName)
                    .data(def.array.to(childGroup), key);

                childTempl.render(d3ChildSelUpd);
            }
        }
    }
});

cgf_Visual.type().add({
    defaults: new cgf_Visual()
        .proto(cgf_Template.defaults)
        .visible(true)
});

