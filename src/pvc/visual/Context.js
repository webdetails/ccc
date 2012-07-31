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
 * @param {object} [event] An event object.
 */
def.type('pvc.visual.Context')
.init(function(panel, mark, event){
    this.chart = panel.chart;
    this.panel = panel;
    
    visualContext_update.call(this, mark, event);
})
.add(/** @lends pvc.visual.Context */{
    
    /* V1 DIMENSION ACCESSORS */
    getV1Series: function(){
        var s;
        return this.scene.atoms && (s = this.scene.atoms[this.panel._getV1DimName('series')]) && s.rawValue;
    },
    
    getV1Category: function(){
        var c;
        return this.scene.atoms && (c = this.scene.atoms[this.panel._getV1DimName('category')]) && c.rawValue;
    },
               
    getV1Value: function(){
        var v;
        return this.scene.atoms && (v = this.scene.atoms[this.panel._getV1DimName('value')]) && v.value;
    }
});

/**
 * Used internally to update a visual context.
 * 
 * @name pvc.visual.Context#_update
 * @function
 * @param {pv.Mark} mark The protovis mark being rendered or targeted by an event.
 * @param {object} [event] An event object.
 * @type undefined
 * @private
 * @virtual
 * @internal
 */
function visualContext_update(mark, event){

    this.sign   = mark.sign || null;
    this.event  = event || null;
    this.index  = mark.index; // !scene => index = null
    this.pvMark = mark;

    var instance = mark.instance(),
        scene = instance.scene;
    
    if(!scene){
        var group = instance.group,
            datum = group ? null : instance.datum;
        
        scene = new pvc.visual.Scene(null, {
            panel: this.panel,
            group: group,
            datum: datum
        });
    }

    this.scene = scene;
}