
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
     * optionally given its parent visual and configuration.
     *
     * @constructor
     * @param {cgf.Visual} [parent=null] The parent visual.
     * @param {object} [config] A configuration object.
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
    init: function(parent, config) {
        if(parent && !(parent instanceof cgf_Visual))
            throw def.error.argumentInvalid("parent", "Must be a visual template.");

        this.base(parent, config);

        this._childrenVisual = [];

        // Layout fields

        // The following two are non-null if already measured before.
        this._prefSize = null;
        this._prevAvailSize = null;

        this._flags1 = 0;

        this.render = this.render.bind(this);
    },

    properties: [
        // Plus bounding box?
        (cgf_props.visible = cgf.property("visible",   Boolean)),

        (cgf_props.left    = cgf.property("left",      Number )),
        (cgf_props.top     = cgf.property("top",       Number )),
        (cgf_props.right   = cgf.property("right",     Number )),
        (cgf_props.bottom  = cgf.property("bottom",    Number )),

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

        /** @override */
        _onChildAdded: function(child) {
            // Keep track of visual children.
            if(child instanceof cgf_Visual) this._childrenVisual.push(child);
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
                .attr("class", function(elem) { return elem.evalStyleClassNames(); });
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
                var childTempls = this._childrenVisual,
                    C = childTempls.length,
                    i = -1;

                while (++i < C)
                    d3ContentSelEnter.append("g")
                        // TODO: Also need name of template class
                        .attr("class", "cgf-child-group");
            }
        },

        _renderContent: function(d3ContentSelUpd) {
            var childTempls = this._childrenVisual,
                C = childTempls.length;
            if(C) {
                var me = this;
                d3ContentSelUpd.selectAll("g.cgf-child-group").each(function(parentElem, visualChildIndex) {
                    var childTempl = childTempls[visualChildIndex];
                    me._renderChildGroup(
                        d3.select(this),
                        childTempls[visualChildIndex],
                        parentElem.childGroups[childTempl.childIndex]);
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
    },

    element: {
        methods: {
            /**
             * Builds the style class names of the element.
             * This involves joining
             * the template instance's style class name
             * and this element's style class name.
             *
             * @return {String} The element's effective style class names.
             */
            evalStyleClassNames: function() {
                return def.string.join(" ", this.template.styleClassName, this.styleClassName);
            },

            // TODO: Coordinate space: local? parent? ...

            /**
             * Measures the element's size, given a certain available size,
             * for layout purposes.
             *
             * If the element is not applicable, then its size is zero.
             *
             * The measurement should respect the
             * element's size-related properties into account,
             * as specified by the user,
             * such as:
             * {@link cgf.props.left},
             * {@link cgf.props.top},
             * {@link cgf.props.right},
             * {@link cgf.props.bottom},
             * {@link cgf.props.width},
             * {@link cgf.props.widthMin},
             * {@link cgf.props.widthMax},
             * {@link cgf.props.height},
             * {@link cgf.props.heightMin},
             * {@link cgf.props.heightMax},
             * {@link cgf.props.margin},
             * {@link cgf.props.padding},
             * etc.
             *
             * @param {cgf.Size} [availSize] The available size.
             * When not specified, the previous measurement's available size is used,
             * or, in case this is the first measurement,
             * a size with both dimensions having the value `Infinity`.
             *
             * In general, one or both of the size dimensions may be `Infinity`.
             * This indicates that the element's size along those dimensions is unconstrained —
             * has all the size it may need.
             *
             * This also indicates that it should determine the size it needs
             * to fit all of its content along those dimensions —
             * this is a "size to content" mode of layout.
             *
             * For the dimensions having a non-infinite value,
             * it is the maximum available size that the element can take,
             * along those dimensions,
             * without having to resort to clipping or scrolling of its content.
             *
             * @return {cgf.Visual} This instance.
             */
            layoutMeasure: function(availSize) {
                // If we're going to store the computed values in the same properties,
                // we need to take care to un-define its value before...

                // Where can the parent's font and width/height,
                // for the purpose of relative measures' absolutization,
                // be read from?

                // Need they be specified as arguments?
                // Can they simply be read from the parent? From where?

                // Main method should check:
                //  * Not Measuring already.
                //  * Is Visible or Occupies Space when hidden?
                //  * IsMeasureDirty || NeverMeasured?
                //  * IsAvailableSizeCloseToPrevious?
                //  * Check not measuring already.
                //
                // * Set Measuring = true
                // Call measure core
                // Update DesiredSize
                // * Set IsMeasureDirty = false
                // * Set NeverMeasured  = false
                // * Set Measuring      = false

                if(!this._isMeasuring) {

                    var prevAvailSize = this._prevAvailSize;
                    if(prevAvailSize) {
                        // Already measured, at least once.

                        // Is current measurement clean?
                        if(!this._isMeasureDirty) {

                            // If, however, a different available size is being specified,
                            // we must do the measurement anyway.
                            if(availSize) {
                                // Compare if they are "the same".
                                if(areSameSize(prevAvailSize, availSize)) return this;
                            } else {
                                // The default available size is infinite: {width: Infinity, height: Infinity}.
                                // Was the previous size also Infinite?
                                if(isInfiniteSize(prevAvailSize)) return this;
                            }
                        }
                        // else if previous measurement is marked dirty, just do it, whatever the case.
                    }

                    // Must do the measurement.

                    if(!availSize) availSize = prevAvailSize || {width: Infinity, height: Infinity};

                    var prefSize;
                    if(this.applicable) {
                        this._isMeasuring = true;
                        try {
                            prefSize = this._layoutMeasureCore(availSize);
                        } finally {
                            this._isMeasuring = false;
                        }

                        if(!isValidActualSize(prefSize)) throw def.error.operationInvalid("Invalid measured size.");
                    } else {
                        // Does not occupy space...
                        prefSize = {width: 0, height: 0};
                    }

                    this._prevAvailSize  = availSize;
                    this._prefSize       = prefSize;
                    this._isMeasureDirty = false;
                }

                return this;
            },

            _layoutMeasureCore: function(availSize) {
                return {width: 0, height: 0};
            },

            /**
             * Gets the preferred size of this element,
             * according to its last measurement, if any,
             * or `null` if it hasn't been measured before.
             *
             * Note that the returned preferred size may be currently dirty.
             * To make sure that an up-to-date preferred size,
             * {@link cgf.Visual#layoutMeasure} must be called before.
             *
             * @example
             * <pre>
             * var elem = new Visual().createElement();
             * var prefSize = elem.layoutMeasure().preferredSize();
             * </pre>
             *
             * @return {cgf.Size} The element's preferred size.
             */
            get preferredSize() { return this._prefSize; },

            // State
            get _beenMeasured () { return this._prevAvailSize != null; },

            get _isMeasuring( ) { return (this._flags1 & VIS_FLAGS1.measuring) !== 0; },
            set _isMeasuring(v) { def.bit.set(this._flags1, VIS_FLAGS1.measuring, v); },

            get _isArranging( ) { return (this._flags1 & VIS_FLAGS1.arranging) !== 0; },
            set _isArranging(v) { def.bit.set(this._flags1, VIS_FLAGS1.arranging, v); },

            get _isMeasureDirty( ) { return (this._flags1 & VIS_FLAGS1.measureDirty) !== 0; },
            set _isMeasureDirty(v) {
                if(v) this._flags1 |= VIS_FLAGS1.measureDirtyImplied;
                else  this._flags1 &= ~VIS_FLAGS1.measureDirty;
            },

            get _isArrangeDirty( ) { return (this._flags1 & VIS_FLAGS1.arrangeDirty) !== 0; },
            set _isArrangeDirty(v) {
                if(v) this._flags1 |= VIS_FLAGS1.arrangeDirtyImplied;
                else  this._flags1 &= ~VIS_FLAGS1.arrangeDirty;
            },

            get _isRenderDirty()   { return (this._flags1 & VIS_FLAGS1.renderDirty) !== 0; },
            set _isRenderDirty(v)  { def.bit.set(this._flags1, VIS_FLAGS1.renderDirty, v); }
        }
    }
});

cgf_Visual.type().add({
    defaults: new cgf_Visual()
        .proto(cgf_Template.defaults)
        .visible(true)
});

