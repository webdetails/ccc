
pvc.castNumber = function(value) {
    if(value != null) {
        value = +value; // to number
        if(isNaN(value)) value = null;
    }

    return value;
};

pvc.castPositiveNumber = function(value) {
    value = pvc.castNumber(value);
    if(value != null && !(value > 0)) value = null;
    return value;
};

pvc.castNonNegativeNumber = function(value) {
    value = pvc.castNumber(value);
    if(value != null && value < 0) value = null;
    return value;
};

