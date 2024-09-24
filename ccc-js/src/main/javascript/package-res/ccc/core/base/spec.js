
function pvc_spec_addEvent(oper, spec, eventName, handler) {
    var operStore  = def.lazy(spec, oper),
        eventStore = operStore[eventName];

    if(!eventStore) eventStore = operStore[eventName] = [];
    else if(def.array.is(eventStore)) eventStore = operStore[eventName] = [eventStore];

    eventStore.push(handler);
    return pvc.spec;
}

pvc.spec = /** @lends pvc.spec */{
    /**
     * Adds a **before** event handler or handlers to a given event or events.
     *
     * This method is a synonym of {@link pvc.spec.before}.
     * @function
     *
     * @param {object} spec The chart specification.
     * @param {string} eventName The event name.
     * @param {function} handler The handler function.
     *
     * @return {object} The `this` instance.
     */
    on: pvc_spec_addEvent.bind(null, 'on'),

    /**
     * Adds a **before** event handler or handlers to a given event or events.
     *
     * This method is a synonym of {@link pvc.spec.on}.
     * @function
     *
     * @param {object} spec The chart specification.
     * @param {string} eventName The event name.
     * @param {function} handler The handler function.
     *
     * @return {object} The `this` instance.
     */
    before: pvc_spec_addEvent.bind(null, 'before'),

    /**
     * Adds an **after** event handler or handlers to a given event or events.
     *
     * @function
     *
     * @param {object} spec The chart specification.
     * @param {string} eventName The event name.
     * @param {function} handler The handler function.
     *
     * @return {object} The `this` instance.
     */
    after: pvc_spec_addEvent.bind(null, 'after')
};
