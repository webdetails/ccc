
/**
 * Initializes a legend bullet item scene.
 * 
 * @name pvc.visual.legend.BulletItemScene
 * 
 * @extends pvc.visual.legend.Scene
 * 
 * @constructor
 * @param {pvc.visual.legend.BulletGroupScene} bulletGroup The parent legend bullet group scene.
 * @param {object} [keyArgs] Keyword arguments.
 * See {@link pvc.visual.Scene} for supported keyword arguments.
 */
def
.type('pvc.visual.legend.BulletItemScene', pvc.visual.Scene)
.init(function(bulletGroup, keyArgs){
    
    this.base(bulletGroup, keyArgs);
    
    var value, rawValue, label;
    if(keyArgs){
        value    = keyArgs.value;
        rawValue = keyArgs.rawValue;
        label    = keyArgs.label;
    }
    
    if(value === undefined){
        var source = this.group || this.datum;
        if(source){
            value    = source.value;
            rawValue = source.rawValue;
            label    = source.ensureLabel();
            
            // This is to catch trend lines...
            // Standard data source data parts are numbers, 
            // so this shows the non-standard data part label
            // after the item's label:
            // 'Lisbon (Linear trend)'  
            var dataPartDim = this.chart()._getDataPartDimName();
            if(dataPartDim){
                var dataPartAtom = source.atoms[dataPartDim];
                if(isNaN(+dataPartAtom.value)){
                    label += " (" + dataPartAtom.label + ")";
                }
            }
        }
    }
    
    this.vars.value = new pvc.visual.ValueLabelVar(value || null, label || "", rawValue);
})
.add(/** @lends pvc.visual.legend.BulletItemScene# */{
    /**
     * Called during legend render (full or interactive) 
     * to determine if the item is in the "on" state.
     * <p>
     * An item in the "off" state is shown with brighter struck-through text, by default.
     * </p>
     * 
     * <p>
     * The default implementation returns <c>true</c>.
     * </p>
     * 
     * @type boolean
     */
    isOn:  function(){
        return true;
    },
    
    /**
     * Called during legend render (full or interactive) 
     * to determine if the item can be clicked.
     * <p>
     * A clickable item shows a hand mouse cursor when the mouse is over it.
     * </p>
     * <p>
     * The default implementation returns <c>false</c>.
     * </p>
     * 
     * @type boolean
     */
    isClickable: function(){
        return false;
    },
    
    /**
     * Called when the user clicks the legend item.
     * <p>
     * The default implementation does nothing.
     * </p>
     */
    click: function(){
        // NOOP
    },
    
    /**
     * Measures the item label's text and returns an object
     * with 'width' and 'height' properties, in pixels.
     * <p>A nully value may be returned to indicate that there is no text.</p>
     * 
     * @type object
     */
    labelTextSize: function(){
        var valueVar = this.vars.value;
        return valueVar && pv.Text.measure(valueVar.label, this.vars.font);
    }
});
