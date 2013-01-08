def
.type('pvc.Abstract')
.add({
    invisibleLineWidth: 0.001,
    defaultLineWidth:   1.5,
    
    _logInstanceId: null,
    
    _getLogInstanceId: function(){
        return this._logInstanceId || 
               (this._logInstanceId = this._processLogInstanceId(this._createLogInstanceId()));
    },
    
    _createLogInstanceId: function(){
        return '' + this.constructor;
    },
    
    _processLogInstanceId: function(logInstanceId){
        var L = 30;
        var s = logInstanceId.substr(0, L);
        if(s.length < L){
            s += def.array.create(L - s.length, ' ').join('');
        }
        
        return "[" + s + "]";
    },
    
    _log: function(m){
        if (pvc.debug && typeof console !== "undefined"){
            /*global console:true*/
            console.log(
               this._getLogInstanceId() + ": " +  
              (typeof m === 'string' ? m : pvc.stringify(m)));
        }
    }
});
