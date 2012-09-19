def
.type('pvc.data.ZeroInterpolationOper')
.init(function(data, catRole, serRole, valRole, stretchEnds){
    this._newDatums = [];
    
    this._data = data;
    
    var catDatas  = this._catDatas  = data._children;
    var serDatas1 = this._serDatas1 = serRole.isBound() ?
                        data.flattenBy(serRole).children().array() :
                        [null]; // null series
    
    this._isCatDiscrete = catRole.grouping.isDiscrete();
    this._firstCatDim   = !this._isCatDiscrete ? data.owner.dimensions(catRole.firstDimensionName()) : null;
    this._stretchEnds   = stretchEnds;
    var valDim = this._valDim  = data.owner.dimensions(valRole.firstDimensionName());
    
    var visibleKeyArgs = {visible: true, zeroIfNone: false};
    
    this._catInfos = catDatas.map(function(catData, catIndex){
        
        var catInfo = {
            data:           catData,
            value:          catData.value, // TODO
            isInterpolated: false,
            serInfos:       null,
            index:          catIndex
        };
        
        catInfo.serInfos = 
            serDatas1
            .map(function(serData1){
                var group = catData;
                if(serData1){
                    group = group._childrenByKey[serData1.key];
                }
                
                var value = group ?
                            group.dimensions(valDim.name)
                                 .sum(visibleKeyArgs) : 
                            null;
                
                return {
                    data:    serData1,
                    group:   group,
                    value:   value,
                    isNull:  value == null,
                    catInfo: catInfo
                };
            }, this);
        
        return catInfo;
    });
    
    this._serCount  = serDatas1.length;
    this._serStates = 
        def
        .range(0, this._serCount)
        .select(function(serIndex){ 
            return new pvc.data.ZeroInterpolationOperSeriesState(this, serIndex); 
        }, this)
        .array()
        ;
})
.add({
    interpolate: function(){
        var catInfo;
        while((catInfo = this._catInfos.shift())){
            catInfo.serInfos.forEach(this._visitSeries, this);
        }
        
        // Add datums created during interpolation
        var newDatums = this._newDatums;
        if(newDatums.length){
            this._data.owner.add(newDatums);
        }
    },
    
    _visitSeries: function(catSerInfo, serIndex){
        this._serStates[serIndex].visit(catSerInfo);
    },
    
    nextUnprocessedNonNullCategOfSeries: function(serIndex){
        var catIndex = 0,
            catCount = this._catInfos.length;
        
        while(catIndex < catCount){
            var catInfo = this._catInfos[catIndex++];
            var catSerInfo = catInfo.serInfos[serIndex];
            if(!catSerInfo.isNull){
                return catSerInfo;
            }
        }
    }
});