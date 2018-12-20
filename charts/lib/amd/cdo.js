/*!
 * Copyright 2002 - 2018 Webdetails, a Hitachi Vantara company.  All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */


define([ "./def", "./protovis-compat!" ], function(def, pv) {
    function cdo_disposeChildList(list, parentProp) {
        var L = list && list.length;
        if (L) {
            for (var i = 0; i < L; i++) {
                var child = list[i];
                parentProp && (child[parentProp] = null);
                child.dispose();
            }
            list.length = 0;
        }
    }
    function cdo_addColChild(parent, childrenProp, child, parentProp, index) {
        child[parentProp] = parent;
        var col = parent[childrenProp] || (parent[childrenProp] = []);
        null == index || index >= col.length ? col.push(child) : col.splice(index, 0, child);
    }
    function cdo_removeColChild(parent, childrenProp, child, parentProp) {
        var index, children = parent[childrenProp];
        children && (index = children.indexOf(child)) >= 0 && def.array.removeAt(children, index);
        child[parentProp] = null;
    }
    function dimensionType_dateKey(date) {
        return date.toISOString();
    }
    function atom_idComparer(a, b) {
        return a.id - b.id;
    }
    function atom_idComparerReverse(a, b) {
        return b.id - a.id;
    }
    function datum_deselect() {
        delete this.isSelected;
    }
    function datum_isNullOrSelected(d) {
        return d.isNull || d.isSelected;
    }
    function datum_isSelectedT(d) {
        return !0 === d.isSelected;
    }
    function datum_isSelectedF(d) {
        return !1 === d.isSelected;
    }
    function datum_isVisibleT(d) {
        return !0 === d.isVisible;
    }
    function datum_isVisibleF(d) {
        return !1 === d.isVisible;
    }
    function datum_isNullT(d) {
        return !0 === d.isNull;
    }
    function datum_isNullF(d) {
        return !1 === d.isNull;
    }
    function dim_createAndInternAtom(sourceValue, key, value, label, isVirtual) {
        var atom;
        if (this.owner === this) {
            atom = new cdo.Atom(this, value, label, sourceValue, key);
            isVirtual && (atom.isVirtual = !0);
        } else {
            var source = this.parent || this.linkParent;
            atom = source._atomsByKey[key] || dim_createAndInternAtom.call(source, sourceValue, key, value, label, isVirtual);
        }
        def.array.insert(this._atoms, atom, this._atomComparer);
        dim_clearVisiblesCache.call(this);
        this._atomsByKey[key] = atom;
        return atom;
    }
    function dim_internAtom(atom) {
        var key = atom.key, me = this, hasInited = !me._lazyInit;
        if (atom.dimension === me) {
            me.owner === me || def.assert("Should be an owner dimension");
            key || atom !== me._virtualNullAtom ? hasInited ? dim_clearVisiblesCache.call(this) : this._sumCache = null : atom = me.intern(null);
            return atom;
        }
        if (hasInited) {
            var localAtom = me._atomsByKey[key];
            if (localAtom) {
                if (localAtom !== atom) throw def.error.operationInvalid("Atom is from a different root data.");
                dim_clearVisiblesCache.call(me);
                return atom;
            }
            if (me.owner === me) throw def.error.operationInvalid("Atom is from a different root data.");
        }
        dim_internAtom.call(me.parent || me.linkParent, atom);
        if (hasInited) {
            me._atomsByKey[key] = atom;
            if (key) def.array.insert(me._atoms, atom, me._atomComparer); else {
                me._nullAtom = atom;
                me._atoms.unshift(atom);
            }
            dim_clearVisiblesCache.call(me);
        } else this._sumCache = null;
        return atom;
    }
    function dim_buildDatumsFilterKey(keyArgs) {
        var visible = def.get(keyArgs, "visible"), selected = def.get(keyArgs, "selected");
        return (null == visible ? null : !!visible) + ":" + (null == selected ? null : !!selected);
    }
    function dim_createNullAtom(sourceLabel) {
        var nullAtom = this._nullAtom;
        if (!nullAtom) {
            this.owner === this ? this.data._atomsBase[this.name] = nullAtom = new cdo.Atom(this, null, sourceLabel, null, "") : nullAtom = dim_createNullAtom.call(this.parent || this.linkParent, sourceLabel);
            this._atomsByKey[""] = this._nullAtom = nullAtom;
            this._atoms.unshift(nullAtom);
        }
        return nullAtom;
    }
    function dim_createVirtualNullAtom() {
        this.owner === this || def.assert("Can only create atoms on an owner dimension.");
        if (!this._virtualNullAtom) {
            this._virtualNullAtom = new cdo.Atom(this, null, "", null, "");
            this.data._atomsBase[this.name] = this._virtualNullAtom;
        }
        return this._virtualNullAtom;
    }
    function dim_uninternUnvisitedAtoms() {
        this.owner === this || def.assert("Can only unintern atoms of an owner dimension.");
        var atoms = this._atoms;
        if (atoms) {
            for (var atomsByKey = this._atomsByKey, i = 0, L = atoms.length; i < L; ) {
                var atom = atoms[i];
                if (atom.visited) {
                    delete atom.visited;
                    i++;
                } else if (atom !== this._virtualNullAtom) {
                    atoms.splice(i, 1);
                    L--;
                    var key = atom.key;
                    delete atomsByKey[key];
                    if (!key) {
                        delete this._nullAtom;
                        this.data._atomsBase[this.name] = this._virtualNullAtom;
                    }
                }
            }
            dim_clearVisiblesCache.call(this);
        }
    }
    function dim_uninternVirtualAtoms() {
        var atoms = this._atoms;
        if (atoms) {
            for (var removed, atomsByKey = this._atomsByKey, i = 0, L = atoms.length; i < L; ) {
                var atom = atoms[i];
                if (atom.isVirtual) {
                    atoms.splice(i, 1);
                    L--;
                    removed = !0;
                    delete atomsByKey[atom.key || def.assert("Cannot be the null or virtual null atom.")];
                } else i++;
            }
            removed && dim_clearVisiblesCache.call(this);
        }
    }
    function dim_clearVisiblesCache() {
        this._atomVisibleDatumsCount = this._sumCache = this._visibleAtoms = this._visibleIndexes = null;
    }
    function dim_addChild(child) {
        cdo_addColChild(this, "childNodes", child, "parent");
        child.owner = this.owner;
    }
    function dim_addLinkChild(linkChild) {
        cdo_addColChild(this, "_linkChildren", linkChild, "linkParent");
        linkChild.owner = this.owner;
    }
    function dim_onDatumVisibleChanged(datum, visible) {
        var map;
        if (!this._disposed && (map = this._atomVisibleDatumsCount)) {
            var atom = datum.atoms[this.name], key = atom.key, count = map[key];
            map[key] = (count || 0) + (visible ? 1 : -1);
            this._visibleAtoms = this._sumCache = this._visibleIndexes = null;
        }
    }
    function dim_getVisibleDatumsCountMap() {
        var map = this._atomVisibleDatumsCount;
        if (!map) {
            map = {};
            this.data.datums(null, {
                visible: !0
            }).each(function(datum) {
                var atom = datum.atoms[this.name], key = atom.key;
                map[key] = (map[key] || 0) + 1;
            }, this);
            this._atomVisibleDatumsCount = map;
        }
        return map;
    }
    function dim_calcVisibleIndexes(visible) {
        var indexes = [];
        this._atoms.forEach(function(atom, index) {
            this.isVisible(atom) === visible && indexes.push(index);
        }, this);
        return indexes;
    }
    function dim_calcVisibleAtoms(visible) {
        return def.query(this._atoms).where(function(atom) {
            return this.isVisible(atom) === visible;
        }, this).array();
    }
    function cdo_addChild(child, index) {
        this.insertAt(child, index);
        def.lazy(this, "_childrenByKey")[child.key] = child;
    }
    function cdo_addLinkChild(linkChild, index) {
        cdo_addColChild(this, "_linkChildren", linkChild, "linkParent", index);
    }
    function cdo_removeLinkChild(linkChild) {
        cdo_removeColChild(this, "_linkChildren", linkChild, "linkParent");
    }
    function cdo_disposeChildLists() {
        cdo_disposeChildList(this.childNodes, "parent");
        this._childrenByKey = null;
        cdo_disposeChildList(this._linkChildren, "linkParent");
        this._groupByCache = null;
        this._sumAbsCache = null;
    }
    function cdo_assertIsOwner() {
        this.isOwner() || def.fail("Can only be called on the owner data.");
    }
    function data_onDatumSelectedChanged(datum, selected) {
        !datum.isNull || def.assert("Null datums do not notify selected changes");
        selected ? this._selectedNotNullDatums.set(datum.id, datum) : this._selectedNotNullDatums.rem(datum.id);
        this._sumAbsCache = null;
    }
    function data_onDatumVisibleChanged(datum, visible) {
        var did = datum.id, me = this;
        if (def.hasOwnProp.call(me._datumsById, did)) {
            !datum.isNull || def.assert("Null datums do not notify visible changes");
            visible ? me._visibleNotNullDatums.set(did, datum) : me._visibleNotNullDatums.rem(did);
            me._sumAbsCache = null;
            for (var list = me._dimensionsList, i = 0, L = list.length; i < L; ) dim_onDatumVisibleChanged.call(list[i++], datum, visible);
            list = me.childNodes;
            i = 0;
            L = list.length;
            for (;i < L; ) data_onDatumVisibleChanged.call(list[i++], datum, visible);
            list = me._linkChildren;
            if (list && (L = list.length)) {
                i = 0;
                for (;i < L; ) data_onDatumVisibleChanged.call(list[i++], datum, visible);
            }
        }
    }
    function data_ancestorsAndSelfList(data) {
        for (var p, ancestors = [ data ]; p = data.parent || data.linkParent; ) ancestors.unshift(data = p);
        return ancestors;
    }
    function data_lowestCommonAncestor(listA, listB) {
        for (var next, i = 0, L = Math.min(listA.length, listB.length), a = null; i < L && (next = listA[i]) === listB[i]; ) {
            a = next;
            i++;
        }
        return a;
    }
    function data_setDatums(setDatums, keyArgs) {
        function maybeAddDatum(datumToSet) {
            if (datumToSet) {
                var key = datumToSet.key;
                if (!def.hasOwnProp.call(nextDatumsByKey, key)) {
                    null !== existingDatumsByKey && def.hasOwnProp.call(existingDatumsByKey, key) && (datumToSet = existingDatumsByKey[key]);
                    var id = datumToSet.id;
                    nextDatums.push(datumToSet);
                    nextDatumsByKey[key] = datumToSet;
                    nextDatumsById[id] = datumToSet;
                    null !== preserveExistingAddedDatums && preserveExistingAddedDatums.push(datumToSet);
                    if (!datumToSet.isNull) {
                        datumToSet.isSelected && selDatumsMap.set(id, datumToSet);
                        datumToSet.isVisible && visDatumsMap.set(id, datumToSet);
                    }
                }
            }
        }
        if (!setDatums) throw def.error.argumentRequired("setDatums");
        var nextDatums, nextDatumsByKey, nextDatumsById, hasExisting = this._datums.length > 0, isPreserveExisting = !!def.get(keyArgs, "isAdditive"), existingDatumsByKey = null, visDatumsMap = this._visibleNotNullDatums, selDatumsMap = this._selectedNotNullDatums;
        if (hasExisting && !isPreserveExisting) {
            cdo_disposeChildLists.call(this);
            existingDatumsByKey = this._datumsByKey;
            this._datums = nextDatums = [];
            this._datumsById = nextDatumsById = {};
            this._datumsByKey = nextDatumsByKey = {};
            visDatumsMap.clear();
            selDatumsMap && selDatumsMap.clear();
        } else {
            nextDatums = this._datums;
            nextDatumsByKey = this._datumsByKey;
            nextDatumsById = this._datumsById;
            hasExisting && (this._sumAbsCache = null);
        }
        var preserveExistingAddedDatums = null, notifyAddedDatums = !!this._linkChildren && this._linkChildren.length > 0;
        notifyAddedDatums && hasExisting && isPreserveExisting && (preserveExistingAddedDatums = []);
        if (def.array.is(setDatums)) for (var i = 0, L = setDatums.length; i < L; ) maybeAddDatum.call(this, setDatums[i++]); else {
            if (!(setDatums instanceof def.Query)) throw def.error.argumentInvalid("setDatums", "Argument is of invalid type.");
            setDatums.each(maybeAddDatum, this);
        }
        this.select && this.select(nextDatums).forEach(function(removeDatum) {
            cdo_removeDatumLocal.call(this, removeDatum);
            null !== preserveExistingAddedDatums && preserveExistingAddedDatums.splice(preserveExistingAddedDatums.indexOf(removeDatum), 1);
        }, this);
        cdo_doAtomGC.call(this);
        notifyAddedDatums && this._onDatumsAdded(preserveExistingAddedDatums || nextDatums);
    }
    function cdo_doAtomGC() {
        for (var i = -1, datums = this._datums, L = datums.length; ++i < L; ) data_processDatumAtoms.call(this, datums[i], !1, !0);
        var dims = this._dimensionsList;
        i = -1;
        L = dims.length;
        for (;++i < L; ) dim_uninternUnvisitedAtoms.call(dims[i]);
    }
    function data_processDatumAtoms(datum, intern, markVisited) {
        var dims = this._dimensionsList;
        dims || (intern = !1);
        if (intern || markVisited) {
            var L, atom, dim, datoms = datum.atoms, i = 0;
            if (dims) {
                L = dims.length;
                for (;i < L; ) {
                    dim = dims[i++];
                    atom = datoms[dim.name];
                    if (atom) {
                        intern && dim_internAtom.call(dim, atom);
                        markVisited && (atom.visited = !0);
                    }
                }
            } else {
                var dimNames = this.type.dimensionsNames();
                L = dimNames.length;
                for (;i < L; ) {
                    atom = datoms[dimNames[i++]];
                    atom && (atom.visited = !0);
                }
            }
        }
    }
    function cdo_removeDatumLocal(datum) {
        var datums = this._datums, selDatums = this._selectedNotNullDatums, id = datum.id;
        datums.splice(datums.indexOf(datum), 1);
        delete this._datumsById[id];
        delete this._datumsByKey[datum.key];
        selDatums && datum.isSelected && selDatums.rem(id);
        datum.isVisible && this._visibleNotNullDatums.rem(id);
    }
    function data_normalizeQuerySpec(querySpec) {
        function processDatumFilter(datumFilter) {
            if (null != datumFilter) {
                "object" == typeof datumFilter || def.fail.invalidArgument("datumFilter");
                var datumProcFilter = {}, any = !1;
                for (var dimName in datumFilter) {
                    var datumFilterValues = datumFilter[dimName], atoms = this.dimensions(dimName).getDistinctAtoms(null !== datumFilterValues ? def.array.as(datumFilterValues) : [ null ]);
                    if (atoms.length) {
                        any = !0;
                        datumProcFilter[dimName] = atoms;
                    }
                }
                any && whereProcSpec.push(datumProcFilter);
            }
        }
        var whereProcSpec = [];
        querySpec = def.array.as(querySpec);
        querySpec && querySpec.forEach(processDatumFilter, this);
        return whereProcSpec;
    }
    function data_whereState(q, keyArgs) {
        var visible = def.get(keyArgs, "visible"), isNull = def.get(keyArgs, "isNull"), selected = def.get(keyArgs, "selected"), where = def.get(keyArgs, "where");
        null != visible && (q = q.where(visible ? datum_isVisibleT : datum_isVisibleF));
        null != isNull && (q = q.where(isNull ? datum_isNullT : datum_isNullF));
        null != selected && (q = q.where(selected ? datum_isSelectedT : datum_isSelectedF));
        where && (q = q.where(where));
        return q;
    }
    function data_wherePredicate(querySpec, keyArgs) {
        var visible = def.get(keyArgs, "visible"), isNull = def.get(keyArgs, "isNull"), selected = def.get(keyArgs, "selected"), where = def.get(keyArgs, "where"), ps = [];
        null != visible && ps.unshift(visible ? datum_isVisibleT : datum_isVisibleF);
        null != isNull && ps.unshift(isNull ? datum_isNullT : datum_isNullF);
        null != selected && ps.unshift(selected ? datum_isSelectedT : datum_isSelectedF);
        where && ps.unshift(where);
        querySpec && ps.unshift(cdo_querySpecPredicate(querySpec));
        var P = ps.length;
        if (P) {
            if (1 === P) return ps[0];
            return function(d) {
                for (var i = P; i; ) if (!ps[--i](d)) return !1;
                return !0;
            };
        }
        return null;
    }
    function cdo_querySpecPredicate(querySpec) {
        function datumQuerySpecPredicate(d) {
            for (var datoms = d.atoms, i = 0; i < L; i++) if (datumFilterPredicate(datoms, querySpec[i])) return !0;
            return !1;
        }
        function datumFilterPredicate(datoms, datumFilter) {
            for (var dimName in datumFilter) if (datumFilter[dimName].indexOf(datoms[dimName]) < 0) return !1;
            return !0;
        }
        var L = querySpec.length;
        return datumQuerySpecPredicate;
    }
    function data_where(normalizedQuerySpec, keyArgs) {
        var orderBys = def.array.as(def.get(keyArgs, "orderBy")), datumKeyArgs = def.create(keyArgs || {}, {
            orderBy: null
        });
        return def.query(normalizedQuerySpec).selectMany(function(normalizedDatumFilter, index) {
            orderBys && (datumKeyArgs.orderBy = orderBys[index]);
            return data_queryDatumFilter.call(this, normalizedDatumFilter, datumKeyArgs);
        }, this).distinct(def.propGet("id"));
    }
    function data_queryDatumFilter(normalizedDatumFilter, keyArgs) {
        var orderBySpecText = keyArgs.orderBy;
        if (orderBySpecText) {
            if (orderBySpecText.indexOf("|") >= 0) throw def.error.argumentInvalid("keyArgs.orderBy", "Multi-dimension order by is not supported.");
        } else orderBySpecText = Object.keys(normalizedDatumFilter).sort().join(",");
        var rootData = this.groupBy(orderBySpecText, keyArgs), H = rootData.treeHeight, stateStack = [];
        return def.query(function() {
            var state;
            if (this._data) {
                if (this._datumsQuery) {
                    this._data || def.assert("Must have a current data");
                    stateStack.length || def.assert("Must have a parent data");
                    !this._dimAtomsOrQuery || def.assert();
                    if (this._datumsQuery.next()) {
                        this.item = this._datumsQuery.item;
                        return 1;
                    }
                    this._datumsQuery = null;
                    state = stateStack.pop();
                    this._data = state.data;
                    this._dimAtomsOrQuery = state.dimAtomsOrQuery;
                }
            } else {
                this._data = rootData;
                this._dimAtomsOrQuery = def.query(normalizedDatumFilter[rootData.groupingLevelSpec.dimensions[0].name]);
            }
            this._dimAtomsOrQuery || def.assert("Invalid programmer");
            this._data || def.assert("Must have a current data");
            for (var depth = stateStack.length; ;) {
                for (;this._dimAtomsOrQuery.next(); ) {
                    var dimAtomOr = this._dimAtomsOrQuery.item, childData = this._data.child(dimAtomOr.key);
                    if (childData && (depth < H - 1 || childData._datums.length)) {
                        stateStack.push({
                            data: this._data,
                            dimAtomsOrQuery: this._dimAtomsOrQuery
                        });
                        this._data = childData;
                        if (!(depth < H - 1)) {
                            this._dimAtomsOrQuery = null;
                            this._datumsQuery = def.query(childData._datums);
                            this._datumsQuery.next();
                            this.item = this._datumsQuery.item;
                            return 1;
                        }
                        this._dimAtomsOrQuery = def.query(normalizedDatumFilter[childData.groupingLevelSpec.dimensions[0].name]);
                        depth++;
                    }
                }
                if (!depth) return 0;
                state = stateStack.pop();
                this._data = state.data;
                this._dimAtomsOrQuery = state.dimAtomsOrQuery;
                depth--;
            }
            return 0;
        });
    }
    function groupSpec_parseGroupingLevel(groupLevelText, complexType, extensionComplexTypesMap) {
        def.string.is(groupLevelText) || def.fail.argumentInvalid("groupLevelText", "Invalid grouping specification.");
        return def.query(groupLevelText.split(/\s*\|\s*/)).where(def.truthy).select(function(dimSpecText) {
            var match = groupSpec_matchDimSpec.exec(dimSpecText) || def.fail.argumentInvalid("groupLevelText", "Invalid grouping level syntax '{0}'.", [ dimSpecText ]), name = match[1], order = (match[2] || "").toLowerCase(), isReversed = "desc" === order, dimSpec = new cdo.GroupingDimensionSpec(name, isReversed);
            complexType && dimSpec.bindComplexType(complexType, extensionComplexTypesMap);
            return dimSpec;
        });
    }
    function relTransl_dataPartGet(plot2DataSeriesIndexes, seriesReader) {
        function calcAxis2SeriesKeySet() {
            var atoms = {}, seriesKeys = def.query(me.source).select(function(row) {
                seriesReader(row, atoms);
                var value = atoms.series;
                null != value && null != value.v && (value = value.v);
                return value || null;
            }).distinct().array();
            return me._createPlot2SeriesKeySet(plot2DataSeriesIndexes, seriesKeys);
        }
        var me = this;
        this._dataPartGet(calcAxis2SeriesKeySet);
    }
    function numForm_tryConfigure(other) {
        return def.string.is(other) ? !!this.mask(other) : def.is(other, numForm) ? !!this.mask(other.mask()).style(other.style()) : void 0;
    }
    function numForm_cachedFormatter(mask) {
        mask || (mask = "");
        var key = "_" + mask, f = numForm_cache[key];
        if (!f) {
            if (numForm_cacheCount === numForm.cacheLimit) {
                numForm_cache = {};
                numForm_cacheCount = 0;
            }
            numForm_cache[key] = f = numberFormatter(mask);
            numForm_cacheCount++;
        }
        return f;
    }
    function numberFormatter(mask) {
        function formatter(value, style) {
            if (null == value) return nullFormat ? nullFormat(style) : "";
            value = +value;
            return isNaN(value) || !isFinite(value) ? "" : posFormat ? 0 === value ? zeroFormat ? zeroFormat(style) : posFormat(style, value, null, !1) : value > 0 ? posFormat(style, value, zeroFormat, !1) : negFormat ? negFormat(style, -value, zeroFormat || posFormat) : posFormat(style, -value, zeroFormat, !0) : String(value);
        }
        var posFormat, negFormat, zeroFormat, nullFormat;
        !function() {
            var L, section, posSection, sections = numForm_parseMask(mask);
            sections.forEach(numForm_compileSection);
            L = sections.length;
            posFormat = nullFormat = negFormat = zeroFormat = null;
            if (L) {
                posFormat = numForm_buildFormatSectionPosNeg(posSection = sections[0]);
                if (L > 1) {
                    section = sections[1];
                    negFormat = numForm_buildFormatSectionPosNeg(section.empty ? posSection : section);
                    if (L > 2) {
                        section = sections[2];
                        zeroFormat = numForm_buildFormatSectionZero(section.empty ? posSection : section);
                        if (L > 3) {
                            section = sections[3];
                            nullFormat = numForm_buildFormatSectionNull(section.empty ? posSection : section);
                            if (L > 4) throw new Error("Invalid mask. More than 4 sections.");
                        }
                    }
                }
            }
        }();
        return formatter;
    }
    function numForm_parseMask(mask) {
        var sections = [];
        if (mask) {
            var c, section, part, dcount, i = -1, L = mask.length, textFrag = "", empty = 1, beforeDecimal = 1, hasInteger = 0, hasDot = 0, addToken0 = function(token) {
                empty = 0;
                part.list.push(token);
            }, addTextFrag = function(t) {
                empty = 0;
                textFrag += t;
            }, endTextFrag = function() {
                if (textFrag) {
                    tryParseAbbrCurr();
                    addToken0({
                        type: 0,
                        text: textFrag
                    });
                    textFrag = "";
                }
            }, addToken = function(token) {
                endTextFrag();
                addToken0(token);
            }, endInteger = function() {
                endTextFrag();
                !hasInteger && hasDot && addToken0({
                    type: 2
                });
                part.digits = dcount;
                dcount = 0;
                beforeDecimal = 0;
                part = section.fractional;
            }, endSection = function() {
                if (section && (!empty || !sections.length)) {
                    beforeDecimal ? endInteger() : endTextFrag();
                    part.digits = dcount;
                    sections.push(section);
                }
                empty = beforeDecimal = 1;
                hasDot = dcount = hasInteger = 0;
                section = {
                    empty: 0,
                    scale: 0,
                    groupOn: 0,
                    scientific: 0,
                    abbreviationOn: 0,
                    integer: {
                        list: [],
                        digits: 0
                    },
                    fractional: {
                        list: [],
                        digits: 0
                    }
                };
                part = section.integer;
            }, tryParseAbbrCurr = function() {
                if ("A" === textFrag) {
                    textFrag = "";
                    addToken({
                        type: 6
                    });
                } else if ("C" === textFrag) {
                    textFrag = "";
                    addToken({
                        type: 4
                    });
                } else if ("AC" === textFrag) {
                    textFrag = "";
                    addToken({
                        type: 6
                    });
                    addToken({
                        type: 4
                    });
                } else if ("CA" === textFrag) {
                    textFrag = "";
                    addToken({
                        type: 4
                    });
                    addToken({
                        type: 6
                    });
                }
            };
            endSection();
            for (;++i < L; ) {
                c = mask.charAt(i);
                if ("0" === c) {
                    addToken({
                        type: 1
                    });
                    hasInteger = 1;
                    dcount++;
                } else if ("#" === c) {
                    addToken({
                        type: 2
                    });
                    hasInteger = 1;
                    dcount++;
                } else if ("," === c) beforeDecimal && addToken({
                    type: 3
                }); else if ("." === c) {
                    if (beforeDecimal) {
                        hasDot = 1;
                        endInteger();
                    }
                } else if ("¤" === c) addToken({
                    type: 4
                }); else if ("C" === c && "Currency" === mask.substring(i, i + 8)) {
                    addToken({
                        type: 4
                    });
                    i += 7;
                } else if ("A" === c && "Abbreviation" === mask.substring(i, i + 12)) {
                    addToken({
                        type: 6
                    });
                    i += 11;
                } else if (";" === c) {
                    endSection();
                    if (i + 1 >= L || ";" === mask.charAt(i + 1)) {
                        i++;
                        sections.push({
                            empty: 1
                        });
                    }
                } else if ("\\" === c) {
                    i++;
                    i < L && addTextFrag(mask.charAt(i));
                } else if ('"' === c) {
                    i++;
                    var j = mask.indexOf(c, i);
                    j < 0 && (j = L);
                    addTextFrag(mask.substring(i, j));
                    i = j;
                } else if (" " === c) addToken({
                    type: 7
                }); else if ("e" !== c && "E" !== c || !function() {
                    var c2, k = i + 1, positive = !1, digits = 0;
                    if (k < L) {
                        c2 = mask.charAt(k);
                        if ("-" === c2 || "+" === c2) {
                            positive = "+" === c2;
                            if (!(++k < L)) return 0;
                            c2 = mask.charAt(k);
                        }
                        for (;"0" === c2 && ++digits && ++k < L && (c2 = mask.charAt(k)); ) ;
                        if (digits) {
                            i = k - 1;
                            addToken({
                                type: 5,
                                text: c,
                                digits: digits,
                                positive: positive
                            });
                            section.scientific = 1;
                            return 1;
                        }
                    }
                    return 0;
                }()) {
                    "%" === c ? section.scale += 2 : "‰" === c ? section.scale += 3 : "‱" === c && (section.scale += 4);
                    addTextFrag(c);
                } else ;
            }
            endSection();
        }
        return sections;
    }
    function numForm_compileSection(section) {
        if (!section.empty) {
            numForm_compileSectionPart(section, !0);
            numForm_compileSectionPart(section, !1);
        }
    }
    function numForm_compileSectionPart(section, beforeDecimal) {
        function addStep(step) {
            steps[stepMethName](step);
        }
        for (var token, type, stepMethName = beforeDecimal ? "push" : "unshift", part = section[beforeDecimal ? "integer" : "fractional"], tokens = part.list, steps = part.list = [], digit = part.digits - 1, hasInteger = 0, hasZero = 0, L = tokens.length, i = beforeDecimal ? 0 : L, nextToken = beforeDecimal ? function() {
            return i < L ? tokens[i++] : null;
        } : function() {
            return i > 0 ? tokens[--i] : null;
        }; token = nextToken(); ) switch (type = token.type) {
          case 0:
            addStep(numForm_buildLiteral(token.text));
            break;

          case 1:
          case 2:
            hasZero && 2 === type && (type = 1);
            addStep(numForm_buildReadDigit(beforeDecimal, digit, 1 === type, !hasInteger));
            digit--;
            hasInteger = 1;
            hasZero || 1 !== type || (hasZero = 1);
            break;

          case 3:
            numForm_hasIntegerAhead(tokens, i, L) ? hasInteger && (section.groupOn = 1) : section.scale -= 3;
            break;

          case 4:
            addStep(numFormRt_currencySymbol);
            break;

          case 5:
            addStep(numForm_buildExponent(section, token));
            break;

          case 6:
            section.abbreviationOn = 1;
            addStep(numForm_abbreviationSymbol);
            break;

          case 7:
            addStep(numForm_buildLiteral(" "));
        }
        !beforeDecimal && part.digits && steps.unshift(numForm_buildReadDecimalSymbol(hasZero));
    }
    function numForm_hasIntegerAhead(tokens, i, L) {
        for (;i < L; ) {
            var type = tokens[i++].type;
            if (1 === type || 2 === type) return 1;
        }
        return 0;
    }
    function numForm_buildFormatSectionZero(section) {
        function numFormRt_formatSectionZero(style) {
            return numFormRt_formatSection(section, style, 0, !1);
        }
        return numFormRt_formatSectionZero;
    }
    function numForm_buildFormatSectionNull(section) {
        function numFormRt_formatSectionNull(style) {
            return numFormRt_formatSection(section, style, "", !1);
        }
        return numFormRt_formatSectionNull;
    }
    function numForm_buildFormatSectionPosNeg(section) {
        function numFormRt_formatSectionPosNeg(style, value, zeroFormat, negativeMode) {
            var sdigits, abbreviation, value0 = value, exponent = 0, scale = section.scale;
            if (section.abbreviationOn) for (var L = style.abbreviations.length, i = L; i > 0; i--) {
                var y = 3 * i;
                if (Math.pow(10, y) <= value) {
                    scale -= y;
                    abbreviation = i - 1;
                    break;
                }
            }
            if (section.scientific) {
                sdigits = Math.floor(Math.log(value) / Math.LN10);
                exponent = scale + sdigits - section.integer.digits + 1;
                scale -= exponent;
            }
            scale && (value = def.mult10(value, scale));
            value = def.round10(value, section.fractional.digits);
            return !value && zeroFormat ? zeroFormat(style, value0) : numFormRt_formatSection(section, style, value, negativeMode, exponent, abbreviation);
        }
        return numFormRt_formatSectionPosNeg;
    }
    function numFormRt_formatSection(section, style, value, negativeMode, exponent, abbreviation) {
        var svalue = "" + value, idot = svalue.indexOf("."), itext = idot < 0 ? svalue : svalue.substr(0, idot), ftext = idot < 0 ? "" : svalue.substr(idot + 1);
        "0" === itext && (itext = "");
        exponent || (exponent = 0);
        var out = [];
        negativeMode && out.push(style.negativeSign);
        itext = itext.split("");
        ftext = ftext.split("");
        style.group && section.groupOn && numFormRt_addGroupSeparators(style, itext);
        section.integer.list.forEach(function(f) {
            out.push(f(style, itext, exponent, abbreviation));
        });
        section.fractional.list.forEach(function(f) {
            out.push(f(style, ftext, exponent, abbreviation));
        });
        return out.join("");
    }
    function numFormRt_addGroupSeparators(style, itext) {
        for (var S, gsym = style.group, separate = function() {
            itext[D - d - 1] += gsym;
        }, D = itext.length, gs = style.groupSizes, G = gs.length, d = 0, g = -1; ++g < G; ) {
            d += S = gs[g];
            if (!(d < D)) return;
            separate();
        }
        for (;(d += S) < D; ) separate();
    }
    function numForm_buildLiteral(s) {
        function numFormRt_literal() {
            return s;
        }
        return numFormRt_literal;
    }
    function numForm_buildReadDigit(beforeDecimal, digit, zero, edge) {
        function numFormRt_stylePadding(style) {
            return style[beforeDecimal ? "integerPad" : "fractionPad"];
        }
        function numFormRt_readInteger(style, text) {
            var L = text.length;
            if (digit < L) {
                var i = L - 1 - digit;
                return edge ? text.slice(0, i + 1).join("") : text[i];
            }
            return pad ? pad(style) : "";
        }
        function numFormRt_readFractional(style, text) {
            return digit < text.length ? text[digit] : pad ? pad(style) : "";
        }
        var pad = zero ? numFormRt_stylePadding : null;
        return beforeDecimal ? numFormRt_readInteger : numFormRt_readFractional;
    }
    function numForm_buildReadDecimalSymbol(hasZero) {
        return hasZero ? numFormRt_decimalSymbol : numFormRt_decimalSymbolUnlessInt;
    }
    function numForm_buildExponent(section, token) {
        function numFormRt_exponent(style, text, exponent) {
            var sign = exponent < 0 ? style.negativeSign : token.positive ? "+" : "", exp = "" + Math.abs(exponent), P = token.digits - exp.length;
            P > 0 && (exp = new Array(P + 1).join("0") + exp);
            return token.text + sign + exp;
        }
        return numFormRt_exponent;
    }
    function numFormRt_decimalSymbol(style) {
        return style.decimal;
    }
    function numFormRt_decimalSymbolUnlessInt(style, ftext) {
        return ftext.length ? style.decimal : "";
    }
    function numFormRt_currencySymbol(style) {
        return style.currency;
    }
    function numForm_abbreviationSymbol(style, text, exponent, abbreviation) {
        if (null != abbreviation) return style.abbreviations[abbreviation];
    }
    function dateForm_tryConfigure(other) {
        return def.string.is(other) ? !!this.mask(other) : def.is(other, dateForm) ? !!this.mask(other.mask()) : void 0;
    }
    function dateForm_createFormatter(mask) {
        return mask ? pv.Format.createFormatter(pv.Format.date(mask)) : def.string.to;
    }
    function customForm_tryConfigure(other) {
        return def.is(other, customForm) ? !!this.formatter(other.formatter()) : def.fun.is(other) ? !!this.formatter(other) : void 0;
    }
    function customForm_defaultFormatter(v) {
        return null != v ? String(v) : "";
    }
    function formProvider_field(mainFactory) {
        function fieldCast(value) {
            return def.is(value, mainFactory) || def.is(value, customForm) ? value : null;
        }
        function fieldFactory(config, proto) {
            return (def.fun.is(config) ? customForm : mainFactory)(config, proto);
        }
        return {
            cast: fieldCast,
            factory: fieldFactory
        };
    }
    function formProvider_tryConfigure(other) {
        switch (def.classOf(other)) {
          case formProvider:
            return !!this.number(other.number()).percent(other.percent()).date(other.date()).any(other.any());

          case numForm:
            return !!this.number(other);

          case dateForm:
            return !!this.date(other);

          case customForm:
            return !!this.any(other);
        }
        if (def.string.is(other)) {
            var formP = langProvider(other);
            if (formP) return !!def.configure(this, formP);
        }
    }
    function configLanguage(lang, config) {
        lang = normalizeLanguageCode(lang);
        var langStyle = def.getOwn(_languages, lang);
        if (langStyle) def.configure(langStyle, config); else {
            langStyle = _languages[lang] = formProvider(config);
            langStyle.languageCode = lang;
        }
        return langStyle;
    }
    function parseLanguageCode(langCode) {
        var re = /^([a-z]{2,8})(?:[-_]([a-z]{2}|\d{3}))?$/i, m = re.exec(langCode);
        if (!m) return null;
        var primary = m[1] ? m[1].toLowerCase() : "", region = m[2] ? m[2].toLowerCase() : "";
        return {
            code: primary + (region ? "-" + region : ""),
            primary: primary,
            region: region
        };
    }
    function normalizeLanguageCode(langCode) {
        return langCode ? langCode.toLowerCase() : "";
    }
    function getLanguage(langCode, fallback) {
        langCode = normalizeLanguageCode(langCode);
        var lang = def.getOwn(_languages, langCode);
        if (lang) return lang;
        if (!fallback) return null;
        var norm = parseLanguageCode(langCode);
        if (norm) {
            if (norm.code !== langCode && (lang = def.getOwn(_languages, norm.code))) return lang;
            if (norm.region && (lang = def.getOwn(_languages, norm.primary))) return lang;
        }
        return def.getOwn(_languages, _defaultLangCode, null);
    }
    var cdo = def.globalSpace("cdo", {});
    def.type("cdo.DimensionType").init(function(complexType, name, keyArgs) {
        this.complexType = complexType;
        this.name = name;
        this.label = def.get(keyArgs, "label") || def.titleFromName(name);
        var groupAndLevel = def.splitIndexedId(name);
        this.group = groupAndLevel[0];
        this.groupLevel = def.nullyTo(groupAndLevel[1], 0);
        this.label.indexOf("{") >= 0 && (this.label = def.format(this.label, [ this.groupLevel + 1 ]));
        this.isHidden = !!def.get(keyArgs, "isHidden");
        var valueType = def.get(keyArgs, "valueType") || null, valueTypeName = cdo.DimensionType.valueTypeName(valueType), cast = def.getOwn(cdo.DimensionType.cast, valueTypeName, null);
        this.valueType = valueType;
        this.valueTypeName = valueTypeName;
        this.cast = cast;
        var isNumber = this.valueType === Number, isDate = !isNumber && this.valueType === Date;
        this.isDiscreteValueType = !isNumber && !isDate;
        this.isDiscrete = def.get(keyArgs, "isDiscrete");
        if (null == this.isDiscrete) this.isDiscrete = this.isDiscreteValueType; else {
            this.isDiscrete = !!this.isDiscrete;
            if (!this.isDiscrete && this.isDiscreteValueType) throw def.error.argumentInvalid("isDiscrete", "The only supported continuous value types are Number and Date.");
        }
        this._converter = def.get(keyArgs, "converter") || null;
        if (!this._converter) {
            var rawFormat = def.get(keyArgs, "rawFormat");
            if (rawFormat) switch (this.valueType) {
              case Date:
                this._converter = pv.Format.createParser(pv.Format.date(rawFormat));
            }
        }
        this._key = def.get(keyArgs, "key") || null;
        null === this._key && isDate && (this._key = dimensionType_dateKey);
        this.setComparer(keyArgs && keyArgs.comparer);
        var format, formatter = def.get(keyArgs, "formatter"), formatProto = def.get(keyArgs, "formatProto"), formatName = isNumber ? "number" : isDate ? "date" : "any";
        if (formatter) format = cdo.format(def.set({}, formatName, formatter), formatProto); else if (this.isDiscreteValueType) format = formProvider(null, formatProto); else {
            format = def.get(keyArgs, "format");
            if (!format && !isNumber) {
                format = def.get(keyArgs, "rawFormat");
                format && (format = format.replace(/-/g, "/"));
            }
            if (format) {
                if (!def.is(format, formProvider)) {
                    (def.string.is(format) || def.fun.is(format) && !def.classOf(format)) && (format = def.set({}, formatName, format));
                    format = formProvider(format, formatProto);
                }
            } else format = formProvider(null, formatProto);
            formatter = format[formatName]();
        }
        this._formatter = formatter || null;
        this._format = format || null;
        this.isKey = Boolean(def.get(keyArgs, "isKey"));
    }).add({
        isCalculated: !1,
        compare: function(a, b) {
            return null == a ? null == b ? 0 : -1 : null == b ? 1 : this._comparer.call(null, a, b);
        },
        comparer: function(reverse) {
            var me = this;
            return me.isComparable ? reverse ? me._rc || (me._rc = function(a, b) {
                return me.compare(b, a);
            }) : me._dc || (me._dc = function(a, b) {
                return me.compare(a, b);
            }) : null;
        },
        setComparer: function(comparer) {
            if (void 0 === comparer || !comparer && !this.isDiscrete) switch (this.valueType) {
              case Number:
              case Date:
                comparer = def.compare;
            }
            this._comparer = comparer || null;
            this.isComparable = null != this._comparer;
            this._rc = this._dc = this._rac = this._dac = null;
        },
        atomComparer: function(reverse) {
            return reverse ? this._rac || (this._rac = this._createReverseAtomComparer()) : this._dac || (this._dac = this._createDirectAtomComparer());
        },
        _toDiscrete: function() {
            this.isDiscrete = !0;
        },
        _toCalculated: function() {
            this.isCalculated = !0;
        },
        _createReverseAtomComparer: function() {
            function reverseAtomComparer(a, b) {
                return a === b ? 0 : me.compare(b.value, a.value);
            }
            if (!this.isComparable) return atom_idComparerReverse;
            var me = this;
            return reverseAtomComparer;
        },
        _createDirectAtomComparer: function() {
            function directAtomComparer(a, b) {
                return a === b ? 0 : me.compare(a.value, b.value);
            }
            if (!this.isComparable) return atom_idComparer;
            var me = this;
            return directAtomComparer;
        },
        format: function() {
            return this._format;
        },
        formatter: function() {
            return this._formatter;
        },
        converter: function() {
            return this._converter;
        }
    });
    cdo.DimensionType.cast = {
        Date: function(value) {
            return value instanceof Date ? value : new Date(value);
        },
        Number: function(value) {
            value = Number(value);
            return isNaN(value) ? null : value;
        },
        String: String,
        Boolean: Boolean,
        Object: Object,
        Any: null
    };
    cdo.DimensionType.dimensionGroupName = function(dimName) {
        return dimName.replace(/^(.*?)(\d*)$/, "$1");
    };
    cdo.DimensionType.valueTypeName = function(valueType) {
        if (null == valueType) return "Any";
        switch (valueType) {
          case Boolean:
            return "Boolean";

          case Number:
            return "Number";

          case String:
            return "String";

          case Object:
            return "Object";

          case Date:
            return "Date";

          default:
            throw def.error.argumentInvalid("valueType", "Invalid valueType function: '{0}'.", [ valueType ]);
        }
    };
    def.type("cdo.ComplexType").init(function(dimTypeSpecs, keyArgs) {
        this._dims = {};
        this._dimsList = [];
        this._dimsNames = [];
        this._calculations = [];
        this._calculatedDimNames = {};
        this._dimsIndexByName = null;
        this._dimsByGroup = {};
        this._dimsNamesByGroup = {};
        this.format = formProvider(null, def.get(keyArgs, "formatProto"));
        this.nullNumberAtom = new cdo.NumberAtom(this, null);
        if (dimTypeSpecs) for (var name in dimTypeSpecs) this.addDimension(name, dimTypeSpecs[name]);
    }).add({
        describe: function() {
            var table = def.textTable(2).rowSep().row("Dimension", "Properties").rowSep();
            this._dimsList.forEach(function(type) {
                var features = [];
                features.push('"' + type.label + '"');
                features.push(type.valueTypeName);
                type.isComparable && features.push("comparable");
                type.isDiscrete || features.push("continuous");
                type.isHidden && features.push("hidden");
                table.row(type.name, features.join(", "));
            });
            table.rowSep(!0);
            return "COMPLEX TYPE INFORMATION\n" + table() + "\n";
        },
        dimensions: function(name, keyArgs) {
            if (null == name) return this._dims;
            var dimType = def.getOwn(this._dims, name, null);
            if (!dimType && def.get(keyArgs, "assertExists", !0)) throw def.error.argumentInvalid("name", "Undefined dimension '{0}'", [ name ]);
            return dimType;
        },
        filterExtensionDimensionNames: function(dimNames) {
            return dimNames.filter(function(dimName) {
                return !!def.hasOwn(this, dimName);
            }, this._dims);
        },
        dimensionsList: function() {
            return this._dimsList;
        },
        calculatedDimensionsList: function() {
            return this._calcDimsList;
        },
        dimensionsNames: function() {
            return this._dimsNames;
        },
        groupDimensions: function(group, keyArgs) {
            var dims = def.getOwn(this._dimsByGroup, group);
            if (!dims && def.get(keyArgs, "assertExists", !0)) throw def.error.operationInvalid("There is no dimension type group with name '{0}'.", [ group ]);
            return dims;
        },
        groupDimensionsNames: function(group, keyArgs) {
            var dimNames = def.getOwn(this._dimsNamesByGroup, group);
            if (!dimNames && def.get(keyArgs, "assertExists", !0)) throw def.error.operationInvalid("There is no dimension type group with name '{0}'.", [ group ]);
            return dimNames;
        },
        addDimension: function(name, dimTypeSpec) {
            name || def.fail.argumentRequired("name");
            !def.hasOwn(this._dims, name) || def.fail.operationInvalid("A dimension type with name '{0}' is already defined.", [ name ]);
            var dimension = new cdo.DimensionType(this, name, dimTypeSpec);
            this._dims[name] = dimension;
            this._dimsIndexByName = null;
            var groupLevel, group = dimension.group;
            if (group) {
                var groupDimsNames, groupDims = def.getOwn(this._dimsByGroup, group);
                if (groupDims) groupDimsNames = this._dimsNamesByGroup[group]; else {
                    groupDims = this._dimsByGroup[group] = [];
                    groupDimsNames = this._dimsNamesByGroup[group] = [];
                }
                groupLevel = def.array.insert(groupDimsNames, name, def.compare);
                groupLevel = ~groupLevel;
                def.array.insertAt(groupDims, groupLevel, dimension);
            }
            var index, L = this._dimsList.length;
            if (group) {
                groupLevel = dimension.groupLevel;
                for (var i = 0; i < L; i++) {
                    var dim = this._dimsList[i];
                    if (dim.group === group) {
                        if (dim.groupLevel > groupLevel) {
                            index = i;
                            break;
                        }
                        index = i + 1;
                    }
                }
                null == index && (index = L);
            } else index = L;
            def.array.insertAt(this._dimsList, index, dimension);
            def.array.insertAt(this._dimsNames, index, name);
            if (dimension._calculate) {
                index = def.array.binarySearch(this._calcDimsList, dimension._calculationOrder, def.compare, function(dimType) {
                    return dimType._calculationOrder;
                });
                index >= 0 ? index++ : index = ~index;
                def.array.insertAt(this._calcDimsList, index, dimension);
            }
            return dimension;
        },
        addCalculation: function(calcSpec) {
            calcSpec || def.fail.argumentRequired("calcSpec");
            var calculation = calcSpec.calculation || def.fail.argumentRequired("calculations[i].calculation"), dimNames = calcSpec.names;
            dimNames = def.string.is(dimNames) ? dimNames.split(/\s*\,\s*/) : def.array.as(dimNames);
            if (dimNames && dimNames.length) {
                var calcDimNames = this._calculatedDimNames;
                dimNames.forEach(function(name) {
                    if (name) {
                        name = name.replace(/^\s*(.+?)\s*$/, "$1");
                        !def.hasOwn(calcDimNames, name) || def.fail.argumentInvalid("calculations[i].names", "Dimension name '{0}' is already being calculated.", [ name ]);
                        var dimType = this._dims[name] || def.fail.argumentInvalid("calculations[i].names", "Undefined dimension with name '{0}'' ", [ name ]);
                        calcDimNames[name] = !0;
                        dimType._toCalculated();
                    }
                }, this);
            }
            this._calculations.push(calculation);
        },
        isCalculated: function(dimName) {
            return def.hasOwn(this._calculatedDimNames, dimName);
        },
        _calculate: function(complex) {
            var calcs = this._calculations, L = calcs.length;
            if (L) {
                for (var valuesByName = {}, i = 0; i < L; i++) {
                    (0, calcs[i])(complex, valuesByName);
                }
                return valuesByName;
            }
        },
        sortDimensionNames: function(dims, nameKey) {
            var dimsIndexByName = this._dimsIndexByName;
            if (!dimsIndexByName) {
                dimsIndexByName = def.query(this._dimsList).object({
                    name: function(dim) {
                        return dim.name;
                    },
                    value: function(dim, index) {
                        return index;
                    }
                });
                this._dimsIndexByName = dimsIndexByName;
            }
            dims.sort(function(da, db) {
                return def.compare(dimsIndexByName[nameKey ? nameKey(da) : da], dimsIndexByName[nameKey ? nameKey(db) : db]);
            });
            return dims;
        }
    });
    def.type("cdo.ComplexTypeProject").init(function(dimGroupSpecs) {
        this._dims = {};
        this._dimList = [];
        this._dimGroupsDims = {};
        this._dimGroupSpecs = dimGroupSpecs || {};
        this._calcList = [];
    }).add({
        _ensureDim: function(name, spec) {
            name || def.fail.argumentInvalid("name", "Invalid dimension name '{0}'.", [ name ]);
            var info = def.getOwn(this._dims, name);
            if (info) spec && def.setUDefaults(info.spec, spec); else {
                info = this._dims[name] = this._createDim(name, spec);
                this._dimList.push(info);
                var groupDimsNames = def.array.lazy(this._dimGroupsDims, info.groupName);
                def.array.insert(groupDimsNames, name, def.compare);
            }
            return info;
        },
        hasDim: function(name) {
            return def.hasOwn(this._dims, name);
        },
        setDim: function(name, spec) {
            var _ = this._ensureDim(name).spec;
            spec && def.copy(_, spec);
            return this;
        },
        setDimDefaults: function(name, spec) {
            def.setUDefaults(this._ensureDim(name).spec, spec);
            return this;
        },
        _createDim: function(name, spec) {
            var dimGroupName = cdo.DimensionType.dimensionGroupName(name), dimGroupSpec = this._dimGroupSpecs[dimGroupName];
            dimGroupSpec && (spec = def.create(dimGroupSpec, spec));
            return {
                name: name,
                groupName: dimGroupName,
                spec: spec || {}
            };
        },
        readDim: function(name, spec) {
            var info = this._ensureDim(name, spec);
            if (info.isRead) throw def.error.operationInvalid("Dimension '{0}' already is the target of a reader.", [ name ]);
            if (info.isCalc) throw def.error.operationInvalid("Dimension '{0}' is being calculated, so it cannot be the target of a reader.", [ name ]);
            info.isRead = !0;
        },
        calcDim: function(name, spec) {
            var info = this._ensureDim(name, spec);
            if (info.isCalc) throw def.error.operationInvalid("Dimension '{0}' already is being calculated.", [ name ]);
            if (info.isRead) throw def.error.operationInvalid("Dimension '{0}' is the target of a reader, so it cannot be calculated.", [ name ]);
            info.isCalc = !0;
        },
        isReadOrCalc: function(name) {
            if (name) {
                var info = def.getOwn(this._dims, name);
                if (info) return info.isRead || info.isCalc;
            }
            return !1;
        },
        groupDimensionsNames: function(groupDimName) {
            return this._dimGroupsDims[groupDimName];
        },
        setCalc: function(calcSpec) {
            calcSpec || def.fail.argumentRequired("calculations[i]");
            calcSpec.calculation || def.fail.argumentRequired("calculations[i].calculation");
            var dimNames = calcSpec.names;
            dimNames = def.string.is(dimNames) ? dimNames.split(/\s*\,\s*/) : def.array.as(dimNames);
            dimNames && dimNames.length && dimNames.forEach(this.calcDim, this);
            this._calcList.push(calcSpec);
        },
        configureComplexType: function(complexType, dimsOptions) {
            this._dimList.forEach(function(dimInfo) {
                var dimName = dimInfo.name, spec = dimInfo.spec;
                spec = this._extendSpec(dimName, spec, dimsOptions);
                complexType.addDimension(dimName, spec);
            }, this);
            this._calcList.forEach(function(calcSpec) {
                complexType.addCalculation(calcSpec);
            });
        },
        _extendSpec: function(dimName, dimSpec, keyArgs) {
            var dimGroup = cdo.DimensionType.dimensionGroupName(dimName);
            dimSpec || (dimSpec = {});
            switch (dimGroup) {
              case "category":
                def.get(keyArgs, "isCategoryTimeSeries", !1) && void 0 === dimSpec.valueType && (dimSpec.valueType = Date);
                break;

              case "value":
                void 0 === dimSpec.valueType && (dimSpec.valueType = Number);
            }
            void 0 !== dimSpec.converter || dimSpec.valueType !== Date || dimSpec.rawFormat || (dimSpec.rawFormat = def.get(keyArgs, "timeSeriesFormat"));
            dimSpec.formatProto = def.get(keyArgs, "formatProto");
            return dimSpec;
        }
    });
    def.type("cdo.Atom").init(function(dimension, value, label, rawValue, key) {
        this.dimension = dimension;
        this.id = null == value ? -def.nextId() : def.nextId();
        this.value = value;
        this._label = null == label ? null : label;
        void 0 !== rawValue && (this.rawValue = rawValue);
        this.key = key;
    }).add({
        isVirtual: !1,
        rawValue: void 0,
        get label() {
            var label = this._label;
            null === label && (this._label = label = this.dimension.format(this.value, this.rawValue));
            return label;
        },
        set label(label) {
            this._label = def.string.to(label);
        },
        get labelPercent() {
            return this.dimension.type.format().percent()(this.value);
        },
        toString: function() {
            var label = this.label;
            if (null != label) return label;
            label = this.value;
            return null != label ? "" + label : "";
        }
    });
    def.type("cdo.NumberAtom").init(function(complexType, value, label) {
        this.complexType = complexType;
        this.id = def.nextId();
        this.value = null == value ? null : value;
        this._label = null == label ? null : label;
        this.key = null == value ? "" : value.toString();
    }).add({
        dimension: null,
        get key() {
            return "" + this.value;
        },
        get rawValue() {
            return this.value;
        },
        get label() {
            var label = this._label;
            null === label && (this._label = label = this.complexType.format.number()(this.value, this.rawValue));
            return label;
        },
        set label(label) {
            this._label = def.string.to(label);
        },
        get labelPercent() {
            return this.complexType.format.percent()(this.value);
        }
    });
    var complex_nextId = 1;
    def.type("cdo.Complex").init(function(source, atomsByName, dimNames, atomsBase, wantLabel, calculate) {
        this.id = complex_nextId++;
        atomsBase || (atomsBase = null);
        var owner;
        if (source) {
            owner = source.owner;
            null === atomsBase && (atomsBase = source.atoms);
        } else owner = this;
        this.owner = owner;
        this.atoms = atomsBase ? Object.create(atomsBase) : {};
        var dimNamesSpecified = !!dimNames;
        dimNames || (dimNames = owner.type._dimsNames);
        if (atomsByName) {
            var dimName, atomsMap = this.atoms, ownerDims = owner._dimensions, addAtom = function(addDimName) {
                var atom = atomsByName[addDimName], ownerDim = ownerDims[addDimName];
                if (void 0 === ownerDim) {
                    if (!dimNamesSpecified) throw def.error.operationInvalid("Extension atom values require dimension names to be specified.");
                    if (!(atom instanceof cdo.Atom)) throw def.error.operationInvalid("Extension atom values must be cdo.Atom instances.");
                    atomsMap[addDimName] = atom;
                } else {
                    atom = ownerDim.intern(atom);
                    null == atom.value || null !== atomsBase && atom === atomsBase[addDimName] || (atomsMap[addDimName] = atom);
                }
            };
            if (dimNamesSpecified) for (var i = -1, D = dimNames.length; ++i < D; ) addAtom(dimNames[i]); else for (dimName in atomsByName) addAtom(dimName);
            if (calculate) {
                atomsByName = owner.type._calculate(this);
                for (dimName in atomsByName) def.hasOwnProp.call(atomsMap, dimName) || addAtom(dimName);
            }
        }
        this._initValueKeyLabel(dimNames, wantLabel);
    }).add({
        labelSep: " ~ ",
        keySep: "~",
        value: null,
        label: null,
        rawValue: void 0,
        _initValueKeyLabel: function(dimNames, wantLabel) {
            var atom, D = dimNames.length;
            if (0 === D) {
                this.key = "";
                this.value = null;
                wantLabel && (this.label = "");
            } else if (1 === D) {
                atom = this.atoms[dimNames[0]];
                this.key = this._getAtomKey(atom);
                this.value = atom.value;
                this.rawValue = atom.rawValue;
                wantLabel && (this.label = atom.label);
            } else {
                for (var value, atomKey, atomLabel, key = "", keySep = this.owner.keySep, labelSep = this.owner.labelSep, atomsMap = this.atoms, label = "", i = -1; ++i < D; ) {
                    atom = atomsMap[dimNames[i]];
                    0 === i ? value = atom.key : value += keySep + atom.key;
                    atomKey = this._getAtomKey(atom);
                    null !== atomKey && (0 === i ? key = atomKey : key += keySep + atomKey);
                    wantLabel && "" !== (atomLabel = atom.label) && ("" === label ? label = atomLabel : label += labelSep + atomLabel);
                }
                this.value = this.rawValue = value;
                this.key = key;
                wantLabel && (this.label = label);
            }
        },
        _getAtomKey: function(atom) {
            return atom.key;
        },
        getSpecifiedAtom: function(dimName) {
            return this.atoms[dimName];
        },
        ensureLabel: function() {
            var label = this.label;
            if (null == label) {
                label = "";
                var labelSep = this.owner.labelSep;
                def.eachOwn(this.atoms, function(atom) {
                    var alabel = atom.label;
                    alabel && (label ? label += labelSep + alabel : label = alabel);
                });
                this.label = label;
            }
            return label;
        },
        view: function(dimNames) {
            return new cdo.ComplexView(this, dimNames);
        },
        toString: function() {
            var s = [ "" + def.qualNameOf(this.constructor) ];
            null != this.index && s.push("#" + this.index);
            this.owner.type.dimensionsNames().forEach(function(name) {
                s.push(name + ": " + def.describe(this.atoms[name].value));
            }, this);
            return s.join(" ");
        },
        rightTrimKeySep: function(key) {
            return key && cdo.Complex.rightTrimKeySep(key, this.owner.keySep);
        },
        absKeyTrimmed: function() {
            return this.rightTrimKeySep(this.absKey);
        },
        keyTrimmed: function() {
            return this.rightTrimKeySep(this.key);
        }
    });
    cdo.Complex.rightTrimKeySep = function(key, keySep) {
        if (key && keySep) for (var j, K = keySep.length; key.lastIndexOf(keySep) === (j = key.length - K) && j >= 0; ) key = key.substr(0, j);
        return key;
    };
    cdo.Complex.values = function(complex, dimNames) {
        var atoms = complex.atoms;
        return dimNames.map(function(dimName) {
            return atoms[dimName].value;
        });
    };
    cdo.Complex.compositeKey = function(complex, dimNames) {
        for (var key = "", D = dimNames.length, keySep = complex.owner.keySep, datoms = complex.atoms, i = 0; i < D; i++) {
            var k = datoms[dimNames[i]].key;
            i ? key += keySep + k : key = k;
        }
        return key;
    };
    cdo.Complex.labels = function(complex, dimNames) {
        var atoms = complex.atoms;
        return dimNames.map(function(dimName) {
            return atoms[dimName].label;
        });
    };
    var complex_id = def.propGet("id");
    def.type("cdo.ComplexView", cdo.Complex).init(function(source, viewDimNames) {
        this.source = source;
        this.viewDimNames = viewDimNames;
        this.base(source, source.atoms, viewDimNames, source.owner.atoms, !0);
    }).add({
        values: function() {
            return cdo.Complex.values(this, this.viewDimNames);
        },
        labels: function() {
            return cdo.Complex.labels(this, this.viewDimNames);
        }
    });
    def.type("cdo.Datum", cdo.Complex).init(function(data, atomsByName, dimNames) {
        this.base(data, atomsByName, dimNames, null, !1, !0);
        this.key || (this.key = this.id);
    }).add({
        isSelected: !1,
        isVisible: !0,
        isNull: !1,
        isVirtual: !1,
        isTrend: !1,
        trend: null,
        isInterpolated: !1,
        interpolation: null,
        _getAtomKey: function(atom) {
            return atom.dimension.isKey ? atom.key : null;
        },
        setSelected: function(select) {
            if (this.isNull) return !1;
            select = null == select || !!select;
            var changed = this.isSelected !== select;
            if (changed) {
                select ? this.isSelected = !0 : delete this.isSelected;
                data_onDatumSelectedChanged.call(this.owner, this, select);
            }
            return changed;
        },
        toggleSelected: function() {
            return this.setSelected(!this.isSelected);
        },
        setVisible: function(visible) {
            if (this.isNull) return !1;
            visible = null == visible || !!visible;
            var changed = this.isVisible !== visible;
            if (changed) {
                this.isVisible = visible;
                data_onDatumVisibleChanged.call(this.owner, this, visible);
            }
            return changed;
        },
        toggleVisible: function() {
            return this.setVisible(!this.isVisible);
        }
    });
    var datum_isSelected = cdo.Datum.isSelected = def.propGet("isSelected");
    cdo.Datum.isSelectedT = datum_isSelectedT;
    cdo.Datum.isSelectedF = datum_isSelectedF;
    cdo.Datum.isVisibleT = datum_isVisibleT;
    cdo.Datum.isVisibleF = datum_isVisibleF;
    cdo.Datum.isNullT = datum_isNullT;
    cdo.Datum.isNullF = datum_isNullF;
    def.type("cdo.TrendDatum", cdo.Datum).init(function(data, atomsByName, dimNames, trend) {
        this.base(data, atomsByName, dimNames);
        this.trend = trend;
    }).add({
        isVirtual: !0,
        isTrend: !0
    });
    def.type("cdo.InterpolationDatum", cdo.Datum).init(function(data, atomsByName, dimNames, interpolation, dimName) {
        this.base(data, atomsByName, dimNames);
        this.interpolation = interpolation;
        this.interpDimName = dimName;
    }).add({
        isVirtual: !0,
        isInterpolated: !0
    });
    var dim_keyArgsAbsTrue = {
        abs: !0
    };
    def.type("cdo.Dimension").init(function(data, type) {
        this.data = data;
        this.type = type;
        this.root = this;
        this.owner = this;
        var name = type.name;
        this.name = name;
        this._atomComparer = type.atomComparer();
        this._atomsByKey = {};
        this.isKey = type.isKey;
        if (data.isOwner()) {
            this._atoms = [];
            this._lazyInit = null;
            dim_createVirtualNullAtom.call(this);
        } else {
            var source, parentData = data.parent;
            if (parentData) {
                source = parentData._dimensions[name];
                dim_addChild.call(source, this);
                this.root = data.parent.root;
            } else {
                parentData = data.linkParent;
                parentData || def.assert("Data must have a linkParent");
                source = parentData._dimensions[name];
                dim_addLinkChild.call(source, this);
            }
            this._nullAtom = this.owner._nullAtom;
            this._lazyInit = function() {
                this._lazyInit = null;
                for (var datums = this.data._datums, L = datums.length, atomsByKey = this._atomsByKey, isDiscrete = type.isDiscrete, i = 0; i < L; i++) {
                    var datum = datums[i];
                    if (isDiscrete || !datum.isNull) {
                        var atom = datum.atoms[name];
                        atomsByKey[atom.key] = atom;
                    }
                }
                this._atoms = source.atoms().filter(function(atom) {
                    return def.hasOwnProp.call(atomsByKey, atom.key);
                });
            };
        }
    }).add({
        parent: null,
        linkParent: null,
        _linkChildren: null,
        _atomsByKey: null,
        _atomVisibleDatumsCount: null,
        _disposed: !1,
        _nullAtom: null,
        _virtualNullAtom: null,
        _visibleAtoms: null,
        _visibleIndexes: null,
        _atomComparer: null,
        _atoms: null,
        _sumCache: null,
        count: function() {
            null !== this._lazyInit && this._lazyInit();
            return this._atoms.length;
        },
        isVisible: function(atom) {
            null !== this._lazyInit && this._lazyInit();
            def.hasOwn(this._atomsByKey, atom.key) || def.assert("Atom must exist in this dimension.");
            return dim_getVisibleDatumsCountMap.call(this)[atom.key] > 0;
        },
        atoms: function(keyArgs) {
            null !== this._lazyInit && this._lazyInit();
            var visible = def.get(keyArgs, "visible");
            if (null == visible) return this._atoms;
            visible = !!visible;
            this._visibleAtoms || (this._visibleAtoms = {});
            return this._visibleAtoms[visible] || (this._visibleAtoms[visible] = dim_calcVisibleAtoms.call(this, visible));
        },
        indexes: function(keyArgs) {
            null !== this._lazyInit && this._lazyInit();
            var visible = def.get(keyArgs, "visible");
            if (null == visible) return pv.range(0, this._atoms.length);
            visible = !!visible;
            this._visibleIndexes || (this._visibleIndexes = {});
            return this._visibleIndexes[visible] || (this._visibleIndexes[visible] = dim_calcVisibleIndexes.call(this, visible));
        },
        atom: function(value) {
            if (null == value || "" === value) return this._nullAtom;
            if (value instanceof cdo.Atom) return value;
            null !== this._lazyInit && this._lazyInit();
            var typeKey = this.type._key, key = typeKey ? typeKey.call(null, value) : value;
            return this._atomsByKey[key] || null;
        },
        getDistinctAtoms: function(values) {
            var atom, key, atomsByKey, atoms = [], L = values ? values.length : 0;
            if (L) {
                atomsByKey = {};
                for (var i = 0; i < L; i++) if ((atom = this.atom(values[i])) && !atomsByKey[key = "\0" + atom.key]) {
                    atomsByKey[key] = atom;
                    atoms.push(atom);
                }
            }
            return atoms;
        },
        extent: function(keyArgs) {
            var tmp, atoms = this.atoms(keyArgs), L = atoms.length;
            if (L) {
                var offset = this._nullAtom && null == atoms[0].value ? 1 : 0, countWithoutNull = L - offset;
                if (countWithoutNull > 0) {
                    var min = atoms[offset], max = atoms[L - 1];
                    if (min !== max && def.get(keyArgs, "abs", !1)) {
                        var minSign = min.value < 0 ? -1 : 1, maxSign = max.value < 0 ? -1 : 1;
                        if (minSign === maxSign) maxSign < 0 && (tmp = max, max = min, min = tmp); else if (countWithoutNull > 2) {
                            max.value < -min.value && (max = min);
                            var zeroIndex = def.array.binarySearch(atoms, 0, this.type.comparer(), function(a) {
                                return a.value;
                            });
                            if (zeroIndex < 0) {
                                zeroIndex = ~zeroIndex;
                                var negAtom = atoms[zeroIndex - 1], posAtom = atoms[zeroIndex];
                                min = -negAtom.value < posAtom.value ? negAtom : posAtom;
                            } else min = atoms[zeroIndex];
                        } else max.value < -min.value && (tmp = max, max = min, min = tmp);
                    }
                    return {
                        min: min,
                        max: max
                    };
                }
            }
        },
        min: function(keyArgs) {
            var atoms = this.atoms(keyArgs), L = atoms.length;
            if (L) {
                var offset = this._nullAtom && null == atoms[0].value ? 1 : 0;
                return L > offset ? atoms[offset] : void 0;
            }
        },
        max: function(keyArgs) {
            var atoms = this.atoms(keyArgs), L = atoms.length;
            return L && null != atoms[L - 1].value ? atoms[L - 1] : void 0;
        },
        sumAbs: function(keyArgs) {
            return this.sumAbsAtom(keyArgs).value;
        },
        value: function(keyArgs) {
            return this.valueAtom(keyArgs).value;
        },
        valueAbs: function(keyArgs) {
            return this.valueAbsAtom(keyArgs).value;
        },
        sum: function(keyArgs) {
            return this.sumAtom(keyArgs).value;
        },
        sumAtom: function(keyArgs) {
            var isAbs = !!def.get(keyArgs, "abs", !1), zeroIfNone = def.get(keyArgs, "zeroIfNone", !0), key = dim_buildDatumsFilterKey(keyArgs) + ":" + isAbs, sumAtom = def.getOwn(this._sumCache, key);
            if (void 0 === sumAtom) {
                var dimName = this.name, sum = this.data.datums(null, keyArgs).reduce(function(result, datum) {
                    if (datum.isNull) return result;
                    var value = datum.atoms[dimName].value;
                    if (null === value) return result;
                    isAbs && value < 0 && (value = -value);
                    return null != result ? result + value : value;
                }, null);
                (this._sumCache || (this._sumCache = {}))[key] = sumAtom = this.read(sum);
            }
            return zeroIfNone && null === sumAtom.value ? this.read(0) : sumAtom;
        },
        sumAbsAtom: function(keyArgs) {
            keyArgs = keyArgs ? def.create(keyArgs, dim_keyArgsAbsTrue) : dim_keyArgsAbsTrue;
            return this.sumAtom(keyArgs);
        },
        valueAtom: function(keyArgs) {
            return this.sumAtom(keyArgs);
        },
        valueAbsAtom: function(keyArgs) {
            var atom = this.valueAtom(keyArgs);
            return atom.value < 0 ? this.read(-atom.value) : atom;
        },
        percent: function(atomOrValue, keyArgs) {
            var value = atomOrValue instanceof cdo.Atom ? atomOrValue.value : atomOrValue;
            if (!value) return 0;
            var sum = this.sumAbs(keyArgs);
            return sum ? Math.abs(value) / sum : 0;
        },
        valuePercent: function(keyArgs) {
            var valueAbs = this.valueAbs(keyArgs);
            if (!valueAbs) return 0;
            var parentData = this.data.parent;
            return parentData ? valueAbs / parentData.dimensionsSumAbs(this.name, keyArgs) : 1;
        },
        percentOverParent: function(keyArgs) {
            return this.valuePercent(keyArgs);
        },
        format: function(value, sourceValue) {
            return def.string.to(this.type._formatter ? this.type._formatter.call(null, value, sourceValue) : value);
        },
        intern: function(sourceValue, isVirtual) {
            return this._read(sourceValue, !0, isVirtual);
        },
        read: function(sourceValue) {
            return this._read(sourceValue, !1);
        },
        _read: function(sourceValue, intern, isVirtual) {
            var value, label;
            if (null == sourceValue || "" === sourceValue) return this._nullAtom || (intern ? dim_createNullAtom.call(this) : this.owner._virtualNullAtom);
            if ("object" == typeof sourceValue) {
                if (sourceValue instanceof cdo.Atom) {
                    if (sourceValue.dimension !== this) throw def.error.operationInvalid("Atom is of a different dimension.");
                    return sourceValue;
                }
                if ("v" in sourceValue) {
                    label = sourceValue.f;
                    if (null == (sourceValue = sourceValue.v) || "" === sourceValue) return this._nullAtom || (intern ? dim_createNullAtom.call(this, label) : this.owner._virtualNullAtom);
                }
            }
            var auxFun, type = this.type;
            if (isVirtual || null === (auxFun = type._converter)) value = sourceValue; else if (null == (value = auxFun(sourceValue)) || "" === value) return this._nullAtom || (intern ? dim_createNullAtom.call(this) : this.owner._virtualNullAtom);
            if (null !== (auxFun = type.cast) && (null == (value = auxFun(value)) || "" === value)) return this._nullAtom || (intern ? dim_createNullAtom.call(this) : this.owner._virtualNullAtom);
            var key = "" + (null !== (auxFun = type._key) ? auxFun(value) : value);
            if (0 === key.length) throw def.error.operationInvalid("Only a null value can have an empty key.");
            var atom;
            if (intern) {
                null !== this._lazyInit && this._lazyInit();
                if (void 0 !== (atom = this._atomsByKey[key])) {
                    intern && !isVirtual && atom.isVirtual && delete atom.isVirtual;
                    return atom;
                }
                return dim_createAndInternAtom.call(this, sourceValue, key, value, label, isVirtual);
            }
            return void 0 !== (atom = this.owner._atomsByKey[key]) ? atom : new cdo.Atom(this, value, label, sourceValue, key);
        },
        dispose: function() {
            var v, me = this;
            if (!me._disposed) {
                cdo_disposeChildList(me.childNodes, "parent");
                cdo_disposeChildList(me._linkChildren, "linkParent");
                (v = me.parent) && cdo_removeColChild(v, "childNodes", me, "parent");
                (v = me.linkParent) && cdo_removeColChild(v, "_linkChildren", me, "linkParent");
                dim_clearVisiblesCache.call(me);
                me._lazyInit = me._atoms = me._nullAtom = me._virtualNullAtom = null;
                me._disposed = !0;
            }
        }
    });
    def.type("cdo.Data", cdo.Complex).init(function(keyArgs) {
        if (null == keyArgs) throw def.error.argumentRequired("keyArgs");
        this._visibleNotNullDatums = new def.Map();
        var owner, atomsIsSet, atomsBase, atomsDimNames, childIndex, extensionDatums, datums = null, atoms = null, parent = this.parent = keyArgs.parent || null;
        if (parent) {
            this.root = parent.root;
            this.depth = parent.depth + 1;
            this.type = parent.type;
            owner = parent.owner;
            datums = keyArgs.datums || def.fail.argumentRequired("datums");
            atoms = keyArgs.atoms || def.fail.argumentRequired("atoms");
            atomsDimNames = keyArgs.atomsDimNames || def.fail.argumentRequired("atomsDimNames");
            atomsBase = parent.atoms;
            extensionDatums = keyArgs.extensionDatums || parent.extensionDatums;
            atomsIsSet = Object.create(parent.atomsIsSet);
            atomsDimNames.forEach(function(p) {
                atomsIsSet[p] = !0;
            });
        } else {
            this.root = this;
            atomsDimNames = [];
            var linkParent = keyArgs.linkParent || null;
            if (linkParent) {
                owner = linkParent.owner;
                this.type = owner.type;
                datums = keyArgs.datums || def.fail.argumentRequired("datums");
                this._leafs = [];
                atomsBase = keyArgs.atomsBase || linkParent.atoms;
                atomsIsSet = keyArgs.atomsBaseIsSet || Object.create(linkParent.atomsIsSet);
                extensionDatums = keyArgs.extensionDatums || linkParent.extensionDatums;
                childIndex = def.get(keyArgs, "index", null);
                cdo_addLinkChild.call(linkParent, this, childIndex);
            } else {
                owner = this;
                this.type = keyArgs.type || def.fail.argumentRequired("type");
                atomsBase = {};
                atomsIsSet = {};
                keyArgs.labelSep && (this.labelSep = keyArgs.labelSep);
                keyArgs.keySep && (this.keySep = keyArgs.keySep);
                this._selectedNotNullDatums = new def.Map();
            }
        }
        this.owner = owner;
        this._datums = [];
        this._datumsById = {};
        this._datumsByKey = {};
        null !== datums && this._addDatumsLocal(datums);
        this._atomsBase = atomsBase;
        this.atomsIsSet = atomsIsSet;
        this.extensionDatums = extensionDatums || null;
        this._dimensions = {};
        this._dimensionsList = [];
        this.type.dimensionsList().forEach(this._initDimension, this);
        this.base(owner, atoms, atomsDimNames, atomsBase, !0);
        pv.Dom.Node.call(this);
        if (parent) {
            childIndex = def.get(keyArgs, "index", null);
            cdo_addChild.call(parent, this, childIndex);
            this.absKey = parent.absKey ? def.string.join(owner.keySep, parent.absKey, this.key) : this.key;
            this.absLabel = parent.absLabel ? def.string.join(owner.labelSep, parent.absLabel, this.label) : this.label;
        } else {
            this.absKey = this.key;
            this.absLabel = this.label;
        }
    }).add(pv.Dom.Node).add({
        parent: null,
        linkParent: null,
        _dimensions: null,
        _dimensionsList: null,
        _freeDimensionNames: null,
        _linkChildren: null,
        _leafs: null,
        _childrenByKey: null,
        _visibleNotNullDatums: null,
        _selectedNotNullDatums: null,
        _groupByCache: null,
        _sumAbsCache: null,
        treeHeight: null,
        _datums: null,
        _datumsById: null,
        _datumsByKey: null,
        depth: 0,
        label: "",
        absLabel: "",
        _disposed: !1,
        _isFlattenGroup: !1,
        _isDegenerateFlattenGroup: !1,
        _initDimension: function(dimType) {
            var dim = new cdo.Dimension(this, dimType);
            this._dimensions[dimType.name] = dim;
            this._dimensionsList.push(dim);
        },
        dimensions: function(name, keyArgs) {
            if (null == name) return this._dimensions;
            var dim = def.getOwn(this._dimensions, name);
            if (!dim && def.get(keyArgs, "assertExists", !0)) throw def.error.argumentInvalid("name", "Undefined dimension '{0}'.", [ name ]);
            return dim;
        },
        dimensionsList: function() {
            return this._dimensionsList;
        },
        getSpecifiedAtom: function(dimName) {
            return !0 === this.atomsIsSet[dimName] ? this.atoms[dimName] : null;
        },
        freeDimensionsNames: function() {
            var free = this._freeDimensionNames;
            free || (this._freeDimensionNames = free = this.type.dimensionsNames().filter(function(dimName) {
                var atom = this.atoms[dimName];
                return !(atom instanceof cdo.Atom) || null == atom.value;
            }, this));
            return free;
        },
        isOwner: function() {
            return this.owner === this;
        },
        children: function() {
            var cs = this.childNodes;
            return cs.length > 0 ? def.query(cs) : def.query();
        },
        child: function(key) {
            return def.getOwn(this._childrenByKey, key, null);
        },
        childCount: function() {
            return this.childNodes.length;
        },
        contains: function(datum) {
            return def.hasOwn(this._datumsById, datum.id);
        },
        datumByKey: function(key) {
            return def.getOwn(this._datumsByKey, key, null);
        },
        leafs: function() {
            return def.query(this._leafs);
        },
        count: function() {
            return this._datums.length;
        },
        firstDatum: function() {
            return this._datums.length > 0 ? this._datums[0] : null;
        },
        firstAtoms: function() {
            return (this.firstDatum() || this).atoms;
        },
        singleDatum: function() {
            var datums = this._datums;
            return 1 === datums.length ? datums[0] : null;
        },
        dispose: function() {
            var me = this;
            if (!me._disposed) {
                cdo_disposeChildLists.call(me);
                var v;
                (v = me._selectedNotNullDatums) && v.clear();
                me._visibleNotNullDatums.clear();
                v = me._dimensionsList;
                for (var i = 0, L = v.length; i < L; i++) v[i].dispose();
                me._dimensions = null;
                me._dimensionsList = null;
                if (v = me.parent) {
                    v.removeChild(me);
                    me.parent = null;
                }
                (v = me.linkParent) && cdo_removeLinkChild.call(v, me);
                me._disposed = !0;
            }
        },
        disposeChildren: function() {
            cdo_disposeChildLists.call(this);
        }
    });
    cdo.Data.add({
        selectedCount: function() {
            return this.isOwner() ? this._selectedNotNullDatums.count : this.datums(null, {
                selected: !0
            }).count();
        },
        selectedDatums: function() {
            return this.isOwner() ? this._selectedNotNullDatums.values() : this.datums(null, {
                selected: !0
            }).array();
        },
        selectedDatumMap: function() {
            if (this.isOwner()) return this._selectedNotNullDatums.clone();
            var datums = this.datums(null, {
                selected: !0
            }).object({
                name: def.propGet("id")
            });
            return new def.Set(datums);
        },
        visibleCount: function() {
            return this._visibleNotNullDatums.count;
        },
        replaceSelected: function(datums) {
            def.array.is(datums) || (datums = datums.array());
            var alreadySelectedById = def.query(datums).where(datum_isSelected).object({
                name: complex_id
            }), changed = this.owner.clearSelected(function(datum) {
                return !def.hasOwn(alreadySelectedById, datum.id);
            });
            changed |= cdo.Data.setSelected(datums, !0);
            return changed;
        },
        clearSelected: function(funFilter) {
            if (this.owner !== this) return this.owner.clearSelected(funFilter);
            if (!this._selectedNotNullDatums.count) return !1;
            var changed;
            if (funFilter) {
                changed = !1;
                this._selectedNotNullDatums.values().filter(funFilter).forEach(function(datum) {
                    changed = !0;
                    datum_deselect.call(datum);
                    this._selectedNotNullDatums.rem(datum.id);
                }, this);
            } else {
                changed = !0;
                this._selectedNotNullDatums.values().forEach(function(datum) {
                    datum_deselect.call(datum);
                });
                this._selectedNotNullDatums.clear();
            }
            return changed;
        }
    });
    cdo.Data.setSelected = function(datums, selected) {
        var anyChanged = 0;
        datums && def.query(datums).each(function(datum) {
            anyChanged |= datum.setSelected(selected);
        });
        return !!anyChanged;
    };
    cdo.Data.toggleSelected = function(datums, any) {
        def.array.isLike(datums) || (datums = def.query(datums).array());
        var q = def.query(datums), on = any ? q.any(datum_isSelected) : q.all(datum_isNullOrSelected);
        return this.setSelected(datums, !on);
    };
    cdo.Data.setVisible = function(datums, visible) {
        var anyChanged = 0;
        datums && def.query(datums).each(function(datum) {
            anyChanged |= datum.setVisible(visible);
        });
        return !!anyChanged;
    };
    cdo.Data.toggleVisible = function(datums) {
        def.array.isLike(datums) || (datums = def.query(datums).array());
        var allVisible = def.query(datums).all(def.propGet("isVisible"));
        return cdo.Data.setVisible(datums, !allVisible);
    };
    cdo.Data.add({
        select: null,
        load: function(atomz, keyArgs) {
            cdo_assertIsOwner.call(this);
            var whereFun = def.get(keyArgs, "where"), isNullFun = def.get(keyArgs, "isNull"), isAdditive = def.get(keyArgs, "isAdditive", !1), datums = def.query(atomz).select(function(atoms) {
                var datum = new cdo.Datum(this, atoms);
                isNullFun && isNullFun(datum) && (datum.isNull = !0);
                return whereFun && !whereFun(datum) ? null : datum;
            }, this);
            data_setDatums.call(this, datums, {
                isAdditive: isAdditive,
                doAtomGC: !0
            });
        },
        clearVirtuals: function() {
            var datums = this._datums, L = datums.length;
            if (L > 0) {
                this._sumAbsCache = null;
                for (var removed, i = 0; i < L; ) {
                    var datum = datums[i];
                    if (datum.isVirtual) {
                        cdo_removeDatumLocal.call(this, datum);
                        L--;
                        removed = !0;
                    } else i++;
                }
                if (removed) {
                    if (!datums.length && this.parent) return void this.dispose();
                    var children = this.childNodes;
                    if (children) {
                        i = 0;
                        L = children.length;
                        for (;i < L; ) {
                            var childData = children[i];
                            childData.clearVirtuals();
                            childData.parent ? i++ : L--;
                        }
                    }
                    this._linkChildren && this._linkChildren.forEach(function(linkChildData) {
                        linkChildData.clearVirtuals();
                    });
                }
            }
            def.eachOwn(this._dimensions, function(dim) {
                dim_uninternVirtualAtoms.call(dim);
            });
        },
        add: function(datums) {
            cdo_assertIsOwner.call(this);
            data_setDatums.call(this, datums, {
                isAdditive: !0,
                doAtomGC: !0
            });
        },
        _addDatumsSimple: function(newDatums) {
            this._addDatumsLocal(newDatums);
            this._onDatumsAdded(newDatums);
        },
        _onDatumsAdded: function(newDatums) {
            var linkChildren = this._linkChildren;
            if (linkChildren) for (var i = -1, L = linkChildren.length; ++i < L; ) linkChildren[i]._addDatumsSimple(newDatums);
        },
        _addDatumsLocal: function(newDatums) {
            var datums = this._datums, visibleDatumsMap = this._visibleNotNullDatums, selectedDatumsMap = this._selectedNotNullDatums, datumsById = this._datumsById, datumsByKey = this._datumsByKey, internAtoms = !!this._dimensions;
            this._sumAbsCache = null;
            for (var i = -1, L = newDatums.length; ++i < L; ) {
                var newDatum = newDatums[i], id = newDatum.id;
                if (void 0 === datumsById[id]) {
                    datums.push(newDatum);
                    datumsById[id] = newDatum;
                    datumsByKey[newDatum.key] = newDatum;
                    internAtoms && data_processDatumAtoms.call(this, newDatum, !0, !1);
                    if (!newDatum.isNull) {
                        selectedDatumsMap && newDatum.isSelected && selectedDatumsMap.set(id, newDatum);
                        newDatum.isVisible && visibleDatumsMap.set(id, newDatum);
                    }
                }
            }
        },
        groupBy: function(groupingSpecText, keyArgs) {
            var groupByCache, data, groupOper = new cdo.GroupingOper(this, groupingSpecText, keyArgs), cacheKey = groupOper.key;
            if (cacheKey) {
                groupByCache = this._groupByCache;
                data = groupByCache && groupByCache[cacheKey];
            }
            if (data) def.debug >= 7 && def.log("[GroupBy] Cache key hit '" + cacheKey + "'"); else {
                def.debug >= 7 && def.log("[GroupBy] " + (cacheKey ? "Cache key not found : '" + cacheKey + "' on '" + this.id + "'" : "No Cache key"));
                data = groupOper.execute();
                cacheKey && ((groupByCache || (this._groupByCache = {}))[cacheKey] = data);
            }
            return data;
        },
        where: function(querySpec, keyArgs) {
            var normalizedQuerySpec = querySpec && data_normalizeQuerySpec.call(this, querySpec), datums = this._datums;
            datums.length > 0 && (normalizedQuerySpec ? datums = data_where.call(this, normalizedQuerySpec, keyArgs).array() : keyArgs && (datums = data_whereState(def.query(datums), keyArgs).array()));
            var where = (normalizedQuerySpec || keyArgs) && data_wherePredicate(normalizedQuerySpec, keyArgs);
            return new cdo.FilteredData({
                linkParent: this,
                datums: datums,
                where: where
            });
        },
        datums: function(querySpec, keyArgs) {
            if (0 === this._datums.length) return def.query();
            if (!querySpec) return keyArgs ? data_whereState(def.query(this._datums), keyArgs) : def.query(this._datums);
            var normalizedQuerySpec = data_normalizeQuerySpec.call(this, querySpec);
            return data_where.call(this, normalizedQuerySpec, keyArgs);
        },
        datum: function(querySpec, keyArgs) {
            return this.datums(querySpec, keyArgs).first() || null;
        },
        dimensionsSumAbs: function(dimName, keyArgs) {
            var value = this.dimensionNumberValue(dimName, keyArgs).value;
            return null !== value && value < 0 ? -value : value;
        },
        dimensionNumberValue: function(dimName, keyArgs) {
            var operArgs = this._createDimensionOperArgs(dimName, keyArgs);
            return this._dimensionNumberValue(operArgs);
        },
        _createDimensionOperArgs: function(dimName, keyArgs) {
            var discrimFun, discrimPossibleDimNames, discrimKey = null;
            if ("function" == typeof dimName) {
                discrimFun = dimName;
                discrimPossibleDimNames = def.get(keyArgs, "discrimPossibleDims") || null;
                discrimKey = def.get(keyArgs, "discrimKey") || null;
                null !== discrimKey && (discrimKey = "discrim:" + discrimKey);
            } else {
                discrimFun = def.fun.constant(dimName);
                discrimPossibleDimNames = [ dimName ];
                discrimKey = dimName;
            }
            var cacheKey = null;
            null !== discrimKey && (cacheKey = discrimKey + ":" + dim_buildDatumsFilterKey(keyArgs) + ":" + (discrimPossibleDimNames || []).join("|"));
            return {
                discrimFun: discrimFun,
                discrimPossibleDimNames: discrimPossibleDimNames,
                cacheKey: cacheKey,
                keyArgs: keyArgs
            };
        },
        _dimensionNumberValue: function(operArgs) {
            var valueAtom, cacheKey = operArgs.cacheKey;
            if (null === cacheKey || void 0 === (valueAtom = def.getOwn(this._sumAbsCache, cacheKey))) {
                valueAtom = this._dimensionNumberValueCore(operArgs);
                null !== cacheKey && ((this._sumAbsCache || (this._sumAbsCache = {}))[cacheKey] = valueAtom);
            }
            return valueAtom;
        },
        _dimensionNumberValueCore: function(operArgs) {
            var value, valueDimName = operArgs.discrimFun(this, null !== operArgs.discrimPossibleDimNames);
            if (0 === this.childCount()) {
                if (null !== valueDimName) return this.dimensions(valueDimName).valueAtom(operArgs.keyArgs);
                value = def.query(operArgs.discrimPossibleDimNames).select(function(possibleDimName) {
                    return this.dimensions(possibleDimName).valueAbsAtom(operArgs.keyArgs).value;
                }, this).reduce(def.addPreservingNull, null);
            } else value = this.children().where(function(childData) {
                return !childData._isFlattenGroup || childData._isDegenerateFlattenGroup;
            }).select(function(childData) {
                var value = childData._dimensionNumberValue(operArgs).value;
                return null !== value && value < 0 ? -value : value;
            }).reduce(def.addPreservingNull, null);
            return null !== valueDimName ? this.dimensions(valueDimName).read(value) : null === value ? this.type.nullNumberAtom : new cdo.NumberAtom(this.type, value);
        },
        dimensionPercentValue: function(dimName, keyArgs) {
            function getAtom(value) {
                return null === valueDim ? new cdo.NumberAtom(this.type, value) : valueDim.read(value);
            }
            var operArgs = this._createDimensionOperArgs(dimName, keyArgs), valueAtom = this._dimensionNumberValue(operArgs), value = valueAtom.value;
            if (null === value) return valueAtom;
            var valueDim = valueAtom.dimension;
            if (0 === value) return getAtom.call(this, 0);
            var parentData = this.parent;
            if (null === parentData) return getAtom.call(this, 1);
            var sumAbsAtom = parentData._dimensionNumberValue(operArgs);
            return getAtom.call(this, Math.abs(value) / sumAbsAtom.value);
        }
    }).type().add({
        lca: function(datas) {
            var dataB, listA, listB, L = datas.length, a = null;
            if (L) {
                if (1 === L) return datas[0];
                var i = 1;
                listA = data_ancestorsAndSelfList(datas[0]);
                do {
                    dataB = datas[i];
                    listB = data_ancestorsAndSelfList(dataB);
                    if (!(a = data_lowestCommonAncestor(listA, listB))) return null;
                    dataB;
                    listA = listB;
                } while (++i < L);
            }
            return a;
        }
    });
    cdo.querySpecPredicate = cdo_querySpecPredicate;
    def.type("cdo.FilteredData", cdo.Data).init(function(keyArgs) {
        if (null == keyArgs || null != keyArgs.parent || null == keyArgs.linkParent) throw def.error.argumentRequired("keyArgs.linkParent");
        this.base(keyArgs);
        this._wherePred = keyArgs.where || def.fail.argumentRequired("keyArgs.where");
    }).add({
        _addDatumsSimple: function(newDatums) {
            newDatums = newDatums.filter(this._wherePred);
            this.base(newDatums);
        }
    });
    def.type("cdo.GroupingData", cdo.Data).init(function(keyArgs) {
        if (null == keyArgs) throw def.error.argumentRequired("keyArgs");
        this.base(keyArgs);
        this.groupingOper = keyArgs.groupingOper || def.fail.argumentRequired("keyArgs.groupingOper");
        this.groupingSpec = keyArgs.groupingSpec || null;
        this.groupingLevelSpec = keyArgs.groupingLevelSpec || null;
    });
    def.type("cdo.GroupingRootData", cdo.GroupingData).init(function(keyArgs) {
        if (null == keyArgs || null != keyArgs.parent || null == keyArgs.linkParent) throw def.error.argumentRequired("keyArgs.linkParent");
        var groupSpec = keyArgs.groupingSpec;
        if (null == groupSpec) throw def.error.argumentRequired("keyArgs.groupingSpec");
        var groupOper = keyArgs.groupingOper;
        if (groupOper && groupSpec.hasExtensionComplexTypes) {
            keyArgs = Object.create(keyArgs);
            var atomsBase = keyArgs.atomsBase = Object.create(keyArgs.linkParent.atoms), extensionDataSetsMap = groupOper._extensionDataSetsMap;
            groupSpec.extensionDimensions().each(function(dimSpec) {
                void 0 === atomsBase[dimSpec.fullName] && (atomsBase[dimSpec.fullName] = extensionDataSetsMap[dimSpec.dataSetName].owner.atoms[dimSpec.name]);
            });
        }
        this.base(keyArgs);
    }).add({
        _addDatumsSimple: function(newDatums) {
            newDatums = this.groupingOper.executeAdd(this, newDatums);
            this._onDatumsAdded(newDatums);
        }
    });
    def.type("cdo.GroupData", cdo.GroupingData).init(function(keyArgs) {
        if (null == keyArgs || null == keyArgs.parent) throw def.error.argumentRequired("keyArgs.parent");
        this.base(keyArgs);
    });
    cdo.Data.add({
        getInfo: function() {
            var out = [ "DATA SUMMARY", def.logSeparator, "  Dimension", def.logSeparator ];
            def.eachOwn(this.dimensions(), function(dimension, name) {
                var count = dimension.count(), type = dimension.type, features = [];
                features.push();
                features.push(type.valueTypeName);
                type.isComparable && features.push("comparable");
                type.isDiscrete || features.push("continuous");
                type.isHidden && features.push("hidden");
                out.push("  " + name + ' ("' + type.label + '", #' + count + ")\n\t" + dimension.atoms().slice(0, 10).map(function(atom) {
                    return atom.label;
                }).join(", ") + (count > 10 ? "..." : ""));
            });
            return out.join("\n");
        },
        getValues: function() {
            return pv.range(0, this.getCategoriesSize()).map(function(categIndex) {
                return this._getValuesForCategoryIndex(categIndex);
            }, this);
        },
        _getDimensionValues: function(name) {
            return this.dimensions(name).atoms().map(function(atom) {
                return atom.value;
            });
        },
        _getDimensionVisibleValues: function(name) {
            return this.dimensions(name).atoms({
                visible: !0
            }).map(function(atom) {
                return atom.value;
            });
        },
        getSeries: function() {
            return this._getDimensionValues("series");
        },
        getVisibleSeriesIndexes: function() {
            return this.dimensions("series").indexes({
                visible: !0
            });
        },
        getVisibleCategoriesIndexes: function() {
            return this.dimensions("category").indexes({
                visible: !0
            });
        },
        getVisibleSeries: function() {
            return this._getDimensionVisibleValues("series");
        },
        getCategories: function() {
            return this._getDimensionValues("category");
        },
        getVisibleCategories: function() {
            return this._getDimensionVisibleValues("category");
        },
        _getValuesForCategoryIndex: function(categIdx) {
            var categAtom = this.dimensions("category").atoms()[categIdx], datumsBySeriesKey = this.datums({
                category: categAtom
            }).uniqueIndex(function(datum) {
                return datum.atoms.series.key;
            });
            return this.dimensions("series").atoms().map(function(atom) {
                var datum = def.getOwn(datumsBySeriesKey, atom.key);
                return datum ? datum.atoms.value.value : null;
            });
        },
        getSeriesSize: function() {
            var dim = this.dimensions("series", {
                assertExists: !1
            });
            return dim ? dim.count() : 0;
        },
        getCategoriesSize: function() {
            var dim = this.dimensions("category", {
                assertExists: !1
            });
            return dim ? dim.count() : 0;
        }
    });
    def.type("cdo.DataOper").init(function(linkParent, keyArgs) {
        linkParent || def.fail.argumentRequired("linkParent");
        this._linkParent = linkParent;
    }).add({
        key: null,
        execute: def.abstractMethod
    });
    def.type("cdo.GroupingOper", cdo.DataOper).init(function(linkParent, groupingSpecs, keyArgs) {
        groupingSpecs || def.fail.argumentRequired("groupingSpecs");
        groupingSpecs = def.array.as(groupingSpecs);
        if (0 === groupingSpecs.length) throw def.error.argumentRequired("groupingSpecText");
        def.get(keyArgs, "inverted", !1) && (groupingSpecs = groupingSpecs.slice().reverse());
        this.base(linkParent, keyArgs);
        var where = def.get(keyArgs, "where"), whereKey = where && def.get(keyArgs, "whereKey") || "", isVisible = def.get(keyArgs, "visible", null), isSelected = def.get(keyArgs, "selected", null);
        this._preFilter = data_wherePredicate(null, {
            visible: isVisible,
            selected: isSelected,
            where: where
        });
        var isNull = def.get(keyArgs, "isNull", null);
        this._postFilter = data_wherePredicate(null, {
            isNull: isNull
        });
        var hasKey = null == isSelected && !(where && !whereKey), groupSpecKeys = hasKey ? [] : null, extensionDataSetsKey = "", extensionDataSetsMap = null, extensionDataSetsMapProvided = def.get(keyArgs, "extensionDataSetsMap", null), reverse = def.get(keyArgs, "reverse", !1);
        this._groupSpecs = groupingSpecs.map(function(groupSpec) {
            if (groupSpec instanceof cdo.GroupingSpec) {
                if (groupSpec.complexType !== linkParent.type) throw def.error.argumentInvalid("groupingSpecText", "Invalid associated complex type.");
            } else groupSpec = cdo.GroupingSpec.parse(groupSpec, linkParent.type);
            if (groupSpec.isNull) throw def.error.argumentInvalid("groupingSpecText", "Null grouping specification.");
            groupSpec.flatteningMode === cdo.FlatteningMode.SingleLevel && (groupSpec = groupSpec.toSingleLevel());
            reverse && (groupSpec = groupSpec.reverse());
            hasKey && groupSpecKeys.push(groupSpec.key);
            null !== groupSpec.extensionComplexTypeNames && groupSpec.extensionComplexTypeNames.forEach(function(dataSetName) {
                var dataSet;
                if (null === extensionDataSetsMapProvided || !(dataSet = extensionDataSetsMapProvided[dataSetName])) throw def.error.operationInvalid("Grouping specification requires extension data set '{0}'.", [ dataSetName ]);
                null === extensionDataSetsMap && (extensionDataSetsMap = Object.create(null));
                extensionDataSetsMap[dataSetName] = dataSet;
                hasKey && (extensionDataSetsKey += dataSetName + ":" + dataSet.id + ";");
            });
            return groupSpec;
        });
        this._extensionDataSetsMap = extensionDataSetsMap;
        hasKey && (this.key = groupSpecKeys.join("!!") + ":" + [ isVisible, isNull, whereKey, extensionDataSetsKey ].join(":"));
    }).add({
        _getExtensionDatumsMap: function() {
            var extensionDatumsMap = null, extensionDataSetsMap = this._extensionDataSetsMap;
            if (extensionDataSetsMap) {
                extensionDatumsMap = Object.create(null);
                var baseExtensionDatumsMap = this._linkParent.extensionDatums;
                if (def.query(Object.keys(extensionDataSetsMap)).each(function(dataSetName) {
                    var dataSet = extensionDataSetsMap[dataSetName], datums = dataSet._datums;
                    if (0 === datums.length) return !1;
                    if (null !== baseExtensionDatumsMap) {
                        var baseDatums = baseExtensionDatumsMap[dataSetName];
                        baseDatums && (datums = baseDatums.filter(function(baseDatum) {
                            return datums.indexOf(baseDatum) >= 0;
                        }));
                    }
                    if (0 === datums.length) return !1;
                    extensionDatumsMap[dataSetName] = datums;
                })) return !1;
            }
            return extensionDatumsMap;
        },
        execute: function() {
            var datums = this._linkParent._datums, datumsQuery = def.query(datums).where(this._preFilter), rootNode = this._group(datumsQuery);
            return this._generateData(rootNode, null, this._linkParent, null);
        },
        executeAdd: function(rootData, newDatums) {
            var newDatumsQuery = def.query(newDatums).where(this._preFilter), newRootNode = this._group(newDatumsQuery);
            this._generateData(newRootNode, null, this._linkParent, rootData);
            return newRootNode.datums;
        },
        _group: function(datumsQuery) {
            var rootNode = {
                isRoot: !0,
                treeHeight: def.query(this._groupSpecs).select(function(groupSpec) {
                    return groupSpec.flatteningMode & cdo.FlatteningMode.Dfs ? 1 : groupSpec.depth;
                }).reduce(def.add, 0),
                datums: [],
                datumsById: {},
                groupSpec: this._groupSpecs[0],
                groupLevelSpec: this._groupSpecs[0].levels[0]
            }, extensionDatumsMap = this._getExtensionDatumsMap();
            !1 !== extensionDatumsMap && this._groupSpecRecursive(rootNode, def.query(datumsQuery).array(), extensionDatumsMap, 0);
            return rootNode;
        },
        _groupSpecRecursive: function(groupParentNode, groupDatums, groupExtensionDatumsMap, groupSpecIndex) {
            var groupSpec = this._groupSpecs[groupSpecIndex];
            0 != (groupSpec.flatteningMode & cdo.FlatteningMode.Dfs) ? this._groupSpecRecursiveFlattened(groupParentNode, groupDatums, groupExtensionDatumsMap, groupSpec, groupSpecIndex) : this._groupSpecRecursiveNormal(groupParentNode, groupDatums, groupExtensionDatumsMap, groupSpec, groupSpecIndex);
        },
        _groupSpecRecursiveNormal: function(groupParentNode, groupDatums, groupExtensionDatumsMap, groupSpec, groupSpecIndex) {
            function groupLevelRecursive(levelParentNode, levelDatums, levelExtensionDatumsMap, levelIndex) {
                var levelSpec = levelSpecs[levelIndex], isLastLevel = levelIndex === L - 1, isLastLevelOfLastGroupSpec = isLastGroupSpec && isLastLevel;
                levelParentNode.groupSpec = groupSpec;
                levelParentNode.groupLevelSpec = levelSpec;
                for (var childNodes = levelParentNode.children = this._groupLevelDatums(levelSpec, levelParentNode, levelDatums, levelExtensionDatumsMap, !1), i = 0, C = childNodes.length; i < C; i++) {
                    var childNode = childNodes[i];
                    if (!isLastLevelOfLastGroupSpec) {
                        var childDatums = childNode.datums;
                        childNode.datums = [];
                        childNode.datumsById = {};
                        isLastLevel ? this._groupSpecRecursive(childNode, childDatums, childNode.extensionDatumsMap, groupSpecIndex + 1) : groupLevelRecursive.call(this, childNode, childDatums, childNode.extensionDatumsMap, levelIndex + 1);
                    }
                    this._addChildDatums(levelParentNode.datums, levelParentNode.datumsById, childNode.datums, groupExtensionDatumsMap);
                }
            }
            var levelSpecs = groupSpec.levels, L = levelSpecs.length, isLastGroupSpec = groupSpecIndex === this._groupSpecs.length - 1;
            groupParentNode.isRoot && (groupParentNode.label = groupSpec.rootLabel);
            groupLevelRecursive.call(this, groupParentNode, groupDatums, groupExtensionDatumsMap, 0);
        },
        _addChildDatums: function(datums, datumsById, childDatums, groupExtensionDatumsMap) {
            if (null === groupExtensionDatumsMap) def.array.append(datums, childDatums); else for (var i = -1, L = childDatums.length; ++i < L; ) {
                var childDatum = childDatums[i];
                if (void 0 === datumsById[childDatum.id]) {
                    datumsById[childDatum.id] = childDatum;
                    datums.push(childDatum);
                }
            }
        },
        _groupSpecRecursiveFlattened: function(realGroupParentNode, groupDatums, groupExtensionDatumsMap, groupSpec, groupIndex) {
            function groupLevelRecursive(levelParentNode, levelDatums, levelExtensionDatumsMap, levelIndex) {
                for (var levelSpec = levelSpecs[levelIndex], isLastLevel = levelIndex === L - 1, isLastLevelOfLastGroupSpec = isLastGroup && isLastLevel, childNodes = this._groupLevelDatums(levelSpec, levelParentNode, levelDatums, levelExtensionDatumsMap, !0), levelParentNodeDatums = isLastGroup ? levelParentNode.datums : [], levelParentNodeDatumsById = isLastGroup ? levelParentNode.datumsById : {}, i = 0, C = childNodes.length; i < C; i++) {
                    var childNode = childNodes[i], childDatums = childNode.datums;
                    def.array.lazy(levelParentNode, "_children").push(childNode);
                    if (def.hasOwn(flatChildrenByKey, childNode.key)) this._addChildDatums(levelParentNodeDatums, levelParentNodeDatumsById, childDatums, groupExtensionDatumsMap); else {
                        var specParentChildIndex = flatChildren.length;
                        if (!isPostOrder) {
                            addFlatChildNode(childNode);
                            levelParentNode.isFlattenGroup = !0;
                        }
                        if (!isLastLevelOfLastGroupSpec) {
                            childNode.datums = [];
                            childNode.datumsById = {};
                            isLastLevel ? this._groupSpecRecursive(childNode, childDatums, levelExtensionDatumsMap, groupIndex + 1) : groupLevelRecursive.call(this, childNode, childDatums, levelExtensionDatumsMap, levelIndex + 1);
                        }
                        this._addChildDatums(levelParentNodeDatums, levelParentNodeDatumsById, childNode.datums, groupExtensionDatumsMap);
                        if (isPostOrder) {
                            if (def.hasOwn(flatChildrenByKey, childNode.key)) {
                                childNode.isFlattenGroup || def.assert("Must be a parent for duplicate keys to exist.");
                                if (1 === childNode._children.length) {
                                    flatChildren.splice(specParentChildIndex, flatChildren.length - specParentChildIndex);
                                    childNode.isDegenerateFlattenGroup = !0;
                                }
                            }
                            addFlatChildNode(childNode);
                            levelParentNode.isFlattenGroup = !0;
                        }
                    }
                }
                isLastGroup || this._groupSpecRecursive(levelParentNode, levelParentNodeDatums, levelExtensionDatumsMap, groupIndex + 1);
            }
            var isPostOrder = groupSpec.flatteningMode === cdo.FlatteningMode.DfsPost, levelSpecs = groupSpec.levels, L = levelSpecs.length, isLastGroup = groupIndex === this._groupSpecs.length - 1, flatChildren = [], flatChildrenByKey = {}, groupParentNode = {
                key: "",
                absKey: "",
                atoms: {},
                datums: [],
                datumsById: {},
                label: groupSpec.rootLabel,
                dimNames: []
            }, addFlatChildNode = function(childNode) {
                flatChildren.push(childNode);
                flatChildrenByKey[childNode.key] = childNode;
            };
            realGroupParentNode.children = flatChildren;
            realGroupParentNode.childrenByKey = flatChildrenByKey;
            isPostOrder || addFlatChildNode(groupParentNode);
            groupLevelRecursive.call(this, groupParentNode, groupDatums, groupExtensionDatumsMap, 0);
            isPostOrder && addFlatChildNode(groupParentNode);
            realGroupParentNode.datums = groupParentNode.datums;
        },
        _groupLevelDatums: function(levelSpec, levelParentNode, levelDatums, levelExtensionDatumsMap, doFlatten) {
            function groupDatum(datum, extensionDatumsMap) {
                var key = buildKey.call(levelSpec, datum, extensionDatumsMap), childNode = def.hasOwnProp.call(childNodeMap, key) && childNodeMap[key];
                if (childNode) postFilter && !postFilter(datum) || childNode.datums.push(datum); else {
                    childNode = buildGroupNode.call(levelSpec, datum, extensionDatumsMap);
                    childNode.key = key;
                    childNode.firstDatum = datum;
                    childNode.datums = !postFilter || postFilter(datum) ? [ datum ] : [];
                    childNode.extensionDatumsMap = extensionDatumsMap;
                    if (doFlatten) {
                        null === keySep && (keySep = datum.owner.keySep);
                        this._onNewChildNodeFlattened(key, keySep, childNode, levelSpec, levelParentNode);
                    }
                    def.array.insert(childNodeList, childNode, nodeComparer);
                    childNodeMap[key] = childNode;
                }
            }
            function groupDatumExtended(datum, extensionDatumsMaps) {
                for (var i = -1, L = extensionDatumsMaps.length; ++i < L; ) groupDatum.call(this, datum, extensionDatumsMaps[i]);
            }
            function crossJoinExtensionDatumsRecursive(outputMaps, extDimIndex, extensionDatumsMap) {
                for (var extDimension = extensionDimensions[extDimIndex], extDataSetName = extDimension.dataSetName, extDatums = levelExtensionDatumsMap[extDataSetName], i = -1, L = extDatums.length, nextExtDimIndex = extDimIndex + 1, isLastExtDim = nextExtDimIndex >= extensionDimensions.length; ++i < L; ) {
                    var childExtensionDatumsMap = Object.create(extensionDatumsMap);
                    childExtensionDatumsMap[extDataSetName] = [ extDatums[i] ];
                    isLastExtDim ? outputMaps.push(childExtensionDatumsMap) : crossJoinExtensionDatumsRecursive(outputMaps, nextExtDimIndex, childExtensionDatumsMap);
                }
            }
            var buildKey, buildGroupNode, nodeComparer, childNodeList = [], childNodeMap = Object.create(null), postFilter = this._postFilter, keySep = null, j = -1, D = levelDatums.length, extensionDimensions = levelSpec.extensionDimensions;
            if (null !== extensionDimensions) {
                buildKey = levelSpec.buildKeyWithExtension;
                buildGroupNode = levelSpec.buildGroupNodeWithExtension;
                nodeComparer = levelSpec.compareNodesWithExtension.bind(levelSpec);
                var crossJoinExtensionDatumsMaps = [];
                crossJoinExtensionDatumsRecursive(crossJoinExtensionDatumsMaps, 0, levelExtensionDatumsMap);
                for (;++j < D; ) groupDatumExtended.call(this, levelDatums[j], crossJoinExtensionDatumsMaps);
            } else {
                buildKey = levelSpec.buildKeyMain;
                buildGroupNode = levelSpec.buildGroupNodeMain;
                nodeComparer = levelSpec.compareNodesMain.bind(levelSpec);
                for (;++j < D; ) groupDatum.call(this, levelDatums[j], levelExtensionDatumsMap);
            }
            if (postFilter) {
                j = childNodeList.length;
                for (;j--; ) 0 === childNodeList[j].datums.length && childNodeList.splice(j, 1);
            }
            return childNodeList;
        },
        _onNewChildNodeFlattened: function(key, keySep, childNode, level, levelParentNode) {
            def.copy(childNode.atoms, levelParentNode.atoms);
            childNode.dimNames = level.accAllDimensionNames();
            if (levelParentNode.dimNames.length) {
                var absKey = levelParentNode.absKey + keySep + key;
                childNode.absKey = absKey;
                childNode.key = cdo.Complex.rightTrimKeySep(absKey, keySep);
            } else childNode.absKey = key;
        },
        _generateData: function(node, parentNode, parentData, rootData) {
            var data = null, isNew = !1;
            if (node.isRoot) if (null !== rootData) {
                data = rootData;
                data._addDatumsLocal(node.datums);
            } else {
                isNew = !0;
                data = new cdo.GroupingRootData({
                    groupingOper: this,
                    groupingSpec: node.groupSpec,
                    groupingLevelSpec: node.groupLevelSpec,
                    linkParent: parentData,
                    datums: node.datums,
                    extensionDatums: node.extensionDatumsMap
                });
                data.treeHeight = node.treeHeight;
            } else {
                if (null !== rootData) {
                    data = parentData.child(node.key);
                    null !== data && data._addDatumsSimple(node.datums);
                }
                if (null === data) {
                    isNew = !0;
                    var siblings, index = null;
                    null !== rootData && (siblings = parentData.childNodes).length > 0 && (index = ~def.array.binarySearch(siblings, node.datums[0], parentNode.groupLevelSpec.mainDatumComparer));
                    data = new cdo.GroupData({
                        groupingOper: this,
                        groupingSpec: node.groupSpec,
                        groupingLevelSpec: node.groupLevelSpec,
                        parent: parentData,
                        atoms: node.atoms,
                        datums: node.datums,
                        index: index,
                        atomsDimNames: node.dimNames,
                        extensionDatums: node.extensionDatumsMap
                    });
                }
            }
            if (isNew) {
                if (node.isFlattenGroup) {
                    data._isFlattenGroup = !0;
                    data._isDegenerateFlattenGroup = !!node.isDegenerateFlattenGroup;
                }
                var label = node.label;
                if (label) {
                    data.label += label;
                    data.absLabel += label;
                }
            }
            var childNodes = node.children, L = childNodes ? childNodes.length : 0;
            if (L > 0) for (var i = -1; ++i < L; ) this._generateData(childNodes[i], node, data, rootData); else if (isNew && !node.isRoot) {
                var leafs = data.root._leafs;
                data.leafIndex = leafs.length;
                leafs.push(data);
            }
            return data;
        }
    });
    def.space("cdo").FlatteningMode = def.makeEnum([ "SingleLevel", "DfsPre", "DfsPost" ], {
        zero: "None",
        all: "AllMask"
    });
    cdo.FlatteningMode.Dfs = cdo.FlatteningMode.DfsPre | cdo.FlatteningMode.DfsPost;
    def.type("cdo.GroupingSpec").init(function(levelSpecs, complexType, extensionComplexTypesMap, ka) {
        this.complexType = complexType || null;
        complexType = this.complexType;
        var referencedExtensionComplexTypeNamesMap = null, levelKeys = [], mainDimNames = [], allDimNames = [], isDiscrete = !1, singleContinuousValueType = null;
        this.levels = def.query(levelSpecs || void 0).where(function(levelSpec) {
            return levelSpec.allDimensions.length > 0;
        }).select(function(levelSpec) {
            levelKeys.push(levelSpec.key);
            mainDimNames.push.apply(mainDimNames, levelSpec.dimensionNames());
            levelSpec.allDimensions.forEach(function(dimSpec) {
                if (dimSpec.dataSetName) {
                    null === referencedExtensionComplexTypeNamesMap && (referencedExtensionComplexTypeNamesMap = Object.create(null));
                    referencedExtensionComplexTypeNamesMap[dimSpec.dataSetName] = !0;
                    allDimNames.push(dimSpec.fullName);
                } else allDimNames.push(dimSpec.name);
                if (null !== complexType && !isDiscrete) {
                    var dimType = dimSpec.dimensionType;
                    dimType.isDiscrete ? isDiscrete = !0 : null === singleContinuousValueType ? singleContinuousValueType = dimType.valueType : singleContinuousValueType !== dimType.valueType && (isDiscrete = !0);
                }
            });
            levelSpec._setAccAllDimNames(allDimNames.slice(0));
            return levelSpec;
        }).array();
        this.extensionComplexTypesMap = null;
        this.extensionComplexTypeNames = referencedExtensionComplexTypeNamesMap && Object.keys(referencedExtensionComplexTypeNamesMap);
        null !== complexType && referencedExtensionComplexTypeNamesMap && this._setExtensionComplexTypesMap(extensionComplexTypesMap);
        this._dimNames = mainDimNames;
        this._allDimNames = allDimNames;
        this.depth = this.levels.length;
        this._isDiscrete = null !== complexType ? isDiscrete : void 0;
        this._singleContinuousValueType = null !== complexType ? isDiscrete ? null : singleContinuousValueType : void 0;
        this.isSingleDimension = 1 === allDimNames.length;
        this.firstDimension = this.depth > 0 ? this.levels[0].allDimensions[0] : null;
        this.lastDimension = this.depth > 0 ? this.levels[this.depth - 1].lastDimension() : null;
        this.rootLabel = def.get(ka, "rootLabel") || "";
        this.flatteningMode = def.get(ka, "flatteningMode") || cdo.FlatteningMode.None;
        this._cacheKey = this._calcCacheKey();
        this.key = this._cacheKey + "##" + levelKeys.join("||");
    }).add({
        _calcCacheKey: function(ka) {
            return [ def.get(ka, "flatteningMode") || this.flatteningMode, def.get(ka, "rootLabel") || this.rootLabel ].join("#");
        },
        bind: function(complexType, extensionComplexTypesMap) {
            this.complexType = complexType || def.fail.argumentRequired("complexType");
            this._setExtensionComplexTypesMap(extensionComplexTypesMap);
            extensionComplexTypesMap = this.extensionComplexTypesMap;
            var isDiscrete = !1, singleContinuousValueType = null;
            this.levels.forEach(function(levelSpec) {
                levelSpec.bind(complexType, extensionComplexTypesMap);
                if (!isDiscrete) for (var allDimSpecs = levelSpec.allDimensions, i = -1, L = allDimSpecs.length; ++i < L; ) {
                    var dimType = allDimSpecs[i].dimensionType;
                    if (dimType.isDiscrete) {
                        isDiscrete = !0;
                        break;
                    }
                    if (null === singleContinuousValueType) singleContinuousValueType = dimType.valueType; else if (singleContinuousValueType !== dimType.valueType) {
                        isDiscrete = !0;
                        break;
                    }
                }
            });
            this._isDiscrete = isDiscrete;
            this._singleContinuousValueType = isDiscrete ? null : singleContinuousValueType;
        },
        get isBound() {
            return !!this.complexType;
        },
        _setExtensionComplexTypesMap: function(extensionComplexTypesMap) {
            if (this.hasExtensionComplexTypes) {
                if (!extensionComplexTypesMap) {
                    var error = def.error.operationInvalid("Expects a map of extension types.");
                    error.code = "need-extension-map";
                    throw error;
                }
                this.extensionComplexTypesMap = def.copyProps(extensionComplexTypesMap, this.extensionComplexTypeNames);
            } else this.extensionComplexTypesMap = null;
        },
        get isNull() {
            return 0 === this.depth;
        },
        get isSingleLevel() {
            return 1 === this.depth;
        },
        get hasExtensionComplexTypes() {
            return !!this.extensionComplexTypeNames;
        },
        isDiscrete: function() {
            return this._isDiscrete;
        },
        get singleContinuousValueType() {
            return this._singleContinuousValueType;
        },
        get singleDimensionName() {
            if (this.isSingleDimension) return this.firstDimension.name;
            throw def.error.operationInvalid("Expected grouping to contain exactly one dimension.");
        },
        get singleDimensionType() {
            if (this.isSingleDimension) return this.firstDimension.dimensionType;
            throw def.error.operationInvalid("Grouping contains more than one dimension.");
        },
        dimensions: function() {
            return def.query(this.levels).prop("dimensions").selectMany();
        },
        allDimensions: function() {
            return def.query(this.levels).prop("allDimensions").selectMany();
        },
        extensionDimensions: function() {
            return def.query(this.levels).prop("extensionDimensions").selectMany();
        },
        dimensionNames: function() {
            return this._dimNames;
        },
        get allDimensionNames() {
            return this._allDimNames;
        },
        firstDimensionType: function() {
            var d = this.firstDimension;
            return d && d.dimensionType;
        },
        firstDimensionName: function() {
            var dt = this.firstDimensionType();
            return dt && dt.name;
        },
        firstDimensionValueType: function() {
            var dt = this.firstDimensionType();
            return dt && dt.valueType;
        },
        lastDimensionType: function() {
            var d = this.lastDimension;
            return d && d.dimensionType;
        },
        lastDimensionName: function() {
            var dt = this.lastDimensionType();
            return dt && dt.name;
        },
        lastDimensionValueType: function() {
            var dt = this.lastDimensionType();
            return dt && dt.valueType;
        },
        ensure: function(ka) {
            var result;
            if (ka) {
                var cacheKey = this._calcCacheKey(ka);
                if (cacheKey !== this._cacheKey) {
                    var cache = def.lazy(this, "_groupingCache");
                    result = def.getOwn(cache, cacheKey);
                    result || (result = cache[cacheKey] = this._ensure(ka));
                }
            }
            return result || this;
        },
        _ensure: function(ka) {
            return new cdo.GroupingSpec(this.levels, this.complexType, this.extensionComplexTypesMap, {
                flatteningMode: def.get(ka, "flatteningMode") || this.flatteningMode,
                rootLabel: def.get(ka, "rootLabel") || this.rootLabel
            });
        },
        toSingleLevel: function() {
            if (this.isSingleLevel) return this;
            var allDimSpecs = this.allDimensions().array(), singleLevelSpec = new cdo.GroupingLevelSpec(allDimSpecs, this.complexType, this.extensionComplexTypesMap);
            return new cdo.GroupingSpec([ singleLevelSpec ], this.complexType, this.extensionComplexTypesMap, {
                flatteningMode: cdo.FlatteningMode.SingleLevel,
                rootLabel: this.rootLabel
            });
        },
        reverse: function() {
            var reversedLevelSpecs = this.levels.map(function(levelSpec) {
                return levelSpec.reverse();
            });
            return new cdo.GroupingSpec(reversedLevelSpecs, this.complexType, this.extensionComplexTypesMap, {
                flatteningMode: this.flatteningMode,
                rootLabel: this.rootLabel
            });
        },
        view: function(complex) {
            var dimNames = complex instanceof cdo.Datum ? this.dimensionNames() : this.allDimensionNames;
            return complex.view(dimNames);
        },
        toString: function() {
            return this.levels.map(String).join(", ");
        }
    });
    def.type("cdo.GroupingLevelSpec").init(function(allDimSpecs) {
        var allDimKeys = [], allDimNames = [], dimNames = [], dimensions = [], extDimensions = null;
        this.dimensions = dimensions;
        this.allDimensions = def.query(allDimSpecs).select(function(dimSpec) {
            allDimKeys.push(dimSpec.key);
            if (dimSpec.dataSetName) {
                allDimNames.push(dimSpec.fullName);
                null === extDimensions && (extDimensions = []);
                extDimensions.push(dimSpec);
            } else {
                allDimNames.push(dimSpec.name);
                dimNames.push(dimSpec.name);
                dimensions.push(dimSpec);
            }
            return dimSpec;
        }).array();
        this.extensionDimensions = extDimensions;
        this._dimNames = dimNames;
        this._allDimNames = allDimNames;
        this._accDimNames = null;
        this.depth = this.allDimensions.length;
        this.key = allDimKeys.join(",");
    }).add({
        _setAccAllDimNames: function(accDimNames) {
            this._accDimNames = accDimNames;
        },
        accAllDimensionNames: function() {
            return this._accDimNames;
        },
        dimensionNames: function() {
            return this._dimNames;
        },
        get allDimensionNames() {
            return this._allDimNames;
        },
        lastDimension: function() {
            return this.allDimensions[this.depth - 1];
        },
        bind: function(complexType, extensionComplexTypesMap) {
            this.allDimensions.forEach(function(dimSpec) {
                dimSpec.bindComplexType(complexType, extensionComplexTypesMap);
            });
        },
        compareNodesMain: function(nodeA, nodeB) {
            for (var result, dims = this.dimensions, D = dims.length, i = -1; ++i < D; ) if (0 !== (result = dims[i].compareDatums(nodeA.firstDatum, nodeB.firstDatum))) return result;
            return 0;
        },
        compareNodesWithExtension: function(nodeA, nodeB) {
            for (var result, dimSpec, dataSetName, datumA, datumB, allDimensions = this.allDimensions, D = allDimensions.length, i = -1; ++i < D; ) {
                if (null !== (dataSetName = (dimSpec = allDimensions[i]).dataSetName)) {
                    datumA = nodeA.extensionDatumsMap[dataSetName][0];
                    datumB = nodeB.extensionDatumsMap[dataSetName][0];
                } else {
                    datumA = nodeA.firstDatum;
                    datumB = nodeB.firstDatum;
                }
                if (0 !== (result = dimSpec.compareDatums(datumA, datumB))) return result;
            }
            return 0;
        },
        buildKeyMain: function(datum) {
            return cdo.Complex.compositeKey(datum, this._dimNames);
        },
        buildKeyWithExtension: function(datum, extensionDatumsMap) {
            for (var dimSpec, key = "", allDimensions = this.allDimensions, D = allDimensions.length, i = -1, keySep = datum.owner.keySep, datoms = datum.atoms; ++i < D; ) {
                var atomKey = null !== (dimSpec = allDimensions[i]).dataSetName ? extensionDatumsMap[dimSpec.dataSetName][0].atoms[dimSpec.name].key : datoms[dimSpec.name].key;
                i ? key += keySep + atomKey : key = atomKey;
            }
            return key;
        },
        buildGroupNodeMain: function(datum) {
            var dimNames = this._dimNames;
            return {
                atoms: def.copyProps(datum.atoms, dimNames),
                dimNames: dimNames
            };
        },
        buildGroupNodeWithExtension: function(datum, extensionDatumsMap) {
            for (var dimSpec, atoms = {}, allDimensions = this.allDimensions, D = allDimensions.length, datoms = datum.atoms, i = -1; ++i < D; ) null !== (dimSpec = allDimensions[i]).dataSetName ? atoms[dimSpec.fullName] = extensionDatumsMap[dimSpec.dataSetName][0].atoms[dimSpec.name] : atoms[dimSpec.name] = datoms[dimSpec.name];
            return {
                atoms: atoms,
                dimNames: this._allDimNames
            };
        },
        reverse: function() {
            var reversedDimSpecs = this.allDimensions.map(function(dimSpec) {
                return dimSpec.reverse();
            });
            return new cdo.GroupingLevelSpec(reversedDimSpecs, this.complexType, this.extensionComplexTypesMap);
        },
        toString: function() {
            return def.query(this.allDimensions).select(String).array().join("|");
        }
    });
    def.type("cdo.GroupingDimensionSpec").init(function(fullName, isReversed, dimensionType) {
        this.fullName = fullName;
        var m = /^(?:(.+?)\.)?(.+)$/.exec(fullName);
        this.dataSetName = m && m[1] || null;
        this.name = m ? m[2] : fullName;
        this.isReversed = !!isReversed;
        this.key = fullName + ":" + (isReversed ? "0" : "1");
        this.dimensionType = null;
        dimensionType && this.bind(dimensionType);
    }).add({
        bindComplexType: function(complexType, extensionComplexTypesMap) {
            complexType || def.fail.argumentRequired("complexType");
            var dimComplexType;
            if (null !== this.dataSetName) {
                var extensionComplexType = def.get(extensionComplexTypesMap, this.dataSetName);
                if (!extensionComplexType) throw def.error.operationInvalid("The data set name '{0}' of dimension '{1}' is not defined.", [ this.dataSetName, this.fullName ]);
                dimComplexType = extensionComplexType;
            } else dimComplexType = complexType;
            this.bind(dimComplexType.dimensions(this.name));
            return this;
        },
        bind: function(dimensionType) {
            this.dimensionType = dimensionType || def.fail.argumentRequired("dimensionType");
            if (dimensionType.isComparable) {
                var mainAtomComparer = dimensionType.atomComparer(this.isReversed), dimName = this.name;
                this.compareDatums = function(datumA, datumB) {
                    return mainAtomComparer(datumA.atoms[dimName], datumB.atoms[dimName]);
                };
            } else this.isReversed ? this.compareDatums = function(datumA, datumB) {
                return datumB.id - datumA.id;
            } : this.compareDatums = function(datumA, datumB) {
                return datumA.id - datumB.id;
            };
            return this;
        },
        compareDatums: function(datumA, datumB) {
            throw def.error.operationInvalid("Not Bound.");
        },
        reverse: function() {
            return new cdo.GroupingDimensionSpec(this.fullName, !this.isReversed, this.dimensionType);
        },
        toString: function() {
            return this.fullName + (this.dimensionType ? ' ("' + this.dimensionType.label + '")' : "") + (this.isReversed ? " desc" : "");
        }
    });
    cdo.GroupingSpec.parse = function(specText, complexType, extensionComplexTypesMap) {
        var levelSpecs = null;
        if (specText) {
            var levels = def.string.is(specText) ? specText.split(/\s*,\s*/) : def.array.as(specText);
            levelSpecs = def.query(levels).select(function(levelText) {
                var dimSpecs = groupSpec_parseGroupingLevel(levelText, complexType, extensionComplexTypesMap);
                return new cdo.GroupingLevelSpec(dimSpecs, complexType, extensionComplexTypesMap);
            });
        }
        return new cdo.GroupingSpec(levelSpecs, complexType, extensionComplexTypesMap);
    };
    var groupSpec_matchDimSpec = /^\s*(.+?)(?:\s+(asc|desc))?\s*$/i;
    def.type("cdo.LinearInterpolationOper").init(function(baseData, partData, visibleData, catRole, serRole, valRole, valDimName, stretchEnds) {
        this._newDatums = [];
        this._data = visibleData;
        var qAllCatDatas = catRole.flatten(baseData).children();
        this._isCatDiscrete = catRole.grouping.isDiscrete();
        this._isCatDiscrete || (qAllCatDatas = qAllCatDatas.where(function(catData) {
            return null !== catData.value;
        }));
        var serDatas1 = serRole.isBound() ? serRole.flatten(partData, {
            visible: !0,
            isNull: !1
        }).children().array() : [ null ], valDim = this._valDim = baseData.owner.dimensions(valDimName), visibleKeyArgs = {
            visible: !0,
            zeroIfNone: !1
        };
        this._stretchEnds = stretchEnds;
        this._catInfos = qAllCatDatas.select(function(allCatData, catIndex) {
            var catData = visibleData.child(allCatData.key), catInfo = {
                data: catData || allCatData,
                value: allCatData.value,
                isInterpolated: !1,
                serInfos: null,
                index: catIndex
            };
            catInfo.serInfos = [];
            serDatas1.forEach(function(serData1) {
                var group = catData;
                group && serData1 && (group = group.child(serData1.key));
                var valBoundDimName = valRole.getBoundDimensionName(group || serData1, !0);
                if (null === valBoundDimName || valBoundDimName === valDimName) {
                    var value = group ? group.dimensions(valDim.name).value(visibleKeyArgs) : null;
                    catInfo.serInfos.push({
                        data: serData1,
                        group: group,
                        value: value,
                        isNull: null == value,
                        catInfo: catInfo
                    });
                }
            });
            return catInfo;
        }).array();
        this._serCount = serDatas1.length;
        this._serStates = def.range(0, this._serCount).select(function(serIndex) {
            return new cdo.LinearInterpolationOperSeriesState(this, serIndex);
        }, this).array();
    }).add({
        interpolate: function() {
            for (var catInfo; catInfo = this._catInfos.shift(); ) catInfo.serInfos.forEach(this._visitSeries, this);
            var newDatums = this._newDatums;
            newDatums.length && this._data.owner.add(newDatums);
        },
        _visitSeries: function(catSerInfo, serIndex) {
            this._serStates[serIndex].visit(catSerInfo);
        },
        nextUnprocessedNonNullCategOfSeries: function(serIndex) {
            for (var catIndex = 0, catCount = this._catInfos.length; catIndex < catCount; ) {
                var catInfo = this._catInfos[catIndex++], catSerInfo = catInfo.serInfos[serIndex];
                if (!catSerInfo.isNull) return catSerInfo;
            }
        }
    });
    def.type("cdo.LinearInterpolationOperSeriesState").init(function(interpolation, serIndex) {
        this.interpolation = interpolation;
        this.index = serIndex;
        this._lastNonNull(null);
    }).add({
        visit: function(catSeriesInfo) {
            catSeriesInfo.isNull ? this._interpolate(catSeriesInfo) : this._lastNonNull(catSeriesInfo);
        },
        _lastNonNull: function(catSerInfo) {
            if (arguments.length) {
                this.__lastNonNull = catSerInfo;
                this.__nextNonNull = void 0;
            }
            return this.__lastNonNull;
        },
        _nextNonNull: function() {
            return this.__nextNonNull;
        },
        _initInterpData: function() {
            if (void 0 === this.__nextNonNull) {
                var last = this.__lastNonNull, next = this.__nextNonNull = this.interpolation.nextUnprocessedNonNullCategOfSeries(this.index) || null;
                if (next && last) {
                    var fromValue = last.value, toValue = next.value, deltaValue = toValue - fromValue;
                    if (this.interpolation._isCatDiscrete) {
                        var stepCount = next.catInfo.index - last.catInfo.index;
                        stepCount >= 2 || def.assert("Must have at least one interpolation point.");
                        this._stepValue = deltaValue / stepCount;
                        this._middleIndex = ~~(stepCount / 2);
                        var dotCount = stepCount - 1;
                        this._isOdd = dotCount % 2 > 0;
                    } else {
                        var fromCat = +last.catInfo.value, toCat = +next.catInfo.value, deltaCat = toCat - fromCat;
                        this._steep = deltaValue / deltaCat;
                        this._middleCat = (toCat + fromCat) / 2;
                    }
                }
            }
        },
        _interpolate: function(catSerInfo) {
            this._initInterpData();
            var next = this.__nextNonNull, prev = this.__lastNonNull, one = next || prev;
            if (one) {
                var value, group, interpolation = this.interpolation, catInfo = catSerInfo.catInfo;
                if (next && prev) if (interpolation._isCatDiscrete) {
                    var groupIndex = catInfo.index - prev.catInfo.index;
                    value = prev.value + this._stepValue * groupIndex;
                    group = (this._isOdd ? groupIndex < this._middleIndex : groupIndex <= this._middleIndex) ? prev.group : next.group;
                } else {
                    var cat = +catInfo.value, lastCat = +prev.catInfo.value;
                    value = prev.value + this._steep * (cat - lastCat);
                    group = cat < this._middleCat ? prev.group : next.group;
                } else {
                    if (!interpolation._stretchEnds) return;
                    value = one.value;
                    group = one.group;
                }
                var atoms = Object.create(group.atoms);
                def.copyOwn(atoms, catInfo.data.atoms);
                var valDim = interpolation._valDim, valueAtom = valDim.intern(value, !0);
                atoms[valDim.name] = valueAtom;
                var dimNames = interpolation._datumDimNames;
                dimNames || (interpolation._datumDimNames = dimNames = group.type.filterExtensionDimensionNames(def.keys(atoms)));
                interpolation._newDatums.push(new cdo.InterpolationDatum(group.owner, atoms, dimNames, "linear", valDim.name));
            }
        }
    });
    def.type("cdo.ZeroInterpolationOper").init(function(baseData, partData, visibleData, catRole, serRole, valRole, valDimName, stretchEnds) {
        this._newDatums = [];
        this._data = visibleData;
        var qAllCatDatas = catRole.flatten(baseData).children();
        this._isCatDiscrete = catRole.grouping.isDiscrete();
        this._isCatDiscrete || (qAllCatDatas = qAllCatDatas.where(function(catData) {
            return null !== catData.value;
        }));
        var serDatas1 = serRole.isBound() ? serRole.flatten(partData, {
            visible: !0,
            isNull: !1
        }).children().array() : [ null ], valDim = this._valDim = baseData.owner.dimensions(valDimName), visibleKeyArgs = {
            visible: !0,
            zeroIfNone: !1
        };
        this._stretchEnds = stretchEnds;
        this._catInfos = qAllCatDatas.select(function(allCatData, catIndex) {
            var catData = visibleData.child(allCatData.key), catInfo = {
                data: catData || allCatData,
                value: allCatData.value,
                isInterpolated: !1,
                serInfos: null,
                index: catIndex
            };
            catInfo.serInfos = [];
            serDatas1.forEach(function(serData1) {
                var group = catData;
                group && serData1 && (group = group.child(serData1.key));
                var valBoundDimName = valRole.getBoundDimensionName(group || serData1, !0);
                if (null === valBoundDimName || valBoundDimName === valDimName) {
                    var value = group ? group.dimensions(valDim.name).value(visibleKeyArgs) : null;
                    catInfo.serInfos.push({
                        data: serData1,
                        group: group,
                        value: value,
                        isNull: null == value,
                        catInfo: catInfo
                    });
                }
            });
            return catInfo;
        }).array();
        this._serCount = serDatas1.length;
        this._serStates = def.range(0, this._serCount).select(function(serIndex) {
            return new cdo.ZeroInterpolationOperSeriesState(this, serIndex);
        }, this).array();
    }).add({
        interpolate: function() {
            for (var catInfo; catInfo = this._catInfos.shift(); ) catInfo.serInfos.forEach(this._visitSeries, this);
            var newDatums = this._newDatums;
            newDatums.length && this._data.owner.add(newDatums);
        },
        _visitSeries: function(catSerInfo, serIndex) {
            this._serStates[serIndex].visit(catSerInfo);
        },
        nextUnprocessedNonNullCategOfSeries: function(serIndex) {
            for (var catIndex = 0, catCount = this._catInfos.length; catIndex < catCount; ) {
                var catInfo = this._catInfos[catIndex++], catSerInfo = catInfo.serInfos[serIndex];
                if (!catSerInfo.isNull) return catSerInfo;
            }
        }
    });
    def.type("cdo.ZeroInterpolationOperSeriesState").init(function(interpolation, serIndex) {
        this.interpolation = interpolation;
        this.index = serIndex;
        this._lastNonNull(null);
    }).add({
        visit: function(catSeriesInfo) {
            catSeriesInfo.isNull ? this._interpolate(catSeriesInfo) : this._lastNonNull(catSeriesInfo);
        },
        _lastNonNull: function(catSerInfo) {
            if (arguments.length) {
                this.__lastNonNull = catSerInfo;
                this.__nextNonNull = void 0;
            }
            return this.__lastNonNull;
        },
        _nextNonNull: function() {
            return this.__nextNonNull;
        },
        _initInterpData: function() {
            if (void 0 === this.__nextNonNull) {
                var last = this.__lastNonNull, next = this.__nextNonNull = this.interpolation.nextUnprocessedNonNullCategOfSeries(this.index) || null;
                if (next && last) if (this.interpolation._isCatDiscrete) {
                    var stepCount = next.catInfo.index - last.catInfo.index;
                    stepCount >= 2 || def.assert("Must have at least one interpolation point.");
                    this._middleIndex = ~~(stepCount / 2);
                    var dotCount = stepCount - 1;
                    this._isOdd = dotCount % 2 > 0;
                } else {
                    var fromCat = +last.catInfo.value, toCat = +next.catInfo.value;
                    this._middleCat = (toCat + fromCat) / 2;
                }
            }
        },
        _interpolate: function(catSerInfo) {
            this._initInterpData();
            var next = this.__nextNonNull, last = this.__lastNonNull, one = next || last;
            if (one) {
                var group, interpolation = this.interpolation, catInfo = catSerInfo.catInfo;
                if (next && last) if (interpolation._isCatDiscrete) {
                    var groupIndex = catInfo.index - last.catInfo.index;
                    group = this._isOdd ? groupIndex < this._middleIndex ? last.group : next.group : groupIndex <= this._middleIndex ? last.group : next.group;
                } else {
                    var cat = +catInfo.value;
                    group = cat < this._middleCat ? last.group : next.group;
                } else {
                    if (!interpolation._stretchEnds) return;
                    group = one.group;
                }
                var atoms = Object.create(group.atoms);
                def.copyOwn(atoms, catInfo.data.atoms);
                var valDim = interpolation._valDim, zeroAtom = interpolation._zeroAtom || (interpolation._zeroAtom = valDim.intern(0, !0));
                atoms[valDim.name] = zeroAtom;
                var dimNames = interpolation._datumDimNames;
                dimNames || (interpolation._datumDimNames = dimNames = group.type.filterExtensionDimensionNames(def.keys(atoms)));
                interpolation._newDatums.push(new cdo.InterpolationDatum(group.owner, atoms, dimNames, "zero", valDim.name));
            }
        }
    });
    def.type("cdo.TranslationOper").init(function(complexTypeProj, source, metadata, options) {
        this.complexTypeProj = complexTypeProj || def.fail.argumentRequired("complexTypeProj");
        this.source = source || def.fail.argumentRequired("source");
        this.metadata = metadata || def.fail.argumentRequired("metadata");
        this.options = options || {};
        this._initType();
        if (def.debug >= 4) {
            this._logLogicalRows = !0;
            this._logLogicalRowCount = 0;
        }
    }).add({
        _logLogicalRows: !1,
        logSource: def.abstractMethod,
        logLogicalRow: def.abstractMethod,
        _translType: "Unknown",
        logTranslatorType: function() {
            return this._translType + " data source translator";
        },
        logicalColumnCount: function() {
            return this.metadata.length;
        },
        setSource: function(source) {
            if (!source) throw def.error.argumentRequired("source");
            this.source = source;
        },
        defReader: function(dimReaderSpec) {
            dimReaderSpec || def.fail.argumentRequired("readerSpec");
            var dimNames = def.string.is(dimReaderSpec) ? dimReaderSpec : dimReaderSpec.names;
            dimNames = def.string.is(dimNames) ? dimNames.split(/\s*\,\s*/) : def.array.as(dimNames);
            var indexes = def.array.as(dimReaderSpec.indexes);
            indexes && indexes.forEach(this._userUseIndex, this);
            var hasDims = !(!dimNames || !dimNames.length), reader = dimReaderSpec.reader;
            if (reader) {
                hasDims || def.fail.argumentRequired("reader.names", "Required argument when a reader function is specified.");
                this._userRead(reader, dimNames);
            } else {
                if (hasDims) return this._userCreateReaders(dimNames, indexes);
                indexes && indexes.forEach(function(index) {
                    this._userIndexesToSingleDim[index] = null;
                }, this);
            }
            return indexes;
        },
        configureType: function() {
            this._configureTypeCore();
        },
        _configureTypeCore: def.abstractMethod,
        _initType: function() {
            this._userDimsReaders = [];
            this._userDimsReadersByDim = {};
            this._userUsedIndexes = {};
            this._userIndexesToSingleDim = [];
            var userDimReaders = this.options.readers;
            userDimReaders && def.array.each(userDimReaders, this.defReader, this);
            var multiChartIndexes = def.parseDistinctIndexArray(this.options.multiChartIndexes);
            multiChartIndexes && (this._multiChartIndexes = this.defReader({
                names: "multiChart",
                indexes: multiChartIndexes
            }));
        },
        _userUseIndex: function(index) {
            index = +index;
            if (index < 0) throw def.error.argumentInvalid("index", "Invalid reader index: '{0}'.", [ index ]);
            if (def.hasOwn(this._userUsedIndexes, index)) throw def.error.argumentInvalid("index", "Column '{0}' of the logical table is already assigned.", [ index ]);
            this._userUsedIndexes[index] = !0;
            return index;
        },
        _userCreateReaders: function(dimNames, indexes) {
            indexes ? indexes.forEach(function(index, j) {
                indexes[j] = +index;
            }) : indexes = [];
            var dimName, I = indexes.length, N = dimNames.length;
            if (N > I) {
                var nextIndex = I > 0 ? indexes[I - 1] + 1 : 0;
                do {
                    nextIndex = this._getNextFreeLogicalColumnIndex(nextIndex);
                    indexes[I] = nextIndex;
                    this._userUseIndex(nextIndex);
                    I++;
                } while (N > I);
            }
            for (var index, L = I === N ? N : N - 1, n = 0; n < L; n++) {
                dimName = dimNames[n];
                index = indexes[n];
                this._userIndexesToSingleDim[index] = dimName;
                this._userRead(this._propGet(dimName, index), dimName);
            }
            if (L < N) for (var splitGroupName = def.splitIndexedId(dimNames[N - 1]), groupName = splitGroupName[0], level = def.nullyTo(splitGroupName[1], 0), i = L; i < I; i++, 
            level++) {
                dimName = def.indexedId(groupName, level);
                index = indexes[i];
                this._userIndexesToSingleDim[index] = dimName;
                this._userRead(this._propGet(dimName, index), dimName);
            }
            return indexes;
        },
        _userRead: function(reader, dimNames) {
            def.fun.is(reader) || def.fail.argumentInvalid("reader", "Reader must be a function.");
            def.array.is(dimNames) ? dimNames.forEach(function(name) {
                this._readDim(name, reader);
            }, this) : this._readDim(dimNames, reader);
            this._userDimsReaders.push(reader);
        },
        _readDim: function(name, reader) {
            var info, spec, index = this._userIndexesToSingleDim.indexOf(name);
            if (index >= 0) {
                info = this._logicalRowInfos[index];
                if (info && !this.options.ignoreMetadataLabels) {
                    var label = info.label || info.name && def.titleFromName(info.name);
                    label && (spec = {
                        label: label
                    });
                }
            }
            this.complexTypeProj.readDim(name, spec);
            this._userDimsReadersByDim[name] = reader;
        },
        execute: function(data) {
            this.data = data;
            return this._executeCore();
        },
        _executeCore: function() {
            var dimsReaders = this._getDimensionsReaders();
            return def.query(this._getLogicalRows()).select(function(row) {
                return this._readLogicalRow(row, dimsReaders);
            }, this);
        },
        _getLogicalRows: function() {
            return this.source;
        },
        _getDimensionsReaders: function() {
            return this._userDimsReaders.slice().reverse();
        },
        _readLogicalRow: function(logicalRow, dimsReaders) {
            for (var doLog = this._logLogicalRows && this._logLogicalRowBefore(logicalRow), r = dimsReaders.length, data = this.data, atoms = {}; r--; ) dimsReaders[r].call(data, logicalRow, atoms);
            doLog && this._logLogicalRowAfter(atoms);
            return atoms;
        },
        _logLogicalRowBefore: function(logicalRow) {
            if (this._logLogicalRowCount < 10) return def.log("logical row [" + this._logLogicalRowCount++ + "]: " + def.describe(logicalRow)), 
            !0;
            def.log("...");
            return this._logLogicalRows = !1;
        },
        _logLogicalRowAfter: function(readAtoms) {
            var logAtoms = {};
            for (var dimName in readAtoms) {
                var atom = readAtoms[dimName];
                def.object.is(atom) && (atom = "v" in atom ? atom.v : "value" in atom ? atom.value : "...");
                logAtoms[dimName] = atom;
            }
            def.log("-> read: " + def.describe(logAtoms));
        },
        _propGet: function(dimName, prop) {
            function propGet(logicalRow, atoms) {
                atoms[dimName] = logicalRow[prop];
            }
            return propGet;
        },
        _getNextFreeLogicalColumnIndex: function(index, L) {
            null == index && (index = 0);
            null == L && (L = 1 / 0);
            for (;index < L && def.hasOwn(this._userUsedIndexes, index); ) index++;
            return index < L ? index : -1;
        },
        _getPhysicalGroupStartIndex: function(name) {
            return def.getOwn(this._logicalRowPhysicalGroupIndex, name);
        },
        _getPhysicalGroupLength: function(name) {
            return def.getOwn(this._logicalRowPhysicalGroupsLength, name);
        },
        _configureTypeByPhysicalGroup: function(physicalGroupName, dimGroupName, dimCount, levelMax) {
            var gStartIndex = this._logicalRowPhysicalGroupIndex[physicalGroupName], gLength = this._logicalRowPhysicalGroupsLength[physicalGroupName], gEndIndex = gStartIndex + gLength - 1, index = gStartIndex;
            dimCount = null == dimCount ? gLength : Math.min(gLength, dimCount);
            if (dimCount && index <= gEndIndex) {
                dimGroupName || (dimGroupName = physicalGroupName);
                levelMax || (levelMax = 1 / 0);
                for (var dimName, level = 0; dimCount && level < levelMax; ) {
                    dimName = def.indexedId(dimGroupName, level++);
                    if (!this.complexTypeProj.isReadOrCalc(dimName)) {
                        index = this._getNextFreeLogicalColumnIndex(index);
                        if (index > gEndIndex) return index;
                        this.defReader({
                            names: dimName,
                            indexes: index
                        });
                        index++;
                        dimCount--;
                    }
                }
            }
            return index;
        },
        _configureTypeByOrgLevel: function(discreteDimGroups, continuousDimGroups) {
            var freeContinuous = [], freeDiscrete = [];
            this._logicalRowInfos.forEach(function(info, index) {
                if (!this[index]) {
                    var indexes = 1 === info.type ? freeContinuous : freeDiscrete;
                    indexes && indexes.push(index);
                }
            }, this._userUsedIndexes);
            this._configureTypeByDimGroups(freeDiscrete, this._processDimGroupSpecs(discreteDimGroups, !0, 1 / 0));
            this._configureTypeByDimGroups(freeContinuous, this._processDimGroupSpecs(continuousDimGroups, !1, 1));
        },
        _processDimGroupSpecs: function(dimGroupSpecs, defaultGreedy, defaultMaxCount) {
            return dimGroupSpecs.map(function(dimGroupSpec) {
                return def.string.is(dimGroupSpec) ? {
                    name: dimGroupSpec,
                    greedy: defaultGreedy,
                    maxCount: defaultMaxCount
                } : def.setDefaults(dimGroupSpec, {
                    greedy: defaultGreedy,
                    maxCount: defaultMaxCount
                });
            });
        },
        _configureTypeByDimGroups: function(freeIndexes, dimGroups) {
            if (dimGroups) for (var F, g = -1, G = dimGroups.length; ++g < G && (F = freeIndexes.length); ) {
                var dimGroupSpec = dimGroups[g], maxCount = Math.min(dimGroupSpec.maxCount, F), defaultDims = this._getFreeDimGroupNames(dimGroupSpec.name, maxCount, dimGroupSpec.greedy);
                if (defaultDims) {
                    defaultDims.length;
                    this.defReader({
                        names: defaultDims,
                        indexes: freeIndexes.splice(0, defaultDims.length)
                    });
                }
            }
        },
        _getFreeDimGroupNames: function(dimGroupName, dimCount, greedy) {
            if (!dimGroupName) return null;
            var dims = [], level = 0;
            null == dimCount && (dimCount = 1);
            for (;dimCount; ) {
                var dimName = def.indexedId(dimGroupName, level++);
                if (this.complexTypeProj.isReadOrCalc(dimName)) greedy || dimCount--; else {
                    dims.push(dimName);
                    dimCount--;
                }
            }
            return dims.length ? dims : null;
        }
    });
    def.type("cdo.MatrixTranslationOper", cdo.TranslationOper).add({
        _initType: function() {
            this.J = this.metadata.length;
            this.I = this.source.length;
            this._processMetadata();
            this.base();
        },
        setSource: function(source) {
            this.base(source);
            this.I = this.source.length;
        },
        _knownContinuousColTypes: {
            numeric: 1,
            number: 1,
            integer: 1
        },
        _processMetadata: function() {
            var columnTypes, typeCheckingMode = this.options.typeCheckingMode, knownContinColTypes = this._knownContinuousColTypes;
            if ("none" === typeCheckingMode) columnTypes = def.query(this.metadata).select(function(colDef, colIndex) {
                colDef.colIndex = colIndex;
                var colType = colDef.colType;
                return colType && 1 === knownContinColTypes[colType.toLowerCase()] ? 1 : 0;
            }).array(); else {
                var checkNumericString = "extended" === typeCheckingMode, columns = def.query(this.metadata).select(function(colDef, colIndex) {
                    colDef.colIndex = colIndex;
                    return colDef;
                }).where(function(colDef) {
                    var colType = colDef.colType;
                    return !colType || 1 !== knownContinColTypes[colType.toLowerCase()];
                }).select(function(colDef) {
                    return colDef.colIndex;
                }).array(), I = this.I, source = this.source, J = columns.length;
                columnTypes = def.array.create(this.J, 1);
                for (var i = 0; i < I && J > 0; i++) for (var row = source[i], m = 0; m < J; ) {
                    var j = columns[m], value = row[j];
                    if (null != value) {
                        columnTypes[j] = this._getSourceValueType(value, checkNumericString);
                        columns.splice(m, 1);
                        J--;
                    } else m++;
                }
            }
            this._columnTypes = columnTypes;
        },
        _buildLogicalColumnInfoFromMetadata: function(index) {
            var meta = this.metadata[index];
            return {
                type: this._columnTypes[index],
                name: meta.colName,
                label: meta.colLabel
            };
        },
        _getSourceValueType: function(value, checkNumericString) {
            switch (typeof value) {
              case "number":
                return 1;

              case "string":
                return checkNumericString && "" !== value && !isNaN(+value) ? 1 : 0;

              case "object":
                return value instanceof Date ? 1 : 0;
            }
            return 0;
        },
        logSource: function() {
            var R = cdo.previewRowsMax, C = cdo.previewColsMax, md = this.metadata, L = md.length, prepend = def.array.prepend;
            if (L > C) {
                md = md.slice(0, C);
                md.push({
                    colName: "(" + C + "/" + L + ")",
                    colType: "..."
                });
            }
            var table = def.textTable(md.length + 1).rowSep().row.apply(table, prepend(md.map(function(col) {
                return col.colName;
            }), [ "Name" ])).rowSep().row.apply(table, prepend(md.map(function(col) {
                return col.colLabel ? '"' + col.colLabel + '"' : "";
            }), [ "Label" ])).rowSep().row.apply(table, prepend(md.map(function(col) {
                return col.colType;
            }), [ "Type" ])).rowSep();
            def.query(this.source).take(R).each(function(row, index) {
                L > C && (row = row.slice(0, C));
                table.row.apply(table, prepend(row.map(function(v) {
                    return def.describe(v);
                }), [ index + 1 ]));
            });
            table.rowSep().row("(" + Math.min(R, this.I) + "/" + this.I + ")").rowSep(!0);
            return "DATA SOURCE SUMMARY\n" + table() + "\n";
        },
        _logLogicalRow: function(kindList, kindScope) {
            var table = def.textTable(6).rowSep().row("Index", "Kind", "Type", "Name", "Label", "Dimension").rowSep(), index = 0;
            kindList.forEach(function(kind) {
                for (var i = 0, L = kindScope[kind]; i < L; i++) {
                    var info = this._logicalRowInfos[index];
                    table.row(index, kind, info.type ? "number" : "string", info.name || "", info.label || "", this._userIndexesToSingleDim[index] || "");
                    index++;
                }
            }, this);
            table.rowSep(!0);
            return "LOGICAL TABLE\n" + table() + "\n";
        },
        _createPlot2SeriesKeySet: function(plot2DataSeriesIndexes, seriesKeys) {
            var plot2SeriesKeySet = null, seriesCount = seriesKeys.length;
            def.query(plot2DataSeriesIndexes).each(function(indexText) {
                var seriesIndex = +indexText;
                if (isNaN(seriesIndex)) throw def.error.argumentInvalid("plot2SeriesIndexes", "Element is not a number '{0}'.", [ indexText ]);
                if (seriesIndex < 0) {
                    if (seriesIndex <= -seriesCount) throw def.error.argumentInvalid("plot2SeriesIndexes", "Index is out of range '{0}'.", [ seriesIndex ]);
                    seriesIndex = seriesCount + seriesIndex;
                } else if (seriesIndex >= seriesCount) throw def.error.argumentInvalid("plot2SeriesIndexes", "Index is out of range '{0}'.", [ seriesIndex ]);
                plot2SeriesKeySet || (plot2SeriesKeySet = {});
                plot2SeriesKeySet[seriesKeys[seriesIndex]] = !0;
            });
            return plot2SeriesKeySet;
        },
        _dataPartGet: function(calcAxis2SeriesKeySet) {
            function calcDataPart(series, outAtoms) {
                outAtoms[dataPartDimName] = def.hasOwn(plot2SeriesKeySet, series) ? part2Atom || (part2Atom = dataPartDimension.intern("1")) : part1Atom || (part1Atom = dataPartDimension.intern("0"));
            }
            var dataPartDimension, plot2SeriesKeySet, part1Atom, part2Atom, me = this, dataPartDimName = this.options.dataPartDimName, init = function() {
                plot2SeriesKeySet = calcAxis2SeriesKeySet();
                dataPartDimension = me.data.dimensions(dataPartDimName);
                def.debug >= 3 && plot2SeriesKeySet && def.log("Second axis series values: " + def.describe(def.keys(plot2SeriesKeySet)));
                init = null;
            };
            this.complexTypeProj.setCalc({
                names: dataPartDimName,
                calculation: function(datum, outAtoms) {
                    init && init();
                    calcDataPart(datum.atoms.series.value, outAtoms);
                }
            });
        },
        _configureTypeCore: function() {
            [ "series", "category", "value" ].forEach(function(physicalGroupName) {
                this._configureTypeByPhysicalGroup(physicalGroupName);
            }, this);
        }
    });
    cdo.previewRowsMax = 15;
    cdo.previewColsMax = 6;
    def.type("cdo.CrosstabTranslationOper", cdo.MatrixTranslationOper).add({
        _translType: "Crosstab",
        logicalColumnCount: function() {
            return this.R + this.C + this.M;
        },
        _executeCore: function() {
            function updateLogicalRowCrossGroup(crossGroupId, source) {
                for (var logColIndex = logicalRowCrossGroupIndex[crossGroupId], sourceIndex = 0, depth = me[crossGroupId]; depth-- > 0; ) logRow[logColIndex++] = source[sourceIndex++];
            }
            function updateLogicalRowMeasure(line, cg) {
                for (var logColIndex = logicalRowCrossGroupIndex.M, cgIndexes = me._colGroupsIndexes[cg], depth = me.M, i = 0; i < depth; i++) {
                    var lineIndex = cgIndexes[i];
                    logRow[logColIndex++] = null != lineIndex ? line[lineIndex] : null;
                }
            }
            if (!this.metadata.length) return def.query();
            var dimsReaders = this._getDimensionsReaders(), logRow = new Array(this.logicalColumnCount()), logicalRowCrossGroupIndex = this._logicalRowCrossGroupIndex, me = this, q = def.query(this.source);
            if (this._colGroups && this._colGroups.length) {
                var expandLine = function(line) {
                    updateLogicalRowCrossGroup("R", line);
                    return def.query(this._colGroups).select(function(colGroup, cg) {
                        updateLogicalRowCrossGroup("C", colGroup);
                        updateLogicalRowMeasure(line, cg);
                        return this._readLogicalRow(logRow, dimsReaders);
                    }, this);
                };
                return q.selectMany(expandLine, this);
            }
            return q.select(function(line) {
                updateLogicalRowCrossGroup("R", line);
                return this._readLogicalRow(logRow, dimsReaders);
            }, this);
        },
        _processMetadata: function() {
            this.base();
            this._separator = this.options.separator || "~";
            var R = this.R = 1;
            this.C = 1;
            this.M = 1;
            this.measuresDirection = null;
            var seriesInRows = this.options.seriesInRows, metadata = this.metadata, isV1Compat = this.options.compatVersion <= 1, colNames = function() {
                var f = seriesInRows ? function(d) {
                    return d.colName;
                } : isV1Compat ? function(d) {
                    return {
                        v: d.colName
                    };
                } : function(d) {
                    return {
                        v: d.colName,
                        f: d.colLabel
                    };
                };
                return metadata.map(f);
            }(), logicalRowCrossGroupInfos = this._logicalRowCrossGroupInfos = {};
            if (this.options.isMultiValued) {
                var measuresInColumns = def.get(this.options, "measuresInColumns", !0);
                if (measuresInColumns || null == this.options.measuresIndex) {
                    R = this.R = this._getCategoriesCount();
                    var encodedColGroups = colNames.slice(R);
                    if (encodedColGroups.length > 0) {
                        if (measuresInColumns) {
                            this.measuresDirection = "columns";
                            this._processEncodedColGroups(encodedColGroups);
                        } else {
                            this._colGroups = encodedColGroups;
                            this._colGroupsIndexes = [];
                            this._colGroups.forEach(function(colGroup, cg) {
                                this._colGroups[cg] = this._splitEncodedColGroupCell(colGroup);
                                this._colGroupsIndexes[cg] = [ this.R + cg ];
                            }, this);
                            logicalRowCrossGroupInfos.M = [ this._buildLogicalColumnInfoFromMetadata(R) ];
                        }
                        this.C = this._colGroups[0].length;
                        logicalRowCrossGroupInfos.C = def.range(0, this.C).select(function() {
                            return {
                                type: 0
                            };
                        }).array();
                    } else {
                        this.C = this.M = 0;
                        logicalRowCrossGroupInfos.M = [];
                        logicalRowCrossGroupInfos.C = [];
                    }
                } else {
                    this.measuresDirection = "rows";
                    this.R = +this.options.measuresIndex;
                    var measuresCount = this.options.measuresCount;
                    null == measuresCount && (measuresCount = 1);
                    this.M = measuresCount;
                    this._colGroups = colNames.slice(this.R + 1);
                    this._colGroups.forEach(function(colGroup, cg) {
                        this._colGroups[cg] = [ colGroup ];
                    }, this);
                }
            } else {
                R = this.R = this._getCategoriesCount();
                this._colGroups = colNames.slice(R);
                this._colGroupsIndexes = new Array(this._colGroups.length);
                this._colGroups.forEach(function(colGroup, cg) {
                    this._colGroups[cg] = [ colGroup ];
                    this._colGroupsIndexes[cg] = [ R + cg ];
                }, this);
                logicalRowCrossGroupInfos.C = [ {
                    type: 0
                } ];
                logicalRowCrossGroupInfos.M = [ {
                    type: this._columnTypes[R]
                } ];
            }
            logicalRowCrossGroupInfos.R = def.range(0, this.R).select(this._buildLogicalColumnInfoFromMetadata, this).array();
            var logicalRowCrossGroupIndex = this._logicalRowCrossGroupIndex = {
                C: seriesInRows ? this.R : 0,
                R: seriesInRows ? 0 : this.C,
                M: this.C + this.R
            }, logicalRowInfos = this._logicalRowInfos = new Array(this.logicalColumnCount());
            def.eachOwn(logicalRowCrossGroupIndex, function(groupStartIndex, crossGroup) {
                logicalRowCrossGroupInfos[crossGroup].forEach(function(info, groupIndex) {
                    logicalRowInfos[groupStartIndex + groupIndex] = info;
                });
            });
            this._logicalRowPhysicalGroupsLength = {
                series: seriesInRows ? this.R : this.C,
                category: seriesInRows ? this.C : this.R,
                value: this.M
            };
            this._logicalRowPhysicalGroupIndex = {
                series: 0,
                category: this._logicalRowPhysicalGroupsLength.series,
                value: this.C + this.R
            };
        },
        logLogicalRow: function() {
            return this._logLogicalRow([ "C", "R", "M" ], {
                C: this.C,
                R: this.R,
                M: this.M
            });
        },
        _getCategoriesCount: function() {
            var R = this.options.categoriesCount;
            null != R && (!isFinite(R) || R < 0) && (R = null);
            if (null == R) {
                R = def.query(this._columnTypes).whayl(function(type) {
                    return 0 === type;
                }).count();
                R || (R = 1);
            }
            return R;
        },
        _splitEncodedColGroupCell: function(colGroup) {
            var labels, values = colGroup.v;
            if (null == values) values = []; else {
                values = values.split(this._separator);
                labels = colGroup.f;
                labels && (labels = labels.split(this._separator));
            }
            return values.map(function(value, index) {
                return {
                    v: value,
                    f: labels && labels[index]
                };
            });
        },
        _processEncodedColGroups: function(encodedColGroups) {
            for (var currColGroup, L = encodedColGroups.length || def.assert("Must have columns"), R = this.R, colGroups = [], measuresInfo = {}, measuresInfoList = [], i = 0; i < L; i++) {
                var meaName, meaLabel, colGroupValues, colGroupLabels, colGroupCell = encodedColGroups[i], encColGroupValues = colGroupCell.v, encColGroupLabels = colGroupCell.f, sepIndex = encColGroupValues.lastIndexOf(this._separator);
                if (sepIndex < 0) {
                    meaName = encColGroupValues;
                    meaLabel = encColGroupLabels;
                    encColGroupValues = "";
                    colGroupValues = [];
                } else {
                    meaName = encColGroupValues.substring(sepIndex + 1);
                    encColGroupValues = encColGroupValues.substring(0, sepIndex);
                    colGroupValues = encColGroupValues.split(this._separator);
                    if (null != encColGroupLabels) {
                        colGroupLabels = encColGroupLabels.split(this._separator);
                        meaLabel = colGroupLabels.pop();
                    }
                    colGroupValues.forEach(function(value, index) {
                        var label = colGroupLabels && colGroupLabels[index];
                        colGroupValues[index] = {
                            v: value,
                            f: label
                        };
                    });
                }
                if (currColGroup && currColGroup.encValues === encColGroupValues) currColGroup.measureNames.push(meaName); else {
                    currColGroup = {
                        startIndex: i,
                        encValues: encColGroupValues,
                        values: colGroupValues,
                        measureNames: [ meaName ]
                    };
                    colGroups.push(currColGroup);
                }
                var currMeaIndex = i - currColGroup.startIndex, meaInfo = def.getOwn(measuresInfo, meaName);
                if (meaInfo) currMeaIndex > meaInfo.groupIndex && (meaInfo.groupIndex = currMeaIndex); else {
                    measuresInfo[meaName] = meaInfo = {
                        name: meaName,
                        label: meaLabel,
                        type: this._columnTypes[R + i],
                        groupIndex: currMeaIndex,
                        index: i
                    };
                    measuresInfoList.push(meaInfo);
                }
            }
            measuresInfoList.sort(function(meaInfoA, meaInfoB) {
                return def.compare(meaInfoA.groupIndex, meaInfoB.groupIndex) || def.compare(meaInfoA.index, meaInfoB.index);
            });
            measuresInfoList.forEach(function(meaInfoA, index) {
                meaInfoA.groupIndex = index;
            });
            var CG = colGroups.length, colGroupsValues = new Array(CG), colGroupsIndexes = new Array(CG), M = measuresInfoList.length;
            colGroups.map(function(colGroup, cg) {
                colGroupsValues[cg] = colGroup.values;
                var colGroupStartIndex = colGroup.startIndex, meaIndexes = colGroupsIndexes[cg] = new Array(M);
                colGroup.measureNames.forEach(function(meaName2, localMeaIndex) {
                    var meaIndex = measuresInfo[meaName2].groupIndex;
                    meaIndexes[meaIndex] = R + colGroupStartIndex + localMeaIndex;
                });
            });
            this._colGroups = colGroupsValues;
            this._colGroupsIndexes = colGroupsIndexes;
            this._logicalRowCrossGroupInfos.M = measuresInfoList;
            this.M = M;
        },
        configureType: function() {
            if ("rows" === this.measuresDirection) throw def.error.notImplemented();
            var dataPartDimName = this.options.dataPartDimName;
            if (dataPartDimName && 1 === this.C && !this.complexTypeProj.isReadOrCalc(dataPartDimName)) {
                var plot2DataSeriesIndexes = this.options.plot2DataSeriesIndexes;
                if (null != plot2DataSeriesIndexes) {
                    var seriesKeys = this._colGroups.map(function(colGroup) {
                        return "" + colGroup[0].v;
                    });
                    this._plot2SeriesKeySet = this._createPlot2SeriesKeySet(plot2DataSeriesIndexes, seriesKeys);
                }
            }
            this.base();
            if (this._plot2SeriesKeySet) {
                if (this._userDimsReadersByDim.series) {
                    var calcAxis2SeriesKeySet = def.fun.constant(this._plot2SeriesKeySet);
                    this._dataPartGet(calcAxis2SeriesKeySet);
                }
            }
        }
    });
    def.type("cdo.RelationalTranslationOper", cdo.MatrixTranslationOper).add({
        M: 0,
        C: 0,
        S: 0,
        _translType: "Relational",
        _processMetadata: function() {
            this.base();
            var S, valuesColIndexes, M, D, metadata = this.metadata, J = this.J, C = this.options.categoriesCount;
            null != C && (!isFinite(C) || C < 0) && (C = 0);
            if (this.options.isMultiValued) {
                valuesColIndexes = def.parseDistinctIndexArray(this.options.measuresIndexes, 0, J - 1);
                M = valuesColIndexes ? valuesColIndexes.length : 0;
            }
            if (null == M) if (J > 0 && J <= 3 && (null == C || 1 === C)) {
                M = 1;
                valuesColIndexes = [ J - 1 ];
                C = J >= 2 ? 1 : 0;
                S = J >= 3 ? 1 : 0;
                D = C + S;
            } else if (null != C && C >= J) {
                D = C = J;
                S = M = 0;
            } else {
                var Mmax = null != C ? J - C : 1 / 0;
                valuesColIndexes = def.query(metadata).where(function(colDef, index) {
                    return 0 !== this._columnTypes[index];
                }, this).select(function(colDef) {
                    return colDef.colIndex;
                }).take(Mmax).array();
                M = valuesColIndexes.length;
            }
            if (null == D) {
                D = J - M;
                if (0 === D) S = C = 0; else if (null != C) if (C > D) {
                    C = D;
                    S = 0;
                } else S = D - C; else {
                    S = D > 1 ? 1 : 0;
                    C = D - S;
                }
            }
            var seriesInRows = this.options.seriesInRows, colGroupSpecs = [];
            if (D) {
                S && !seriesInRows && colGroupSpecs.push({
                    name: "S",
                    count: S
                });
                C && colGroupSpecs.push({
                    name: "C",
                    count: C
                });
                S && seriesInRows && colGroupSpecs.push({
                    name: "S",
                    count: S
                });
            }
            M && colGroupSpecs.push({
                name: "M",
                count: M
            });
            var availableInputIndexes = def.range(0, J).array();
            valuesColIndexes && valuesColIndexes.slice().sort(def.descending).forEach(function(inputIndex) {
                availableInputIndexes.splice(inputIndex, 1);
            });
            var specsByName = {};
            colGroupSpecs.forEach(function(groupSpec) {
                var count = groupSpec.count, name = groupSpec.name;
                specsByName[name] = groupSpec;
                groupSpec.indexes = valuesColIndexes && "M" === name ? valuesColIndexes : availableInputIndexes.splice(0, count);
            });
            this.M = M;
            this.S = S;
            this.C = C;
            var logicalRowPerm = [];
            [ "S", "C", "M" ].forEach(function(name) {
                var groupSpec = specsByName[name];
                groupSpec && def.array.append(logicalRowPerm, groupSpec.indexes);
            });
            this._logicalRowInfos = logicalRowPerm.map(this._buildLogicalColumnInfoFromMetadata, this);
            this._logicalRowPerm = logicalRowPerm;
            this._logicalRowPhysicalGroupsLength = {
                series: this.S,
                category: this.C,
                value: this.M
            };
            this._logicalRowPhysicalGroupIndex = {
                series: 0,
                category: this._logicalRowPhysicalGroupsLength.series,
                value: this.S + this.C
            };
        },
        logLogicalRow: function() {
            return this._logLogicalRow([ "S", "C", "M" ], {
                S: this.S,
                C: this.C,
                M: this.M
            });
        },
        configureType: function() {
            this.base();
            var dataPartDimName = this.options.dataPartDimName;
            if (dataPartDimName && !this.complexTypeProj.isReadOrCalc(dataPartDimName)) {
                var plot2DataSeriesIndexes = this.options.plot2DataSeriesIndexes;
                if (null != plot2DataSeriesIndexes) {
                    var seriesReader = this._userDimsReadersByDim.series;
                    seriesReader && relTransl_dataPartGet.call(this, plot2DataSeriesIndexes, seriesReader);
                }
            }
        },
        _executeCore: function() {
            var dimsReaders = this._getDimensionsReaders(), permIndexes = this._logicalRowPerm;
            return def.query(this._getLogicalRows()).select(function(row) {
                row = pv.permute(row, permIndexes);
                return this._readLogicalRow(row, dimsReaders);
            }, this);
        }
    });
    var numFormStyle = cdo.numberFormatStyle = function(other, proto) {
        return new NumFormStyle(other, proto);
    }, numForm_privProp = def.priv.key().property(), NumFormStyle = numFormStyle.of = def("cdo.NumberFormatStyle", def.FieldsBase.extend({
        init: function() {
            def.classify(this, numFormStyle);
        },
        fields: {
            decimal: {
                cast: String,
                fail: def.falsy
            },
            group: {
                cast: String
            },
            groupSizes: {
                fail: def.array.empty
            },
            negativeSign: {
                cast: String,
                fail: def.falsy
            },
            currency: {
                cast: String,
                fail: def.falsy
            },
            integerPad: {
                cast: String,
                fail: def.falsy
            },
            fractionPad: {
                cast: String,
                fail: def.falsy
            },
            abbreviations: {
                fail: def.array.empty
            }
        },
        methods: {
            tryConfigure: function(other) {
                if (def.is(other, numFormStyle)) return !!this.integerPad(other.integerPad()).fractionPad(other.fractionPad()).decimal(other.decimal()).group(other.group()).groupSizes(other.groupSizes()).negativeSign(other.negativeSign()).currency(other.currency()).abbreviations(other.abbreviations());
                if (def.string.is(other)) {
                    var formP = langProvider(other);
                    if (formP) return !!def.configure(this, formP.number().style());
                }
            }
        }
    }, {
        fieldsPrivProp: numForm_privProp
    }));
    def.classify(NumFormStyle.prototype, numFormStyle);
    numFormStyle.defaults = numFormStyle({
        integerPad: "0",
        fractionPad: "0",
        decimal: ".",
        group: ",",
        groupSizes: [ 3 ],
        abbreviations: [ "k", "m", "b", "t" ],
        negativeSign: "-",
        currency: "$"
    });
    var numForm = cdo.numberFormat = function(config, proto) {
        function numFormat(value) {
            formatter || (formatter = numForm_cachedFormatter(fields.mask));
            return formatter(value, numForm_privProp(fields.style));
        }
        var fields, formatter;
        numFormat.format = numFormat;
        numFormat.tryConfigure = numForm_tryConfigure;
        def.classify(numFormat, numForm);
        fields = def.instance(numFormat, config, proto, {
            mask: {
                cast: String,
                change: function() {
                    formatter = null;
                }
            },
            style: {
                cast: def.createAs(NumFormStyle),
                factory: numFormStyle
            }
        });
        return numFormat;
    };
    numForm.defaults = numForm().style(numFormStyle());
    numForm.cacheLimit = 20;
    var numForm_cache = {}, numForm_cacheCount = 0, dateForm = cdo.dateFormat = function(config, proto) {
        function dateFormat(value) {
            formatter || (formatter = dateForm_createFormatter(fields.mask));
            return formatter(value);
        }
        var fields, formatter;
        dateFormat.format = dateFormat;
        dateFormat.tryConfigure = dateForm_tryConfigure;
        def.classify(dateFormat, dateForm);
        fields = def.instance(dateFormat, config, proto, {
            mask: {
                cast: String,
                change: function() {
                    formatter = null;
                }
            }
        });
        arguments.length && def.configure(dateFormat, arguments[0]);
        return dateFormat;
    };
    dateForm.defaults = dateForm();
    var customForm = cdo.customFormat = function(config, proto) {
        function customFormat(v) {
            var formatter = fields.formatter;
            return String(formatter && formatter.apply(null, arguments));
        }
        var fields;
        customFormat.format = customFormat;
        customFormat.tryConfigure = customForm_tryConfigure;
        def.classify(customFormat, customForm);
        fields = def.instance(customFormat, config, proto, {
            formatter: {
                cast: def.fun.as
            }
        });
        return customFormat;
    };
    customForm.defaults = customForm().formatter(customForm_defaultFormatter);
    var _defaultLangCode = "en-us", formProvider = cdo.format = function(config, proto) {
        function formatProvider() {}
        formatProvider.tryConfigure = formProvider_tryConfigure;
        var language;
        if (!proto && def.string.is(config)) {
            var formP = langProvider(config);
            language = formP.languageCode;
            if (formP) {
                proto = formP;
                config = null;
            }
        }
        formatProvider.languageCode = language || _defaultLangCode;
        def.classify(formatProvider, formProvider);
        def.instance(formatProvider, config, proto, {
            number: formProvider_field(numForm),
            percent: formProvider_field(numForm),
            date: formProvider_field(dateForm),
            any: {
                cast: def.createAs(customForm),
                factory: customForm
            }
        });
        return formatProvider;
    };
    formProvider.defaults = formProvider({
        number: "#,0.##",
        percent: "#,0.#%",
        date: "%Y/%m/%d",
        any: customForm()
    });
    var _languages = {}, _currentProvider = _languages[_defaultLangCode] = formProvider.defaults, langProvider = cdo.format.language = function(style, config) {
        var L = arguments.length;
        if (!L) return _currentProvider;
        if (1 == L) {
            if (void 0 === style) throw def.error.operationInvalid("Undefined 'style' value.");
            if (null === style || "" === style) style = _defaultLangCode; else {
                if (def.is(style, formProvider)) return _currentProvider = style;
                if ("object" == typeof style) {
                    for (var key in style) configLanguage(key, def.getOwn(style, key));
                    return cdo.format;
                }
            }
            return getLanguage(style, !0);
        }
        if (2 == L) return configLanguage(style, config);
        throw def.error.operationInvalid("Wrong number of arguments");
    };
    langProvider({
        "en-gb": {
            number: {
                mask: "#,0.##",
                style: {
                    integerPad: "0",
                    fractionPad: "0",
                    decimal: ".",
                    group: ",",
                    groupSizes: [ 3 ],
                    abbreviations: [ "k", "m", "b", "t" ],
                    negativeSign: "-",
                    currency: "£"
                }
            },
            date: {
                mask: "%d/%m/%Y"
            }
        },
        "pt-pt": {
            number: {
                mask: "#,0.##",
                style: {
                    integerPad: "0",
                    fractionPad: "0",
                    decimal: ",",
                    group: " ",
                    groupSizes: [ 3 ],
                    abbreviations: [ "k", "m", "b", "t" ],
                    negativeSign: "-",
                    currency: "€"
                }
            },
            date: {
                mask: "%d/%m/%Y"
            }
        }
    });
    return cdo;
});