var pvc_PercentValue = pvc.PercentValue = function(pct) {
    this.percent = pct;
};

pvc_PercentValue.prototype.resolve = function(total) {
    return this.percent * total;
};

pvc_PercentValue.prototype.divide = function(divisor) {
    return new pvc_PercentValue(this.percent / divisor);
};

pvc_PercentValue.divide = function(value, divisor) {
    return (value instanceof pvc_PercentValue)
        ? value.divide(divisor)
        : (value / divisor);
};

pvc_PercentValue.parse = function(value) {
    if(value != null && value !== '') {
        switch(typeof value) {
            case 'number': return value;
            case 'string':
                var match = value.match(/^(.+?)\s*(%)?$/);
                if(match) {
                    var n = +match[1];
                    if(!isNaN(n)) {
                        if(match[2])
                            if(n >= 0) return new pvc_PercentValue(n / 100);
                        else
                            return n;
                    }
                }
                break;

            case 'object':
                if(value instanceof pvc_PercentValue) return value;
                break;
        }

        if(pvc.debug) pvc.log(def.format("Invalid margins component '{0}'", [''+value]));
    }
};

pvc_PercentValue.resolve = function(value, total) {
    return (value instanceof pvc_PercentValue) ? value.resolve(total) : value;
};