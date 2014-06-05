/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Initializes a visual context.
 * 
 * @name pvc.visual.Context
 * 
 * @class Represents a visualization context.  
 * The visualization context gives access to all relevant information
 * for rendering or interacting with a visualization.
 * <p>
 * A visualization context object <i>may</i> be reused
 * across extension points invocations and actions.
 * </p>
 * 
 * @property {pvc.BaseChart} chart The chart instance.
 * @property {pvc.BasePanel} panel The panel instance.
 * @property {number} index The render index.
 * @property {pvc.visual.Scene} scene The render scene.
 * @property {object} event An event object, present when a click or double-click action is being processed.
 * @property {pv.Mark} pvMark The protovis mark.
 * 
 * @constructor
 * @param {pvc.BasePanel} panel The panel instance.
 * @param {pv.Mark} mark The protovis mark.
 * @param {pvc.visual.Scene} [scene] A scene object.
 */
def.type('pvc.visual.Context')
.init(function(panel, mark, scene) {
    this.chart = panel.chart;
    this.panel = panel;
    
    visualContext_update.call(this, mark, scene);
})
.add(/** @lends pvc.visual.Context */{
    isPinned: false,
    
    pin: function() {
        this.isPinned = true;
        return this;
    },
    
    compatVersion: function() { return this.panel.compatVersion(); },
    
    finished: function(v ) { return this.sign.finished(v ); },
    delegate: function(dv) { return this.sign.delegate(dv); },
    
    /* V1 DIMENSION ACCESSORS */
    getV1Series: function() {
        var s;
        return def.nullyTo(
                this.scene.firstAtoms && (s = this.scene.firstAtoms[this.panel._getV1DimName('series')]) && s.rawValue,
                'Series');
    },
    
    getV1Category: function() {
        var c;
        return this.scene.firstAtoms && (c = this.scene.firstAtoms[this.panel._getV1DimName('category')]) && c.rawValue;
    },
               
    getV1Value: function() {
        var v;
        return this.scene.firstAtoms && (v = this.scene.firstAtoms[this.panel._getV1DimName('value')]) && v.value;
    },
    
    getV1Datum: function() { return this.panel._getV1Datum(this.scene); },
    
    // Sugar for most used scene vars
    get: function(name, prop) { return this.scene.get(name, prop); },

    getSeries:   function() { return this.scene.get('series');   },
    getCategory: function() { return this.scene.get('category'); },
    getValue:    function() { return this.scene.get('value');    }, // Also in legend
    getTick:     function() { return this.scene.get('tick');     }, // Axis panels
    getX:        function() { return this.scene.get('x');        },
    getY:        function() { return this.scene.get('y');        },
    getColor:    function() { return this.scene.get('color');    },
    getSize:     function() { return this.scene.get('size');     },

    getSeriesLabel:   function() { return this.scene.get('series',   'label'); },
    getCategoryLabel: function() { return this.scene.get('category', 'label'); },
    getValueLabel:    function() { return this.scene.get('value',    'label'); }, // Also in legend
    getTickLabel:     function() { return this.scene.get('tick',     'label'); }, // Axis panels
    getXLabel:        function() { return this.scene.get('x',        'label'); },
    getYLabel:        function() { return this.scene.get('y',        'label'); },
    getColorLabel:    function() { return this.scene.get('color',    'label'); },
    getSizeLabel:     function() { return this.scene.get('size',     'label'); },

    // ---------------

    select:        function(ka) { return this.scene.select(ka); },
    toggleVisible: function(  ) { return this.scene.toggleVisible(); },
    
    /* EVENT HANDLERS */
    click: function() {
        var me = this;
        if(me.clickable()) me.panel._onClick(me);
        
        if(me.selectableByClick()) {
            var ev = me.event;
            me.select({replace: !ev || !ev.ctrlKey});
        }
    },
    
    doubleClick: function() { if(this.doubleClickable()) this.panel._onDoubleClick(this); },
    
    /* Interactive Stuff */
    clickable: function() {
        var me = this;
        return (me.sign ? me.sign.clickable() : me.panel.clickable()) &&
               (!me.scene || me.scene.clickable());
    },
    
    selectableByClick: function() {
        var me = this;
        return (me.sign ? me.sign.selectableByClick() : me.panel.selectableByClick()) &&
               (!me.scene || me.scene.selectableByClick());
    },
    
    doubleClickable: function() {
        var me = this;
        return (me.sign ? me.sign.doubleClickable() : me.panel.doubleClickable()) &&
               (!me.scene || me.scene.doubleClickable());
    },
    
    hoverable: function() {
        var me = this;
        return (me.sign ? me.sign.hoverable() : me.panel.hoverable()) &&
               (!me.scene || me.scene.hoverable());
    }
});

if(Object.defineProperty) {
    try {
        Object.defineProperty(pvc.visual.Context.prototype, 'parent', {
            get: function() {
                throw def.error.operationInvalid("The 'this.parent.index' idiom has no equivalent in this version. Please try 'this.pvMark.parent.index'.");
            }
        });
    } catch(ex) {
        /* IE THROWS */
    }
}

/**
 * Used internally to update a visual context.
 * 
 * @name pvc.visual.Context#_update
 * @function
 * @param {pv.Mark} [pvMark] The protovis mark being rendered or targeted by an event.
 * @param {pvc.visual.Scene} [scene] A scene object.
 * @type undefined
 * @private
 * @virtual
 * @internal
 */
function visualContext_update(pvMark, scene) {

    this.event  = pv.event;
    this.pvMark = pvMark;
    
    if(pvMark) {
        var sign = this.sign = pvMark.sign || null;
        if(!scene && sign) scene = sign.scene();
        
        if(!scene) {
            this.index = null;
            scene = new pvc.visual.Scene(null, {panel: this.panel});
        } else {
            this.index = scene.childIndex();
        }
    } else {
        this.sign  = null;
        this.index = null;
        
        scene = new pvc.visual.Scene(null, {
            panel:  this.panel,
            source: this.chart.root.data
        });
    }
    
    this.scene = scene;
}
