/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/

/**
 * @name def.EventSource
 *
 * @class Defines the methods for an object that
 *   signals the execution of actions by firing events.
 *
 * This class can be used as a base or mixin class.
 *
 * @constructor
 */
def('EventSource', def.Object.extend({
    methods: /** @lends def.EventSource# */{
        /**
         * Adds handlers for the **before** phase of actions.
         *
         * This method is a synonym of {@link def.EventSource#before}.
         *
         * This method supports the following signatures:
         * <ol>
         *    <li>on("type", handler)</li>
         *    <li>on(["type1", "type2"], handler)</li>
         *    <li>on({"type1": handler1, "type2": handler2})</li>
         * </ol>
         * In the last variant, the <i>handler</i> argument is ignored.
         *
         * In any case, the handler values can be a {@link def.EventHandler}, or an array of.
         *
         * @param {string|Array|Object} type The type of action or actions.
         * @param {def.EventHandler|def.EventHandler[]} [handler] An event handler or handlers.
         *   This argument is only relevant when the first argument, <i>type</i> is
         *   a <tt>string</tt> or an <tt>Array</tt>.
         *
         * @return {def.EventSource} The `this` instance.
         */
        on: function(type, handler) {
            return eventSource_each(eventSource_on1, this, type, handler, true), this;
        },

        /**
         * Adds handlers for the **before** phase of actions.
         *
         * This method is a synonym of {@link def.EventSource#on}.
         *
         * This method supports the following signatures:
         * <ol>
         *    <li>before("type", handler)</li>
         *    <li>before(["type1", "type2"], handler)</li>
         *    <li>before({"type1": handler1, "type2": handler2})</li>
         * </ol>
         * In the last variant, the <i>handler</i> argument is ignored.
         *
         * In any case, the handler values can be a {@link def.EventHandler}, or an array of.
         *
         * @param {string|Array|Object} type The type of action or actions.
         * @param {def.EventHandler|def.EventHandler[]} [handler] An event handler or handlers.
         *   This argument is only relevant when the first argument, <i>type</i> is
         *   a <tt>string</tt> or an <tt>Array</tt>.
         *
         * @return {def.EventSource} The `this` instance.
         */
        before: function(type, handler) {
            return eventSource_each(eventSource_on1, this, type, handler, /*isBefore:*/true), this;
        },

        /**
         * Adds handlers for the **after** phase of actions.
         *
         * This method supports the following signatures:
         * <ol>
         *    <li>after("type", handler)</li>
         *    <li>after(["type1", "type2"], handler)</li>
         *    <li>after({"type1": handler1, "type2": handler2})</li>
         * </ol>
         * In the last variant, the <i>handler</i> argument is ignored.
         *
         * In any case, the handler values can be a {@link def.EventHandler}, or an array of.
         *
         * @param {string|Array|Object} type The type of action or actions.
         * @param {def.EventHandler|def.EventHandler[]} [handler] An event handler or handlers.
         *   This argument is only relevant when the first argument, <i>type</i> is
         *   a <tt>string</tt> or an <tt>Array</tt>.
         *
         * @return {def.EventSource} The `this` instance.
         */
        after: function(type, handler) {
            return eventSource_each(eventSource_on1, this, type, handler, /*isBefore:*/false), this;
        },

        /**
         * Removes handlers from actions.
         *
         * This method supports the following signatures:
         * <ol>
         *    <li>off("type", handler)</li>
         *    <li>off(["type1", "type2"], handler)</li>
         *    <li>off({"type1": handler1, "type2": handler2})</li>
         * </ol>
         * In the last variant, the <i>handler</i> argument is ignored.
         *
         * In any case, the handler values can be <tt>null</tt>, a {@link def.EventHandler}, or an array of.
         * Whatever the form of the handler values,
         * it is the <i>handler</i> function itself that is used for identification.
         *
         * When a handler value is <tt>null</tt>, all handlers for the corresponding type are removed.
         *
         * @param {string|Array|Object} type The type of action or actions.
         * @param {def.EventHandler|def.EventHandler[]} [handler] An event handler or handlers.
         *   This argument is only relevant when the first argument, <i>type</i> is
         *   a <tt>string</tt> or an <tt>Array</tt>.
         *
         * @return {def.EventSource} The `this` instance.
         */
        off: function(type, handler) {
            return eventSource_each(eventSource_off1, this, type, handler, /*isBefore:*/null, /*allowNullHandler:*/true), this;
        },

        /**
         * Given an action type and, optionally, a default <i>expression</i> method,
         * returns an event object that, when triggered, executes it.
         *
         * If, however, the specified action has no listeners,
         * and no default expression is specified,
         * <t>null</t> is returned.
         *
         * This method captures the specfied action's current listeners
         * and so the returned event object should be triggered as soon as possible.
         *
         * See {@link def.Event#trigger}.
         *
         * @protected
         *
         * @param {string} type The type of action to be executed.
         * @param {function} [defExpr] The action's default expression method.
         *
         * @return {def.Event} An event object representing the action execution.
         */
        _acting: function(type, defExpr) {
            if(!type) throw def.error.argumentRequired("type");
            return eventSource_acting(this, type, defExpr);
        }

        /**
         * Called on an event source when an action handler has been added to it.
         * This method is optional.
         *
         * @name _on
         * @memberOf def.EventSource#
         * @protected
         * @function
         * @param {string} type The type of action.
         * @param {def.EventHandlerInfo} handlerInfo The event handler info.
         * @param {boolean} isBefore Indicates if it is a <i>before</i> event handler.
         */

        /**
         * Called on an event source when an action handler has been removed from it.
         * This method is optional.
         *
         * @name _off
         * @memberOf def.EventSource#
         * @protected
         * @function
         * @param {string} type The type of action.
         * @param {def.EventHandlerInfo} handlerInfo The event handler info.
         * @param {boolean} isBefore Indicates if it is a <i>before</i> event handler.
         */
    }
}));

/**
 * @name def.EventHandlerInfo
 * @class An action event handler info object.
 *
 * This class allows specifying acessory information besides the handler function itself.
 * Actions may support additional options as part of the event handler registration.
 * See specific actions' documentation for information on supported handler options.
 *
 * @constructor
 *
 * @property {function} handler The function that handles the event.
 */

/**
 * An action event handler.
 * @typedef {(function|def.EventHandlerInfo)} def.EventHandler
 */

/**
 * @name def.Event
 * @class An action execution.
 * @constructor
 *
 * @property {string} string The type of action.
 *      Examples are <tt>"change"</tt> and <tt>"focusin"</tt>. Readonly.
 *
 * @property {boolean} defaultPrevented Indicates if the action has been cancelled. Readonly.
 *
 * @property {string} phase The current phase of the action.
 *      It can be one of the values: <tt>"before"</tt>, <tt>"default"</tt> and <tt>"after"</tt>.
 *      Readonly.
 *
 * @property {any} result The value returned by the action's default expression,
 *      if any, and if called, or <tt>undefined</tt>, otherwise.
 *
 * @property {object} source The object in which the action is being executed.
 *
 * @property {boolean} cancelable Indicates if the action can be cancelled,
 *      by calling {@link #preventDefault}.
 *      Can be set <i>before</i> the action is triggered and is readonly afterwards.
 */

/**
 * Executes the action that the event object represents.
 *
 * Execution starts in the <i>before</i> phase, by calling all before listeners.
 * If the event is cancelled by any of the before listeners,
 * through a call to {@link #preventDefault},
 * execution ends at the end of the <i>before</i> phase.
 *
 * Otherwise,
 * execution transitions to the <i>default</i> phase.
 * If a default expression was specified, it is called,
 * and its result is stored in {@link #result}.
 *
 * Finally, execution transitions to the <i>after</i> phase,
 * and all after listeners are called.
 *
 * @name trigger
 * @memberOf def.Event#
 * @function
 * @param {object} [ctx] An alternate JS context object to call the listeners and default expression
 *   functions on. By default, when unspecified, or nully, the context object is the event's source.
 * @param {Array} [args] An array of arguments to pass to the listeners and
 *   default expression functions.
 *   By default, when unspecified or nully,
 *   these are called with a single argument - the event object.
 * @return {any} The value returned by the default expression function, if any, and if called,
 *   or, otherwise, <tt>undefined</tt>.
 */

/**
 * When called in the event's before phase,
 * cancels the execution of the action's subsequent phases.
 *
 * When cancelled, all remaining before listeners are still called,
 * but the action's default expression and any after listeners are not.
 *
 * Action cancelation is irreversible.
 *
 * See {@link #defaultPrevented}.
 *
 * @name preventDefault
 * @memberOf def.Event#
 * @function
 */

/**
 * Adds one handler to one action of a source object.
 *
 * @private
 * @param {Object} inst The object that is the source of the event.
 * @param {string} type A single action type.
 * @param {def.EventHandler} handler A handler value.
 * @param {boolean} [before=false] Indicates if the handler is called before or after the action event.
 */
function eventSource_on1(inst, type, handler, before) {
    var evs = def.lazy(inst, '__eventz'),
        has = evs[type] || (evs[type] = {before: [], after: [], count: 0});

    // new handlers are ok during trigger cause it reads length of before/after at start.

    // These can be overriden through inst._on.
    // _handler - the handler that is actually called; enables handler interception.
    // _filter  - a filter function that determines if the _handler is called.
    var hi;
    if(def.fun.is(handler)) {
        hi = {handler: handler, _handler: null, _filter: null};
    } else if(handler instanceof Object) {
        hi = handler;
        if(!hi.handler) throw def.error.argumentRequired("handler.handler");
        hi._filter = null;
    } else {
        throw def.error.argumentInvalid("handler", "Invalid type.");
    }

    hi._handler = hi.handler;

    has[before ? 'before' : 'after'].push(hi);
    has.count++;

    // Notify the instance that an event handler was added.
    if(inst._on) inst._on(type, hi, !!before);
}

/**
 * Removes one handler from one action of a source object.
 *
 * @private
 * @param {Object} inst The object that is the source of the event.
 * @param {string} type A single action type.
 * @param {def.EventHandler} [handler=null] A handler value.
 */
function eventSource_off1(inst, type, handler) {
    var evs, // instance events store
        has, // handlers store for a specific event.
        handlerFun;

    if(handler != null) {
        if(def.fun.is(handler)) {
            handlerFun = handler;
        } else if(handler instanceof Object) {
            handlerFun = handler.handler;
        } else {
            throw def.error.argumentInvalid("handler", "Invalid type.");
        }
    }

    if((evs = inst.__eventz) && (has = evs[type]) && has.count) {
        var pha,     // event phase handlers array
            hi,      // a specific handler object
            i,       // the index of the specific handler object
            isAfter; // Indicates if the handler was found in the after phase

        if(handlerFun) {
            pha = has.before;
            i   = findHandlerIndex(pha, handlerFun);
            isAfter = (i < 0);
            if(isAfter) {
                pha = has.after;
                i = findHandlerIndex(pha, handlerFun);
                if(i < 0) return; // not after, also, afterall
            }

            hi = pha[i];

            if(--has.count === 0) {
                evs[type] = null;
            } else {
                // allow off during `trigger`
                // copy on write
                pha = pha.slice(); // copy
                pha.splice(i, 1);  // remove
                has[isAfter ? 'after' : 'before'] = pha; // replace
            }

            eventSource_off1Core(inst, type, hi, !isAfter);
        } else {
            // Remove all befores and all afters
            // replace
            var befores = has.before, afters = has.after;
            evs[type] = null;
            i = befores.length;
            while(i--) eventSource_off1Core(inst, type, befores[i], /*isBefore:*/true);
            i = afters.length;
            while(i--) eventSource_off1Core(inst, type, afters[i],  /*isBefore:*/false);
        }
    }
}

// @private
function eventSource_off1Core(inst, type, hi, isBefore) {
    // Notify the instance that an event handler was removed.
    if(inst._off) inst._off(type, hi, isBefore);

    hi._filter = hi._handler = null;
}

// @private
function eventSource_acting(source, type, defExpr) {
    var evs, has, phaB, phaA, LB, LA;

    // Reading arrays and their lengths at start allows both on and off during a trigger.
    if((evs = source.__eventz) && (has = evs[type])) {
        LB = (phaB = has.before).length;
        LA = (phaA = has.after ).length;
    }

    if(!LA && !LB && !defExpr) return null;

    var preventable = false,
        prevented   = false,
        ev = {
            type:   type,
            phase:  null,
            source: source,
            result: undefined,
            cancelable: false,
            defaultPrevented: prevented,

            preventDefault: function() {
                if(preventable) this.defaultPrevented = prevented = true;
            },

            trigger: function(ctx, args) {
                if(this.phase) throw def.error.operationInvalid("Event can only be triggered once.");

                if(!ctx ) ctx = source;
                if(!args) args = [this];

                // Capture configured value.
                preventable = !!this.cancelable;

                // Result as returned by `defExpr`, if any.
                var result;

                if(LB) eventSource_actPhase(ctx, this, args, phaB, LB, /*before:*/true);

                // Prevented?
                if(!(preventable && this.defaultPrevented)) {
                    if(defExpr) {
                        this.phase  = 'default';
                        this.result = result = defExpr.apply(ctx, args);
                    }
                    if(LA) eventSource_actPhase(ctx, this, args, phaA, LA, /*before:*/false);
                }

                this.phase = 'done';

                return result;
            }
        };

    return ev;
}

// @private
function eventSource_actPhase(inst, ev, args, has, L, before) {
    var i = -1, hi;
    ev.phase = before ? 'before' : 'after';
    while(++i < L) {
        hi = has[i];
        if(!hi._filter || hi._filter.apply(inst, args))
            hi._handler.apply(inst, args);
    }
}

// @private
// on("type", <h>)
// on(["typea", "typeb"], <h>)
// on({"typea": <ha>, "typeb": <hb>});
//
// In the above, <h>, <ha> and <hb> can be:
// * a function,
// * a handler object {handler: function}, or
// * an array with any combination of the previous.
function eventSource_each(fun, inst, type, handler, before, allowNullHandler) {
    if(def.string.is(type)) {
        // on("ev", h)
        eventSource_eachHandler(fun, inst, type, handler, before, allowNullHandler);

    } else if(def.array.is(type)) {
        // on(["eva", "evb"], h)
        type.forEach(function(typei) {
            if(!def.string.is(typei)) throw def.error.argumentInvalid("type");

            eventSource_eachHandler(fun, inst, typei, handler, before, allowNullHandler);
        });
    } else if(def.object.is(type)) {
        // on({"eva": ha, "evb": hb});
        // handler ignored
        def.eachOwn(type, function(hi, typei) {
            eventSource_eachHandler(fun, inst, typei, hi, before, allowNullHandler);
        });

    } else {
        throw def.error.argumentInvalid("type");
    }
}

function eventSource_eachHandler(fun, inst, type1, handler, before, allowNullHandler) {
    if(!allowNullHandler && !handler) throw def.error.argumentRequired("handler");

    if(def.array.is(handler))
        handler.forEach(function(hi) {
            fun(inst, type1, hi, before);
        });
    else
        fun(inst, type1, handler, before);
}

// @private
function findHandlerIndex(a, e) {
    for(var i = 0, L = a.length; i < L ; i++) if(a[i].handler === e) return i;
    return -1;
}

