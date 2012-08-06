def.space('pvc.visual.legend', function(legend){
    
    legend.buildKey = function(legendType, visualRole, dataPartValues){
        // If dataPartValues is an array, it is converted to a comma-separated string
        return legendType + '|' + 
               visualRole + '|' + 
               (dataPartValues ? dataPartValues : ''); 
    };
});