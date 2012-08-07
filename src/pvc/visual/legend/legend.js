def.space('pvc.visual.legend', function(legend){
    
    legend.buildKey = function(legendType, dataCell){
        // If dataPartValues is an array, it is converted to a comma-separated string
        return legendType + '|' + 
               dataCell.role.name + '|' + 
               (dataCell.dataPartValues != null ? dataCell.dataPartValues : ''); 
    };
});