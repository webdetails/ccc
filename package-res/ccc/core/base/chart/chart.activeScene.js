/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

pvc.BaseChart
.add({
    //_activeScene: null,

    /**
     * Gets the chart's active scene.
     *
     * @return {pvc.visual.Scene} The active scene or `null`, when none is active.
     */
    activeScene: function() {
        return this._activeScene || null;
    },

    /**
     * Sets the chart's active scene.
     *
     * If the scene changes, triggers the chart's "active:change" event.
     *
     * @return {boolean} <tt>true</tt> if the active scene changed, <tt>false</tt> otherwise.
     */
    _setActiveScene: function(to) {
        // Send to root chart.
        if(this.parent) return this.root._setActiveScene(to);

        // Normalize to null
        if(!to) to = null;
        // Only owner scenes can become active!
        else if(to.ownerScene) to = to.ownerScene;

        var from = this.activeScene();
        if(to === from) return false;

        // A context with no mark and no scene.
        var ctx = new pvc.visual.Context(this.basePanel),
            ev  = this._acting('active:change', function() {
                    return this.chart._activeSceneChange(this);
                });

        ev.from   = from;
        ev.to     = to;
        ctx.event = ev;
        ev.trigger(ctx, []);

        return true;
    },

    /**
     * Called to <b>actually</b> change the chart active scene.
     *
     * @param {pvc.visual.Context} ctx The `"active:change"` context.
     * @virtual
     * @protected
     * @private
     */
    _activeSceneChange: function(ctx) {
        this.useTextMeasureCache(function() {
            var from = ctx.event.from, to = ctx.event.to;

            // Change
            if(from) from._clearActive();
            if((this._activeScene = to)) to._setActive(true);

            // Render
            // Unless from same panel (<=> same root scene).
            if(from && (!to || to.root !== from.root))
                from.panel().renderInteractive();

            if(to) to.panel().renderInteractive();
        });
    },

    /**
     * Processes a new event handler.
     * If the event is `"active:change"` and the handler has a `role` or a `dims` property,
     * it is given a filter function that only actually calls the handler if the
     * implied dimension tuple changed its value.
     *
     * @param {string} name The name of the event.
     * @param {object} handlerInfo The handler info object.
     * @param {boolean} before Indicates the phase of the handler.
     * @private
     */
    _on: function(name, handlerInfo, before) {
        if(name === "active:change" && (handlerInfo.role || handlerInfo.dims)) {
            // Add a filter function to the event handler
            chart_activeSceneEvent_addFilter(name, handlerInfo);
        }
    }
});

function chart_activeSceneEvent_addFilter(name, handlerInfo) {
    var inited = false,
        normDimsKey, normDimNames;

    handlerInfo._filter  = eventFilter;
    handlerInfo._handler = eventHandler;

    // Applies the filter to check whether the event handler should run.
    /** @this pvc.visual.Context */
    function eventFilter() {
        // On the first run, determines dimsKey and dimNames.
        if(!inited) {
            inited = true;
            this.chart._processViewSpec(/* viewSpec: */handlerInfo);
            normDimNames = handlerInfo.dimNames;
            normDimsKey  = handlerInfo.dimsKey;
        }

        if(!normDimNames) return false;

        var activeFilters = def.lazy(this, '_activeFilters'),
            value = def.getOwn(activeFilters, normDimsKey);

        // Not yet determined
        if(value === undefined)
            activeFilters[normDimsKey] = value = evalEventFilter(this.event);

        return value;
    }

    // Calls the real handler with an enhanced event object.
    /** @this pvc.visual.Context */
    function eventHandler() {
        // this - possible strict violation.
        /*jshint -W040*/
        var ev1 = this.event,
            ev2 = Object.create(ev1);

        ev2.viewKey  = normDimsKey;
        ev2.viewFrom = function() { return getSceneView(ev1.from); };
        ev2.viewTo   = function() { return getSceneView(ev1.to  ); };

        this.event = ev2;
        try {
            handlerInfo.handler.call(this);
        } finally {
            this.event = ev1;
        }
    }

    function evalEventFilter(ev) {
        // assert from !== to

        var vFrom = getSceneView(ev.from, null),
            vTo   = getSceneView(ev.to,   null);

        // Compare from and to.

        // Both null. No change.
        if(vFrom === vTo) return false;

        // Only one is null. Changed.
        if(vFrom == null || vTo == null) return true;

        var i = normDimNames.length,
            atomsFrom = vFrom.atoms,
            atomsTo   = vTo.atoms;
        while(i--)
            if(atomsFrom[normDimNames[i]].value !== atomsTo[normDimNames[i]].value)
                return true;

        return false;
    }

    function getSceneView(scene, dv) {
        return scene ? scene._asView(normDimsKey, normDimNames) : dv;
    }
}
