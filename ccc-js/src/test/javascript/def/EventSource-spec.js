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
define([
    'ccc/def'
], function(def) {

    var EventSource = def.EventSource;

    function expectHandler(source, type, phase, handler) {
        var eventsStore = source.__eventz;
        expect(eventsStore instanceof Object).toBe(true);

        var eventStore = eventsStore[type];
        expect(eventStore instanceof Object).toBe(true);

        var pha = eventStore[phase];
        var i = pha.length;
        var hi;
        while(i--) {
            if(pha[i].handler === handler) {
                hi = pha[i];
                break;
            }
        }

        expect(hi != null).toBe(true);
    }

    function expectNotHandler(source, type, phase, handler) {
        var eventsStore = source.__eventz;
        if(eventsStore) {
            var eventStore = eventsStore[type];
            if(eventStore) {
                var pha = eventStore[phase];
                var i = pha.length;
                var hi;
                while(i--) {
                    if(pha[i].handler === handler) {
                        hi = pha[i];
                        break;
                    }
                }

                expect(hi != null).toBe(false);
            }
        }
    }

    // TODO: handler exceptions, on and off called during trigger

    describe("def.EventSource", function() {

        // Even though it is normally used as a mixin.
        describe("constructor -", function() {
            it("should be a function", function() {
                expect(typeof EventSource).toBe("function");
            });

            it("should return an instance of def.EventSource", function() {
                var source = new EventSource();
                expect(source instanceof EventSource).toBe(true);
            });
        });

        describe("#on(...) -", function() {
            it("should be present on an instance", function() {
                var source = new EventSource();
                expect(typeof source.on).toBe("function");
            });
        });

        describe("#on(type, handler) -", function() {
            it("should throw if given a nully `type` argument", function() {
                var source  = new EventSource(),
                    type    = null,
                    handler = function() {};

                expect(function() {
                    source.on(type, handler);
                }).toThrow();
            });

            it("should throw if given a nully `handler` argument", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    handler = null;

                expect(function() {
                    source.on(type, handler);
                }).toThrow();
            });

            it("should throw if given a `handler` argument that is not a function, an object or an array", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    handler = 1;

                expect(function() {
                    source.on(type, handler);
                }).toThrow();
            });

            it("should throw if given a `handler` object argument with a nully 'handler' property", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    handler = {};

                expect(function() {
                    source.on(type, handler);
                }).toThrow();
            });

            it("should return `this`", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    handler = function() {};

                var result = source.on(type, handler);

                expect(result).toBe(source);
            });

            it("should add a before handler to a given event name", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    phase   = "before",
                    handler = function() {};

                source.on(type, handler);

                expectHandler(source, type, phase, handler);
            });

            it("should preserve all other registered before handlers after being called", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    phase   = "before",
                    handler1 = function() {},
                    handler2 = function() {},
                    handler3 = function() {};

                source.on(type, handler1);
                source.on(type, handler2);
                source.on(type, handler3);

                expectHandler(source, type, phase, handler1);
                expectHandler(source, type, phase, handler2);
                expectHandler(source, type, phase, handler3);
            });
        });

        describe("#on(type, [h1, h2]) -", function() {
            it("should register many handlers for the same action type", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    phase   = "before",
                    handler1 = function() {},
                    handler2 = function() {},
                    handler3 = function() {};

                source.on(type, [handler1, handler2, handler3]);

                expectHandler(source, type, phase, handler1);
                expectHandler(source, type, phase, handler2);
                expectHandler(source, type, phase, handler3);
            });

            it("should register handlers for the same action type — function or object handlers", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    phase   = "before",
                    handler1 = function() {},
                    handler2 = {handler: function() {}, foo: 2},
                    handler3 = function() {};

                source.on(type, [handler1, handler2, handler3]);

                expectHandler(source, type, phase, handler1);
                expectHandler(source, type, phase, handler2.handler);
                expectHandler(source, type, phase, handler3);
            });
        });

        describe("#on([type1, type2], handler) -", function() {
            it("should register one handler for several action types", function() {
                var source  = new EventSource(),
                    type1   = "foo",
                    type2   = "bar",
                    phase   = "before",
                    handler = function() {};

                source.on([type1, type2], handler);

                expectHandler(source, type1, phase, handler);
                expectHandler(source, type2, phase, handler);
            });

            it("should register one handler for several action types — object handler", function() {
                var source  = new EventSource(),
                    type1   = "foo",
                    type2   = "bar",
                    phase   = "before",
                    handler = {handler: function() {}, foo: 2};

                source.on([type1, type2], handler);

                expectHandler(source, type1, phase, handler.handler);
                expectHandler(source, type2, phase, handler.handler);
            });
        });

        describe("#on([type1, type2], [h1, h2]) -", function() {
            it("should register several handlers for several action types", function() {
                var source  = new EventSource(),
                    type1   = "foo",
                    type2   = "bar",
                    phase   = "before",
                    handler1 = function() {},
                    handler2 = function() {},
                    handler3 = function() {};

                source.on([type1, type2], [handler1, handler2, handler3]);

                expectHandler(source, type1, phase, handler1);
                expectHandler(source, type1, phase, handler2);
                expectHandler(source, type1, phase, handler3);

                expectHandler(source, type2, phase, handler1);
                expectHandler(source, type2, phase, handler2);
                expectHandler(source, type2, phase, handler3);
            });

            it("should register several handlers for several action types — function or object handlers", function() {
                var source  = new EventSource(),
                    type1   = "foo",
                    type2   = "bar",
                    phase   = "before",
                    handler1 = function() {},
                    handler2 = {handler: function() {}, foo: 2},
                    handler3 = function() {};

                source.on([type1, type2], [handler1, handler2, handler3]);

                expectHandler(source, type1, phase, handler1);
                expectHandler(source, type1, phase, handler2.handler);
                expectHandler(source, type1, phase, handler3);

                expectHandler(source, type2, phase, handler1);
                expectHandler(source, type2, phase, handler2.handler);
                expectHandler(source, type2, phase, handler3);
            });
        });

        describe("#on({type1: h1, type2: h2}) -", function() {
            it("should register several handler/action-type pairs", function() {
                var source  = new EventSource(),
                    type1   = "foo",
                    type2   = "bar",
                    phase   = "before",
                    handler1 = function() {},
                    handler2 = function() {};

                var args = {};
                args[type1] = handler1;
                args[type2] = handler2;
                source.on(args);

                expectHandler(source, type1, phase, handler1);
                expectHandler(source, type2, phase, handler2);
            });

            it("should register several handler/action-type pairs — function or object handlers", function() {
                var source  = new EventSource(),
                    type1   = "foo",
                    type2   = "bar",
                    phase   = "before",
                    handler1 = function() {},
                    handler2 = {handler: function() {}, foo: 2};

                var args = {};
                args[type1] = handler1;
                args[type2] = handler2;
                source.on(args);

                expectHandler(source, type1, phase, handler1);
                expectHandler(source, type2, phase, handler2.handler);
            });

            it("should register several handler/action-type pairs — array handlers", function() {
                var source  = new EventSource(),
                    type1   = "foo",
                    type2   = "bar",
                    phase   = "before",
                    handler1 = function() {},
                    handler2 = {handler: function() {}, foo: 2},
                    handler3 = function() {};

                var args = {};
                args[type1] = handler1;
                args[type2] = [handler2, handler3];
                source.on(args);

                expectHandler(source, type1, phase, handler1);
                expectHandler(source, type2, phase, handler2.handler);
                expectHandler(source, type2, phase, handler3);
            });
        });

        describe("#before(...) -", function() {
            it("should be present on an instance", function() {
                var source = new EventSource();
                expect(typeof source.before).toBe("function");
            });
        });

        describe("#before(type, handler) -", function() {
            it("should return `this`", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    handler = function() {};

                var result = source.before(type, handler);

                expect(result).toBe(source);
            });

            it("should add a before handler to a given event name", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    phase   = "before",
                    handler = function() {};

                source.before(type, handler);

                expectHandler(source, type, phase, handler);
            });
        });

        describe("#after(...) -", function() {
            it("should be present on an instance", function() {
                var source = new EventSource();
                expect(typeof source.after).toBe("function");
            });
        });

        describe("#after(type, handler) -", function() {
            it("should throw if given a nully `type` argument", function() {
                var source  = new EventSource(),
                    type    = null,
                    handler = function() {};

                expect(function() {
                    source.after(type, handler);
                }).toThrow();
            });

            it("should throw if given a nully `handler` argument", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    handler = null;

                expect(function() {
                    source.after(type, handler);
                }).toThrow();
            });

            it("should throw if given a `handler` argument that is not a function, an object or an array", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    handler = 1;

                expect(function() {
                    source.after(type, handler);
                }).toThrow();
            });

            it("should throw if given a `handler` object argument with a nully 'handler' property", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    handler = {};

                expect(function() {
                    source.after(type, handler);
                }).toThrow();
            });

            it("should return `this`", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    handler = function() {};

                var result = source.after(type, handler);

                expect(result).toBe(source);
            });

            it("should add an after handler to a given event name", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    phase   = "after",
                    handler = function() {};

                source.after(type, handler);

                expectHandler(source, type, phase, handler);
            });

            it("should preserve all other registered after handlers after being called", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    phase   = "after",
                    handler1 = function() {},
                    handler2 = function() {},
                    handler3 = function() {};

                source.after(type, handler1);
                source.after(type, handler2);
                source.after(type, handler3);

                expectHandler(source, type, phase, handler1);
                expectHandler(source, type, phase, handler2);
                expectHandler(source, type, phase, handler3);
            });
        });

        describe("#off(...)", function() {
            it("should be present on an instance", function() {
                var source = new EventSource();
                expect(typeof source.off).toBe("function");
            });
        });

        describe("#off(type, handler) -", function() {
            it("should throw if given a nully `type` argument", function() {
                var source  = new EventSource(),
                    type    = null,
                    handler = function() {};

                expect(function() {
                    source.off(type, handler);
                }).toThrow();
            });

            it("should throw if given a `handler` argument that is not null, a function, an object or an array", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    handler = 1;

                expect(function() {
                    source.off(type, handler);
                }).toThrow();
            });

            it("should return `this`", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    handler = function() {};

                source.on(type, handler);

                var result = source.off(type, handler);

                expect(result).toBe(source);
            });

            it("should remove a before handler from a given event name", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    phase   = "before",
                    handler = function() {};

                source.on(type, handler);

                source.off(type, handler);

                expectNotHandler(source, type, phase, handler);
            });

            it("should preserve all other registered before handlers after being called", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    phase   = "before",
                    handler1 = function() {},
                    handler2 = function() {},
                    handler3 = function() {};

                source.on(type, handler1);
                source.on(type, handler2);
                source.on(type, handler3);

                source.off(type, handler2);

                expectHandler(source, type, phase, handler1);
                expectNotHandler(source, type, phase, handler2);
                expectHandler(source, type, phase, handler3);
            });

            it("should remove an after handler from a given event name", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    phase   = "after",
                    handler = function() {};

                source.after(type, handler);

                source.off(type, handler);

                expectNotHandler(source, type, phase, handler);
            });

            it("should preserve all other registered after handlers after being called", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    phase   = "after",
                    handler1 = function() {},
                    handler2 = function() {},
                    handler3 = function() {};

                source.after(type, handler1);
                source.after(type, handler2);
                source.after(type, handler3);

                source.off(type, handler2);

                expectHandler(source, type, phase, handler1);
                expectNotHandler(source, type, phase, handler2);
                expectHandler(source, type, phase, handler3);
            });

            it("should remove all handlers of a given event type when the handler is nully", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    handler1 = function() {},
                    handler2 = function() {},
                    handler3 = function() {};

                source.before(type, handler1);
                source.after (type, handler2);
                source.after (type, handler3);

                source.off(type);

                expectNotHandler(source, type, "before", handler1);
                expectNotHandler(source, type, "after",  handler2);
                expectNotHandler(source, type, "after",  handler3);
            });
        });

        describe("#_on(...)", function() {
            it("should not be present on an instance", function() {
                var source = new EventSource();
                expect(source._on).toBe(undefined);
            });
        });

        describe("#_on(type, hi, before) -", function() {
            it("should be called for each new before and after handler", function() {
                var source   = new EventSource(),
                    type     = "foo",
                    before   = function() {},
                    defExpr  = function() {},
                    after    = function() {},
                    ctx      = {},
                    args     = [];

                source._on = jasmine.createSpy().and.callFake(function(_type, hi, isBefore) {
                    expect(_type).toBe(type);
                    expect(hi instanceof Object).toBe(true);
                    expect(hi.handler ).toBe(before);
                    expect(hi._handler).toBe(before);
                    expect(hi._filter).toBe(null);
                    expect(isBefore).toBe(true);
                });

                source.before(type, before);

                source._on = jasmine.createSpy().and.callFake(function(_type, hi, isBefore) {
                    expect(_type).toBe(type);
                    expect(hi instanceof Object).toBe(true);
                    expect(hi.handler ).toBe(after);
                    expect(hi._handler).toBe(after);
                    expect(hi._filter).toBe(null);
                    expect(isBefore).toBe(false);
                });

                source.after(type, after);
            });

            it("should be called for each new before and after handler - on(type, multiple) syntax", function() {
                var source   = new EventSource(),
                    type     = "foo",
                    before1  = function() {},
                    before2  = function() {},
                    defExpr  = function() {},
                    after1   = function() {},
                    after2   = function() {},
                    ctx      = {},
                    args     = [];

                source._on = jasmine.createSpy().and.callFake(function(_type, hi, isBefore) {
                    expect(_type).toBe(type);
                    expect(hi instanceof Object).toBe(true);
                    expect(isBefore).toBe(true);
                    if(before1) {
                        expect(hi.handler).toBe(before1);
                        before1 = null;
                    } else if(before2) {
                        expect(hi.handler).toBe(before2);
                        before2 = null;
                    }
                });

                source.before(type, [before1, before2]);

                source._on = jasmine.createSpy().and.callFake(function(_type, hi, isBefore) {
                    expect(_type).toBe(type);
                    expect(hi instanceof Object).toBe(true);
                    expect(isBefore).toBe(false);
                    if(after1) {
                        expect(hi.handler).toBe(after1);
                        after1 = null;
                    } else if(after2) {
                        expect(hi.handler).toBe(after2);
                        after2 = null;
                    }
                });

                source.after(type, [after1, after2]);
            });
        });

        describe("#_off(...)", function() {
            it("should not be present on an instance", function() {
                var source = new EventSource();
                expect(source._off).toBe(undefined);
            });
        });

        describe("#_off(type, hi, before) -", function() {
            it("should be called for each removed before or after handler", function() {
                var source   = new EventSource(),
                    type     = "foo",
                    before   = function() {},
                    defExpr  = function() {},
                    after    = function() {},
                    ctx      = {},
                    args     = [];

                source.before(type, before);
                source.after (type, after);

                source._off = jasmine.createSpy().and.callFake(function(_type, hi, isBefore) {
                    expect(_type).toBe(type);
                    expect(hi instanceof Object).toBe(true);
                    expect(hi.handler).toBe(before);
                    expect(isBefore).toBe(true);
                });

                source.off(type, before);

                source._off = jasmine.createSpy().and.callFake(function(_type, hi, isBefore) {
                    expect(_type).toBe(type);
                    expect(hi instanceof Object).toBe(true);
                    expect(hi.handler).toBe(after);
                    expect(isBefore).toBe(false);
                });

                source.off(type, after);
            });

            it("should be called for each removed before or after handler - off(type, multiple) syntax", function() {
                var source   = new EventSource(),
                    type     = "foo",
                    before   = function() {},
                    defExpr  = function() {},
                    after    = function() {},
                    ctx      = {},
                    args     = [];

                source.before(type, before);
                source.after (type, after);

                source._off = jasmine.createSpy().and.callFake(function(_type, hi, isBefore) {
                    expect(_type).toBe(type);
                    expect(hi instanceof Object).toBe(true);

                    if(before) {
                        expect(hi.handler).toBe(before);
                        expect(isBefore).toBe(true);
                        before = null;
                    } else if(after) {
                        expect(hi.handler).toBe(after);
                        expect(isBefore).toBe(false);
                        after = null;
                    }
                });

                source.off(type, [before, after]);
            });
        });

        describe("#_acting(...) -", function() {
            it("should be present on an instance", function() {
                var source = new EventSource();
                expect(typeof source._acting).toBe("function");
            });
        });

        describe("#_acting(type, defExpr) -", function() {
            it("should throw if given a nully `type` argument", function() {
                var source  = new EventSource(),
                    type    = null,
                    handler = function() {};

                expect(function() {
                    source._acting(type, handler);
                }).toThrow();
            });

            it("should not throw if given a nully `defExpr` argument", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    handler = null;

                source._acting(type, handler);
            });

            it("should return null if there are no before or after handlers and no defExpr", function() {
                var source = new EventSource(),
                    type   = "foo";

                var result = source._acting(type);

                expect(result).toBe(null);
            });

            it("should return an event object if there is a before handler", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    beforeH = function() {};

                source.on(type, beforeH);

                var result = source._acting(type);

                expect(result instanceof Object).toBe(true);
            });

            it("should return an event object if there is an after handler", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    afterH  = function() {};

                source.on(type, afterH);

                var result = source._acting(type);

                expect(result instanceof Object).toBe(true);
            });

            it("should return an event object if a `defExpr` is specified", function() {
                var source  = new EventSource(),
                    type    = "foo",
                    defExpr = function() {};

                var result = source._acting(type, defExpr);

                expect(result instanceof Object).toBe(true);
            });
        });
    });

    // Event as returned by EventSource#_acting(...)
    describe("def.Event -", function() {
        describe("structure -", function() {
            var source  = new EventSource(),
                type    = "foo",
                defExpr = function() {},
                event   = source._acting(type, defExpr);

            it("should have the requested action type in the `type` property", function() {
                expect(event.type).toBe(type);
            });

            it("should have a `trigger` method", function() {
                expect(typeof event.trigger).toBe("function");
            });

            it("should have a `preventDefault` method", function() {
                expect(typeof event.preventDefault).toBe("function");
            });

            it("should have `phase` = `null`", function() {
                expect(event.phase).toBe(null);
            });

            it("should have `source` = the event source", function() {
                expect(event.source).toBe(source);
            });

            it("should have `defaultPrevented` = `false`", function() {
                expect(event.defaultPrevented).toBe(false);
            });

            it("should have `cancelable` = `false`", function() {
                expect(event.cancelable).toBe(false);
            });

            it("should have `result` = `undefined`", function() {
                expect('result' in event).toBe(true);
                expect(event.result).toBe(undefined);
            });
        });

        describe("#trigger(ctx, args)", function() {
            describe("order -", function() {
                it("should call all before handlers in registration order", function() {
                    var source   = new EventSource(),
                        type     = "foo",
                        defExpr  = function() {},
                        callId   = -1,
                        handlers = [
                            function() { handlers[0].callId = ++callId; },
                            function() { handlers[1].callId = ++callId; },
                            function() { handlers[2].callId = ++callId; }
                        ],
                        ctx      = source,
                        args     = [];

                    source.on(type, handlers[0]);
                    source.on(type, handlers[1]);
                    source.on(type, handlers[2]);

                    var event = source._acting(type, defExpr);
                    event.trigger(ctx, args);

                    expect(handlers[0].callId).toBe(0);
                    expect(handlers[1].callId).toBe(1);
                    expect(handlers[2].callId).toBe(2);
                });

                it("should call all after handlers in registration order", function() {
                    var source   = new EventSource(),
                        type     = "foo",
                        defExpr  = function() {},
                        callId   = -1,
                        handlers = [
                            function() { handlers[0].callId = ++callId; },
                            function() { handlers[1].callId = ++callId; },
                            function() { handlers[2].callId = ++callId; }
                        ],
                        ctx      = source,
                        args     = [];

                    source.after(type, handlers[0]);
                    source.after(type, handlers[1]);
                    source.after(type, handlers[2]);

                    var event = source._acting(type, defExpr);
                    event.trigger(ctx, args);

                    expect(handlers[0].callId).toBe(0);
                    expect(handlers[1].callId).toBe(1);
                    expect(handlers[2].callId).toBe(2);
                });

                it("should call the default expression function", function() {
                    var source  = new EventSource(),
                        type    = "foo",
                        defExpr = jasmine.createSpy("defExpr"),
                        ctx     = source,
                        args    = [];

                    var event = source._acting(type, defExpr);
                    event.trigger(ctx, args);

                    expect(defExpr).toHaveBeenCalled();
                });

                it("should call the before handlers, default expression and after handlers in order", function() {
                    var source  = new EventSource(),
                        type    = "foo",
                        callId  = -1,
                        defExpr = jasmine.createSpy("defExpr").and.callFake(function() { defExpr.callId = ++callId; }),
                        beforeH = jasmine.createSpy("beforeH").and.callFake(function() { beforeH.callId = ++callId; }),
                        afterH  = jasmine.createSpy("afterH" ).and.callFake(function() { afterH.callId  = ++callId; }),
                        ctx     = {},
                        args    = [];

                    source.before(type, beforeH);
                    source.after (type, afterH );

                    var event = source._acting(type, defExpr);
                    event.trigger(ctx, args);

                    expect(beforeH.callId).toBe(0);
                    expect(defExpr.callId).toBe(1);
                    expect(afterH .callId).toBe(2);
                });
            });

            describe("`this` and args -", function() {
                it("should call the before handlers, default expression and after handlers on the `ctx` object", function() {
                    var source  = new EventSource(),
                        type    = "foo",
                        defExpr = jasmine.createSpy("defExpr"),
                        beforeH = jasmine.createSpy("beforeH"),
                        afterH  = jasmine.createSpy("afterH"),
                        ctx     = {},
                        args    = [];

                    source.before(type, beforeH);
                    source.after (type, afterH );

                    var event = source._acting(type, defExpr);
                    event.trigger(ctx, args);

                    expect(defExpr.calls.first().object).toBe(ctx);
                    expect(beforeH.calls.first().object).toBe(ctx);
                    expect(afterH .calls.first().object).toBe(ctx);
                });

                it("should call the before handlers, default expression and after handlers with the provided arguments", function() {
                    var source  = new EventSource(),
                        type    = "foo",
                        defExpr = jasmine.createSpy("defExpr"),
                        beforeH = jasmine.createSpy("beforeH"),
                        afterH  = jasmine.createSpy("afterH"),
                        ctx      = {},
                        args     = [1, 2, 3];

                    source.before(type, beforeH);
                    source.after (type, afterH );

                    var event = source._acting(type, defExpr);
                    event.trigger(ctx, args);

                    expect(defExpr).toHaveBeenCalledWith(1, 2, 3);
                    expect(beforeH).toHaveBeenCalledWith(1, 2, 3);
                    expect(afterH ).toHaveBeenCalledWith(1, 2, 3);
                });

                it("should default the `ctx` to the event's source object", function() {
                    var source  = new EventSource(),
                        type    = "foo",
                        defExpr = jasmine.createSpy("defExpr"),
                        beforeH = jasmine.createSpy("beforeH"),
                        afterH  = jasmine.createSpy("afterH"),
                        ctx     = null,
                        args    = [];

                    source.before(type, beforeH);
                    source.after (type, afterH );

                    var event = source._acting(type, defExpr);
                    event.trigger(ctx, args);

                    expect(defExpr.calls.first().object).toBe(source);
                    expect(beforeH.calls.first().object).toBe(source);
                    expect(afterH .calls.first().object).toBe(source);
                });

                it("should default the args to the event object", function() {
                    var source  = new EventSource(),
                        type    = "foo",
                        defExpr = jasmine.createSpy("defExpr"),
                        beforeH = jasmine.createSpy("beforeH"),
                        afterH  = jasmine.createSpy("afterH"),
                        ctx      = {},
                        args     = null;

                    source.before(type, beforeH);
                    source.after (type, afterH );

                    var event = source._acting(type, defExpr);
                    event.trigger(ctx, args);

                    expect(defExpr).toHaveBeenCalledWith(event);
                    expect(beforeH).toHaveBeenCalledWith(event);
                    expect(afterH ).toHaveBeenCalledWith(event);
                });
            });

            describe("cancelation -", function() {
                it("should call all before handlers when the first before handler cancels the event", function() {
                    var source   = new EventSource(),
                        type     = "foo",
                        defExpr  = jasmine.createSpy("defExpr" ),
                        beforeH1 = jasmine.createSpy("beforeH1").and.callFake(function() { event.preventDefault(); }),
                        beforeH2 = jasmine.createSpy("beforeH2"),
                        afterH   = jasmine.createSpy("afterH"  ),
                        ctx      = {},
                        args     = [];

                    source.before(type, beforeH1);
                    source.before(type, beforeH2);
                    source.after (type, afterH );

                    var event = source._acting(type, defExpr);
                    event.cancelable = true;

                    event.trigger(ctx, args);

                    expect(beforeH1).toHaveBeenCalled();
                    expect(beforeH2).toHaveBeenCalled();
                });

                it("should not call the default expression or any of the after handlers when a before handler cancels the event", function() {
                    var source   = new EventSource(),
                        type     = "foo",
                        defExpr  = jasmine.createSpy("defExpr" ),
                        beforeH1 = jasmine.createSpy("beforeH1").and.callFake(function() { event.preventDefault(); }),
                        beforeH2 = jasmine.createSpy("beforeH2"),
                        afterH1  = jasmine.createSpy("afterH1" ),
                        afterH2  = jasmine.createSpy("afterH2" ),
                        ctx      = {},
                        args     = [];

                    source.before(type, beforeH1);
                    source.before(type, beforeH2);
                    source.after (type, afterH1);
                    source.after (type, afterH2);

                    var event = source._acting(type, defExpr);
                    event.cancelable = true;

                    event.trigger(ctx, args);

                    expect(beforeH1).toHaveBeenCalled();
                    expect(beforeH2).toHaveBeenCalled();
                    expect(defExpr ).not.toHaveBeenCalled();
                    expect(afterH1 ).not.toHaveBeenCalled();
                    expect(afterH2 ).not.toHaveBeenCalled();
                });

                it("should have event.defaultPrevented=true when the event is canceled", function() {
                    var source   = new EventSource(),
                        type     = "foo",
                        defExpr  = function() {},
                        beforeH1 = jasmine.createSpy("beforeH1").and.callFake(function() { event.preventDefault(); }),
                        ctx      = {},
                        args     = [];

                    source.before(type, beforeH1);
                    var event = source._acting(type, defExpr);
                    event.cancelable = true;

                    event.trigger(ctx, args);

                    expect(event.defaultPrevented).toBe(true);
                });

                it("should have event.defaultPrevented=false when the event is not canceled", function() {
                    var source   = new EventSource(),
                        type     = "foo",
                        defExpr  = function() {},
                        beforeH1 = jasmine.createSpy("beforeH1"),
                        ctx      = {},
                        args     = [];

                    source.before(type, beforeH1);
                    var event = source._acting(type, defExpr);
                    event.cancelable = true;

                    event.trigger(ctx, args);

                    expect(event.defaultPrevented).toBe(false);
                });

                it("should ignore cancelation when the event is not cancelable", function() {
                    var source   = new EventSource(),
                        type     = "foo",
                        defExpr  = jasmine.createSpy("defExpr" ),
                        beforeH1 = jasmine.createSpy("beforeH1").and.callFake(function() { event.preventDefault(); }),
                        beforeH2 = jasmine.createSpy("beforeH2"),
                        afterH1  = jasmine.createSpy("afterH1" ),
                        afterH2  = jasmine.createSpy("afterH2" ),
                        ctx      = {},
                        args     = [];

                    source.before(type, beforeH1);
                    source.before(type, beforeH2);
                    source.after (type, afterH1);
                    source.after (type, afterH2);

                    var event = source._acting(type, defExpr);

                    event.trigger(ctx, args);

                    expect(beforeH1).toHaveBeenCalled();
                    expect(beforeH2).toHaveBeenCalled();
                    expect(defExpr ).toHaveBeenCalled();
                    expect(afterH1 ).toHaveBeenCalled();
                    expect(afterH2 ).toHaveBeenCalled();
                });

                it("should have event.defaultPrevented=false when the event is not cancelable and is canceled", function() {
                    var source   = new EventSource(),
                        type     = "foo",
                        defExpr  = function() {},
                        beforeH1 = jasmine.createSpy("beforeH1").and.callFake(function() { event.preventDefault(); }),
                        ctx      = {},
                        args     = [];

                    source.before(type, beforeH1);
                    var event = source._acting(type, defExpr);

                    event.trigger(ctx, args);

                    expect(event.defaultPrevented).toBe(false);
                });
            });

            describe("phase -", function() {
                it("should have event.phase='before' during before handler calls", function() {
                    var source   = new EventSource(),
                        type     = "foo",
                        defExpr  = jasmine.createSpy("defExpr" ),
                        expectPhase = function() { expect(event.phase).toBe("before"); },
                        beforeH1 = jasmine.createSpy("beforeH1").and.callFake(expectPhase),
                        beforeH2 = jasmine.createSpy("beforeH2").and.callFake(expectPhase),
                        ctx      = {},
                        args     = [];

                    source.before(type, beforeH1);
                    source.before(type, beforeH2);

                    var event = source._acting(type, defExpr);
                    event.trigger(ctx, args);

                    expect(beforeH1).toHaveBeenCalled();
                });

                it("should have event.phase='default' during default expression calls", function() {
                    var source   = new EventSource(),
                        type     = "foo",
                        expectPhase = function() { expect(event.phase).toBe("default"); },
                        defExpr  = jasmine.createSpy("defExpr" ).and.callFake(expectPhase),
                        beforeH1 = jasmine.createSpy("beforeH1"),
                        ctx      = {},
                        args     = [];

                    source.before(type, beforeH1);

                    var event = source._acting(type, defExpr);
                    event.cancelable = true;

                    event.trigger(ctx, args);

                    expect(beforeH1).toHaveBeenCalled();
                    expect(defExpr ).toHaveBeenCalled();
                });

                it("should have event.phase='after' during after handler calls", function() {
                    var source   = new EventSource(),
                        type     = "foo",
                        defExpr  = jasmine.createSpy("defExpr" ),
                        expectPhase = function() { expect(event.phase).toBe("after"); },
                        afterH1  = jasmine.createSpy("afterH1").and.callFake(expectPhase),
                        afterH2  = jasmine.createSpy("afterH2").and.callFake(expectPhase),
                        ctx      = {},
                        args     = [];

                    source.after(type, afterH1);
                    source.after(type, afterH2);

                    var event = source._acting(type, defExpr);
                    event.trigger(ctx, args);

                    expect(afterH1).toHaveBeenCalled();
                });

                it("should have event.phase='done' after the event has been triggered", function() {
                    var source  = new EventSource(),
                        type    = "foo",
                        defExpr = function() {},
                        before  = function() {},
                        after   = function() {},
                        ctx     = {},
                        args    = [];

                    source.before(type, before);
                    source.after (type, after );

                    var event = source._acting(type, defExpr);
                    event.trigger(ctx, args);

                    expect(event.phase).toBe("done");
                });

                it("should throw if #trigger is called twice", function() {
                    var source  = new EventSource(),
                        type    = "foo",
                        defExpr = function() {},
                        ctx     = {},
                        args    = [];

                    var event = source._acting(type, defExpr);
                    event.trigger(ctx, args);

                    expect(function() {
                        event.trigger(ctx, args);
                    }).toThrow();
                });
            });

            describe("result -", function() {
                it("should return `undefined` when canceled", function() {
                    var source   = new EventSource(),
                        type     = "foo",
                        before   = function() { event.preventDefault(); return 0; },
                        defExpr  = function() { return 1; },
                        after    = function() { return 2; },
                        ctx      = {},
                        args     = [];

                    source.before(type, before);
                    source.after (type, after );

                    var event = source._acting(type, defExpr);
                    event.cancelable = true;

                    var result = event.trigger(ctx, args);

                    expect(result).toBe(undefined);
                    expect(event.result).toBe(result);
                });

                it("should return the value returned by the default expression when not canceled", function() {
                    var source   = new EventSource(),
                        type     = "foo",
                        before   = function() { return 0; },
                        defExpr  = function() { return 1; },
                        after    = function() { return 2; },
                        ctx      = {},
                        args     = [];

                    source.before(type, before);
                    source.after (type, after );

                    var event = source._acting(type, defExpr);

                    var result = event.trigger(ctx, args);

                    expect(result).toBe(1);
                    expect(event.result).toBe(result);
                });

                it("should return `undefined` when there is no default expression", function() {
                    var source   = new EventSource(),
                        type     = "foo",
                        before   = function() { return 0; },
                        after    = function() { return 2; },
                        ctx      = {},
                        args     = [];

                    source.before(type, before);
                    source.after (type, after );

                    var event = source._acting(type);

                    var result = event.trigger(ctx, args);

                    expect(result).toBe(undefined);
                    expect(event.result).toBe(result);
                });
            });

            describe("filter -", function() {
                it("should call only before handlers that pass the filter", function() {
                    var source   = new EventSource(),
                        type     = "foo",
                        handlers = [
                            {handler: function() {}, shouldRun: true },
                            {handler: function() {}, shouldRun: false},
                            {handler: function() {}, shouldRun: true }
                        ],
                        ctx      = source,
                        args     = [];

                    source._on = function(type, hi, before) {
                        hi._filter = function() { return hi.shouldRun; };
                    };

                    spyOn(handlers[0], "handler");
                    spyOn(handlers[1], "handler");
                    spyOn(handlers[2], "handler");

                    source.on(type, handlers[0]);
                    source.on(type, handlers[1]);
                    source.on(type, handlers[2]);

                    var event = source._acting(type);
                    event.trigger(ctx, args);

                    expect(handlers[0].handler).toHaveBeenCalled();
                    expect(handlers[1].handler).not.toHaveBeenCalled();
                    expect(handlers[2].handler).toHaveBeenCalled();
                });

                it("should call only after handlers that pass the filter", function() {
                    var source   = new EventSource(),
                        type     = "foo",
                        handlers = [
                            {handler: function() {}, shouldRun: true },
                            {handler: function() {}, shouldRun: false},
                            {handler: function() {}, shouldRun: true }
                        ],
                        ctx      = source,
                        args     = [];

                    source._on = function(type, hi, before) {
                        hi._filter = function() { return hi.shouldRun; };
                    };

                    spyOn(handlers[0], "handler");
                    spyOn(handlers[1], "handler");
                    spyOn(handlers[2], "handler");

                    source.after(type, handlers[0]);
                    source.after(type, handlers[1]);
                    source.after(type, handlers[2]);

                    var event = source._acting(type);
                    event.trigger(ctx, args);

                    expect(handlers[0].handler).toHaveBeenCalled();
                    expect(handlers[1].handler).not.toHaveBeenCalled();
                    expect(handlers[2].handler).toHaveBeenCalled();
                });
            });

            describe("handler interception -", function() {
                it("should call the handler set in the #_on method, in #_handler, and have the original in #handler", function() {
                    var source  = new EventSource(),
                        type    = "foo",
                        handler = function() {},
                        interceptor = jasmine.createSpy("interceptor"),
                        ctx     = source,
                        args    = [];

                    source._on = function(type, hi, before) {
                        expect(hi.handler).toBe(handler);
                        hi._handler = interceptor;
                    };

                    source.on(type, handler);

                    var event = source._acting(type);
                    event.trigger(ctx, args);

                    expect(interceptor).toHaveBeenCalled();
                });
            });
        });
    });
});
