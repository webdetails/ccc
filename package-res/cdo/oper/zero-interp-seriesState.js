/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

def
.type('cdo.ZeroInterpolationOperSeriesState')
.init(function(interpolation, serIndex) {
    this.interpolation = interpolation;
    this.index = serIndex;
    
    this._lastNonNull(null);
})
.add({
    visit: function(catSeriesInfo) {
        if(catSeriesInfo.isNull)
            this._interpolate(catSeriesInfo);
        else
            this._lastNonNull(catSeriesInfo);
    },
    
    _lastNonNull: function(catSerInfo) {
        if(arguments.length) {
            this.__lastNonNull = catSerInfo; // Last non-null
            this.__nextNonNull = undefined;
        }
        
        return this.__lastNonNull;
    },

    _nextNonNull: function() {
        return this.__nextNonNull;
    },
    
    _initInterpData: function() {
        // The start of a new segment?
        if(this.__nextNonNull !== undefined) return;
        
        var last = this.__lastNonNull,
            next = this.__nextNonNull = this.interpolation.nextUnprocessedNonNullCategOfSeries(this.index) || null;

        if(next && last) {
            if(this.interpolation._isCatDiscrete) {
                var stepCount = next.catInfo.index - last.catInfo.index;
                /*jshint expr:true */
                (stepCount >= 2) || def.assert("Must have at least one interpolation point.");
                
                this._middleIndex = ~~(stepCount / 2); // Math.floor <=> ~~
                
                var dotCount = (stepCount - 1);
                this._isOdd  = (dotCount % 2) > 0;
            } else {
                var fromCat  = +last.catInfo.value,
                    toCat    = +next.catInfo.value;
                this._middleCat = (toCat + fromCat) / 2;
            }
        }
    },
    
    _interpolate: function(catSerInfo) {
        this._initInterpData();
        
        var next = this.__nextNonNull,
            last = this.__lastNonNull,
            one  = next || last;
        if(!one) return;
        
        var group,
            interpolation = this.interpolation,
            catInfo = catSerInfo.catInfo;
        
        if(next && last) {
            if(interpolation._isCatDiscrete) {
                var groupIndex = (catInfo.index - last.catInfo.index);
                if(this._isOdd)
                    group = groupIndex <  this._middleIndex ? last.group : next.group;
                else
                    group = groupIndex <= this._middleIndex ? last.group : next.group;
            } else {
                var cat = +catInfo.value;
                group = cat < this._middleCat ? last.group : next.group;
            }
        } else {
            // Only "stretch" ends on stacked visualization
            if(!interpolation._stretchEnds) return;
            
            group = one.group;
        }
        
        // -----------

        // Multi, dataPart, series atoms, but not of other measures or not-grouped dimensions.
        var atoms = Object.create(group.atoms);
        
        // Category atoms
        def.copyOwn(atoms, catInfo.data.atoms);
        
        // Value atom
        var valDim = interpolation._valDim,
            zeroAtom = interpolation._zeroAtom ||
            (interpolation._zeroAtom = valDim.intern(0, /* isVirtual */ true));
        
        atoms[valDim.name] = zeroAtom;
        
        // Create datum with collected atoms
        interpolation._newDatums.push(new cdo.InterpolationDatum(group.owner, atoms, 'zero', valDim.name));
    }
});