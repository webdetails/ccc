/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Colors utility

pvc.color = {
    scale:  pvc_colorScale,
    scales: pvc_colorScales,
    toGray: pvc.toGrayScale,
    isGray: pvc_colorIsGray
};

// --------------------------
// exported

function pvc_colorIsGray(color) {
    color = pv.color(color);
    var r = color.r,
        g = color.g,
        b = color.b,
        avg = (r + g + b) / 3,
        tol = 2;
    return Math.abs(r - avg) <= tol &&
           Math.abs(g - avg) <= tol &&
           Math.abs(b - avg) <= tol;
}

/**
 * Creates color scales of a specified type for datums grouped by a category.
 * 
 * @name pvc.color.scales
 * @function
 * @param {object} keyArgs Keyword arguments.
 * See {@link pvc.color.scale} for available arguments.
 * 
 * @param {def.Query} keyArgs.data
 * A {@link cdo.Data} that is the result of grouping datums along what are here called "category" dimensions.
 * <p>
 * One (possibly equal) color scale is returned per leaf data, indexed by the leaf's absolute key (see {@link cdo.Data#absKey}).
 * </p>
 * @param {boolean} [keyArgs.normPerBaseCategory=false] Indicates that a different color scale should be computed per distinct data category.
 * 
 * @type function 
 */
function pvc_colorScales(keyArgs) {
    /*jshint expr:true */
    keyArgs || def.fail.argumentRequired('keyArgs');
    
    var type = keyArgs.type || def.fail.argumentRequired('keyArgs.type');
    
    switch (type) {
        case 'linear':   return new pvc.color.LinearScalesBuild(keyArgs).buildMap();
        case 'discrete': return new pvc.color.DiscreteScalesBuild(keyArgs).buildMap();
        case 'normal':   return new pvc.color.NormalScalesBuild(keyArgs).buildMap(); // TODO
    }
    
    throw def.error.argumentInvalid('scaleType', "Unexistent scale type '{0}'.", [type]);
}

/**
 * Creates a color scale of a specified type.
 * 
 * @name pvc.color.scale
 * @function
 * @param {object} keyArgs Keyword arguments.
 * See {@link pvc.color.scales} for available arguments.
 * 
 * @param {def.Query} keyArgs.data A {@link cdo.Data} instance that
 * may be used to obtain the domain of the color scale.
 * 
 * @param {string} keyArgs.type The type of color scale.
 * <p>
 * Valid values are 'linear', 'discrete' and 'normal' (normal probability distribution).
 * </p>
 * @param {string|pv.color} [keyArgs.colorMin] The minimum color.
 * @param {string|pv.color} [keyArgs.colorMax] The maximum color.
 * @param {string|pv.color} [keyArgs.colorMissing] The color shown for null values.
 * @param {(string|pv.color)[]} [keyArgs.colors] Array of colors.
 * <p>
 * This argument is ignored if both minimum and maximum colors are specified.
 * Otherwise, if only one of minimum or maximum is specified, it is prepended or appended to
 * the color range array, respectively.
 * </p>
 * <p>
 * When unspecified, the color range is assumed to be 'red', 'yellow' and 'green'. 
 * </p>
 * @param {string} keyArgs.colorDimension The name of the data dimension that is the <b>domain</b> of the color scale.
 * @param {object[]} [keyArgs.colorDomain] An array of domain values to match colors in the color range.
 * 
 * @type function 
 */
function pvc_colorScale(keyArgs) {
    /*jshint expr:true */
    keyArgs || def.fail.argumentRequired('keyArgs');
    
    var type = keyArgs.type || def.fail.argumentRequired('keyArgs.type');
    
    switch (type) {
        case 'linear':   return new pvc.color.LinearScalesBuild(keyArgs).build();
        case 'discrete': return new pvc.color.DiscreteScalesBuild(keyArgs).build();
        case 'normal':   return new pvc.color.NormalScalesBuild(keyArgs).build();
    }
    
    throw def.error.argumentInvalid('scaleType', "Unexistent scale type '{0}'.", [type]);
}

// --------------------------
// private

/**
 * @class Represents one creation/build of a set of scale functions.
 * @abstract
 */
def
.type('pvc.color.ScalesBuild')
.init(function(keyArgs) {
    this.keyArgs        = keyArgs;
    this.data           = keyArgs.data || def.fail.argumentRequired('keyArgs.data');
    this.domainDimName  = keyArgs.colorDimension || def.fail.argumentRequired('keyArgs.colorDimension');
    this.domainDim      = this.data.dimensions(this.domainDimName);
   
    var dimType = this.domainDim.type;
    if(!dimType.isComparable) {
        this.domainComparer = null;
        pvc.log("Color value dimension should be comparable. Generated color scale may be invalid.");
    } else {
        this.domainComparer = function(a, b) { return dimType.compare(a, b); };
    }
   
    this.nullRangeValue = keyArgs.colorMissing ? pv.color(keyArgs.colorMissing) : pv.Color.transparent;
   
    this.domainRangeCountDif = 0;
})
.add(/** @lends pvc.color.ScalesBuild# */{
   /**
    * Builds one scale function.
    * 
    * @type pv.Scale
    */
    build: function() {
        this.range = this._getRange();
        this.desiredDomainCount = this.range.length + this.domainRangeCountDif;
       
        var domain = this._getDomain();
        return this._createScale(domain);
    },
   
    /**
     * Builds a map from category keys to scale functions.
     * 
     * @type object
     */
    buildMap: function() {
        this.range = this._getRange();
        this.desiredDomainCount = this.range.length + this.domainRangeCountDif;
        
        var createCategoryScale;
        
        /* Compute a scale-function per data category? */
        if(this.keyArgs.normPerBaseCategory) {
            /* Ignore args' domain and calculate from data of each category */
            createCategoryScale = function(leafData) {
                // Create a domain from leafData
                var domain = this._ensureDomain(null, false, leafData);
                //noinspection JSPotentiallyInvalidUsageOfThis
                return this._createScale(domain);
            };
        } else {
            var domain = this._getDomain(),
                scale  = this._createScale(domain);
           
            createCategoryScale = def.fun.constant(scale);
        }
       
        return this._createCategoryScalesMap(createCategoryScale); 
    },
   
    _createScale: def.method({isAbstract: true}),
   
    _createCategoryScalesMap: function(createCategoryScale) {
        return this.data.children()
            .object({
                name:    function(leafData) { return leafData.absKey; },
                value:   createCategoryScale,
                context: this
            });
    },
   
    _getRange: function() {
        var keyArgs = this.keyArgs,
            range = keyArgs.colors || ['red', 'yellow', 'green'];
   
        if(keyArgs.colorMin != null && keyArgs.colorMax != null)
            range = [keyArgs.colorMin, keyArgs.colorMax];
        else if(keyArgs.colorMin != null)
            range.unshift(keyArgs.colorMin);
        else if(keyArgs.colorMax != null)
            range.push(keyArgs.colorMax);
   
        return range.map(function(c) { return pv.color(c); });
    },
   
    _getDataExtent: function(data) {
       
        var extent = data.dimensions(this.domainDimName).extent({visible: true});
        if(!extent) return null; // No atoms...
       
        var min = extent.min.value,
            max = extent.max.value;
        
        if(max == min) {
            if(max >= 1)
                min = max - 1;
            else
                max = min + 1;
        }
       
        return {min: min, max: max};
    },
   
    _getDomain: function() {
        var domain = this.keyArgs.colorDomain;
        if(domain != null) {
            domain = domain.slice();

            if(this.domainComparer) domain.sort(this.domainComparer);

            // More domain points than needed for supplied range
            if(domain.length > this.desiredDomainCount) domain = domain.slice(0, this.desiredDomainCount);
        } else {
            // This ends up being padded...in ensureDomain
            domain = [];
        }
       
        return this._ensureDomain(domain, true, this.data);
    },
   
    _ensureDomain: function(domain, doDomainPadding, data) {
        var extent;
       
        if(domain && doDomainPadding) {
            /* 
             * If domain does not have as many values as there are colors (taking domainRangeCountDif into account),
             * it is *completed* with the extent calculated from data.
             * (NOTE: getArgsDomain already truncates the domain to number of colors)
             */
            var domainPointsMissing = this.desiredDomainCount - domain.length;
            if(domainPointsMissing > 0) {
                extent = this._getDataExtent(data);
                if(extent) {
                    // Assume domain is sorted
                    switch(domainPointsMissing) {  // + 1 in discrete ?????
                        case 1:
                            if(this.domainComparer)
                                def.array.insert(domain, extent.max, this.domainComparer);
                            else
                                domain.push(extent.max);
                            break;

                        case 2:
                            if(this.domainComparer) {
                                def.array.insert(domain, extent.min, this.domainComparer);
                                def.array.insert(domain, extent.max, this.domainComparer);
                            } else {
                                domain.unshift(extent.min);
                                domain.push(extent.max);
                            }
                            break;

                        default:
                            /* Ignore args domain altogether */
                            if(pvc.debug >= 2)
                                pvc.log("Ignoring option 'colorDomain' due to unsupported length." +
                                    def.format(" Should have '{0}', but instead has '{1}'.",
                                        [this.desiredDomainCount, domain.length]));
                            domain = null;
                    }
                }
           }
       }
       
       if(!domain) {
           /*jshint expr:true */
           extent || (extent = this._getDataExtent(data));
           if(extent) {
               var min = extent.min,
                   max = extent.max,
                   step = (max - min) / (this.desiredDomainCount - 1);
               domain = pv.range(min, max + step, step);
           }
       }
       return domain;
    }
 });
        
    
def
.type('pvc.color.LinearScalesBuild', pvc.color.ScalesBuild)
.add(/** @lends pvc.color.LinearScalesBuild# */{
    
    _createScale: function(domain) {
        var scale = pv.Scale.linear();
        if(domain) scale.domain.apply(scale, domain);
        scale.range.apply(scale, this.range);
        return scale;
    }
});

def
.type('pvc.color.DiscreteScalesBuild', pvc.color.ScalesBuild)
.init(function(keyArgs) {
    this.base(keyArgs);

    this.domainRangeCountDif = 1;
})
.add(/** @lends pvc.color.DiscreteScalesBuild# */{
    
    /*
     * Dmin   DMax    C
     * --------------------
     * -      <=d0    c0
     * >d0    <=d1    c1
     * >d1    <=d2    c2
     * ..
     * >dN-3  <=dN-2  cN-2
     * 
     * >dN-2  -       cN-1
     */
    //d0--cR0--d1--cR1--d2
    _createScale: function(domain) {
        var Dl = domain.length - 1,
            range = this.range,
            nullRangeValue = this.nullRangeValue,
            Rl = range.length - 1;
        
        function scale(val) {
            if(val == null) return nullRangeValue;

            // i <= D - 2  => domain[D-1]
            for(var i = 0 ; i < Dl ; i++) if(val <= domain[i + 1]) return range[i];
            
            // > domain[Dl]
            return range[Rl];
        }
        
        // TODO: Not a real scale; 
        // some methods won't work on the result of by, by1 and transform.
        // Give it a bit of protovis looks
        def.copy(scale, pv.Scale.common);
        
        scale.domain = function() { return domain; };
        scale.range  = function() { return range;  };
        
        return scale;
    }
});

/* TODO */ 
  
/***********
 * compute an array of fill-functions. Each column out of "colAbsValues" 
 * gets it's own scale function assigned to compute the color
 * for a value. Currently supported scales are:
 *    -  linear (from min to max
 *    -  normal distributed from   -numSD*sd to  numSD*sd 
 *         (where sd is the standard deviation)
 ********/
/*
     getNormalColorScale: function(data, colAbsValues, origData) {
    var fillColorScaleByColKey;
    var options = this.chart.options;
    if(options.normPerBaseCategory) {
      // compute the mean and standard-deviation for each column
      var myself = this;
      
      var mean = pv.dict(colAbsValues, function(f) {
        return pv.mean(data, function(d) {
          return myself.getValue(d[f]);
        })
      });
      
      var sd = pv.dict(colAbsValues, function(f) {
        return pv.deviation(data, function(d) {
          myself.getValue(d[f]);
        })
      });
      
      //  compute a scale-function for each column (each key)
      fillColorScaleByColKey = pv.dict(colAbsValues, function(f) {
        return pv.Scale.linear()
          .domain(-options.numSD * sd[f] + mean[f],
                  options.numSD * sd[f] + mean[f])
          .range(options.colorMin, options.colorMax);
      });
      
    } else {   // normalize over the whole array
      
      var mean = 0.0, sd = 0.0, count = 0;
      for(var i=0; i<origData.length; i++)
        for(var j=0; j<origData[i].length; j++)
          if(origData[i][j] != null) {
            mean += origData[i][j];
            count++;
          }
      mean /= count;
      for(var i=0; i<origData.length; i++) {
        for(var j=0; j<origData[i].length; j++) {
          if(origData[i][j] != null) {
            var variance = origData[i][j] - mean;
            sd += variance*variance;
          }
        }
      }
      
      sd /= count;
      sd = Math.sqrt(sd);
      
      var scale = pv.Scale.linear()
        .domain(-options.numSD * sd + mean,
                options.numSD * sd + mean)
        .range(options.colorMin, options.colorMax);
      
      fillColorScaleByColKey = pv.dict(colAbsValues, function(f) {
        return scale;
      });
    }

    return fillColorScaleByColKey;  // run an array of values to compute the colors per column
}      
     */

/* 
 *          r0   ]   r1 ]    r2   ]           rD-2  ] (rD-1)
 * ... --+-------+------+---------+-- ... -+--------+------->
 *       d0      d1     d2        d3       dD-2    dD-1   (linear)
 * 
 * 
 * Mode 1 - Domain divider points
 * 
 * User specifies:
 * # D domain divider points
 * # R = D+1 range points
 * 
 * ////////////////////////////
 * D=0, R=1
 *
 *   r0
 *   ...
 *
 *
 * ////////////////////////////
 * D=1, R=2
 *
 *   r0  ]  r1
 * ... --+-- ...
 *       d0
 *
 *
 * ////////////////////////////
 * D=2, R=3
 *
 *   r0  ]  r1  ]  r2
 * ... --+------+-- ...
 *       d0     d1
 *
 *
 * ////////////////////////////
 * D=3, R=4
 * 
 *   r0  ]  r1  ]  r2  ]  r3
 * ... --+------+------+-- ...
 *       d0     d1     d2
 * 
 * ...
 * 
 * Mode 2 - Domain dividers determination from data extent
 * 
 * //////////////////////////// (inf. = sup.)
 * Special case
 * Only one color is used (the first one, for example)
 * 
 *   r0
 *   
 * //////////////////////////// (inf. < sup.)
 * C=1  => constant color
 * 
 *       r0
 *   +--------+
 *   I        S
 * 
 * ////////////////////////////
 * C=2  =>  N=1 (1 divider point)
 * 
 * B = (S-I)/2
 * 
 *       C0   ]   C1
 *   +--------+--------+
 *   I        d0        S
 *       B         B
 * 
 * ////////////////////////////
 * C=3  =>  N=2 (2 divider points)
 * 
 * B = (S-I)/3
 * 
 *      C0    ]   C1   ]   C2
 *   +--------+--------+--------+
 *   I        d0       d1       S
 *       B        B        B
 *
 * ...
 * 
 */