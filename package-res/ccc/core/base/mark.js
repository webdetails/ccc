
var pv_Mark = pv.Mark;

// Z-Order

// Backup original method
var pvc_markZOrder = pv_Mark.prototype.zOrder;

pv_Mark.prototype.zOrder = function(zOrder) {
    var borderPanel = this.borderPanel;
    return (borderPanel && borderPanel !== this)
        ? pvc_markZOrder.call(borderPanel, zOrder)
        : pvc_markZOrder.call(this, zOrder);
};

// PROPERTIES
pv_Mark.prototype.wrapper = function(wrapper) {
    this._wrapper = wrapper;
    return this;
};

pv_Mark.prototype.wrap = function(f, m) {
    if(f && def.fun.is(f) && this._wrapper && !f._cccWrapped) {
        f = this._wrapper(f, m);
        f._cccWrapped = true;
    }
    return f;
};

// Like https://github.com/mbostock/d3/wiki/Selections#call
// for allowing general extension through extension points.
pv.Mark.prototype.call = function(f) {
    f.call(this, this);
};

pv_Mark.prototype.lock = function(prop, value) {
    if(value !== undefined) this[prop](value);
    (this._locked || (this._locked = {}))[prop] = true;
    return this;
};

pv_Mark.prototype.isIntercepted = function(prop) {
    return this._intercepted && this._intercepted[prop];
};

pv_Mark.prototype.isLocked = function(prop) {
    return this._locked && this._locked[prop];
};

pv_Mark.prototype.ensureEvents = function(defEvs) {
    // labels and other marks don't receive events by default
    var events = this.propertyValue('events', /*inherit*/ true);
    if(!events || events === 'none') this.events(defEvs || 'all');
    return this;
};

// ANCHORS
// name = left | right | top | bottom
pv_Mark.prototype.addMargin = function(name, margin) {
    if(margin !== 0) {
        var staticValue = def.nullyTo(this.propertyValue(name), 0),
            fMeasure    = pv.functor(staticValue);

        this[name](function() {
            return margin + fMeasure.apply(this, pvc_arraySlice.call(arguments));
        });
    }

    return this;
};

// margins = {
//      all:
//      left:
//      right:
//      top:
//      bottom:
// }
pv_Mark.prototype.addMargins = function(margins) {
    var all = def.get(margins, 'all', 0);

    this.addMargin('left',   def.get(margins, 'left',   all));
    this.addMargin('right',  def.get(margins, 'right',  all));
    this.addMargin('top',    def.get(margins, 'top',    all));
    this.addMargin('bottom', def.get(margins, 'bottom', all));

    return this;
};

// SCENE
pv_Mark.prototype.eachInstanceWithData = function(fun, ctx) {
    this.eachInstance(function(scenes, index, t) {
        if(scenes.mark.sign && scenes[index].data) fun.call(ctx, scenes, index, t);
    });
};

pv_Mark.prototype.eachSceneWithDataOnRect = function(rect, fun, ctx, selectionMode) {
    var me   = this;
    var sign = me.sign;
    if(sign && !sign.selectable()) ßreturn; // TODO: shouldn't it be selectableByRubberband?

    // center, partial and total (not implemented)
    if(selectionMode == null) selectionMode = me.rubberBandSelectionMode || 'partial';

    var useCenter = (selectionMode === 'center');

    me.eachInstanceWithData(function(scenes, index, toScreen) {
        // Apply size reduction to tolerate user unprecise selections
        var shape = me.getShape(scenes, index, /*inset margin each side*/0.15);

        shape = (useCenter ? shape.center() : shape).apply(toScreen);

        processShape(shape, scenes[index]);
    });

    function processShape(shape, instance) {
        if(shape.intersectsRect(rect)) {
            var cccScene = instance.data; // exists for sure (ensured by eachInstanceWithData)
            if(cccScene && cccScene.datum) fun.call(ctx, cccScene);
        }
    }
};

pv_Mark.prototype.eachDatumOnRect = function(rect, fun, ctx, selectionMode) {
    var me   = this;
    var sign = me.sign;
    if(sign && !sign.selectable()) return;

    // center, partial and total (not implemented)
    if(selectionMode == null) selectionMode = me.rubberBandSelectionMode || 'partial';

    var useCenter = (selectionMode === 'center');

    me.eachInstanceWithData(function(scenes, index, toScreen) {
        // Apply size reduction to tolerate user unprecise selections
        var shape = me.getShape(scenes, index, /*inset margin each side*/0.15);

        shape = (useCenter ? shape.center() : shape).apply(toScreen);

        processShape(shape, scenes[index]);
    });

    function processShape(shape, instance) {
        if(shape.intersectsRect(rect)) {
            var cccScene = instance.data; // exists for sure (ensured by eachInstanceWithData)
            if(cccScene && cccScene.datum)
                cccScene.datums().each(function(datum) { if(!datum.isNull) fun.call(ctx, datum); });
        }
    }
};

// BOUNDS
pv.Transform.prototype.transformHPosition = function(left) {
    return this.x + (this.k * left);
};

pv.Transform.prototype.transformVPosition = function(top) {
    return this.y + (this.k * top);
};

// width / height
pv.Transform.prototype.transformLength = function(length) {
    return this.k * length;
};

// -----------------

pv.Format.createParser = function(pvFormat) {

    function parse(value) {
        return (value instanceof Date) ? value :
            def.number.is(value)    ? new Date(value) :
                pvFormat.parse(value);
    }

    return parse;
};

pv.Format.createFormatter = function(format) {

    function safeFormat(value) { return value != null ? format(value) : ""; }

    return safeFormat;
};

// -------------------


pv.Color.prototype.stringify = function(out, remLevels, keyArgs) {
    return pvc.stringifyRecursive(out, this.key, remLevels, keyArgs);
};

pv_Mark.prototype.hasDelegateValue = function(name, tag) {
    var p = this.$propertiesMap[name];
    return p
        ? (!tag || p.tag === tag)
        // This mimics the way #bind works
        : (!!this.proto && this.proto.hasDelegateValue(name, tag));
};