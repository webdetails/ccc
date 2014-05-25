/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def
.type('pvc.data.LinearInterpolationOper')
.init(function(baseData, partData, visibleData, catRole, serRole, valRole, stretchEnds) {
    this._newDatums = [];

    this._data = visibleData;

    // TODO: It is usually the case, but not certain, that the base axis'
    // dataCell(s) span "all" data parts.
    // Shouldn't this just use the baseAxis's dataPartValues?
    // Need categories of hidden and/or null datums as well.
    var qAllCatDatas = catRole.flatten(baseData).children();

    var serDatas1 = serRole.isBound()
        ? serRole.flatten(partData, {visible: true, isNull: false}).children().array()
        : [null]; // null series

    this._isCatDiscrete = catRole.grouping.isDiscrete();
    //this._firstCatDim   = !this._isCatDiscrete ? baseData.owner.dimensions(catRole.firstDimensionName()) : null;
    this._stretchEnds   = stretchEnds;
    var valDim = this._valDim = baseData.owner.dimensions(valRole.firstDimensionName());

    var visibleKeyArgs = {visible: true, zeroIfNone: false};

    this._catInfos = qAllCatDatas.select(function(allCatData, catIndex) {
        var catData = visibleData.child(allCatData.key);
        var catInfo = {
            data:           catData || allCatData, // may be null?
            value:          allCatData.value,
            isInterpolated: false,
            serInfos:       null,
            index:          catIndex
        };

        catInfo.serInfos = serDatas1.map(function(serData1) {
            var group = catData;
            if(group && serData1) group = group.child(serData1.key);

            var value = group
                ? group.dimensions(valDim.name).value(visibleKeyArgs)
                : null;

            return {
                data:    serData1,
                group:   group,
                value:   value,
                isNull:  value == null,
                catInfo: catInfo
            };
        });

        return catInfo;
    })
    .array();

    this._serCount  = serDatas1.length;
    this._serStates =
        def
        .range(0, this._serCount)
        .select(function(serIndex) {
            return new pvc.data.LinearInterpolationOperSeriesState(this, serIndex);
        }, this)
        .array();

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
    interpolate: function() {
        var catInfo;
        while((catInfo = this._catInfos.shift()))
            catInfo.serInfos.forEach(this._visitSeries, this);

        // Add datums created during interpolation
        var newDatums = this._newDatums;
        if(newDatums.length) this._data.owner.add(newDatums);
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