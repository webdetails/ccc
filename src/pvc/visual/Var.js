def.scope(function(){

    /**
     * Initializes a scene variable.
     *
     * @name pvc.visual.ValueLabelVar
     * @class A scene variable holds the concrete value that
     * a {@link pvc.visual.Role} or other relevant piece of information
     * has in a {@link pvc.visual.Scene}.
     * Usually, it also contains a label that describes it.
     *
     * @constructor
     * @param {any} value The value of the variable.
     * @param {any} label The label of the variable.
     * @param {any} [rawValue] The raw value of the variable.
     */
    var ValueLabelVar = pvc.visual.ValueLabelVar = function(value, label, rawValue){
        this.value = value;
        this.label = label;

        if(rawValue !== undefined){
            this.rawValue = rawValue;
        }
    };

    def.set(
        ValueLabelVar.prototype,
        'rawValue', undefined,
        'clone',    function(){
            return new pvc.visual.ValueLabelVar(this.value, this.label, this.rawValue);
        },
        'toString', function(){
            var label = this.label || this.value;
            return label == null ? "" :
                   (typeof label !== 'string') ? ('' + label) :
                   label;
        });

    ValueLabelVar.fromComplex = function(complex){
        return complex ?
               new pvc.visual.ValueLabelVar(complex.value, complex.label, complex.rawValue) :
               new pvc.visual.ValueLabelVar(null, "", null)
               ;
    };

    ValueLabelVar.fromAtom = ValueLabelVar.fromComplex;
});