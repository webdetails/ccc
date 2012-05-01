/**
 * Initializes a visual context.
 * 
 * @name pvc.visual.Context
 * 
 * @class Represents a visualization context.  
 * The visualization context should give access to all relevant information
 * for rendering or for interacting with a visualization.
 * <p>
 * Its main goal is to support marks' extensions points and action handlers. 
 * </p>
 * <p>
 * The visualization context of a panel <i>may</i> be reused 
 * across extension points invocations and actions. 
 * </p>
 * 
 * @property {pvc.BaseChart} chart The chart instance.
 * @property {pvc.BasePanel} panel The panel instance.
 * @property {pv.Mark} mark The protovis mark.
 * @property {number} index The current rendering index. Only defined during extension points evaluation.
 * @property {object} event An event object, present when a click or double-click action is being processed.
 * @property {pvc.data.Data}  group The data instance associated with the mark.
 * @property {pvc.data.Datum} datum The datum associated with the mark.
 * @property {object} atoms The map of atoms by dimension name.
 * <p>
 * Do <b>NOT</b> modify this object.
 * </p>
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
    /**
     * Obtains an enumerable of the datums of the context.
     * <p>
     * Do <b>NOT</b> modify the returned array.
     * </p>
     * 
     * @type def.Query
     */
    datums: function(){
        return this.datum ? 
                    def.query(this.datum) : 
                    (this.group ? this.group.datums() : def.query());
    },
    
    /* LEGACY DIMENSION ACCESSORS */
    getSeries: function(){
        var s;
        return this.atoms && (s = this.atoms[this.panel._getLegacyDimName('series')]) && s.rawValue;
    },
    
    getCategory: function(){
        var c;
        return this.atoms && (c = this.atoms[this.panel._getLegacyDimName('category')]) && c.rawValue;
    },
               
    getValue: function(){
        var v;
        return this.atoms && (v = this.atoms[this.panel._getLegacyDimName('value')]) && v.value;
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
    
    var instance = mark.instance(),
        datum = instance.datum,
        group = instance.group,
        atoms;
    
    // datum /=> group
    // group => datum
    // or both or none
    
    if(!datum) {
        if(group) {
            datum = group._datums[0];
            atoms = group.atoms;
        }
    } else {
        atoms = datum.atoms;
    }
    
    this.event = event || null;
    this.mark  = mark;
    this.index = mark.index;
    this.datum = datum;
    this.group = group;
    this.atoms = atoms;
}