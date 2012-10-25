def
.type('pvc.data.LinearInterpolationOper')
.init(function(allPartsData, data, catRole, serRole, valRole, stretchEnds){
    this._newDatums = [];
    
    this._data = data;
    
    var allCatDataRoot = allPartsData.flattenBy(catRole, {ignoreNulls: false});
    var allCatDatas    = allCatDataRoot._children;
    
    var serDatas1 = this._serDatas1 = serRole.isBound() ?
                        data.flattenBy(serRole).children().array() :
                        [null]; // null series
    
    this._isCatDiscrete = catRole.grouping.isDiscrete();
    this._firstCatDim   = !this._isCatDiscrete ? data.owner.dimensions(catRole.firstDimensionName()) : null;
    this._stretchEnds    = stretchEnds;
    var valDim = this._valDim  = data.owner.dimensions(valRole.firstDimensionName());
    
    var visibleKeyArgs = {visible: true, zeroIfNone: false};
    
    this._catInfos = allCatDatas.map(function(allCatData, catIndex){
        
        var catData = data._childrenByKey[allCatData.key];
        
        var catInfo = {
            data:           catData || allCatData, // may be null?
            value:          allCatData.value,
            isInterpolated: false,
            serInfos:       null,
            index:          catIndex
        };
        
        catInfo.serInfos = 
            serDatas1
            .map(function(serData1){
                var group = catData;
                if(group && serData1){
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
            return new pvc.data.LinearInterpolationOperSeriesState(this, serIndex); 
        }, this)
        .array()
        ;
    
    // Determine the sort order of the continuous base categories
    // Categories assumed sorted.
//    if(!this._isCatDiscrete && catDatas.length >= 2){
//        if((+catDatas[1].value) >= (+catDatas[0].value)){
//            this._comparer = def.compare;
//        } else {
//            this._comparer = def.compareReverse;
//        }
//    }
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
        // NOTE: while interpolating, 
        // only catInfos remaining to be processed
        // remain in the _catInfos array (see {@link #interpolate}).
        // As such, this finds the "next" (unprocessed) 
        // non-null cat. info.
        var catIndex = 0,
            catCount = this._catInfos.length;
        
        while(catIndex < catCount){
            var catInfo = this._catInfos[catIndex++];
            //if(!catInfo.isInterpolated){
            var catSerInfo = catInfo.serInfos[serIndex];
            if(!catSerInfo.isNull){
                return catSerInfo;
            }
            //}
        }
    }

    // NOTE: This was only needed when selection needed to
    // divide in half between the last and next.
//    _setCategory: function(catValue){
//        /*jshint expr:true  */
//        !this._isCatDiscrete || def.assert("Only for continuous base.");
//        
//        // Insert sort into this._catInfos
//        
//        // catValue may be a new dimension value
//        var catAtom = this._firstCatDim.intern(catValue, /* isVirtual */ true);
//        
//        catValue = catAtom.value; // now may be a Date object...
//        
//        // Check if and where to insert
//        var index = 
//            def
//            .array
//            .binarySearch(
//                this._catInfos, 
//                +catValue,
//                this._comparer,
//                function(catInfo){  return +catInfo.value; });
//        
//        if(index < 0){
//            // New category
//            // Insert at the two's complement of index
//            var catInfo = {
//                atom:  catAtom,
//                value: catValue,
//                label: this._firstCatDim.format(catValue),
//                isInterpolated: true
//            };
//            
//            catInfo.serInfos = 
//                def
//                .range(0, this._serCount)
//                .select(function(serScene, serIndex){
//                    return {
//                        value:   null,
//                        isNull:  true,
//                        catInfo: catInfo
//                    };
//                })
//                .array();
//            
//            this._catInfos.splice(~index, 0, catInfo);
//        }
//        
//        return index;
//    }
});