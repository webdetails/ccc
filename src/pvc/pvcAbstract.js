def
.type('pvc.Abstract')
.init(function(){
    this._syncLog();
})
.add({
    invisibleLineWidth: 0.001,
    defaultLineWidth:   1.5,
    
    _logInstanceId: null,
    
    _syncLog: function(){
        if (pvc.debug && typeof console !== "undefined"){
            var logId = this._getLogInstanceId();
            
            ['log', 'info', ['trace', 'debug'], 'error', 'warn', 'group', 'groupEnd'].forEach(function(ps){
                ps = ps instanceof Array ? ps : [ps, ps];
                
                pvc._installLog(this, '_' + ps[0],  ps[1], logId);
            }, this);
        }
    },

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
    }
});

def.scope(function(){
    var o = pvc.Abstract.prototype;
    var syncLogHook = function(){ this._syncLog(); };
    
    ['log', 'info', 'trace', 'error', 'warn', 'group', 'groupEnd'].forEach(function(p){
        o['_' + p] = syncLogHook;
    });
});

