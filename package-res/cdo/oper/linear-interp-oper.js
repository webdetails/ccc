/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def
.type('cdo.LinearInterpolationOper')
.init(function(baseData, partData, visibleData, catRole, serRole, valRole, stretchEnds) {
    this._newDatums = [];

    this._data = visibleData;

    // TODO: It is usually the case, but not certain, that the base axis'
    // dataCell(s) span "all" data parts.
    // Shouldn't this just use the baseAxis's dataPartValues?
    // Need categories of hidden and/or null datums as well.
    var qAllCatDatas = catRole.flatten(baseData).children(),
        serDatas1 = serRole.isBound()
            ? serRole.flatten(partData, {visible: true, isNull: false}).children().array()
            : [null], // null series
        valDim = this._valDim = baseData.owner.dimensions(valRole.lastDimensionName()),
        visibleKeyArgs = {visible: true, zeroIfNone: false};

    this._isCatDiscrete = catRole.grouping.isDiscrete();
    this._stretchEnds   = stretchEnds;
    this._catInfos = qAllCatDatas.select(function(allCatData, catIndex) {
        var catData = visibleData.child(allCatData.key);
            catInfo = {
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
    this._serStates = def.range(0, this._serCount)
        .select(function(serIndex) { return new cdo.LinearInterpolationOperSeriesState(this, serIndex); }, this)
        .array();
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

    _visitSeries: function(catSerInfo, serIndex) {
        this._serStates[serIndex].visit(catSerInfo);
    },

    nextUnprocessedNonNullCategOfSeries: function(serIndex) {
        var catIndex = 0, catCount = this._catInfos.length;

        while(catIndex < catCount) {
            var catInfo = this._catInfos[catIndex++],
                catSerInfo = catInfo.serInfos[serIndex];
            if(!catSerInfo.isNull) return catSerInfo;
        }
    }
});