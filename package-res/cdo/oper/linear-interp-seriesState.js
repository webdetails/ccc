/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def
.type('cdo.LinearInterpolationOperSeriesState')
.init(function(interpolation, serIndex) {
    this.interpolation = interpolation;
    this.index = serIndex;
    
    this._lastNonNull(null);
})
.add({
    visit: function(catSeriesInfo) {
        if(catSeriesInfo.isNull) this._interpolate(catSeriesInfo);
        else                     this._lastNonNull(catSeriesInfo);
    },
    
    _lastNonNull: function(catSerInfo) {
        if(arguments.length) {
            this.__lastNonNull = catSerInfo; // Last non-null
            this.__nextNonNull = undefined;
        }
        
        return this.__lastNonNull;
    },

    _nextNonNull: function() { return this.__nextNonNull; },
    
    _initInterpData: function() {
        // When a null category is found, 
        // and it is the first category, or it is right after a non-null category,
        // the prop. __nextNonNull will have the value undefined 
        // (because _nextNonNull is reset to undefined every time that __lastNonNull is set).
        //
        // Then, the __nextNonNull category is determined, 
        // by looking ahead of the current (null) category
        // (see {@link Interpolation#nextUnprocessedNonNullCategOfSeries}).
        // 
        // If both a last and a next exist,
        // the slope of the line connecting these is determined.
        // 
        // The next processed category, if null, will not
        // pass the test this.__nextNonNull !== undefined,
        // guaranteeing that this initialization is only performed
        // once for each series "segment" of null dots that is 
        // surrounded by non-null dots.
        
        // The start of a new segment?
        if(this.__nextNonNull !== undefined) return;
        
        // Will be null if the series starts 
        //  with null categories:
        // S: 0 - 0 - x
        var last = this.__lastNonNull,

            // Make sure not to store undefined to distinguish from uninitialized.
            // When "last" is null, a non-null "next" is used in
            //  {@link #_interpolate } to "extend" the beginning of the series.
            next = this.__nextNonNull = this.interpolation.nextUnprocessedNonNullCategOfSeries(this.index) || null;
                                
        if(next && last) {
            var fromValue  = last.value,
                toValue    = next.value,
                deltaValue = toValue - fromValue;
            
            if(this.interpolation._isCatDiscrete) {
                var stepCount = next.catInfo.index - last.catInfo.index;
                /*jshint expr:true */
                (stepCount >= 2) || def.assert("Must have at least one interpolation point.");
                
                this._stepValue   = deltaValue / stepCount;
                this._middleIndex = ~~(stepCount / 2); // Math.floor <=> ~~
                
                var dotCount = (stepCount - 1);
                this._isOdd  = (dotCount % 2) > 0;
            } else {
                var fromCat  = +last.catInfo.value,
                    toCat    = +next.catInfo.value,
                    deltaCat = toCat - fromCat;
                
                this._steep = deltaValue / deltaCat; // should not be infinite, cause categories are different
                
                this._middleCat = (toCat + fromCat) / 2;
            }
        }
    },
    
    _interpolate: function(catSerInfo) {
        
        this._initInterpData();
        
        var next = this.__nextNonNull,
            prev = this.__lastNonNull,
            one  = next || prev;
        if(!one) return;
        
        var value, group,
            interpolation = this.interpolation,
            catInfo = catSerInfo.catInfo;
        
        if(next && prev) {
            if(interpolation._isCatDiscrete) {
                var groupIndex = (catInfo.index - prev.catInfo.index);
                value = prev.value + this._stepValue * groupIndex;
                
                group = (this._isOdd ? (groupIndex <  this._middleIndex) : (groupIndex <= this._middleIndex))
                    ? prev.group
                    : next.group;
            } else {
                var cat     = +catInfo.value,
                    lastCat = +prev.catInfo.value;
                
                value = prev.value + this._steep * (cat - lastCat);
                group = cat < this._middleCat ? prev.group : next.group;
            }
        } else {
            // Only "stretch" ends on stacked visualization
            if(!interpolation._stretchEnds) return;
            
            value = one.value;
            group = one.group;
        }
        
        // -----------
        
        // Multi, dataPart, series atoms, but not of other measures or not-grouped dimensions.
        var atoms = Object.create(group.atoms);

        // Category atoms
        def.copyOwn(atoms, catInfo.data.atoms);

        // Value atom
        var valDim = interpolation._valDim,
            valueAtom = valDim.intern(value, /* isVirtual */ true);
        atoms[valDim.name] = valueAtom;
        
        // Create datum with collected atoms
        interpolation._newDatums.push(new cdo.InterpolationDatum(group.owner, atoms, 'linear', valDim.name));
    }
});