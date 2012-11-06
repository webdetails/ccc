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
        },
        
        'types', function(){
            return def.ownKeys(_trends);
        });
    
    
    trends.define('linear', {
        label: 'Linear trend',
        model: function(options){
            var rows = def.get(options, 'rows'); 
            var funX = def.get(options, 'x');
            var funY = def.get(options, 'y');
            
            var i = 0;
            var N = 0;
            var sumX  = 0;
            var sumY  = 0;
            var sumXY = 0;
            var sumXX = 0;
            var parseNum = function(value){
                return value != null ? (+value) : NaN;  // to Number works for dates as well
            };
            
            while(rows.next()){
                var row = rows.item;
                
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
                    sample: function(x/*, y, i*/){
                        return alpha + beta * (+x);
                    }
                };
            }
        }
    });
    
    // Source: http://en.wikipedia.org/wiki/Moving_average
    trends.define('moving-average', {
        label: 'Moving average',
        model: function(options){
            var W = Math.max(+(def.get(options, 'periods') || 3), 2);
              
            var sum = 0; // Current sum of values in avgValues
            var avgValues = []; // Values in the average window
            
            return {
                reset: function(){
                    sum = 0;
                    avgValues.length = 0;
                },
                
                sample: function(x, y, i){
                    // Only y is relevant for this trend type
                    var L = W;
                    if(y != null){
                        avgValues.unshift(y);
                        sum += y;
                        
                        L = avgValues.length;
                        if(L > W){
                            sum -= avgValues.pop();
                            L = W;
                        }
                    }
                    
                    return sum / L;
                }
            };
        }
    });
    
    // Source: http://en.wikipedia.org/wiki/Moving_average
    trends.define('weighted-moving-average', {
        label: 'Weighted Moving average',
        model: function(options){
            var W = Math.max(+(def.get(options, 'periods') || 3), 2);
            
            // Current sum of values in the window
            var sum = 0; // Current sum of values in avgValues
            
            // Current numerator
            var numer = 0;
            
            var avgValues = []; // Values in the average window
            var L = 0;
            
            // Constant Denominator (from L = W onward it is constant)
            // W +  (W - 1) + ... + 2 + 1
            // = W * (W + 1) / 2;
            var denom = 0;
            
            return {
                reset: function(){
                    sum = numer = denom = L = 0;
                    avgValues.length = 0;
                },
                
                sample: function(x, y/*, i*/){
                    // Only y is relevant for this trend type
                    if(y != null){
                        
                        if(L < W){
                            // Still filling the avgValues array
                            
                            avgValues.push(y);
                            L++;
                            denom += L;
                            numer += L * y;
                            sum   += y;
                        } else {
                            // denom is now equal to: W * (W + 1) / 2; 
                            numer += (L * y) - sum;
                            sum   += y - avgValues[0]; // newest - oldest
                            
                            // Shift avgValues left
                            for(var j = 1 ; j < W ; j++){
                                avgValues[j - 1] = avgValues[j];
                            }
                            avgValues[W - 1] = y;
                        }
                    }
                    
                    return numer / denom;
                }
            };
        }
    });
});