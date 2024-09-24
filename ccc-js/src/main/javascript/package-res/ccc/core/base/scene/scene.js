/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a scene.
 *
 * @name pvc.visual.Scene
 * @class Scenes guide the rendering of protovis marks;
 * they are supplied to {@link pv.Mark} <tt>data</tt> property.
 * <p>
 * A scene may feed several marks and so is not specific to a given mark
 * (contrast with protovis' instances/scenes).
 * </p>
 * <p>
 * Scenes provide a well defined interface to pvc's
 * extension point functions.
 * </p>
 * <p>
 * Scenes hold precomputed data, that does not change with interaction,
 * and that is thus not recalculated in every protovis render caused by interaction.
 * </p>
 * <p>
 * Scenes bridge the gap between data and visual roles.
 * Data can be accessed by one or the other view.
 * </p>
 *
 * @borrows pv.Dom.Node#visitBefore as #visitBefore
 * @borrows pv.Dom.Node#visitAfter as #visitAfter
 *
 * @borrows pv.Dom.Node#nodes as #nodes
 * @borrows pv.Dom.Node#firstChild as #firstChild
 * @borrows pv.Dom.Node#lastChild as #lastChild
 * @borrows pv.Dom.Node#previousSibling as #previousSibling
 * @borrows pv.Dom.Node#nextSibling as #nextSibling
 *
 *
 * @property {cdo.Data}  group The data group that's present in the scene, or <tt>null</tt>, if none.
 * @property {cdo.Datum} datum The datum that's present in the scene, or <tt>null</tt>, if none.
 * @property {object} atoms The map of atoms, by dimension name, that's present in the scene, or <tt>null</tt>, if none.
 * <p>
 * When there is a group, these are its atoms,
 * otherwise,
 * if there is a datum,
 * these are its atoms.
 * </p>
 * <p>
 * Do <b>NOT</b> modify this object.
 * </p>
 *
 * @constructor
 * @param {pvc.visual.Scene} [parent=null] The parent scene.
 * @param {object} [keyArgs] Keyword arguments.
 * @property {cdo.Datum | cdo.Data | cdo.Datum[] | cdo.Data[]}
 *  [keyArgs.source=null]
 *  The data source(s) that are present in the scene.
 */
function SceneMetaType() {
    def.MetaType.apply(this, arguments);
    this._vars = def.create(this.baseType && this.baseType._vars);
}

def.MetaType.subType( SceneMetaType, {
    methods: /** @lends pvc.visual.Scene */{
        // Custom scene classes
        // Define a custom scene subclass that contains certain vars, for serving a certain
        // panel's scenes; for example: BarChartSeriesScene and BarChartSeriesAndCategoryScene.
        // Each instance of such sub-classes will evaluate the values of its vars.
        //
        // External extension must affect all instances of a given custom scene sub-class.
        // This implies sub-classing once more, this time the custom sub-class,
        // to be able to override the default vars' methods.
        // Note that no new vars will be defined,
        // just overrides of the base classes' default var functions.
        // Possibly, we could let the user declare additional vars
        // that could be used to store shared state.
        // Overriding default vars' methods may not be done by normal sub-classing
        // as some post-processing is required of the result of such functions.
        // Overriding a default _core_ method would make sense though.
        variable: function(name, impl) {
            var methods;

            // Var already defined (local or inherited)?
            if(!this._vars[name]) {
                this._vars[name] = true;

                var instProto = this.Ctor.prototype;

                // Variable Class methods
                // ex:
                // series()                    (non-overridable: in cache or eval)
                // |--> seriesEval()           (internally overridable; dispatches to evalCore; validates/processes/casts)
                //      |--> seriesEvalCore()  (impl.; externally overridable)
                methods = {};

                var nameEval = '_' + name + 'Eval';
                methods[name] = scene_createVarMainMethod(name, nameEval);

                var nameEvalCore = nameEval + 'Core';

                // _Eval_ Already defined?
                if(!def.hasOwn(instProto, nameEval)) methods[nameEval] = def.methodCaller(nameEvalCore);

                // _EvalCore_ already defined?
                if(!def.hasOwn(instProto, nameEvalCore))
                    // Normalize undefined to null (working as a default value)
                    methods[nameEvalCore] = def.fun.to(impl === undefined ? null : impl);
            } else if(impl !== undefined) {
                // Override (EvalCore) implementation
                methods = def.set({}, '_' + name + 'EvalCore', def.fun.to(impl));
            }

            // Add methods to class
            if(methods) this.methods(methods);

            return this;
        }
    }
});

var pvc_Scene = SceneMetaType.Ctor;

def('pvc.visual.Scene', pvc_Scene.configure({
    init: function(parent, keyArgs) {

        if(def.debug >= 4) { this.id = def.nextId('scene'); }

        this._renderId   = 0;
        this.renderState = {};

        pv.Dom.Node.call(this, /* nodeValue */null);

        this.parent = parent || null;
        if(parent) {
            this.root = parent.root;

            // parent -> ((pv.Dom.Node#)this).parentNode
            // this   -> ((pv.Dom.Node#)parent).childNodes
            // ...
            var index = def.get(keyArgs, 'index', null);
            parent.insertAt(this, index);
        } else {
            /* root scene */
            this.root = this;

            this._active = null;
            this._panel = def.get(keyArgs, 'panel') ||
                def.fail.argumentRequired('panel', "Argument is required on root scene.");
        }

        /* DATA */
        var first, group, datum, datums, groups, atoms, firstAtoms;
        var dataSource = def.array.to(def.get(keyArgs, 'source')); // array.to: nully remains nully
        if(dataSource && dataSource.length) {
            this.source = dataSource;

            first = dataSource[0];
            if(first instanceof cdo.Data) {
                // Group/groups
                group  = first;
                groups = dataSource;

                // There are datas with no datums.
                // For example, try, hiding all datums (using the legend).
                datum  = group.firstDatum() ||
                         def
                         .query(groups)
                         .select(function(group) { return group.firstDatum(); })
                         .first(def.notNully);
                // datum may still be null!
            } else {
                /*jshint expr:true */
                (first instanceof cdo.Datum) || def.assert("not a datum");
                datum  = first;
                datums = dataSource;
            }

            atoms      = first.atoms; // firstDataSourceAtoms
            firstAtoms = (datum && datum.atoms) || atoms; // firstDatumAtoms
        } else if(parent) {
            atoms = firstAtoms = Object.create(parent.atoms);
        } else {
            atoms = firstAtoms = {};
        }

        // Created empty even when there is no data
        this.atoms = atoms;
        this.firstAtoms = firstAtoms;

        // Only set when existent, otherwise inherit from prototype
        groups && (this.groups  = groups);
        group  && (this.group   = group );
        datums && (this._datums = datums);
        datum  && (this.datum   = datum );

        // Groups may have some null datums and others not null
        // Testing groups first ensures that the only
        // case where isNull is detected is that of a single datum scene.
        // Note that groups do not have isNull property, only datums do.
        if(!first || first.isNull) { this.isNull = true; }

        /* VARS */
        this.vars = parent ? Object.create(parent.vars) : {};
    },

    methods: [
        pv.Dom.Node,
        pvc.visual.Interactive,
        /** @lends pvc.visual.Scene# */{
            source: null,
            groups: null,
            group:  null,
            _datums: null,
            datum:  null,

            isNull: false,

            // Sugar for most used scene vars
            get: function(name, prop) {
                var avar = this.vars[name];
                return avar && avar[prop || 'value'];
            },

            getSeries:   function() { return this.get('series');   },
            getCategory: function() { return this.get('category'); },
            getValue:    function() { return this.get('value');    }, // Also in legend
            getTick:     function() { return this.get('tick');     }, // Axis panels
            getX:        function() { return this.get('x');        },
            getY:        function() { return this.get('y');        },
            getColor:    function() { return this.get('color');    },
            getSize:     function() { return this.get('size');     },

            getSeriesLabel:   function() { return this.get('series',   'label'); },
            getCategoryLabel: function() { return this.get('category', 'label'); },
            getValueLabel:    function() { return this.get('value',    'label'); }, // Also in legend
            getTickLabel:     function() { return this.get('tick',     'label'); }, // Axis panels
            getXLabel:        function() { return this.get('x',        'label'); },
            getYLabel:        function() { return this.get('y',        'label'); },
            getColorLabel:    function() { return this.get('color',    'label'); },
            getSizeLabel:     function() { return this.get('size',     'label'); },

            /**
             * Obtains the (first) group of this scene, or, if inexistent,
             * the group of the parent scene, if there is one, and so on.
             * If no data can be obtained in this way,
             * the data of the associated panel is returned.
             */
            data: function() {
                var data = this.group;
                if(!data) {
                    var scene = this;
                    while(!data && (scene = scene.parent)) data = scene.group;
                    if(!data) data = this.panel.data;
                }
                return data;
            },

            /**
             * Obtains a data instance that contains all datums that are present in the scene.
             * @return {cdo.Data!} The all datums data.
             */
            allGroup: function() {
                return this.groups.length === 1
                    ? this.group
                    : (this._allGroup || (this._allGroup = this._calcAllGroup()));
            },

            _calcAllGroup: function() {
                var groups = this.groups;
                if(!groups || !groups.length)
                    // May have datums, out of groups...
                    return new cdo.Data({linkParent: this.data(), datums: this.datums()});

                return new cdo.Data({
                    linkParent: cdo.Data.lca(groups), // non-null, unless from different root datas...
                    datums:     this.datums(),

                    // Enter group condition
                    where: function(d) {
                        return !!groups && groups.some(function(g) { return g.contains(d); });
                    }
                });
            },

            /**
             * Obtains an enumerable of the datums present in the scene.
             *
             * @type def.Query
             */
            datums: function() {
                // For efficiency, assumes datums of multiple groups are disjoint sets
                return this.groups  ? def.query(this.groups ).selectMany(function(g) { return g.datums(); }) :
                       this._datums ? def.query(this._datums) :
                       def.query();
            },

            /*
             * {value} -> <=> this.vars.value.label
             * {value.value} -> <=> this.vars.value.value
             * {#sales} -> <=> this.atoms.sales.label
             */
            format: function(mask) { return def.format(mask, this._formatScope, this); },

            _formatScope: function(prop) {
                if(prop.charAt(0) === '#') {
                    // An atom name
                    prop = prop.substr(1).split('.');
                    if(prop.length > 2) throw def.error.operationInvalid("Scene format mask is invalid.");

                    var atom = this.firstAtoms[prop[0]];
                    if(atom) {
                        if(prop.length > 1)
                            switch(prop[1]) {
                                case 'value': return atom.value;
                                case 'label': break;
                                default:      throw def.error.operationInvalid("Scene format mask is invalid.");
                            }

                        // atom.toString() ends up returning atom.label
                        return atom;
                    }

                    return null; // Atom does not exist --> ""
                }

                // A scene var name
                return def.getPath(this.vars, prop); // Scene vars' toString may end up being called
            },

            isRoot: function() { return this.root === this; },
            panel:  function() { return this.root._panel; },
            chart:  function() { return this.root._panel.chart; },
            compatVersion: function() { return this.root._panel.compatVersion(); },

            /**
             * Obtains an enumerable of the child scenes.
             *
             * @type def.Query
             */
            children: function() {
                var cs = this.childNodes;
                return cs.length ? def.query(cs) : def.query();
            },

            leafs: function() {

                function getFirstLeafFrom(leaf) {
                    while(leaf.childNodes.length) leaf = leaf.childNodes[0];
                    return leaf;
                }

                var root = this;
                return def.query(function(nextIndex) {
                    if(!nextIndex) {
                        // Initialize
                        var item = getFirstLeafFrom(root);
                        return (item === root)
                            ? 0
                            : ((this.item = item), 1); // has next
                    }

                    // Has a next sibling?
                    var next = this.item.nextSibling;
                    if(next) return (this.item = next), 1;  // has next

                    // Go to closest ancestor that has a sibling
                    // Take the first leaf from there
                    var current = this.item;
                    while((current !== root) && (current = current.parentNode))
                        if((next = current.nextSibling))
                            return (this.item = getFirstLeafFrom(next)), 1;

                    return 0;
                });
            },

            /* INTERACTION */
            anyInteraction: function() { return (!!this.root._active || this.anySelected()); },

            /* ACTIVITY */
            isActive: false,

            /**
             * Indicates if a scene is active or not.
             *
             * The use of this method is preferred to
             * direct access to property {@link #isActive},
             * as it also takes {@link #ownerScene} into account.
             *
             * @return {boolean} `true` if this scene is considered active, `false`, otherwise.
             */
            getIsActive: function() {
                return (this.ownerScene || this).isActive;
            },

            /**
             * Activates or deactivates this scene and its owner scene, if any.
             * @protected
             */
            setActive: function(isActive) {
                isActive = !!isActive; // normalize

                // When !isActive, do not warn the chart if
                // the scene becoming pointed to, if any,
                // is "hoverable" enabled.
                // Otherwise, we'll be triggering a "null to" event
                //  immediately followed by a "non-null to" event.
                if((this.getIsActive() !== isActive) &&
                   (isActive || !scene_isPointSwitchingToHoverableSign(pv.event))) {

                    this.chart()._setActiveScene(isActive ? this : null);
                }
            },

            /**
             * Clears the active scene <b>of this scene tree</b>, if any.
             * The active scene may not be this scene.
             *
             * @return {boolean} `true` if the scene tree's active scene changed, `false`, otherwise.
             * @protected
             */
            clearActive: function() {
                return !!this.active() && this.chart()._setActiveScene(null);
            },

            _setActive: function(isActive) {
                if(this.isActive !== isActive)
                    rootScene_setActive.call(this.root, this.isActive ? null : this);
            },

            _clearActive: function() {
                return rootScene_setActive.call(this.root, null);
            },

            anyActive: function() { return !!this.root._active; },

            active: function() { return this.root._active; },

            activeSeries: function() {
                var active = this.active(), seriesVar;
                if(active && (seriesVar = active.vars.series)) return seriesVar.value; // may be null!
                // otherwise undefined
            },

            isActiveSeries: function() {
                if(this.isActive) return true;

                var isActiveSeries = this.renderState.isActiveSeries;
                if(isActiveSeries == null) {
                    var activeSeries;
                    isActiveSeries = (activeSeries = this.activeSeries()) !== undefined &&
                                     (activeSeries === this.vars.series.value);

                    this.renderState.isActiveSeries = isActiveSeries;
                }
                return isActiveSeries;
            },

            isActiveDatum: function() {
                if(this.isActive) return true;

                return false;
                // TODO: Does seem to be doing more harm than good. So disabling this for now.
                /*
                // Only testing the first datum of both because of performance
                // so, unless they have the same group or the  order of datums is the same...
                var isActiveDatum = this.renderState.isActiveDatum;
                if(isActiveDatum == null) {
                    var activeScene = this.active();
                    if(activeScene) {
                        isActiveDatum = (this.group && activeScene.group === this.group) ||
                                        (this.datum && activeScene.datum === this.datum);
                    } else {
                        isActiveDatum = false;
                    }

                    this.renderState.isActiveDatum = isActiveDatum;
                }

                return isActiveDatum;
                */
            },

            isActiveDescendantOrSelf: function() {
                return this.isActive || def.lazy(this.renderState, 'isActiveDescOrSelf',  this._calcIsActiveDescOrSelf, this);
            },

            _calcIsActiveDescOrSelf: function() {
                var scene = this.active();
                if(scene) while((scene = scene.parent)) if(scene === this) return true;
                return false;
            },

            /* VISIBILITY */
            isVisible:  function() { return this._visibleInfo().is;  },
            anyVisible: function() { return this._visibleInfo().any; },

            _visibleInfo: function() {
                return def.lazy(this.renderState, 'visibleInfo', this._createVisibleInfo, this);
            },

            _createVisibleInfo: function() {
                var any = this.chart().data.owner.visibleCount() > 0,
                    isSelected = any && this.datums().any(def.propGet('isVisible'));

                return {any: any, is: isSelected};
            },

            /* SELECTION */
            isSelected:  function() { return this._selectedInfo().is;  },
            anySelected: function() { return this._selectedInfo().any; },

            _selectedInfo: function() {
                return def.lazy(this.renderState, 'selectedInfo', this._createSelectedInfo, this);
            },

            _createSelectedInfo: function() {
                /*global datum_isSelected:true */
                var any = this.chart().data.owner.selectedCount() > 0,
                    isSelected = any && this.datums().any(cdo.Datum.isSelected);

                return {any: any, is: isSelected};
            },

            /* ACTIONS - Update UI */
            select: function(ka) {
                var me = this,
                    datums = me.datums().array();
                if(datums.length) {
                    var chart = me.chart();
                    chart._updatingSelections(function() {
                        datums = chart._onUserSelection(datums, me.group || me.datum);
                        if(datums && datums.length) {
                            if(chart.options.ctrlSelectMode && def.get(ka, 'replace', true))
                                chart.data.replaceSelected(datums);
                            else
                                cdo.Data.toggleSelected(datums);
                        }
                    });
                }
            },

            isSelectedDescendantOrSelf: function() {
                return this.isSelected() ||
                       def.lazy(this.renderState, 'isSelectedDescOrSelf',  this._calcIsSelectedDescOrSelf, this);
            },

            _calcIsSelectedDescOrSelf: function() {
                var child = this.firstChild;
                if(child) do { if(child.isSelectedDescendantOrSelf()) return true; } while((child = child.nextSibling));
                return false;
            },

            toggleVisible: function() {
                if(cdo.Data.toggleVisible(this.datums())) this.chart().render(true, true, false);
            },

            /* VIEWS */
            /**
             * Gets a complex view of the given view specification.
             *
             * @param {Object} viewSpec The view specification.
             * @param {string} [viewSpec.role] The name of a visual role.
             * @param {string|string[]} [viewSpec.dims] The name or names of the view's dimensions.
             *
             * @return {cdo.Complex} The complex view.
             */
            asView: function(viewSpec) {
                this.chart()._processViewSpec(viewSpec);

                return this._asView(viewSpec.dimsKey, viewSpec.dimNames);
            },

            _asView: function(dimsKey, dimNames) {
                if(this.ownerScene) return this.ownerScene._asView(dimsKey, dimNames);

                var views = def.lazy(this, '_viewCache'),
                    view  = def.getOwn(views, dimsKey);

                // NOTE: `null` is a value view.
                if(view === undefined)
                    views[dimsKey] = view = this._calcView(dimNames);

                return view;
            },

            _calcView: function(normDimNames) {
                // Collect atoms of each dimension name.
                // Fail on first null one.
                var atoms = null, atom, dimName;
                for(var i = 0, L = normDimNames.length; i < L; i++) {
                    dimName = normDimNames[i];
                    atom    = this.atoms[dimName];
                    if(!atom || atom.value == null) return null;

                    (atoms || (atoms = {}))[dimName] = atom;
                }

                return new cdo.Complex(
                    /*source*/this.data().owner,
                    atoms,
                    normDimNames,
                    /*atomsBase*/null, // defaulted from source.atoms
                    /*wantLabel*/true,
                    /*calculate*/false);
            }
        }
    ]
}));

function scene_isPointSwitchingToHoverableSign(ev) {
    var pointTo;
    return !!(ev && (pointTo = ev.pointTo) && pointTo.scenes.mark._hasHoverable);
}

/**
 * Called on each sign's pvc.visual.Sign#preBuildInstance
 * to ensure cached data per-render is cleared.
 *
 *  @param {number} renderId The current render id.
 */
function scene_renderId(renderId) {
    if(this._renderId !== renderId) {
        this._renderId   = renderId;
        this.renderState = {};
    }
}

function rootScene_setActive(scene) {
    var ownerScene;
    if(scene && (ownerScene = scene.ownerScene)) scene = ownerScene;

    var active = this._active;
    if(active !== scene) {
        if(active) scene_setActive.call(active, false);

        this._active = active = scene || null;

        if(active) scene_setActive.call(active, true);

        return true;
    }

    return false;
}

function scene_setActive(isActive) {
    if(this.isActive !== isActive) {
        // Inherits isActive = false
        if(!isActive) delete this.isActive;
        else          this.isActive = true;
    }
}

// Not intended to be overridden.
function scene_createVarMainMethod(name, nameEval) {
    return function() {
        // Evaluate on first time used.
        // If _baseImpl_ depends on other variables,
        // they too will be evaluated (if not already).
        // No cycle detection is performed.
        var vb = this.vars[name];
        if(vb === undefined) {
            vb = this[nameEval]();
            if(vb === undefined) vb = null;
            this.vars[name] = vb;
        }
        return vb;
    };
}
