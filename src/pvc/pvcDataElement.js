
pvc.DataElement = function(dimension, key, parent, leafIndex){
    if(!parent){
        // Parent is a dummy root
        key = null;
    }

    pv.Dom.Node.call(this, key);
    //this.nodeValue = key; // base constructor does this
    this.dimension = dimension;
    this.value     = key;
    this.nodeName  = key || "";
    this.childNodesByKey = {};

    // NOTE: Unfortunately 'index' is already taken by the base class
    // and, when filled, its value is the PRE-ORDER DFS order!
    this.leafIndex = leafIndex;
    
    if(!parent){
        this.path     = [];
        this.absValue = null;
        this.label    = "";
        this.absLabel = "";
    } else {
        this.path     = parent.path.concat(key);
        this.absValue = pvc.join("~", parent.absValue, key);
        this.label    = "" + (dimension._calcLabel ? dimension._calcLabel(key) : key);
        this.absLabel = pvc.join(" ~ ", parent.absLabel, this.label);

        parent.appendChild(this);
        parent.childNodesByKey[key] = this;
    }
};

pvc.DataElement.prototype = new pv.Dom.Node();
pvc.DataElement.prototype.constructor = pvc.DataElement;

pvc.DataElement.prototype.toString = function(){
    return this.value;
};