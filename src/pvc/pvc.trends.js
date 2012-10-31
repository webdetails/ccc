def.space('pvc.trends', function(trends){
    var _trends = {};
    
    def.set(trends, 
        'define', function(type, trendSpec){
            /*jshint expr:true*/
            
            type      || def.fail.argumentRequired('type');
            trendSpec || def.fail.argumentRequired('trendSpec');
            def.object.is(trendSpec) || def.fail.argumentInvalid('trendSpec', "Must be a trend specification object.");
            
            if(pvc.debug >= 2 && def.hasOwn(_trends, type)){
                pvc.log(def.format("[WARNING] A trend type with the name '{0}' is already defined.", [type]));
            }
            
            var label = trendSpec.label || def.fail.argumentRequired('trendSpec.label');
            var model = trendSpec.model || def.fail.argumentRequired('trendSpec.model');
            def.fun.is(model) || def.fail.argumentInvalid('trendSpec.mode', "Must be a function.");
            
            var trendInfo = {
               dataPartAtom: {v: 'trend', f: label},
               type:  type,
               label: label,
               model: model
            };
            
            _trends[type] = trendInfo;
        },
        
        'get', function(type){
            /*jshint expr:true*/
            type || def.fail.argumentRequired('type');
            return def.getOwn(_trends, type) ||
                def.fail.operationInvalid("Undefined trend type '{0}'.", [type]);
        },
        
        'has', function(type){
            return def.hasOwn(_trends, type);
        });
    
    
    trends.define('linear', {
        label: 'Linear trend',
        model: function(rowsQuery, funX, funY){
            var i = 0;
            var N = 0;
            var sumX  = 0;
            var sumY  = 0;
            var sumXY = 0;
            var sumXX = 0;
            var parseNum = function(value){
                return value != null ? (+value) : NaN;  // to Number works for dates as well
            };
            
            while(rowsQuery.next()){
                var row = rowsQuery.item;
                
                // Ignore null && NaN values
                
                var x = funX ? parseNum(funX(row)) : i; // use the index itself for discrete stuff
                if(!isNaN(x)){
                    var y = parseNum(funY(row));
                    if(!isNaN(y)){
                        N++;
                        
                        sumX  += x;
                        sumY  += y;
                        sumXY += x * y;
                        sumXX += x * x;
                    }
                }
                
                i++; // Discrete nulls must still increment the index
            }
            
            // y = alpha + beta * x
            var alpha, beta;
            if(N >= 2){
                var avgX  = sumX  / N;
                var avgY  = sumY  / N;
                var avgXY = sumXY / N;
                var avgXX = sumXX / N;
            
                // When N === 1 => den = 0
                var den = (avgXX - avgX * avgX);
                if(den === 0){
                    beta = 0;
                } else {
                    beta = (avgXY - (avgX * avgY)) / den;
                }
                
                alpha = avgY - beta * avgX;
                
                return {
                    alpha: alpha,
                    beta:  beta,
                    
                    reset: def.noop,
                    
                    // y = alpha + beta * x
                    sample: function(x){
                        return alpha + beta * (+x);
                    }
                };
            }
        }
    });
    
    
});